const fs = require('fs');
const file = '/Users/yoki/.gemini/antigravity-ide/brain/2fbeb8cd-0907-4132-99ff-84c1073d7a9b/implementation_plan.md';
let code = fs.readFileSync(file, 'utf8');

// I'll trim the plan
code = `# Phase 16: Allergen / Nutritional Data (COMPLETED)

All tasks for Phase 16 have been executed successfully.
- Added database migration for nutrition columns
- Updated \`@ims/types\` and validators
- Updated ItemMaster API endpoints and database mapping
- Added \`GET /recipes/:id/nutrition\` endpoint to RecipeModule
- Updated \`CreateItemDialog\` and \`EditItemDialog\` in UI to accept dietary info
- Integrated macro and allergen roll-ups dynamically in the Recipe Detail view.

Documentation updated. No pending tasks for Phase 16.
`;

fs.writeFileSync(file, code);

const file2 = '/Users/yoki/.gemini/antigravity-ide/brain/2fbeb8cd-0907-4132-99ff-84c1073d7a9b/task.md';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/\[ \]/g, '[x]').replace(/\[\/\]/, '[x]');
fs.writeFileSync(file2, code2);
