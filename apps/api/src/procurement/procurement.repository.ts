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
  Vendor,
  VendorPriceHistoryRow,
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

  private mapVendor(row: any): Vendor {
    return {
      id: asVendorId(row.id),
      franchiseGroupId: row.franchise_group_id,
      restaurantId: row.restaurant_id,
      name: row.name,
      contactEmail: row.contact_email,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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

  async listPOs(restaurantId: RestaurantId, page: number, limit: number): Promise<{ data: PurchaseOrder[], total: number }> {
    const offset = (page - 1) * limit;
    const [rows, totalResult] = await Promise.all([
      this.db
        .selectFrom('purchase_orders')
        .selectAll()
        .where('restaurant_id', '=', restaurantId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom('purchase_orders')
        .select(this.db.fn.count<string>('id').as('total'))
        .where('restaurant_id', '=', restaurantId)
        .executeTakeFirst(),
    ]);
    
    return {
      data: rows.map(r => this.mapPO(r)),
      total: totalResult?.total ? parseInt(totalResult.total, 10) : 0,
    };
  }

  async updatePOStatus(poId: PurchaseOrderId, status: string, trx?: unknown): Promise<PurchaseOrder> {
    const db = trx ? (trx as Kysely<Database>) : this.db;
    const row = await db
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

  async getAverageUnitCosts(restaurantId: string): Promise<Record<string, number>> {
    // Weighted average cost based on remaining quantity
    const rows = await this.db
      .selectFrom('inventory_batches')
      .select([
        'item_id',
        this.db.fn.sum<number>('remaining_qty').as('total_qty'),
        this.db.fn.sum<number>(this.db.raw('remaining_qty * landed_unit_cost')).as('total_value')
      ])
      .where('restaurant_id', '=', restaurantId as RestaurantId)
      .where('remaining_qty', '>', 0)
      .groupBy('item_id')
      .execute();

    const averages: Record<string, number> = {};
    for (const row of rows) {
      if (Number(row.total_qty) > 0) {
        averages[row.item_id] = Number(row.total_value) / Number(row.total_qty);
      }
    }

    return averages;
  }

  async findVendors(restaurantId: string): Promise<Vendor[]> {
    const rows = await this.db
      .selectFrom('vendors')
      .selectAll()
      .where((eb) => 
        eb('restaurant_id', '=', restaurantId as RestaurantId)
        .or('restaurant_id', 'is', null) // Franchise-level vendors might have restaurant_id null depending on how tenency works, actually let's just do exact match for now
      )
      .where('is_active', '=', true)
      .orderBy('name', 'asc')
      .execute();

    return rows.map(r => this.mapVendor(r));
  }

  async getVendorPriceHistory(restaurantId: string, itemId: string): Promise<VendorPriceHistoryRow[]> {
    const records = await this.db
      .selectFrom('inventory_batches')
      .leftJoin('purchase_orders', 'inventory_batches.po_id', 'purchase_orders.id')
      .leftJoin('vendors', 'purchase_orders.vendor_id', 'vendors.id')
      .where('inventory_batches.restaurant_id', '=', restaurantId as any)
      .where('inventory_batches.item_id', '=', itemId as any)
      .select([
        'inventory_batches.received_date',
        'inventory_batches.landed_unit_cost',
        'vendors.id as vendor_id',
        'vendors.name as vendor_name',
        'inventory_batches.po_id',
      ])
      .orderBy('inventory_batches.received_date', 'asc')
      .execute();

    return records.map(r => ({
      date: r.received_date,
      landedUnitCost: Number(r.landed_unit_cost),
      vendorId: r.vendor_id || 'manual-entry',
      vendorName: r.vendor_name || 'Manual Entry',
      poId: r.po_id,
    }));
  }
}
