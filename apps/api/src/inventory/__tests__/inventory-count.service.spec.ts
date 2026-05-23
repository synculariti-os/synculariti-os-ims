/* @immutable-test — Written Red-first on: 2026-05-23. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';

import { InventoryCountService } from '../inventory-count.service';
import type { IInventoryCountRepository } from '../interfaces/i-inventory-count.repository';
import type { ILedgerService } from '../interfaces/i-ledger.service';
import { COUNT_STATUS, LEDGER_REASON_CODES } from '@ims/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const RESTAURANT_ID = 'rest-uuid-001' as any;
const ITEM_ID_A = 'item-uuid-aaa' as any;
const ITEM_ID_B = 'item-uuid-bbb' as any;
const BATCH_ID = 'batch-uuid-001' as any;
const ROW_ID_A = 'row-uuid-aaa' as any;

const OPEN_BATCH = {
  id: BATCH_ID,
  restaurantId: RESTAURANT_ID,
  status: COUNT_STATUS.OPEN,
  snapshotTimestamp: '2026-05-23T10:00:00Z',
  version: 0,
  createdAt: '2026-05-23T10:00:00Z',
  updatedAt: '2026-05-23T10:00:00Z',
};

const CLOSED_BATCH = { ...OPEN_BATCH, status: COUNT_STATUS.CLOSED, version: 1 };

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockDb = {
  transaction: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockImplementation((fn: (trx: unknown) => Promise<void>) => fn({})),
  })),
};

const mockCountRepo: IInventoryCountRepository = {
  createBatch: vi.fn() as any,
  findBatchById: vi.fn() as any,
  updateBatchStatus: vi.fn() as any,
  findRowsByBatchId: vi.fn() as any,
  updateCountRow: vi.fn() as any,
  createCountRows: vi.fn() as any,
};

const mockLedgerService: ILedgerService = {
  record: vi.fn(),
  getCurrentStock: vi.fn(),
  getCurrentStockBulk: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('InventoryCountService', () => {
  let service: InventoryCountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryCountService(mockDb as any, mockCountRepo, mockLedgerService);
  });

  const closeDto = (version: number) => ({
    batchId: BATCH_ID,
    version,
    rows: [{ itemId: ITEM_ID_A, actualQty: 45 }],
  });

  // ── startBatch ────────────────────────────────────────────────────────────

  describe('startBatch()', () => {
    it('creates a count batch and snapshots current stock as expectedQty', async () => {
      vi.mocked(mockLedgerService.getCurrentStockBulk).mockResolvedValueOnce([
        { itemId: ITEM_ID_A, qty: 50 },
        { itemId: ITEM_ID_B, qty: 30 },
      ]);
      vi.mocked(mockCountRepo.createBatch).mockResolvedValueOnce(OPEN_BATCH as any);

      const result = await service.startBatch(RESTAURANT_ID);

      expect(result.status).toBe(COUNT_STATUS.OPEN);
      // Must snapshot current stock into count rows
      expect(mockCountRepo.createCountRows).toHaveBeenCalledWith(
        expect.anything(), // DB reference
        BATCH_ID,
        expect.arrayContaining([
          expect.objectContaining({ item_id: ITEM_ID_A, expected_qty: 50 }),
          expect.objectContaining({ item_id: ITEM_ID_B, expected_qty: 30 }),
        ]),
      );
    });
  });

  // ── submitActualCount ─────────────────────────────────────────────────────

  describe('submitActualCount()', () => {
    it('updates actualQty and computes varianceQty = actual - expected', async () => {
      vi.mocked(mockCountRepo.findBatchById).mockResolvedValueOnce(OPEN_BATCH as any);
      vi.mocked(mockCountRepo.updateCountRow).mockResolvedValueOnce({
        id: ROW_ID_A, batchId: BATCH_ID, itemId: ITEM_ID_A,
        expectedQty: 50, actualQty: 45, varianceQty: -5,
      } as any);

      const result = await service.submitActualCount(BATCH_ID, ROW_ID_A, { itemId: ITEM_ID_A, actualQty: 45 });

      expect(result.varianceQty).toBe(-5);
    });

    it('throws when submitting to a CLOSED batch', async () => {
      vi.mocked(mockCountRepo.findBatchById).mockResolvedValueOnce(CLOSED_BATCH as any);

      await expect(
        service.submitActualCount(BATCH_ID, ROW_ID_A, { itemId: ITEM_ID_A, actualQty: 45 }),
      ).rejects.toThrow(/cannot submit.*closed/i);
    });
  });

  // ── closeBatch ────────────────────────────────────────────────────────────

  describe('closeBatch()', () => {
    it('ACID: writes COUNT_ADJUSTMENT ledger entries and sets status to CLOSED', async () => {
      vi.mocked(mockCountRepo.findBatchById).mockResolvedValueOnce(OPEN_BATCH as any);
      vi.mocked(mockCountRepo.findRowsByBatchId).mockResolvedValueOnce([
        { id: ROW_ID_A, batchId: BATCH_ID, itemId: ITEM_ID_A, expectedQty: 50, actualQty: 45, varianceQty: -5 },
        { id: 'row-uuid-bbb' as any, batchId: BATCH_ID, itemId: ITEM_ID_B, expectedQty: 30, actualQty: 30, varianceQty: 0 },
      ] as any);

      await service.closeBatch(BATCH_ID, closeDto(0));

      // Only rows with non-zero variance get ledger entries
      expect(mockLedgerService.record).toHaveBeenCalledTimes(1);
      expect(mockLedgerService.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          itemId: ITEM_ID_A,
          changeAmount: -5,
          reasonCode: LEDGER_REASON_CODES.COUNT_ADJUSTMENT,
          referenceId: BATCH_ID,
        }),
      );
      expect(mockCountRepo.updateBatchStatus).toHaveBeenCalledWith(
        expect.anything(),
        BATCH_ID,
        COUNT_STATUS.CLOSED,
        0, // version for optimistic lock
      );
    });

    it('throws ConflictException on optimistic lock version mismatch', async () => {
      const staleBatch = { ...OPEN_BATCH, version: 2 }; // DB version is 2
      vi.mocked(mockCountRepo.findBatchById).mockResolvedValueOnce(staleBatch as any);

      // Client sends version: 0 (stale)
      await expect(service.closeBatch(BATCH_ID, closeDto(0))).rejects.toThrow(ConflictException);
    });

    it('throws when trying to close an already CLOSED batch', async () => {
      vi.mocked(mockCountRepo.findBatchById).mockResolvedValueOnce(CLOSED_BATCH as any);

      await expect(service.closeBatch(BATCH_ID, closeDto(1))).rejects.toThrow(ConflictException);
    });

    it('skips COUNT_ADJUSTMENT entries for rows with zero variance', async () => {
      vi.mocked(mockCountRepo.findBatchById).mockResolvedValueOnce(OPEN_BATCH as any);
      vi.mocked(mockCountRepo.findRowsByBatchId).mockResolvedValueOnce([
        { id: ROW_ID_A, batchId: BATCH_ID, itemId: ITEM_ID_A, expectedQty: 50, actualQty: 50, varianceQty: 0 },
      ] as any);

      await service.closeBatch(BATCH_ID, closeDto(0));

      expect(mockLedgerService.record).not.toHaveBeenCalled();
    });
  });
});
