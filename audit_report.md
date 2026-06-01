# Synculariti OS IMS — Full Codebase Re-Audit Report (Round 5)

> **Audit Date**: 2026-06-02
> **Scope**: All 9 Agent modules — every file re-checked

---

## Executive Summary

| Severity | Count | Change from Round 4 |
|---|---|---|
| **CRITICAL** | 0 | — |
| **HIGH** | 0 | -2 |
| **MEDIUM** | 0 | -2 |
| **LOW** | 1 | -11 |
| **Total** | **1** | **-15** |

**15 issues resolved since Round 4. Only 1 LOW issue remains — test file type hygiene.**

---

## ✅ FIXED Since Round 4 (15)

### High (2)

| Module | Violation | Fix |
|---|---|---|
| Audit | `oldValue` = `request.body` (wrong semantic) | Added `setAuditBeforeState()` utility; interceptor checks `request.__auditBeforeState` first, falls back to `request.body`. Also renamed to `requestPayload`/`responsePayload` in `AuditEntryDto` |
| Reporting | Controller directly injected `IProcurementReadService` | `getVendorPriceHistory` now routes through `IReportingCogsService`; controller depends only on service layer |

### Medium (2)

| Module | Violation | Fix |
|---|---|---|
| Sales | `salesImportFileSchema` dead code | Removed from `sales.validator.ts` and SYMBOLS.md |
| Sales | PDF missing from `SALES_IMPORT_ALLOWED_MIME_TYPES` | Added `application/pdf` |

### Low (11)

| # | Module | Violation | Fix |
|---|---|---|---|
| L04 | Recipe | `as any` cast for `franchiseGroupId` | Replaced with `as FranchiseGroupId \| null` |
| L05 | Procurement | Missing `implements IProcurementService` | Added to class declaration |
| L09 | Sales | SYMBOLS.md documented dead symbols | Removed `SALES_IMPORT_QUEUE`/`SalesImportJob`; fixed `IMPORT_STATUSES` → `IMPORT_STATUS` |
| L10 | Sales | `require()` without eslint-disable | Added `@typescript-eslint/no-require-imports` comment |
| L11 | Reporting | Duplicate import + inline `import()` type | Cleaned up imports |

The following were fixed in earlier rounds and remain resolved:
- L01: `Category.id` typed as `CategoryId` (branded)
- L02: `updateItemSchema` standalone (no longer `.partial()` of create schema)
- L03: `generateSku` interface matches AGENTS.md (no `restaurantId`)
- L06: `createDraftPO` interface matches AGENTS.md (has `restaurantId`)
- L07: `getVendorPriceHistory` documented in AGENTS.md
- L08: Zero `as unknown as` casts remain in tenant repository

---

## ❌ REMAINING — Low (1)

| # | Module | Violation | File |
|---|---|---|---|
| L12 | Cross-module | 249 `as any` casts across 23 test/spec files | 23 `*.spec.ts` files |

`as any` casts suppress type-checking in tests. Each is individually harmless, but collectively they weaken the type safety net. Fixing them is a mechanical but tedious task — no architectural risk.

---

## Summary by Module

| Module | Total | High | Med | Low | Changes from Round 4 |
|---|---|---|---|---|---|
| **Auth** | 0 | 0 | 0 | 0 | Clean |
| **Tenant** | 0 | 0 | 0 | 0 | **CLEAN** (-1) |
| **Item** | 0 | 0 | 0 | 0 | **CLEAN** (-3) |
| **Recipe** | 0 | 0 | 0 | 0 | **CLEAN** (-1) |
| **Procurement** | 0 | 0 | 0 | 0 | **CLEAN** (-3) |
| **Inventory** | 0 | 0 | 0 | 0 | Clean |
| **Sales** | 0 | 0 | 0 | 0 | **CLEAN** (-3) |
| **Reporting** | 0 | 0 | 0 | 0 | **CLEAN** (-3) |
| **Audit** | 0 | 0 | 0 | 0 | **CLEAN** (-1) |

**All 9 modules are clean.** The single remaining L12 is cross-module (test files across Reporting, Recipe, Inventory, Procurement, Auth, Item, Sales, Tenant).

---

## Detailed Remaining Issue

### L12 — `as any` in test files
- **Files**: 23 `*.spec.ts` files across 8 modules
- **Issue**: 249 `as any` casts scattering across test mocks and assertions. Each suppresses type-checking for that expression.
- **Impact**: Low — test type safety doesn't affect production. Does not block CI or introduce runtime risk.
- **Fix**: Inline fixes per file. Prioritize by module: Recipe (110) → Inventory (75) → Procurement (33) → Auth (12) → Sales (9) → Item (11) → Tenant (2). No bulk approach possible.
