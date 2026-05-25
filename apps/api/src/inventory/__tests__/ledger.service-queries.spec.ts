/* @immutable-test — Written Red-first on: 2026-05-24. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LedgerService } from '../ledger.service';
import type { ILedgerRepository } from '../interfaces/i-ledger.repository';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const RESTAURANT_ID = 'rest-uuid-001' as any;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockLedgerRepository: ILedgerRepository = {
  insertEntry: vi.fn(),
  sumChangeAmount: vi.fn(),
  sumChangeAmountBulk: vi.fn(),
  getLedgerEntries: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LedgerService Queries', () => {
  let service: LedgerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LedgerService(mockLedgerRepository);
  });

  describe('getLedgerEntries()', () => {
    it('returns paginated ledger entries from the repository', async () => {
      const mockEntries = [
        { id: '1', reason_code: 'SALES_DEPLETION', change_amount: '-5' },
        { id: '2', reason_code: 'PHYSICAL_COUNT', change_amount: '10' }
      ];
      vi.mocked(mockLedgerRepository.getLedgerEntries).mockResolvedValueOnce(mockEntries);

      const result = await service.getLedgerEntries(RESTAURANT_ID, 20, 0);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockEntries);
      expect(mockLedgerRepository.getLedgerEntries).toHaveBeenCalledWith(RESTAURANT_ID, 20, 0);
    });

    it('uses default limits if not provided', async () => {
      vi.mocked(mockLedgerRepository.getLedgerEntries).mockResolvedValueOnce([]);

      await service.getLedgerEntries(RESTAURANT_ID);

      expect(mockLedgerRepository.getLedgerEntries).toHaveBeenCalledWith(RESTAURANT_ID, 50, 0);
    });
  });
});
