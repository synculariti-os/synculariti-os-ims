import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { ITenantService } from './interfaces/i-tenant.service';
import { ITenantRepository, TENANT_REPOSITORY_TOKEN } from './interfaces/i-tenant.repository';
import type { Restaurant, FranchiseGroup, RestaurantId, FranchiseGroupId, UserId } from '@ims/types';

@Injectable()
export class TenantService implements ITenantService {
  constructor(
    @Inject(TENANT_REPOSITORY_TOKEN) private readonly tenantRepository: ITenantRepository,
  ) {}

  async getRestaurant(restaurantId: RestaurantId): Promise<Restaurant> {
    const restaurant = await this.tenantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }
    return restaurant;
  }

  async getFranchiseGroup(franchiseGroupId: FranchiseGroupId): Promise<FranchiseGroup> {
    const franchiseGroup = await this.tenantRepository.findFranchiseGroupById(franchiseGroupId);
    if (!franchiseGroup) {
      throw new NotFoundException(`Franchise group with ID ${franchiseGroupId} not found`);
    }
    return franchiseGroup;
  }

  async listRestaurantsForUser(userId: UserId): Promise<Restaurant[]> {
    return this.tenantRepository.findRestaurantsByUserId(userId);
  }
}
