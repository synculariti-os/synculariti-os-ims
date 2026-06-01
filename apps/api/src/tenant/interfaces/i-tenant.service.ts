import type { Restaurant, FranchiseGroup, RestaurantId, FranchiseGroupId, UserId } from '@ims/types';

export const TENANT_SERVICE_TOKEN = Symbol('TENANT_SERVICE_TOKEN');

export interface ITenantService {
  getRestaurant(restaurantId: RestaurantId): Promise<Restaurant>;
  getFranchiseGroup(franchiseGroupId: FranchiseGroupId): Promise<FranchiseGroup>;
  listRestaurantsForUser(userId: UserId): Promise<Restaurant[]>;
  createFranchiseGroup(dto: import('@ims/validators').CreateFranchiseGroupDto): Promise<FranchiseGroup>;
  updateFranchiseGroup(id: string, dto: import('@ims/validators').UpdateFranchiseGroupDto): Promise<FranchiseGroup>;
  createRestaurant(dto: import('@ims/validators').CreateRestaurantDto): Promise<Restaurant>;
  updateRestaurant(id: string, dto: import('@ims/validators').UpdateRestaurantDto): Promise<Restaurant>;
  deleteFranchiseGroup(id: string): Promise<void>;
  deleteRestaurant(id: string): Promise<void>;
}
