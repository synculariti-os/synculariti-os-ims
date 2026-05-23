// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import * as path from 'path';
import { vi, describe, it, expect, beforeEach, Mocked } from 'vitest';
import { SalesImportProcessor } from '../sales.processor';
import { ISalesRepository, SALES_REPOSITORY_TOKEN } from '../interfaces/i-sales.repository';
import { IRecipeService, RECIPE_SERVICE_TOKEN } from '../interfaces/i-recipe.service';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from '../interfaces/i-ledger.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from '../interfaces/i-storage.service';

describe('SalesImportProcessor', () => {
  let processor: SalesImportProcessor;
  let salesRepository: Mocked<ISalesRepository>;
  let recipeService: Mocked<IRecipeService>;
  let ledgerService: Mocked<ILedgerService>;
  let storageService: Mocked<IStorageService>;

  beforeEach(async () => {
    salesRepository = {
      createBatch: vi.fn(),
      updateBatchStatus: vi.fn(),
      insertImportRows: vi.fn(),
      getMenuItemMappings: vi.fn(),
    } as any;

    recipeService = {
      expandBOM: vi.fn(),
    } as any;

    ledgerService = {
      record: vi.fn(),
    } as any;

    storageService = {
      downloadFile: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesImportProcessor,
        { provide: SALES_REPOSITORY_TOKEN, useValue: salesRepository },
        { provide: RECIPE_SERVICE_TOKEN, useValue: recipeService },
        { provide: LEDGER_SERVICE_TOKEN, useValue: ledgerService },
        { provide: STORAGE_SERVICE_TOKEN, useValue: storageService },
        { provide: 'DB_CLIENT', useValue: { transaction: vi.fn().mockReturnValue({ execute: vi.fn((cb) => cb({} as any)) }) } }
      ],
    }).compile();

    processor = module.get<SalesImportProcessor>(SalesImportProcessor);
  });

  it('should process the POS Excel file successfully, map rows, and write to ledger', async () => {
    const batchId = 'batch-123';
    const restaurantId = 'rest-123';
    const filePath = 'sales_raw_uploads/some-file.xlsx';

    // Mock storage service to return the real Excel file path so we can parse it locally
    const excelPath = path.resolve(__dirname, '../../../../../Prehľad predaja 20260504-223657.xlsx');
    storageService.downloadFile.mockResolvedValue(excelPath);

    // Mock mappings: "BLUE HEAVEN COMBO" -> recipe1, "CHEESY SMASH" -> recipe2
    salesRepository.getMenuItemMappings.mockResolvedValue([
      { rawExcelString: 'BLUE HEAVEN COMBO', recipeId: 'recipe-1' },
      { rawExcelString: 'CHEESY SMASH', recipeId: 'recipe-2' },
    ]);

    // Mock BOM expansion
    recipeService.expandBOM.mockImplementation(async (recipeId, quantity) => {
      if (recipeId === 'recipe-1') {
        return [{ itemId: 'item-bun', consumedQty: quantity * 1 }, { itemId: 'item-patty', consumedQty: quantity * 1 }];
      }
      if (recipeId === 'recipe-2') {
        return [{ itemId: 'item-cheese', consumedQty: quantity * 2 }];
      }
      return [];
    });

    const job = {
      data: { batchId, restaurantId, filePath },
    } as Job;

    await processor.process(job);

    // Assert batch was set to PROCESSING then COMPLETED
    expect(salesRepository.updateBatchStatus).toHaveBeenNthCalledWith(1, batchId, 'PROCESSING');
    expect(salesRepository.updateBatchStatus).toHaveBeenNthCalledWith(2, batchId, 'COMPLETED');

    // Assert that rows were inserted
    expect(salesRepository.insertImportRows).toHaveBeenCalled();
    const insertedRows = salesRepository.insertImportRows.mock.calls[0][1];
    expect(insertedRows.length).toBeGreaterThan(0);

    // Assert BLUE HEAVEN COMBO (qty: 6 + 3 = 9) and CHEESY SMASH (qty: 19) were extracted
    const blueHeavenRow = insertedRows.find((r: any) => r.rawItemName === 'BLUE HEAVEN COMBO');
    expect(blueHeavenRow).toBeDefined();

    // Assert LedgerService.record was called for the expanded BOM items
    expect(ledgerService.record).toHaveBeenCalledWith(
      expect.anything(), // transaction object
      expect.objectContaining({
        itemId: 'item-bun',
        restaurantId,
        changeAmount: expect.any(Number),
        reasonCode: 'SALES_DEPLETION',
      })
    );
  });

  it('should mark batch as FAILED if processing throws an error', async () => {
    const job = { data: { batchId: 'batch-456', restaurantId: 'rest-456', filePath: 'err.xlsx' } } as Job;
    storageService.downloadFile.mockRejectedValue(new Error('Storage error'));

    await expect(processor.process(job)).rejects.toThrow('Storage error');
    
    expect(salesRepository.updateBatchStatus).toHaveBeenCalledWith('batch-456', 'FAILED', 'Storage error');
  });
});
