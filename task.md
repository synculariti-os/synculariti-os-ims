# Task Tracker — Synculariti OS IMS

## Current Phase: Phase 2B — Backend Remediation & Gap Closure

> Note: Recursive BOM expansion, prep/waste/count/procurement UIs are **already implemented**.

---

### Sprint 1: Critical Bug Fixes (Detailed)

| # | Task | Files | Status | Priority |
|---|---|---|---|---|
| 1.1 | **Remove mock `LEDGER_SERVICE_TOKEN` from `CoreModule`** — delete mock provider + unused imports + export | `core.module.ts` | [x] DONE | 🔴 CRITICAL |
| 1.2 | **Fix Recipe controller auth** — remove `@Public()`, remove mock fallback IDs, use direct `user.restaurantId` | `recipe.controller.ts` | [x] DONE | 🔴 CRITICAL |
| 1.3 | **Add `PATCH /auth/profile`** — new route + `ZodValidationPipe(updateProfileSchema)` + delegate to service | `auth.controller.ts` | [x] DONE | 🟠 HIGH |
| 1.4 | **Create initial DB migration** — full 26-table schema + `set_tenant_context` + ledger triggers + mat view | `supabase/migrations/20260531230000_initial_schema.sql` | [x] DONE | 🟠 HIGH |
| 1.5 | **Implement `StockQueryService`** — new class delegating to `LedgerService`, register under `STOCK_QUERY_SERVICE_TOKEN` in module | `inventory/stock-query.service.ts`, `inventory.module.ts` | [x] DONE | 🟠 HIGH |

**Verify**: `pnpm type-check && pnpm test && pnpm lint`

### Sprint 2: Reporting Module

| # | Task | Status | Priority |
|---|---|---|---|
| 2.1 | Create service: variance queries, par alerts, EOD snapshots | [x] DONE | 🟠 HIGH |
| 2.2 | Create controller: `GET /reports/variance`, `/snapshots`, `/par-alerts` | [x] DONE | 🟠 HIGH |
| 2.3 | Create repository: Kysely queries to mat views + items | [x] DONE | 🟠 HIGH |
| 2.4 | Create EOD cron job (`@nestjs/schedule`) | [x] DONE | 🟠 HIGH |
| 2.5 | Write unit tests | [x] DONE | 🟠 HIGH |

### Sprint 3: Missing CRUD

| # | Task | Status | Priority |
|---|---|---|---|
| 3.1 | Add vendor CRUD to Procurement | [/] IN PROGRESS | 🟡 MED |
| 3.2 | Add inventory transfers | [/] IN PROGRESS | 🟡 MED |
| 3.3 | Add `updateVendorSchema` to validators | [/] IN PROGRESS | 🟡 MED |

### Sprint 4: Prep Items as Countable Inventory + Two-Phase Depletion

| # | Task | Status | Priority |
|---|---|---|---|
| 4.1 | Verify `producesItemId` flow — PREP type promotion for countable prep items | PENDING | 🔴 CRITICAL |
| 4.2 | Fix `expandBOM` — add `mode` param: `'deplete'` vs `'expand'` to prevent double-depletion | PENDING | 🔴 CRITICAL |
| 4.3 | Wire `yield_percent` into `expandBOM` scale factor | PENDING | 🟠 HIGH |
| 4.4 | Update sub-recipe BOM tests for two-phase + yield_percent | PENDING | 🟠 HIGH |

### Sprint 5: DIP & Architecture

| # | Task | Status | Priority |
|---|---|---|---|
| 5.1 | Create `ISalesFileParser` interface + XLSX/CSV impls | PENDING | 🟡 MED |
| 5.2 | Refactor processor to use injected parser | PENDING | 🟡 MED |
| 5.3 | Configurable column mappings | PENDING | 🟢 LOW |
| 5.4 | Implement `@Transactional()` as real interceptor | PENDING | 🟡 MED |

### Sprint 6: Workflow & Operational Fixes

| # | Task | Status | Priority |
|---|---|---|---|
| 6.1 | Consolidate dual WORKFLOW.md files | PENDING | 🟡 MED |
| 6.2 | Fix frontmatter in `.agents/workflows/workflow.md` | PENDING | 🟢 LOW |
| 6.3 | Add global `ZodValidationPipe` in `main.ts` | PENDING | 🟡 MED |
| 6.4 | Run `pnpm type-check` + `pnpm test` | PENDING | 🟠 HIGH |

---

## Completed
- Audit fixed 23 violations across 6 phases (resolved)
- `pnpm type-check`: ✅ Passes (0 errors)
- `pnpm test`: ✅ 54/54 tests pass
