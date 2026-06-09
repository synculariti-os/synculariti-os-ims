import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN, PERMISSION_REPOSITORY_TOKEN } from '../core/core.symbols';
import type { IAuthAdminService, CreateRoleDto, UpdateRoleDto, AssignUserRestaurantRoleDto, RemoveUserRestaurantRoleDto } from './interfaces/i-auth-admin.service';
import type { IUserRepository } from './interfaces/i-user.repository';
import type { IPermissionRepository } from './interfaces/i-permission.repository';
import type { RoleId, UserId, RestaurantId, Role, SafeUser, PermissionCode } from '@ims/types';

@Injectable()
export class AuthAdminService implements IAuthAdminService {
  constructor(
    @Inject(PERMISSION_REPOSITORY_TOKEN) private readonly permissionRepo: IPermissionRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: IUserRepository,
  ) {}

  async listRoles(): Promise<Role[]> {
    return this.permissionRepo.findAllRoles();
  }

  async getRoleById(roleId: RoleId): Promise<Role> {
    const role = await this.permissionRepo.findRoleById(roleId);
    if (!role) throw new NotFoundException(`Role ${roleId} not found`);
    return role;
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    return this.permissionRepo.createRole(dto);
  }

  async updateRole(roleId: RoleId, dto: UpdateRoleDto): Promise<Role> {
    // Check if role exists
    await this.getRoleById(roleId);
    return this.permissionRepo.updateRole(roleId, dto);
  }

  async deleteRole(roleId: RoleId): Promise<void> {
    // Check if role exists
    await this.getRoleById(roleId);
    return this.permissionRepo.deleteRole(roleId);
  }

  async listPermissions(): Promise<Array<{ id: string; code: PermissionCode; description: string | null }>> {
    return this.permissionRepo.findAllPermissions();
  }

  async listRolePermissions(roleId: RoleId): Promise<Array<{ roleId: RoleId; permissionId: string }>> {
    return this.permissionRepo.findAllRolePermissions(roleId);
  }

  async assignPermissionToRole(roleId: RoleId, permissionId: string): Promise<void> {
    await this.getRoleById(roleId); // ensure role exists
    return this.permissionRepo.assignPermissionToRole(roleId, permissionId);
  }

  async removePermissionFromRole(roleId: RoleId, permissionId: string): Promise<void> {
    await this.getRoleById(roleId); // ensure role exists
    return this.permissionRepo.removePermissionFromRole(roleId, permissionId);
  }

  async listUserRestaurantRoles(restaurantId?: RestaurantId): Promise<Array<{ userId: UserId; restaurantId: RestaurantId; roleId: RoleId; userEmail?: string; roleName?: string }>> {
    return this.permissionRepo.findAllUserRestaurantRoles(restaurantId);
  }

  async assignUserRestaurantRole(dto: AssignUserRestaurantRoleDto): Promise<void> {
    const user = await this.userRepo.findById(dto.userId);
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const role = await this.permissionRepo.findRoleById(dto.roleId);
    if (!role) throw new NotFoundException(`Role ${dto.roleId} not found`);

    await this.permissionRepo.assignUserRestaurantRole(dto);
  }

  async removeUserRestaurantRole(dto: RemoveUserRestaurantRoleDto): Promise<void> {
    return this.permissionRepo.removeUserRestaurantRoleByComposite(dto.userId, dto.restaurantId, dto.roleId);
  }

  async listUsers(): Promise<SafeUser[]> {
    return this.userRepo.findAll();
  }
}
