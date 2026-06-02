const fs = require('fs');
let p = 'src/common/interceptors/__tests__/audit.interceptor.spec.ts';
if (fs.existsSync(p)) {
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/} catch \(_e\) \{\s*}/g, '} catch (_e) { /* ignore */ }');
  fs.writeFileSync(p, text);
}
