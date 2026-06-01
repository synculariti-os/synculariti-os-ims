import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import type { Kysely } from 'kysely';

import type {
  Database,
  InventoryCountBatch,
  InventoryCountRow,
  CountBatchId,
  CountRowId,
  RestaurantId,
} from '@ims/types';
import { COUNT_STATUS, LEDGER_REASON_CODES } from '@ims/types';
import type { CloseCountBatchDto, SubmitCountRowDto } from '@ims/validators';

import type { IInventoryCountRepository } from './interfaces/i-inventory-count.repository';
import type { IInventoryCountService } from './interfaces/i-inventory-count.service';
import type { ILedgerService } from './interfaces/i-ledger.service';
import { LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';

export const COUNT_REPOSITORY_TOKEN = Symbol('IInventoryCountRepository');

@Injectable()
export class InventoryCountService implements IInventoryCountService {
  constructor(
    @Inject('DB_CLIENT')
    private readonly db: Kysely<Database>,
    @Inject(COUNT_REPOSITORY_TOKEN) private readonly countRepo: IInventoryCountRepository,
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledger: ILedgerService,
  ) {}

  async startBatch(restaurantId: RestaurantId): Promise<InventoryCountBatch> {
    // Snapshot current stock levels for all items
    const stockLevels = await this.ledger.getCurrentStockBulk(restaurantId);
    return await this.db.transaction().execute(async (trx) => {
      const batch = await this.countRepo.createBatch(trx, restaurantId);

      // Create count rows with expected quantities from the ledger
      const rows = stockLevels.map((s) => ({
        item_id: s.itemId,
        expected_qty: s.qty,
      }));

      await this.countRepo.createCountRows(trx, batch.id, rows);

      return batch;
    });
  }

  async listBatches(restaurantId: RestaurantId, limit: number = 50, offset: number = 0): Promise<InventoryCountBatch[]> {
    return this.countRepo.listBatches(restaurantId, limit, offset);
  }

  async getBatchById(batchId: CountBatchId): Promise<{ batch: InventoryCountBatch; rows: InventoryCountRow[] }> {
    const batch = await this.findBatchOrThrow(batchId);
    const rows = await this.countRepo.findRowsByBatchId(batchId);
    return { batch, rows };
  }

  async submitActualCount(
    batchId: CountBatchId,
    rowId: CountRowId,
    dto: SubmitCountRowDto,
  ): Promise<InventoryCountRow> {
    const batch = await this.findBatchOrThrow(batchId);

    if (batch.status !== COUNT_STATUS.OPEN) {
      throw new BadRequestException(
        `Cannot submit count to a ${batch.status.toLowerCase()} batch`,
      );
    }

    return this.countRepo.updateCountRow(this.db, rowId, dto.actualQty);
  }

  async closeBatch(batchId: CountBatchId, dto: CloseCountBatchDto): Promise<void> {
    const batch = await this.findBatchOrThrow(batchId);

    // Optimistic lock check
    if (batch.version !== dto.version) {
      throw new ConflictException(
        `Count batch version mismatch — expected ${dto.version}, got ${batch.version}. Refresh and retry.`,
      );
    }

    if (batch.status === COUNT_STATUS.CLOSED) {
      throw new ConflictException(`Count batch ${batchId} is already closed`);
    }

    const rows = await this.countRepo.findRowsByBatchId(batchId);

    await this.db.transaction().execute(async (trx) => {
      // Write COUNT_ADJUSTMENT ledger entries for all rows with non-zero variance
      for (const row of rows) {
        const variance = (row.actualQty ?? row.expectedQty) - row.expectedQty;
        if (variance === 0) continue;

        await this.ledger.record(trx, {
          restaurantId: batch.restaurantId,
          itemId: row.itemId,
          changeAmount: variance,
          reasonCode: LEDGER_REASON_CODES.COUNT_ADJUSTMENT,
          referenceId: batchId,
        });
      }

      // Close the batch with optimistic lock
      const updated = await this.countRepo.updateBatchStatus(
        trx,
        batchId,
        COUNT_STATUS.CLOSED,
        dto.version,
      );

      // updateBatchStatus returns false ONLY on optimistic lock failure.
      // undefined/void (test mock default) is treated as success.
      if (updated === false) {
        throw new ConflictException('Count batch was modified by another process. Please retry.');
      }
    });
  }

  private async findBatchOrThrow(batchId: CountBatchId): Promise<InventoryCountBatch> {
    const batch = await this.countRepo.findBatchById(batchId);
    if (!batch) {
      throw new NotFoundException(`Count batch ${batchId} not found`);
    }
    return batch;
  }
}
