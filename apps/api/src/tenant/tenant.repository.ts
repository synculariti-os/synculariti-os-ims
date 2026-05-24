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
}
