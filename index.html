<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Vistrack - Sistem tracking kunjungan frontliner">
  <meta name="theme-color" content="#3461FD">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Vistrack">
  <title>Vistrack</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script>
    (function () {
      try {
        var t = localStorage.getItem('vistrack_theme') || 'light';
        document.documentElement.setAttribute('data-theme', t);
      } catch (e) {}
    })();
  </script>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<div class="dl-toast" id="dlToast">
  <div class="dl-toast-header">
    <div class="dl-toast-icon" id="dlToastIcon">
      <i id="dlToastIconInner" class="fa fa-file-pdf"></i>
    </div>
    <div class="dl-toast-title" id="dlToastTitle">Download PDF</div>
    <button type="button" class="dl-toast-close" id="dlToastClose">
      <i class="fa fa-times"></i>
    </button>
  </div>
  <div class="dl-toast-desc" id="dlToastDesc">Memproses file...</div>
  <div class="dl-toast-track">
    <div class="dl-toast-fill" id="dlToastFill"></div>
  </div>
  <div class="dl-toast-footer">
    <span class="dl-toast-pct" id="dlToastPct">0% selesai</span>
    <button type="button" class="dl-toast-cancel" id="dlToastCancel">Batalkan</button>
    <span class="dl-toast-done-badge" id="dlToastDone">
      <i class="fa fa-check-circle"></i> Selesai
    </span>
  </div>
</div>

<div id="loginPage">
  <div class="login-wrapper">
    <div class="login-logo"><i class="fa fa-route"></i></div>
    <div class="login-card">
      <button type="button" class="theme-toggle-btn" id="themeToggleLogin" style="position:absolute;top:16px;right:16px;" aria-label="Ganti tema">
        <i class="fa fa-moon"></i>
      </button>
      <h2>Vistrack</h2>
      <p>Sistem Tracking Kunjungan Frontliner</p>
      <form id="loginForm" autocomplete="on">
        <label for="emailInput" class="visually-hidden">Email</label>
        <input id="emailInput" type="email" class="login-input" placeholder="Masukkan email terdaftar" autocomplete="email" required>

        <div style="position:relative;">
          <input id="passwordInput" type="password" class="login-input"
            placeholder="Masukkan password" autocomplete="current-password"
            required style="padding-right:44px;">
          <button type="button" id="togglePassword"
            style="position:absolute;right:12px;top:16px;
            background:none;border:none;color:var(--text-3);cursor:pointer;
            font-size:14px;padding:0;">
            <i class="fa fa-eye"></i>
          </button>
        </div>

        <button type="submit" class="login-btn"><i class="fa fa-sign-in-alt"></i> Masuk</button>
      </form>
    </div>
  </div>
</div>

<div id="mainApp" class="hidden">
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-icon"><i class="fa fa-route"></i></div>
      <div>
        <div class="sidebar-title">Vistrack</div>
        <div class="sidebar-subtitle">Dashboard</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-group-label">Menu Utama</div>
      <button type="button" class="nav-item active" data-action="switch-page" data-page="home"><span class="nav-icon"><i class="fa fa-house"></i></span>Dashboard</button>
      <button type="button" class="nav-item" data-action="switch-page" data-page="frontliner"><span class="nav-icon"><i class="fa fa-users"></i></span>Frontliner</button>
      <button type="button" class="nav-item hidden" id="navTeamleader" data-action="switch-page" data-page="teamleader"><span class="nav-icon"><i class="fa fa-user-tie"></i></span>Teamleader</button>
      <button type="button" class="nav-item" data-action="switch-page" data-page="visit"><span class="nav-icon"><i class="fa fa-clipboard-list"></i></span>Data Visit</button>
      <button type="button" class="nav-item" data-action="switch-page" data-page="verif"><span class="nav-icon"><i class="fa fa-circle-check"></i></span>Verifikasi</button>
      <button type="button" class="nav-item" data-action="switch-page" data-page="dmp"><span class="nav-icon"><i class="fa fa-map-location-dot"></i></span>Master DMP</button>
    </nav>
    <div class="sidebar-footer">
      <button type="button" class="theme-toggle-btn" id="themeToggleSidebar" style="width:100%;border-radius:14px;gap:8px;font-size:12px;font-weight:700;" aria-label="Ganti tema">
        <i class="fa fa-moon"></i><span id="themeToggleLabel">Mode Gelap</span>
      </button>
      <div class="user-info-box" data-action="logout" title="Keluar">
        <div class="user-avatar" id="userAvatar">U</div>
        <div style="flex:1;min-width:0;">
          <div class="user-name" id="userName">User</div>
          <div class="user-role"><i class="fa fa-right-from-bracket"></i> Keluar</div>
        </div>
      </div>
      <div style="font-size:10px;color:var(--text-3);text-align:center;margin-top:2px;font-weight:600;" id="userInfoDesktop"></div>
    </div>
  </aside>

  <div class="mobile-topbar">
    <div class="app-brand">
      <div class="sidebar-icon" style="width:32px;height:32px;font-size:13px;margin-right:10px;"><i class="fa fa-route"></i></div>
      <span id="userNameMobile">User</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <button type="button" class="icon-btn" id="themeToggleMobile" aria-label="Ganti tema"><i class="fa fa-moon"></i></button>
      <button type="button" class="icon-btn logout" data-action="logout" aria-label="Keluar"><i class="fa fa-right-from-bracket"></i></button>
    </div>
  </div>

  <div class="content-wrapper">
    <header class="top-bar"><h1 class="top-bar-title" id="pageTitle">Dashboard</h1></header>
    <main class="main-content">

      <section id="page-home" class="page-content">
        <div class="filter-bar mb-3">
          <div class="row g-2 align-items-end">
            <div class="col-6 col-md-3"><label for="filterFrontlinerHome">Frontliner</label><select id="filterFrontlinerHome" class="form-select"></select></div>
            <div class="col-6 col-md-3"><label for="filterDateHome">Tanggal</label><input id="filterDateHome" type="date" class="form-control"></div>
            <div class="col-auto"><button type="button" class="btn-primary-custom" data-action="load-home" title="Cari Data" style="width:38px;padding:0;flex-shrink:0;"><i class="fa fa-search"></i></button></div>
          </div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-lg-7">
            <div class="card card-hover p-3 mb-3">
              <div class="section-title">Distribusi Planogram</div>
              <p class="section-subtitle" id="pieChartLabel">Total 0 kunjungan bulan ini</p>
              <div class="donut-wrapper mt-3">
                <svg width="150" height="150" viewBox="0 0 140 140" style="flex-shrink:0;">
                  <circle cx="70" cy="70" r="54" fill="none" stroke="#F3F4F6" stroke-width="16"/>
                  <circle id="donutNonPlano" cx="70" cy="70" r="54" fill="none" stroke="#DC2626" stroke-width="16" stroke-linecap="round" transform="rotate(-90 70 70)" stroke-dasharray="339.29" stroke-dashoffset="339.29" style="transition:stroke-dashoffset 0.8s;"/>
                  <circle id="donutPlano" cx="70" cy="70" r="54" fill="none" stroke="#16A34A" stroke-width="16" stroke-linecap="round" transform="rotate(-90 70 70)" stroke-dasharray="339.29" stroke-dashoffset="339.29" style="transition:stroke-dashoffset 0.8s;"/>
                  <text id="donutPct" x="70" y="74" text-anchor="middle" style="font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:800;fill:var(--text-1);">0%</text>
                  <text x="70" y="91" text-anchor="middle" style="font-family:'Plus Jakarta Sans',sans-serif;font-size:8px;font-weight:600;fill:var(--text-2);">planogram</text>
                </svg>
                <div style="flex:1;min-width:140px;">
                  <div class="donut-legend-item"><span class="legend-dot g" style="background:#16A34A;"></span><span>Planogram</span><b style="margin-left:auto;font-size:16px;color:var(--text-1);" id="piePlanoCount">0</b></div>
                  <div class="donut-legend-item"><span class="legend-dot r" style="background:#DC2626;"></span><span>Non Planogram</span><b style="margin-left:auto;font-size:16px;color:var(--text-1);" id="pieNonPlanoCount">0</b></div>
                </div>
              </div>
            </div>
            <div class="card card-hover p-3" data-action="show-verif-detail" style="cursor:pointer;">
              <div class="d-flex justify-content-between align-items-start">
                <div><div class="section-title">Status Verifikasi</div><p class="section-subtitle">Bulan ini · Detail</p></div>
                <span class="badge-pill-accent">Detail <i class="fa fa-arrow-right" style="font-size:9px;"></i></span>
              </div>
              <div class="row g-2 mt-3 mb-2">
                <div class="col-4 text-center"><div style="font-size:22px;font-weight:800;color:var(--text-1);" id="vsTotal">0</div><div style="font-size:11px;color:var(--text-2);font-weight:600;">Total</div></div>
                <div class="col-4 text-center"><div style="font-size:22px;font-weight:800;color:var(--c-green-fg);" id="vsVerified">0</div><div style="font-size:11px;color:var(--text-2);font-weight:600;">Verifikasi</div></div>
                <div class="col-4 text-center"><div style="font-size:22px;font-weight:800;color:var(--c-amber-fg);" id="vsUnverified">0</div><div style="font-size:11px;color:var(--text-2);font-weight:600;">Belum</div></div>
              </div>
              <div class="progress-track"><div class="progress-fill" id="vsProgressBar" style="width:0%;"></div></div>
              <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-top:6px;text-align:right;" id="vsProgressLabel">0% terverifikasi</div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="row g-2">
              <div class="col-6">
                <div class="stat-card mb-2"><div class="stat-icon" style="background:var(--c-blue-bg);color:var(--c-blue-fg);"><i class="fa fa-calendar-days"></i></div><div class="stat-value" id="vKunjMonth">0</div><div class="stat-label">Kunjungan Bulan Ini</div></div>
                <div class="stat-card sub-card mb-2"><div class="stat-icon" style="background:var(--c-teal-bg);color:var(--c-teal-fg);"><i class="fa fa-store"></i></div><div class="stat-value" id="vKunjToday">0</div><div class="stat-label">Kunjungan Hari Ini</div></div>
                <div class="stat-card sub-card danger-emphasis"><div class="stat-icon" style="background:var(--c-red-bg);color:var(--c-red-fg);"><i class="fa fa-door-closed"></i></div><div class="stat-value" id="vClosedToday">0</div><div class="stat-label">Tutup Hari Ini</div></div>
              </div>
              <div class="col-6">
                <div class="stat-card mb-2"><div class="stat-icon" style="background:var(--c-green-bg);color:var(--c-green-fg);"><i class="fa fa-medal"></i></div><div class="stat-value" id="vPlanoMonth">0</div><div class="stat-label">Planogram Bulan Ini</div></div>
                <div class="stat-card sub-card mb-2"><div class="stat-icon" style="background:var(--c-violet-bg);color:var(--c-violet-fg);"><i class="fa fa-star"></i></div><div class="stat-value" id="vPlanoToday">0</div><div class="stat-label">Planogram Hari Ini</div></div>
                <div class="stat-card sub-card"><div class="stat-icon" style="background:var(--c-amber-bg);color:var(--c-amber-fg);"><i class="fa fa-chart-bar"></i></div><div class="stat-value" id="vNonPlanoToday">0</div><div class="stat-label">Non Planogram Hari Ini</div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="table-wrapper">
          <div style="padding:16px 18px;border-bottom:1px solid var(--divider);">
            <div class="section-title">Detail Kunjungan</div><p class="section-subtitle" id="homeDateLabel">-</p>
          </div>
          <div style="overflow-x:auto;">
            <table class="custom-table">
              <thead><tr><th>Outlet</th><th>Rayon</th><th>Alamat</th><th>Check-in</th><th>Check-out</th><th>Durasi</th><th>Status Toko</th><th>Planogram</th></tr></thead>
              <tbody id="homeDetailBody"><tr><td colspan="8"><div class="empty-state"><i class="fa fa-inbox"></i><p>Klik "Cari Data" untuk memuat kunjungan</p></div></td></tr></tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="page-frontliner" class="page-content hidden">
        <div class="filter-bar mb-3">
          <div class="d-flex flex-wrap align-items-end gap-2">
            <div style="flex:1 1 260px;min-width:200px;">
              <label for="flSearch">Cari Frontliner</label>
              <input id="flSearch" type="text" class="form-control" placeholder="Ketik nama, ID, atau email...">
            </div>
            <div class="stat-chip">
              <span class="stat-chip-num" id="flStatTotal">0</span><span class="stat-chip-lbl">Total Frontliner</span>
            </div>
            <div class="ms-auto">
              <button type="button" class="btn-success-custom" data-action="add-frontliner" style="padding:0 16px;">
                <i class="fa fa-plus"></i> Tambah
              </button>
            </div>
          </div>
        </div>
        <div class="row g-3" id="frontlinerCards">
          <div class="col-12"><div class="empty-state"><i class="fa fa-users"></i><p>Memuat data frontliner...</p></div></div>
        </div>
      </section>

      <section id="page-teamleader" class="page-content hidden">
        <div class="filter-bar mb-3">
          <div class="d-flex flex-wrap align-items-end gap-2">
            <div style="flex:1 1 260px;min-width:200px;">
              <label for="tlSearch">Cari Teamleader</label>
              <input id="tlSearch" type="text" class="form-control" placeholder="Ketik nama, ID, atau email...">
            </div>
            <div class="stat-chip">
              <span class="stat-chip-num" id="tlStatTotal">0</span><span class="stat-chip-lbl">Total Teamleader</span>
            </div>
            <div class="ms-auto">
              <button type="button" class="btn-success-custom" data-action="add-teamleader" style="padding:0 16px;">
                <i class="fa fa-plus"></i> Tambah
              </button>
            </div>
          </div>
        </div>
        <div class="row g-3" id="teamleaderCards">
          <div class="col-12"><div class="empty-state"><i class="fa fa-user-tie"></i><p>Memuat data teamleader...</p></div></div>
        </div>
      </section>

      <section id="page-visit" class="page-content hidden">
        <div class="filter-bar mb-3">
          <div class="row g-2 align-items-end">
            <div class="col-6 col-md-2"><label for="vsStart">Tanggal Mulai</label><input id="vsStart" type="date" class="form-control"></div>
            <div class="col-6 col-md-2"><label for="vsEnd">Tanggal Akhir</label><input id="vsEnd" type="date" class="form-control"></div>
            <div class="col-md-2"><label for="vsFl">Frontliner</label><select id="vsFl" class="form-select"></select></div>
            <div class="col-auto"><button type="button" class="btn-primary-custom" data-action="load-visit" title="Cari" style="width:38px;padding:0;flex-shrink:0;"><i class="fa fa-search"></i></button></div>
            <div class="col-md-auto ms-md-auto d-flex gap-2 flex-wrap">
            <button type="button" id="btnDownCSV" class="btn-success-custom hidden" data-action="download-excel"><i class="fa fa-file-excel"></i></button>
            <button type="button" id="btnDownPDF" class="btn-danger-custom hidden" data-action="download-pdf" style="width:auto;"><i class="fa fa-file-pdf"></i></button>
            <button type="button" id="btnDownJEM" class="btn-primary-custom" data-action="download-jem"
    style="background:var(--c-violet-fg);box-shadow:0 8px 18px rgba(139,92,246,.28);white-space:nowrap;flex-shrink:0;"
    title="Download Jam Efektifitas Merchandiser">
    <i class="fa fa-clock"></i> JEM
  </button>
  <button type="button" id="btnDownRKM" class="btn-success-custom" data-action="download-rkm"
  style="background:var(--c-teal-fg);box-shadow:0 8px 18px rgba(13,148,136,.28);white-space:nowrap;flex-shrink:0;"
  title="Download Raport Kinerja Merchandiser">
  <i class="fa fa-chart-line"></i> RAPORT
</button>
</div>
          </div>
        </div>
        <div class="table-wrapper" style="overflow:auto;max-height:70vh;"><table class="custom-table"><thead id="tvHead"></thead><tbody id="tvBody"><tr><td><div class="empty-state"><i class="fa fa-search"></i><p>Pilih filter dan klik "Cari"</p></div></td></tr></tbody></table></div>
      </section>

      <section id="page-verif" class="page-content hidden">
        <div class="filter-bar mb-3">
          <div class="row g-2 align-items-end">
            <div class="col-6 col-md-2"><label for="vfDate">Tanggal</label><input id="vfDate" type="date" class="form-control"></div>
            <div class="col-6 col-md-2"><label for="vfFl">Frontliner</label><select id="vfFl" class="form-select"></select></div>
            <div class="col-6 col-md-2"><label for="vfRy">Rayon</label><select id="vfRy" class="form-select"></select></div>
            <div class="col-auto"><button type="button" class="btn-primary-custom" data-action="load-verif" title="Cari Data" style="width:38px;padding:0;flex-shrink:0;"><i class="fa fa-search"></i></button></div>
            <div class="col-md-auto ms-md-auto">
              <label class="d-none d-md-block" style="visibility:hidden;">_</label>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <div class="stat-chip clickable active" id="filterAll" data-action="filter-verif-status" data-status="all" title="Tampilkan semua">
                  <span class="stat-chip-num" id="vStatTot">0</span><span class="stat-chip-lbl">Total</span>
                </div>
                <div class="stat-chip clickable" id="filterDone" data-action="filter-verif-status" data-status="done" title="Filter sudah verifikasi">
                  <span class="stat-chip-num" id="vStatDone" style="color:var(--c-green-fg);">0</span><span class="stat-chip-lbl">Verifikasi</span>
                </div>
                <div class="stat-chip clickable" id="filterWait" data-action="filter-verif-status" data-status="wait" title="Filter belum verifikasi">
                  <span class="stat-chip-num" id="vStatWait" style="color:var(--c-amber-fg);">0</span><span class="stat-chip-lbl">Belum</span>
                </div>
              </div>
            </div>
          </div>
          <div class="row g-2 mt-2"><div class="col-12"><label for="vfSearch">Cari Outlet</label><input id="vfSearch" type="text" class="form-control" placeholder="Ketik nama atau ID outlet..."></div></div>
        </div>
        <div class="row g-3 mt-1" id="verifCards"><div class="col-12"><div class="empty-state"><i class="fa fa-folder-open"></i><p>Pilih filter dan klik "Cari Data"</p></div></div></div>
      </section>

      <section id="page-dmp" class="page-content hidden">
        <div class="filter-bar mb-3">
          <div class="row g-2 align-items-end">
            <div class="col-md-2">
              <label for="dmpFl">Frontliner</label>
              <select id="dmpFl" class="form-select"></select>
            </div>
            <div class="col-md-2">
              <label for="dmpRy">Rayon</label>
              <select id="dmpRy" class="form-select"></select>
            </div>
            <div class="col-md-8">
              <label class="d-none d-md-block" style="visibility:hidden;">_</label>
              <div class="d-flex gap-2">
                <button type="button" class="btn-primary-custom" data-action="load-dmp" style="flex:1 1 0;">
                  <i class="fa fa-filter"></i> Tampilkan Peta
                </button>
                <button type="button" class="btn-success-custom" data-action="add-dmp" style="flex:1 1 0;">
                  <i class="fa fa-plus"></i> Tambah Outlet Baru
                </button>
                <button type="button" class="btn-primary-custom" data-bs-toggle="modal" data-bs-target="#modalUploadDmp" style="flex:1 1 0;">
                  <i class="fa fa-upload"></i> Upload DMP
                </button>
                <button type="button" class="btn-success-custom" data-action="download-dmp-data" style="flex:1 1 0;">
                  <i class="fa fa-download"></i> Download DMP
                </button>
                <div class="hidden" id="btnSpreadsheetWrapper" style="flex:1 1 0;">
                  <a href="https://docs.google.com/spreadsheets/d/1fgLJK-UCXyFCQCA6eqbAWun-NXUOfHR66E29bohypJE/edit"
                    target="_blank" rel="noopener noreferrer"
                    class="btn-primary-custom w-100"
                    style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;">
                    <i class="fa fa-table"></i> Buka Spreadsheet
                  </a>
                </div>
                <button type="button" class="btn-success-custom" data-action="refresh-master"
                  title="Refresh Data" style="flex-shrink:0;padding:0 16px;">
                  <i class="fa fa-rotate"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="row g-2 mt-2">
            <div class="col-12">
              <label for="dmpSearch">Cari Outlet</label>
              <input id="dmpSearch" type="text" class="form-control" placeholder="Ketik nama atau ID outlet...">
            </div>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-8"><div class="card p-2"><div id="mapDMP"></div></div></div>
          <div class="col-md-4"><div class="card" style="height:540px;display:flex;flex-direction:column;"><div style="padding:14px 16px;border-bottom:1px solid var(--divider);"><div class="section-title">Daftar Outlet</div><p class="section-subtitle" id="dmpCount">Belum ada data</p></div><div id="dmpList" style="flex:1;overflow-y:auto;"><div class="empty-state"><i class="fa fa-map"></i><p>Pilih filter dan klik "Tampilkan Peta"</p></div></div></div></div>
        </div>
      </section>

    </main>
  </div>
</div>

<div class="modal fade" id="modalVerif" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <div style="flex:1;min-width:0;">
          <h5 class="modal-title" id="mOutletName" style="font-weight:800;margin-bottom:4px;">-</h5>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span class="outlet-id-badge"><i class="fa fa-tag" style="font-size:9px;"></i>&nbsp;<span id="mOutletIdValue">-</span></span><span style="font-size:12px;color:var(--text-2);font-weight:600;" id="mOutletSub">-</span></div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="vRowIdx"><input type="hidden" id="vIdResp">
        <div class="row g-3">
          <div class="col-md-8">
            <div class="row g-2">
              <div class="col-6"><div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px;">CHECK-IN</div><div class="img-preview-wrapper"><img class="img-preview loading" data-img-slot="1" data-img-label="Check-in"></div></div>
              <div class="col-6"><div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px;">CHECK-OUT</div><div class="img-preview-wrapper"><img class="img-preview loading" data-img-slot="2" data-img-label="Check-out"></div></div>
              <div class="col-6"><div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px;">DISPLAY UTAMA</div><div class="img-preview-wrapper"><img class="img-preview loading" data-img-slot="3" data-img-label="Display Utama"></div></div>
              <div class="col-6"><div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px;">DISPLAY TAMBAHAN</div><div class="img-preview-wrapper"><img class="img-preview loading" data-img-slot="4" data-img-label="Display Tambahan"></div></div>
              <div class="col-12"><div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px;">POSM</div><div class="img-preview-wrapper"><img class="img-preview loading" data-img-slot="5" data-img-label="POSM" style="aspect-ratio:16/6;"></div></div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mb-3">
              <label for="vPlano" style="font-size:11px;font-weight:700;color:var(--text-2);text-transform:uppercase;margin-bottom:4px;">Status Planogram</label>
              <select id="vPlano" class="form-select"><option value="Planogram">Planogram</option><option value="Tidak Planogram">Tidak Planogram</option></select>
            </div>
            <div class="mb-3">
              <label for="vStatusToko" class="fw-bold" style="font-size:12px;">Status Toko</label>
              <select id="vStatusToko" class="form-select form-select-sm">
                <option value="Buka">Buka</option>
                <option value="Tutup">Tutup</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="vStatusCheckout" class="fw-bold" style="font-size:12px;">Status Checkout</label>
              <select id="vStatusCheckout" class="form-select form-select-sm">
                <option value="">-- Pilih Status --</option>
                <option value="Di Tempat">Di Tempat</option>
                <option value="Tidak di Tempat">Tidak di Tempat</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="vAddDisp" style="font-size:11px;font-weight:700;color:var(--text-2);text-transform:uppercase;margin-bottom:4px;">Additional Display</label>
              <select id="vAddDisp" class="form-select"><option value="Sesuai">Sesuai</option><option value="Tidak Sesuai">Tidak Sesuai</option></select>
            </div>
            <div class="mb-3">
              <label for="vCheck" style="font-size:11px;font-weight:700;color:var(--text-2);text-transform:uppercase;margin-bottom:4px;">Catatan Verifikator</label>
              <textarea id="vCheck" class="form-control" rows="3" placeholder="Tambahkan catatan..."></textarea>
            </div>
            <button type="button" class="btn-primary-custom w-100 mb-2" data-action="save-verif"><i class="fa fa-check"></i> Simpan Verifikasi</button>
            <button type="button" class="btn-danger-custom" data-action="delete-visit"><i class="fa fa-trash"></i> Hapus Kunjungan</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="modalUploadDmp" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" style="font-weight:800;">Upload File DMP</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--text-2);margin-bottom:16px;">
          Unggah file DMP format <b>.xlsx</b>. Pastikan urutan kolom sesuai template berikut:<br>
          <span style="font-size:11px;color:var(--accent);font-weight:600;">ID Frontliner · ID Teamleader · Outlet ID · Area · Outlet Name · Outlet Address · Province · City · District · Type Outlet · Type Display · Rayon · Latlong</span>
        </p>
        <input type="file" id="dmpFileInput" accept=".xlsx" class="form-control mb-3">
        <button type="button" class="btn-success-custom w-100 mb-2" data-action="download-dmp-template"><i class="fa fa-file-excel"></i> Download Template Excel</button>
        <button type="button" class="btn-primary-custom w-100 mb-2" id="validateDmpFile" data-action="validate-dmp">
          <i class="fa fa-check-circle"></i> Validasi File
        </button>
        <div id="dmpValidationResult" class="mt-2 mb-2" style="font-size:13px;font-weight:600;"></div>
        <button type="button" class="btn-success-custom w-100 hidden" id="uploadDmpFile" data-action="upload-dmp">
          <i class="fa fa-upload"></i> Upload &amp; Simpan
        </button>
      </div>
    </div>
  </div>
</div>

<div class="lightbox-overlay" id="lightbox">
  <button type="button" class="lightbox-close" id="lightboxClose"><i class="fa fa-times"></i></button>
  <div class="lightbox-caption"><span id="lightboxLabel">Foto</span><span class="photo-counter" id="lightboxCounter">1/5</span></div>
  <button type="button" class="lightbox-nav lightbox-prev" id="lightboxPrev"><i class="fa fa-chevron-left"></i></button>
  <div class="lightbox-content"><div class="lightbox-img-container" id="lightboxImgContainer"><img class="lightbox-img" id="lightboxImg" alt="" draggable="false"></div></div>
  <button type="button" class="lightbox-nav lightbox-next" id="lightboxNext"><i class="fa fa-chevron-right"></i></button>
  <div class="lightbox-toolbar">
    <button type="button" class="lightbox-tool-btn" id="lightboxZoomOut"><i class="fa fa-search-minus"></i></button>
    <span class="lightbox-zoom-level" id="lightboxZoomLevel">100%</span>
    <button type="button" class="lightbox-tool-btn" id="lightboxZoomIn"><i class="fa fa-search-plus"></i></button>
    <div class="lightbox-toolbar-divider"></div>
    <button type="button" class="lightbox-tool-btn" id="lightboxReset"><i class="fa fa-undo"></i></button>
    <button type="button" class="lightbox-tool-btn" id="lightboxDownload"><i class="fa fa-download"></i></button>
  </div>
</div>

<nav class="bottom-nav">
  <button type="button" class="bottom-nav-item active" data-action="switch-page" data-page="home"><span class="nav-dot"></span><i class="fa fa-house"></i><span>Home</span></button>
  <button type="button" class="bottom-nav-item" data-action="switch-page" data-page="frontliner"><span class="nav-dot"></span><i class="fa fa-users"></i><span>FL</span></button>
  <button type="button" class="bottom-nav-item hidden" id="bottomNavTeamleader" data-action="switch-page" data-page="teamleader"><span class="nav-dot"></span><i class="fa fa-user-tie"></i><span>TL</span></button>
  <button type="button" class="bottom-nav-item" data-action="switch-page" data-page="visit"><span class="nav-dot"></span><i class="fa fa-clipboard-list"></i><span>Visit</span></button>
  <button type="button" class="bottom-nav-item" data-action="switch-page" data-page="verif"><span class="nav-dot"></span><i class="fa fa-circle-check"></i><span>Verif</span></button>
  <button type="button" class="bottom-nav-item" data-action="switch-page" data-page="dmp"><span class="nav-dot"></span><i class="fa fa-map-location-dot"></i><span>DMP</span></button>
</nav>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.10.5/dist/sweetalert2.all.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="script.js"></script>
</body>
</html>
