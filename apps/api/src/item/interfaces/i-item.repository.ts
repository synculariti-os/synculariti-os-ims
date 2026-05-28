import type { Item, ItemWithOverride, ItemId, RestaurantId, UomConversion, Category, ItemRestaurantOverride } from '@ims/types';
import type { 
  UpdateItemDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CreateUomConversionDto, 
  UpdateItemOverrideDto 
} from '@ims/validators';
import type { CreateItemCommand } from './i-item.service';

export interface IItemRepository {
  findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride | null>;
  getUomConversion(itemId: ItemId, fromUom: string, toUom: string): Promise<UomConversion | null>;
  listParLevels(restaurantId: RestaurantId, page?: number, limit?: number): Promise<{ data: ItemWithOverride[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  listCategories(restaurantId: RestaurantId, franchiseGroupId: string | null): Promise<Category[]>;
  createItem(data: CreateItemCommand): Promise<Item>;
  updateItem(itemId: ItemId, data: UpdateItemDto): Promise<Item>;
  createCategory(data: CreateCategoryDto): Promise<Category>;
  updateCategory(categoryId: string, data: UpdateCategoryDto): Promise<Category>;
  upsertUomConversion(data: CreateUomConversionDto): Promise<UomConversion>;
  upsertItemOverride(itemId: ItemId, restaurantId: RestaurantId, data: UpdateItemOverrideDto): Promise<ItemRestaurantOverride>;
}

export const ITEM_REPOSITORY_TOKEN = Symbol('IItemRepository');
