const fs = require('fs');
const path = require('path');

const replaceInFile = (relPath, replacements) => {
  const fullPath = path.join('/Users/yoki/Workspace/Code/synculariti-os-ims', relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const r of replacements) {
    if (content.includes(r.from)) {
      content = content.replace(new RegExp(r.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), r.to);
    } else {
      console.warn(`WARNING: "${r.from}" not found in ${relPath}`);
    }
  }
  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${relPath}`);
};

replaceInFile('apps/api/src/inventory/inventory-transfer.controller.ts', [
  { from: 'transferId as any', to: "transferId as import('@ims/types').InventoryTransferId" }
]);

replaceInFile('apps/api/src/inventory/waste.service.ts', [
  { from: 'itemId: dto.itemId as any,', to: 'itemId: dto.itemId as import(\'@ims/types\').ItemId,' }
]);

replaceInFile('apps/api/src/inventory/inventory-count.repository.ts', [
  { from: 'status: row.status as any,', to: "status: row.status as 'OPEN' | 'CLOSED' | 'CANCELLED'," },
  { from: 'status: status as any,', to: "status: status as 'OPEN' | 'CLOSED' | 'CANCELLED'," }
]);

replaceInFile('apps/api/src/inventory/prep.controller.ts', [
  { from: 'parseInt(limit as any, 10)', to: 'parseInt(limit as string, 10)' },
  { from: 'parseInt(offset as any, 10)', to: 'parseInt(offset as string, 10)' }
]);

replaceInFile('apps/api/src/inventory/waste.controller.ts', [
  { from: 'parseInt(limit as any, 10)', to: 'parseInt(limit as string, 10)' },
  { from: 'parseInt(offset as any, 10)', to: 'parseInt(offset as string, 10)' }
]);

replaceInFile('apps/api/src/inventory/inventory-transfer.service.ts', [
  { from: 'trx as any', to: 'trx as import(\'@ims/types\').Transaction' }
]);

replaceInFile('apps/api/src/inventory/ledger.repository.ts', [
  { from: 'id: randomUUID() as any,', to: "id: randomUUID() as import('@ims/types').LedgerEntryId," },
  { from: 'reason_code: entry.reason_code as any,', to: "reason_code: entry.reason_code as import('@ims/types').LedgerReasonCode," }
]);

replaceInFile('apps/api/src/inventory/prep.service.ts', [
  { from: 'itemId: dto.prepItemId as any,', to: "itemId: dto.prepItemId as import('@ims/types').ItemId," },
  { from: 'itemId: ing.itemId as any,', to: "itemId: ing.itemId as import('@ims/types').ItemId," },
  { from: 'prepItemId: dto.itemId as any,', to: "prepItemId: dto.itemId as import('@ims/types').ItemId," }
]);
