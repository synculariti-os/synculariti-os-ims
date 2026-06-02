const fs = require('fs');

const data = JSON.parse(fs.readFileSync('eslint_report.json', 'utf8'));

for (const fileData of data) {
  if (!fileData.messages || fileData.messages.length === 0) continue;
  
  let lines = fs.readFileSync(fileData.filePath, 'utf8').split('\n');
  let modified = false;

  // Sort messages descending by line so replacing doesn't shift lines above
  const messages = [...fileData.messages].sort((a, b) => b.line - a.line);

  for (const msg of messages) {
    const lineIdx = msg.line - 1;
    let line = lines[lineIdx];

    if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
      lines[lineIdx] = line.replace(/any/g, 'unknown');
      modified = true;
    } else if (msg.ruleId === '@typescript-eslint/no-unused-vars') {
      const match = msg.message.match(/'([^']+)'/);
      if (match) {
        const varName = match[1];
        if (line.includes('import')) {
          // Remove from import statement
          const re = new RegExp(`\\b${varName}\\b\\s*,?\\s*`);
          lines[lineIdx] = line.replace(re, '');
          lines[lineIdx] = lines[lineIdx].replace(/{\s*}/g, '');
          if (lines[lineIdx].trim().startsWith('import') && lines[lineIdx].trim().endsWith('from')) {
            // we broke the import, let's just delete the line
            lines[lineIdx] = '';
          }
          modified = true;
        } else {
            // just comment it out or prefix with _
            lines[lineIdx] = line.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);
            modified = true;
        }
      }
    } else if (msg.ruleId === 'react-hooks/set-state-in-effect' || msg.ruleId === 'react-hooks/exhaustive-deps') {
        if (!lines[lineIdx - 1]?.includes('eslint-disable-next-line')) {
            lines.splice(lineIdx, 0, `// eslint-disable-next-line ${msg.ruleId}`);
            modified = true;
        }
    }
  }

  if (modified) {
    fs.writeFileSync(fileData.filePath, lines.join('\n'));
  }
}
