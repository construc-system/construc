// modul-fondasi.js - Dengan validasi input lengkap
if (typeof window.modules === 'undefined') {
    window.modules = {};
}

// Tambahkan variabel untuk menyimpan mode tanah
if (typeof window.tanahMode === 'undefined') {
    window.tanahMode = {};
}

/* ========= MODUL FONDASI ========= */
window.modules.fondasi = {
  name: 'Fondasi',
  fields: {
    desain: [
      {label:"D", key:"d", placeholder:"Kedalaman", unit:"m"},
      {label:"B", key:"b", placeholder:"Lebar Fondasi", unit:"m"},
      {label:"σ", key:"sigma", placeholder:"Kapasitas Dukung", unit:"kN/m²"}
    ],
    evaluasi: [
      {label:"qc", key:"qc", placeholder:"qc", unit:"kN/m²"},
      {label:"γ", key:"gamma", placeholder:"Berat Jenis", unit:"kN/m³"},
      {label:"ɣc", key:"gamma_c", placeholder:"Berat Jenis Tanah", unit:"kN/m³"}
    ]
  },

  // ==================== VALIDASI INPUT ====================
  validateFondasiInput: function(data) {
      const errors = [];
      const warnings = [];

      const parseNum = (val) => {
          if (val === undefined || val === null || val === '') return null;
          if (typeof val === 'string') val = val.replace(',', '.');
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
      };

      const checkNumber = (val, fieldName) => {
          const num = parseNum(val);
          if (num === null) {
              errors.push(`${fieldName} harus diisi dengan angka (gunakan titik untuk desimal).`);
              return null;
          }
          return num;
      };

      // 1. Material
      const fc = checkNumber(data.material.fc, "f'c");
      if (fc !== null && fc <= 0) errors.push(`f'<sub>c</sub> harus lebih besar dari 0.`);
      const fy = checkNumber(data.material.fy, "fy");
      if (fy !== null && fy <= 0) errors.push(`f<sub>y</sub> harus lebih besar dari 0.`);
      const gammaC = checkNumber(data.material.gammaC, "ɣc");
      if (gammaC !== null && gammaC <= 0) errors.push(`ɣ<sub>c</sub> harus lebih besar dari 0.`);

      // 2. Dimensi - bergantung pada mode fondasi
      const fondasiMode = data.fondasi?.mode || 'tunggal';
      const isAutoDimensi = data.fondasi?.autoDimensi || false;
      const dimensi = data.fondasi?.dimensi || {};

      // Validasi bx dan by (mutlak)
      const bx = parseNum(dimensi.bx);
      const by = parseNum(dimensi.by);
      if (bx !== null && bx < 150) {
          errors.push(`Lebar penampang (b<sub>x</sub>) minimum adalah 150 mm (saat ini ${bx} mm).`);
      }
      if (by !== null && by < 150) {
          errors.push(`Panjang penampang (b<sub>y</sub>) minimum adalah 150 mm (saat ini ${by} mm).`);
      }

      if (fondasiMode === 'tunggal' || fondasiMode === 'bujur_sangkar' || fondasiMode === 'persegi_panjang') {
          // Tunggal
          const Lx = parseNum(dimensi.lx);
          const Ly = parseNum(dimensi.ly);
          const H = parseNum(dimensi.h);

          if (!isAutoDimensi) {
              // Lx, Ly, H wajib diisi manual
              if (Lx === null) errors.push(`Lebar fondasi (L<sub>x</sub>) harus diisi dengan angka.`);
              else if (Lx <= 0) errors.push(`Lebar fondasi (L<sub>x</sub>) harus lebih besar dari 0.`);
              
              if (Ly === null) errors.push(`Panjang fondasi (L<sub>y</sub>) harus diisi dengan angka.`);
              else if (Ly <= 0) errors.push(`Panjang fondasi (L<sub>y</sub>) harus lebih besar dari 0.`);
              
              if (H === null) errors.push(`Tebal fondasi (h) harus diisi dengan angka.`);
              else if (H <= 0) errors.push(`Tebal fondasi (h) harus lebih besar dari 0.`);
          }

          if (Lx !== null && Ly !== null && Lx > 0 && Ly > 0) {
              if (Lx > Ly) {
                  errors.push(`Lebar fondasi (L<sub>x</sub> = ${Lx} m) tidak boleh lebih besar dari panjang fondasi (L<sub>y</sub> = ${Ly} m).`);
              }
          }

          // Validasi bx ≤ Lx (dalam mm) dan by ≤ Ly
          if (bx !== null && Lx !== null && bx > 0 && Lx > 0) {
              if (bx / 1000 > Lx) {
                  errors.push(`Lebar penampang (b<sub>x</sub> = ${bx} mm) tidak boleh lebih besar dari lebar fondasi (L<sub>x</sub> = ${Lx} m).`);
              }
          }
          if (by !== null && Ly !== null && by > 0 && Ly > 0) {
              if (by / 1000 > Ly) {
                  errors.push(`Panjang penampang (b<sub>y</sub> = ${by} mm) tidak boleh lebih besar dari panjang fondasi (L<sub>y</sub> = ${Ly} m).`);
              }
          }

          // Peringatan untuk dimensi tunggal
          if (Lx !== null && (Lx < 0.6 || Lx > 5.0)) {
              warnings.push(`Lebar fondasi (L<sub>x</sub>) sebesar ${Lx} m tidak wajar, dimensi yang umum digunakan antara 0.6–5.0 m.`);
          }
          if (Ly !== null && (Ly < 0.6 || Ly > 5.0)) {
              warnings.push(`Panjang fondasi (L<sub>y</sub>) sebesar ${Ly} m tidak wajar, dimensi yang umum digunakan antara 0.6–5.0 m.`);
          }
          if (H !== null && (H < 0.25 || H > 1.20)) {
              warnings.push(`Tebal fondasi (h) sebesar ${H} m tidak wajar, dimensi yang umum digunakan antara 0.25–1.20 m.`);
          }

      } else if (fondasiMode === 'menerus') {
          // Menerus
          const Lx = parseNum(dimensi.lx);
          const Ly = parseNum(dimensi.ly);
          const H = parseNum(dimensi.h);

          if (!isAutoDimensi) {
              if (Lx === null) errors.push(`Lebar fondasi (L<sub>x</sub>) harus diisi dengan angka.`);
              else if (Lx <= 0) errors.push(`Lebar fondasi (L<sub>x</sub>) harus lebih besar dari 0.`);
              if (Ly === null) errors.push(`Panjang fondasi (L<sub>y</sub>) harus diisi dengan angka.`);
              else if (Ly <= 0) errors.push(`Panjang fondasi (L<sub>y</sub>) harus lebih besar dari 0.`);
              if (H === null) errors.push(`Tebal fondasi (h) harus diisi dengan angka.`);
              else if (H <= 0) errors.push(`Tebal fondasi (h) harus lebih besar dari 0.`);
          }

          // Peringatan untuk dimensi menerus
          if (Lx !== null && (Lx < 0.4 || Lx > 3.0)) {
              warnings.push(`Lebar fondasi (L<sub>x</sub>) sebesar ${Lx} m tidak wajar, dimensi yang umum digunakan antara 0.4–3.0 m.`);
          }
          if (Ly !== null && (Ly < 0.6 || Ly > 50)) {
              warnings.push(`Panjang fondasi (L<sub>y</sub>) sebesar ${Ly} m tidak wajar, dimensi yang umum digunakan antara 0.6–50 m.`);
          }
          if (H !== null && (H < 0.20 || H > 0.80)) {
              warnings.push(`Tebal fondasi (h) sebesar ${H} m tidak wajar, dimensi yang umum digunakan antara 0.20–0.80 m.`);
          }

          if (Lx !== null && Ly !== null && Lx > 0 && Ly > 0) {
              if (Lx > Ly) {
                  errors.push(`Lebar fondasi (L<sub>x</sub> = ${Lx} m) tidak boleh lebih besar dari panjang fondasi (L<sub>y</sub> = ${Ly} m).`);
              }
          }

          // bx ≤ Lx dan by ≤ Ly untuk menerus
          if (bx !== null && Lx !== null && bx > 0 && Lx > 0) {
              if (bx / 1000 > Lx) {
                  errors.push(`Lebar penampang (b<sub>x</sub> = ${bx} mm) tidak boleh lebih besar dari lebar fondasi (L<sub>x</sub> = ${Lx} m).`);
              }
          }
          if (by !== null && Ly !== null && by > 0 && Ly > 0) {
              if (by / 1000 > Ly) {
                  errors.push(`Panjang penampang (b<sub>y</sub> = ${by} mm) tidak boleh lebih besar dari panjang fondasi (L<sub>y</sub> = ${Ly} m).`);
              }
          }
      }

      // αs range 20-400
      const alpha_s = parseNum(dimensi.alpha_s);
      if (alpha_s !== null && (alpha_s < 20 || alpha_s > 400)) {
          warnings.push(`Faktor posisi kolom (α<sub>s</sub>) sebesar ${alpha_s} tidak wajar, nilai yang umum digunakan antara 20–400.`);
      }

      // 3. Data Tanah
      const tanahMode = data.tanah?.mode || 'auto';
      const tanahAuto = data.tanah?.auto || {};
      const tanahManual = data.tanah?.manual || {};

      if (tanahMode === 'auto') {
          const df = parseNum(tanahAuto.df);
          const gamma = parseNum(tanahAuto.gamma);
          const phi = parseNum(tanahAuto.phi);
          const c = parseNum(tanahAuto.c);
          const qc = parseNum(tanahAuto.qc);

          if (df === null) errors.push(`Kedalaman fondasi (D<sub>f</sub>) harus diisi dengan angka.`);
          else if (df < 0) errors.push(`Kedalaman fondasi (D<sub>f</sub>) tidak boleh negatif.`);
          
          if (gamma === null) errors.push(`Berat jenis tanah (ɣ) harus diisi dengan angka.`);
          else if (gamma < 0) errors.push(`Berat jenis tanah (ɣ) tidak boleh negatif.`);

          const terzaghi = tanahAuto.terzaghi || false;
          const mayerhoff = tanahAuto.mayerhoff || false;

          if (!terzaghi && !mayerhoff) {
              errors.push(`Pilih minimal satu metode perhitungan tanah (Terzaghi atau Mayerhoff).`);
          }

          if (terzaghi) {
              if (phi === null) errors.push(`Sudut gesek dalam (ɸ) harus diisi dengan angka (metode Terzaghi aktif).`);
              else if (phi < 0) errors.push(`Sudut gesek dalam (ɸ) tidak boleh negatif.`);
              
              if (c === null) errors.push(`Kohesi (c) harus diisi dengan angka (metode Terzaghi aktif).`);
              else if (c < 0) errors.push(`Kohesi (c) tidak boleh negatif.`);
          }

          if (mayerhoff) {
              if (qc === null) errors.push(`Tahanan konus rata-rata (q<sub>c</sub>) harus diisi dengan angka (metode Mayerhoff aktif).`);
              else if (qc < 0) errors.push(`Tahanan konus rata-rata (q<sub>c</sub>) tidak boleh negatif.`);
          }

          // Peringatan untuk data tanah auto
          if (df !== null && (df < 0.5 || df > 5.0)) {
              warnings.push(`Kedalaman fondasi (D<sub>f</sub>) sebesar ${df} m tidak wajar, nilai yang umum digunakan antara 0.5–5.0 m.`);
          }
          if (gamma !== null && (gamma < 12 || gamma > 24)) {
              warnings.push(`Berat jenis tanah (ɣ) sebesar ${gamma} kN/m³ tidak wajar, nilai yang umum digunakan antara 12–24 kN/m³.`);
          }
          if (phi !== null && (phi < 0 || phi > 45)) {
              warnings.push(`Sudut gesek dalam (ɸ) sebesar ${phi}° tidak wajar, nilai yang umum digunakan antara 0–45°.`);
          }
          if (c !== null && (c < 0 || c > 300)) {
              warnings.push(`Kohesi (c) sebesar ${c} kPa tidak wajar, nilai yang umum digunakan antara 0–300 kPa.`);
          }
          if (qc !== null && (qc < 0.5 || qc > 50)) {
              warnings.push(`Tahanan konus rata-rata (q<sub>c</sub>) sebesar ${qc} MPa tidak wajar, nilai yang umum digunakan antara 0.5–50 MPa.`);
          }

      } else if (tanahMode === 'manual') {
          const qa = parseNum(tanahManual.qa);
          const df = parseNum(tanahManual.df);
          const gamma = parseNum(tanahManual.gamma);

          if (qa === null) errors.push(`Kapasitas dukung izin tanah (q<sub>a</sub>) harus diisi dengan angka.`);
          else if (qa < 0) errors.push(`Kapasitas dukung izin tanah (q<sub>a</sub>) tidak boleh negatif.`);
          
          if (df === null) errors.push(`Kedalaman fondasi (D<sub>f</sub>) harus diisi dengan angka.`);
          else if (df < 0) errors.push(`Kedalaman fondasi (D<sub>f</sub>) tidak boleh negatif.`);
          
          if (gamma === null) errors.push(`Berat jenis tanah (ɣ) harus diisi dengan angka.`);
          else if (gamma < 0) errors.push(`Berat jenis tanah (ɣ) tidak boleh negatif.`);

          // Peringatan untuk data tanah manual
          if (qa !== null && (qa < 50 || qa > 1000)) {
              warnings.push(`Kapasitas dukung izin tanah (q<sub>a</sub>) sebesar ${qa} kPa tidak wajar, nilai yang umum digunakan antara 50–1000 kPa.`);
          }
          if (df !== null && (df < 0.5 || df > 5.0)) {
              warnings.push(`Kedalaman fondasi (D<sub>f</sub>) sebesar ${df} m tidak wajar, nilai yang umum digunakan antara 0.5–5.0 m.`);
          }
          if (gamma !== null && (gamma < 12 || gamma > 24)) {
              warnings.push(`Berat jenis tanah (ɣ) sebesar ${gamma} kN/m³ tidak wajar, nilai yang umum digunakan antara 12–24 kN/m³.`);
          }
      }

      // 4. Data Beban
      const beban = data.beban || {};
      const Pu = parseNum(beban.pu);
      const Mux = parseNum(beban.mux);
      const Muy = parseNum(beban.muy);

      if (Pu === null) errors.push(`Beban aksial ultimit (P<sub>u</sub>u) harus diisi dengan angka meskipun nilainya 0 (gunakan titik untuk desimal).`);
      else if (Pu < 0) errors.push(`Beban aksial ultimit (P<sub>u</sub>) tidak boleh negatif.`);

      if (Mux === null) errors.push(`Momen ultimit arah X (M<sub>ux</sub>) harus diisi dengan angka meskipun nilainya 0 (gunakan titik untuk desimal).`);
      else if (Mux < 0) errors.push(`Momen ultimit arah X (M<sub>ux</sub>) tidak boleh negatif.`);

      if (Muy === null) errors.push(`Momen ultimit arah Y (M<sub>uy</sub>) harus diisi dengan angka meskipun nilainya 0 (gunakan titik untuk desimal).`);
      else if (Muy < 0) errors.push(`Momen ultimit arah Y (M<sub>uy</sub>) tidak boleh negatif.`);

      // 5. Data Tulangan (hanya untuk mode evaluasi)
      if (data.mode === 'evaluasi') {
          const tulangan = data.tulangan || {};
          const D = parseNum(tulangan.d);
          const Db = parseNum(tulangan.db);
          const s = parseNum(tulangan.s);
          const sp = parseNum(tulangan.sp);
          const st = parseNum(tulangan.st);
          const sb = parseNum(tulangan.sb);

          if (D === null) errors.push(`Diameter tulangan utama (D) harus diisi dengan angka.`);
          else if (D <= 0) errors.push(`Diameter tulangan utama (D) harus lebih besar dari 0.`);

          const isTunggalPersegiPanjang = (fondasiMode === 'tunggal' && parseNum(dimensi.lx) !== parseNum(dimensi.ly));
          const isMenerus = (fondasiMode === 'menerus');
          
          if (isMenerus || isTunggalPersegiPanjang) {
              if (Db === null) errors.push(`Diameter tulangan bagi (D<sub>b</sub>) harus diisi dengan angka.`);
              else if (Db <= 0) errors.push(`Diameter tulangan bagi (D<sub>b</sub>) harus lebih besar dari 0.`);
          }

          if (s === null) errors.push(`Jarak tulangan utama (s) harus diisi dengan angka.`);
          else if (s <= 0) errors.push(`Jarak tulangan utama (s) harus lebih besar dari 0.`);

          if (isTunggalPersegiPanjang) {
              if (sp === null) errors.push(`Jarak tulangan pusat (s<sub>p</sub>) harus diisi dengan angka.`);
              else if (sp <= 0) errors.push(`Jarak tulangan pusat (s<sub>p</sub>) harus lebih besar dari 0.`);
              
              if (st === null) errors.push(`Jarak tulangan tepi (s<sub>t</sub>) harus diisi dengan angka.`);
              else if (st <= 0) errors.push(`Jarak tulangan tepi (s<sub>t</sub>) harus lebih besar dari 0.`);
          }

          if (isMenerus) {
              if (sb === null) errors.push(`Jarak tulangan bagi (s<sub>t</sub>) harus diisi dengan angka.`);
              else if (sb <= 0) errors.push(`Jarak tulangan bagi (s<sub>t</sub>) harus lebih besar dari 0.`);
          }

          // Peringatan untuk jarak tulangan (100-450)
          const commonD = [10, 13, 16, 19, 22, 25, 29, 32];
          const commonDb = [8, 10, 13, 16, 19, 22, 25];

          if (D !== null && !commonD.includes(D)) {
              warnings.push(`Diameter tulangan utama (D) sebesar ${D} mm tidak umum, disarankan: ${commonD.join(', ')}.`);
          }
          if (Db !== null && !commonDb.includes(Db)) {
              warnings.push(`Diameter tulangan bagi (D<sub>b</sub>) sebesar ${Db} mm tidak umum, disarankan: ${commonDb.join(', ')}.`);
          }

          // Cek s, sp, st, sb range 100-450
          if (s !== null && (s < 100 || s > 450)) {
              warnings.push(`Jarak tulangan utama (s) sebesar ${s} mm tidak wajar, jarak yang umum digunakan antara 100–450 mm.`);
          }
          if (sp !== null && (sp < 100 || sp > 450)) {
              warnings.push(`Jarak tulangan pusat (s<sub>p</sub>) sebesar ${sp} mm tidak wajar, jarak yang umum digunakan antara 100–450 mm.`);
          }
          if (st !== null && (st < 100 || st > 450)) {
              warnings.push(`Jarak tulangan tepi (s<sub>t</sub>) sebesar ${st} mm tidak wajar, jarak yang umum digunakan antara 100–450 mm.`);
          }
          if (sb !== null && (sb < 100 || sb > 450)) {
              warnings.push(`Jarak tulangan bagi (s<sub>b</sub>) sebesar ${sb} mm tidak wajar, jarak yang umum digunakan antara 100–450 mm.`);
          }
      }

      // Peringatan material
      if (fc !== null && (fc < 17 || fc > 60)) {
          const kondisi = fc > 60 ? 'terlalu besar' : 'terlalu kecil';
          warnings.push(`f'<sub>c</sub> dengan nilai ${fc} MPa ${kondisi}, nilai yang umum digunakan antara 17–60 MPa.`);
      }
      if (gammaC !== null && (gammaC < 8 || gammaC > 40)) {
          warnings.push(`ɣ<sub>c</sub> dengan nilai ${gammaC} kN/m³ tidak wajar, nilai yang umum digunakan antara 8–40 kN/m³.`);
      }

      return { errors, warnings };
  },

  // ========== SHOW CONFIRM ALERT ==========
  showConfirmAlert: function(message, title, onConfirm, onCancel) {
      const rootStyles = getComputedStyle(document.documentElement);
      const buttonColor = rootStyles.getPropertyValue('--color-buttons').trim() || '#282B53';

      if (typeof showAlert !== 'function') {
          const proceed = confirm(message);
          if (proceed) onConfirm(); else if (onCancel) onCancel();
          return;
      }

      showAlert(message, title);

      const checkInterval = setInterval(() => {
          const alertContent = document.getElementById('alertContent');
          const alertModal = document.getElementById('alertModal');
          if (!alertContent || !alertModal || !alertModal.classList.contains('active')) {
              if (!alertModal || !alertModal.classList.contains('active')) {
                  clearInterval(checkInterval);
              }
              return;
          }

          if (alertContent.querySelector('.confirm-actions')) {
              clearInterval(checkInterval);
              return;
          }

          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'confirm-actions';
          actionsDiv.style.cssText = `
              margin-top: 20px;
              display: flex;
              justify-content: flex-end;
              gap: 12px;
          `;

          const btnBatal = document.createElement('button');
          btnBatal.textContent = 'Batal';
          btnBatal.className = 'btn';
          btnBatal.style.cssText = `
              background: white;
              color: ${buttonColor};
              border: 2px solid ${buttonColor};
              padding: 8px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              transition: all 0.2s ease;
          `;
          btnBatal.addEventListener('mouseenter', function() {
              this.style.background = buttonColor;
              this.style.color = 'white';
          });
          btnBatal.addEventListener('mouseleave', function() {
              this.style.background = 'white';
              this.style.color = buttonColor;
          });
          btnBatal.addEventListener('click', function() {
              if (alertModal) alertModal.classList.remove('active');
              if (typeof closeAlert === 'function') closeAlert();
              clearInterval(checkInterval);
              if (onCancel) onCancel();
          });

          const btnLanjut = document.createElement('button');
          btnLanjut.textContent = 'Lanjutkan';
          btnLanjut.className = 'btn primary';
          btnLanjut.style.cssText = `
              background: ${buttonColor};
              color: white;
              border: 2px solid ${buttonColor};
              padding: 8px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              transition: all 0.2s ease;
          `;
          btnLanjut.addEventListener('mouseenter', function() {
              this.style.opacity = '0.9';
          });
          btnLanjut.addEventListener('mouseleave', function() {
              this.style.opacity = '1';
          });
          btnLanjut.addEventListener('click', function() {
              if (alertModal) alertModal.classList.remove('active');
              if (typeof closeAlert === 'function') closeAlert();
              clearInterval(checkInterval);
              onConfirm();
          });

          actionsDiv.appendChild(btnBatal);
          actionsDiv.appendChild(btnLanjut);
          alertContent.appendChild(actionsDiv);

          clearInterval(checkInterval);
      }, 100);
  },

  // ==================== INISIALISASI ====================
  initTanahMode: function() {
    if (typeof window.tanahMode === 'undefined') {
      window.tanahMode = {};
    }
  },

  // ==================== LOADING SPINNER ====================
  showLoadingSpinner: function(message = "Melakukan perhitungan...") {
    this.hideLoadingSpinner();

    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.id = 'loadingSpinnerOverlay';
    spinnerOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(2px);
    `;

    spinnerOverlay.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 30px 40px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        max-width: 320px;
        width: 90%;
      ">
        <div class="loading-spinner" style="
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid var(--color-buttons);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="
          color: var(--text-dark);
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 10px 0;
        ">${escapeHtml(message)}</p>
        <p style="
          color: var(--text-light);
          font-size: 14px;
          margin: 0;
        ">Mohon tunggu sebentar...</p>
      </div>
    `;

    document.body.appendChild(spinnerOverlay);

    if (!document.querySelector('#spinAnimationStyle')) {
      const style = document.createElement('style');
      style.id = 'spinAnimationStyle';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  },

  hideLoadingSpinner: function() {
    const spinnerOverlay = document.getElementById('loadingSpinnerOverlay');
    if (spinnerOverlay) {
      spinnerOverlay.remove();
    }
  },

  // ==================== SESSION STORAGE HELPERS ====================
  saveAutoDimensiToSessionStorage: function(fondasiMode, value) {
    try {
      const key = `autoDimensi_${fondasiMode}`;
      sessionStorage.setItem(key, value ? 'true' : 'false');
      console.log(`[SESSION] autoDimensi saved: ${key} = ${value}`);
    } catch (error) {
      console.error('[SESSION] Error saving autoDimensi to sessionStorage:', error);
    }
  },

  loadAutoDimensiFromSessionStorage: function(fondasiMode) {
    try {
      const key = `autoDimensi_${fondasiMode}`;
      const storedValue = sessionStorage.getItem(key);

      if (storedValue !== null) {
        const value = storedValue === 'true';
        console.log(`[SESSION] autoDimensi loaded: ${key} = ${value}`);
        return value;
      }
    } catch (error) {
      console.error('[SESSION] Error loading autoDimensi from sessionStorage:', error);
    }
    return undefined;
  },

  syncUIWithState: function(mode) {
    if (!currentModuleKey || !mode) return undefined;

    if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
    if (!bebanMode[currentModuleKey][mode]) bebanMode[currentModuleKey][mode] = 'tunggal';

    const currentFondasiMode = bebanMode[currentModuleKey][mode];
    const autoDimensiKey = `autoDimensi_${currentFondasiMode}`;

    ensureState(currentModuleKey, mode);
    const state = formState[currentModuleKey][mode];

    const sessionValue = this.loadAutoDimensiFromSessionStorage(currentFondasiMode);
    if (sessionValue !== undefined && state[autoDimensiKey] === undefined) {
      state[autoDimensiKey] = sessionValue;
      console.log(`[SYNC] autoDimensi dari sessionStorage: ${autoDimensiKey} = ${sessionValue}`);
    }

    const autoDimensiValue = state[autoDimensiKey];
    console.log(`[SYNC] syncUIWithState: currentFondasiMode=${currentFondasiMode}, autoDimensiKey=${autoDimensiKey}, value=${autoDimensiValue}`);

    return autoDimensiValue;
  },

  reconcileUIWithState: function(mode) {
    console.log(`[RECONCILE] Memulai post-render reconciliation untuk mode: ${mode}`);

    if (!currentModuleKey || !mode) return undefined;

    if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
    if (!bebanMode[currentModuleKey][mode]) bebanMode[currentModuleKey][mode] = 'tunggal';

    const currentFondasiMode = bebanMode[currentModuleKey][mode];
    const autoDimensiKey = `autoDimensi_${currentFondasiMode}`;
    const checkboxId = `autoDimensiCheckbox_${currentFondasiMode}`;

    ensureState(currentModuleKey, mode);
    const state = formState[currentModuleKey][mode];
    const checkbox = document.getElementById(checkboxId);

    if (!checkbox) {
      console.log(`[RECONCILE] Checkbox ${checkboxId} tidak ditemukan, mungkin mode evaluasi`);
      return undefined;
    }

    console.log(`[RECONCILE] State awal: ${autoDimensiKey} = ${state[autoDimensiKey]}, Checkbox DOM: ${checkbox.checked}`);

    let finalAutoDimensiState;
    let source = 'unknown';

    const sessionValue = this.loadAutoDimensiFromSessionStorage(currentFondasiMode);
    if (sessionValue !== undefined) {
      finalAutoDimensiState = sessionValue;
      state[autoDimensiKey] = finalAutoDimensiState;
      source = 'sessionStorage';
      console.log(`[RECONCILE] Menggunakan nilai dari ${source}: ${autoDimensiKey} = ${finalAutoDimensiState}`);
    } else if (state[autoDimensiKey] !== undefined && state[autoDimensiKey] !== null) {
      finalAutoDimensiState = state[autoDimensiKey];
      source = 'formState';
      console.log(`[RECONCILE] Menggunakan nilai dari ${source}: ${autoDimensiKey} = ${finalAutoDimensiState}`);
    } else {
      finalAutoDimensiState = checkbox.checked;
      state[autoDimensiKey] = finalAutoDimensiState;
      source = 'DOM (browser restore)';
      console.log(`[RECONCILE] Menggunakan nilai dari ${source}: ${autoDimensiKey} = ${finalAutoDimensiState}`);
    }

    if (sessionValue === undefined) {
      this.saveAutoDimensiToSessionStorage(currentFondasiMode, finalAutoDimensiState);
    }

    if (checkbox.checked !== finalAutoDimensiState) {
      checkbox.checked = finalAutoDimensiState;
      console.log(`[RECONCILE] DOM diperbarui dari ${source}: ${checkboxId}.checked = ${finalAutoDimensiState}`);
    }

    console.log(`[RECONCILE] Menerapkan efek UI untuk ${autoDimensiKey} = ${finalAutoDimensiState}`);

    const fieldsToManage = currentFondasiMode === 'tunggal'
      ? ['ly_tunggal', 'lx_tunggal', 'h_tunggal']
      : ['ly_menerus', 'lx_menerus', 'h_menerus'];

    fieldsToManage.forEach(fieldKey => {
      const input = document.querySelector(`input[data-key="${fieldKey}"]`);
      if (input) {
        if (finalAutoDimensiState) {
          input.disabled = true;
          input.classList.add('disabled-field');
          input.title = "Field dinonaktifkan karena mode otomatis aktif";
          input.value = '';
        } else {
          input.disabled = false;
          input.classList.remove('disabled-field');
          input.title = "";
          if (state[fieldKey] !== undefined && state[fieldKey] !== null && state[fieldKey] !== '') {
            input.value = state[fieldKey];
          }
        }
      }
    });

    this.reconcileAutoDimensiInfo(currentFondasiMode, finalAutoDimensiState);

    return finalAutoDimensiState;
  },

  reconcileAutoDimensiInfo: function(fondasiMode, isActive) {
    const existingInfo = document.querySelector('.auto-dimensi-info');
    if (existingInfo) {
      existingInfo.remove();
      console.log(`[RECONCILE] Menghapus info auto dimensi lama`);
    }

    if (isActive) {
      const checkboxId = `autoDimensiCheckbox_${fondasiMode}`;
      const checkboxContainer = document.getElementById(checkboxId)?.closest('.checkbox-row');

      if (checkboxContainer) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'auto-dimensi-info';
        infoDiv.style.cssText = `
          background: #f0f7ff;
          border: 1px solid #d1e3ff;
          color: #0066cc;
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: fadeIn 0.3s ease;
        `;
        infoDiv.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Mode otomatis aktif - sistem akan menentukan dimensi optimal
        `;
        checkboxContainer.appendChild(infoDiv);
        console.log(`[RECONCILE] Menampilkan info auto dimensi`);
      }
    }
  },

  // ==================== RENDER UTAMA ====================
  render: function(container, mode) {
    container.innerHTML = '';

    currentMode = mode;
    this.currentContainer = container;

    const style = document.createElement('style');
    style.textContent = `
      .disabled-field {
        background-color: #f5f5f5 !important;
        cursor: not-allowed !important;
        opacity: 0.7;
      }
      .input-with-unit.disabled::after {
        opacity: 0.5;
      }
      .auto-dimensi-info {
        background: #f0f7ff;
        border: 1px solid #d1e3ff;
        color: #0066cc;
        padding: 8px 12px;
        border-radius: 6px;
        margin-top: 8px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    // Header card
    const headerDiv = document.createElement('div');
    headerDiv.className = 'card-header-with-tips';
    headerDiv.innerHTML = `
      <h2>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-dimension-line-icon lucide-ruler-dimension-line">
          <path d="M10 15v-3"/>
          <path d="M14 15v-3"/>
          <path d="M18 15v-3"/>
          <path d="M2 8V4"/>
          <path d="M22 6H2"/>
          <path d="M22 8V4"/>
          <path d="M6 15v-3"/>
          <rect x="2" y="12" width="20" height="8" rx="2"/>
        </svg>
        Data Dimensi
      </h2>
      <button class="circle-tips-btn" id="dimensiTipsBtn">?</button>
    `;
    container.appendChild(headerDiv);

    // Inisialisasi fondasiMode
    if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
    if (!bebanMode[currentModuleKey][mode]) bebanMode[currentModuleKey][mode] = 'tunggal';
    const currentFondasiMode = bebanMode[currentModuleKey][mode];

    const autoDimensiChecked = this.syncUIWithState(mode);

    console.log(`[RENDER] mode: ${mode}, fondasiMode: ${currentFondasiMode}, autoDimensi state: ${autoDimensiChecked}`);

    ensureState(currentModuleKey, mode);

    if (formState[currentModuleKey][mode]['terzaghi'] === undefined) {
        formState[currentModuleKey][mode]['terzaghi'] = true;
    }
    if (formState[currentModuleKey][mode]['mayerhoff'] === undefined) {
        formState[currentModuleKey][mode]['mayerhoff'] = false;
    }

    // Toggle untuk jenis fondasi
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'form-grid';
    toggleDiv.innerHTML = `
      <div class="field">
        <div class="mode-toggle" style="display: flex; gap: 8px;">
          <button class="toggle-btn ${currentFondasiMode === 'tunggal' ? 'active' : ''}" data-fondasi-mode="tunggal" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 120px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>
            Tunggal
          </button>
          <button class="toggle-btn ${currentFondasiMode === 'menerus' ? 'active' : ''}" data-fondasi-mode="menerus" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 120px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rectangle-ellipsis-icon lucide-rectangle-ellipsis"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
            Menerus
          </button>
        </div>
      </div>
    `;
    container.appendChild(toggleDiv);

    // Checkbox auto dimensi hanya untuk mode desain
    if (mode !== 'evaluasi') {
      const checkboxId = `autoDimensiCheckbox_${currentFondasiMode}`;

      const autoDimensiDiv = document.createElement('div');
      autoDimensiDiv.className = 'checkbox-row';
      autoDimensiDiv.innerHTML = `
        <div class="checkbox-container">
          <input type="checkbox" id="${checkboxId}" data-key="autoDimensi_${currentFondasiMode}">
          <label for="${checkboxId}">Dimensi Ditentukan Sistem</label>
        </div>
      `;
      container.appendChild(autoDimensiDiv);
    }

    const spacerDiv = document.createElement('div');
    spacerDiv.style.marginTop = '16px';
    container.appendChild(spacerDiv);

    // Grid fields
    const grid = document.createElement('div');
    grid.className = 'form-grid';

    let fields;
    if (currentFondasiMode === 'tunggal') {
      fields = [
        {label:"L<sub>y</sub>", key:"ly_tunggal", placeholder:"Panjang Fondasi", unit:"m"},
        {label:"L<sub>x</sub>", key:"lx_tunggal", placeholder:"Lebar Fondasi", unit:"m"},
        {label:"b<sub>y</sub>", key:"by_tunggal", placeholder:"Panjang Penampang Kolom", unit:"mm"},
        {label:"b<sub>x</sub>", key:"bx_tunggal", placeholder:"Lebar Penampang Kolom", unit:"mm"},
        {label:"h", key:"h_tunggal", placeholder:"Tebal Fondasi", unit:"m"},
        {label:"α<sub>s</sub>", key:"alpha_s_tunggal", placeholder:"Letak Kolom", unit:"", type:"dropdown", options:["Tengah", "Tepi", "Sudut"]}
      ];
    } else {
      fields = [
        {label:"L<sub>y</sub>", key:"ly_menerus", placeholder:"Panjang Fondasi", unit:"m"},
        {label:"L<sub>x</sub>", key:"lx_menerus", placeholder:"Lebar Fondasi", unit:"m"},
        {label:"b<sub>y</sub>", key:"by_menerus", placeholder:"Panjang Sloof", unit:"mm"},
        {label:"b<sub>x</sub>", key:"bx_menerus", placeholder:"Lebar Penampang Sloof", unit:"mm"},
        {label:"h", key:"h_menerus", placeholder:"Tebal Fondasi", unit:"m"},
        {label:"α<sub>s</sub>", key:"alpha_s_menerus", placeholder:"Faktor Letak Fondasi", unit:""}
      ];
    }

    ensureState(currentModuleKey, mode);

    fields.forEach(f => {
      const cell = document.createElement('div');
      cell.className = 'field';
      const stateVal = (formState[currentModuleKey] && formState[currentModuleKey][mode] && formState[currentModuleKey][mode][f.key]) || '';

      if (f.type === 'dropdown') {
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'custom-dropdown';
        dropdownContainer.innerHTML = `
          <div class="dropdown-selected" id="alphaSDropdownSelected">
            <span>${stateVal || 'Pilih Letak Kolom'}</span>
          </div>
          <div class="dropdown-options" id="alphaSDropdownOptions">
            ${f.options.map(option => `<div class="dropdown-option" data-value="${option}">${option}</div>`).join('')}
            <div class="dropdown-option clear-option" data-value="clear">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2">
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2V6"/>
                <path d="M3 6h18"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </div>
          </div>
        `;
        cell.innerHTML = `<label>${f.label}</label>`;
        cell.appendChild(dropdownContainer);
      } else {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-with-unit';
        inputContainer.setAttribute('data-unit', f.unit || '');

        const input = document.createElement('input');
        input.setAttribute('data-key', f.key);
        input.setAttribute('placeholder', escapeHtml(f.placeholder));
        input.value = escapeHtml(stateVal);

        inputContainer.appendChild(input);
        cell.innerHTML = `<label>${f.label}</label>`;
        cell.appendChild(inputContainer);
      }

      grid.appendChild(cell);
    });
    container.appendChild(grid);

    // Setup dropdown
    if (currentFondasiMode === 'tunggal') {
      this.initAlphaSDropdown(container, mode);
    }

    // Setup fondasi mode toggle
    this.setupFondasiModeToggle(container, mode);

    // Setup auto dimensi checkbox
    if (mode !== 'evaluasi') {
      this.setupAutoDimensiCheckbox(container, mode, currentFondasiMode);
    }

    this.removeExistingCards();

    // Render Data Tanah
    this.renderTanahCard(container);

    // Render Data Beban
    if (mode === 'desain') {
      this.renderBebanCard(container);
      this.renderLanjutanCard(container);
    }

    if (mode === 'evaluasi') {
      this.renderBebanCard(container);

      let lx, ly;
      if (currentFondasiMode === 'tunggal') {
        lx = (formState[currentModuleKey] && formState[currentModuleKey][mode] && formState[currentModuleKey][mode]['lx_tunggal']) || '';
        ly = (formState[currentModuleKey] && formState[currentModuleKey][mode] && formState[currentModuleKey][mode]['ly_tunggal']) || '';
      } else {
        lx = (formState[currentModuleKey] && formState[currentModuleKey][mode] && formState[currentModuleKey][mode]['lx_menerus']) || '';
        ly = (formState[currentModuleKey] && formState[currentModuleKey][mode] && formState[currentModuleKey][mode]['ly_menerus']) || '';
      }
      this.renderTulanganCard(container, currentFondasiMode, lx, ly);

      this.renderLanjutanCard(container);
    }

    this.wireInputListeners(container, mode);

    this.setupDimensiTipsButton();

    this.setupCalculateButton();

    if (mode !== 'evaluasi') {
      setTimeout(() => {
        this.reconcileUIWithState(mode);
      }, 10);
    }
  },

  // ==================== FUNGSI BANTUAN RENDER ====================
  getTulanganFields: function(fondasiMode, lx, ly) {
    const lxNum = parseFloat(lx) || 0;
    const lyNum = parseFloat(ly) || 0;

    if (fondasiMode === 'menerus') {
      return [
        {label:"D", key:"d", placeholder:"Diameter Tulangan Utama", unit:"mm"},
        {label:"D<sub>b</sub>", key:"db", placeholder:"Diameter Tulangan Bagi", unit:"mm"},
        {label:"s", key:"s", placeholder:"Jarak Tulangan Utama", unit:"mm"},
        {label:"s<sub>b</sub>", key:"sb", placeholder:"Jarak Tulangan Bagi", unit:"mm"}
      ];
    } else if (fondasiMode === 'tunggal') {
      if (lxNum === lyNum || Math.abs(lxNum - lyNum) < 0.001) {
        return [
          {label:"D", key:"d", placeholder:"Diameter Tulangan Utama", unit:"mm"},
          {label:"s", key:"s", placeholder:"Jarak Tulangan", unit:"mm"}
        ];
      } else {
        return [
          {label:"D", key:"d", placeholder:"Diameter Tulangan Utama", unit:"mm"},
          {label:"D<sub>b</sub>", key:"db", placeholder:"Diameter Tulangan Bagi", unit:"mm"},
          {label:"s", key:"s", placeholder:"Jarak Tulangan Arah Panjang", unit:"mm"},
          {label:"s<sub>p</sub>", key:"sp", placeholder:"Jarak Tulangan Pusat", unit:"mm"},
          {label:"s<sub>t</sub>", key:"st", placeholder:"Jarak Tulangan Tepi", unit:"mm"}
        ];
      }
    }

    return [
      {label:"D", key:"d", placeholder:"Diameter Tulangan Utama", unit:"mm"},
      {label:"D<sub>b</sub>", key:"db", placeholder:"Diameter Tulangan Bagi", unit:"mm"},
      {label:"s", key:"s", placeholder:"Jarak Tulangan Utama", unit:"mm"},
      {label:"s<sub>b</sub>", key:"sb", placeholder:"Jarak Tulangan Bagi", unit:"mm"}
    ];
  },

  updateTulanganCard: function() {
    if (currentMode !== 'evaluasi') return;

    const currentFondasiMode = bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] ? bebanMode[currentModuleKey][currentMode] : 'tunggal';

    let lx, ly;
    if (currentFondasiMode === 'tunggal') {
      lx = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['lx_tunggal']) || '';
      ly = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['ly_tunggal']) || '';
    } else {
      lx = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['lx_menerus']) || '';
      ly = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['ly_menerus']) || '';
    }

    this.renderTulanganCard(this.currentContainer, currentFondasiMode, lx, ly);
  },

  setupDimensiTipsButton: function() {
    const dimensiTipsBtn = document.getElementById('dimensiTipsBtn');
    if (dimensiTipsBtn) {
      dimensiTipsBtn.addEventListener('click', function() {
        const tipsContent = document.getElementById('tipsContent');
        tipsContent.innerHTML = `
          <h3>Data Dimensi</h3>
          <div style="line-height: 1.6;">
            <p>Atur metode penentuan dan jenis fondasi.</p>

            <p><strong>Fondasi Tunggal</strong>: bx dan by dari dimensi kolom.</p>
            <p><strong>Fondasi Menerus</strong>: bx dan by dari panjang kritis sloof.</p>

            <h4>αs (Faktor posisi kolom)</h4>
            <ul>
              <li><strong>Tunggal</strong>: Pilih posisi kolom (Tengah=40, Tepi=30, Sudut=20)</li>
              <li><strong>Menerus</strong>: Masukkan total kombinasi nilai αs secara manual sesuai dengan posisi kolom yang ada diatas fondasi</li>
            </ul>

            <h4>Dimensi Ditentukan Sistem</h4>
            <p>Centang untuk sistem mencari dimensi optimal. Perhitungan akan lebih lama.</p>
            <p><em>Hanya tersedia di mode desain.</em></p>
          </div>
        `;
        document.getElementById('tipsModal').classList.add('active');
        document.addEventListener('keydown', handleEscKey);
      });
    }
  },

  removeExistingCards: function() {
    const existingCards = ['bebanCard', 'tulanganCard', 'lanjutanCard', 'tanahCard'];
    existingCards.forEach(cardId => {
      const card = document.getElementById(cardId);
      if (card) card.remove();
    });
  },

  setupAutoDimensiCheckbox: function(container, mode, fondasiMode) {
    if (mode !== 'evaluasi') {
      const autoDimensiKey = `autoDimensi_${fondasiMode}`;
      const checkboxId = `autoDimensiCheckbox_${fondasiMode}`;

      const checkbox = document.getElementById(checkboxId);
      if (!checkbox) return;

      console.log(`[SETUP] setupAutoDimensiCheckbox: ${autoDimensiKey}, checkboxId: ${checkboxId}`);

      const newCheckbox = checkbox.cloneNode(true);
      checkbox.parentNode.replaceChild(newCheckbox, checkbox);

      newCheckbox.addEventListener('change', (e) => {
        this.handleAutoDimensiChange(e.target, mode, fondasiMode);
      });
    }
  },

  handleAutoDimensiChange: function(checkbox, mode, fondasiMode) {
    const autoDimensiKey = `autoDimensi_${fondasiMode}`;
    const isChecked = checkbox.checked;

    console.log(`[USER CHANGE] handleAutoDimensiChange: ${autoDimensiKey} = ${isChecked} (user action)`);

    if (isChecked) {
      showAlert(
        'Sistem akan mencari dimensi optimal. Perhitungan mungkin akan menjadi lebih lama.',
        '⚠️ Mode Dimensi Otomatis'
      );

      setTimeout(() => {
        const alertContent = document.getElementById('alertContent');
        const confirmHTML = `
          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancelAutoDimensi" class="btn ghost" style="width: 85px; text-align: center; padding: 8px 12px; display: flex; align-items: center; justify-content: center;">Batal</button>
            <button id="confirmAutoDimensi" class="btn" style="background: var(--color-buttons); color: var(--button-text-color, white); width: 85px; text-align: center; padding: 8px 12px; display: flex; align-items: center; justify-content: center;">Aktifkan</button>
          </div>
        `;

        alertContent.innerHTML += confirmHTML;

        document.getElementById('confirmAutoDimensi').addEventListener('click', () => {
          ensureState(currentModuleKey, mode);
          formState[currentModuleKey][mode][autoDimensiKey] = true;
          this.saveAutoDimensiToSessionStorage(fondasiMode, true);
          closeAlert();
          this.reconcileUIWithState(mode);
          updateLog(`AutoDimensi diaktifkan oleh user untuk ${fondasiMode} (disimpan ke sessionStorage)`);
        });

        document.getElementById('cancelAutoDimensi').addEventListener('click', () => {
          checkbox.checked = false;
          ensureState(currentModuleKey, mode);
          formState[currentModuleKey][mode][autoDimensiKey] = false;
          this.saveAutoDimensiToSessionStorage(fondasiMode, false);
          closeAlert();
          this.reconcileUIWithState(mode);
          updateLog(`AutoDimensi dibatalkan oleh user untuk ${fondasiMode} (disimpan ke sessionStorage)`);
        });

      }, 50);
    } else {
      ensureState(currentModuleKey, mode);
      formState[currentModuleKey][mode][autoDimensiKey] = false;
      this.saveAutoDimensiToSessionStorage(fondasiMode, false);
      this.reconcileUIWithState(mode);
      updateLog(`AutoDimensi dinonaktifkan oleh user untuk ${fondasiMode} (disimpan ke sessionStorage)`);
    }
  },

  // ==================== DATA TANAH CARD ====================
  renderTanahCard: function(container) {
    const tanahCard = document.createElement('div');
    tanahCard.className = 'card';
    tanahCard.id = 'tanahCard';

    this.initTanahMode();
    if (!window.tanahMode[currentModuleKey]) window.tanahMode[currentModuleKey] = {};
    if (!window.tanahMode[currentModuleKey][currentMode]) window.tanahMode[currentModuleKey][currentMode] = 'auto';
    const currentTanahMode = window.tanahMode[currentModuleKey][currentMode];

    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode];

    const terzaghiChecked = currentState && currentState.hasOwnProperty('terzaghi') ? currentState.terzaghi : true;
    const mayerhoffChecked = currentState && currentState.hasOwnProperty('mayerhoff') ? currentState.mayerhoff : false;

    const dfValue = (currentState && currentState['df']) || '';
    const gammaValue = (currentState && currentState['gamma']) || '';
    const phiValue = (currentState && currentState['phi']) || '';
    const cValue = (currentState && currentState['c']) || '';
    const qcValue = (currentState && currentState['qc']) || '';
    const qaValue = (currentState && currentState['qa']) || '';

    tanahCard.innerHTML = `
      <div class="card-header-with-tips">
        <h2>
          <svg fill="#000000" version="1.1" id="Sand" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
               width="24px" height="24px" viewBox="0 0 256 256" enable-background="new 0 0 256 256" xml:space="preserve">
            <path d="M247.769,150.406c-0.621-7.079-8.779-11.157-16.669-15.101c-3.163-1.582-8.436-4.217-9.388-5.624
              c-2.966-7.613-4.592-8.336-16.975-13.843c-3.595-1.599-8.07-3.589-13.989-6.339c-16.138-7.497-28.605-17.704-38.623-25.906
              c-6.096-4.991-11.361-9.301-16.257-12.053c-7.321-4.115-13.951-4.706-19.367-1.956c-8.019,4.071-25.936,23.747-37.833,34.045
              c-16.338,14.143-45.719,32.539-59.563,36.186c-15.422,4.062-16.859,15.213,9.184,18.589c46.661,6.05,36.308,16.493,81.825,19.16
              c28.434,1.666,104.438-8.216,129.889-17.625c2.583-0.71,4.328-1.732,5.642-3.149C247.248,155.058,247.983,152.851,247.769,150.406z
               M110.318,148.391c-2.175,0.002-3.94-1.759-3.942-3.934s1.759-3.94,3.934-3.942c2.175-0.002,3.94,1.759,3.942,3.934
               C114.254,146.623,112.493,148.389,110.318,148.391z M121.98,136.174c-1.933,0.002-3.502-1.563-3.504-3.497s1.563-3.502,3.497-3.504
               s3.502,1.563,3.504,3.497S123.914,136.172,121.98,136.174z M129.877,155.371c-2.417,0.003-4.378-1.954-4.38-4.371
               c-0.003-2.417,1.954-4.378,4.371-4.38c2.417-0.003,4.378,1.954,4.38,4.371S132.294,155.368,129.877,155.371z M153.353,120.756
               c-11.005-12.065-17.739-30.072-23.983-41.293c0.519,0.224,1.052,0.486,1.596,0.792c4.137,2.325,9.088,6.379,14.823,11.074
               c10.453,8.558,23.462,19.208,40.745,27.237c5.994,2.785,10.51,4.793,14.138,6.407c5.331,2.371,8.548,3.802,9.865,4.825
               c0.632,0.49,0.825,0.858,1.89,3.598c1.81,4.659,7.552,7.529,14.201,10.853c2.536,1.268,6.914,3.531,9.521,5.373
               c0.595,0.42,0.382,1.355-0.339,1.461c-2.599,0.381-7.172,0.66-14.533,0.182C204.288,150.163,175.392,144.919,153.353,120.756z
                M70.992,179.579c0,2.777-2.252,5.029-5.029,5.029s-5.029-2.252-5.029-5.029c0-2.777,2.252-5.029,5.029-5.029
               S70.992,176.802,70.992,179.579z M53.12,171.698c0,2.449-1.986,4.435-4.435,4.435s-4.435-1.986-4.435-4.435s1.986-4.435,4.435-4.435
               S53.12,169.249,53.12,171.698z M33.06,181.874c0,2.209-1.791,4-4,4s-4-1.791-4-4s1.791-4,4-4S33.06,179.665,33.06,181.874z
                M219.25,177.749c0,2.278-1.847,4.125-4.125,4.125S211,180.027,211,177.749s1.847-4.125,4.125-4.125S219.25,175.471,219.25,177.749z
               "/>
          </svg>
          Data Tanah
        </h2>
        <button class="circle-tips-btn" id="tanahTipsBtn">?</button>
      </div>
      <div class="form-grid">
        <div class="field">
          <div class="mode-toggle" style="display: flex; gap: 8px;">
            <button class="toggle-btn ${currentTanahMode === 'auto' ? 'active' : ''}" data-tanah-mode="auto" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 120px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cpu-icon lucide-cpu">
                <path d="M12 20v2"/>
                <path d="M12 2v2"/>
                <path d="M17 20v2"/>
                <path d="M17 2v2"/>
                <path d="M2 12h2"/>
                <path d="M2 17h2"/>
                <path d="M2 7h2"/>
                <path d="M20 12h2"/>
                <path d="M20 17h2"/>
                <path d="M20 7h2"/>
                <path d="M7 20v2"/>
                <path d="M7 2v2"/>
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <rect x="8" y="8" width="8" height="8" rx="1"/>
              </svg>
              Auto
            </button>
            <button class="toggle-btn ${currentTanahMode === 'manual' ? 'active' : ''}" data-tanah-mode="manual" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 120px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-notebook-pen-icon lucide-notebook-pen">
                <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/>
                <path d="M2 6h4"/>
                <path d="M2 10h4"/>
                <path d="M2 14h4"/>
                <path d="M2 18h4"/>
                <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
              </svg>
              Manual
            </button>
          </div>
        </div>
      </div>

      <div style="margin-top: 16px;"></div>

      ${currentTanahMode === 'auto' ? `
        <div class="tanah-auto-content">
          <div class="form-grid">
            <div class="field">
              <label>D<sub>f</sub></label>
              <div class="input-with-unit" data-unit="m">
                <input data-key="df" placeholder="Kedalaman Fondasi" value="${escapeHtml(dfValue)}">
              </div>
            </div>
            <div class="field">
              <label>ɣ</label>
              <div class="input-with-unit" data-unit="kN/m³">
                <input data-key="gamma" placeholder="Berat Jenis Tanah" value="${escapeHtml(gammaValue)}">
              </div>
            </div>
          </div>

          <div class="checkbox-row">
            <div class="checkbox-container">
              <input type="checkbox" id="terzaghiCheckbox" data-key="terzaghi" ${terzaghiChecked ? 'checked' : ''}>
              <label for="terzaghiCheckbox">Terzaghi</label>
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label>ɸ</label>
              <div class="input-with-unit ${terzaghiChecked ? '' : 'disabled'}" data-unit="º">
                <input data-key="phi" placeholder="Sudut Gesek Dalam" value="${escapeHtml(phiValue)}" ${terzaghiChecked ? '' : 'disabled'} class="${terzaghiChecked ? '' : 'disabled-field'}">
              </div>
            </div>
            <div class="field">
              <label>c</label>
              <div class="input-with-unit ${terzaghiChecked ? '' : 'disabled'}" data-unit="kPa">
                <input data-key="c" placeholder="Kohesi" value="${escapeHtml(cValue)}" ${terzaghiChecked ? '' : 'disabled'} class="${terzaghiChecked ? '' : 'disabled-field'}">
              </div>
            </div>
          </div>

          <div class="checkbox-row">
            <div class="checkbox-container">
              <input type="checkbox" id="mayerhoffCheckbox" data-key="mayerhoff" ${mayerhoffChecked ? 'checked' : ''}>
              <label for="mayerhoffCheckbox">Mayerhoff</label>
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label>q<sub>c</sub></label>
              <div class="input-with-unit ${mayerhoffChecked ? '' : 'disabled'}" data-unit="MPa">
                <input data-key="qc" placeholder="Tahanan Konus Rata-rata" value="${escapeHtml(qcValue)}" ${mayerhoffChecked ? '' : 'disabled'} class="${mayerhoffChecked ? '' : 'disabled-field'}">
              </div>
            </div>
            <div class="field"></div>
          </div>
        </div>
      ` : ''}

      ${currentTanahMode === 'manual' ? `
        <div class="form-grid manual-content">
          <div class="field">
            <label>q<sub>a</sub></label>
            <div class="input-with-unit" data-unit="kN/m²">
              <input data-key="qa" placeholder="Kapasitas Dukung Izin Tanah" value="${escapeHtml(qaValue)}">
            </div>
          </div>
          <div class="field">
            <label>D<sub>f</sub></label>
            <div class="input-with-unit" data-unit="m">
              <input data-key="df" placeholder="Kedalaman Fondasi" value="${escapeHtml(dfValue)}">
            </div>
          </div>
          <div class="field">
            <label>ɣ</label>
            <div class="input-with-unit" data-unit="kN/m³">
              <input data-key="gamma" placeholder="Berat Jenis Tanah" value="${escapeHtml(gammaValue)}">
            </div>
          </div>
        </div>
      ` : ''}
    `;

    const referenceNode = container.nextSibling;
    container.parentNode.insertBefore(tanahCard, referenceNode);

    this.setupTanahModeToggle();
    this.setupTanahCheckboxes();
    this.setupTanahTipsButton();
  },

  setupTanahTipsButton: function() {
    const tanahTipsBtn = document.getElementById('tanahTipsBtn');
    if (tanahTipsBtn) {
      tanahTipsBtn.addEventListener('click', function() {
        const tipsContent = document.getElementById('tipsContent');
        tipsContent.innerHTML = `
          <h3>Data Tanah</h3>
          <div style="line-height: 1.6;">
            <p>Atur metode perhitungan data tanah.</p>

            <h4>Mode Auto</h4>
            <p>Isi parameter tanah:</p>
            <ul>
              <li><strong>df</strong> - Kedalaman fondasi</li>
              <li><strong>γ</strong> - Berat jenis tanah</li>
            </ul>

            <p>Pilih metode perhitungan:</p>
            <ul>
              <li><strong>Terzaghi</strong> - Input ϕ dan c</li>
              <li><strong>Meyerhof</strong> - Input qc</li>
            </ul>
            <p>Sistem akan pilih nilai qa terkecil.</p>

            <h4>Mode Manual</h4>
            <p>Masukkan langsung:</p>
            <ul>
              <li><strong>qa</strong> - Kapasitas dukung izin tanah</li>
              <li><strong>df</strong> - Kedalaman fondasi</li>
              <li><strong>γ</strong> - Berat jenis tanah</li>
            </ul>
          </div>
        `;
        document.getElementById('tipsModal').classList.add('active');
        document.addEventListener('keydown', handleEscKey);
      });
    }
  },

  setupTanahModeToggle: function() {
    const toggleBtns = document.querySelectorAll('#tanahCard .toggle-btn[data-tanah-mode]');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const mode = this.getAttribute('data-tanah-mode');
        if (!window.tanahMode[currentModuleKey]) window.tanahMode[currentModuleKey] = {};
        window.tanahMode[currentModuleKey][currentMode] = mode;
        renderModule();
        updateLog(`Tanah mode for ${currentModuleKey}.${currentMode} set to ${mode}`);
      });
    });
  },

  setupTanahCheckboxes: function() {
    const terzaghiCheckbox = document.querySelector('#tanahCard input[data-key="terzaghi"]');
    const mayerhoffCheckbox = document.querySelector('#tanahCard input[data-key="mayerhoff"]');

    if (terzaghiCheckbox) {
      terzaghiCheckbox.addEventListener('change', function() {
        ensureState(currentModuleKey, currentMode);
        formState[currentModuleKey][currentMode]['terzaghi'] = this.checked;
        if (!this.checked) {
          const fieldsToClear = ['phi', 'c'];
          fieldsToClear.forEach(field => {
            formState[currentModuleKey][currentMode][field] = '';
          });
        }
        renderModule();
        updateLog(`Terzaghi method ${this.checked ? 'enabled' : 'disabled'} for ${currentModuleKey}.${currentMode}`);
      });
    }

    if (mayerhoffCheckbox) {
      mayerhoffCheckbox.addEventListener('change', function() {
        ensureState(currentModuleKey, currentMode);
        formState[currentModuleKey][currentMode]['mayerhoff'] = this.checked;
        if (!this.checked) {
          formState[currentModuleKey][currentMode]['qc'] = '';
        }
        renderModule();
        updateLog(`Mayerhoff method ${this.checked ? 'enabled' : 'disabled'} for ${currentModuleKey}.${currentMode}`);
      });
    }
  },

  // ==================== BEBAN CARD ====================
  renderBebanCard: function(container) {
    const bebanCard = document.createElement('div');
    bebanCard.className = 'card';
    bebanCard.id = 'bebanCard';

    bebanCard.innerHTML = `
      <div class="card-header">
        <h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-weight-icon lucide-weight">
            <circle cx="12" cy="5" r="3"/>
            <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>
          </svg>
          Data Beban
        </h2>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>P<sub>u</sub></label>
          <div class="input-with-unit" data-unit="kN">
            <input data-key="pu" placeholder="Beban Aksial Ultimit" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pu']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>M<sub>uy</sub></label>
          <div class="input-with-unit" data-unit="kNm">
            <input data-key="muy" placeholder="Momen Ultimit Arah Y" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['muy']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>M<sub>ux</sub></label>
          <div class="input-with-unit" data-unit="kNm">
            <input data-key="mux" placeholder="Momen Ultimit Arah X" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['mux']) || '')}">
          </div>
        </div>
      </div>
    `;

    const tanahCard = document.getElementById('tanahCard');
    container.parentNode.insertBefore(bebanCard, tanahCard.nextSibling);
  },

  // ==================== TULANGAN CARD ====================
  renderTulanganCard: function(container, fondasiMode, lx, ly) {
    const tulanganCard = document.createElement('div');
    tulanganCard.className = 'card';
    tulanganCard.id = 'tulanganCard';

    const tulanganFields = this.getTulanganFields(fondasiMode, lx, ly);

    let fieldsHTML = '';
    tulanganFields.forEach(field => {
      const value = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][field.key]) || '';
      fieldsHTML += `
        <div class="field">
          <label>${field.label}</label>
          <div class="input-with-unit" data-unit="${field.unit}">
            <input data-key="${field.key}" placeholder="${field.placeholder}" value="${escapeHtml(value)}">
          </div>
        </div>
      `;
    });

    tulanganCard.innerHTML = `
      <div class="card-header">
        <h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-menu-icon lucide-square-menu">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M7 8h10"/>
            <path d="M7 12h10"/>
            <path d="M7 16h10"/>
          </svg>
          Data Tulangan
        </h2>
      </div>
      <div class="form-grid">
        ${fieldsHTML}
      </div>
    `;

    const bebanCard = document.getElementById('bebanCard');
    container.parentNode.insertBefore(tulanganCard, bebanCard.nextSibling);
  },

  // ==================== LANJUTAN CARD ====================
  renderLanjutanCard: function(container) {
    const lanjutanCard = document.createElement('div');
    lanjutanCard.className = 'card';
    lanjutanCard.id = 'lanjutanCard';

    lanjutanCard.innerHTML = `
      <div class="card-header-with-collapse">
        <h3>Data Lanjutan</h3>
        <div class="collapse-controls">
          <button class="circle-tips-btn" id="lanjutanTipsBtn">?</button>
          <button class="collapse-btn" id="lanjutanCollapseBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="collapse-content" id="lanjutanContent">
        <div class="form-grid">
          <div class="field">
            <label>λ</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="lambda" placeholder="Faktor Beton = 1" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['lambda']) || '')}">
            </div>
          </div>
        </div>
      </div>
    `;

    const referenceCard = document.getElementById('tulanganCard') || document.getElementById('bebanCard');
    container.parentNode.insertBefore(lanjutanCard, referenceCard.nextSibling);

    this.setupCollapseFunctionality();
    this.setupLanjutanTipsButton();
  },

  setupLanjutanTipsButton: function() {
    const lanjutanTipsBtn = document.getElementById('lanjutanTipsBtn');
    if (lanjutanTipsBtn) {
      lanjutanTipsBtn.addEventListener('click', function() {
        const tipsContent = document.getElementById('tipsContent');
        tipsContent.innerHTML = `
          <h3>Data Lanjutan</h3>
          <div style="line-height: 1.6;">
            <p><strong>λ</strong> — Faktor reduksi kekuatan untuk beton ringan:</p>
            <ul>
              <li>Beton normal: <strong>1.0</strong></li>
              <li>Beton ringan sebagian: <strong>0.85</strong></li>
              <li>Beton ringan penuh: <strong>0.75</strong></li>
            </ul>
            <p>Jika dikosongi, dianggap beton normal (1).</p>
          </div>
        `;
        document.getElementById('tipsModal').classList.add('active');
        document.addEventListener('keydown', handleEscKey);
      });
    }
  },

  setupCollapseFunctionality: function() {
    const collapseBtn = document.getElementById('lanjutanCollapseBtn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function() {
        const content = document.getElementById('lanjutanContent');
        const card = document.getElementById('lanjutanCard');
        if (content && card) {
          content.classList.toggle('expanded');
          card.classList.toggle('expanded');
          this.classList.toggle('rotated');
        }
      });
    }
  },

  // ==================== FONDASI MODE TOGGLE ====================
  setupFondasiModeToggle: function(container, mode) {
    const toggleBtns = container.querySelectorAll('.toggle-btn[data-fondasi-mode]');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const fondasiMode = this.getAttribute('data-fondasi-mode');
        if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};

        const oldMode = bebanMode[currentModuleKey][mode];
        bebanMode[currentModuleKey][mode] = fondasiMode;

        console.log(`[DEBUG] Fondasi mode changed from ${oldMode} to ${fondasiMode}`);

        renderModule();
        updateLog(`Fondasi mode for ${currentModuleKey}.${mode} set to ${fondasiMode}`);
      });
    });
  },

  initAlphaSDropdown: function(container, mode) {
    const dropdownSelected = container.querySelector('#alphaSDropdownSelected');
    const dropdownOptions = container.querySelector('#alphaSDropdownOptions');

    if (!dropdownSelected || !dropdownOptions) return;

    dropdownSelected.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = dropdownSelected.classList.contains('open');

      document.querySelectorAll('.dropdown-selected.open').forEach(el => {
        if (el !== dropdownSelected) el.classList.remove('open');
      });
      document.querySelectorAll('.dropdown-options.show').forEach(el => {
        if (el !== dropdownOptions) el.classList.remove('show');
      });

      dropdownSelected.classList.toggle('open');
      dropdownOptions.classList.toggle('show');
    });

    dropdownOptions.querySelectorAll('.dropdown-option').forEach(option => {
      option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');

        if (value === 'clear') {
          dropdownSelected.querySelector('span').textContent = 'Pilih Letak Kolom';
          formState[currentModuleKey][mode]['alpha_s_tunggal'] = '';
          updateLog('alpha_s_tunggal cleared for fondasi module');
        } else {
          dropdownSelected.querySelector('span').textContent = this.textContent;
          ensureState(currentModuleKey, mode);
          formState[currentModuleKey][mode]['alpha_s_tunggal'] = value;
          updateLog(`set ${currentModuleKey}.${mode}.alpha_s_tunggal = ${value}`);
        }

        dropdownSelected.classList.remove('open');
        dropdownOptions.classList.remove('show');
      });
    });

    document.addEventListener('click', function(e) {
      if (!dropdownSelected.contains(e.target) && !dropdownOptions.contains(e.target)) {
        dropdownSelected.classList.remove('open');
        dropdownOptions.classList.remove('show');
      }
    });
  },

  wireInputListeners: function(container, mode) {
    container.addEventListener('input', function(e) {
      if (e.target.matches('input[data-key], select[data-key]')) {
        const input = e.target;
        const key = input.dataset.key;

        ensureState(currentModuleKey, mode);
        formState[currentModuleKey][mode][key] = input.value;
        updateLog(`set ${currentModuleKey}.${mode}.${key} = ${input.value}`);

        if (mode === 'evaluasi' && (key === 'lx_tunggal' || key === 'ly_tunggal' || key === 'lx_menerus' || key === 'ly_menerus')) {
          setTimeout(() => {
            window.modules.fondasi.updateTulanganCard();
          }, 100);
        }
      }
    });

    container.addEventListener('change', function(e) {
      if (e.target.matches('input[type="checkbox"][data-key]')) {
        const checkbox = e.target;
        const key = checkbox.dataset.key;

        ensureState(currentModuleKey, mode);
        formState[currentModuleKey][mode][key] = checkbox.checked;
        updateLog(`set ${currentModuleKey}.${mode}.${key} = ${checkbox.checked}`);
      }
    });
  },

  // ==================== VALIDASI DAN PERHITUNGAN ====================
  setupCalculateButton: function() {
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
      calculateBtn.replaceWith(calculateBtn.cloneNode(true));

      document.getElementById('calculateBtn').addEventListener('click', () => {
        this.handleCalculate();
      });
    }
  },

  handleCalculate: function() {
    const calculationData = this.collectData();

    // Validasi input
    const validation = this.validateFondasiInput(calculationData);

    if (validation.errors.length > 0) {
      const msg = validation.errors.join('\n');
      if (typeof showAlert === 'function') {
        showAlert(`Terdapat kesalahan pada input:\n\n${msg}`, '⚠️ Validasi Input Gagal');
      } else {
        alert(`Terdapat kesalahan pada input:\n\n${msg}`);
      }
      return;
    }

    if (validation.warnings.length > 0) {
      const msg = validation.warnings.join('\n');
      this.showConfirmAlert(
        `Peringatan (saran):\n\n${msg}\n\nApakah Anda tetap ingin melanjutkan perhitungan?`,
        '⚠️ Peringatan Input',
        () => {
          this.proceedCalculation(calculationData);
        },
        () => {
          console.log('Perhitungan dibatalkan oleh pengguna.');
        }
      );
    } else {
      this.proceedCalculation(calculationData);
    }
  },

  proceedCalculation: function(calculationData) {
    const currentFondasiMode = bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] ? bebanMode[currentModuleKey][currentMode] : 'tunggal';
    const autoDimensiKey = `autoDimensi_${currentFondasiMode}`;
    const state = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};

    if (state[autoDimensiKey]) {
      showAlert(
        'Dimensi ditentukan oleh sistem. Perhitungan mungkin akan menjadi lebih lama.',
        '⚠️ Mode Dimensi Otomatis'
      );

      const alertContent = document.getElementById('alertContent');
      const confirmHTML = `
        <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 10px;">
          <button id="cancelProceed" class="btn ghost" style="width: 85px; text-align: center; padding: 8px 12px; display: flex; align-items: center; justify-content: center;">Batal</button>
          <button id="confirmProceed" class="btn" style="background: var(--color-buttons); color: var(--button-text-color, white); width: 85px; text-align: center; padding: 8px 12px; display: flex; align-items: center; justify-content: center;">Lanjutkan</button>
        </div>
      `;

      alertContent.innerHTML += confirmHTML;

      const confirmBtn = document.getElementById('confirmProceed');
      const cancelBtn = document.getElementById('cancelProceed');

      confirmBtn.addEventListener('click', () => {
        closeAlert();

        const missingFields = this.validateFields();
        if (missingFields.length > 0) {
          const fieldList = missingFields.map(field => `• ${field}`).join('\n');
          showAlert(
            `Field berikut belum terisi:\n\n${fieldList}\n\nSilakan lengkapi data terlebih dahulu.`,
            '⚠️ Field Belum Terisi'
          );
          return;
        }

        const calculationDataFinal = this.collectData();
        this.showLoadingSpinner('Melakukan perhitungan...');

        setTimeout(() => {
          this.sendToCalculation(calculationDataFinal);
        }, 100);
      });

      cancelBtn.addEventListener('click', () => {
        closeAlert();
      });
    } else {
      const missingFields = this.validateFields();
      if (missingFields.length > 0) {
        const fieldList = missingFields.map(field => `• ${field}`).join('\n');
        showAlert(
          `Field berikut belum terisi:\n\n${fieldList}\n\nSilakan lengkapi data terlebih dahulu.`,
          '⚠️ Field Belum Terisi'
        );
        return;
      }

      this.sendToCalculation(calculationData);
    }
  },

  validateFields: function() {
    const state = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    const missingFields = [];

    // Data Material
    const quickFc = document.getElementById('quickFc').value;
    const quickFy = document.getElementById('quickFy').value;
    const quickGammaC = document.getElementById('quickGammaC').value;

    if (!quickFc || quickFc.toString().trim() === '') {
      missingFields.push("f'c (Kuat Tekan Beton) - Data Material");
    }
    if (!quickFy || quickFy.toString().trim() === '') {
      missingFields.push("fy (Kuat Leleh Baja) - Data Material");
    }
    if (!quickGammaC || quickGammaC.toString().trim() === '') {
      missingFields.push("ɣc (Berat Jenis Beton) - Data Material");
    }

    const currentFondasiMode = bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] ? bebanMode[currentModuleKey][currentMode] : 'tunggal';

    let autoDimensi = false;
    if (currentMode !== 'evaluasi') {
      const autoDimensiKey = `autoDimensi_${currentFondasiMode}`;
      autoDimensi = state[autoDimensiKey] || false;
    }

    if (!autoDimensi) {
      const dimensiFields = currentFondasiMode === 'tunggal'
        ? ['ly_tunggal', 'lx_tunggal', 'by_tunggal', 'bx_tunggal', 'h_tunggal']
        : ['ly_menerus', 'lx_menerus', 'by_menerus', 'bx_menerus', 'h_menerus'];

      dimensiFields.forEach(field => {
        if (!state[field] || state[field].toString().trim() === '') {
          missingFields.push(`${this.getFieldLabel(field, currentFondasiMode)} (Data Dimensi)`);
        }
      });
    }

    if (currentFondasiMode === 'menerus') {
      if (!state['alpha_s_menerus'] || state['alpha_s_menerus'].toString().trim() === '') {
        missingFields.push("αs (Faktor Letak Fondasi) - Data Dimensi");
      }
    } else if (currentFondasiMode === 'tunggal' && !autoDimensi) {
      if (!state['alpha_s_tunggal'] || state['alpha_s_tunggal'].toString().trim() === '') {
        missingFields.push("αs (Letak Kolom) - Data Dimensi");
      }
    }

    const currentTanahMode = window.tanahMode[currentModuleKey] && window.tanahMode[currentModuleKey][currentMode] ? window.tanahMode[currentModuleKey][currentMode] : 'auto';

    if (currentTanahMode === 'auto') {
      if (!state['df'] || state['df'].toString().trim() === '') {
        missingFields.push("Df (Kedalaman Fondasi) - Data Tanah");
      }
      if (!state['gamma'] || state['gamma'].toString().trim() === '') {
        missingFields.push("ɣ (Berat Jenis Tanah) - Data Tanah");
      }

      const terzaghiChecked = state['terzaghi'] || false;
      const mayerhoffChecked = state['mayerhoff'] || false;

      if (!terzaghiChecked && !mayerhoffChecked) {
        missingFields.push("Pilih minimal satu metode perhitungan (Terzaghi atau Mayerhoff) - Data Tanah");
      }

      if (terzaghiChecked) {
        if (!state['phi'] || state['phi'].toString().trim() === '') {
          missingFields.push("ɸ (Sudut Gesek Dalam) - Data Tanah");
        }
        if (!state['c'] || state['c'].toString().trim() === '') {
          missingFields.push("c (Kohesi) - Data Tanah");
        }
      }

      if (mayerhoffChecked && (!state['qc'] || state['qc'].toString().trim() === '')) {
        missingFields.push("qc (Tahanan Konus Rata-rata) - Data Tanah");
      }
    } else {
      if (!state['qa'] || state['qa'].toString().trim() === '') {
        missingFields.push("qa (Kapasitas Dukung Izin Tanah) - Data Tanah");
      }
      if (!state['df'] || state['df'].toString().trim() === '') {
        missingFields.push("Df (Kedalaman Fondasi) - Data Tanah");
      }
      if (!state['gamma'] || state['gamma'].toString().trim() === '') {
        missingFields.push("ɣ (Berat Jenis Tanah) - Data Tanah");
      }
    }

    const bebanFields = ['pu', 'mux', 'muy'];
    bebanFields.forEach(field => {
      if (state[field] === undefined || state[field].toString().trim() === '') {
        missingFields.push(`${this.getFieldLabel(field)} (Data Beban)`);
      }
    });

    if (currentMode === 'evaluasi') {
      const currentFondasiMode = bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] ? bebanMode[currentModuleKey][currentMode] : 'tunggal';
      let lx, ly;
      if (currentFondasiMode === 'tunggal') {
        lx = state['lx_tunggal'];
        ly = state['ly_tunggal'];
      } else {
        lx = state['lx_menerus'];
        ly = state['ly_menerus'];
      }

      const tulanganFields = this.getTulanganFields(currentFondasiMode, lx, ly);
      tulanganFields.forEach(field => {
        if (!state[field.key] || state[field.key].toString().trim() === '') {
          missingFields.push(`${field.label} (Data Tulangan)`);
        }
      });
    }

    return missingFields;
  },

  getFieldLabel: function(key, fondasiMode = null) {
    const labels = {
      'ly_tunggal': 'Ly (Panjang Fondasi)',
      'lx_tunggal': 'Lx (Lebar Fondasi)',
      'by_tunggal': 'by (Panjang Penampang Kolom)',
      'bx_tunggal': 'bx (Lebar Penampang Kolom)',
      'h_tunggal': 'h (Tebal Fondasi)',
      'alpha_s_tunggal': 'αs (Letak Kolom)',
      'ly_menerus': 'Ly (Panjang Fondasi)',
      'lx_menerus': 'Lx (Lebar Fondasi)',
      'by_menerus': 'by (Panjang Sloof)',
      'bx_menerus': 'bx (Lebar Penampang Sloof)',
      'h_menerus': 'h (Tebal Fondasi)',
      'alpha_s_menerus': 'αs (Faktor Letak Fondasi)',
      'df': 'Df (Kedalaman Fondasi)',
      'gamma': 'ɣ (Berat Jenis Tanah)',
      'phi': 'ɸ (Sudut Gesek Dalam)',
      'c': 'c (Kohesi)',
      'qc': 'qc (Tahanan Konus Rata-rata)',
      'qa': 'qa (Kapasitas Dukung Izin Tanah)',
      'pu': 'Pu (Beban Aksial Ultimit)',
      'mux': 'Mux (Momen Ultimit Arah X)',
      'muy': 'Muy (Momen Ultimit Arah Y)',
      'd': 'D (Diameter Tulangan Utama)',
      'db': 'Db (Diameter Tulangan Bagi)',
      's': 's (Jarak Tulangan Utama)',
      'sb': 'sb (Jarak Tulangan Bagi)',
      'sp': 'sp (Jarak Tulangan Pusat)',
      'st': 'st (Jarak Tulangan Tepi)'
    };
    return labels[key] || key;
  },

  collectData: function() {
    const state = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ?
      {...formState[currentModuleKey][currentMode]} : {};

    const quickInputs = {
      fc: document.getElementById('quickFc').value,
      fy: document.getElementById('quickFy').value,
      gammaC: document.getElementById('quickGammaC').value
    };

    const currentFondasiMode = bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] ? bebanMode[currentModuleKey][currentMode] : 'tunggal';
    const currentTanahMode = window.tanahMode[currentModuleKey] && window.tanahMode[currentModuleKey][currentMode] ? window.tanahMode[currentModuleKey][currentMode] : 'auto';

    let alpha_s_value = '';
    if (currentFondasiMode === 'tunggal' && state['alpha_s_tunggal']) {
      switch(state['alpha_s_tunggal']) {
        case 'Tengah': alpha_s_value = '40'; break;
        case 'Tepi': alpha_s_value = '30'; break;
        case 'Sudut': alpha_s_value = '20'; break;
        default: alpha_s_value = state['alpha_s_tunggal'];
      }
    } else if (currentFondasiMode === 'menerus') {
      alpha_s_value = state['alpha_s_menerus'] || '';
    }

    const autoDimensiKey = `autoDimensi_${currentFondasiMode}`;
    const isAutoDimensi = currentMode !== 'evaluasi' ? (state[autoDimensiKey] || false) : false;

    const calculationData = {
      module: currentModuleKey,
      mode: currentMode,
      fondasi: {
        mode: currentFondasiMode,
        autoDimensi: isAutoDimensi,
        dimensi: {
          ly: isAutoDimensi ? '' : (currentFondasiMode === 'tunggal' ? state['ly_tunggal'] : state['ly_menerus']),
          lx: isAutoDimensi ? '' : (currentFondasiMode === 'tunggal' ? state['lx_tunggal'] : state['lx_menerus']),
          by: currentFondasiMode === 'tunggal' ? state['by_tunggal'] : state['by_menerus'],
          bx: currentFondasiMode === 'tunggal' ? state['bx_tunggal'] : state['bx_menerus'],
          h: isAutoDimensi ? '' : (currentFondasiMode === 'tunggal' ? state['h_tunggal'] : state['h_menerus']),
          alpha_s: alpha_s_value
        }
      },
      tanah: {
        mode: currentTanahMode,
        auto: {
          df: state.df,
          gamma: state.gamma,
          terzaghi: state.terzaghi || false,
          phi: state.phi,
          c: state.c,
          mayerhoff: state.mayerhoff || false,
          qc: state.qc
        },
        manual: {
          qa: state.qa,
          df: state.df,
          gamma: state.gamma
        }
      },
      beban: {
        pu: state.pu,
        mux: state.mux !== undefined && state.mux !== '' ? state.mux : '0',
        muy: state.muy !== undefined && state.muy !== '' ? state.muy : '0'
      },
      material: quickInputs,
      lanjutan: {
        lambda: state.lambda
      }
    };

    if (currentMode === 'evaluasi') {
      let lx, ly;
      if (currentFondasiMode === 'tunggal') {
        lx = state['lx_tunggal'];
        ly = state['ly_tunggal'];
      } else {
        lx = state['lx_menerus'];
        ly = state['ly_menerus'];
      }

      const tulanganFields = this.getTulanganFields(currentFondasiMode, lx, ly);
      calculationData.tulangan = {};
      tulanganFields.forEach(field => {
        calculationData.tulangan[field.key] = state[field.key] || '';
      });
    }

    console.log(`[CALCULATION DATA] autoDimensi: ${isAutoDimensi}, ly: ${calculationData.fondasi.dimensi.ly}, lx: ${calculationData.fondasi.dimensi.lx}, h: ${calculationData.fondasi.dimensi.h}`);

    return calculationData;
  },

  sendToCalculation: function(data) {
    try {
      if (typeof window.calculateFondasi !== 'function') {
        if (data.fondasi.autoDimensi) {
          this.hideLoadingSpinner();
        }
        showAlert(
          "Modul perhitungan fondasi tidak ditemukan. Pastikan calc-fondasi.js sudah di-load.",
          "❌ Module Perhitungan Tidak Ditemukan"
        );
        return;
      }

      const result = window.calculateFondasi(data);

      if (data.fondasi.autoDimensi) {
        this.hideLoadingSpinner();
      }

      if (result && result.status === "sukses") {
        sessionStorage.setItem('calculationResultFondasi', JSON.stringify({
          module: data.module,
          mode: data.mode,
          data: result.data,
          kontrol: result.kontrol,
          rekap: result.rekap,
          optimasi: result.optimasi,
          inputData: data,
          timestamp: result.timestamp || new Date().toISOString(),
          actualFondasiMode: result.data?.actualFondasiMode || null
        }));

        if (typeof saveColorSettings === 'function') {
          saveColorSettings();
        }

        window.location.href = 'report.html';
      } else {
        const errorMessage = result?.message || "Tidak ditemukan fondasi yang memenuhi syarat";
        showAlert(
          `Perhitungan fondasi gagal: ${errorMessage}`,
          "‼️ Alert"
        );
      }

    } catch (error) {
      console.error("Error dalam perhitungan fondasi:", error);

      if (data.fondasi.autoDimensi) {
        this.hideLoadingSpinner();
      }

      showAlert(
        `Terjadi kesalahan dalam perhitungan: ${error.message || 'Error tidak diketahui'}`,
        "❌ Error Perhitungan"
      );
    }
  },

  formatVariablesList: function(data) {
    let variablesList = [];

    variablesList.push("=== DATA MATERIAL ===");
    variablesList.push(`fc: ${data.material.fc} MPa`);
    variablesList.push(`fy: ${data.material.fy} MPa`);
    variablesList.push(`gammaC: ${data.material.gammaC} kN/m³`);

    variablesList.push("\n=== DATA FONDASI ===");
    variablesList.push(`Mode: ${data.fondasi.mode}`);
    variablesList.push(`Auto Dimensi: ${data.fondasi.autoDimensi ? 'Ya' : 'Tidak'}`);

    if (!data.fondasi.autoDimensi) {
      variablesList.push(`Ly: ${data.fondasi.dimensi.ly} m`);
      variablesList.push(`Lx: ${data.fondasi.dimensi.lx} m`);
      variablesList.push(`by: ${data.fondasi.dimensi.by} mm`);
      variablesList.push(`bx: ${data.fondasi.dimensi.bx} mm`);
      variablesList.push(`h: ${data.fondasi.dimensi.h} m`);
      variablesList.push(`alpha_s: ${data.fondasi.dimensi.alpha_s}`);
    }

    variablesList.push("\n=== DATA TANAH ===");
    variablesList.push(`Mode: ${data.tanah.mode}`);

    if (data.tanah.mode === 'auto') {
      variablesList.push(`Df: ${data.tanah.auto.df} m`);
      variablesList.push(`Gamma: ${data.tanah.auto.gamma} kN/m³`);
      variablesList.push(`Terzaghi: ${data.tanah.auto.terzaghi ? 'Aktif' : 'Tidak aktif'}`);
      if (data.tanah.auto.terzaghi) {
        variablesList.push(`Phi: ${data.tanah.auto.phi} °`);
        variablesList.push(`c: ${data.tanah.auto.c} kPa`);
      }
      variablesList.push(`Mayerhoff: ${data.tanah.auto.mayerhoff ? 'Aktif' : 'Tidak aktif'}`);
      if (data.tanah.auto.mayerhoff) {
        variablesList.push(`qc: ${data.tanah.auto.qc} MPa`);
      }
    } else {
      variablesList.push(`qa: ${data.tanah.manual.qa} kN/m²`);
      variablesList.push(`Df: ${data.tanah.manual.df} m`);
      variablesList.push(`Gamma: ${data.tanah.manual.gamma} kN/m³`);
    }

    variablesList.push("\n=== DATA BEBAN ===");
    variablesList.push(`Pu: ${data.beban.pu} kN`);
    variablesList.push(`Mux: ${data.beban.mux} kNm`);
    variablesList.push(`Muy: ${data.beban.muy} kNm`);

    variablesList.push("\n=== DATA LANJUTAN ===");
    variablesList.push(`lambda: ${data.lanjutan.lambda || '1 (default)'}`);

    if (data.mode === 'evaluasi' && data.tulangan) {
      variablesList.push("\n=== DATA TULANGAN ===");
      Object.keys(data.tulangan).forEach(key => {
        variablesList.push(`${key}: ${data.tulangan[key]}`);
      });
    }

    return variablesList.join('\n');
  }
};
