// @immutable-test — Written Red-first. NEVER MODIFY after first GREEN.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockQueryService } from '../stock-query.service';
import type { ILedgerService } from '../interfaces/i-ledger.service';
import type { RestaurantId, ItemId, StockLevel } from '@ims/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RESTAURANT_ID = 'rest-uuid-001' as RestaurantId;
const ITEM_ID = 'item-uuid-001' as ItemId;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLedgerService: ILedgerService = {
  record: vi.fn(),
  getCurrentStock: vi.fn(),
  getCurrentStockBulk: vi.fn(),
  getLedgerEntries: vi.fn(),
  recordOpeningBalance: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StockQueryService', () => {
  let service: StockQueryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StockQueryService(mockLedgerService);
  });

  describe('getCurrentStock()', () => {
    it('should delegate to LedgerService.getCurrentStock() and return the result', async () => {
      vi.mocked(mockLedgerService.getCurrentStock).mockResolvedValueOnce(42);

      const result = await service.getCurrentStock(RESTAURANT_ID, ITEM_ID);

      expect(mockLedgerService.getCurrentStock).toHaveBeenCalledWith(RESTAURANT_ID, ITEM_ID);
      expect(result).toBe(42);
    });

    it('should return 0 when ledger has no entries for the item', async () => {
      vi.mocked(mockLedgerService.getCurrentStock).mockResolvedValueOnce(0);

      const result = await service.getCurrentStock(RESTAURANT_ID, ITEM_ID);

      expect(result).toBe(0);
    });

    it('should propagate errors from LedgerService', async () => {
      vi.mocked(mockLedgerService.getCurrentStock).mockRejectedValueOnce(new Error('DB error'));

      await expect(service.getCurrentStock(RESTAURANT_ID, ITEM_ID)).rejects.toThrow('DB error');
    });
  });

  describe('getCurrentStockBulk()', () => {
    it('should delegate to LedgerService.getCurrentStockBulk() and return all stock levels', async () => {
      const mockLevels: StockLevel[] = [
        { itemId: ITEM_ID, qty: 10 },
        { itemId: 'item-uuid-002' as ItemId, qty: 25 },
      ];
      vi.mocked(mockLedgerService.getCurrentStockBulk).mockResolvedValueOnce(mockLevels);

      const result = await service.getCurrentStockBulk(RESTAURANT_ID);

      expect(mockLedgerService.getCurrentStockBulk).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ itemId: ITEM_ID, qty: 10 });
    });

    it('should return an empty array when the restaurant has no inventory', async () => {
      vi.mocked(mockLedgerService.getCurrentStockBulk).mockResolvedValueOnce([]);

      const result = await service.getCurrentStockBulk(RESTAURANT_ID);

      expect(result).toEqual([]);
    });
  });
});
