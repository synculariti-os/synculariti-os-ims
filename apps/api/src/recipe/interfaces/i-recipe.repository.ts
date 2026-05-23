import type {
  Recipe,
  RecipeIngredient,
  BomExpansion,
  RecipeId,
  RestaurantId,
} from '@ims/types';
import type { CreateRecipeDto, UpdateRecipeDto } from '@ims/validators';

export interface IRecipeRepository {
  findById(recipeId: RecipeId): Promise<Recipe | null>;
  findByProducesItemId(itemId: string): Promise<Recipe | null>;
  findIngredients(recipeId: RecipeId): Promise<RecipeIngredient[]>;
  resolveByPosString(restaurantId: RestaurantId, rawString: string): Promise<Recipe | null>;
  create(dto: CreateRecipeDto, restaurantId: RestaurantId): Promise<Recipe>;
  update(recipeId: RecipeId, dto: UpdateRecipeDto): Promise<Recipe>;
  upsertMapping(restaurantId: RestaurantId, rawString: string, recipeId: RecipeId): Promise<void>;
}
