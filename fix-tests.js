const fs = require('fs');
const path = require('path');

const replaceInFile = (relPath, replacements) => {
  const fullPath = path.join('/Users/yoki/Workspace/Code/synculariti-os-ims', relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const r of replacements) {
    if (content.includes(r.from)) {
      content = content.replace(r.from, r.to);
    }
  }
  fs.writeFileSync(fullPath, content);
};

// 1. item.service.xor.spec.ts
replaceInFile('apps/api/src/item/__tests__/item.service.xor.spec.ts', [
  { 
    from: 'isActive: true,', 
    to: 'isActive: true,\n      allergens: [],\n      caloriesPerUom: 0,\n      proteinGrams: 0,\n      fatGrams: 0,\n      carbsGrams: 0,' 
  }
]);

// 2. procurement-read.service.spec.ts
replaceInFile('apps/api/src/procurement/__tests__/procurement-read.service.spec.ts', [
  { from: 'as never', to: 'as unknown as import(\'vitest\').Mocked<import(\'../interfaces/i-procurement.repository\').IProcurementRepository>' },
  { from: 'as never', to: 'as unknown as import(\'vitest\').Mocked<import(\'../interfaces/i-procurement.repository\').IProcurementRepository>' },
  { from: 'as never', to: 'as unknown as import(\'vitest\').Mocked<import(\'../interfaces/i-procurement.repository\').IProcurementRepository>' },
  { from: 'as never', to: 'as unknown as import(\'vitest\').Mocked<import(\'../interfaces/i-procurement.repository\').IProcurementRepository>' },
  { from: 'mockRepo.getAverageUnitCosts.mockResolvedValue', to: '(mockRepo.getAverageUnitCosts as import(\'vitest\').Mock).mockResolvedValue' },
  { from: 'mockRepo.getAverageUnitCosts.mockResolvedValue', to: '(mockRepo.getAverageUnitCosts as import(\'vitest\').Mock).mockResolvedValue' },
  { from: 'mockRepo.getVendorPriceHistory.mockResolvedValue', to: '(mockRepo.getVendorPriceHistory as import(\'vitest\').Mock).mockResolvedValue' },
  { from: 'mockRepo.getVendorPriceHistory.mockResolvedValue', to: '(mockRepo.getVendorPriceHistory as import(\'vitest\').Mock).mockResolvedValue' }
]);

// 3. procurement.service.spec.ts
replaceInFile('apps/api/src/procurement/__tests__/procurement.service.spec.ts', [
  { from: 'restaurantId: \'rest-1\',', to: '' },
  { from: 'findVendors: vi.fn(),', to: 'findVendors: vi.fn(),\n      getVendorPriceHistory: vi.fn(),' }
]);

// 4. recipe.service.spec.ts
replaceInFile('apps/api/src/recipe/__tests__/recipe.service.spec.ts', [
  { from: '...((mockRecipe as never) || {}),', to: '...(mockRecipe as unknown as import(\'@ims/types\').Recipe),' },
  { from: 'producesItemId: (mockRecipe as never).producesItemId,', to: 'producesItemId: (mockRecipe as unknown as import(\'@ims/types\').Recipe).producesItemId,' }
]);

// 5. reporting-cogs.service.spec.ts
replaceInFile('apps/api/src/reporting/__tests__/reporting-cogs.service.spec.ts', [
  { from: 'mockRecipeService = {\n      listMenuRecipes: vi.fn(),\n      getIngredients: vi.fn(),\n    } as never;', to: 'mockRecipeService = {\n      listMenuRecipes: vi.fn(),\n      getIngredients: vi.fn(),\n    } as unknown as import(\'vitest\').Mocked<import(\'../../recipe/interfaces/i-recipe.service\').IRecipeService>;' },
  { from: 'mockProcurementReadService = {\n      getAverageUnitCosts: vi.fn(),\n    } as never;', to: 'mockProcurementReadService = {\n      getAverageUnitCosts: vi.fn(),\n    } as unknown as import(\'vitest\').Mocked<import(\'../../procurement/interfaces/i-procurement-read.service\').IProcurementReadService>;' },
  { from: 'mockItemReadService = {\n      findById: vi.fn(),\n    } as never;', to: 'mockItemReadService = {\n      findById: vi.fn(),\n    } as unknown as import(\'vitest\').Mocked<import(\'../../item/interfaces/i-item-read.service\').IItemReadService>;' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').Recipe' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').Recipe' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').RecipeIngredient[]' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').RecipeIngredient[]' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').ItemWithOverride' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').ItemWithOverride' }
]);

// 6. reporting.controller.spec.ts
replaceInFile('apps/api/src/reporting/__tests__/reporting.controller.spec.ts', [
  { from: 'mockReportingService = {\n      getVarianceReport: vi.fn(),\n      getParAlerts: vi.fn(),\n      getSnapshots: vi.fn(),\n      runEodSnapshots: vi.fn(),\n    } as never;', to: 'mockReportingService = {\n      getVarianceReport: vi.fn(),\n      getParAlerts: vi.fn(),\n      getSnapshots: vi.fn(),\n      runEodSnapshots: vi.fn(),\n    } as unknown as import(\'vitest\').Mocked<import(\'../interfaces/i-reporting.service\').IReportingService>;' },
  { from: 'mockCogsService = {\n      getMenuCostingReport: vi.fn(),\n    } as never;', to: 'mockCogsService = {\n      getMenuCostingReport: vi.fn(),\n    } as unknown as import(\'vitest\').Mocked<import(\'../interfaces/i-reporting-cogs.service\').IReportingCogsService>;' },
  { from: '(mockUser as never)', to: '(mockUser as unknown as import(\'@ims/types\').JwtPayload)' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').VarianceReportRow[]' }
]);

// 7. reporting.service.spec.ts
replaceInFile('apps/api/src/reporting/__tests__/reporting.service.spec.ts', [
  { from: 'mockItemReadService = {\n      listParLevels: vi.fn(),\n    } as never;', to: 'mockItemReadService = {\n      listParLevels: vi.fn(),\n    } as unknown as import(\'vitest\').Mocked<import(\'../../item/interfaces/i-item-read.service\').IItemReadService>;' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').ItemWithOverride' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').ItemWithOverride' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').ItemId' },
  { from: 'as never', to: 'as unknown as import(\'@ims/types\').ItemId' }
]);

// 8. sales-parsers.spec.ts
replaceInFile('apps/api/src/sales/parsers/sales-parsers.spec.ts', [
  { from: 'import { SalesFileParserFactory } from \'./sales-file-parser.factory\';', to: 'import { describe, it, expect } from \'vitest\';\nimport { SalesFileParserFactory } from \'./sales-file-parser.factory\';' }
]);

// Bulk replace remaining `as never` across all `reporting-cogs.service.spec.ts` and `reporting.service.spec.ts`
replaceInFile('apps/api/src/reporting/__tests__/reporting-cogs.service.spec.ts', [
  { from: 'as never', to: 'as unknown' },
  { from: 'as never', to: 'as unknown' },
  { from: 'as never', to: 'as unknown' },
  { from: 'as never', to: 'as unknown' },
  { from: 'as never', to: 'as unknown' },
  { from: 'as never', to: 'as unknown' }
]);

replaceInFile('apps/api/src/reporting/__tests__/reporting.service.spec.ts', [
  { from: 'as never', to: 'as unknown' },
  { from: 'as never', to: 'as unknown' },
  { from: 'as never', to: 'as unknown' }
]);

console.log('Fixed tests');
