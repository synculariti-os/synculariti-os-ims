import type { RestaurantId, WasteLog } from '@ims/types';
import type { CreateWasteLogDto } from '@ims/validators';

export interface IWasteRepository {
  createWasteLog(trx: unknown, restaurantId: RestaurantId, dto: CreateWasteLogDto): Promise<WasteLog>;
  listWasteLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<WasteLog[]>;
}
