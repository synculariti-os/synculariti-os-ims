/* eslint-disable @typescript-eslint/no-explicit-any */
// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransferService } from '../inventory-transfer.service';
import { IInventoryTransferService, INVENTORY_TRANSFER_SERVICE_TOKEN } from '../interfaces/i-inventory-transfer.service';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from '../interfaces/i-ledger.service';
import { tenantContext } from '../../common/context/tenant.context';
import { vi } from 'vitest';

describe('InventoryTransferService', () => {
  let service: IInventoryTransferService;
  let ledgerService: any;
  let mockDb: any;
  let mockQueryBuilder: any;
  
  beforeEach(async () => {
    ledgerService = {
      record: vi.fn(),
      getCurrentStockBulk: vi.fn(),
      getCurrentStock: vi.fn(),
      getLedgerEntries: vi.fn(),
    } as any;
    
    mockQueryBuilder = {
      selectAll: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn(),
      executeTakeFirstOrThrow: vi.fn(),
      execute: vi.fn(),
    };

    const mockTrx = {
      insertInto: vi.fn().mockReturnValue(mockQueryBuilder),
      updateTable: vi.fn().mockReturnValue(mockQueryBuilder),
      selectFrom: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    mockDb = {
      transaction: vi.fn().mockReturnValue({
        execute: vi.fn(async (cb) => {
          return await cb(mockTrx);
        })
      }),
      selectFrom: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryTransferService,
        { provide: LEDGER_SERVICE_TOKEN, useValue: ledgerService },
        { provide: 'DB_CLIENT', useValue: mockDb },
      ],
    }).compile();

    service = module.get<InventoryTransferService>(InventoryTransferService);
  });

  describe('createTransfers', () => {
    it('should create transfer rows with PENDING status', async () => {
      const mockDto = {
        destinationRestaurantId: 'dest-123',
        items: [{ itemId: 'item-1', qty: 10 }],
      };
      
      mockQueryBuilder.execute.mockResolvedValue([{
        id: 'trans-1',
        origin_restaurant_id: 'rest-1',
        destination_restaurant_id: 'dest-123',
        item_id: 'item-1',
        qty: 10,
        status: 'PENDING',
      }]);

      const res = await service.createTransfers('rest-1' as any, 'franchise-1' as any, mockDto as any);
      expect(res).toHaveLength(1);
      expect(res[0].status).toBe('PENDING');
    });
  });

  describe('dispatchTransfer', () => {
    it('should update status to IN_TRANSIT and deplete origin stock', async () => {
      mockQueryBuilder.executeTakeFirstOrThrow
        .mockResolvedValueOnce({
          id: 'trans-1',
          origin_restaurant_id: 'rest-1',
          destination_restaurant_id: 'dest-123',
          item_id: 'item-1',
          qty: 10,
          status: 'PENDING',
        })
        .mockResolvedValueOnce({
          id: 'trans-1',
          origin_restaurant_id: 'rest-1',
          destination_restaurant_id: 'dest-123',
          item_id: 'item-1',
          qty: 10,
          status: 'IN_TRANSIT',
        });

      await service.dispatchTransfer('rest-1' as any, 'trans-1' as any);
      
      expect(ledgerService.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reasonCode: 'TRANSFER_OUT',
          changeAmount: -10,
          itemId: 'item-1',
          restaurantId: 'rest-1',
          referenceId: 'trans-1',
        })
      );
    });

    it('should throw if status is not PENDING', async () => {
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        status: 'IN_TRANSIT',
      });
      
      await expect(service.dispatchTransfer('rest-1' as any, 'trans-1' as any)).rejects.toThrow();
    });
  });

  describe('receiveTransfer', () => {
    it('should update status to COMPLETED and increment destination stock using tenantContext bypass', async () => {
      mockQueryBuilder.executeTakeFirstOrThrow
        .mockResolvedValueOnce({
          id: 'trans-1',
          origin_restaurant_id: 'rest-1',
          destination_restaurant_id: 'dest-123',
          item_id: 'item-1',
          qty: 10,
          status: 'IN_TRANSIT',
          franchise_group_id: 'franchise-1',
        })
        .mockResolvedValueOnce({
          id: 'trans-1',
          origin_restaurant_id: 'rest-1',
          destination_restaurant_id: 'dest-123',
          item_id: 'item-1',
          qty: 10,
          status: 'COMPLETED',
          franchise_group_id: 'franchise-1',
        });

      const runSpy = vi.spyOn(tenantContext, 'run').mockImplementation((_, cb: any) => cb());

      await service.receiveTransfer('dest-123' as any, 'trans-1' as any);

      expect(runSpy).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 'dest-123', franchiseId: 'franchise-1' }),
        expect.any(Function)
      );

      expect(ledgerService.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reasonCode: 'TRANSFER_IN',
          changeAmount: 10,
          itemId: 'item-1',
          restaurantId: 'dest-123',
          referenceId: 'trans-1',
        })
      );
    });
  });
});
