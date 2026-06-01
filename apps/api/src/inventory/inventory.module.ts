import { InventoryTransferService } from './inventory-transfer.service';
import { INVENTORY_TRANSFER_SERVICE_TOKEN } from './interfaces/i-inventory-transfer.service';
import { InventoryTransferController } from './inventory-transfer.controller';
import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { InventoryCountService } from './inventory-count.service';
import { WasteService, WASTE_REPOSITORY_TOKEN } from './waste.service';
import { PrepService, PREP_REPOSITORY_TOKEN } from './prep.service';
import { LedgerRepository } from './ledger.repository';
import { InventoryCountRepository } from './inventory-count.repository';
import { WasteRepository } from './waste.repository';
import { PrepRepository } from './prep.repository';
import { LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';
import { INVENTORY_COUNT_SERVICE_TOKEN } from './interfaces/i-inventory-count.service';
import { WASTE_SERVICE_TOKEN } from './interfaces/i-waste.service';
import { PREP_SERVICE_TOKEN } from './interfaces/i-prep.service';
import { STOCK_QUERY_SERVICE_TOKEN } from './interfaces/i-stock-query.service';
import { LEDGER_REPOSITORY_TOKEN } from './ledger.service';
import { COUNT_REPOSITORY_TOKEN } from './inventory-count.service';
import { InventoryController } from './inventory.controller';
import { InventoryCountController } from './inventory-count.controller';
import { WasteController } from './waste.controller';
import { PrepController } from './prep.controller';
import { StockQueryService } from './stock-query.service';
import { RecipeModule } from '../recipe/recipe.module';

import { ItemModule } from '../item/item.module';

@Module({
  imports: [RecipeModule, ItemModule],
  controllers: [InventoryController, InventoryCountController, WasteController, PrepController, InventoryTransferController],
  providers: [
    {
      provide: INVENTORY_TRANSFER_SERVICE_TOKEN,
      useClass: InventoryTransferService,
    },
    {
      provide: LEDGER_SERVICE_TOKEN,
      useClass: LedgerService,
    },
    {
      provide: INVENTORY_COUNT_SERVICE_TOKEN,
      useClass: InventoryCountService,
    },
    {
      provide: WASTE_SERVICE_TOKEN,
      useClass: WasteService,
    },
    {
      provide: PREP_SERVICE_TOKEN,
      useClass: PrepService,
    },
    {
      provide: LEDGER_REPOSITORY_TOKEN,
      useClass: LedgerRepository,
    },
    {
      provide: COUNT_REPOSITORY_TOKEN,
      useClass: InventoryCountRepository,
    },
    {
      provide: WASTE_REPOSITORY_TOKEN,
      useClass: WasteRepository,
    },
    {
      provide: PREP_REPOSITORY_TOKEN,
      useClass: PrepRepository,
    },
    {
      provide: STOCK_QUERY_SERVICE_TOKEN,
      useClass: StockQueryService,
    },
  ],
  exports: [INVENTORY_TRANSFER_SERVICE_TOKEN, LEDGER_SERVICE_TOKEN, INVENTORY_COUNT_SERVICE_TOKEN, WASTE_SERVICE_TOKEN, PREP_SERVICE_TOKEN, STOCK_QUERY_SERVICE_TOKEN, LEDGER_REPOSITORY_TOKEN, COUNT_REPOSITORY_TOKEN, WASTE_REPOSITORY_TOKEN, PREP_REPOSITORY_TOKEN],
})
export class InventoryModule {}
