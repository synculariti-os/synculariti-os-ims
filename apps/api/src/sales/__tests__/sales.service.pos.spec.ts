/* @immutable-test — Written Red-first on: 2026-06-11. NEVER MODIFY after first GREEN. */
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { SalesService } from '../sales.service';
import { ISalesRepository, SALES_REPOSITORY_TOKEN } from '../interfaces/i-sales.repository';
import { IRecipeService, RECIPE_SERVICE_TOKEN } from '../../recipe/interfaces/i-recipe.service';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from '../../inventory/interfaces/i-ledger.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from '../interfaces/i-storage.service';
import { DB_CLIENT, SUPABASE_ADMIN_CLIENT } from '../../core/core.symbols';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('xlsx', () => ({
  readFile: vi.fn(),
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));
import * as xlsx from 'xlsx';

describe('SalesService — POS flow', () => {
  let service: SalesService;
  let repo: Mocked<ISalesRepository>;
  let supabaseMock: any;
  let recipeService: Mocked<IRecipeService>;
  let ledgerService: Mocked<ILedgerService>;
  let storageService: Mocked<IStorageService>;

  const mockXlsxRows: Record<string, string | number | undefined>[] = [
    { 'PLU': 20027, 'Názov': 'Cheddar Burger', 'Množstvo': 3, 'MJ': 'ks' },
    { 'PLU': 20028, 'Názov': 'GUAC COMBO', 'Množstvo': 1, 'MJ': 'ks' },
    { 'PLU': 20029, 'Názov': '', 'Množstvo': 0 },
    { 'PLU': 20030, 'Názov': 'BLUE HEAVEN COMBO', 'Množstvo': 2, 'MJ': 'ks' },
    { 'PLU': 20031, 'Názov': 'CHEESY SMASH', 'Množstvo': 5, 'MJ': 'ks' },
  ];

  beforeEach(async () => {
    repo = {
      createBatch: vi.fn(),
      updateBatchStatus: vi.fn(),
      updateBatchAfterUpload: vi.fn(),
      insertImportRows: vi.fn(),
      insertPosRawImports: vi.fn(),
      findBatchById: vi.fn(),
      listBatches: vi.fn(),
      getUnmappedRows: vi.fn(),
    } as any;

    supabaseMock = {
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      },
    };

    recipeService = {
      expandBOM: vi.fn(),
      resolveRecipesByPosStrings: vi.fn(),
      getIngredients: vi.fn(),
      resolveRecipeByPosString: vi.fn(),
      listRecipes: vi.fn(),
      listMenuRecipes: vi.fn(),
      listMappings: vi.fn(),
      createRecipe: vi.fn(),
      bulkCreateRecipes: vi.fn(),
      updateRecipe: vi.fn(),
      deleteRecipe: vi.fn(),
      createMenuItemMapping: vi.fn(),
      deleteMapping: vi.fn(),
      getUnmappedRows: vi.fn(),
      getRecipeByProducesItemId: vi.fn(),
      getNutrition: vi.fn(),
    } as any;

    ledgerService = {
      record: vi.fn(),
      getCurrentStock: vi.fn(),
      getCurrentStockBulk: vi.fn(),
      getLedgerEntries: vi.fn(),
    } as any;

    storageService = {
      downloadFile: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: SALES_REPOSITORY_TOKEN, useValue: repo },
        { provide: getQueueToken('sales_import'), useValue: { add: vi.fn() } },
        { provide: SUPABASE_ADMIN_CLIENT, useValue: supabaseMock },
        { provide: RECIPE_SERVICE_TOKEN, useValue: recipeService },
        { provide: LEDGER_SERVICE_TOKEN, useValue: ledgerService },
        { provide: STORAGE_SERVICE_TOKEN, useValue: storageService },
        { provide: DB_CLIENT, useValue: { transaction: vi.fn().mockReturnValue({ execute: vi.fn((cb: Function) => cb({})) }) } },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);

    vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue(mockXlsxRows);
    vi.mocked(xlsx.read).mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} },
    } as any);
    vi.mocked(xlsx.readFile).mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} },
    } as any);
  });

  describe('uploadPosFile', () => {
    it('should upload file, parse xlsx, create batch with audit fields, and return batchId', async () => {
      const file = {
        buffer: Buffer.from('mock xlsx'),
        originalname: 'Prehľad predaja 20260504-223609.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      } as Express.Multer.File;
      const dto = { businessDate: '2026-05-04' };

      supabaseMock.storage.upload.mockResolvedValue({ error: null });
      supabaseMock.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://storage.url/file.xlsx' } });
      repo.createBatch.mockResolvedValue({ id: 'batch-1', status: 'PENDING', restaurant_id: 'rest-1', business_date: '2026-05-04' });

      const result = await service.uploadPosFile(file, dto, 'rest-1', 'user-1');

      expect(supabaseMock.storage.upload).toHaveBeenCalledWith(
        expect.stringContaining('pos/rest-1/'),
        file.buffer,
        expect.objectContaining({ contentType: file.mimetype }),
      );
      expect(repo.createBatch).toHaveBeenCalledWith(expect.objectContaining({
        restaurantId: 'rest-1',
        businessDate: '2026-05-04',
        fileUrl: 'https://storage.url/file.xlsx',
        storagePath: expect.stringContaining('pos/rest-1/'),
        uploadedBy: 'user-1',
        originalFileName: 'Prehľad predaja 20260504-223609.xlsx',
        totalRows: 5,
      }));
      expect(result.batchId).toEqual('batch-1');
    });

    it('should throw if supabase storage upload fails', async () => {
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      } as Express.Multer.File;
      const dto = { businessDate: '2026-05-04' };

      supabaseMock.storage.upload.mockResolvedValue({ error: { message: 'storage error' } });

      await expect(service.uploadPosFile(file, dto, 'rest-1', 'user-1')).rejects.toThrow('storage error');
    });
  });

  describe('processPosBatch', () => {
    const batch = {
      id: 'batch-1',
      restaurantId: 'rest-1' as any,
      businessDate: '2026-05-04',
      status: 'PENDING' as const,
      storagePath: 'pos/rest-1/file.xlsx',
      fileUrl: 'https://storage.url/file.xlsx',
      uploadedBy: 'user-1',
      originalFileName: 'Prehľad predaja 20260504-223609.xlsx',
      totalRows: 5,
      importedRows: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      errorMessage: null,
    };

    it('should process batch: insert all rows to pos_raw_imports, skip anomalies, resolve recipes, expand BOM, record ledger depletion', async () => {
      repo.findBatchById.mockResolvedValue(batch);
      storageService.downloadFile.mockResolvedValue('/tmp/test.xlsx');

      recipeService.resolveRecipesByPosStrings.mockResolvedValue([
        { id: 'm1' as any, restaurantId: 'rest-1' as any, rawExcelString: 'Cheddar Burger', recipeId: 'recipe-1' as any, createdAt: 'time' },
        { id: 'm2' as any, restaurantId: 'rest-1' as any, rawExcelString: 'BLUE HEAVEN COMBO', recipeId: 'recipe-2' as any, createdAt: 'time' },
        { id: 'm3' as any, restaurantId: 'rest-1' as any, rawExcelString: 'CHEESY SMASH', recipeId: 'recipe-3' as any, createdAt: 'time' },
      ]);

      recipeService.expandBOM.mockImplementation(async (_recipeId: string, qty: number) => {
        if (_recipeId === 'recipe-1') return [{ itemId: 'item-bun' as any, consumedQty: qty * 1 }, { itemId: 'item-patty' as any, consumedQty: qty * 1 }];
        if (_recipeId === 'recipe-2') return [{ itemId: 'item-bun' as any, consumedQty: qty * 1 }];
        if (_recipeId === 'recipe-3') return [{ itemId: 'item-cheese' as any, consumedQty: qty * 2 }];
        return [];
      });

      const result = await service.processPosBatch('batch-1', 'rest-1', 'franchise-1');

      // Batch status set to PROCESSING first
      expect(repo.updateBatchStatus).toHaveBeenNthCalledWith(1, 'batch-1', 'PROCESSING');

      // All 5 rows (including anomalies) inserted into pos_raw_imports
      expect(repo.insertPosRawImports).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ nazov: 'Cheddar Burger', quantity: 3 }),
          expect.objectContaining({ nazov: 'GUAC COMBO', quantity: 1 }),
          expect.objectContaining({ nazov: null, quantity: 0 }),
          expect.objectContaining({ nazov: 'BLUE HEAVEN COMBO', quantity: 2 }),
          expect.objectContaining({ nazov: 'CHEESY SMASH', quantity: 5 }),
        ]),
      );

      // Only 4 non-anomaly rows inserted into sales_import_rows (rows with empty nazov or qty=0 excluded)
      expect(repo.insertImportRows).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ rawItemName: 'Cheddar Burger', quantitySold: 3, isMapped: true }),
          expect.objectContaining({ rawItemName: 'GUAC COMBO', quantitySold: 1, isMapped: false }),
          expect.objectContaining({ rawItemName: 'BLUE HEAVEN COMBO', quantitySold: 2, isMapped: true }),
          expect.objectContaining({ rawItemName: 'CHEESY SMASH', quantitySold: 5, isMapped: true }),
        ]),
      );
      // Verify anomaly row is NOT in sales_import_rows
      const insertedRows = repo.insertImportRows.mock.calls[0]![1] as any[];
      expect(insertedRows.find((r: any) => r.rawItemName === '')).toBeUndefined();

      // Ledger records: Cheddar Burger (bun+patty) + BLUE HEAVEN COMBO (bun) + CHEESY SMASH (cheese*2*5)
      expect(ledgerService.record).toHaveBeenCalledTimes(4);
      expect(ledgerService.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ itemId: 'item-bun', restaurantId: 'rest-1', changeAmount: -3, reasonCode: 'SALES_DEPLETION' }),
      );
      expect(ledgerService.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ itemId: 'item-patty', restaurantId: 'rest-1', changeAmount: -3, reasonCode: 'SALES_DEPLETION' }),
      );
      expect(ledgerService.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ itemId: 'item-bun', restaurantId: 'rest-1', changeAmount: -2, reasonCode: 'SALES_DEPLETION' }),
      );
      expect(ledgerService.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ itemId: 'item-cheese', restaurantId: 'rest-1', changeAmount: -10, reasonCode: 'SALES_DEPLETION' }),
      );

      // Batch marked completed with correct count
      expect(repo.updateBatchAfterUpload).toHaveBeenCalledWith('batch-1', { importedRows: 4 });
      expect(result.importedRows).toEqual(4);
    });

    it('should throw NotFoundException when batch not found', async () => {
      repo.findBatchById.mockResolvedValue(null);

      await expect(service.processPosBatch('unknown', 'rest-1', 'franchise-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when batch is not PENDING', async () => {
      repo.findBatchById.mockResolvedValue({ ...batch, status: 'COMPLETED' });

      await expect(service.processPosBatch('batch-1', 'rest-1', 'franchise-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when batch has no storage path', async () => {
      repo.findBatchById.mockResolvedValue({ ...batch, storagePath: null });

      await expect(service.processPosBatch('batch-1', 'rest-1', 'franchise-1')).rejects.toThrow(BadRequestException);
    });

    it('should mark batch as FAILED and rethrow on processing error', async () => {
      repo.findBatchById.mockResolvedValue(batch);
      storageService.downloadFile.mockRejectedValue(new Error('download error'));

      await expect(service.processPosBatch('batch-1', 'rest-1', 'franchise-1')).rejects.toThrow('download error');
      expect(repo.updateBatchStatus).toHaveBeenCalledWith('batch-1', 'FAILED', 'download error');
    });

    it('should handle unmapped rows without depletion', async () => {
      repo.findBatchById.mockResolvedValue(batch);
      storageService.downloadFile.mockResolvedValue('/tmp/test.xlsx');

      // Only one item has a mapping
      recipeService.resolveRecipesByPosStrings.mockResolvedValue([
        { id: 'm1' as any, restaurantId: 'rest-1' as any, rawExcelString: 'CHEESY SMASH', recipeId: 'recipe-3' as any, createdAt: 'time' },
      ]);

      recipeService.expandBOM.mockResolvedValue([{ itemId: 'item-cheese' as any, consumedQty: 10 }]);

      const result = await service.processPosBatch('batch-1', 'rest-1', 'franchise-1');

      // Only CHEESY SMASH causes depletion (3 other items unmapped)
      expect(ledgerService.record).toHaveBeenCalledTimes(1);
      expect(ledgerService.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ itemId: 'item-cheese', changeAmount: -10 }),
      );
      expect(result.importedRows).toEqual(4);
    });
  });
});
