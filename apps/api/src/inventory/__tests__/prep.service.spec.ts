/* eslint-disable @typescript-eslint/no-explicit-any */
// @immutable-test — Written Red-first on: 2026-06-02 NEVER MODIFY after first GREEN.
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PrepService } from '../prep.service';
import type { IPrepRepository } from '../interfaces/i-prep.repository';
import type { ILedgerService } from '../interfaces/i-ledger.service';
import type { IRecipeService } from '../../recipe/interfaces/i-recipe.service';
import type { IStockQueryService } from '../interfaces/i-stock-query.service';
import type { IItemReadService } from '../../item/interfaces/i-item.service';
import type { RestaurantId, PrepLogId, Recipe } from '@ims/types';
import { LEDGER_REASON_CODES } from '@ims/types';
import { NotFoundException } from '@nestjs/common';

describe('PrepService', () => {
  let service: PrepService;
  let prepRepo: Mocked<IPrepRepository>;
  let ledger: Mocked<ILedgerService>;
  let recipeService: Mocked<IRecipeService>;
  let stockQueryService: Mocked<IStockQueryService>;
  let itemReadService: Mocked<IItemReadService>;
  let mockDb: any;

  const mockRestaurantId = 'rest-1' as RestaurantId;

  beforeEach(() => {
    mockDb = {
      transaction: vi.fn().mockReturnValue({
        execute: vi.fn().mockImplementation(async (cb) => {
          return cb(mockDb); // mock transaction object
        })
      })
    };

    prepRepo = {
      createPrepLog: vi.fn(),
      listPrepLogs: vi.fn(),
    };

    ledger = {
      record: vi.fn(),
      getCurrentStock: vi.fn(),
      getCurrentStockBulk: vi.fn(),
      getLedgerEntries: vi.fn(),
    };

    recipeService = {
      getRecipeByProducesItemId: vi.fn(),
      expandBOM: vi.fn(),
    } as any;

    stockQueryService = {
      getCurrentStock: vi.fn(),
      getCurrentStockBulk: vi.fn(),
    };

    itemReadService = {
      findById: vi.fn(),
      convertUom: vi.fn(),
      listParLevels: vi.fn(),
      listCategories: vi.fn(),
    } as any;

    service = new PrepService(mockDb, prepRepo, ledger, recipeService, stockQueryService, itemReadService);
  });

  describe('logPrepProduction', () => {
    it('should throw NotFoundException if no recipe produces the item', async () => {
      recipeService.getRecipeByProducesItemId.mockResolvedValue(null);

      await expect(
        service.logPrepProduction(mockRestaurantId, { prepItemId: 'item-1', yieldQtyProduced: 10 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should create log and record yield and consumption', async () => {
      const dto = { prepItemId: 'item-1', yieldQtyProduced: 10 };
      const mockRecipe = { id: 'recipe-1' } as Recipe;
      const mockBom = [
        { itemId: 'ing-1', consumedQty: 20 },
        { itemId: 'ing-2', consumedQty: 5 }
      ] as any;
      const mockLog = { id: 'prep-1' as PrepLogId, ...dto, restaurantId: mockRestaurantId, producedAt: '' } as any;

      recipeService.getRecipeByProducesItemId.mockResolvedValue(mockRecipe);
      recipeService.expandBOM.mockResolvedValue(mockBom);
      prepRepo.createPrepLog.mockResolvedValue(mockLog);

      const result = await service.logPrepProduction(mockRestaurantId, dto);

      expect(result).toEqual(mockLog);
      
      // Verify yield
      expect(ledger.record).toHaveBeenCalledWith(mockDb, {
        restaurantId: mockRestaurantId,
        itemId: dto.prepItemId,
        changeAmount: dto.yieldQtyProduced,
        reasonCode: LEDGER_REASON_CODES.PREP_PRODUCTION,
        referenceId: mockLog.id,
      });

      // Verify consumption
      expect(ledger.record).toHaveBeenCalledWith(mockDb, {
        restaurantId: mockRestaurantId,
        itemId: 'ing-1',
        changeAmount: -20,
        reasonCode: LEDGER_REASON_CODES.PREP_CONSUMPTION,
        referenceId: mockLog.id,
      });

      expect(ledger.record).toHaveBeenCalledWith(mockDb, {
        restaurantId: mockRestaurantId,
        itemId: 'ing-2',
        changeAmount: -5,
        reasonCode: LEDGER_REASON_CODES.PREP_CONSUMPTION,
        referenceId: mockLog.id,
      });
    });
  });

  describe('planPrepProduction', () => {
    it('should calculate shortages correctly', async () => {
      const dto = { itemId: 'prep-1', targetYield: 10 };
      const mockRecipe = { id: 'recipe-1' } as Recipe;
      const mockBom = [
        { itemId: 'ing-1', consumedQty: 20 },
        { itemId: 'ing-2', consumedQty: 5 }
      ] as any;

      recipeService.getRecipeByProducesItemId.mockResolvedValue(mockRecipe);
      recipeService.expandBOM.mockResolvedValue(mockBom);
      stockQueryService.getCurrentStockBulk.mockResolvedValue([
        { itemId: 'ing-1', qty: 10 } as any // only 10 in stock, need 20
        // ing-2 is missing from stock, so 0
      ]);

      itemReadService.findById.mockImplementation(async (id) => {
        if (id === 'ing-1') return { id: 'ing-1', name: 'Flour', inventoryUom: 'kg' } as any;
        return { id: 'ing-2', name: 'Sugar', inventoryUom: 'kg' } as any;
      });

      const res = await service.planPrepProduction(mockRestaurantId, dto);
      expect(res.isPossible).toBe(false);
      expect(res.ingredients).toHaveLength(2);

      const flour = res.ingredients.find(i => i.itemId === 'ing-1');
      expect(flour?.shortageQty).toBe(10); // 20 - 10
      expect(flour?.currentStock).toBe(10);

      const sugar = res.ingredients.find(i => i.itemId === 'ing-2');
      expect(sugar?.shortageQty).toBe(5); // 5 - 0
      expect(sugar?.currentStock).toBe(0);
    });

    it('should be possible if no shortages', async () => {
      const dto = { itemId: 'prep-1', targetYield: 10 };
      const mockRecipe = { id: 'recipe-1' } as Recipe;
      const mockBom = [
        { itemId: 'ing-1', consumedQty: 20 }
      ] as any;

      recipeService.getRecipeByProducesItemId.mockResolvedValue(mockRecipe);
      recipeService.expandBOM.mockResolvedValue(mockBom);
      stockQueryService.getCurrentStockBulk.mockResolvedValue([
        { itemId: 'ing-1', qty: 50 } as any // plenty
      ]);

      itemReadService.findById.mockResolvedValue({ id: 'ing-1', name: 'Flour', inventoryUom: 'kg' } as any);

      const res = await service.planPrepProduction(mockRestaurantId, dto);
      expect(res.isPossible).toBe(true);
      
      const flour = res.ingredients[0];
      expect(flour.shortageQty).toBe(0);
      expect(flour.currentStock).toBe(50);
    });
  });
});

