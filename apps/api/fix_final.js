const fs = require('fs');

// 1. ledger-entry.dto.ts
let p = 'src/inventory/dto/ledger-entry.dto.ts';
if (fs.existsSync(p)) {
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  lines = lines.map(line => line.includes('import') && line.includes('LEDGER_REASON_CODES') ? '' : line);
  fs.writeFileSync(p, lines.join('\n'));
}

// 2. sales.service.spec.ts
p = 'src/sales/__tests__/sales.service.spec.ts';
if (fs.existsSync(p)) {
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  lines = lines.map(line => line.includes('import') && (line.includes('ISalesRepository') || line.includes('SupabaseClient')) ? '' : line);
  fs.writeFileSync(p, lines.join('\n'));
}

// 3. sales-parsers.spec.ts
p = 'src/sales/parsers/sales-parsers.spec.ts';
if (fs.existsSync(p)) {
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  lines = lines.map(line => line.includes('import') && line.includes('path') ? '' : line);
  fs.writeFileSync(p, lines.join('\n'));
}

// 4. audit.interceptor.spec.ts
p = 'src/common/interceptors/__tests__/audit.interceptor.spec.ts';
if (fs.existsSync(p)) {
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  let newLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('} catch (_e) {')) {
      // It's an empty block statement. Let's just put a comment inside.
      newLines.push(lines[i]);
      newLines.push('      // ignore error');
    } else {
      newLines.push(lines[i]);
    }
  }
  fs.writeFileSync(p, newLines.join('\n'));
}
