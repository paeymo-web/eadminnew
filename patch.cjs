const fs = require('fs');
let code = fs.readFileSync('src/logic5.ts', 'utf8');

// Replace SK table
const skOld = `    tableHTML = \`
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 40px; font-weight: bold;">#</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 160px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 100px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 180px; font-weight: bold;">Tujuan</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; font-weight: bold;">Perihal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 95px; font-weight: bold;">Status</th>
          </tr>
        </thead>
        <tbody>
          \${data.length === 0 ? '<tr><td colspan="6" style="border: 1px solid #111; padding: 12px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => \`
            <tr style="background-color: \${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 8px;">\${w.escapeHTML(x.to)}</td>
              <td style="border: 1px solid #111; padding: 8px; line-height: 1.4;">\${w.escapeHTML(x.hl)}</td>
              <td style="border: 1px solid #111; padding: 8px; text-align: center; font-weight: bold;">
                \${w.cleanSt(x.st).includes('Dibagikan') ? 'Dibagikan' : (w.cleanSt(x.st).includes('Selesai') ? 'Selesai' : 'Proses')}
              </td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;`;

const skNew = `    tableHTML = \`
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 30px; font-weight: bold;">#</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 140px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 80px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 100px; font-weight: bold;">Bidang</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 130px; font-weight: bold;">Tujuan</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; font-weight: bold;">Perihal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 75px; font-weight: bold;">Status</th>
          </tr>
        </thead>
        <tbody>
          \${data.length === 0 ? '<tr><td colspan="7" style="border: 1px solid #111; padding: 12px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => \`
            <tr style="background-color: \${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 8px;">\${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td>
              <td style="border: 1px solid #111; padding: 8px;">\${w.escapeHTML(x.to)}</td>
              <td style="border: 1px solid #111; padding: 8px; line-height: 1.4;">\${w.escapeHTML(x.hl)}</td>
              <td style="border: 1px solid #111; padding: 8px; text-align: center; font-weight: bold;">
                \${w.cleanSt(x.st).includes('Dibagikan') ? 'Dibagikan' : (w.cleanSt(x.st).includes('Selesai') ? 'Selesai' : 'Proses')}
              </td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;`;

// Replace Tembusan table
const tbOld = `    tableHTML = \`
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 40px; font-weight: bold;">#</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 160px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 100px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 140px; font-weight: bold;">Unit</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 180px; font-weight: bold;">Tujuan</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; font-weight: bold;">Perihal</th>
          </tr>
        </thead>
        <tbody>
          \${data.length === 0 ? '<tr><td colspan="6" style="border: 1px solid #111; padding: 12px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => \`
            <tr style="background-color: \${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.unit)}</td>
              <td style="border: 1px solid #111; padding: 8px;">\${w.escapeHTML(x.to)}</td>
              <td style="border: 1px solid #111; padding: 8px; line-height: 1.4;">\${w.escapeHTML(x.hl)}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;`;

const tbNew = `    tableHTML = \`
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 30px; font-weight: bold;">#</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 140px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 80px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 80px; font-weight: bold;">Unit</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 100px; font-weight: bold;">Bidang</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 130px; font-weight: bold;">Tujuan</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; font-weight: bold;">Perihal</th>
          </tr>
        </thead>
        <tbody>
          \${data.length === 0 ? '<tr><td colspan="7" style="border: 1px solid #111; padding: 12px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => \`
            <tr style="background-color: \${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.unit)}</td>
              <td style="border: 1px solid #111; padding: 8px;">\${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td>
              <td style="border: 1px solid #111; padding: 8px;">\${w.escapeHTML(x.to)}</td>
              <td style="border: 1px solid #111; padding: 8px; line-height: 1.4;">\${w.escapeHTML(x.hl)}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;`;

const arsipOld = `    tableHTML = \`
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 40px; font-weight: bold;">#</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 180px; font-weight: bold;">No. Dokumen</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 100px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 150px; font-weight: bold;">Kategori</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; font-weight: bold;">Perihal</th>
          </tr>
        </thead>
        <tbody>
          \${data.length === 0 ? '<tr><td colspan="5" style="border: 1px solid #111; padding: 12px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => \`
            <tr style="background-color: \${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.kat)}</td>
              <td style="border: 1px solid #111; padding: 8px; line-height: 1.4;">\${w.escapeHTML(x.hl)}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;`;

const arsipNew = `    tableHTML = \`
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 30px; font-weight: bold;">#</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 140px; font-weight: bold;">No. Dokumen</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: center; width: 80px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 100px; font-weight: bold;">Bidang</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; width: 120px; font-weight: bold;">Kategori</th>
            <th style="border: 1px solid #111; padding: 8px; text-align: left; font-weight: bold;">Perihal</th>
          </tr>
        </thead>
        <tbody>
          \${data.length === 0 ? '<tr><td colspan="6" style="border: 1px solid #111; padding: 12px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => \`
            <tr style="background-color: \${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 8px; text-align: center;">\${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 8px;">\${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td>
              <td style="border: 1px solid #111; padding: 8px; font-weight: bold;">\${w.escapeHTML(x.kat)}</td>
              <td style="border: 1px solid #111; padding: 8px; line-height: 1.4;">\${w.escapeHTML(x.hl)}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;`;

code = code.replace(skOld, skNew);
code = code.replace(tbOld, tbNew);
code = code.replace(arsipOld, arsipNew);

fs.writeFileSync('src/logic5.ts', code);
console.log('Patched tables in logic5.ts');
