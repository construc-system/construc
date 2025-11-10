// Pastikan objek modules ada di scope global
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
  info: "Fondasi: desain sederhana dan evaluasi berdasarkan parameter tanah.",

  // Inisialisasi tanahMode jika belum ada
  initTanahMode: function() {
    if (typeof window.tanahMode === 'undefined') {
      window.tanahMode = {};
    }
  },
  
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

    // Inisialisasi fondasiMode jika belum ada
    if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
    if (!bebanMode[currentModuleKey][mode]) bebanMode[currentModuleKey][mode] = 'tunggal';
    const currentFondasiMode = bebanMode[currentModuleKey][mode];

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

    // Tambahkan checkbox "Biarkan Sistem Menentukan Dimensi Fondasi"
    const autoDimensiChecked = (formState[currentModuleKey] && formState[currentModuleKey][mode] && formState[currentModuleKey][mode]['autoDimensi']) || false;
    
    const autoDimensiDiv = document.createElement('div');
    autoDimensiDiv.className = 'checkbox-row';
    autoDimensiDiv.innerHTML = `
      <div class="checkbox-container">
        <input type="checkbox" id="autoDimensiCheckbox" data-key="autoDimensi" ${autoDimensiChecked ? 'checked' : ''}>
        <label for="autoDimensiCheckbox">Biarkan Sistem Menentukan Dimensi Fondasi</label>
      </div>
    `;
    container.appendChild(autoDimensiDiv);

    // Tambahkan jarak antara toggle dan konten
    const spacerDiv = document.createElement('div');
    spacerDiv.style.marginTop = '16px';
    container.appendChild(spacerDiv);

    // Grid fields - dinamis berdasarkan fondasiMode
    const grid = document.createElement('div');
    grid.className = 'form-grid';
    let fields;

    if (currentFondasiMode === 'tunggal') {
      fields = [
        {label:"L<sub>y</sub>", key:"ly", placeholder:"Panjang Fondasi", unit:"m"},
        {label:"L<sub>x</sub>", key:"lx", placeholder:"Lebar Fondasi", unit:"m"},
        {label:"b<sub>y</sub>", key:"by", placeholder:"Panjang Penampang Kolom", unit:"mm"},
        {label:"b<sub>x</sub>", key:"bx", placeholder:"Lebar Penampang Kolom", unit:"mm"},
        {label:"h", key:"h", placeholder:"Tebal Fondasi", unit:"m"},
        {label:"α<sub>s</sub>", key:"alpha_s", placeholder:"Letak Kolom", unit:"", type:"dropdown", options:["Tengah", "Tepi", "Sudut"]}
      ];
    } else {
      // menerus - fields hampir sama tapi dengan placeholder berbeda
      fields = [
        {label:"L<sub>y</sub>", key:"ly", placeholder:"Panjang Fondasi", unit:"m"},
        {label:"L<sub>x</sub>", key:"lx", placeholder:"Lebar Fondasi", unit:"m"},
        {label:"b<sub>y</sub>", key:"by", placeholder:"Panjang Sloof", unit:"mm"},
        {label:"b<sub>x</sub>", key:"bx", placeholder:"Lebar Penampang Sloof", unit:"mm"},
        {label:"h", key:"h", placeholder:"Tebal Fondasi", unit:"m"},
        {label:"α<sub>s</sub>", key:"alpha_s", placeholder:"Faktor Letak Fondasi", unit:""}
      ];
    }

    ensureState(currentModuleKey, mode);

    fields.forEach(f => {
      const cell = document.createElement('div');
      cell.className = 'field';
      const val = (formState[currentModuleKey] && formState[currentModuleKey][mode] && formState[currentModuleKey][mode][f.key]) || '';

      if (f.type === 'dropdown') {
        // Buat dropdown untuk alpha_s
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'custom-dropdown';
        dropdownContainer.innerHTML = `
          <div class="dropdown-selected" id="alphaSDropdownSelected">
            <span>${val || 'Pilih Letak Kolom'}</span>
          </div>
          <div class="dropdown-options" id="alphaSDropdownOptions">
            ${f.options.map(option => `<div class="dropdown-option" data-value="${option}">${option}</div>`).join('')}
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
        input.value = escapeHtml(val);
        
        // Nonaktifkan input Ly, Lx, dan h jika autoDimensi dicentang
        if (autoDimensiChecked && (f.key === 'ly' || f.key === 'lx' || f.key === 'h')) {
          input.disabled = true;
          input.classList.add('disabled-field');
          // TAMBAHAN: Tambahkan class disabled ke container
          inputContainer.classList.add('disabled');
        }

        inputContainer.appendChild(input);
        cell.innerHTML = `<label>${f.label}</label>`;
        cell.appendChild(inputContainer);
      }

      grid.appendChild(cell);
    });
    container.appendChild(grid);

    // Setup dropdown jika ada
    if (currentFondasiMode === 'tunggal') {
      this.initAlphaSDropdown(container, mode);
    }

    // Setup fondasi mode toggle
    this.setupFondasiModeToggle(container, mode);
    
    // Setup auto dimensi checkbox
    this.setupAutoDimensiCheckbox(container, mode);

    // Hapus card yang mungkin sudah ada
    this.removeExistingCards();

    // TAMBAHAN: Render card Data Tanah untuk kedua mode
    this.renderTanahCard(container);

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
    const existingCards = ['tumpuanCard', 'bebanCard', 'tulanganCard', 'lanjutanCard', 'tanahCard'];
    existingCards.forEach(cardId => {
      const card = document.getElementById(cardId);
      if (card) card.remove();
    });
  },

  // Setup auto dimensi checkbox
  setupAutoDimensiCheckbox: function(container, mode) {
    const autoDimensiCheckbox = container.querySelector('#autoDimensiCheckbox');
    
    if (autoDimensiCheckbox) {
      autoDimensiCheckbox.addEventListener('change', function() {
        ensureState(currentModuleKey, mode);
        formState[currentModuleKey][mode]['autoDimensi'] = this.checked;
        
        // Re-render modul untuk memperbarui status input fields
        renderModule();
        
        updateLog(`Auto dimensi ${this.checked ? 'enabled' : 'disabled'} for ${currentModuleKey}.${mode}`);
      });
    }
  },

  // TAMBAHAN: Fungsi untuk render card Data Tanah dengan toggle Auto/Manual
  renderTanahCard: function(container) {
    const tanahCard = document.createElement('div');
    tanahCard.className = 'card';
    tanahCard.id = 'tanahCard';

    // Inisialisasi tanahMode jika belum ada
    this.initTanahMode();
    if (!window.tanahMode[currentModuleKey]) window.tanahMode[currentModuleKey] = {};
    if (!window.tanahMode[currentModuleKey][currentMode]) window.tanahMode[currentModuleKey][currentMode] = 'auto';
    const currentTanahMode = window.tanahMode[currentModuleKey][currentMode];

    // Dapatkan nilai dari formState
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode];
    // Jika tidak ada state, maka ini pertama kali -> set Terzaghi true
    const isFirstTime = !currentState || Object.keys(currentState).length === 0;

    const dfValue = (currentState && currentState['df']) || '';
    const gammaValue = (currentState && currentState['gamma']) || '';
    const phiValue = (currentState && currentState['phi']) || '';
    const cValue = (currentState && currentState['c']) || '';
    const qcValue = (currentState && currentState['qc']) || '';
    const qaValue = (currentState && currentState['qa']) || '';
    const terzaghiChecked = currentState && currentState.hasOwnProperty('terzaghi') ? currentState.terzaghi : isFirstTime;
    const mayerhoffChecked = currentState && currentState.hasOwnProperty('mayerhoff') ? currentState.mayerhoff : false;

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
        <button class="circle-tips-btn" data-tips="Pilih mode Auto untuk input parameter tanah lengkap, atau Manual untuk input kapasitas dukung izin tanah langsung.">?</button>
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

      <!-- Tambahkan jarak antara toggle dan konten -->
      <div style="margin-top: 16px;"></div>

      ${currentTanahMode === 'auto' ? `
        <div class="tanah-auto-content">
          <!-- Baris 1: Df dan Gamma -->
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
          
          <!-- Baris 2: Checkbox Terzaghi -->
          <div class="checkbox-row">
            <div class="checkbox-container">
              <input type="checkbox" id="terzaghiCheckbox" data-key="terzaghi" ${terzaghiChecked ? 'checked' : ''}>
              <label for="terzaghiCheckbox">Terzaghi</label>
            </div>
          </div>
          
          <!-- Baris 3: ɸ dan c -->
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
          
          <!-- Baris 4: Checkbox Mayerhoff -->
          <div class="checkbox-row">
            <div class="checkbox-container">
              <input type="checkbox" id="mayerhoffCheckbox" data-key="mayerhoff" ${mayerhoffChecked ? 'checked' : ''}>
              <label for="mayerhoffCheckbox">Mayerhoff</label>
            </div>
          </div>
          
          <!-- Baris 5: qc -->
          <div class="form-grid">
            <div class="field">
              <label>q<sub>c</sub></label>
              <div class="input-with-unit ${mayerhoffChecked ? '' : 'disabled'}" data-unit="kg/cm²">
                <input data-key="qc" placeholder="Tahanan Konus Rata-rata" value="${escapeHtml(qcValue)}" ${mayerhoffChecked ? '' : 'disabled'} class="${mayerhoffChecked ? '' : 'disabled-field'}">
              </div>
            </div>
            <!-- Kolom kosong untuk menjaga layout -->
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
        </div>
      ` : ''}
    `;

    const referenceNode = container.nextSibling;
    container.parentNode.insertBefore(tanahCard, referenceNode);

    // Setup tanah mode toggle
    this.setupTanahModeToggle();
    
    // Setup checkbox functionality
    this.setupTanahCheckboxes();
  },

  setupTanahModeToggle: function() {
    const toggleBtns = document.querySelectorAll('#tanahCard .toggle-btn[data-tanah-mode]');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const mode = this.getAttribute('data-tanah-mode');
        if (!window.tanahMode[currentModuleKey]) window.tanahMode[currentModuleKey] = {};
        window.tanahMode[currentModuleKey][currentMode] = mode;

        // Re-render modul untuk memperbarui konten
        renderModule();

        updateLog(`Tanah mode for ${currentModuleKey}.${currentMode} set to ${mode}`);
      });
    });
  },

  // TAMBAHAN: Setup checkbox untuk metode Terzaghi dan Mayerhoff
  setupTanahCheckboxes: function() {
    const terzaghiCheckbox = document.querySelector('#tanahCard input[data-key="terzaghi"]');
    const mayerhoffCheckbox = document.querySelector('#tanahCard input[data-key="mayerhoff"]');
    
    if (terzaghiCheckbox) {
      terzaghiCheckbox.addEventListener('change', function() {
        ensureState(currentModuleKey, currentMode);
        formState[currentModuleKey][currentMode]['terzaghi'] = this.checked;
        
        // Re-render modul untuk memperbarui status input fields
        renderModule();
        
        updateLog(`Terzaghi method ${this.checked ? 'enabled' : 'disabled'} for ${currentModuleKey}.${currentMode}`);
      });
    }
    
    if (mayerhoffCheckbox) {
      mayerhoffCheckbox.addEventListener('change', function() {
        ensureState(currentModuleKey, currentMode);
        formState[currentModuleKey][currentMode]['mayerhoff'] = this.checked;
        
        // Re-render modul untuk memperbarui status input fields
        renderModule();
        
        updateLog(`Mayerhoff method ${this.checked ? 'enabled' : 'disabled'} for ${currentModuleKey}.${currentMode}`);
      });
    }
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
        <button class="circle-tips-btn" data-tips="Masukkan beban ultimit untuk fondasi.">?</button>
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
        <button class="circle-tips-btn" data-tips="Masukkan data tulangan untuk evaluasi fondasi.">?</button>
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
      </div>
      <div class="tulangan-sections">
        ${this.renderTulanganSection('Tulangan Tumpuan', 'support')}
        ${this.renderTulanganSection('Tulangan Lapangan', 'field')}
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

  setupFondasiModeToggle: function(container, mode) {
    const toggleBtns = container.querySelectorAll('.toggle-btn[data-fondasi-mode]');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const fondasiMode = this.getAttribute('data-fondasi-mode');
        if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
        bebanMode[currentModuleKey][mode] = fondasiMode;

        // Re-render modul untuk memperbarui konten
        renderModule();

        updateLog(`Fondasi mode for ${currentModuleKey}.${mode} set to ${fondasiMode}`);
      });
    });
  },

  initAlphaSDropdown: function(container, mode) {
    const dropdownSelected = container.querySelector('#alphaSDropdownSelected');
    const dropdownOptions = container.querySelector('#alphaSDropdownOptions');

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
          // Kosongkan input alpha_s
          dropdownSelected.querySelector('span').textContent = 'Pilih Letak Kolom';
          formState[currentModuleKey][mode]['alpha_s'] = '';
          updateLog('alpha_s cleared for fondasi module');
        } else {
          // Update tampilan dropdown
          dropdownSelected.querySelector('span').textContent = this.textContent;
          // Update state
          ensureState(currentModuleKey, mode);
          formState[currentModuleKey][mode]['alpha_s'] = value;
          updateLog(`set ${currentModuleKey}.${mode}.alpha_s = ${value}`);
        }

        dropdownSelected.classList.remove('open');
        dropdownOptions.classList.remove('show');
      });
    });

    // Tutup dropdown ketika klik di luar
    document.addEventListener('click', function(e) {
      if (!dropdownSelected.contains(e.target) && !dropdownOptions.contains(e.target)) {
        dropdownSelected.classList.remove('open');
        dropdownOptions.classList.remove('show');
      }
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