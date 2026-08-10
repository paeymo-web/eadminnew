const w = window as any;

w.generateFilename = (tgl: string, base: string, suffix: string, originalName: string) => {
  const ext = originalName.slice(originalName.lastIndexOf('.'));
  const cleanBase = w.safeName(base);
  const cleanSuffix = w.safeName(suffix);
  return `${tgl}_${cleanBase}_${cleanSuffix}${ext}`;
};

w.fileSelected = (input: any, labelId: string) => {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const lbl = document.getElementById(labelId);
    if (lbl) {
      lbl.textContent = `Selected: ${file.name}`;
      lbl.style.display = 'block';
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      input.setAttribute('data-base64', e.target.result);
    };
    reader.readAsDataURL(file);
  }
};

w.readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: any) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

w.openAttachment = (url: string, filename?: string) => {
  if (!url) return;
  if (url === '[File Sedang Diunggah...]') {
    w.showToast('File sedang diunggah ke Google Drive di latar belakang. Harap tunggu...', 'info');
    return;
  }
  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      const meta = parts[0];
      const base64Data = parts[1];
      const mime = meta.split(':')[1].split(';')[0];
      
      const binary = atob(base64Data);
      const array = [];
      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(array)], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      if (filename) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        window.open(blobUrl, '_blank');
      }
    } catch (e) {
      console.error('Failed to open data URI as blob:', e);
      if (filename) {
         const a = document.createElement('a');
         a.href = url;
         a.download = filename;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
      } else {
        const newWin = window.open();
        if (newWin) {
          newWin.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
      }
    }
  } else {
    window.open(url, '_blank');
  }
};

w.updateDashboardStats = () => {
  const pendingDispCount = w.disposisiData.filter((x: any) => w.cleanSt(x.st).includes('Pending')).length;
  const prosesSKCount = w.suratKeluarData.filter((x: any) => w.cleanSt(x.st).includes('Proses')).length;
  const totalPending = pendingDispCount + prosesSKCount;

  if (document.getElementById('sv1')) document.getElementById('sv1')!.textContent = w.disposisiData.length;
  if (document.getElementById('sv2')) document.getElementById('sv2')!.textContent = w.suratKeluarData.length;
  if (document.getElementById('sv3')) document.getElementById('sv3')!.textContent = String(totalPending);
  if (document.getElementById('sv4')) document.getElementById('sv4')!.textContent = w.disposisiData.filter((x: any) => w.cleanSt(x.st).includes('Selesai')).length;

  // Render task information in focus pill
  const pillText = document.getElementById('pillText');
  const focusPill = document.getElementById('focusPill');
  if (pillText) {
    if (totalPending > 0) {
      const parts = [];
      if (pendingDispCount > 0) parts.push(`${pendingDispCount} disposisi pending`);
      if (prosesSKCount > 0) parts.push(`${prosesSKCount} surat keluar proses`);
      pillText.innerHTML = `Anda memiliki <strong style="font-weight:700;">${parts.join(' &amp; ')}</strong> yang memerlukan tindak lanjut segera hari ini.`;
      if (focusPill) {
        focusPill.style.background = 'rgba(239, 68, 68, 0.08)';
        focusPill.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        focusPill.style.color = '#ef4444';
      }
    } else {
      pillText.innerHTML = `<span style="color:var(--ok); font-weight:700;">Luar biasa! Semua tugas disposisi &amp; surat keluar telah selesai diproses. 🎉</span>`;
      if (focusPill) {
        focusPill.style.background = 'rgba(16, 185, 129, 0.08)';
        focusPill.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        focusPill.style.color = '#10b981';
      }
    }
  }

  // Render notification reminders in header bell menu
  const notifList = document.getElementById('notifList');
  const notifDot = document.getElementById('notifDot');
  const notifCountBd = document.getElementById('notifCountBd');
  
  if (notifList) {
    const pendingDispNotifs = w.disposisiData.filter((x: any) => w.cleanSt(x.st).includes('Pending')).map((x: any) => ({
      id: x.id,
      title: 'Disposisi Pending',
      desc: `Surat dari ${x.fr} perihal "${x.hl}" memerlukan disposisi pimpinan.`,
      type: 'disposisi'
    }));
    
    const prosesSKNotifs = w.suratKeluarData.filter((x: any) => w.cleanSt(x.st).includes('Proses')).map((x: any) => ({
      id: x.id,
      title: 'Surat Keluar Proses',
      desc: `Surat ke ${x.to} perihal "${x.hl}" masih berstatus proses.`,
      type: 'sk'
    }));
    
    const allNotifs = [...pendingDispNotifs, ...prosesSKNotifs].sort((a, b) => b.id - a.id);
    const totalNotifs = allNotifs.length;
    
    if (notifCountBd) notifCountBd.textContent = String(totalNotifs);
    if (notifDot) {
      notifDot.style.display = totalNotifs > 0 ? 'block' : 'none';
    }
    
    if (totalNotifs === 0) {
      notifList.innerHTML = `
        <div class="notif-empty">
          <img referrerPolicy="no-referrer" src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Party%20popper/3D/party_popper_3d.png" style="width:40px;height:40px;margin-bottom:8px;">
          <div class="notif-desc">Tidak ada tugas atau pengingat yang tertunda. Semua beres!</div>
        </div>
      `;
    } else {
      notifList.innerHTML = allNotifs.map((n: any) => `
        <div class="notif-item" onclick="window.goToPage('${n.type}'); window.view${n.type === 'disposisi' ? 'Disposisi' : 'SuratKeluar'}(${n.id});">
          <div class="notif-title">
            <i data-lucide="${n.type === 'disposisi' ? 'inbox' : 'send'}" class="lucide-sm" style="color:var(--a1)"></i>
            ${w.escapeHTML(n.title)}
          </div>
          <div class="notif-desc">${w.escapeHTML(n.desc)}</div>
        </div>
      `).join('');
    }
  }

  // Render monthly stats and feeds
  const activeBox = document.getElementById('unitActivityBox');
  if (activeBox) {
    const unitsMap: any = {};
    w.tembusanData.forEach((t: any) => {
      unitsMap[t.unit] = (unitsMap[t.unit] || 0) + 1;
    });
    let html = '';
    if (Object.keys(unitsMap).length === 0) {
      html = '<div style="grid-column: span 3; text-align: center; color: var(--tm); font-size: 13px; padding: 20px;">Belum ada aktivitas bulan ini.</div>';
    } else {
      for (const [unit, count] of Object.entries(unitsMap) as any) {
        html += `<div class="bdg-list-item"><div class="bdg-list-text"><i data-lucide="building" style="color:var(--a1)"></i> ${w.escapeHTML(unit)}</div><span class="bdg-list-code">${count} Surat</span></div>`;
      }
    }
    activeBox.innerHTML = html;
  }

  // Dashboard Table Feeds (Tugas Pending Terkini)
  const recTb = document.getElementById('dashRecentTb');
  if (recTb) {
    const pendingDispList = w.disposisiData.filter((x: any) => w.cleanSt(x.st).includes('Pending')).map((x: any) => ({
      no: x.no,
      info: `Disp: ${x.fr}`,
      hl: x.hl,
      badge: `<span class="bdg bp">Pending</span>`,
      id: x.id
    }));
    const prosesSKList = w.suratKeluarData.filter((x: any) => w.cleanSt(x.st).includes('Proses')).map((x: any) => ({
      no: x.no,
      info: `Kirim ke: ${x.to}`,
      hl: x.hl,
      badge: `<span class="bdg bp">Proses</span>`,
      id: x.id
    }));
    
    const combinedPending = [...pendingDispList, ...prosesSKList].sort((a, b) => b.id - a.id).slice(0, 5);
    if (combinedPending.length) {
      recTb.innerHTML = combinedPending.map((x: any) => `<tr><td data-label="No. Surat">${w.escapeHTML(x.no)}</td><td data-label="Pengirim/Tujuan">${w.escapeHTML(x.info)}</td><td data-label="Perihal" class="text-wrap">${w.escapeHTML(x.hl)}</td><td data-label="Status">${x.badge}</td></tr>`).join('');
    } else {
      recTb.innerHTML = `<tr><td colspan="4"><div class="empty-state-wrap" style="padding:20px;"><img referrerPolicy="no-referrer" src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Party%20popper/3D/party_popper_3d.png" class="empty-state-img" style="width:50px;height:50px;"><div class="empty-state-t">Hore! Tidak ada tugas pending</div></div></td></tr>`;
    }
  }

  const tembTb = document.getElementById('dashTembusanTb');
  if (tembTb) {
    const recentT = w.tembusanData.slice(0, 5);
    if (recentT.length) {
      tembTb.innerHTML = recentT.map((x: any) => `<tr><td data-label="Unit">${w.escapeHTML(x.unit)}</td><td data-label="No. Surat">${w.escapeHTML(x.no)}</td><td data-label="Kepada">${w.escapeHTML(x.to)}</td><td data-label="Perihal" class="text-wrap">${w.escapeHTML(x.hl)}</td><td data-label="Waktu"><span style="font-family:var(--fb);font-weight:700;color:var(--a1);font-size:12px;">${w.formatDateTime(x.id)}</span></td></tr>`).join('');
    } else {
      tembTb.innerHTML = `<tr><td colspan="5"><div class="empty-state-wrap" style="padding:20px;"><img referrerPolicy="no-referrer" src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clipboard/3D/clipboard_3d.png" class="empty-state-img" style="width:50px;height:50px;"><div class="empty-state-t">Belum ada tembusan terbaru</div></div></td></tr>`;
    }
  }

  if (w.currentUser && w.currentUser.role !== 'admin' && w.currentUser.role !== 'pimpinan') {
    const uStat1 = document.getElementById('uStat1');
    const uStat2 = document.getElementById('uStat2');
    const myTembusan = w.tembusanData.filter((x: any) => x.unit === w.currentUser.name);
    if (uStat1) uStat1.textContent = myTembusan.length;
    if (uStat2) {
      const thisMonth = new Date().toISOString().slice(0, 7);
      uStat2.textContent = myTembusan.filter((x: any) => x.tgl && x.tgl.startsWith(thisMonth)).length;
    }
    const unitLogTb = document.getElementById('unitLogTb');
    if (unitLogTb) {
      if (myTembusan.length) {
        unitLogTb.innerHTML = myTembusan.slice(0, 5).map((x: any) => `<tr><td data-label="Status"><span class="bdg bd">Terkirim</span></td><td data-label="No. Surat">${w.escapeHTML(x.no)}</td><td data-label="Kepada">${w.escapeHTML(x.to)}</td><td data-label="Perihal" class="text-wrap">${w.escapeHTML(x.hl)}</td><td data-label="Tgl &amp; Jam"><span style="font-family:var(--fb);font-weight:700;color:var(--a1);font-size:12px;">${w.formatDateTime(x.id)}</span></td><td data-label="File">${x.fi_url ? `<a href="javascript:void(0)" onclick="window.openAttachment(window.tembusanData.find(t=>t.id==${x.id}).fi_url)" class="bdg bpr">Buka</a>` : '-'}</td></tr>`).join('');
      } else {
        unitLogTb.innerHTML = `<tr><td colspan="6"><div class="empty-state-wrap"><div class="empty-state-t">Belum ada riwayat tembusan</div></div></td></tr>`;
      }
    }
  }
  w.safeCreateIcons();
};

w.saveDraft = (formType: string) => {
  if (w.editModeId) return;
  const draft: any = {};
  document.querySelectorAll(`#mod${formType} .fc`).forEach((el: any) => {
    if (el.id && !el.id.includes('f_')) draft[el.id] = el.value;
  });
  localStorage.setItem(`ea_draft_${formType}`, JSON.stringify(draft));
  
  const ind = document.getElementById('draftIndicator');
  const timeSp = document.getElementById('draftTime');
  if (ind && timeSp) {
    const now = new Date();
    timeSp.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    ind.classList.add('show');
    if ((window as any).draftTimeout) clearTimeout((window as any).draftTimeout);
    (window as any).draftTimeout = setTimeout(() => { ind.classList.remove('show'); }, 2500);
  }
};

w.loadDraft = (formType: string) => {
  if (w.editModeId) return;
  const draftStr = localStorage.getItem(`ea_draft_${formType}`);
  if (draftStr) {
    const draft = JSON.parse(draftStr);
    Object.keys(draft).forEach(key => {
      const el = document.getElementById(key) as any;
      if (el) el.value = draft[key];
    });
    w.showToast('Draft otomatis dimuat', 'info');
  }
};

w.clearDraft = (formType: string) => {
  localStorage.removeItem(`ea_draft_${formType}`);
};

w.initAutoSave = () => {
  ['D', 'SK', 'Tembusan', 'Arsip'].forEach(type => {
    document.querySelectorAll(`#mod${type} .fc`).forEach((el: any) => {
      el.addEventListener('input', () => w.saveDraft(type));
      el.addEventListener('change', () => w.saveDraft(type));
    });
  });
};

w.exportBackupJSON = () => {
  w.playUISound('pop');
  const backupData = {
    version: "3.0",
    exportTime: Date.now(),
    disposisi: w.disposisiData,
    suratKeluar: w.suratKeluarData,
    tembusan: w.tembusanData,
    arsip: w.arsipData,
    logs: w.logData,
    bidang: w.bidangData,
    pejabat: w.pejabatData,
    kategori: w.kategoriData,
    jenisSurat: w.jenisSuratData,
    users: w.storedUsers
  };
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const tStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const filename = `Backup_EAdmin_LPIS_${dStr}_${tStr}.json`;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  w.showToast('Backup JSON berhasil diunduh', 'ok');
  w.recordLog('EXPORT', 'Sistem', 'Ekspor backup database JSON');
};

w.triggerImportJSON = () => {
  w.playUISound('pop');
  document.getElementById('importJSONInput')?.click();
};

w.importBackupJSON = (input: any) => {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e: any) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.disposisi || !data.suratKeluar || !data.tembusan) {
        w.showToast('File JSON tidak cocok dengan struktur database!', 'error');
        input.value = '';
        return;
      }
      w.pendingImportData = data;
      w.openModal('modImportConfirm', 'view');
    } catch (err) {
      w.showToast('Gagal membaca format JSON.', 'error');
    }
    input.value = '';
  };
  reader.readAsText(file);
};

w.applyImportJSON = async (mode: string) => {
  if (!w.pendingImportData) return;
  w.closeModal('modImportConfirm');
  w.toggleLoading(true, 'Menerapkan data backup...');
  setTimeout(async () => {
    const data = w.pendingImportData;
    if (mode === 'overwrite') {
      w.disposisiData = data.disposisi || [];
      w.suratKeluarData = data.suratKeluar || [];
      w.tembusanData = data.tembusan || [];
      w.arsipData = data.arsip || [];
      w.logData = data.logs || [];
      w.bidangData = data.bidang || w.bidangData;
      w.pejabatData = data.pejabat || w.pejabatData;
      w.kategoriData = data.kategori || w.kategoriData;
      w.jenisSuratData = data.jenisSurat || w.jenisSuratData;
      w.storedUsers = data.users || w.storedUsers;
    } else {
      const mergeById = (t: any[], s: any[]) => {
        const map = new Map(t.map(i => [i.id, i]));
        s.forEach(i => map.set(i.id, i));
        return Array.from(map.values()).sort((a: any, b: any) => b.id - a.id);
      };
      w.disposisiData = mergeById(w.disposisiData, data.disposisi || []);
      w.suratKeluarData = mergeById(w.suratKeluarData, data.suratKeluar || []);
      w.tembusanData = mergeById(w.tembusanData, data.tembusan || []);
      w.arsipData = mergeById(w.arsipData, data.arsip || []);
      w.logData = mergeById(w.logData, data.logs || []);
    }
    localStorage.setItem('ea-bidang', JSON.stringify(w.bidangData));
    localStorage.setItem('ea-pejabat', JSON.stringify(w.pejabatData));
    localStorage.setItem('ea-kategori', JSON.stringify(w.kategoriData));
    localStorage.setItem('ea-jenis-surat', JSON.stringify(w.jenisSuratData));
    localStorage.setItem('ea-users', JSON.stringify(w.storedUsers));
    if (w.saveAllToLocal) w.saveAllToLocal();
    w.dbQuery('importAll', 'Sistem', { disposisi: w.disposisiData, sk: w.suratKeluarData, tembusan: w.tembusanData, arsip: w.arsipData, logs: w.logData });
    w.recordLog('IMPORT', 'Sistem', `Impor data (${mode.toUpperCase()})`);
    w.pendingImportData = null;
    w.toggleLoading(false);
    w.updateDashboardStats();
    w.renderDisposisi();
    w.renderSuratKeluar();
    w.renderArsip();
    w.renderTembusan();
    w.renderLog();
    w.renderBidangSettings();
    w.renderUserSettings();
    w.renderPejabatSettings();
    w.renderKategoriSettings();
    w.renderJenisSuratSettings();
    w.renderJabatanSettings();
    w.populateKategoriDropdown();
    w.populateJenisSuratDropdown();
    w.populateDToDropdown();
    w.showToast(`Impor Berhasil!`, `ok`);
  }, 300);
};

w.confirmDelete = function(table: string, id: any) {
  w.playUISound('pop');
  w.deleteTargetTable = table;
  w.deleteTargetId = id;
  document.getElementById('modDelete')?.classList.add('op');
  w.safeCreateIcons();
};

w.openModal = function(id: string, mode: string) {
  w.playUISound('pop');
  w.editModeId = null;
  const m = document.getElementById(id);
  if (!m) return;
  if (mode === 'add') {
    w.editModeId = null;
    m.querySelectorAll('input:not([type=file]), textarea, select').forEach((i: any) => i.tagName === 'SELECT' ? i.selectedIndex = 0 : i.value = '');
    if (id === 'modSK') {
      const title = document.getElementById('modSKT');
      if (title) title.innerHTML = '<i data-lucide="plus-circle"></i> Tambah Surat Keluar';
      (document.getElementById('sk_tgl') as any).value = w.getToday();
      w.populateBidangDropdown();
      w.populatePejabatDropdown();
      w.populateJenisSuratDropdown();
      w.toggleSKAcc();
      const defPjb = w.pejabatData.find((p: any) => p.isDefault);
      if (defPjb) (document.getElementById('sk_ttd') as any).value = defPjb.nama;
      w.generateNoSK();
    }
    if (id === 'modD') {
      const title = document.getElementById('modDT');
      if (title) title.innerHTML = '<i data-lucide="plus-circle"></i> Tambah Disposisi';
      (document.getElementById('d_tgl_s') as any).value = w.getToday();
      (document.getElementById('d_tgl_t') as any).value = w.getToday();
      w.toggleHasilDisposisi();
      const dToCust = document.getElementById('d_to_custom') as any;
      if (dToCust) { dToCust.value = ''; dToCust.style.display = 'none'; }
    }
    setTimeout(() => { let type = id.replace('mod', ''); w.loadDraft(type); }, 50);
  }
  m.classList.add('op');
  w.safeCreateIcons();
};

w.closeModal = function(id: string) {
  w.playUISound('pop');
  document.getElementById(id)?.classList.remove('op');
};

w.toggleHasilDisposisi = () => {
  const stEl = document.getElementById('d_st') as any;
  if (!stEl) return;
  const st = w.cleanSt(stEl.value);
  const sec = document.getElementById('sec_hasil_disp');
  if (sec) sec.style.display = (st.includes('Selesai')) ? 'block' : 'none';
};

w.toggleDToCustom = () => {
  const sel = document.getElementById('d_to') as any;
  const custom = document.getElementById('d_to_custom') as any;
  if (sel && custom) {
    custom.style.display = (sel.value === 'Lainnya') ? 'block' : 'none';
    if (sel.value === 'Lainnya') custom.focus();
  }
};

w.toggleSKAcc = () => {
  const stEl = document.getElementById('sk_st') as any;
  if (!stEl) return;
  const st = w.cleanSt(stEl.value);
  const sec = document.getElementById('sec_sk_acc');
  if (sec) sec.style.display = (st.includes('Selesai') || st.includes('Dibagikan')) ? 'block' : 'none';
};

w.cloneDoc = (type: string, id: any) => {
  if (type === 'Disposisi') {
    const item = w.disposisiData.find((x: any) => x.id == id);
    if (item) {
      w.openModal('modD', 'add');
      setTimeout(() => {
        const dFr = document.getElementById('d_fr') as any;
        const dHl = document.getElementById('d_hl') as any;
        if (dFr) dFr.value = item.fr || '';
        if (dHl) dHl.value = item.hl || '';
        w.showToast('Disposisi diduplikasi.', 'info');
      }, 150);
    }
  } else if (type === 'SuratKeluar') {
    const item = w.suratKeluarData.find((x: any) => x.id == id);
    if (item) {
      w.openModal('modSK', 'add');
      setTimeout(() => {
        const skTo = document.getElementById('sk_to') as any;
        const skHl = document.getElementById('sk_hl') as any;
        if (skTo) skTo.value = item.to || '';
        if (skHl) skHl.value = item.hl || '';
        const selJ = document.getElementById('sk_j') as any; if(selJ) selJ.value = item.j || '';
        const selBdg = document.getElementById('sk_bdg') as any; if(selBdg) selBdg.value = item.bdg || '';
        w.generateNoSK();
        w.showToast('Surat Keluar diduplikasi.', 'info');
      }, 150);
    }
  }
};
