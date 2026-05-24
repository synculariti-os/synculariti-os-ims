import type { Restaurant, FranchiseGroup, RestaurantId, FranchiseGroupId, UserId } from '@ims/types';

export const TENANT_REPOSITORY_TOKEN = Symbol('TENANT_REPOSITORY_TOKEN');

export interface ITenantRepository {
  findById(restaurantId: RestaurantId): Promise<Restaurant>;
  findFranchiseGroupById(franchiseGroupId: FranchiseGroupId): Promise<FranchiseGroup>;
  findRestaurantsByUserId(userId: UserId): Promise<Restaurant[]>;
}
