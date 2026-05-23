import type { Item, ItemWithOverride, ItemId, RestaurantId, UomConversion } from '@ims/types';

export interface IItemRepository {
  findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride | null>;
  getUomConversion(itemId: ItemId, fromUom: string, toUom: string): Promise<UomConversion | null>;
  listParLevels(restaurantId: RestaurantId): Promise<ItemWithOverride[]>;
  createItem(data: any): Promise<any>;
  updateItem(itemId: ItemId, data: any): Promise<any>;
  createCategory(data: any): Promise<any>;
  updateCategory(categoryId: string, data: any): Promise<any>;
  upsertUomConversion(data: any): Promise<any>;
  upsertItemOverride(itemId: ItemId, restaurantId: RestaurantId, data: any): Promise<any>;
}

export const ITEM_REPOSITORY_TOKEN = Symbol('IItemRepository');
