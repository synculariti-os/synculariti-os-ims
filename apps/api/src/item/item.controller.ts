import { Controller, Get, Post, Put, Patch, Param, Body, Inject, Query } from '@nestjs/common';
import { ITEM_WRITE_SERVICE_TOKEN, IItemWriteService } from './interfaces/i-item.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSION_CODES, asItemId } from '@ims/types';
import type { ItemId, RestaurantId, JwtPayload } from '@ims/types';
import { 
  CreateItemDto, 
  UpdateItemDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CreateUomConversionDto, 
  UpdateItemOverrideDto 
} from '@ims/validators';
import { Public } from '../common/decorators/public.decorator';

@Controller('items')
@Public()
export class ItemController {
  constructor(
    @Inject(ITEM_WRITE_SERVICE_TOKEN) private readonly itemService: IItemWriteService,
  ) {}

  @Get()
  @Public()
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async listParLevels(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // TEMPORARY: Mock user context for UI testing
    const mockRestaurantId = 'b0000000-0000-0000-0000-000000000001' as RestaurantId;
    const activeUser = user || { restaurantId: mockRestaurantId };
    
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.itemService.listParLevels(activeUser.restaurantId, pageNum, limitNum);
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemService.findById(asItemId(id), user.restaurantId);
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async createItem(@Body() dto: CreateItemDto) {
    return this.itemService.createItem(dto);
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.updateItem(asItemId(id), dto);
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
    return this.itemService.updateOverride(asItemId(id), user.restaurantId, dto);
  }
}
