import { fsGetAll, fsImportAll, fsSave, fsListenAll } from './firestore_adapter';

const w = window as any;

w.applyLoginState = () => {
  try {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.style.opacity = '0';
      setTimeout(() => { loginScreen.style.display = 'none'; }, 400);
    }
    const appShell = document.getElementById('appShell');
    if (appShell) appShell.classList.add('visible');

    const safeSetText = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    const userInitials = (w.currentUser.name || 'AD').slice(0, 2).toUpperCase();
    safeSetText('topAvt', userInitials);
    safeSetText('ubAvt', userInitials);
    safeSetText('ubName', w.currentUser.name);
    safeSetText('ubRole', w.currentUser.role);

    const dashNav = document.querySelector('.ni[data-page="dashboard"]');
    if (dashNav) dashNav.classList.remove('admin-only');
    const bnHome = document.getElementById('bnHome');
    if (bnHome) bnHome.classList.remove('admin-only');

    const pgS = document.getElementById('pgS');
    if (pgS && (w.currentUser.role === 'admin' || w.currentUser.role === 'pimpinan')) {
      pgS.innerHTML = `<i data-lucide="home" class="lucide-sm"></i> ${w.getGreeting()}, ${w.escapeHTML(w.currentUser.name)}! 👋 <span id="bcText">/ Dashboard</span>`;
      const heroTitle = document.getElementById('heroTitle');
      if (heroTitle) heroTitle.textContent = `${w.getGreeting()}, ${w.escapeHTML(w.currentUser.name)}! ✨`;
    } else if (pgS) {
      pgS.innerHTML = `<i data-lucide="home" class="lucide-sm"></i> Pusat Informasi ${w.escapeHTML(w.currentUser.name)} <span id="bcText">/ Dashboard</span>`;
    }
    w.safeCreateIcons();

    if (w.currentUser.role !== 'admin' && w.currentUser.role !== 'pimpinan') {
      document.body.classList.add('role-unit');
      const adminView = document.getElementById('adminDashboardView'); if (adminView) adminView.style.display = 'none';
      const unitView = document.getElementById('unitDashboardView'); if (unitView) unitView.style.display = 'block';
      safeSetText('unitWelcomeName', `Halo, ${w.currentUser.name}!`);
      w.goToPage('dashboard');
    } else {
      document.body.classList.remove('role-unit');
      const adminView = document.getElementById('adminDashboardView'); if (adminView) adminView.style.display = 'block';
      const unitView = document.getElementById('unitDashboardView'); if (unitView) unitView.style.display = 'none';
      w.goToPage('dashboard');

      if (w.currentUser.role === 'admin') {
        w.renderBidangSettings();
        w.renderUserSettings();
        w.renderPejabatSettings();
        w.renderKategoriSettings();
        w.renderJenisSuratSettings();
        w.renderLog();
      }
    }

    w.populateKategoriDropdown();
    w.loadDataFromServer();
  } catch (error) {
    console.error(error);
  }
};

w.loadDataFromServer = async () => {
  const arr = ['dTb', 'skTb', 'arsipTb', 'tTembusanTb'];
  arr.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = w.getSkeletonHTML(7);
  });
  w.toggleLoading(true, 'Menghubungkan ke database...', false);
  
  try {
    // 1. Fetch from Firestore collections in parallel (including Config and Users)
    const [fsDisp, fsSK, fsArsip, fsTembusan, fsLogs, fsBidang, fsPejabat, fsKategori, fsJenisSurat, fsConfig, fsUsers, fsJabatan] = await Promise.all([
      fsGetAll('Disposisi'),
      fsGetAll('SuratKeluar'),
      fsGetAll('Arsip'),
      fsGetAll('Tembusan'),
      fsGetAll('LogAktivitas'),
      fsGetAll('Bidang'),
      fsGetAll('Pejabat'),
      fsGetAll('Kategori'),
      fsGetAll('JenisSurat'),
      fsGetAll('Config'),
      fsGetAll('Users'),
      fsGetAll('Jabatan')
    ]);

    // Apply the saved GAS URL configuration from Firestore if it exists
    if (fsConfig && fsConfig.length > 0) {
      const gasUrlDoc = fsConfig.find((doc: any) => doc.id === 'gas_url');
      if (gasUrlDoc && gasUrlDoc.url) {
        w.GAS_URL = gasUrlDoc.url;
        localStorage.setItem('ea-gas-url', gasUrlDoc.url);
      }
    }

    // Unconditionally load & seed Users
    if (!fsUsers || fsUsers.length === 0) {
      console.log('Seeding default users to Firestore...');
      for (const [uId, uData] of Object.entries(w.storedUsers) as any) {
        await fsSave('Users', { id: uId, username: uId, name: uData.name, role: uData.role, pass: uData.pass });
      }
    } else {
      fsUsers.forEach((u: any) => {
        if (u.id || u.username) {
          const username = u.username || u.id;
          w.storedUsers[username] = {
            name: u.name,
            role: u.role,
            pass: u.pass
          };
        }
      });
      localStorage.setItem('ea-users', JSON.stringify(w.storedUsers));
    }

    // Unconditionally load & seed Bidang
    if (!fsBidang || fsBidang.length === 0) {
      console.log('Seeding default bidang to Firestore...');
      for (const b of w.bidangData) {
        await fsSave('Bidang', { id: b.code, code: b.code, name: b.name });
      }
    } else {
      w.bidangData = fsBidang.sort((a: any, b: any) => parseInt(a.code || 0) - parseInt(b.code || 0));
      localStorage.setItem('ea-bidang', JSON.stringify(w.bidangData));
    }

    // Unconditionally load & seed Pejabat
    if (!fsPejabat || fsPejabat.length === 0) {
      console.log('Seeding default pejabat to Firestore...');
      for (const p of w.pejabatData) {
        await fsSave('Pejabat', p);
      }
    } else {
      w.pejabatData = fsPejabat;
      localStorage.setItem('ea-pejabat', JSON.stringify(w.pejabatData));
    }

    // Unconditionally load & seed Kategori
    if (!fsKategori || fsKategori.length === 0) {
      console.log('Seeding default kategori to Firestore...');
      for (const k of w.kategoriData) {
        await fsSave('Kategori', k);
      }
    } else {
      w.kategoriData = fsKategori;
      localStorage.setItem('ea-kategori', JSON.stringify(w.kategoriData));
    }

    // Unconditionally load & seed JenisSurat
    if (!fsJenisSurat || fsJenisSurat.length === 0) {
      console.log('Seeding default jenis surat to Firestore...');
      for (const js of w.jenisSuratData) {
        await fsSave('JenisSurat', js);
      }
    } else {
      w.jenisSuratData = fsJenisSurat;
      localStorage.setItem('ea-jenis-surat', JSON.stringify(w.jenisSuratData));
    }

    // Unconditionally load & seed Jabatan
    if (!fsJabatan || fsJabatan.length === 0) {
      console.log('Seeding default jabatan to Firestore...');
      for (const j of w.jabatanData) {
        await fsSave('Jabatan', j);
      }
    } else {
      w.jabatanData = fsJabatan.sort((a: any, b: any) => parseInt(a.id || 0) - parseInt(b.id || 0));
      localStorage.setItem('ea-jabatan', JSON.stringify(w.jabatanData));
    }

    // Refresh layout views and settings dropdowns right away
    if (w.currentUser && w.currentUser.role === 'admin') {
      w.renderBidangSettings();
      w.renderUserSettings();
      w.renderPejabatSettings();
      w.renderKategoriSettings();
      w.renderJenisSuratSettings();
      w.renderJabatanSettings();
    }
    w.populateKategoriDropdown();
    w.populateBidangDropdown();
    w.populatePejabatDropdown();
    w.populateJenisSuratDropdown();
    w.populateDToDropdown();

    const hasFirestoreData = (fsDisp && fsDisp.length > 0) || (fsSK && fsSK.length > 0) || (fsArsip && fsArsip.length > 0);

    if (!w.realtimeInitialized) w.initRealtimeListeners();

    if (hasFirestoreData) {
      w.disposisiData = (fsDisp || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      w.suratKeluarData = (fsSK || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      w.arsipData = (fsArsip || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      w.tembusanData = (fsTembusan || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      w.logData = (fsLogs || []).sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      
      if (w.saveAllToLocal) w.saveAllToLocal();
      w.toggleLoading(false);
      
      if (w.currentUser) {
        w.showToast('Data berhasil dimuat dari Firestore (Real-time Fast)', 'ok');
        w.updateDashboardStats();
        w.renderDisposisi();
        w.renderSuratKeluar();
        w.renderArsip();
        w.renderTembusan();
      }
      return;
    }
  } catch (fsErr) {
    console.warn('Gagal memuat dari Firestore, mencoba fallback ke GAS:', fsErr);
  }

  // Remove w.IS_PREVIEW constraint to enable real-time backup/sync for preview links
  if (!w.GAS_URL || w.GAS_URL === "URL_DEPLOY_GAS_ANDA_DISINI") {
    setTimeout(() => {
      w.toggleLoading(false);
      if (w.currentUser) {
        w.updateDashboardStats();
        w.renderDisposisi();
        w.renderSuratKeluar();
        w.renderArsip();
        w.renderTembusan();
        if (w.currentUser.role === 'admin' || w.currentUser.role === 'pimpinan') w.renderLog();
        w.showToast('Sistem Siap (Mode Local Canvas)', 'info');
      }
    }, 1000);
    return;
  }

  try {
    const resAll = await fetch(w.GAS_URL + '?action=get');
    const fbData = await resAll.json();
    if (fbData) {
      w.disposisiData = fbData.disposisi || [];
      w.suratKeluarData = fbData.sk || [];
      w.arsipData = fbData.arsip || [];
      w.tembusanData = fbData.tembusan || [];
      w.logData = fbData.logs || [];
      if (fbData.bidang && fbData.bidang.length > 0) {
        w.bidangData = fbData.bidang;
        localStorage.setItem('ea-bidang', JSON.stringify(w.bidangData));
      }
      if (fbData.pejabat && fbData.pejabat.length > 0) {
        w.pejabatData = fbData.pejabat;
        localStorage.setItem('ea-pejabat', JSON.stringify(w.pejabatData));
      }
      if (fbData.kategori && fbData.kategori.length > 0) {
        w.kategoriData = fbData.kategori;
        localStorage.setItem('ea-kategori', JSON.stringify(w.kategoriData));
      }
      if (fbData.jenisSurat && fbData.jenisSurat.length > 0) {
        w.jenisSuratData = fbData.jenisSurat;
        localStorage.setItem('ea-jenis-surat', JSON.stringify(w.jenisSuratData));
      }
      if (w.saveAllToLocal) w.saveAllToLocal();

      // Background import fetched GAS data to Firestore to keep them in sync
      fsImportAll({
        'Disposisi': w.disposisiData,
        'SuratKeluar': w.suratKeluarData,
        'Arsip': w.arsipData,
        'Tembusan': w.tembusanData,
        'LogAktivitas': w.logData,
        'Bidang': w.bidangData,
        'Pejabat': w.pejabatData,
        'Kategori': w.kategoriData,
        'JenisSurat': w.jenisSuratData
      }).then(() => {
        console.log('Inisialisasi data Firestore dari Google Sheets berhasil.');
      }).catch(err => {
        console.warn('Inisialisasi Firestore gagal:', err);
      });
    }
    w.showToast('Data berhasil disinkronisasi dari Google Sheets & diimpor ke Firestore', 'ok');
  } catch (e) {
    w.showToast('Gagal memuat data dari server', 'error');
  }
  w.toggleLoading(false);
  w.updateDashboardStats();
  w.renderDisposisi();
  w.renderSuratKeluar();
  w.renderArsip();
  w.renderTembusan();
};

w.renderUserSettings = () => {
  const container = document.getElementById('userListContainer');
  if (!container) return;
  let html = '';
  for (const [uId, uData] of Object.entries(w.storedUsers) as any) {
    if (uId === 'admin' || uId === 'pimpinan') continue;
    html += `<div class="bdg-list-item"><div class="bdg-list-text" style="width:120px">${w.escapeHTML(uData.name)}</div><div style="font-size:11px; color:var(--tm); flex:1">Pass: <strong style="color:var(--tp); letter-spacing:2px">••••••</strong></div><button class="btn bg2 bxs" onclick="window.openModalUser('${uId}')" style="padding:0; width:28px; height:28px;"><i data-lucide="edit" style="width:14px; height:14px;"></i></button></div>`;
  }
  container.innerHTML = html;
  w.safeCreateIcons();
};

w.openModalUser = (uId: string) => {
  w.playUISound('pop');
  w.editUserTarget = uId;
  const trg = document.getElementById('resetUserTarget');
  if (trg) trg.textContent = w.storedUsers[uId].name;
  const inp = document.getElementById('new_password_input') as any;
  if (inp) inp.value = '';
  document.getElementById('modUser')?.classList.add('op');
};

w.saveNewPassword = async () => {
  const np = (document.getElementById('new_password_input') as any).value.trim();
  if (!np || np.length < 4) return w.showToast('Password minimal 4 karakter', 'error');
  w.storedUsers[w.editUserTarget].pass = btoa(np);
  localStorage.setItem('ea-users', JSON.stringify(w.storedUsers));
  w.showToast('Password berhasil diperbarui!', 'ok');
  w.recordLog('UPDATE', 'Sistem', `Memperbarui sandi untuk unit: ${w.storedUsers[w.editUserTarget].name}`);
  document.getElementById('modUser')?.classList.remove('op');
  w.renderUserSettings();
  await w.dbQuery('save', 'Users', { id: w.editUserTarget, username: w.editUserTarget, name: w.storedUsers[w.editUserTarget].name, role: w.storedUsers[w.editUserTarget].role, pass: btoa(np) });
};

w.renderBidangSettings = () => {
  const container = document.getElementById('bidangListContainer');
  if (!container) return;
  if (w.bidangData.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--tm); font-size:13px;">Belum ada bidang.</div>`;
    return;
  }
  container.innerHTML = w.bidangData.map((b: any) => `<div class="bdg-list-item"><div class="bdg-list-text"><span class="bdg-list-code">${w.escapeHTML(b.code)}</span> ${w.escapeHTML(b.name)}</div><div style="display:flex; gap:6px;"><button class="btn bg2 bxs" onclick="window.openModalBidang('edit', '${b.code}')" style="padding:0; width:28px; height:28px;"><i data-lucide="edit" style="width:14px; height:14px;"></i></button><button class="btn bd2 bxs" onclick="window.deleteBidang('${b.code}')" style="padding:0; width:28px; height:28px;"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button></div></div>`).join('');
  w.safeCreateIcons();
};

w.getBdgDisplay = (code: string) => {
  if (!code) return '—';
  const b = w.bidangData.find((x: any) => x.code == code);
  return b ? `${parseInt(b.code, 10)}. ${b.name}` : code;
};

w.populateBidangDropdown = () => {
  const options = w.bidangData.map((b: any) => `<option value="${b.code}">${w.escapeHTML(w.getBdgDisplay(b.code))}</option>`).join('');
  const allOptions = '<option value="">Semua Bidang</option>' + options;
  const pilihOptions = '<option value="">Pilih Bidang</option>' + options;
  
  ['sk_bdg', 't_bdg', 'a_bdg'].forEach(id => {
    const sel = document.getElementById(id) as any;
    if (sel) sel.innerHTML = pilihOptions;
  });
  
  ['f_sk_bdg', 'f_t_bdg', 'f_a_bdg'].forEach(id => {
    const sel = document.getElementById(id) as any;
    if (sel) sel.innerHTML = allOptions;
  });
};

w.openModalBidang = (mode: string, code: string) => {
  w.playUISound('pop');
  w.editBidangModeCode = null;
  (document.getElementById('bdg_code') as any).value = '';
  (document.getElementById('bdg_name') as any).value = '';
  const title = document.getElementById('modBdgT');
  if (mode === 'edit') {
    w.editBidangModeCode = code;
    const b = w.bidangData.find((x: any) => x.code == code);
    if (b) {
      if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Bidang';
      (document.getElementById('bdg_code') as any).value = b.code;
      (document.getElementById('bdg_name') as any).value = b.name;
    }
  } else {
    if (title) title.innerHTML = '<i data-lucide="folder-plus"></i> Tambah Bidang';
  }
  document.getElementById('modBidang')?.classList.add('op');
  w.safeCreateIcons();
};

w.saveBidang = async () => {
  let c = (document.getElementById('bdg_code') as any).value.trim();
  let n = (document.getElementById('bdg_name') as any).value.trim();
  if (!c || !n) return w.showToast('Kode Angka dan Nama wajib diisi!', 'error');
  c = c.padStart(2, '0');
  let targetId = w.editBidangModeCode ? w.editBidangModeCode : c;
  if (w.editBidangModeCode) {
    const idx = w.bidangData.findIndex((x: any) => x.code == w.editBidangModeCode);
    if (idx > -1) {
      w.bidangData[idx] = { code: c, name: n, id: targetId };
      w.showToast('Bidang diperbarui', 'ok');
    }
  } else {
    if (w.bidangData.find((x: any) => x.code == c)) return w.showToast('Kode angka sudah ada!', 'error');
    w.bidangData.push({ code: c, name: n, id: targetId });
    w.bidangData.sort((a: any, b: any) => parseInt(a.code) - parseInt(b.code));
    w.showToast('Bidang ditambahkan', 'ok');
  }
  localStorage.setItem('ea-bidang', JSON.stringify(w.bidangData));
  document.getElementById('modBidang')?.classList.remove('op');
  w.renderBidangSettings();
  await w.dbQuery('save', 'Bidang', { id: targetId, code: c, name: n });
};

w.deleteBidang = async (code: string) => {
  w.playUISound('pop');
  if (!confirm(`Hapus bidang dengan kode ${code}?`)) return;
  w.bidangData = w.bidangData.filter((x: any) => x.code != code);
  localStorage.setItem('ea-bidang', JSON.stringify(w.bidangData));
  w.showToast('Bidang dihapus', 'info');
  w.renderBidangSettings();
  await w.dbQuery('delete', 'Bidang', { id: code });
};

w.renderPejabatSettings = () => {
  const container = document.getElementById('pejabatListContainer');
  if (!container) return;
  if (w.pejabatData.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--tm); font-size:13px;">Belum ada pejabat.</div>`;
    return;
  }
  container.innerHTML = w.pejabatData.map((p: any) => `<div class="bdg-list-item"><div class="bdg-list-text" style="flex:1; white-space:normal; overflow:visible; display:flex; align-items:center; gap:8px;">${p.isDefault ? '<i data-lucide="star" style="color:var(--a1); fill:var(--a1); width:16px; height:16px;"></i>' : ''}${w.escapeHTML(p.nama)}</div><div style="display:flex; gap:6px;">${!p.isDefault ? `<button class="btn bg2 bxs" onclick="window.setDefaultPejabat('${p.id}')" title="Jadikan Default" style="padding:0; width:28px; height:28px;"><i data-lucide="star" style="width:14px; height:14px;"></i></button>` : ''}<button class="btn bg2 bxs" onclick="window.openModalPejabat('edit', '${p.id}')" style="padding:0; width:28px; height:28px;"><i data-lucide="edit" style="width:14px; height:14px;"></i></button><button class="btn bd2 bxs" onclick="window.deletePejabat('${p.id}')" style="padding:0; width:28px; height:28px;"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button></div></div>`).join('');
  w.safeCreateIcons();
};

w.setDefaultPejabat = async (id: string) => {
  w.playUISound('pop');
  w.pejabatData.forEach((p: any) => p.isDefault = (p.id == id));
  localStorage.setItem('ea-pejabat', JSON.stringify(w.pejabatData));
  w.renderPejabatSettings();
  w.showToast('Pejabat Default diatur', 'ok');
  await w.dbQuery('save', 'Pejabat', w.pejabatData.find((p: any) => p.id == id));
};

w.populatePejabatDropdown = () => {
  const sel = document.getElementById('sk_ttd') as any;
  if (!sel) return;
  sel.innerHTML = '<option value="">Pilih Penanda Tangan</option>' + w.pejabatData.map((p: any) => `<option value="${w.escapeHTML(p.nama)}">${w.escapeHTML(p.nama)}</option>`).join('');
};

w.openModalPejabat = (mode: string, id: string) => {
  w.playUISound('pop');
  w.editPejabatModeId = null;
  (document.getElementById('pejabat_name') as any).value = '';
  const title = document.getElementById('modPejabatT');
  if (mode === 'edit') {
    w.editPejabatModeId = id;
    const p = w.pejabatData.find((x: any) => x.id == id);
    if (p) {
      if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Pejabat';
      (document.getElementById('pejabat_name') as any).value = p.nama;
    }
  } else {
    if (title) title.innerHTML = '<i data-lucide="user-plus"></i> Tambah Pejabat';
  }
  document.getElementById('modPejabat')?.classList.add('op');
  w.safeCreateIcons();
};

w.savePejabat = async () => {
  let n = (document.getElementById('pejabat_name') as any).value.trim();
  if (!n) return w.showToast('Nama wajib diisi!', 'error');
  let newId = w.editPejabatModeId || Date.now().toString();
  if (w.editPejabatModeId) {
    const idx = w.pejabatData.findIndex((x: any) => x.id == w.editPejabatModeId);
    if (idx > -1) {
      w.pejabatData[idx].nama = n;
      w.showToast('Pejabat diperbarui', 'ok');
    }
  } else {
    if (w.pejabatData.find((x: any) => x.nama.toLowerCase() === n.toLowerCase())) return w.showToast('Pejabat sudah ada!', 'error');
    w.pejabatData.push({ id: newId, nama: n, isDefault: w.pejabatData.length === 0 });
    w.showToast('Pejabat ditambahkan', 'ok');
  }
  localStorage.setItem('ea-pejabat', JSON.stringify(w.pejabatData));
  document.getElementById('modPejabat')?.classList.remove('op');
  w.renderPejabatSettings();
  await w.dbQuery('save', 'Pejabat', { id: newId, nama: n, isDefault: w.pejabatData.find((p: any) => p.id == newId).isDefault });
};

w.deletePejabat = async (id: string) => {
  w.playUISound('pop');
  if (!confirm(`Hapus data pejabat ini?`)) return;
  w.pejabatData = w.pejabatData.filter((x: any) => x.id != id);
  localStorage.setItem('ea-pejabat', JSON.stringify(w.pejabatData));
  w.showToast('Pejabat dihapus', 'info');
  w.renderPejabatSettings();
  await w.dbQuery('delete', 'Pejabat', { id: id });
};

w.renderKategoriSettings = () => {
  const container = document.getElementById('kategoriListContainer');
  if (!container) return;
  if (w.kategoriData.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--tm); font-size:13px;">Belum ada kategori.</div>`;
    return;
  }
  container.innerHTML = w.kategoriData.map((p: any) => `<div class="bdg-list-item"><div class="bdg-list-text" style="flex:1; white-space:normal; overflow:visible;"><i data-lucide="folder" class="lucide-sm" style="color:var(--tm)"></i> ${w.escapeHTML(p.nama)}</div><div style="display:flex; gap:6px;"><button class="btn bg2 bxs" onclick="window.openModalKategori('edit', '${p.id}')" style="padding:0; width:28px; height:28px;"><i data-lucide="edit" style="width:14px; height:14px;"></i></button><button class="btn bd2 bxs" onclick="window.deleteKategori('${p.id}')" style="padding:0; width:28px; height:28px;"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button></div></div>`).join('');
  w.safeCreateIcons();
};

w.populateKategoriDropdown = () => {
  const selA = document.getElementById('a_kat') as any;
  const selF = document.getElementById('f_a_kat') as any;
  let opts = '<option value="">Semua Kategori</option>';
  let optsReq = '<option value="">Pilih Kategori</option>';
  w.kategoriData.forEach((k: any) => {
    opts += `<option value="${w.escapeHTML(k.nama)}">${w.escapeHTML(k.nama)}</option>`;
    optsReq += `<option value="${w.escapeHTML(k.nama)}">${w.escapeHTML(k.nama)}</option>`;
  });
  if (selF) selF.innerHTML = opts;
  if (selA) selA.innerHTML = optsReq;
};

w.openModalKategori = (mode: string, id: string) => {
  w.playUISound('pop');
  w.editKategoriModeId = null;
  (document.getElementById('kategori_name') as any).value = '';
  const title = document.getElementById('modKategoriT');
  if (mode === 'edit') {
    w.editKategoriModeId = id;
    const p = w.kategoriData.find((x: any) => x.id == id);
    if (p) {
      if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Kategori';
      (document.getElementById('kategori_name') as any).value = p.nama;
    }
  } else {
    if (title) title.innerHTML = '<i data-lucide="folder-plus"></i> Tambah Kategori';
  }
  document.getElementById('modKategori')?.classList.add('op');
  w.safeCreateIcons();
};

w.saveKategori = async () => {
  let n = (document.getElementById('kategori_name') as any).value.trim();
  if (!n) return w.showToast('Kategori wajib diisi!', 'error');
  let newId = w.editKategoriModeId || Date.now().toString();
  if (w.editKategoriModeId) {
    const idx = w.kategoriData.findIndex((x: any) => x.id == w.editKategoriModeId);
    if (idx > -1) {
      w.kategoriData[idx].nama = n;
      w.showToast('Kategori diperbarui', 'ok');
    }
  } else {
    if (w.kategoriData.find((x: any) => x.nama.toLowerCase() === n.toLowerCase())) return w.showToast('Kategori sudah ada!', 'error');
    w.kategoriData.push({ id: newId, nama: n });
    w.showToast('Kategori ditambahkan', 'ok');
  }
  localStorage.setItem('ea-kategori', JSON.stringify(w.kategoriData));
  document.getElementById('modKategori')?.classList.remove('op');
  w.renderKategoriSettings();
  w.populateKategoriDropdown();
  await w.dbQuery('save', 'Kategori', { id: newId, nama: n });
};

w.deleteKategori = async (id: string) => {
  w.playUISound('pop');
  if (!confirm(`Hapus kategori ini?`)) return;
  w.kategoriData = w.kategoriData.filter((x: any) => x.id != id);
  localStorage.setItem('ea-kategori', JSON.stringify(w.kategoriData));
  w.showToast('Kategori dihapus', 'info');
  w.renderKategoriSettings();
  w.populateKategoriDropdown();
  await w.dbQuery('delete', 'Kategori', { id: id });
};

w.renderJenisSuratSettings = () => {
  const container = document.getElementById('jenisSuratListContainer');
  if (!container) return;
  if (w.jenisSuratData.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--tm); font-size:13px;">Belum ada jenis surat.</div>`;
    return;
  }
  container.innerHTML = w.jenisSuratData.map((p: any) => `<div class="bdg-list-item"><div class="bdg-list-text" style="flex:1; white-space:normal; overflow:visible;"><i data-lucide="file" class="lucide-sm" style="color:var(--tm)"></i> ${w.escapeHTML(p.nama)}</div><div style="display:flex; gap:6px;"><button class="btn bg2 bxs" onclick="window.openModalJenisSurat('edit', '${p.id}')" style="padding:0; width:28px; height:28px;"><i data-lucide="edit" style="width:14px; height:14px;"></i></button><button class="btn bd2 bxs" onclick="window.deleteJenisSurat('${p.id}')" style="padding:0; width:28px; height:28px;"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button></div></div>`).join('');
  w.safeCreateIcons();
};

w.populateJenisSuratDropdown = () => {
  const sel = document.getElementById('sk_j') as any;
  if (!sel) return;
  sel.innerHTML = w.jenisSuratData.map((p: any) => `<option value="${w.escapeHTML(p.nama)}">${w.escapeHTML(p.nama)}</option>`).join('');
};

w.openModalJenisSurat = (mode: string, id: string) => {
  w.playUISound('pop');
  w.editJenisSuratModeId = null;
  const inp = document.getElementById('jenis_surat_name') as any;
  if (inp) inp.value = '';
  const title = document.getElementById('modJenisSuratT');
  if (mode === 'edit') {
    w.editJenisSuratModeId = id;
    const p = w.jenisSuratData.find((x: any) => x.id == id);
    if (p) {
      if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Jenis Surat';
      if (inp) inp.value = p.nama;
    }
  } else {
    if (title) title.innerHTML = '<i data-lucide="folder-plus"></i> Tambah Jenis Surat';
  }
  document.getElementById('modJenisSurat')?.classList.add('op');
  w.safeCreateIcons();
};

w.saveJenisSurat = async () => {
  let n = (document.getElementById('jenis_surat_name') as any).value.trim();
  if (!n) return w.showToast('Nama Jenis Surat wajib diisi!', 'error');
  let newId = w.editJenisSuratModeId || Date.now().toString();
  if (w.editJenisSuratModeId) {
    const idx = w.jenisSuratData.findIndex((x: any) => x.id == w.editJenisSuratModeId);
    if (idx > -1) {
      w.jenisSuratData[idx].nama = n;
      w.showToast('Jenis Surat diperbarui', 'ok');
    }
  } else {
    if (w.jenisSuratData.find((x: any) => x.nama.toLowerCase() === n.toLowerCase())) return w.showToast('Jenis Surat sudah ada!', 'error');
    w.jenisSuratData.push({ id: newId, nama: n });
    w.showToast('Jenis Surat ditambahkan', 'ok');
  }
  localStorage.setItem('ea-jenis-surat', JSON.stringify(w.jenisSuratData));
  document.getElementById('modJenisSurat')?.classList.remove('op');
  w.renderJenisSuratSettings();
  w.populateJenisSuratDropdown();
  await w.dbQuery('save', 'JenisSurat', { id: newId, nama: n });
};

w.deleteJenisSurat = async (id: string) => {
  w.playUISound('pop');
  if (!confirm(`Hapus Jenis Surat ini?`)) return;
  w.jenisSuratData = w.jenisSuratData.filter((x: any) => x.id != id);
  localStorage.setItem('ea-jenis-surat', JSON.stringify(w.jenisSuratData));
  w.showToast('Jenis Surat dihapus', 'info');
  w.renderJenisSuratSettings();
  w.populateJenisSuratDropdown();
  await w.dbQuery('delete', 'JenisSurat', { id: id });
};

w.renderJabatanSettings = () => {
  const container = document.getElementById('jabatanListContainer');
  if (!container) return;
  if (!w.jabatanData || w.jabatanData.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--tm); font-size:13px;">Belum ada jabatan disposisi.</div>`;
    return;
  }
  container.innerHTML = w.jabatanData.map((j: any) => `
    <div class="bdg-list-item">
      <div class="bdg-list-text" style="flex:1; white-space:normal; overflow:visible; display:flex; align-items:center; gap:8px;">
        <i data-lucide="award" class="lucide-sm" style="color:var(--tm)"></i> ${w.escapeHTML(j.nama)}
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn bg2 bxs" onclick="window.openModalJabatan('edit', '${j.id}')" style="padding:0; width:28px; height:28px;">
          <i data-lucide="edit" style="width:14px; height:14px;"></i>
        </button>
        <button class="btn bd2 bxs" onclick="window.deleteJabatan('${j.id}')" style="padding:0; width:28px; height:28px;">
          <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
        </button>
      </div>
    </div>
  `).join('');
  w.safeCreateIcons();
};

w.populateDToDropdown = () => {
  const sel = document.getElementById('d_to') as any;
  if (!sel) return;
  let opts = '<option value="">Pilih</option>';
  if (w.jabatanData && w.jabatanData.length > 0) {
    w.jabatanData.forEach((j: any) => {
      opts += `<option value="${w.escapeHTML(j.nama)}">${w.escapeHTML(j.nama)}</option>`;
    });
  }
  opts += '<option value="Lainnya">Lainnya (Tulis Manual)...</option>';
  sel.innerHTML = opts;
};

w.openModalJabatan = (mode: string, id: string) => {
  w.playUISound('pop');
  w.editJabatanModeId = null;
  const inp = document.getElementById('jabatan_name') as any;
  if (inp) inp.value = '';
  const title = document.getElementById('modJabatanT');
  if (mode === 'edit') {
    w.editJabatanModeId = id;
    const j = w.jabatanData.find((x: any) => x.id == id);
    if (j) {
      if (title) title.innerHTML = '<i data-lucide="edit"></i> Edit Jabatan Disposisi';
      if (inp) inp.value = j.nama;
    }
  } else {
    if (title) title.innerHTML = '<i data-lucide="plus-circle"></i> Tambah Jabatan Disposisi';
  }
  document.getElementById('modJabatan')?.classList.add('op');
  w.safeCreateIcons();
};

w.saveJabatan = async () => {
  let n = (document.getElementById('jabatan_name') as any).value.trim();
  if (!n) return w.showToast('Nama Jabatan wajib diisi!', 'error');
  let newId = w.editJabatanModeId || Date.now().toString();
  if (w.editJabatanModeId) {
    const idx = w.jabatanData.findIndex((x: any) => x.id == w.editJabatanModeId);
    if (idx > -1) {
      w.jabatanData[idx].nama = n;
      w.showToast('Jabatan Disposisi diperbarui', 'ok');
    }
  } else {
    if (w.jabatanData.find((x: any) => x.nama.toLowerCase() === n.toLowerCase())) return w.showToast('Jabatan sudah ada!', 'error');
    w.jabatanData.push({ id: newId, nama: n });
    w.showToast('Jabatan Disposisi ditambahkan', 'ok');
  }
  localStorage.setItem('ea-jabatan', JSON.stringify(w.jabatanData));
  document.getElementById('modJabatan')?.classList.remove('op');
  w.renderJabatanSettings();
  w.populateDToDropdown();
  await w.dbQuery('save', 'Jabatan', { id: newId, nama: n });
};

w.deleteJabatan = async (id: string) => {
  w.playUISound('pop');
  if (!confirm(`Hapus Jabatan Disposisi ini?`)) return;
  w.jabatanData = w.jabatanData.filter((x: any) => x.id != id);
  localStorage.setItem('ea-jabatan', JSON.stringify(w.jabatanData));
  w.showToast('Jabatan Disposisi dihapus', 'info');
  w.renderJabatanSettings();
  w.populateDToDropdown();
  await w.dbQuery('delete', 'Jabatan', { id: id });
};


w.initRealtimeListeners = () => {
  w.realtimeInitialized = true;
  fsListenAll('Disposisi', (data) => {
    w.disposisiData = data.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
    if (w.currentUser) {
      w.updateDashboardStats();
      w.renderDisposisi();
      if (w.saveAllToLocal) w.saveAllToLocal();
    }
  });

  fsListenAll('SuratKeluar', (data) => {
    w.suratKeluarData = data.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
    if (w.currentUser) {
      w.updateDashboardStats();
      w.renderSuratKeluar();
      if (w.saveAllToLocal) w.saveAllToLocal();
    }
  });

  fsListenAll('Arsip', (data) => {
    w.arsipData = data.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
    if (w.currentUser) {
      w.renderArsip();
      if (w.saveAllToLocal) w.saveAllToLocal();
    }
  });

  fsListenAll('Tembusan', (data) => {
    w.tembusanData = data.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
    if (w.currentUser) {
      w.updateDashboardStats();
      w.renderTembusan();
      if (w.saveAllToLocal) w.saveAllToLocal();
    }
  });

  fsListenAll('LogAktivitas', (data) => {
    w.logData = data.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
    if (w.currentUser && (w.currentUser.role === 'admin' || w.currentUser.role === 'pimpinan')) {
      w.renderLog();
    }
  });
};
