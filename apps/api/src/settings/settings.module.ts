import { Module, Global } from '@nestjs/common';
import { SETTINGS_SERVICE_TOKEN, SETTINGS_REPOSITORY_TOKEN } from '../core/core.symbols';
import { SettingsService } from './settings.service';
import { SettingsRepository } from './settings.repository';
import { SettingsController } from './settings.controller';

@Global()
@Module({
  controllers: [SettingsController],
  providers: [
    {
      provide: SETTINGS_SERVICE_TOKEN,
      useClass: SettingsService,
    },
    {
      provide: SETTINGS_REPOSITORY_TOKEN,
      useClass: SettingsRepository,
    },
  ],
  exports: [SETTINGS_SERVICE_TOKEN],
})
export class SettingsModule {}
