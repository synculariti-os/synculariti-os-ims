import { Injectable, BadRequestException, Inject } from '@nestjs/common';

import type { RestaurantId, ItemId, StockLevel, LedgerReasonCode } from '@ims/types';
import { LEDGER_REASON_CODES } from '@ims/types';
import type { LedgerEntryDto } from './dto/ledger-entry.dto';
import type { ILedgerService } from './interfaces/i-ledger.service';
import type { ILedgerRepository } from './interfaces/i-ledger.repository';
import type { IItemReadService } from '../item/interfaces/i-item.service';
import { ITEM_READ_SERVICE_TOKEN } from '../item/interfaces/i-item.service';

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
    @Inject(ITEM_READ_SERVICE_TOKEN) private readonly itemService: IItemReadService,
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
    const results = await this.ledgerRepo.sumChangeAmountBulk(restaurantId);
    await Promise.all(results.map(async (r) => {
      try {
        const item = await this.itemService.findById(r.itemId, restaurantId);
        r.itemName = item.name;
        r.baseUom = item.inventoryUom;
      } catch (e) {
        r.itemName = 'Unknown Item';
        r.baseUom = 'Unknown';
      }
    }));
    return results;
  }

  async getLedgerEntries(restaurantId: RestaurantId, limit: number = 50, offset: number = 0): Promise<any[]> {
    const entries = await this.ledgerRepo.getLedgerEntries(restaurantId, limit, offset);
    await Promise.all(entries.map(async (entry) => {
      if (entry.item_id) {
        try {
          const item = await this.itemService.findById(entry.item_id, restaurantId);
          entry.item_name = item.name;
          entry.inventory_uom = item.inventoryUom;
        } catch (e) {
          entry.item_name = 'Unknown Item';
          entry.inventory_uom = 'Unknown';
        }
      }
    }));
    return entries;
  }
}
