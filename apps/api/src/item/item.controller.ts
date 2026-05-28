import { Controller, Get, Post, Put, Patch, Param, Body, Inject, Query } from '@nestjs/common';
import { ITEM_WRITE_SERVICE_TOKEN, IItemWriteService } from './interfaces/i-item.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSION_CODES, asItemId } from '@ims/types';
import type { JwtPayload } from '@ims/types';
import {
  CreateItemDto,
  createItemSchema,
  UpdateItemDto,
  updateItemSchema,
  CreateCategoryDto,
  createCategorySchema,
  UpdateCategoryDto,
  updateCategorySchema,
  CreateUomConversionDto,
  createUomConversionSchema,
  UpdateItemOverrideDto,
  updateItemOverrideSchema,
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
  async createCategory(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryDto
  ) {
    return this.itemService.createCategory(dto, user.restaurantId ?? null, user.franchiseGroupId ?? null);
  }

  @Put('categories/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateCategory(@Param('id') id: string, @Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryDto) {
    return this.itemService.updateCategory(id, dto);
  }

  @Post('uom-conversions')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async upsertUomConversion(@Body(new ZodValidationPipe(createUomConversionSchema)) dto: CreateUomConversionDto) {
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
  async createItem(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createItemSchema)) dto: CreateItemDto
  ) {
    // Controller is transport-only: extract JWT context and pass to service.
    // All business logic (owner XOR resolution) lives in ItemService (R-ARCH-02).
    return this.itemService.createItem(dto, user.restaurantId ?? null, user.franchiseGroupId ?? null);
  }

  // ── Dynamic /:id routes MUST come AFTER all static routes ───────────────────

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemService.findById(asItemId(id), user.restaurantId);
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateItem(@Param('id') id: string, @Body(new ZodValidationPipe(updateItemSchema)) dto: UpdateItemDto) {
    return this.itemService.updateItem(asItemId(id), dto);
  }

  @Patch(':id/overrides')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async updateOverride(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateItemOverrideSchema)) dto: UpdateItemOverrideDto,
  ) {
    return this.itemService.updateOverride(asItemId(id), user.restaurantId, dto);
  }
}
