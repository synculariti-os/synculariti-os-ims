import { ItemId, RestaurantId } from '../branded';
import { ItemWithOverride } from './item';

export interface VarianceReportRow {
  restaurantId: RestaurantId;
  itemId: ItemId;
  reportingMonth: string;
  actualQty: number | null;
  theoreticalQty: number | null;
  unexplainedVarianceQty: number | null;
}

export interface ParAlertRow {
  item: ItemWithOverride;
  currentStock: number;
  varianceFromPar: number; // positive means above par, negative means below par
}

export interface SnapshotRow {
  restaurantId: RestaurantId;
  itemId: ItemId;
  businessDate: string;
  eodQty: number;
  fifoTotalValue: number;
}

export interface CostReportIngredient {
  itemId: ItemId;
  itemName: string;
  qty: number;
  uom: string;
  unitCost: number;
  totalCost: number;
}

export interface MenuItemCostReport {
  recipeId: string;
  recipeName: string;
  totalCost: number;
  ingredients: CostReportIngredient[];
}

export interface VendorPriceHistoryRow {
  date: string;
  landedUnitCost: number;
  vendorId: string;
  vendorName: string;
  poId: string | null;
}
