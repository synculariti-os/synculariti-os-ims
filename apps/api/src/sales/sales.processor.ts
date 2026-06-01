import { DB_CLIENT } from '../core/core.symbols';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { asRestaurantId, asRecipeId, asItemId } from '@ims/types';
import { Job } from 'bullmq';
import { ISalesFileParserFactory, SALES_FILE_PARSER_FACTORY_TOKEN } from './interfaces/i-sales-file-parser';
import { ISalesRepository, SALES_REPOSITORY_TOKEN } from './interfaces/i-sales.repository';
import { IRecipeService, RECIPE_SERVICE_TOKEN } from '../recipe/interfaces/i-recipe.service';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from '../inventory/interfaces/i-ledger.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from './interfaces/i-storage.service';
import { Database } from '@ims/types';
import * as path from 'path';
import { Kysely } from 'kysely';
import { tenantContext } from '../common/context/tenant.context';

@Processor('sales_import')
export class SalesImportProcessor extends WorkerHost {
  private readonly logger = new Logger(SalesImportProcessor.name);

  constructor(
    @Inject(SALES_REPOSITORY_TOKEN) private readonly salesRepository: ISalesRepository,
    @Inject(RECIPE_SERVICE_TOKEN) private readonly recipeService: IRecipeService,
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
    @Inject(STORAGE_SERVICE_TOKEN) private readonly storageService: IStorageService,
    @Inject(SALES_FILE_PARSER_FACTORY_TOKEN) private readonly parserFactory: ISalesFileParserFactory,
    @Inject(DB_CLIENT) private readonly db: Kysely<Database>,
  ) {
    super();
  }

  async process(job: Job<Record<string, string>, void, string>): Promise<void> {
    const { batchId, restaurantId, franchiseId, filePath } = job.data;
    
    return tenantContext.run({ franchiseId, restaurantId }, async () => {
      this.logger.log(`Starting processing for batch ${batchId}`);
      
      try {
        await this.salesRepository.updateBatchStatus(batchId, 'PROCESSING');
        
        // 1. Download file from storage
        const localFilePath = await this.storageService.downloadFile(filePath);
        
        // 2. Parse file using injected factory
        const ext = path.extname(localFilePath);
        const parser = this.parserFactory.getParser(ext);
        const parsedRows = await parser.parse(localFilePath);

        // Execute Database Transaction (Bulk Insert Rows + Ledger) + BOM expansion
        // Wrapping everything inside the transaction ensures partial transaction management (H2) is fixed
        await this.db.transaction().execute(async (trx) => {
          // 3. Look up menu item mappings (now inside trx context)
          const rawItemNames = parsedRows.map(r => r.rawItemName);
          const mappings = await this.recipeService.resolveRecipesByPosStrings(asRestaurantId(restaurantId), rawItemNames);
          
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
              const bomExpansion = await this.recipeService.expandBOM(asRecipeId(row.recipeId), row.quantitySold);
              for (const item of bomExpansion) {
                depletionTasks.push({
                  itemId: item.itemId,
                  consumedQty: item.consumedQty
                });
              }
            }
          }

          // Insert parsed rows into sales_import_rows
          await this.salesRepository.insertImportRows(trx, rowsToInsert);
          
          // Record all ledger depletions
          for (const task of depletionTasks) {
            await this.ledgerService.record(trx, {
              restaurantId: asRestaurantId(restaurantId),
              itemId: asItemId(task.itemId),
              changeAmount: -task.consumedQty,
              reasonCode: 'SALES_DEPLETION',
              referenceId: batchId
            });
          }
        });

        // 7. Update batch status to completed
        await this.salesRepository.updateBatchStatus(batchId, 'COMPLETED');
        this.logger.log(`Completed processing for batch ${batchId}`);
        
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Failed to process batch ${batchId}`, stack);
        await this.salesRepository.updateBatchStatus(batchId, 'FAILED', msg);
        throw error;
      }
    });
  }
}
