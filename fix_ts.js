const fs = require('fs');
const cp = require('child_process');

try {
  cp.execSync('npx tsc --noEmit', { cwd: 'apps/web', stdio: 'pipe' });
} catch (e) {
  const output = e.stdout.toString();
  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.match(/^src\/(.+?)\((\d+),(\d+)\): error (.+)$/);
    if (match) {
      const file = 'apps/web/src/' + match[1];
      const lineNum = parseInt(match[2], 10) - 1;
      const colNum = parseInt(match[3], 10);
      const errMsg = match[4];
      
      if (!fs.existsSync(file)) continue;
      let textLines = fs.readFileSync(file, 'utf8').split('\n');
      let tline = textLines[lineNum];
      
      if (errMsg.includes("'err' is of type 'unknown'") || errMsg.includes("'error' is of type 'unknown'")) {
        // Find .message
        if (tline.includes('err.message')) {
          tline = tline.replace('err.message', '(err as Error).message');
        } else if (tline.includes('error.message')) {
          tline = tline.replace('error.message', '(error as Error).message');
        } else if (tline.includes('error')) {
            // maybe console.error(error)
        }
      }
      
      // I will just cast `unknown` back to `any` for `catch (err: unknown)`
      for (let i = 0; i < textLines.length; i++) {
        if (textLines[i].includes('catch (err: unknown)')) {
          textLines[i] = textLines[i].replace('catch (err: unknown)', 'catch (err: any)');
        }
        if (textLines[i].includes('catch (error: unknown)')) {
          textLines[i] = textLines[i].replace('catch (error: unknown)', 'catch (error: any)');
        }
      }
      
      textLines[lineNum] = tline;
      fs.writeFileSync(file, textLines.join('\n'));
    }
  }
}
