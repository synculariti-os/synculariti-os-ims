// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ItemController } from '../item.controller';
import { ITEM_WRITE_SERVICE_TOKEN } from '../interfaces/i-item.service';
import type { IItemWriteService } from '../interfaces/i-item.service';
import type { JwtPayload, RestaurantId, ItemId } from '@ims/types';

describe('ItemController', () => {
  let controller: ItemController;
  let service: Mocked<IItemWriteService>;

  const mockUser: JwtPayload = {
    sub: 'user-1' as never,
    email: 'test@test.com',
    restaurantId: 'rest-1' as RestaurantId,
    franchiseGroupId: 'franchise-1' as never,
    permissions: [],
  };

  beforeEach(async () => {
    const mockService: Mocked<IItemWriteService> = {
      findById: vi.fn(),
      convertUom: vi.fn(),
      listParLevels: vi.fn(),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      listCategories: vi.fn(),
      upsertUomConversion: vi.fn(),
      updateOverride: vi.fn(),
      deleteItem: vi.fn(),
      deleteCategory: vi.fn(),
      generateSku: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [
        {
          provide: ITEM_WRITE_SERVICE_TOKEN,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ItemController>(ItemController);
    service = module.get(ITEM_WRITE_SERVICE_TOKEN);
  });

  describe('findById', () => {
    it('should call service.findById with correct params', async () => {
      const mockResult = { id: 'item-1' } as never;
      service.findById.mockResolvedValue(mockResult);

      const result = await controller.findById('item-1', mockUser);
      
      expect(service.findById).toHaveBeenCalledWith('item-1', mockUser.restaurantId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('listParLevels', () => {
    it('should call service.listParLevels', async () => {
      const mockResult = [{ id: 'item-1' }] as never;
      service.listParLevels.mockResolvedValue(mockResult);

      const result = await controller.listParLevels(mockUser);
      
      expect(service.listParLevels).toHaveBeenCalledWith(mockUser.restaurantId, 1, 50);
      expect(result).toEqual(mockResult);
    });
  });

  describe('createItem', () => {
    it('should call service.createItem', async () => {
      const mockDto = { name: 'Item 1' } as never;
      service.createItem.mockResolvedValue(mockDto);

      const result = await controller.createItem(mockUser, mockDto);
      
      expect(service.createItem).toHaveBeenCalledWith(mockDto, mockUser.restaurantId, mockUser.franchiseGroupId);
      expect(result).toEqual(mockDto);
    });
  });

  describe('listCategories', () => {
    it('should call service.listCategories', async () => {
      const mockResult = [{ id: 'cat-1', name: 'Veg' }] as never;
      service.listCategories.mockResolvedValue(mockResult);

      const result = await controller.listCategories(mockUser);
      
      expect(service.listCategories).toHaveBeenCalledWith(mockUser.restaurantId, mockUser.franchiseGroupId);
      expect(result).toEqual(mockResult);
    });
  });
});
