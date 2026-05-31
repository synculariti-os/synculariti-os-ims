import type { RestaurantId, PrepProductionLog } from '@ims/types';
import type { CreatePrepLogDto } from '@ims/validators';

export const PREP_SERVICE_TOKEN = Symbol('IPrepService');

export interface IPrepService {
  logPrepProduction(restaurantId: RestaurantId, dto: CreatePrepLogDto): Promise<PrepProductionLog>;
  listPrepLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<PrepProductionLog[]>;
}
