import { SUPABASE_ADMIN_CLIENT, DB_CLIENT } from '../core/core.symbols';
import { Injectable, Inject, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ISalesService } from './interfaces/i-sales.service';
import { ISalesRepository, SALES_REPOSITORY_TOKEN } from './interfaces/i-sales.repository';
import { IRecipeService, RECIPE_SERVICE_TOKEN } from '../recipe/interfaces/i-recipe.service';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from '../inventory/interfaces/i-ledger.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from './interfaces/i-storage.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';
import { Kysely } from 'kysely';
import { Database, asRestaurantId, asRecipeId, asItemId, PosRawImportInsert, SalesImportBatchId } from '@ims/types';

/** Column mapping from Slovak POS XLSX headers → internal field names */
const POS_HEADER_MAP: Record<string, string> = {
  'PLU': 'plu',
  'Charakteristika 1': 'charakteristika_1',
  'Charakteristika 2': 'charakteristika_2',
  'Čiarový kód': 'barcode',
  'Názov': 'nazov',
  'Typ PLU (č)': 'plu_type_number',
  'Typ PLU (text)': 'plu_type_text',
  'Číslo skupiny': 'group_number',
  'Názov skupiny': 'group_name',
  'Číslo prevádzky': 'outlet_number',
  'Názov prevádzky': 'outlet_name',
  'Množstvo': 'quantity',
  'MJ': 'uom',
  'Celkom bez DPH': 'total_price_excl_vat',
  'Celkom s DPH': 'total_price_incl_vat',
  'Celkové náklady': 'total_cogs',
  'Pôvodná cena s DPH': 'original_price_incl_vat',
  'Zľava celkom': 'total_discount',
  'Voliteľný text 1': 'optional_text_1',
  'Voliteľný text 2': 'optional_text_2',
  'Voliteľný text 3': 'optional_text_3',
};

@Injectable()
export class SalesService implements ISalesService {
  constructor(
    @Inject(SALES_REPOSITORY_TOKEN) private readonly repo: ISalesRepository,
    @Inject(getQueueToken('sales_import')) private readonly salesQueue: Queue,
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(RECIPE_SERVICE_TOKEN) private readonly recipeService: IRecipeService,
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
    @Inject(STORAGE_SERVICE_TOKEN) private readonly storageService: IStorageService,
    @Inject(DB_CLIENT) private readonly db: Kysely<Database>,
  ) {}

  async uploadSalesFile(file: Express.Multer.File, dto: { businessDate: string }, restaurantId: string, franchiseId: string, userId: string): Promise<{ batchId: string }> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${restaurantId}/${dto.businessDate}-${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await this.supabase.storage
      .from('sales_raw_uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw new InternalServerErrorException(uploadError.message);
    }

    const { data: urlData } = this.supabase.storage
      .from('sales_raw_uploads')
      .getPublicUrl(fileName);

    const batch = await this.repo.createBatch({
      restaurantId,
      businessDate: dto.businessDate,
      fileUrl: urlData.publicUrl,
      uploadedBy: userId,
    });

    await this.salesQueue.add('process-sales', { batchId: batch.id, restaurantId, franchiseId, filePath: fileName });

    return { batchId: batch.id };
  }

  /**
   * Upload a Slovak POS XLSX export and register a batch (PENDING).
   * Processing is triggered separately via processPosBatch().
   */
  async uploadPosFile(file: Express.Multer.File, dto: { businessDate: string }, restaurantId: string, userId: string): Promise<{ batchId: string }> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `pos/${restaurantId}/${dto.businessDate}-${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await this.supabase.storage
      .from('sales_raw_uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw new InternalServerErrorException(uploadError.message);
    }

    const { data: urlData } = this.supabase.storage
      .from('sales_raw_uploads')
      .getPublicUrl(fileName);

    // Pre-parse to get total row count
    const workbook = xlsx.read(file.buffer, { type: 'buffer', codepage: 65001 });
    const sheetName = workbook.SheetNames[0]!;
    const sheet = workbook.Sheets[sheetName]!;
    const rawRows: Record<string, string | number | undefined>[] = xlsx.utils.sheet_to_json(sheet);
    const totalRows = rawRows.length;

    const batch = await this.repo.createBatch({
      restaurantId,
      businessDate: dto.businessDate,
      fileUrl: urlData.publicUrl,
      storagePath: fileName,
      uploadedBy: userId,
      originalFileName: file.originalname,
      totalRows,
    });

    return { batchId: batch.id };
  }

  /**
   * Process a POS batch: parse file from storage, insert raw rows into pos_raw_imports,
   * resolve recipes, expand BOM, and record SALES_DEPLETION ledger entries.
   * All in a single ACID transaction.
   */
  async processPosBatch(batchId: string, restaurantId: string, franchiseGroupId: string): Promise<{ importedRows: number }> {
    const batch = await this.repo.findBatchById(batchId);
    if (!batch) throw new NotFoundException(`Batch ${batchId} not found`);
    if (batch.status !== 'PENDING') throw new BadRequestException(`Batch is in status ${batch.status}, expected PENDING`);
    if (!batch.storagePath) throw new BadRequestException('Batch has no storage path — cannot process');

    await this.repo.updateBatchStatus(batchId, 'PROCESSING');

    try {
      const localFilePath = await this.storageService.downloadFile(batch.storagePath);
      const workbook = xlsx.readFile(localFilePath, { codepage: 65001 });
      const sheetName = workbook.SheetNames[0]!;
      const sheet = workbook.Sheets[sheetName]!;
      const rawRows: Record<string, string | number | undefined>[] = xlsx.utils.sheet_to_json(sheet);

      const mappedRows = rawRows.map(row => this.mapPosRow(row, batchId));
      const nonAnomalyRows = mappedRows.filter(r => (r.nazov?.trim().length ?? 0) > 0 && r.quantity !== 0);

      await this.db.transaction().execute(async (trx) => {
        // 1. Insert ALL rows (including anomalies) verbatim into pos_raw_imports for audit
        await this.repo.insertPosRawImports(trx, mappedRows as PosRawImportInsert[]);

        // 2. Resolve recipes in bulk
        const rawItemNames = [...new Set(nonAnomalyRows.map(r => r.nazov!.trim()))];
        const mappings = await this.recipeService.resolveRecipesByPosStrings(
          asRestaurantId(restaurantId),
          rawItemNames,
        );
        const mappingDict = new Map<string, string>();
        mappings.forEach(m => mappingDict.set(m.rawExcelString, m.recipeId));

        const rowsToInsert = nonAnomalyRows.map(r => ({
          batchId,
          rawItemName: r.nazov!.trim(),
          quantitySold: r.quantity,
          isMapped: mappingDict.has(r.nazov!.trim()),
          recipeId: mappingDict.get(r.nazov!.trim()) || null,
        }));

        // 3. Expand BOM for all mapped rows
        const depletionTasks: { itemId: string; consumedQty: number }[] = [];
        for (const row of rowsToInsert) {
          if (row.recipeId) {
            const bomExpansion = await this.recipeService.expandBOM(asRecipeId(row.recipeId), row.quantitySold);
            for (const item of bomExpansion) {
              depletionTasks.push({ itemId: item.itemId, consumedQty: item.consumedQty });
            }
          }
        }

        // 4. Insert clean rows into sales_import_rows
        await this.repo.insertImportRows(trx, rowsToInsert);

        // 5. Record SALES_DEPLETION ledger entries
        for (const task of depletionTasks) {
          await this.ledgerService.record(trx, {
            restaurantId: asRestaurantId(restaurantId),
            itemId: asItemId(task.itemId),
            changeAmount: -task.consumedQty,
            reasonCode: 'SALES_DEPLETION',
            referenceId: batchId,
          });
        }
      });

      await this.repo.updateBatchAfterUpload(batchId, { importedRows: nonAnomalyRows.length });

      return { importedRows: nonAnomalyRows.length };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.repo.updateBatchStatus(batchId, 'FAILED', msg);
      throw error;
    }
  }

  async listBatches(restaurantId: string, page: number, limit: number): Promise<{ data: import('@ims/types').SalesImportBatch[], meta: import('@ims/types').PaginationMeta }> {
    const { data, total } = await this.repo.listBatches(restaurantId, page, limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUnmappedRows(
    restaurantId: string,
    batchId: string,
  ): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>> {
    return this.repo.getUnmappedRows(restaurantId, batchId);
  }

  private mapPosRow(row: Record<string, string | number | undefined>, batchId: string): Omit<PosRawImportInsert, 'id'> {
    const get = (key: string) => {
      const internalKey = POS_HEADER_MAP[key];
      const val = internalKey ? row[key] : undefined;
      return val;
    };

    const quantity = Number(get('Množstvo') ?? row['quantity'] ?? 0);
    const nazov = String(get('Názov') ?? row['nazov'] ?? '').trim() || null;

    return {
      batch_id: batchId as SalesImportBatchId,
      plu: typeof get('PLU') === 'number' ? (get('PLU') as number) : null,
      charakteristika_1: get('Charakteristika 1') != null ? String(get('Charakteristika 1')) : null,
      charakteristika_2: get('Charakteristika 2') != null ? String(get('Charakteristika 2')) : null,
      barcode: get('Čiarový kód') != null ? String(get('Čiarový kód')) : null,
      nazov,
      plu_type_number: typeof get('Typ PLU (č)') === 'number' ? (get('Typ PLU (č)') as number) : null,
      plu_type_text: get('Typ PLU (text)') != null ? String(get('Typ PLU (text)')) : null,
      group_number: typeof get('Číslo skupiny') === 'number' ? (get('Číslo skupiny') as number) : null,
      group_name: get('Názov skupiny') != null ? String(get('Názov skupiny')) : null,
      outlet_number: typeof get('Číslo prevádzky') === 'number' ? (get('Číslo prevádzky') as number) : null,
      outlet_name: get('Názov prevádzky') != null ? String(get('Názov prevádzky')) : null,
      quantity,
      uom: get('MJ') != null ? String(get('MJ')) : null,
      total_price_excl_vat: typeof get('Celkom bez DPH') === 'number' ? (get('Celkom bez DPH') as number) : null,
      total_price_incl_vat: typeof get('Celkom s DPH') === 'number' ? (get('Celkom s DPH') as number) : null,
      total_cogs: typeof get('Celkové náklady') === 'number' ? (get('Celkové náklady') as number) : null,
      original_price_incl_vat: typeof get('Pôvodná cena s DPH') === 'number' ? (get('Pôvodná cena s DPH') as number) : null,
      total_discount: typeof get('Zľava celkom') === 'number' ? (get('Zľava celkom') as number) : null,
      optional_text_1: get('Voliteľný text 1') != null ? String(get('Voliteľný text 1')) : null,
      optional_text_2: get('Voliteľný text 2') != null ? String(get('Voliteľný text 2')) : null,
      optional_text_3: get('Voliteľný text 3') != null ? String(get('Voliteľný text 3')) : null,
      raw_json: row as unknown as import('@ims/types').Json,

    };
  }
}
