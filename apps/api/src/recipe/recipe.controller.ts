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
@Controller('recipes')
export class RecipeController {
  constructor(
    @Inject(RECIPE_SERVICE_TOKEN) private readonly recipeService: IRecipeService,
  ) {}

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
