import type { PermissionCode, UserId, RestaurantId, FranchiseGroupId } from '@ims/types';

export interface IPermissionRepository {
  resolvePermissions(userId: UserId, restaurantId: RestaurantId): Promise<PermissionCode[]>;
  getFranchiseGroupForRestaurant(restaurantId: RestaurantId): Promise<FranchiseGroupId>;
}
