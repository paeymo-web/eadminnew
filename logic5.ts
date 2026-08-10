const w = window as any;

w.executeDelete = async () => {
  const table = w.deleteTargetTable;
  const id = w.deleteTargetId;
  w.closeModal('modDelete');
  if (!table || !id) return;
  w.toggleLoading(true, 'Menghapus data...');
  setTimeout(async () => {
    let nameForLog = '';
    if (table === 'Disposisi') {
      const idx = w.disposisiData.findIndex((x: any) => x.id == id);
      if (idx > -1) { nameForLog = w.disposisiData[idx].no; w.disposisiData.splice(idx, 1); }
      w.renderDisposisi();
    } else if (table === 'SuratKeluar') {
      const idx = w.suratKeluarData.findIndex((x: any) => x.id == id);
      if (idx > -1) { nameForLog = w.suratKeluarData[idx].no; w.suratKeluarData.splice(idx, 1); }
      w.renderSuratKeluar();
    } else if (table === 'Tembusan') {
      const idx = w.tembusanData.findIndex((x: any) => x.id == id);
      if (idx > -1) { nameForLog = w.tembusanData[idx].no; w.tembusanData.splice(idx, 1); }
      w.renderTembusan();
    } else if (table === 'Arsip') {
      const idx = w.arsipData.findIndex((x: any) => x.id == id);
      if (idx > -1) { nameForLog = w.arsipData[idx].no; w.arsipData.splice(idx, 1); }
      w.renderArsip();
    }
    w.updateDashboardStats();
    if (w.saveAllToLocal) w.saveAllToLocal();
    await w.dbQuery('delete', table, { id: id });
    w.recordLog('DELETE', table, `Menghapus dokumen: ${nameForLog}`);
    w.toggleLoading(false);
    w.showToast('Data berhasil dihapus', 'ok');
  }, 300);
};

// --- PAGINATION & VIEW NAVIGATION ---
w.renderPagination = (containerId: string, totalItems: number, currentPage: number, moduleKey: string, limit = w.itemsPerPage) => {
  const el = document.getElementById(containerId);
  if (!el) return;
  const totalPages = Math.ceil(totalItems / limit);
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  let html = `<button class="btn bg2 bxs" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changePage('${moduleKey}', ${currentPage - 1})"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="btn bxs ${currentPage === i ? 'bp2' : 'bg2'}" onclick="window.changePage('${moduleKey}', ${i})">${i}</button>`;
    } else if (i === 2 || i === totalPages - 1) {
      html += `<span style="color:var(--tm);padding:0 4px;">...</span>`;
    }
  }
  html += `<button class="btn bg2 bxs" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changePage('${moduleKey}', ${currentPage + 1})"><i data-lucide="chevron-right" style="width:14px;height:14px;"></i></button>`;
  el.innerHTML = html;
  w.safeCreateIcons();
};

w.changePage = (moduleKey: string, page: number) => {
  w.playUISound('pop');
  if (moduleKey === 'disposisi') { w.currentPageD = page; w.renderDisposisi(); }
  else if (moduleKey === 'sk') { w.currentPageSK = page; w.renderSuratKeluar(); }
  else if (moduleKey === 'tembusan') { w.currentPageT = page; w.renderTembusan(); }
  else if (moduleKey === 'arsip') { w.currentPageArsip = page; w.renderArsip(); }
  else if (moduleKey === 'log') { w.currentPageLog = page; w.renderLog(); }
};

// --- DISPOSISI ---
w.renderDisposisi = () => {
  let data = [...w.disposisiData];
  const q = (document.querySelector('#pg-disposisi .sri') as any)?.value?.toLowerCase() || '';
  const stFilter = (document.getElementById('f_d_st') as any)?.value || '';
  const dStart = (document.getElementById('f_d_start') as any)?.value || '';
  const dEnd = (document.getElementById('f_d_end') as any)?.value || '';

  if (q) data = data.filter((x: any) => (x.no || '').toLowerCase().includes(q) || (x.fr || '').toLowerCase().includes(q) || (x.hl || '').toLowerCase().includes(q));
  if (stFilter) data = data.filter((x: any) => w.cleanSt(x.st).includes(stFilter));
  if (dStart) data = data.filter((x: any) => x.tgl_t >= dStart);
  if (dEnd) data = data.filter((x: any) => x.tgl_t <= dEnd);

  const total = data.length;
  const sIdx = (w.currentPageD - 1) * w.itemsPerPage;
  const pData = data.slice(sIdx, sIdx + w.itemsPerPage);

  const ct = document.getElementById('dCt');
  if (ct) ct.textContent = `Menampilkan ${total === 0 ? 0 : sIdx + 1}-${Math.min(sIdx + w.itemsPerPage, total)} dari ${total} data`;

  const tb = document.getElementById('dTb');
  if (tb) {
    if (pData.length === 0) {
      tb.innerHTML = `<tr><td colspan="8"><div class="empty-state-wrap"><img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Inbox%20tray/3D/inbox_tray_3d.png" class="empty-state-img"><div class="empty-state-t">Data tidak ditemukan</div><div class="empty-state-s">Coba sesuaikan kata kunci atau filter pencarian Anda.</div></div></td></tr>`;
    } else {
      tb.innerHTML = pData.map((x: any, idx: number) => {
        let isSel = w.cleanSt(x.st).includes('Selesai');
        let statusBadge = isSel ? `<span class="bdg bd">Selesai</span>` : `<span class="bdg bp">Pending</span>`;
        return `<tr><td data-label="#">${sIdx + idx + 1}</td><td data-label="No. Surat" style="font-weight:700;color:var(--tp);">${w.escapeHTML(x.no)}</td><td data-label="Tanggal"><span style="font-size:11.5px;color:var(--tm);font-weight:700;"><i data-lucide="calendar" class="lucide-xs"></i> ${w.formatDate(x.tgl_t)}</span></td><td data-label="Pengirim" class="text-wrap" style="font-weight:600;">${w.escapeHTML(x.fr)}</td><td data-label="Perihal" class="text-wrap">${w.escapeHTML(x.hl)}</td><td data-label="Disposisi Ke" class="text-wrap" style="font-weight:700;color:var(--a1);">${x.to ? w.escapeHTML(x.to) : '—'}</td><td data-label="Status">${statusBadge}</td><td data-label="Aksi" style="text-align:right;"><div style="display:inline-flex;gap:6px;"><button class="btn bg2 bxs" onclick="window.viewDisposisi(${x.id})" title="Detail Surat"><i data-lucide="eye" style="width:14px;height:14px;"></i></button><button class="btn bg2 bxs" onclick="window.openPreviewDisposisi(${x.id})" title="Pratinjau Lembar Disposisi" style="border-color:var(--a1);color:var(--a1);"><i data-lucide="file-search" style="width:14px;height:14px;"></i></button><button class="btn bg2 bxs" onclick="window.cloneDoc('Disposisi', ${x.id})" title="Duplikasi"><i data-lucide="copy" style="width:14px;height:14px;"></i></button><button class="btn bg2 bxs admin-only" onclick="window.editDisposisi(${x.id})" title="Ubah"><i data-lucide="edit-3" style="width:14px;height:14px;"></i></button><button class="btn bd2 bxs admin-only" onclick="window.confirmDelete('Disposisi', ${x.id})" title="Hapus"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button></div></td></tr>`;
      }).join('');
    }
  }
  w.renderPagination('dPg', total, w.currentPageD, 'disposisi');
  w.safeCreateIcons();
};

w.filterDisposisi = () => { w.currentPageD = 1; w.renderDisposisi(); };

w.editDisposisi = (id: any) => {
  w.playUISound('pop');
  w.editModeId = id;
  const item = w.disposisiData.find((x: any) => x.id == id);
  if (!item) return;
  const title = document.getElementById('modDT');
  if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Disposisi';
  
  (document.getElementById('d_no') as any).value = item.no || '';
  (document.getElementById('d_fr') as any).value = item.fr || '';
  (document.getElementById('d_tgl_s') as any).value = item.tgl_s || '';
  (document.getElementById('d_tgl_t') as any).value = item.tgl_t || '';
  (document.getElementById('d_hl') as any).value = item.hl || '';
  (document.getElementById('d_st') as any).value = w.cleanSt(item.st);
  (document.getElementById('d_ct') as any).value = item.ct || '';

  const dToSel = document.getElementById('d_to') as any;
  const dToCust = document.getElementById('d_to_custom') as any;
  if (dToSel) {
    let optionExists = false;
    for (let i = 0; i < dToSel.options.length; i++) {
      if (dToSel.options[i].value === (item.to || '')) {
        optionExists = true;
        break;
      }
    }
    if (optionExists) {
      dToSel.value = item.to || '';
      if (dToCust) { dToCust.style.display = 'none'; dToCust.value = ''; }
    } else if (item.to) {
      dToSel.value = 'Lainnya';
      if (dToCust) {
        dToCust.style.display = 'block';
        dToCust.value = item.to;
      }
    } else {
      dToSel.value = '';
      if (dToCust) { dToCust.style.display = 'none'; dToCust.value = ''; }
    }
  }
  
  w.toggleHasilDisposisi();
  document.getElementById('modD')?.classList.add('op');
  w.safeCreateIcons();
};

w.saveDisposisi = async () => {
  const no = (document.getElementById('d_no') as any).value.trim();
  const fr = (document.getElementById('d_fr') as any).value.trim();
  const tgl_s = (document.getElementById('d_tgl_s') as any).value;
  const tgl_t = (document.getElementById('d_tgl_t') as any).value;
  const hl = (document.getElementById('d_hl') as any).value.trim();
  const st = (document.getElementById('d_st') as any).value;
  
  if (!no || !fr || !tgl_s || !tgl_t || !hl) return w.showToast('Semua kolom wajib diisi!', 'error');
  
  let fi_url = '';
  const fInput = document.getElementById('d_f') as any;
  if (fInput && fInput.files[0]) {
    fi_url = await w.readFileAsBase64(fInput.files[0]);
  }
  
  let to = '';
  let ct = '';
  let fi_hasil_url = '';
  
  if (w.cleanSt(st).includes('Selesai')) {
    let toVal = (document.getElementById('d_to') as any).value;
    if (toVal === 'Lainnya') toVal = (document.getElementById('d_to_custom') as any).value.trim();
    if (!toVal) return w.showToast('Penerima Disposisi wajib diisi!', 'error');
    to = toVal;
    ct = (document.getElementById('d_ct') as any).value.trim();
    if (!ct) return w.showToast('Catatan Disposisi wajib diisi!', 'error');
    const fHasilInput = document.getElementById('d_f_hasil') as any;
    if (fHasilInput && fHasilInput.files[0]) {
      fi_hasil_url = await w.readFileAsBase64(fHasilInput.files[0]);
    }
    if (!fi_hasil_url && w.editModeId) {
      const existing = w.disposisiData.find((x: any) => x.id == w.editModeId);
      if (existing) fi_hasil_url = existing.fi_hasil_url || '';
    }
    if (!fi_hasil_url && !w.editModeId) return w.showToast('Scan Bukti ACC wajib diunggah!', 'error');
  }
  
  w.toggleLoading(true, 'Menyimpan data...');
  setTimeout(async () => {
    let targetId = w.editModeId ? w.editModeId : Date.now();
    const payload: any = {
      id: targetId,
      no, fr, tgl_s, tgl_t, hl, st, to, ct,
      fi_url: fi_url || (w.editModeId ? w.disposisiData.find((x: any) => x.id == w.editModeId)?.fi_url || '' : ''),
      fi_hasil_url
    };
    
    if (w.editModeId) {
      const idx = w.disposisiData.findIndex((x: any) => x.id == w.editModeId);
      if (idx > -1) w.disposisiData[idx] = payload;
      w.showToast('Disposisi diperbarui', 'ok');
      w.recordLog('UPDATE', 'Disposisi', `Mengedit disposisi: ${no}`);
    } else {
      w.disposisiData.unshift(payload);
      w.showToast('Disposisi disimpan', 'ok');
      w.recordLog('CREATE', 'Disposisi', `Menambahkan disposisi baru: ${no}`);
    }
    w.clearDraft('D');
    w.closeModal('modD');
    w.updateDashboardStats();
    w.renderDisposisi();
    if (w.saveAllToLocal) w.saveAllToLocal();
    try {
      const saved = await w.dbQuery('save', 'Disposisi', payload);
      if (saved) {
        const idx = w.disposisiData.findIndex((x: any) => x.id == targetId);
        if (idx > -1) {
          w.disposisiData[idx] = saved;
          w.renderDisposisi();
          if (w.saveAllToLocal) w.saveAllToLocal();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      w.toggleLoading(false);
    }
  }, 300);
};

w.viewDisposisi = (id: any) => {
  w.playUISound('pop');
  const item = w.disposisiData.find((x: any) => x.id == id);
  if (!item) return;
  
  const safeSetText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '—';
  };
  safeSetText('vd_no', item.no);
  safeSetText('vd_fr', item.fr);
  safeSetText('vd_tgl_s', w.formatDate(item.tgl_s));
  safeSetText('vd_tgl_t', w.formatDate(item.tgl_t));
  safeSetText('vd_hl', item.hl);
  
  const lampBtn = document.getElementById('vd_lamp_btn');
  const lampLink = document.getElementById('vd_lamp_link') as any;
  if (lampBtn && lampLink) {
    if (item.fi_url) {
      lampLink.href = 'javascript:void(0)';
      lampLink.onclick = () => w.openAttachment(item.fi_url);
      lampBtn.style.display = 'block';
    } else {
      lampBtn.style.display = 'none';
    }
  }
  
  const hSection = document.getElementById('vd_hasil_section');
  const hLink = document.getElementById('vd_hasil_link') as any;
  const hBtn = document.getElementById('vd_hasil_btn');
  if (hSection) {
    if (w.cleanSt(item.st).includes('Selesai')) {
      hSection.style.display = 'block';
      safeSetText('vd_st', item.st);
      safeSetText('vd_to', item.to);
      safeSetText('vd_ct', item.ct);
      if (item.fi_hasil_url && hLink && hBtn) {
        hLink.href = 'javascript:void(0)';
        hLink.onclick = () => w.openAttachment(item.fi_hasil_url);
        hBtn.style.display = 'block';
      } else if (hBtn) {
        hBtn.style.display = 'none';
      }
    } else {
      hSection.style.display = 'none';
    }
  }
  
  const editBtn = document.getElementById('btnEditDTop');
  if (editBtn) editBtn.setAttribute('onclick', `window.closeModal('modViewD'); window.editDisposisi(${item.id});`);
  const shareBtn = document.getElementById('btnShareDTop');
  if (shareBtn) shareBtn.setAttribute('onclick', `window.shareDriveLink('Disposisi', ${item.id});`);
  const previewBtn = document.getElementById('btnPreviewDTop');
  if (previewBtn) previewBtn.setAttribute('onclick', `window.openPreviewDisposisi(${item.id});`);
  const ctkBtn = document.getElementById('btnCetakDisposisiTop');
  if (ctkBtn) ctkBtn.setAttribute('onclick', `window.printDisposisi(${item.id});`);
  const jpgBtn = document.getElementById('btnDownloadJPGTop');
  if (jpgBtn) jpgBtn.setAttribute('onclick', `window.downloadJPG(${item.id});`);
  
  document.getElementById('modViewD')?.classList.add('op');
  w.safeCreateIcons();
};

w.openPreviewDisposisi = (id: any) => {
  w.playUISound('pop');
  const item = w.setupPrintArea(id);
  if (!item) return;

  const printArea = document.getElementById('printArea');
  const previewContent = document.getElementById('previewDisposisiContent');
  if (printArea && previewContent) {
    previewContent.innerHTML = printArea.innerHTML;
    const clonedEls = previewContent.querySelectorAll('[id]');
    clonedEls.forEach((el) => {
      el.removeAttribute('id');
    });
  }

  const prnBtn = document.getElementById('btnPreviewPrint');
  if (prnBtn) prnBtn.setAttribute('onclick', `window.printDisposisi(${id});`);
  
  const jpgBtn = document.getElementById('btnPreviewJPG');
  if (jpgBtn) jpgBtn.setAttribute('onclick', `window.downloadJPG(${id});`);

  document.getElementById('modPreviewDisposisi')?.classList.add('op');
  w.safeCreateIcons();
};

w.setupPrintArea = (id: any) => {
  const item = w.disposisiData.find((x: any) => x.id == id);
  if (!item) return null;
  
  const safeSetText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = text || '—';
  };
  safeSetText('pr_tgl_t', w.formatDate(item.tgl_t));
  safeSetText('pr_fr', item.fr);
  safeSetText('pr_no', item.no);
  safeSetText('pr_tgl_s', w.formatDate(item.tgl_s));
  safeSetText('pr_hl', item.hl);

  // Determine if recipient is manual (custom) or predefined
  const isCustomTo = item.to && !w.jabatanData.some((j: any) => j.nama === item.to);
  let notesHTML = '';
  if (isCustomTo) {
    notesHTML += `<div style="margin-bottom: 10px; padding: 8px 10px; background-color: #f9fafb; border: 1px dashed #ccc; border-radius: 4px; font-family: 'Arial Narrow', Arial, sans-serif; font-size: 12pt; color: #000;">`;
    notesHTML += `<strong>Disposisi Kepada (Tulis Manual):</strong> ${w.escapeHTML(item.to)}`;
    notesHTML += `</div>`;
  }
  notesHTML += `<div style="white-space: pre-wrap; font-family: 'Arial Narrow', Arial, sans-serif; font-size: 12pt; line-height: 1.5; color: #000;">${w.escapeHTML(item.ct || '—')}</div>`;
  safeSetText('pr_ct', notesHTML);
  
  const printHistory = document.getElementById('printHistory');
  if (printHistory) {
    printHistory.textContent = `Dicetak otomatis oleh E-Admin LPIS pada ${new Date().toLocaleString('id-ID')} WIB`;
  }
  
  const qrBox = document.getElementById('printQrBox');
  if (qrBox) {
    qrBox.innerHTML = '';
    try {
      let qrText = `LPIS_DISP_${item.id}`;
      if (item.fi_url && item.fi_url.startsWith('http')) {
        qrText = item.fi_url;
      }
      new (window as any).QRCode(qrBox, {
        text: qrText,
        width: 60,
        height: 60,
        correctLevel: 1
      });
    } catch (e) {
      console.warn('QRCode error:', e);
    }
  }

  // Dynamically render the recipient positions table from master data
  const prToTable = document.getElementById('pr_to_table');
  if (prToTable) {
    prToTable.innerHTML = w.jabatanData.map((j: any) => `
      <tr>
        <td style="font-family: 'Arial Narrow', Arial, sans-serif; font-size: 11pt; padding: 4px 6px; border: 1px solid #000 !important; color: #000;">${w.escapeHTML(j.nama)}</td>
        <td data-role="${w.escapeHTML(j.nama)}" style="width: 30px !important; text-align: center !important; font-weight: bold !important; font-family: 'Arial Narrow', Arial, sans-serif; font-size: 11pt; padding: 4px 6px; border: 1px solid #000 !important; color: #000;"></td>
      </tr>
    `).join('');
  }
  
  const cells = document.querySelectorAll('#pr_to_table td[data-role]');
  cells.forEach((td: any) => {
    const role = td.getAttribute('data-role');
    td.textContent = (item.to && item.to.toLowerCase() === role.toLowerCase()) ? 'V' : '';
  });

  // Dynamic checkmark for "Diproses/ditindaklanjuti" column based on status (not Pending)
  const isiProsesEl = document.getElementById('pr_isi_proses');
  if (isiProsesEl) {
    const isPending = !item.st || item.st.toLowerCase().includes('pending');
    isiProsesEl.textContent = isPending ? '' : 'V';
  }
  
  return item;
};

w.printDisposisi = (id: any) => {
  w.playUISound('pop');
  const item = w.setupPrintArea(id);
  if (!item) return;

  // Dynamic page style injection for setting A5 portrait with proper margins
  let styleEl = document.getElementById('dynamic-print-style') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-style';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `@page { size: A5 portrait !important; margin: 8mm !important; }`;

  document.body.classList.add('print-disposisi-mode');

  const cleanup = () => {
    document.body.classList.remove('print-disposisi-mode');
    if (styleEl) styleEl.innerHTML = '';
  };
  window.addEventListener('afterprint', cleanup, { once: true });

  setTimeout(() => {
    window.print();
    setTimeout(cleanup, 1000);
  }, 250);
};

w.downloadJPG = (id: any) => {
  w.playUISound('pop');
  const item = w.setupPrintArea(id);
  if (!item) return;
  
  w.toggleLoading(true, 'Menghasilkan lembar JPG...');
  
  const wrapper = document.getElementById('printAreaWrapper');
  if (wrapper) {
    wrapper.style.display = 'block';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = '800px';
    wrapper.style.zIndex = '-9999';
    wrapper.style.background = '#fff';
  }
  
  setTimeout(() => {
    const el = document.getElementById('printArea');
    if (el && (window as any).html2canvas) {
      (window as any).html2canvas(el, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        width: 800,
        windowWidth: 800,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0
      }).then((canvas: any) => {
        const link = document.createElement('a');
        link.download = `Lembar_Disposisi_${w.safeName(item.no)}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        
        if (wrapper) {
          wrapper.style.display = '';
          wrapper.style.position = '';
          wrapper.style.left = '';
          wrapper.style.top = '';
          wrapper.style.width = '';
          wrapper.style.zIndex = '';
          wrapper.style.background = '';
        }
        
        w.toggleLoading(false);
        w.showToast('Lembar Disposisi berhasil diunduh!', 'ok');
      }).catch((e: any) => {
        if (wrapper) {
          wrapper.style.display = '';
          wrapper.style.position = '';
          wrapper.style.left = '';
          wrapper.style.top = '';
          wrapper.style.width = '';
          wrapper.style.zIndex = '';
          wrapper.style.background = '';
        }
        w.toggleLoading(false);
        w.showToast('Gagal mengubah lembar ke gambar.', 'error');
      });
    } else {
      if (wrapper) {
        wrapper.style.display = '';
        wrapper.style.position = '';
        wrapper.style.left = '';
        wrapper.style.top = '';
        wrapper.style.width = '';
        wrapper.style.zIndex = '';
        wrapper.style.background = '';
      }
      w.toggleLoading(false);
      w.showToast('Pustaka html2canvas tidak ditemukan.', 'error');
    }
  }, 10);
};

w.printRekap = (moduleKey: string) => {
  w.playUISound('pop');
  let title = '';
  let count = 0;
  let tableHTML = '';
  let dStart = '';
  let dEnd = '';

  if (moduleKey === 'disposisi') {
    title = 'LAPORAN REKAPITULASI SURAT MASUK & DISPOSISI';
    let data = [...w.disposisiData];
    const q = (document.querySelector('#pg-disposisi .sri') as any)?.value?.toLowerCase() || '';
    const stFilter = (document.getElementById('f_d_st') as any)?.value || '';
    dStart = (document.getElementById('f_d_start') as any)?.value || '';
    dEnd = (document.getElementById('f_d_end') as any)?.value || '';

    if (q) data = data.filter((x: any) => (x.no || '').toLowerCase().includes(q) || (x.fr || '').toLowerCase().includes(q) || (x.hl || '').toLowerCase().includes(q));
    if (stFilter) data = data.filter((x: any) => w.cleanSt(x.st).includes(stFilter));
    if (dStart) data = data.filter((x: any) => x.tgl_t >= dStart);
    if (dEnd) data = data.filter((x: any) => x.tgl_t <= dEnd);
    
    count = data.length;

    tableHTML = `
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; line-height: 1.15; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 35px; font-weight: bold;">No</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 130px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 80px; font-weight: bold;">Tgl Diterima</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 130px; font-weight: bold;">Pengirim</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; font-weight: bold;">Perihal</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 140px; font-weight: bold;">Disposisi Ke</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 65px; font-weight: bold;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.length === 0 ? '<tr><td colspan="7" style="border: 1px solid #111; padding: 10px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => `
            <tr style="background-color: ${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; font-weight: bold;">${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center;">${w.formatDate(x.tgl_t)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px;">${w.escapeHTML(x.fr)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; line-height: 1.15;">${w.escapeHTML(x.hl)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; font-weight: bold;">${x.to ? w.escapeHTML(x.to) : '—'}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center; font-weight: bold; color: ${w.cleanSt(x.st).includes('Selesai') ? '#10b981' : '#f59e0b'};">
                ${w.cleanSt(x.st).includes('Selesai') ? 'Selesai' : 'Pending'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (moduleKey === 'sk') {
    title = 'LAPORAN REKAPITULASI SURAT KELUAR';
    let data = [...w.suratKeluarData];
    const q = (document.querySelector('#pg-sk .sri') as any)?.value?.toLowerCase() || '';
    const stFilter = (document.getElementById('f_sk_st') as any)?.value || '';
    dStart = (document.getElementById('f_sk_start') as any)?.value || '';
    dEnd = (document.getElementById('f_sk_end') as any)?.value || '';

    if (q) data = data.filter((x: any) => (x.no || '').toLowerCase().includes(q) || (x.to || '').toLowerCase().includes(q) || (x.hl || '').toLowerCase().includes(q));
    if (stFilter) data = data.filter((x: any) => w.cleanSt(x.st).includes(stFilter));
    if (dStart) data = data.filter((x: any) => x.tgl >= dStart);
    if (dEnd) data = data.filter((x: any) => x.tgl <= dEnd);
    
    count = data.length;

    tableHTML = `
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; line-height: 1.15; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 35px; font-weight: bold;">No</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 130px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 80px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 130px; font-weight: bold;">Bidang</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 150px; font-weight: bold;">Tujuan</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; font-weight: bold;">Perihal</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 65px; font-weight: bold;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.length === 0 ? '<tr><td colspan="7" style="border: 1px solid #111; padding: 10px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => `
            <tr style="background-color: ${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; font-weight: bold;">${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center;">${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px;">${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td>
              <td style="border: 1px solid #111; padding: 5px 6px;">${w.escapeHTML(x.to)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; line-height: 1.15;">${w.escapeHTML(x.hl)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center; font-weight: bold;">
                ${w.cleanSt(x.st).includes('Dibagikan') ? 'Dibagikan' : (w.cleanSt(x.st).includes('Selesai') ? 'Selesai' : 'Proses')}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (moduleKey === 'tembusan') {
    title = 'LAPORAN REKAPITULASI TEMBUSAN SURAT';
    let data = [...w.tembusanData];
    const q = (document.querySelector('#pg-tembusan .sri') as any)?.value?.toLowerCase() || '';
    dStart = (document.getElementById('f_t_start') as any)?.value || '';
    dEnd = (document.getElementById('f_t_end') as any)?.value || '';
    const unitFilter = (document.getElementById('f_t_unit') as any)?.value || '';

    if (w.currentUser && w.currentUser.role !== 'admin' && w.currentUser.role !== 'pimpinan') {
      data = data.filter((x: any) => x.unit === w.currentUser.name);
    } else if (unitFilter) {
      data = data.filter((x: any) => x.unit === unitFilter);
    }

    if (q) data = data.filter((x: any) => (x.no || '').toLowerCase().includes(q) || (x.to || '').toLowerCase().includes(q) || (x.hl || '').toLowerCase().includes(q) || (x.unit || '').toLowerCase().includes(q));
    if (dStart) data = data.filter((x: any) => x.tgl >= dStart);
    if (dEnd) data = data.filter((x: any) => x.tgl <= dEnd);
    
    count = data.length;

    tableHTML = `
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; line-height: 1.15; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 35px; font-weight: bold;">No</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 130px; font-weight: bold;">No. Surat</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 80px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 75px; font-weight: bold;">Unit</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 130px; font-weight: bold;">Bidang</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 150px; font-weight: bold;">Tujuan</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; font-weight: bold;">Perihal</th>
          </tr>
        </thead>
        <tbody>
          ${data.length === 0 ? '<tr><td colspan="7" style="border: 1px solid #111; padding: 10px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => `
            <tr style="background-color: ${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; font-weight: bold;">${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center;">${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; font-weight: bold;">${w.escapeHTML(x.unit)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px;">${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td>
              <td style="border: 1px solid #111; padding: 5px 6px;">${w.escapeHTML(x.to)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; line-height: 1.15;">${w.escapeHTML(x.hl)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (moduleKey === 'arsip') {
    title = 'LAPORAN REKAPITULASI ARSIP DOKUMEN';
    let data = [...w.arsipData];
    const q = (document.querySelector('#pg-arsip .sri') as any)?.value?.toLowerCase() || '';
    const katFilter = (document.getElementById('f_a_kat') as any)?.value || '';
    dStart = (document.getElementById('f_a_start') as any)?.value || '';
    dEnd = (document.getElementById('f_a_end') as any)?.value || '';

    if (q) data = data.filter((x: any) => (x.no || '').toLowerCase().includes(q) || (x.hl || '').toLowerCase().includes(q));
    if (katFilter) data = data.filter((x: any) => x.kat === katFilter);
    if (dStart) data = data.filter((x: any) => x.tgl >= dStart);
    if (dEnd) data = data.filter((x: any) => x.tgl <= dEnd);
    
    count = data.length;

    tableHTML = `
      <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; line-height: 1.15; border: 1px solid #111; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 35px; font-weight: bold;">No</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 130px; font-weight: bold;">No. Dokumen</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: center; width: 80px; font-weight: bold;">Tanggal</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 130px; font-weight: bold;">Bidang</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; width: 140px; font-weight: bold;">Kategori</th>
            <th style="border: 1px solid #111; padding: 6px; text-align: left; font-weight: bold;">Perihal</th>
          </tr>
        </thead>
        <tbody>
          ${data.length === 0 ? '<tr><td colspan="6" style="border: 1px solid #111; padding: 10px; text-align: center; font-style: italic;">Tidak ada data ditemukan</td></tr>' : data.map((x: any, idx: number) => `
            <tr style="background-color: ${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; font-weight: bold;">${w.escapeHTML(x.no)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; text-align: center;">${w.formatDate(x.tgl)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px;">${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; font-weight: bold;">${w.escapeHTML(x.kat)}</td>
              <td style="border: 1px solid #111; padding: 5px 6px; line-height: 1.15;">${w.escapeHTML(x.hl)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const formatDateId = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  let periodeStr = 'Semua Periode';
  if (dStart && dEnd) {
    periodeStr = `${formatDateId(dStart)} s.d ${formatDateId(dEnd)}`;
  } else if (dStart) {
    periodeStr = `Sejak ${formatDateId(dStart)}`;
  } else if (dEnd) {
    periodeStr = `S.d ${formatDateId(dEnd)}`;
  }

  const html = `
    <div class="rekap-print-wrapper" style="width: 100%; max-width: 100%; margin: 0; padding: 0; box-sizing: border-box; background: #fff; color: #000;">
      
      <!-- Kop Surat -->
      <div class="rekap-header-kop" style="display: flex; align-items: center; border-bottom: 4px double #000; padding-bottom: 12px; margin-bottom: 15px; font-family: 'Times New Roman', Times, serif; width: 100%; box-sizing: border-box;">
        <img src="https://i.ibb.co/HTKMs1Q7/LPI-3-10-New.png" style="width: 75px; height: 75px; object-fit: contain; margin-left: 15px; margin-right: 15px;" alt="Logo LPIS">
        <div style="flex: 1; text-align: center; margin-right: 105px;">
          <h1 style="font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Yayasan Lembaga Pendidikan Islam (LPI) Sabilillah Malang</h1>
          <h2 style="font-size: 18px; font-weight: 800; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">E-ADMINISTRASI LPI Sabilillah Malang (E-ADMIN LPIS)</h2>
          <p style="font-size: 11px; margin: 3px 0 0 0; font-style: italic;">Jl. Terusan Piranha Atas No. 135, Kota Malang, Jawa Timur | Telp: (0341) 400995 | Email: admin@sekolahsabilillah.sch.id</p>
        </div>
      </div>

      <!-- Judul Laporan -->
      <div style="text-align: center; margin-bottom: 15px; font-family: 'Times New Roman', Times, serif;">
        <h3 style="font-size: 15px; font-weight: bold; margin: 0; text-transform: uppercase; text-decoration: underline;">${title}</h3>
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-top: 10px; border-bottom: 1px solid #111; padding-bottom: 5px;">
          <div><strong>Periode Laporan:</strong> ${periodeStr}</div>
          <div><strong>Total Data:</strong> ${count} Baris</div>
          <div><strong>Dicetak Pada:</strong> ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <!-- Tabel Data -->
      ${tableHTML}

      <!-- Tanda Tangan -->
      <div style="margin-top: 30px; display: flex; justify-content: flex-end; font-family: 'Times New Roman', Times, serif; font-size: 12px; page-break-inside: avoid;">
        <div style="width: 250px; text-align: center;">
          <p style="margin: 0;">Malang, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 5px 0 60px 0; font-weight: bold; text-transform: uppercase;">Kepala LPIS Sabilillah Malang</p>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">................................................</p>
          <p style="margin: 2px 0 0 0; font-size: 10px; color: #555;">NIP. ....................................</p>
        </div>
      </div>

    </div>
  `;
  
  const rekapArea = document.getElementById('printRekapArea');
  if (rekapArea) {
    rekapArea.innerHTML = html;
  }
  
  // Dynamic page style injection for perfectly setting A4 landscape with custom margins
  let styleEl = document.getElementById('dynamic-print-style') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-style';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `@page { size: A4 landscape !important; margin: 15mm !important; }`;
  
  document.body.classList.add('print-rekap-mode');
  
  const cleanup = () => {
    document.body.classList.remove('print-rekap-mode');
    if (styleEl) styleEl.innerHTML = ''; // reset page style
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  
  setTimeout(() => { 
    window.print(); 
    setTimeout(cleanup, 1000);
  }, 250);
};

// --- SURAT KELUAR ---
w.generateNoSK = () => {
  const tglInput = document.getElementById('sk_tgl') as any;
  const bdgInput = document.getElementById('sk_bdg') as any;
  const skNoInput = document.getElementById('sk_no') as any;
  if (!tglInput || !bdgInput || !skNoInput) return;
  
  const tgl = tglInput.value;
  const bdg = bdgInput.value;
  if (!tgl || !bdg) { skNoInput.value = ''; return; }
  
  const d = new Date(tgl);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const y = d.getFullYear();
  
  let nextNumInt = 1;

  if (w.editModeId) {
    const item = w.suratKeluarData.find((x: any) => x.id == w.editModeId);
    if (item && item.tgl === tgl && typeof item.no === 'string') {
      const parts = item.no.split('/');
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) nextNumInt = num;
      }
    } else {
      const existingNums = w.suratKeluarData
        .filter((x: any) => x.tgl === tgl && typeof x.no === 'string' && x.id !== w.editModeId)
        .map((x: any) => {
          const parts = x.no.split('/');
          return parts.length > 1 ? (parseInt(parts[1], 10) || 0) : 0;
        });
      if (existingNums.length > 0) nextNumInt = Math.max(...existingNums) + 1;
    }
  } else {
    const existingNums = w.suratKeluarData
      .filter((x: any) => x.tgl === tgl && typeof x.no === 'string')
      .map((x: any) => {
        const parts = x.no.split('/');
        return parts.length > 1 ? (parseInt(parts[1], 10) || 0) : 0;
      });
    if (existingNums.length > 0) nextNumInt = Math.max(...existingNums) + 1;
  }
  
  const nextNum = String(nextNumInt).padStart(2, '0');
  skNoInput.value = `${dd}.${mm}/${nextNum}/IV.1/${bdg}/${y}`;
};

w.renderSuratKeluar = () => {
  let data = [...w.suratKeluarData];
  const q = (document.querySelector('#pg-sk .sri') as any)?.value?.toLowerCase() || '';
  const stFilter = (document.getElementById('f_sk_st') as any)?.value || '';
  const bdgFilter = (document.getElementById('f_sk_bdg') as any)?.value || '';
  const dStart = (document.getElementById('f_sk_start') as any)?.value || '';
  const dEnd = (document.getElementById('f_sk_end') as any)?.value || '';

  if (q) data = data.filter((x: any) => (x.no || '').toLowerCase().includes(q) || (x.to || '').toLowerCase().includes(q) || (x.hl || '').toLowerCase().includes(q));
  if (stFilter) data = data.filter((x: any) => w.cleanSt(x.st).includes(stFilter));
  if (bdgFilter) data = data.filter((x: any) => x.bdg === bdgFilter);
  if (dStart) data = data.filter((x: any) => x.tgl >= dStart);
  if (dEnd) data = data.filter((x: any) => x.tgl <= dEnd);

  const total = data.length;
  const sIdx = (w.currentPageSK - 1) * w.itemsPerPage;
  const pData = data.slice(sIdx, sIdx + w.itemsPerPage);

  const ct = document.getElementById('skCt');
  if (ct) ct.textContent = `Menampilkan ${total === 0 ? 0 : sIdx + 1}-${Math.min(sIdx + w.itemsPerPage, total)} dari ${total} data`;

  const tb = document.getElementById('skTb');
  if (tb) {
    if (pData.length === 0) {
      tb.innerHTML = `<tr><td colspan="8"><div class="empty-state-wrap"><img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Outbox%20tray/3D/outbox_tray_3d.png" class="empty-state-img"><div class="empty-state-t">Data tidak ditemukan</div></div></td></tr>`;
    } else {
      tb.innerHTML = pData.map((x: any, idx: number) => {
        let isSel = w.cleanSt(x.st).includes('Selesai');
        let isDibagikan = w.cleanSt(x.st).includes('Dibagikan');
        let statusBadge = isDibagikan ? `<span class="bdg bd" style="background:rgba(16,185,129,.1);color:#059669;">Dibagikan</span>` : (isSel ? `<span class="bdg bd">Selesai</span>` : `<span class="bdg bp">Proses</span>`);

        return `<tr><td data-label="#">${sIdx + idx + 1}</td><td data-label="No. Surat" style="font-weight:700;color:var(--tp);">${w.escapeHTML(x.no)}</td><td data-label="Tanggal"><span style="font-size:11.5px;color:var(--tm);font-weight:700;"><i data-lucide="calendar" class="lucide-xs"></i> ${w.formatDate(x.tgl)}</span></td><td data-label="Bidang" class="text-wrap">${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td><td data-label="Tujuan" class="text-wrap" style="font-weight:600;">${w.escapeHTML(x.to)}</td><td data-label="Perihal" class="text-wrap">${w.escapeHTML(x.hl)}</td><td data-label="Status">${statusBadge}</td><td data-label="Aksi" style="text-align:right;"><div style="display:inline-flex;gap:6px;"><button class="btn bg2 bxs" onclick="window.viewSuratKeluar(${x.id})"><i data-lucide="eye" style="width:14px;height:14px;"></i></button><button class="btn bg2 bxs" onclick="window.cloneDoc('SuratKeluar', ${x.id})" title="Duplikasi"><i data-lucide="copy" style="width:14px;height:14px;"></i></button><button class="btn bg2 bxs admin-only" onclick="window.editSuratKeluar(${x.id})"><i data-lucide="edit-3" style="width:14px;height:14px;"></i></button><button class="btn bd2 bxs admin-only" onclick="window.confirmDelete('SuratKeluar', ${x.id})"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button></div></td></tr>`;
      }).join('');
    }
  }

  w.renderPagination('skPg', total, w.currentPageSK, 'sk');
  w.safeCreateIcons();
};

w.filterSuratKeluar = () => { w.currentPageSK = 1; w.renderSuratKeluar(); };

w.editSuratKeluar = (id: any) => {
  w.playUISound('pop');
  w.editModeId = id;
  const item = w.suratKeluarData.find((x: any) => x.id == id);
  if (!item) return;
  w.populateBidangDropdown();
  w.populatePejabatDropdown();
  w.populateJenisSuratDropdown();
  
  const title = document.getElementById('modSKT');
  if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Surat Keluar';
  
  (document.getElementById('sk_tgl') as any).value = item.tgl || '';
  (document.getElementById('sk_bdg') as any).value = item.bdg || '';
  (document.getElementById('sk_no') as any).value = item.no || '';
  (document.getElementById('sk_to') as any).value = item.to || '';
  (document.getElementById('sk_hl') as any).value = item.hl || '';
  (document.getElementById('sk_ttd') as any).value = item.ttd || '';
  (document.getElementById('sk_j') as any).value = item.j || 'Surat Dinas';
  (document.getElementById('sk_st') as any).value = w.cleanSt(item.st);
  
  w.toggleSKAcc();
  document.getElementById('modSK')?.classList.add('op');
  w.safeCreateIcons();
};

w.copyNoSurat = () => {
  const v = (document.getElementById('copyNoSkVal') as any).value;
  navigator.clipboard.writeText(v).then(() => {
    w.showToast('🔗 Nomor surat berhasil disalin!', 'ok');
  });
};

w.saveSuratKeluar = async () => {
  const tgl = (document.getElementById('sk_tgl') as any).value;
  const bdg = (document.getElementById('sk_bdg') as any).value;
  const no = (document.getElementById('sk_no') as any).value.trim();
  const to = (document.getElementById('sk_to') as any).value.trim();
  const hl = (document.getElementById('sk_hl') as any).value.trim();
  const ttd = (document.getElementById('sk_ttd') as any).value;
  const j = (document.getElementById('sk_j') as any).value;
  const st = (document.getElementById('sk_st') as any).value;
  
  if (!tgl || !bdg || !no || !to || !hl || !ttd) return w.showToast('Semua kolom bertanda bintang wajib diisi!', 'error');
  
  let fi_url = '';
  const fInput = document.getElementById('sk_f') as any;
  if (fInput && fInput.files[0]) fi_url = await w.readFileAsBase64(fInput.files[0]);
  
  let fi_acc_url = '';
  if (w.cleanSt(st).includes('Selesai') || w.cleanSt(st).includes('Dibagikan')) {
    const fAcc = document.getElementById('sk_f_acc') as any;
    if (fAcc && fAcc.files[0]) fi_acc_url = await w.readFileAsBase64(fAcc.files[0]);
    if (!fi_acc_url && w.editModeId) {
      const existing = w.suratKeluarData.find((x: any) => x.id == w.editModeId);
      if (existing) fi_acc_url = existing.fi_acc_url || '';
    }
    if (!fi_acc_url && !w.editModeId) return w.showToast('Lampiran ACC wajib diunggah!', 'error');
  }
  
  w.toggleLoading(true, 'Menyimpan data...');
  setTimeout(async () => {
    let targetId = w.editModeId ? w.editModeId : Date.now();
    const payload: any = {
      id: targetId,
      tgl, bdg, no, to, hl, ttd, j, st,
      fi_url: fi_url || (w.editModeId ? w.suratKeluarData.find((x: any) => x.id == w.editModeId)?.fi_url || '' : ''),
      fi_acc_url
    };
    
    if (w.editModeId) {
      const idx = w.suratKeluarData.findIndex((x: any) => x.id == w.editModeId);
      if (idx > -1) w.suratKeluarData[idx] = payload;
      w.showToast('Surat Keluar diperbarui', 'ok');
      w.recordLog('UPDATE', 'SuratKeluar', `Mengedit Surat Keluar: ${no}`);
    } else {
      w.suratKeluarData.unshift(payload);
      w.showToast('Surat Keluar berhasil disimpan!', 'ok');
      w.recordLog('CREATE', 'SuratKeluar', `Menerbitkan Surat Keluar: ${no}`);
    }
    w.clearDraft('SK');
    w.closeModal('modSK');
    w.updateDashboardStats();
    w.renderSuratKeluar();
    
    if (!w.editModeId) {
      const cNo = document.getElementById('copyNoSkVal') as any;
      if (cNo) cNo.value = no;
      w.openModal('modCopy', 'view');
    }
    if (w.saveAllToLocal) w.saveAllToLocal();
    try {
      const saved = await w.dbQuery('save', 'SuratKeluar', payload);
      if (saved) {
        const idx = w.suratKeluarData.findIndex((x: any) => x.id == targetId);
        if (idx > -1) {
          w.suratKeluarData[idx] = saved;
          w.renderSuratKeluar();
          if (w.saveAllToLocal) w.saveAllToLocal();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      w.toggleLoading(false);
    }
  }, 300);
};

w.viewSuratKeluar = (id: any) => {
  w.playUISound('pop');
  const item = w.suratKeluarData.find((x: any) => x.id == id);
  if (!item) return;
  
  const safeSetText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '—';
  };
  safeSetText('vsk_no', item.no);
  safeSetText('vsk_tgl', w.formatDate(item.tgl));
  safeSetText('vsk_bdg', w.getBdgDisplay(item.bdg));
  safeSetText('vsk_to', item.to);
  safeSetText('vsk_hl', item.hl);
  safeSetText('vsk_j', item.j);
  safeSetText('vsk_ttd', item.ttd);
  safeSetText('vsk_st', item.st);
  
  const dBtn = document.getElementById('vsk_draft_btn');
  const dLink = document.getElementById('vsk_draft_link') as any;
  if (dBtn && dLink) {
    if (item.fi_url) { 
      dLink.href = 'javascript:void(0)'; 
      dLink.onclick = () => w.openAttachment(item.fi_url);
      dBtn.style.display = 'block'; 
    }
    else { dBtn.style.display = 'none'; }
  }
  
  const aBtn = document.getElementById('vsk_acc_btn');
  const aLink = document.getElementById('vsk_acc_link') as any;
  if (aBtn && aLink) {
    if (item.fi_acc_url) { 
      aLink.href = 'javascript:void(0)'; 
      aLink.onclick = () => w.openAttachment(item.fi_acc_url);
      aBtn.style.display = 'block'; 
    }
    else { aBtn.style.display = 'none'; }
  }
  
  const editBtn = document.getElementById('btnEditSKTop');
  if (editBtn) editBtn.setAttribute('onclick', `window.closeModal('modViewSK'); window.editSuratKeluar(${item.id});`);
  const shareBtn = document.getElementById('btnShareSKTop');
  if (shareBtn) shareBtn.setAttribute('onclick', `window.shareDriveLink('SuratKeluar', ${item.id});`);
  
  document.getElementById('modViewSK')?.classList.add('op');
  w.safeCreateIcons();
};

// --- TEMBUSAN ---
w.renderTembusan = () => {
  let data = [...w.tembusanData];
  const q = (document.querySelector('#pg-tembusan .sri') as any)?.value?.toLowerCase() || '';
  const dStart = (document.getElementById('f_t_start') as any)?.value || '';
  const dEnd = (document.getElementById('f_t_end') as any)?.value || '';
  const unitFilter = (document.getElementById('f_t_unit') as any)?.value || '';
  const bdgFilter = (document.getElementById('f_t_bdg') as any)?.value || '';

  if (w.currentUser && w.currentUser.role !== 'admin' && w.currentUser.role !== 'pimpinan') {
    data = data.filter((x: any) => x.unit === w.currentUser.name);
  } else if (unitFilter) {
    data = data.filter((x: any) => x.unit === unitFilter);
  }
  
  if (bdgFilter) data = data.filter((x: any) => x.bdg === bdgFilter);

  if (q) data = data.filter((x: any) => (x.no || '').toLowerCase().includes(q) || (x.to || '').toLowerCase().includes(q) || (x.hl || '').toLowerCase().includes(q) || (x.unit || '').toLowerCase().includes(q));
  if (dStart) data = data.filter((x: any) => x.tgl >= dStart);
  if (dEnd) data = data.filter((x: any) => x.tgl <= dEnd);

  const total = data.length;
  const sIdx = (w.currentPageT - 1) * w.itemsPerPage;
  const pData = data.slice(sIdx, sIdx + w.itemsPerPage);

  const ct = document.getElementById('tTembusanCt');
  if (ct) ct.textContent = `Menampilkan ${total === 0 ? 0 : sIdx + 1}-${Math.min(sIdx + w.itemsPerPage, total)} dari ${total} tembusan`;

  const tb = document.getElementById('tTembusanTb');
  if (tb) {
    if (pData.length === 0) {
      tb.innerHTML = `<tr><td colspan="9"><div class="empty-state-wrap"><img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clipboard/3D/clipboard_3d.png" class="empty-state-img"><div class="empty-state-t">Belum ada tembusan</div></div></td></tr>`;
    } else {
      tb.innerHTML = pData.map((x: any, idx: number) => {
        let flSpan = x.fi_url ? `<a href="javascript:void(0)" onclick="window.openAttachment(window.tembusanData.find(t=>t.id==${x.id}).fi_url)" class="bdg bpr" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="external-link" style="width:11px;height:11px;"></i> Lihat</a>` : '—';
        let actBtns = `<div style="display:inline-flex;gap:6px;"><button class="btn bg2 bxs" onclick="window.viewTembusan(${x.id})"><i data-lucide="eye" style="width:14px;height:14px;"></i></button>`;
        if (w.currentUser && (w.currentUser.role === 'admin' || w.currentUser.name === x.unit)) {
          actBtns += `<button class="btn bg2 bxs" onclick="window.editTembusan(${x.id})"><i data-lucide="edit-3" style="width:14px;height:14px;"></i></button><button class="btn bd2 bxs" onclick="window.confirmDelete('Tembusan', ${x.id})"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>`;
        }
        actBtns += '</div>';

        return `<tr><td data-label="#">${sIdx + idx + 1}</td><td data-label="No. Surat" style="font-weight:700;color:var(--tp);">${w.escapeHTML(x.no)}</td><td data-label="Tgl & Input"><div style="font-size:11px;color:var(--tm);font-weight:700;"><i data-lucide="calendar" class="lucide-xs"></i> ${w.formatDate(x.tgl)}</div><div style="font-size:10px;color:var(--a1);font-weight:700;margin-top:2px;">In: ${w.formatDateTime(x.id)}</div></td><td data-label="Unit" class="text-wrap" style="font-weight:800;color:var(--a1);">${w.escapeHTML(x.unit)}</td><td data-label="Bidang" class="text-wrap">${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td><td data-label="Tujuan" class="text-wrap">${w.escapeHTML(x.to)}</td><td data-label="Perihal" class="text-wrap">${w.escapeHTML(x.hl)}</td><td data-label="File">${flSpan}</td><td data-label="Aksi" style="text-align:right;">${actBtns}</td></tr>`;
      }).join('');
    }
  }

  w.renderPagination('tTembusanPg', total, w.currentPageT, 'tembusan');
  w.safeCreateIcons();
};

w.filterTembusan = () => { w.currentPageT = 1; w.renderTembusan(); };

w.clearTembusanFilter = () => {
  const safeSetVal = (id: string) => {
    const el = document.getElementById(id) as any;
    if (el) el.value = '';
  };
  safeSetVal('f_t_start');
  safeSetVal('f_t_end');
  safeSetVal('f_t_unit');
  const sri = document.querySelector('#pg-tembusan .sri') as any;
  if (sri) sri.value = '';
  w.filterTembusan();
};

w.openModalTembusan = (mode: string) => {
  w.playUISound('pop');
  w.editModeId = null;
  const m = document.getElementById('modTembusan');
  if (!m) return;
  m.querySelectorAll('input:not([type=file]), select').forEach((i: any) => i.tagName === 'SELECT' ? i.selectedIndex = 0 : i.value = '');
  (document.getElementById('t_tgl') as any).value = w.getToday();
  
  const unitSel = document.getElementById('t_unit') as any;
  if (w.currentUser && w.currentUser.role !== 'admin' && w.currentUser.role !== 'pimpinan') {
    if (unitSel) {
      unitSel.value = w.currentUser.name;
      unitSel.disabled = true;
    }
  } else if (unitSel) {
    unitSel.disabled = false;
  }
  
  const title = document.getElementById('modTembusanT');
  if (title) title.innerHTML = '<i data-lucide="plus-circle"></i> Tambah Tembusan';
  
  const fl = document.getElementById('t_fl');
  if (fl) fl.style.display = 'none';
  m.classList.add('op');
  w.safeCreateIcons();
};

w.editTembusan = (id: any) => {
  w.playUISound('pop');
  w.editModeId = id;
  const item = w.tembusanData.find((x: any) => x.id == id);
  if (!item) return;
  
  const title = document.getElementById('modTembusanT');
  if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Tembusan';
  
  const unitSel = document.getElementById('t_unit') as any;
  if (unitSel) {
    unitSel.value = item.unit || '';
    if (w.currentUser && w.currentUser.role !== 'admin' && w.currentUser.role !== 'pimpinan') unitSel.disabled = true;
    else unitSel.disabled = false;
  }
  
  (document.getElementById('t_bdg') as any).value = item.bdg || '';
  (document.getElementById('t_jenis') as any).value = item.jenis || '';
  (document.getElementById('t_tgl') as any).value = item.tgl || '';
  (document.getElementById('t_no') as any).value = item.no || '';
  (document.getElementById('t_to') as any).value = item.to || '';
  (document.getElementById('t_hl') as any).value = item.hl || '';
  
  const fl = document.getElementById('t_fl');
  if (fl) {
    if (item.fi_url) { fl.textContent = 'Selected: Current File'; fl.style.display = 'block'; }
    else { fl.style.display = 'none'; }
  }
  
  document.getElementById('modTembusan')?.classList.add('op');
  w.safeCreateIcons();
};

w.saveTembusan = async () => {
  const unit = (document.getElementById('t_unit') as any).value;
  const bdg = (document.getElementById('t_bdg') as any).value;
  const jenis = (document.getElementById('t_jenis') as any).value.trim();
  const tgl = (document.getElementById('t_tgl') as any).value;
  const no = (document.getElementById('t_no') as any).value.trim();
  const to = (document.getElementById('t_to') as any).value.trim();
  const hl = (document.getElementById('t_hl') as any).value.trim();
  
  if (!unit || !tgl || !no || !to || !hl) return w.showToast('Semua kolom bertanda bintang wajib diisi!', 'error');
  
  let fi_url = '';
  const fInput = document.getElementById('t_f') as any;
  if (fInput && fInput.files[0]) fi_url = await w.readFileAsBase64(fInput.files[0]);
  
  w.toggleLoading(true, 'Menyimpan data tembusan...');
  setTimeout(async () => {
    let targetId = w.editModeId ? w.editModeId : Date.now();
    const payload: any = {
      id: targetId,
      unit, bdg, jenis, tgl, no, to, hl,
      fi_url: fi_url || (w.editModeId ? w.tembusanData.find((x: any) => x.id == w.editModeId)?.fi_url || '' : '')
    };
    
    if (w.editModeId) {
      const idx = w.tembusanData.findIndex((x: any) => x.id == w.editModeId);
      if (idx > -1) w.tembusanData[idx] = payload;
      w.showToast('Tembusan berhasil diperbarui!', 'ok');
      w.recordLog('UPDATE', 'Tembusan', `Mengedit tembusan unit: ${no}`);
    } else {
      w.tembusanData.unshift(payload);
      w.showToast('Tembusan berhasil dikirim!', 'ok');
      w.recordLog('CREATE', 'Tembusan', `Kirim tembusan baru: ${no}`);
    }
    w.clearDraft('Tembusan');
    w.closeModal('modTembusan');
    w.updateDashboardStats();
    w.renderTembusan();
    if (w.saveAllToLocal) w.saveAllToLocal();
    try {
      const saved = await w.dbQuery('save', 'Tembusan', payload);
      if (saved) {
        const idx = w.tembusanData.findIndex((x: any) => x.id == targetId);
        if (idx > -1) {
          w.tembusanData[idx] = saved;
          w.renderTembusan();
          if (w.saveAllToLocal) w.saveAllToLocal();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      w.toggleLoading(false);
    }
  }, 300);
};

w.viewTembusan = (id: any) => {
  w.playUISound('pop');
  const item = w.tembusanData.find((x: any) => x.id == id);
  if (!item) return;
  
  const safeSetText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '—';
  };
  safeSetText('vt_unit', item.unit);
  safeSetText('vt_no', item.no);
  safeSetText('vt_tgl', w.formatDate(item.tgl));
  safeSetText('vt_bdg', w.getBdgDisplay(item.bdg));
  safeSetText('vt_jenis', item.jenis);
  safeSetText('vt_to', item.to);
  safeSetText('vt_hl', item.hl);
  
  const lBtn = document.getElementById('vt_lamp_btn');
  const lLink = document.getElementById('vt_lamp_link') as any;
  if (lBtn && lLink) {
    if (item.fi_url) { 
      lLink.href = 'javascript:void(0)'; 
      lLink.onclick = () => w.openAttachment(item.fi_url);
      lBtn.style.display = 'block'; 
    }
    else { lBtn.style.display = 'none'; }
  }
  
  const editBtn = document.getElementById('btnEditTTop');
  if (editBtn) {
    if (w.currentUser && (w.currentUser.role === 'admin' || w.currentUser.name === item.unit)) {
      editBtn.style.display = 'inline-flex';
      editBtn.setAttribute('onclick', `window.closeModal('modViewTembusan'); window.editTembusan(${item.id});`);
    } else {
      editBtn.style.display = 'none';
    }
  }
  
  const shareBtn = document.getElementById('btnShareTTop');
  if (shareBtn) shareBtn.setAttribute('onclick', `window.shareDriveLink('Tembusan', ${item.id});`);
  
  document.getElementById('modViewTembusan')?.classList.add('op');
  w.safeCreateIcons();
};

// --- ARSIP MANUAL ---
w.renderArsip = () => {
  let data = [...w.arsipData];
  const q = (document.querySelector('#pg-arsip .sri') as any)?.value?.toLowerCase() || '';
  const katFilter = (document.getElementById('f_a_kat') as any)?.value || '';
  const bdgFilter = (document.getElementById('f_a_bdg') as any)?.value || '';
  const dStart = (document.getElementById('f_a_start') as any)?.value || '';
  const dEnd = (document.getElementById('f_a_end') as any)?.value || '';

  if (q) data = data.filter((x: any) => (x.no || '').toLowerCase().includes(q) || (x.hl || '').toLowerCase().includes(q));
  if (katFilter) data = data.filter((x: any) => x.kat === katFilter);
  if (bdgFilter) data = data.filter((x: any) => x.bdg === bdgFilter);
  if (dStart) data = data.filter((x: any) => x.tgl >= dStart);
  if (dEnd) data = data.filter((x: any) => x.tgl <= dEnd);

  const total = data.length;
  const sIdx = (w.currentPageArsip - 1) * w.itemsPerPage;
  const pData = data.slice(sIdx, sIdx + w.itemsPerPage);

  const ct = document.getElementById('arsipCt');
  if (ct) ct.textContent = `Menampilkan ${total === 0 ? 0 : sIdx + 1}-${Math.min(sIdx + w.itemsPerPage, total)} dari ${total} arsip`;

  const tb = document.getElementById('arsipTb');
  if (tb) {
    if (pData.length === 0) {
      tb.innerHTML = `<tr><td colspan="8"><div class="empty-state-wrap"><img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/File%20cabinet/3D/file_cabinet_3d.png" class="empty-state-img"><div class="empty-state-t">Data tidak ditemukan</div></div></td></tr>`;
    } else {
      tb.innerHTML = pData.map((x: any, idx: number) => {
        let fileBadge = x.fi_url ? `<a href="javascript:void(0)" onclick="window.openAttachment(window.arsipData.find(t=>t.id==${x.id}).fi_url)" class="bdg bpr" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="external-link" style="width:11px;height:11px;"></i> Lihat</a>` : '—';
        return `<tr><td data-label="#">${sIdx + idx + 1}</td><td data-label="No. Dokumen" style="font-weight:700;color:var(--tp);">${w.escapeHTML(x.no)}</td><td data-label="Tanggal"><span style="font-size:11.5px;color:var(--tm);font-weight:700;"><i data-lucide="calendar" class="lucide-xs"></i> ${w.formatDate(x.tgl)}</span></td><td data-label="Bidang" class="text-wrap">${w.escapeHTML(w.getBdgDisplay(x.bdg))}</td><td data-label="Kategori" class="text-wrap" style="font-weight:700;color:var(--a1);">${w.escapeHTML(x.kat)}</td><td data-label="Perihal" class="text-wrap">${w.escapeHTML(x.hl)}</td><td data-label="File">${fileBadge}</td><td data-label="Aksi" style="text-align:right;"><div style="display:inline-flex;gap:6px;"><button class="btn bg2 bxs" onclick="window.viewArsip(${x.id})"><i data-lucide="eye" style="width:14px;height:14px;"></i></button><button class="btn bg2 bxs admin-only" onclick="window.editArsip(${x.id})"><i data-lucide="edit-3" style="width:14px;height:14px;"></i></button><button class="btn bd2 bxs admin-only" onclick="window.confirmDelete('Arsip', ${x.id})"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button></div></td></tr>`;
      }).join('');
    }
  }

  w.renderPagination('arsipPg', total, w.currentPageArsip, 'arsip');
  w.safeCreateIcons();
};

w.filterArsip = () => { w.currentPageArsip = 1; w.renderArsip(); };

w.openModalArsip = (mode: string) => {
  w.playUISound('pop');
  w.editModeId = null;
  const m = document.getElementById('modArsip');
  if (!m) return;
  m.querySelectorAll('input:not([type=file]), select').forEach((i: any) => i.tagName === 'SELECT' ? i.selectedIndex = 0 : i.value = '');
  (document.getElementById('a_tgl') as any).value = w.getToday();
  w.populateKategoriDropdown();
  
  const title = document.getElementById('modArsipT');
  if (title) title.innerHTML = '<i data-lucide="file-plus"></i> Tambah Arsip';
  const fl = document.getElementById('a_fl');
  if (fl) fl.style.display = 'none';
  const flDraft = document.getElementById('a_fl_draft');
  if (flDraft) flDraft.style.display = 'none';
  m.classList.add('op');
  w.safeCreateIcons();
};

w.editArsip = (id: any) => {
  w.playUISound('pop');
  w.editModeId = id;
  const item = w.arsipData.find((x: any) => x.id == id);
  if (!item) return;
  w.populateKategoriDropdown();
  
  const title = document.getElementById('modArsipT');
  if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Arsip';
  
  (document.getElementById('a_tgl') as any).value = item.tgl || '';
  (document.getElementById('a_bdg') as any).value = item.bdg || '';
  (document.getElementById('a_kat') as any).value = item.kat || '';
  (document.getElementById('a_no') as any).value = item.no || '';
  (document.getElementById('a_hl') as any).value = item.hl || '';
  
  const fl = document.getElementById('a_fl');
  if (fl) {
    if (item.fi_url) { fl.textContent = 'Selected: Current File'; fl.style.display = 'block'; }
    else { fl.style.display = 'none'; }
  }
  
  const flDraft = document.getElementById('a_fl_draft');
  if (flDraft) {
    if (item.draft_url) { flDraft.textContent = 'Selected: Current Draft'; flDraft.style.display = 'block'; }
    else { flDraft.style.display = 'none'; }
  }
  
  document.getElementById('modArsip')?.classList.add('op');
  w.safeCreateIcons();
};

w.saveArsip = async () => {
  const tgl = (document.getElementById('a_tgl') as any).value;
  const bdg = (document.getElementById('a_bdg') as any).value;
  const kat = (document.getElementById('a_kat') as any).value;
  const no = (document.getElementById('a_no') as any).value.trim();
  const hl = (document.getElementById('a_hl') as any).value.trim();
  
  if (!tgl || !kat || !no || !hl) return w.showToast('Semua kolom bertanda bintang wajib diisi!', 'error');
  
  let fi_url = '';
  const fInput = document.getElementById('a_f') as any;
  if (fInput && fInput.files[0]) fi_url = await w.readFileAsBase64(fInput.files[0]);

  let draft_url = '';
  let draft_mime = '';
  const fDraft = document.getElementById('a_f_draft') as any;
  if (fDraft && fDraft.files[0]) {
    draft_url = await w.readFileAsBase64(fDraft.files[0]);
    draft_mime = fDraft.files[0].type;
  }
  
  if (!fi_url && !w.editModeId) return w.showToast('Berkas dokumen wajib diunggah!', 'error');
  
  w.toggleLoading(true, 'Menyimpan arsip...');
  setTimeout(async () => {
    let targetId = w.editModeId ? w.editModeId : Date.now();
    const payload: any = {
      id: targetId,
      tgl, bdg, kat, no, hl,
      fi_url: fi_url || (w.editModeId ? w.arsipData.find((x: any) => x.id == w.editModeId)?.fi_url || '' : ''),
      draft_url: draft_url || (w.editModeId ? w.arsipData.find((x: any) => x.id == w.editModeId)?.draft_url || '' : ''),
      draft_mime: draft_mime || (w.editModeId ? w.arsipData.find((x: any) => x.id == w.editModeId)?.draft_mime || '' : '')
    };
    
    if (w.editModeId) {
      const idx = w.arsipData.findIndex((x: any) => x.id == w.editModeId);
      if (idx > -1) w.arsipData[idx] = payload;
      w.showToast('Arsip diperbarui', 'ok');
      w.recordLog('UPDATE', 'Arsip', `Mengedit arsip: ${no}`);
    } else {
      w.arsipData.unshift(payload);
      w.showToast('Dokumen berhasil diarsipkan!', 'ok');
      w.recordLog('CREATE', 'Arsip', `Mengarsipkan dokumen: ${no}`);
    }
    w.clearDraft('Arsip');
    w.closeModal('modArsip');
    w.updateDashboardStats();
    w.renderArsip();
    if (w.saveAllToLocal) w.saveAllToLocal();
    try {
      const saved = await w.dbQuery('save', 'Arsip', payload);
      if (saved) {
        const idx = w.arsipData.findIndex((x: any) => x.id == targetId);
        if (idx > -1) {
          w.arsipData[idx] = saved;
          w.renderArsip();
          if (w.saveAllToLocal) w.saveAllToLocal();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      w.toggleLoading(false);
    }
  }, 300);
};

w.viewArsip = (id: any) => {
  w.playUISound('pop');
  const item = w.arsipData.find((x: any) => x.id == id);
  if (!item) return;
  
  const safeSetText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '—';
  };
  safeSetText('va_no', item.no);
  safeSetText('va_tgl', w.formatDate(item.tgl));
  safeSetText('va_bdg', w.getBdgDisplay(item.bdg));
  safeSetText('va_kat', item.kat);
  safeSetText('va_hl', item.hl);
  
  const dBtn = document.getElementById('va_draft_btn');
  const dLink = document.getElementById('va_draft_link') as any;
  if (dBtn && dLink) {
    if (item.draft_url) {
      dLink.href = 'javascript:void(0)';
      dLink.onclick = () => {
        let yy = '';
        let mm = '';
        let dd = '';
        if (item.tgl) {
          const p = item.tgl.split('-');
          if (p.length === 3) {
            yy = p[0].substring(2);
            mm = p[1];
            dd = p[2];
          }
        }
        let ext = '';
        if (item.draft_mime === 'application/pdf') ext = '.pdf';
        else if (item.draft_mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ext = '.docx';
        else if (item.draft_mime === 'application/msword') ext = '.doc';
        else if (item.draft_mime === 'image/jpeg') ext = '.jpg';
        else if (item.draft_mime === 'image/png') ext = '.png';
        const safeHl = (item.hl || 'Perihal').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${yy}${mm}${dd}_draft_${safeHl}${ext}`;
        w.openAttachment(item.draft_url, filename);
      };
      dBtn.style.display = 'block';
    } else {
      dBtn.style.display = 'none';
    }
  }

  const lBtn = document.getElementById('va_lamp_btn');
  const lLink = document.getElementById('va_lamp_link') as any;
  if (lBtn && lLink) {
    if (item.fi_url) { 
      lLink.href = 'javascript:void(0)'; 
      lLink.onclick = () => w.openAttachment(item.fi_url);
      lBtn.style.display = 'block'; 
    }
    else { lBtn.style.display = 'none'; }
  }
  
  const editBtn = document.getElementById('btnEditATop');
  if (editBtn) editBtn.setAttribute('onclick', `window.closeModal('modViewArsip'); window.editArsip(${item.id});`);
  const ctkBtn = document.getElementById('btnCetakATop');
  if (ctkBtn) ctkBtn.setAttribute('onclick', `window.closeModal('modViewArsip'); window.showToast('Fungsi cetak dokumen cloud sedang disiapkan. Silakan klik Buka Berkas.', 'info');`);
  
  document.getElementById('modViewArsip')?.classList.add('op');
  w.safeCreateIcons();
};

w.shareDriveLink = (type: string, id: any) => {
  w.playUISound('pop');
  let item = null;
  if (type === 'Disposisi') item = w.disposisiData.find((x: any) => x.id == id);
  else if (type === 'SuratKeluar') item = w.suratKeluarData.find((x: any) => x.id == id);
  else if (type === 'Tembusan') item = w.tembusanData.find((x: any) => x.id == id);
  
  if (!item) return;
  const link = `${window.location.origin}${window.location.pathname}?view=${type}&id=${id}`;
  const txt = document.getElementById('qrLinkText');
  if (txt) txt.textContent = link;
  
  const wa = document.getElementById('waShareBtn') as any;
  if (wa) wa.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(`[E-Admin LPIS] Dokumen ${type} - No: ${item.no}. Silakan akses di link berikut: ${link}`)}`;
  
  const qrBox = document.getElementById('qrRenderBox');
  if (qrBox) {
    qrBox.innerHTML = '';
    try {
      new (window as any).QRCode(qrBox, {
        text: link,
        width: 140,
        height: 140,
        correctLevel: 1
      });
    } catch (e) {
      console.warn('QRCode error:', e);
    }
  }
  w.openModal('modShare', 'view');
};
