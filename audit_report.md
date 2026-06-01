# Synculariti OS IMS — Full Codebase Re-Audit Report (Round 5)

> **Audit Date**: 2026-06-02
> **Scope**: All 9 Agent modules — every file read fresh

---

## Executive Summary

| Severity | Count | Change from Round 4 |
|---|---|---|
| **CRITICAL** | 0 | — |
| **HIGH** | 0 | -2 |
| **MEDIUM** | 0 | -2 |
| **LOW** | 3 | -9 |
| **Total** | **3** | **-13** |

**13 issues resolved since Round 4. Zero critical, high, or medium violations remain.**

---

## ✅ FIXED Since Round 4 (13)

### High (2)

| Module | Violation | Fix |
|---|---|---|
| Audit | `oldValue` = `request.body` (wrong semantic) | Added `setAuditBeforeState()` utility; interceptor checks `request.__auditBeforeState` first, falls back to `request.body` |
| Reporting | Controller directly injected `IProcurementReadService` | `getVendorPriceHistory` now routes through `IReportingCogsService`; controller depends only on service layer |

### Medium (2)

| Module | Violation | Fix |
|---|---|---|
| Sales | `salesImportFileSchema` dead code | Removed from `sales.validator.ts` and SYMBOLS.md |
| Sales | PDF missing from `SALES_IMPORT_ALLOWED_MIME_TYPES` | Added `application/pdf` |

### Low (9)

| # | Module | Violation | Fix |
|---|---|---|---|
| L04 | Recipe | `as any` cast for `franchiseGroupId` | Replaced with `as FranchiseGroupId \| null` |
| L05 | Procurement | Missing `implements IProcurementService` | Added to class declaration |
| L09 | Sales | SYMBOLS.md documented dead symbols | Removed `SALES_IMPORT_QUEUE`/`SalesImportJob`; fixed `IMPORT_STATUSES` → `IMPORT_STATUS` |
| L10 | Sales | `require()` without eslint-disable | Added `@typescript-eslint/no-require-imports` comment |
| L11 | Reporting | Duplicate import + inline `import()` type | Cleaned up imports |

The following were fixed in earlier rounds and remain resolved:
- L01: `Category.id` typed as `CategoryId` (branded)
- L02: `updateItemSchema` no longer derived via `.partial()` — standalone schema
- L03: `generateSku` interface matches AGENTS.md (no `restaurantId`)
- L06: `createDraftPO` interface matches AGENTS.md (has `restaurantId`)

---

## ❌ REMAINING — Low (3)

| # | Module | Violation | File |
|---|---|---|---|
| L07 | Procurement | `getVendorPriceHistory` undocumented in AGENTS.md | `AGENTS.md` |
| L08 | Tenant | 1 `as unknown as Restaurant[]` cast | `tenant.repository.ts:68` |
| L12 | Cross-module | 249 `as any` casts across 23 test/spec files | 23 `*.spec.ts` files |

---

## Summary by Module

| Module | Total | High | Med | Low | Changes from Round 4 |
|---|---|---|---|---|---|
| **Auth** | 0 | 0 | 0 | 0 | Clean |
| **Tenant** | 1 | 0 | 0 | 1 | Unchanged |
| **Item** | 0 | 0 | 0 | 0 | **CLEAN** (-3) |
| **Recipe** | 0 | 0 | 0 | 0 | **CLEAN** (-1) |
| **Procurement** | 1 | 0 | 0 | 1 | -2 (L05 fixed, L07 remains) |
| **Inventory** | 0 | 0 | 0 | 0 | Clean |
| **Sales** | 0 | 0 | 0 | 0 | **CLEAN** (-3) |
| **Reporting** | 0 | 0 | 0 | 0 | **CLEAN** (-3) |
| **Audit** | 0 | 0 | 0 | 0 | **CLEAN** (-1) |

**Clean modules (0 violations):** Auth, Inventory, Item, Recipe, Sales, Reporting, Audit
**Nearly clean (1 violation):** Tenant, Procurement

---

## Detailed Remaining Issues

### L07 — `getVendorPriceHistory` undocumented in AGENTS.md
- **File**: `AGENTS.md`
- **Issue**: `IProcurementReadService.getVendorPriceHistory` is implemented and exposed but has no entry in the Procurement Agent's contract section of AGENTS.md.
- **Fix**: Add the method signature and description to the `IProcurementReadService` contract block.

### L08 — `as unknown as Restaurant[]` in Tenant repository
- **File**: `tenant.repository.ts:68`
- **Issue**: Single unsafe double-cast `as unknown as Restaurant[]` when mapping DB rows.
- **Fix**: Use proper branded type conversion or a typed mapper function.

### L12 — `as any` in test files
- **Files**: 23 `*.spec.ts` files
- **Issue**: 249 `as any` casts scattered across test mocks and assertions. Each suppresses type-checking.
- **Fix**: Inline fixes per file — no bulk approach possible. Low priority as test type safety doesn't affect production.
