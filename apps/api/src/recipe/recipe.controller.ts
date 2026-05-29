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
} from '@nestjs/common';
import {
  createRecipeSchema,
  CreateRecipeDto,
  updateRecipeSchema,
  UpdateRecipeDto,
  menuItemMappingSchema,
  MenuItemMappingDto,
} from '@ims/validators';
import { PERMISSION_CODES, JwtPayload, Recipe, MenuItemMapping, RecipeId, RestaurantId } from '@ims/types';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { IRecipeService, RECIPE_SERVICE_TOKEN } from './interfaces/i-recipe.service';
import { Public } from '../common/decorators/public.decorator';

const MOCK_RESTAURANT_ID = 'b0000000-0000-0000-0000-000000000001' as RestaurantId;
const MOCK_FRANCHISE_GROUP_ID = 'a0000000-0000-0000-0000-000000000001';

function resolveUser(user: JwtPayload): { restaurantId: RestaurantId; franchiseGroupId: string } {
  return {
    restaurantId: user?.restaurantId ?? MOCK_RESTAURANT_ID,
    franchiseGroupId: user?.franchiseGroupId ?? MOCK_FRANCHISE_GROUP_ID,
  };
}

@Controller('recipes')
@Public()
export class RecipeController {
  constructor(
    @Inject(RECIPE_SERVICE_TOKEN) private readonly recipeService: IRecipeService,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getRecipes(@CurrentUser() user: JwtPayload): Promise<{ data: Recipe[] }> {
    const { restaurantId } = resolveUser(user);
    const recipes = await this.recipeService.listRecipes(restaurantId);
    return { data: recipes };
  }

  @Get('mappings')
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getMappings(@CurrentUser() user: JwtPayload): Promise<{ data: MenuItemMapping[] }> {
    const { restaurantId } = resolveUser(user);
    const mappings = await this.recipeService.listMappings(restaurantId);
    return { data: mappings };
  }

  @Get('unmapped-rows')
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getUnmappedRows(
    @CurrentUser() user: JwtPayload,
    @Query('batchId') batchId: string,
  ): Promise<{ data: Array<{ id: string; rawItemName: string; quantitySold: number }> }> {
    const { restaurantId } = resolveUser(user);
    const rows = await this.recipeService.getUnmappedRows(restaurantId, batchId);
    return { data: rows };
  }

  @Get(':id/ingredients')
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getIngredients(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: import('@ims/types').RecipeIngredient[] }> {
    const ingredients = await this.recipeService.getIngredients(id as RecipeId);
    return { data: ingredients };
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async createRecipe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createRecipeSchema)) dto: CreateRecipeDto,
  ): Promise<Recipe> {
    const { restaurantId, franchiseGroupId } = resolveUser(user);
    return this.recipeService.createRecipe(dto, restaurantId, franchiseGroupId);
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
    const { restaurantId } = resolveUser(user);
    return this.recipeService.createMenuItemMapping(restaurantId, dto);
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
