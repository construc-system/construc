// modul-kolom.js - Dengan validasi input lengkap (mirip balok)
// Pastikan objek modules ada di scope global
if (typeof window.modules === 'undefined') {
    window.modules = {};
}

/* ========= MODUL KOLOM ========= */
window.modules.kolom = {
  name: 'Kolom',
  fields: {
    desain: [
      {label:"h", key:"h", placeholder:"Tinggi Penampang", unit:"mm"},
      {label:"b", key:"b", placeholder:"Lebar Penampang", unit:"mm"},
      {label:"S<sub>b</sub>", key:"sb", placeholder:"Selimut Beton", unit:"mm"}
    ],
    evaluasi: [
      {label:"h", key:"h", placeholder:"Tinggi Penampang", unit:"mm"},
      {label:"b", key:"b", placeholder:"Lebar Penampang", unit:"mm"},
      {label:"S<sub>b</sub>", key:"sb", placeholder:"Selimut Beton", unit:"mm"}
    ]
  },
  info: "Kolom: masukkan beban dan dimensi; mode evaluasi berguna untuk pemeriksaan keamanan.",

  // ==================== VALIDASI INPUT KOLOM ====================
  validateKolomInput: function(data) {
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
      const fyt = checkNumber(data.material.fyt, "fyt");
      if (fyt !== null && fyt <= 0) errors.push(`f<sub>yt</sub> harus lebih besar dari 0.`);

      // 2. Dimensi
      const h = checkNumber(data.dimensi.h, "Tinggi penampang kolom (h)");
      if (h !== null && h <= 0) errors.push(`Tinggi penampang kolom (h) harus lebih besar dari 0.`);
      const b = checkNumber(data.dimensi.b, "Lebar penampang kolom (b)");
      if (b !== null && b <= 0) errors.push(`Lebar penampang kolom (b) harus lebih besar dari 0.`);
      const sb = checkNumber(data.dimensi.sb, "Selimut beton (S<sub>b</sub>)");
      if (sb !== null && sb <= 0) errors.push(`Selimut beton (S<sub>b</sub>) harus lebih besar dari 0.`);

      // 3. Beban (allow zero)
      const checkLoad = (val, fieldLabel) => {
          const num = parseNum(val);
          if (num === null) {
              errors.push(`${fieldLabel} harus diisi dengan angka meskipun nilainya 0 (gunakan titik untuk desimal).`);
          } else if (num < 0) {
              errors.push(`${fieldLabel} tidak boleh negatif.`);
          }
          return num;
      };

      const fieldMapping = {
          'pu': 'Beban aksial ultimit (P<sub>u</sub>)',
          'vu': 'Gaya geser ultimit (V<sub>u</sub>)',
          'mux': 'Momen ultimit arah X (M<sub>ux</sub>)',
          'muy': 'Momen ultimit arah Y (M<sub>uy</sub>)'
      };

      const loadFields = ['pu', 'vu', 'mux', 'muy'];
      loadFields.forEach(field => {
          const val = data.beban[field];
          const fieldLabel = fieldMapping[field];
          checkLoad(val, fieldLabel);
      });

      // 4. Tulangan (only evaluasi)
      if (data.mode === 'evaluasi') {
          const tulangan = data.tulangan || {};
          const D = checkNumber(tulangan.d, "Diameter tulangan utama (D)");
          if (D !== null && D <= 0) errors.push(`Diameter tulangan utama (D) harus lebih besar dari 0.`);
          const phi = checkNumber(tulangan.phi, "Diameter sengkang (ɸ)");
          if (phi !== null && phi <= 0) errors.push(`Diameter sengkang (ɸ) harus lebih besar dari 0.`);
          
          const nx = checkNumber(tulangan.nx, "Jumlah tulangan arah X (n<sub>x</sub>)");
          if (nx === null) {
              // Sudah di-handle oleh checkNumber
          } else if (nx < 4) {
              errors.push(`Jumlah tulangan arah X (n<sub>x</sub>) minimum adalah 4 buah (saat ini ${nx} buah).`);
          }
          
          const ny = checkNumber(tulangan.ny, "Jumlah tulangan arah Y (n<sub>y</sub>)");
          if (ny === null) {
              // Sama seperti nx
          } else if (ny < 4) {
              errors.push(`Jumlah tulangan arah Y (n<sub>y</sub>) minimum adalah 4 buah (saat ini ${ny} buah).`);
          }
          
          const s = checkNumber(tulangan.s, "Jarak sengkang (s)");
          if (s !== null && s <= 0) {
              errors.push(`Jarak sengkang (s) harus lebih besar dari 0.`);
          }
      }

      // ========== PERINGATAN (SARAN) ==========
      // Material
      if (fc !== null && (fc < 17 || fc > 60)) {
          const kondisi = fc > 60 ? 'terlalu besar' : 'terlalu kecil';
          warnings.push(`f'<sub>c</sub> dengan nilai ${fc} MPa ${kondisi}, nilai yang umum digunakan antara 17–60 MPa.`);
      }
      if (fy !== null && (fy < 240 || fy > 500)) {
          const kondisi = fy > 500 ? 'terlalu besar' : 'terlalu kecil';
          warnings.push(`f<sub>y</sub> dengan nilai ${fy} MPa ${kondisi}, nilai yang umum digunakan antara 240–500 MPa.`);
      }
      if (fyt !== null && (fyt < 240 || fyt > 400)) {
          const kondisi = fyt > 400 ? 'terlalu besar' : 'terlalu kecil';
          warnings.push(`f<sub>yt</sub> dengan nilai ${fyt} MPa ${kondisi}, nilai yang umum digunakan antara 240–400 MPa.`);
      }
      
      // Dimensi
      if (b !== null && b < 150) {
          warnings.push(`Lebar penampang kolom (b) dengan nilai ${b} mm terlalu kecil, disarankan minimal 150 mm.`);
      }
      if (h !== null && h < 150) {
          warnings.push(`Tinggi penampang kolom (h) dengan nilai ${h} mm terlalu kecil, disarankan minimal 150 mm.`);
      }
      
      // Beban
      const Pu = parseNum(data.beban.pu) || 0;
      if (Pu > 5000) warnings.push(`Beban aksial ultimit (P<sub>u</sub>) sebesar ${Pu} kN tidak wajar, beban aksial pada umumnya tidak lebih dari 5000 kN.`);
      
      const Mux = parseNum(data.beban.mux) || 0;
      if (Mux > 600) warnings.push(`Momen ultimit arah X (M<sub>ux</sub>) sebesar ${Mux} kNm tidak wajar, momen ultimit pada umumnya tidak lebih dari 600 kNm.`);
      
      const Muy = parseNum(data.beban.muy) || 0;
      if (Muy > 600) warnings.push(`Momen ultimit arah Y (M<sub>uy</sub>) sebesar ${Muy} kNm tidak wajar, momen ultimit pada umumnya tidak lebih dari 600 kNm.`);
      
      const Vu = parseNum(data.beban.vu) || 0;
      if (Vu > 300) warnings.push(`Gaya geser ultimit (V<sub>u</sub>) sebesar ${Vu} kN tidak wajar, gaya geser pada umumnya tidak lebih dari 300 kN.`);

      // Tulangan
      if (data.mode === 'evaluasi') {
          const D = parseNum(data.tulangan.d);
          const phi = parseNum(data.tulangan.phi);
          const commonD = [10, 13, 16, 19, 22, 25, 29, 32, 36];
          const commonPhi = [6, 8, 10, 12, 14, 16, 19, 22, 25];
          
          if (D !== null && !commonD.includes(D)) {
              warnings.push(`Diameter tulangan utama (D) sebesar ${D} mm tidak umum, disarankan: ${commonD.join(', ')}.`);
          }
          if (phi !== null && !commonPhi.includes(phi)) {
              warnings.push(`Diameter sengkang (ɸ) sebesar ${phi} mm tidak umum, disarankan: ${commonPhi.join(', ')}.`);
          }
          
          const s = parseNum(data.tulangan.s);
          if (s !== null && (s < 100 || s > 600)) {
              warnings.push(`Jarak sengkang (s) sebesar ${s} mm tidak wajar, jarak yang umum digunakan antara 100–600 mm.`);
          }
      }

      return { errors, warnings };
  },

  // ==================== RENDER ====================
  render: function(container, mode) {
    container.innerHTML = '';
    
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
    `;
    container.appendChild(headerDiv);

    // Grid fields
    const grid = document.createElement('div');
    grid.className = 'form-grid';
    const fields = this.fields[mode];
    ensureState(currentModuleKey, mode);
    
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][mode] ? formState[currentModuleKey][mode] : {};
    
    fields.forEach(f => {
      const cell = document.createElement('div');
      cell.className = 'field';
      const val = currentState[f.key] || '';

      const inputContainer = document.createElement('div');
      inputContainer.className = 'input-with-unit';
      inputContainer.setAttribute('data-unit', f.unit || '');

      const input = document.createElement('input');
      input.setAttribute('data-key', f.key);
      input.setAttribute('placeholder', escapeHtml(f.placeholder));
      input.value = escapeHtml(val);

      inputContainer.appendChild(input);
      cell.innerHTML = `<label>${f.label}</label>`;
      cell.appendChild(inputContainer);
      grid.appendChild(cell);
    });
    container.appendChild(grid);

    this.removeExistingCards();

    // Beban card
    this.renderBebanCard(container);
    // Lanjutan card
    this.renderLanjutanCard(container);
    // Tulangan card hanya untuk evaluasi
    if (mode === 'evaluasi') {
      this.renderTulanganCard(container);
    }

    this.setupCalculateButton();
  },

  removeExistingCards: function() {
    const existingCards = ['bebanCard', 'tulanganCard', 'lanjutanCard', 'tanahCard'];
    existingCards.forEach(cardId => {
      const card = document.getElementById(cardId);
      if (card) card.remove();
    });
  },

  renderBebanCard: function(container) {
    const bebanCard = document.createElement('div');
    bebanCard.className = 'card';
    bebanCard.id = 'bebanCard';
    
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    
    bebanCard.innerHTML = `
      <div class="card-header-with-tips">
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
            <input data-key="pu" placeholder="Beban Aksial Ultimit" value="${escapeHtml(currentState['pu'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>V<sub>u</sub></label>
          <div class="input-with-unit" data-unit="kN">
            <input data-key="vu" placeholder="Gaya Geser Ultimit" value="${escapeHtml(currentState['vu'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>M<sub>ux</sub></label>
          <div class="input-with-unit" data-unit="kNm">
            <input data-key="mux" placeholder="Momen Ultimit Arah X" value="${escapeHtml(currentState['mux'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>M<sub>uy</sub></label>
          <div class="input-with-unit" data-unit="kNm">
            <input data-key="muy" placeholder="Momen Ultimit Arah Y" value="${escapeHtml(currentState['muy'] || '')}">
          </div>
        </div>
      </div>
    `;
    
    container.parentNode.insertBefore(bebanCard, container.nextSibling);
  },

  renderTulanganCard: function(container) {
    const tulanganCard = document.createElement('div');
    tulanganCard.className = 'card';
    tulanganCard.id = 'tulanganCard';
    
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    
    tulanganCard.innerHTML = `
      <div class="card-header-with-tips">
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
        <div class="field">
          <label>D</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="d" placeholder="Diameter Tulangan Utama" value="${escapeHtml(currentState['d'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>ɸ</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="phi" placeholder="Diameter Tulangan Begel" value="${escapeHtml(currentState['phi'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>n<sub>x</sub></label>
          <div class="input-with-unit" data-unit="">
            <input data-key="nx" placeholder="Jumlah Tulangan Arah X" value="${escapeHtml(currentState['nx'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>n<sub>y</sub></label>
          <div class="input-with-unit" data-unit="">
            <input data-key="ny" placeholder="Jumlah Tulangan Arah Y" value="${escapeHtml(currentState['ny'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>s</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="s" placeholder="Jarak Tulangan Begel" value="${escapeHtml(currentState['s'] || '')}">
          </div>
        </div>
      </div>
    `;
    
    const bebanCard = document.getElementById('bebanCard');
    container.parentNode.insertBefore(tulanganCard, bebanCard.nextSibling);
  },

  renderLanjutanCard: function(container) {
    const lanjutanCard = document.createElement('div');
    lanjutanCard.className = 'card';
    lanjutanCard.id = 'lanjutanCard';
    
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    
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
            <label>&#x03BB;</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="lambda" placeholder="Faktor Beton = 1" value="${escapeHtml(currentState['lambda'] || '')}">
            </div>
          </div>
          <div class="field">
            <label>n</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="n_kaki" placeholder="Jumlah Kaki Begel = 2" value="${escapeHtml(currentState['n_kaki'] || '')}">
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
            <p><strong>&#x03BB;</strong> &mdash; Faktor reduksi kekuatan untuk beton ringan, dimana untuk beton normal nilainya <strong>1.0</strong>, untuk beton ringan sebagian nilainya <strong>0.85</strong>, dan untuk beton ringan penuh nilainya <strong>0.75</strong>. Jika nilainya dikosongi maka akan dianggap sebagai beton normal dengan nilai faktor <strong>1</strong>.</p>
            <p><strong>n</strong> &mdash; merupakan jumlah kaki begel, yang digunakan pada kolom. Jumlah kaki yang umum dipakai adalah <strong>2</strong>, <strong>3</strong>, dan <strong>4</strong>. Jika nilainya dikosongi maka dihitung dengan jumlah kaki begel sebanyak <strong>2</strong>.</p>
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

  // ========== FUNGSI VALIDASI DAN HITUNG ==========

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
      const validation = this.validateKolomInput(calculationData);
      
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
                  this.sendToCalculation(calculationData);
              },
              () => {
                  console.log('Perhitungan dibatalkan oleh pengguna.');
              }
          );
      } else {
          this.sendToCalculation(calculationData);
      }
  },

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

  collectData: function() {
    const state = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? 
      {...formState[currentModuleKey][currentMode]} : {};
    
    const quickInputs = {
      fc: document.getElementById('quickFc').value,
      fy: document.getElementById('quickFy').value,
      fyt: document.getElementById('quickFyt').value
    };

    const calculationData = {
      module: currentModuleKey,
      mode: currentMode,
      dimensi: {
        h: state.h,
        b: state.b,
        sb: state.sb
      },
      beban: {
        pu: state.pu,
        vu: state.vu,
        mux: state.mux,
        muy: state.muy
      },
      material: quickInputs,
      lanjutan: {
        lambda: state.lambda || '1',
        n_kaki: state.n_kaki || '2'
      }
    };

    if (currentMode === 'evaluasi') {
      calculationData.tulangan = {
        d: state.d,
        phi: state.phi,
        nx: state.nx,
        ny: state.ny,
        s: state.s
      };
    }

    return calculationData;
  },

  sendToCalculation: function(data) {
    if (typeof window.calculateKolomWithRedirect === 'function') {
      console.log("🚀 Mengirim data ke calculateKolomWithRedirect...", data);
      window.calculateKolomWithRedirect(data);
    } else if (typeof window.calculateKolom === 'function') {
      console.log("⚠️ Menggunakan calculateKolom lama...");
      const result = window.calculateKolom(data);
      
      if (result.status === "sukses") {
        sessionStorage.setItem('calculationResultKolom', JSON.stringify({
          module: data.module,
          mode: data.mode,
          data: result.data,
          kontrol: result.kontrol,
          rekap: result.rekap,
          inputData: data,
          timestamp: new Date().toISOString()
        }));
        window.location.href = 'report.html';
      } else {
        if (typeof showAlert === 'function') {
          showAlert(`Perhitungan gagal: ${result.message || 'Terjadi kesalahan'}`);
        } else {
          alert(`Perhitungan gagal: ${result.message || 'Terjadi kesalahan'}`);
        }
      }
    } else {
      const dataStr = JSON.stringify(data, null, 2);
      const variablesList = this.formatVariablesList(data);
      if (typeof showAlert === 'function') {
        showAlert(
          `calc-kolom.js tidak ditemukan.\n\nData yang akan dikirim ke calc-kolom.js:\n\n${dataStr}\n\n=== VARIABEL YANG TERSEDIA ===\n${variablesList}`,
          "‼️ calc-kolom.js Tidak Ditemukan"
        );
      } else {
        alert(`calc-kolom.js tidak ditemukan.\n\nData yang akan dikirim:\n\n${dataStr}`);
      }
      updateLog(`Calculation data for ${currentModuleKey}.${currentMode}:`, data);
    }
  },

  formatVariablesList: function(data) {
    let variablesList = [];
    variablesList.push("=== DATA MATERIAL ===");
    variablesList.push(`fc: ${data.material.fc} MPa`);
    variablesList.push(`fy: ${data.material.fy} MPa`);
    variablesList.push(`fyt: ${data.material.fyt} MPa`);
    variablesList.push("\n=== DATA DIMENSI ===");
    variablesList.push(`h: ${data.dimensi.h} mm`);
    variablesList.push(`b: ${data.dimensi.b} mm`);
    variablesList.push(`sb: ${data.dimensi.sb} mm`);
    variablesList.push("\n=== DATA BEBAN ===");
    variablesList.push(`Pu: ${data.beban.pu} kN`);
    variablesList.push(`Vu: ${data.beban.vu} kN`);
    variablesList.push(`Mux: ${data.beban.mux} kNm`);
    variablesList.push(`Muy: ${data.beban.muy} kNm`);
    variablesList.push("\n=== DATA LANJUTAN ===");
    variablesList.push(`lambda: ${data.lanjutan.lambda || '1 (default)'}`);
    variablesList.push(`n_kaki: ${data.lanjutan.n_kaki || '2 (default)'}`);
    if (data.mode === 'evaluasi' && data.tulangan) {
      variablesList.push("\n=== DATA TULANGAN ===");
      variablesList.push(`d: ${data.tulangan.d} mm`);
      variablesList.push(`phi: ${data.tulangan.phi} mm`);
      variablesList.push(`nx: ${data.tulangan.nx}`);
      variablesList.push(`ny: ${data.tulangan.ny}`);
      variablesList.push(`s: ${data.tulangan.s} mm`);
    }
    return variablesList.join('\n');
  }
};
