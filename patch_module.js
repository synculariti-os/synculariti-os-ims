const fs = require('fs');
const file = 'apps/api/src/inventory/inventory.module.ts';
let code = fs.readFileSync(file, 'utf8');

code = `import { InventoryTransferService } from './inventory-transfer.service';\nimport { INVENTORY_TRANSFER_SERVICE_TOKEN } from './interfaces/i-inventory-transfer.service';\nimport { InventoryTransferController } from './inventory-transfer.controller';\n` + code;

code = code.replace(
  /controllers: \[InventoryController, InventoryCountController, WasteController, PrepController\]/,
  'controllers: [InventoryController, InventoryCountController, WasteController, PrepController, InventoryTransferController]'
);

code = code.replace(
  /provide: LEDGER_SERVICE_TOKEN,/,
  `provide: INVENTORY_TRANSFER_SERVICE_TOKEN,\n      useClass: InventoryTransferService,\n    },\n    {\n      provide: LEDGER_SERVICE_TOKEN,`
);

code = code.replace(
  /exports: \[/,
  'exports: [INVENTORY_TRANSFER_SERVICE_TOKEN, '
);

fs.writeFileSync(file, code);
