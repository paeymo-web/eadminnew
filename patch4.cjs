const fs = require('fs');
let code = fs.readFileSync('src/markup.ts', 'utf8');

const ttbOld = '<th>#</th><th>NO. SURAT</th><th>TGL SURAT & INPUT</th><th style="width: 80px;">UNIT</th><th style="width: 80px;">BIDANG</th><th>TUJUAN</th><th>PERIHAL</th><th>FILE</th><th style="text-align:right;">AKSI</th>';
const ttbNew = '<th style="width: 30px;">#</th><th style="width: 140px;">NO. SURAT</th><th style="width: 100px;">TGL SURAT & INPUT</th><th style="width: 70px;">UNIT</th><th style="width: 100px;">BIDANG</th><th style="width: 15%;">TUJUAN</th><th style="width: 30%;">PERIHAL</th><th>FILE</th><th style="text-align:right;">AKSI</th>';

const skOld = '<th>#</th><th>NO. SURAT</th><th>TANGGAL</th><th style="width: 80px;">BIDANG</th><th>TUJUAN</th><th>PERIHAL</th><th>STATUS</th><th style="text-align:right;">AKSI</th>';
const skNew = '<th style="width: 30px;">#</th><th style="width: 150px;">NO. SURAT</th><th style="width: 80px;">TANGGAL</th><th style="width: 100px;">BIDANG</th><th style="width: 15%;">TUJUAN</th><th style="width: 35%;">PERIHAL</th><th>STATUS</th><th style="text-align:right;">AKSI</th>';

const arsipOld = '<th>#</th><th>NO. SURAT</th><th>TANGGAL</th><th style="width: 80px;">BIDANG</th><th style="width: 100px;">KATEGORI</th><th>PERIHAL</th><th>FILE CLOUD</th><th style="text-align:right;">AKSI</th>';
const arsipNew = '<th style="width: 30px;">#</th><th style="width: 150px;">NO. SURAT</th><th style="width: 80px;">TANGGAL</th><th style="width: 100px;">BIDANG</th><th style="width: 120px;">KATEGORI</th><th style="width: 40%;">PERIHAL</th><th>FILE CLOUD</th><th style="text-align:right;">AKSI</th>';

code = code.replace(ttbOld, ttbNew);
code = code.replace(skOld, skNew);
code = code.replace(arsipOld, arsipNew);

fs.writeFileSync('src/markup.ts', code);
