# Synculariti OS IMS — Full Codebase Re-Audit Report (Round 4)

> **Audit Date**: 2026-06-02
> **Scope**: All 9 Agent modules — every file read fresh

---

## Executive Summary

| Severity | Count | Change from Round 3 |
|---|---|---|
| **CRITICAL** | 0 | — |
| **HIGH** | 2 | -4 |
| **MEDIUM** | 2 | -5 |
| **LOW** | 12 | -1 |
| **Total** | **16** | **-10** |

**10 issues resolved since Round 3. Zero critical violations. Codebase is in good shape.**

---

## ✅ FIXED Since Round 3 (10)

| Module | Violation | Round 3 Severity |
|---|---|---|
| Sales | `@HttpCode(201)` missing on upload endpoint | Med — **FIXED** |
| Sales | `fileUrl`/`uploadedBy` silently dropped by `createBatch` | High — **FIXED** |
| Sales | `recipeId` computed but silently dropped by `insertImportRows` | High — **FIXED** |
| Inventory | `InventoryCountService` missing `implements IInventoryCountService` | High — **FIXED** |
| Inventory | Module exported repository tokens | High — **FIXED** (only service tokens remain) |
| Inventory | 5 test files missing `@immutable-test` | Med — **FIXED** (all 10 files now have it) |
| Inventory | `LedgerService` test constructor mismatch (1-arg vs 2-param) | Med — **FIXED** |
| Procurement | `restaurantId` in `createPoSchema` (R-ARCH-05) | Med — **FIXED** (removed from PO schema) |
| Procurement | `listPOs` used `limit`/`offset` instead of `page`/`limit`, missing `meta` | Med — **FIXED** |
| Procurement | `getAverageUnitCosts` in-memory aggregation in repository | Med — **FIXED** (uses SQL GROUP BY) |
| Tenant | DELETE endpoints still missing | High — **FIXED** (both added) |
| Reporting | `IReportingService`/`IReportingCogsService` string tokens instead of Symbols | Low — **FIXED** |

---

## ❌ REMAINING — High (2)

### H1 — Audit: `oldValue` semantically wrong (request body, not prior state)
- **File**: `audit.interceptor.ts:39,55`
- **Issue**: `oldValue` = `request.body || null` — this is the incoming DTO (new data), not the entity's state before the mutation. `newValue` = `response` is reasonable. The audit trail captures "what was sent" instead of "what was changed from."
- **Fix**: Read entity before mutation for `oldValue`, or at minimum rename to make the semantic clear.

### H2 — Reporting: Controller directly injects `IProcurementReadService`, bypassing service layer
- **File**: `reporting.controller.ts:16,65`
- **Issue**: The `getVendorPriceHistory` endpoint calls `this.procurementReadService.getVendorPriceHistory()` directly from the controller instead of routing through a Reporting service method. Cross-module calls should go through the module's own service layer.
- **Fix**: Expose a `getVendorPriceHistory` method on `IReportingService` or `IReportingCogsService` that delegates to Procurement.

---

## ❌ REMAINING — Medium (2)

### M1 — Sales: `salesImportFileSchema` dead code
- **File**: `sales.validator.ts:7-13`
- **Issue**: Schema defined and exported but never imported anywhere. Controller uses inline `ParseFilePipeBuilder`.
- **Fix**: Either remove it or convert controller to use it (R-ARCH-05: shared validation lives in validators).

### M2 — Sales: MIME type mismatch — `salesImportFileSchema` and `SALES_IMPORT_ALLOWED_MIME_TYPES` don't list PDF
- **Files**: `sales.validator.ts:8-11`, `constants/index.ts`
- **Issue**: Controller allows PDF via regex. But the validator schema (dead code) and the `SALES_IMPORT_ALLOWED_MIME_TYPES` constant only list xlsx/csv. PDF is an accepted format at runtime but not reflected in the official MIME lists.

---

## ❌ REMAINING — Low (12)

| # | Module | Violation | File |
|---|---|---|---|
| L01 | Item | `Category.id` typed as `string` instead of `CategoryId` (branded type exists) | `domain/item.ts:14` |
| L02 | Item | `updateItemSchema = createItemSchema.partial()` preserves defaults — sparse PATCH applies unwanted defaults | `item.validator.ts:26` |
| L03 | Item | `generateSku(categoryId, restaurantId)` has extra `restaurantId` param not in AGENTS.md contract | `i-item.service.ts:40` |
| L04 | Recipe | One `as any` cast (franchiseGroupId coercion at line 241) | `recipe.service.ts:241` |
| L05 | Procurement | `ProcurementService` missing `implements IProcurementService` | `procurement.service.ts:29` |
| L06 | Procurement | `createDraftPO` extra `restaurantId` param not in AGENTS.md contract | `i-procurement.service.ts:7` |
| L07 | Procurement | `getVendorPriceHistory` undocumented in AGENTS.md | various |
| L08 | Tenant | Unsafe `as unknown as` type casts in repository (7+ occurrences) | `tenant.repository.ts` |
| L09 | Sales | `SALES_IMPORT_QUEUE` / `SalesImportJob` / `IMPORT_STATUSES` (plural) documented in SYMBOLS.md but don't exist (`IMPORT_STATUS` singular exists) | SYMBOLS.md |
| L10 | Sales | `require('pdf-parse')` uses CommonJS style (no eslint-disable comment) | `pdf-sales.parser.ts:2` |
| L11 | Reporting | Inline `import()` type annotation + duplicate `IReportingService` import | `reporting.controller.ts:15,1,11` |
| L12 | Reporting | 24 `as any` casts across 3 test files | 3 spec files |

---

## Summary by Module

| Module | Total | High | Med | Low | Changes from Round 3 |
|---|---|---|---|---|---|
| **Auth** | 0 | 0 | 0 | 0 | Clean |
| **Tenant** | 1 | 0 | 0 | 1 | Delete endpoints added |
| **Item** | 3 | 0 | 0 | 3 | Unchanged |
| **Recipe** | 1 | 0 | 0 | 1 | Unchanged |
| **Procurement** | 3 | 0 | 0 | 3 | -3 (pagination, schema, aggregation fixed) |
| **Inventory** | 0 | 0 | 0 | 0 | **CLEAN** (implements, exports, tests, constructor all fixed) |
| **Sales** | 3 | 0 | 2 | 1 | -2 (fileUrl, recipeId, HttpCode fixed) |
| **Reporting** | 3 | 1 | 0 | 2 | -1 (Symbol tokens fixed) |
| **Audit** | 1 | 1 | 0 | 0 | Unchanged |

**Clean modules (0 violations):** Auth, Inventory
**Nearly clean (1 violation):** Tenant, Recipe, Audit
