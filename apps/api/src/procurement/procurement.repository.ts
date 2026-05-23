import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { randomUUID } from 'crypto';
import {
  Database,
  PurchaseOrder,
  PoLineItem,
  InventoryBatch,
  PurchaseOrderId,
  RestaurantId,
  VendorId,
  asPurchaseOrderId,
  asRestaurantId,
  asVendorId,
  asPoLineItemId,
  asItemId,
  asInventoryBatchId,
} from '@ims/types';
import { CreatePoDto } from '@ims/validators';
import { IProcurementRepository, CreateInventoryBatchInput } from './interfaces/i-procurement.repository';

@Injectable()
export class ProcurementRepository implements IProcurementRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  private mapPO(row: any): PurchaseOrder {
    return {
      id: asPurchaseOrderId(row.id),
      restaurantId: asRestaurantId(row.restaurant_id),
      vendorId: asVendorId(row.vendor_id),
      status: row.status as any,
      orderDate: row.order_date,
      expectedDeliveryDate: row.expected_delivery_date,
      freightCharge: row.freight_charge,
      taxAmount: row.tax_amount,
      discountAmount: row.discount_amount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPoLineItem(row: any): PoLineItem {
    return {
      id: asPoLineItemId(row.id),
      poId: asPurchaseOrderId(row.po_id),
      itemId: asItemId(row.item_id),
      quantityOrdered: row.quantity_ordered,
      quantityReceived: row.quantity_received,
      rawUnitPrice: row.raw_unit_price,
      createdAt: row.created_at,
    };
  }

  async createPO(restaurantId: RestaurantId, dto: CreatePoDto): Promise<PurchaseOrder> {
    const id = asPurchaseOrderId(randomUUID());
    
    return await this.db.transaction().execute(async (trx) => {
      const row = await trx
        .insertInto('purchase_orders')
        .values({
          id,
          restaurant_id: restaurantId,
          vendor_id: dto.vendorId as VendorId,
          status: 'DRAFT',
          order_date: new Date().toISOString(),
          expected_delivery_date: dto.expectedDeliveryDate || null,
          freight_charge: dto.freightCharge || 0,
          tax_amount: dto.taxAmount || 0,
          discount_amount: dto.discountAmount || 0,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      if (dto.lineItems && dto.lineItems.length > 0) {
        await trx
          .insertInto('po_line_items')
          .values(dto.lineItems.map(l => ({
            id: asPoLineItemId(randomUUID()),
            po_id: id,
            item_id: asItemId(l.itemId),
            quantity_ordered: l.quantityOrdered,
            raw_unit_price: l.rawUnitPrice,
          })))
          .execute();
      }

      return this.mapPO(row);
    });
  }

  async findPOById(poId: PurchaseOrderId): Promise<PurchaseOrder | null> {
    const row = await this.db
      .selectFrom('purchase_orders')
      .selectAll()
      .where('id', '=', poId)
      .executeTakeFirst();
    return row ? this.mapPO(row) : null;
  }

  async updatePOStatus(poId: PurchaseOrderId, status: string): Promise<PurchaseOrder> {
    const row = await this.db
      .updateTable('purchase_orders')
      .set({ status: status as any, updated_at: new Date().toISOString() })
      .where('id', '=', poId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return this.mapPO(row);
  }

  async findLineItemsByPOId(poId: PurchaseOrderId): Promise<PoLineItem[]> {
    const rows = await this.db
      .selectFrom('po_line_items')
      .selectAll()
      .where('po_id', '=', poId)
      .execute();
    return rows.map(r => this.mapPoLineItem(r));
  }

  async updateLineItemReceived(trx: unknown, lineItemId: string, qty: number): Promise<void> {
    const db = trx as Kysely<Database>;
    await db
      .updateTable('po_line_items')
      .set({ quantity_received: qty })
      .where('id', '=', lineItemId as any)
      .execute();
  }

  async createInventoryBatch(trx: unknown, input: CreateInventoryBatchInput): Promise<InventoryBatch> {
    const db = trx as Kysely<Database>;
    const row = await db
      .insertInto('inventory_batches')
      .values({
        id: asInventoryBatchId(randomUUID()),
        restaurant_id: input.restaurant_id,
        item_id: input.item_id as any,
        po_id: input.po_id,
        received_date: new Date().toISOString(),
        initial_qty: input.initial_qty,
        remaining_qty: input.remaining_qty,
        landed_unit_cost: input.landed_unit_cost,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
      
    return {
      id: asInventoryBatchId(row.id),
      restaurantId: asRestaurantId(row.restaurant_id),
      itemId: asItemId(row.item_id),
      poId: row.po_id ? asPurchaseOrderId(row.po_id) : null,
      receivedDate: row.received_date,
      initialQty: row.initial_qty,
      remainingQty: row.remaining_qty,
      landedUnitCost: row.landed_unit_cost,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
