import type { ItemWithOverride, ItemId, RestaurantId, FranchiseGroupId, Item, Category, UomConversion, ItemRestaurantOverride } from '@ims/types';
import type { 
  CreateItemDto, 
  UpdateItemDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CreateUomConversionDto, 
  UpdateItemOverrideDto 
} from '@ims/validators';

/** Backend-only: item creation command with owner context injected by the service. */
export type CreateItemCommand = CreateItemDto & {
  restaurantId: RestaurantId | null;
  franchiseGroupId: FranchiseGroupId | null;
};


/** Backend-only: category creation command with owner context. */
export type CreateCategoryCommand = CreateCategoryDto & {
  restaurantId: RestaurantId | null;
  franchiseGroupId: FranchiseGroupId | null;
};

export interface IItemReadService {
  findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride>;
  convertUom(itemId: ItemId, qty: number, fromUom: string, toUom: string): Promise<number>;
  listParLevels(restaurantId: RestaurantId, page?: number, limit?: number): Promise<{ data: ItemWithOverride[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  listCategories(restaurantId: RestaurantId, franchiseGroupId: string | null): Promise<Category[]>;
}

export interface IItemWriteService extends IItemReadService {
  createItem(dto: CreateItemDto, restaurantId: RestaurantId | null, franchiseGroupId: string | null): Promise<Item>;
  updateItem(itemId: ItemId, dto: UpdateItemDto): Promise<Item>;
  createCategory(dto: CreateCategoryDto, restaurantId: RestaurantId | null, franchiseGroupId: string | null): Promise<Category>;
  updateCategory(categoryId: string, dto: UpdateCategoryDto): Promise<Category>;
  upsertUomConversion(dto: CreateUomConversionDto): Promise<UomConversion>;
  updateOverride(itemId: ItemId, restaurantId: RestaurantId, dto: UpdateItemOverrideDto): Promise<ItemRestaurantOverride>;
}

export const ITEM_READ_SERVICE_TOKEN = Symbol('IItemReadService');
export const ITEM_WRITE_SERVICE_TOKEN = Symbol('IItemWriteService');
