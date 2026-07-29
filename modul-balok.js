// modul-balok.js - Dengan validasi input lengkap dan tombol konfirmasi sesuai permintaan
if (typeof window.modules === 'undefined') {
    window.modules = {};
}

/* ========= MODUL BALOK ========= */
window.modules.balok = {
  name: 'Balok',
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
  info: "Form Balok: desain untuk menentukan dimensi & tulangan, evaluasi untuk cek tulangan & kapasitas.",

  // ==================== VALIDASI INPUT ====================
  validateBalokInput: function(data) {
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
      const h = checkNumber(data.dimensi.h, "h");
      if (h !== null && h <= 0) errors.push(`tinggi penampang balok (h) harus lebih besar dari 0.`);
      const b = checkNumber(data.dimensi.b, "b");
      if (b !== null && b <= 0) errors.push(`lebar penampang balok (b) harus lebih besar dari 0.`);
      const sb = checkNumber(data.dimensi.sb, "Sb");
      if (sb !== null && sb <= 0) errors.push(`selimut beton (S<sub>b</sub>) harus lebih besar dari 0.`);
      if (b !== null && h !== null && b > h) {
          errors.push(`lebar penampang balok (b=${b}) tidak boleh lebih besar dari tinggi penampang balok (h=${h}).`);
      }

      // 3. Beban (allow zero)
      const checkLoad = (val, fieldLabel, sectionLabel, errorType) => {
          const num = parseNum(val);
          
          // Kita buat format awal teksnya: "Momen ultimit positif pada tumpuan kanan"
          const subjek = `${fieldLabel} pada ${sectionLabel}`;

          if (num === null) {
              errors.push(`${subjek} harus diisi dengan angka meskipun nilainya 0 (gunakan titik untuk desimal).`);
          } else if (num < 0) {
              errors.push(`${subjek} tidak boleh negatif.`);
          }
          return num;
      };

      const sections = ['left', 'center', 'right'];
      const loadFields = ['mu_pos', 'mu_neg', 'vu', 'tu'];

      // 1. Map untuk konversi nama beban/gaya
      const fieldMapping = {
          'mu_pos': 'Momen ultimit positif (M<sub>u</sub><sup>+</sup>)',
          'mu_neg': 'Momen ultimit negatif (M<sub>u</sub><sup>-</sup>)',
          'vu': 'Gaya geser ultimit (V<sub>u</sub>) ',
          'tu': 'Torsi ultimit (T<sub>u</sub>) '
      };

      // 2. Map untuk konversi lokasi struktur
      const sectionMapping = {
          'left': 'tumpuan kiri',
          'center': 'lapangan',
          'right': 'tumpuan kanan'
      };

      sections.forEach(section => {
          const sectionData = data.beban[section] || {};
          const sectionLabel = sectionMapping[section]; // Mengambil istilah lokasi

          loadFields.forEach(field => {
              const fieldLabel = fieldMapping[field]; // Mengambil istilah beban
              
              // Kirim label bahasa Indonesia ke dalam fungsi checkLoad
              checkLoad(sectionData[field], fieldLabel, sectionLabel);
          });
      });

      // 4. Tulangan (only evaluasi)
      if (data.mode === 'evaluasi') {
          const tulangan = data.tulangan || {};
          const D = checkNumber(tulangan.d, "D");
          if (D !== null && D <= 0) errors.push(`"D" harus lebih besar dari 0.`);
          const phi = checkNumber(tulangan.phi, "ɸ");
          if (phi !== null && phi <= 0) errors.push(`"ɸ" harus lebih besar dari 0.`);

          const checkSection = (sectionName) => {
              // Pemetaan istilah bahasa Inggris ke bahasa Indonesia
              const namaBagian = sectionName === 'support' ? 'tumpuan' : 'lapangan';

              const sec = tulangan[sectionName] || {};
              
              // 1. Cek Tulangan Tarik (n)
              const n = checkNumber(sec.n, `${sectionName} n`);
              if (n === null) {
                  errors.push(`Jumlah tulangan tarik (n) pada ${namaBagian} harus diisi.`);
              } else if (n < 2) {
                  errors.push(`Jumlah tulangan tarik (n) pada ${namaBagian} minimum adalah 2 buah (saat ini ${n} buah).`);
              }
              
              // 2. Cek Tulangan Tekan (n')
              const np = checkNumber(sec.np, `${sectionName} n'`);
              if (np === null) {
                  errors.push(`Jumlah tulangan tekan (n') pada ${namaBagian} harus diisi.`);
              } else if (np < 2) {
                  errors.push(`Jumlah tulangan tekan (n') pada ${namaBagian} minimum adalah 2 buah (saat ini ${np} buah).`);
              }
              
              // 3. Cek Jumlah Baris Tulangan (nt)
              const nt = parseNum(sec.nt);
              if (nt !== null && nt < 0) {
                  errors.push(`Jumlah baris tulangan (n<sub>t</sub>) pada ${namaBagian} tidak boleh negatif.`);
              }
              
              // 4. Cek Jarak Bersih (s)
              const s = checkNumber(sec.s, `${sectionName} s`);
              if (s !== null && s <= 0) {
                  errors.push(`Jarak bersih antar tulangan (s) pada ${namaBagian} harus lebih besar dari 0.`);
              }
          };
          
          checkSection('support');
          checkSection('field');
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
      if (b !== null && h !== null) {
          if (b < 150) errors.push(`lebar penampang (b) balok minimum adalah 150 mm.`);
          const ratio = h / b;
          if (ratio < 1.5 || ratio > 3) {
              warnings.push(`Rasio b:h = 1:${ratio.toFixed(2)}, disarankan antara 1:1.5 hingga 1:3.0.`);
          }
      }
      // Beban
      sections.forEach(section => {
          const sectionData = data.beban[section] || {};
          const sectionLabel = sectionMapping[section]; // Mengambil istilah lokasi (misal: "tumpuan kanan")
          
          const mu_pos = parseNum(sectionData.mu_pos) || 0;
          const mu_neg = parseNum(sectionData.mu_neg) || 0;
          const vu = parseNum(sectionData.vu) || 0;
          const tu = parseNum(sectionData.tu) || 0;

          // 1. Validasi Momen (Cek mu_pos dan mu_neg secara spesifik)
          if (mu_pos > 1000) {
              warnings.push(`Momen ultimit positif (M<sub>u</sub><sup>+</sup>) pada ${sectionLabel} sebesar ${mu_pos} kNm tidak wajar, momen ultimit pada umumnya tidak lebih dari 1000 kNm.`);
          }
          if (mu_neg > 1000) {
              warnings.push(`Momen ultimit negatif (M<sub>u</sub><sup>-</sup>) pada ${sectionLabel} sebesar ${mu_neg} kNm tidak wajar, momen ultimit pada umumnya tidak lebih dari 1000 kNm.`);
          }

          // 2. Validasi Gaya Geser (Vu)
          if (vu > 800) {
              warnings.push(`Gaya geser ultimit (V<sub>u</sub>) pada ${sectionLabel} sebesar ${vu} kN tidak wajar, gaya geser pada umumnya tidak lebih dari 800 kN.`);
          }

          // 3. Validasi Torsi (Tu)
          if (tu > 100) {
              warnings.push(`Torsi ultimit (T<sub>u</sub>) pada ${sectionLabel} sebesar ${tu} kNm tidak wajar, torsi pada umumnya tidak lebih dari 100 kNm.`);
          }
      });
      // Tulangan
      if (data.mode === 'evaluasi') {
          const D = parseNum(data.tulangan.d);
          const phi = parseNum(data.tulangan.phi);
          const commonD = [10, 13, 16, 19, 22, 25, 29, 32, 36];
          const commonPhi = [6, 8, 10, 12, 14, 16, 19, 22, 25];
          if (D !== null && !commonD.includes(D)) {
              warnings.push(`Diameter tulangan utama D = ${D} mm tidak umum, disarankan: ${commonD.join(', ')}.`);
          }
          if (phi !== null && !commonPhi.includes(phi)) {
              warnings.push(`Diameter sengkang ɸ = ${phi} mm tidak umum, disarankan: ${commonPhi.join(', ')}.`);
          }
          const checkS = (sectionName) => {
              const sec = data.tulangan[sectionName] || {};
              const s = parseNum(sec.s);
              
              // Mapping untuk mengubah istilah bahasa Inggris ke bahasa Indonesia
              const labelMap = {
                  'support': 'tumpuan',
                  'field': 'lapangan'
              };
              const sectionLabel = labelMap[sectionName] || sectionName;

              // Rule baru: cek apakah s kurang dari 100 ATAU lebih dari 600
              if (s !== null && (s < 100 || s > 600)) {
                  warnings.push(`Jarak sengkang (s) pada tulangan ${sectionLabel} sebesar ${s}mm tidak wajar, jarak yang umum digunakan antara 100-600mm.`);
              }
          };

          checkS('support');
          checkS('field');
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

    if (mode === 'desain') {
      this.renderBebanCard(container);
      this.renderLanjutanCard(container);
    }

    if (mode === 'evaluasi') {
      this.renderBebanCard(container);
      this.renderTulanganCard(container);
      this.renderLanjutanCard(container);
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
      <div class="beban-sections">
        ${this.renderBebanSection('Tumpuan Kiri', 'left')}
        ${this.renderBebanSection('Lapangan', 'center')}
        ${this.renderBebanSection('Tumpuan Kanan', 'right')}
      </div>
    `;
    
    container.parentNode.insertBefore(bebanCard, container.nextSibling);
  },

  renderBebanSection: function(title, prefix) {
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    
    return `
      <div class="beban-section">
        <h3>${title}</h3>
        <div class="form-grid">
          <div class="field">
            <label>M<sub>u</sub><sup>+</sup></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="${prefix}_mu_pos" placeholder="Momen Ultimit Positif" value="${escapeHtml(currentState[`${prefix}_mu_pos`] || '')}">
            </div>
          </div>
          <div class="field">
            <label>M<sub>u</sub><sup>−</sup></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="${prefix}_mu_neg" placeholder="Momen Ultimit Negatif" value="${escapeHtml(currentState[`${prefix}_mu_neg`] || '')}">
            </div>
          </div>
          <div class="field">
            <label>V<sub>u</sub></label>
            <div class="input-with-unit" data-unit="kN">
              <input data-key="${prefix}_vu" placeholder="Gaya Geser Ultimit" value="${escapeHtml(currentState[`${prefix}_vu`] || '')}">
            </div>
          </div>
          <div class="field">
            <label>T<sub>u</sub></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="${prefix}_tu" placeholder="Torsi Ultimit" value="${escapeHtml(currentState[`${prefix}_tu`] || '')}">
            </div>
          </div>
        </div>
      </div>
    `;
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
        <button class="circle-tips-btn" id="tulanganTipsBtn">?</button>
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
      </div>
      <div class="tulangan-sections">
        ${this.renderTulanganSection('Tulangan Tumpuan', 'support')}
        ${this.renderTulanganSection('Tulangan Lapangan', 'field')}
      </div>
    `;
    
    const bebanCard = document.getElementById('bebanCard');
    container.parentNode.insertBefore(tulanganCard, bebanCard.nextSibling);
    
    this.setupTulanganTipsButton();
  },

  setupTulanganTipsButton: function() {
    const tulanganTipsBtn = document.getElementById('tulanganTipsBtn');
    if (tulanganTipsBtn) {
      tulanganTipsBtn.addEventListener('click', function() {
        const tipsContent = document.getElementById('tipsContent');
        tipsContent.innerHTML = `
          <h3>Data Tulangan</h3>
          <div style="line-height: 1.6;">
            <p><strong>n</strong> — Jumlah tulangan tarik, umumnya ditempatkan di bawah pada daerah momen positif (lapangan), dan di atas pada daerah momen negatif (tumpuan).</p>
            <p><strong>n′</strong> — Jumlah tulangan tekan, kebalikan dari tulangan tarik; ditempatkan di sisi berlawanan terhadap posisi tulangan tarik.</p>
            <p><strong>n<sub>t</sub></strong> — Jumlah tulangan torsi, berfungsi menahan puntir atau torsi berlebih pada elemen. Bersifat opsional, tergantung kebutuhan perencanaan.</p>
          </div>
        `;
        document.getElementById('tipsModal').classList.add('active');
        document.addEventListener('keydown', handleEscKey);
      });
    }
  },

  renderTulanganSection: function(title, prefix) {
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    
    return `
      <div class="tulangan-section">
        <h3>${title}</h3>
        <div class="form-grid">
          <div class="field">
            <label>n</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="${prefix}_n" placeholder="Jumlah Tulangan Tarik" value="${escapeHtml(currentState[`${prefix}_n`] || '')}">
            </div>
          </div>
          <div class="field">
            <label>n'</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="${prefix}_np" placeholder="Jumlah Tulangan Tekan" value="${escapeHtml(currentState[`${prefix}_np`] || '')}">
            </div>
          </div>
          <div class="field">
            <label>n<sub>t</sub></label>
            <div class="input-with-unit" data-unit="">
              <input data-key="${prefix}_nt" placeholder="Jumlah Tulangan Torsi (opsional)" value="${escapeHtml(currentState[`${prefix}_nt`] || '')}">
            </div>
          </div>
          <div class="field">
            <label>s</label>
            <div class="input-with-unit" data-unit="mm">
              <input data-key="${prefix}_s" placeholder="Jarak Tulangan Begel" value="${escapeHtml(currentState[`${prefix}_s`] || '')}">
            </div>
          </div>
        </div>
      </div>
    `;
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
            <label>λ</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="lambda" placeholder="Faktor Beton = 1" value="${escapeHtml(currentState['lambda'] || '')}">
            </div>
          </div>
          <div class="field">
            <label>n</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="n" placeholder="Jumlah Kaki Begel = 2" value="${escapeHtml(currentState['n'] || '')}">
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
            <p><strong>λ</strong> — Faktor reduksi kekuatan untuk beton ringan, dimana untuk beton normal nilainya <strong>1.0</strong>, untuk beton ringan sebagian nilainya <strong>0.85</strong>, dan untuk beton ringan penuh nilainya <strong>0.75</strong>. Jika nilainya dikosongi maka akan dianggap sebagai beton normal dengan nilai faktor <strong>1</strong>.</p>
            <p><strong>n</strong> — merupakan jumlah kaki begel, yang digunakan pada balok. Jumlah kaki yang umum dipakai adalah <strong>2</strong>, <strong>3</strong>, dan <strong>4</strong>. Jika nilainya dikosongi maka dihitung dengan jumlah kaki begel sebanyak <strong>2</strong>.</p>
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
      const validation = this.validateBalokInput(calculationData);
      
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
              `Peringatan:\n\n${msg}\n\nApakah Anda tetap ingin melanjutkan perhitungan?`,
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
      // Dapatkan warna tombol dari CSS variable
      const rootStyles = getComputedStyle(document.documentElement);
      const buttonColor = rootStyles.getPropertyValue('--color-buttons').trim() || '#282B53';

      if (typeof showAlert !== 'function') {
          const proceed = confirm(message);
          if (proceed) onConfirm(); else if (onCancel) onCancel();
          return;
      }

      // Tampilkan alert utama
      showAlert(message, title);

      // Tunggu sampai alertContent tersedia, lalu tambahkan tombol
      const checkInterval = setInterval(() => {
          const alertContent = document.getElementById('alertContent');
          const alertModal = document.getElementById('alertModal');
          if (!alertContent || !alertModal || !alertModal.classList.contains('active')) {
              // Jika modal sudah tidak aktif, hentikan interval
              if (!alertModal || !alertModal.classList.contains('active')) {
                  clearInterval(checkInterval);
              }
              return;
          }

          // Cek apakah tombol sudah ada
          if (alertContent.querySelector('.confirm-actions')) {
              clearInterval(checkInterval);
              return;
          }

          // Buat container tombol
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'confirm-actions';
          actionsDiv.style.cssText = `
              margin-top: 20px;
              display: flex;
              justify-content: flex-end;
              gap: 12px;
          `;

          // Tombol Batal: latar putih, outline warna tombol, teks warna tombol, hover warna tombol
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

          // Tombol Lanjutkan: background warna tombol, teks putih
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
        left: {
          mu_pos: state.left_mu_pos,
          mu_neg: state.left_mu_neg,
          vu: state.left_vu,
          tu: state.left_tu
        },
        center: {
          mu_pos: state.center_mu_pos,
          mu_neg: state.center_mu_neg,
          vu: state.center_vu,
          tu: state.center_tu
        },
        right: {
          mu_pos: state.right_mu_pos,
          mu_neg: state.right_mu_neg,
          vu: state.right_vu,
          tu: state.right_tu
        }
      },
      material: quickInputs,
      lanjutan: {
        lambda: state.lambda,
        n: state.n
      }
    };

    if (currentMode === 'evaluasi') {
      calculationData.tulangan = {
        d: state.d,
        phi: state.phi,
        support: {
          n: state.support_n,
          np: state.support_np,
          nt: state.support_nt,
          s: state.support_s
        },
        field: {
          n: state.field_n,
          np: state.field_np,
          nt: state.field_nt,
          s: state.field_s
        }
      };
    }

    return calculationData;
  },

  sendToCalculation: function(data) {
    if (typeof window.calculateBalokWithRedirect === 'function') {
      console.log("🚀 Mengirim data ke calculateBalokWithRedirect...", data);
      window.calculateBalokWithRedirect(data);
    } else if (typeof window.calculateBalok === 'function') {
      console.log("⚠️ Menggunakan calculateBalok lama...");
      const result = window.calculateBalok(data);
      
      if (result.status === "sukses") {
        sessionStorage.setItem('calculationResult', JSON.stringify({
          module: data.module,
          mode: data.mode,
          data: result.data,
          kontrol: result.kontrol,
          rekap: result.rekap,
          kontrol_rekap: result.kontrol_rekap,
          optimasi: result.optimasi,
          inputData: data,
          timestamp: new Date().toISOString()
        }));
        window.location.href = 'report.html';
      } else {
        if (typeof showAlert === 'function') {
          showAlert(`Perhitungan balok gagal: ${result.message || 'Terjadi kesalahan'}`);
        } else {
          alert(`Perhitungan balok gagal: ${result.message || 'Terjadi kesalahan'}`);
        }
      }
    } else {
      const dataStr = JSON.stringify(data, null, 2);
      if (typeof showAlert === 'function') {
        showAlert(
          `Fungsi perhitungan tidak ditemukan.\n\nData yang akan dikirim:\n\n${dataStr}`,
          "‼️ Fungsi Tidak Ditemukan"
        );
      } else {
        alert(`Fungsi perhitungan tidak ditemukan.\n\nData yang akan dikirim:\n\n${dataStr}`);
      }
    }
  }
};