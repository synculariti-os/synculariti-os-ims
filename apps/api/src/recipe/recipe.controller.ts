import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Inject,
  ParseUUIDPipe,
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

@Controller('recipes')
@Public()
export class RecipeController {
  constructor(
    @Inject(RECIPE_SERVICE_TOKEN) private readonly recipeService: IRecipeService,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getRecipes(@CurrentUser() user: JwtPayload): Promise<{ data: Recipe[] }> {
    const mockRestaurantId = 'b0000000-0000-0000-0000-000000000001' as RestaurantId;
    const activeUser = user?.restaurantId ? user : { restaurantId: mockRestaurantId };
    const recipes = await this.recipeService.listRecipes(activeUser.restaurantId as RestaurantId);
    return { data: recipes };
  }

  @Get('mappings')
  @RequirePermission(PERMISSION_CODES.RECIPE_READ)
  async getMappings(@CurrentUser() user: JwtPayload): Promise<{ data: MenuItemMapping[] }> {
    const mockRestaurantId = 'b0000000-0000-0000-0000-000000000001' as RestaurantId;
    const activeUser = user?.restaurantId ? user : { restaurantId: mockRestaurantId };
    const mappings = await this.recipeService.listMappings(activeUser.restaurantId as RestaurantId);
    return { data: mappings };
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async createRecipe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createRecipeSchema)) dto: CreateRecipeDto,
  ): Promise<Recipe> {
    const mockRestaurantId = 'b0000000-0000-0000-0000-000000000001' as RestaurantId;
    const mockFranchiseGroupId = 'a0000000-0000-0000-0000-000000000001';
    const activeUser = user?.restaurantId ? user : { restaurantId: mockRestaurantId, franchiseGroupId: mockFranchiseGroupId };
    return this.recipeService.createRecipe(dto, activeUser.restaurantId ?? null, activeUser.franchiseGroupId ?? null);
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async updateRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateRecipeSchema)) dto: UpdateRecipeDto,
  ): Promise<Recipe> {
    return this.recipeService.updateRecipe(id as RecipeId, dto);
  }

  @Post('mappings')
  @RequirePermission(PERMISSION_CODES.RECIPE_WRITE)
  async createMapping(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(menuItemMappingSchema)) dto: MenuItemMappingDto,
  ): Promise<void> {
    const mockRestaurantId = 'b0000000-0000-0000-0000-000000000001' as RestaurantId;
    const activeUser = user?.restaurantId ? user : { restaurantId: mockRestaurantId };
    return this.recipeService.createMenuItemMapping(activeUser.restaurantId as RestaurantId, dto);
  }
}
