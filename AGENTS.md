# Agents — Synculariti OS IMS

> **Definition**: An *agent* in this context is a self-contained domain sub-system with a single responsibility, clear input/output contracts, and explicit ownership of database tables. Agents map 1-to-1 with NestJS modules and may not directly call each other's repositories — only their public service interfaces.

---

## Agent Index

| # | Agent | NestJS Module | Primary Tables |
|---|---|---|---|
| 1 | [Auth Agent](#1-auth-agent) | `AuthModule` | `users`, `roles`, `permissions`, `role_permissions`, `user_restaurant_roles` |
| 2 | [Tenant Agent](#2-tenant-agent) | `TenantModule` | `franchise_groups`, `restaurants` |
| 3 | [Item Master Agent](#3-item-master-agent) | `ItemModule` | `items`, `categories`, `uom_conversions`, `item_restaurant_overrides` |
| 4 | [Procurement Agent](#4-procurement-agent) | `ProcurementModule` | `vendors`, `purchase_orders`, `po_line_items`, `inventory_batches` |
| 5 | [Recipe/BOM Agent](#5-recipebom-agent) | `RecipeModule` | `recipes`, `recipe_ingredients`, `menu_item_mappings` |
| 6 | [Inventory Operations Agent](#6-inventory-operations-agent) | `InventoryModule` | `inventory_ledger`, `inventory_transfers`, `inventory_count_batches`, `inventory_count_rows`, `waste_logs`, `prep_production_logs` |
| 7 | [Sales Ingestion Agent](#7-sales-ingestion-agent) | `SalesModule` | `sales_import_batches`, `sales_import_rows` |
| 8 | [Reporting Agent](#8-reporting-agent) | `ReportingModule` | `daily_inventory_snapshots`, `mat_view_variance_analytics` (read-only) |
| 9 | [Audit Agent](#9-audit-agent) | `AuditModule` | `audit_log` |

---

## 1. Auth Agent

**Responsibility**: Verify Supabase Auth JWTs, resolve RBAC permission sets for the requesting user+restaurant context, and manage the public user profile linked to `auth.users`.

> [!NOTE]
> **JWT issuance is delegated to Supabase Auth.** The frontend logs in via `supabase.auth.signInWithPassword()`. NestJS never issues tokens — it only verifies them via `supabase.auth.getUser(token)` and enriches the context with app-level permissions.

### Inputs
- `POST /auth/select-restaurant` → `{ restaurantId }` — after Supabase login, user selects which restaurant context to operate in
- `GET /auth/me` → returns current user profile + resolved permissions for the active restaurant
- `PATCH /auth/profile` → update `full_name`, `phone_number` in `public.users`

> Login / logout / password reset / token refresh are handled by **Supabase Auth directly** from the frontend — they never hit the NestJS API.

### Auth Verification Flow (runs on every protected NestJS request)
```
1. Extract Bearer token from Authorization header
2. supabase.auth.getUser(token) → validates token + returns auth.users record
3. Look up public.users by id → get app profile (full_name, active flag)
4. If user.active = false → throw 403 Forbidden
5. Look up user_restaurant_roles WHERE user_id = sub AND restaurant_id = :selected
6. Resolve role → role_permissions → permission codes
7. Inject JwtPayload into request context
```

### Outputs
- `JwtPayload` injected into `request.user` by `SupabaseAuthGuard`:
  ```typescript
  {
    sub: UserId,              // from auth.users.id
    email: string,
    restaurantId: RestaurantId,
    franchiseGroupId: FranchiseGroupId,
    permissions: PermissionCode[]
  }
  ```

### Owned Tables
| Table | Access |
|---|---|
| `users` | READ + WRITE (`full_name`, `phone_number`, `last_login_at`, `active`) |
| `roles` | READ |
| `permissions` | READ |
| `role_permissions` | READ |
| `user_restaurant_roles` | READ |

### Contracts Exposed (injectable services)
```typescript
interface IAuthService {
  /** Verify Supabase token without restaurant context (used for context loading) */
  verifyToken(token: string): Promise<{ sub: UserId; email: string }>;
  /** Verify Supabase token and return enriched user context */
  verifyAndEnrich(token: string, restaurantId: string): Promise<JwtPayload>;
  /** Resolve permission codes for a user+restaurant pair */
  resolvePermissions(userId: string, restaurantId: string): Promise<PermissionCode[]>;
  /** Get public user profile (never returns password_hash) */
  getProfile(userId: string): Promise<SafeUser>;
  /** Update public user profile fields */
  updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser>;
}
```

### SOLID Notes
- **SRP**: Only handles token verification and permission resolution. Does NOT issue tokens (Supabase does).
- **DIP**: `IUserRepository` injected; Supabase admin client injected via `SUPABASE_ADMIN_CLIENT` token.

---

## 2. Tenant Agent

**Responsibility**: Manage the two-level tenancy hierarchy (`franchise_groups` → `restaurants`) and provide context helpers.

### Inputs
- CRUD REST endpoints for `franchise_groups` (admin-only)
- CRUD REST endpoints for `restaurants` (franchise admin)
- `GET /tenant/context` → returns current user's accessible restaurants (Requires `@TokenOnly()` as no restaurant context exists yet)

### Outputs
- `TenantContext` object consumed by the `TenantContextInterceptor` on every request
- Restaurant list for the UI restaurant selector

### Owned Tables
| Table | Access |
|---|---|
| `franchise_groups` | CRUD |
| `restaurants` | CRUD |

### Contracts Exposed
```typescript
interface ITenantService {
  getRestaurant(restaurantId: RestaurantId): Promise<Restaurant>;
  getFranchiseGroup(franchiseGroupId: FranchiseGroupId): Promise<FranchiseGroup>;
  listRestaurantsForUser(userId: UserId): Promise<Restaurant[]>;
}
```

### SOLID Notes
- **OCP**: Adding a new tenancy level (e.g., "region") only requires extending `TenantService` without touching other modules.

---

## 3. Item Master Agent

**Responsibility**: Manage the canonical item catalog, unit-of-measure conversions, and per-restaurant overrides (par levels, active status).

### Inputs
- CRUD for `items` (scoped to `franchise_group_id` or `restaurant_id`)
- CRUD for `categories`
- CRUD for `uom_conversions` per item
- PATCH for `item_restaurant_overrides` (par level, active flag)

### Outputs
- Resolved item with effective UOM conversion factors (used by Inventory, Sales, and Recipe agents)
- Par-level threshold list (consumed by Reporting Agent)

### Owned Tables
| Table | Access |
|---|---|
| `items` | CRUD |
| `categories` | CRUD |
| `uom_conversions` | CRUD |
| `item_restaurant_overrides` | CRUD |

### UI Views
- `/items` — Main catalog list and Create Item dialog.
  - *Note:* The item type (RAW vs PREP) is now purely derived from recipes. Users create all items as RAW, and when a recipe is attached, the backend `RecipeService` infers and automatically converts the item to PREP.

### Contracts Exposed
```typescript
interface IItemReadService {
  findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride>;
  convertUom(itemId: ItemId, qty: number, fromUom: string, toUom: string): Promise<number>;
  listParLevels(restaurantId: RestaurantId, page?: number, limit?: number): Promise<{ data: ItemWithOverride[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
}

interface IItemWriteService extends IItemReadService {
  createItem(dto: CreateItemDto, restaurantId: RestaurantId | null, franchiseGroupId: string | null): Promise<Item>;
  updateItem(itemId: ItemId, dto: UpdateItemDto): Promise<Item>;
  createCategory(dto: CreateCategoryDto): Promise<Category>;
  updateCategory(categoryId: string, dto: UpdateCategoryDto): Promise<Category>;
  upsertUomConversion(dto: CreateUomConversionDto): Promise<UomConversion>;
  updateOverride(itemId: ItemId, restaurantId: RestaurantId, dto: UpdateItemOverrideDto): Promise<ItemRestaurantOverride>;
  generateSku(categoryId: string): Promise<string>;
}
```

### SOLID Notes
- **SRP**: Does not compute stock levels — that is the Inventory Agent's job.
- **ISP**: `IItemReadService` (read-only) and `IItemWriteService` are separate interfaces so Reporting can depend only on reads.

---

## 4. Procurement Agent

**Responsibility**: Full PO lifecycle from creation through receipt, including FIFO batch costing on delivery.

### Inputs
- CRUD for `vendors`
- CRUD for `purchase_orders` + `po_line_items` (DRAFT stage)
- `PATCH /procurement/orders/:id/submit` — DRAFT → SUBMITTED
- `PATCH /procurement/orders/:id/receive` — SUBMITTED → RECEIVED (triggers FIFO batch + ledger)
- `PATCH /procurement/orders/:id/cancel` — DRAFT|SUBMITTED → CANCELLED

### Outputs (emitted via service call, not events)
- On receipt: calls `InventoryModule.LedgerService.record(...)` with `reason_code: 'PO_RECEIPT'`
- Creates `inventory_batches` row with computed `landed_unit_cost`

### Owned Tables
| Table | Access |
|---|---|
| `vendors` | CRUD |
| `purchase_orders` | CRUD |
| `po_line_items` | CRUD |
| `inventory_batches` | INSERT on receipt |

> [!NOTE]
> **Dual ownership**: Procurement Agent owns the INSERT of `inventory_batches` rows (on PO receipt). Inventory Agent owns FIFO costing semantics and stock-level consumption from batches. See [Cross-Agent ACID Critical Path](#acid-critical-path) below.

### Contracts Exposed
```typescript
interface IProcurementReadService {
  getAverageUnitCosts(restaurantId: string): Promise<Record<string, number>>;
}

interface IProcurementService {
  createDraftPO(dto: CreatePoDto): Promise<PurchaseOrder>;
  submitPO(poId: string): Promise<PurchaseOrder>;
  receivePO(poId: string, dto: ReceivePoDto): Promise<void>; // ACID transaction inside
  cancelPO(poId: string): Promise<void>;
}
```

### ACID Critical Path
```
BEGIN TRANSACTION
  UPDATE po_line_items SET quantity_received = ...
  INSERT INTO inventory_batches (landed_unit_cost = ...)
  UPDATE purchase_orders SET status = 'RECEIVED'
  INSERT INTO inventory_ledger (reason_code = 'PO_RECEIPT', change_amount = +qty)
COMMIT
```

---

## 5. Recipe/BOM Agent

**Responsibility**: Manage Bill of Materials (recipes) that define how prep items are produced, and the mapping between raw POS strings and internal recipes. It supports both standard recipes (producing an inventory-tracked `PREP` item) and "Virtual Recipes" (Menu Items without an inventory track, using `recipe_name`).

### Inputs
- `POST /recipes` — Create a new recipe with ingredients
- `PUT /recipes/:id` — Update recipe yield/ingredients
- `POST /recipes/mappings` — Map raw POS string to a recipe
- CRUD for `recipes` + `recipe_ingredients`
- CRUD for `menu_item_mappings` (raw POS string ↔ recipe)

### Outputs
- `expandBOM(recipeId, soldQty)` → list of `{ item_id, consumed_qty }` (consumed by Sales Agent). Includes circular reference guards (`visited` Set) and scales outputs by the `yield_percent`.
- `getRecipeForItem(itemId)` → recipe with ingredients (consumed by Reporting)

### Owned Tables
| Table | Access |
|---|---|
| `recipes` | CRUD |
| `recipe_ingredients` | CRUD |
| `menu_item_mappings` | CRUD |

### UI Views
- `/recipes` — Recipe (BOM) list and Create Recipe dialog.
- `/recipes/mappings` — POS mapping list and linking dialog.

### Contracts Exposed
```typescript
interface IRecipeService {
  listMenuRecipes(restaurantId: string): Promise<Recipe[]>;
  expandBOM(recipeId: string, soldQty: number): Promise<BomExpansionLine[]>;
  resolveRecipeByPosString(restaurantId: string, rawString: string): Promise<Recipe | null>;
  getIngredients(recipeId: string): Promise<RecipeIngredient[]>;
  createRecipe(dto: CreateRecipeDto, restaurantId: string | null, franchiseGroupId: string | null): Promise<Recipe>;
  updateRecipe(recipeId: RecipeId, dto: UpdateRecipeDto): Promise<Recipe>;
  createMenuItemMapping(restaurantId: string, dto: MenuItemMappingDto): Promise<void>;
}
```

### SOLID Notes
- **OCP**: BOM expansion algorithm is isolated in `BomExpansionStrategy` — substitutable without touching the controller.

---

## 6. Inventory Operations Agent

**Responsibility**: The single source of truth for all stock movements. Owns the append-only `inventory_ledger` and orchestrates physical counts, transfers, waste logs, and prep production.

### ⚠️ Critical Rule
`LedgerService.record()` is the **only** function in the entire codebase allowed to `INSERT INTO inventory_ledger`. All other agents call this service.

### Inputs
- Internal calls from Procurement, Sales, Recipe agents (ledger writes)
- `POST /inventory/transfers` — cross-restaurant stock movement
- `POST /inventory/counts/start` — open count batch
- `PUT /inventory/counts/:batchId/rows/:rowId` — submit actual count
- `POST /inventory/counts/:batchId/close` — reconcile and write adjustment
- `POST /inventory/waste` — waste log entry
- `POST /inventory/prep` — prep production log entry
- `GET /inventory/prep/plan` — plan prep production to calculate ingredient requirements and check for shortages
- `GET /inventory/stock` — returns current aggregated stock levels
- `GET /inventory/ledger` — returns paginated ledger entries

### Outputs
- Current stock level (computed by summing `inventory_ledger.change_amount` per `item_id + restaurant_id`)
- Reconciliation variance report (on count close)

### Owned Tables
| Table | Access |
|---|---|
| `inventory_ledger` | INSERT only (NEVER UPDATE/DELETE) |
| `inventory_transfers` | CRUD |
| `inventory_count_batches` | CRUD |
| `inventory_count_rows` | CRUD |
| `waste_logs` | INSERT |
| `prep_production_logs` | INSERT |

### Contracts Exposed
```typescript
interface ILedgerService {
  record(trx: Transaction, entry: LedgerEntryDto): Promise<void>;
  getCurrentStock(restaurantId: RestaurantId, itemId: ItemId): Promise<number>;
  getCurrentStockBulk(restaurantId: RestaurantId): Promise<StockLevel[]>;
  getLedgerEntries(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<any[]>;
}

interface IStockQueryService {
  getCurrentStock(restaurantId: RestaurantId, itemId: ItemId): Promise<number>;
  getCurrentStockBulk(restaurantId: RestaurantId): Promise<StockLevel[]>;
}

interface IInventoryCountService {
  startBatch(restaurantId: RestaurantId): Promise<InventoryCountBatch>;
  submitActualCount(batchId: CountBatchId, rowId: CountRowId, dto: SubmitCountRowDto): Promise<InventoryCountRow>;
  closeBatch(batchId: CountBatchId, dto: CloseCountBatchDto): Promise<void>;
}

interface IWasteService {
  logWaste(restaurantId: RestaurantId, dto: CreateWasteLogDto): Promise<WasteLog>;
  listWasteLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<WasteLog[]>;
}

interface IPrepService {
  logPrepProduction(restaurantId: RestaurantId, dto: CreatePrepLogDto): Promise<PrepProductionLog>;
  planPrepProduction(restaurantId: RestaurantId, dto: PlanPrepDto): Promise<PrepPlanResponse>;
  listPrepLogs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<PrepProductionLog[]>;
}
```

### SOLID Notes
- **SRP**: `LedgerService` only writes entries. `StockQueryService` only reads/aggregates them.
- **LSP**: `LedgerEntryDto` has a `reason_code` discriminant — new codes extend the union without breaking existing consumers.

---

## 7. Sales Ingestion Agent

**Responsibility**: Accept XLSX/CSV POS export files, parse them asynchronously, map rows to recipes via `menu_item_mappings`, and trigger BOM-based inventory depletion.

### Inputs
- `POST /sales-imports/upload` → multipart file upload
- `GET /sales-imports` → returns paginated list of batches for the current restaurant
- BullMQ internal job queue messages

### Outputs
- `sales_import_batches` status updates (PENDING → PROCESSING → COMPLETED | FAILED)
- `sales_import_rows` rows with `is_mapped` flag
- Calls `LedgerService.record({ reason_code: 'SALES_DEPLETION', change_amount: -qty })` per ingredient

### Owned Tables
| Table | Access |
|---|---|
| `sales_import_batches` | INSERT + status UPDATE |
| `sales_import_rows` | INSERT + `is_mapped` UPDATE |

### UI Views
- `/sales/import` — Sales POS file uploader and batch processing view.

### Processing Pipeline (BullMQ Worker)
```
1. Parse file (xlsx/csv)
2. Wrap execution in tenantContext.run(franchiseGroupId, restaurantId)
3. BEGIN Kysely TRANSACTION
   a. Upsert rows into sales_import_rows
   b. For each row:
      i.  resolveRecipeByPosString(restaurantId, raw_item_name)  ← RecipeAgent
      ii. expandBOM(recipeId, quantity_sold)                     ← RecipeAgent
      iii. LedgerService.record(trx, { reason_code: 'SALES_DEPLETION' }) ← InventoryAgent
4. COMMIT TRANSACTION
5. Update batch status
```

### SOLID Notes
- **DIP**: Parser is an injected `ISalesFileParser` interface — swap xlsx ↔ csv ↔ JSON without changing the worker.

---

## 8. Reporting Agent

**Responsibility**: Read-only analytics and EOD snapshot management. Never writes to operational tables.

### Inputs
- Scheduled job (cron) for EOD snapshots
- `GET /reports/variance` → query `mat_view_variance_analytics`
- `GET /reports/snapshots` → query `daily_inventory_snapshots`
- `GET /reports/par-alerts` → items below par level
- `GET /reports/cogs` → theoretical menu item costing based on aggregate actual ingredient prices

### Outputs
- `daily_inventory_snapshots` rows (INSERT only via scheduled job)
- Variance analytics data for the frontend dashboard
- Par-level alert list
- Menu item theoretical COGS breakdown

### Owned Tables
| Table | Access |
|---|---|
| `daily_inventory_snapshots` | INSERT (EOD job only) |
| `mat_view_variance_analytics` | READ |

### SOLID Notes
- **ISP**: Depends only on `IStockQueryService` and `IItemReadService`, never on write services.

---

## 9. Audit Agent

**Responsibility**: Passively record all mutating operations across the system. Write-only; audit data is never exposed via the API to non-admin users.

### Inputs
- Intercepted from `AuditInterceptor` (NestJS global interceptor on mutating HTTP methods)
- Fields captured: `user_id`, `user_email`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `success`, `error_message`, `source_ip`, `user_agent`, `restaurant_id`, `franchise_group_id`

### Outputs
- `audit_log` rows — never modified after insert

### Owned Tables
| Table | Access |
|---|---|
| `audit_log` | INSERT only (NEVER UPDATE/DELETE) |

### SOLID Notes
- **SRP**: No business logic. Pure event recording.
- **OCP**: New event types are supported by inserting new `entity_type` values — no code changes needed.

---

## Cross-Agent Dependency Rules

```
Auth ──────────────────────► (no deps on other agents)
Tenant ────────────────────► (no deps on other agents)
ItemMaster ────────────────► Tenant (restaurant validation)
Procurement ───────────────► ItemMaster, Inventory (LedgerService)
Recipe ────────────────────► ItemMaster
Inventory ─────────────────► ItemMaster, Tenant
Sales ─────────────────────► Recipe, Inventory (LedgerService)
Reporting ─────────────────► ItemMaster (read), Inventory (read), Recipe (read), Procurement (read)
Audit ─────────────────────► (receives from all via interceptor, no outbound deps)
```

> [!WARNING]
> **No circular dependencies are permitted.** Agents must never import each other's repositories directly. Cross-agent communication is always through the exported service interface, resolved via NestJS DI.
