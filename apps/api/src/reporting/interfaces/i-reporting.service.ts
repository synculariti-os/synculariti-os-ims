import { RestaurantId } from '@ims/types';
import { VarianceReportRow, ParAlertRow, SnapshotRow } from '@ims/types';

export interface IReportingService {
  getVarianceReport(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<VarianceReportRow[]>;
  getParAlerts(restaurantId: RestaurantId): Promise<ParAlertRow[]>;
  getSnapshots(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<SnapshotRow[]>;
  runEodSnapshots(): Promise<void>;
}
