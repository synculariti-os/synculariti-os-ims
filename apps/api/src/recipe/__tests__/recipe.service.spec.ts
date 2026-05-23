/* @immutable-test — Written Red-first on: 2026-05-23. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeService } from '../recipe.service';
import type { IRecipeRepository } from '../interfaces/i-recipe.repository';
import type { IItemReadService } from '../../item/interfaces/i-item.service';
import type { BomExpansion } from '@ims/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const RECIPE_ID = 'recipe-uuid-001' as any;
const PRODUCED_ITEM_ID = 'item-uuid-burger-patty' as any;
const FLOUR_ID = 'item-uuid-flour' as any;
const WATER_ID = 'item-uuid-water' as any;

const MOCK_RECIPE = {
  id: RECIPE_ID,
  producesItemId: PRODUCED_ITEM_ID,
  yieldQuantity: 10, // 10 units per batch
  franchiseGroupId: 'fg-uuid-001' as any,
  restaurantId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_INGREDIENTS = [
  { id: 'ing-1' as any, recipeId: RECIPE_ID, ingredientItemId: FLOUR_ID, quantityRequired: 500, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ing-2' as any, recipeId: RECIPE_ID, ingredientItemId: WATER_ID, quantityRequired: 200, createdAt: '2026-01-01T00:00:00Z' },
];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockRecipeRepo: IRecipeRepository = {
  findById: vi.fn(),
  findByProducesItemId: vi.fn(),
  findIngredients: vi.fn(),
  resolveByPosString: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsertMapping: vi.fn(),
};

const mockItemService: IItemReadService = {
  findById: vi.fn(),
  convertUom: vi.fn(),
  listParLevels: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecipeService(mockRecipeRepo, mockItemService);
  });

  // ── expandBOM ─────────────────────────────────────────────────────────────

  describe('expandBOM()', () => {
    it('returns a proportional BOM expansion for soldQty = 1 batch (yieldQty = 10)', async () => {
      vi.mocked(mockRecipeRepo.findById).mockResolvedValueOnce(MOCK_RECIPE as any);
      vi.mocked(mockRecipeRepo.findIngredients).mockResolvedValueOnce(MOCK_INGREDIENTS as any);

      // Selling 10 units = 1 full batch
      const result: BomExpansion = await service.expandBOM(RECIPE_ID, 10);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ itemId: FLOUR_ID, consumedQty: 500 });
      expect(result).toContainEqual({ itemId: WATER_ID, consumedQty: 200 });
    });

    it('scales ingredient quantities proportionally for partial batches', async () => {
      vi.mocked(mockRecipeRepo.findById).mockResolvedValueOnce(MOCK_RECIPE as any);
      vi.mocked(mockRecipeRepo.findIngredients).mockResolvedValueOnce(MOCK_INGREDIENTS as any);

      // Selling 5 units = 0.5 batch
      const result: BomExpansion = await service.expandBOM(RECIPE_ID, 5);

      expect(result).toContainEqual({ itemId: FLOUR_ID, consumedQty: 250 });
      expect(result).toContainEqual({ itemId: WATER_ID, consumedQty: 100 });
    });

    it('returns an empty array when the recipe has no ingredients', async () => {
      vi.mocked(mockRecipeRepo.findById).mockResolvedValueOnce(MOCK_RECIPE as any);
      vi.mocked(mockRecipeRepo.findIngredients).mockResolvedValueOnce([]);

      const result = await service.expandBOM(RECIPE_ID, 10);

      expect(result).toEqual([]);
    });

    it('throws when recipe is not found', async () => {
      vi.mocked(mockRecipeRepo.findById).mockResolvedValueOnce(null);

      await expect(service.expandBOM(RECIPE_ID, 10)).rejects.toThrow();
    });

    it('throws when soldQty is zero or negative', async () => {
      await expect(service.expandBOM(RECIPE_ID, 0)).rejects.toThrow(/soldQty must be positive/i);
      await expect(service.expandBOM(RECIPE_ID, -1)).rejects.toThrow(/soldQty must be positive/i);
    });
  });

  // ── resolveRecipeByPosString ──────────────────────────────────────────────

  describe('resolveRecipeByPosString()', () => {
    it('returns a matching recipe for a known POS string', async () => {
      vi.mocked(mockRecipeRepo.resolveByPosString).mockResolvedValueOnce(MOCK_RECIPE as any);

      const result = await service.resolveRecipeByPosString(
        'restaurant-uuid' as any,
        'Burger Patty 150g',
      );

      expect(result).toEqual(MOCK_RECIPE);
    });

    it('returns null for an unknown POS string (unmapped rows stay unmapped)', async () => {
      vi.mocked(mockRecipeRepo.resolveByPosString).mockResolvedValueOnce(null);

      const result = await service.resolveRecipeByPosString(
        'restaurant-uuid' as any,
        'Unknown Product XYZ',
      );

      expect(result).toBeNull();
    });
  });

  // ── getIngredients ────────────────────────────────────────────────────────

  describe('getIngredients()', () => {
    it('returns all ingredients for a recipe', async () => {
      vi.mocked(mockRecipeRepo.findIngredients).mockResolvedValueOnce(MOCK_INGREDIENTS as any);

      const result = await service.getIngredients(RECIPE_ID);

      expect(result).toHaveLength(2);
    });
  });
});
