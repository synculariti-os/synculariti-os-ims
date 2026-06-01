import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IInventoryTransferService } from './interfaces/i-inventory-transfer.service';
import { InventoryTransfer, RestaurantId, FranchiseGroupId, TransferId, ItemId } from '@ims/types';
import { CreateTransferDto } from '@ims/validators';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';
import { Kysely } from 'kysely';
import { Database } from '@ims/types';
import { tenantContext } from '../common/context/tenant.context';
import * as crypto from 'crypto';

@Injectable()
export class InventoryTransferService implements IInventoryTransferService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Kysely<Database>,
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
  ) {}

  async createTransfers(originRestaurantId: RestaurantId, franchiseGroupId: FranchiseGroupId, dto: CreateTransferDto): Promise<InventoryTransfer[]> {
    if (originRestaurantId === dto.destinationRestaurantId) {
      throw new BadRequestException('Origin and destination restaurants cannot be the same');
    }

    const insertedRows = await this.db.transaction().execute(async (trx) => {
      const rows = dto.items.map(item => ({
        id: crypto.randomUUID() as TransferId,
        franchise_group_id: franchiseGroupId,
        origin_restaurant_id: originRestaurantId,
        destination_restaurant_id: dto.destinationRestaurantId as RestaurantId,
        item_id: item.itemId as ItemId,
        qty: item.qty,
        status: 'PENDING' as const,
      }));

      return await trx
        .insertInto('inventory_transfers')
        .values(rows)
        .returningAll()
        .execute();
    });

    return insertedRows.map(this.mapTransfer);
  }

  async dispatchTransfer(originRestaurantId: RestaurantId, transferId: TransferId): Promise<InventoryTransfer> {
    return await this.db.transaction().execute(async (trx) => {
      const transfer = await trx
        .selectFrom('inventory_transfers')
        .selectAll()
        .where('id', '=', transferId)
        .where('origin_restaurant_id', '=', originRestaurantId)
        .executeTakeFirstOrThrow(() => new NotFoundException('Transfer not found'));

      if (transfer.status !== 'PENDING') {
        throw new BadRequestException(`Cannot dispatch transfer with status ${transfer.status}`);
      }

      const updated = await trx
        .updateTable('inventory_transfers')
        .set({ status: 'IN_TRANSIT', updated_at: new Date().toISOString() })
        .where('id', '=', transferId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Deplete stock from origin
      await this.ledgerService.record(trx as any, {
        restaurantId: originRestaurantId,
        itemId: updated.item_id,
        changeAmount: -updated.qty,
        reasonCode: 'TRANSFER_OUT',
        referenceId: transferId,
      });

      return this.mapTransfer(updated);
    });
  }

  async receiveTransfer(destinationRestaurantId: RestaurantId, transferId: TransferId): Promise<InventoryTransfer> {
    return await this.db.transaction().execute(async (trx) => {
      const transfer = await trx
        .selectFrom('inventory_transfers')
        .selectAll()
        .where('id', '=', transferId)
        .where('destination_restaurant_id', '=', destinationRestaurantId)
        .executeTakeFirstOrThrow(() => new NotFoundException('Transfer not found'));

      if (transfer.status !== 'IN_TRANSIT') {
        throw new BadRequestException(`Cannot receive transfer with status ${transfer.status}`);
      }

      const updated = await trx
        .updateTable('inventory_transfers')
        .set({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .where('id', '=', transferId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Add stock to destination
      // We must elevate tenantContext so LedgerService can write to the destination
      await new Promise<void>((resolve, reject) => {
        tenantContext.run(
          { franchiseId: updated.franchise_group_id, restaurantId: updated.destination_restaurant_id },
          async () => {
            try {
              await this.ledgerService.record(trx as any, {
                restaurantId: updated.destination_restaurant_id,
                itemId: updated.item_id,
                changeAmount: updated.qty,
                reasonCode: 'TRANSFER_IN',
                referenceId: transferId,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      });

      return this.mapTransfer(updated);
    });
  }

  async cancelTransfer(restaurantId: RestaurantId, transferId: TransferId): Promise<InventoryTransfer> {
    return await this.db.transaction().execute(async (trx) => {
      const transfer = await trx
        .selectFrom('inventory_transfers')
        .selectAll()
        .where('id', '=', transferId)
        .executeTakeFirstOrThrow(() => new NotFoundException('Transfer not found'));

      if (transfer.origin_restaurant_id !== restaurantId && transfer.destination_restaurant_id !== restaurantId) {
        throw new ForbiddenException('Cannot cancel transfer not belonging to your restaurant');
      }

      if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
        throw new BadRequestException(`Cannot cancel transfer with status ${transfer.status}`);
      }

      const updated = await trx
        .updateTable('inventory_transfers')
        .set({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .where('id', '=', transferId)
        .returningAll()
        .executeTakeFirstOrThrow();

      if (transfer.status === 'IN_TRANSIT') {
        // Reverse the depletion from origin
        await new Promise<void>((resolve, reject) => {
          tenantContext.run(
            { franchiseId: updated.franchise_group_id, restaurantId: updated.origin_restaurant_id },
            async () => {
              try {
                await this.ledgerService.record(trx as any, {
                  restaurantId: updated.origin_restaurant_id,
                  itemId: updated.item_id,
                  changeAmount: updated.qty,
                  reasonCode: 'TRANSFER_IN',
                  referenceId: transferId,
                });
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      }

      return this.mapTransfer(updated);
    });
  }

  async listTransfers(restaurantId: RestaurantId, direction: 'IN' | 'OUT'): Promise<InventoryTransfer[]> {
    const rows = await this.db
      .selectFrom('inventory_transfers')
      .selectAll()
      .where(direction === 'IN' ? 'destination_restaurant_id' : 'origin_restaurant_id', '=', restaurantId)
      .orderBy('created_at', 'desc')
      .execute();
      
    return rows.map(this.mapTransfer);
  }

  private mapTransfer(row: any): InventoryTransfer {
    return {
      id: row.id,
      franchiseGroupId: row.franchise_group_id,
      originRestaurantId: row.origin_restaurant_id,
      destinationRestaurantId: row.destination_restaurant_id,
      itemId: row.item_id,
      qty: Number(row.qty),
      status: row.status,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
