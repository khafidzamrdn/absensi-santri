/* ============================================
   ABSENSI SANTRI - Main Script
   ============================================ */
'use strict';

/* ---------- Constants ---------- */
const STORAGE = {
  SANTRI: 'as_santri_v1',
  ABSENSI: 'as_absensi_v1',
  PIN: 'as_pin_v1',
  THEME: 'as_theme_v1',
  SEEDED: 'as_seeded_v1'
};
const DEFAULT_PIN = '1234';
const STATUS_LIST = ['Hadir', 'Izin', 'Sakit', 'Alpa'];
const STATUS_EMOJI = { Hadir: '✅', Izin: '🟡', Sakit: '🔵', Alpa: '🔴' };
const STATUS_COLOR = { Hadir: '#10b981', Izin: '#eab308', Sakit: '#3b82f6', Alpa: '#ef4444' };
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

/* ---------- Utilities ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function nowTimeStr() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function formatDateID(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_ID[m - 1]} ${y}`;
}
function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}-${y}`;
}
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function uid(prefix = 'ID') {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}
function toast(msg, type = 'info') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'toast'; }, 2400);
}
function confirmDialog(title, msg, okText = 'Ya') {
  return new Promise((resolve) => {
    openModal(`
      <h3>${escapeHtml(title)}</h3>
      <p class="muted" style="margin:0 0 4px;line-height:1.5">${escapeHtml(msg)}</p>
      <div class="modal-actions">
        <button class="btn secondary" id="cf-no">Batal</button>
        <button class="btn danger" id="cf-yes">${escapeHtml(okText)}</button>
      </div>
    `);
    $('#cf-no').onclick = () => { closeModal(); resolve(false); };
    $('#cf-yes').onclick = () => { closeModal(); resolve(true); };
  });
}

/* ---------- State ---------- */
const state = {
  santri: [],
  absensi: [],
  pin: DEFAULT_PIN,
  view: 'dashboard',
  isAdmin: false,
  absensiDate: todayStr(),
  filterKelas: '',
  filterStatus: '',
  searchSantri: '',
  searchAbsensi: '',
  sortSantri: 'az',
  rekapTab: 'santri',
  rekapSantriId: null,
  riwayatMode: 'day',
  riwayatDate: todayStr(),
  riwayatStart: todayStr(),
  riwayatEnd: todayStr(),
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  calSelected: todayStr()
};

/* ---------- Storage ---------- */
function loadAll() {
  try {
    state.santri  = JSON.parse(localStorage.getItem(STORAGE.SANTRI) || '[]');
    state.absensi = JSON.parse(localStorage.getItem(STORAGE.ABSENSI) || '[]');
    state.pin     = localStorage.getItem(STORAGE.PIN) || DEFAULT_PIN;
  } catch (e) {
    console.warn('Load error', e);
    state.santri = []; state.absensi = []; state.pin = DEFAULT_PIN;
  }
}
function saveSantri()  { localStorage.setItem(STORAGE.SANTRI, JSON.stringify(state.santri)); }
function saveAbsensi() { localStorage.setItem(STORAGE.ABSENSI, JSON.stringify(state.absensi)); }
function savePin()     { localStorage.setItem(STORAGE.PIN, state.pin); }

/* ---------- Theme ---------- */
function initTheme() {
  const saved = localStorage.getItem(STORAGE.THEME) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  $('#btn-theme').textContent = saved === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE.THEME, next);
  $('#btn-theme').textContent = next === 'dark' ? '☀️' : '🌙';
}

/* ---------- Demo Data ---------- */
function seedDemoData() {
  if (localStorage.getItem(STORAGE.SEEDED)) return;
  const demo = [
    { id: 'S001', nama: 'Ahmad Fauzi',     kelas: 'XI',  alamat: 'Wonosobo',  jenisKelamin: 'L', keterangan: '' },
    { id: 'S002', nama: 'Budi Santoso',    kelas: 'XI',  alamat: 'Magelang',  jenisKelamin: 'L', keterangan: '' },
    { id: 'S003', nama: 'Candra Wijaya',   kelas: 'X',   alamat: 'Yogyakarta',jenisKelamin: 'L', keterangan: '' },
    { id: 'S004', nama: 'Dimas Pratama',   kelas: 'X',   alamat: 'Semarang',  jenisKelamin: 'L', keterangan: '' },
    { id: 'S005', nama: 'Fajar Nugroho',   kelas: 'XII', alamat: 'Solo',      jenisKelamin: 'L', keterangan: '' }
  ];
  state.santri = demo;
  saveSantri();

  // absensi demo untuk beberapa hari terakhir
  const statuses = ['Hadir','Hadir','Izin','Sakit','Hadir'];
  const out = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tgl = todayStr(d);
    demo.forEach((s, idx) => {
      out.push({
        id: uid('A'),
        santriId: s.id,
        nama: s.nama,
        kelas: s.kelas,
        tanggal: tgl,
        status: statuses[(idx + i) % statuses.length],
        waktuInput: '08:00',
        catatan: ''
      });
    });
  }
  state.absensi = out;
  saveAbsensi();

  localStorage.setItem(STORAGE.SEEDED, '1');
}
function hapusDemoData() {
  state.santri = [];
  state.absensi = [];
  saveSantri(); saveAbsensi();
  localStorage.setItem(STORAGE.SEEDED, '1');
}

/* ---------- Modal ---------- */
function openModal(html) {
  $('#modal-root').innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">${html}</div>
    </div>`;
  $('#modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
}
function closeModal() { $('#modal-root').innerHTML = ''; }

/* ---------- Helpers ---------- */
function getKelasList() {
  const set = new Set(state.santri.map(s => s.kelas).filter(Boolean));
  return Array.from(set).sort();
}
function getAbsensiByDate(tgl) {
  return state.absensi.filter(a => a.tanggal === tgl);
}
function getAbsensiForSantri(santriId) {
  return state.absensi.filter(a => a.santriId === santriId)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
function statsFor(list) {
  const s = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, total: list.length };
  list.forEach(a => { if (s[a.status] != null) s[a.status]++; });
  return s;
}
function countStats(list) {
  const r = { total: list.length, Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
  list.forEach(a => { if (r[a.status] != null) r[a.status]++; });
  return r;
}
function pct(h, t) { return t > 0 ? (h / t) * 100 : 0; }

/* ---------- Navigation ---------- */
const VIEWS = {
  dashboard: renderDashboard,
  santri:    renderSantri,
  absensi:   renderAbsensi,
  riwayat:   renderRiwayat,
  rekap:     renderRekap,
  kalender:  renderKalender,
  pengaturan:renderPengaturan
};
function navigate(view) {
  if (!VIEWS[view]) view = 'dashboard';
  state.view = view;
  $$('.view').forEach(v => v.classList.remove('active'));
  const el = $('#view-' + view);
  if (el) { el.classList.add('active'); VIEWS[view](el); }
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $('#main').scrollTop = 0;
}

/* ================================================================
   VIEW: DASHBOARD
   ================================================================ */
function renderDashboard(root) {
  const today = todayStr();
  const todayAbs = getAbsensiByDate(today);
  const s = countStats(todayAbs);
  const totalSantri = state.santri.length;

  root.innerHTML = `
    <div class="card" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none">
      <div style="font-size:12px;opacity:.9">Assalamu'alaikum 👋</div>
      <div style="font-size:20px;font-weight:800;margin-top:2px">Absensi Santri</div>
      <div style="font-size:12.5px;opacity:.9;margin-top:4px">${formatDateID(today)}</div>
    </div>

    <div class="section-title">📊 Statistik Hari Ini</div>
    <div class="stats-grid">
      <div class="stat-card total"><div class="stat-label">Total Santri</div><div class="stat-value">${totalSantri}</div></div>
      <div class="stat-card hadir"><div class="stat-label">✅ Hadir</div><div class="stat-value">${s.Hadir}</div></div>
      <div class="stat-card izin"><div class="stat-label">🟡 Izin</div><div class="stat-value">${s.Izin}</div></div>
      <div class="stat-card sakit"><div class="stat-label">🔵 Sakit</div><div class="stat-value">${s.Sakit}</div></div>
      <div class="stat-card alpa"><div class="stat-label">🔴 Alpa</div><div class="stat-value">${s.Alpa}</div></div>
      <div class="stat-card"><div class="stat-label">📈 Persentase</div><div class="stat-value">${s.total ? pct(s.Hadir, s.total).toFixed(1) : '0.0'}%</div></div>
    </div>

    <div class="section-title">⚡ Menu Cepat</div>
    <div class="action-grid">
      <button class="action-btn primary" id="dash-absen"><span class="ico">✅</span>Absensi Hari Ini</button>
      <button class="action-btn" id="dash-tambah"><span class="ico">➕</span>Tambah Santri</button>
      <button class="action-btn" id="dash-santri"><span class="ico">👥</span>Daftar Santri</button>
      <button class="action-btn" id="dash-riwayat"><span class="ico">📅</span>Riwayat</button>
      <button class="action-btn" id="dash-rekap"><span class="ico">📊</span>Rekap</button>
      <button class="action-btn" id="dash-kalender"><span class="ico">🗓️</span>Kalender</button>
      <button class="action-btn" id="dash-pengaturan"><span class="ico">⚙️</span>Pengaturan</button>
    </div>

    <div class="card">
      <div class="section-title">🕒 Aktivitas Terbaru</div>
      ${state.absensi.length === 0 ? `<div class="empty"><div class="em">📭</div><p>Belum ada data absensi</p></div>` :
        state.absensi.slice().sort((a,b) => (b.tanggal + b.waktuInput).localeCompare(a.tanggal + a.waktuInput)).slice(0, 5)
          .map(a => `
            <div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-weight:600;font-size:13.5px">${escapeHtml(a.nama)}</div>
                <div class="muted">${formatDateShort(a.tanggal)} • ${a.waktuInput || '-'}</div>
              </div>
              <div>${STATUS_EMOJI[a.status] || ''} <span style="font-size:12.5px;font-weight:600">${escapeHtml(a.status)}</span></div>
            </div>`).join('')
      }
    </div>
  `;

  $('#dash-absen').onclick     = () => { state.absensiDate = today; navigate('absensi'); };
  $('#dash-tambah').onclick    = () => { if (requireAdmin()) openSantriForm(); };
  $('#dash-santri').onclick    = () => navigate('santri');
  $('#dash-riwayat').onclick   = () => navigate('riwayat');
  $('#dash-rekap').onclick     = () => navigate('rekap');
  $('#dash-kalender').onclick  = () => navigate('kalender');
  $('#dash-pengaturan').onclick= () => navigate('pengaturan');
}

/* ================================================================
   VIEW: DAFTAR SANTRI
   ================================================================ */
function renderSantri(root) {
  const kelasList = getKelasList();
  root.innerHTML = `
    <div class="row between mb-12">
      <div class="section-title" style="margin:0">👥 Daftar Santri (${state.santri.length})</div>
      <button class="btn sm" id="btn-add-santri">➕ Tambah</button>
    </div>

    <div class="search-bar">
      <input type="search" class="input" id="s-search" placeholder="🔎 Cari nama / ID..." value="${escapeHtml(state.searchSantri)}" />
    </div>

    <div class="chips" id="kelas-chips">
      <button class="chip ${!state.filterKelas ? 'active' : ''}" data-kelas="">Semua</button>
      ${kelasList.map(k => `<button class="chip ${state.filterKelas === k ? 'active' : ''}" data-kelas="${escapeHtml(k)}">${escapeHtml(k)}</button>`).join('')}
    </div>

    <div class="field">
      <label>Urutkan</label>
      <select class="select" id="sort-santri">
        <option value="az">Nama A-Z</option>
        <option value="za">Nama Z-A</option>
        <option value="id">ID Santri</option>
      </select>
    </div>

    <div id="santri-list"></div>
  `;

  $('#btn-add-santri').onclick = () => { if (requireAdmin()) openSantriForm(); };
  $('#s-search').addEventListener('input', (e) => { state.searchSantri = e.target.value; renderSantriList(); });
  $('#sort-santri').value = state.sortSantri;
  $('#sort-santri').addEventListener('change', (e) => { state.sortSantri = e.target.value; renderSantriList(); });
  $$('#kelas-chips .chip').forEach(c => c.onclick = () => {
    state.filterKelas = c.dataset.kelas;
    renderSantri(root);
  });

  renderSantriList();
}

function renderSantriList() {
  const wrap = $('#santri-list');
  if (!wrap) return;
  const q = state.searchSantri.toLowerCase().trim();
  let list = state.santri.slice();

  if (state.filterKelas) list = list.filter(s => s.kelas === state.filterKelas);
  if (q) list = list.filter(s =>
    s.nama.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
  );

  if (state.sortSantri === 'az') list.sort((a, b) => a.nama.localeCompare(b.nama));
  else if (state.sortSantri === 'za') list.sort((a, b) => b.nama.localeCompare(a.nama));
  else list.sort((a, b) => a.id.localeCompare(b.id));

  if (list.length === 0) {
    wrap.innerHTML = `<div class="empty"><div class="em">👤</div><p>Belum ada data santri</p><p class="muted">Tekan tombol "Tambah" di atas</p></div>`;
    return;
  }

  wrap.innerHTML = list.map(s => {
    const initial = (s.nama || '?').trim().charAt(0).toUpperCase();
    return `
      <div class="list-item" data-id="${escapeHtml(s.id)}">
        <div class="avatar">${escapeHtml(initial)}</div>
        <div class="list-body" data-detail="1">
          <div class="list-title">${escapeHtml(s.nama)}</div>
          <div class="list-sub"><span class="badge">${escapeHtml(s.kelas || '-')}</span> • ${escapeHtml(s.id)}</div>
        </div>
        <div class="list-actions">
          <button class="icon-action" data-edit="${escapeHtml(s.id)}">✏️</button>
          <button class="icon-action" data-del="${escapeHtml(s.id)}">🗑️</button>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    if (requireAdmin()) openSantriForm(b.dataset.edit);
  });
  wrap.querySelectorAll('[data-del]').forEach(b => b.onclick = async (e) => {
    e.stopPropagation();
    if (!requireAdmin()) return;
    const ok = await confirmDialog('Hapus Santri?', 'Data santri dan seluruh riwayat absensinya akan dihapus permanen.', 'Hapus');
    if (!ok) return;
    state.santri = state.santri.filter(x => x.id !== b.dataset.del);
    state.absensi = state.absensi.filter(a => a.santriId !== b.dataset.del);
    saveSantri(); saveAbsensi();
    toast('Santri dihapus', 'success');
    renderSantri($('#view-santri'));
  });
  wrap.querySelectorAll('.list-item').forEach(item => {
    item.querySelector('[data-detail]').onclick = () => openSantriDetail(item.dataset.id);
  });
}

function openSantriForm(id) {
  const isEdit = !!id;
  const s = isEdit ? state.santri.find(x => x.id === id) : { id: '', nama: '', kelas: '', alamat: '', jenisKelamin: '', keterangan: '' };
  if (!s) return;

  openModal(`
    <h3>${isEdit ? '✏️ Edit Santri' : '➕ Tambah Santri'}</h3>
    <div class="field">
      <label>ID Santri</label>
      <input class="input" id="f-id" value="${escapeHtml(s.id || '')}" placeholder="otomatis jika kosong" ${isEdit ? 'disabled' : ''} />
    </div>
    <div class="field">
      <label>Nama Lengkap *</label>
      <input class="input" id="f-nama" value="${escapeHtml(s.nama)}" placeholder="Contoh: Ahmad Fauzi" />
    </div>
    <div class="field">
      <label>Kelas *</label>
      <input class="input" id="f-kelas" value="${escapeHtml(s.kelas)}" list="kelas-opt" placeholder="Contoh: XI" />
      <datalist id="kelas-opt">
        ${getKelasList().map(k => `<option value="${escapeHtml(k)}"></option>`).join('')}
      </datalist>
    </div>
    <div class="field">
      <label>Alamat</label>
      <input class="input" id="f-alamat" value="${escapeHtml(s.alamat || '')}" placeholder="Contoh: Wonosobo" />
    </div>
    <div class="field">
      <label>Jenis Kelamin</label>
      <select class="select" id="f-jk">
        <option value="">-</option>
        <option value="L" ${s.jenisKelamin === 'L' ? 'selected' : ''}>Laki-laki</option>
        <option value="P" ${s.jenisKelamin === 'P' ? 'selected' : ''}>Perempuan</option>
      </select>
    </div>
    <div class="field">
      <label>Keterangan</label>
      <textarea class="textarea" id="f-ket" placeholder="Opsional">${escapeHtml(s.keterangan || '')}</textarea>
    </div>
    <div class="modal-actions">
      <button class="btn secondary" id="f-cancel">Batal</button>
      <button class="btn" id="f-save">Simpan</button>
    </div>
  `);

  $('#f-cancel').onclick = closeModal;
  $('#f-save').onclick = () => {
    const nama = $('#f-nama').value.trim();
    const kelas = $('#f-kelas').value.trim();
    if (!nama) { toast('Nama wajib diisi', 'error'); return; }
    if (!kelas) { toast('Kelas wajib diisi', 'error'); return; }

    const data = {
      id: isEdit ? s.id : ($('#f-id').value.trim() || uid('S')),
      nama, kelas,
      alamat: $('#f-alamat').value.trim(),
      jenisKelamin: $('#f-jk').value,
      keterangan: $('#f-ket').value.trim()
    };

    if (isEdit) {
      const idx = state.santri.findIndex(x => x.id === s.id);
      state.santri[idx] = data;
      // update nama/kelas di absensi
      state.absensi.forEach(a => {
        if (a.santriId === data.id) { a.nama = data.nama; a.kelas = data.kelas; }
      });
      saveAbsensi();
    } else {
      if (state.santri.some(x => x.id === data.id)) { toast('ID sudah dipakai', 'error'); return; }
      state.santri.push(data);
    }
    saveSantri();
    closeModal();
    toast(isEdit ? 'Santri diperbarui' : 'Santri ditambahkan', 'success');
    if (state.view === 'santri') renderSantri($('#view-santri'));
    else if (state.view === 'dashboard') renderDashboard($('#view-dashboard'));
  };
}

function openSantriDetail(id) {
  const s = state.santri.find(x => x.id === id);
  if (!s) return;
  const hist = getAbsensiForSantri(s.id);
  const st = countStats(hist);
  const persen = st.total ? pct(st.Hadir, st.total).toFixed(1) : '0.0';

  openModal(`
    <h3>👤 Detail Santri</h3>
    <div style="text-align:center;margin-bottom:12px">
      <div class="avatar" style="width:64px;height:64px;font-size:24px;margin:0 auto">${escapeHtml((s.nama||'?').charAt(0).toUpperCase())}</div>
      <div style="font-weight:800;font-size:17px;margin-top:8px">${escapeHtml(s.nama)}</div>
      <div class="muted">${escapeHtml(s.id)} • Kelas ${escapeHtml(s.kelas || '-')}</div>
    </div>
    <div class="card" style="margin-bottom:10px">
      <div class="row between"><span class="muted">Alamat</span><b>${escapeHtml(s.alamat || '-')}</b></div>
      <div class="row between mt-8"><span class="muted">Jenis Kelamin</span><b>${s.jenisKelamin === 'L' ? 'Laki-laki' : s.jenisKelamin === 'P' ? 'Perempuan' : '-'}</b></div>
      <div class="row between mt-8"><span class="muted">Keterangan</span><b>${escapeHtml(s.keterangan || '-')}</b></div>
    </div>
    <div clas
