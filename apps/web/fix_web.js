const fs = require('fs');

function replace(file, search, rep) {
  if (fs.existsSync(file)) {
    let t = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, t.split(search).join(rep));
  }
}

// 1. profile/page.tsx
replace('apps/web/src/app/profile/page.tsx', 'res: unknown', 'res: any');
replace('apps/web/src/app/profile/page.tsx', 'const parsed = res as {}', 'const parsed = res as any');

// 2. reports/snapshots/page.tsx
replace('apps/web/src/app/reports/snapshots/page.tsx', 's: unknown', 's: any');

// 3. reports/vendor-pricing/page.tsx
replace('apps/web/src/app/reports/vendor-pricing/page.tsx', 'a: unknown, b: unknown', 'a: any, b: any');
replace('apps/web/src/app/reports/vendor-pricing/page.tsx', 'd: unknown', 'd: any');
replace('apps/web/src/app/reports/vendor-pricing/page.tsx', 'data.reduce((acc: unknown, curr', 'data.reduce((acc: any, curr');

// 4. tenant/restaurants/page.tsx
replace('apps/web/src/app/tenant/restaurants/page.tsx', 'r: unknown', 'r: any');

// 5. prep-table.tsx
replace('apps/web/src/components/inventory/prep-table.tsx', 'data: unknown', 'data: any');

// 6. waste-table.tsx
replace('apps/web/src/components/inventory/waste-table.tsx', 'data: unknown', 'data: any');

// 7. create-item-dialog.tsx
replace('apps/web/src/components/items/create-item-dialog.tsx', 'const { _control', 'const { control');
replace('apps/web/src/components/items/create-item-dialog.tsx', 'control={_control}', 'control={control}');
replace('apps/web/src/components/items/create-item-dialog.tsx', 'zodResolver(itemSchema) as unknown', 'zodResolver(itemSchema) as any');

// 8. item-overrides-dialog.tsx
replace('apps/web/src/components/items/item-overrides-dialog.tsx', 'const parLevel = (data as {}).overrideParLevel;', 'const parLevel = (data as any).overrideParLevel;');
replace('apps/web/src/components/items/item-overrides-dialog.tsx', 'const isActive = (data as {}).overrideActive;', 'const isActive = (data as any).overrideActive;');
replace('apps/web/src/components/items/item-overrides-dialog.tsx', 'item: unknown', 'item: any');
replace('apps/web/src/components/items/item-overrides-dialog.tsx', '(item as {}).name', '(item as any).name');

// 9. uom-conversion-dialog.tsx
replace('apps/web/src/components/items/uom-conversion-dialog.tsx', 'const currentInventoryUom = (item as {}).inventoryUom;', 'const currentInventoryUom = (item as any).inventoryUom;');
replace('apps/web/src/components/items/uom-conversion-dialog.tsx', 'item: unknown', 'item: any');

// 10. create-po-dialog.tsx
replace('apps/web/src/components/procurement/create-po-dialog.tsx', '.reduce((acc: unknown', '.reduce((acc: any');

// 11. create-vendor-dialog.tsx
replace('apps/web/src/components/procurement/create-vendor-dialog.tsx', 'data: unknown', 'data: any');

