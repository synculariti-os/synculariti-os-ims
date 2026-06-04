import { Controller, Post, Put, Get, Body, Param, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtPayload } from '@ims/types';
import { CreateVendorDto, createVendorSchema, UpdateVendorDto, updateVendorSchema } from '@ims/validators';

import { PROCUREMENT_SERVICE_TOKEN } from './interfaces/i-procurement.service';
import type { IProcurementService } from './interfaces/i-procurement.service';

@Controller('procurement/vendors')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class VendorController {
  constructor(
    @Inject(PROCUREMENT_SERVICE_TOKEN)
    private readonly procurementService: IProcurementService,
  ) {}

  @Get()
  @RequirePermission('PROCUREMENT.READ')
  async listVendors(@CurrentUser() user: JwtPayload) {
    const data = await this.procurementService.listVendors(user.restaurantId);
    return { data };
  }

  @Post()
  @RequirePermission('PROCUREMENT.WRITE')
  async createVendor(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createVendorSchema)) dto: CreateVendorDto,
  ) {
    return this.procurementService.createVendor(user.restaurantId, user.franchiseGroupId, dto);
  }

  @Put(':id')
  @RequirePermission('PROCUREMENT.WRITE')
  async updateVendor(
    @Param('id') vendorId: string,
    @Body(new ZodValidationPipe(updateVendorSchema)) dto: UpdateVendorDto,
  ) {
    return this.procurementService.updateVendor(vendorId, dto);
  }
}
