const fs = require('fs');

// 1. Fix audit.interceptor.spec.ts
const auditSpec = 'apps/api/src/common/interceptors/__tests__/audit.interceptor.spec.ts';
if (fs.existsSync(auditSpec)) {
  let content = fs.readFileSync(auditSpec, 'utf8');
  content = content.replace(/log:\s*vi\.fn\(\)\.mockResolvedValue\(undefined\),/g, 'log: vi.fn().mockResolvedValue(undefined), listLogs: vi.fn(), findLogById: vi.fn(),');
  fs.writeFileSync(auditSpec, content, 'utf8');
}

// 2. Fix ledger.service.spec.ts
const ledgerSpec = 'apps/api/src/inventory/__tests__/ledger.service.spec.ts';
if (fs.existsSync(ledgerSpec)) {
  let content = fs.readFileSync(ledgerSpec, 'utf8');
  content = content.replace(/new LedgerService\(mockLedgerRepository, mockItemReadService as never\)/g, 'new LedgerService(mockLedgerRepository, mockItemReadService as never, {} as never)');
  fs.writeFileSync(ledgerSpec, content, 'utf8');
}

// 3. Fix ledger.service-queries.spec.ts
const ledgerQueriesSpec = 'apps/api/src/inventory/__tests__/ledger.service-queries.spec.ts';
if (fs.existsSync(ledgerQueriesSpec)) {
  let content = fs.readFileSync(ledgerQueriesSpec, 'utf8');
  content = content.replace(/new LedgerService\(mockLedgerRepository, \{\} as never\)/g, 'new LedgerService(mockLedgerRepository, {} as never, {} as never)');
  fs.writeFileSync(ledgerQueriesSpec, content, 'utf8');
}

// 4. Fix inventory-count.service.spec.ts
const inventoryCountServiceSpec = 'apps/api/src/inventory/__tests__/inventory-count.service.spec.ts';
if (fs.existsSync(inventoryCountServiceSpec)) {
  let content = fs.readFileSync(inventoryCountServiceSpec, 'utf8');
  content = content.replace(/listBatches:\s*vi\.fn\(\)\s*as\s*never,/g, 'listBatches: vi.fn() as never, findRowsWithItemName: vi.fn() as never,');
  fs.writeFileSync(inventoryCountServiceSpec, content, 'utf8');
}

// 5. Fix item.service.spec.ts and item.service.xor.spec.ts duplicates
const itemSpec = 'apps/api/src/item/__tests__/item.service.spec.ts';
if (fs.existsSync(itemSpec)) {
  let content = fs.readFileSync(itemSpec, 'utf8');
  content = content.replace(/generateSku:\s*vi\.fn\(\),\s*deleteItemsBulk:\s*vi\.fn\(\),\s*deleteCategoriesBulk:\s*vi\.fn\(\),\s*findBySku:\s*vi\.fn\(\),\s*ensureItemDependencies:\s*vi\.fn\(\),/g, 'generateSku: vi.fn(), findBySku: vi.fn(),');
  fs.writeFileSync(itemSpec, content, 'utf8');
}

const itemXorSpec = 'apps/api/src/item/__tests__/item.service.xor.spec.ts';
if (fs.existsSync(itemXorSpec)) {
  let content = fs.readFileSync(itemXorSpec, 'utf8');
  content = content.replace(/generateSku:\s*vi\.fn\(\),\s*deleteItemsBulk:\s*vi\.fn\(\),\s*deleteCategoriesBulk:\s*vi\.fn\(\),\s*findBySku:\s*vi\.fn\(\),\s*ensureItemDependencies:\s*vi\.fn\(\),/g, 'generateSku: vi.fn(), findBySku: vi.fn(),');
  fs.writeFileSync(itemXorSpec, content, 'utf8');
}

// 6. Fix recipe.service.sub-recipe-bom.spec.ts
const recipeBomSpec = 'apps/api/src/recipe/__tests__/recipe.service.sub-recipe-bom.spec.ts';
if (fs.existsSync(recipeBomSpec)) {
  let content = fs.readFileSync(recipeBomSpec, 'utf8');
  content = content.replace(/deleteMapping:\s*vi\.fn\(\),\s*bulkCreateRecipes:\s*vi\.fn\(\),\s*getUnmappedRows:\s*vi\.fn\(\),/g, 'deleteMapping: vi.fn(), getUnmappedRows: vi.fn(),');
  fs.writeFileSync(recipeBomSpec, content, 'utf8');
}
