import { Controller, Get, Post, Put, Delete, Param, Body, Inject } from '@nestjs/common';
import { ITenantService, TENANT_SERVICE_TOKEN } from './interfaces/i-tenant.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TokenOnly } from '../common/decorators/token-only.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { 
  createFranchiseGroupSchema, 
  updateFranchiseGroupSchema, 
  createRestaurantSchema, 
  updateRestaurantSchema,
  CreateFranchiseGroupDto,
  UpdateFranchiseGroupDto,
  CreateRestaurantDto,
  UpdateRestaurantDto
} from '@ims/validators';
import type { UserId } from '@ims/types';

@Controller('tenant')
export class TenantController {
  constructor(
    @Inject(TENANT_SERVICE_TOKEN) private readonly tenantService: ITenantService,
  ) {}

  @Get('context')
  @TokenOnly()
  async getContext(@CurrentUser() user: { sub: UserId }) {
    const restaurants = await this.tenantService.listRestaurantsForUser(user.sub);
    return restaurants;
  }

  @Post('franchise-groups')
  @TokenOnly() // Realistically should be admin-only, but using TokenOnly for now
  async createFranchiseGroup(
    @Body(new ZodValidationPipe(createFranchiseGroupSchema)) dto: CreateFranchiseGroupDto
  ) {
    return this.tenantService.createFranchiseGroup(dto);
  }

  @Put('franchise-groups/:id')
  @TokenOnly()
  async updateFranchiseGroup(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFranchiseGroupSchema)) dto: UpdateFranchiseGroupDto
  ) {
    return this.tenantService.updateFranchiseGroup(id, dto);
  }

  @Post('restaurants')
  @TokenOnly() // Franchise Admin
  async createRestaurant(
    @Body(new ZodValidationPipe(createRestaurantSchema)) dto: CreateRestaurantDto
  ) {
    return this.tenantService.createRestaurant(dto);
  }

  @Put('restaurants/:id')
  @TokenOnly()
  async updateRestaurant(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRestaurantSchema)) dto: UpdateRestaurantDto
  ) {
    return this.tenantService.updateRestaurant(id, dto);
  }

  @Delete('franchise-groups/:id')
  @TokenOnly()
  async deleteFranchiseGroup(@Param('id') id: string) {
    await this.tenantService.deleteFranchiseGroup(id);
    return { success: true };
  }

  @Delete('restaurants/:id')
  @TokenOnly()
  async deleteRestaurant(@Param('id') id: string) {
    await this.tenantService.deleteRestaurant(id);
    return { success: true };
  }
}
