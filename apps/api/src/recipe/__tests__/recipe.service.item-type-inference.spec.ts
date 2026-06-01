/* @immutable-test — Written Red-first on: 2026-05-31. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { RecipeService } from '../recipe.service';
import type { IRecipeRepository } from '../interfaces/i-recipe.repository';
import type { IItemWriteService } from '../../item/interfaces/i-item.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const RECIPE_ID         = 'recipe-uuid-001'   as any;
const OTHER_RECIPE_ID   = 'recipe-uuid-002'   as any;
const PRODUCED_ITEM_ID  = 'item-uuid-sauce'   as any;
const RAW_ITEM_ID       = 'item-uuid-tomato'  as any;

const MOCK_RECIPE_WITH_PRODUCES = {
  id: RECIPE_ID,
  producesItemId: PRODUCED_ITEM_ID,
  recipeName: null,
  yieldQuantity: 1,
  yieldPercent: 1,
  franchiseGroupId: null,
  restaurantId: 'rest-1' as any,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_VIRTUAL_RECIPE = {
  id: RECIPE_ID,
  producesItemId: null,
  recipeName: 'Pepperoni Pizza',
  yieldQuantity: 1,
  yieldPercent: 1,
  franchiseGroupId: null,
  restaurantId: 'rest-1' as any,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------
const mockRecipeRepo: IRecipeRepository = {
  findById:                   vi.fn(),
  findByProducesItemId:       vi.fn(),
  findIngredients:            vi.fn(),
  resolveByPosString:         vi.fn(),
  resolveRecipesByPosStrings: vi.fn(),
  create:                     vi.fn(),
  update:                     vi.fn(),
  upsertMapping:              vi.fn(),
  findAllRecipes:             vi.fn(),
  findMenuRecipes:            vi.fn(),
  findAllMappings:            vi.fn(),
  deleteRecipe:               vi.fn(),
  deleteMapping:              vi.fn(),
};

const mockItemService: IItemWriteService = {
  findById:            vi.fn(),
  convertUom:          vi.fn(),
  listParLevels:       vi.fn(),
  listCategories:      vi.fn(),
  createItem:          vi.fn(),
  updateItem:          vi.fn(),
  deleteItem:          vi.fn(),
  createCategory:      vi.fn(),
  updateCategory:      vi.fn(),
  deleteCategory:      vi.fn(),
  upsertUomConversion: vi.fn(),
  updateOverride:      vi.fn(),
  generateSku:         vi.fn(),
};

const mockDb = {
  transaction: vi.fn().mockReturnValue({
    execute: vi.fn(async (cb) => cb({} as any)),
  }),
} as any;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('RecipeService — item type inference', () => {
  let service: RecipeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecipeService(mockDb, mockRecipeRepo, mockItemService);
  });

  // ── createRecipe — type promotion ─────────────────────────────────────────

  describe('createRecipe() — PREP type promotion', () => {
    it('calls updateItem({ type: PREP }) when producesItemId is provided', async () => {
      const dto = {
        producesItemId: PRODUCED_ITEM_ID,
        recipeName: null,
        yieldQuantity: 1,
        yieldPercent: 1,
        ingredients: [],
      };

      vi.mocked(mockItemService.findById).mockResolvedValueOnce({ id: PRODUCED_ITEM_ID, type: 'RAW' } as any);
      vi.mocked(mockRecipeRepo.create).mockResolvedValueOnce(MOCK_RECIPE_WITH_PRODUCES as any);
      vi.mocked(mockItemService.updateItem).mockResolvedValueOnce({ id: PRODUCED_ITEM_ID, type: 'PREP' } as any);

      await service.createRecipe(dto, 'rest-1' as any, null);

      expect(mockItemService.updateItem).toHaveBeenCalledWith(
        PRODUCED_ITEM_ID,
        expect.objectContaining({ type: 'PREP' }),
        expect.anything()
      );
    });

    it('does NOT call updateItem when producesItemId is null (virtual / menu recipe)', async () => {
      const dto = {
        producesItemId: null,
        recipeName: 'Pepperoni Pizza',
        yieldQuantity: 1,
        yieldPercent: 1,
        ingredients: [],
      };

      vi.mocked(mockRecipeRepo.create).mockResolvedValueOnce(MOCK_VIRTUAL_RECIPE as any);

      await service.createRecipe(dto, 'rest-1' as any, null);

      expect(mockItemService.updateItem).not.toHaveBeenCalled();
    });
  });

  // ── deleteRecipe — type reversion ─────────────────────────────────────────

  describe('deleteRecipe() — RAW type reversion', () => {
    it('reverts item.type to RAW when deleted recipe is the sole producer of that item', async () => {
      vi.mocked(mockRecipeRepo.findById).mockResolvedValueOnce(MOCK_RECIPE_WITH_PRODUCES as any);
      // No other recipe produces this item
      vi.mocked(mockRecipeRepo.findByProducesItemId).mockResolvedValueOnce(null);
      vi.mocked(mockRecipeRepo.deleteRecipe).mockResolvedValueOnce(undefined);
      vi.mocked(mockItemService.updateItem).mockResolvedValueOnce({ id: PRODUCED_ITEM_ID, type: 'RAW' } as any);

      await service.deleteRecipe(RECIPE_ID);

      expect(mockRecipeRepo.deleteRecipe).toHaveBeenCalledWith(RECIPE_ID, expect.anything());
      expect(mockItemService.updateItem).toHaveBeenCalledWith(
        PRODUCED_ITEM_ID,
        expect.objectContaining({ type: 'RAW' }),
        expect.anything()
      );
    });

    it('does NOT revert item.type when another recipe also produces that same item', async () => {
      vi.mocked(mockRecipeRepo.findById).mockResolvedValueOnce(MOCK_RECIPE_WITH_PRODUCES as any);
      // Another recipe also produces this item
      vi.mocked(mockRecipeRepo.findByProducesItemId).mockResolvedValueOnce({
        id: OTHER_RECIPE_ID,
        producesItemId: PRODUCED_ITEM_ID,
      } as any);
      vi.mocked(mockRecipeRepo.deleteRecipe).mockResolvedValueOnce(undefined);

      await service.deleteRecipe(RECIPE_ID);

      expect(mockRecipeRepo.deleteRecipe).toHaveBeenCalledWith(RECIPE_ID, expect.anything());
      expect(mockItemService.updateItem).not.toHaveBeenCalled();
    });

    it('does NOT call updateItem when deleted recipe is virtual (no producesItemId)', async () => {
      vi.mocked(mockRecipeRepo.findById).mockResolvedValueOnce(MOCK_VIRTUAL_RECIPE as any);
      vi.mocked(mockRecipeRepo.deleteRecipe).mockResolvedValueOnce(undefined);

      await service.deleteRecipe(RECIPE_ID);

      expect(mockItemService.updateItem).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when recipe does not exist', async () => {
      vi.mocked(mockRecipeRepo.findById).mockResolvedValueOnce(null);

      await expect(service.deleteRecipe(RECIPE_ID)).rejects.toThrow(NotFoundException);
      expect(mockRecipeRepo.deleteRecipe).not.toHaveBeenCalled();
    });
  });

  // ── createRecipe — item not found guard ───────────────────────────────────

  describe('createRecipe() — error guard', () => {
    it('throws NotFoundException if producesItemId item does not exist', async () => {
      const dto = {
        producesItemId: RAW_ITEM_ID,
        recipeName: null,
        yieldQuantity: 1,
        yieldPercent: 1,
        ingredients: [],
      };

      vi.mocked(mockItemService.findById).mockResolvedValueOnce(null as any);

      await expect(service.createRecipe(dto, 'rest-1' as any, null))
        .rejects.toThrow(NotFoundException);
      expect(mockRecipeRepo.create).not.toHaveBeenCalled();
      expect(mockItemService.updateItem).not.toHaveBeenCalled();
    });
  });
});
