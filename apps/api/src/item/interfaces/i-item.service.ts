import type { ItemWithOverride, ItemId, RestaurantId, Item, Category, UomConversion, ItemRestaurantOverride } from '@ims/types';
import type { 
  CreateItemDto, 
  UpdateItemDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CreateUomConversionDto, 
  UpdateItemOverrideDto 
} from '@ims/validators';

export interface IItemReadService {
  findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride>;
  convertUom(itemId: ItemId, qty: number, fromUom: string, toUom: string): Promise<number>;
  listParLevels(restaurantId: RestaurantId, page?: number, limit?: number): Promise<{ data: ItemWithOverride[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  listCategories(restaurantId: RestaurantId, franchiseGroupId: string): Promise<Category[]>;
}

export interface IItemWriteService extends IItemReadService {
  createItem(dto: CreateItemDto): Promise<Item>;
  updateItem(itemId: ItemId, dto: UpdateItemDto): Promise<Item>;
  createCategory(dto: CreateCategoryDto): Promise<Category>;
  updateCategory(categoryId: string, dto: UpdateCategoryDto): Promise<Category>;
  upsertUomConversion(dto: CreateUomConversionDto): Promise<UomConversion>;
  updateOverride(itemId: ItemId, restaurantId: RestaurantId, dto: UpdateItemOverrideDto): Promise<ItemRestaurantOverride>;
}

export const ITEM_READ_SERVICE_TOKEN = Symbol('IItemReadService');
export const ITEM_WRITE_SERVICE_TOKEN = Symbol('IItemWriteService');
