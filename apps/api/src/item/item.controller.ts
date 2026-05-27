import { Controller, Get, Post, Put, Patch, Param, Body, Inject, Query } from '@nestjs/common';
import { ITEM_WRITE_SERVICE_TOKEN, IItemWriteService } from './interfaces/i-item.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSION_CODES, asItemId } from '@ims/types';
import type { JwtPayload } from '@ims/types';
import {
  CreateItemDto,
  createItemDtoSchema,
  UpdateItemDto,
  updateItemDtoSchema,
  CreateCategoryDto,
  createCategoryDtoSchema,
  UpdateCategoryDto,
  updateCategoryDtoSchema,
  CreateUomConversionDto,
  createUomConversionDtoSchema,
  UpdateItemOverrideDto,
  updateItemOverrideDtoSchema,
} from '@ims/validators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('items')
export class ItemController {
  constructor(
    @Inject(ITEM_WRITE_SERVICE_TOKEN) private readonly itemService: IItemWriteService,
  ) {}

  // ── Static routes MUST come before dynamic /:id routes ──────────────────────

  @Get('categories')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async listCategories(@CurrentUser() user: JwtPayload) {
    return this.itemService.listCategories(user.restaurantId, user.franchiseGroupId);
  }

  @Post('categories')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async createCategory(@Body(new ZodValidationPipe(createCategoryDtoSchema)) dto: CreateCategoryDto) {
    return this.itemService.createCategory(dto);
  }

  @Put('categories/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateCategory(@Param('id') id: string, @Body(new ZodValidationPipe(updateCategoryDtoSchema)) dto: UpdateCategoryDto) {
    return this.itemService.updateCategory(id, dto);
  }

  @Post('uom-conversions')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async upsertUomConversion(@Body(new ZodValidationPipe(createUomConversionDtoSchema)) dto: CreateUomConversionDto) {
    return this.itemService.upsertUomConversion(dto);
  }

  // ── Collection routes ────────────────────────────────────────────────────────

  @Get()
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async listParLevels(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.itemService.listParLevels(user.restaurantId, pageNum, limitNum);
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async createItem(@Body(new ZodValidationPipe(createItemDtoSchema)) dto: CreateItemDto) {
    return this.itemService.createItem(dto);
  }

  // ── Dynamic /:id routes MUST come AFTER all static routes ───────────────────

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemService.findById(asItemId(id), user.restaurantId);
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateItem(@Param('id') id: string, @Body(new ZodValidationPipe(updateItemDtoSchema)) dto: UpdateItemDto) {
    return this.itemService.updateItem(asItemId(id), dto);
  }

  @Patch(':id/overrides')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async updateOverride(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateItemOverrideDtoSchema)) dto: UpdateItemOverrideDto,
  ) {
    return this.itemService.updateOverride(asItemId(id), user.restaurantId, dto);
  }
}
