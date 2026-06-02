const fs = require('fs');
let content = fs.readFileSync('AGENTS.md', 'utf8');

if (!content.includes('/ — Operations Dashboard')) {
  content = content.replace('### UI Views\n- `/reports`', '### UI Views\n- `/` — Operations Dashboard (Command Center with Par Alerts, Pending Deliveries, Open Counts, Recent Imports)\n- `/reports`');
  fs.writeFileSync('AGENTS.md', content);
  console.log('Patched AGENTS.md');
} else {
  console.log('AGENTS.md already patched');
}
