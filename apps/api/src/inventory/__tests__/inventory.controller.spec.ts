/* @immutable-test — Written Red-first on: 2026-05-24. NEVER MODIFY after first GREEN. */
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryController } from '../inventory.controller';
import { LEDGER_SERVICE_TOKEN, ILedgerService } from '../interfaces/i-ledger.service';
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

describe('InventoryController', () => {
  let controller: InventoryController;

  const mockLedgerService: Partial<ILedgerService> = {
    getLedgerEntries: vi.fn(),
    getCurrentStockBulk: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: LEDGER_SERVICE_TOKEN, useValue: mockLedgerService },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(TenantContextInterceptor)
      .useValue({ intercept: (context: any, next: any) => next.handle() })
      .compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  describe('GET /inventory/stock', () => {
    it('returns current stock bulk for a restaurant', async () => {
      const mockUser = { restaurantId: 'rest-123' };
      const mockResult = [{ itemId: 'item-1', qty: 10 }];
      
      vi.mocked(mockLedgerService.getCurrentStockBulk!).mockResolvedValueOnce(mockResult as any);

      const result = await controller.getStock(mockUser as any);
      
      expect(result).toEqual({ data: mockResult });
      expect(mockLedgerService.getCurrentStockBulk).toHaveBeenCalledWith('rest-123');
    });
  });

  describe('GET /inventory/ledger', () => {
    it('returns paginated ledger entries', async () => {
      const mockUser = { restaurantId: 'rest-123' };
      const mockResult = [{ id: 'entry-1', amount: 5 }];
      
      vi.mocked(mockLedgerService.getLedgerEntries!).mockResolvedValueOnce(mockResult);

      const result = await controller.getLedger(mockUser as any, 20, 10);
      
      expect(result).toEqual({ data: mockResult });
      expect(mockLedgerService.getLedgerEntries).toHaveBeenCalledWith('rest-123', 20, 10);
    });
  });
});
