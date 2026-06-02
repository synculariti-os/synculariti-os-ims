# Synculariti OS IMS — Full Codebase Re-Audit Report (Round 5)

> **Audit Date**: 2026-06-02
> **Scope**: All 9 Agent modules — code quality, frontend-backend gap analysis, navigation coverage, and functional completeness.

---

## Executive Summary

### Code Quality

| Severity | Count | Change from Round 4 |
|---|---|---|
| **CRITICAL** | 0 | — |
| **HIGH** | 0 | -2 |
| **MEDIUM** | 0 | -2 |
| **LOW** | 0 | -12 |
| **Total** | **0** | **-16** |

**Zero code-quality violations remain.** All 16 issues from Round 4 resolved. Expanded scans also clean: zero `as any` in source or tests, zero string DI tokens, zero cross-module repository imports, 30/30 spec files have `@immutable-test`.

### Frontend-Backend Gap Analysis (New)

| Category | Count |
|---|---|
| **Bugs** (broken functionality) | 2 |
| **Missing Features** (backend has API, no frontend) | 7 |
| **Missing Navigation** (page exists but no link) | 2 |
| **Non-functional UI** (button/action does nothing) | 1 |

---

## Code Quality — All ✅ FIXED (16)

### High (2)

| Module | Violation | Fix |
|---|---|---|
| Audit | `oldValue` = `request.body` (wrong semantic) | Added `setAuditBeforeState()` utility; renamed to `requestPayload`/`responsePayload` |
| Reporting | Controller directly injected `IProcurementReadService` | `getVendorPriceHistory` routes through `IReportingCogsService` |

### Medium (2)

| Module | Violation | Fix |
|---|---|---|
| Sales | `salesImportFileSchema` dead code | Removed |
| Sales | PDF missing from MIME types | Added `application/pdf` |

### Low (12)

All L01–L12 resolved. See prior audit reports for details.

---

## 🐛 Bugs — Broken Functionality (2)

### B1 — Sales: BatchesTable uses wrong default port

**File**: `apps/web/src/components/sales/batches-table.tsx:31`
```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/sales-imports?limit=20`, ...)
```

**Issue**: Default port is `3000` (Next.js dev server) instead of `3001` (NestJS API). When `NEXT_PUBLIC_API_URL` env var isn't set, the batch listing silently fails. The rest of the codebase uses `api-client.ts` which defaults to `3001`.

**Fix**: Change default to `http://localhost:3001`.

### B2 — Sales: Unmapped rows calls wrong endpoint

**File**: `apps/web/src/components/sales/unmapped-items-panel.tsx:33`
```ts
apiClient(`/recipes/unmapped-rows?batchId=${batchId}`)
```

**Issue**: Frontend calls `GET /recipes/unmapped-rows` but the backend defines this at `GET /sales-imports/unmapped-rows` (SalesController, `@Controller('sales-imports')`, `@Get('unmapped-rows')`). Results in a **404** error — the SmartMappingReview panel is completely broken.

**Fix**: Change endpoint to `/sales-imports/unmapped-rows`.

---

## 📭 Missing Features — Backend API Exists, No Frontend UI (7)

| # | Module | Backend API | What's Missing |
|---|---|---|---|
| **F1** | Auth | `GET /auth/me`, `PATCH /auth/profile` | **No Profile page** — users can't view or edit their name, phone number, or email |
| **F2** | Tenant | All CRUD: `POST/PUT/DELETE /franchise-groups/:id`, `POST/PUT/DELETE /restaurants/:id` | **No Admin/Tenant pages** — franchise groups and restaurants can only be managed via direct API calls |
| **F3** | Item Master | `PATCH /items/:id/overrides` | **No Override UI** — per-restaurant par levels and active flags can't be set from the UI |
| **F4** | Item Master | `POST /items/uom-conversions` | **No UOM Conversion UI** — unit-of-measure conversion ratios can't be managed |
| **F5** | Procurement | `GET /procurement/orders/vendors` (list only) | **No Vendor Management page** — vendors are used in PO creation but can't be created, edited, or deleted from the UI |
| **F6** | Reporting | `GET /reports/snapshots` | **No Snapshots page** — EOD inventory snapshots exist in the DB but have no report UI |
| **F7** | Procurement | `PATCH /procurement/orders/:id/submit`, `PATCH /procurement/orders/:id/cancel` | **No Submit/Cancel PO in UI** — DRAFT orders can't transition to SUBMITTED or CANCELLED from the Orders page |

---

## 🧭 Missing Navigation — Page Exists But No Link (2)

| # | Page | Issue |
|---|---|---|
| **N1** | `/inventory/transfers` | Inventory dashboard (`/inventory`) has links to Counts, Waste, and Prep, but **no link to Transfers** |
| **N2** | `/reports/vendor-pricing` | Reports dashboard (`/reports`) has links to Variance, Par Alerts, and COGS, but **no link to Vendor Pricing** |

---

## 🔘 Non-functional UI (1)

| # | Page | Issue |
|---|---|---|
| **U1** | `/procurement/orders` | **"New Draft PO" button has no onClick handler** (`orders-table.tsx:73`) — the button renders but does nothing. No dialog or form opens. The only way to create a PO is via the QuickCreatePO dialog from item par alerts. |

---

## Minor Issues

| # | Detail |
|---|---|
| M1 | `counts/[id]/page.tsx` fetches `GET /items?limit=1000` on every count page load to resolve item names. Consider caching or using a dedicated endpoint. |
| M2 | Sales import page uses raw `fetch()` instead of `api-client.ts` for file upload (intentional for FormData, but inconsistent pattern). |
| M3 | Receive PO dialog sends empty `lineItems: []` — acknowledged limitation in comments. |

---

## Summary by Module

| Module | Code Quality | Frontend Coverage | Notes |
|---|---|---|---|
| **Auth** | ✅ Clean | ⚠️ Missing profile page | 3/3 APIs covered except profile |
| **Tenant** | ✅ Clean | ❌ Missing entirely | No admin UI for org management |
| **Item Master** | ✅ Clean | ⚠️ Missing overrides + UOM UI | 9/12 APIs covered |
| **Procurement** | ✅ Clean | ⚠️ Missing vendor mgmt, submit/cancel | 3/6 APIs callable from UI |
| **Recipe/BOM** | ✅ Clean | ✅ Full coverage | All 9 APIs used |
| **Inventory** | ✅ Clean | ✅ Full coverage | All 17 APIs used |
| **Sales** | ✅ Clean | ⚠️ 2 bugs | Unmapped-rows broken + port bug |
| **Reporting** | ✅ Clean | ⚠️ Missing snapshots page | 4/5 APIs covered |
| **Audit** | ✅ Clean | N/A | Admin-only, no UI needed |
