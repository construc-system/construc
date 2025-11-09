// Pastikan objek modules ada di scope global
if (typeof window.modules === 'undefined') {
    window.modules = {};
}

/* ========= MODUL BALOK ========= */
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
      <button class="circle-tips-btn" data-tips="${this.info}">?</button>
    `;
    container.appendChild(headerDiv);

    // Grid fields
    const grid = document.createElement('div');
    grid.className = 'form-grid';
    const fields = this.fields[mode];
    ensureState(currentModuleKey, mode);
    
    fields.forEach(f => {
      const cell = document.createElement('div');
      cell.className = 'field';
      const val = (formState[currentModuleKey] && formState[currentModuleKey][mode] && formState[currentModuleKey][mode][f.key]) || '';

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

    // Tambahkan card Data Beban untuk mode desain
    if (mode === 'desain') {
      this.renderBebanCard(container);
      this.renderLanjutanCard(container);
    }

    // Tambahkan card Data Beban, Data Tulangan, dan Data Lanjutan untuk mode evaluasi
    if (mode === 'evaluasi') {
      this.renderBebanCard(container);
      this.renderTulanganCard(container);
      this.renderLanjutanCard(container);
    }

    // Wire input listeners
    this.wireInputListeners(container, mode);
  },

  removeExistingCards: function() {
    const existingCards = ['tumpuanCard', 'bebanCard', 'tulanganCard', 'lanjutanCard'];
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
        <button class="circle-tips-btn" data-tips="Masukkan beban ultimit untuk kolom.">?</button>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>P<sub>u</sub></label>
          <div class="input-with-unit" data-unit="kN">
            <input data-key="pu" placeholder="Beban Aksial Ultimit" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pu']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>M<sub>u</sub></label>
          <div class="input-with-unit" data-unit="kNm">
            <input data-key="mu" placeholder="Momen Ultimit" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['mu']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>V<sub>u</sub></label>
          <div class="input-with-unit" data-unit="kN">
            <input data-key="vu" placeholder="Gaya Geser Ultimit" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['vu']) || '')}">
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
        <button class="circle-tips-btn" data-tips="Masukkan data tulangan untuk evaluasi kolom.">?</button>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>D</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="d" placeholder="Diameter Tulangan Utama" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['d']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>ɸ</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="phi" placeholder="Diameter Tulangan Begel" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['phi']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>n</label>
          <div class="input-with-unit" data-unit="">
            <input data-key="n" placeholder="Jumlah Tulangan Utama" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['n']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>s</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="s" placeholder="Jarak Tulangan Begel" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['s']) || '')}">
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
    
    lanjutanCard.innerHTML = `
      <div class="card-header-with-collapse">
        <h3>Data Lanjutan</h3>
        <div class="collapse-controls">
          <button class="circle-tips-btn" data-tips="Masukkan data lanjutan untuk perhitungan yang lebih akurat seperti faktor beton dan jumlah kaki begel.">?</button>
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
          <div class="field">
            <label>n</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="n" placeholder="Jumlah Kaki Begel = 2" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['n']) || '')}">
            </div>
          </div>
        </div>
      </div>
    `;
    
    const referenceCard = document.getElementById('tulanganCard') || document.getElementById('bebanCard');
    container.parentNode.insertBefore(lanjutanCard, referenceCard.nextSibling);
    
    // Setup collapse functionality
    this.setupCollapseFunctionality();
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

  wireInputListeners: function(container, mode) {
    container.querySelectorAll('input[data-key], select[data-key]').forEach(input => {
      input.addEventListener('input', (e) => {
        ensureState(currentModuleKey, mode);
        formState[currentModuleKey][mode][input.dataset.key] = input.value;
        updateLog(`set ${currentModuleKey}.${mode}.${input.dataset.key} = ${input.value}`);
      });
    });
  }
};