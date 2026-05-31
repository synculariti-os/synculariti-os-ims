import type { RestaurantId, PrepProductionLog } from '@ims/types';
import type { CreatePrepLogDto } from '@ims/validators';

export interface IPrepRepository {
  createPrepLog(trx: unknown, restaurantId: RestaurantId, dto: CreatePrepLogDto): Promise<PrepProductionLog>;
  listPrepLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<PrepProductionLog[]>;
}
