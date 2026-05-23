import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import type { Kysely } from 'kysely';

import type {
  PurchaseOrder,
  PurchaseOrderId,
  RestaurantId,
} from '@ims/types';
import { PURCHASE_ORDER_STATUS, LEDGER_REASON_CODES } from '@ims/types';
import type { CreatePoDto, ReceivePoDto } from '@ims/validators';

import type { IProcurementRepository } from './interfaces/i-procurement.repository';
import type { ILedgerService } from '../inventory/interfaces/i-ledger.service';
import type { IItemService } from '../item/interfaces/i-item.service';
import { LEDGER_SERVICE_TOKEN } from '../inventory/interfaces/i-ledger.service';
import { ITEM_SERVICE_TOKEN } from '../item/interfaces/i-item.service';

export const PROCUREMENT_REPOSITORY_TOKEN = Symbol('IProcurementRepository');

@Injectable()
export class ProcurementService {
  constructor(
    private readonly db: Kysely<any>,
    @Inject(PROCUREMENT_REPOSITORY_TOKEN)
    private readonly procurementRepo: IProcurementRepository,
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledger: ILedgerService,
    @Inject(ITEM_SERVICE_TOKEN) private readonly itemService: IItemService,
  ) {}

  async createDraftPO(restaurantId: RestaurantId, dto: CreatePoDto): Promise<PurchaseOrder> {
    return this.procurementRepo.createPO(restaurantId, dto);
  }

  async submitPO(poId: PurchaseOrderId): Promise<PurchaseOrder> {
    const po = await this.findOrThrow(poId);

    if (po.status !== PURCHASE_ORDER_STATUS.DRAFT) {
      throw new BadRequestException(
        `PO ${poId} cannot be submitted — current status is ${po.status}`,
      );
    }

    return this.procurementRepo.updatePOStatus(poId, PURCHASE_ORDER_STATUS.SUBMITTED);
  }

  async receivePO(poId: PurchaseOrderId, dto: ReceivePoDto): Promise<void> {
    const po = await this.findOrThrow(poId);

    if (po.status === PURCHASE_ORDER_STATUS.RECEIVED) {
      throw new ConflictException(`PO ${poId} has already been received`);
    }

    if (po.status !== PURCHASE_ORDER_STATUS.SUBMITTED) {
      throw new BadRequestException(
        `PO ${poId} cannot be received — current status is ${po.status}`,
      );
    }

    const lineItems = await this.procurementRepo.findLineItemsByPOId(poId);
    const lineCount = lineItems.length || 1;
    const proratedFreight = po.freightCharge / lineCount;

    await this.db.transaction().execute(async (trx) => {
      for (const receiveLine of dto.lineItems) {
        const lineItem = lineItems.find((l) => l.id === receiveLine.lineItemId);
        if (!lineItem) continue;

        const landedUnitCost = lineItem.rawUnitPrice + proratedFreight / lineItem.quantityOrdered;

        // 1. Update quantity received on the line item
        await this.procurementRepo.updateLineItemReceived(
          trx,
          receiveLine.lineItemId,
          receiveLine.quantityReceived,
        );

        // 2. Create FIFO inventory batch
        await this.procurementRepo.createInventoryBatch(trx, {
          restaurant_id: po.restaurantId,
          item_id: lineItem.itemId,
          po_id: poId,
          initial_qty: receiveLine.quantityReceived,
          remaining_qty: receiveLine.quantityReceived,
          landed_unit_cost: landedUnitCost,
        });

        // 3. Write ledger entry — only via LedgerService
        await this.ledger.record(trx, {
          restaurantId: po.restaurantId,
          itemId: lineItem.itemId,
          changeAmount: receiveLine.quantityReceived,
          reasonCode: LEDGER_REASON_CODES.PO_RECEIPT,
          referenceId: poId,
        });
      }

      // 4. Update PO status
      await this.procurementRepo.updatePOStatus(poId, PURCHASE_ORDER_STATUS.RECEIVED);
    });
  }

  async cancelPO(poId: PurchaseOrderId): Promise<void> {
    const po = await this.findOrThrow(poId);

    if (po.status === PURCHASE_ORDER_STATUS.RECEIVED) {
      throw new ConflictException(`PO ${poId} cannot be cancelled — it has already been received`);
    }

    if (po.status === PURCHASE_ORDER_STATUS.CANCELLED) {
      throw new ConflictException(`PO ${poId} is already cancelled`);
    }

    await this.procurementRepo.updatePOStatus(poId, PURCHASE_ORDER_STATUS.CANCELLED);
  }

  private async findOrThrow(poId: PurchaseOrderId): Promise<PurchaseOrder> {
    const po = await this.procurementRepo.findPOById(poId);
    if (!po) {
      throw new NotFoundException(`Purchase order ${poId} not found`);
    }
    return po;
  }
}
