import { Module } from '@nestjs/common';
import { ProcurementService, PROCUREMENT_REPOSITORY_TOKEN } from './procurement.service';
import { PROCUREMENT_SERVICE_TOKEN } from './interfaces/i-procurement.service';
import { ProcurementRepository } from './procurement.repository';
import { InventoryModule } from '../inventory/inventory.module';
import { ItemModule } from '../item/item.module';

@Module({
  imports: [InventoryModule, ItemModule],
  providers: [
    {
      provide: PROCUREMENT_SERVICE_TOKEN,
      useClass: ProcurementService,
    },
    {
      provide: PROCUREMENT_REPOSITORY_TOKEN,
      useClass: ProcurementRepository,
    },
  ],
  exports: [PROCUREMENT_SERVICE_TOKEN],
})
export class ProcurementModule {}
