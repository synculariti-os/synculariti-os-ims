import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from '../settings.service';
import { ISettingsRepository } from '../interfaces/i-settings.repository';
import type { FeatureFlag, FeatureFlagKey, RestaurantId } from '@ims/types';

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: vitest.Mocked<ISettingsRepository>;

  beforeEach(() => {
    repo = {
      getFeatureFlag: vi.fn(),
      getAllFeatureFlags: vi.fn(),
      setFeatureFlag: vi.fn(),
    };
    service = new SettingsService(repo);
  });

  describe('getFeatureFlag', () => {
    it('should return flag value if found', async () => {
      repo.getFeatureFlag.mockResolvedValue({ flagValue: true } as FeatureFlag);
      const res = await service.getFeatureFlag('r1' as RestaurantId, 'FF1');
      expect(res).toBe(true);
      expect(repo.getFeatureFlag).toHaveBeenCalledWith('r1', 'FF1');
    });

    it('should return false if not found', async () => {
      repo.getFeatureFlag.mockResolvedValue(null);
      const res = await service.getFeatureFlag('r1' as RestaurantId, 'FF1');
      expect(res).toBe(false);
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all flags', async () => {
      const mockFlags = [{ flagValue: true }] as FeatureFlag[];
      repo.getAllFeatureFlags.mockResolvedValue(mockFlags);
      const res = await service.getAllFeatureFlags('r1' as RestaurantId);
      expect(res).toEqual(mockFlags);
      expect(repo.getAllFeatureFlags).toHaveBeenCalledWith('r1');
    });
  });

  describe('setFeatureFlag', () => {
    it('should call repo to set flag', async () => {
      const mockFlag = { flagValue: false } as FeatureFlag;
      repo.setFeatureFlag.mockResolvedValue(mockFlag);
      const res = await service.setFeatureFlag('r1' as RestaurantId, 'FF1', false);
      expect(res).toEqual(mockFlag);
      expect(repo.setFeatureFlag).toHaveBeenCalledWith('r1', 'FF1', false);
    });
  });
});
