import { RestaurantId, MenuItemCostReport, VendorPriceHistoryRow } from '@ims/types';

export const REPORTING_COGS_SERVICE_TOKEN = Symbol('IReportingCogsService');

export interface IReportingCogsService {
  /**
   * Retrieves the theoretical cost of all menu items (top-level recipes)
   * based on the latest average inventory batch costs.
   */
  getMenuCostingReport(restaurantId: RestaurantId): Promise<MenuItemCostReport[]>;

  /**
   * Returns historical vendor pricing for a given item.
   */
  getVendorPriceHistory(restaurantId: RestaurantId, itemId: string): Promise<VendorPriceHistoryRow[]>;
}
