// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ProcurementController } from '../procurement.controller';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor';
import { PROCUREMENT_SERVICE_TOKEN } from '../interfaces/i-procurement.service';
import type { IProcurementService } from '../interfaces/i-procurement.service';
import type { JwtPayload, PurchaseOrderId } from '@ims/types';

describe('ProcurementController', () => {
  let controller: ProcurementController;
  let service: Mocked<IProcurementService>;

  const mockUser: JwtPayload = {
    sub: 'user-1' as any,
    email: 'test@test.com',
    restaurantId: 'rest-1' as any,
    franchiseGroupId: 'franchise-1' as any,
    permissions: [],
  };

  beforeEach(async () => {
    const mockService: Mocked<IProcurementService> = {
      createDraftPO: vi.fn(),
      submitPO: vi.fn(),
      receivePO: vi.fn(),
      cancelPO: vi.fn(),
      listPOs: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcurementController],
      providers: [
        {
          provide: PROCUREMENT_SERVICE_TOKEN,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .overrideInterceptor(TenantContextInterceptor).useValue({ intercept: (context: any, next: any) => next.handle() })
      .compile();

    controller = module.get<ProcurementController>(ProcurementController);
    service = module.get(PROCUREMENT_SERVICE_TOKEN);
  });

  describe('createPO', () => {
    it('should call service.createDraftPO with dto', async () => {
      const mockDto = { vendorId: 'vendor-1', lineItems: [] } as any;
      const mockResult = { id: 'po-1' } as any;
      service.createDraftPO.mockResolvedValue(mockResult);

      const result = await controller.createDraftPO(mockUser, mockDto);
      
      expect(service.createDraftPO).toHaveBeenCalledWith(mockUser.restaurantId, mockDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('submitPO', () => {
    it('should call service.submitPO', async () => {
      const poId = 'po-1' as PurchaseOrderId;
      const mockResult = { id: poId, status: 'SUBMITTED' } as any;
      service.submitPO.mockResolvedValue(mockResult);

      const result = await controller.submitPO(poId, mockUser);
      
      expect(service.submitPO).toHaveBeenCalledWith(poId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('listPOs', () => {
    it('should call service.listPOs', async () => {
      const mockResult = [{ id: 'po-1' }] as any;
      service.listPOs.mockResolvedValue(mockResult);

      const result = await controller.listPOs(mockUser);
      
      expect(service.listPOs).toHaveBeenCalledWith(mockUser.restaurantId, 50, 0);
      expect(result).toEqual({ data: mockResult });
    });
  });

  describe('receivePO', () => {
    it('should call service.receivePO', async () => {
      const poId = 'po-1' as PurchaseOrderId;
      const dto = { lineItems: [{ itemId: 'item-1', quantityReceived: 10 }] } as any;
      
      await controller.receivePO(poId, dto, mockUser);
      
      expect(service.receivePO).toHaveBeenCalledWith(poId, dto);
    });
  });

  describe('cancelPO', () => {
    it('should call service.cancelPO', async () => {
      const poId = 'po-1' as PurchaseOrderId;
      
      await controller.cancelPO(poId, mockUser);
      
      expect(service.cancelPO).toHaveBeenCalledWith(poId);
    });
  });
});
