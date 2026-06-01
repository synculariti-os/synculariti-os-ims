import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ItemModule } from '../item/item.module';
import { RecipeModule } from '../recipe/recipe.module';
import { ProcurementModule } from '../procurement/procurement.module';
import { ReportingCogsService } from './reporting-cogs.service';

import { REPORTING_SERVICE_TOKEN } from './interfaces/i-reporting.service';
import { REPORTING_COGS_SERVICE_TOKEN } from './interfaces/i-reporting-cogs.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    InventoryModule,
    ItemModule,
    RecipeModule,
    ProcurementModule,
  ],
  controllers: [ReportingController],
  providers: [
    {
      provide: REPORTING_SERVICE_TOKEN,
      useClass: ReportingService,
    },
    {
      provide: REPORTING_COGS_SERVICE_TOKEN,
      useClass: ReportingCogsService,
    },
  ],
  exports: [REPORTING_SERVICE_TOKEN, REPORTING_COGS_SERVICE_TOKEN],
})
export class ReportingModule {}
