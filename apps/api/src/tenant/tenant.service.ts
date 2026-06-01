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

  async createFranchiseGroup(dto: import('@ims/validators').CreateFranchiseGroupDto): Promise<FranchiseGroup> {
    return this.tenantRepository.createFranchiseGroup(dto.name);
  }

  async updateFranchiseGroup(id: string, dto: import('@ims/validators').UpdateFranchiseGroupDto): Promise<FranchiseGroup> {
    return this.tenantRepository.updateFranchiseGroup(id, dto.name);
  }

  async createRestaurant(dto: import('@ims/validators').CreateRestaurantDto): Promise<Restaurant> {
    return this.tenantRepository.createRestaurant(dto.name, dto.franchiseGroupId, dto.timezone);
  }

  async updateRestaurant(id: string, dto: import('@ims/validators').UpdateRestaurantDto): Promise<Restaurant> {
    return this.tenantRepository.updateRestaurant(id, dto.name, dto.timezone);
  }

  async deleteFranchiseGroup(id: string): Promise<void> {
    return this.tenantRepository.deleteFranchiseGroup(id);
  }

  async deleteRestaurant(id: string): Promise<void> {
    return this.tenantRepository.deleteRestaurant(id);
  }
}
