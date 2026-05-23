import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as xlsx from 'xlsx';
import { ISalesRepository, SALES_REPOSITORY_TOKEN } from './interfaces/i-sales.repository';
import { IRecipeService, RECIPE_SERVICE_TOKEN } from './interfaces/i-recipe.service';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from './interfaces/i-storage.service';
import { Database } from '@ims/types';
import { Kysely } from 'kysely';

@Processor('sales-import')
export class SalesImportProcessor extends WorkerHost {
  private readonly logger = new Logger(SalesImportProcessor.name);

  constructor(
    @Inject(SALES_REPOSITORY_TOKEN) private readonly salesRepository: ISalesRepository,
    @Inject(RECIPE_SERVICE_TOKEN) private readonly recipeService: IRecipeService,
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
    @Inject(STORAGE_SERVICE_TOKEN) private readonly storageService: IStorageService,
    @Inject('DB_CLIENT') private readonly db: Kysely<Database>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { batchId, restaurantId, filePath } = job.data;
    
    this.logger.log(`Starting processing for batch ${batchId}`);
    
    try {
      await this.salesRepository.updateBatchStatus(batchId, 'PROCESSING');
      
      // 1. Download file from storage
      const localFilePath = await this.storageService.downloadFile(filePath);
      
      // 2. Parse Excel
      const workbook = xlsx.readFile(localFilePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      // Expected columns based on the file: Názov, Množstvo
      const rows: any[] = xlsx.utils.sheet_to_json(sheet);
      
      const parsedRows = rows
        .map(row => {
          const rawItemName = row['Názov'];
          const quantitySold = Number(row['Množstvo']);
          
          if (!rawItemName || typeof rawItemName !== 'string') return null;
          if (isNaN(quantitySold) || quantitySold <= 0) return null;
          
          return { rawItemName, quantitySold };
        })
        .filter((row): row is { rawItemName: string; quantitySold: number } => row !== null);

      if (parsedRows.length === 0) {
        throw new Error('No valid sales rows found in the uploaded file');
      }

      // 3. Look up menu item mappings
      const rawItemNames = parsedRows.map(r => r.rawItemName);
      const mappings = await this.salesRepository.getMenuItemMappings(restaurantId, rawItemNames);
      
      const mappingDict = new Map<string, string>();
      mappings.forEach(m => mappingDict.set(m.rawExcelString, m.recipeId));

      // 4. Map rows and prepare insertion
      const rowsToInsert = parsedRows.map(r => {
        const recipeId = mappingDict.get(r.rawItemName);
        return {
          batchId,
          rawItemName: r.rawItemName,
          quantitySold: r.quantitySold,
          isMapped: !!recipeId,
          recipeId: recipeId || null,
        };
      });

      // 5. Expand BOM and prepare ledger entries
      const depletionTasks: { itemId: string; consumedQty: number }[] = [];
      for (const row of rowsToInsert) {
        if (row.recipeId) {
          const bomExpansion = await this.recipeService.expandBOM(row.recipeId, row.quantitySold);
          for (const item of bomExpansion) {
            depletionTasks.push({
              itemId: item.itemId,
              consumedQty: item.consumedQty
            });
          }
        }
      }

      // 6. Execute Database Transaction (Bulk Insert Rows + Ledger)
      await this.db.transaction().execute(async (trx) => {
        // Insert parsed rows into sales_import_rows
        await this.salesRepository.insertImportRows(trx, rowsToInsert);
        
        // Record all ledger depletions
        for (const task of depletionTasks) {
          await this.ledgerService.record(trx, {
            restaurantId,
            itemId: task.itemId,
            changeAmount: -task.consumedQty,
            reasonCode: 'SALES_DEPLETION',
            referenceId: batchId
          });
        }
      });

      // 7. Update batch status to completed
      await this.salesRepository.updateBatchStatus(batchId, 'COMPLETED');
      this.logger.log(`Completed processing for batch ${batchId}`);
      
    } catch (error: any) {
      this.logger.error(`Failed to process batch ${batchId}`, error.stack);
      await this.salesRepository.updateBatchStatus(batchId, 'FAILED', error.message);
      throw error;
    }
  }
}
