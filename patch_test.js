const fs = require('fs');
const file = 'apps/api/src/inventory/__tests__/inventory-transfer.service.spec.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import { InventoryTransferService } from '\.\.\/\.\.\/inventory-transfer.service';/g, "import { InventoryTransferService } from '../inventory-transfer.service';");
code = code.replace(/import { IInventoryTransferService, INVENTORY_TRANSFER_SERVICE_TOKEN } from '\.\.\/\.\.\/interfaces\/i-inventory-transfer.service';/g, "import { IInventoryTransferService, INVENTORY_TRANSFER_SERVICE_TOKEN } from '../interfaces/i-inventory-transfer.service';");
code = code.replace(/import { ILedgerService, LEDGER_SERVICE_TOKEN } from '\.\.\/\.\.\/interfaces\/i-ledger.service';/g, "import { ILedgerService, LEDGER_SERVICE_TOKEN } from '../interfaces/i-ledger.service';");
code = code.replace(/import { tenantContext } from '\.\.\.\/\.\.\.\/common\/context\/tenant.context';/g, "import { tenantContext } from '../../common/context/tenant.context';");

fs.writeFileSync(file, code);
