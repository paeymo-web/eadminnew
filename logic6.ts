const w = window as any;

w.openOmniSearch = () => {
  w.playUISound('pop');
  const modal = document.getElementById('modOmniSearch');
  if (modal) modal.classList.add('op');
  const inp = document.getElementById('omniInput') as any;
  if (inp) {
    inp.value = '';
    setTimeout(() => inp.focus(), 150);
  }
  w.runOmniSearch('');
};

w.runOmniSearch = (val: string) => {
  const v = val.trim().toLowerCase();
  const resBox = document.getElementById('omniResults');
  if (!resBox) return;
  if (!v) {
    resBox.innerHTML = `<div style="padding:20px;text-align:center;color:var(--tm);font-size:13px;">Ketik kata kunci (nomor, pengirim, atau perihal) untuk mencari...</div>`;
    return;
  }
  let results: any[] = [];
  w.disposisiData.forEach((x: any) => {
    if ((x.no || '').toLowerCase().includes(v) || (x.fr || '').toLowerCase().includes(v) || (x.hl || '').toLowerCase().includes(v)) {
      results.push({ type: 'Disposisi', id: x.id, no: x.no, sub: `Pengirim: ${x.fr}`, desc: x.hl });
    }
  });
  w.suratKeluarData.forEach((x: any) => {
    if ((x.no || '').toLowerCase().includes(v) || (x.to || '').toLowerCase().includes(v) || (x.hl || '').toLowerCase().includes(v)) {
      results.push({ type: 'SuratKeluar', id: x.id, no: x.no, sub: `Tujuan: ${x.to}`, desc: x.hl });
    }
  });
  w.tembusanData.forEach((x: any) => {
    if ((x.no || '').toLowerCase().includes(v) || (x.to || '').toLowerCase().includes(v) || (x.hl || '').toLowerCase().includes(v) || (x.unit || '').toLowerCase().includes(v)) {
      results.push({ type: 'Tembusan', id: x.id, no: x.no, sub: `Unit: ${x.unit} &bull; Tujuan: ${x.to}`, desc: x.hl });
    }
  });
  w.arsipData.forEach((x: any) => {
    if ((x.no || '').toLowerCase().includes(v) || (x.hl || '').toLowerCase().includes(v)) {
      results.push({ type: 'Arsip', id: x.id, no: x.no, sub: `Kategori: ${x.kat}`, desc: x.hl });
    }
  });

  if (results.length === 0) {
    resBox.innerHTML = `<div style="padding:20px;text-align:center;color:var(--tm);font-size:13px;"><i data-lucide="frown" style="display:block;margin:0 auto 8px auto;opacity:0.5;"></i> Tidak ada hasil untuk "${w.escapeHTML(v)}"</div>`;
  } else {
    resBox.innerHTML = results.map((r: any) => `<div class="omni-item" onclick="window.closeModal('modOmniSearch'); window.view${r.type === 'SuratKeluar' ? 'SuratKeluar' : (r.type === 'Disposisi' ? 'Disposisi' : (r.type === 'Tembusan' ? 'Tembusan' : 'Arsip'))}(${r.id});"><div class="omni-item-title"><span>${w.escapeHTML(r.no)}</span><span class="bdg bp" style="font-size:9.5px;padding:2px 6px;">${r.type}</span></div><div class="omni-item-sub">${r.sub}</div><div class="omni-item-desc">${w.escapeHTML(r.desc)}</div></div>`).join('');
  }
  w.safeCreateIcons();
};

w.toggleTheme = () => {
  w.playUISound('pop');
  const t = document.documentElement.getAttribute('data-theme');
  const next = t === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ea-theme', next);
};

w.toggleUserMenu = () => {
  w.playUISound('pop');
  document.getElementById('userBox')?.classList.toggle('show');
  document.getElementById('notifBox')?.classList.remove('show');
};

w.toggleNotif = () => {
  w.playUISound('pop');
  document.getElementById('notifBox')?.classList.toggle('show');
  document.getElementById('userBox')?.classList.remove('show');
};

w.toggleSidebar = () => {
  w.playUISound('pop');
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    if (window.innerWidth <= 860) {
      sidebar.classList.toggle('show');
      document.getElementById('sbOv')?.classList.toggle('show');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }
};

w.goToPage = (pageId: string) => {
  w.playUISound('pop');
  document.getElementById('sidebar')?.classList.remove('show');
  document.getElementById('sbOv')?.classList.remove('show');
  document.getElementById('userBox')?.classList.remove('show');
  document.getElementById('notifBox')?.classList.remove('show');

  const pages = document.querySelectorAll('.pg');
  pages.forEach((p: any) => p.classList.remove('act'));
  const targetPage = document.getElementById(`pg-${pageId}`);
  if (targetPage) targetPage.classList.add('act');

  const navItems = document.querySelectorAll('.ni');
  navItems.forEach((ni: any) => ni.classList.remove('act'));
  const activeNav = document.querySelector(`.ni[data-page="${pageId}"]`);
  if (activeNav) activeNav.classList.add('act');

  const bnItems = document.querySelectorAll('.bn-item');
  bnItems.forEach((bn: any) => bn.classList.remove('act'));
  const activeBn = document.querySelector(`.bn-item[data-page="${pageId}"]`);
  if (activeBn) activeBn.classList.add('act');

  if (w.pageTitles[pageId]) {
    const pgT = document.getElementById('pgT');
    if (pgT) pgT.textContent = w.pageTitles[pageId][0];
    const bc = document.getElementById('bcText');
    if (bc) bc.textContent = `/ ${w.pageTitles[pageId][0]}`;
  }
  if (pageId === 'pengaturan') {
    const gasUrlInput = document.getElementById('gasUrlInput') as any;
    if (gasUrlInput) {
      gasUrlInput.value = w.GAS_URL || '';
    }
  }
  w.safeCreateIcons();
};

w.switchSetTab = (paneId: string, btn: HTMLElement) => {
  w.playUISound('pop');
  const panes = document.querySelectorAll('.set-pane');
  panes.forEach((p: any) => p.classList.remove('act'));
  const pane = document.getElementById(paneId);
  if (pane) pane.classList.add('act');

  const btns = document.querySelectorAll('.set-tab-btn');
  btns.forEach((b: any) => b.classList.remove('act'));
  btn.classList.add('act');
  w.safeCreateIcons();
};

// --- REAL-TIME TIME CLOCK ---
w.startClock = () => {
  const updateClock = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const clockDate = document.getElementById('clockDate');
    if (clockDate) {
      clockDate.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
    const clockTime = document.getElementById('clockTime');
    if (clockTime) {
      clockTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    }
  };
  setInterval(updateClock, 1000);
  updateClock();
};
