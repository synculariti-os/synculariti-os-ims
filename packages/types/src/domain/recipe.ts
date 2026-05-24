import type { FranchiseGroupId, RestaurantId, ItemId, RecipeId, RecipeIngredientId, MenuItemMappingId } from '../branded';
export interface Recipe { id: RecipeId; franchiseGroupId: FranchiseGroupId | null; restaurantId: RestaurantId | null; producesItemId: ItemId; producesItemName?: string; yieldQuantity: number; createdAt: string; updatedAt: string; }
// Cache invalidation comment
export interface RecipeIngredient { id: RecipeIngredientId; recipeId: RecipeId; ingredientItemId: ItemId; quantityRequired: number; createdAt: string; }
export interface MenuItemMapping { id: MenuItemMappingId; restaurantId: RestaurantId; rawExcelString: string; recipeId: RecipeId; targetRecipeName?: string; createdAt: string; }
export interface BomExpansionLine { itemId: ItemId; consumedQty: number; }
export type BomExpansion = BomExpansionLine[];
