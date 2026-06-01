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

  async findById(restaurantId: RestaurantId): Promise<Restaurant> {
    const restaurant = await this.db
      .selectFrom('restaurants')
      .selectAll()
      .where('id', '=', restaurantId)
      .executeTakeFirst();
    
    if (!restaurant) return undefined as unknown as Restaurant;
    
    return {
      id: restaurant.id,
      franchiseGroupId: restaurant.franchise_group_id,
      name: restaurant.name,
      timezone: restaurant.timezone,
      createdAt: restaurant.created_at,
      updatedAt: restaurant.updated_at,
    } as unknown as Restaurant;
  }

  async findFranchiseGroupById(franchiseGroupId: FranchiseGroupId): Promise<FranchiseGroup> {
    const group = await this.db
      .selectFrom('franchise_groups')
      .selectAll()
      .where('id', '=', franchiseGroupId)
      .executeTakeFirst();

    if (!group) return undefined as unknown as FranchiseGroup;

    return {
      id: group.id,
      name: group.name,
      legalName: (group as any).legal_name,
      taxId: (group as any).tax_id,
      countryCode: (group as any).country_code,
      active: (group as any).active,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
    } as unknown as FranchiseGroup;
  }

  async findRestaurantsByUserId(userId: UserId): Promise<Restaurant[]> {
    const restaurants = await this.db
      .selectFrom('user_restaurant_roles')
      .innerJoin('restaurants', 'restaurants.id', 'user_restaurant_roles.restaurant_id')
      .selectAll('restaurants')
      .where('user_restaurant_roles.user_id', '=', userId)
      .execute();

    return restaurants.map(r => ({
      id: r.id,
      franchiseGroupId: r.franchise_group_id,
      name: r.name,
      timezone: r.timezone,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })) as unknown as Restaurant[];
  }

  async createFranchiseGroup(name: string): Promise<FranchiseGroup> {
    const result = await this.db
      .insertInto('franchise_groups')
      .values({ name })
      .returningAll()
      .executeTakeFirstOrThrow();
    return this.findFranchiseGroupById(result.id as FranchiseGroupId);
  }

  async updateFranchiseGroup(id: string, name?: string): Promise<FranchiseGroup> {
    const query = this.db.updateTable('franchise_groups').where('id', '=', id).returningAll();
    if (name !== undefined) {
      query.set({ name });
    }
    const result = await query.executeTakeFirstOrThrow();
    return this.findFranchiseGroupById(result.id as FranchiseGroupId);
  }

  async createRestaurant(name: string, franchiseGroupId: string, timezone: string): Promise<Restaurant> {
    const result = await this.db
      .insertInto('restaurants')
      .values({ name, franchise_group_id: franchiseGroupId, timezone })
      .returningAll()
      .executeTakeFirstOrThrow();
    return this.findById(result.id as RestaurantId);
  }

  async updateRestaurant(id: string, name?: string, timezone?: string): Promise<Restaurant> {
    let query = this.db.updateTable('restaurants').where('id', '=', id).returningAll();
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (timezone !== undefined) updates.timezone = timezone;
    if (Object.keys(updates).length > 0) {
        query = query.set(updates);
    }
    const result = await query.executeTakeFirstOrThrow();
    return this.findById(result.id as RestaurantId);
  }

  async deleteFranchiseGroup(id: string): Promise<void> {
    await this.db.deleteFrom('franchise_groups').where('id', '=', id).execute();
  }

  async deleteRestaurant(id: string): Promise<void> {
    await this.db.deleteFrom('restaurants').where('id', '=', id).execute();
  }
}
