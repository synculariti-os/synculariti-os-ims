import { Controller, Get, Post, Put, Patch, Param, Body, Inject } from '@nestjs/common';
import { ITEM_WRITE_SERVICE_TOKEN, IItemWriteService } from './interfaces/i-item.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSION_CODES } from '@ims/types';
import type { ItemId, RestaurantId, JwtPayload } from '@ims/types';
import { 
  CreateItemDto, 
  UpdateItemDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CreateUomConversionDto, 
  UpdateItemOverrideDto 
} from '@ims/validators';

@Controller('items')
export class ItemController {
  constructor(
    @Inject(ITEM_WRITE_SERVICE_TOKEN) private readonly itemService: IItemWriteService,
  ) {}

  @Get('below-par')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async listParLevels(@CurrentUser() user: JwtPayload) {
    return this.itemService.listParLevels(user.restaurantId);
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemService.findById(id as ItemId, user.restaurantId);
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async createItem(@Body() dto: CreateItemDto) {
    return this.itemService.createItem(dto);
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.updateItem(id as ItemId, dto);
  }

  @Post('categories')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.itemService.createCategory(dto);
  }

  @Put('categories/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.itemService.updateCategory(id, dto);
  }

  @Post('uom-conversions')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async upsertUomConversion(@Body() dto: CreateUomConversionDto) {
    return this.itemService.upsertUomConversion(dto);
  }

  @Patch(':id/overrides')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async updateOverride(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateItemOverrideDto
  ) {
    return this.itemService.updateOverride(id as ItemId, user.restaurantId, dto);
  }
}
