/* @immutable-test — Written Red-first on: 2026-05-23. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, BadRequestException } from '@nestjs/common';

import { ProcurementService } from '../procurement.service';
import type { IProcurementRepository } from '../interfaces/i-procurement.repository';
import type { ILedgerService } from '../../inventory/interfaces/i-ledger.service';
import type { IItemReadService } from '../../item/interfaces/i-item.service';
import type { CreatePoDto, ReceivePoDto } from '@ims/validators';
import { PURCHASE_ORDER_STATUS } from '@ims/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const RESTAURANT_ID = 'rest-uuid-001' as any;
const VENDOR_ID = 'vendor-uuid-001' as any;
const PO_ID = 'po-uuid-001' as any;
const ITEM_ID = 'item-uuid-001' as any;
const LINE_ITEM_ID = 'line-uuid-001' as any;

const DRAFT_PO = {
  id: PO_ID,
  restaurantId: RESTAURANT_ID,
  vendorId: VENDOR_ID,
  status: PURCHASE_ORDER_STATUS.DRAFT,
  orderDate: '2026-05-23T10:00:00Z',
  expectedDeliveryDate: null,
  freightCharge: 10,
  taxAmount: 5,
  discountAmount: 0,
  createdAt: '2026-05-23T10:00:00Z',
  updatedAt: '2026-05-23T10:00:00Z',
};

const SUBMITTED_PO = { ...DRAFT_PO, status: PURCHASE_ORDER_STATUS.SUBMITTED };
const RECEIVED_PO = { ...DRAFT_PO, status: PURCHASE_ORDER_STATUS.RECEIVED };

const MOCK_LINE_ITEM = {
  id: LINE_ITEM_ID,
  poId: PO_ID,
  itemId: ITEM_ID,
  quantityOrdered: 100,
  quantityReceived: 0,
  rawUnitPrice: 2.5,
  createdAt: '2026-05-23T10:00:00Z',
};

const CREATE_PO_DTO: CreatePoDto = {
  restaurantId: RESTAURANT_ID,
  vendorId: VENDOR_ID,
  freightCharge: 10,
  taxAmount: 5,
  discountAmount: 0,
  lineItems: [{ itemId: ITEM_ID, quantityOrdered: 100, rawUnitPrice: 2.5 }],
};

const RECEIVE_PO_DTO: ReceivePoDto = {
  lineItems: [{ itemId: ITEM_ID, quantityReceived: 100 }],
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockDb = {
  transaction: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockImplementation((fn: (trx: any) => Promise<void>) => fn({})),
  })),
};

const mockProcurementRepo: IProcurementRepository = {
  createPO: vi.fn(),
  findPOById: vi.fn(),
  updatePOStatus: vi.fn(),
  findLineItemsByPOId: vi.fn(),
  updateLineItemReceived: vi.fn(),
  createInventoryBatch: vi.fn(),
};

const mockLedgerService: ILedgerService = {
  record: vi.fn(),
  getCurrentStock: vi.fn(),
  getCurrentStockBulk: vi.fn(),
};

const mockItemService: IItemReadService = {
  findById: vi.fn(),
  convertUom: vi.fn(),
  listParLevels: vi.fn(),
      listCategories: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ProcurementService', () => {
  let service: ProcurementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProcurementService(
      mockDb as any,
      mockProcurementRepo,
      mockLedgerService,
      mockItemService,
    );
  });

  // ── createDraftPO ─────────────────────────────────────────────────────────

  describe('createDraftPO()', () => {
    it('creates a PO with status DRAFT and returns it', async () => {
      vi.mocked(mockProcurementRepo.createPO).mockResolvedValueOnce(DRAFT_PO as any);

      const result = await service.createDraftPO(RESTAURANT_ID, CREATE_PO_DTO);

      expect(result.status).toBe(PURCHASE_ORDER_STATUS.DRAFT);
      expect(mockProcurementRepo.createPO).toHaveBeenCalledOnce();
    });
  });

  // ── submitPO ──────────────────────────────────────────────────────────────

  describe('submitPO()', () => {
    it('transitions a DRAFT PO to SUBMITTED', async () => {
      vi.mocked(mockProcurementRepo.findPOById).mockResolvedValueOnce(DRAFT_PO as any);
      vi.mocked(mockProcurementRepo.updatePOStatus).mockResolvedValueOnce(SUBMITTED_PO as any);

      const result = await service.submitPO(PO_ID);

      expect(result.status).toBe(PURCHASE_ORDER_STATUS.SUBMITTED);
      expect(mockProcurementRepo.updatePOStatus).toHaveBeenCalledWith(PO_ID, 'SUBMITTED');
    });

    it('throws BadRequestException when submitting a non-DRAFT PO', async () => {
      vi.mocked(mockProcurementRepo.findPOById).mockResolvedValueOnce(SUBMITTED_PO as any);

      await expect(service.submitPO(PO_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── receivePO ────────────────────────────────────────────────────────────

  describe('receivePO()', () => {
    it('ACID: writes batch + ledger entry + status update atomically', async () => {
      vi.mocked(mockProcurementRepo.findPOById).mockResolvedValueOnce(SUBMITTED_PO as any);
      vi.mocked(mockProcurementRepo.findLineItemsByPOId).mockResolvedValueOnce([MOCK_LINE_ITEM as any]);

      await service.receivePO(PO_ID, RECEIVE_PO_DTO);

      // Must create an inventory batch
      expect(mockProcurementRepo.createInventoryBatch).toHaveBeenCalledOnce();
      // Must record ledger entry via LedgerService (NEVER direct insert)
      expect(mockLedgerService.record).toHaveBeenCalledWith(
        expect.anything(), // transaction object
        expect.objectContaining({
          reasonCode: 'PO_RECEIPT',
          changeAmount: 100,
        }),
      );
      // Must update PO status
      expect(mockProcurementRepo.updatePOStatus).toHaveBeenCalledWith(PO_ID, 'RECEIVED');
    });

    it('throws ConflictException when receiving an already RECEIVED PO (idempotency)', async () => {
      vi.mocked(mockProcurementRepo.findPOById).mockResolvedValueOnce(RECEIVED_PO as any);

      await expect(service.receivePO(PO_ID, RECEIVE_PO_DTO)).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when receiving a CANCELLED PO', async () => {
      const cancelledPO = { ...DRAFT_PO, status: PURCHASE_ORDER_STATUS.CANCELLED };
      vi.mocked(mockProcurementRepo.findPOById).mockResolvedValueOnce(cancelledPO as any);

      await expect(service.receivePO(PO_ID, RECEIVE_PO_DTO)).rejects.toThrow(BadRequestException);
    });

    it('computes landedUnitCost as rawUnitPrice + prorated freight', async () => {
      vi.mocked(mockProcurementRepo.findPOById).mockResolvedValueOnce(SUBMITTED_PO as any);
      vi.mocked(mockProcurementRepo.findLineItemsByPOId).mockResolvedValueOnce([MOCK_LINE_ITEM as any]);

      await service.receivePO(PO_ID, RECEIVE_PO_DTO);

      // freight 10 / 1 line item = 10 prorated; landedUnitCost = 2.5 + 0.1 = 2.6
      expect(mockProcurementRepo.createInventoryBatch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          landed_unit_cost: expect.closeTo(2.6, 2),
        }),
      );
    });
  });

  // ── cancelPO ─────────────────────────────────────────────────────────────

  describe('cancelPO()', () => {
    it('cancels a DRAFT PO', async () => {
      vi.mocked(mockProcurementRepo.findPOById).mockResolvedValueOnce(DRAFT_PO as any);
      vi.mocked(mockProcurementRepo.updatePOStatus).mockResolvedValueOnce({
        ...DRAFT_PO,
        status: 'CANCELLED',
      } as any);

      await service.cancelPO(PO_ID);

      expect(mockProcurementRepo.updatePOStatus).toHaveBeenCalledWith(PO_ID, 'CANCELLED');
    });

    it('throws ConflictException when cancelling an already RECEIVED PO', async () => {
      vi.mocked(mockProcurementRepo.findPOById).mockResolvedValueOnce(RECEIVED_PO as any);

      await expect(service.cancelPO(PO_ID)).rejects.toThrow(ConflictException);
    });
  });
});
