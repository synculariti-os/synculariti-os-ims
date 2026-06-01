import type { RestaurantId, PrepProductionLog, PrepPlanResponse } from '@ims/types';
import type { CreatePrepLogDto, PlanPrepDto } from '@ims/validators';

export const PREP_SERVICE_TOKEN = Symbol('IPrepService');

export interface IPrepService {
  logPrepProduction(restaurantId: RestaurantId, dto: CreatePrepLogDto): Promise<PrepProductionLog>;
  planPrepProduction(restaurantId: RestaurantId, dto: PlanPrepDto): Promise<PrepPlanResponse>;
  listPrepLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<PrepProductionLog[]>;
}
