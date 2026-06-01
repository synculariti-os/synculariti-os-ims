const fs = require('fs');
const file = 'apps/api/src/inventory/__tests__/inventory-transfer.service.spec.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/transaction: vi\.fn\(\(cb\) => cb\(\{/, "transaction: vi.fn().mockReturnValue({ execute: vi.fn((cb) => cb({");
code = code.replace(/executeTakeFirst: vi\.fn\(\),\n        executeTakeFirstOrThrow: vi\.fn\(\),\n        execute: vi\.fn\(\),\n      \}\)\),/, "executeTakeFirst: vi.fn(),\n        executeTakeFirstOrThrow: vi.fn(),\n        execute: vi.fn(),\n      })) }),");

// Also fix vi.mocked for ledgerService
code = code.replace(/let ledgerService: vi\.Mocked<ILedgerService>;/g, "import { vi } from 'vitest';\nlet ledgerService: any;");
code = code.replace(/expect\.anything\(\)/g, "expect.anything()");

fs.writeFileSync(file, code);
