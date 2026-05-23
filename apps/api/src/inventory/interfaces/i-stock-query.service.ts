import type { RestaurantId, ItemId, StockLevel } from '@ims/types';

export const STOCK_QUERY_SERVICE_TOKEN = Symbol('STOCK_QUERY_SERVICE_TOKEN');

export interface IStockQueryService {
  getCurrentStock(restaurantId: RestaurantId, itemId: ItemId): Promise<number>;
  getCurrentStockBulk(restaurantId: RestaurantId): Promise<StockLevel[]>;
}
