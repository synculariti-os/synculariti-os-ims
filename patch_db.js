const fs = require('fs');
const file = 'packages/types/src/database.types.ts';
let code = fs.readFileSync(file, 'utf8');

// Match the items table and replace ONLY inside it
code = code.replace(
  /items: {[\s\S]*?updated_at: Generated<string>;/,
  match => match + `\n    allergens: Generated<string[]>;\n    calories_per_uom: Generated<number>;\n    protein_grams: Generated<number>;\n    fat_grams: Generated<number>;\n    carbs_grams: Generated<number>;`
);

fs.writeFileSync(file, code);
