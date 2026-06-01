# Synculariti OS IMS — Full Codebase Re-Audit Report

> **Audit Date**: 2026-06-01 (Round 2)
> **Scope**: All 9 Agent modules — current state after user fixes

---

## Executive Summary

| Severity | Count | Change from Round 1 |
|---|---|---|
| **CRITICAL** | 3 | +1 (new broken test issues) |
| **HIGH** | 11 | -1 (ACID fix) |
| **MEDIUM** | 11 | -3 |
| **LOW** | 19 | -6 |
| **Total** | **44** | **-9** |

**9 previously-reported violations FIXED, 1 partially fixed, 34 remain unfixed + 5 new findings.**

---

## ✅ FIXED (9)

| # | Module | Violation | Notes |
|---|---|---|---|
| C1 | Auth | PermissionRepository querying `restaurants` table | `getFranchiseGroupForRestaurant()` removed; delegates to `ITenantService` |
| C2 | Procurement | `updatePOStatus` outside ACID transaction | Now passes `trx` to all 4 operations in `receivePO` |
| R1 | Inventory | `LedgerRepository` joining `items` table | Joins removed; enrichment moved to service layer via `IItemReadService` |
| R2 | Inventory | `startBatch()` writing 2 tables without transaction | Now wrapped in `db.transaction()` in `inventory-count.service.ts:36` |
| R3 | Recipe | `getUnmappedRows` querying Sales tables | Removed from Recipe; lives in Sales module |
| R4 | Recipe | `createRecipe`/`deleteRecipe` without shared transaction | Both now propagate `trx` to `itemService.updateItem()` |
| R5 | Recipe | Repository JOIN-reading `items` table | Enrichment moved to service layer |
| T1 | Tenant | Missing CRUD endpoints | `POST`/`PUT` for franchise-groups and restaurants added (deletes still missing) |
| S1 | Sales | POST returns 200 instead of 201 | Default NestJS behavior is 201 — was never broken |

---

## ❌ NOT FIXED — Critical (3)

### C1 (NEW) — Recipe: All 3 test files have constructor mismatch — tests are broken

- **Files**: `recipe.service.spec.ts`, `recipe.service.sub-recipe-bom.spec.ts`, `recipe.service.item-type-inference.spec.ts`
- **Issue**: `RecipeService` constructor now takes 3 params `(db, recipeRepo, itemService)` but all tests pass only 2: `new RecipeService(mockRecipeRepo, mockItemService)`. This means `this.db` receives `mockRecipeRepo`, `this.recipeRepo` receives `mockItemService`, and `this.itemService` is `undefined`. Every test calling `createRecipe()`, `deleteRecipe()`, `findById()`, or `transaction()` will fail at runtime with `TypeError`.
- **Root cause**: `db` param was added to the constructor after the `@immutable-test` tests were written. Tests were never updated.
- **Recommendation**: Add `mockDb` as first argument to all 3 constructor calls.

### C2 (persistent) — Auth: Auth test is broken — missing `tenantService` argument

- **File**: `auth.service.spec.ts:70-74`
- **Issue**: After fixing PermissionRepository (C1 from round 1), `AuthService` now has a 4-param constructor including `tenantService`. The test only passes 3 args. The `verifyAndEnrich` test will throw `TypeError: Cannot read properties of undefined` at `this.tenantService.getRestaurant()`.
- **Recommendation**: Update test constructor to include `mockTenantService`.

### C3 (persistent) — Procurement: Immutable test assertion mismatched after ACID fix

- **File**: `procurement.service.spec.ts:179`
- **Issue**: Asserts `toHaveBeenCalledWith(PO_ID, 'RECEIVED')` but the fixed code now calls `updatePOStatus(PO_ID, 'RECEIVED', trx)` — 3 args vs 2. Vitest's exact matching will fail.
- **Recommendation**: Update assertion to expect 3 args, or relax matching.

---

## ❌ NOT FIXED — High (11)

| # | Module | Violation | File |
|---|---|---|---|
| H1 | Recipe | `findMenuRecipes` accepts `restaurantId` but **never uses it in WHERE clause** — returns ALL restaurants' data | `recipe.repository.ts:30-37` |
| H2 | Reporting | Depends on `IRecipeService` + `IProcurementReadService` beyond documented ISP contract (AGENTS.md says only `IStockQueryService` + `IItemReadService`) | `reporting-cogs.service.ts:14-19`, `reporting.module.ts:7-8` |
| H3 | Audit | `IAuditService` method named `logAction` instead of `log`; uses inline params type instead of `AuditEntryDto` | `i-audit.service.ts:5-20`, `audit.service.ts:11` |
| H4 | Audit | `oldValue`/`newValue` always `null` in `AuditInterceptor` — audit trail incomplete | `audit.interceptor.ts:39-40,55-56` |
| H5 | Tenant | DELETE endpoints still missing for `franchise-groups` and `restaurants` (AGENTS.md says CRUD) | `tenant.controller.ts`, `tenant.service.ts`, `tenant.repository.ts` |
| H6 | Auth | `PATCH /auth/profile` missing `@RequirePermission()` (R-SEC-02) | `auth.controller.ts:36-43` |
| H7 | Auth | `POST /auth/select-restaurant` missing `@RequirePermission()` (R-SEC-02) | `auth.controller.ts:27-34` |
| H8 | Auth | SYMBOLS.md `IAuthService` entry omits `verifyToken` | SYMBOLS.md:225 |
| H9 | Auth | SYMBOLS.md `loginSchema` entry claims `restaurantId` field that doesn't exist | SYMBOLS.md:138 |
| H10 | Auth | SYMBOLS.md `PermissionCode` documented as `const enum` (actually const object + type) | SYMBOLS.md:42 |
| H11 | Sales | `fileUrl`/`uploadedBy` silently dropped — no DB columns exist | `sales.repository.ts:17-29` |

---

## ❌ NOT FIXED — Medium (11)

| # | Module | Violation | File |
|---|---|---|---|
| M1 | Procurement | `createPoSchema` contains `restaurantId` server-context field (R-ARCH-05 corollary) | `procurement.validator.ts:22` |
| M2 | Procurement | `createDraftPO` signature mismatch with AGENTS.md (extra `restaurantId` param) | `i-procurement.service.ts:7` |
| M3 | Procurement | `getAverageUnitCosts` does in-memory aggregation in repository (business logic in wrong layer) | `procurement.repository.ts:187-212` |
| M4 | Procurement | `listPOs` uses `limit`/`offset` instead of `page`/`limit`; missing `meta` (R-API-03) | `procurement.controller.ts:42` |
| M5 | Inventory | `InventoryCountService` missing `implements IInventoryCountService` | `inventory-count.service.ts:28` |
| M6 | Inventory | Module exports repository tokens (`LEDGER_REPOSITORY_TOKEN`, etc.) — risks cross-repo injection | `inventory.module.ts:74` |
| M7 | Inventory | 5 test files missing `@immutable-test` comment | `inventory-count.controller.spec.ts`, `waste.service.spec.ts`, `waste.controller.spec.ts`, `prep.service.spec.ts`, `prep.controller.spec.ts` |
| M8 | Reporting | Controller directly injects `IProcurementReadService` — bypasses service layer (R-ARCH-02) | `reporting.controller.ts:16,61-66` |
| M9 | Reporting | Raw SQL for `REFRESH MATERIALIZED VIEW` (R-DB-03) | `reporting.service.ts:130,132` |
| M10 | Sales | `recipeId` resolved in processor but silently dropped by `insertImportRows` | `sales.processor.ts:58-67`, `sales.repository.ts` |
| M11 | Item | `Category.id` typed as `string` instead of `CategoryId` (branded type exists) | `packages/types/src/domain/item.ts:14` |

---

## ❌ NOT FIXED — Low (19)

| # | Module | Violation | File |
|---|---|---|---|
| L01 | Auth | `UpdateProfileInput` vs `UpdateProfileDto` naming mismatch | `i-auth.service.ts:9` |
| L02 | Procurement | `ProcurementService` missing `implements IProcurementService` | `procurement.service.ts:29` |
| L03 | Procurement | `getVendorPriceHistory` undocumented in AGENTS.md | `i-procurement-read.service.ts:17` |
| L04 | Procurement | `listPOs`/`listVendors` undocumented in AGENTS.md | `i-procurement.service.ts` |
| L05 | Item | `updateItemSchema = createItemSchema.partial()` preserves defaults — sparse PATCH applies unwanted defaults | `item.validator.ts:26` |
| L06 | Recipe | `as any` cast at `franchiseGroupId` assignment | `recipe.service.ts:241` |
| L07 | Recipe | Multiple `as any` casts in test files | 3 spec files |
| L08 | Recipe | Test files mock `getUnmappedRows` which no longer exists on interface (dead mock code) | 3 spec files |
| L09 | Tenant | Unsafe type casts (`as unknown as`) throughout repository | `tenant.repository.ts` (7+ occurrences) |
| L10 | Sales | `salesImportFileSchema` dead code (defined, exported, never used) | `sales.validator.ts:7-13` |
| L11 | Sales | `PdfSalesParser` unreachable (controller MIME regex doesn't allow PDF) | `parsers/pdf-sales.parser.ts` |
| L12 | Sales | `SALES_IMPORT_QUEUE`, `SalesImportJob`, `IMPORT_STATUSES` documented in SYMBOLS.md but don't exist | SYMBOLS.md:245,249,298 |
| L13 | Sales | `require()` without eslint-disable comment | `parsers/pdf-sales.parser.ts:2` |
| L14 | Sales | MIME type mismatch — controller allows `.xls`, validator schema doesn't | `sales.controller.ts:22` vs `validator.ts:8-11` |
| L15 | Sales | Widespread inline `import()` type annotations (7 files) | Multiple sales files |
| L16 | Sales | `as any` casts in test files (9 occurrences) | 2 spec files |
| L17 | Reporting | Inline `import()` type annotation | `reporting.controller.ts:15` |
| L18 | Reporting | String tokens instead of Symbol tokens; `REPORTING_COGS_SERVICE_TOKEN` exported but unused | `reporting.module.ts:22,26,30` |
| L19 | Reporting | `as any` casts in test mocks (24 occurrences across 3 files) | 3 spec files |
| L20 | All | SYMBOLS.md not updated to match code (see H8-H10, L03-L04, L12) | SYMBOLS.md |

---

## Cross-Cutting Observations

### Test Integrity Crisis

**3 modules have broken test suites** that would fail if executed:

1. **Recipe** — All 3 spec files have 2-arg constructor for a 3-param constructor + `getUnmappedRows` mock on removed method
2. **Auth** — 3-arg constructor for a 4-param constructor; mocks dead `getFranchiseGroupForRestaurant` on interface
3. **Procurement** — Assertion expects 2-arg `updatePOStatus` call but actual code passes 3

These are all consequences of fixing production code without updating the `@immutable-test`-marked test files. The `@immutable-test` constraint creates a tension: the tests were explicitly marked "NEVER MODIFY after first GREEN" but the production code they test was changed.

### SYMBOLS.md Documentation Drift

Despite fixes to production code, SYMBOLS.md was not updated. All original inaccuracies remain: `verifyToken` missing from `IAuthService`, `loginSchema` claiming `restaurantId`, `PermissionCode` documented as `const enum`, `SALES_IMPORT_QUEUE`/`SalesImportJob`/`IMPORT_STATUSES` referencing non-existent symbols, BullMQ queue name mismatch (`sales-import` vs `sales_import`), `FranchiseGroup`/`Restaurant` field mismatches, etc.

### Tenant Module Progress

Good progress — `create`/`update` endpoints added for both `franchise_groups` and `restaurants`. Still missing `delete` endpoints. AGENTS.md specifies "CRUD" which includes Delete.
