import { Injectable, Inject } from '@nestjs/common';
import { SETTINGS_REPOSITORY_TOKEN } from '../core/core.symbols';
import type { ISettingsService } from './interfaces/i-settings.service';
import type { ISettingsRepository } from './interfaces/i-settings.repository';
import type { FeatureFlag, FeatureFlagKey, RestaurantId } from '@ims/types';

@Injectable()
export class SettingsService implements ISettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY_TOKEN) private readonly repo: ISettingsRepository,
  ) {}

  async getFeatureFlag(restaurantId: RestaurantId, key: FeatureFlagKey): Promise<boolean> {
    const flag = await this.repo.getFeatureFlag(restaurantId, key);
    return flag ? flag.flagValue : false;
  }

  async getAllFeatureFlags(restaurantId: RestaurantId): Promise<FeatureFlag[]> {
    return this.repo.getAllFeatureFlags(restaurantId);
  }

  async setFeatureFlag(restaurantId: RestaurantId, key: FeatureFlagKey, value: boolean): Promise<FeatureFlag> {
    return this.repo.setFeatureFlag(restaurantId, key, value);
  }
}
