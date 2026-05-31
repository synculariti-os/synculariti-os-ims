import type { BomExpansion, Recipe, RecipeIngredient, RecipeId, RestaurantId, MenuItemMapping } from '@ims/types';
import type { CreateRecipeDto, UpdateRecipeDto, MenuItemMappingDto, RecipeIngredientDto } from '@ims/validators';
import type { FranchiseGroupId } from '@ims/types';

export type CreateRecipeCommand = {
  producesItemId?: string | null;
  recipeName?: string | null;
  yieldQuantity: number;
  yieldPercent?: number;
  ingredients: RecipeIngredientDto[];
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
  deleteRecipe(recipeId: RecipeId): Promise<void>;
  createMenuItemMapping(restaurantId: RestaurantId, dto: MenuItemMappingDto): Promise<void>;
  deleteMapping(mappingId: string): Promise<void>;
  getUnmappedRows(restaurantId: RestaurantId, batchId: string): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>>;
}

export const RECIPE_SERVICE_TOKEN = Symbol('IRecipeService');
