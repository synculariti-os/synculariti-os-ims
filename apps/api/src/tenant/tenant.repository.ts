import { Injectable, Inject } from '@nestjs/common';
import { Database } from '@ims/types';
import { Kysely } from 'kysely';
import { ITenantRepository } from './interfaces/i-tenant.repository';
import type { Restaurant, FranchiseGroup, RestaurantId, FranchiseGroupId, UserId } from '@ims/types';

@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(
    @Inject('DB_CLIENT') private readonly db: Kysely<Database>,
  ) {}

  async findById(restaurantId: RestaurantId): Promise<Restaurant | undefined> {
    const restaurant = await this.db
      .selectFrom('restaurants')
      .selectAll()
      .where('id', '=', restaurantId)
      .executeTakeFirst();
    
    if (!restaurant) return undefined;
    
    return {
      id: restaurant.id,
      franchiseGroupId: restaurant.franchise_group_id,
      name: restaurant.name,
      timezone: restaurant.timezone,
      createdAt: restaurant.created_at,
      updatedAt: restaurant.updated_at,
    } as Restaurant;
  }

  async findFranchiseGroupById(franchiseGroupId: FranchiseGroupId): Promise<FranchiseGroup | undefined> {
    const group = await this.db
      .selectFrom('franchise_groups')
      .selectAll()
      .where('id', '=', franchiseGroupId)
      .executeTakeFirst();

    if (!group) return undefined;

    return {
      id: group.id,
      name: group.name,
      legalName: (group as any).legal_name,
      taxId: (group as any).tax_id,
      countryCode: (group as any).country_code,
      active: (group as any).active,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
    } as FranchiseGroup;
  }

  async findRestaurantsByUserId(userId: UserId): Promise<Restaurant[]> {
    const restaurants = await this.db
      .selectFrom('user_restaurant_roles')
      .innerJoin('restaurants', 'restaurants.id', 'user_restaurant_roles.restaurant_id')
      .selectAll('restaurants')
      .where('user_restaurant_roles.user_id', '=', userId)
      .execute();

    return restaurants.map(r => ({
      id: r.id as RestaurantId,
      franchiseGroupId: r.franchise_group_id as FranchiseGroupId,
      name: r.name,
      timezone: r.timezone,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async createFranchiseGroup(name: string): Promise<FranchiseGroup> {
    const result = await this.db
      .insertInto('franchise_groups')
      .values({ name })
      .returningAll()
      .executeTakeFirstOrThrow();
    return (await this.findFranchiseGroupById(result.id as FranchiseGroupId))!;
  }

  async updateFranchiseGroup(id: string, name?: string): Promise<FranchiseGroup> {
    const query = this.db.updateTable('franchise_groups').where('id', '=', id as FranchiseGroupId).returningAll();
    if (name !== undefined) {
      query.set({ name });
    }
    const result = await query.executeTakeFirstOrThrow();
    return (await this.findFranchiseGroupById(result.id as FranchiseGroupId))!;
  }

  async createRestaurant(name: string, franchiseGroupId: string, timezone: string): Promise<Restaurant> {
    const result = await this.db
      .insertInto('restaurants')
      .values({ name, franchise_group_id: franchiseGroupId as FranchiseGroupId, timezone })
      .returningAll()
      .executeTakeFirstOrThrow();
    return (await this.findById(result.id as RestaurantId))!;
  }

  async updateRestaurant(id: string, name?: string, timezone?: string): Promise<Restaurant> {
    let query = this.db.updateTable('restaurants').where('id', '=', id as RestaurantId).returningAll();
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (timezone !== undefined) updates.timezone = timezone;
    if (Object.keys(updates).length > 0) {
        query = query.set(updates);
    }
    const result = await query.executeTakeFirstOrThrow();
    return (await this.findById(result.id as RestaurantId))!;
  }

  async deleteFranchiseGroup(id: string): Promise<void> {
    await this.db.deleteFrom('franchise_groups').where('id', '=', id as FranchiseGroupId).execute();
  }

  async deleteRestaurant(id: string): Promise<void> {
    await this.db.deleteFrom('restaurants').where('id', '=', id as RestaurantId).execute();
  }
}
