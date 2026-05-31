import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { WasteService } from '../waste.service';
import type { IWasteRepository } from '../interfaces/i-waste.repository';
import type { ILedgerService } from '../interfaces/i-ledger.service';
import type { RestaurantId, WasteLogId } from '@ims/types';
import { LEDGER_REASON_CODES } from '@ims/types';

describe('WasteService', () => {
  let service: WasteService;
  let wasteRepo: Mocked<IWasteRepository>;
  let ledger: Mocked<ILedgerService>;
  let mockDb: any;

  const mockRestaurantId = 'rest-1' as RestaurantId;

  beforeEach(() => {
    mockDb = {
      transaction: vi.fn().mockReturnValue({
        execute: vi.fn().mockImplementation(async (cb) => {
          return cb(mockDb); // mock transaction object
        })
      })
    };

    wasteRepo = {
      createWasteLog: vi.fn(),
      listWasteLogs: vi.fn(),
    };

    ledger = {
      record: vi.fn(),
      getCurrentStock: vi.fn(),
      getCurrentStockBulk: vi.fn(),
      getLedgerEntries: vi.fn(),
    };

    service = new WasteService(mockDb, wasteRepo, ledger);
  });

  describe('logWaste', () => {
    it('should create a waste log and record ledger deduction', async () => {
      const dto = { itemId: 'item-1', quantity: 5, reason: 'dropped' };
      const mockLog = { id: 'waste-1' as WasteLogId, ...dto, restaurantId: mockRestaurantId, recordedAt: '' };
      
      wasteRepo.createWasteLog.mockResolvedValue(mockLog);

      const result = await service.logWaste(mockRestaurantId, dto);

      expect(result).toEqual(mockLog);
      expect(wasteRepo.createWasteLog).toHaveBeenCalledWith(mockDb, mockRestaurantId, dto);
      expect(ledger.record).toHaveBeenCalledWith(mockDb, {
        restaurantId: mockRestaurantId,
        itemId: dto.itemId,
        changeAmount: -dto.quantity,
        reasonCode: LEDGER_REASON_CODES.WASTE,
        referenceId: mockLog.id,
      });
    });
  });

  describe('listWasteLogs', () => {
    it('should call repository to list logs', async () => {
      const mockResult = [{ id: 'waste-1' }] as any[];
      wasteRepo.listWasteLogs.mockResolvedValue(mockResult);

      const result = await service.listWasteLogs(mockRestaurantId, 10, 5);
      
      expect(wasteRepo.listWasteLogs).toHaveBeenCalledWith(mockRestaurantId, 10, 5);
      expect(result).toEqual(mockResult);
    });
  });
});
