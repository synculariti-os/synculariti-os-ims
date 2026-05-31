import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ItemModule } from '../item/item.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    InventoryModule,
    ItemModule,
  ],
  controllers: [ReportingController],
  providers: [
    {
      provide: 'IReportingService',
      useClass: ReportingService,
    },
  ],
  exports: ['IReportingService'],
})
export class ReportingModule {}
