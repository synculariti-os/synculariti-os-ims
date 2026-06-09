import { DB_CLIENT } from '../core/core.symbols';
import { Injectable, Inject, } from '@nestjs/common';
import * as crypto from 'crypto';
import { Kysely } from 'kysely';
import { Database, PermissionCode, UserId, RestaurantId, RoleId, Role, FranchiseGroupId } from '@ims/types';
import { IPermissionRepository } from './interfaces/i-permission.repository';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(@Inject(DB_CLIENT) private readonly db: Kysely<Database>) {}

  async resolvePermissions(userId: UserId, restaurantId: RestaurantId): Promise<PermissionCode[]> {
    const result = await this.db
      .selectFrom('user_restaurant_roles as urr')
      .innerJoin('roles as r', 'r.id', 'urr.role_id')
      .innerJoin('role_permissions as rp', 'rp.role_id', 'r.id')
      .innerJoin('permissions as p', 'p.id', 'rp.permission_id')
      .select('p.code')
      .where('urr.user_id', '=', userId)
      .where('urr.restaurant_id', '=', restaurantId)
      .execute();

    return result.map(row => row.code as PermissionCode);
  }

  async findAllRoles(): Promise<Role[]> {
    const roles = await this.db
      .selectFrom('roles')
      .selectAll()
      .execute();
    return roles.map(r => ({
      id: r.id as RoleId,
      name: r.name,
      description: r.description,
      createdAt: r.created_at,
    }));
  }

  async findRoleById(roleId: RoleId): Promise<Role | null> {
    const r = await this.db
      .selectFrom('roles')
      .selectAll()
      .where('id', '=', roleId)
      .executeTakeFirst();
    if (!r) return null;
    return {
      id: r.id as RoleId,
      name: r.name,
      description: r.description,
      createdAt: r.created_at,
    };
  }

  async createRole(dto: { name: string; description?: string }): Promise<Role> {
    const r = await this.db
      .insertInto('roles')
      .values({
        id: crypto.randomUUID() as RoleId,
        name: dto.name,
        description: dto.description,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return {
      id: r.id as RoleId,
      name: r.name,
      description: r.description,
      createdAt: r.created_at,
    };
  }

  async updateRole(roleId: RoleId, dto: { name?: string; description?: string }): Promise<Role> {
    const r = await this.db
      .updateTable('roles')
      .set(dto)
      .where('id', '=', roleId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return {
      id: r.id as RoleId,
      name: r.name,
      description: r.description,
      createdAt: r.created_at,
    };
  }

  async deleteRole(roleId: RoleId): Promise<void> {
    await this.db.deleteFrom('roles').where('id', '=', roleId).execute();
  }

  async findAllPermissions(): Promise<Array<{ id: string; code: PermissionCode; description: string | null }>> {
    const perms = await this.db.selectFrom('permissions').selectAll().execute();
    return perms.map(p => ({
      id: p.id,
      code: p.code as PermissionCode,
      description: p.description,
    }));
  }

  async findAllRolePermissions(roleId: RoleId): Promise<Array<{ roleId: RoleId; permissionId: string }>> {
    const rps = await this.db
      .selectFrom('role_permissions')
      .selectAll()
      .where('role_id', '=', roleId)
      .execute();
    return rps.map(rp => ({
      roleId: rp.role_id as RoleId,
      permissionId: rp.permission_id,
    }));
  }

  async assignPermissionToRole(roleId: RoleId, permissionId: string): Promise<void> {
    await this.db
      .insertInto('role_permissions')
      .values({ role_id: roleId, permission_id: permissionId })
      .onConflict(oc => oc.columns(['role_id', 'permission_id']).doNothing())
      .execute();
  }

  async removePermissionFromRole(roleId: RoleId, permissionId: string): Promise<void> {
    await this.db
      .deleteFrom('role_permissions')
      .where('role_id', '=', roleId)
      .where('permission_id', '=', permissionId)
      .execute();
  }

  async findAllUserRestaurantRoles(restaurantId?: RestaurantId): Promise<Array<{ userId: UserId; restaurantId: RestaurantId; roleId: RoleId; userEmail?: string; roleName?: string }>> {
    let query = this.db
      .selectFrom('user_restaurant_roles as urr')
      .leftJoin('users as u', 'u.id', 'urr.user_id')
      .leftJoin('roles as r', 'r.id', 'urr.role_id')
      .select([
        'urr.user_id',
        'urr.restaurant_id',
        'urr.role_id',
        'u.email as user_email',
        'r.name as role_name',
      ]);

    if (restaurantId) {
      query = query.where('urr.restaurant_id', '=', restaurantId);
    }

    const rows = await query.execute();
    return rows.map(r => ({
      userId: r.user_id as UserId,
      restaurantId: r.restaurant_id as RestaurantId,
      roleId: r.role_id as RoleId,
      userEmail: r.user_email || undefined,
      roleName: r.role_name || undefined,
    }));
  }

  async assignUserRestaurantRole(dto: { userId: UserId; restaurantId: RestaurantId; roleId: RoleId }): Promise<{ userId: UserId; restaurantId: RestaurantId; roleId: RoleId }> {
    await this.db
      .insertInto('user_restaurant_roles')
      .values({
        user_id: dto.userId,
        restaurant_id: dto.restaurantId,
        role_id: dto.roleId,
      })
      .onConflict(oc => oc.columns(['user_id', 'restaurant_id']).doUpdateSet({ role_id: dto.roleId }))
      .execute();
    return dto;
  }

  async removeUserRestaurantRoleByComposite(userId: UserId, restaurantId: RestaurantId, roleId: RoleId): Promise<void> {
    await this.db
      .deleteFrom('user_restaurant_roles')
      .where('user_id', '=', userId)
      .where('restaurant_id', '=', restaurantId)
      .where('role_id', '=', roleId)
      .execute();
  }

  async getFranchiseGroupForRestaurant(restaurantId: RestaurantId): Promise<FranchiseGroupId | null> {
    const res = await this.db
      .selectFrom('restaurants')
      .select('franchise_group_id')
      .where('id', '=', restaurantId)
      .executeTakeFirst();
    return res ? (res.franchise_group_id as FranchiseGroupId) : null;
  }
}
