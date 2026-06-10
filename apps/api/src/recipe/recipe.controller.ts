import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createRecipeSchema,
  CreateRecipeDto,
  updateRecipeSchema,
  UpdateRecipeDto,
  menuItemMappingSchema,
  MenuItemMappingDto,
} from '@ims/validators';
import { PERMISSION_CODES, JwtPayload, Recipe, MenuItemMapping, RecipeId, } from '@ims/types';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { IRecipeService, RECIPE_SERVICE_TOKEN } from './interfaces/i-recipe.service';
@Controller('recipes')
export class RecipeController {
  constructor(
    @Inject(RECIPE_SERVICE_TOKEN) private readonly recipeService: IRecipeService,
  ) {}

  @Get('upload/template')
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async downloadTemplate(): Promise<string> {
    return 'producesItemSku,producesItemName,categoryName,recipeName,yieldQuantity,priceEur,vatRate,ingredientSku,ingredientName,quantityRequired,uom\nVEG-001,Vegetable Salad,Salads,,1,4.99,19,RAW-100,Tomato,0.5,kg\n,House Sauce,Sauces,House Sauce,1,1.50,19,RAW-200,Mayonnaise,2,unit\n';
  }

  @Post('upload')
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  @UseInterceptors(FileInterceptor('file'))
  async uploadRecipes(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(csv|xlsx|xls|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)/i,
          skipMagicNumbersValidation: true,
        })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    ) file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    const xlsx = await import('xlsx');
    // Strip UTF-8 BOM if present
    let buf = file.buffer;
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      buf = buf.subarray(3);
    }
    const workbook = xlsx.read(buf, { type: 'buffer', codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new BadRequestException('Uploaded file contains no sheets');
    const sheet = workbook.Sheets[sheetName];
    const rawRows: Record<string, string | number | undefined>[] = xlsx.utils.sheet_to_json(sheet);

    if (rawRows.length === 0) throw new BadRequestException('Uploaded file contains no data rows');

    const parsedRows: Array<{
      producesItemSku: string;
      producesItemName: string | null;
      categoryName: string | null;
      recipeName: string | null;
      yieldQuantity: number;
      priceEur: number | null;
      vatRate: number | null;
      ingredientSku: string;
      ingredientName: string | null;
      quantityRequired: number;
      uom: string | null;
    }> = [];
    const parseErrors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;
      const producesItemSku = String(row['producesItemSku'] ?? '').trim();
      const producesItemName = row['producesItemName'] !== undefined ? String(row['producesItemName']).trim() || null : null;
      const categoryName = row['categoryName'] !== undefined ? String(row['categoryName']).trim() || null : null;
      const recipeName = String(row['recipeName'] ?? '').trim() || null;
      const yieldQuantity = row['yieldQuantity'] !== undefined ? Number(row['yieldQuantity']) : 1;
      const priceEur = row['priceEur'] !== undefined && row['priceEur'] !== '' ? Number(row['priceEur']) : null;
      const vatRate = row['vatRate'] !== undefined && row['vatRate'] !== '' ? Number(row['vatRate']) : null;
      const ingredientSku = String(row['ingredientSku'] ?? '').trim();
      const ingredientName = row['ingredientName'] !== undefined ? String(row['ingredientName']).trim() || null : null;
      const quantityRequired = Number(row['quantityRequired']);
      const uom = row['uom'] !== undefined ? String(row['uom']).trim() || null : null;

      if (!producesItemSku && !recipeName) {
        parseErrors.push({ row: rowNum, message: 'Either producesItemSku or recipeName is required' });
        continue;
      }
      if (!yieldQuantity || yieldQuantity <= 0) {
        parseErrors.push({ row: rowNum, message: 'yieldQuantity must be a positive number' });
        continue;
      }
      if (!ingredientSku) {
        parseErrors.push({ row: rowNum, message: 'ingredientSku is required' });
        continue;
      }
      if (!quantityRequired || quantityRequired <= 0) {
        parseErrors.push({ row: rowNum, message: 'quantityRequired must be a positive number' });
        continue;
      }

      parsedRows.push({
        producesItemSku,
        producesItemName,
        categoryName,
        recipeName,
        yieldQuantity,
        priceEur,
        vatRate,
        ingredientSku,
        ingredientName,
        quantityRequired,
        uom,
      });
    }

    const result = await this.recipeService.bulkCreateRecipes(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsedRows is built dynamically from XLSX headers which can't be statically typed
      parsedRows as any,
      user.restaurantId ?? null,
      user.franchiseGroupId ?? null,
    );

    return {
      totalRows: rawRows.length,
      createdCount: result.createdCount,
      skippedCount: result.skippedCount,
      errorCount: result.errors.length + parseErrors.length,
      errors: [...parseErrors, ...result.errors],
    };
  }

  @Get('unmapped-rows')
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getUnmappedRows(
    @CurrentUser() user: JwtPayload,
    @Query('batchId') batchId: string,
  ): Promise<{ data: Array<{ id: string; rawItemName: string; quantitySold: number }> }> {
    const rows = await this.recipeService.getUnmappedRows(user.restaurantId, batchId);
    return { data: rows };
  }

  @Get()
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getRecipes(@CurrentUser() user: JwtPayload): Promise<{ data: Recipe[] }> {
    const recipes = await this.recipeService.listRecipes(user.restaurantId);
    return { data: recipes };
  }

  @Get('mappings')
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getMappings(@CurrentUser() user: JwtPayload): Promise<{ data: MenuItemMapping[] }> {
    const mappings = await this.recipeService.listMappings(user.restaurantId);
    return { data: mappings };
  }



  @Get(':id/ingredients')
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getIngredients(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: import('@ims/types').RecipeIngredient[] }> {
    const ingredients = await this.recipeService.getIngredients(id as RecipeId);
    return { data: ingredients };
  }

  @Get(':id/nutrition')
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getNutrition(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: import('@ims/types').RecipeNutritionReport }> {
    const nutrition = await this.recipeService.getNutrition(id as RecipeId, user.restaurantId);
    return { data: nutrition };
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async createRecipe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createRecipeSchema)) dto: CreateRecipeDto,
  ): Promise<Recipe> {
    return this.recipeService.createRecipe(dto, user.restaurantId, user.franchiseGroupId);
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async updateRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateRecipeSchema)) dto: UpdateRecipeDto,
  ): Promise<Recipe> {
    return this.recipeService.updateRecipe(id as RecipeId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async deleteRecipe(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.recipeService.deleteRecipe(id as RecipeId);
  }

  @Post('mappings')
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async createMapping(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(menuItemMappingSchema)) dto: MenuItemMappingDto,
  ): Promise<void> {
    return this.recipeService.createMenuItemMapping(user.restaurantId, dto);
  }

  @Delete('mappings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async deleteMapping(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.recipeService.deleteMapping(id);
  }
}
