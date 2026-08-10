const fs = require('fs');
let code = fs.readFileSync('src/logic5.ts', 'utf8');

// Replace SK print table header
code = code.replace(
  '<th style="border: 1px solid #111; padding: 8px; text-align: left; width: 100px; font-weight: bold;">Bidang</th>',
  '<th style="border: 1px solid #111; padding: 8px; text-align: left; width: 80px; font-weight: bold;">Bidang</th>'
);

// Replace Tembusan print table header
code = code.replace(
  '<th style="border: 1px solid #111; padding: 8px; text-align: left; width: 80px; font-weight: bold;">Unit</th>\n            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 100px; font-weight: bold;">Bidang</th>',
  '<th style="border: 1px solid #111; padding: 8px; text-align: left; width: 60px; font-weight: bold;">Unit</th>\n            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 80px; font-weight: bold;">Bidang</th>'
);

// Replace Arsip print table header
code = code.replace(
  '<th style="border: 1px solid #111; padding: 8px; text-align: left; width: 100px; font-weight: bold;">Bidang</th>\n            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 120px; font-weight: bold;">Kategori</th>',
  '<th style="border: 1px solid #111; padding: 8px; text-align: left; width: 80px; font-weight: bold;">Bidang</th>\n            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 100px; font-weight: bold;">Kategori</th>'
);

fs.writeFileSync('src/logic5.ts', code);
