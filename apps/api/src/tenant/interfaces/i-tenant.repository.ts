import type { Restaurant, FranchiseGroup, RestaurantId, FranchiseGroupId, UserId } from '@ims/types';

export const TENANT_REPOSITORY_TOKEN = Symbol('TENANT_REPOSITORY_TOKEN');

export interface ITenantRepository {
  findById(restaurantId: RestaurantId): Promise<Restaurant | undefined>;
  findFranchiseGroupById(franchiseGroupId: FranchiseGroupId): Promise<FranchiseGroup | undefined>;
  findRestaurantsByUserId(userId: UserId): Promise<Restaurant[]>;
  createFranchiseGroup(name: string): Promise<FranchiseGroup>;
  updateFranchiseGroup(id: string, name?: string): Promise<FranchiseGroup>;
  createRestaurant(name: string, franchiseGroupId: string, timezone: string): Promise<Restaurant>;
  updateRestaurant(id: string, name?: string, timezone?: string): Promise<Restaurant>;
  deleteFranchiseGroup(id: string): Promise<void>;
  deleteRestaurant(id: string): Promise<void>;
}
