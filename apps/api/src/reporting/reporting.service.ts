import { DB_CLIENT } from '../core/core.symbols';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Kysely, sql } from 'kysely';
import crypto from 'crypto';
import { Database, RestaurantId, ItemId } from '@ims/types';
import { VarianceReportRow, ParAlertRow, SnapshotRow } from '@ims/types';
import { IReportingService } from './interfaces/i-reporting.service';
import { IStockQueryService, STOCK_QUERY_SERVICE_TOKEN } from '../inventory/interfaces/i-stock-query.service';
import { IItemReadService, ITEM_READ_SERVICE_TOKEN } from '../item/interfaces/i-item.service';

@Injectable()
export class ReportingService implements IReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    @Inject(DB_CLIENT) private readonly db: Kysely<Database>,
    @Inject(STOCK_QUERY_SERVICE_TOKEN) private readonly stockQueryService: IStockQueryService,
    @Inject(ITEM_READ_SERVICE_TOKEN) private readonly itemService: IItemReadService,
  ) {}

  async getVarianceReport(restaurantId: RestaurantId, limit: number = 100, offset: number = 0): Promise<VarianceReportRow[]> {
    const records = await this.db
      .selectFrom('mat_view_variance_analytics')
      .selectAll()
      .where('restaurant_id', '=', restaurantId)
      .limit(limit)
      .offset(offset)
      .execute();

    return records.map(r => ({
      restaurantId: r.restaurant_id as RestaurantId,
      itemId: r.item_id as ItemId,
      reportingMonth: r.reporting_month!,
      actualQty: r.actual_qty ? Number(r.actual_qty) : null,
      theoreticalQty: r.theoretical_qty ? Number(r.theoretical_qty) : null,
      unexplainedVarianceQty: r.unexplained_variance_qty ? Number(r.unexplained_variance_qty) : null,
    }));
  }

  async getParAlerts(restaurantId: RestaurantId): Promise<ParAlertRow[]> {
    // 1. Get all items that have par levels defined
    const itemsResult = await this.itemService.listParLevels(restaurantId, 1, 1000); // Pagination in real world
    const items = itemsResult.data;

    if (items.length === 0) return [];

    // 2. Get stock levels for the restaurant
    const stockLevels = await this.stockQueryService.getCurrentStockBulk(restaurantId);
    const stockMap = new Map(stockLevels.map(s => [s.itemId, s.qty]));

    // 3. Compare and filter items below par
    const alerts: ParAlertRow[] = [];
    for (const item of items) {
      if (!item.override || item.override.parLevel <= 0) continue;
      
      const currentStock = stockMap.get(item.id) || 0;
      const parLevel = item.override.parLevel;
      
      if (currentStock < parLevel) {
        alerts.push({
          item,
          currentStock,
          varianceFromPar: currentStock - parLevel
        });
      }
    }

    return alerts.sort((a, b) => a.varianceFromPar - b.varianceFromPar); // Sort by most deficient
  }

  async getSnapshots(restaurantId: RestaurantId, limit: number = 100, offset: number = 0): Promise<SnapshotRow[]> {
    const records = await this.db
      .selectFrom('daily_inventory_snapshots')
      .selectAll()
      .where('restaurant_id', '=', restaurantId)
      .orderBy('business_date', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return records.map(r => ({
      restaurantId: r.restaurant_id as RestaurantId,
      itemId: r.item_id as ItemId,
      businessDate: typeof r.business_date === 'string' ? r.business_date : (r.business_date as Date).toISOString().split('T')[0],
      eodQty: Number(r.eod_qty),
      fifoTotalValue: Number(r.fifo_total_value),
    }));
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runEodSnapshots(): Promise<void> {
    this.logger.log('Starting EOD inventory snapshots...');
    const businessDate = new Date().toISOString().split('T')[0]; // Simple UTC date for now

    // Get all restaurants
    const restaurants = await this.db.selectFrom('restaurants').select('id').execute();

    for (const r of restaurants) {
      const restaurantId = r.id as RestaurantId;
      try {
        const itemsRes = await this.itemService.listParLevels(restaurantId, 1, 10000);
        const activeItems = itemsRes.data.filter(i => i.isActive);
        
        if (activeItems.length === 0) continue;

        const stockLevels = await this.stockQueryService.getCurrentStockBulk(restaurantId);
        const stockMap = new Map(stockLevels.map(s => [s.itemId, s.qty]));

        const snapshotRows = activeItems.map(item => {
          const eodQty = stockMap.get(item.id) || 0;
          // In a full implementation, we'd query `inventory_batches` to calculate actual FIFO value.
          // For now, we mock value calculation as 0 since Pricing Agent logic isn't fully expanded.
          return {
            id: crypto.randomUUID() as import('@ims/types').SnapshotId,
            restaurant_id: restaurantId,
            item_id: item.id,
            business_date: businessDate,
            eod_qty: eodQty,
            fifo_total_value: 0,
          };
        });

        // Insert in batches if necessary, but for simplicity here insert all at once
        await this.db
          .insertInto('daily_inventory_snapshots')
          .values(snapshotRows)
          .execute();

        // Refresh the materialized view for variance analytics after snapshots are taken
        await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mat_view_variance_analytics`.execute(this.db).catch(e => {
            // Concurrent refresh requires unique index, if it fails, try normal refresh
            sql`REFRESH MATERIALIZED VIEW mat_view_variance_analytics`.execute(this.db).catch(console.error);
        });

      } catch (e) {
        this.logger.error(`Failed to process snapshots for restaurant ${restaurantId}`, e);
      }
    }
    this.logger.log('Finished EOD inventory snapshots.');
  }
}
