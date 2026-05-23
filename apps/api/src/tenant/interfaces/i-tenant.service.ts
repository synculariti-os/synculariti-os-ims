import type { Restaurant, FranchiseGroup, RestaurantId, FranchiseGroupId, UserId } from '@ims/types';

export const TENANT_SERVICE_TOKEN = Symbol('TENANT_SERVICE_TOKEN');

export interface ITenantService {
  getRestaurant(restaurantId: RestaurantId): Promise<Restaurant>;
  getFranchiseGroup(franchiseGroupId: FranchiseGroupId): Promise<FranchiseGroup>;
  listRestaurantsForUser(userId: UserId): Promise<Restaurant[]>;
}
