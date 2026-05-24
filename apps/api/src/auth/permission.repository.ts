import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database, PermissionCode, UserId, RestaurantId, FranchiseGroupId, asFranchiseGroupId } from '@ims/types';
import { IPermissionRepository } from './interfaces/i-permission.repository';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  async resolvePermissions(userId: UserId, restaurantId: RestaurantId): Promise<PermissionCode[]> {
    // According to AGENTS.md, Auth agent resolves RBAC:
    // Look up user_restaurant_roles -> roles -> role_permissions -> permission codes
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

  async getFranchiseGroupForRestaurant(restaurantId: RestaurantId): Promise<FranchiseGroupId> {
    // Read from restaurants table to get franchise_group_id
    const result = await this.db
      .selectFrom('restaurants')
      .select('franchise_group_id')
      .where('id', '=', restaurantId)
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);
    }

    return asFranchiseGroupId(result.franchise_group_id);
  }
}
