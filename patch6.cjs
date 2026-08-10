const fs = require('fs');
let code = fs.readFileSync('src/markup.ts', 'utf8');

const dashTembOld = '<th>Unit</th><th>No. Surat</th><th>Kepada</th><th>Perihal</th><th>Tgl Surat / Input</th>';
const dashTembNew = '<th style="width: 70px;">Unit</th><th style="width: 140px;">No. Surat</th><th style="width: 20%;">Kepada</th><th style="width: 35%;">Perihal</th><th>Tgl Surat / Input</th>';

const dashDispOld = '<th>No. Surat</th><th style="width: 25%;">Pengirim</th><th>Perihal</th><th>Status</th>';
const dashDispNew = '<th style="width: 150px;">No. Surat</th><th style="width: 25%;">Pengirim</th><th style="width: 40%;">Perihal</th><th>Status</th>';

code = code.replace(dashTembOld, dashTembNew);
code = code.replace(dashDispOld, dashDispNew);

fs.writeFileSync('src/markup.ts', code);
