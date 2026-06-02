import type { PermissionCode, UserId, RestaurantId, } from '@ims/types';

export interface IPermissionRepository {
  resolvePermissions(userId: UserId, restaurantId: RestaurantId): Promise<PermissionCode[]>;
}
