export { INVENTORY_TRANSFER_SERVICE_TOKEN } from '../../core/core.symbols';
import { InventoryTransfer, RestaurantId, FranchiseGroupId, TransferId } from '@ims/types';
import { CreateTransferDto } from '@ims/validators';


export interface IInventoryTransferService {
  createTransfers(originRestaurantId: RestaurantId, franchiseGroupId: FranchiseGroupId, dto: CreateTransferDto): Promise<InventoryTransfer[]>;
  dispatchTransfer(originRestaurantId: RestaurantId, transferId: TransferId): Promise<InventoryTransfer>;
  receiveTransfer(destinationRestaurantId: RestaurantId, transferId: TransferId): Promise<InventoryTransfer>;
  cancelTransfer(restaurantId: RestaurantId, transferId: TransferId): Promise<InventoryTransfer>;
  listTransfers(restaurantId: RestaurantId, direction: 'IN' | 'OUT'): Promise<InventoryTransfer[]>;
}
