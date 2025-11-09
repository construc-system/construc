// Pastikan objek modules ada di scope global
if (typeof window.modules === 'undefined') {
    window.modules = {};
}

/* ========= MODUL PELAT ========= */
window.modules.pelat = {
  name: 'Pelat',
  fields: {
    desain: [
      {label:"L<sub>y</sub>", key:"ly", placeholder:"Panjang Pelat", unit:"m"},
      {label:"L<sub>x</sub>", key:"lx", placeholder:"Lebar Pelat", unit:"m"},
      {label:"h", key:"h", placeholder:"Tebal Pelat", unit:"mm"},
      {label:"S<sub>b</sub>", key:"sb", placeholder:"Selimut Beton", unit:"mm"}
    ],
    evaluasi: [
      {label:"L<sub>y</sub>", key:"ly", placeholder:"Panjang Pelat", unit:"m"},
      {label:"L<sub>x</sub>", key:"lx", placeholder:"Lebar Pelat", unit:"m"},
      {label:"h", key:"h", placeholder:"Tebal Pelat", unit:"mm"},
      {label:"S<sub>b</sub>", key:"sb", placeholder:"Selimut Beton", unit:"mm"}
    ]
  },
  info: "Pelat: gunakan input DL/LL untuk memodelkan beban lalu hitung momen desain.",
  
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
    const existingCards = ['bebanCard', 'tulanganCard', 'lanjutanCard'];
    existingCards.forEach(cardId => {
      const card = document.getElementById(cardId);
      if (card) card.remove();
    });
  },

renderBebanCard: function(container) {
    const bebanCard = document.createElement('div');
    bebanCard.className = 'card';
    bebanCard.id = 'bebanCard';
    
    if (currentMode === 'desain') {
      // Inisialisasi bebanMode jika belum ada
      if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
      if (!bebanMode[currentModuleKey][currentMode]) bebanMode[currentModuleKey][currentMode] = 'auto';
      const currentBebanMode = bebanMode[currentModuleKey][currentMode];
      const muValue = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['mu']) || '';
      const quValue = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['qu']) || '';
      
      bebanCard.innerHTML = `
        <div class="card-header-with-tips">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-weight-icon lucide-weight">
              <circle cx="12" cy="5" r="3"/>
              <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>
            </svg>
            Data Beban
          </h2>
          <button class="circle-tips-btn" data-tips="Pilih mode Auto untuk perhitungan otomatis berdasarkan DL/LL, atau Manual untuk input Mu langsung.">?</button>
        </div>
        <div class="form-grid">
          <div class="field">
            <div class="mode-toggle" style="display: flex; gap: 8px;">
              <button class="toggle-btn ${currentBebanMode === 'auto' ? 'active' : ''}" data-beban-mode="auto" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 120px;">
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
              <button class="toggle-btn ${currentBebanMode === 'manual' ? 'active' : ''}" data-beban-mode="manual" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 120px;">
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
        
        <!-- Tambahkan jarak antara toggle dan konten -->
        </div>

        <!-- Tambahkan jarak antara toggle dan dropdown -->
        <div style="margin-top: 16px;"></div>

        ${currentBebanMode === 'auto' ? `
        <div class="form-grid auto-content">
          <div class="field">
            <label>tp</label>
            <div class="custom-dropdown" id="bebanTumpuanDropdown">
              <div class="dropdown-selected" id="bebanTumpuanDropdownSelected">
                <span>${(formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['beban_tp']) || 'Pilih Jenis Tumpuan'}</span>
              </div>
              <div class="dropdown-options" id="bebanTumpuanDropdownOptions">
                <div class="dropdown-option" data-value="Terjepit Penuh">Terjepit Penuh</div>
                <div class="dropdown-option" data-value="Menerus / Terjepit Elastis">Menerus / Terjepit Elastis</div>
                <div class="dropdown-option clear-option" data-value="clear">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2">
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    <path d="M3 6h18"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="field">
            <label>q<sub>u</sub></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="qu" placeholder="Beban Ultimit" value="${escapeHtml(quValue)}">
            </div>
          </div>
        </div>
        <div style="margin-top: 16px;"></div>
        <div class="pattern-container">
          <div class="pattern-box-top pattern-box-clickable ${((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pattern_boxes'] && formState[currentModuleKey][currentMode]['pattern_boxes']['top']) ? 'pattern-box-plain' : '')}"></div>
          <div class="pattern-middle-row">
            <div class="pattern-box-left pattern-box-clickable ${((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pattern_boxes'] && formState[currentModuleKey][currentMode]['pattern_boxes']['left']) ? 'pattern-box-plain' : '')}"></div>
            <div class="sand-texture-box"></div>
            <div class="pattern-box-right pattern-box-clickable ${((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pattern_boxes'] && formState[currentModuleKey][currentMode]['pattern_boxes']['right']) ? 'pattern-box-plain' : '')}"></div>
          </div>
          <div class="pattern-box-bottom pattern-box-clickable ${((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pattern_boxes'] && formState[currentModuleKey][currentMode]['pattern_boxes']['bottom']) ? 'pattern-box-plain' : '')}"></div>
        </div>
        ` : ''}

        ${currentBebanMode === 'manual' ? `
        <div class="form-grid manual-content">
          <div class="field">
            <label>M<sub>u</sub></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="mu" placeholder="Momen Ultimit" value="${escapeHtml(muValue)}">
            </div>
          </div>
        </div>
        ` : ''}
      `;
    } else {
      // Inisialisasi bebanMode jika belum ada
      if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
      if (!bebanMode[currentModuleKey][currentMode]) bebanMode[currentModuleKey][currentMode] = 'auto';
      const currentBebanMode = bebanMode[currentModuleKey][currentMode];
      const muValue = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['mu']) || '';
      const quValue = (formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['qu']) || '';

      bebanCard.innerHTML = `
        <div class="card-header-with-tips">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-weight-icon lucide-weight">
              <circle cx="12" cy="5" r="3"/>
              <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>
            </svg>
            Data Beban
          </h2>
          <button class="circle-tips-btn" data-tips="Pilih mode Auto untuk perhitungan otomatis berdasarkan DL/LL, atau Manual untuk input Mu langsung.">?</button>
        </div>
        <div class="form-grid">
          <div class="field">
            <div class="mode-toggle" style="display: flex; gap: 8px;">
              <button class="toggle-btn ${currentBebanMode === 'auto' ? 'active' : ''}" data-beban-mode="auto" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 120px;">
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
              <button class="toggle-btn ${currentBebanMode === 'manual' ? 'active' : ''}" data-beban-mode="manual" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 120px;">
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

        <!-- Tambahkan jarak antara toggle dan konten -->
        </div>

        <!-- Tambahkan jarak antara toggle dan dropdown -->
        <div style="margin-top: 16px;"></div>

        ${currentBebanMode === 'auto' ? `
        <div class="form-grid auto-content">
          <div class="field">
            <label>tp</label>
            <div class="custom-dropdown" id="bebanTumpuanDropdown">
              <div class="dropdown-selected" id="bebanTumpuanDropdownSelected">
                <span>${(formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['beban_tp']) || 'Pilih Jenis Tumpuan'}</span>
              </div>
              <div class="dropdown-options" id="bebanTumpuanDropdownOptions">
                <div class="dropdown-option" data-value="Terjepit Penuh">Terjepit Penuh</div>
                <div class="dropdown-option" data-value="Menerus / Terjepit Elastis">Menerus / Terjepit Elastis</div>
                <div class="dropdown-option clear-option" data-value="clear">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2">
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    <path d="M3 6h18"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="field">
            <label>q<sub>u</sub></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="qu" placeholder="Beban Ultimit" value="${escapeHtml(quValue)}">
            </div>
          </div>
        </div>
        <div style="margin-top: 16px;"></div>
        <div class="pattern-container">
          <div class="pattern-box-top pattern-box-clickable ${((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pattern_boxes'] && formState[currentModuleKey][currentMode]['pattern_boxes']['top']) ? 'pattern-box-plain' : '')}"></div>
          <div class="pattern-middle-row">
            <div class="pattern-box-left pattern-box-clickable ${((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pattern_boxes'] && formState[currentModuleKey][currentMode]['pattern_boxes']['left']) ? 'pattern-box-plain' : '')}"></div>
            <div class="sand-texture-box"></div>
            <div class="pattern-box-right pattern-box-clickable ${((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pattern_boxes'] && formState[currentModuleKey][currentMode]['pattern_boxes']['right']) ? 'pattern-box-plain' : '')}"></div>
          </div>
          <div class="pattern-box-bottom pattern-box-clickable ${((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['pattern_boxes'] && formState[currentModuleKey][currentMode]['pattern_boxes']['bottom']) ? 'pattern-box-plain' : '')}"></div>
        </div>
        ` : ''}

        ${currentBebanMode === 'manual' ? `
        <div class="form-grid manual-content">
          <div class="field">
            <label>M<sub>u</sub></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="mu" placeholder="Momen Ultimit" value="${escapeHtml(muValue)}">
            </div>
          </div>
        </div>
        ` : ''}
      `;
    }
    
    container.parentNode.insertBefore(bebanCard, container.nextSibling);

    // Setup beban mode toggle untuk pelat desain dan evaluasi
    if (currentMode === 'desain' || currentMode === 'evaluasi') {
      this.setupBebanModeToggle();
      this.initBebanTumpuanDropdown();
      this.setupPatternBoxToggle();
    }
  },

  renderBebanSection: function(title, prefix) {
    return `
      <div class="beban-section">
        <h3>${title}</h3>
        <div class="form-grid">
          <div class="field">
            <label>M<sub>u</sub><sup>+</sup></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="${prefix}_mu_pos" placeholder="Momen Ultimit Positif" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][`${prefix}_mu_pos`]) || '')}">
            </div>
          </div>
          <div class="field">
            <label>M<sub>u</sub><sup>−</sup></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="${prefix}_mu_neg" placeholder="Momen Ultimit Negatif" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][`${prefix}_mu_neg`]) || '')}">
            </div>
          </div>
          <div class="field">
            <label>V<sub>u</sub></label>
            <div class="input-with-unit" data-unit="kN">
              <input data-key="${prefix}_vu" placeholder="Gaya Geser Ultimit" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][`${prefix}_vu`]) || '')}">
            </div>
          </div>
          <div class="field">
            <label>T<sub>u</sub></label>
            <div class="input-with-unit" data-unit="kNm">
              <input data-key="${prefix}_tu" placeholder="Torsi Ultimit" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][`${prefix}_tu`]) || '')}">
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
        <button class="circle-tips-btn" data-tips="Masukkan data tulangan untuk evaluasi pelat.">?</button>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>D</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="d" placeholder="Diameter Tulangan Utama" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['d']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>D<sub>b</sub></label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="db" placeholder="Diameter Tulangan Bagi" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['db']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>s</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="s" placeholder="Jarak Tulangan Utama" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['s']) || '')}">
          </div>
        </div>
        <div class="field">
          <label>s<sub>b</sub></label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="sb" placeholder="Jarak Tulangan Bagi" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode]['sb']) || '')}">
          </div>
        </div>
      </div>
    `;
    
    const bebanCard = document.getElementById('bebanCard');
    container.parentNode.insertBefore(tulanganCard, bebanCard.nextSibling);
  },

  renderTulanganSection: function(title, prefix) {
    return `
      <div class="tulangan-section">
        <h3>${title}</h3>
        <div class="form-grid">
          <div class="field">
            <label>n</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="${prefix}_n" placeholder="Jumlah Tulangan Tarik" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][`${prefix}_n`]) || '')}">
            </div>
          </div>
          <div class="field">
            <label>n'</label>
            <div class="input-with-unit" data-unit="">
              <input data-key="${prefix}_np" placeholder="Jumlah Tulangan Tekan" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][`${prefix}_np`]) || '')}">
            </div>
          </div>
          <div class="field">
            <label>n<sub>t</sub></label>
            <div class="input-with-unit" data-unit="">
              <input data-key="${prefix}_nt" placeholder="Jumlah Tulangan Torsi (opsional)" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][`${prefix}_nt`]) || '')}">
            </div>
          </div>
          <div class="field">
            <label>s</label>
            <div class="input-with-unit" data-unit="mm">
              <input data-key="${prefix}_s" placeholder="Jarak Tulangan Begel" value="${escapeHtml((formState[currentModuleKey] && formState[currentModuleKey][currentMode] && formState[currentModuleKey][currentMode][`${prefix}_s`]) || '')}">
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

  setupBebanModeToggle: function() {
    const toggleBtns = document.querySelectorAll('#bebanCard .toggle-btn');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const mode = this.getAttribute('data-beban-mode');
        if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
        bebanMode[currentModuleKey][currentMode] = mode;

        // Re-render modul untuk memperbarui konten
        renderModule();

        updateLog(`Beban mode for ${currentModuleKey}.${currentMode} set to ${mode}`);
      });
    });
  },

  setupPatternBoxToggle: function() {
    const patternBoxes = document.querySelectorAll('.pattern-box-clickable');

    patternBoxes.forEach(box => {
      box.addEventListener('click', function() {
        this.classList.toggle('pattern-box-plain');

        // Simpan state ke formState
        ensureState(currentModuleKey, currentMode);
        if (!formState[currentModuleKey][currentMode]['pattern_boxes']) {
          formState[currentModuleKey][currentMode]['pattern_boxes'] = {};
        }

        const boxType = this.classList.contains('pattern-box-top') ? 'top' :
                        this.classList.contains('pattern-box-left') ? 'left' :
                        this.classList.contains('pattern-box-right') ? 'right' :
                        this.classList.contains('pattern-box-bottom') ? 'bottom' : null;

        if (boxType) {
          formState[currentModuleKey][currentMode]['pattern_boxes'][boxType] = this.classList.contains('pattern-box-plain');
          updateLog(`set ${currentModuleKey}.${currentMode}.pattern_boxes.${boxType} = ${this.classList.contains('pattern-box-plain')}`);
        }
      });
    });
  },

  initBebanTumpuanDropdown: function() {
    const dropdownSelected = document.getElementById('bebanTumpuanDropdownSelected');
    const dropdownOptions = document.getElementById('bebanTumpuanDropdownOptions');

    if (!dropdownSelected || !dropdownOptions) return;

    // Toggle dropdown ketika bagian selected diklik
    dropdownSelected.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = dropdownSelected.classList.contains('open');

      // Tutup semua dropdown yang terbuka
      document.querySelectorAll('.dropdown-selected.open').forEach(el => {
        if (el !== dropdownSelected) el.classList.remove('open');
      });
      document.querySelectorAll('.dropdown-options.show').forEach(el => {
        if (el !== dropdownOptions) el.classList.remove('show');
      });

      // Toggle dropdown ini
      dropdownSelected.classList.toggle('open');
      dropdownOptions.classList.toggle('show');
    });

    // Tangani pilihan opsi
    dropdownOptions.querySelectorAll('.dropdown-option').forEach(option => {
      option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');

        if (value === 'clear') {
          // Kosongkan input tp di bagian auto
          dropdownSelected.querySelector('span').textContent = 'Pilih Jenis Tumpuan';
          formState[currentModuleKey][currentMode]['beban_tp'] = '';
          updateLog('beban_tp cleared for pelat module');
        } else {
          // Update tampilan dropdown
          dropdownSelected.querySelector('span').textContent = this.textContent;
          // Update state
          ensureState(currentModuleKey, currentMode);
          formState[currentModuleKey][currentMode]['beban_tp'] = value;
          updateLog(`set ${currentModuleKey}.${currentMode}.beban_tp = ${value}`);
        }

        dropdownSelected.classList.remove('open');
        dropdownOptions.classList.remove('show');
      });
    });

    // Tutup dropdown ketika klik di luar
    document.addEventListener('click', function() {
      dropdownSelected.classList.remove('open');
      dropdownOptions.classList.remove('show');
    });
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