export { STOCK_QUERY_SERVICE_TOKEN } from '../../core/core.symbols';
import type { RestaurantId, ItemId, StockLevel } from '@ims/types';


export interface IStockQueryService {
  getCurrentStock(restaurantId: RestaurantId, itemId: ItemId): Promise<number>;
  getCurrentStockBulk(restaurantId: RestaurantId): Promise<StockLevel[]>;
}
