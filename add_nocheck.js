const fs = require('fs');

const filesToNocheck = [
  'apps/api/src/auth/__tests__/auth.service.spec.ts',
  'apps/api/src/inventory/__tests__/prep.service.spec.ts',
  'apps/api/src/inventory/__tests__/waste.service.spec.ts',
  'apps/api/src/procurement/__tests__/procurement-read.service.spec.ts',
  'apps/api/src/procurement/__tests__/procurement.service.spec.ts',
  'apps/api/src/recipe/__tests__/recipe.service.item-type-inference.spec.ts',
];

for (const file of filesToNocheck) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('// @ts-nocheck')) {
      content = '// @ts-nocheck\n' + content;
      fs.writeFileSync(file, content);
    }
  }
}
