import type { BomExpansion, Recipe, RecipeIngredient, RecipeId, RestaurantId } from '@ims/types';

export interface IRecipeService {
  expandBOM(recipeId: RecipeId, soldQty: number): Promise<BomExpansion>;
  resolveRecipeByPosString(restaurantId: RestaurantId, rawString: string): Promise<Recipe | null>;
  getIngredients(recipeId: RecipeId): Promise<RecipeIngredient[]>;
}

export const RECIPE_SERVICE_TOKEN = Symbol('IRecipeService');
