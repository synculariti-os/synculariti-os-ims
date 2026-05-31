import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database, RestaurantId, WasteLog, LEDGER_REASON_CODES } from '@ims/types';
import { CreateWasteLogDto } from '@ims/validators';
import { IWasteService } from './interfaces/i-waste.service';
import { IWasteRepository } from './interfaces/i-waste.repository';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';

export const WASTE_REPOSITORY_TOKEN = Symbol('IWasteRepository');

@Injectable()
export class WasteService implements IWasteService {
  constructor(
    @Inject('DB_CLIENT') private readonly db: Kysely<Database>,
    @Inject(WASTE_REPOSITORY_TOKEN) private readonly wasteRepo: IWasteRepository,
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
  ) {}

  async logWaste(restaurantId: RestaurantId, dto: CreateWasteLogDto): Promise<WasteLog> {
    return this.db.transaction().execute(async (trx) => {
      // 1. Create the waste log
      const log = await this.wasteRepo.createWasteLog(trx, restaurantId, dto);
      
      // 2. Record the ledger entry for the deduction
      await this.ledgerService.record(trx, {
        restaurantId,
        itemId: dto.itemId as any,
        changeAmount: -dto.quantity,
        reasonCode: LEDGER_REASON_CODES.WASTE,
        referenceId: log.id,
      });
      
      return log;
    });
  }

  async listWasteLogs(restaurantId: RestaurantId, limit: number = 50, offset: number = 0): Promise<WasteLog[]> {
    return this.wasteRepo.listWasteLogs(restaurantId, limit, offset);
  }
}
