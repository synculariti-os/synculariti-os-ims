# Symbols — Synculariti OS IMS

> Canonical reference for all shared TypeScript types, interfaces, DTOs, Zod schemas, NestJS providers, decorators, and constants. All symbols in `packages/` are shared across `apps/api` and `apps/web`. Symbols in `apps/api` are backend-only.

---

## Package: `@ims/types`

> Path: `packages/types/src/`

### Database Types (auto-generated)

| Symbol | Kind | Description |
|---|---|---|
| `Database` | `type` | Root Supabase DB type. Source of truth for all table shapes. |
| `Tables<T>` | `type` | Helper to extract a table's `Row` shape. e.g. `Tables<'items'>` |
| `TablesInsert<T>` | `type` | Helper to extract a table's `Insert` shape. |
| `TablesUpdate<T>` | `type` | Helper to extract a table's `Update` shape. |
| `Json` | `type` | Recursive JSON type for `jsonb` columns. |

---

### Domain Types — Tenancy

| Symbol | Kind | Source Table(s) | Description |
|---|---|---|---|
| `FranchiseGroup` | `interface` | `franchise_groups` | Top-level tenant. Fields: `id`, `name`, `legalName`, `taxId`, `countryCode`, `active` |
| `Restaurant` | `interface` | `restaurants` | Location within a franchise. Carries `franchiseGroupId`, `code`, `timezone` |
| `TenantContext` | `interface` | — | Runtime context: `{ restaurantId: RestaurantId; franchiseGroupId: FranchiseGroupId }` |

---

### Domain Types — Auth & RBAC

| Symbol | Kind | Source Table(s) | Description |
|---|---|---|---|
| `User` | `interface` | `users` | App user. **`passwordHash` field is `@Exclude()`-decorated** |
| `Role` | `interface` | `roles` | Named permission bundle |
| `Permission` | `interface` | `permissions` | Atomic permission code with module scope |
| `UserRestaurantRole` | `interface` | `user_restaurant_roles` | Junction: user ↔ restaurant ↔ role assignment |
| `JwtPayload` | `interface` | — | Shape of the JWT: `{ sub, email, restaurantId, franchiseGroupId, permissions }` |
| `PermissionCode` | `const enum` | `permissions` | All valid permission codes (e.g. `INVENTORY_READ`, `PROCUREMENT_WRITE`) |

---

### Domain Types — Item Master

| Symbol | Kind | Source Table(s) | Description |
|---|---|---|---|
| `Item` | `interface` | `items` | Master item. Fields: `id`, `name`, `sku`, `type` (`RAW`\|`PREP`), `inventoryUom`, `purchasingUom`, `recipeUom`, `invToRecipeRatio`, `isActive`, `franchiseGroupId?`, `restaurantId?` |
| `ItemType` | `type` | — | `'RAW' \| 'PREP'` |
| `Category` | `interface` | `categories` | Hierarchical grouping. `franchiseGroupId?` or `restaurantId?` (mutually exclusive) |
| `UomConversion` | `interface` | `uom_conversions` | `{ itemId, fromUom, toUom, multiplierFactor }` |
| `ItemRestaurantOverride` | `interface` | `item_restaurant_overrides` | Per-restaurant `parLevel` and `isActive` |
| `ItemWithOverride` | `interface` | — | Merged view: `Item & { override?: ItemRestaurantOverride }` |
| `ItemParStatus` | `interface` | — | `{ item: Item; currentStock: number; parLevel: number; isBelowPar: boolean }` |

---

### Domain Types — Procurement

| Symbol | Kind | Source Table(s) | Description |
|---|---|---|---|
| `Vendor` | `interface` | `vendors` | Supplier. `franchiseGroupId?` or `restaurantId?` scope |
| `PurchaseOrder` | `interface` | `purchase_orders` | PO header. Includes `status: PurchaseOrderStatus` |
| `PurchaseOrderStatus` | `type` | — | `'DRAFT' \| 'SUBMITTED' \| 'RECEIVED' \| 'CANCELLED'` |
| `PoLineItem` | `interface` | `po_line_items` | Line: `quantityOrdered`, `quantityReceived`, `rawUnitPrice` |
| `InventoryBatch` | `interface` | `inventory_batches` | FIFO costing batch: `initialQty`, `remainingQty`, `landedUnitCost`, `poId?` |

---

### Domain Types — Recipe / BOM

| Symbol | Kind | Source Table(s) | Description |
|---|---|---|---|
| `Recipe` | `interface` | `recipes` | BOM header: `producesItemId`, `yieldQuantity`, `yieldPercent`, scope (`franchiseGroupId?` or `restaurantId?`) |
| `RecipeIngredient` | `interface` | `recipe_ingredients` | BOM line: `ingredientItemId`, `quantityRequired` |
| `MenuItemMapping` | `interface` | `menu_item_mappings` | POS string → recipe mapping: `rawExcelString`, `recipeId`, `restaurantId` |
| `BomExpansion` | `interface` | — | Result of BOM expansion: `{ itemId: ItemId; consumedQty: number }[]` |

---

### Domain Types — Inventory Operations

| Symbol | Kind | Source Table(s) | Description |
|---|---|---|---|
| `InventoryLedgerEntry` | `interface` | `inventory_ledger` | Immutable entry: `itemId`, `restaurantId`, `changeAmount`, `reasonCode: LedgerReasonCode`, `referenceId?` |
| `LedgerReasonCode` | `type` | — | `'PO_RECEIPT' \| 'SALES_DEPLETION' \| 'WASTE' \| 'TRANSFER_OUT' \| 'TRANSFER_IN' \| 'COUNT_ADJUSTMENT' \| 'PREP_PRODUCTION' \| 'PREP_CONSUMPTION'` |
| `InventoryTransfer` | `interface` | `inventory_transfers` | Cross-restaurant movement: `originRestaurantId`, `destinationRestaurantId`, `itemId`, `qty`, `status: TransferStatus` |
| `TransferStatus` | `type` | — | `'PENDING' \| 'IN_TRANSIT' \| 'COMPLETED' \| 'CANCELLED'` |
| `InventoryCountBatch` | `interface` | `inventory_count_batches` | Count session header: `status: CountStatus`, `version` (optimistic lock) |
| `CountStatus` | `type` | — | `'OPEN' \| 'SUBMITTED' \| 'CLOSED'` |
| `InventoryCountRow` | `interface` | `inventory_count_rows` | Per-item count: `expectedQty`, `actualQty?`, `varianceQty?` |
| `WasteLog` | `interface` | `waste_logs` | Waste event: `itemId`, `quantity`, `reason?` |
| `PrepProductionLog` | `interface` | `prep_production_logs` | Prep event: `prepItemId`, `yieldQtyProduced` |
| `StockLevel` | `interface` | — | Aggregated view: `{ itemId: ItemId; qty: number }` |

---

### Domain Types — Sales

| Symbol | Kind | Source Table(s) | Description |
|---|---|---|---|
| `SalesImportBatch` | `interface` | `sales_import_batches` | Import session: `businessDate`, `status: ImportStatus`, `errorMessage?` |
| `ImportStatus` | `type` | — | `'PENDING' \| 'PROCESSING' \| 'COMPLETED' \| 'FAILED'` |
| `SalesImportRow` | `interface` | `sales_import_rows` | Parsed row: `rawItemName`, `quantitySold`, `isMapped` |
| `VendorPriceHistoryRow` | `interface` | (Virtual) | Historical unit cost trends for a vendor item |
| `DailyInventorySnapshot` | `interface` | `daily_inventory_snapshots` | EOD tracking: `restaurantId`, `itemId`, `recordedAt`, `stockLevel` |
| `CostReportIngredient` | `interface` | N/A | Sub-type for COGS report: `itemId`, `itemName`, `qty`, `uom`, `unitCost`, `totalCost` |
| `MenuItemCostReport` | `interface` | N/A | Theoretical COGS report: `recipeId`, `recipeName`, `totalCost`, `ingredients: CostReportIngredient[]` |
| `VarianceAnalyticRow` | `interface` | `mat_view_variance_analytics` | `{ restaurantId, itemId, reportingMonth, actualQty, theoreticalQty, unexplainedVarianceQty }` |

---

### Branded ID Types

| Symbol | Kind | Description |
|---|---|---|
| `RestaurantId` | `branded type` | `string & { __brand: 'RestaurantId' }` |
| `FranchiseGroupId` | `branded type` | `string & { __brand: 'FranchiseGroupId' }` |
| `UserId` | `branded type` | `string & { __brand: 'UserId' }` |
| `ItemId` | `branded type` | `string & { __brand: 'ItemId' }` |
| `RecipeId` | `branded type` | `string & { __brand: 'RecipeId' }` |
| `PurchaseOrderId` | `branded type` | `string & { __brand: 'PurchaseOrderId' }` |
| `VendorId` | `branded type` | `string & { __brand: 'VendorId' }` |

---

## Package: `@ims/validators`

> Path: `packages/validators/src/`
> All schemas use **Zod**. Inferred TS types are re-exported alongside schemas.

### Auth Schemas

| Symbol | Kind | Description |
|---|---|---|
| `loginSchema` | `ZodObject` | `{ email: z.string().email(), password: z.string().min(8), restaurantId: z.string().uuid() }` |
| `LoginDto` | `inferred type` | `z.infer<typeof loginSchema>` |

### Item Schemas

| Symbol | Kind | Description |
|---|---|---|
| `createItemSchema` | `ZodObject` | Full item creation fields; `type` is `.enum(['RAW', 'PREP'])` |
| `updateItemSchema` | `ZodObject` | Partial of `createItemSchema` via `.partial()` |
| `createCategorySchema` | `ZodObject` | `name`, `description?`, exactly one of `franchiseGroupId` or `restaurantId` via `.refine()` |
| `uomConversionSchema` | `ZodObject` | `{ itemId, fromUom, toUom, multiplierFactor: z.number().positive() }` |

### Procurement Schemas

| Symbol | Kind | Description |
|---|---|---|
| `createVendorSchema` | `ZodObject` | `name`, `contactEmail?`, exactly one scope via `.refine()` |
| `createPoSchema` | `ZodObject` | PO header + `lineItems: z.array(poLineItemSchema).min(1)` |
| `receivePoSchema` | `ZodObject` | `{ lineItems: { id, quantityReceived }[] }` |
| `poLineItemSchema` | `ZodObject` | `{ itemId, quantityOrdered: z.number().positive(), rawUnitPrice: z.number().nonnegative() }` |

### Recipe Schemas

| Symbol | Kind | Description |
|---|---|---|
| `createRecipeSchema` | `ZodObject` | producesItemId: ItemId | null; // Nullable to support Virtual Recipes (Menu Items)<br>recipeName: string | null;     // Virtual recipe name if no producesItemId<br>producesItemName?: string;<br>yieldQuantity: number;<br>yieldPercent: number;<br>createdAt: string;<br>updatedAt: string; |
| `recipeIngredientSchema` | `ZodObject` | `{ ingredientItemId, quantityRequired: z.number().positive() }` |
| `menuItemMappingSchema` | `ZodObject` | `{ rawExcelString: z.string().min(1), recipeId }` |

### Inventory Schemas

| Symbol | Kind | Description |
|---|---|---|
| `createTransferSchema` | `ZodObject` | `{ destinationRestaurantId, itemId, qty: z.number().positive() }` |
| `submitCountRowSchema` | `ZodObject` | `{ actualQty: z.number().nonnegative() }` |
| `createWasteLogSchema` | `ZodObject` | `{ itemId, quantity: z.number().positive(), reason? }` |
| `createPrepLogSchema` | `ZodObject` | `{ prepItemId, yieldQtyProduced: z.number().positive() }` |

### Sales Schemas

| Symbol | Kind | Description |
|---|---|---|
| `salesImportFileSchema` | `ZodObject` | Multer file validation: size ≤ 10MB, MIME in allowed list |
| `listBatchesQuerySchema` | `ZodObject` | Pagination parameters for fetching batches (`page`, `limit`) |
| `ListBatchesQueryDto` | `inferred type` | `z.infer<typeof listBatchesQuerySchema>` |

---

## Package: `apps/api` — NestJS Backend

### Decorators

All decorators live in `apps/api/src/common/decorators/` and are re-exported by their owning module.

| Symbol | Kind | Module | Description |
|---|---|---|---|
| `@RequirePermission(code: PermissionCode)` | Decorator | `common` | Route guard decorator — sets metadata read by `PermissionsGuard`. |
| `@Public()` | Decorator | `common` | Marks a route as not requiring JWT. |
| `@TokenOnly()` | Decorator | `common` | Marks a route as requiring JWT, but bypassing the `x-restaurant-id` context check (used for `GET /tenant/context`). |
| `@CurrentUser()` | Decorator | `common` | Parameter decorator — extracts `JwtPayload` from the request. |
| `@TenantId()` | Decorator | `common` | Parameter decorator — extracts `restaurantId` from JWT. |
| `@Transactional()` | Decorator | `common` | AOP decorator that wraps a service method in a Kysely transaction (metadata-only; actual tx handled by service layer). |

### Global Providers (registered in `AppModule`)

| Symbol | Kind | Description |
|---|---|---|
| `SupabaseAuthGuard` | `CanActivate` | Global guard — validates Bearer token via Supabase on all non-`@Public()` routes. |
| `PermissionsGuard` | `CanActivate` | Global guard — evaluates `@RequirePermission()` decorators. |
| `TenantContextInterceptor` | `NestInterceptor` | Calls `tenantContext.run()` to populate the context with `franchiseGroupId` and `restaurantId`. |
| `TenantContextDriver` | `Kysely Driver` | Custom Kysely driver wrapper. Automatically reads `tenantContext` and executes `set_tenant_context` on connection checkout. |
| `TransformResponseInterceptor` | `NestInterceptor` | Wraps all responses in `{ data }` envelope. |
| `AuditInterceptor` | `NestInterceptor` | Writes to `audit_log` after each mutating request (POST/PUT/PATCH/DELETE). |
| `GlobalExceptionFilter` | `ExceptionFilter` | Global exception handler — formats all errors into the standard response envelope. |

### Per-Route Providers (imported where used)

| Symbol | Kind | Description |
|---|---|---|
| `ZodValidationPipe` | `PipeTransform` | Validation pipe used per-route via `new ZodValidationPipe(schema)`. Not registered globally. |
| `@CurrentUser()` | Decorator | Parameter decorator — extracts `JwtPayload` from the request. |
| `@RequirePermission(code)` | Decorator | Route guard decorator — sets metadata read by `PermissionsGuard`. |

### Core Service Interfaces (exported from each module)

| Symbol | Kind | Module | Description |
|---|---|---|---|
| `IAuthService` | `interface` | `AuthModule` | `verifyAndEnrich`, `resolvePermissions`, `getProfile`, `updateProfile` |
| `ITenantService` | `interface` | `TenantModule` | `getRestaurant`, `getFranchiseGroup`, `listRestaurantsForUser` |
| `IItemReadService` | `interface` | `ItemModule` | `findById`, `convertUom`, `listParLevels` |
| `IItemWriteService` | `interface` | `ItemModule` | Extends `IItemReadService` with CRUD operations: `createItem`, `updateItem`, etc. |
| `CreateItemCommand` | `type` | `ItemModule` | Backend-only type: `CreateItemDto & { restaurantId: RestaurantId \| null; franchiseGroupId: FranchiseGroupId \| null }` |
| `CreateCategoryCommand` | `type` | `ItemModule` | Backend-only type: `CreateCategoryDto & { restaurantId: RestaurantId \| null; franchiseGroupId: FranchiseGroupId \| null }` |
| `IProcurementService` | `interface` | `ProcurementModule` | `createDraftPO`, `submitPO`, `receivePO`, `cancelPO` |
| `IRecipeService` | `interface` | `RecipeModule` | `expandBOM`, `resolveRecipeByPosString`, `getIngredients`, `createRecipe`, `updateRecipe`, `createMenuItemMapping` |
| `ILedgerService` | `interface` | `InventoryModule` | `record`, `getCurrentStock`, `getCurrentStockBulk` |
| `IStockQueryService` | `interface` | `InventoryModule` | Read-only: `getCurrentStock`, `getCurrentStockBulk` (for Reporting) |
| `IInventoryCountService` | `interface` | `InventoryModule` | `startBatch`, `submitActualCount`, `closeBatch` |
| `IWasteService` | `interface` | `InventoryModule` | `logWaste`, `listWasteLogs` |
| `IPrepService` | `interface` | `InventoryModule` | `logPrepProduction`, `planPrepProduction`, `listPrepLogs` |
| `ISalesService` | `interface` | `SalesModule` | `uploadSalesFile`, `listBatches` |
| `IAuditService` | `interface` | `AuditModule` | `log(entry: AuditEntryDto): Promise<void>` |

### BullMQ Queues

| Symbol | Kind | Queue Name | Description |
|---|---|---|---|
| `SALES_IMPORT_QUEUE` | `const` | `sales-import` | Queue for async XLS/CSV/PDF processing |
| `SalesImportProcessor` | `class` | — | BullMQ worker that processes sales import jobs |
| `ISalesFileParser` | `interface` | `SalesModule` | Interface for parsing different POS export file formats |
| `ISalesFileParserFactory` | `interface` | `SalesModule` | Factory to inject the correct parser based on file extension |
| `SalesImportJob` | `interface` | — | Job payload: `{ batchId: string; restaurantId: RestaurantId; filePath: string }` |

---

## Database Functions (Supabase / PostgreSQL)

| Symbol | Language | Description | Status |
|---|---|---|---|
| `set_tenant_context(p_franchise_id, p_restaurant_id)` | `plpgsql` | Sets `app.current_franchise_id` and `app.current_restaurant_id` session variables. Called by `TenantContextInterceptor` before every query. | ✅ Implemented |
| `safe_cast_uuid(p_val)` | `plpgsql` | Safe UUID casting — returns `NULL` instead of throwing on invalid input. | ❌ Not yet created |

### Materialized View

| Symbol | Type | Description |
|---|---|---|
| `mat_view_variance_analytics` | `MATERIALIZED VIEW` | Monthly variance: `actual_qty` vs `theoretical_qty` vs `unexplained_variance_qty` per `item_id + restaurant_id`. Refreshed by scheduled job. |

---

## Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `SUPABASE_URL` | `api`, `web` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `web` | Public anon key (for Next.js RSC → Supabase with RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | `api` | Service role key for NestJS direct DB access |
| `DATABASE_URL` | `api` | Direct PostgreSQL connection string (pooled via PgBouncer) |
| `JWT_PRIVATE_KEY` | `api` | RS256 private key for JWT signing |
| `JWT_PUBLIC_KEY` | `api`, `web` | RS256 public key for JWT verification |
| `JWT_EXPIRY` | `api` | Access token TTL (default: `'15m'`) |
| `REFRESH_TOKEN_EXPIRY` | `api` | Refresh token TTL (default: `'7d'`) |
| `REDIS_URL` | `api` | Redis connection string for BullMQ |
| `SALES_IMPORT_MAX_FILE_SIZE_MB` | `api` | Max upload size (default: `10`) |
| `NODE_ENV` | all | `development` \| `test` \| `production` |

---

## Constants

| Symbol | Package | Value | Description |
|---|---|---|---|
| `LEDGER_REASON_CODES` | `@ims/types` | object | All valid `LedgerReasonCode` values as named constants |
| `PURCHASE_ORDER_STATUS` | `@ims/types` | object | All valid PO status values |
| `DEFAULT_PAGE_LIMIT` | `@ims/types` | `50` | Default pagination size |
| `MAX_PAGE_LIMIT` | `@ims/types` | `200` | Maximum allowed pagination size |
| `PERMISSION_CODES` | `@ims/types` | object | All 13 permission codes (synced from `permissions` table) |
| `ITEM_TYPES` | `@ims/types` | `['RAW', 'PREP']` | Valid item type values |
| `TRANSFER_STATUSES` | `@ims/types` | object | Valid transfer status values |
| `COUNT_STATUSES` | `@ims/types` | object | Valid count batch status values |
| `IMPORT_STATUSES` | `@ims/types` | object | Valid sales import status values |
