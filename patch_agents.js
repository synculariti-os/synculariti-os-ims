const fs = require('fs');
const file = 'AGENTS.md';
let code = fs.readFileSync(file, 'utf8');

// Update ItemMaster
code = code.replace(
  /\| \`item_restaurant_overrides\` \| CRUD \|/,
  `| \`item_restaurant_overrides\` | CRUD |
| *New Phase 16* | \`items\` now stores \`allergens\` and macros (calories, protein, fat, carbs) |`
);

// Update Recipe Agent
code = code.replace(
  /\`getRecipeForItem\(itemId\)\` → recipe with ingredients \(consumed by Reporting\)/,
  `\`getRecipeForItem(itemId)\` → recipe with ingredients (consumed by Reporting)
- \`getNutrition(recipeId, restaurantId)\` → rolls up macros and allergens from all constituent raw ingredients (consumed by Frontend Recipe Table)`
);

fs.writeFileSync(file, code);
