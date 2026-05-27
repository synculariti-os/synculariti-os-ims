// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TenantService } from '../tenant.service';
import { ITenantRepository, TENANT_REPOSITORY_TOKEN } from '../interfaces/i-tenant.repository';
import { vi, describe, it, expect, beforeEach, Mocked } from 'vitest';
import type { Restaurant, FranchiseGroup, RestaurantId, FranchiseGroupId, UserId } from '@ims/types';

const mockRestaurant: Restaurant = {
  id: 'rest-1' as RestaurantId,
  franchiseGroupId: 'fran-1' as FranchiseGroupId,
  name: 'Test Restaurant',
  timezone: 'UTC',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFranchiseGroup: FranchiseGroup = {
  id: 'fran-1' as FranchiseGroupId,
  name: 'Test Franchise',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TenantService', () => {
  let service: TenantService;
  let repo: Mocked<ITenantRepository>;

  beforeEach(async () => {
    const repoMock = {
      findById: vi.fn(),
      findFranchiseGroupById: vi.fn(),
      findRestaurantsByUserId: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: TENANT_REPOSITORY_TOKEN,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    repo = module.get(TENANT_REPOSITORY_TOKEN);
  });

  describe('getRestaurant', () => {
    it('should return a restaurant when found', async () => {
      repo.findById.mockResolvedValue(mockRestaurant);
      const result = await service.getRestaurant(mockRestaurant.id);
      expect(result).toEqual(mockRestaurant);
      expect(repo.findById).toHaveBeenCalledWith(mockRestaurant.id);
    });

    it('should throw NotFoundException when restaurant not found', async () => {
      repo.findById.mockResolvedValue(undefined as any);
      await expect(service.getRestaurant('invalid' as RestaurantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFranchiseGroup', () => {
    it('should return a franchise group when found', async () => {
      repo.findFranchiseGroupById.mockResolvedValue(mockFranchiseGroup);
      const result = await service.getFranchiseGroup(mockFranchiseGroup.id);
      expect(result).toEqual(mockFranchiseGroup);
      expect(repo.findFranchiseGroupById).toHaveBeenCalledWith(mockFranchiseGroup.id);
    });

    it('should throw NotFoundException when franchise group not found', async () => {
      repo.findFranchiseGroupById.mockResolvedValue(undefined as any);
      await expect(service.getFranchiseGroup('invalid' as FranchiseGroupId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listRestaurantsForUser', () => {
    it('should return a list of restaurants for a user', async () => {
      repo.findRestaurantsByUserId.mockResolvedValue([mockRestaurant]);
      const result = await service.listRestaurantsForUser('user-1' as UserId);
      expect(result).toEqual([mockRestaurant]);
      expect(repo.findRestaurantsByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should return empty array if user has no restaurants', async () => {
      repo.findRestaurantsByUserId.mockResolvedValue([]);
      const result = await service.listRestaurantsForUser('user-1' as UserId);
      expect(result).toEqual([]);
    });
  });
});
