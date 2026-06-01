/* @immutable-test — Written Red-first on: 2026-05-23. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LedgerService } from '../ledger.service';
import type { ILedgerRepository } from '../interfaces/i-ledger.repository';
import type { LedgerEntryDto } from '../dto/ledger-entry.dto';
import { LEDGER_REASON_CODES } from '@ims/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const RESTAURANT_ID = 'rest-uuid-001' as any;
const ITEM_ID = 'item-uuid-001' as any;

const PO_RECEIPT_ENTRY: LedgerEntryDto = {
  restaurantId: RESTAURANT_ID,
  itemId: ITEM_ID,
  changeAmount: 100,
  reasonCode: LEDGER_REASON_CODES.PO_RECEIPT,
  referenceId: 'po-uuid-001',
};

const SALES_DEPLETION_ENTRY: LedgerEntryDto = {
  restaurantId: RESTAURANT_ID,
  itemId: ITEM_ID,
  changeAmount: -5,
  reasonCode: LEDGER_REASON_CODES.SALES_DEPLETION,
  referenceId: 'batch-uuid-001',
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockTrx = {} as any; // Kysely Transaction mock

const mockLedgerRepository: ILedgerRepository = {
  insertEntry: vi.fn(),
  sumChangeAmount: vi.fn(),
  sumChangeAmountBulk: vi.fn(),
      getLedgerEntries: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LedgerService', () => {
  let service: LedgerService;
  const mockItemReadService = { findById: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LedgerService(mockLedgerRepository, mockItemReadService as any);
  });

  // ── record ───────────────────────────────────────────────────────────────

  describe('record()', () => {
    it('inserts a positive PO_RECEIPT entry via the repository', async () => {
      vi.mocked(mockLedgerRepository.insertEntry).mockResolvedValueOnce(undefined);

      await service.record(mockTrx, PO_RECEIPT_ENTRY);

      expect(mockLedgerRepository.insertEntry).toHaveBeenCalledOnce();
      expect(mockLedgerRepository.insertEntry).toHaveBeenCalledWith(
        mockTrx,
        expect.objectContaining({
          restaurant_id: RESTAURANT_ID,
          item_id: ITEM_ID,
          change_amount: 100,
          reason_code: LEDGER_REASON_CODES.PO_RECEIPT,
        }),
      );
    });

    it('inserts a negative SALES_DEPLETION entry', async () => {
      vi.mocked(mockLedgerRepository.insertEntry).mockResolvedValueOnce(undefined);

      await service.record(mockTrx, SALES_DEPLETION_ENTRY);

      expect(mockLedgerRepository.insertEntry).toHaveBeenCalledWith(
        mockTrx,
        expect.objectContaining({ change_amount: -5 }),
      );
    });

    it('throws if changeAmount is zero (no-op entries are not allowed)', async () => {
      await expect(
        service.record(mockTrx, { ...PO_RECEIPT_ENTRY, changeAmount: 0 }),
      ).rejects.toThrow(/changeAmount must not be zero/i);

      expect(mockLedgerRepository.insertEntry).not.toHaveBeenCalled();
    });

    it('throws if reasonCode is invalid', async () => {
      await expect(
        service.record(mockTrx, { ...PO_RECEIPT_ENTRY, reasonCode: 'INVALID_CODE' as any }),
      ).rejects.toThrow();
    });
  });

  // ── getCurrentStock ──────────────────────────────────────────────────────

  describe('getCurrentStock()', () => {
    it('returns the summed change_amount for an item at a restaurant', async () => {
      vi.mocked(mockLedgerRepository.sumChangeAmount).mockResolvedValueOnce(95);

      const result = await service.getCurrentStock(RESTAURANT_ID, ITEM_ID);

      expect(result).toBe(95);
      expect(mockLedgerRepository.sumChangeAmount).toHaveBeenCalledWith(RESTAURANT_ID, ITEM_ID);
    });

    it('returns 0 when no ledger entries exist for the item', async () => {
      vi.mocked(mockLedgerRepository.sumChangeAmount).mockResolvedValueOnce(0);

      const result = await service.getCurrentStock(RESTAURANT_ID, ITEM_ID);

      expect(result).toBe(0);
    });
  });

  // ── getCurrentStockBulk ──────────────────────────────────────────────────

  describe('getCurrentStockBulk()', () => {
    it('returns stock levels for all items at a restaurant', async () => {
      const mockLevels = [
        { itemId: ITEM_ID, qty: 95 },
        { itemId: 'item-uuid-002' as any, qty: 12 },
      ];
      vi.mocked(mockLedgerRepository.sumChangeAmountBulk).mockResolvedValueOnce(mockLevels);

      const result = await service.getCurrentStockBulk(RESTAURANT_ID);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ itemId: ITEM_ID, qty: 95 });
    });

    it('returns an empty array when the restaurant has no inventory', async () => {
      vi.mocked(mockLedgerRepository.sumChangeAmountBulk).mockResolvedValueOnce([]);

      const result = await service.getCurrentStockBulk(RESTAURANT_ID);

      expect(result).toEqual([]);
    });
  });
});
