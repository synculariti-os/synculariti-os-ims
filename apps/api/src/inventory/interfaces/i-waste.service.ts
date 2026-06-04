export { WASTE_SERVICE_TOKEN } from '../../core/core.symbols';
import type { RestaurantId, WasteLog } from '@ims/types';
import type { CreateWasteLogDto } from '@ims/validators';


export interface IWasteService {
  logWaste(restaurantId: RestaurantId, dto: CreateWasteLogDto): Promise<WasteLog>;
  listWasteLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<WasteLog[]>;
}
