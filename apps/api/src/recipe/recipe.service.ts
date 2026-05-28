import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';

import type {
  Recipe,
  RecipeIngredient,
  BomExpansion,
  RecipeId,
  RestaurantId,
} from '@ims/types';
import { asItemId } from '@ims/types';
import type { IRecipeService, CreateRecipeCommand } from './interfaces/i-recipe.service';
import type { CreateRecipeDto, UpdateRecipeDto, MenuItemMappingDto } from '@ims/validators';
import type { IRecipeRepository } from './interfaces/i-recipe.repository';
import type { IItemReadService } from '../item/interfaces/i-item.service';
import { ITEM_READ_SERVICE_TOKEN } from '../item/interfaces/i-item.service';

export const RECIPE_REPOSITORY_TOKEN = Symbol('IRecipeRepository');

@Injectable()
export class RecipeService implements IRecipeService {
  constructor(
    @Inject(RECIPE_REPOSITORY_TOKEN) private readonly recipeRepo: IRecipeRepository,
    @Inject(ITEM_READ_SERVICE_TOKEN) private readonly itemService: IItemReadService,
  ) {}

  async listRecipes(restaurantId: RestaurantId): Promise<Recipe[]> {
    return this.recipeRepo.findAllRecipes(restaurantId);
  }

  async listMappings(restaurantId: RestaurantId): Promise<import('@ims/types').MenuItemMapping[]> {
    return this.recipeRepo.findAllMappings(restaurantId);
  }

  async expandBOM(recipeId: RecipeId, soldQty: number): Promise<BomExpansion> {
    if (soldQty <= 0) {
      throw new BadRequestException('soldQty must be positive');
    }

    const recipe = await this.recipeRepo.findById(recipeId);
    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    const ingredients = await this.recipeRepo.findIngredients(recipeId);

    if (ingredients.length === 0) {
      return [];
    }

    // Scale: consumedQty = (soldQty / yieldQuantity) * quantityRequired
    const scaleFactor = soldQty / recipe.yieldQuantity;

    return ingredients.map((ing) => ({
      itemId: ing.ingredientItemId,
      consumedQty: ing.quantityRequired * scaleFactor,
    }));
  }

  async resolveRecipeByPosString(
    restaurantId: RestaurantId,
    rawString: string,
  ): Promise<Recipe | null> {
    return this.recipeRepo.resolveByPosString(restaurantId, rawString);
  }

  async resolveRecipesByPosStrings(
    restaurantId: RestaurantId,
    rawStrings: string[],
  ): Promise<import('@ims/types').MenuItemMapping[]> {
    return this.recipeRepo.resolveRecipesByPosStrings(restaurantId, rawStrings);
  }

  async getIngredients(recipeId: RecipeId): Promise<RecipeIngredient[]> {
    return this.recipeRepo.findIngredients(recipeId);
  }

  async createRecipe(
    dto: CreateRecipeDto, 
    restaurantId: RestaurantId | null,
    franchiseGroupId: string | null
  ): Promise<Recipe> {
    const resolvedRestaurantId = restaurantId ?? null;
    const resolvedFranchiseGroupId = resolvedRestaurantId ? null : (franchiseGroupId ?? null);

    if (!resolvedRestaurantId && !resolvedFranchiseGroupId) {
      throw new BadRequestException(
        'Cannot create recipe: authenticated user has no restaurant or franchise group context assigned.',
      );
    }

    // Validate that the produces item exists
    const item = await this.itemService.findById(
      asItemId(dto.producesItemId), 
      resolvedRestaurantId as RestaurantId
    );
    if (!item) {
      throw new NotFoundException(`Item not found: ${dto.producesItemId}`);
    }

    const command: CreateRecipeCommand = {
      ...dto,
      restaurantId: resolvedRestaurantId,
      franchiseGroupId: resolvedFranchiseGroupId ? (resolvedFranchiseGroupId as any) : null,
    };

    return this.recipeRepo.create(command);
  }

  async updateRecipe(recipeId: RecipeId, dto: UpdateRecipeDto): Promise<Recipe> {
    const existing = await this.recipeRepo.findById(recipeId);
    if (!existing) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    return this.recipeRepo.update(recipeId, dto);
  }

  async createMenuItemMapping(restaurantId: RestaurantId, dto: MenuItemMappingDto): Promise<void> {
    const existing = await this.recipeRepo.findById(dto.recipeId as RecipeId);
    if (!existing) {
      throw new NotFoundException(`Recipe ${dto.recipeId} not found`);
    }

    await this.recipeRepo.upsertMapping(restaurantId, dto.rawExcelString, dto.recipeId as RecipeId);
  }
}
