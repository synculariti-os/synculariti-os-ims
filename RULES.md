# Rules — Synculariti OS IMS

> These rules are non-negotiable. Violations discovered in code review are blocking. Some are also enforced at runtime (DB triggers, NestJS guards) and in CI (ESLint, custom lint rules).

---

## 1. Database Rules

### R-DB-01 — Append-Only Tables
`inventory_ledger` and `audit_log` are **immutable ledgers**. No service, migration, or admin script may issue `UPDATE` or `DELETE` on these tables.

**Enforcement**: PostgreSQL row-level security + triggers (already applied). Services must call `LedgerService.record()` — never write to `inventory_ledger` directly.

### R-DB-02 — Tenant Context is Mandatory
Every Kysely query that touches a tenant-scoped table (anything with `restaurant_id` or `franchise_group_id`) **must** run after `set_tenant_context(p_restaurant_id, p_franchise_id)` has been called in the same connection/transaction.

**Enforcement**: `TenantContextInterceptor` populates the `tenantContext` via `AsyncLocalStorage`. The custom Kysely `TenantContextDriver` automatically executes this for every checked-out connection. BullMQ workers must wrap their execution inside `tenantContext.run(...)` to ensure the driver can read the context.

### R-DB-03 — No Raw SQL Strings
All database queries must use **Kysely** query builder. Raw SQL strings (`db.execute(sql\`...\``) are forbidden except in:
- DB migration files (`supabase/migrations/`)
- One-off maintenance scripts (in `scripts/` folder, never imported by the app)

### R-DB-04 — Transactions for Multi-Table Writes
Any service method that writes to **more than one table** must wrap all writes in a single Kysely transaction. Partial writes that leave the DB in an inconsistent state are a critical bug.

```typescript
// ✅ Correct
await db.transaction().execute(async (trx) => {
  await trx.updateTable('purchase_orders')...;
  await LedgerService.record(trx, ...);
});

// ❌ Wrong — two separate commits
await db.updateTable('purchase_orders')...;
await LedgerService.record(db, ...);
```

### R-DB-05 — Never Expose `password_hash`
The `users.password_hash` column must **never** appear in any API response, DTO serialization, or log output. `@Exclude()` decorator is mandatory on the entity field.

### R-DB-06 — Optimistic Locking on Count Batches
Updates to `inventory_count_batches` must include a `WHERE version = :currentVersion` clause. The service must throw `ConflictException` if 0 rows are affected.

---

## 2. Architecture Rules

### R-ARCH-01 — No Cross-Repository Dependencies
A NestJS module's `Repository` class may only query tables **owned by that module** (see agents.md). To access data from another domain, import and inject that domain's *service interface*, never its repository.

```typescript
// ✅ Correct — inject the service interface
constructor(private readonly itemService: IItemService) {}

// ❌ Wrong — importing another module's repository
constructor(private readonly itemRepo: ItemRepository) {}
```

### R-ARCH-02 — Controller → Service → Repository Strict Layering
- Controllers: HTTP parsing, DTO binding, response shaping. Zero business logic.
- Services: Business logic, orchestration, transaction management.
- Repositories: Kysely queries only. No business logic.

### R-ARCH-03 — `LedgerService` is the Sole Ledger Writer
Only `InventoryModule.LedgerService` may call `INSERT INTO inventory_ledger`. All other modules (Procurement, Sales, Inventory counts, Waste, Prep) must call `LedgerService.record()`.

**Enforcement**: ESLint custom rule `no-direct-ledger-insert` (to be implemented in `packages/config/eslint/`).

### R-ARCH-04 — Shared Types Live in `@ims/types`
No module may define its own `interface` or `type` for entities that exist in the database. All entity types are derived from `packages/types/src/database.types.ts`.

### R-ARCH-05 — Shared Validation Lives in `@ims/validators`
Zod schemas are defined once in `packages/validators/`. NestJS DTOs use `ZodValidationPipe` backed by the same schema. Frontend `react-hook-form` uses the same schema resolver. No duplicated field validation.

---

## 3. Security Rules

### R-SEC-01 — JWT Verification on Every Protected Route
All NestJS routes must be protected by `SupabaseAuthGuard` (registered globally via `APP_GUARD` in `AppModule`). Use `@Public()` decorator on routes that should not require authentication (e.g., health checks). JWT issuance is delegated entirely to Supabase Auth — NestJS never issues tokens.

### R-SEC-02 — Permission Guard is Mandatory for Mutations
Every mutating endpoint (POST, PUT, PATCH, DELETE) must carry a `@RequirePermission('MODULE.ACTION')` decorator. The guard verifies the permission is present in the JWT `permissions` array.

```typescript
// ✅ Correct
@Patch(':id/receive')
@RequirePermission('PROCUREMENT.WRITE')
async receivePO(@Param('id') id: string, ...) {}
```

### R-SEC-03 — No Permission Codes in Frontend Code
Permission codes (e.g., `'INVENTORY.WRITE'`) must be imported from `@ims/types/permissions`, not hardcoded as strings in React components. This is the single source of truth.

### R-SEC-04 — Sanitize File Uploads
Sales import files must be validated:
- Max size: 10 MB
- Allowed MIME types: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`
- File content must be parsed in a sandboxed BullMQ worker, never in the HTTP request handler.

### R-SEC-05 — Never Log Sensitive Fields
The following fields must never appear in application logs: `password_hash`, JWT `sub` in plaintext, `source_ip` beyond INFO level, full `audit_log.new_value` if it contains PII.

### R-SEC-06 — HTTPS-Only Cookies (Frontend Responsibility)
Token refresh and storage are handled entirely by the Supabase Auth client on the frontend. The refresh token is automatically managed by `@supabase/ssr` (Next.js) / `@supabase/auth-js` and stored in an `HttpOnly; Secure; SameSite=Strict` cookie. NestJS never receives or stores refresh tokens.

---

## 4. API Design Rules

### R-API-01 — REST Resource Naming
All REST paths use **kebab-case** plural nouns. No verbs in paths (use HTTP method semantics).

```
✅ GET    /procurement/orders
✅ POST   /inventory/transfers
✅ PATCH  /inventory/counts/:id/close   ← action sub-resource is acceptable
✅ GET    /sales-imports
✅ POST   /recipes
❌ POST   /receiveOrder
❌ GET    /getInventoryTransfers
```

### R-API-02 — Consistent Response Envelope
All API responses use this shape:
```typescript
// Success
{ data: T, meta?: PaginationMeta }
// Error
{ error: { code: string, message: string, details?: unknown } }
```

### R-API-03 — Pagination on All List Endpoints
List endpoints must accept `?page=1&limit=50` and return `meta: { total, page, limit, totalPages }`. Default limit is 50, maximum is 200.

### R-API-04 — Idempotent Receipt Endpoints
`PATCH /procurement/orders/:id/receive` is idempotent — calling it twice on a RECEIVED PO must return `409 Conflict`, never insert duplicate ledger entries.

### R-API-05 — Status-Code Contract
| Situation | HTTP Status |
|---|---|
| Created | 201 |
| Soft-deleted / deactivated | 200 (return updated entity) |
| Not found | 404 |
| Wrong tenant | 403 (never 404 — avoids enumeration) |
| Validation failure | 422 |
| Optimistic lock conflict | 409 |
| Server error | 500 (never expose stack trace) |

---

## 5. TypeScript Rules

### R-TS-01 — Strict Mode is Non-Negotiable
`"strict": true` in all `tsconfig.json` files. No `any` type except when interfacing with third-party libraries that lack types, and only with an `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment explaining why.

### R-TS-02 — Discriminated Unions for State Machines
PO status, transfer status, count batch status, and sales import status are modeled as **discriminated union types**, not `string`. Example:

```typescript
type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED';
```
These are defined in `@ims/types` and shared between frontend and backend.

### R-TS-03 — Branded Types for UUIDs
Use branded types to prevent accidental mixing of IDs from different entities:
```typescript
type RestaurantId = string & { __brand: 'RestaurantId' };
type ItemId = string & { __brand: 'ItemId' };
```

### R-TS-04 — No Implicit Returns in Service Methods
All `async` service methods must have an explicit return type annotation. This catches unintended `void` returns.

### R-TS-05 — Zod `.parse()` Not `.safeParse()` at API Boundaries
At API entry points (controllers, BullMQ job handlers), use `.parse()` so validation errors are thrown and caught by the global exception filter. Use `.safeParse()` only when you need to handle the error inline (e.g., in file parsers).

---

## 6. Naming Conventions

| Artefact | Convention | Example |
|---|---|---|
| NestJS Module | `PascalCase + Module` | `ProcurementModule` |
| NestJS Service | `PascalCase + Service` | `LedgerService` |
| NestJS Controller | `PascalCase + Controller` | `InventoryController` |
| Repository | `PascalCase + Repository` | `ItemRepository` |
| Interface | `I + PascalCase` | `ILedgerService` |
| DTO | `PascalCase + Dto` | `CreatePoDto`, `ReceivePoDto` |
| Zod Schema | `camelCase + Schema` | `createPoSchema` |
| DB table refs | `snake_case` (as in DB) | `inventory_ledger`, `po_line_items` |
| REST path segment | `kebab-case` | `/procurement/orders`, `/sales-imports` |
| React Component | `PascalCase` | `PurchaseOrderTable` |
| React Hook | `useCamelCase` | `usePurchaseOrders` |
| Next.js Server Action | `camelCaseAction` | `submitPurchaseOrderAction` |
| Environment variable | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` |

---

## 7. Testing Rules

### R-TEST-01 — Unit Tests for All Service Methods
Every `*Service` method must have at least one unit test. Repositories are mocked via `IRepository` interfaces (Liskov compliance).

### R-TEST-02 — Integration Tests for All ACID Paths
Every service method that uses a transaction (PO receipt, count close, sales depletion) must have an integration test against a real Supabase test branch.

### R-TEST-03 — No `console.log` in Tests
Use Vitest's built-in logging. `console.log` in test files is a failing lint check.

### R-TEST-04 — Test File Co-location
Unit test files are co-located with the source: `procurement.service.spec.ts` lives next to `procurement.service.ts`. Integration tests live in `test/integration/`.

### R-TEST-05 — Minimum Coverage Thresholds (CI-enforced)
| Scope | Branch | Line |
|---|---|---|
| `apps/api/src/` | 80% | 85% |
| `packages/validators/` | 100% | 100% |
| `packages/types/` | N/A | N/A |

Coverage enforcement is configured in `vitest.config.ts` and executed via `pnpm test -- --coverage` in CI.

---

## 8. CI / CD Rules

### R-CI-01 — All Checks Must Pass Before Merge
PR merges are blocked unless all of the following pass:
1. TypeScript compilation (zero errors)
2. ESLint (zero warnings, zero errors)
3. Unit tests (Vitest)
4. Integration tests (against Supabase test branch)
5. Coverage thresholds (R-TEST-05)

### R-CI-02 — No Secrets in Code
Environment variables are never hardcoded. `.env` files are never committed. Secrets are managed via GitHub Actions secrets / deployment platform secrets manager.

### R-CI-03 — Schema Changes Require Migration File
Any change to the Supabase schema must be accompanied by a new migration file in `supabase/migrations/`. Direct schema edits via the Supabase dashboard are prohibited in production.

### R-CI-04 — Generated Types Must Be Committed
After any migration, `pnpm run generate:types` must be run and the updated `packages/types/src/database.types.ts` committed in the same PR as the migration.
