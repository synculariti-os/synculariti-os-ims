/* @immutable-test — Written Red-first on: 2026-05-23. NEVER MODIFY after first GREEN. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthService } from '../auth.service';
import type { IUserRepository } from '../interfaces/i-user.repository';
import type { IPermissionRepository } from '../interfaces/i-permission.repository';
import type { JwtPayload, SafeUser, PermissionCode } from '@ims/types';
import { PERMISSION_CODES } from '@ims/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const MOCK_SUPABASE_USER = {
  id: 'user-uuid-123',
  email: 'chef@restaurant.com',
};

const MOCK_PUBLIC_USER: SafeUser = {
  id: 'user-uuid-123' as never,
  email: 'chef@restaurant.com',
  fullName: 'Chef Marco',
  phoneNumber: null,
  active: true,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_PERMISSIONS: PermissionCode[] = [
  PERMISSION_CODES.INVENTORY_READ,
  PERMISSION_CODES.INVENTORY_WRITE,
  PERMISSION_CODES.PROCUREMENT_READ,
];

const RESTAURANT_ID = 'restaurant-uuid-abc' as never;
const FRANCHISE_GROUP_ID = 'franchise-uuid-xyz' as never;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockSupabaseAdminGetUser = vi.fn();
const mockSupabaseAdmin = {
  auth: {
    getUser: mockSupabaseAdminGetUser,
  },
} as unknown as SupabaseClient;

const mockUserRepository: IUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  updateLastLogin: vi.fn(),
  updateProfile: vi.fn(),
};

const mockPermissionRepository: IPermissionRepository = {
  resolvePermissions: vi.fn(),
};

const mockTenantService = {
  getRestaurant: vi.fn(),
  getFranchiseGroup: vi.fn(),
  listRestaurantsForUser: vi.fn(),
} as never;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(
      mockSupabaseAdmin,
      mockUserRepository,
      mockPermissionRepository,
      mockTenantService,
    );
  });

  // ── verifyAndEnrich ──────────────────────────────────────────────────────

  describe('verifyAndEnrich()', () => {
    it('returns a full JwtPayload when token and restaurantId are valid', async () => {
      mockSupabaseAdminGetUser.mockResolvedValueOnce({
        data: { user: MOCK_SUPABASE_USER },
        error: null,
      });
      vi.mocked(mockUserRepository.findById).mockResolvedValueOnce(MOCK_PUBLIC_USER);
      vi.mocked(mockTenantService.getRestaurant).mockResolvedValueOnce({
        franchiseGroupId: FRANCHISE_GROUP_ID,
      } as never);
      vi.mocked(mockPermissionRepository.resolvePermissions).mockResolvedValueOnce(
        MOCK_PERMISSIONS,
      );

      const result = await service.verifyAndEnrich('valid-token', RESTAURANT_ID);

      expect(result).toMatchObject<JwtPayload>({
        sub: MOCK_SUPABASE_USER.id as never,
        email: MOCK_SUPABASE_USER.email,
        restaurantId: RESTAURANT_ID,
        franchiseGroupId: FRANCHISE_GROUP_ID,
        permissions: MOCK_PERMISSIONS,
      });
    });

    it('throws UnauthorizedException when Supabase returns an error', async () => {
      mockSupabaseAdminGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid JWT' },
      });

      await expect(service.verifyAndEnrich('bad-token', RESTAURANT_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when Supabase returns no user', async () => {
      mockSupabaseAdminGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      await expect(service.verifyAndEnrich('expired-token', RESTAURANT_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws ForbiddenException when public user profile has active = false', async () => {
      mockSupabaseAdminGetUser.mockResolvedValueOnce({
        data: { user: MOCK_SUPABASE_USER },
        error: null,
      });
      vi.mocked(mockUserRepository.findById).mockResolvedValueOnce({
        ...MOCK_PUBLIC_USER,
        active: false,
      });

      await expect(service.verifyAndEnrich('valid-token', RESTAURANT_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when user has no role for the requested restaurant', async () => {
      mockSupabaseAdminGetUser.mockResolvedValueOnce({
        data: { user: MOCK_SUPABASE_USER },
        error: null,
      });
      vi.mocked(mockUserRepository.findById).mockResolvedValueOnce(MOCK_PUBLIC_USER);
      vi.mocked(mockTenantService.getRestaurant).mockResolvedValueOnce({
        franchiseGroupId: FRANCHISE_GROUP_ID,
      } as never);
      // No role assigned → empty permissions
      vi.mocked(mockPermissionRepository.resolvePermissions).mockResolvedValueOnce([]);

      const result = await service.verifyAndEnrich('valid-token', RESTAURANT_ID);
      // Empty permissions is allowed — guard will reject at route level
      expect(result.permissions).toEqual([]);
    });
  });

  describe('verifyToken', () => {
    it('should return basic user data when token is valid', async () => {
      mockSupabaseAdminGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-uuid-123', email: 'test@example.com' } },
        error: null,
      });

      const result = await service.verifyToken('valid_token');

      expect(mockSupabaseAdminGetUser).toHaveBeenCalledWith('valid_token');
      expect(result).toEqual({
        sub: 'user-uuid-123',
        email: 'test@example.com',
      });
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockSupabaseAdminGetUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: new Error('Invalid') 
      });

      await expect(service.verifyToken('invalid_token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── resolvePermissions ───────────────────────────────────────────────────

  describe('resolvePermissions()', () => {
    it('returns deduplicated permission codes for a user+restaurant pair', async () => {
      vi.mocked(mockPermissionRepository.resolvePermissions).mockResolvedValueOnce(
        MOCK_PERMISSIONS,
      );

      const result = await service.resolvePermissions('user-uuid-123' as never, RESTAURANT_ID);

      expect(result).toEqual(MOCK_PERMISSIONS);
      expect(mockPermissionRepository.resolvePermissions).toHaveBeenCalledWith(
        'user-uuid-123',
        RESTAURANT_ID,
      );
    });
  });

  // ── getProfile ───────────────────────────────────────────────────────────

  describe('getProfile()', () => {
    it('returns a SafeUser (never exposes passwordHash)', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValueOnce(MOCK_PUBLIC_USER);

      const result = await service.getProfile('user-uuid-123' as never);

      expect(result).toEqual(MOCK_PUBLIC_USER);
      // Explicitly assert no passwordHash leakage
      expect((result as never).passwordHash).toBeUndefined();
    });

    it('throws when user is not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValueOnce(null);

      await expect(service.getProfile('non-existent' as never)).rejects.toThrow();
    });
  });

  // ── updateProfile ────────────────────────────────────────────────────────

  describe('updateProfile()', () => {
    it('updates fullName and phoneNumber and returns the updated profile', async () => {
      const updated: SafeUser = { ...MOCK_PUBLIC_USER, fullName: 'Chef Marco Rossi' };
      vi.mocked(mockUserRepository.updateProfile).mockResolvedValueOnce(updated);

      const result = await service.updateProfile('user-uuid-123' as never, {
        fullName: 'Chef Marco Rossi',
      });

      expect(result.fullName).toBe('Chef Marco Rossi');
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith('user-uuid-123', {
        fullName: 'Chef Marco Rossi',
      });
    });
  });
});
