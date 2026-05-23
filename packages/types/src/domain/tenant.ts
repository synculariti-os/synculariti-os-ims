import type { FranchiseGroupId, RestaurantId } from '../branded';

export interface FranchiseGroup {
  id: FranchiseGroupId;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: RestaurantId;
  franchiseGroupId: FranchiseGroupId;
  name: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}
