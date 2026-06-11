/* @immutable-test — Written Red-first on: 2026-06-11. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeService } from '../recipe.service';

describe('RecipeService - Bulk Creation', () => {
  let service: RecipeService;
  let mockRecipeRepo: any;
  let mockItemService: any;
  let mockDb: any;

  beforeEach(() => {
    mockDb = { transaction: vi.fn().mockReturnValue({ execute: vi.fn((cb) => cb({})) }), fn: { count: vi.fn() } };
    mockRecipeRepo = {
      findById: vi.fn(),
      findByProducesItemId: vi.fn(),
      findByRecipeName: vi.fn(),
      findIngredients: vi.fn(),
      resolveByPosString: vi.fn(),
      resolveRecipesByPosStrings: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsertMapping: vi.fn(),
      findAllRecipes: vi.fn(),
      findAllMappings: vi.fn(),
      deleteRecipe: vi.fn(),
      deleteMapping: vi.fn(),
      getUnmappedRows: vi.fn(),
    };

    mockItemService = {
      findById: vi.fn(),
      findBySku: vi.fn(),
      convertUom: vi.fn(),
      listParLevels: vi.fn(),
      listCategories: vi.fn(),
      createItem: vi.fn(),
      createCategory: vi.fn(),
      ensureItemDependencies: vi.fn(),
      getUomConversions: vi.fn(),
      updateItem: vi.fn(),
      updateCategory: vi.fn(),
      upsertUomConversion: vi.fn(),
      updateOverride: vi.fn(),
      generateSku: vi.fn(),
    };

    service = new RecipeService(mockDb, mockRecipeRepo, mockItemService);
  });

  it('calls ensureItemDependencies for both the produced item and each ingredient, then creates the recipe', async () => {
    const rows = [
      {
        producesItemSku: 'PREP-001',
        producesItemName: 'Produced Salad',
        categoryName: 'Salads',
        recipeName: null,
        yieldQuantity: 2,
        priceEur: null,
        vatRate: null,
        ingredientSku: 'RAW-001',
        ingredientName: 'Tomato',
        quantityRequired: 0.5,
        uom: 'kg',
      },
    ];

    mockItemService.ensureItemDependencies.mockResolvedValueOnce('produced-item-uuid');
    mockItemService.ensureItemDependencies.mockResolvedValueOnce('ingredient-item-uuid');
    mockItemService.findById.mockResolvedValue({ id: 'produced-item-uuid' });
    mockRecipeRepo.create.mockResolvedValue({ id: 'recipe-uuid' });

    const result = await service.bulkCreateRecipes(
      rows,
      'restaurant-uuid' as any,
      null,
    );

    // Both items ensured via IItemWriteService — never accessing item repository directly
    expect(mockItemService.ensureItemDependencies).toHaveBeenCalledTimes(2);
    expect(mockItemService.ensureItemDependencies).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sku: 'PREP-001',
        name: 'Produced Salad',
        categoryName: 'Salads',
        type: 'RAW',
        uom: 'kg',
      }),
      'restaurant-uuid',
      null,
    );
    expect(mockItemService.ensureItemDependencies).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sku: 'RAW-001',
        name: 'Tomato',
        categoryName: 'Salads',
        type: 'RAW',
      }),
      'restaurant-uuid',
      null,
    );

    expect(result.createdCount).toBe(1);
    expect(result.errors).toHaveLength(0);
  });
});
