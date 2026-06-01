// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from '../reporting.service';
import { STOCK_QUERY_SERVICE_TOKEN } from '../../inventory/interfaces/i-stock-query.service';
import { ITEM_READ_SERVICE_TOKEN } from '../../item/interfaces/i-item.service';
import { IStockQueryService } from '../../inventory/interfaces/i-stock-query.service';
import { IItemReadService } from '../../item/interfaces/i-item.service';
import { Database, ItemWithOverride, RestaurantId, StockLevel } from '@ims/types';

import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';

describe('ReportingService', () => {
  let service: ReportingService;
  let mockStockQueryService: Mocked<IStockQueryService>;
  let mockItemService: Mocked<IItemReadService>;
  let mockDb: any;

  beforeEach(async () => {
    mockStockQueryService = {
      getCurrentStock: vi.fn(),
      getCurrentStockBulk: vi.fn(),
    };

    mockItemService = {
      findById: vi.fn(),
      convertUom: vi.fn(),
      listBelowPar: vi.fn(), // wait, AGENTS.md says par levels are managed by ItemMaster but Reporting queries them. Actually, IItemService might not have listBelowPar if we are doing it here. Wait, let's just mock what we need.
      // Wait, the plan says: IItemService doesn't have listBelowPar, or maybe it does? Let's just mock a standard method to get items and par levels.
      // Actually, AGENTS.md says Item Master Agent exposes:
      // listParLevels(restaurantId: RestaurantId, page?: number, limit?: number): Promise<{ data: ItemWithOverride[]; meta: ... }>;
    } as unknown;

    mockDb = {
      getExecutor: vi.fn().mockReturnValue({ executeQuery: vi.fn().mockResolvedValue({ rows: [] }) }),
      selectFrom: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: vi.fn(),
      insertInto: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      schema: {
        raw: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue(true) }),
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: STOCK_QUERY_SERVICE_TOKEN, useValue: mockStockQueryService },
        { provide: ITEM_READ_SERVICE_TOKEN, useValue: mockItemService },
        { provide: 'DB_CLIENT', useValue: mockDb },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
  });

  describe('getParAlerts', () => {
    it('should return items where current stock is below par level', async () => {
      const restId = 'r1' as RestaurantId;
      
      const mockItems: ItemWithOverride[] = [
        { id: 'item1', name: 'Flour', inventoryUom: 'g', type: 'RAW', sku: 'SKU1', is_active: true, invToRecipeRatio: 1, purchasingUom: 'kg', override: { parLevel: 1000 } } as unknown,
        { id: 'item2', name: 'Sugar', inventoryUom: 'g', type: 'RAW', sku: 'SKU2', is_active: true, invToRecipeRatio: 1, purchasingUom: 'kg', override: { parLevel: 500 } } as unknown,
      ];

      // Assuming ItemService exposes listParLevels (or similar) to get all items with overrides
      mockItemService.listParLevels = vi.fn().mockResolvedValue({ data: mockItems, meta: { total: 2 } });
      
      const mockStock: StockLevel[] = [
        { itemId: 'item1' as unknown, qty: 800 }, // Below par (1000)
        { itemId: 'item2' as unknown, qty: 600 }, // Above par (500)
      ];
      
      mockStockQueryService.getCurrentStockBulk.mockResolvedValue(mockStock);

      const alerts = await service.getParAlerts(restId);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].item.id).toBe('item1');
      expect(alerts[0].currentStock).toBe(800);
      expect(alerts[0].varianceFromPar).toBe(-200);
    });
  });

  describe('getVarianceReport', () => {
    it('should query the materialized view', async () => {
      const restId = 'r1' as RestaurantId;
      mockDb.execute.mockResolvedValue([
        { restaurant_id: restId, item_id: 'i1', reporting_month: '2026-05', unexplained_variance_qty: -50 }
      ]);

      const result = await service.getVarianceReport(restId);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('mat_view_variance_analytics');
      expect(mockDb.where).toHaveBeenCalledWith('restaurant_id', '=', restId);
      expect(result).toHaveLength(1);
      expect(result[0].unexplainedVarianceQty).toBe(-50);
    });
  });

  describe('runEodSnapshots', () => {
    it('should insert snapshot rows for all restaurants and items', async () => {
      // Mock db queries to get active restaurants and their items
      // Since it's a cron, it processes everything.
      mockDb.execute.mockResolvedValueOnce([{ id: 'r1' }]); // restaurants
      mockItemService.listParLevels = vi.fn().mockResolvedValue({ data: [{ id: 'i1', isActive: true }], meta: { total: 1 } });
      mockStockQueryService.getCurrentStockBulk.mockResolvedValue([{ itemId: 'i1' as unknown, qty: 100 }]);

      await service.runEodSnapshots();

      expect(mockDb.insertInto).toHaveBeenCalledWith('daily_inventory_snapshots');
      expect(mockDb.values).toHaveBeenCalled();
    });
  });
});
