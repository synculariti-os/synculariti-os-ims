// Hand-authored Kysely schema definitions matching the Supabase schema and domain types
import type { Generated, ColumnType, Insertable, Selectable, Updateable } from 'kysely';
import type { 
  FranchiseGroupId, RestaurantId, ItemId, CategoryId, UserId, RoleId, 
  VendorId, PurchaseOrderId, PoLineItemId, InventoryBatchId, RecipeId, RecipeIngredientId, 
  MenuItemMappingId, LedgerEntryId, TransferId, CountBatchId, CountRowId, WasteLogId, PrepLogId, 
  SalesImportBatchId, SalesImportRowId, SnapshotId 
} from './branded';
import type { PermissionCode } from './constants/permissions';
import type { ItemType } from './domain/item';
import type { LedgerReasonCode, TransferStatus, CountStatus } from './domain/inventory';
import type { PurchaseOrderStatus } from './domain/procurement';
import type { ImportStatus } from './domain/sales';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  users: {
    id: UserId;
    email: string;
    full_name: string;
    password_hash: string;
    phone_number: string | null;
    active: Generated<boolean>;
    last_login_at: string | null;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  roles: {
    id: RoleId;
    name: string;
    description: string | null;
    created_at: Generated<string>;
  };
  permissions: {
    id: string;
    code: PermissionCode;
    description: string | null;
  };
  role_permissions: {
    role_id: RoleId;
    permission_id: string;
  };
  user_restaurant_roles: {
    user_id: UserId;
    restaurant_id: RestaurantId;
    role_id: RoleId;
  };
  franchise_groups: {
    id: FranchiseGroupId;
    name: string;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  restaurants: {
    id: RestaurantId;
    franchise_group_id: FranchiseGroupId;
    name: string;
    timezone: string;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  items: {
    id: ItemId;
    franchise_group_id: FranchiseGroupId | null;
    restaurant_id: RestaurantId | null;
    category_id: CategoryId;
    name: string;
    sku: string;
    type: ItemType;
    purchasing_uom: string;
    inventory_uom: string;
    recipe_uom: string | null;
    inv_to_recipe_ratio: number;
    is_active: Generated<boolean>;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  item_restaurant_overrides: {
    id: string;
    item_id: ItemId;
    restaurant_id: RestaurantId;
    par_level: number;
    is_active: Generated<boolean>;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  uom_conversions: {
    id: string;
    item_id: ItemId;
    from_uom: string;
    to_uom: string;
    multiplier_factor: number;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  categories: {
    id: CategoryId;
    franchise_group_id: FranchiseGroupId | null;
    restaurant_id: RestaurantId | null;
    name: string;
    description: string | null;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  vendors: {
    id: VendorId;
    franchise_group_id: FranchiseGroupId | null;
    restaurant_id: RestaurantId | null;
    name: string;
    contact_email: string | null;
    is_active: Generated<boolean>;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  purchase_orders: {
    id: PurchaseOrderId;
    restaurant_id: RestaurantId;
    vendor_id: VendorId;
    status: PurchaseOrderStatus;
    order_date: string;
    expected_delivery_date: string | null;
    freight_charge: number;
    tax_amount: number;
    discount_amount: number;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  po_line_items: {
    id: PoLineItemId;
    po_id: PurchaseOrderId;
    item_id: ItemId;
    quantity_ordered: number;
    quantity_received: Generated<number>;
    raw_unit_price: number;
    created_at: Generated<string>;
  };
  inventory_batches: {
    id: InventoryBatchId;
    restaurant_id: RestaurantId;
    item_id: ItemId;
    po_id: PurchaseOrderId | null;
    received_date: string;
    initial_qty: number;
    remaining_qty: number;
    landed_unit_cost: number;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  recipes: {
    id: RecipeId;
    franchise_group_id: FranchiseGroupId | null;
    restaurant_id: RestaurantId | null;
    produces_item_id: ItemId | null;
    recipe_name: string | null;
    yield_quantity: number;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  recipe_ingredients: {
    id: RecipeIngredientId;
    recipe_id: RecipeId;
    ingredient_item_id: ItemId;
    quantity_required: number;
    created_at: Generated<string>;
  };
  menu_item_mappings: {
    id: MenuItemMappingId;
    restaurant_id: RestaurantId;
    raw_excel_string: string;
    recipe_id: RecipeId;
    created_at: Generated<string>;
  };
  inventory_ledger: {
    id: LedgerEntryId;
    restaurant_id: RestaurantId;
    item_id: ItemId;
    change_amount: number;
    reason_code: LedgerReasonCode;
    reference_id: string | null;
    created_at: Generated<string>;
  };
  inventory_transfers: {
    id: TransferId;
    franchise_group_id: FranchiseGroupId;
    origin_restaurant_id: RestaurantId;
    destination_restaurant_id: RestaurantId;
    item_id: ItemId;
    qty: number;
    status: TransferStatus;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  inventory_count_batches: {
    id: CountBatchId;
    restaurant_id: RestaurantId;
    status: CountStatus;
    snapshot_timestamp: string;
    version: Generated<number>;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  inventory_count_rows: {
    id: CountRowId;
    batch_id: CountBatchId;
    item_id: ItemId;
    expected_qty: number;
    actual_qty: number | null;
    variance_qty: number | null;
  };
  waste_logs: {
    id: WasteLogId;
    restaurant_id: RestaurantId;
    item_id: ItemId;
    quantity: number;
    reason: string | null;
    recorded_at: string;
  };
  prep_production_logs: {
    id: PrepLogId;
    restaurant_id: RestaurantId;
    prep_item_id: ItemId;
    yield_qty_produced: number;
    produced_at: string;
  };
  sales_import_batches: {
    id: SalesImportBatchId;
    restaurant_id: RestaurantId;
    business_date: string;
    status: ImportStatus;
    error_message: string | null;
    created_at: Generated<string>;
    updated_at: Generated<string>;
  };
  sales_import_rows: {
    id: SalesImportRowId;
    batch_id: SalesImportBatchId;
    raw_item_name: string;
    quantity_sold: number;
    is_mapped: Generated<boolean>;
    created_at: Generated<string>;
  };
  daily_inventory_snapshots: {
    id: SnapshotId;
    restaurant_id: RestaurantId;
    item_id: ItemId;
    business_date: string;
    eod_qty: number;
    fifo_total_value: number;
    created_at: Generated<string>;
  };
  mat_view_variance_analytics: {
    restaurant_id: RestaurantId | null;
    item_id: ItemId | null;
    reporting_month: string | null;
    actual_qty: number | null;
    theoretical_qty: number | null;
    unexplained_variance_qty: number | null;
  };
  audit_log: {
    id: string;
    user_id: UserId | null;
    user_email: string | null;
    action: string;
    entity_type: string;
    entity_id: string;
    old_value: Json | null;
    new_value: Json | null;
    success: boolean;
    error_message: string | null;
    source_ip: string | null;
    user_agent: string | null;
    restaurant_id: RestaurantId | null;
    franchise_group_id: FranchiseGroupId | null;
    created_at: Generated<string>;
  };
}

export type Tables<T extends keyof Database> = Selectable<Database[T]>;
export type TablesInsert<T extends keyof Database> = Insertable<Database[T]>;
export type TablesUpdate<T extends keyof Database> = Updateable<Database[T]>;
