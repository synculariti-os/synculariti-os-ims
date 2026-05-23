---
description: # Synculariti OS IMS — Developer Workflow
---

# Synculariti OS IMS — Developer Workflow

This document outlines the standard operating procedure (SOP) and implementation plan execution workflow for building out features in the Synculariti OS IMS monorepo.

> **Note**: This workflow is strictly enforced by the `ims-developer` agent skill. Human developers and AI agents must adhere to these steps to ensure consistency, reliability, and architectural integrity.

---

## Workflow Overview

The implementation is divided into **Phases**, managed centrally. For any given feature, the workflow follows a strict **TDD-First (Test-Driven Development)** cycle, with immutable tests that define the contract *before* any production code is written.

### The 4 Pillars of Our Workflow
1. **Understand Boundaries**: Consult `AGENTS.md`, `RULES.md`, and `SYMBOLS.md` before starting any new module.
2. **Red Phase (Immutable Test)**: Write the test first. Once the test is written and fails, it is marked with `@immutable-test` and *cannot be changed*.
3. **Green Phase (Implementation)**: Write the production code required to make the test pass.
4. **Refactor Phase**: Clean up the code while ensuring tests remain green.

---

## Step-by-Step Implementation Workflow

When starting a new feature from the **Phase Task List** (e.g., implementing the `SalesModule`), follow these steps:

### Step 1: Pre-Flight Check
- Review `AGENTS.md` to understand the tables the agent owns and the contracts it must expose.
- Review `RULES.md` for any database or security constraints (e.g., must the ledger be written to?).
- Review `SYMBOLS.md` to identify existing domain types or Zod schemas in `@ims/types` and `@ims/validators` to use.

### Step 2: Define Interfaces & DTOs
- If not already present, create the necessary types in `packages/types/src/domain/`.
- If not already present, create the validation schemas in `packages/validators/src/`.
- Export them correctly in their respective `index.ts` files.

### Step 3: Write the Unit Tests (The "Red" Phase)
- Create the `.spec.ts` file for the service (e.g., `sales.service.spec.ts`).
- Write the tests focusing on the business logic, edge cases, ACID compliance, and error throwing.
- Add the `@immutable-test` comment at the top of the file.
- **Run the test** and verify it fails (Red).

### Step 4: Define the Service Interface
- Create the `i-[service-name].service.ts` interface definition.
- Create the `i-[service-name].repository.ts` interface definition.
- This enforces the Dependency Inversion Principle (DIP).

### Step 5: Implement the Service (The "Green" Phase)
- Create the `[service-name].service.ts` file implementing the interface.
- Implement the methods, adhering strictly to SOLID and ACID principles.
- Use `db.transaction()` via Kysely for any multi-table writes.
- Do NOT directly inject another module's repository — only use their exported Service.
- **Run the test** and verify it passes (Green).

### Step 6: Implement the Infrastructure
- Once tests pass with mocks, implement the concrete Repository using Kysely.
- Implement the Controller, applying `@RequirePermission()` and `ZodValidationPipe`.
- Wire up the NestJS Module (`[agent].module.ts`).

### Step 7: Verification & CI
- Run `pnpm lint` and `pnpm type-check` at the workspace root.
- Ensure all tests pass with `pnpm test`.

---

## Phase Execution Plan

The project is executed in the following phases. Always consult the active Task Tracker (`task.md`) for the current status. For each phase of implementation of the workflow ask for a review. 

### Phase 1: Monorepo Foundation
- Set up TurboRepo, pnpm workspaces, formatting, linting.
- Scaffold `@ims/types`, `@ims/validators`, and `@ims/config`.

### Phase 2: NestJS Backend (`apps/api`)
- Follow the TDD cycle for all 9 Agent Modules:
  1. Auth Module
  2. Tenant Module
  3. Item Module
  4. Procurement Module
  5. Recipe Module
  6. Inventory Module
  7. Sales Module
  8. Reporting Module
  9. Audit Module
- Set up global guards, exception filters, and Kysely database connections.

### Phase 3: Next.js Frontend (`apps/web`)
- Implement the React app using the shared types and validators.
- Scaffold authentication, routing, and data fetching (React Query / RSC).

### Phase 4: CI/CD & Deployment
- Set up GitHub actions to enforce immutable tests and run test suites.
- Deploy to Vercel (Frontend) and Railway (API).
