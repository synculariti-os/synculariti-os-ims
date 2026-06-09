import type { FeatureFlag, FeatureFlagKey, RestaurantId } from '@ims/types';

export interface ISettingsRepository {
  getFeatureFlag(restaurantId: RestaurantId, key: FeatureFlagKey): Promise<FeatureFlag | null>;
  getAllFeatureFlags(restaurantId: RestaurantId): Promise<FeatureFlag[]>;
  setFeatureFlag(restaurantId: RestaurantId, key: FeatureFlagKey, value: boolean): Promise<FeatureFlag>;
}
