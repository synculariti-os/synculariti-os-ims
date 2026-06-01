# Implementation Plan — Synculariti OS IMS

> **Audit Date**: 2026-06-01
> **References**: AGENTS.md, SYMBOLS.md, RULES.md, WORKFLOW.md, `pepperoni_pizza_ims_analysis.md`
> **Status**: Phase 18 - PDF Sales Ingestion (Execution Complete)

## Phase 18 Backend - PDF Sales Ingestion (TDD):
- [x] Define `ISalesFileParser` in `apps/api/src/sales/interfaces/i-sales-file-parser.ts`
- [x] Write immutable tests for `PdfSalesParser` and `XlsxSalesParser`
- [x] Implement `XlsxSalesParser` and `PdfSalesParser`
- [x] Create `SalesParserFactory` to inject the correct implementation based on file extension
- [x] Refactor `sales.processor.ts` to use `SalesParserFactory`
- [x] Update `apps/web/src/app/sales/import/page.tsx` or its child components to accept `.pdf` files.
- [x] Upload a PDF file via UI and ensure BOM expands.
- [x] Update Documentation: Update `AGENTS.md`, `RULES.md`, and `SYMBOLS.md`

