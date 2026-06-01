/* @immutable-test — Written Red-first on: 2026-05-29. NEVER MODIFY after first GREEN. */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ItemService } from '../item.service';
import { ITEM_REPOSITORY_TOKEN } from '../interfaces/i-item.repository';
import type { IItemRepository } from '../interfaces/i-item.repository';
import type { ItemId, RestaurantId, FranchiseGroupId } from '@ims/types';
import type { CreateItemDto } from '@ims/validators';

describe('ItemService — owner XOR guard', () => {
  let service: ItemService;
  let repo: Mocked<IItemRepository>;

  const mockRestaurantId = 'rest-1' as RestaurantId;
  const mockFranchiseGroupId = 'fg-1' as FranchiseGroupId;
  const mockItemId = 'item-1' as ItemId;

  const baseDto: CreateItemDto = {
    categoryId: 'cat-1',
    name: 'Test Item',
    sku: 'TEST-001',
    type: 'RAW',
    purchasingUom: 'kg',
    inventoryUom: 'kg',
    recipeUom: null,
    invToRecipeRatio: 1,
    isActive: true,
      allergens: [],
      caloriesPerUom: 0,
      proteinGrams: 0,
      fatGrams: 0,
      carbsGrams: 0,
  };

  beforeEach(async () => {
    const mockRepo: Mocked<IItemRepository> = {
      findById: vi.fn(),
      getUomConversion: vi.fn(),
      listParLevels: vi.fn(),
      listCategories: vi.fn(),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      upsertUomConversion: vi.fn(),
      upsertItemOverride: vi.fn(),
      deleteItem: vi.fn(),
      deleteCategory: vi.fn(),
      generateSku: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        { provide: ITEM_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    repo = module.get(ITEM_REPOSITORY_TOKEN);
  });

  describe('createItem — owner resolution', () => {
    it('should call repo with restaurantId when restaurant context is provided', async () => {
      const created = { id: mockItemId, name: 'Test Item' } as never;
      repo.createItem.mockResolvedValue(created);

      await service.createItem(baseDto, mockRestaurantId, null);

      expect(repo.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantId: mockRestaurantId,
          franchiseGroupId: null,
        }),
      );
    });

    it('should call repo with franchiseGroupId when only franchise context is provided', async () => {
      const created = { id: mockItemId, name: 'Test Item' } as never;
      repo.createItem.mockResolvedValue(created);

      await service.createItem(baseDto, null, mockFranchiseGroupId);

      expect(repo.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantId: null,
          franchiseGroupId: mockFranchiseGroupId,
        }),
      );
    });

    it('should throw BadRequestException when both restaurantId and franchiseGroupId are null', async () => {
      await expect(service.createItem(baseDto, null, null)).rejects.toThrow(BadRequestException);
      expect(repo.createItem).not.toHaveBeenCalled();
    });

    it('should prefer restaurantId over franchiseGroupId when both are provided (enforces XOR)', async () => {
      const created = { id: mockItemId, name: 'Test Item' } as never;
      repo.createItem.mockResolvedValue(created);

      // Even if both are passed, service should enforce XOR by preferring restaurant
      await service.createItem(baseDto, mockRestaurantId, mockFranchiseGroupId);

      expect(repo.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantId: mockRestaurantId,
          franchiseGroupId: null,
        }),
      );
    });
  });
});
