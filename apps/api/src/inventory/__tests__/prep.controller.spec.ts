/* eslint-disable @typescript-eslint/no-explicit-any */
// @immutable-test — Written Red-first on: 2026-06-02 NEVER MODIFY after first GREEN.
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PrepController } from '../prep.controller';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor';
import { PREP_SERVICE_TOKEN } from '../interfaces/i-prep.service';
import type { IPrepService } from '../interfaces/i-prep.service';
import type { JwtPayload } from '@ims/types';
import { CreatePrepLogDto } from '@ims/validators';

describe('PrepController', () => {
  let controller: PrepController;
  let service: Mocked<IPrepService>;

  const mockUser: JwtPayload = {
    sub: 'user-1' as any,
    email: 'test@test.com',
    restaurantId: 'rest-1' as any,
    franchiseGroupId: 'franchise-1' as any,
    permissions: [],
  };

  beforeEach(async () => {
    const mockService: Mocked<IPrepService> = {
      logPrepProduction: vi.fn(),
      planPrepProduction: vi.fn(),
      listPrepLogs: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrepController],
      providers: [
        {
          provide: PREP_SERVICE_TOKEN,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .overrideInterceptor(TenantContextInterceptor).useValue({ intercept: (context: any, next: any) => next.handle() })
      .compile();

    controller = module.get<PrepController>(PrepController);
    service = module.get(PREP_SERVICE_TOKEN);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('logPrepProduction', () => {
    it('should call service.logPrepProduction', async () => {
      const dto: CreatePrepLogDto = { prepItemId: 'item-1', yieldQtyProduced: 10 };
      const mockResult = { id: 'prep-1' } as any;
      service.logPrepProduction.mockResolvedValue(mockResult);

      const result = await controller.logPrepProduction(mockUser, dto);
      
      expect(service.logPrepProduction).toHaveBeenCalledWith(mockUser.restaurantId, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('listPrepLogs', () => {
    it('should call service.listPrepLogs', async () => {
      const mockResult = [{ id: 'prep-1' }] as any;
      service.listPrepLogs.mockResolvedValue(mockResult);

      const result = await controller.listPrepLogs(mockUser, 10, 5);
      
      expect(service.listPrepLogs).toHaveBeenCalledWith(mockUser.restaurantId, 10, 5);
      expect(result).toEqual({ data: mockResult });
    });
  });
});
