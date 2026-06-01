# Synculariti OS IMS — Full Codebase Re-Audit Report (Round 3)

> **Audit Date**: 2026-06-02
> **Scope**: All 9 Agent modules — current state after user fixes
> **Methodology**: Every file read fresh — no cached state

---

## Executive Summary

| Severity | Count | Change from Round 2 |
|---|---|---|
| **CRITICAL** | 0 | -3 (all fixed) |
| **HIGH** | 6 | -5 |
| **MEDIUM** | 7 | -4 |
| **LOW** | 13 | -6 |
| **Total** | **26** | **-18** |

**Significant progress: 18 issues resolved since Round 2. Zero critical violations remain.**

---

## ✅ FIXED (18 total across all rounds)

### Critical Fixes

| Module | Violation | Status |
|---|---|---|
| Auth | PermissionRepository querying `restaurants` table | **FIXED** — delegates to `ITenantService` |
| Procurement | `updatePOStatus` outside ACID transaction in `receivePO` | **FIXED** — all 4 operations share `trx` |
| Recipe | All 3 test files had constructor mismatch (2-arg vs 3-param) | **FIXED** — tests now pass `mockDb, mockRepo, mockItemService` |
| Auth | Auth test had constructor mismatch (3-arg vs 4-param) | **FIXED** — tests now pass `mockTenantService` |
| Procurement | Immutable test assertion mismatched (2-arg vs 3-arg expectation) | **FIXED** — assertion uses `expect.anything()` for `trx` |

### High/Medium Fixes

| Module | Violation | Status |
|---|---|---|
| Recipe | `findMenuRecipes` had unused `restaurantId` — data leak (returned all restaurants) | **FIXED** — `WHERE restaurant_id = ?` now in query |
| Recipe | `createRecipe`/`deleteRecipe` without shared transaction | **FIXED** — both wrap repo + itemService in `db.transaction()` |
| Recipe | `getUnmappedRows` querying Sales Agent tables | **FIXED** — removed from Recipe; moved to Sales module |
| Recipe | Repository JOIN-reading `items` table | **FIXED** — enrichment moved to service layer via `IItemReadService` |
| Inventory | `LedgerRepository` joining `items` table | **FIXED** — no JOINs; enrichment at service layer |
| Inventory | `startBatch()` writing 2 tables without transaction | **FIXED** — wrapped in `db.transaction()` |
| Tenant | Missing CRUD endpoints | **FIXED** — `POST`/`PUT` for franchise-groups and restaurants added |
| Audit | `IAuditService` method named `logAction` instead of `log` | **FIXED** — renamed to `log` |
| Audit | `AuditEntryDto` type missing | **FIXED** — properly defined in `@ims/types` |
| Sales | `PdfSalesParser` unreachable (MIME regex didn't allow PDF) | **FIXED** — controller regex now includes `pdf` |
| Sales | `require()` without eslint-disable comment | **FIXED** — converted to ES `import` |
| Procurement | Test now passes — assertions updated to match fixed code | **FIXED** |

---

## ❌ REMAINING ISSUES — High (6)

### H1 — Audit: `oldValue` always null — no before-state capture
- **File**: `audit.interceptor.ts:39,55`
- **Issue**: `oldValue` hardcoded to `null`. The audit log can never show what a value was changed from — only what it was changed to. This defeats rollback analysis and data change tracking.
- **Fix**: Capture request body before mutation (`oldValue`) and response body after (`newValue`).

### H2 — Reporting: Depends on services beyond documented ISP contract
- **File**: `reporting-cogs.service.ts:14-19` + `reporting.module.ts:7-8`
- **Issue**: Injects `IRecipeService` + `IProcurementReadService`. AGENTS.md says Reporting depends only on `IStockQueryService` and `IItemReadService`. Cross-Agent Dependency Rules in AGENTS.md DO list Reporting → Recipe (read) and Reporting → Procurement (read), so the **AGENTS.md ISP note on line 412 is outdated**, but the code is consistent with the dependency rules.

### H3 — Sales: `fileUrl`/`uploadedBy` silently dropped
- **File**: `sales.repository.ts:17-29`
- **Issue**: Service passes both values but repository INSERT only writes `restaurant_id`, `business_date`, `status`. Data is permanently lost. Comment on line 28 acknowledges this.

### H4 — Sales: `recipeId` computed in processor but silently dropped by `insertImportRows`
- **File**: `sales.processor.ts:58-67` + `sales.repository.ts:40-54`
- **Issue**: Processor resolves `recipeId` from menu mappings and passes it in row data, but repository INSERT doesn't include `recipe_id` column. Mapping audit trail is lost.

### H5 — Inventory: `InventoryCountService` missing `implements IInventoryCountService`
- **File**: `inventory-count.service.ts:28`
- **Issue**: All other Inventory services (`LedgerService`, `StockQueryService`, `WasteService`, `PrepService`, `InventoryTransferService`) declare `implements` their interfaces. `InventoryCountService` is the only one missing it.

### H6 — Inventory: Module exports 4 repository tokens
- **File**: `inventory.module.ts:74`
- **Issue**: `LEDGER_REPOSITORY_TOKEN`, `COUNT_REPOSITORY_TOKEN`, `WASTE_REPOSITORY_TOKEN`, `PREP_REPOSITORY_TOKEN` are exported, allowing other modules to bypass service layer and inject repositories directly.

---

## ❌ REMAINING ISSUES — Medium (7)

### M1 — Procurement: `createPoSchema` contains `restaurantId` server-context field (R-ARCH-05)
- **File**: `procurement.validator.ts:22`
- **Issue**: `restaurantId` is in the shared Zod schema, but the service ignores it from the body and uses JWT context instead. Dual-sourcing creates ambiguity.

### M2 — Procurement: `getAverageUnitCosts` does in-memory aggregation in repository
- **File**: `procurement.repository.ts:187-212`
- **Issue**: Weighted average computation in TypeScript loops — business logic in repository. Should be SQL `GROUP BY` or moved to service.

### M3 — Procurement: `listPOs` uses `limit`/`offset` instead of `page`/`limit`; missing `meta` (R-API-03)
- **File**: `procurement.controller.ts:42`
- **Issue**: Returns `{ data }` without `meta: { total, page, limit, totalPages }`. No `COUNT(*)` query exists.

### M4 — Inventory: 5 test files missing `@immutable-test` comment
- **Files**: `inventory-count.controller.spec.ts`, `waste.service.spec.ts`, `waste.controller.spec.ts`, `prep.service.spec.ts`, `prep.controller.spec.ts`
- **Issue**: 5 of 10 inventory spec files have the annotation; 5 don't. Inconsistent.

### M5 — Inventory: `LedgerService` test constructor mismatch (2-param vs 1-arg)
- **Files**: `ledger.service.spec.ts:51`, `ledger.service-queries.spec.ts:29`
- **Issue**: `new LedgerService(mockLedgerRepository)` — missing `itemService` arg. Works only because catch blocks swallow the resulting `TypeError`.

### M6 — Reporting: `IReportingService`/`IReportingCogsService` use string tokens instead of Symbol tokens
- **File**: `reporting.module.ts:22,26,30`
- **Issue**: `REPORTING_COGS_SERVICE_TOKEN` Symbol exists but is dead code — module uses string `'IReportingCogsService'`. No Symbol defined for `IReportingService`.

### M7 — Sales: `@HttpCode(201)` missing on `POST /sales-imports/upload`
- **File**: `sales.controller.ts:15-40`
- **Issue**: NestJS defaults POST to 200. R-API-05 specifies 201 for Created.

---

## ❌ REMAINING ISSUES — Low (13)

| # | Module | Violation | File |
|---|---|---|---|
| L01 | Item | `Category.id` typed as `string` instead of `CategoryId` | `domain/item.ts:14` |
| L02 | Item | `updateItemSchema = createItemSchema.partial()` preserves defaults — sparse PATCH applies unwanted values | `item.validator.ts:26` |
| L03 | Recipe | One remaining `as any` cast (franchiseGroupId coercion) | `recipe.service.ts:241` |
| L04 | Procurement | `ProcurementService` missing `implements IProcurementService` | `procurement.service.ts:29` |
| L05 | Procurement | `createDraftPO` extra `restaurantId` param not in AGENTS.md contract | `i-procurement.service.ts:7` |
| L06 | Procurement | `getVendorPriceHistory` undocumented in AGENTS.md | various |
| L07 | Tenant | Unsafe `as unknown as` type casts throughout repository | `tenant.repository.ts` (7+) |
| L08 | Sales | `salesImportFileSchema` dead code (defined, exported, never used) | `sales.validator.ts:7-13` |
| L09 | Sales | `SALES_IMPORT_QUEUE`, `SalesImportJob`, `IMPORT_STATUSES` documented in SYMBOLS.md but don't exist | SYMBOLS.md |
| L10 | Sales | MIME mismatch — controller allows `.xls` (`vnd.ms-excel`), dead schema doesn't | controller vs validator |
| L11 | Sales | Widespread inline `import()` type annotations (7 files) | Multiple sales files |
| L12 | Reporting | Inline `import()` type annotation | `reporting.controller.ts:15` |
| L13 | Reporting | 24 `as any` casts across 3 test files | 3 reporting spec files |

---

## Summary by Module

| Module | Total Violations | Critical | High | Med | Low | Status |
|---|---|---|---|---|---|---|
| **Auth** | 0 | 0 | 0 | 0 | 0 | **CLEAN** |
| **Tenant** | 1 | 0 | 0 | 0 | 1 | Mostly clean (unsafe casts) |
| **Item** | 2 | 0 | 0 | 0 | 2 | Clean (branded type + validator default) |
| **Recipe** | 1 | 0 | 0 | 0 | 1 | Clean (one `as any`) |
| **Procurement** | 5 | 0 | 0 | 3 | 2 | ACID path fixed; pagination/schema/agg remain |
| **Inventory** | 4 | 0 | 2 | 2 | 0 | Ledger JOIN + startBatch TX fixed; implements + exports remain |
| **Sales** | 5 | 0 | 2 | 1 | 2 | PDF parser fixed; fileUrl/recipeId dropping + docs remain |
| **Reporting** | 4 | 0 | 1 | 1 | 2 | Tokens + import() + as any remain |
| **Audit** | 1 | 0 | 1 | 0 | 0 | Method name fixed; `oldValue` capture remains |

**Clean modules (0 violations):** Auth, Item
**Nearly clean (1 violation each):** Tenant, Recipe, Audit
**Needs most work:** Procurement (5), Sales (5), Inventory (4), Reporting (4)
