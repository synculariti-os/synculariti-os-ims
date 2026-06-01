// @immutable-test — Written Red-first on: 2026-06-02 NEVER MODIFY after first GREEN.
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { InventoryCountController } from '../inventory-count.controller';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor';
import { INVENTORY_COUNT_SERVICE_TOKEN } from '../interfaces/i-inventory-count.service';
import type { IInventoryCountService } from '../interfaces/i-inventory-count.service';
import type { JwtPayload, CountBatchId, CountRowId } from '@ims/types';

describe('InventoryCountController', () => {
  let controller: InventoryCountController;
  let service: Mocked<IInventoryCountService>;

  const mockUser: JwtPayload = {
    sub: 'user-1' as any,
    email: 'test@test.com',
    restaurantId: 'rest-1' as any,
    franchiseGroupId: 'franchise-1' as any,
    permissions: [],
  };

  beforeEach(async () => {
    const mockService: Mocked<IInventoryCountService> = {
      startBatch: vi.fn(),
      submitActualCount: vi.fn(),
      closeBatch: vi.fn(),
      listBatches: vi.fn(),
      getBatchById: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryCountController],
      providers: [
        {
          provide: INVENTORY_COUNT_SERVICE_TOKEN,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .overrideInterceptor(TenantContextInterceptor).useValue({ intercept: (context: any, next: any) => next.handle() })
      .compile();

    controller = module.get<InventoryCountController>(InventoryCountController);
    service = module.get(INVENTORY_COUNT_SERVICE_TOKEN);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startBatch', () => {
    it('should call service.startBatch', async () => {
      const mockResult = { id: 'batch-1' } as any;
      service.startBatch.mockResolvedValue(mockResult);

      const result = await controller.startBatch(mockUser);
      
      expect(service.startBatch).toHaveBeenCalledWith(mockUser.restaurantId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('submitActualCount', () => {
    it('should call service.submitActualCount', async () => {
      const batchId = 'batch-1' as CountBatchId;
      const rowId = 'row-1' as CountRowId;
      const dto = { actualQty: 5 } as any;
      const mockResult = { id: rowId, actualQty: 5 } as any;
      service.submitActualCount.mockResolvedValue(mockResult);

      const result = await controller.submitActualCount(batchId, rowId, dto);
      
      expect(service.submitActualCount).toHaveBeenCalledWith(batchId, rowId, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('closeBatch', () => {
    it('should call service.closeBatch', async () => {
      const batchId = 'batch-1' as CountBatchId;
      const dto = { version: 1 } as any;
      service.closeBatch.mockResolvedValue(undefined);

      const result = await controller.closeBatch(batchId, dto);
      
      expect(service.closeBatch).toHaveBeenCalledWith(batchId, dto);
      expect(result).toEqual({ success: true });
    });
  });

  describe('listBatches', () => {
    it('should call service.listBatches', async () => {
      const mockResult = [{ id: 'batch-1' }] as any;
      service.listBatches.mockResolvedValue(mockResult);

      const result = await controller.listBatches(mockUser, 10, 5);
      
      expect(service.listBatches).toHaveBeenCalledWith(mockUser.restaurantId, 10, 5);
      expect(result).toEqual({ data: mockResult });
    });
  });

  describe('getBatchById', () => {
    it('should call service.getBatchById', async () => {
      const mockResult = { batch: { id: 'batch-1' }, rows: [] } as any;
      service.getBatchById.mockResolvedValue(mockResult);

      const result = await controller.getBatchById('batch-1');
      
      expect(service.getBatchById).toHaveBeenCalledWith('batch-1');
      expect(result).toEqual(mockResult);
    });
  });
});
