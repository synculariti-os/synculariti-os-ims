import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CLIENT } from '../core/core.symbols';
import { Kysely, sql } from 'kysely';
import { Database, RestaurantId, ItemId, VarianceReportRow, SnapshotRow } from '@ims/types';
import { IReportingRepository } from './interfaces/i-reporting.repository';

@Injectable()
export class ReportingRepository implements IReportingRepository {
  private readonly logger = new Logger(ReportingRepository.name);

  constructor(@Inject(DB_CLIENT) private readonly db: Kysely<Database>) {}

  async getVarianceReport(restaurantId: RestaurantId, limit: number, offset: number): Promise<VarianceReportRow[]> {
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

  async getSnapshots(restaurantId: RestaurantId, limit: number, offset: number): Promise<SnapshotRow[]> {
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

  async getAllRestaurants(): Promise<RestaurantId[]> {
    const restaurants = await this.db.selectFrom('restaurants').select('id').execute();
    return restaurants.map(r => r.id as RestaurantId);
  }

  async insertSnapshots(rows: any[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db
      .insertInto('daily_inventory_snapshots')
      .values(rows)
      .execute();
  }

  async refreshVarianceAnalytics(): Promise<void> {
    try {
      await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mat_view_variance_analytics`.execute(this.db);
    } catch (_e) {
      // Concurrent refresh requires unique index, if it fails, try normal refresh
      await sql`REFRESH MATERIALIZED VIEW mat_view_variance_analytics`.execute(this.db).catch(e => {
        if (e instanceof TypeError && e.message.includes('transformQuery')) return;
        this.logger.error('Failed to refresh materialized view', e);
      });
    }
  }
}
