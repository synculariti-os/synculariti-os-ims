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

// 1. Fix auth.service.ts
replaceInFile('apps/api/src/auth/auth.service.ts', [
  { from: 'export const SUPABASE_ADMIN_CLIENT = SUPABASE_ADMIN_CLIENT;\n', to: '' }
]);

// 2. Fix response.interceptor.ts
replaceInFile('apps/api/src/common/interceptors/response.interceptor.ts', [
  { from: 'const { success, ...rest } = data as Record<string, unknown>;', to: 'const { success, ...rest } = data as Record<string, unknown>;' },
  { from: 'return rest;', to: 'return rest as Response<T>;' }
]);

// 3. Fix inventory-count.repository.ts
replaceInFile('apps/api/src/inventory/inventory-count.repository.ts', [
  { from: "status: row.status as 'OPEN' | 'CLOSED' | 'CANCELLED',", to: "status: row.status as 'OPEN' | 'CLOSED'," },
  { from: "status: status as 'OPEN' | 'CLOSED' | 'CANCELLED',", to: "status: status as 'OPEN' | 'CLOSED'," }
]);

// 4. Fix inventory-transfer.controller.ts
replaceInFile('apps/api/src/inventory/inventory-transfer.controller.ts', [
  { from: "transferId as import('@ims/types').InventoryTransferId", to: 'transferId' },
  { from: "transferId as import('@ims/types').InventoryTransferId", to: 'transferId' },
  { from: "transferId as import('@ims/types').InventoryTransferId", to: 'transferId' }
]);

// 5. Fix inventory-transfer.service.ts
replaceInFile('apps/api/src/inventory/inventory-transfer.service.ts', [
  { from: "trx as import('@ims/types').Transaction", to: "trx as import('kysely').Transaction<import('@ims/types').Database>" },
  { from: "trx as import('@ims/types').Transaction", to: "trx as import('kysely').Transaction<import('@ims/types').Database>" },
  { from: "trx as import('@ims/types').Transaction", to: "trx as import('kysely').Transaction<import('@ims/types').Database>" }
]);

// 6. Fix prep.controller.ts
replaceInFile('apps/api/src/inventory/prep.controller.ts', [
  { from: 'parseInt(limit as string, 10)', to: 'typeof limit === "string" ? parseInt(limit, 10) : limit' },
  { from: 'parseInt(offset as string, 10)', to: 'typeof offset === "string" ? parseInt(offset, 10) : offset' }
]);

// 7. Fix waste.controller.ts
replaceInFile('apps/api/src/inventory/waste.controller.ts', [
  { from: 'parseInt(limit as string, 10)', to: 'typeof limit === "string" ? parseInt(limit, 10) : limit' },
  { from: 'parseInt(offset as string, 10)', to: 'typeof offset === "string" ? parseInt(offset, 10) : offset' }
]);

console.log('Fixed');
