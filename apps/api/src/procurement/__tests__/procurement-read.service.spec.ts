/* eslint-disable @typescript-eslint/no-explicit-any */
// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, Mocked, beforeEach } from 'vitest';
import { ProcurementReadService } from '../procurement-read.service';
import { PROCUREMENT_REPOSITORY_TOKEN } from '../procurement.service';
import { IProcurementRepository } from '../interfaces/i-procurement.repository';
import { RestaurantId } from '@ims/types';

describe('ProcurementReadService', () => {
  let service: ProcurementReadService;
  let mockRepo: Mocked<IProcurementRepository>;

  const mockRestaurantId = 'rest-1' as RestaurantId;

  beforeEach(async () => {
    mockRepo = {
      getAverageUnitCosts: vi.fn(),
      getVendorPriceHistory: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementReadService,
        {
          provide: PROCUREMENT_REPOSITORY_TOKEN,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProcurementReadService>(ProcurementReadService);
  });

  describe('getAverageUnitCosts', () => {
    it('returns empty object when no inventory batches exist', async () => {
      (mockRepo.getAverageUnitCosts as any).mockResolvedValue({});
      
      const result = await service.getAverageUnitCosts(mockRestaurantId);
      expect(result).toEqual({});
      expect(mockRepo.getAverageUnitCosts).toHaveBeenCalledWith(mockRestaurantId);
    });

    it('returns average costs for multiple items', async () => {
      const mockCosts = {
        'item-1': 5.50,
        'item-2': 12.00,
      };
      (mockRepo.getAverageUnitCosts as any).mockResolvedValue(mockCosts);
      
      const result = await service.getAverageUnitCosts(mockRestaurantId);
      expect(result).toEqual(mockCosts);
    });
  });

  describe('getVendorPriceHistory', () => {
    it('returns empty array when no history exists', async () => {
      (mockRepo.getVendorPriceHistory as any).mockResolvedValue([]);
      
      const result = await service.getVendorPriceHistory(mockRestaurantId, 'item-1');
      expect(result).toEqual([]);
      expect(mockRepo.getVendorPriceHistory).toHaveBeenCalledWith(mockRestaurantId, 'item-1');
    });

    it('returns price history for an item', async () => {
      const mockHistory = [
        { date: '2023-01-01', landedUnitCost: 10, vendorId: 'v1', vendorName: 'Vendor 1', poId: 'po1' },
        { date: '2023-02-01', landedUnitCost: 11, vendorId: 'v1', vendorName: 'Vendor 1', poId: 'po2' },
      ];
      (mockRepo.getVendorPriceHistory as any).mockResolvedValue(mockHistory);
      
      const result = await service.getVendorPriceHistory(mockRestaurantId, 'item-1');
      expect(result).toEqual(mockHistory);
    });
  });
});
