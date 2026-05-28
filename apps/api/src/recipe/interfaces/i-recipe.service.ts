import type { BomExpansion, Recipe, RecipeIngredient, RecipeId, RestaurantId, MenuItemMapping } from '@ims/types';
import type { CreateRecipeDto, UpdateRecipeDto, MenuItemMappingDto } from '@ims/validators';
import type { FranchiseGroupId } from '@ims/types';

export type CreateRecipeCommand = Omit<CreateRecipeDto, 'producesItemId'> & {
  producesItemId?: string | null;
  recipeName?: string | null;
  restaurantId: RestaurantId | null;
  franchiseGroupId: FranchiseGroupId | null;
};

export interface IRecipeService {
  listRecipes(restaurantId: RestaurantId): Promise<Recipe[]>;
  listMappings(restaurantId: RestaurantId): Promise<MenuItemMapping[]>;
  expandBOM(recipeId: RecipeId, soldQty: number): Promise<BomExpansion>;
  resolveRecipeByPosString(restaurantId: RestaurantId, rawString: string): Promise<Recipe | null>;
  resolveRecipesByPosStrings(restaurantId: RestaurantId, rawStrings: string[]): Promise<MenuItemMapping[]>;
  getIngredients(recipeId: RecipeId): Promise<RecipeIngredient[]>;
  createRecipe(dto: CreateRecipeDto, restaurantId: RestaurantId | null, franchiseGroupId: string | null): Promise<Recipe>;
  updateRecipe(recipeId: RecipeId, dto: UpdateRecipeDto): Promise<Recipe>;
  createMenuItemMapping(restaurantId: RestaurantId, dto: MenuItemMappingDto): Promise<void>;
}

export const RECIPE_SERVICE_TOKEN = Symbol('IRecipeService');
