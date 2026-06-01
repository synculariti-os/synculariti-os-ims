import type { FranchiseGroupId, RestaurantId, ItemId, CategoryId } from '../branded';
export type ItemType = 'RAW' | 'PREP';
export interface Item { id: ItemId; franchiseGroupId: FranchiseGroupId | null; restaurantId: RestaurantId | null; categoryId: CategoryId; name: string; sku: string; type: ItemType; purchasingUom: string; inventoryUom: string; recipeUom: string | null; invToRecipeRatio: number; isActive: boolean; createdAt: string; updatedAt: string; allergens: string[]; caloriesPerUom: number; proteinGrams: number; fatGrams: number; carbsGrams: number; }
export interface ItemRestaurantOverride { id: string; itemId: ItemId; restaurantId: RestaurantId; parLevel: number; isActive: boolean; createdAt: string; updatedAt: string; }
export interface ItemWithOverride extends Item {
  override?: ItemRestaurantOverride;
  effectiveParLevel: number;
  effectiveIsActive: boolean;
  categoryName?: string;
}
export interface ItemParStatus { item: Item; effectiveParLevel: number; currentStock: number; isBelowPar: boolean; deficit: number; }
export interface StockLevel { itemId: ItemId; qty: number; }
export interface UomConversion { id: string; itemId: ItemId; fromUom: string; toUom: string; multiplierFactor: number; createdAt: string; updatedAt: string; }
export interface Category { id: string; franchiseGroupId: FranchiseGroupId | null; restaurantId: RestaurantId | null; name: string; description: string | null; createdAt: string; updatedAt: string; }
