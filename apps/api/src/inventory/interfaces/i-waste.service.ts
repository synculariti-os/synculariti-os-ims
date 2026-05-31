import type { RestaurantId, WasteLog } from '@ims/types';
import type { CreateWasteLogDto } from '@ims/validators';

export const WASTE_SERVICE_TOKEN = Symbol('IWasteService');

export interface IWasteService {
  logWaste(restaurantId: RestaurantId, dto: CreateWasteLogDto): Promise<WasteLog>;
  listWasteLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<WasteLog[]>;
}
