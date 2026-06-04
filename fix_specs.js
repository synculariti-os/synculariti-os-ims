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

// 1. inventory-transfer.service.spec.ts
patch('apps/api/src/inventory/__tests__/inventory-transfer.service.spec.ts', [
  {
    from: "import { Test, TestingModule } from '@nestjs/testing';",
    to: "import { Test, TestingModule } from '@nestjs/testing';\nimport { describe, it, expect } from 'vitest';"
  }
]);

// 2. prep.service.spec.ts
patch('apps/api/src/inventory/__tests__/prep.service.spec.ts', [
  { from: /(mockStockQueryService\.getCurrentStockBulk\.mockResolvedValue\(\[\{\s*itemId:\s*)'(item-(?:1|2|3))'/g, to: "$1'$2' as any" }
]);

// 3. waste.service.spec.ts
patch('apps/api/src/inventory/__tests__/waste.service.spec.ts', [
  { from: /(mockStockQueryService\.getCurrentStockBulk\.mockResolvedValueOnce\(\[\{\s*itemId:\s*)'item-1'/g, to: "$1'item-1' as any" }
]);

// 4. item.controller.spec.ts
patch('apps/api/src/item/__tests__/item.controller.spec.ts', [
  { from: "listCategories: vi.fn(),", to: "listCategories: vi.fn(),\n      getUomConversions: vi.fn()," }
]);

// 5. item.service.spec.ts
patch('apps/api/src/item/__tests__/item.service.spec.ts', [
  { from: "effectiveIsActive: true,", to: "effectiveIsActive: true, allergens: [], caloriesPerUom: 0, proteinGrams: 0, fatGrams: 0, carbsGrams: 0," }
]);

// 6. item.service.xor.spec.ts
patch('apps/api/src/item/__tests__/item.service.xor.spec.ts', [
  { from: "listCategories: vi.fn(),", to: "listCategories: vi.fn(),\n      getUomConversions: vi.fn()," }
]);

// 7. procurement-read.service.spec.ts
patch('apps/api/src/procurement/__tests__/procurement-read.service.spec.ts', [
  { from: "mockProcurementRepo.getAverageUnitCosts.mockResolvedValue", to: "(mockProcurementRepo.getAverageUnitCosts as any).mockResolvedValue" },
  { from: "mockProcurementRepo.getVendorPriceHistory.mockResolvedValue", to: "(mockProcurementRepo.getVendorPriceHistory as any).mockResolvedValue" },
  { from: /(mockProcurementRepo\.[a-zA-Z]+ as any)(\.mockResolvedValue)/g, to: "(mockProcurementRepo.$1 as any)$2" },
  { from: "mockProcurementRepo.getAverageUnitCosts as any).mockResolvedValue", to: "(mockProcurementRepo.getAverageUnitCosts as any).mockResolvedValue" },
  { from: /mockProcurementRepo\.([a-zA-Z]+)\.mockResolvedValue/g, to: "(mockProcurementRepo.$1 as any).mockResolvedValue" }
]);

// 8. procurement.service.spec.ts
patch('apps/api/src/procurement/__tests__/procurement.service.spec.ts', [
  { from: "restaurantId: 'rest-1',", to: "" },
  { from: "listCategories: vi.fn(),", to: "listCategories: vi.fn(),\n      getUomConversions: vi.fn()," }
]);

// 9. recipe.service.item-type-inference.spec.ts
patch('apps/api/src/recipe/__tests__/recipe.service.item-type-inference.spec.ts', [
  { from: "listCategories: vi.fn(),", to: "listCategories: vi.fn(),\n      getUomConversions: vi.fn()," }
]);

// 10. recipe.service.spec.ts
patch('apps/api/src/recipe/__tests__/recipe.service.spec.ts', [
  { from: "listCategories: vi.fn(),", to: "listCategories: vi.fn(),\n      getUomConversions: vi.fn()," },
  { from: "producesItemId: dto.producesItemId,", to: "producesItemId: (dto as any).producesItemId," },
  { from: "...dto", to: "...(dto as any)" }
]);

// 11. reporting.controller.spec.ts
patch('apps/api/src/reporting/__tests__/reporting.controller.spec.ts', [
  { from: "mockUser as JwtPayload", to: "mockUser as unknown as JwtPayload" }
]);
