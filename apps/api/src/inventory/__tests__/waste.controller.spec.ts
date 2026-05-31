import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { WasteController } from '../waste.controller';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor';
import { WASTE_SERVICE_TOKEN } from '../interfaces/i-waste.service';
import type { IWasteService } from '../interfaces/i-waste.service';
import type { JwtPayload } from '@ims/types';
import { CreateWasteLogDto } from '@ims/validators';

describe('WasteController', () => {
  let controller: WasteController;
  let service: Mocked<IWasteService>;

  const mockUser: JwtPayload = {
    sub: 'user-1' as any,
    email: 'test@test.com',
    restaurantId: 'rest-1' as any,
    franchiseGroupId: 'franchise-1' as any,
    permissions: [],
  };

  beforeEach(async () => {
    const mockService: Mocked<IWasteService> = {
      logWaste: vi.fn(),
      listWasteLogs: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WasteController],
      providers: [
        {
          provide: WASTE_SERVICE_TOKEN,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .overrideInterceptor(TenantContextInterceptor).useValue({ intercept: (context: any, next: any) => next.handle() })
      .compile();

    controller = module.get<WasteController>(WasteController);
    service = module.get(WASTE_SERVICE_TOKEN);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('logWaste', () => {
    it('should call service.logWaste', async () => {
      const dto: CreateWasteLogDto = { itemId: 'item-1', quantity: 5, reason: 'dropped' };
      const mockResult = { id: 'waste-1' } as any;
      service.logWaste.mockResolvedValue(mockResult);

      const result = await controller.logWaste(mockUser, dto);
      
      expect(service.logWaste).toHaveBeenCalledWith(mockUser.restaurantId, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('listWasteLogs', () => {
    it('should call service.listWasteLogs', async () => {
      const mockResult = [{ id: 'waste-1' }] as any;
      service.listWasteLogs.mockResolvedValue(mockResult);

      const result = await controller.listWasteLogs(mockUser, 10, 5);
      
      expect(service.listWasteLogs).toHaveBeenCalledWith(mockUser.restaurantId, 10, 5);
      expect(result).toEqual({ data: mockResult });
    });
  });
});
