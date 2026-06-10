const fs = require('fs');
const files = [
  'apps/api/src/common/interceptors/__tests__/audit.interceptor.spec.ts',
  'apps/api/src/inventory/__tests__/inventory-count.controller.spec.ts',
  'apps/api/src/inventory/__tests__/inventory-count.service.spec.ts',
  'apps/api/src/item/__tests__/item.controller.spec.ts',
  'apps/api/src/item/__tests__/item.service.spec.ts',
  'apps/api/src/item/__tests__/item.service.xor.spec.ts',
  'apps/api/src/recipe/__tests__/recipe.service.item-type-inference.spec.ts',
  'apps/api/src/recipe/__tests__/recipe.service.sub-recipe-bom.spec.ts',
  'apps/api/src/inventory/__tests__/ledger.service-queries.spec.ts',
  'apps/api/src/inventory/__tests__/ledger.service.spec.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix audit.interceptor.spec.ts
  if (file.includes('audit.interceptor.spec.ts')) {
    content = content.replace(/log:\s*vi\.fn\(\),/g, 'log: vi.fn(), listLogs: vi.fn(), findLogById: vi.fn(),');
  }

  // Fix inventory-count.controller.spec.ts
  if (file.includes('inventory-count.controller.spec.ts')) {
    content = content.replace(/getBatchById:\s*vi\.fn\(\),/g, 'getBatchById: vi.fn(), exportBatch: vi.fn(), importBatch: vi.fn(),');
  }

  // Fix inventory-count.service.spec.ts
  if (file.includes('inventory-count.service.spec.ts')) {
    content = content.replace(/listBatches:\s*vi\.fn\(\),/g, 'listBatches: vi.fn(), findRowsWithItemName: vi.fn(), exportBatch: vi.fn(), importBatch: vi.fn(),');
    content = content.replace(/getLedgerEntries:\s*vi\.fn\(\),/g, 'getLedgerEntries: vi.fn(), recordOpeningBalance: vi.fn(),');
  }

  // Fix item.controller.spec.ts
  if (file.includes('item.controller.spec.ts')) {
    content = content.replace(/generateSku:\s*vi\.fn\(\),/g, 'generateSku: vi.fn(), deleteItemsBulk: vi.fn(), deleteCategoriesBulk: vi.fn(), findBySku: vi.fn(), ensureItemDependencies: vi.fn(),');
  }

  // Fix item.service.spec.ts
  if (file.includes('item.service.spec.ts')) {
    content = content.replace(/generateSku:\s*vi\.fn\(\),/g, 'generateSku: vi.fn(), deleteItemsBulk: vi.fn(), deleteCategoriesBulk: vi.fn(), findBySku: vi.fn(), ensureItemDependencies: vi.fn(),');
  }

  // Fix item.service.xor.spec.ts
  if (file.includes('item.service.xor.spec.ts')) {
    content = content.replace(/generateSku:\s*vi\.fn\(\),/g, 'generateSku: vi.fn(), deleteItemsBulk: vi.fn(), deleteCategoriesBulk: vi.fn(), findBySku: vi.fn(), ensureItemDependencies: vi.fn(),');
  }

  // Fix recipe.service.item-type-inference.spec.ts and sub-recipe-bom.spec.ts
  if (file.includes('recipe.service.')) {
    content = content.replace(/deleteMapping:\s*vi\.fn\(\),?/g, 'deleteMapping: vi.fn(), bulkCreateRecipes: vi.fn(), getUnmappedRows: vi.fn(),');
    content = content.replace(/generateSku:\s*vi\.fn\(\),?/g, 'generateSku: vi.fn(), deleteItemsBulk: vi.fn(), deleteCategoriesBulk: vi.fn(), findBySku: vi.fn(), ensureItemDependencies: vi.fn(),');
  }

  // Fix getLedgerEntries expects 3 arguments, but got 2
  if (file.includes('ledger.service-queries.spec.ts') || file.includes('ledger.service.spec.ts')) {
    content = content.replace(/getLedgerEntries\(RESTAURANT_ID, 50\)/g, 'getLedgerEntries(RESTAURANT_ID, 50, 0)');
    content = content.replace(/getLedgerEntries\(RESTAURANT_ID, 10\)/g, 'getLedgerEntries(RESTAURANT_ID, 10, 0)');
    content = content.replace(/getLedgerEntries\('r1' as RestaurantId, 50\)/g, "getLedgerEntries('r1' as RestaurantId, 50, 0)");
    content = content.replace(/getLedgerEntries\('r1' as RestaurantId, 10\)/g, "getLedgerEntries('r1' as RestaurantId, 10, 0)");
  }

  fs.writeFileSync(file, content, 'utf8');
}
