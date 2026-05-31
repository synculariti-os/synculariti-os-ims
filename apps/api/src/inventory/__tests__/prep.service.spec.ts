import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PrepService } from '../prep.service';
import type { IPrepRepository } from '../interfaces/i-prep.repository';
import type { ILedgerService } from '../interfaces/i-ledger.service';
import type { IRecipeService } from '../../recipe/interfaces/i-recipe.service';
import type { RestaurantId, PrepLogId, Recipe } from '@ims/types';
import { LEDGER_REASON_CODES } from '@ims/types';
import { NotFoundException } from '@nestjs/common';

describe('PrepService', () => {
  let service: PrepService;
  let prepRepo: Mocked<IPrepRepository>;
  let ledger: Mocked<ILedgerService>;
  let recipeService: Mocked<IRecipeService>;
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

    service = new PrepService(mockDb, prepRepo, ledger, recipeService);
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
});
