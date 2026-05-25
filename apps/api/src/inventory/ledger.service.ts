import { Injectable, BadRequestException, Inject } from '@nestjs/common';

import type { RestaurantId, ItemId, StockLevel, LedgerReasonCode } from '@ims/types';
import { LEDGER_REASON_CODES } from '@ims/types';
import type { LedgerEntryDto } from './dto/ledger-entry.dto';
import type { ILedgerService } from './interfaces/i-ledger.service';
import type { ILedgerRepository } from './interfaces/i-ledger.repository';

export const LEDGER_REPOSITORY_TOKEN = Symbol('ILedgerRepository');

const VALID_REASON_CODES = new Set<string>(Object.values(LEDGER_REASON_CODES));

/**
 * ⚠️ THE ONLY class in the codebase allowed to INSERT INTO inventory_ledger.
 * All other services call this service. Never bypass this.
 */
@Injectable()
export class LedgerService implements ILedgerService {
  constructor(
    @Inject(LEDGER_REPOSITORY_TOKEN) private readonly ledgerRepo: ILedgerRepository,
  ) {}

  async record(trx: unknown, entry: LedgerEntryDto): Promise<void> {
    // Guard 1: changeAmount must be non-zero
    if (entry.changeAmount === 0) {
      throw new BadRequestException('changeAmount must not be zero — no-op entries are not allowed');
    }

    // Guard 2: reasonCode must be a known value
    if (!VALID_REASON_CODES.has(entry.reasonCode)) {
      throw new BadRequestException(`Unknown ledger reasonCode: ${entry.reasonCode}`);
    }

    await this.ledgerRepo.insertEntry(trx, {
      restaurant_id: entry.restaurantId,
      item_id: entry.itemId,
      change_amount: entry.changeAmount,
      reason_code: entry.reasonCode,
      reference_id: entry.referenceId ?? null,
    });
  }

  async getCurrentStock(restaurantId: RestaurantId, itemId: ItemId): Promise<number> {
    return this.ledgerRepo.sumChangeAmount(restaurantId, itemId);
  }

  async getCurrentStockBulk(restaurantId: RestaurantId): Promise<StockLevel[]> {
    return this.ledgerRepo.sumChangeAmountBulk(restaurantId);
  }

  async getLedgerEntries(restaurantId: RestaurantId, limit: number = 50, offset: number = 0): Promise<any[]> {
    return this.ledgerRepo.getLedgerEntries(restaurantId, limit, offset);
  }
}
