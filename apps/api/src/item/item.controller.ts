import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Inject, Query, HttpCode, HttpStatus, UseInterceptors, UploadedFile, ParseFilePipeBuilder, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ITEM_WRITE_SERVICE_TOKEN, IItemWriteService } from './interfaces/i-item.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSION_CODES, asItemId } from '@ims/types';
import type { JwtPayload, ItemType } from '@ims/types';
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
  async listCategories(
    @CurrentUser() user: JwtPayload,
    @Query('itemType') itemType?: string,
  ) {
    return this.itemService.listCategories(user.restaurantId, user.franchiseGroupId, itemType);
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

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async deleteCategory(@Param('id') id: string): Promise<void> {
    return this.itemService.deleteCategory(id);
  }

  @Post('categories/bulk-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async deleteCategoriesBulk(@Body() body: { categoryIds: string[] }): Promise<void> {
    return this.itemService.deleteCategoriesBulk(body.categoryIds);
  }

  @Get('generate-sku')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async generateSku(
    @CurrentUser() user: JwtPayload,
    @Query('categoryId') categoryId: string,
  ): Promise<{ sku: string }> {
    const mockRestaurantId = 'b0000000-0000-0000-0000-000000000001' as import('@ims/types').RestaurantId;
    const _restaurantId = user?.restaurantId ?? mockRestaurantId;
    const sku = await this.itemService.generateSku(categoryId);
    return { sku };
  }

  @Post('uom-conversions')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async upsertUomConversion(@Body(new ZodValidationPipe(createUomConversionSchema)) dto: CreateUomConversionDto) {
    return this.itemService.upsertUomConversion(dto);
  }

  @Get(':id/uom-conversions')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async getUomConversions(@Param('id') itemId: string) {
    return this.itemService.getUomConversions(asItemId(itemId));
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

  @Get('upload/template')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async downloadTemplate(): Promise<string> {
    const CSV_HEADERS = 'name,sku,type,categoryName,purchasingUom,inventoryUom,recipeUom,invToRecipeRatio,isActive';
    const SAMPLE_ROW = 'Sample Item,SMP-001,INGREDIENTS,Produce,lb,lb,,1.0,true';
    return `${CSV_HEADERS}\n${SAMPLE_ROW}\n`;
  }

  @Post('upload')
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  @UseInterceptors(FileInterceptor('file'))
  async uploadItems(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(csv|xlsx|xls|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)/i,
          skipMagicNumbersValidation: true,
        })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    ) file: Express.Multer.File,
    @Req() req: import('express').Request,
  ) {
    const { restaurantId, franchiseGroupId } = (req as unknown as { user: JwtPayload }).user;
    // We dynamically import xlsx to avoid adding a heavy dependency to the top level
    const xlsx = await import('xlsx');

    function toCamelCase<T extends Record<string, unknown>>(obj: T): T {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        result[camelKey] = obj[key];
      }
      return result as T;
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer', codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Uploaded file contains no sheets');
    }
    const sheet = workbook.Sheets[sheetName];
    const rawRows: Record<string, string | number | undefined>[] = xlsx.utils.sheet_to_json(sheet);

    if (rawRows.length === 0) {
      throw new BadRequestException('Uploaded file contains no data rows');
    }

    // Build category name → id lookup
    const categories = await this.itemService.listCategories(restaurantId, franchiseGroupId);
    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    const errors: Array<{ row: number; item: string; message: string }> = [];
    const created: Array<{ row: number; name: string; sku: string }> = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = toCamelCase(rawRows[i]);
      const rowNum = i + 2; // 1-indexed + header row
      const name = String(row['name'] ?? '').trim();
      const sku = String(row['sku'] ?? '').trim();
      const typeRaw = String(row['type'] ?? '').trim().toUpperCase();
      const categoryName = String(row['categoryName'] ?? '').trim();
      const purchasingUom = String(row['purchasingUom'] ?? '').trim();
      const inventoryUom = String(row['inventoryUom'] ?? '').trim();

      if (!name) { errors.push({ row: rowNum, item: '', message: 'Missing name' }); continue; }
      if (!sku) { errors.push({ row: rowNum, item: name, message: 'Missing sku' }); continue; }
      if (!['INGREDIENTS', 'PACKAGING', 'MERCHANDISE', 'SUPPLY', 'MISCELLANEOUS'].includes(typeRaw)) { errors.push({ row: rowNum, item: name, message: 'type must be INGREDIENTS, PACKAGING, MERCHANDISE, SUPPLY, or MISCELLANEOUS' }); continue; }
      if (!categoryName) { errors.push({ row: rowNum, item: name, message: 'Missing categoryName' }); continue; }
      if (!purchasingUom) { errors.push({ row: rowNum, item: name, message: 'Missing purchasingUom' }); continue; }
      if (!inventoryUom) { errors.push({ row: rowNum, item: name, message: 'Missing inventoryUom' }); continue; }

      const categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        errors.push({ row: rowNum, item: name, message: `Category "${categoryName}" not found` });
        continue;
      }

      const recipeUomRaw = String(row['recipeUom'] ?? '').trim();
      const invToRecipeRatioRaw = String(row['invToRecipeRatio'] ?? '').trim();
      const isActiveRaw = String(row['isActive'] ?? '').trim();

      const dto: CreateItemDto = {
        categoryId,
        name,
        sku,
        type: typeRaw as ItemType,
        purchasingUom,
        inventoryUom,
        recipeUom: recipeUomRaw || null,
        invToRecipeRatio: invToRecipeRatioRaw ? Number(invToRecipeRatioRaw) : 1.0,
        isActive: isActiveRaw ? isActiveRaw.toLowerCase() === 'true' : true,
      };

      const parsed = createItemSchema.safeParse(dto);
      if (!parsed.success) {
        const details = parsed.error.flatten().fieldErrors;
        const msg = Object.entries(details).map(([k, v]) => `${k}: ${v?.join(', ')}`).join('; ');
        errors.push({ row: rowNum, item: name, message: msg });
        continue;
      }

      try {
        await this.itemService.createItem(parsed.data, restaurantId ?? null, franchiseGroupId ?? null);
        created.push({ row: rowNum, name, sku });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ row: rowNum, item: name, message: msg });
      }
    }

    return {
      totalRows: rawRows.length,
      createdCount: created.length,
      errorCount: errors.length,
      errors,
      created,
    };
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async deleteItemsBulk(@Body() body: { itemIds: string[] }): Promise<void> {
    return this.itemService.deleteItemsBulk(body.itemIds.map(id => asItemId(id)));
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSION_CODES.ADMIN_TENANTS)
  async deleteItem(@Param('id') id: string): Promise<void> {
    return this.itemService.deleteItem(asItemId(id));
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
