import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ItemModule } from '../item/item.module';
import { RecipeModule } from '../recipe/recipe.module';
import { ProcurementModule } from '../procurement/procurement.module';
import { ReportingCogsService } from './reporting-cogs.service';

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
      provide: 'IReportingService',
      useClass: ReportingService,
    },
    {
      provide: 'IReportingCogsService',
      useClass: ReportingCogsService,
    },
  ],
  exports: ['IReportingService', 'IReportingCogsService'],
})
export class ReportingModule {}
