/* @immutable-test — Written Red-first on: 2026-05-31. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { RecipeService } from '../recipe.service';
import type { IRecipeRepository } from '../interfaces/i-recipe.repository';
import type { IItemWriteService } from '../../item/interfaces/i-item.service';
import type { BomExpansion } from '@ims/types';

// ---------------------------------------------------------------------------
// ID fixtures
// ---------------------------------------------------------------------------
const PIZZA_RECIPE_ID   = 'recipe-pizza-001'   as never;
const DOUGH_RECIPE_ID   = 'recipe-dough-001'   as never;
const SAUCE_RECIPE_ID   = 'recipe-sauce-001'   as never;
const CYCLE_A_RECIPE_ID = 'recipe-cycle-a-001' as never;
const CYCLE_B_RECIPE_ID = 'recipe-cycle-b-001' as never;

const FLOUR_ID     = 'item-flour-001'     as never;
const WATER_ID     = 'item-water-001'     as never;
const YEAST_ID     = 'item-yeast-001'     as never;
const SALT_ID      = 'item-salt-001'      as never;
const PEPPERONI_ID = 'item-pepperoni-001' as never;
const TOMATO_ID    = 'item-tomato-001'    as never;

// ---------------------------------------------------------------------------
// Recipe fixtures
// ---------------------------------------------------------------------------
/** Pepperoni Pizza BOM — yields 1 pizza per batch */
const PIZZA_RECIPE = {
  id: PIZZA_RECIPE_ID,
  recipeName: 'Pepperoni Pizza 12"',
  producesItemId: null,
  yieldQuantity: 1,
  yieldPercent: 1,
  franchiseGroupId: null,
  restaurantId: 'rest-1' as never,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

/** Pizza Dough BOM — yields 6 dough bases per batch */
const DOUGH_RECIPE = {
  id: DOUGH_RECIPE_ID,
  recipeName: 'Pizza Dough Base',
  producesItemId: null,
  yieldQuantity: 6,
  yieldPercent: 1,
  franchiseGroupId: null,
  restaurantId: 'rest-1' as never,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

/** Sauce BOM — yields 1 batch of sauce (used as a sub-recipe) */
const SAUCE_RECIPE = {
  id: SAUCE_RECIPE_ID,
  recipeName: 'Pizza Tomato Sauce',
  producesItemId: null,
  yieldQuantity: 25, // 25 × 80g portions
  yieldPercent: 1,
  franchiseGroupId: null,
  restaurantId: 'rest-1' as never,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Ingredient fixtures
// ---------------------------------------------------------------------------
/** Pizza BOM lines: 1 dough base (sub-recipe), 60g pepperoni (raw) */
const PIZZA_INGREDIENTS = [
  {
    id: 'ing-pizza-dough' as never,
    recipeId: PIZZA_RECIPE_ID,
    lineType: 'sub_recipe' as const,
    ingredientItemId: null,
    subRecipeId: DOUGH_RECIPE_ID,
    quantityRequired: 1, // 1 base out of a 6-base batch
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ing-pizza-pepperoni' as never,
    recipeId: PIZZA_RECIPE_ID,
    lineType: 'ingredient' as const,
    ingredientItemId: PEPPERONI_ID,
    subRecipeId: null,
    quantityRequired: 60, // 60g
    createdAt: '2026-01-01T00:00:00Z',
  },
];

/** Dough BOM lines: flour 500g, water 325g, yeast 7g, salt 10g */
const DOUGH_INGREDIENTS = [
  { id: 'ing-dough-flour' as never, recipeId: DOUGH_RECIPE_ID, lineType: 'ingredient' as const, ingredientItemId: FLOUR_ID, subRecipeId: null, quantityRequired: 500, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ing-dough-water' as never, recipeId: DOUGH_RECIPE_ID, lineType: 'ingredient' as const, ingredientItemId: WATER_ID, subRecipeId: null, quantityRequired: 325, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ing-dough-yeast' as never, recipeId: DOUGH_RECIPE_ID, lineType: 'ingredient' as const, ingredientItemId: YEAST_ID, subRecipeId: null, quantityRequired: 7,   createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ing-dough-salt'  as never, recipeId: DOUGH_RECIPE_ID, lineType: 'ingredient' as const, ingredientItemId: SALT_ID,  subRecipeId: null, quantityRequired: 10,  createdAt: '2026-01-01T00:00:00Z' },
];

/** Sauce BOM lines: tomatoes 1500g, salt 10g (salt appears in both dough + sauce) */
const SAUCE_INGREDIENTS = [
  { id: 'ing-sauce-tomato' as never, recipeId: SAUCE_RECIPE_ID, lineType: 'ingredient' as const, ingredientItemId: TOMATO_ID, subRecipeId: null, quantityRequired: 1500, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ing-sauce-salt'   as never, recipeId: SAUCE_RECIPE_ID, lineType: 'ingredient' as const, ingredientItemId: SALT_ID,   subRecipeId: null, quantityRequired: 10,   createdAt: '2026-01-01T00:00:00Z' },
];

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------
const mockRecipeRepo: IRecipeRepository = {
  findById:                 vi.fn(),
  findByProducesItemId:     vi.fn(),
  findIngredients:          vi.fn(),
  resolveByPosString:       vi.fn(),
  resolveRecipesByPosStrings: vi.fn(),
  create:                   vi.fn(),
  update:                   vi.fn(),
  upsertMapping:            vi.fn(),
  findAllRecipes:             vi.fn(),
  findMenuRecipes:            vi.fn(),
  findAllMappings:            vi.fn(),
  deleteRecipe:               vi.fn(),
  deleteMapping:              vi.fn(),
};

const mockItemService: IItemWriteService = {
  findById:          vi.fn(),
  convertUom:        vi.fn(),
  listParLevels:     vi.fn(),
  listCategories:    vi.fn(),
  createItem:        vi.fn(),
  updateItem:        vi.fn(),
  deleteItem:        vi.fn(),
  createCategory:    vi.fn(),
  updateCategory:    vi.fn(),
  deleteCategory:    vi.fn(),
  upsertUomConversion: vi.fn(),
  updateOverride:    vi.fn(),
  generateSku:       vi.fn(),
};

const mockDb = {
  transaction: vi.fn().mockReturnValue({
    execute: vi.fn(async (cb) => cb({} as never)),
  }),
} as never;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('RecipeService — recursive BOM expansion', () => {
  let service: RecipeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecipeService(mockDb, mockRecipeRepo, mockItemService);
  });

  // ── 2-level expansion: Pizza → Dough sub-recipe → raw ingredients ────────

  it('expands a 2-level BOM: pizza → dough sub-recipe → raw flour, water, yeast, salt + direct pepperoni', async () => {
    // First call: pizza BOM
    vi.mocked(mockRecipeRepo.findById)
      .mockResolvedValueOnce(PIZZA_RECIPE as never)  // pizza
      .mockResolvedValueOnce(DOUGH_RECIPE as never); // dough (recursive)
    vi.mocked(mockRecipeRepo.findIngredients)
      .mockResolvedValueOnce(PIZZA_INGREDIENTS as never)  // pizza lines
      .mockResolvedValueOnce(DOUGH_INGREDIENTS as never); // dough lines

    // Sell 1 pizza
    const result: BomExpansion = await service.expandBOM(PIZZA_RECIPE_ID, 1);

    // Dough: batch yields 6 bases; pizza needs 1 base → scaleFactor = 1/6
    const doughScale = 1 / 6;
    expect(result).toContainEqual({ itemId: FLOUR_ID,     consumedQty: 500 * doughScale });
    expect(result).toContainEqual({ itemId: WATER_ID,     consumedQty: 325 * doughScale });
    expect(result).toContainEqual({ itemId: YEAST_ID,     consumedQty: 7   * doughScale });
    expect(result).toContainEqual({ itemId: SALT_ID,      consumedQty: 10  * doughScale });
    expect(result).toContainEqual({ itemId: PEPPERONI_ID, consumedQty: 60 });

    // Should contain exactly 5 depletion lines (4 dough raw + 1 direct pepperoni)
    expect(result).toHaveLength(5);
  });

  // ── Proportional scaling for multiple units ──────────────────────────────

  it('scales sub-recipe ingredients proportionally when selling multiple units', async () => {
    vi.mocked(mockRecipeRepo.findById)
      .mockResolvedValueOnce(PIZZA_RECIPE as never)
      .mockResolvedValueOnce(DOUGH_RECIPE as never);
    vi.mocked(mockRecipeRepo.findIngredients)
      .mockResolvedValueOnce(PIZZA_INGREDIENTS as never)
      .mockResolvedValueOnce(DOUGH_INGREDIENTS as never);

    // Sell 3 pizzas
    const result: BomExpansion = await service.expandBOM(PIZZA_RECIPE_ID, 3);

    const doughScale = 3 / 6; // 3 pizzas = 3 bases from a 6-base batch = 0.5 batch
    expect(result).toContainEqual({ itemId: FLOUR_ID,     consumedQty: 500 * doughScale });
    expect(result).toContainEqual({ itemId: PEPPERONI_ID, consumedQty: 60  * 3 });
  });

  // ── Sibling sub-recipes with a shared ingredient (salt in dough + salt in sauce) ──

  it('returns separate depletion entries for the same raw item used in multiple sub-recipes', async () => {
    // Pizza BOM: dough sub-recipe + sauce sub-recipe + pepperoni raw
    const PIZZA_WITH_SAUCE_INGREDIENTS = [
      { id: 'ing-pizza-dough' as never, recipeId: PIZZA_RECIPE_ID, lineType: 'sub_recipe' as const, ingredientItemId: null, subRecipeId: DOUGH_RECIPE_ID,  quantityRequired: 1,  createdAt: '2026-01-01T00:00:00Z' },
      { id: 'ing-pizza-sauce' as never, recipeId: PIZZA_RECIPE_ID, lineType: 'sub_recipe' as const, ingredientItemId: null, subRecipeId: SAUCE_RECIPE_ID,  quantityRequired: 1,  createdAt: '2026-01-01T00:00:00Z' },
      { id: 'ing-pizza-pepp'  as never, recipeId: PIZZA_RECIPE_ID, lineType: 'ingredient' as const, ingredientItemId: PEPPERONI_ID, subRecipeId: null, quantityRequired: 60, createdAt: '2026-01-01T00:00:00Z' },
    ];

    vi.mocked(mockRecipeRepo.findById)
      .mockResolvedValueOnce(PIZZA_RECIPE as never)
      .mockResolvedValueOnce(DOUGH_RECIPE as never)
      .mockResolvedValueOnce(SAUCE_RECIPE as never);
    vi.mocked(mockRecipeRepo.findIngredients)
      .mockResolvedValueOnce(PIZZA_WITH_SAUCE_INGREDIENTS as never)
      .mockResolvedValueOnce(DOUGH_INGREDIENTS as never)   // dough: includes salt 10g
      .mockResolvedValueOnce(SAUCE_INGREDIENTS as never);  // sauce: includes salt 10g

    const result: BomExpansion = await service.expandBOM(PIZZA_RECIPE_ID, 1);

    // Both sub-recipes contribute salt separately (aggregation is the Sales pipeline's job)
    const saltLines = result.filter(r => r.itemId === SALT_ID);
    expect(saltLines).toHaveLength(2); // one from dough, one from sauce
    expect(saltLines[0].consumedQty).toBeCloseTo(10 / 6);   // dough: 10g / 6 bases
    expect(saltLines[1].consumedQty).toBeCloseTo(10 / 25);  // sauce: 10g / 25 portions
  });

  // ── Circular reference guard ─────────────────────────────────────────────

  it('throws BadRequestException when a sub-recipe creates a direct cycle (A → A)', async () => {
    const SELF_LOOP_INGREDIENTS = [
      { id: 'ing-loop' as never, recipeId: CYCLE_A_RECIPE_ID, lineType: 'sub_recipe' as const, ingredientItemId: null, subRecipeId: CYCLE_A_RECIPE_ID, quantityRequired: 1, createdAt: '2026-01-01T00:00:00Z' },
    ];
    vi.mocked(mockRecipeRepo.findById).mockResolvedValue({ id: CYCLE_A_RECIPE_ID, yieldQuantity: 1, yieldPercent: 1 } as never);
    vi.mocked(mockRecipeRepo.findIngredients).mockResolvedValue(SELF_LOOP_INGREDIENTS as never);

    await expect(service.expandBOM(CYCLE_A_RECIPE_ID, 1))
      .rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when a sub-recipe creates an indirect cycle (A → B → A)', async () => {
    const CYCLE_A_INGREDIENTS = [
      { id: 'ing-a' as never, recipeId: CYCLE_A_RECIPE_ID, lineType: 'sub_recipe' as const, ingredientItemId: null, subRecipeId: CYCLE_B_RECIPE_ID, quantityRequired: 1, createdAt: '2026-01-01T00:00:00Z' },
    ];
    const CYCLE_B_INGREDIENTS = [
      { id: 'ing-b' as never, recipeId: CYCLE_B_RECIPE_ID, lineType: 'sub_recipe' as const, ingredientItemId: null, subRecipeId: CYCLE_A_RECIPE_ID, quantityRequired: 1, createdAt: '2026-01-01T00:00:00Z' },
    ];

    vi.mocked(mockRecipeRepo.findById)
      .mockResolvedValueOnce({ id: CYCLE_A_RECIPE_ID, yieldQuantity: 1, yieldPercent: 1 } as never)
      .mockResolvedValueOnce({ id: CYCLE_B_RECIPE_ID, yieldQuantity: 1, yieldPercent: 1 } as never);
    vi.mocked(mockRecipeRepo.findIngredients)
      .mockResolvedValueOnce(CYCLE_A_INGREDIENTS as never)
      .mockResolvedValueOnce(CYCLE_B_INGREDIENTS as never);

    await expect(service.expandBOM(CYCLE_A_RECIPE_ID, 1))
      .rejects.toThrow(BadRequestException);
  });

  // ── Edge: sub-recipe has no ingredients ─────────────────────────────────

  it('returns only the raw ingredient lines when a sub-recipe has no ingredients (empty BOM)', async () => {
    const PIZZA_WITH_EMPTY_DOUGH = [
      { id: 'ing-dough' as never, recipeId: PIZZA_RECIPE_ID, lineType: 'sub_recipe' as const, ingredientItemId: null, subRecipeId: DOUGH_RECIPE_ID, quantityRequired: 1, createdAt: '2026-01-01T00:00:00Z' },
      { id: 'ing-pepp'  as never, recipeId: PIZZA_RECIPE_ID, lineType: 'ingredient' as const, ingredientItemId: PEPPERONI_ID, subRecipeId: null, quantityRequired: 60, createdAt: '2026-01-01T00:00:00Z' },
    ];

    vi.mocked(mockRecipeRepo.findById)
      .mockResolvedValueOnce(PIZZA_RECIPE as never)
      .mockResolvedValueOnce(DOUGH_RECIPE as never);
    vi.mocked(mockRecipeRepo.findIngredients)
      .mockResolvedValueOnce(PIZZA_WITH_EMPTY_DOUGH as never)
      .mockResolvedValueOnce([]); // empty dough BOM

    const result = await service.expandBOM(PIZZA_RECIPE_ID, 1);

    // Only pepperoni from the pizza level; dough contributes nothing
    expect(result).toHaveLength(1);
    expect(result).toContainEqual({ itemId: PEPPERONI_ID, consumedQty: 60 });
  });
});
