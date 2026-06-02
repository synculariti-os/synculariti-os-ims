const fs = require('fs');
const execSync = require('child_process').execSync;

// 1. Fix restaurant-selector.tsx
let p = 'apps/web/src/components/auth/restaurant-selector.tsx';
if (fs.existsSync(p)) {
  let text = fs.readFileSync(p, 'utf8');
  // move handleSelect above useEffect
  // Actually, we can just change `const handleSelect = async ...` to `async function handleSelect(...)`
  text = text.replace(/const handleSelect = async \(([^)]*)\) => {/g, 'async function handleSelect($1) {');
  fs.writeFileSync(p, text);
}

// 2. Fix create-po-dialog.tsx
p = 'apps/web/src/components/procurement/create-po-dialog.tsx';
if (fs.existsSync(p)) {
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/const fetchData = async \(\) => {/g, 'async function fetchData() {');
  fs.writeFileSync(p, text);
}

// 3. Fix quick-create-po-dialog.tsx
p = 'apps/web/src/components/procurement/quick-create-po-dialog.tsx';
if (fs.existsSync(p)) {
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/const fetchVendors = async \(\) => {/g, 'async function fetchVendors() {');
  fs.writeFileSync(p, text);
}

// 4. Fix sales-import.spec.tsx parsing error (remove empty import)
p = 'apps/web/src/components/sales/__tests__/sales-import.spec.tsx';
if (fs.existsSync(p)) {
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/import from '@testing-library\/user-event';/g, '');
  fs.writeFileSync(p, text);
}

// 5. Fix recipes-table.tsx and mappings-tab.tsx by adding fetchRecipes etc to useCallback
// Actually, just change eslint-disable-next-line to cover the hook
