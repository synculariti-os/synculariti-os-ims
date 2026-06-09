import type { FeatureFlag, FeatureFlagKey, RestaurantId } from '@ims/types';

export { SETTINGS_SERVICE_TOKEN } from '../../core/core.symbols';

export interface ISettingsService {
  getFeatureFlag(restaurantId: RestaurantId, key: FeatureFlagKey): Promise<boolean>;
  getAllFeatureFlags(restaurantId: RestaurantId): Promise<FeatureFlag[]>;
  setFeatureFlag(restaurantId: RestaurantId, key: FeatureFlagKey, value: boolean): Promise<FeatureFlag>;
}
