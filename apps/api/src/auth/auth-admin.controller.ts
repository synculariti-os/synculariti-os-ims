import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Inject, NotFoundException } from '@nestjs/common';
import { AUTH_ADMIN_SERVICE_TOKEN } from './interfaces/i-auth-admin.service';
import type { IAuthAdminService, CreateRoleDto, UpdateRoleDto, AssignUserRestaurantRoleDto } from './interfaces/i-auth-admin.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSION_CODES } from '@ims/types';
import type { RoleId, UserId, RestaurantId } from '@ims/types';

@Controller('admin')
export class AuthAdminController {
  constructor(
    @Inject(AUTH_ADMIN_SERVICE_TOKEN) private readonly authAdminService: IAuthAdminService,
  ) {}

  @Get('roles')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES)
  async listRoles() {
    const data = await this.authAdminService.listRoles();
    return { data };
  }

  @Post('roles')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES)
  async createRole(@Body() body: CreateRoleDto) {
    const data = await this.authAdminService.createRole(body);
    return { data };
  }

  @Patch('roles/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES)
  async updateRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    const data = await this.authAdminService.updateRole(id as RoleId, body);
    return { data };
  }

  @Delete('roles/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES)
  async deleteRole(@Param('id') id: string) {
    await this.authAdminService.deleteRole(id as RoleId);
    return { data: null };
  }

  @Get('permissions')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES)
  async listPermissions() {
    const data = await this.authAdminService.listPermissions();
    return { data };
  }

  @Get('role-permissions')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES)
  async listRolePermissions(@Query('roleId') roleId?: string) {
    if (!roleId) return { data: [] };
    const data = await this.authAdminService.listRolePermissions(roleId as RoleId);
    return { data };
  }

  @Post('role-permissions')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES)
  async assignPermissionToRole(@Body() body: { roleId: string; permissionId: string }) {
    await this.authAdminService.assignPermissionToRole(body.roleId as RoleId, body.permissionId);
    return { data: null };
  }

  @Delete('role-permissions')
  @RequirePermission(PERMISSION_CODES.ADMIN_ROLES)
  async removePermissionFromRole(@Query('roleId') roleId: string, @Query('permissionId') permissionId: string) {
    await this.authAdminService.removePermissionFromRole(roleId as RoleId, permissionId);
    return { data: null };
  }

  @Get('user-restaurant-roles')
  @RequirePermission(PERMISSION_CODES.ADMIN_USERS)
  async listUserRestaurantRoles(@Query('restaurantId') restaurantId?: string) {
    const data = await this.authAdminService.listUserRestaurantRoles(restaurantId as RestaurantId | undefined);
    return { data };
  }

  @Post('user-restaurant-roles')
  @RequirePermission(PERMISSION_CODES.ADMIN_USERS)
  async assignUserRestaurantRole(@Body() body: AssignUserRestaurantRoleDto) {
    await this.authAdminService.assignUserRestaurantRole(body);
    return { data: null };
  }

  @Delete('user-restaurant-roles')
  @RequirePermission(PERMISSION_CODES.ADMIN_USERS)
  async removeUserRestaurantRole(@Query('userId') userId: string, @Query('restaurantId') restaurantId: string, @Query('roleId') roleId: string) {
    await this.authAdminService.removeUserRestaurantRole({
      userId: userId as UserId,
      restaurantId: restaurantId as RestaurantId,
      roleId: roleId as RoleId
    });
    return { data: null };
  }

  @Get('users')
  @RequirePermission(PERMISSION_CODES.ADMIN_USERS)
  async listUsers() {
    const data = await this.authAdminService.listUsers();
    return { data };
  }
}
