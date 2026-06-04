const fs = require('fs');

function patch(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  for (const { from, to } of replacements) {
    if (typeof from === 'string') {
      content = content.replace(from, to);
    } else {
      content = content.replace(from, to);
    }
  }
  fs.writeFileSync(file, content);
}

// 1. auth.service.spec.ts
patch('apps/api/src/auth/__tests__/auth.service.spec.ts', [
  { from: /mockTenantService\.getRestaurant/g, to: "(mockTenantService.getRestaurant as any)" },
  { from: /mockUserRepo\.findById/g, to: "(mockUserRepo.findById as any)" }
]);

// 2. inventory-transfer.service.spec.ts
patch('apps/api/src/inventory/__tests__/inventory-transfer.service.spec.ts', [
  { from: "import { describe, it, expect } from 'vitest';", to: "import { describe, it, expect, beforeEach } from 'vitest';" }
]);

// 3. prep.service.spec.ts
patch('apps/api/src/inventory/__tests__/prep.service.spec.ts', [
  { from: /mockInventoryCountRepo\.createBatch/g, to: "(mockInventoryCountRepo.createBatch as any)" },
  { from: /mockPrepRepo\.createLog/g, to: "(mockPrepRepo.createLog as any)" }
]);

// 4. waste.service.spec.ts
patch('apps/api/src/inventory/__tests__/waste.service.spec.ts', [
  { from: /mockWasteRepo\.createLog/g, to: "(mockWasteRepo.createLog as any)" }
]);

// 5. procurement-read.service.spec.ts
patch('apps/api/src/procurement/__tests__/procurement-read.service.spec.ts', [
  { from: /mockProcurementRepo\.getAverageUnitCosts/g, to: "(mockProcurementRepo.getAverageUnitCosts as any)" },
  { from: /mockProcurementRepo\.getVendorPriceHistory/g, to: "(mockProcurementRepo.getVendorPriceHistory as any)" },
  { from: /\(mockProcurementRepo\.getAverageUnitCosts as any\) as any\)/g, to: "(mockProcurementRepo.getAverageUnitCosts as any)" },
  { from: /\(mockProcurementRepo\.getVendorPriceHistory as any\) as any\)/g, to: "(mockProcurementRepo.getVendorPriceHistory as any)" }
]);

// 6. procurement.service.spec.ts
patch('apps/api/src/procurement/__tests__/procurement.service.spec.ts', [
  { from: "restaurantId: 'rest-1',", to: "" },
  { from: "listCategories: vi.fn(),", to: "listCategories: vi.fn(),\n      getUomConversions: vi.fn()," },
  { from: "restaurantId: 'rest-1'", to: "" } // catch any without trailing comma
]);

// 7. recipe.service.item-type-inference.spec.ts
patch('apps/api/src/recipe/__tests__/recipe.service.item-type-inference.spec.ts', [
  { from: "listParLevels:     vi.fn(),", to: "listParLevels:     vi.fn(),\n  getUomConversions: vi.fn()," }
]);

