import type { FranchiseGroupId, RestaurantId, ItemId, RecipeId, RecipeIngredientId, MenuItemMappingId } from '../branded';
export interface Recipe { id: RecipeId; franchiseGroupId: FranchiseGroupId | null; restaurantId: RestaurantId | null; producesItemId: ItemId | null; recipeName: string | null; producesItemName?: string; yieldQuantity: number; yieldPercent: number; createdAt: string; updatedAt: string; }
export interface RecipeIngredient {
  id: RecipeIngredientId;
  recipeId: RecipeId;
  lineType: 'ingredient' | 'sub_recipe';
  /** Raw item ingredient. Null when this line is a sub-recipe reference. */
  ingredientItemId: ItemId | null;
  ingredientItemName?: string;
  /** Sub-recipe reference. Null when this line is a raw ingredient. */
  subRecipeId: RecipeId | null;
  subRecipeName?: string;
  quantityRequired: number;
  createdAt: string;
}
export interface MenuItemMapping { id: MenuItemMappingId; restaurantId: RestaurantId; rawExcelString: string; recipeId: RecipeId; targetRecipeName?: string; createdAt: string; }
export interface BomExpansionLine { itemId: ItemId; consumedQty: number; }
export type BomExpansion = BomExpansionLine[];
