import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemRepository } from './item.repository';
import { ITEM_READ_SERVICE_TOKEN, ITEM_WRITE_SERVICE_TOKEN } from './interfaces/i-item.service';
import { ITEM_REPOSITORY_TOKEN } from './interfaces/i-item.repository';
import { ItemController } from './item.controller';

@Module({
  controllers: [ItemController],
  providers: [
    {
      provide: ITEM_REPOSITORY_TOKEN,
      useClass: ItemRepository,
    },
    {
      provide: ITEM_READ_SERVICE_TOKEN,
      useClass: ItemService,
    },
    {
      provide: ITEM_WRITE_SERVICE_TOKEN,
      useExisting: ITEM_READ_SERVICE_TOKEN,
    },
  ],
  exports: [ITEM_READ_SERVICE_TOKEN, ITEM_WRITE_SERVICE_TOKEN],
})
export class ItemModule {}
