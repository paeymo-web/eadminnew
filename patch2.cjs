const fs = require('fs');
let code = fs.readFileSync('src/logic5.ts', 'utf8');

const dispOld = `            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 40px; font-weight: bold;">#</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 150px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 100px; font-weight: bold;">Tgl Diterima</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 160px; font-weight: bold;">Pengirim</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; font-weight: bold;">Perihal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 180px; font-weight: bold;">Disposisi Ke</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 90px; font-weight: bold;">Status</th>`;

const dispNew = `            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 30px; font-weight: bold;">#</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 140px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 80px; font-weight: bold;">Tgl Diterima</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 140px; font-weight: bold;">Pengirim</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; font-weight: bold;">Perihal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 150px; font-weight: bold;">Disposisi Ke</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 75px; font-weight: bold;">Status</th>`;

code = code.replace(dispOld, dispNew);
fs.writeFileSync('src/logic5.ts', code);
