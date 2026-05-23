import type { ItemWithOverride, ItemParStatus, ItemId, RestaurantId } from '@ims/types';

export interface IItemService {
  findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride>;
  convertUom(itemId: ItemId, qty: number, fromUom: string, toUom: string): Promise<number>;
  listBelowPar(restaurantId: RestaurantId): Promise<ItemParStatus[]>;
}

export const ITEM_SERVICE_TOKEN = Symbol('IItemService');
