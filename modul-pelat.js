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
    headerDiv.className = 'card-header';
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
    
    // Inisialisasi bebanMode jika belum ada
    if (!bebanMode[currentModuleKey]) bebanMode[currentModuleKey] = {};
    if (!bebanMode[currentModuleKey][currentMode]) bebanMode[currentModuleKey][currentMode] = 'auto';
    const currentBebanMode = bebanMode[currentModuleKey][currentMode];
    
    // Dapatkan state saat ini untuk mengisi nilai
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    
    const muValue = currentState['mu'] || '';
    const quValue = currentState['qu'] || '';
    const bebanTpValue = currentState['beban_tp'] || 'Pilih Jenis Tumpuan';
    const bebanTpManualValue = currentState['beban_tp_manual'] || 'Pilih Jenis Tumpuan';
    
    // Dapatkan state pattern boxes
    const patternBoxesState = currentState['pattern_boxes'] || {};
    const topPattern = patternBoxesState['top'] ? 'pattern-box-plain' : '';
    const leftPattern = patternBoxesState['left'] ? 'pattern-box-plain' : '';
    const rightPattern = patternBoxesState['right'] ? 'pattern-box-plain' : '';
    const bottomPattern = patternBoxesState['bottom'] ? 'pattern-box-plain' : '';
    
    bebanCard.innerHTML = `
      <div class="card-header-with-tips">
        <h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-weight-icon lucide-weight">
            <circle cx="12" cy="5" r="3"/>
            <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>
          </svg>
          Data Beban
        </h2>
        <button class="circle-tips-btn" id="pelatBebanTipsBtn">?</button>
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
      <div style="margin-top: 16px;"></div>

      ${currentBebanMode === 'auto' ? `
      <div class="form-grid auto-content">
        <div class="field">
          <label>tp</label>
          <div class="custom-dropdown" id="bebanTumpuanDropdown">
            <div class="dropdown-selected" id="bebanTumpuanDropdownSelected">
              <span>${bebanTpValue}</span>
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
        <div class="pattern-box-top pattern-box-clickable ${topPattern}"></div>
        <div class="pattern-middle-row">
          <div class="pattern-box-left pattern-box-clickable ${leftPattern}"></div>
          <div class="sand-texture-box"></div>
          <div class="pattern-box-right pattern-box-clickable ${rightPattern}"></div>
        </div>
        <div class="pattern-box-bottom pattern-box-clickable ${bottomPattern}"></div>
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
        <!-- TAMBAHKAN DROPDOWN JENIS TUMPUAN UNTUK MANUAL -->
        <div class="field">
          <label>tp</label>
          <div class="custom-dropdown" id="bebanTumpuanManualDropdown">
            <div class="dropdown-selected" id="bebanTumpuanManualDropdownSelected">
              <span>${escapeHtml(bebanTpManualValue)}</span>
            </div>
            <div class="dropdown-options" id="bebanTumpuanManualDropdownOptions">
              <div class="dropdown-option" data-value="Satu Arah">Satu Arah</div>
              <div class="dropdown-option" data-value="Dua Arah">Dua Arah</div>
              <div class="dropdown-option" data-value="Kantilever">Kantilever</div>
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
      </div>
      ` : ''}
    `;
    
    container.parentNode.insertBefore(bebanCard, container.nextSibling);

    // Setup beban mode toggle untuk pelat desain dan evaluasi
    if (currentMode === 'desain' || currentMode === 'evaluasi') {
      this.setupBebanModeToggle();
      this.initBebanTumpuanDropdown();
      this.initBebanTumpuanManualDropdown();
      this.setupPatternBoxToggle();
      // Setup tips button khusus untuk Data Beban pelat
      this.setupPelatBebanTipsButton();
    }
  },

  // Tambahkan fungsi ini untuk setup tips button Data Beban pelat
  setupPelatBebanTipsButton: function() {
    const pelatBebanTipsBtn = document.getElementById('pelatBebanTipsBtn');
    if (pelatBebanTipsBtn) {
      pelatBebanTipsBtn.addEventListener('click', function() {
        const tipsContent = document.getElementById('tipsContent');
        tipsContent.innerHTML = `
          <h3>Data Beban</h3>
          <div style="line-height: 1.6;">
            <p>Atur metode perhitungan beban dan momen pelat. Pilih <strong>Auto</strong> untuk menghitung momen ultimit berdasarkan kondisi tumpuan dan beban total, atau <strong>Manual</strong> jika nilai momen ultimit (<strong>Mu</strong>) sudah ditentukan pengguna.</p>
            <p><strong>Mode Auto:</strong></p>
            <p><strong>tp (Jenis Tumpuan Pelat)</strong> — Tentukan tipe tumpuan (<strong>Terjepit Penuh</strong> atau <strong>Menerus/Elastis</strong>) yang memengaruhi distribusi momen.</p>
            <p><strong>qu (Beban Ultimit)</strong> — Merupakan beban total hasil kombinasi beban mati, hidup, dan lainnya, yang sudah dikalikan faktor ultimit.</p>
            <p><strong>Diagram Interaktif Pelat</strong> — Ilustrasi ini menunjukkan pelat dan tumpuannya. Kotak besar di tengah mewakili <strong>bidang pelat</strong>, sedangkan empat kotak kecil di sisi atas, bawah, kiri, dan kanan mewakili <strong>kondisi tumpuan</strong> di tiap tepi.</p>
            <p>Setiap kotak sisi menampilkan pola <strong>garis miring</strong> untuk menandakan bahwa sisi tersebut <strong>ditumpu oleh tumpuan tp</strong>. Jika pengguna <strong>mengklik kotak tumpuan</strong>, pola garis milingnya akan <strong>hilang</strong> untuk menunjukkan sisi yang <strong>terletak bebas (tidak ditumpu)</strong>.</p>
            <p>Dengan cara ini, pengguna bisa menyesuaikan kombinasi tumpuan pelat sesuai kondisi nyata di lapangan, misalnya <strong>pelat menerus di dua sisi dan bebas di sisi lainnya</strong>.</p>
            <p>Kondisi tumpuan inilah yang nantinya digunakan sistem untuk menentukan <strong>distribusi momen</strong> dan <strong>arah pembebanan utama</strong> ketika mode <strong>Auto</strong> aktif.</p>
            
            <p><strong>Mode Manual:</strong></p>
            <p><strong>Mu (Momen Ultimit)</strong> — Nilai momen ultimit yang sudah diketahui/dihitung sebelumnya.</p>
            <p><strong>tp (Jenis Tumpuan)</strong> — Pilih tipe perilaku pelat: <strong>Satu Arah</strong> (pelat yang menyalurkan beban hanya dalam satu arah), <strong>Dua Arah</strong> (pelat yang menyalurkan beban ke dua arah), atau <strong>Kantilever</strong> (pelat yang menjorok tanpa tumpuan di ujungnya).</p>
          </div>
        `;
        document.getElementById('tipsModal').classList.add('active');
        document.addEventListener('keydown', handleEscKey);
      });
    }
  },

  renderTulanganCard: function(container) {
    const tulanganCard = document.createElement('div');
    tulanganCard.className = 'card';
    tulanganCard.id = 'tulanganCard';
    
    // Dapatkan state saat ini untuk mengisi nilai
    const currentState = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
    
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
        <div class="field">
          <label>D</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="d" placeholder="Diameter Tulangan Utama" value="${escapeHtml(currentState['d'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>D<sub>b</sub></label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="db" placeholder="Diameter Tulangan Bagi" value="${escapeHtml(currentState['db'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>s</label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="s" placeholder="Jarak Tulangan Utama" value="${escapeHtml(currentState['s'] || '')}">
          </div>
        </div>
        <div class="field">
          <label>s<sub>b</sub></label>
          <div class="input-with-unit" data-unit="mm">
            <input data-key="sb_tulangan" placeholder="Jarak Tulangan Bagi" value="${escapeHtml(currentState['sb_tulangan'] || '')}">
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
    // Hanya inisialisasi jika mode auto aktif
    if (!(bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] === 'auto')) {
      return;
    }
    
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

  initBebanTumpuanManualDropdown: function() {
    // Hanya inisialisasi jika mode manual aktif
    if (!(bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] === 'manual')) {
      return;
    }
    
    const dropdownSelected = document.getElementById('bebanTumpuanManualDropdownSelected');
    const dropdownOptions = document.getElementById('bebanTumpuanManualDropdownOptions');

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
          // Kosongkan input tp di bagian manual
          dropdownSelected.querySelector('span').textContent = 'Pilih Jenis Tumpuan';
          formState[currentModuleKey][currentMode]['beban_tp_manual'] = '';
          updateLog('beban_tp_manual cleared for pelat module');
        } else {
          // Update tampilan dropdown
          dropdownSelected.querySelector('span').textContent = this.textContent;
          // Update state
          ensureState(currentModuleKey, currentMode);
          formState[currentModuleKey][currentMode]['beban_tp_manual'] = value;
          updateLog(`set ${currentModuleKey}.${currentMode}.beban_tp_manual = ${value}`);
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

  // ========== FUNGSI BARU UNTUK VALIDASI DAN HITUNG ==========

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

    // Validasi Data Material (untuk pelat: f'c dan fy)
    const quickFc = document.getElementById('quickFc').value;
    const quickFy = document.getElementById('quickFy').value;

    if (!quickFc || quickFc.toString().trim() === '') {
      missingFields.push("f'c (Kuat Tekan Beton) - Data Material");
    }
    if (!quickFy || quickFy.toString().trim() === '') {
      missingFields.push("fy (Kuat Leleh Baja) - Data Material");
    }

    // Field wajib dari Data Dimensi
    const dimensiFields = ['ly', 'lx', 'h', 'sb'];
    dimensiFields.forEach(field => {
      if (!state[field] || state[field].toString().trim() === '') {
        missingFields.push(`${this.getFieldLabel(field)} (Data Dimensi)`);
      }
    });

    // Field wajib dari Data Beban berdasarkan mode
    const currentBebanMode = bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] ? bebanMode[currentModuleKey][currentMode] : 'auto';
    
    if (currentBebanMode === 'auto') {
      // Mode Auto: qu dan beban_tp wajib
      if (!state['qu'] || state['qu'].toString().trim() === '') {
        missingFields.push("qu (Beban Ultimit) - Data Beban");
      }
      if (!state['beban_tp'] || state['beban_tp'].toString().trim() === '') {
        missingFields.push("tp (Jenis Tumpuan) - Data Beban");
      }
      
      // DIAGRAM TUMPUAN TIDAK WAJIB - validasi dihapus
      // Pengguna tidak diharuskan memilih minimal satu tumpuan
      
    } else {
      // Mode Manual: mu dan beban_tp_manual wajib
      if (!state['mu'] || state['mu'].toString().trim() === '') {
        missingFields.push("Mu (Momen Ultimit) - Data Beban");
      }
      if (!state['beban_tp_manual'] || state['beban_tp_manual'].toString().trim() === '') {
        missingFields.push("tp (Jenis Tumpuan) - Data Beban");
      }
    }

    // Field wajib dari Data Tulangan (hanya untuk mode evaluasi)
    if (currentMode === 'evaluasi') {
      const tulanganFields = ['d', 'db', 's', 'sb_tulangan'];
      tulanganFields.forEach(field => {
        if (!state[field] || state[field].toString().trim() === '') {
          missingFields.push(`${this.getFieldLabel(field)} (Data Tulangan)`);
        }
      });
    }

    return missingFields;
  },

  getFieldLabel: function(key) {
    const labels = {
      'ly': 'Ly (Panjang Pelat)',
      'lx': 'Lx (Lebar Pelat)',
      'h': 'h (Tebal Pelat)',
      'sb': 'Sb (Selimut Beton)',
      'd': 'D (Diameter Tulangan Utama)',
      'db': 'Db (Diameter Tulangan Bagi)',
      's': 's (Jarak Tulangan Utama)',
      'sb_tulangan': 'sb (Jarak Tulangan Bagi)',
      'qu': 'qu (Beban Ultimit)',
      'mu': 'Mu (Momen Ultimit)',
      'beban_tp': 'tp (Jenis Tumpuan)',
      'beban_tp_manual': 'tp (Jenis Tumpuan)'
    };
    return labels[key] || key;
  },

  collectData: function() {
    const state = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? 
      {...formState[currentModuleKey][currentMode]} : {};
    
    const quickInputs = {
      fc: document.getElementById('quickFc').value,
      fy: document.getElementById('quickFy').value
    };

    // Konversi pattern boxes ke format binary (kiri, atas, kanan, bawah)
    const patternBoxes = state['pattern_boxes'] || {};
    const patternBinary = [
      patternBoxes['left'] ? '1' : '0',
      patternBoxes['top'] ? '1' : '0', 
      patternBoxes['right'] ? '1' : '0',
      patternBoxes['bottom'] ? '1' : '0'
    ].join('');

    // Data yang akan dikirim ke calc-pelat.js
    const calculationData = {
      module: currentModuleKey,
      mode: currentMode,
      dimensi: {
        ly: state.ly,
        lx: state.lx,
        h: state.h,
        sb: state.sb  // ⬅️ INI ADALAH SELIMUT BETON
      },
      beban: {
        mode: bebanMode[currentModuleKey] && bebanMode[currentModuleKey][currentMode] ? bebanMode[currentModuleKey][currentMode] : 'auto',
        auto: {
          qu: state.qu,
          tumpuan_type: state.beban_tp,
          pattern_binary: patternBinary
        },
        manual: {
          mu: state.mu,
          tumpuan_type: state.beban_tp_manual  // TAMBAHKAN INI
        }
      },
      material: quickInputs,
      lanjutan: {
        lambda: state.lambda
      }
    };

    // Tambahkan data tulangan hanya untuk mode evaluasi
    if (currentMode === 'evaluasi') {
      calculationData.tulangan = {
        d: state.d,
        db: state.db,
        s: state.s,
        sb: state.sb_tulangan  // ⬅️ INI ADALAH JARAK TULANGAN BAGI
      };
    }

    return calculationData;
  },

sendToCalculation: async function(data) {
    console.log("🚀 Memulai perhitungan pelat...", data);
    
    try {
        // Gunakan calculatePelatWithRedirect yang sudah ada
        if (typeof window.calculatePelatWithRedirect === 'function') {
            console.log("✅ Menggunakan calculatePelatWithRedirect...");
            const result = await window.calculatePelatWithRedirect(data);
            console.log("📊 Hasil calculatePelatWithRedirect:", result);
            
        } else if (typeof window.calculatePelat === 'function') {
            console.log("⚠️ calculatePelatWithRedirect tidak tersedia, menggunakan calculatePelat...");
            
            const result = await window.calculatePelat(data);
            console.log("📊 Hasil calculatePelat:", result);
            
            if (result && (result.status === 'sukses' || result.status === 'cek')) {
                console.log("💾 Menyimpan data ke sessionStorage...");
                
                // Simpan data dengan struktur yang konsisten
                const storageData = {
                    module: data.module,
                    mode: data.mode,
                    data: result.data,
                    kontrol: result.kontrol,
                    rekap: result.rekap,
                    inputData: data,
                    timestamp: new Date().toISOString()
                };
                
                sessionStorage.setItem('calculationResultPelat', JSON.stringify(storageData));
                console.log("✅ Data berhasil disimpan di calculationResultPelat");
                
                // ✅ REDIRECT MANUAL - INI YANG PALING PENTING
                console.log("🔄 Redirect manual ke report.html...");
                setTimeout(() => {
                    window.location.href = 'report.html';
                }, 500);
                
            } else {
                console.error("❌ Perhitungan gagal:", result);
                let errorMessage = 'Terjadi kesalahan';
                if (result?.message) errorMessage = result.message;
                if (result?.problems) errorMessage = result.problems.join(', ');
                showAlert(`Perhitungan gagal: ${errorMessage}`);
            }
        } else {
            console.error("❌ Fungsi calculatePelat tidak tersedia");
            showAlert("Modul perhitungan pelat tidak tersedia. Pastikan calc-pelat.js sudah dimuat.");
        }
    } catch (error) {
        console.error("❌ Exception dalam sendToCalculation:", error);
        showAlert(`Error: ${error.message}`);
    }
},

  formatVariablesList: function(data) {
    let variablesList = [];
    
    // Data Material
    variablesList.push("=== DATA MATERIAL ===");
    variablesList.push(`fc: ${data.material.fc} MPa`);
    variablesList.push(`fy: ${data.material.fy} MPa`);
    
    // Data Dimensi
    variablesList.push("\n=== DATA DIMENSI ===");
    variablesList.push(`ly: ${data.dimensi.ly} m`);
    variablesList.push(`lx: ${data.dimensi.lx} m`);
    variablesList.push(`h: ${data.dimensi.h} mm`);
    variablesList.push(`sb: ${data.dimensi.sb} mm`);
    
    // Data Beban
    variablesList.push("\n=== DATA BEBAN ===");
    variablesList.push(`Mode: ${data.beban.mode}`);
    
    if (data.beban.mode === 'auto') {
      variablesList.push(`qu: ${data.beban.auto.qu} kN/m²`);
      variablesList.push(`Jenis Tumpuan: ${data.beban.auto.tumpuan_type}`);
      variablesList.push(`Pattern Binary: ${data.beban.auto.pattern_binary} (kiri, atas, kanan, bawah)`);
      
      // Interpretasi pattern binary
      const pattern = data.beban.auto.pattern_binary;
      const sides = ['Kiri', 'Atas', 'Kanan', 'Bawah'];
      const patternDesc = pattern.split('').map((bit, index) => `${sides[index]}: ${bit === '1' ? 'Tumpuan' : 'Bebas'}`).join(', ');
      variablesList.push(`Interpretasi Pattern: ${patternDesc}`);
    } else {
      variablesList.push(`mu: ${data.beban.manual.mu} kNm`);
      variablesList.push(`Jenis Tumpuan: ${data.beban.manual.tumpuan_type}`);
    }
    
    // Data Lanjutan
    variablesList.push("\n=== DATA LANJUTAN ===");
    variablesList.push(`lambda: ${data.lanjutan.lambda || '1 (default)'}`);
    
    // Data Tulangan (hanya untuk evaluasi)
    if (data.mode === 'evaluasi' && data.tulangan) {
      variablesList.push("\n=== DATA TULANGAN ===");
      variablesList.push(`d: ${data.tulangan.d} mm`);
      variablesList.push(`db: ${data.tulangan.db} mm`);
      variablesList.push(`s: ${data.tulangan.s} mm`);
      variablesList.push(`sb: ${data.tulangan.sb} mm`);
    }
    
    return variablesList.join('\n');
  }
};