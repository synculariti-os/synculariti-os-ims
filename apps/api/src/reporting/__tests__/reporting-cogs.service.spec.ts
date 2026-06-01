// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, Mocked, beforeEach } from 'vitest';
import { ReportingCogsService } from '../reporting-cogs.service';
import { RECIPE_SERVICE_TOKEN } from '../../recipe/interfaces/i-recipe.service';
import { PROCUREMENT_READ_SERVICE_TOKEN } from '../../procurement/interfaces/i-procurement-read.service';
import { IRecipeService } from '../../recipe/interfaces/i-recipe.service';
import { IProcurementReadService } from '../../procurement/interfaces/i-procurement-read.service';
import { IItemReadService, ITEM_READ_SERVICE_TOKEN } from '../../item/interfaces/i-item.service';
import { RestaurantId, Recipe, BomExpansionLine, ItemId, RecipeId } from '@ims/types';

describe('ReportingCogsService', () => {
  let service: ReportingCogsService;
  let mockRecipeService: Mocked<IRecipeService>;
  let mockProcurementReadService: Mocked<IProcurementReadService>;
  let mockItemReadService: Mocked<IItemReadService>;

  const mockRestaurantId = 'rest-1' as RestaurantId;

  beforeEach(async () => {
    mockRecipeService = {
      listMenuRecipes: vi.fn(),
      expandBOM: vi.fn(),
    } as unknown;

    mockProcurementReadService = {
      getAverageUnitCosts: vi.fn(),
    } as unknown;

    mockItemReadService = {
      findById: vi.fn(),
    } as unknown;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingCogsService,
        {
          provide: RECIPE_SERVICE_TOKEN,
          useValue: mockRecipeService,
        },
        {
          provide: PROCUREMENT_READ_SERVICE_TOKEN,
          useValue: mockProcurementReadService,
        },
        {
          provide: ITEM_READ_SERVICE_TOKEN,
          useValue: mockItemReadService,
        },
      ],
    }).compile();

    service = module.get<ReportingCogsService>(ReportingCogsService);
  });

  describe('getMenuCostingReport', () => {
    it('returns empty array when no menu recipes exist', async () => {
      (mockRecipeService.listMenuRecipes as unknown).mockResolvedValueOnce([]);
      (mockProcurementReadService.getAverageUnitCosts as unknown).mockResolvedValueOnce({});

      const result = await service.getMenuCostingReport(mockRestaurantId);
      expect(result).toEqual([]);
    });

    it('calculates COGS correctly for a menu item with multiple ingredients', async () => {
      const mockRecipes: Recipe[] = [
        {
          id: 'recipe-1' as RecipeId,
          recipeName: 'Pepperoni Pizza',
          producesItemId: null,
          franchiseGroupId: null,
          restaurantId: mockRestaurantId,
          yieldQuantity: 1,
          yieldPercent: 100,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const mockBom: BomExpansionLine[] = [
        { itemId: 'dough-id' as ItemId, consumedQty: 2 },
        { itemId: 'cheese-id' as ItemId, consumedQty: 0.5 },
      ];

      const mockCosts = {
        'dough-id': 1.5, // $1.5 per kg
        'cheese-id': 10.0, // $10 per kg
      };

      (mockRecipeService.listMenuRecipes as unknown).mockResolvedValueOnce(mockRecipes);
      (mockRecipeService.expandBOM as unknown).mockResolvedValueOnce(mockBom);
      (mockProcurementReadService.getAverageUnitCosts as unknown).mockResolvedValueOnce(mockCosts);
      (mockItemReadService.findById as unknown)
        .mockResolvedValueOnce({ name: 'Dough', inventoryUom: 'kg' })
        .mockResolvedValueOnce({ name: 'Cheese', inventoryUom: 'kg' });

      const result = await service.getMenuCostingReport(mockRestaurantId);

      expect(result).toHaveLength(1);
      expect(result[0].recipeName).toBe('Pepperoni Pizza');
      // 2 * 1.5 + 0.5 * 10 = 3.0 + 5.0 = 8.0
      expect(result[0].totalCost).toBe(8.0);
      expect(result[0].ingredients).toHaveLength(2);
      expect(result[0].ingredients[0].totalCost).toBe(3.0);
      expect(result[0].ingredients[1].totalCost).toBe(5.0);
    });

    it('defaults unit cost to 0 when an ingredient has no inventory batches', async () => {
      const mockRecipes: Recipe[] = [
        {
          id: 'recipe-2' as RecipeId,
          recipeName: 'Water',
          producesItemId: null,
          franchiseGroupId: null,
          restaurantId: mockRestaurantId,
          yieldQuantity: 1,
          yieldPercent: 100,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const mockBom: BomExpansionLine[] = [
        { itemId: 'tap-water-id' as ItemId, consumedQty: 1 },
      ];

      (mockRecipeService.listMenuRecipes as unknown).mockResolvedValueOnce(mockRecipes);
      (mockRecipeService.expandBOM as unknown).mockResolvedValueOnce(mockBom);
      // No costs returned
      (mockProcurementReadService.getAverageUnitCosts as unknown).mockResolvedValueOnce({});
      (mockItemReadService.findById as unknown).mockResolvedValueOnce({ name: 'Tap Water', inventoryUom: 'L' });

      const result = await service.getMenuCostingReport(mockRestaurantId);

      expect(result).toHaveLength(1);
      expect(result[0].totalCost).toBe(0);
      expect(result[0].ingredients[0].unitCost).toBe(0);
      expect(result[0].ingredients[0].totalCost).toBe(0);
    });
  });
});
