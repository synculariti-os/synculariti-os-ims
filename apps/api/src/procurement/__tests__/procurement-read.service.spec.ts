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
});
