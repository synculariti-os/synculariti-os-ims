const fs = require('fs');

const ledgerQueriesSpec = 'apps/api/src/inventory/__tests__/ledger.service-queries.spec.ts';
if (fs.existsSync(ledgerQueriesSpec)) {
  let content = fs.readFileSync(ledgerQueriesSpec, 'utf8');
  content = content.replace(/new LedgerService\(mockLedgerRepository, mockItemReadService as never\)/g, 'new LedgerService(mockLedgerRepository, mockItemReadService as never, {} as never)');
  fs.writeFileSync(ledgerQueriesSpec, content, 'utf8');
}

const itemXorSpec = 'apps/api/src/item/__tests__/item.service.xor.spec.ts';
if (fs.existsSync(itemXorSpec)) {
  let content = fs.readFileSync(itemXorSpec, 'utf8');
  content = content.replace(/generateSku:\s*vi\.fn\(\),\s*findBySku:\s*vi\.fn\(\),/g, 'generateSku: vi.fn(), findBySku: vi.fn(), deleteItemsBulk: vi.fn(), deleteCategoriesBulk: vi.fn(),');
  fs.writeFileSync(itemXorSpec, content, 'utf8');
}
