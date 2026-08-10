import { IS_PREVIEW, GAS_URL, initialBidangData, initialPejabatData, initialKategoriData, defaultUsers, initialJenisSuratData } from './data';

// Define global arrays on window
const w = window as any;

w.IS_PREVIEW = IS_PREVIEW;
w.GAS_URL = GAS_URL;
w.disposisiData = JSON.parse(localStorage.getItem('ea-disposisi') || '[]');
w.suratKeluarData = JSON.parse(localStorage.getItem('ea-sk') || '[]');
w.tembusanData = JSON.parse(localStorage.getItem('ea-tembusan') || '[]');
w.arsipData = JSON.parse(localStorage.getItem('ea-arsip') || '[]');
w.logData = JSON.parse(localStorage.getItem('ea-logs') || '[]');
w.pendingImportData = null;

w.saveAllToLocal = () => {
  try {
    localStorage.setItem('ea-disposisi', JSON.stringify(w.disposisiData || []));
    localStorage.setItem('ea-sk', JSON.stringify(w.suratKeluarData || []));
    localStorage.setItem('ea-tembusan', JSON.stringify(w.tembusanData || []));
    localStorage.setItem('ea-arsip', JSON.stringify(w.arsipData || []));
    localStorage.setItem('ea-logs', JSON.stringify(w.logData || []));
    localStorage.setItem('ea-jenis-surat', JSON.stringify(w.jenisSuratData || []));
    localStorage.setItem('ea-jabatan', JSON.stringify(w.jabatanData || []));
  } catch (e) {
    console.warn('Gagal menyimpan cache lokal (localStorage penuh). Data tetap tersimpan di server jika online.');
  }
};

w.bidangData = JSON.parse(localStorage.getItem('ea-bidang') || 'null') || [...initialBidangData];
w.pejabatData = JSON.parse(localStorage.getItem('ea-pejabat') || 'null') || [...initialPejabatData];
w.kategoriData = JSON.parse(localStorage.getItem('ea-kategori') || 'null') || [...initialKategoriData];
w.jenisSuratData = JSON.parse(localStorage.getItem('ea-jenis-surat') || 'null') || [...initialJenisSuratData];
w.jabatanData = JSON.parse(localStorage.getItem('ea-jabatan') || 'null') || [
  { id: '1', nama: 'Sekretaris Direktur' },
  { id: '2', nama: 'Plt Asdir I, Kesiswaan, Humas, PPDB' },
  { id: '3', nama: 'Kabag Kurikulum LPIS' },
  { id: '4', nama: 'Kapus. SEP LPIS' },
  { id: '5', nama: 'Kapus. SMI LPIS' },
  { id: '6', nama: 'Kapus. Bisnis' }
];
w.storedUsers = JSON.parse(localStorage.getItem('ea-users') || 'null') || { ...defaultUsers };

w.deleteTargetTable = '';
w.deleteTargetId = null;
w.editBidangModeCode = null;
w.editUserTarget = null;
w.editPejabatModeId = null;
w.editKategoriModeId = null;
w.editJenisSuratModeId = null;
w.editJabatanModeId = null;
w.currentUser = null;
w.editModeId = null;

w.currentPageD = 1;
w.currentPageSK = 1;
w.currentPageArsip = 1;
w.currentPageT = 1;
w.currentPageLog = 1;
w.itemsPerPage = 15;

w.pageTitles = {
  dashboard: ['Dashboard', 'Ringkasan aktivitas hari ini'],
  disposisi: ['Disposisi Surat', 'Kelola pencatatan surat masuk dan disposisi'],
  sk: ['Surat Keluar', 'Kelola penerbitan dokumen keluar'],
  tembusan: ['Tembusan Surat', 'Penyampaian salinan dokumen antar unit'],
  arsip: ['Arsip Dokumen', 'Penyimpanan berkas Cloud terpadu'],
  log: ['Log Aktivitas', 'Rekam jejak dan audit keamanan sistem'],
  pengaturan: ['Pengaturan', 'Preferensi sistem & sinkronisasi database']
};

// Web Audio sound generator
let audioCtx: any = null;
w.initAudio = () => {
  if (!audioCtx) {
    const A = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (A) audioCtx = new A();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
};

w.playUISound = (type: string) => {
  if (!audioCtx) w.initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + .1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.1, now + .05);
    gain.gain.exponentialRampToValueAtTime(.01, now + .3);
    osc.start(now);
    osc.stop(now + .3);
  } else if (type === 'error') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + .2);
    gain.gain.setValueAtTime(.1, now);
    gain.gain.exponentialRampToValueAtTime(.01, now + .2);
    osc.start(now);
    osc.stop(now + .2);
  } else if (type === 'notif') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(783.99, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.1, now + .05);
    gain.gain.exponentialRampToValueAtTime(.01, now + .5);
    osc.start(now);
    osc.stop(now + .5);
  } else if (type === 'pop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + .1);
    gain.gain.setValueAtTime(.05, now);
    gain.gain.exponentialRampToValueAtTime(.01, now + .1);
    osc.start(now);
    osc.stop(now + .1);
  }
};

w.escapeHTML = (str: any) => {
  if (!str) return '';
  return str.toString().replace(/[&<>'"]/g, (t: string) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[t] || t));
};

w.cleanSt = (str: any) => {
  if (!str) return '';
  return w.escapeHTML(String(str).replace(/(&amp;#9679;|&#9679;|●)/g, '').trim());
};

w.formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

w.formatDateTime = (timestampId: any) => {
  if (!timestampId) return '—';
  const d = new Date(parseInt(timestampId));
  if (isNaN(d.getTime())) return w.formatDate(timestampId);
  return `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} - ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`;
};

w.getToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

w.safeName = (str: string) => {
  return (str || '').trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);
};

w.escapeCSVField = (str: any) => {
  return str ? `"${String(str).replace(/"/g, '""')}"` : '""';
};

w.getGreeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
};

w.getCategoryBadge = (text: string) => {
  const t = (text || '').toLowerCase();
  if (t.includes('sk ') || t.includes('keputusan')) return 'background:rgba(236,72,153,.1);color:#db2777;border:1px solid rgba(236,72,153,.3);';
  if (t.includes('undangan')) return 'background:rgba(56,189,248,.1);color:#0284c7;border:1px solid rgba(56,189,248,.3);';
  if (t.includes('sertifikat')) return 'background:rgba(234,179,8,.1);color:#ca8a04;border:1px solid rgba(234,179,8,.3);';
  if (t.includes('masuk')) return 'background:rgba(99,102,241,.1);color:#4f46e5;border:1px solid rgba(99,102,241,.3);';
  if (t.includes('keluar')) return 'background:rgba(16,185,129,.1);color:#059669;border:1px solid rgba(16,185,129,.3);';
  if (t.includes('tembusan')) return 'background:rgba(249,115,22,.1);color:#ea580c;border:1px solid rgba(249,115,22,.3);';
  if (t.includes('dinas') || t.includes('nota')) return 'background:rgba(139,92,246,.1);color:#7c3aed;border:1px solid rgba(139,92,246,.3);';
  return 'background:var(--bg);color:var(--ts);border:1px solid var(--tm);';
};

w.renderBadge = (text: string) => {
  return `<span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;${w.getCategoryBadge(text)}">${w.escapeHTML(text)}</span>`;
};

w.getSkeletonHTML = (cols: number) => {
  let h = '';
  const wClasses = ['sk-md', 'sk-lg', 'sk-md', 'sk-sh'];
  for (let i = 0; i < 4; i++) {
    let t = '';
    for (let j = 0; j < cols; j++) {
      if (j === 0) t += `<td data-label="#"><div class="skeleton-box" style="width:24px;"></div></td>`;
      else if (j === cols - 1) t += `<td data-label="Aksi" style="text-align:right;"><div style="display:inline-flex;gap:6px;"><div class="skeleton-box sk-av"></div><div class="skeleton-box sk-av"></div></div></td>`;
      else if (j === cols - 2) t += `<td data-label="Status"><div class="skeleton-box sk-bdg"></div></td>`;
      else t += `<td><div class="skeleton-box ${wClasses[j % 4]}"></div></td>`;
    }
    h += `<tr>${t}</tr>`;
  }
  return h;
};

w.showToast = (msg: string, type: string) => {
  w.playUISound(type === 'ok' ? 'success' : type === 'error' ? 'error' : 'notif');
  let c = document.getElementById('tsts');
  if (!c) {
    c = document.createElement('div');
    c.id = 'tsts';
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  const icon = type === 'ok' ? '<i data-lucide="check-circle" class="lucide-sm"></i> ' : (type === 'error' ? '<i data-lucide="alert-circle" class="lucide-sm"></i> ' : '<i data-lucide="info" class="lucide-sm"></i> ');
  t.className = `tst t-${type === 'ok' ? 'ok' : type === 'error' ? 'er' : 'i'}`;
  t.innerHTML = icon + msg;
  c.appendChild(t);
  w.safeCreateIcons();
  setTimeout(() => {
    t.style.animation = 'fadeOutToast 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards';
    setTimeout(() => t.remove(), 400);
  }, 3500);
};

w.toggleLoading = (show: boolean, text = 'Memproses Data...', withProgress = false) => {
  const ol = document.getElementById('loadingOverlay') as any;
  if (!ol) return;
  const txtEl = document.getElementById('loadingText');
  if (txtEl) txtEl.textContent = text;
  const pw = document.getElementById('loadProgWrap');
  const pb = document.getElementById('loadProgBar');
  if (show) {
    ol.style.display = 'flex';
    if (withProgress) {
      if (pw) pw.style.display = 'block';
      if (pb) {
        pb.style.width = '0%';
        ol.prog = 0;
        ol.progInt = setInterval(() => {
          ol.prog += Math.random() * 20;
          if (ol.prog > 95) ol.prog = 95;
          pb.style.width = ol.prog + '%';
        }, 150);
      }
    } else {
      if (pw) pw.style.display = 'none';
    }
  } else {
    if (ol.progInt) clearInterval(ol.progInt);
    if (pw && pw.style.display === 'block') {
      if (pb) pb.style.width = '100%';
      setTimeout(() => { ol.style.display = 'none'; }, 300);
    } else {
      ol.style.display = 'none';
    }
  }
};
