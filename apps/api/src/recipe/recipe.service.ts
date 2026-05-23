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
import type { IRecipeService } from './interfaces/i-recipe.service';
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
}
