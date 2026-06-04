import { RestaurantId, VarianceReportRow, SnapshotRow } from '@ims/types';

export interface IReportingRepository {
  getVarianceReport(restaurantId: RestaurantId, limit: number, offset: number): Promise<VarianceReportRow[]>;
  getSnapshots(restaurantId: RestaurantId, limit: number, offset: number): Promise<SnapshotRow[]>;
  getAllRestaurants(): Promise<RestaurantId[]>;
  insertSnapshots(rows: any[]): Promise<void>;
  refreshVarianceAnalytics(): Promise<void>;
}
