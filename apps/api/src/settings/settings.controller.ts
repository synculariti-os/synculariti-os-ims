import { Controller, Get, Put, Body, Param, Inject } from '@nestjs/common';
import { SETTINGS_SERVICE_TOKEN } from './interfaces/i-settings.service';
import type { ISettingsService } from './interfaces/i-settings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSION_CODES } from '@ims/types';
import type { JwtPayload, FeatureFlagKey } from '@ims/types';

@Controller('settings')
export class SettingsController {
  constructor(
    @Inject(SETTINGS_SERVICE_TOKEN) private readonly settingsService: ISettingsService,
  ) {}

  @Get('feature-flags')
  async getAllFeatureFlags(@CurrentUser() user: JwtPayload) {
    const data = await this.settingsService.getAllFeatureFlags(user.restaurantId);
    return { data };
  }

  @Get('feature-flags/:key')
  async getFeatureFlag(@CurrentUser() user: JwtPayload, @Param('key') key: string) {
    const value = await this.settingsService.getFeatureFlag(user.restaurantId, key as FeatureFlagKey);
    return { data: value };
  }

  @Put('feature-flags/:key')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES) // Typically feature flags require admin access to change
  async setFeatureFlag(
    @CurrentUser() user: JwtPayload,
    @Param('key') key: string,
    @Body('value') value: boolean,
  ) {
    const data = await this.settingsService.setFeatureFlag(user.restaurantId, key as FeatureFlagKey, value);
    return { data };
  }
}
