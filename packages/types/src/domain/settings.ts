import type { RestaurantId } from '../branded';

export type FeatureFlagKey = string;

export interface FeatureFlag {
  id: string;
  restaurantId: RestaurantId;
  flagKey: FeatureFlagKey;
  flagValue: boolean;
  createdAt: string;
  updatedAt: string;
}
