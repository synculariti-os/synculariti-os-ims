const fs = require('fs');
const file = 'SYMBOLS.md';
let code = fs.readFileSync(file, 'utf8');

const entry = `
### \`RecipeNutritionReport\` (Interface)
**Path:** \`packages/types/src/domain/recipe.ts\`
**Description:** Nutrition block containing rolled-up macros and allergens for a recipe.

### \`GET /recipes/:id/nutrition\` (Endpoint)
**Path:** \`apps/api/src/recipe/recipe.controller.ts\`
**Description:** Rolls up base yield nutrition by iterating through \`expandBOM\` items.
`;

code = code.replace(/## Recipes \/ BOM/g, '## Recipes / BOM' + entry);
fs.writeFileSync(file, code);
