import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { InventoryCountService } from './inventory-count.service';
import { LedgerRepository } from './ledger.repository';
import { InventoryCountRepository } from './inventory-count.repository';
import { LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';
import { INVENTORY_COUNT_SERVICE_TOKEN } from './interfaces/i-inventory-count.service';
import { LEDGER_REPOSITORY_TOKEN } from './ledger.service';
import { COUNT_REPOSITORY_TOKEN } from './inventory-count.service';

@Module({
  providers: [
    {
      provide: LEDGER_SERVICE_TOKEN,
      useClass: LedgerService,
    },
    {
      provide: INVENTORY_COUNT_SERVICE_TOKEN,
      useClass: InventoryCountService,
    },
    {
      provide: LEDGER_REPOSITORY_TOKEN,
      useClass: LedgerRepository,
    },
    {
      provide: COUNT_REPOSITORY_TOKEN,
      useClass: InventoryCountRepository,
    },
  ],
  exports: [LEDGER_SERVICE_TOKEN, INVENTORY_COUNT_SERVICE_TOKEN, LEDGER_REPOSITORY_TOKEN, COUNT_REPOSITORY_TOKEN],
})
export class InventoryModule {}
