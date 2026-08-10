const fs = require('fs');
let code = fs.readFileSync('src/markup.ts', 'utf8');

const dispOld = '<th>#</th><th>NO. SURAT</th><th>TANGGAL</th><th>PENGIRIM</th><th>PERIHAL</th><th>DISPOSISI KE</th><th>STATUS</th><th style="text-align:right;">AKSI</th>';
const dispNew = '<th style="width: 30px;">#</th><th style="width: 150px;">NO. SURAT</th><th style="width: 80px;">TANGGAL</th><th style="width: 15%;">PENGIRIM</th><th style="width: 30%;">PERIHAL</th><th style="width: 15%;">DISPOSISI KE</th><th>STATUS</th><th style="text-align:right;">AKSI</th>';

code = code.replace(dispOld, dispNew);

fs.writeFileSync('src/markup.ts', code);
