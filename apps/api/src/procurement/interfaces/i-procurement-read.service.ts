import { RestaurantId } from '@ims/types';

export const PROCUREMENT_READ_SERVICE_TOKEN = Symbol('IProcurementReadService');

export interface IProcurementReadService {
  /**
   * Calculates the weighted average unit cost for items
   * based on the remaining quantity in inventory_batches.
   * Returns a map of ItemId to its average cost.
   */
  getAverageUnitCosts(restaurantId: RestaurantId): Promise<Record<string, number>>;
}
