# Implementation Plan — Synculariti OS IMS

> **Audit Date**: 2026-05-31
> **References**: AGENTS.md, SYMBOLS.md, RULES.md, WORKFLOW.md, `pepperoni_pizza_ims_analysis.md`
> **Status**: Phase 2B — Backend Remediation & Conceptual Gap Closure

---

## Part 0: Reconciling `pepperoni_pizza_ims_analysis.md` With Current Code

The analysis document describes a from-scratch pizzeria scenario (Napoli Verace) and identifies critical gaps. After auditing the actual codebase, **several gaps the document flagged as missing are already implemented**:

| Document Claim | Actual Code | Verdict |
|---|---|---|
| ❌ BOM expansion NOT recursive | ✅ `recipe.service.ts:82` — recurses into `subRecipeId` with circular guard | Doc outdated |
| ❌ Prep Production Logging — API ❌ UI ❌ | ✅ `prep.controller.ts` + `prep/page.tsx` | Doc outdated |
| ❌ Waste Logging — API ❌ UI ❌ | ✅ `waste.controller.ts` + `waste/page.tsx` | Doc outdated |
| ❌ Physical Count UI — UI ❌ | ✅ `inventory-count.controller.ts` + `counts/page.tsx` | Doc outdated |
| ❌ Procurement UI — UI ❌ | ✅ `procurement/orders/page.tsx` | Doc outdated |

**However**, the document's deeper conceptual analysis reveals **genuine architectural gaps** that remain unfixed:

### Still-Open Conceptual Gaps From the Document

| # | Gap | Document Context | Severity |
|---|---|---|---|
| G1 | **Prep items as countable inventory** | Virtual recipes (no `producesItemId`) can't be counted in inventory. Chef can't record "18 dough balls in the walk-in." | 🔴 Critical |
| G2 | **Two-phase depletion problem** | Prep phase depletes raw ingredients (correct). Service phase calls `expandBOM` which recurses into sub-recipes and depletes raw ingredients AGAIN — double-depletion if prep items are countable. Requires `expandBOM` to distinguish: "deplete prep item" vs "recurse into raw." | 🔴 Critical |
| G3 | **Cooking yield / loss % unused** | `yield_percent` column exists (migration `20260531223240`) but `expandBOM()` at `recipe.service.ts:70` doesn't divide by it. Only `yieldQuantity` is used as a scale factor. | 🟠 High |
| G4 | **Par level alerts** | `item_restaurant_overrides.par_level` stored in DB but no alert endpoint or dashboard | 🟠 High |
| G5 | **COGS per menu item** | `inventory_batches.landed_unit_cost` exists but no costing calculation or endpoint | 🟠 High |
| G6 | **Variance analytics** | `mat_view_variance_analytics` exists but no endpoint to query it | 🟠 High |
| G7 | **Vendor price history** | No historical vendor pricing, only current PO line-item unit price | 🟡 Medium |

---

## Part 1: Violations Found — workflow.md vs AGENTS.md / SYMBOLS.md / RULES.md

### Critical
| # | Violation | Details |
|---|---|---|
| V1 | **Missing `implementation_plan.md`** | WORKFLOW files reference updating this file after each phase. Now created. |
| V2 | **Dual WORKFLOW.md files** | `.agents/workflows/workflow.md` vs root `WORKFLOW.md` — duplicate, will drift. `.agents/workflows/workflow.md` has broken YAML frontmatter. |
| V3 | **Phase 2 module order violates deps** | Procurement (#4) listed before Inventory (#6). Procurement depends on `LedgerService` from Inventory per AGENTS.md cross-agent deps. |
| V4 | **Mock LedgerService overrides real one** | `CoreModule` (global) registers `mockLedgerService` (`console.log`), taking DI precedence over real `LedgerService` in `InventoryModule`. Violates RULES.md R-ARCH-03. |
| V5 | **Recipe controller `@Public()` bypasses auth** | `recipe.controller.ts:41` has class-level `@Public()`, making all `@RequirePermission()` decorators on individual methods dead code. Violates RULES.md R-SEC-01 and R-SEC-02. |
| V6 | **Missing database migrations** | Only 1 migration exists. Full 26-table schema + `set_tenant_context` function not tracked. Violates RULES.md R-CI-03. |

### High
| # | Violation | Details |
|---|---|---|
| V7 | **Reporting module entirely missing** | AGENTS.md specifies 3 endpoints + EOD cron. No controller, service, repository, or cron exists. |
| V8 | **`IStockQueryService` defined but not implemented** | AGENTS.md defines separate read interface for ISP. No concrete class registers it. |
| V9 | **No `ISalesFileParser` interface** | AGENTS.md says DIP with `ISalesFileParser`. Parser logic hard-coded in processor with Slovak column names. |
| V10 | **WORKFLOW Step 2 type path mismatch** | Says `packages/types/src/domain/` but SYMBOLS.md shows types at `packages/types/src/`. |
| V11 | **Server-context fields rule not in workflow** | RULES.md R-ARCH-05 Corollary says `restaurantId`/`franchiseGroupId` must NOT be in shared Zod schemas. Step 2 doesn't mention this. |
| V12 | **`@Transactional()` decorator is metadata-only** | Decorator exists (SYMBOLS.md) but is not implemented as a real AOP interceptor. No proxying logic. |

### Medium
| # | Violation | Details |
|---|---|---|
| V13 | **No vendor CRUD in Procurement** | AGENTS.md says "CRUD for vendors" — no endpoints exist. |
| V14 | **No inventory transfers** | AGENTS.md says `POST /inventory/transfers` — no implementation exists. |
| V15 | **`PATCH /auth/profile` missing** | AGENTS.md expects this endpoint. Service method exists, controller route missing. |
| V16 | **No global validation pipe** | RULES.md R-TS-05 mentions `.parse()` at API boundaries but nothing registered globally in `main.ts`. |
| V17 | **BullMQ worker context not in workflow** | RULES.md R-DB-02 requires `tenantContext.run()` in workers. WORKFLOW Step 6 doesn't mention this. |

---

## Part 2: Corrected Module Implementation Order

Per AGENTS.md Cross-Agent Dependency Rules:

```
Auth ─────► (no deps)
Tenant ───► (no deps)
Item ─────► Tenant
Recipe ───► Item
Inventory ► Item, Tenant
Procurement ► Item, Inventory   ← depends on Inventory
Sales ─────► Recipe, Inventory
Reporting ► Item (read), Inventory (read)
Audit ─────► (interceptor-based, no outbound deps)
```

**Corrected build order:**
```
 1. Auth          (Round 1 — no deps)
 2. Tenant        (Round 1 — no deps)
 3. Item          (Round 1 — depends on Tenant)
 4. Recipe        (Round 1 — depends on Item)
 5. Inventory     (Round 2 — depends on Item + Tenant)
 6. Procurement   (Round 2 — depends on Item + Inventory)
 7. Sales         (Round 3 — depends on Recipe + Inventory)
 8. Reporting     (Round 4 — read-only deps)
 9. Audit         (Round 5 — interceptor-based)
```

---

## Part 3: Current State Summary

### ✅ Fully Implemented
| Module | Services | Controller | Repository | Tests |
|---|---|---|---|---|
| Auth | ✅ (missing `PATCH /auth/profile` route) | ✅ | ✅ | ✅ |
| Tenant | ✅ (missing CRUD endpoints) | ✅ | ✅ | ✅ |
| Item | ✅ | ✅ | ✅ | ✅ |
| Procurement | ✅ (missing vendor CRUD) | ✅ | ✅ | ✅ |
| Recipe | ✅ (but `@Public()` bug; missing `yield_percent` usage) | ✅ | ✅ | ✅ |
| Inventory | ✅ (missing transfers; missing `IStockQueryService`) | ✅ | ✅ | ✅ |
| Sales | ✅ (Slovak column names hard-coded; no parser interface) | ✅ | ✅ | ✅ |
| Audit | ✅ (no controller needed) | N/A | N/A | ✅ |

### ❌ Not Implemented
| Module | Missing |
|---|---|
| Reporting | Entirely missing — no controller, service, repository, cron |

### 🟠 Conceptual Gaps (From Pizza Analysis)
| Gap | What's Needed |
|---|---|
| Prep items as countable inventory | Virtual recipes need `producesItemId` to become PREP items visible in stock/counts |
| Two-phase depletion fix | `expandBOM` must distinguish "deplete prep item" vs "recurse into raw" based on whether ingredient's recipe has `producesItemId` |
| Cooking yield/loss | Wire `yield_percent` from DB into `expandBOM` scale factor |
| Par level alerts | New endpoint or cron to compare `currentStock` vs `parLevel` |
| COGS per menu item | Cost roll-up from `inventory_batches.landed_unit_cost` through BOM |
| Variance analytics | Query endpoint for `mat_view_variance_analytics` |

---

## Part 4: Phase 2B — Backend Remediation & Gap Closure

### Sprint 1: Critical Bug Fixes (est. 2 days)

| # | Task | Files | Priority |
|---|---|---|---|
| 1.1 | **Remove mock `LEDGER_SERVICE_TOKEN` from `CoreModule`** — ensures real `LedgerService` resolves via DI from `InventoryModule` | `core.module.ts` | 🔴 CRITICAL |
| 1.2 | **Fix Recipe controller auth** — remove class-level `@Public()`, keep per-method guards | `recipe.controller.ts` | 🔴 CRITICAL |
| 1.3 | Add `PATCH /auth/profile` route in Auth controller | `auth.controller.ts` | 🟠 HIGH |
| 1.4 | Create initial migration with full schema + `set_tenant_context` function | `supabase/migrations/` | 🟠 HIGH |
| 1.5 | Implement `IStockQueryService` concrete class, register in `inventory.module.ts` | `inventory/stock-query.service.ts`, `inventory.module.ts` | 🟠 HIGH |

### Sprint 2: Reporting Module (est. 3-4 days)

| # | Task | Files | Priority |
|---|---|---|---|
| 2.1 | Create `IReportingService` + `reporting.service.ts` — variance queries, par alerts, EOD snapshots | `reporting/` | 🟠 HIGH |
| 2.2 | Create `reporting.controller.ts` — `GET /reports/variance`, `GET /reports/snapshots`, `GET /reports/par-alerts` | `reporting/` | 🟠 HIGH |
| 2.3 | Create `reporting.repository.ts` — queries to `mat_view_variance_analytics`, `daily_inventory_snapshots`, items+overrides | `reporting/` | 🟠 HIGH |
| 2.4 | Create EOD cron (`@nestjs/schedule`) to snapshot stock into `daily_inventory_snapshots` | `reporting/` | 🟠 HIGH |
| 2.5 | Write unit tests | `reporting/__tests__/` | 🟠 HIGH |

### Sprint 3: Missing CRUD (est. 2-3 days)

| # | Task | Files | Priority |
|---|---|---|---|
| 3.1 | Add vendor CRUD: `vendor.service.ts`, `vendor.repository.ts`, extend controller | `procurement/` | 🟡 MED |
| 3.2 | Add inventory transfers: `transfer.service.ts`, `transfer.repository.ts`, `transfer.controller.ts` | `inventory/` | 🟡 MED |
| 3.3 | Add `updateVendorSchema` to `@ims/validators` | `packages/validators/` | 🟡 MED |

### Sprint 4: Prep Items as Countable Inventory + Two-Phase Depletion (est. 3-4 days)

| # | Task | Files | Priority |
|---|---|---|---|
| 4.1 | **Add `producesItemId` support to recipe creation flow** — when `producesItemId` is set, auto-create/convert the item to `type: PREP` in Item Master (most of this exists in `recipe.service.ts` already — verify completeness for prep counting) | `recipe/`, `item/` | 🔴 CRITICAL |
| 4.2 | **Fix `expandBOM` for countable prep items** — when a sub-recipe ingredient has a `producesItemId`, deplete that PREP item instead of recursing into raw ingredients. Add a `mode` parameter: `'deplete'` (service phase, deplete prep items) vs `'expand'` (prep phase, expand into raw) | `recipe/recipe.service.ts` | 🔴 CRITICAL |
| 4.3 | Wire `yield_percent` into `expandBOM` scale factor — divide `quantityRequired` by `yield_percent` (e.g., 80% yield means 100g input → 80g output, so to get 80g you need 100g raw) | `recipe/recipe.service.ts:70` | 🟠 HIGH |
| 4.4 | Update tests: sub-recipe BOM tests with countable prep items, yield_percent scaling, two-phase depletion | `recipe/__tests__/` | 🟠 HIGH |

### Sprint 5: DIP & Architecture Compliance (est. 2-3 days)

| # | Task | Files | Priority |
|---|---|---|---|
| 5.1 | Create `ISalesFileParser` interface with XLSX + CSV implementations | `sales/parsers/` | 🟡 MED |
| 5.2 | Refactor `sales.processor.ts` to use injected `ISalesFileParser` | `sales/sales.processor.ts` | 🟡 MED |
| 5.3 | Make column mappings configurable (env var or per-restaurant) | `sales/parsers/` | 🟢 LOW |
| 5.4 | Implement `@Transactional()` as a real NestJS interceptor with Kysely transaction management | `common/` | 🟡 MED |

### Sprint 6: Workflow & Operational Fixes (est. 1-2 days)

| # | Task | Files | Priority |
|---|---|---|---|
| 6.1 | Consolidate dual WORKFLOW.md files — keep root `WORKFLOW.md` as source of truth | `WORKFLOW.md`, `.agents/workflows/workflow.md` | 🟡 MED |
| 6.2 | Fix frontmatter syntax in `.agents/workflows/workflow.md` | `.agents/workflows/workflow.md` | 🟢 LOW |
| 6.3 | Add global `ZodValidationPipe` in `main.ts` | `main.ts` | 🟡 MED |
| 6.4 | Run full `pnpm type-check` + `pnpm test` | N/A | 🟠 HIGH |

---

## Part 5: Phase 3 — Frontend Completion

> **Starts after Phase 2B (all 9 API modules working, all violations resolved)**

| # | Task | Notes |
|---|---|---|
| 3.1 | Build reporting pages (`/reports/variance`, `/reports/snapshots`, `/reports/par-alerts`) | Depends on Sprint 2 |
| 3.2 | Add vendor management page (`/procurement/vendors`) | Depends on Sprint 3 |
| 3.3 | Add inventory transfers page (`/inventory/transfers`) | Depends on Sprint 3 |
| 3.4 | Add prep item counting in inventory counts UI | Depends on Sprint 4 |
| 3.5 | Fix `batches-table.tsx` type imports — migrate from local types to `@ims/types` | Known tech debt |
| 3.6 | Implement `(dashboard)` route group layout | Empty route group exists |
| 3.7 | Par level alert badge/notification in navbar | Depends on Sprint 2 |

---

## Part 6: Phase 4 — CI/CD & Deployment

| # | Task | Notes |
|---|---|---|
| 4.1 | Set up GitHub Actions — immutable test enforcement | Per WORKFLOW TDD rules |
| 4.2 | GitHub Actions — lint + type-check + test + coverage | Per R-CI-01 |
| 4.3 | Deploy API to Railway / Koyeb | `koyeb.yaml` exists |
| 4.4 | Deploy frontend to Vercel | Requires Vercel project setup |
| 4.5 | Supabase migration CI — auto-generate `database.types.ts` | Per R-CI-04 |
| 4.6 | ESLint custom rule `no-direct-ledger-insert` | Per R-ARCH-03 |

---

## Immediate Next Steps (Execution Order)

```
Day 1-2:  Sprint 1 — Fix mock LedgerService, fix @Public(), add auth/profile route, DB migration, IStockQueryService
Day 3-6:  Sprint 2 — Build Reporting module (largest missing piece)
Day 7-9:  Sprint 3 — Vendor CRUD + inventory transfers
Day 10-13: Sprint 4 — Prep items as countable inventory + two-phase depletion + yield_percent
Day 14-15: Sprint 5 — Sales parser DIP + @Transactional() interceptor
Day 16:    Sprint 6 — Workflow consolidation, global pipe, lint+test
```

---

## Sprint 1 — Detailed Execution Plan: Critical Bug Fixes

### Task 1.1: Remove Mock `LEDGER_SERVICE_TOKEN` from `CoreModule`

**Problem**: `CoreModule` (marked `@Global()`) registers a mock `LEDGER_SERVICE_TOKEN` at `core.module.ts:57-59` that only does `console.log`. Because it's a global module, this mock takes DI precedence over the real `LedgerService` registered in `InventoryModule`. Every service that injects `LEDGER_SERVICE_TOKEN` gets a no-op mock.

**Solution**: Remove the mock provider from `CoreModule`. The real `LedgerService` in `InventoryModule` (registered via `LEDGER_SERVICE_TOKEN` → `useClass: LedgerService` at `inventory.module.ts:27-29`) will resolve correctly as long as the consuming module imports `InventoryModule`.

**Files to modify**:
| File | Change |
|---|---|
| `apps/api/src/core/core.module.ts` | Remove lines 57-59 (`{ provide: LEDGER_SERVICE_TOKEN, useValue: mockLedgerService }`) and remove lines 11-15 (`const mockLedgerService = {...}`). Remove the import of `LEDGER_SERVICE_TOKEN` from `i-ledger.service` (line 5). Remove `LEDGER_SERVICE_TOKEN` from `exports` array (line 78). |
| `apps/api/src/core/core.module.ts` | Remove unused `import { LEDGER_SERVICE_TOKEN } from '../inventory/interfaces/i-ledger.service'` |

**Verification**:
1. `pnpm type-check` passes
2. `pnpm test` passes (all existing tests use mocked ledger service — should still pass)
3. All modules that consume `LEDGER_SERVICE_TOKEN` must import `InventoryModule` in their module definition

**Import chain check** — verify these modules import `InventoryModule`:
- `ProcurementModule` — already imports `InventoryModule` and `ItemModule` ✅
- `SalesModule` — imports `RecipeModule`, need to check if it imports `InventoryModule`
- `InventoryModule` itself — registers `LedgerService` ✅
- `RecipeModule` — doesn't need `LEDGER_SERVICE_TOKEN` directly ✅

Let me verify the SalesModule import:

```
apps/api/src/sales/sales.module.ts
→ check if InventoryModule is imported
```

---

### Task 1.2: Fix Recipe Controller `@Public()` Auth Bypass

**Problem**: `recipe.controller.ts:41` has `@Public()` at class level. When `SupabaseAuthGuard` sees this decorator, it returns `true` immediately — skipping ALL auth including the `@RequirePermission()` decorators on individual methods. The controller has a `resolveUser()` helper that defaults to **mock IDs** (`MOCK_RESTAURANT_ID`, `MOCK_FRANCHISE_GROUP_ID`) when the JWT payload is undefined.

**Solution**: Remove class-level `@Public()`. Add `@UseGuards(SupabaseAuthGuard, PermissionsGuard)` at class level. Keep existing per-method `@RequirePermission()` decorators. Remove mock fallback logic from `resolveUser()` — if `user` is undefined, let it crash naturally (which means auth guard was bypassed).

**Files to modify**:
| File | Change |
|---|---|
| `apps/api/src/recipe/recipe.controller.ts` | Remove `@Public()` on line 41. Add `@UseGuards(SupabaseAuthGuard, PermissionsGuard)` at class level. Remove lines 30-38 (`MOCK_RESTAURANT_ID`, `MOCK_FRANCHISE_GROUP_ID`, `resolveUser()`). Replace calls to `resolveUser(user)` with direct `user.restaurantId` and `user.franchiseGroupId`. |
| `apps/api/src/recipe/recipe.controller.ts` | Add imports: `UseGuards` from `@nestjs/common`, `SupabaseAuthGuard` from `../common/guards/supabase-auth.guard`, `PermissionsGuard` from `../common/guards/permissions.guard`. Remove `Public` import. |
| `apps/api/src/recipe/recipe.module.ts` | Verify `SupabaseAuthGuard` and `PermissionsGuard` are accessible (they are global via `APP_GUARD`, so explicit `@UseGuards` is redundant — but makes intent clear). Actually — since they're already registered globally in `AppModule`, we just need to remove `@Public()` and the auth guards will kick in automatically. |

**Refined approach**: Since `SupabaseAuthGuard` and `PermissionsGuard` are already registered as global guards in `AppModule`, simply removing `@Public()` from the controller is sufficient. The global guards will protect all routes automatically.

**Simplified changes**:
| File | Change |
|---|---|
| `apps/api/src/recipe/recipe.controller.ts` | Remove `@Public()` on line 41. Remove `Public` import (line 28). Remove mock fallback lines 30-38. Replace `resolveUser(user)` calls with direct access. |

**Verification**:
1. `pnpm test` passes — recipe tests mock `JwtPayload` directly, so they should still work
2. Recipe endpoints now require valid JWT + matching permissions
3. Existing `GET /recipes` without Bearer token returns 401 instead of data

---

### Task 1.3: Add `PATCH /auth/profile` Endpoint

**Problem**: `AuthService.updateProfile()` exists (`auth.service.ts:102`) and is tested (`auth.service.spec.ts:225`), but there's no HTTP route in `AuthController` that calls it. The frontend has no way to update profile fields.

**Solution**: Add a `PATCH /auth/profile` route to `AuthController`. Use `ZodValidationPipe` with `updateProfileSchema` from `@ims/validators`. Call `authService.updateProfile()` with the current user's ID and the validated DTO.

**Files to modify**:
| File | Change |
|---|---|
| `apps/api/src/auth/auth.controller.ts` | Add `PATCH('profile')` route. Inject `UpdateProfileDto` from `@ims/validators`. Use `@Body(new ZodValidationPipe(updateProfileSchema))`. Call `this.authService.updateProfile(user.sub, dto)`. |
| `apps/api/src/auth/auth.controller.ts` | Add imports: `Patch`, `Body` from `@nestjs/common`. Import `updateProfileSchema`, `UpdateProfileDto` from `@ims/validators`. Import `ZodValidationPipe` from `../common/pipes/zod-validation.pipe`. |

**Implementation**:
```typescript
// New method on AuthController
@Patch('profile')
async updateProfile(
  @CurrentUser() user: JwtPayload,
  @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
): Promise<SafeUser> {
  return this.authService.updateProfile(user.sub, dto);
}
```

**Verification**:
1. `pnpm test` passes
2. `curl -X PATCH http://localhost:3001/auth/profile -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"fullName": "New Name"}'` returns updated user
3. `PATCH /auth/profile` with invalid body (e.g., `{fullName: 123}`) returns 422

---

### Task 1.4: Create Initial Database Migration

**Problem**: Only 1 migration exists (`20260531223240_add_yield_percent_to_recipes.sql`). The entire 26-table schema, `set_tenant_context` function, and materialized views are not tracked. Violates RULES.md R-CI-03.

**Solution**: Create a comprehensive initial migration that bootstraps the full schema. This must be safe to run on an existing database (use `IF NOT EXISTS` / `CREATE OR REPLACE`).

**Files to create**:
| File | Content |
|---|---|
| `supabase/migrations/20260531230000_initial_schema.sql` | Full schema DDL: tables, functions, triggers, materialized view, RLS policies |

**Migration contents**:
```sql
-- Migration: 20260531230000_initial_schema
-- Full schema bootstrap for Synculariti OS IMS

-- 1. Session management function (used by TenantContextDriver)
CREATE OR REPLACE FUNCTION set_tenant_context(
  p_restaurant_id UUID,
  p_franchise_group_id UUID
) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_restaurant_id', p_restaurant_id::TEXT, TRUE);
  PERFORM set_config('app.current_franchise_group_id', p_franchise_group_id::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql;

-- 2. Core tables (Auth & Tenant)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone_number TEXT,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_restaurant_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, restaurant_id)
);

CREATE TABLE IF NOT EXISTS franchise_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  country_code TEXT NOT NULL DEFAULT 'US',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_group_id UUID NOT NULL REFERENCES franchise_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country_code TEXT NOT NULL DEFAULT 'US',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Item Master tables
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  franchise_group_id UUID REFERENCES franchise_groups(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT category_owner_xor CHECK (
    (franchise_group_id IS NOT NULL AND restaurant_id IS NULL)
    OR (franchise_group_id IS NULL AND restaurant_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'RAW' CHECK (type IN ('RAW', 'PREP')),
  inventory_uom TEXT NOT NULL,
  purchasing_uom TEXT NOT NULL,
  recipe_uom TEXT,
  inv_to_recipe_ratio NUMERIC(10,4) NOT NULL DEFAULT 1,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  franchise_group_id UUID REFERENCES franchise_groups(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uom_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  from_uom TEXT NOT NULL,
  to_uom TEXT NOT NULL,
  multiplier_factor NUMERIC(10,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (item_id, from_uom, to_uom)
);

CREATE TABLE IF NOT EXISTS item_restaurant_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  par_level NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (item_id, restaurant_id)
);

-- 4. Procurement tables
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  franchise_group_id UUID REFERENCES franchise_groups(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'RECEIVED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity_ordered NUMERIC(12,3) NOT NULL,
  quantity_received NUMERIC(12,3) NOT NULL DEFAULT 0,
  raw_unit_price NUMERIC(12,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Recipe / BOM tables
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  produces_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  recipe_name TEXT,
  yield_quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  yield_percent NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (yield_percent > 0 AND yield_percent <= 1),
  franchise_group_id UUID REFERENCES franchise_groups(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  sub_recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  quantity_required NUMERIC(12,3) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ingredient_xor CHECK (
    (ingredient_item_id IS NOT NULL AND sub_recipe_id IS NULL)
    OR (ingredient_item_id IS NULL AND sub_recipe_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS menu_item_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  raw_excel_string TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, raw_excel_string)
);

-- 6. Inventory Operations tables
CREATE TABLE IF NOT EXISTS inventory_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  change_amount NUMERIC(12,3) NOT NULL,
  reason_code TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- R-DB-01 enforcement: trigger prevents UPDATE/DELETE
CREATE OR REPLACE FUNCTION prevent_ledger_mutations()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'inventory_ledger is append-only. UPDATE and DELETE are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ledger_update ON inventory_ledger;
CREATE TRIGGER trg_prevent_ledger_update
  BEFORE UPDATE ON inventory_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutations();

DROP TRIGGER IF EXISTS trg_prevent_ledger_delete ON inventory_ledger;
CREATE TRIGGER trg_prevent_ledger_delete
  BEFORE DELETE ON inventory_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutations();

CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  initial_qty NUMERIC(12,3) NOT NULL,
  remaining_qty NUMERIC(12,3) NOT NULL,
  landed_unit_cost NUMERIC(12,4) NOT NULL,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  destination_restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  qty NUMERIC(12,3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_count_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SUBMITTED', 'CLOSED')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_count_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES inventory_count_batches(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  expected_qty NUMERIC(12,3) NOT NULL,
  actual_qty NUMERIC(12,3),
  variance_qty NUMERIC(12,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prep_production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  prep_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  yield_qty_produced NUMERIC(12,3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Sales Import tables
CREATE TABLE IF NOT EXISTS sales_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  business_date DATE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  error_message TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES sales_import_batches(id) ON DELETE CASCADE,
  raw_item_name TEXT NOT NULL,
  quantity_sold NUMERIC(12,3) NOT NULL,
  is_mapped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Reporting tables
CREATE TABLE IF NOT EXISTS daily_inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  business_date DATE NOT NULL,
  eod_qty NUMERIC(12,3) NOT NULL,
  fifo_total_value NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, item_id, business_date)
);

-- Materialized view for variance analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mat_view_variance_analytics AS
SELECT
  l.restaurant_id,
  l.item_id,
  DATE_TRUNC('month', l.created_at)::DATE AS reporting_month,
  COALESCE(SUM(CASE WHEN l.reason_code IN ('PO_RECEIPT', 'TRANSFER_IN') THEN l.change_amount ELSE 0 END), 0) AS actual_qty,
  COALESCE(SUM(CASE WHEN l.reason_code IN ('SALES_DEPLETION', 'WASTE', 'TRANSFER_OUT', 'PREP_CONSUMPTION') THEN ABS(l.change_amount) ELSE 0 END), 0) AS theoretical_qty,
  0 AS unexplained_variance_qty
FROM inventory_ledger l
GROUP BY l.restaurant_id, l.item_id, DATE_TRUNC('month', l.created_at)::DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mat_view_variance_unique
  ON mat_view_variance_analytics (restaurant_id, item_id, reporting_month);

-- 9. Audit table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  source_ip TEXT,
  user_agent TEXT,
  restaurant_id UUID,
  franchise_group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Verification**:
1. Migration runs without errors on a fresh Supabase project
2. `set_tenant_context()` function is callable
3. All tables have correct columns and constraints
4. `pnpm run generate:types` produces updated `database.types.ts` (or confirms current types match)

---

### Task 1.5: Implement `IStockQueryService` Concrete Class

**Problem**: `IStockQueryService` is defined (`i-stock-query.service.ts`) with `STOCK_QUERY_SERVICE_TOKEN` but no concrete class implements it. The Reporting Agent (and other read-only consumers) should depend on `IStockQueryService` rather than `ILedgerService` (ISP compliance per AGENTS.md).

**Solution**: Create a `StockQueryService` class that delegates to `LedgerService` for the read methods. Register it in `InventoryModule` under `STOCK_QUERY_SERVICE_TOKEN`.

**Files to create**:
| File | Content |
|---|---|
| `apps/api/src/inventory/stock-query.service.ts` | Concrete implementation of `IStockQueryService` |

**Files to modify**:
| File | Change |
|---|---|
| `apps/api/src/inventory/inventory.module.ts` | Add `StockQueryService` to providers under `STOCK_QUERY_SERVICE_TOKEN`. Export `STOCK_QUERY_SERVICE_TOKEN`. |
| `apps/api/src/inventory/stock-query.service.ts` | New file |

**Implementation**:
```typescript
// apps/api/src/inventory/stock-query.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { RestaurantId, ItemId, StockLevel } from '@ims/types';
import type { IStockQueryService } from './interfaces/i-stock-query.service';
import type { ILedgerService } from './interfaces/i-ledger.service';
import { LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';

@Injectable()
export class StockQueryService implements IStockQueryService {
  constructor(
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
  ) {}

  async getCurrentStock(restaurantId: RestaurantId, itemId: ItemId): Promise<number> {
    return this.ledgerService.getCurrentStock(restaurantId, itemId);
  }

  async getCurrentStockBulk(restaurantId: RestaurantId): Promise<StockLevel[]> {
    return this.ledgerService.getCurrentStockBulk(restaurantId);
  }
}
```

**Module registration** update in `inventory.module.ts`:
```typescript
import { StockQueryService } from './stock-query.service';
import { STOCK_QUERY_SERVICE_TOKEN } from './interfaces/i-stock-query.service';

// In providers array:
{
  provide: STOCK_QUERY_SERVICE_TOKEN,
  useClass: StockQueryService,
},

// In exports array:
STOCK_QUERY_SERVICE_TOKEN,
```

**Verification**:
1. `pnpm type-check` passes
2. `pnpm test` passes
3. `StockQueryService` is injectable via `@Inject(STOCK_QUERY_SERVICE_TOKEN)` from any module

---

### Sprint 1 Verification Checklist

After all 5 tasks:

| Check | Command | Expected |
|---|---|---|
| TypeScript | `pnpm type-check` | 0 errors across all 5 packages |
| Unit tests | `pnpm test` | All 54+ tests pass (no regressions) |
| Lint | `pnpm lint` | 0 warnings, 0 errors |
| CoreModule clean | Review `core.module.ts` | No `LEDGER_SERVICE_TOKEN` reference, no mock |
| Recipe auth | Review `recipe.controller.ts` | No `@Public()`, no mock IDs |
| Auth profile | `curl -X PATCH ...` | Returns `SafeUser` with updated fields |
| Migration | Review `supabase/migrations/` | Contains full schema DDL |
| StockQuery | `git grep STOCK_QUERY_SERVICE_TOKEN` | Found in inventory module + stock-query.service.ts |
