const fs = require('fs');
const file = '/Users/yoki/.gemini/antigravity-ide/brain/2fbeb8cd-0907-4132-99ff-84c1073d7a9b/task.md';
let code = fs.readFileSync(file, 'utf8');

const newTask = `
- [ ] Phase 17: Inventory Transfers
  - [ ] Define \`InventoryTransfer\` types in \`@ims/types\`
  - [ ] Define validators for creating/dispatching/receiving in \`@ims/validators\`
  - [ ] Write immutable tests for \`TransferService\` (Red Phase)
  - [ ] Define interface for \`ITransferService\` and \`ITransferRepository\`
  - [ ] Implement \`TransferService\` and \`TransferRepository\` (Green Phase)
  - [ ] Implement \`InventoryTransferController\`
  - [ ] Add Transfer UI pages in \`apps/web\` (\`/inventory/transfers\`)
`;

code = code + newTask;
fs.writeFileSync(file, code);
