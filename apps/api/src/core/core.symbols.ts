// ─── Infrastructure ───────────────────────────────────────────────────────────
export const DB_CLIENT = Symbol('DB_CLIENT');
export const SUPABASE_ADMIN_CLIENT = Symbol('SUPABASE_ADMIN_CLIENT');

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const AUTH_SERVICE_TOKEN = Symbol('IAuthService');
export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');
export const PERMISSION_REPOSITORY_TOKEN = Symbol('IPermissionRepository');

// ─── Tenant ───────────────────────────────────────────────────────────────────
export const TENANT_SERVICE_TOKEN = Symbol('ITenantService');

// ─── Item Master ──────────────────────────────────────────────────────────────
export const ITEM_READ_SERVICE_TOKEN = Symbol('IItemReadService');
export const ITEM_WRITE_SERVICE_TOKEN = Symbol('IItemWriteService');
export const ITEM_REPOSITORY_TOKEN = Symbol('IItemRepository');

// ─── Procurement ──────────────────────────────────────────────────────────────
export const PROCUREMENT_SERVICE_TOKEN = Symbol('IProcurementService');
export const PROCUREMENT_READ_SERVICE_TOKEN = Symbol('IProcurementReadService');
export const PROCUREMENT_REPOSITORY_TOKEN = Symbol('IProcurementRepository');

// ─── Recipe ───────────────────────────────────────────────────────────────────
export const RECIPE_SERVICE_TOKEN = Symbol('IRecipeService');
export const RECIPE_REPOSITORY_TOKEN = Symbol('IRecipeRepository');

// ─── Inventory ────────────────────────────────────────────────────────────────
export const LEDGER_SERVICE_TOKEN = Symbol('ILedgerService');
export const LEDGER_REPOSITORY_TOKEN = Symbol('ILedgerRepository');
export const STOCK_QUERY_SERVICE_TOKEN = Symbol('IStockQueryService');
export const INVENTORY_COUNT_SERVICE_TOKEN = Symbol('IInventoryCountService');
export const COUNT_REPOSITORY_TOKEN = Symbol('IInventoryCountRepository');
export const WASTE_SERVICE_TOKEN = Symbol('IWasteService');
export const WASTE_REPOSITORY_TOKEN = Symbol('IWasteRepository');
export const PREP_SERVICE_TOKEN = Symbol('IPrepService');
export const PREP_REPOSITORY_TOKEN = Symbol('IPrepRepository');
export const INVENTORY_TRANSFER_SERVICE_TOKEN = Symbol('IInventoryTransferService');

// ─── Sales ────────────────────────────────────────────────────────────────────
export const SALES_SERVICE_TOKEN = Symbol('ISalesService');

// ─── Reporting ────────────────────────────────────────────────────────────────
export const REPORTING_SERVICE_TOKEN = Symbol('IReportingService');
export const REPORTING_COGS_SERVICE_TOKEN = Symbol('IReportingCogsService');
export const REPORTING_REPOSITORY_TOKEN = Symbol('IReportingRepository');

// ─── Audit ────────────────────────────────────────────────────────────────────
export const AUDIT_SERVICE_TOKEN = Symbol('IAuditService');

