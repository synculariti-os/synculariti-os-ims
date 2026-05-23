// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ItemService } from '../item.service';
import { ITEM_REPOSITORY_TOKEN } from '../interfaces/i-item.repository';
import type { IItemRepository } from '../interfaces/i-item.repository';
import type { ItemWithOverride, ItemId, RestaurantId, UomConversion, ItemRestaurantOverride } from '@ims/types';

describe('ItemService', () => {
  let service: ItemService;
  let repo: Mocked<IItemRepository>;

  const mockRestaurantId = 'rest-1' as RestaurantId;
  const mockItemId = 'item-1' as ItemId;

  const mockItem: ItemWithOverride = {
    id: mockItemId,
    franchiseGroupId: null,
    restaurantId: mockRestaurantId,
    categoryId: 'cat-1' as any,
    name: 'Tomato',
    sku: 'TOM-01',
    type: 'RAW',
    purchasingUom: 'kg',
    inventoryUom: 'g',
    recipeUom: 'g',
    invToRecipeRatio: 1,
    isActive: true,
    createdAt: '2026-05-23T00:00:00Z',
    updatedAt: '2026-05-23T00:00:00Z',
    override: undefined,
    effectiveParLevel: 0,
    effectiveIsActive: true,
  };

  const mockOverride: ItemRestaurantOverride = {
    id: 'override-1',
    itemId: 'item-1' as ItemId,
    restaurantId: 'rest-1' as RestaurantId,
    parLevel: 50,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockItemWithOverride: ItemWithOverride = {
    ...mockItem,
    override: mockOverride,
    effectiveParLevel: 50,
    effectiveIsActive: true,
  };

  beforeEach(async () => {
    const mockRepo: Mocked<IItemRepository> = {
      findById: vi.fn(),
      getUomConversion: vi.fn(),
      listParLevels: vi.fn(),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      upsertUomConversion: vi.fn(),
      upsertItemOverride: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: ITEM_REPOSITORY_TOKEN,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    repo = module.get(ITEM_REPOSITORY_TOKEN);
  });

  describe('findById', () => {
    it('should return item if found', async () => {
      repo.findById.mockResolvedValue(mockItem);
      const result = await service.findById(mockItemId, mockRestaurantId);
      expect(result).toEqual(mockItem);
      expect(repo.findById).toHaveBeenCalledWith(mockItemId, mockRestaurantId);
    });

    it('should throw NotFoundException if item not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById(mockItemId, mockRestaurantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('convertUom', () => {
    it('should return same quantity if fromUom and toUom are identical', async () => {
      const result = await service.convertUom(mockItemId, 10, 'kg', 'kg');
      expect(result).toBe(10);
      expect(repo.getUomConversion).not.toHaveBeenCalled();
    });

    it('should multiply quantity by factor if conversion exists', async () => {
      repo.getUomConversion.mockResolvedValue({ multiplierFactor: 1000 } as UomConversion);
      const result = await service.convertUom(mockItemId, 2.5, 'kg', 'g');
      expect(result).toBe(2500);
      expect(repo.getUomConversion).toHaveBeenCalledWith(mockItemId, 'kg', 'g');
    });

    it('should throw BadRequestException if conversion not found', async () => {
      repo.getUomConversion.mockResolvedValue(null);
      await expect(service.convertUom(mockItemId, 1, 'kg', 'lb')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listParLevels', () => {
    it('should return paginated list of items with their par levels', async () => {
      const paginatedResult = { data: [mockItem], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } };
      repo.listParLevels.mockResolvedValue(paginatedResult);
      const result = await service.listParLevels(mockRestaurantId, 1, 50);
      expect(result).toEqual(paginatedResult);
      expect(repo.listParLevels).toHaveBeenCalledWith(mockRestaurantId, 1, 50);
    });
  });
});
