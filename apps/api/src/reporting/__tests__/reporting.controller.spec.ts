// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, Mocked, beforeEach } from 'vitest';
import { ReportingController } from '../reporting.controller';
import { IReportingService, REPORTING_SERVICE_TOKEN } from '../interfaces/i-reporting.service';
import { IReportingCogsService, REPORTING_COGS_SERVICE_TOKEN } from '../interfaces/i-reporting-cogs.service';
import { RestaurantId } from '@ims/types';

describe('ReportingController', () => {
  let controller: ReportingController;
  let mockReportingService: Mocked<IReportingService>;
  let mockCogsService: Mocked<IReportingCogsService>;

  const mockUser = {
    sub: 'user-1',
    email: 'test@example.com',
    restaurantId: 'rest-1' as RestaurantId,
    franchiseGroupId: 'fg-1',
    permissions: [],
  };

  beforeEach(async () => {
    mockReportingService = {
      getVarianceReport: vi.fn(),
      getSnapshots: vi.fn(),
      getParAlerts: vi.fn(),
    } as any;

    mockCogsService = {
      getMenuCostingReport: vi.fn(),
      getVendorPriceHistory: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [
        {
          provide: REPORTING_SERVICE_TOKEN,
          useValue: mockReportingService,
        },
        {
          provide: REPORTING_COGS_SERVICE_TOKEN,
          useValue: mockCogsService,
        },
      ],
    }).compile();

    controller = module.get<ReportingController>(ReportingController);
  });

  describe('getVendorPriceHistory', () => {
    it('calls cogsService.getVendorPriceHistory with correct params', async () => {
      const mockResult = [{ date: '2023-01-01', landedUnitCost: 10, vendorId: 'v1', vendorName: 'Vendor 1', poId: 'po1' }];
      (mockCogsService.getVendorPriceHistory as any).mockResolvedValue(mockResult);

      const result = await controller.getVendorPriceHistory(mockUser as any, { itemId: 'item-1' });

      expect(result).toEqual(mockResult);
      expect(mockCogsService.getVendorPriceHistory).toHaveBeenCalledWith('rest-1', 'item-1');
    });
  });
});
