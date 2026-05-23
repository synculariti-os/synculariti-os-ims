import type { FranchiseGroupId, RestaurantId, ItemId, CategoryId } from '../branded';
export type ItemType = 'RAW' | 'PREP';
export interface Item { id: ItemId; franchiseGroupId: FranchiseGroupId | null; restaurantId: RestaurantId | null; categoryId: CategoryId; name: string; sku: string; type: ItemType; purchasingUom: string; inventoryUom: string; recipeUom: string | null; invToRecipeRatio: number; isActive: boolean; createdAt: string; updatedAt: string; }
export interface ItemRestaurantOverride { id: string; itemId: ItemId; restaurantId: RestaurantId; parLevel: number; isActive: boolean; createdAt: string; updatedAt: string; }
export interface ItemWithOverride extends Item { override: ItemRestaurantOverride | null; effectiveParLevel: number; effectiveIsActive: boolean; }
export interface ItemParStatus { item: Item; effectiveParLevel: number; currentStock: number; isBelowPar: boolean; deficit: number; }
export interface StockLevel { itemId: ItemId; qty: number; }
