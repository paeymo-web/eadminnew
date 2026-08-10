import { fsSave, fsDelete, fsImportAll, fsGetAll } from './firestore_adapter';

const w = window as any;

// Helper to get extension from Base64 MIME
const getExtFromBase64 = (b64: string) => {
  if (!b64 || typeof b64 !== 'string') return '.pdf';
  if (b64.startsWith('data:application/pdf')) return '.pdf';
  if (b64.startsWith('data:image/png')) return '.png';
  if (b64.startsWith('data:image/jpeg') || b64.startsWith('data:image/jpg')) return '.jpg';
  const match = b64.match(/data:([^;]+);base64/);
  if (match && match[1]) {
    const parts = match[1].split('/');
    if (parts[1]) return '.' + parts[1];
  }
  return '.pdf';
};

// Helper to sanitize any object/array to prevent Google Sheets 50k character cell limit crashes
const sanitizeForSheets = (obj: any): any => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForSheets(item));
  }
  if (typeof obj === 'object') {
    const cleanObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (typeof val === 'string') {
          if (val.startsWith('data:') && val.includes(';base64,')) {
            cleanObj[key] = '[File Berkas Terunggah di Firestore]';
          } else if (val.length > 40000) {
            cleanObj[key] = val.slice(0, 40000) + '... [Teks dipotong karena melebihi batas karakter Sheets]';
          } else {
            cleanObj[key] = val;
          }
        } else if (typeof val === 'object' && val !== null) {
          cleanObj[key] = sanitizeForSheets(val);
        } else {
          cleanObj[key] = val;
        }
      }
    }
    return cleanObj;
  }
  return obj;
};

// Helper to handle Firestore + GAS API calls
w.dbQuery = async (action: string, table: string, dataObj: any) => {
  // Pre-process files if any for Google Drive uploading in Google Apps Script (GAS)
  let hasFiles = false;
  if (action === 'save' && dataObj) {
    let bidang = dataObj.bdg || dataObj.unit || dataObj.kat || (dataObj.no ? String(dataObj.no).replace(/[\/\\]/g, '-') : dataObj.id);
    let prefixFi = 'Lampiran';
    if (table === 'SuratKeluar' && dataObj.st && (w.cleanSt(dataObj.st).includes('Proses') || w.cleanSt(dataObj.st).includes('Pending'))) {
      prefixFi = 'Draft';
    }

    if (dataObj.fi_url && dataObj.fi_url.startsWith('data:')) {
      dataObj.fi_data = dataObj.fi_url;
      dataObj.fi = `${prefixFi}_${bidang}${getExtFromBase64(dataObj.fi_url)}`;
      hasFiles = true;
    }
    if (dataObj.fi_hasil_url && dataObj.fi_hasil_url.startsWith('data:')) {
      dataObj.fi_h_data = dataObj.fi_hasil_url;
      dataObj.fi_h = `Hasil_${bidang}${getExtFromBase64(dataObj.fi_hasil_url)}`;
      hasFiles = true;
    }
    if (dataObj.fi_acc_url && dataObj.fi_acc_url.startsWith('data:')) {
      dataObj.fi_acc_data = dataObj.fi_acc_url;
      dataObj.fi_acc = `ACC_${bidang}${getExtFromBase64(dataObj.fi_acc_url)}`;
      hasFiles = true;
    }
  }

  // 1. Write to Firestore immediately (fast, local-first responsiveness)
  // We save the raw dataObj to Firestore, but we clean up the temporary _data fields before saving
  const firestoreObj = { ...dataObj };
  delete firestoreObj.fi_data;
  delete firestoreObj.fi_h_data;
  delete firestoreObj.fi_acc_data;

  const isGasConfigured = w.GAS_URL && w.GAS_URL !== "URL_DEPLOY_GAS_ANDA_DISINI";

  // We MUST NOT save huge base64 strings to Firestore if GAS is configured to avoid 1MB document size limit
  if (isGasConfigured) {
    if (firestoreObj.fi_url && firestoreObj.fi_url.startsWith('data:')) {
      firestoreObj.fi_url = '[File Sedang Diunggah...]';
    }
    if (firestoreObj.fi_hasil_url && firestoreObj.fi_hasil_url.startsWith('data:')) {
      firestoreObj.fi_hasil_url = '[File Sedang Diunggah...]';
    }
    if (firestoreObj.fi_acc_url && firestoreObj.fi_acc_url.startsWith('data:')) {
      firestoreObj.fi_acc_url = '[File Sedang Diunggah...]';
    }
  } else {
    // If GAS is not configured, we will attempt to save base64 directly to Firestore.
    // If it exceeds 1MB, Firestore will throw an error, which is caught below.
  }

  try {
    if (action === 'save') {
      await fsSave(table, firestoreObj);
    } else if (action === 'delete') {
      await fsDelete(table, dataObj.id);
    } else if (action === 'importAll') {
      await fsImportAll(dataObj);
    }
  } catch (error: any) {
    console.error('Firestore Error:', error);
    w.showToast('Gagal menyimpan data ke database (Firestore).', 'error');
    throw error;
  }

  // Allow synchronization if GAS_URL is set (remove IS_PREVIEW constraint to enable real-time backup/sync for preview links)
  if (!w.GAS_URL || w.GAS_URL === "URL_DEPLOY_GAS_ANDA_DISINI") {
    await new Promise(r => setTimeout(r, 100));
    return firestoreObj || {};
  }

  try {
    if (action === 'save' && hasFiles) {
      // Menjalankan upload file ke Google Drive di background secara non-blocking agar UI sangat cepat dan responsif!
      w.showToast('Data disimpan! Lampiran sedang diunggah ke Google Drive di latar belakang...', 'info');
      
      fetch(w.GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: action, table: table, data: dataObj })
      })
      .then(res => res.json())
      .then(async (result) => {
        if (result && result.status === 'success' && result.data) {
          // Bersihkan data base64 temporer
          delete result.data.fi_data;
          delete result.data.fi_h_data;
          delete result.data.fi_acc_data;
          
          // 1. Simpan URL Google Drive permanen ke Firestore
          await fsSave(table, result.data);
          
          // 2. Perbarui state memori lokal (RAM) agar langsung berubah di tabel tanpa reload
          let updatedInRAM = false;
          const targetId = result.data.id;
          
          if (table === 'Disposisi' && w.disposisiData) {
            const idx = w.disposisiData.findIndex((x: any) => x.id == targetId);
            if (idx > -1) {
              w.disposisiData[idx] = result.data;
              w.renderDisposisi();
              updatedInRAM = true;
            }
          } else if (table === 'SuratKeluar' && w.suratKeluarData) {
            const idx = w.suratKeluarData.findIndex((x: any) => x.id == targetId);
            if (idx > -1) {
              w.suratKeluarData[idx] = result.data;
              w.renderSuratKeluar();
              updatedInRAM = true;
            }
          } else if (table === 'Tembusan' && w.tembusanData) {
            const idx = w.tembusanData.findIndex((x: any) => x.id == targetId);
            if (idx > -1) {
              w.tembusanData[idx] = result.data;
              w.renderTembusan();
              updatedInRAM = true;
            }
          } else if (table === 'Arsip' && w.arsipData) {
            const idx = w.arsipData.findIndex((x: any) => x.id == targetId);
            if (idx > -1) {
              w.arsipData[idx] = result.data;
              w.renderArsip();
              updatedInRAM = true;
            }
          }
          
          if (updatedInRAM) {
            if (w.saveAllToLocal) w.saveAllToLocal();
            w.updateDashboardStats();
            w.showToast('Lampiran berhasil diunggah ke Google Drive & tautan diperbarui!', 'ok');
          }
        }
      })
      .catch(err => {
        console.error('[Background GAS upload error]:', err);
        w.showToast('Gagal mengunggah lampiran ke Google Drive. Lampiran tetap tersimpan aman di Firestore.', 'warning');
      });

      // Kembalikan objek firestoreObj secara instan agar modal langsung menutup dan data langsung tampil!
      return firestoreObj;
    } else {
      // For standard data, send as non-blocking background task to synchronize Google Sheets
      // We sanitize standard data so no raw Base64 or over-long fields ever slip through and crash Sheets
      const cleanDataObj = sanitizeForSheets(dataObj);
      fetch(w.GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: action, table: table, data: cleanDataObj })
      }).catch(err => console.warn('Background GAS sync warning:', err));
      
      return firestoreObj;
    }
  } catch (e) {
    console.warn('Gagal sinkronisasi ke Google Sheets, data tetap tersimpan aman di Firestore.', e);
    return firestoreObj || {};
  }
};

w.saveGASUrlConfig = async () => {
  const inputEl = document.getElementById('gasUrlInput') as any;
  if (!inputEl) return;
  const val = inputEl.value.trim();
  
  if (val && (!val.startsWith('https://script.google.com/') || !val.includes('/exec'))) {
    w.showToast('Format URL salah! Harus berupa URL Web App Google Apps Script berakhiran /exec', 'error');
    return;
  }
  
  w.GAS_URL = val;
  localStorage.setItem('ea-gas-url', val);
  w.toggleLoading(true, 'Menyimpan konfigurasi URL...', false);
  try {
    await fsSave('Config', { id: 'gas_url', url: val });
    w.showToast('Konfigurasi URL Google Apps Script berhasil disimpan!', 'ok');
    const statusEl = document.getElementById('sheetsSyncStatus');
    if (statusEl) {
      if (!val) {
        statusEl.innerHTML = `<i data-lucide="info" class="lucide-sm"></i> Status: URL Kosong. Siap menyinkronkan data.`;
      } else {
        statusEl.innerHTML = `<i data-lucide="check" class="lucide-sm" style="color:#0f9d58"></i> <span style="color:#0f9d58; font-weight:600;">Status: Terhubung dengan URL baru.</span>`;
      }
    }
  } catch (error) {
    w.showToast('Berhasil disimpan di lokal, gagal sinkronisasi ke Firestore', 'info');
  } finally {
    w.toggleLoading(false);
    w.safeCreateIcons();
  }
};

w.syncAllToSheets = async () => {
  if (!w.GAS_URL || w.GAS_URL === "URL_DEPLOY_GAS_ANDA_DISINI") {
    w.showToast('Masukkan URL Google Apps Script Anda terlebih dahulu!', 'error');
    return;
  }
  
  const statusEl = document.getElementById('sheetsSyncStatus');
  if (statusEl) {
    statusEl.innerHTML = '<span style="color:var(--a1); font-weight: 600;"><i data-lucide="loader-2" class="animate-spin lucide-sm" style="display:inline-block; vertical-align:middle; margin-right:4px;"></i> Menyinkronkan seluruh database dari Firestore ke Google Sheets...</span>';
    w.safeCreateIcons();
  }
  
  w.toggleLoading(true, 'Menyinkronkan data Firestore ke Google Sheets...', false);
  try {
    // Fetch all collections from Firestore to ensure the spreadsheet represents the absolute up-to-date state
    const [fsDisp, fsSK, fsArsip, fsTembusan, fsLogs, fsBidang, fsPejabat, fsKategori, fsJenisSurat] = await Promise.all([
      fsGetAll('Disposisi'),
      fsGetAll('SuratKeluar'),
      fsGetAll('Arsip'),
      fsGetAll('Tembusan'),
      fsGetAll('LogAktivitas'),
      fsGetAll('Bidang'),
      fsGetAll('Pejabat'),
      fsGetAll('Kategori'),
      fsGetAll('JenisSurat')
    ]);

    const payload = {
      disposisi: (fsDisp || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0)),
      sk: (fsSK || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0)),
      tembusan: (fsTembusan || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0)),
      arsip: (fsArsip || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0)),
      logs: (fsLogs || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0)),
      bidang: fsBidang || [],
      pejabat: fsPejabat || [],
      kategori: fsKategori || [],
      jenisSurat: fsJenisSurat || []
    };
    
    const cleanPayload = sanitizeForSheets(payload);
    
    const res = await fetch(w.GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'importAll', table: 'Sistem', data: cleanPayload })
    });
    
    let result: any;
    try {
      result = await res.json();
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Respons bukan JSON valid. Pastikan URL Anda adalah URL Web App (berakhiran /exec) dan status deployment Aktif.');
    }
    
    if (result && (result.status === 'success' || result.success)) {
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#0f9d58; font-weight: 600;"><i data-lucide="check-circle" class="lucide-sm" style="display:inline-block; vertical-align:middle; margin-right:4px;"></i> Sinkronisasi ke Google Sheets Berhasil!</span>';
      }
      w.showToast('Semua data berhasil dicadangkan ke Google Sheets!', 'ok');
    } else {
      throw new Error(result.message || 'Gagal menyinkronkan data.');
    }
  } catch (error: any) {
    console.error('[Sync All to Sheets Error]:', error);
    let errMsg = error?.message || 'Gagal menyinkronkan data.';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errMsg = 'Gagal menghubungi server GAS. Pastikan pengaturan "Who has access" adalah "Anyone" dan status deployment Aktif.';
    }
    
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--er); font-weight: 600;"><i data-lucide="x-circle" class="lucide-sm" style="display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${errMsg}</span>`;
    }
    w.showToast(errMsg, 'error');
  } finally {
    w.toggleLoading(false);
    w.safeCreateIcons();
  }
};

w.recordLog = async (act: string, mod: string, desc: string) => {
  if (!w.currentUser) return;
  const now = new Date();
  const newLog = {
    id: Date.now(),
    tgl: now.toISOString().slice(0, 10),
    waktu: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ' WIB',
    actor: w.currentUser.name,
    act: act,
    mod: mod,
    desc: desc
  };
  w.logData.unshift(newLog);
  if (w.currentUser.role === 'admin' || w.currentUser.role === 'pimpinan') w.renderLog();
  w.dbQuery('save', 'LogAktivitas', newLog);
};

w.renderLog = () => {
  let data = [...w.logData];
  const q = (document.querySelector('#pg-log .sri') as any)?.value?.toLowerCase() || '';
  const actFilter = (document.getElementById('f_l_act') as any)?.value || '';
  if (q) data = data.filter((x: any) => (x.actor || '').toLowerCase().includes(q) || (x.desc || '').toLowerCase().includes(q) || (x.mod || '').toLowerCase().includes(q));
  if (actFilter) data = data.filter((x: any) => x.act === actFilter);
  
  const logItemsPerPage = 5;
  const total = data.length;
  const sIdx = (w.currentPageLog - 1) * logItemsPerPage;
  const pData = data.slice(sIdx, sIdx + logItemsPerPage);
  
  const logCt = document.getElementById('logCt');
  if (logCt) logCt.textContent = `Menampilkan ${total === 0 ? 0 : sIdx + 1}-${Math.min(sIdx + logItemsPerPage, total)} dari ${total} catatan`;
  
  const box = document.getElementById('logTimelineBox');
  if (box) {
    if (pData.length === 0) {
      box.innerHTML = '<div style="text-align:center;padding:40px;color:var(--tm);font-size:13.5px;"><i data-lucide="clock" style="display:block;margin:0 auto 12px auto;opacity:0.5;width:32px;height:32px;"></i> Belum ada aktivitas.</div>';
    } else {
      box.innerHTML = pData.map((d: any) => {
        let actColor = d.act === 'CREATE' ? 'act-CREATE' : (d.act === 'UPDATE' ? 'act-UPDATE' : (d.act === 'DELETE' ? 'act-DELETE' : 'act-LOGIN'));
        return `<div class="tl-item"><div class="tl-dot ${actColor}"></div><div class="tl-time"><i data-lucide="calendar" class="lucide-sm"></i> ${w.formatDate(d.tgl)} &nbsp;&bull;&nbsp; <i data-lucide="clock" class="lucide-sm"></i> ${d.waktu}</div><div class="tl-content"><div class="tl-actor">${w.escapeHTML(d.actor)} <span class="tl-module">${w.escapeHTML(d.mod)}</span></div><div class="tl-desc"><strong>${d.act}</strong>: ${w.escapeHTML(d.desc)}</div></div></div>`;
      }).join('');
    }
  }
  w.renderPagination('logPg', total, w.currentPageLog, 'log', logItemsPerPage);
  w.safeCreateIcons();
};

w.filterLog = () => { w.currentPageLog = 1; w.renderLog(); };

w.safeCreateIcons = () => {
  if (w.lucide) {
    try { w.lucide.createIcons(); } catch (e) { console.warn(e); }
  }
};

w.togglePwd = () => {
  const pwdInput = document.getElementById('lg_p') as any;
  const eye = document.getElementById('pwd-eye');
  const eyeOff = document.getElementById('pwd-eye-off');
  if (pwdInput && pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (eye) eye.style.display = 'none';
    if (eyeOff) eyeOff.style.display = 'block';
  } else if (pwdInput) {
    pwdInput.type = 'password';
    if (eye) eye.style.display = 'block';
    if (eyeOff) eyeOff.style.display = 'none';
  }
};

w.doLogin = () => {
  try {
    const u = (document.getElementById('lg_u') as any).value.trim().toLowerCase();
    const p = (document.getElementById('lg_p') as any).value;
    if (!u || !p) {
      w.showToast('Masukkan username dan password', 'error');
      return;
    }
    if (w.storedUsers[u]) {
      let encP = p;
      try { encP = btoa(p); } catch (err) {}
      const isMatch = w.storedUsers[u].pass === encP || w.storedUsers[u].pass === p;
      if (isMatch) {
        w.currentUser = { username: u, role: w.storedUsers[u].role, name: w.storedUsers[u].name };
        localStorage.setItem('ea-auth', JSON.stringify(w.currentUser));
        if (w.storedUsers[u].pass === p) {
          w.storedUsers[u].pass = encP;
          localStorage.setItem('ea-users', JSON.stringify(w.storedUsers));
        }
        w.recordLog('LOGIN', 'Sistem', 'Berhasil masuk ke aplikasi');
        w.playUISound('success');
        w.applyLoginState();
        return;
      }
    }
    const logBox = document.querySelector('.log-box');
    if (logBox) {
      logBox.classList.remove('shake');
      void (logBox as any).offsetWidth;
      logBox.classList.add('shake');
    }
    w.playUISound('error');
    w.showToast('Username atau Password salah', 'error');
  } catch (error) {
    console.error(error);
  }
};

w.confirmLogout = () => {
  w.playUISound('pop');
  document.getElementById('userBox')?.classList.remove('show');
  document.getElementById('modLogout')?.classList.add('op');
  w.safeCreateIcons();
};

w.executeLogout = () => {
  localStorage.removeItem('ea-auth');
  location.reload();
};
