'use strict';

/******************************************************
 * SUPABASE CONFIGURATION
 * Masukkan URL dan Anon Key dari Project Supabase-mu
 ******************************************************/
const SUPABASE_URL = 'https://qzluybsuucqqoyetawjg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bHV5YnN1dWNxcW95ZXRhd2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzIyOTQsImV4cCI6MjA5OTIwODI5NH0.u-SgQvCuBxVWkn6McoUfcPs5jV4F1r1Ots8hAGZkPww';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/******************************************************
 * CACHE CONFIG
 ******************************************************/
const MASTER_CACHE_KEY    = 'vistrack_master_data';
const MASTER_CACHE_EXPIRY = 15 * 60 * 1000; // 15 menit

function saveMasterCache(fl, dmp) {
  try {
    sessionStorage.setItem(MASTER_CACHE_KEY, JSON.stringify({
      fl:        fl,
      dmp:       dmp,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

function loadMasterCache() {
  try {
    const raw = sessionStorage.getItem(MASTER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.timestamp) return null;
    if (Date.now() - parsed.timestamp > MASTER_CACHE_EXPIRY) {
      sessionStorage.removeItem(MASTER_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch (e) { return null; }
}

function clearMasterCache() {
  try { sessionStorage.removeItem(MASTER_CACHE_KEY); } catch (e) {}
}

/******************************************************
 * TL CACHE
 ******************************************************/
const TL_CACHE_KEY    = 'vistrack_tl_data';
const TL_CACHE_EXPIRY = 5 * 60 * 1000; // 5 menit

function saveTLCache(data) {
  try { sessionStorage.setItem(TL_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch(e) {}
}
function loadTLCache() {
  try {
    const raw = sessionStorage.getItem(TL_CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Date.now() - p.timestamp > TL_CACHE_EXPIRY) { sessionStorage.removeItem(TL_CACHE_KEY); return null; }
    return p.data;
  } catch(e) { return null; }
}
function clearTLCache() { try { sessionStorage.removeItem(TL_CACHE_KEY); } catch(e) {} }

/******************************************************
 * FL DATA CACHE
 ******************************************************/
const FL_DATA_CACHE_KEY    = 'vistrack_fl_data';
const FL_DATA_CACHE_EXPIRY = 5 * 60 * 1000;

function saveFLDataCache(data) {
  try { sessionStorage.setItem(FL_DATA_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch(e) {}
}
function loadFLDataCache() {
  try {
    const raw = sessionStorage.getItem(FL_DATA_CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Date.now() - p.timestamp > FL_DATA_CACHE_EXPIRY) { sessionStorage.removeItem(FL_DATA_CACHE_KEY); return null; }
    return p.data;
  } catch(e) { return null; }
}
function clearFLDataCache() { try { sessionStorage.removeItem(FL_DATA_CACHE_KEY); } catch(e) {} }

/******************************************************
 * THEME MANAGER — Dark/Light Mode Toggle
 ******************************************************/
const THEME_STORAGE_KEY = 'vistrack_theme';

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  } catch (e) { return 'light'; }
}

function saveTheme(theme) {
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch (e) {}
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeButtons(theme);
}

function updateThemeButtons(theme) {
  const isDark    = theme === 'dark';
  const iconClass = isDark ? 'fa fa-sun' : 'fa fa-moon';
  const label     = isDark ? 'Mode Terang' : 'Mode Gelap';

  const btnLogin = document.getElementById('themeToggleLogin');
  if (btnLogin) {
    const icon = btnLogin.querySelector('i');
    if (icon) icon.className = iconClass;
  }

  const btnSidebar = document.getElementById('themeToggleSidebar');
  if (btnSidebar) {
    const icon = btnSidebar.querySelector('i');
    if (icon) icon.className = iconClass;
    const labelEl = document.getElementById('themeToggleLabel');
    if (labelEl) labelEl.textContent = label;
  }

  const btnMobile = document.getElementById('themeToggleMobile');
  if (btnMobile) {
    const icon = btnMobile.querySelector('i');
    if (icon) icon.className = iconClass;
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
}

function initTheme() {
  applyTheme(getSavedTheme());
}

/******************************************************
 * STATE
 ******************************************************/
let rawDMP        = [];
let rawFL         = [];
let dmpMarkersMap = {};
let map           = null;
let markersLayer  = null;
let currentVisitData = [];
let flNameToId    = {};
let frontlinerIdToName = {};
let currentIdTeamleader = 'ALL';
let currentIsSuperuser = false;
let cachedVerifStats = [];
let modalSession  = 0;
const verifDataMap = {};
let currentVerifStatusFilter = 'all';

const PLACEHOLDER_LOADING = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<' + 'svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">' +
  '<' + 'rect width="300" height="200" fill="#F3F4F6"/>' +
  '<' + 'text x="50%" y="50%" font-family="sans-serif" font-size="13" fill="#9CA3AF" text-anchor="middle" dy=".3em">Memuat foto...</' + 'text>' +
  '</' + 'svg>'
);
const PLACEHOLDER_NOTFOUND = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<' + 'svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">' +
  '<' + 'rect width="300" height="200" fill="#FEF2F2"/>' +
  '<' + 'text x="50%" y="46%" font-family="sans-serif" font-size="32" fill="#DC2626" text-anchor="middle">⚠</' + 'text>' +
  '<' + 'text x="50%" y="70%" font-family="sans-serif" font-size="12" fill="#991B1B" text-anchor="middle">Foto tidak ditemukan</' + 'text>' +
  '</' + 'svg>'
);

/******************************************************
 * UTIL HELPERS
 ******************************************************/
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTodayString() {
  const d  = new Date();
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + da;
}

function flIdToName(flId) {
  if (!flId || flId === 'ALL') return 'ALL';
  return frontlinerIdToName[flId] || flId;
}

function showLoading(text) {
  Swal.fire({
    title: text || 'Memuat data...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });
}

function showError(msg) {
  Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: msg || 'Tidak diketahui', confirmButtonColor: '#2563EB' });
}

function showSuccess(msg) {
  Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, confirmButtonColor: '#2563EB', timer: 1800, showConfirmButton: false });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Format Date Helper Pengganti Utilities.formatDate
function formatDateJS(dateVal, format) {
  if (!dateVal) return '-';
  const dateObj = new Date(dateVal);
  if (isNaN(dateObj)) return dateVal;
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const shortMonths = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  const d = dateObj.getDate().toString().padStart(2, '0');
  const mFull = months[dateObj.getMonth()];
  const mShort = shortMonths[dateObj.getMonth()];
  const y = dateObj.getFullYear();
  const H = dateObj.getHours().toString().padStart(2, '0');
  const M = dateObj.getMinutes().toString().padStart(2, '0');

  if (format === "dd MMM yyyy, HH:mm 'WIB'") return `${d} ${mShort} ${y}, ${H}:${M} WIB`;
  if (format === "dd MMMM yyyy") return `${d} ${mFull} ${y}`;
  if (format === "dd/MM/yyyy HH:mm") return `${d}/${(dateObj.getMonth()+1).toString().padStart(2,'0')}/${y} ${H}:${M}`;
  return `${y}-${(dateObj.getMonth()+1).toString().padStart(2,'0')}-${d}`;
}

/******************************************************
 * SUPABASE API ROUTER (Pengganti google.script.run)
 ******************************************************/
async function callServer(fnName, args, onSuccess, opts) {
  opts = opts || {};
  
  if (fnName !== 'verifyLogin' && !sessionStorage.getItem('vistrack_user')) {
    Swal.close();
    Swal.fire({
      icon: 'warning',
      title: 'Sesi Berakhir',
      text: 'Sesi Anda sudah tidak aktif. Silakan login kembali.',
      confirmButtonColor: '#2563EB',
      allowOutsideClick: false
    }).then(function () { showLoginPage(); });
    return;
  }

  try {
    let res;
    switch (fnName) {
      case 'verifyLogin': res = await api_verifyLogin(...args); break;
      case 'getDashboardData': res = await api_getDashboardData(...args); break;
      case 'getMasterDataList': res = await api_getMasterDataList(...args); break;
      case 'getTeamleaderData': res = await api_getTeamleaderData(...args); break;
      case 'getFrontlinerData': res = await api_getFrontlinerData(...args); break;
      case 'getVerifikasiData': res = await api_getVerifikasiData(...args); break;
      case 'processVerifikasi': res = await api_processVerifikasi(...args); break;
      case 'deleteKunjungan': res = await api_deleteKunjungan(...args); break;
      case 'saveDMP': res = await api_saveDMP(...args); break;
      case 'deleteDMP': res = await api_deleteDMP(...args); break;
      case 'saveTeamleader': res = await api_saveTeamleader(...args); break;
      case 'deleteTeamleader': res = await api_deleteTeamleader(...args); break;
      case 'saveFrontliner': res = await api_saveFrontliner(...args); break;
      case 'deleteFrontliner': res = await api_deleteFrontliner(...args); break;
      case 'replaceDmpData': res = await api_replaceDmpData(...args); break;
      case 'getVisitDataFiltered': res = await api_getVisitDataFiltered(...args); break;
      case 'resolveMultipleDriveImages': res = await api_resolveMultipleDriveImages(...args); break;
      case 'getJEMPreviewData': res = await api_getJEMPreviewData(...args); break;
      case 'getRKMData': res = await api_getRKMData(...args); break;
      case 'generateVisitPDF': 
      case 'generateJEMPdf':
        res = await api_invokeEdgeFunction(fnName, args); break;
      default:
        throw new Error(`Fungsi ${fnName} belum dipetakan ke Supabase.`);
    }

    if (!opts.keepLoading) Swal.close();
    if (typeof onSuccess === 'function') onSuccess(res);

  } catch (err) {
    Swal.close();
    const msg = err && err.message ? err.message : '';
    if (msg.toLowerCase().indexOf('jwt') >= 0 || msg.toLowerCase().indexOf('permission') >= 0) {
      Swal.fire({
        icon: 'warning', title: 'Akses Ditolak',
        text: 'Sesi Anda mungkin sudah berakhir. Silakan login kembali.',
        confirmButtonColor: '#2563EB'
      }).then(function () { showLoginPage(); });
    } else {
      showError(msg || 'Koneksi server gagal.');
    }
  }
}

/******************************************************
 * FUNGSI-FUNGSI SUPABASE API
 ******************************************************/

async function api_verifyLogin(email, password) {
  const passwordHash = await sha256(password.trim());
  const { data, error } = await supabase
    .from('teamleaders')
    .select('*')
    .ilike('email', email.trim())
    .single();

  if (error || !data) return { success: false, message: 'Email tidak ditemukan.' };
  if (data.password_hash !== passwordHash) return { success: false, message: 'Password salah.' };

  return {
    success: true,
    name: data.name,
    idTeamleader: data.id_teamleader,
    isSuperuser: data.id_teamleader.toUpperCase() === 'SUPERUSER'
  };
}

async function api_getDashboardData(frontlinerName, filterDate, idTeamleader, isSuperuser) {
  const dObj = new Date(filterDate);
  const y = dObj.getFullYear();
  const m = String(dObj.getMonth() + 1).padStart(2, '0');
  const startOfMonth = `${y}-${m}-01`;
  const endOfMonth = `${y}-${m}-31`;

  let query = supabase.from('data_visit').select('*');
  if (!isSuperuser) query = query.eq('id_teamleader', idTeamleader);
  if (frontlinerName !== 'ALL') query = query.eq('frontliner_name', frontlinerName);
  
  query = query.gte('tanggal', startOfMonth).lte('tanggal', endOfMonth);

  const { data, error } = await query;
  if (error) return { success: false, message: error.message };

  let todayC = 0, todayClosed = 0, todayP = 0, todayNonP = 0;
  let monthC = data.length, monthP = 0;
  let totalVerified = 0;
  const detail = [];
  const verifStatsMap = {};

  data.forEach(row => {
    const tgl = row.tanggal;
    const isToday = (tgl === filterDate);
    const planoStat = row.status_planogram || '';
    const isPlano = planoStat.toLowerCase().includes('planogram') && 
                    !planoStat.toLowerCase().includes('non') && 
                    !planoStat.toLowerCase().includes('tidak');
    
    if (isPlano) monthP++;
    if (row.status_verif && row.status_verif.includes('Sudah')) totalVerified++;

    if (isToday) {
      todayC++;
      if ((row.status_toko || '').toLowerCase().includes('tutup')) todayClosed++;
      if (isPlano) todayP++;
      else todayNonP++;

      detail.push({
        out: row.outlet_name, rayon: row.rayon, addr: row.outlet_address,
        checkin: row.waktu_checkin, checkout: row.waktu_checkout,
        duration: row.durasi, statusToko: row.status_toko, stat: row.status_planogram
      });
    }

    const fl = row.frontliner_name || 'Tanpa Nama';
    if (!verifStatsMap[fl]) verifStatsMap[fl] = { total: 0, verified: 0 };
    verifStatsMap[fl].total++;
    if (row.status_verif && row.status_verif.includes('Sudah')) verifStatsMap[fl].verified++;
  });

  const verifStats = Object.keys(verifStatsMap).map(k => ({
    name: k, total: verifStatsMap[k].total, verified: verifStatsMap[k].verified
  }));

  return {
    success: true, todayC, todayClosed, todayP, todayNonP, monthC, monthP,
    verifStats, totalVisits: monthC, totalVerified, detail
  };
}

async function api_getMasterDataList(idTeamleader, isSuperuser) {
  let flQuery = supabase.from('frontliners').select('*');
  if (!isSuperuser) flQuery = flQuery.eq('id_teamleader', idTeamleader);
  const { data: flData } = await flQuery;

  const flArray = [['HEADER', 'ID', 'Name', 'Position', 'Area', 'ID TL', 'TL Name', 'Email']];
  (flData || []).forEach(r => {
    flArray.push(['', r.id_frontliner, r.name, r.position, r.area, r.id_teamleader, r.tl_name, r.email]);
  });

  let dmpQuery = supabase.from('DMP').select('*');
  if (!isSuperuser) dmpQuery = dmpQuery.eq('id_teamleader', idTeamleader);
  const { data: dmpData } = await dmpQuery;

  const dmpArray = [['H0', 'H1', 'outlet_id', 'area', 'outlet_name', 'outlet_address', 'province', 'city', 'district', 'type_outlet', 'type_display', 'rayon', 'latlong']];
  (dmpData || []).forEach(r => {
    dmpArray.push([
      r.id_frontliner, r.id_teamleader, r.outlet_id, r.area, r.outlet_name, r.outlet_address, 
      r.province, r.city, r.district, r.type_outlet, r.type_display, r.rayon, r.latlong
    ]);
  });

  return { success: true, fl: flArray, dmp: dmpArray };
}

async function api_processVerifikasi(rowIdx, idResp, p, statusToko, statusCheckout, a, c) {
  const { error } = await supabase
    .from('data_visit')
    .update({
      status_verif: 'Sudah Verifikasi',
      status_planogram: p,
      status_toko: statusToko,
      status_checkout: statusCheckout,
      status_add_display: a,
      catatan_verifikator: c
    })
    .eq('resp_id', idResp);

  return error ? { success: false, message: error.message } : { success: true };
}

async function api_deleteKunjungan(idResp) {
  const { error } = await supabase.from('data_visit').delete().eq('resp_id', idResp);
  return error ? { success: false, message: error.message } : { success: true };
}

async function api_saveDMP(values, isEdit, oldOutletId) {
  const row = {
    id_frontliner: values[0], id_teamleader: values[1], outlet_id: values[2],
    area: values[3], outlet_name: values[4], outlet_address: values[5],
    province: values[6], city: values[7], district: values[8],
    type_outlet: values[9], type_display: values[10], rayon: values[11], latlong: values[12]
  };
  const { error } = isEdit
    ? await supabase.from('DMP').update(row).eq('outlet_id', oldOutletId)
    : await supabase.from('DMP').insert(row);
  return error ? { success: false, message: error.message } : { success: true };
}

async function api_deleteDMP(outletId) {
  const { error } = await supabase.from('DMP').delete().eq('outlet_id', outletId);
  return error ? { success: false, message: error.message } : { success: true };
}

async function api_getTeamleaderData() {
  const { data, error } = await supabase.from('teamleaders').select('*');
  if (error) return { success: false, message: error.message };
  const formatted = data.map(r => ({
    rowIdx: r.id, email: r.email, idTL: r.id_teamleader, name: r.name, area: r.area
  }));
  return { success: true, data: formatted };
}

async function api_saveTeamleader(values, isEdit, id) {
  const row = { email: values[0], id_teamleader: values[1], name: values[2], area: values[3] };
  const { error } = isEdit 
    ? await supabase.from('teamleaders').update(row).eq('id', id)
    : await supabase.from('teamleaders').insert(row);
  return error ? { success: false, message: error.message } : { success: true };
}

async function api_deleteTeamleader(id) {
  const { error } = await supabase.from('teamleaders').delete().eq('id', id);
  return error ? { success: false, message: error.message } : { success: true };
}

async function api_getFrontlinerData(idTeamleader, isSuperuser) {
  let query = supabase.from('frontliners').select('*');
  if (!isSuperuser) query = query.eq('id_teamleader', idTeamleader);
  const { data, error } = await query;
  if (error) return { success: false, message: error.message };
  
  const formatted = data.map(r => ({
    rowIdx: r.id, email: r.email, idFrontliner: r.id_frontliner, name: r.name,
    position: r.position, area: r.area, idTeamleader: r.id_teamleader, tlName: r.tl_name
  }));
  return { success: true, data: formatted };
}

async function api_saveFrontliner(values, isEdit, id) {
  const row = { email: values[0], id_frontliner: values[1], name: values[2], position: values[3], area: values[4], id_teamleader: values[5], tl_name: values[6] };
  const { error } = isEdit 
    ? await supabase.from('frontliners').update(row).eq('id', id)
    : await supabase.from('frontliners').insert(row);
  return error ? { success: false, message: error.message } : { success: true };
}

async function api_deleteFrontliner(id) {
  const { error } = await supabase.from('frontliners').delete().eq('id', id);
  return error ? { success: false, message: error.message } : { success: true };
}

async function api_getVerifikasiData(tg, fl, ry, idTeamleader, isSuperuser) {
  let query = supabase.from('data_visit').select('*');
  if (!isSuperuser) query = query.eq('id_teamleader', idTeamleader);
  if (tg) query = query.eq('tanggal', tg);
  if (fl && fl !== 'ALL') query = query.eq('frontliner_name', fl);
  if (ry && ry !== 'ALL') query = query.eq('rayon', ry);

  const { data, error } = await query;
  if (error) return { success: false, message: error.message };

  const formatted = data.map((r, i) => ({
    rowIdx: i,
    idResp: r.resp_id, outlet: r.outlet_name, outletId: r.outlet_id,
    frontliner: r.frontliner_name, rayon: r.rayon, statVerif: r.status_verif,
    statPlano: r.status_planogram, statusToko: r.status_toko, statusCheckout: r.status_checkout,
    statAddDisp: r.status_add_display, statCheck: r.catatan_verifikator,
    imgCheckin: r.img_checkin, imgCheckout: r.img_checkout, imgDisplay: r.img_display, 
    imgAddDisplay: r.img_add_display, imgPosm: r.img_posm
  }));
  return { success: true, data: formatted };
}

async function api_getVisitDataFiltered(st, en, fl, idTeamleader, isSuperuser) {
  let query = supabase.from('data_visit').select('*').gte('tanggal', st).lte('tanggal', en);
  if (!isSuperuser) query = query.eq('id_teamleader', idTeamleader);
  if (fl !== 'ALL') query = query.eq('frontliner_name', fl);

  const { data, error } = await query;
  if (error) return { success: false, message: error.message };

  const headers = ['TANGGAL', 'OUTLET ID', 'NAMA OUTLET', 'FRONTLINER', 'RAYON', 'STATUS TOKO', 'STATUS PLANO'];
  const formattedData = data.map(r => [
    r.tanggal, r.outlet_id, r.outlet_name, r.frontliner_name, r.rayon, r.status_toko, r.status_planogram
  ]);
  
  return { success: true, headers, data: formattedData, dataRaw: formattedData };
}

async function api_replaceDmpData(dmpUploadedData, currentIdTeamleader, currentIsSuperuser) {
  const rowsToInsert = dmpUploadedData.slice(1).map(row => ({
    id_frontliner: row[0], id_teamleader: row[1], outlet_id: row[2], area: row[3],
    outlet_name: row[4], outlet_address: row[5], province: row[6], city: row[7],
    district: row[8], type_outlet: row[9], type_display: row[10], rayon: row[11], latlong: row[12]
  }));
  
  const { error } = await supabase.from('DMP').upsert(rowsToInsert, { onConflict: 'outlet_id' });
  return error ? { success: false, message: error.message } : { success: true };
}

async function api_resolveMultipleDriveImages(arr) {
  const results = {};
  arr.forEach(item => { if (item.path) results[item.key] = item.path; });
  return results;
}

async function api_invokeEdgeFunction(fnName, args) {
  const { data, error } = await supabase.functions.invoke(fnName, { body: { args } });
  if (error) throw new Error(error.message);
  return data;
}

async function api_getJEMPreviewData(year, month, flId, idTL, isSuper) {
  return await api_invokeEdgeFunction('getJEMPreviewData', arguments);
}
async function api_getRKMData(year, month, flId, idTL, isSuper) {
  return await api_invokeEdgeFunction('getRKMData', arguments);
}

/******************************************************
 * UI & CHART HELPERS
 ******************************************************/
function badge(text, type) {
  const map = { success: 'badge-success', warning: 'badge-warning', primary: 'badge-primary', secondary: 'badge-secondary' };
  return '<span class="badge-custom ' + (map[type] || 'badge-secondary') + '">' + escapeHtml(text) + '</span>';
}

function animateCounter(elementId, targetValue, duration) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const start  = parseInt(el.textContent, 10) || 0;
  const target = parseInt(targetValue,    10) || 0;
  const range  = target - start;
  const startTime = performance.now();
  duration = duration || 800;
  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + range * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/******************************************************
 * MINI LOADER
 ******************************************************/
function showMiniLoader(text, progress) {
  let loader = document.getElementById('miniLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id        = 'miniLoader';
    loader.className = 'mini-loader';
    loader.innerHTML =
      '<div class="mini-loader-spinner"></div>' +
      '<div>' +
      '<div class="mini-loader-text">'     + (text || 'Memuat...') + '</div>' +
      '<div class="mini-loader-progress" id="miniLoaderProgress" style="display:none;"></div>' +
      '</div>';
    document.body.appendChild(loader);
  } else {
    loader.classList.remove('success');
    const textEl = loader.querySelector('.mini-loader-text');
    if (textEl) textEl.textContent = text || 'Memuat...';
  }
  const progEl = document.getElementById('miniLoaderProgress');
  if (progEl) {
    if (progress) { progEl.textContent = progress; progEl.style.display = 'block'; }
    else            progEl.style.display = 'none';
  }
  requestAnimationFrame(() => loader.classList.add('show'));
}

function updateMiniLoader(text, progress) {
  const loader = document.getElementById('miniLoader');
  if (!loader) { showMiniLoader(text, progress); return; }
  const textEl = loader.querySelector('.mini-loader-text');
  if (textEl && text) textEl.textContent = text;
  const progEl = document.getElementById('miniLoaderProgress');
  if (progEl && progress) { progEl.textContent = progress; progEl.style.display = 'block'; }
}

function hideMiniLoader(successText) {
  const loader = document.getElementById('miniLoader');
  if (!loader) return;
  if (successText) {
    loader.classList.add('success');
    const textEl = loader.querySelector('.mini-loader-text');
    if (textEl) textEl.textContent = successText;
    const progEl = document.getElementById('miniLoaderProgress');
    if (progEl) progEl.style.display = 'none';
    setTimeout(() => {
      loader.classList.remove('show');
      setTimeout(() => loader.remove(), 300);
    }, 1500);
  } else {
    loader.classList.remove('show');
    setTimeout(() => loader.remove(), 300);
  }
}

/******************************************************
 * BOTTOM NAV HELPER
 ******************************************************/
function syncBottomNav() {
  var bnEl = document.querySelector('.bottom-nav');
  if (!bnEl) return;
  var isLoggedIn = !!sessionStorage.getItem('vistrack_user');
  if (!isLoggedIn) {
    bnEl.style.removeProperty('display');
    bnEl.style.display = 'none';
    return;
  }
  bnEl.style.removeProperty('display');
}

/******************************************************
 * INIT
 ******************************************************/
window.addEventListener('DOMContentLoaded', function () {
  initTheme();

  var bn = document.querySelector('.bottom-nav');
  if (bn) bn.style.display = 'none';

  const today = getTodayString();
  const fdh = document.getElementById('filterDateHome'); if (fdh) fdh.value = today;
  const vfd = document.getElementById('vfDate');         if (vfd) vfd.value = today;
  const vss = document.getElementById('vsStart');        if (vss) vss.value = today;
  const vse = document.getElementById('vsEnd');          if (vse) vse.value = today;

  const saved   = localStorage.getItem('vistrack_email');
  const emailEl = document.getElementById('emailInput');
  if (saved && emailEl) emailEl.value = saved;

  const session = sessionStorage.getItem('vistrack_user');
  if (session) {
    try {
      const u = JSON.parse(session);
      showMainApp(u.name, u.idTeamleader, u.isSuperuser);
    } catch (e) {
      sessionStorage.removeItem('vistrack_user');
    }
  }
  bindEvents();
});

function bindEvents() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      doLogin();
    });
  }

  const togglePwd = document.getElementById('togglePassword');
  if (togglePwd) {
    togglePwd.addEventListener('click', function () {
      const input = document.getElementById('passwordInput');
      const icon  = this.querySelector('i');
      if (input.type === 'password') {
        input.type     = 'text';
        icon.className = 'fa fa-eye-slash';
      } else {
        input.type     = 'password';
        icon.className = 'fa fa-eye';
      }
    });
  }

  const themeToggleLogin = document.getElementById('themeToggleLogin');
  if (themeToggleLogin) themeToggleLogin.addEventListener('click', toggleTheme);

  const themeToggleSidebar = document.getElementById('themeToggleSidebar');
  if (themeToggleSidebar) themeToggleSidebar.addEventListener('click', toggleTheme);

  const themeToggleMobile = document.getElementById('themeToggleMobile');
  if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);

  document.addEventListener('click', function (e) {
    const img = e.target.closest('.img-preview');
    if (img && img.dataset.imgSlot && img.src && !img.classList.contains('error')) {
      if (img.src.indexOf('data:image/svg') === -1) {
        Lightbox.open(img.dataset.imgSlot);
      }
    }
  });

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case 'login':               doLogin(); break;
      case 'logout':              doLogout(); break;
      case 'switch-page':         switchPage(el.dataset.page, el); break;
      case 'load-home':           loadHomeData(); break;
      case 'load-visit':          loadVisitData(); break;
      case 'load-verif':          loadVerifData(); break;
      case 'load-dmp':            loadDmpWithFilter(); break;
      case 'add-dmp':             showDmpForm(null); break;
      case 'show-verif-detail':   showVerifDetail(); break;
      case 'download-excel':      downloadExcel(); break;
      case 'download-pdf':        downloadPDF(); break; // Handler ini tetap memanggil downloadPDF
      case 'download-jem':        showJEMStep1(); break;
      case 'download-rkm':        showRKMDialog(); break;
      case 'save-verif':          saveVerifikasi(); break;
      case 'delete-visit':        hapusKunjunganFromModal(); break;
      case 'filter-verif-status': filterVerifByStatus(el.dataset.status); break;
      case 'open-verif-card':     openVerifFromCard(el); break;
      case 'edit-dmp':            showDmpForm(el.dataset.outletId); break;
      case 'delete-dmp':          deleteDmpOutlet(el.dataset.outletId, el.dataset.outletName); break;
      case 'fly-to-outlet':       flyToOutlet(el.dataset.outletId); break;
      case 'validate-dmp':        validateDmpFile(); break;
      case 'add-frontliner':      showFrontlinerForm(null); break;
      case 'add-teamleader':      showTeamleaderForm(null); break;
      case 'edit-teamleader':     showTeamleaderForm(el.dataset.rowIdx, el.dataset.tl); break;
      case 'delete-teamleader':   deleteTeamleaderRow(el.dataset.rowIdx, el.dataset.name); break;
      case 'edit-frontliner':     showFrontlinerForm(el.dataset.rowIdx, el.dataset.fl); break;
      case 'delete-frontliner':   deleteFrontlinerRow(el.dataset.rowIdx, el.dataset.name); break;
      case 'download-dmp-template': downloadDmpTemplate(); break;
      case 'download-dmp-data':   downloadDmpData(); break;
      case 'upload-dmp':          uploadDmpFile(); break;
      case 'refresh-master':
        clearMasterCache();
        showMiniLoader('Memperbarui data master...');
        loadMasterData(true);
        setTimeout(function () {
          hideMiniLoader('Data master berhasil diperbarui');
          loadDmpWithFilter();
        }, 1200);
        break;
    }
  });

  const vfSearchEl = document.getElementById('vfSearch');
  if (vfSearchEl) vfSearchEl.addEventListener('input', filterVerifCards);

  const flSearchEl = document.getElementById('flSearch');
  if (flSearchEl) flSearchEl.addEventListener('input', filterFrontlinerCards);

  const tlSearchEl = document.getElementById('tlSearch');
  if (tlSearchEl) tlSearchEl.addEventListener('input', filterTeamleaderCards);

  const dmpSearchEl = document.getElementById('dmpSearch');
  if (dmpSearchEl) dmpSearchEl.addEventListener('input', filterDmpList);

  window.addEventListener('resize', function () {
    syncBottomNav();
  });

  let idleTimer;
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (!sessionStorage.getItem('vistrack_user')) return;
      sessionStorage.removeItem('vistrack_user');
      clearMasterCache();
      Swal.fire({
        icon: 'info',
        title: 'Sesi Berakhir',
        text: 'Anda tidak aktif selama 30 menit. Silakan login kembali.',
        confirmButtonColor: '#2563EB',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(function () { showLoginPage(); });
    }, 30 * 60 * 1000);
  }
  ['mousemove', 'keydown', 'click', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();
}

/******************************************************
 * AUTH
 ******************************************************/
function doLogin() {
  const email    = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  if (!email) {
    Swal.fire({ icon: 'warning', title: 'Email Kosong', text: 'Masukkan email terdaftar Anda.' });
    return;
  }
  if (!password) {
    Swal.fire({ icon: 'warning', title: 'Password Kosong', text: 'Masukkan password Anda.' });
    return;
  }
  showLoading('Memverifikasi...');
  callServer('verifyLogin', [email, password], function (res) {
    if (res && res.success) {
      localStorage.setItem('vistrack_email', email);
      sessionStorage.setItem('vistrack_user', JSON.stringify({
        email: email, name: res.name,
        idTeamleader: res.idTeamleader, isSuperuser: res.isSuperuser
      }));
      showMainApp(res.name, res.idTeamleader, res.isSuperuser);
    } else {
      Swal.fire({ icon: 'error', title: 'Login Gagal',
        text: (res && res.message) || 'Email atau password salah.' });
    }
  });
}

function doLogout() {
  Swal.fire({
    icon: 'question',
    title: 'Keluar dari sistem?',
    showCancelButton: true,
    confirmButtonText: 'Ya, Keluar',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#DC2626'
  }).then(function (r) {
    if (r.isConfirmed) {
      sessionStorage.removeItem('vistrack_user');
      clearMasterCache();
      clearTLCache();
      clearFLDataCache();
      showLoginPage();
    }
  });
}

function showLoginPage() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
  var bnEl = document.querySelector('.bottom-nav');
  if (bnEl) bnEl.style.display = 'none';
}

function showMainApp(name, idTeamleader, isSuperuser) {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');

  syncBottomNav();

  const display = name || 'User';
  document.getElementById('userName').textContent      = display;
  document.getElementById('userNameMobile').textContent = display;
  const desk = document.getElementById('userInfoDesktop');
  if (desk) desk.textContent = display;
  document.getElementById('userAvatar').textContent = display.charAt(0).toUpperCase();

  if (idTeamleader === undefined || idTeamleader === null) {
    try {
      const u = JSON.parse(sessionStorage.getItem('vistrack_user') || '{}');
      currentIdTeamleader = (u.idTeamleader || '').toString().trim();
      currentIsSuperuser  = (u.isSuperuser === true || u.isSuperuser === 'true');
    } catch (e) {}
  } else {
    currentIdTeamleader = (idTeamleader || '').toString().trim();
    currentIsSuperuser  = (isSuperuser === true || isSuperuser === 'true');
  }

  const navTL        = document.getElementById('navTeamleader');
  const bottomNavTL = document.getElementById('bottomNavTeamleader');
  if (currentIsSuperuser) {
    if (navTL)       navTL.classList.remove('hidden');
    if (bottomNavTL) bottomNavTL.classList.remove('hidden');
  } else {
    if (navTL)       navTL.classList.add('hidden');
    if (bottomNavTL) bottomNavTL.classList.add('hidden');
  }

  const btnSS = document.getElementById('btnSpreadsheetWrapper');
  if (btnSS) {
    if (currentIsSuperuser) btnSS.classList.remove('hidden');
    else                    btnSS.classList.add('hidden');
  }

  loadMasterData();
  setTimeout(function () { loadHomeData(); }, 200);
  if (currentIsSuperuser) {
    callServer('getTeamleaderData', [], function(res) {
      if (res && res.data) saveTLCache(res.data);
    }, { keepLoading: false });
  }

  callServer('getFrontlinerData', [currentIdTeamleader, currentIsSuperuser], function(res) {
    if (res && res.data) { saveFLDataCache(res.data); rawFrontlinerData = res.data; }
  }, { keepLoading: false });

  switchPage('home');
}

/******************************************************
 * MASTER DATA LOAD
 ******************************************************/
function createFrontlinerMapping() {
  const mapping = {};
  for (let i = 1; i < rawFL.length; i++) {
    const id   = (rawFL[i][1] || '').toString().trim();
    const name = (rawFL[i][2] || '').toString().trim();
    if (id && name) mapping[id] = name;
  }
  return mapping;
}

function loadMasterData(forceRefresh) {
  if (!forceRefresh) {
    const cached = loadMasterCache();
    if (cached) {
      rawFL  = cached.fl  || [];
      rawDMP = cached.dmp || [];
      frontlinerIdToName = createFrontlinerMapping();
      flNameToId = {};
      for (let i = 1; i < rawFL.length; i++) {
        const id = (rawFL[i][0] || '').toString().trim();
        const nm = (rawFL[i][2] || '').toString().trim();
        if (nm) flNameToId[nm] = id;
      }
      populateFrontlinerDropdowns();
      populateRayon();
      return;
    }
  }

  callServer('getMasterDataList', [currentIdTeamleader, currentIsSuperuser], function (res) {
    rawFL  = (res && res.fl)  ? res.fl  : [];
    rawDMP = (res && res.dmp) ? res.dmp : [];

    saveMasterCache(rawFL, rawDMP);

    frontlinerIdToName = createFrontlinerMapping();
    flNameToId = {};
    for (let i = 1; i < rawFL.length; i++) {
      const id = (rawFL[i][0] || '').toString().trim();
      const nm = (rawFL[i][2] || '').toString().trim();
      if (nm) flNameToId[nm] = id;
    }
    populateFrontlinerDropdowns();
    populateRayon();
  }, { keepLoading: false });
}

function populateFrontlinerDropdowns() {
  const ids = ['filterFrontlinerHome', 'vsFl', 'vfFl', 'dmpFl'];
  ids.forEach(function (id) {
    const sel = document.getElementById(id);
    if (!sel) return;
    let html = '<option value="ALL">— Semua Frontliner —</option>';
    for (let idFL in frontlinerIdToName) {
      html += '<option value="' + escapeHtml(idFL) + '">' + escapeHtml(frontlinerIdToName[idFL]) + '</option>';
    }
    sel.innerHTML = html;
  });
}

function populateRayon() {
  const rayonSet = new Set();
  for (let i = 1; i < rawDMP.length; i++) {
    const r = rawDMP[i][11];
    if (r) rayonSet.add(r.toString().trim());
  }
  if (rayonSet.size === 0) {
    for (let i = 1; i <= 12; i++) rayonSet.add('R' + String(i).padStart(2, '0'));
  }
  const sorted = Array.from(rayonSet).sort();
  ['vfRy', 'dmpRy'].forEach(function (id) {
    const sel = document.getElementById(id);
    if (!sel) return;
    let html = '<option value="ALL">— Semua Rayon —</option>';
    sorted.forEach(function (r) {
      html += '<option value="' + escapeHtml(r) + '">' + escapeHtml(r) + '</option>';
    });
    sel.innerHTML = html;
  });
}

/******************************************************
 * NAVIGATION
 ******************************************************/
function switchPage(page, el) {
  const titles = {
    home: 'Dashboard', frontliner: 'Frontliner', teamleader: 'Teamleader',
    visit: 'Data Visit', verif: 'Verifikasi', dmp: 'Master DMP'
  };
  const title = titles[page] || 'Vistrack';
  document.getElementById('pageTitle').textContent = title;
  document.title = title + ' - Vistrack';
  ['home', 'frontliner', 'teamleader', 'visit', 'verif', 'dmp'].forEach(function (p) {
    document.getElementById('page-' + p).classList.add('hidden');
  });
  const target = document.getElementById('page-' + page);
  target.classList.remove('hidden');
  target.classList.remove('page-content');
  requestAnimationFrame(function () { target.classList.add('page-content'); });
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(function (it) {
    it.classList.remove('active');
  });
  document.querySelectorAll('[data-action="switch-page"][data-page="' + page + '"]').forEach(function (it) {
    it.classList.add('active');
  });
  if (page === 'dmp' && !map) {
    setTimeout(initMap, 100);
  } else if (page === 'dmp' && map) {
    setTimeout(function () { map.invalidateSize(); }, 100);
  }
  if (page === 'frontliner') loadFrontlinerData();
  if (page === 'teamleader') loadTeamleaderData();
}

/******************************************************
 * DASHBOARD
 ******************************************************/
function loadHomeData() {
  const flId = document.getElementById('filterFrontlinerHome').value || 'ALL';
  const fl   = flIdToName(flId);
  const dt   = document.getElementById('filterDateHome').value || getTodayString();
  showLoading('Memuat data dashboard...');
  callServer('getDashboardData', [fl, dt, currentIdTeamleader, currentIsSuperuser], function (res) {
    if (!res || !res.success) {
      showError(res && res.message ? res.message : 'Gagal memuat data');
      return;
    }
    animateCounter('vKunjToday',     res.todayC       || 0);
    animateCounter('vClosedToday',   res.todayClosed || 0);
    animateCounter('vPlanoToday',    res.todayP       || 0);
    animateCounter('vNonPlanoToday', res.todayNonP    || 0);
    animateCounter('vKunjMonth',     res.monthC       || 0);
    animateCounter('vPlanoMonth',    res.monthP       || 0);
    renderDonutChart(res.monthP || 0, (res.monthC || 0) - (res.monthP || 0));
    cachedVerifStats = res.verifStats || [];
    const tot = res.totalVisits      || 0;
    const ver = res.totalVerified || 0;
    const unv = tot - ver;
    document.getElementById('vsTotal').textContent       = tot;
    document.getElementById('vsVerified').textContent    = ver;
    document.getElementById('vsUnverified').textContent = unv;
    const pct = tot > 0 ? Math.round((ver / tot) * 100) : 0;
    document.getElementById('vsProgressBar').style.width  = pct + '%';
    document.getElementById('vsProgressLabel').textContent = pct + '% terverifikasi';
    const bar = document.getElementById('vsProgressBar');
    if       (pct >= 80) bar.style.background = '#16A34A';
    else if (pct >= 50) bar.style.background = '#D97706';
    else                bar.style.background = '#DC2626';
    renderHomeDetail(res.detail || [], dt);
  });
}

function renderDonutChart(plano, nonPlano) {
  const total = plano + nonPlano;
  const C = 339.29;

  const planoArc    = total > 0 ? (C * plano    / total) : 0;
  const nonPlanoArc = total > 0 ? (C * nonPlano / total) : 0;

  document.getElementById('donutPlano').setAttribute('stroke-dasharray', planoArc + ' ' + (C - planoArc));
  document.getElementById('donutPlano').setAttribute('stroke-dashoffset', '0');

  document.getElementById('donutNonPlano').setAttribute('stroke-dasharray', nonPlanoArc + ' ' + (C - nonPlanoArc));
  document.getElementById('donutNonPlano').setAttribute('stroke-dashoffset', -(planoArc));

  const pct = total > 0 ? Math.round((plano / total) * 100) : 0;
  document.getElementById('donutPct').textContent          = pct + '%';
  document.getElementById('piePlanoCount').textContent    = plano;
  document.getElementById('pieNonPlanoCount').textContent = nonPlano;
  document.getElementById('pieChartLabel').textContent    = 'Total ' + total + ' kunjungan bulan ini';
}

function renderHomeDetail(rows, dt) {
  const tbody = document.getElementById('homeDetailBody');
  const lbl   = document.getElementById('homeDateLabel');
  if (lbl) lbl.textContent = 'Tanggal ' + dt + ' · ' + rows.length + ' kunjungan';
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><i class="fa fa-inbox"></i><p>Tidak ada kunjungan pada tanggal ini</p></div></td></tr>';
    return;
  }
  let html = '';
  rows.forEach(function (d) {
    const stat       = (d.stat || '').toString();
    const statBadge = stat
      ? (stat.toLowerCase().indexOf('planogram') >= 0 &&
         stat.toLowerCase().indexOf('non')   < 0 &&
         stat.toLowerCase().indexOf('tidak') < 0
          ? badge(stat, 'success')
          : badge(stat, 'warning'))
      : badge('Belum', 'secondary');
    const stkLower = (d.statusToko || '').toLowerCase();
    let stkBadge;
    if       (stkLower.indexOf('tutup') >= 0) stkBadge = badge('Tutup', 'warning');
    else if (stkLower.indexOf('buka')  >= 0) stkBadge = badge('Buka',  'success');
    else                                     stkBadge = badge(d.statusToko || '-', 'secondary');
    html += '<tr>'
      + '<td><div style="font-weight:700;">' + escapeHtml(d.out || '-') + '</div></td>'
      + '<td>' + badge(d.rayon || '-', 'primary') + '</td>'
      + '<td><div class="text-truncate-cell" title="' + escapeHtml(d.addr || '') + '">' + escapeHtml(d.addr || '-') + '</div></td>'
      + '<td class="text-mono">' + escapeHtml(d.checkin  || '-') + '</td>'
      + '<td class="text-mono">' + escapeHtml(d.checkout || '-') + '</td>'
      + '<td class="text-mono">' + escapeHtml(d.duration || '-') + '</td>'
      + '<td>' + stkBadge  + '</td>'
      + '<td>' + statBadge + '</td>'
      + '</tr>';
  });
  tbody.innerHTML = html;
}

function showVerifDetail() {
  if (!cachedVerifStats || cachedVerifStats.length === 0) {
    Swal.fire({ icon: 'info', title: 'Belum Ada Data', text: 'Klik "Cari Data" terlebih dahulu untuk memuat statistik verifikasi.' });
    return;
  }
  let html = '<div style="max-height:400px;overflow-y:auto;">'
    + '<table class="custom-table" style="font-size:12px;">'
    + '<thead><tr><th>Frontliner</th><th style="text-align:center;">Total</th>'
    + '<th style="text-align:center;">Verifikasi</th><th>Progress</th></tr></thead><tbody>';
  cachedVerifStats.forEach(function (v) {
    const pct   = v.total > 0 ? Math.round((v.verified / v.total) * 100) : 0;
    const color = pct >= 80 ? '#16A34A' : (pct >= 50 ? '#D97706' : '#DC2626');
    html += '<tr>'
      + '<td style="font-weight:700;">' + escapeHtml(v.name) + '</td>'
      + '<td style="text-align:center;">' + v.total + '</td>'
      + '<td style="text-align:center;color:' + color + ';font-weight:700;">' + v.verified + '</td>'
      + '<td><div class="progress-track"><div class="progress-fill" style="width:' + pct + '%;background:' + color + ';"></div></div>'
      + '<div style="font-size:10px;color:#6B7280;font-weight:600;margin-top:2px;">' + pct + '%</div></td>'
      + '</tr>';
  });
  html += '</tbody></table></div>';
  Swal.fire({ title: 'Detail Verifikasi per Frontliner', html: html, width: 720, confirmButtonColor: '#2563EB', confirmButtonText: 'Tutup' });
}

/******************************************************
 * DATA VISIT
 ******************************************************/
function loadVisitData() {
  const st   = document.getElementById('vsStart').value;
  const en   = document.getElementById('vsEnd').value;
  const flId = document.getElementById('vsFl').value || 'ALL';
  const fl   = flIdToName(flId);
  if (!st || !en) {
    Swal.fire({ icon: 'warning', title: 'Tanggal Belum Diisi', text: 'Silakan pilih tanggal mulai dan akhir.' });
    return;
  }
  if (new Date(st) > new Date(en)) {
    Swal.fire({ icon: 'warning', title: 'Tanggal Tidak Valid', text: 'Tanggal mulai harus sebelum atau sama dengan tanggal akhir.' });
    return;
  }
  showLoading('Mengambil data kunjungan...');
  callServer('getVisitDataFiltered', [st, en, fl, currentIdTeamleader, currentIsSuperuser], function (res) {
    if (!res || !res.success) {
      showError(res && res.message ? res.message : 'Gagal memuat data');
      return;
    }
    currentVisitData = res;
    const head = document.getElementById('tvHead');
    const body = document.getElementById('tvBody');
    if (!res.data || res.data.length === 0) {
      head.innerHTML = '';
      body.innerHTML = '<tr><td><div class="empty-state"><i class="fa fa-inbox"></i><p>Tidak ada kunjungan pada periode ini</p></div></td></tr>';
      document.getElementById('btnDownCSV').classList.add('hidden');
      document.getElementById('btnDownPDF').classList.add('hidden');
      return;
    }
    document.getElementById('btnDownCSV').classList.remove('hidden');
    document.getElementById('btnDownPDF').classList.remove('hidden');
    let h = '<tr>';
    res.headers.forEach(function (col) { h += '<th>' + escapeHtml(col) + '</th>'; });
    h += '</tr>';
    head.innerHTML = h;
    const VISIT_PREVIEW_LIMIT = 100;
    const limit = Math.min(res.data.length, VISIT_PREVIEW_LIMIT);
    let b = '';
    for (let i = 0; i < limit; i++) {
      b += '<tr>';
      res.data[i].forEach(function (c) { b += '<td>' + escapeHtml(c) + '</td>'; });
      b += '</tr>';
    }
    if (res.data.length > VISIT_PREVIEW_LIMIT) {
      b += '<tr><td colspan="' + res.headers.length + '" style="text-align:center;padding:14px;'
        + 'color:#6B7280;font-weight:600;">... ' + (res.data.length - VISIT_PREVIEW_LIMIT)
        + ' baris lainnya. Gunakan tombol Download Excel untuk lihat semua.</td></tr>';
    }
    body.innerHTML = b;
  });
}

function downloadExcel() {
  if (!currentVisitData || !currentVisitData.data || currentVisitData.data.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Tidak Ada Data', text: 'Silakan cari data terlebih dahulu.' });
    return;
  }
  if (typeof XLSX === 'undefined') {
    Swal.fire({ icon: 'error', title: 'Library Belum Siap', text: 'Tunggu beberapa detik dan coba lagi.' });
    return;
  }

  const flId        = document.getElementById('vsFl').value || 'ALL';
  const flName      = flIdToName(flId);
  const cleanedName = flName === 'ALL' ? 'Semua_Frontliner' : flName.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
  const rowCount    = currentVisitData.data.length;

  DownloadToast.show('xlsx', 'Download Excel — Data Kunjungan', rowCount + ' baris · Menyusun file Excel...');
  DownloadToast.startFakeProgress(600);
  DownloadToast.bindClose(null);

  setTimeout(function () {
    if (DownloadToast.isCancelled()) return;
    try {
      const rawRows = (currentVisitData.dataRaw && currentVisitData.dataRaw.length > 0) ? currentVisitData.dataRaw : currentVisitData.data;
      const aoa = [currentVisitData.headers].concat(rawRows);
      const ws  = XLSX.utils.aoa_to_sheet(aoa);
      const wb  = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Kunjungan');
      XLSX.writeFile(wb, 'Data_Kunjungan_' + cleanedName + '_' + getTodayString() + '.xlsx');
      DownloadToast.complete();
    } catch (e) {
      DownloadToast.hide();
      Swal.fire({ icon: 'error', title: 'Gagal Download', text: e.message });
    }
  }, 80);
}

/******************************************************
 * BUILD HTML REPORT — A4 Landscape, Premium Design
 ******************************************************/
function buildVisitReportHTML(visits, startDate, endDate, flName, embedPhotos, truncated) {
  const e            = escapeHtml;
  const generatedAt  = formatDateJS(new Date(), "dd MMM yyyy, HH:mm 'WIB'");
  const startFmt     = formatDateJS(startDate, "dd MMMM yyyy");
  const endFmt       = formatDateJS(endDate,   "dd MMMM yyyy");
  const periodeSama  = startDate === endDate;
  const periodeStr   = periodeSama ? startFmt : startFmt + ' &ndash; ' + endFmt;

  const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;900&family=DM+Mono:wght@400;500&display=swap');

@page { size: A4 landscape; margin: 10mm 12mm 10mm 12mm; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  font-family: 'DM Sans', 'Helvetica Neue', Helvetica, sans-serif;
  font-size: 8pt;
  color: #1a1a2e;
  background: #ffffff;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

:root {
  --ink:       #1a1a2e;
  --ink-mid:   #4a4a6a;
  --ink-light: #8888aa;
  --bg-off:    #f7f7fb;
  --bg-mid:    #ededf5;
  --accent:    #1b3a6b;
  --accent2:   #2856a3;
  --gold:      #c89b2a;
  --green:     #1a7a4a;
  --red:       #c0392b;
  --border:    #d8d8e8;
  --border-dk: #b0b0cc;
  --white:     #ffffff;
}

.doc-header {
  display: flex;
  align-items: stretch;
  margin-bottom: 10pt;
  border: 1.5pt solid var(--accent);
  border-radius: 4pt;
  overflow: hidden;
}
.doc-header-brand {
  background: var(--accent);
  color: var(--white);
  padding: 8pt 14pt;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 130pt;
}
.doc-header-brand .brand-title {
  font-size: 14pt;
  font-weight: 900;
  letter-spacing: -0.3pt;
  line-height: 1.1;
}
.doc-header-brand .brand-sub {
  font-size: 6pt;
  font-weight: 400;
  opacity: 0.75;
  letter-spacing: 1.2pt;
  text-transform: uppercase;
  margin-top: 2pt;
}
.doc-header-meta {
  flex: 1;
  background: var(--bg-off);
  padding: 7pt 12pt;
  display: flex;
  align-items: center;
  gap: 20pt;
}
.doc-header-col { flex: 1; }
.doc-meta-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 2.5pt;
}
.doc-meta-lbl {
  color: var(--ink-light);
  font-size: 6.5pt;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6pt;
  min-width: 72pt;
  flex-shrink: 0;
}
.doc-meta-val {
  font-size: 8pt;
  font-weight: 700;
  color: var(--ink);
}
.doc-meta-val.accent { color: var(--accent2); }

.doc-stats {
  display: flex;
  flex-direction: column;
  gap: 4pt;
  padding-left: 14pt;
  border-left: 1pt solid var(--border);
}
.doc-stat-item {
  display: flex;
  align-items: center;
  gap: 5pt;
}
.doc-stat-num {
  font-size: 18pt;
  font-weight: 900;
  color: var(--accent);
  line-height: 1;
}
.doc-stat-lbl {
  font-size: 6.5pt;
  color: var(--ink-mid);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.4pt;
}

.alert {
  border-left: 3pt solid var(--gold);
  background: #fffbea;
  padding: 5pt 10pt;
  margin-bottom: 8pt;
  font-size: 7pt;
  color: #6b5000;
  border-radius: 0 3pt 3pt 0;
}
.alert strong { font-weight: 700; }

.page-break { page-break-after: always; break-after: page; }

.fl-block { margin-bottom: 16pt; }
.fl-header {
  background: var(--accent);
  color: var(--white);
  padding: 0;
  margin-bottom: 0;
  border-radius: 4pt 4pt 0 0;
  overflow: hidden;
  display: flex;
  align-items: stretch;
}
.fl-header-name-col {
  padding: 8pt 14pt;
  flex: 1;
}
.fl-label {
  font-size: 6pt;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1pt;
  opacity: 0.65;
  margin-bottom: 2pt;
}
.fl-name {
  font-size: 13pt;
  font-weight: 900;
  letter-spacing: -0.2pt;
  line-height: 1.1;
}
.fl-area {
  font-size: 7pt;
  font-weight: 400;
  opacity: 0.8;
  margin-top: 1.5pt;
}
.fl-stats-row {
  display: flex;
  align-items: center;
}
.fl-stat-box {
  background: rgba(255,255,255,0.08);
  border-left: 1pt solid rgba(255,255,255,0.15);
  padding: 6pt 14pt;
  text-align: center;
}
.fl-stat-num {
  font-size: 17pt;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.5pt;
}
.fl-stat-lbl {
  font-size: 5.5pt;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5pt;
  opacity: 0.7;
  margin-top: 1pt;
}
.fl-stat-box.green { background: rgba(26,122,74,0.25); }
.fl-stat-box.gold  { background: rgba(200,155,42,0.2); }
.fl-stat-box.red   { background: rgba(192,57,43,0.2); }

.date-bar {
  background: var(--bg-mid);
  border-left: 3pt solid var(--accent2);
  padding: 4pt 10pt;
  font-size: 7pt;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.8pt;
  display: flex;
  align-items: center;
  gap: 8pt;
}
.date-bar .date-count {
  background: var(--accent2);
  color: var(--white);
  padding: 1pt 6pt;
  border-radius: 10pt;
  font-size: 6.5pt;
  font-weight: 700;
  letter-spacing: 0.3pt;
}

.visit-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1pt solid var(--border);
  border-top: none;
}

.col-no   { width: 14mm; }
.col-info { width: 77mm; }
.col-foto { width: 37.2mm; }

.visit-table tr.visit-row td {
  border-bottom: 2pt solid var(--border-dk);
  vertical-align: top;
}
.visit-table tr.visit-row:last-child td {
  border-bottom: none;
}

.c-no {
  border-right: 2pt solid var(--accent) !important;
  background: var(--accent);
  color: var(--white);
  text-align: center;
  vertical-align: middle;
  font-size: 12pt;
  font-weight: 900;
  letter-spacing: -0.5pt;
  padding: 8pt 0;
  line-height: 1;
}

.c-info {
  padding: 7pt 9pt;
  background: var(--white);
  border-right: 1pt solid var(--border) !important;
}
.c-outlet-id {
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 6.5pt;
  font-weight: 500;
  color: var(--ink-mid);
  letter-spacing: 0.5pt;
  margin-bottom: 1pt;
}
.c-outlet-name {
  font-size: 9.5pt;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.1pt;
  margin-bottom: 5pt;
  line-height: 1.2;
}
.c-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 8pt;
  row-gap: 1.5pt;
}
.c-info-item {
  display: flex;
  flex-direction: column;
}
.c-info-lbl {
  font-size: 5.5pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5pt;
  color: var(--ink-light);
  line-height: 1.3;
}
.c-info-val {
  font-size: 7.5pt;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
}
.c-divider {
  border: none;
  border-top: 0.5pt solid var(--border);
  margin: 5pt 0 4pt;
  grid-column: 1 / -1;
}

.badge {
  display: inline-block;
  padding: 1pt 5pt;
  border-radius: 3pt;
  font-size: 6pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3pt;
  line-height: 1.5;
}
.badge-green  { background: #d4f4e2; color: #0e5c2f; }
.badge-red    { background: #fde8e7; color: #8b1a1a; }
.badge-gold   { background: #fff3cd; color: #7a5c00; }
.badge-blue   { background: #ddeeff; color: #1b3a6b; }
.badge-gray   { background: var(--bg-mid); color: var(--ink-mid); }

.foto-table-head {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1pt solid var(--border);
  border-top: none;
  background: var(--bg-off);
}
.foto-table-head td {
  border-right: 1pt solid var(--border);
  padding: 3pt 4pt;
  text-align: center;
  font-size: 6pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6pt;
  color: var(--ink-mid);
}
.foto-table-head td:last-child { border-right: none; }
.foto-table-head .col-no-ph { width: 14mm; background: var(--accent); }
.foto-table-head .col-info-ph { width: 77mm; border-right: 2pt solid var(--border-dk) !important; }

.c-foto {
  padding: 5pt 4pt;
  text-align: center;
  background: var(--bg-off);
  border-right: 1pt solid var(--border) !important;
  vertical-align: top;
}
.c-foto:last-child { border-right: none !important; }
.foto-wrap {
  width: 100%;
  height: 88pt;
  overflow: hidden;
  border-radius: 2pt;
  background: var(--bg-mid);
  border: 0.5pt solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.foto-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.foto-empty {
  width: 100%;
  height: 88pt;
  background: var(--bg-mid);
  border: 0.5pt dashed var(--border-dk);
  border-radius: 2pt;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2pt;
}
.foto-empty-dash {
  font-size: 12pt;
  color: var(--border-dk);
  line-height: 1;
}
.foto-empty-txt {
  font-size: 5.5pt;
  color: var(--ink-light);
  letter-spacing: 0.3pt;
}

.doc-footer {
  text-align: center;
  font-size: 6pt;
  color: var(--ink-light);
  margin-top: 12pt;
  padding-top: 6pt;
  border-top: 0.5pt solid var(--border);
  letter-spacing: 0.4pt;
}
`;

  let html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>`;

  html += `
<div class="doc-header">
  <div class="doc-header-brand">
    <div class="brand-title">VISTRACK</div>
    <div class="brand-sub">Laporan Kunjungan</div>
  </div>
  <div class="doc-header-meta">
    <div class="doc-header-col">
      <div class="doc-meta-row">
        <span class="doc-meta-lbl">Periode</span>
        <span class="doc-meta-val">${periodeStr}</span>
      </div>
      <div class="doc-meta-row">
        <span class="doc-meta-lbl">Frontliner</span>
        <span class="doc-meta-val accent">${e(flName === 'ALL' ? 'Semua Frontliner' : flName)}</span>
      </div>
      <div class="doc-meta-row">
        <span class="doc-meta-lbl">Dibuat</span>
        <span class="doc-meta-val">${e(generatedAt)}</span>
      </div>
    </div>
    <div class="doc-stats">
      <div class="doc-stat-item">
        <span class="doc-stat-num">${visits.length}</span>
        <span class="doc-stat-lbl">Total<br>Kunjungan</span>
      </div>
    </div>
  </div>
</div>`;

  if (truncated) {
    html += `<div class="alert">⚠ Data terlalu banyak — PDF ini hanya menampilkan <strong>${visits.length} kunjungan pertama</strong>. Gunakan rentang tanggal lebih sempit untuk data lengkap.</div>`;
  }
  if (!embedPhotos) {
    html += `<div class="alert">📷 Foto tidak disertakan karena jumlah kunjungan melebihi batas. Filter lebih spesifik untuk laporan dengan foto.</div>`;
  }

  var flOrder = [], flMap = {};
  visits.forEach(function(v) {
    var fl = v.frontliner || 'Unknown';
    if (!flMap[fl]) { flMap[fl] = []; flOrder.push(fl); }
    flMap[fl].push(v);
  });

  flOrder.forEach(function(fl, flIdx) {
    var flVisits   = flMap[fl];
    var flTotal    = flVisits.length;
    var flPlano    = 0, flVerif = 0, flClosed = 0, flNonPlano = 0;
    flVisits.forEach(function(v) {
      if ((v.statPlano || '').toString().toLowerCase().indexOf('planogram') >= 0 &&
          (v.statPlano || '').toString().toLowerCase().indexOf('tidak') < 0) flPlano++;
      else flNonPlano++;
      if ((v.statVerif || '').toString().indexOf('Sudah') >= 0) flVerif++;
      if ((v.statusToko || '').toString().toLowerCase().indexOf('tutup') >= 0) flClosed++;
    });
    var flArea = (flVisits[0] && flVisits[0].area) ? flVisits[0].area : '-';

    if (flIdx > 0) html += '<div class="page-break"></div>';

    html += `
<div class="fl-block">
  <div class="fl-header">
    <div class="fl-header-name-col">
      <div class="fl-label">Frontliner</div>
      <div class="fl-name">${e(fl)}</div>
      <div class="fl-area">&#128205; ${e(flArea)}</div>
    </div>
    <div class="fl-stats-row">
      <div class="fl-stat-box">
        <div class="fl-stat-num">${flTotal}</div>
        <div class="fl-stat-lbl">Total</div>
      </div>
      <div class="fl-stat-box green">
        <div class="fl-stat-num">${flVerif}</div>
        <div class="fl-stat-lbl">Verif</div>
      </div>
      <div class="fl-stat-box gold">
        <div class="fl-stat-num">${flPlano}</div>
        <div class="fl-stat-lbl">Plano</div>
      </div>
      <div class="fl-stat-box red">
        <div class="fl-stat-num">${flClosed}</div>
        <div class="fl-stat-lbl">Tutup</div>
      </div>
    </div>
  </div>`;

    html += `
  <table class="foto-table-head">
    <tr>
      <td class="col-no-ph"></td>
      <td class="col-info-ph">Detail Kunjungan</td>
      <td class="col-foto">Check-in</td>
      <td class="col-foto">Check-out</td>
      <td class="col-foto">Display</td>
      <td class="col-foto">Add Display</td>
      <td class="col-foto">POSM</td>
    </tr>
  </table>`;

    var dateOrder = [], dateMap = {};
    flVisits.forEach(function(v) {
      var dt = v.date || '-';
      if (!dateMap[dt]) { dateMap[dt] = []; dateOrder.push(dt); }
      dateMap[dt].push(v);
    });

    dateOrder.forEach(function(dt) {
      var dtVisits = dateMap[dt];

      html += `
  <div class="date-bar">
    ${e(dt)}
    <span class="date-count">${dtVisits.length} Kunjungan</span>
  </div>`;

      html += `<table class="visit-table">`;

      dtVisits.forEach(function(v, idx) {
        function badge(txt) {
          if (!txt || txt === '-') return '<span class="badge badge-gray">-</span>';
          var tl = txt.toString().toLowerCase();
          if (tl.indexOf('sudah') >= 0 || tl.indexOf('buka') >= 0 || tl.indexOf('planogram') >= 0 && tl.indexOf('tidak') < 0) {
            return '<span class="badge badge-green">' + e(txt) + '</span>';
          }
          if (tl.indexOf('tutup') >= 0 || tl.indexOf('tidak') >= 0 || tl.indexOf('belum') >= 0) {
            return '<span class="badge badge-red">' + e(txt) + '</span>';
          }
          return '<span class="badge badge-blue">' + e(txt) + '</span>';
        }

        var noStr = String(idx + 1).padStart(2, '0');

        var infoHtml = `
          <div class="c-outlet-id">${e(v.outletId)}</div>
          <div class="c-outlet-name">${e(v.outlet)}</div>
          <div class="c-info-grid">
            <div class="c-info-item">
              <span class="c-info-lbl">Check-in</span>
              <span class="c-info-val">${e(v.checkin)} WIB</span>
            </div>
            <div class="c-info-item">
              <span class="c-info-lbl">Check-out</span>
              <span class="c-info-val">${e(v.checkout)} WIB</span>
            </div>
            <div class="c-info-item">
              <span class="c-info-lbl">Durasi</span>
              <span class="c-info-val">${e(v.duration)}</span>
            </div>
            <div class="c-info-item">
              <span class="c-info-lbl">Rayon</span>
              <span class="c-info-val">${e(v.rayon)}</span>
            </div>
            <hr class="c-divider">
            <div class="c-info-item">
              <span class="c-info-lbl">Status Toko</span>
              <span class="c-info-val">${badge(v.statusToko)}</span>
            </div>
            <div class="c-info-item">
              <span class="c-info-lbl">Planogram</span>
              <span class="c-info-val">${badge(v.statPlano)}</span>
            </div>
            <div class="c-info-item">
              <span class="c-info-lbl">Verifikasi</span>
              <span class="c-info-val">${badge(v.statVerif)}</span>
            </div>
            <div class="c-info-item">
              <span class="c-info-lbl">Add Display</span>
              <span class="c-info-val">${badge(v.statAddDisp)}</span>
            </div>`;

        if (v.statCheck && v.statCheck !== '-') {
          infoHtml += `
            <div class="c-info-item" style="grid-column:1/-1">
              <span class="c-info-lbl">Catatan</span>
              <span class="c-info-val">${e(v.statCheck)}</span>
            </div>`;
        }
        infoHtml += `</div>`;

        function fotoCell(b64) {
          if (b64) {
            return `<div class="foto-wrap"><img src="${b64}" alt="foto"></div>`;
          }
          return `<div class="foto-empty"><div class="foto-empty-dash">&#8212;</div><div class="foto-empty-txt">Tidak ada</div></div>`;
        }

        html += `
        <tr class="visit-row">
          <td class="col-no c-no">${noStr}</td>
          <td class="col-info c-info">${infoHtml}</td>
          <td class="col-foto c-foto">${fotoCell(embedPhotos ? v.imgCheckinB64    : null)}</td>
          <td class="col-foto c-foto">${fotoCell(embedPhotos ? v.imgCheckoutB64   : null)}</td>
          <td class="col-foto c-foto">${fotoCell(embedPhotos ? v.imgDisplayB64    : null)}</td>
          <td class="col-foto c-foto">${fotoCell(embedPhotos ? v.imgAddDisplayB64 : null)}</td>
          <td class="col-foto c-foto">${fotoCell(embedPhotos ? v.imgPosmB64       : null)}</td>
        </tr>`;
      });

      html += `</table>`;
    });

    html += `</div>`;
  });

  html += `
<div class="doc-footer">
  VISTRACK &mdash; Sistem Tracking Kunjungan MD GT &nbsp;&bull;&nbsp; ${e(generatedAt)}
</div>
</body>
</html>`;

  return html;
}

/******************************************************
 * BUILD JEM HTML
 ******************************************************/
function buildJEMHtml(opt) {
  const e = escapeHtml;
  const g = opt.groups;
  const gt = opt.grandTotal;

  function fNum(n) {
    if (n === undefined || n === null || n === '') return '';
    const parsed = parseFloat(n);
    if (isNaN(parsed) || parsed === 0) return '';
    return parsed % 1 === 0 ? String(parsed) : parsed.toFixed(2);
  }
  function fPct(n) {
    if (n === undefined || n === null || n === '') return '';
    const parsed = parseFloat(n);
    if (isNaN(parsed) || parsed === 0) return '';
    return parsed.toFixed(2);
  }

  const css = `
@page { size: A4 landscape; margin: 8mm 10mm 8mm 10mm; }
*{ box-sizing:border-box; margin:0; padding:0; }
html,body{
  font-family: Arial, 'Helvetica Neue', sans-serif;
  font-size: 7pt;
  color: #111;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.doc-top{
  display:flex; justify-content:space-between; align-items:flex-start;
  margin-bottom:3pt;
}
.doc-top-left{ font-size:7pt; line-height:1.5; font-weight:700; }
.doc-top-right{ font-size:7pt; text-align:right; }
.doc-title{
  text-align:center; font-size:11pt; font-weight:700;
  border:1pt solid #111; padding:5pt 0; margin-bottom:6pt;
  letter-spacing:0.5pt;
}
.info-block{
  display:flex; gap:16pt; margin-bottom:6pt;
}
.info-table{ border-collapse:collapse; font-size:7pt; }
.info-table td{ padding:2pt 4pt; }
.info-table td.lbl{ font-weight:700; white-space:nowrap; }
.info-table td.sep{ padding:0 2pt; }
.info-table td.val{ font-weight:700; min-width:100pt; }

table.jem{
  width:100%; border-collapse:collapse;
  table-layout:fixed;
  font-size:6.5pt;
}
table.jem th, table.jem td{
  border:0.5pt solid #333; padding:1.5pt 2pt;
  vertical-align:middle; text-align:center;
}
table.jem .wilayah-cell{ text-align:left; font-size:6pt; }
table.jem .reason-cell{ text-align:left; font-size:6pt; }

.th-group{ background:#eee; font-weight:700; font-size:6.5pt; }
.th-sub   { background:#f5f5f5; font-weight:700; font-size:6pt; }
.th-lbl   { background:#f5f5f5; font-weight:700; font-size:5.5pt; writing-mode:vertical-rl; text-orientation:mixed; transform:rotate(180deg); height:38pt; padding:2pt 1pt; }
.th-letter{ font-weight:400; font-size:5.5pt; }

.tr-data   { background:#fff; }
.tr-mg     { background:#d9d9d9; font-weight:700; font-size:6.5pt; }
.tr-total { background:#bfbfbf; font-weight:700; font-size:7pt; }

.w-tgl   { width:11mm; }
.w-ray   { width:10mm; }
.w-num   { width:8mm;  }
.w-num2 { width:7mm;  }
.w-pct   { width:11mm; }
.w-wil   { width:55mm; }
.w-rsn   { width:28mm; }

.doc-footer{
  margin-top:12pt; display:flex; justify-content:space-between;
  padding-top:6pt; border-top:0.5pt solid #aaa;
}
.sign-block{ text-align:center; width:120pt; }
.sign-line { border-top:0.5pt solid #111; margin:28pt 10pt 0; }
.sign-title{ font-size:7pt; font-weight:700; margin-top:3pt; }
.doc-bottom{ display:flex; justify-content:space-between; margin-top:6pt; font-size:6pt; color:#666; }
`;

  let rows = '';
  g.forEach(function(group) {
    group.rows.forEach(function(r) {
      rows += '<tr class="tr-data">'
        + '<td class="w-tgl">' + String(r.tgl).padStart(2,'0') + '</td>'
        + '<td class="w-ray">' + e(r.rayon) + '</td>'
        + '<td class="w-num">' + fNum(r.cl)        + '</td>'
        + '<td class="w-num2">'+ fNum(r.noa)       + '</td>'
        + '<td class="w-num">' + fNum(r.ttlStd)    + '</td>'
        + '<td class="w-num2">'+ fNum(r.scanOnRayon) + '</td>'
        + '<td class="w-num2">'+ fNum(r.scanAcak) + '</td>'
        + '<td class="w-num2">' + fNum(r.manualOnRayon) + '</td>'
        + '<td class="w-num2">' + fNum(r.manualAcak) + '</td>'
        + '<td class="w-num">' + fNum(r.ttlCall)  + '</td>'
        + '<td class="w-num2">' + fNum(r.maintenance) + '</td>'
        + '<td class="w-num2">' + fNum(r.newOutlet) + '</td>'
        + '<td class="w-num">' + fNum(r.total)     + '</td>'
        + '<td class="w-pct">' + fPct(r.tcVsSc)   + '</td>'
        + '<td class="w-pct">' + fPct(r.acVsTc)   + '</td>'
        + '<td class="w-pct">' + fPct(r.scanVsTc)+ '</td>'
        + '<td class="w-wil wilayah-cell">' + e(r.wilayah) + '</td>'
        + '<td class="w-rsn reason-cell">' + e(r.notCallReason) + '</td>'
        + '</tr>';
    });
    rows += '<tr class="tr-mg">'
      + '<td colspan="2">MG &nbsp; ' + group.weekNum + '</td>'
      + '<td>' + fNum(group.subCl)      + '</td>'
      + '<td>' + fNum(group.subNoa)     + '</td>'
      + '<td>' + fNum(group.subTtlStd)  + '</td>'
      + '<td>' + fNum(group.subScanOn)  + '</td>'
      + '<td>' + fNum(group.subScanAcak)+ '</td>'
      + '<td>' + fNum(group.subManOn)   + '</td>'
      + '<td>' + fNum(group.subManAcak) + '</td>'
      + '<td>' + fNum(group.subTtlCall) + '</td>'
      + '<td>' + fNum(group.subMaint)   + '</td>'
      + '<td>' + fNum(group.subNew)     + '</td>'
      + '<td>' + fNum(group.subTotal)   + '</td>'
      + '<td>' + fPct(group.subTcVsSc)  + '</td>'
      + '<td>' + fPct(group.subAcVsTc)  + '</td>'
      + '<td>' + fPct(group.subScanVsTc)+ '</td>'
      + '<td class="wilayah-cell"></td>'
      + '<td class="reason-cell"></td>'
      + '</tr>';
  });

  rows += '<tr class="tr-total">'
    + '<td colspan="2">TOTAL</td>'
    + '<td>' + fNum(gt.cl)        + '</td>'
    + '<td>' + fNum(gt.noa)       + '</td>'
    + '<td>' + fNum(gt.ttlStd)    + '</td>'
    + '<td>' + fNum(gt.scanOn)    + '</td>'
    + '<td>' + fNum(gt.scanAcak)  + '</td>'
    + '<td>' + fNum(gt.manOn)     + '</td>'
    + '<td>' + fNum(gt.manAcak)   + '</td>'
    + '<td>' + fNum(gt.ttlCall)   + '</td>'
    + '<td>' + fNum(gt.maint)     + '</td>'
    + '<td>' + fNum(gt.newOut)    + '</td>'
    + '<td>' + fNum(gt.total)     + '</td>'
    + '<td>' + fPct(gt.tcVsSc)    + '</td>'
    + '<td>' + fPct(gt.acVsTc)    + '</td>'
    + '<td>' + fPct(gt.scanVsTc)  + '</td>'
    + '<td class="wilayah-cell"></td>'
    + '<td class="reason-cell"></td>'
    + '</tr>';

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>${css}</style>
</head>
<body>

<div class="doc-top">
  <div class="doc-top-left">
    PT. FASTRATA BUANA<br>
    Cabang : ${e(opt.flArea || '-')}
  </div>
  <div class="doc-top-right">${e(opt.generatedAt)}</div>
</div>

<div class="doc-title">JAM EFEKTIFITAS MERCHANDISER</div>

<div class="info-block">
  <table class="info-table" style="border:0.5pt solid #333;">
    <tr>
      <td class="lbl">MERCHANDISER</td><td class="sep">:</td>
      <td class="val">${e(opt.flIdCode + ' ' + opt.flName)}</td>
      <td style="padding:0 12pt;"></td>
      <td class="lbl">TEAM LEADER</td><td class="sep">:</td>
      <td class="val">${e(opt.tlName || 'NO NAME')}</td>
      </tr>
    <tr>
      <td class="lbl">KODE MD</td><td class="sep">:</td>
      <td class="val">${e(opt.flIdCode)}</td>
      <td style="padding:0 12pt;"></td>
      <td class="lbl">PERIODE</td><td class="sep">:</td>
      <td class="val">${e(opt.periodStr)}</td>
    </tr>
  </table>
</div>

<table class="jem">
  <thead>
    <tr class="th-group">
      <th rowspan="3" class="w-tgl">TANGGAL</th>
      <th rowspan="3" class="w-ray">RAYON</th>
      <th colspan="3">STANDARD CALL</th>
      <th colspan="5">TOTAL CALL</th>
      <th colspan="3">ACTIVATION CALL</th>
      <th colspan="3">%</th>
      <th rowspan="3" class="w-wil">WILAYAH</th>
      <th rowspan="3" class="w-rsn">NOT CALL REASON</th>
    </tr>
    <tr class="th-sub">
      <th rowspan="2" class="w-num">CL</th>
      <th rowspan="2" class="w-num2">NOA</th>
      <th rowspan="2" class="w-num">TTL</th>
      <th colspan="2">SCAN</th>
      <th colspan="2">MANUAL</th>
      <th rowspan="2" class="w-num">TTL</th>
      <th rowspan="2" class="w-num2">MAIN-TENANCE</th>
      <th rowspan="2" class="w-num2">NEW</th>
      <th rowspan="2" class="w-num">TOTAL</th>
      <th rowspan="2" class="w-pct">TC VS SC</th>
      <th rowspan="2" class="w-pct">AC VS TC</th>
      <th rowspan="2" class="w-pct">SCAN VS TC</th>
    </tr>
    <tr class="th-sub">
      <th class="w-num2">ON RAYON</th>
      <th class="w-num2">ACAK</th>
      <th class="w-num2">ON RAYON</th>
      <th class="w-num2">ACAK</th>
    </tr>
    <tr class="th-letter">
      <td></td><td></td>
      <td>A</td><td>B</td><td>C</td>
      <td>D</td><td>E</td><td>F</td><td>G</td>
      <td>H=D+F</td>
      <td>I</td><td>J</td><td>K</td>
      <td>L=H/C</td><td>M=L/H</td><td>N=D/H</td>
      <td></td><td></td>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>

<div class="doc-footer">
  <div class="sign-block">
    <div class="sign-line"></div>
    <div class="sign-title">TL</div>
  </div>
  <div style="text-align:center;font-size:6pt;color:#888;align-self:flex-end;">
    DIPERIKSA OLEH, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; DISETUJUI OLEH,
  </div>
  <div class="sign-block">
    <div class="sign-line"></div>
    <div class="sign-title">SPV SALES</div>
  </div>
</div>

<div class="doc-bottom">
  <span>Last Update ${e(opt.generatedAt)}</span>
  <span></span>
  <span>Printed By VISTRACK &nbsp;&nbsp;&nbsp; 1</span>
</div>

</body>
</html>`;
}

/******************************************************
 * PDF DOWNLOAD (html2pdf)
 ******************************************************/
function downloadPDF(visits, startDate, endDate, flName) {
  const htmlString = buildVisitReportHTML(visits, startDate, endDate, flName, true, false);
  const container = document.createElement('div');
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  html2pdf().set({
    margin: 0,
    filename: `Laporan_Kunjungan_${flName}_${startDate}_sd_${endDate}.pdf`,
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  }).from(container).save().then(() => container.remove());
}

/******************************************************
 * VERIFIKASI
 ******************************************************/
function loadVerifData() {
  const tg   = document.getElementById('vfDate').value;
  const flId = document.getElementById('vfFl').value || 'ALL';
  const fl   = flIdToName(flId);
  const ry   = document.getElementById('vfRy').value || 'ALL';
  if (!tg && ry === 'ALL' && flId === 'ALL') {
    Swal.fire({ icon: 'warning', title: 'Filter Kosong', text: 'Silakan pilih Tanggal, Frontliner, atau Rayon terlebih dahulu.' });
    return;
  }
  const vfSearchEl = document.getElementById('vfSearch');
  if (vfSearchEl) vfSearchEl.value = '';
  currentVerifStatusFilter = 'all';
  resetVerifFilterUI();
  showLoading('Memuat data verifikasi...');
  callServer('getVerifikasiData', [tg, fl, ry, currentIdTeamleader, currentIsSuperuser], function (res) {
    const cards = document.getElementById('verifCards');
    const list  = (res && res.data) ? res.data : [];
    if (!list.length) {
      document.getElementById('vStatTot').textContent  = 0;
      document.getElementById('vStatDone').textContent = 0;
      document.getElementById('vStatWait').textContent = 0;
      cards.innerHTML = '<div class="col-12"><div class="empty-state"><i class="fa fa-folder-open"></i><p>Tidak ada kunjungan pada filter ini</p></div></div>';
      return;
    }
    let done = 0, wait = 0;
    let html = '';
    Object.keys(verifDataMap).forEach(function (k) { delete verifDataMap[k]; });
    list.forEach(function (d, idx) {
      verifDataMap[idx] = d;
      const isDone  = d.statVerif && d.statVerif.toString().indexOf('Sudah') >= 0;
      if (isDone) done++; else wait++;
      const statusBadge = isDone ? badge('Sudah Verifikasi', 'success') : badge('Belum Verifikasi', 'warning');
      const cls = isDone ? 'verif-card done' : 'verif-card pending';
      html += '<div class="col-md-6 col-lg-4">'
        + '<div class="' + cls + '" data-action="open-verif-card" data-idx="' + idx + '">'
        + '<div class="outlet-name">' + escapeHtml(d.outlet || '-') + '</div>'
        + '<div class="outlet-meta"><i class="fa fa-user-tie"></i> ' + escapeHtml(d.frontliner || '-') + ' · <i class="fa fa-map-marker-alt"></i> ' + escapeHtml(d.rayon || '-') + '</div>'
        + '<div>' + statusBadge + '</div>'
        + '<div class="cta-link">Klik untuk verifikasi <i class="fa fa-arrow-right"></i></div>'
        + '</div></div>';
    });
    document.getElementById('vStatTot').textContent  = list.length;
    document.getElementById('vStatDone').textContent = done;
    document.getElementById('vStatWait').textContent = wait;
    cards.innerHTML = html;
  });
}

function resetVerifFilterUI() {
  ['filterAll', 'filterDone', 'filterWait'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const activeId = currentVerifStatusFilter === 'done' ? 'filterDone'
                 : currentVerifStatusFilter === 'wait' ? 'filterWait'
                 : 'filterAll';
  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.classList.add('active');
}

function filterVerifByStatus(status) {
  currentVerifStatusFilter = status;
  resetVerifFilterUI();
  const term         = (document.getElementById('vfSearch').value || '').toLowerCase().trim();
  const cardWrappers = document.querySelectorAll('#verifCards .col-md-6');
  cardWrappers.forEach(function (wrapper) {
    const cardEl = wrapper.querySelector('[data-action="open-verif-card"]');
    if (!cardEl) return;
    const idx = cardEl.dataset.idx;
    const d   = verifDataMap[idx];
    if (!d) return;
    const isDone      = d.statVerif && d.statVerif.toString().indexOf('Sudah') >= 0;
    const matchStatus = status === 'all' || (status === 'done' && isDone) || (status === 'wait' && !isDone);
    const matchSearch = !term || (d.outlet   || '').toLowerCase().indexOf(term) >= 0 || (d.outletId || '').toLowerCase().indexOf(term) >= 0;
    wrapper.style.display = (matchStatus && matchSearch) ? '' : 'none';
  });
}

function filterVerifCards() { filterVerifByStatus(currentVerifStatusFilter); }

function openVerifFromCard(el) {
  const idx = el.dataset.idx;
  if (idx === undefined) return;
  const d = verifDataMap[idx];
  if (!d) return;
  openModalVerif(d);
}

function openModalVerif(d) {
  const session = ++modalSession;
  document.getElementById('mOutletName').textContent    = d.outlet   || '-';
  document.getElementById('mOutletIdValue').textContent = d.outletId || '-';
  document.getElementById('mOutletSub').textContent     = (d.frontliner || '-') + ' · ' + (d.rayon || '-');
  document.getElementById('vRowIdx').value = d.rowIdx;
  document.getElementById('vIdResp').value = d.idResp;

  document.getElementById('vPlano').value           = d.statPlano      || 'Planogram';
  document.getElementById('vStatusToko').value      = d.statusToko     || 'Buka';
  document.getElementById('vStatusCheckout').value  = d.statusCheckout || '';
  document.getElementById('vAddDisp').value         = d.statAddDisp    || 'Sesuai';
  document.getElementById('vCheck').value           = d.statCheck      || '';

  for (let i = 1; i <= 5; i++) {
    const img = document.querySelector('[data-img-slot="' + i + '"]');
    if (!img) continue;
    img.classList.add('loading');
    img.classList.remove('error');
    img.src = PLACEHOLDER_LOADING;
  }

  callServer('resolveMultipleDriveImages', [[
      { key: '1', path: d.imgCheckin    || null },
      { key: '2', path: d.imgCheckout   || null },
      { key: '3', path: d.imgDisplay    || null },
      { key: '4', path: d.imgAddDisplay || null },
      { key: '5', path: d.imgPosm       || null }
    ]], function(results) {
      if (session !== modalSession) return;
      for (let i = 1; i <= 5; i++) {
        const img = document.querySelector('[data-img-slot="' + i + '"]');
        if (!img) continue;
        img.classList.remove('loading');
        const url = results && results[String(i)];
        if (url) {
          img.src = url;
          img.onerror = function() { img.classList.add('error'); img.src = PLACEHOLDER_NOTFOUND; };
        } else {
          img.classList.add('error'); img.src = PLACEHOLDER_NOTFOUND;
        }
      }
    }, { keepLoading: false });

  const modal = new bootstrap.Modal(document.getElementById('modalVerif'));
  modal.show();
}

function saveVerifikasi() {
  const rowIdx         = parseInt(document.getElementById('vRowIdx').value, 10);
  const idResp         = document.getElementById('vIdResp').value;
  const p              = document.getElementById('vPlano').value;
  const statusToko     = document.getElementById('vStatusToko').value;
  const statusCheckout = document.getElementById('vStatusCheckout').value;
  const a              = document.getElementById('vAddDisp').value;
  const c              = document.getElementById('vCheck').value;
  if (!idResp) { showError('ID Kunjungan (Resp ID) tidak valid'); return; }
  showLoading('Menyimpan verifikasi...');
  callServer('processVerifikasi', [rowIdx, idResp, p, statusToko, statusCheckout, a, c], function (res) {
    if (res && res.success) {
      const modalEl   = document.getElementById('modalVerif');
      const modalInst = bootstrap.Modal.getInstance(modalEl);
      if (modalInst) modalInst.hide();
      showSuccess('Verifikasi berhasil disimpan');
      setTimeout(loadVerifData, 800);
    } else {
      showError(res && res.message ? res.message : 'Gagal menyimpan');
    }
  });
}

function hapusKunjunganFromModal() {
  const idResp = document.getElementById('vIdResp').value;
  if (!idResp) { showError('ID kunjungan tidak ditemukan'); return; }
  Swal.fire({
    icon: 'warning', title: 'Hapus Kunjungan?',
    text: 'Data kunjungan akan dihapus permanen. Lanjutkan?',
    showCancelButton: true, confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal', confirmButtonColor: '#DC2626'
  }).then(function (r) {
    if (!r.isConfirmed) return;
    showLoading('Menghapus kunjungan...');
    callServer('deleteKunjungan', [idResp], function (res) {
      if (res && res.success) {
        const modalEl   = document.getElementById('modalVerif');
        const modalInst = bootstrap.Modal.getInstance(modalEl);
        if (modalInst) modalInst.hide();
        showSuccess('Kunjungan berhasil dihapus');
        setTimeout(loadVerifData, 800);
      } else {
        showError(res && res.message ? res.message : 'Gagal menghapus');
      }
    });
  });
}

/******************************************************
 * MASTER DMP — MAP
 ******************************************************/
function initMap() {
  if (map) return;
  try {
    map = L.map('mapDMP', { zoomControl: true }).setView([-7.2575, 112.7521], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  } catch (e) { showError('Gagal memuat peta: ' + e.message); }
}

function renderDmpListItem(r) {
  const outletId   = (r[2] || '').toString().trim();
  const outletName = r[4]  || '-';
  const addr       = r[5]  || '-';
  const rayon      = r[11] || '-';
  return '<div class="dmp-list-item" data-action="fly-to-outlet" data-outlet-id="' + escapeHtml(outletId) + '">'
    + '<div class="name">' + escapeHtml(outletName) + '</div>'
    + '<div class="addr"><i class="fa fa-map-marker-alt"></i> ' + escapeHtml(addr) + '</div>'
    + '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">'
    + badge(rayon, 'primary')
    + '<button type="button" class="badge-custom badge-secondary" style="border:none;cursor:pointer;" '
    + 'data-action="edit-dmp" data-outlet-id="' + escapeHtml(outletId) + '"><i class="fa fa-edit"></i> Edit</button>'
    + '<button type="button" class="badge-custom" style="border:none;cursor:pointer;background:#FEE2E2;color:#DC2626;" '
    + 'data-action="delete-dmp" data-outlet-id="' + escapeHtml(outletId) + '" data-outlet-name="' + escapeHtml(outletName) + '">'
    + '<i class="fa fa-trash"></i> Hapus</button>'
    + '</div></div>';
}

function naturalCompare(a, b) {
  return (a || '').toString().localeCompare((b || '').toString(), undefined, { numeric: true, sensitivity: 'base' });
}

function loadDmpWithFilter() {
  if (!map) initMap();
  if (!markersLayer) return;
  const flId        = document.getElementById('dmpFl').value || 'ALL';
  const ryFil        = document.getElementById('dmpRy').value || 'ALL';
  const dmpSearchEl = document.getElementById('dmpSearch');
  if (dmpSearchEl) dmpSearchEl.value = '';
  markersLayer.clearLayers();
  dmpMarkersMap = {};
  let filtered = [];
  for (let i = 1; i < rawDMP.length; i++) {
    const r = rawDMP[i];
    if (!r || !r[2]) continue;
    const rowFlId  = (r[0]  || '').toString().trim();
    const rowRayon = (r[11] || '').toString().trim();
    let flMatch = (flId === 'ALL') || (rowFlId === flId);
    if (!flMatch || (ryFil !== 'ALL' && rowRayon !== ryFil)) continue;
    filtered.push({ row: r, idx: i });
  }
  const cntEl = document.getElementById('dmpCount');
  if (cntEl) cntEl.textContent = filtered.length + ' outlet ditemukan';
  const listEl = document.getElementById('dmpList');
  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><i class="fa fa-map"></i><p>Tidak ada outlet pada filter ini</p></div>';
    return;
  }

  let bounds = [];
  filtered.forEach(function (item) {
    const r          = item.row;
    const outletId   = (r[2] || '').toString().trim();
    const outletName = r[4]  || '-';
    const addr       = r[5]  || '-';
    const latlong    = (r[12] || '').toString();
    if (latlong && latlong.indexOf(',') > 0) {
      const parts = latlong.split(',');
      const lat   = parseFloat(parts[0]);
      const lng   = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng]).bindPopup(
          '<div style="font-weight:700;font-size:13px;margin-bottom:4px;">' + escapeHtml(outletName) + '</div>'
          + '<div style="font-size:11px;color:#6B7280;">' + escapeHtml(addr) + '</div>'
        );
        markersLayer.addLayer(marker);
        dmpMarkersMap[outletId] = { marker: marker, lat: lat, lng: lng, row: r };
        bounds.push([lat, lng]);
      }
    }
  });

  const flIdsPresent = Array.from(new Set(filtered.map(function (item) { return (item.row[0] || '').toString().trim(); })));
  let listHtml = '';
  if (flIdsPresent.length > 1) {
    flIdsPresent.sort(naturalCompare);
    flIdsPresent.forEach(function (fid) {
      const flItems = filtered.filter(function (item) { return (item.row[0] || '').toString().trim() === fid; });
      const flName = frontlinerIdToName[fid] || fid;
      listHtml += '<div class="dmp-group-header"><span><i class="fa fa-user-tie"></i> '
        + escapeHtml(flName) + '</span><span class="dmp-group-count">' + flItems.length + ' outlet</span></div>';

      const rayonsPresent = Array.from(new Set(flItems.map(function (item) { return (item.row[11] || '-').toString().trim() || '-'; }))).sort(naturalCompare);
      rayonsPresent.forEach(function (ry) {
        const ryItems = flItems.filter(function (item) { return ((item.row[11] || '-').toString().trim() || '-') === ry; });
        listHtml += '<div class="dmp-rayon-header">' + escapeHtml(ry) + ' <span class="dmp-group-count">' + ryItems.length + '</span></div>';
        ryItems.forEach(function (item) { listHtml += renderDmpListItem(item.row); });
      });
    });
  } else {
    filtered.forEach(function (item) { listHtml += renderDmpListItem(item.row); });
  }

  listEl.innerHTML = listHtml;
  if (bounds.length > 0) { try { map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 }); } catch (e) {} }
}

function filterDmpList() {
  const term  = (document.getElementById('dmpSearch').value || '').toLowerCase().trim();
  const items = document.querySelectorAll('#dmpList .dmp-list-item');
  items.forEach(function (el) {
    if (!term) { el.style.display = ''; return; }
    const nameEl     = el.querySelector('.name');
    const outletName = nameEl ? nameEl.textContent.toLowerCase() : '';
    const outletId   = (el.dataset.outletId || '').toLowerCase();
    el.style.display = (outletName.indexOf(term) >= 0 || outletId.indexOf(term) >= 0) ? '' : 'none';
  });
}

function flyToOutlet(outletId) {
  const data = dmpMarkersMap[outletId]; if (!data) return;
  map.flyTo([data.lat, data.lng], 16, { duration: 0.8 });
  setTimeout(function () { data.marker.openPopup(); }, 900);
}

function showDmpForm(outletId) {
  let isEdit = false; let oldData = null;
  if (outletId) {
    for (let i = 1; i < rawDMP.length; i++) {
      if ((rawDMP[i][2] || '').toString().trim() === outletId.toString().trim()) {
        oldData = rawDMP[i]; isEdit = true; break;
      }
    }
  }
  let flOpt = '<option value="">— Pilih Frontliner —</option>';
  for (let i = 1; i < rawFL.length; i++) {
    const idFL = (rawFL[i][1] || '').toString().trim();
    const idTL = (rawFL[i][5] || '').toString().trim();
    const nm   = (rawFL[i][2] || '').toString().trim();
    if (!idFL || !nm) continue;
    const sel = oldData && (oldData[0] || '').toString().trim() === idFL ? ' selected' : '';
    flOpt += '<option value="' + escapeHtml(idFL) + '|' + escapeHtml(idTL) + '|' + escapeHtml(nm) + '"' + sel + '>' + escapeHtml(nm) + '</option>';
  }
  let ryOpt = '<option value="">— Pilih Rayon —</option>';
  const raySet = new Set();
  for (let i = 1; i < rawDMP.length; i++) { if (rawDMP[i][11]) raySet.add(rawDMP[i][11].toString().trim()); }
  if (raySet.size === 0) { for (let i = 1; i <= 12; i++) raySet.add('R' + String(i).padStart(2, '0')); }
  Array.from(raySet).sort().forEach(function (r) {
    const sel = oldData && (oldData[11] || '').toString().trim() === r ? ' selected' : '';
    ryOpt += '<option value="' + escapeHtml(r) + '"' + sel + '>' + escapeHtml(r) + '</option>';
  });

  const typeOutletOptions = ['SG', 'GR', 'RT'];
  let toOpt = '<option value="">— Pilih Type Outlet —</option>';
  typeOutletOptions.forEach(function(t) {
    const sel = oldData && (oldData[9] || '').toString().trim() === t ? ' selected' : '';
    toOpt += '<option value="' + t + '"' + sel + '>' + t + '</option>';
  });

  const typeDisplayOptions = ['GOLD', 'SILVER', 'BRONZE', 'PLATINUM', 'TITANIUM'];
  let tdOpt = '<option value="">— Pilih Type Display —</option>';
  typeDisplayOptions.forEach(function(t) {
    const sel = oldData && (oldData[10] || '').toString().trim() === t ? ' selected' : '';
    tdOpt += '<option value="' + t + '"' + sel + '>' + t + '</option>';
  });

  const v = function (idx) { return oldData ? escapeHtml(oldData[idx] || '') : ''; };

  const html = '<div style="text-align:left;"><div class="row g-2">'
    + '<div class="col-12"><label class="fw-bold" style="font-size:11px;">Frontliner *</label><select id="dfFl" class="form-select form-select-sm">' + flOpt + '</select></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Outlet ID *</label><input id="dfOutId" class="form-control form-control-sm" value="' + v(2) + '"' + (isEdit ? ' readonly' : '') + '></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Area</label><input id="dfArea" class="form-control form-control-sm" value="' + v(3) + '" placeholder="PULOGADUNG"></div>'
    + '<div class="col-12"><label class="fw-bold" style="font-size:11px;">Outlet Name *</label><input id="dfName" class="form-control form-control-sm" value="' + v(4) + '"></div>'
    + '<div class="col-12"><label class="fw-bold" style="font-size:11px;">Outlet Address</label><input id="dfAddr" class="form-control form-control-sm" value="' + v(5) + '"></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Province</label><input id="dfProv" class="form-control form-control-sm" value="' + v(6) + '" placeholder="DKI JAKARTA"></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">City</label><input id="dfCity" class="form-control form-control-sm" value="' + v(7) + '" placeholder="KOTA JAKARTA TIMUR"></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">District</label><input id="dfDistrict" class="form-control form-control-sm" value="' + v(8) + '" placeholder="CAKUNG"></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Type Outlet</label><select id="dfTypeOutlet" class="form-select form-select-sm">' + toOpt + '</select></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Type Display</label><select id="dfTypeDisplay" class="form-select form-select-sm">' + tdOpt + '</select></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Rayon *</label><select id="dfRy" class="form-select form-select-sm">' + ryOpt + '</select></div>'
    + '<div class="col-12"><label class="fw-bold" style="font-size:11px;">Latlong (lat,lng)</label><input id="dfLatLng" class="form-control form-control-sm" placeholder="-7.25, 112.76" value="' + v(12) + '"></div>'
    + '</div></div>';

  Swal.fire({
    title: isEdit ? 'Edit Outlet' : 'Tambah Outlet Baru',
    html: html, width: 640, showCancelButton: true,
    confirmButtonText: isEdit ? 'Update' : 'Simpan',
    cancelButtonText: 'Batal', confirmButtonColor: '#2563EB', focusConfirm: false,
    preConfirm: function () {
      const fl          = document.getElementById('dfFl').value;
      const outId       = document.getElementById('dfOutId').value.trim();
      const area        = document.getElementById('dfArea').value.trim();
      const name        = document.getElementById('dfName').value.trim();
      const addr        = document.getElementById('dfAddr').value.trim();
      const prov        = document.getElementById('dfProv').value.trim();
      const city        = document.getElementById('dfCity').value.trim();
      const district    = document.getElementById('dfDistrict').value.trim();
      const typeOutlet  = document.getElementById('dfTypeOutlet').value;
      const typeDisplay = document.getElementById('dfTypeDisplay').value;
      const ry          = document.getElementById('dfRy').value;
      const latlng      = document.getElementById('dfLatLng').value.trim();

      if (!fl)    { Swal.showValidationMessage('Frontliner wajib dipilih!'); return false; }
      if (!outId) { Swal.showValidationMessage('Outlet ID wajib diisi!');    return false; }
      if (!name)  { Swal.showValidationMessage('Nama Outlet wajib diisi!');  return false; }
      if (!ry)    { Swal.showValidationMessage('Rayon wajib dipilih!');       return false; }
      if (latlng) {
        const parts = latlng.split(',');
        if (parts.length !== 2 || isNaN(parseFloat(parts[0])) || isNaN(parseFloat(parts[1]))) {
          Swal.showValidationMessage('Format Latlong salah! Contoh: -6.1234,106.5678'); return false;
        }
      }
      const flParts = fl.split('|');
      return [ flParts[0] || '', flParts[1] || '', outId, area, name, addr, prov, city, district, typeOutlet, typeDisplay, ry, latlng ];
    }
  }).then(function (r) {
    if (!r.isConfirmed || !r.value) return;
    showLoading('Menyimpan data outlet...');
    callServer('saveDMP', [r.value, isEdit, isEdit ? outletId : null], function (res) {
      if (res && res.success) {
        showSuccess(isEdit ? 'Outlet berhasil diupdate' : 'Outlet baru berhasil ditambahkan');
        clearMasterCache();
        setTimeout(function () { loadMasterData(true); setTimeout(loadDmpWithFilter, 600); }, 800);
      } else { showError(res && res.message ? res.message : 'Gagal menyimpan'); }
    });
  });
}

function deleteDmpOutlet(outletId, outletName) {
  if (!outletId) return;
  Swal.fire({
    icon: 'warning', title: 'Hapus Outlet?',
    html: 'Outlet <b>' + escapeHtml(outletName || outletId) + '</b> akan dihapus permanen.<br><small style="color:#DC2626;">Data yang sudah dihapus tidak dapat dikembalikan.</small>',
    showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#DC2626'
  }).then(function (r) {
    if (!r.isConfirmed) return;
    showLoading('Menghapus outlet...');
    callServer('deleteDMP', [outletId], function (res) {
      if (res && res.success) {
        showSuccess('Outlet berhasil dihapus');
        clearMasterCache();
        setTimeout(function () { loadMasterData(true); setTimeout(loadDmpWithFilter, 600); }, 800);
      } else { showError(res && res.message ? res.message : 'Gagal menghapus outlet'); }
    });
  });
}

/******************************************************
 * TEAMLEADER CRUD
 ******************************************************/
function loadTeamleaderData() {
  if (!currentIsSuperuser) {
    Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Hanya SUPERUSER yang dapat mengakses halaman ini.', confirmButtonColor: '#2563EB' });
    return;
  }
  const cached = loadTLCache();
  if (cached) {
    renderTeamleaderCards(cached);
    callServer('getTeamleaderData', [], function(res) {
      const list = (res && res.data) ? res.data : [];
      saveTLCache(list); renderTeamleaderCards(list);
    }, { keepLoading: false });
    return;
  }
  showLoading('Memuat data teamleader...');
  callServer('getTeamleaderData', [], function(res) {
    const list = (res && res.data) ? res.data : [];
    saveTLCache(list); renderTeamleaderCards(list);
  });
}

function renderTeamleaderCards(list) {
  const cards = document.getElementById('teamleaderCards');
  document.getElementById('tlStatTotal').textContent = list.length;
  if (!list.length) {
    cards.innerHTML = '<div class="col-12"><div class="empty-state"><i class="fa fa-user-tie"></i><p>Tidak ada data teamleader</p></div></div>';
    return;
  }
  let html = '';
  list.forEach(function (d) {
    const isSU = (d.idTL || '').toUpperCase() === 'SUPERUSER';
    html += '<div class="col-md-6 col-lg-4" data-tl-search="' + escapeHtml((d.name + ' ' + d.idTL + ' ' + d.email).toLowerCase()) + '">'
      + '<div class="verif-card ' + (isSU ? 'done' : 'pending') + '" style="cursor:default;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">'
      + '<div><div class="outlet-name">' + escapeHtml(d.name) + '</div><div class="outlet-meta"><span class="outlet-id-badge">' + escapeHtml(d.idTL) + '</span></div></div>'
      + '<div style="display:flex;gap:6px;flex-shrink:0;">'
      + '<button type="button" class="badge-custom badge-primary" style="border:none;cursor:pointer;" data-action="edit-teamleader" data-row-idx="' + d.rowIdx + '" data-tl="' + escapeHtml(JSON.stringify(d)) + '"><i class="fa fa-edit"></i> Edit</button>'
      + (!isSU ? '<button type="button" class="badge-custom" style="border:none;cursor:pointer;background:#FEE2E2;color:#DC2626;" data-action="delete-teamleader" data-row-idx="' + d.rowIdx + '" data-name="' + escapeHtml(d.name) + '"><i class="fa fa-trash"></i></button>' : '')
      + '</div></div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;"><i class="fa fa-envelope" style="width:14px;"></i> ' + escapeHtml(d.email || '-') + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted);"><i class="fa fa-map-marker-alt" style="width:14px;"></i> ' + escapeHtml(d.area || '-') + '</div>'
      + '</div></div>';
  });
  cards.innerHTML = html;
}

function filterTeamleaderCards() {
  const term  = (document.getElementById('tlSearch').value || '').toLowerCase().trim();
  const items = document.querySelectorAll('#teamleaderCards .col-md-6');
  items.forEach(function (el) {
    if (!term) { el.style.display = ''; return; }
    el.style.display = (el.dataset.tlSearch || '').toLowerCase().indexOf(term) >= 0 ? '' : 'none';
  });
}

function showTeamleaderForm(rowIdx, tlJson) {
  const isEdit = !!rowIdx;
  let oldData  = null;
  if (isEdit && tlJson) { try { oldData = JSON.parse(tlJson); } catch (e) {} }
  const v = function (key) { return oldData ? escapeHtml(oldData[key] || '') : ''; };
  const html = '<div style="text-align:left;"><div class="row g-2">'
    + '<div class="col-12"><label class="fw-bold" style="font-size:11px;">Email *</label><input id="tfEmail" class="form-control form-control-sm" value="' + v('email') + '" placeholder="email@example.com"></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">ID Teamleader *</label><input id="tfIdTL" class="form-control form-control-sm" value="' + v('idTL') + '" placeholder="0300-TLMDGT"' + (isEdit ? ' readonly' : '') + '></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Nama Teamleader *</label><input id="tfName" class="form-control form-control-sm" value="' + v('name') + '"></div>'
    + '<div class="col-12"><label class="fw-bold" style="font-size:11px;">Area</label><input id="tfArea" class="form-control form-control-sm" value="' + v('area') + '" placeholder="PULOGADUNG"></div>'
    + '</div></div>';
  Swal.fire({
    title: isEdit ? 'Edit Teamleader' : 'Tambah Teamleader Baru',
    html: html, width: 480, showCancelButton: true, confirmButtonText: isEdit ? 'Update' : 'Simpan',
    cancelButtonText: 'Batal', confirmButtonColor: '#2563EB', focusConfirm: false,
    preConfirm: function () {
      const email = document.getElementById('tfEmail').value.trim();
      const idTL  = document.getElementById('tfIdTL').value.trim();
      const name  = document.getElementById('tfName').value.trim();
      const area  = document.getElementById('tfArea').value.trim();
      if (!email) { Swal.showValidationMessage('Email wajib diisi!');            return false; }
      if (!idTL)  { Swal.showValidationMessage('ID Teamleader wajib diisi!');   return false; }
      if (!name)  { Swal.showValidationMessage('Nama Teamleader wajib diisi!'); return false; }
      return [email, idTL, name, area];
    }
  }).then(function (r) {
    if (!r.isConfirmed || !r.value) return;
    showLoading(isEdit ? 'Menyimpan perubahan...' : 'Menambahkan teamleader...');
    callServer('saveTeamleader', [r.value, isEdit, isEdit ? parseInt(rowIdx) : null], function (res) {
      if (res && res.success) {
        showSuccess(isEdit ? 'Teamleader berhasil diupdate' : 'Teamleader baru berhasil ditambahkan');
        clearTLCache(); setTimeout(loadTeamleaderData, 800);
      } else { showError(res && res.message ? res.message : 'Gagal menyimpan'); }
    });
  });
}

function deleteTeamleaderRow(rowIdx, name) {
  Swal.fire({
    icon: 'warning', title: 'Hapus Teamleader?',
    html: 'Data <b>' + escapeHtml(name) + '</b> akan dihapus permanen.<br><small style="color:#DC2626;">Pastikan tidak ada frontliner yang terhubung.</small>',
    showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#DC2626'
  }).then(function (r) {
    if (!r.isConfirmed) return;
    showLoading('Menghapus teamleader...');
    callServer('deleteTeamleader', [parseInt(rowIdx)], function (res) {
      if (res && res.success) {
        showSuccess('Teamleader berhasil dihapus');
        clearTLCache(); setTimeout(loadTeamleaderData, 800);
      } else { showError(res && res.message ? res.message : 'Gagal menghapus'); }
    });
  });
}

/******************************************************
 * FRONTLINER CRUD
 ******************************************************/
function loadFrontlinerData() {
  const cached = loadFLDataCache();
  if (cached) {
    rawFrontlinerData = cached;
    document.getElementById('flStatTotal').textContent = cached.length;
    renderFrontlinerCards(cached);
    callServer('getFrontlinerData', [currentIdTeamleader, currentIsSuperuser], function(res) {
      const list = (res && res.data) ? res.data : [];
      saveFLDataCache(list); rawFrontlinerData = list;
      document.getElementById('flStatTotal').textContent = list.length;
      renderFrontlinerCards(list);
    }, { keepLoading: false });
    return;
  }
  showLoading('Memuat data frontliner...');
  callServer('getFrontlinerData', [currentIdTeamleader, currentIsSuperuser], function (res) {
    const list = (res && res.data) ? res.data : [];
    saveFLDataCache(list); rawFrontlinerData = list;
    document.getElementById('flStatTotal').textContent = list.length;
    if (!list.length) {
      document.getElementById('frontlinerCards').innerHTML = '<div class="col-12"><div class="empty-state"><i class="fa fa-users"></i><p>Tidak ada data frontliner</p></div></div>';
      return;
    }
    renderFrontlinerCards(list);
  });
}

function renderFrontlinerCards(list) {
  const cards = document.getElementById('frontlinerCards');
  let html = '';
  list.forEach(function (d) {
    html += '<div class="col-md-6 col-lg-4" data-fl-search="' + escapeHtml((d.name + ' ' + d.idFrontliner + ' ' + d.email).toLowerCase()) + '">'
      + '<div class="verif-card done" style="cursor:default;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">'
      + '<div><div class="outlet-name">' + escapeHtml(d.name) + '</div><div class="outlet-meta"><span class="outlet-id-badge">' + escapeHtml(d.idFrontliner) + '</span></div></div>'
      + '<div style="display:flex;gap:6px;flex-shrink:0;">'
      + '<button type="button" class="badge-custom badge-primary" style="border:none;cursor:pointer;" data-action="edit-frontliner" data-row-idx="' + d.rowIdx + '" data-fl="' + escapeHtml(JSON.stringify(d)) + '"><i class="fa fa-edit"></i> Edit</button>'
      + '<button type="button" class="badge-custom" style="border:none;cursor:pointer;background:#FEE2E2;color:#DC2626;" data-action="delete-frontliner" data-row-idx="' + d.rowIdx + '" data-name="' + escapeHtml(d.name) + '"><i class="fa fa-trash"></i></button>'
      + '</div></div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;"><i class="fa fa-envelope" style="width:14px;"></i> ' + escapeHtml(d.email || '-') + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;"><i class="fa fa-briefcase" style="width:14px;"></i> ' + escapeHtml(d.position || '-') + ' · ' + escapeHtml(d.area || '-') + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + badge(d.idTeamleader || '-', 'primary') + badge(d.tlName || '-', 'secondary') + '</div></div></div>';
  });
  cards.innerHTML = html;
}

function filterFrontlinerCards() {
  const term  = (document.getElementById('flSearch').value || '').toLowerCase().trim();
  const items = document.querySelectorAll('#frontlinerCards .col-md-6');
  items.forEach(function (el) {
    if (!term) { el.style.display = ''; return; }
    el.style.display = (el.dataset.flSearch || '').toLowerCase().indexOf(term) >= 0 ? '' : 'none';
  });
}

function showFrontlinerForm(rowIdx, flJson) {
  const isEdit = !!rowIdx;
  let oldData  = null;
  if (isEdit && flJson) { try { oldData = JSON.parse(flJson); } catch (e) {} }
  const v = function (key) { return oldData ? escapeHtml(oldData[key] || '') : ''; };
  const tlMap = {};
  for (let i = 1; i < rawFL.length; i++) {
    const tlId   = (rawFL[i][5] || '').toString().trim();
    const tlName = (rawFL[i][6] || '').toString().trim();
    if (tlId && !tlMap[tlId]) tlMap[tlId] = tlName;
  }
  let tlOpt = '<option value="">— Pilih Teamleader —</option>';
  for (let tlId in tlMap) {
    if (!currentIsSuperuser && tlId.toUpperCase() !== currentIdTeamleader.toUpperCase()) continue;
    const sel = oldData && (oldData.idTeamleader || '') === tlId ? ' selected' : '';
    tlOpt += '<option value="' + escapeHtml(tlId) + '|' + escapeHtml(tlMap[tlId]) + '"' + sel + '>' + escapeHtml(tlId) + ' — ' + escapeHtml(tlMap[tlId]) + '</option>';
  }
  const html = '<div style="text-align:left;"><div class="row g-2">'
    + '<div class="col-12"><label class="fw-bold" style="font-size:11px;">Email *</label><input id="ffEmail" class="form-control form-control-sm" value="' + v('email') + '" placeholder="email@example.com"></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">ID Frontliner *</label><input id="ffIdFL" class="form-control form-control-sm" value="' + v('idFrontliner') + '" placeholder="0300-TMDA01"' + (isEdit ? ' readonly' : '') + '></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Nama Frontliner *</label><input id="ffName" class="form-control form-control-sm" value="' + v('name') + '"></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Position</label><input id="ffPos" class="form-control form-control-sm" value="' + v('position') + '" placeholder="TMDA 01"></div>'
    + '<div class="col-6"><label class="fw-bold" style="font-size:11px;">Area</label><input id="ffArea" class="form-control form-control-sm" value="' + v('area') + '" placeholder="PULOGADUNG"></div>'
    + '<div class="col-12"><label class="fw-bold" style="font-size:11px;">Teamleader *</label><select id="ffTL" class="form-select form-select-sm">' + tlOpt + '</select></div>'
    + '</div></div>';
  Swal.fire({
    title: isEdit ? 'Edit Frontliner' : 'Tambah Frontliner Baru',
    html: html, width: 560, showCancelButton: true, confirmButtonText: isEdit ? 'Update' : 'Simpan',
    cancelButtonText: 'Batal', confirmButtonColor: '#2563EB', focusConfirm: false,
    preConfirm: function () {
      const email = document.getElementById('ffEmail').value.trim();
      const idFL  = document.getElementById('ffIdFL').value.trim();
      const name  = document.getElementById('ffName').value.trim();
      const pos   = document.getElementById('ffPos').value.trim();
      const area  = document.getElementById('ffArea').value.trim();
      const tl    = document.getElementById('ffTL').value;
      if (!email) { Swal.showValidationMessage('Email wajib diisi!');            return false; }
      if (!idFL)  { Swal.showValidationMessage('ID Frontliner wajib diisi!');   return false; }
      if (!name)  { Swal.showValidationMessage('Nama Frontliner wajib diisi!'); return false; }
      if (!tl)    { Swal.showValidationMessage('Teamleader wajib dipilih!');    return false; }
      const tlParts = tl.split('|');
      return [email, idFL, name, pos, area, tlParts[0] || '', tlParts[1] || ''];
    }
  }).then(function (r) {
    if (!r.isConfirmed || !r.value) return;
    showLoading(isEdit ? 'Menyimpan perubahan...' : 'Menambahkan frontliner...');
    callServer('saveFrontliner', [r.value, isEdit, isEdit ? parseInt(rowIdx) : null], function (res) {
      if (res && res.success) {
        showSuccess(isEdit ? 'Frontliner berhasil diupdate' : 'Frontliner baru berhasil ditambahkan');
        clearMasterCache(); clearFLDataCache();
        setTimeout(function () { loadFrontlinerData(); loadMasterData(true); }, 800);
      } else { showError(res && res.message ? res.message : 'Gagal menyimpan'); }
    });
  });
}

function deleteFrontlinerRow(rowIdx, name) {
  Swal.fire({
    icon: 'warning', title: 'Hapus Frontliner?', html: 'Data <b>' + escapeHtml(name) + '</b> akan dihapus permanen.',
    showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#DC2626'
  }).then(function (r) {
    if (!r.isConfirmed) return;
    showLoading('Menghapus frontliner...');
    callServer('deleteFrontliner', [parseInt(rowIdx)], function (res) {
      if (res && res.success) {
        showSuccess('Frontliner berhasil dihapus');
        clearMasterCache(); clearFLDataCache();
        setTimeout(function () { loadFrontlinerData(); loadMasterData(true); }, 800);
      } else { showError(res && res.message ? res.message : 'Gagal menghapus'); }
    });
  });
}

/******************************************************
 * UPLOAD DMP FILE
 ******************************************************/
const DMP_EXPECTED_COLUMNS = [ "ID Frontliner", "ID Teamleader", "Outlet ID", "Area", "Outlet Name", "Outlet Address", "Province", "City", "District", "Type Outlet", "Type Display", "Rayon", "Latlong" ];
let dmpUploadedData = null;

function downloadDmpTemplate() {
  if (typeof XLSX === 'undefined') {
    Swal.fire({ icon: 'error', title: 'Library Belum Siap', text: 'Tunggu beberapa detik dan coba lagi.', confirmButtonColor: '#2563EB' });
    return;
  }
  const headers = [ "ID Frontliner", "ID Teamleader", "Outlet ID", "Area", "Outlet Name", "Outlet Address", "Province", "City", "District", "Type Outlet", "Type Display", "Rayon", "Latlong" ];
  const exampleRow = [ "0300-TMDA01", "0300-TLMDGT", "0300-0000001", "PULOGADUNG", "NAMA OUTLET", "JL. CONTOH NO. 1", "DKI JAKARTA", "KOTA JAKARTA TIMUR", "CAKUNG", "SG", "Silver", "R01", "-6.1234,106.5678" ];
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  ws['!cols'] = headers.map(function () { return { wch: 20 }; });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template DMP');
  XLSX.writeFile(wb, 'Template_Upload_DMP.xlsx');
}

function downloadDmpData() {
  if (typeof XLSX === 'undefined') {
    Swal.fire({ icon: 'error', title: 'Library Belum Siap', text: 'Tunggu beberapa detik dan coba lagi.', confirmButtonColor: '#2563EB' });
    return;
  }
  const flId       = document.getElementById('dmpFl').value || 'ALL';
  const ryFil      = document.getElementById('dmpRy').value || 'ALL';
  const searchEl   = document.getElementById('dmpSearch');
  const searchTerm = (searchEl ? searchEl.value : '').toLowerCase().trim();

  let filtered = [];
  for (let i = 1; i < rawDMP.length; i++) {
    const r = rawDMP[i];
    if (!r || !r[2]) continue;
    const rowFlId  = (r[0]  || '').toString().trim();
    const rowRayon = (r[11] || '').toString().trim();
    if (flId !== 'ALL' && rowFlId !== flId) continue;
    if (ryFil !== 'ALL' && rowRayon !== ryFil) continue;
    if (searchTerm) {
      const name = (r[4] || '').toString().toLowerCase();
      const oid  = (r[2] || '').toString().toLowerCase();
      if (name.indexOf(searchTerm) < 0 && oid.indexOf(searchTerm) < 0) continue;
    }
    filtered.push(r);
  }

  if (filtered.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Tidak Ada Data', text: 'Tidak ada outlet untuk didownload dengan filter saat ini.', confirmButtonColor: '#2563EB' });
    return;
  }

  const headers = [ "ID Frontliner", "ID Teamleader", "Outlet ID", "Area", "Outlet Name", "Outlet Address", "Province", "City", "District", "Type Outlet", "Type Display", "Rayon", "Latlong" ];
  const aoa = [headers].concat(filtered);
  const ws  = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = headers.map(function () { return { wch: 20 }; });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data DMP');

  const tlLabel = currentIsSuperuser ? 'Semua_TL' : (currentIdTeamleader || 'TL').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
  XLSX.writeFile(wb, 'Data_DMP_' + tlLabel + '_' + getTodayString() + '.xlsx');
}

function validateDmpFile() {
  const fileInput        = document.getElementById('dmpFileInput');
  const validationResult = document.getElementById('dmpValidationResult');
  const uploadButton     = document.getElementById('uploadDmpFile');
  if (!fileInput || !validationResult || !uploadButton) return;
  const file = fileInput.files && fileInput.files[0];
  if (!file) {
    validationResult.innerHTML = '<p style="color:#DC2626;">Silakan pilih file terlebih dahulu.</p>';
    return;
  }
  if (typeof XLSX === 'undefined') {
    validationResult.innerHTML = '<p style="color:#DC2626;font-weight:700;">Library Excel belum siap. Tunggu beberapa detik lalu coba lagi.</p>';
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const fileColumns = (jsonData[0] || []).map(function (c) { return (c || '').toString().trim(); });
      const match = DMP_EXPECTED_COLUMNS.every(function (col, i) { return fileColumns[i] === col; }) && fileColumns.length >= DMP_EXPECTED_COLUMNS.length;
      if (match) {
        const dataRows = jsonData.slice(1).filter(function (row) { return row && row.some(function (cell) { return cell !== null && cell !== undefined && cell !== ''; }); });
        const normalized = dataRows.map(function (row) {
          var r = [];
          for (var i = 0; i < 13; i++) {
            var val = row[i] !== undefined ? row[i] : '';
            if (i === 12) val = normalizeLatLng(val);
            r.push(val);
          }
          return r;
        });
        dmpUploadedData = [DMP_EXPECTED_COLUMNS].concat(normalized);
        validationResult.innerHTML = '<p style="color:#16A34A;font-weight:700;">✓ Urutan kolom sesuai. ' + normalized.length + ' baris data siap diupload.</p>';
        uploadButton.classList.remove('hidden');
      } else {
        dmpUploadedData = null;
        uploadButton.classList.add('hidden');
        const found = fileColumns.slice(0, DMP_EXPECTED_COLUMNS.length).join(', ') || '(kosong)';
        validationResult.innerHTML = '<p style="color:#DC2626;font-weight:700;">✗ Urutan kolom tidak sesuai.</p><p style="font-size:11px;color:#6B7280;margin-top:4px;">Ditemukan: <b>' + escapeHtml(found) + '</b></p>';
      }
    } catch (err) {
      dmpUploadedData = null; uploadButton.classList.add('hidden');
      validationResult.innerHTML = '<p style="color:#DC2626;font-weight:700;">✗ Gagal membaca file. Pastikan formatnya .xlsx yang valid.</p>';
    }
  };
  reader.readAsBinaryString(file);
}

function uploadDmpFile() {
  const validationResult = document.getElementById('dmpValidationResult');
  const uploadButton     = document.getElementById('uploadDmpFile');
  const fileInput        = document.getElementById('dmpFileInput');
  if (!dmpUploadedData) {
    if (validationResult) validationResult.innerHTML = '<p style="color:#DC2626;font-weight:700;">Validasi file terlebih dahulu.</p>';
    return;
  }
  showLoading('Mengunggah file...');
  callServer('replaceDmpData', [dmpUploadedData, currentIdTeamleader, currentIsSuperuser], function (res) {
    if (res && res.success) {
      dmpUploadedData = null;
      if (fileInput)        fileInput.value = '';
      if (validationResult) validationResult.innerHTML = '';
      if (uploadButton)     uploadButton.classList.add('hidden');
      const modalEl   = document.getElementById('modalUploadDmp');
      const modalInst = bootstrap.Modal.getInstance(modalEl);
      if (modalInst) modalInst.hide();
      showSuccess('File DMP berhasil diupload.');
      clearMasterCache();
      setTimeout(function () { loadMasterData(true); }, 800);
    } else {
      showError(res && res.message ? res.message : 'Gagal mengunggah file.');
    }
  });
}

function normalizeLatLng(raw) {
  if (!raw && raw !== 0) return '';
  var str = raw.toString().trim();
  if (!str) return '';
  str = str.replace(/[\t\n\r\u00A0]/g, ' ').trim();
  var dotFormat = /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/;
  if (dotFormat.test(str)) { var parts = str.split(','); return parts[0].trim() + ',' + parts[1].trim(); }
  var intFormat = /^-?\d+\s*,\s*-?\d+$/;
  if (intFormat.test(str)) { var parts = str.split(','); return parts[0].trim() + ',' + parts[1].trim(); }
  var semiFormat = /^(-?\d+),(\d+)\s*[;]\s*(-?\d+),(\d+)$/;
  var semiMatch  = str.match(semiFormat);
  if (semiMatch) {
    var lat = semiMatch[1] + '.' + semiMatch[2];
    var lng = semiMatch[3] + '.' + semiMatch[4];
    return lat + ',' + lng;
  }
  var withDots = str.replace(/,/g, '.');
  var tokens = withDots.match(/-?\d+\.?\d*/g);
  if (tokens && tokens.length >= 2) {
    var lat = parseFloat(tokens[0]);
    var lng = parseFloat(tokens[1]);
    if (tokens.length === 4) {
      var latInt  = tokens[0]; var latDec  = tokens[1]; var lngInt  = tokens[2]; var lngDec  = tokens[3];
      var latFull = parseFloat(latInt + '.' + latDec); var lngFull = parseFloat(lngInt + '.' + lngDec);
      if (!isNaN(latFull) && !isNaN(lngFull) && latFull >= -90 && latFull <= 90 && lngFull >= -180 && lngFull <= 180) {
        return latFull.toString() + ',' + lngFull.toString();
      }
    }
    if (tokens.length === 3) {
      var try1lat = parseFloat(tokens[0] + '.' + tokens[1]); var try1lng = parseFloat(tokens[2]);
      if (!isNaN(try1lat) && !isNaN(try1lng) && try1lat >= -90 && try1lat <= 90 && try1lng >= -180 && try1lng <= 180 && Math.abs(try1lng) > Math.abs(try1lat)) {
        return try1lat.toString() + ',' + try1lng.toString();
      }
      var try2lat = parseFloat(tokens[0]); var try2lng = parseFloat(tokens[1] + '.' + tokens[2]);
      if (!isNaN(try2lat) && !isNaN(try2lng) && try2lat >= -90 && try2lat <= 90 && try2lng >= -180 && try2lng <= 180) {
        return try2lat.toString() + ',' + try2lng.toString();
      }
    }
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return lat.toString() + ',' + lng.toString();
    }
  }
  return str;
}

/******************************************************
 * LIGHTBOX MODULE
 ******************************************************/
const Lightbox = (function () {
  let currentSlot = 1; let scale = 1; let translateX = 0; let translateY = 0;
  let isDragging = false; let dragStartX = 0; let dragStartY = 0; let initialDistance = 0;
  const MIN_SCALE = 0.5; const MAX_SCALE = 5; const ZOOM_STEP = 0.25;
  function open(slot) { currentSlot = parseInt(slot, 10); document.getElementById('lightbox').classList.add('active'); document.body.style.overflow = 'hidden'; loadCurrentImage(); bindKeyboard(); }
  function close() { document.getElementById('lightbox').classList.remove('active'); document.body.style.overflow = ''; resetTransform(); unbindKeyboard(); }
  function loadCurrentImage() {
    const img        = document.getElementById('lightboxImg');
    const sourceImg = document.querySelector('[data-img-slot="' + currentSlot + '"]');
    if (!sourceImg || !sourceImg.src) { img.src = ''; return; }
    img.src = sourceImg.src; img.alt = sourceImg.alt || '';
    const label = sourceImg.dataset.imgLabel || 'Foto';
    document.getElementById('lightboxLabel').textContent   = label;
    document.getElementById('lightboxCounter').textContent = currentSlot + '/5';
    resetTransform(); updateNavButtons();
  }
  function updateNavButtons() { document.getElementById('lightboxPrev').disabled = currentSlot <= 1; document.getElementById('lightboxNext').disabled = currentSlot >= 5; }
  function navigate(direction) { const next = currentSlot + direction; if (next < 1 || next > 5) return; currentSlot = next; loadCurrentImage(); }
  function setScale(newScale) { scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)); applyTransform(); updateZoomLabel(); }
  function zoomIn()  { setScale(scale + ZOOM_STEP); }
  function zoomOut() { setScale(scale - ZOOM_STEP); }
  function resetTransform() { scale = 1; translateX = 0; translateY = 0; applyTransform(); updateZoomLabel(); }
  function applyTransform() {
    const img = document.getElementById('lightboxImg'); img.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
    const container = document.getElementById('lightboxImgContainer');
    if (scale > 1) container.classList.add('is-zoomed'); else            container.classList.remove('is-zoomed');
  }
  function updateZoomLabel() { document.getElementById('lightboxZoomLevel').textContent = Math.round(scale * 100) + '%'; }
  function downloadImage() {
    const img = document.getElementById('lightboxImg'); if (!img.src) return;
    const label    = document.getElementById('lightboxLabel').textContent;
    const filename = 'foto_' + label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now() + '.jpg';
    const a = document.createElement('a'); a.href = img.src; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function onMouseDown(e) { if (scale <= 1) return; isDragging = true; dragStartX = e.clientX - translateX; dragStartY = e.clientY - translateY; document.getElementById('lightboxImgContainer').classList.add('dragging'); e.preventDefault(); }
  function onMouseMove(e) { if (!isDragging) return; translateX = e.clientX - dragStartX; translateY = e.clientY - dragStartY; applyTransform(); }
  function onMouseUp() { isDragging = false; document.getElementById('lightboxImgContainer').classList.remove('dragging'); }
  function onWheel(e) { e.preventDefault(); if (e.deltaY < 0) zoomIn(); else zoomOut(); }
  function getTouchDistance(touches) { const dx = touches[0].clientX - touches[1].clientX; const dy = touches[0].clientY - touches[1].clientY; return Math.sqrt(dx * dx + dy * dy); }
  function onTouchStart(e) {
    if (e.touches.length === 2) { initialDistance = getTouchDistance(e.touches); e.preventDefault(); }
    else if (e.touches.length === 1 && scale > 1) { isDragging = true; dragStartX = e.touches[0].clientX - translateX; dragStartY = e.touches[0].clientY - translateY; }
  }
  function onTouchMove(e) {
    if (e.touches.length === 2) { e.preventDefault(); const newDistance = getTouchDistance(e.touches); setScale(scale + (newDistance - initialDistance) * 0.01); initialDistance = newDistance; }
    else if (e.touches.length === 1 && isDragging) { e.preventDefault(); translateX = e.touches[0].clientX - dragStartX; translateY = e.touches[0].clientY - dragStartY; applyTransform(); }
  }
  function onTouchEnd() { isDragging = false; initialDistance = 0; }
  function onKeyDown(e) {
    switch (e.key) { case 'Escape':    close();         break; case 'ArrowLeft': navigate(-1);    break; case 'ArrowRight':navigate(1);     break; case '+': case '=': zoomIn();      break; case '-':           zoomOut();     break; case '0':           resetTransform(); break; }
  }
  function bindKeyboard()   { document.addEventListener('keydown',    onKeyDown); }
  function unbindKeyboard() { document.removeEventListener('keydown', onKeyDown); }
  function init() {
    const overlay = document.getElementById('lightbox'); if (!overlay) return;
    document.getElementById('lightboxClose').addEventListener('click', close); document.getElementById('lightboxPrev').addEventListener('click',  function () { navigate(-1); }); document.getElementById('lightboxNext').addEventListener('click',  function () { navigate(1);  }); document.getElementById('lightboxZoomIn').addEventListener('click',  zoomIn); document.getElementById('lightboxZoomOut').addEventListener('click', zoomOut); document.getElementById('lightboxReset').addEventListener('click',    resetTransform); document.getElementById('lightboxDownload').addEventListener('click', downloadImage);
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.classList.contains('lightbox-content')) close(); });
    const container = document.getElementById('lightboxImgContainer');
    container.addEventListener('mousedown', onMouseDown); document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup',   onMouseUp); container.addEventListener('wheel',      onWheel,      { passive: false }); container.addEventListener('touchstart', onTouchStart, { passive: false }); container.addEventListener('touchmove',  onTouchMove,  { passive: false }); container.addEventListener('touchend',   onTouchEnd);
    container.addEventListener('dblclick', function () { if (scale > 1) resetTransform(); else setScale(2); });
  }
  return { init: init, open: open, close: close };
})();

window.addEventListener('DOMContentLoaded', function () { Lightbox.init(); });

/******************************************************
 * DOWNLOAD TOAST MODULE
 ******************************************************/
const DownloadToast = (function () {
  let _cancelled  = false; let _fakeTimer  = null; let _startTime  = 0; let _duration   = 0; let _type       = 'pdf';
  function show(type, title, desc) {
    _type      = type || 'pdf'; _cancelled = false;
    const toast    = document.getElementById('dlToast'); const icon     = document.getElementById('dlToastIcon'); const iconI    = document.getElementById('dlToastIconInner'); const titleEl  = document.getElementById('dlToastTitle'); const descEl   = document.getElementById('dlToastDesc'); const fill     = document.getElementById('dlToastFill'); const pct      = document.getElementById('dlToastPct'); const cancel   = document.getElementById('dlToastCancel'); const done     = document.getElementById('dlToastDone');
    if (!toast) return;
    fill.style.width = '0%'; pct.textContent  = '0% selesai'; cancel.style.display = ''; done.style.display   = 'none';
    if (_type === 'xlsx') { icon.className  = 'dl-toast-icon xlsx'; iconI.className = 'fa fa-file-excel'; fill.className  = 'dl-toast-fill xlsx-fill'; cancel.className = 'dl-toast-cancel xlsx-cancel'; done.className   = 'dl-toast-done-badge xlsx-done'; } else { icon.className  = 'dl-toast-icon pdf'; iconI.className = 'fa fa-file-pdf'; fill.className  = 'dl-toast-fill pdf-fill'; cancel.className = 'dl-toast-cancel pdf-cancel'; done.className   = 'dl-toast-done-badge pdf-done'; }
    titleEl.textContent = title || 'Download'; descEl.textContent  = desc  || 'Memproses file...';
    toast.classList.add('show');
  }
  function startFakeProgress(durationMs) {
    _duration  = durationMs || 8000; _startTime = performance.now();
    if (_fakeTimer) clearInterval(_fakeTimer);
    _fakeTimer = setInterval(function () {
      if (_cancelled) { clearInterval(_fakeTimer); return; }
      const elapsed  = performance.now() - _startTime; const progress = Math.min(elapsed / _duration, 0.92); const pct      = Math.round(progress * 100);
      const fill     = document.getElementById('dlToastFill'); const pctEl    = document.getElementById('dlToastPct');
      if (fill)  fill.style.width    = pct + '%';
      if (pctEl) pctEl.textContent   = pct + '% selesai';
    }, 200);
  }
  function complete() {
    if (_fakeTimer) clearInterval(_fakeTimer);
    const fill   = document.getElementById('dlToastFill'); const pctEl  = document.getElementById('dlToastPct'); const cancel = document.getElementById('dlToastCancel'); const done   = document.getElementById('dlToastDone');
    if (fill)   fill.style.width   = '100%'; if (pctEl)  pctEl.textContent  = '100% selesai'; if (cancel) cancel.style.display = 'none'; if (done)   { done.style.display = 'inline-flex'; }
    setTimeout(hide, 2800);
  }
  function hide() { if (_fakeTimer) clearInterval(_fakeTimer); const toast = document.getElementById('dlToast'); if (toast) toast.classList.remove('show'); _cancelled = false; }
  function cancel() { _cancelled = true; if (_fakeTimer) clearInterval(_fakeTimer); hide(); }
  function isCancelled() { return _cancelled; }
  function bindClose(onCancelCallback) {
    const cancelBtn = document.getElementById('dlToastCancel'); const closeBtn  = document.getElementById('dlToastClose');
    if (cancelBtn) { cancelBtn.onclick = function () { cancel(); if (typeof onCancelCallback === 'function') onCancelCallback(); }; }
    if (closeBtn) { closeBtn.onclick = function () { hide(); }; }
  }
  return { show, startFakeProgress, complete, hide, cancel, isCancelled, bindClose };
})();

/******************************************************
 * JEM & RKM
 ******************************************************/
function showJEMStep1() {
  let flOptions = '<option value="">— Pilih Frontliner —</option>';
  for (const idFL in frontlinerIdToName) { flOptions += '<option value="' + escapeHtml(idFL) + '">' + escapeHtml(frontlinerIdToName[idFL]) + '</option>'; }
  const now      = new Date(); const thisYear = now.getFullYear(); let yearOpts   = '';
  for (let y = thisYear; y >= thisYear - 2; y--) { yearOpts += '<option value="' + y + '" ' + (y === thisYear ? 'selected' : '') + '>' + y + '</option>'; }
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  let monthOpts = '';
  BULAN.forEach((b, i) => { const val = i + 1; const sel = val === (now.getMonth() + 1) ? 'selected' : ''; monthOpts += '<option value="' + val + '" ' + sel + '>' + b + '</option>'; });

  const html = '<div style="text-align:left;">' +
      '<div class="row g-3">' +
        '<div class="col-12"><label class="fw-bold" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);">Frontliner *</label><select id="jemFl" class="form-select mt-1">' + flOptions + '</select></div>' +
        '<div class="col-6"><label class="fw-bold" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);">Bulan *</label><select id="jemMonth" class="form-select mt-1">' + monthOpts + '</select></div>' +
        '<div class="col-6"><label class="fw-bold" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);">Tahun *</label><select id="jemYear" class="form-select mt-1">' + yearOpts + '</select></div>' +
      '</div>' +
      '<p style="font-size:11px;color:var(--text-muted);margin-top:12px;"><i class="fa fa-info-circle"></i> Setelah memilih, Anda akan diminta mengisi Rayon untuk setiap tanggal yang ada kunjungannya.</p>' +
    '</div>';

  Swal.fire({
    title: '<span style="font-size:16px;font-weight:800;">Download JEM</span>', html:  html, width: 520, showCancelButton:  true, confirmButtonText: 'Lanjut →', cancelButtonText:  'Batal', confirmButtonColor: '#2563EB', focusConfirm: false,
    preConfirm: function() {
      const flId  = document.getElementById('jemFl').value; const month = parseInt(document.getElementById('jemMonth').value, 10); const year  = parseInt(document.getElementById('jemYear').value,  10);
      if (!flId)  { Swal.showValidationMessage('Pilih Frontliner terlebih dahulu!'); return false; }
      if (!month) { Swal.showValidationMessage('Pilih Bulan!');                      return false; }
      if (!year)  { Swal.showValidationMessage('Pilih Tahun!');                      return false; }
      return { flId, month, year };
    }
  }).then(function(r) { if (!r.isConfirmed || !r.value) return; showJEMStep2(r.value.flId, r.value.month, r.value.year); });
}

function showJEMStep2(flId, month, year) {
  showLoading('Memuat data kunjungan...');
  callServer('getJEMPreviewData', [year, month, flId, currentIdTeamleader, currentIsSuperuser], function(res) {
    if (!res || !res.success) { showError(res && res.message ? res.message : 'Gagal memuat data kunjungan.'); return; }
    if (!res.dailySummary || res.dailySummary.length === 0) { Swal.fire({ icon: 'info', title: 'Tidak Ada Data', text: 'Tidak ada kunjungan ' + (frontlinerIdToName[flId] || flId) + ' pada periode yang dipilih.', confirmButtonColor: '#2563EB' }); return; }

    const dmpRayon = Object.keys(res.dmpByRayon || {}).sort();
    let rayonOptions = dmpRayon.map(r => '<option value="' + escapeHtml(r) + '">' + escapeHtml(r) + ' (' + res.dmpByRayon[r] + ' outlet)</option>').join('');
    
    if (!rayonOptions) {
      const rayonSet = new Set();
      res.dailySummary.forEach(d => d.visits.forEach(v => { if (v.rayon) rayonSet.add(v.rayon); }));
      rayonOptions = Array.from(rayonSet).sort().map(r => '<option value="' + escapeHtml(r) + '">' + escapeHtml(r) + '</option>').join('');
    }

    const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const periodStr = BULAN[month - 1] + ' ' + year; const flName    = frontlinerIdToName[flId] || flId;
    let tableRows = '';
    res.dailySummary.forEach(function(d) {
      const dParts  = d.dateStr.split('-'); const tglFmt  = dParts[2] + '/' + dParts[1] + '/' + dParts[0];
      const rayonCount = {}; d.visits.forEach(v => { if (v.rayon) rayonCount[v.rayon] = (rayonCount[v.rayon]||0) + 1; });
      const dominantRayon = Object.keys(rayonCount).sort((a,b) => rayonCount[b] - rayonCount[a])[0] || '';
      const selOpts = dmpRayon.length > 0 ? dmpRayon.map(r => '<option value="' + escapeHtml(r) + '" ' + (r === dominantRayon ? 'selected' : '') + '>' + escapeHtml(r) + ' (' + res.dmpByRayon[r] + ')</option>').join('') : '<option value="' + escapeHtml(dominantRayon) + '" selected>' + escapeHtml(dominantRayon) + '</option>';
      const acakCount = d.visits.filter(v => v.rayon && v.rayon !== dominantRayon).length;
      const acakHint  = acakCount > 0 ? '<span style="color:#D97706;font-size:10px;"> (' + acakCount + ' acak)</span>' : '';

      tableRows += '<tr style="border-bottom:1px solid #e5e7eb;">' +
          '<td style="padding:6px 8px;font-weight:700;text-align:center;white-space:nowrap;width:82px;font-size:12.5px;">' + tglFmt + '</td>' +
          '<td style="padding:6px 4px;text-align:center;width:64px;"><span class="badge-custom badge-primary">' + d.total + '</span></td>' +
          '<td style="padding:6px 4px;text-align:center;width:60px;"><span class="badge-custom badge-success">' + d.activation + '</span></td>' +
          '<td style="padding:6px 8px;width:160px;"><select class="form-select form-select-sm jem-rayon-select" data-date="' + escapeHtml(d.dateStr) + '" style="font-size:12px;"><option value="">— Pilih —</option>' + selOpts + '</select></td>' +
          '<td style="padding:6px 8px;font-size:11px;color:var(--text-muted);">' + acakHint + '</td></tr>';
    });

    const html = '<div style="text-align:left;">' +
        '<div style="background:rgba(37,99,235,0.07);border:1px solid rgba(37,99,235,0.2);border-radius:10px;padding:10px 14px;margin-bottom:14px;">' +
          '<div style="font-weight:800;font-size:13px;">' + escapeHtml(flName) + '</div><div style="font-size:12px;color:var(--text-muted);">Periode: ' + escapeHtml(periodStr) + '</div>' +
        '</div>' +
        '<p style="font-size:11px;color:var(--text-muted);margin-bottom:10px;"><i class="fa fa-info-circle"></i> Pilih Rayon standar untuk setiap tanggal. Outlet yang rayonnya berbeda akan masuk kolom <b>Acak</b>.</p>' +
        '<div style="max-height:380px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:10px;">' +
          '<table style="width:100%;border-collapse:collapse;"><thead>' +
              '<tr style="background:rgba(255,255,255,0.8);border-bottom:2px solid #e5e7eb;">' +
                '<th style="padding:8px 6px;font-size:10.5px;text-transform:uppercase;color:var(--text-muted);text-align:center;white-space:nowrap;width:82px;">Tanggal</th>' +
                '<th style="padding:8px 4px;font-size:10.5px;text-transform:uppercase;color:var(--text-muted);text-align:center;white-space:nowrap;width:64px;">Total<br>Kunjungan</th>' +
                '<th style="padding:8px 4px;font-size:10.5px;text-transform:uppercase;color:var(--text-muted);text-align:center;white-space:nowrap;width:60px;">Toko<br>Buka</th>' +
                '<th style="padding:8px;font-size:10.5px;text-transform:uppercase;color:var(--text-muted);">Rayon Standar</th>' +
                '<th style="padding:8px;font-size:10.5px;color:var(--text-muted);">Ket.</th>' +
              '</tr></thead><tbody>' + tableRows + '</tbody></table></div>' +
        '<div style="margin-top:10px;padding:8px 12px;background:#fffbea;border-radius:8px;border:1px solid #fde68a;"><p style="font-size:11px;color:#92400e;margin:0;"><b>💡 Tip:</b> Rayon sudah diisi otomatis berdasarkan rayon terbanyak pada kunjungan hari itu. Periksa dan sesuaikan jika perlu.</p></div></div>';

    Swal.fire({
      title: '<span style="font-size:15px;font-weight:800;">Isi Rayon per Tanggal</span>', html:  html, width: 700, showCancelButton:  true, confirmButtonText: '<i class="fa fa-file-pdf"></i> Generate PDF', cancelButtonText:  '← Kembali', cancelButtonColor: '#6B7280', confirmButtonColor: '#DC2626', focusConfirm: false,
      preConfirm: function() {
        const selects = document.querySelectorAll('.jem-rayon-select'); const rayonPerDate = {}; let hasEmpty = false;
        selects.forEach(function(sel) { const dt = sel.dataset.date; if (!sel.value) { hasEmpty = true; } rayonPerDate[dt] = sel.value; });
        if (hasEmpty) { Swal.showValidationMessage('Semua tanggal harus diisi Rayon-nya!'); return false; }
        return rayonPerDate;
      }
    }).then(function(r) {
      if (!r.isConfirmed) { if (r.dismiss === Swal.DismissReason.cancel) { showJEMStep1(); } return; }
      executeJEMDownload(flId, month, year, r.value, flName, periodStr);
    });
  });
}

function executeJEMDownload(flId, month, year, rayonPerDate, flName, periodStr) {
  const estimatedMs = 8000;
  DownloadToast.show('pdf', 'Download JEM — ' + (flName || flId), periodStr + ' · Membangun laporan...');
  DownloadToast.startFakeProgress(estimatedMs); DownloadToast.bindClose(null);

  callServer('generateJEMPdf', [year, month, flId, currentIdTeamleader, currentIsSuperuser, rayonPerDate], function(res) {
    if (DownloadToast.isCancelled()) return;
    if (!res || !res.success) { DownloadToast.hide(); Swal.fire({ icon: 'error', title: 'Gagal Generate JEM', text: res && res.message ? res.message : 'Tidak dapat membuat PDF', confirmButtonColor: '#2563EB' }); return; }
    try {
      const byteChars = atob(res.data); const byteArr   = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: 'application/pdf' }); const url  = URL.createObjectURL(blob); const a    = document.createElement('a');
      a.href = url; a.download = res.filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      DownloadToast.complete();
    } catch(e) { DownloadToast.hide(); Swal.fire({ icon: 'error', title: 'Gagal Download', text: e.message, confirmButtonColor: '#2563EB' }); }
  });
}

/******************************************************
 * RKM (Rekap Kunjungan Merchandiser)
 ******************************************************/
function showRKMDialog() {
  let flOptions = '<option value="">— Pilih Frontliner —</option>';
  for (const idFL in frontlinerIdToName) { flOptions += '<option value="' + escapeHtml(idFL) + '">' + escapeHtml(frontlinerIdToName[idFL]) + '</option>'; }
  const now      = new Date(); const thisYear = now.getFullYear(); let yearOpts   = '';
  for (let y = thisYear; y >= thisYear - 2; y--) { yearOpts += '<option value="' + y + '" ' + (y === thisYear ? 'selected' : '') + '>' + y + '</option>'; }
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  let monthOpts = '';
  BULAN.forEach((b, i) => { const val = i + 1; const sel = val === (now.getMonth() + 1) ? 'selected' : ''; monthOpts += '<option value="' + val + '" ' + sel + '>' + b + '</option>'; });

  const html = '<div style="text-align:left;">' +
      '<div class="row g-3">' +
        '<div class="col-12"><label class="fw-bold" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);">Frontliner *</label><select id="rkmFl" class="form-select mt-1">' + flOptions + '</select></div>' +
        '<div class="col-6"><label class="fw-bold" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);">Bulan *</label><select id="rkmMonth" class="form-select mt-1">' + monthOpts + '</select></div>' +
        '<div class="col-6"><label class="fw-bold" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);">Tahun *</label><select id="rkmYear" class="form-select mt-1">' + yearOpts + '</select></div>' +
      '</div>' +
    '</div>';

  Swal.fire({
    title: '<span style="font-size:16px;font-weight:800;">Download RKM</span>', html: html, width: 520, showCancelButton: true,
    confirmButtonText: '<i class="fa fa-file-excel"></i> Generate', cancelButtonText: 'Batal', confirmButtonColor: '#2563EB', focusConfirm: false,
    preConfirm: function () {
      const flId  = document.getElementById('rkmFl').value;
      const month = parseInt(document.getElementById('rkmMonth').value, 10);
      const year  = parseInt(document.getElementById('rkmYear').value, 10);
      if (!flId)  { Swal.showValidationMessage('Pilih Frontliner terlebih dahulu!'); return false; }
      if (!month) { Swal.showValidationMessage('Pilih Bulan!'); return false; }
      if (!year)  { Swal.showValidationMessage('Pilih Tahun!'); return false; }
      return { flId, month, year };
    }
  }).then(function (r) {
    if (!r.isConfirmed || !r.value) return;
    executeRKMDownload(r.value.flId, r.value.month, r.value.year);
  });
}

function executeRKMDownload(flId, month, year) {
  const flName = frontlinerIdToName[flId] || flId;
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const periodStr = BULAN[month - 1] + ' ' + year;

  DownloadToast.show('xlsx', 'Download RKM — ' + flName, periodStr + ' · Membangun laporan...');
  DownloadToast.startFakeProgress(6000);
  DownloadToast.bindClose(null);

  callServer('getRKMData', [year, month, flId, currentIdTeamleader, currentIsSuperuser], function (res) {
    if (DownloadToast.isCancelled()) return;
    if (!res || !res.success) {
      DownloadToast.hide();
      Swal.fire({ icon: 'error', title: 'Gagal Generate RKM', text: res && res.message ? res.message : 'Tidak dapat membuat laporan', confirmButtonColor: '#2563EB' });
      return;
    }
    try {
      if (typeof XLSX === 'undefined') throw new Error('Library Excel belum siap, coba lagi.');
      const headers = res.headers || [];
      const rows    = res.data || [];
      const ws = XLSX.utils.aoa_to_sheet([headers].concat(rows));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RKM');
      const cleanedName = flName.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
      XLSX.writeFile(wb, 'RKM_' + cleanedName + '_' + periodStr.replace(/\s+/g, '_') + '.xlsx');
      DownloadToast.complete();
    } catch (e) {
      DownloadToast.hide();
      Swal.fire({ icon: 'error', title: 'Gagal Download', text: e.message, confirmButtonColor: '#2563EB' });
    }
  });
}