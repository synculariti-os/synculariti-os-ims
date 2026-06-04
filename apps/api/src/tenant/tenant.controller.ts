import { Controller, Get, Post, Put, Delete, Param, Body, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { ITenantService, TENANT_SERVICE_TOKEN } from './interfaces/i-tenant.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TokenOnly } from '../common/decorators/token-only.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { PERMISSION_CODES } from '@ims/types';
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
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class TenantController {
  constructor(
    @Inject(TENANT_SERVICE_TOKEN) private readonly tenantService: ITenantService,
  ) {}

  /**
   * Returns the list of restaurants accessible to the requesting user.
   * Uses @TokenOnly() because no restaurant context exists yet at this stage —
   * this is the endpoint that *establishes* the restaurant selection.
   */
  @Get('context')
  @TokenOnly()
  async getContext(@CurrentUser() user: { sub: UserId }) {
    const restaurants = await this.tenantService.listRestaurantsForUser(user.sub);
    return restaurants;
  }

  @Post('franchise-groups')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async createFranchiseGroup(
    @Body(new ZodValidationPipe(createFranchiseGroupSchema)) dto: CreateFranchiseGroupDto
  ) {
    return this.tenantService.createFranchiseGroup(dto);
  }

  @Put('franchise-groups/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateFranchiseGroup(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFranchiseGroupSchema)) dto: UpdateFranchiseGroupDto
  ) {
    return this.tenantService.updateFranchiseGroup(id, dto);
  }

  @Post('restaurants')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async createRestaurant(
    @Body(new ZodValidationPipe(createRestaurantSchema)) dto: CreateRestaurantDto
  ) {
    return this.tenantService.createRestaurant(dto);
  }

  @Put('restaurants/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateRestaurant(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRestaurantSchema)) dto: UpdateRestaurantDto
  ) {
    return this.tenantService.updateRestaurant(id, dto);
  }

  @Delete('franchise-groups/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async deleteFranchiseGroup(@Param('id') id: string) {
    await this.tenantService.deleteFranchiseGroup(id);
    return { success: true };
  }

  @Delete('restaurants/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async deleteRestaurant(@Param('id') id: string) {
    await this.tenantService.deleteRestaurant(id);
    return { success: true };
  }
}
