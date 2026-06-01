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

// 1. Fix response.interceptor.ts
replaceInFile('apps/api/src/common/interceptors/response.interceptor.ts', [
  { from: 'return rest as Response<T>;', to: 'return rest as unknown as Response<T>;' }
]);

// 2. Fix inventory-transfer.controller.ts
replaceInFile('apps/api/src/inventory/inventory-transfer.controller.ts', [
  { from: 'return this.transferService.dispatchTransfer(user.restaurantId, transferId);', to: 'return this.transferService.dispatchTransfer(user.restaurantId, transferId as import(\'@ims/types\').TransferId);' },
  { from: 'return this.transferService.receiveTransfer(user.restaurantId, transferId);', to: 'return this.transferService.receiveTransfer(user.restaurantId, transferId as import(\'@ims/types\').TransferId);' },
  { from: 'return this.transferService.cancelTransfer(user.restaurantId, transferId);', to: 'return this.transferService.cancelTransfer(user.restaurantId, transferId as import(\'@ims/types\').TransferId);' }
]);

console.log('Fixed');
