import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';
import { SALES_SERVICE_TOKEN } from './interfaces/i-sales.service';
import { SALES_REPOSITORY_TOKEN } from './interfaces/i-sales.repository';
import { SALES_FILE_PARSER_FACTORY_TOKEN } from './interfaces/i-sales-file-parser';
import { SalesParserFactory } from './parsers/sales-parser.factory';
import { RecipeModule } from '../recipe/recipe.module';
import { InventoryModule } from '../inventory/inventory.module';

import { SalesImportProcessor } from './sales.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sales_import',
    }),
    RecipeModule,
    InventoryModule,
  ],
  controllers: [SalesController],
  providers: [
    {
      provide: SALES_SERVICE_TOKEN,
      useClass: SalesService,
    },
    {
      provide: SALES_REPOSITORY_TOKEN,
      useClass: SalesRepository,
    },
    {
      provide: SALES_FILE_PARSER_FACTORY_TOKEN,
      useClass: SalesParserFactory,
    },
    SalesImportProcessor,
  ],
  exports: [SALES_SERVICE_TOKEN],
})
export class SalesModule {}
