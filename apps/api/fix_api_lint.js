const fs = require('fs');
const data = JSON.parse(fs.readFileSync('api_eslint_report.json', 'utf8'));

for (const fileData of data) {
  if (!fileData.messages || fileData.messages.length === 0) continue;
  
  let lines = fs.readFileSync(fileData.filePath, 'utf8').split('\n');
  let modified = false;

  const messages = [...fileData.messages].sort((a, b) => b.line - a.line);

  for (const msg of messages) {
    const lineIdx = msg.line - 1;
    let line = lines[lineIdx];

    if (msg.ruleId === '@typescript-eslint/no-unused-vars') {
      const match = msg.message.match(/'([^']+)'/);
      if (match) {
        const varName = match[1];
        if (line.includes('import')) {
          const re = new RegExp(`\\b${varName}\\b\\s*,?\\s*`);
          lines[lineIdx] = line.replace(re, '');
          lines[lineIdx] = lines[lineIdx].replace(/{\s*}/g, '');
          if (lines[lineIdx].trim().startsWith('import') && lines[lineIdx].trim().endsWith('from')) {
            lines[lineIdx] = '';
          }
          modified = true;
        } else {
            lines[lineIdx] = line.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);
            modified = true;
        }
      }
    } else if (msg.ruleId === 'prefer-const') {
        lines[lineIdx] = line.replace('let ', 'const ');
        modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fileData.filePath, lines.join('\n'));
  }
}
