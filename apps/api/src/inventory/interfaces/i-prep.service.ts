export { PREP_SERVICE_TOKEN } from '../../core/core.symbols';
import type { RestaurantId, PrepProductionLog, PrepPlanResponse } from '@ims/types';
import type { CreatePrepLogDto, PlanPrepDto } from '@ims/validators';


export interface IPrepService {
  logPrepProduction(restaurantId: RestaurantId, dto: CreatePrepLogDto): Promise<PrepProductionLog>;
  planPrepProduction(restaurantId: RestaurantId, dto: PlanPrepDto): Promise<PrepPlanResponse>;
  listPrepLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<PrepProductionLog[]>;
}
