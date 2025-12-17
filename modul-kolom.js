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
    
    // Dapatkan state saat ini untuk mengisi nilai
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

    // Hapus card yang mungkin sudah ada
    this.removeExistingCards();

    // Tambahkan card Data Beban untuk kedua mode
    this.renderBebanCard(container);
    
    // Tambahkan card Data Lanjutan untuk kedua mode
    this.renderLanjutanCard(container);

    // Tambahkan card Data Tulangan hanya untuk mode evaluasi
    if (mode === 'evaluasi') {
      this.renderTulanganCard(container);
    }

    // Setup calculate button handler
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
    
    // Dapatkan state saat ini untuk mengisi nilai
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
          <label>M<sub>u</sub></label>
          <div class="input-with-unit" data-unit="kNm">
            <input data-key="mu" placeholder="Momen Ultimit" value="${escapeHtml(currentState['mu'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>V<sub>u</sub></label>
          <div class="input-with-unit" data-unit="kN">
            <input data-key="vu" placeholder="Gaya Geser Ultimit" value="${escapeHtml(currentState['vu'] || '')}">
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
    
    // Dapatkan state saat ini untuk mengisi nilai
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
          <label>n</label>
          <div class="input-with-unit" data-unit="">
            <input data-key="n" placeholder="Jumlah Tulangan Utama" value="${escapeHtml(currentState['n'] || '')}">
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
    
    // Dapatkan state saat ini untuk mengisi nilai
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
              <input data-key="n_kaki" placeholder="Jumlah Kaki Begel = 2" value="${escapeHtml(currentState['n_kaki'] || '')}">
            </div>
          </div>
        </div>
      </div>
    `;
    
    const referenceCard = document.getElementById('tulanganCard') || document.getElementById('bebanCard');
    container.parentNode.insertBefore(lanjutanCard, referenceCard.nextSibling);
    
    // Setup collapse functionality
    this.setupCollapseFunctionality();
    
    // Setup tips button khusus untuk Data Lanjutan
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
            <p><strong>n</strong> — merupakan jumlah kaki begel, yang digunakan pada kolom. Jumlah kaki yang umum dipakai adalah <strong>2</strong>, <strong>3</strong>, dan <strong>4</strong>. Jika nilainya dikosongi maka dihitung dengan jumlah kaki begel sebanyak <strong>2</strong>.</p>
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

  // ========== FUNGSI VALIDASI DAN HITUNG UNTUK KOLOM ==========

  setupCalculateButton: function() {
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
      // Hapus event listener lama jika ada
      calculateBtn.replaceWith(calculateBtn.cloneNode(true));
      
      // Tambahkan event listener baru
      document.getElementById('calculateBtn').addEventListener('click', () => {
        this.handleCalculate();
      });
    }
  },

  handleCalculate: function() {
    // Validasi field wajib
    const missingFields = this.validateFields();
    
    if (missingFields.length > 0) {
      const fieldList = missingFields.map(field => `• ${field}`).join('\n');
      showAlert(`Field berikut belum terisi:\n\n${fieldList}\n\nSilakan lengkapi data terlebih dahulu.`);
      return;
    }

    // Kumpulkan semua data
    const calculationData = this.collectData();
    
    // Kirim data ke modul perhitungan
    this.sendToCalculation(calculationData);
  },

  validateFields: function() {
    const state = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    const missingFields = [];

    // Validasi Data Material
    const quickFc = document.getElementById('quickFc').value;
    const quickFy = document.getElementById('quickFy').value;
    const quickFyt = document.getElementById('quickFyt').value;

    if (!quickFc || quickFc.toString().trim() === '') {
      missingFields.push("f'c (Kuat Tekan Beton) - Data Material");
    }
    if (!quickFy || quickFy.toString().trim() === '') {
      missingFields.push("fy (Kuat Leleh Baja) - Data Material");
    }
    if (!quickFyt || quickFyt.toString().trim() === '') {
      missingFields.push("fyt (Kuat Leleh Baja Begel) - Data Material");
    }

    // Field wajib dari Data Dimensi
    const dimensiFields = ['h', 'b', 'sb'];
    dimensiFields.forEach(field => {
      if (!state[field] || state[field].toString().trim() === '') {
        missingFields.push(`${this.getFieldLabel(field)} (Data Dimensi)`);
      }
    });

    // Field wajib dari Data Beban
    const bebanFields = ['pu', 'mu', 'vu'];
    bebanFields.forEach(field => {
      if (!state[field] || state[field].toString().trim() === '') {
        missingFields.push(`${this.getBebanFieldLabel(field)} (Data Beban)`);
      }
    });

    // Field wajib dari Data Tulangan (hanya untuk mode evaluasi)
    if (currentMode === 'evaluasi') {
      const tulanganFields = ['d', 'phi', 'n', 's'];
      tulanganFields.forEach(field => {
        if (!state[field] || state[field].toString().trim() === '') {
          missingFields.push(`${this.getTulanganFieldLabel(field)} (Data Tulangan)`);
        }
      });
    }

    return missingFields;
  },

  getFieldLabel: function(key) {
    const labels = {
      'h': 'h (Tinggi Penampang)',
      'b': 'b (Lebar Penampang)',
      'sb': 'Sb (Selimut Beton)'
    };
    return labels[key] || key;
  },

  getBebanFieldLabel: function(field) {
    const labels = {
      'pu': 'Pu (Beban Aksial Ultimit)',
      'mu': 'Mu (Momen Ultimit)',
      'vu': 'Vu (Gaya Geser Ultimit)'
    };
    return labels[field] || field;
  },

  getTulanganFieldLabel: function(field) {
    const labels = {
      'd': 'D (Diameter Tulangan Utama)',
      'phi': 'ɸ (Diameter Tulangan Begel)',
      'n': 'n (Jumlah Tulangan Utama)',
      's': 's (Jarak Tulangan Begel)'
    };
    return labels[field] || field;
  },

  collectData: function() {
    const state = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? 
      {...formState[currentModuleKey][currentMode]} : {};
    
    const quickInputs = {
      fc: document.getElementById('quickFc').value,
      fy: document.getElementById('quickFy').value,
      fyt: document.getElementById('quickFyt').value
    };

    // Data yang akan dikirim ke calc-kolom.js
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
        mu: state.mu,
        vu: state.vu
      },
      material: quickInputs,
      lanjutan: {
        lambda: state.lambda || '1', // default value jika kosong
        n_kaki: state.n_kaki || '2'  // default value jika kosong
      }
    };

    // Tambahkan data tulangan hanya untuk mode evaluasi
    if (currentMode === 'evaluasi') {
      calculationData.tulangan = {
        d: state.d,
        phi: state.phi,
        n: state.n,
        s: state.s
      };
    }

    return calculationData;
  },

  sendToCalculation: function(data) {
    // Gunakan fungsi yang langsung redirect seperti pada modul balok
    if (typeof window.calculateKolomWithRedirect === 'function') {
      console.log("🚀 Mengirim data ke calculateKolomWithRedirect...", data);
      window.calculateKolomWithRedirect(data);
    } else if (typeof window.calculateKolom === 'function') {
      // Fallback ke fungsi lama - PERBAIKAN: gunakan key yang berbeda
      console.log("⚠️ Menggunakan calculateKolom lama...");
      const result = window.calculateKolom(data);
      
      if (result.status === "sukses") {
        // PERBAIKAN: Gunakan key yang berbeda untuk kolom
        sessionStorage.setItem('calculationResultKolom', JSON.stringify({
          module: data.module,
          mode: data.mode,
          data: result.data,
          kontrol: result.kontrol,
          rekap: result.rekap,
          inputData: data,
          timestamp: new Date().toISOString()
        }));
        
        // Redirect manual
        window.location.href = 'report.html';
      } else {
        showAlert(`Perhitungan gagal: ${result.message || 'Terjadi kesalahan'}`);
      }
    } else {
      const dataStr = JSON.stringify(data, null, 2);
      const variablesList = this.formatVariablesList(data);
      
      showAlert(
        `calc-kolom.js tidak ditemukan.\n\nData yang akan dikirim ke calc-kolom.js:\n\n${dataStr}\n\n=== VARIABEL YANG TERSEDIA ===\n${variablesList}`,
        "‼️ calc-kolom.js Tidak Ditemukan"
      );
      
      // Untuk testing, tampilkan di console
      updateLog(`Calculation data for ${currentModuleKey}.${currentMode}:`, data);
    }
  },

  formatVariablesList: function(data) {
    let variablesList = [];
    
    // Data Material
    variablesList.push("=== DATA MATERIAL ===");
    variablesList.push(`fc: ${data.material.fc} MPa`);
    variablesList.push(`fy: ${data.material.fy} MPa`);
    variablesList.push(`fyt: ${data.material.fyt} MPa`);
    
    // Data Dimensi
    variablesList.push("\n=== DATA DIMENSI ===");
    variablesList.push(`h: ${data.dimensi.h} mm`);
    variablesList.push(`b: ${data.dimensi.b} mm`);
    variablesList.push(`sb: ${data.dimensi.sb} mm`);
    
    // Data Beban
    variablesList.push("\n=== DATA BEBAN ===");
    variablesList.push(`Pu: ${data.beban.pu} kN`);
    variablesList.push(`Mu: ${data.beban.mu} kNm`);
    variablesList.push(`Vu: ${data.beban.vu} kN`);
    
    // Data Lanjutan
    variablesList.push("\n=== DATA LANJUTAN ===");
    variablesList.push(`lambda: ${data.lanjutan.lambda || '1 (default)'}`);
    variablesList.push(`n_kaki (kaki begel): ${data.lanjutan.n_kaki || '2 (default)'}`);
    
    // Data Tulangan (hanya untuk evaluasi)
    if (data.mode === 'evaluasi' && data.tulangan) {
      variablesList.push("\n=== DATA TULANGAN ===");
      variablesList.push(`d: ${data.tulangan.d} mm`);
      variablesList.push(`phi: ${data.tulangan.phi} mm`);
      variablesList.push(`n: ${data.tulangan.n}`);
      variablesList.push(`s: ${data.tulangan.s} mm`);
    }
    
    return variablesList.join('\n');
  }
};