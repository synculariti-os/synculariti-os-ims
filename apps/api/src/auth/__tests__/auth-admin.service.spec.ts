// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthAdminService } from '../auth-admin.service';
import { PERMISSION_REPOSITORY_TOKEN, USER_REPOSITORY_TOKEN } from '../../core/core.symbols';
import type { IPermissionRepository } from '../interfaces/i-permission.repository';
import type { IUserRepository } from '../interfaces/i-user.repository';
import { NotFoundException } from '@nestjs/common';
import type { RoleId, UserId, RestaurantId } from '@ims/types';

describe('AuthAdminService', () => {
  let service: AuthAdminService;
  let permissionRepo: Record<keyof IPermissionRepository, ReturnType<typeof vi.fn>>;
  let userRepo: Record<keyof IUserRepository, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    permissionRepo = {
      resolvePermissions: vi.fn(),
      findAllRoles: vi.fn(),
      findRoleById: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      findAllPermissions: vi.fn(),
      findAllRolePermissions: vi.fn(),
      assignPermissionToRole: vi.fn(),
      removePermissionFromRole: vi.fn(),
      findAllUserRestaurantRoles: vi.fn(),
      assignUserRestaurantRole: vi.fn(),
      removeUserRestaurantRoleByComposite: vi.fn(),
      getFranchiseGroupForRestaurant: vi.fn(),
    } as any;

    userRepo = {
      findById: vi.fn(),
      updateLastLogin: vi.fn(),
      updateProfile: vi.fn(),
      findAll: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthAdminService,
        { provide: PERMISSION_REPOSITORY_TOKEN, useValue: permissionRepo },
        { provide: USER_REPOSITORY_TOKEN, useValue: userRepo },
      ],
    }).compile();

    service = module.get<AuthAdminService>(AuthAdminService);
  });

  describe('listRoles', () => {
    it('should return roles from repository', async () => {
      const mockRoles = [{ id: 'r1', name: 'Admin', description: null, createdAt: new Date().toISOString() }];
      permissionRepo.findAllRoles.mockResolvedValue(mockRoles);
      const result = await service.listRoles();
      expect(result).toEqual(mockRoles);
      expect(permissionRepo.findAllRoles).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRoleById', () => {
    it('should return a role if found', async () => {
      const mockRole = { id: 'r1', name: 'Admin', description: null, createdAt: new Date().toISOString() };
      permissionRepo.findRoleById.mockResolvedValue(mockRole);
      const result = await service.getRoleById('r1' as RoleId);
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      permissionRepo.findRoleById.mockResolvedValue(null);
      await expect(service.getRoleById('missing' as RoleId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRole', () => {
    it('should create and return a role', async () => {
      const dto = { name: 'Manager' };
      const createdRole = { id: 'r2', name: 'Manager', description: null, createdAt: new Date().toISOString() };
      permissionRepo.createRole.mockResolvedValue(createdRole);
      const result = await service.createRole(dto);
      expect(result).toEqual(createdRole);
      expect(permissionRepo.createRole).toHaveBeenCalledWith(dto);
    });
  });

  describe('assignUserRestaurantRole', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(
        service.assignUserRestaurantRole({
          userId: 'u1' as UserId,
          restaurantId: 'rest1' as RestaurantId,
          roleId: 'r1' as RoleId,
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u1', active: true });
      permissionRepo.findRoleById.mockResolvedValue(null);
      await expect(
        service.assignUserRestaurantRole({
          userId: 'u1' as UserId,
          restaurantId: 'rest1' as RestaurantId,
          roleId: 'r1' as RoleId,
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should call assignUserRestaurantRole when valid', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u1', active: true });
      permissionRepo.findRoleById.mockResolvedValue({ id: 'r1', name: 'Admin' });
      const mockReturn = { userId: 'u1', restaurantId: 'rest1', roleId: 'r1' };
      permissionRepo.assignUserRestaurantRole.mockResolvedValue(mockReturn);
      const dto = { userId: 'u1' as UserId, restaurantId: 'rest1' as RestaurantId, roleId: 'r1' as RoleId };
      await service.assignUserRestaurantRole(dto);
      expect(permissionRepo.assignUserRestaurantRole).toHaveBeenCalledWith(dto);
    });
  });
});
