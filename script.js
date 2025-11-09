/* ========= GLOBAL STATE & UTILITIES ========= */
// Gunakan modules dari window atau buat objek kosong
const modules = window.modules || {};

let currentModuleKey = 'balok';
let currentMode = 'desain';
let formState = {};
let quickInputsState = {};
let bebanMode = {};

/* utility: ensure nested state exists */
function ensureState(mk, mode){
  if(!formState[mk]) formState[mk] = {};
  if(!formState[mk][mode]) formState[mk][mode] = {};
}

/* helpers */
function capitalize(s){ return s[0].toUpperCase()+s.slice(1) }
function escapeHtml(s){ if(!s && s !== '') return ''; return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

/* log helper */
function updateLog(msg){
  console.log(msg);
}

/* render module form based on model */
function renderModule(){
    const module = modules[currentModuleKey];
    const container = document.getElementById('moduleForm');

    console.log('Available modules:', Object.keys(modules));
    console.log('Current module:', currentModuleKey, module);

    if (module && module.render) {
        module.render(container, currentMode);
    } else {
        container.innerHTML = '<p style="color: red; padding: 20px; text-align: center;">Modul tidak ditemukan. Silakan refresh halaman.</p>';
        console.error('Module not found:', currentModuleKey, 'Available:', Object.keys(modules));
        return;
    }

    // Update UI
    document.getElementById('currentModuleName').textContent = module.name;
    document.getElementById('calculateBtn').textContent = `Hitung ${capitalize(currentMode)}`;

    // Update custom dropdown value
    updateCustomDropdown();

    // Update warna teks tombol berdasarkan latar belakang
    updateButtonTextColors();

    // Show/hide fyt field based on module
    const fytField = document.getElementById('fytField');
    if (fytField) {
        if (currentModuleKey === 'balok' || currentModuleKey === 'kolom') {
            fytField.style.display = 'flex'; /* Ganti dari 'block' ke 'flex' */
        } else {
            fytField.style.display = 'none';
        }
    }
}

/* nav handlers */
function switchModule(evt){
  const btns = document.querySelectorAll('.nav-btn');
  btns.forEach(b=>b.classList.remove('active'));
  evt.currentTarget.classList.add('active');
  currentModuleKey = evt.currentTarget.dataset.target;
  renderModule();
  // Simpan pengaturan jika remember module aktif
  const checkbox = document.getElementById('rememberModuleCheckbox');
  if (checkbox && checkbox.checked) {
    saveGeneralSettingsToLocalStorage();
  }
}

/* mode toggle (top) */
function switchMode(evt){
  const btns = document.querySelectorAll('.mode-toggle button');
  btns.forEach(b=>b.classList.remove('active'));
  evt.currentTarget.classList.add('active');
  currentMode = evt.currentTarget.dataset.mode;
  renderModule();
  // Simpan pengaturan jika remember module aktif
  const checkbox = document.getElementById('rememberModuleCheckbox');
  if (checkbox && checkbox.checked) {
    saveGeneralSettingsToLocalStorage();
  }
}

/* actions */
function saveDraft(){
  // Simpan data form, quick inputs, dan bebanMode
      const draftData = {
    formState: formState,
    quickInputsState: quickInputsState,
    bebanMode: bebanMode  // Tambahkan bebanMode ke draft
  };
  
  localStorage.setItem('concretecalc_draft', JSON.stringify(draftData));
  updateLog('Draft saved to localStorage (including quick inputs and bebanMode).');
  alert('Draft saved (lokal).');
}

function calculate(){
  // placeholder calculation: collect inputs and display in log
  ensureState(currentModuleKey, currentMode);
  const data = formState[currentModuleKey] && formState[currentModuleKey][currentMode] ? formState[currentModuleKey][currentMode] : {};
  updateLog(`Calculate requested for ${currentModuleKey}.${currentMode} with payload:\n${JSON.stringify(data, null, 2)}`);
  alert('Fungsi hitung belum diimplementasikan.');
}

/* COLOR CUSTOMIZER FUNCTIONS */
function applyColors() {
  const color1 = document.getElementById('colorInput1').value;
  const color2 = document.getElementById('colorInput2').value;
  const color3 = document.getElementById('colorInput3').value;
  const color4 = document.getElementById('colorInput4').value;
  
  // Terapkan warna ke variabel CSS sesuai peran tetap
  document.documentElement.style.setProperty('--bg-body', color1);
  document.documentElement.style.setProperty('--color-buttons', color2);
  document.documentElement.style.setProperty('--color-borders', color3);
  document.documentElement.style.setProperty('--color-labels', color4);
  
  // Update warna teks label berdasarkan kecerahan background
  updateLabelTextColor(color4);
  
  // Update warna teks tombol berdasarkan latar belakang
  updateButtonTextColors();
  
  // Simpan warna ke localStorage
  saveColorsToLocalStorage();
  
  updateLog(`Applied colors: Body=${color1}, Buttons=${color2}, Borders=${color3}, Labels=${color4}`);
}

// Fungsi untuk menyesuaikan warna teks label berdasarkan kecerahan background
function updateLabelTextColor(backgroundColor) {
  // Konversi hex ke RGB
  let r, g, b;
  if (backgroundColor.length === 7) {
    r = parseInt(backgroundColor.substr(1, 2), 16);
    g = parseInt(backgroundColor.substr(3, 2), 16);
    b = parseInt(backgroundColor.substr(5, 2), 16);
  } else if (backgroundColor.length === 4) {
    r = parseInt(backgroundColor.substr(1, 1) + backgroundColor.substr(1, 1), 16);
    g = parseInt(backgroundColor.substr(2, 1) + backgroundColor.substr(2, 1), 16);
    b = parseInt(backgroundColor.substr(3, 1) + backgroundColor.substr(3, 1), 16);
  } else {
    // Fallback ke hitam jika format tidak dikenali
    document.documentElement.style.setProperty('--label-text-color', '#000000');
    return;
  }
  
  // Hitung kecerahan menggunakan formula luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Tentukan warna teks berdasarkan kecerahan background
  const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';
  
  // Terapkan warna teks
  document.documentElement.style.setProperty('--label-text-color', textColor);
}

// Fungsi untuk menyesuaikan warna teks tombol berdasarkan latar belakang
function updateButtonTextColors() {
  const colorButtons = getComputedStyle(document.documentElement).getPropertyValue('--color-buttons').trim();
  const colorLabels = getComputedStyle(document.documentElement).getPropertyValue('--color-labels').trim();
  
  // Hitung kecerahan untuk colorButtons
  const luminanceButtons = calculateLuminance(colorButtons);
  const buttonTextColor = luminanceButtons > 0.5 ? '#000000' : '#FFFFFF';
  document.documentElement.style.setProperty('--button-text-color', buttonTextColor);
  
  // Hitung kecerahan untuk colorLabels (untuk tombol aktif di toggle)
  const luminanceLabels = calculateLuminance(colorLabels);
  const toggleActiveTextColor = luminanceLabels > 0.5 ? '#000000' : '#FFFFFF';
  document.documentElement.style.setProperty('--toggle-active-text-color', toggleActiveTextColor);
  
  // Hitung kecerahan untuk background mode-toggle (colorButtons)
  const toggleTextColor = luminanceButtons > 0.5 ? '#000000' : '#FFFFFF';
  document.documentElement.style.setProperty('--toggle-text-color', toggleTextColor);
}

// Fungsi untuk menghitung kecerahan warna
function calculateLuminance(hexColor) {
  // Konversi hex ke RGB
  let r, g, b;
  if (hexColor.length === 7) {
    r = parseInt(hexColor.substr(1, 2), 16);
    g = parseInt(hexColor.substr(3, 2), 16);
    b = parseInt(hexColor.substr(5, 2), 16);
  } else if (hexColor.length === 4) {
    r = parseInt(hexColor.substr(1, 1) + hexColor.substr(1, 1), 16);
    g = parseInt(hexColor.substr(2, 1) + hexColor.substr(2, 1), 16);
    b = parseInt(hexColor.substr(3, 1) + hexColor.substr(3, 1), 16);
  } else {
    return 0.5; // Default ke nilai tengah
  }
  
  // Hitung luminance menggunakan formula
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function resetColors() {
  // Reset ke warna default
  document.documentElement.style.setProperty('--bg-body', '#FFF1D5');
  document.documentElement.style.setProperty('--color-buttons', '#BDDDE4');
  document.documentElement.style.setProperty('--color-borders', '#9EC6F3');
  document.documentElement.style.setProperty('--color-labels', '#9FB3DF');
  
  // Reset input fields
  document.getElementById('colorInput1').value = '#FFF1D5';
  document.getElementById('colorInput2').value = '#BDDDE4';
  document.getElementById('colorInput3').value = '#9EC6F3';
  document.getElementById('colorInput4').value = '#9FB3DF';
  
  document.getElementById('colorPicker1').value = '#FFF1D5';
  document.getElementById('colorPicker2').value = '#BDDDE4';
  document.getElementById('colorPicker3').value = '#9EC6F3';
  document.getElementById('colorPicker4').value = '#9FB3DF';
  
  // Update warna teks label
  updateLabelTextColor('#9FB3DF');
  
  // Update warna teks tombol
  updateButtonTextColors();
  
  // Hapus warna dari localStorage
  localStorage.removeItem('concretecalc_colors');
  
  updateLog('Colors reset to default');
}

function applyRandomColors() {
  // Generate 4 warna acak yang berbeda
  const colors = [];
  while (colors.length < 4) {
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);
    if (!colors.includes(color) && color.length === 7) {
      colors.push(color);
    }
  }
  
  // Set nilai input
  document.getElementById('colorInput1').value = colors[0];
  document.getElementById('colorInput2').value = colors[1];
  document.getElementById('colorInput3').value = colors[2];
  document.getElementById('colorInput4').value = colors[3];
  
  document.getElementById('colorPicker1').value = colors[0];
  document.getElementById('colorPicker2').value = colors[1];
  document.getElementById('colorPicker3').value = colors[2];
  document.getElementById('colorPicker4').value = colors[3];
  
  // Terapkan warna dengan pengacakan
  applyColors();
}

/* Settings Modal Functions */
function openSettings() {
  document.getElementById('settingsModal').classList.add('active');
  updateLog('Settings panel opened');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');
}

// Sync antara color picker dan text input
function setupColorInputs() {
  for (let i = 1; i <= 4; i++) {
    const picker = document.getElementById(`colorPicker${i}`);
    const input = document.getElementById(`colorInput${i}`);
    
    picker.addEventListener('input', () => {
      input.value = picker.value;
    });
    
    input.addEventListener('input', () => {
      // Validasi format hex
      const value = input.value;
      if (/^#[0-9A-F]{6}$/i.test(value)) {
        picker.value = value;
      }
    });
    
    input.addEventListener('change', () => {
      // Format ulang jika perlu
      if (!/^#/.test(input.value)) {
        input.value = '#' + input.value;
      }
      if (/^#[0-9A-F]{6}$/i.test(input.value)) {
        picker.value = input.value;
      }
    });
  }
}

/* Fungsi untuk menyimpan warna ke localStorage */
function saveColorsToLocalStorage() {
  const colors = {
    bgBody: document.getElementById('colorInput1').value,
    colorButtons: document.getElementById('colorInput2').value,
    colorBorders: document.getElementById('colorInput3').value,
    colorLabels: document.getElementById('colorInput4').value
  };
  localStorage.setItem('concretecalc_colors', JSON.stringify(colors));
}

/* Fungsi untuk menyimpan pengaturan general ke localStorage */
function saveGeneralSettingsToLocalStorage() {
  try {
    const checkbox = document.getElementById('rememberModuleCheckbox');
    const rememberModule = checkbox ? checkbox.checked : false;
    const settings = {
      rememberModule
    };
    if (rememberModule) {
      settings.lastModule = currentModuleKey;
      settings.lastMode = currentMode;
    }
    localStorage.setItem('concretecalc_general', JSON.stringify(settings));
    updateLog(`General settings saved: rememberModule=${rememberModule}, lastModule=${settings.lastModule || 'none'}, lastMode=${settings.lastMode || 'none'}`);
  } catch(e) {
    console.warn('Error saving general settings:', e);
  }
}

/* Fungsi untuk memuat pengaturan general dari localStorage */
function loadGeneralSettingsFromLocalStorage() {
  const savedSettings = localStorage.getItem('concretecalc_general');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    document.getElementById('rememberModuleCheckbox').checked = settings.rememberModule || false;
    if (settings.rememberModule && settings.lastModule) {
      currentModuleKey = settings.lastModule;
      if (settings.lastMode) {
        currentMode = settings.lastMode;
      }
      updateUIFromLoadedSettings();
      updateLog(`Loaded last module: ${currentModuleKey}, mode: ${currentMode}`);
    } else {
      updateLog('Remember module not enabled or no last module saved');
    }
  } else {
    updateLog('No general settings found in localStorage');
  }
}

/* Fungsi untuk mengupdate UI berdasarkan currentModuleKey dan currentMode */
function updateUIFromLoadedSettings() {
  // Update nav buttons
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.target === currentModuleKey) {
      btn.classList.add('active');
    }
  });

  // Update mode toggle buttons
  const modeBtns = document.querySelectorAll('.mode-toggle button');
  modeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === currentMode) {
      btn.classList.add('active');
    }
  });

  // Update custom dropdown
  updateCustomDropdown();

  updateLog(`UI updated to module: ${currentModuleKey}, mode: ${currentMode}`);
}

/* Fungsi untuk memuat warna dari localStorage */
function loadColorsFromLocalStorage() {
  const savedColors = localStorage.getItem('concretecalc_colors');
  if (savedColors) {
    const colors = JSON.parse(savedColors);
    
    // Terapkan warna yang disimpan
    document.documentElement.style.setProperty('--bg-body', colors.bgBody);
    document.documentElement.style.setProperty('--color-buttons', colors.colorButtons);
    document.documentElement.style.setProperty('--color-borders', colors.colorBorders);
    document.documentElement.style.setProperty('--color-labels', colors.colorLabels);
    
    // Update input fields
    document.getElementById('colorInput1').value = colors.bgBody;
    document.getElementById('colorInput2').value = colors.colorButtons;
    document.getElementById('colorInput3').value = colors.colorBorders;
    document.getElementById('colorInput4').value = colors.colorLabels;
    
    document.getElementById('colorPicker1').value = colors.bgBody;
    document.getElementById('colorPicker2').value = colors.colorButtons;
    document.getElementById('colorPicker3').value = colors.colorBorders;
    document.getElementById('colorPicker4').value = colors.colorLabels;
    
    // Update warna teks label
    updateLabelTextColor(colors.colorLabels);
    
    // Update warna teks tombol
    updateButtonTextColors();
    
    updateLog('Colors loaded from localStorage');
  }
}

/* Quick Inputs Listeners */
function setupQuickInputsListeners() {
  const quickFc = document.getElementById('quickFc');
  const quickFy = document.getElementById('quickFy');
  const quickFyt = document.getElementById('quickFyt');

  if (quickFc) {
    quickFc.addEventListener('input', function() {
      quickInputsState.quickFc = this.value;
      updateLog(`Quick input fc updated: ${this.value}`);
    });
  }

  if (quickFy) {
    quickFy.addEventListener('input', function() {
      quickInputsState.quickFy = this.value;
      updateLog(`Quick input fy updated: ${this.value}`);
    });
  }

  if (quickFyt) {
    quickFyt.addEventListener('input', function() {
      quickInputsState.quickFyt = this.value;
      updateLog(`Quick input fyt updated: ${this.value}`);
    });
  }
}

/* Load quick inputs state */
function loadQuickInputsState() {
  if (quickInputsState.quickFc) {
    document.getElementById('quickFc').value = quickInputsState.quickFc;
  }

  if (quickInputsState.quickFy) {
    document.getElementById('quickFy').value = quickInputsState.quickFy;
  }

  if (quickInputsState.quickFyt) {
    document.getElementById('quickFyt').value = quickInputsState.quickFyt;
  }
}

/* Tips Modal Functions */
function openTips() {
  const tipsContent = document.getElementById('tipsContent');
  const currentModule = modules[currentModuleKey];
  
  if (!currentModule) {
    tipsContent.innerHTML = '<p>Modul tidak tersedia. Silakan refresh halaman.</p>';
  } else {
    tipsContent.innerHTML = `
      <h3>Mode ${capitalize(currentMode)}</h3>
      <p>${getModeTips()}</p>
      
      <h3>Modul ${currentModule.name}</h3>
      <p>${currentModule.info}</p>
      
      <h3>Tips Umum</h3>
      <ul>
        <li>Gunakan Quick Inputs untuk mengisi nilai material yang umum</li>
        <li>Simpan draft secara berkala untuk menghindari kehilangan data</li>
        <li>Pastikan semua field terisi sebelum melakukan perhitungan</li>
        <li>Ganti warna tema sesuai preferensi Anda di pengaturan</li>
      </ul>
    `;
  }
  
  document.getElementById('tipsModal').classList.add('active');
  updateLog('Tips panel opened');
}

function closeTips() {
  document.getElementById('tipsModal').classList.remove('active');
}

function getModeTips() {
  if (currentMode === 'desain') {
    return "Mode Desain digunakan untuk merancang elemen struktur baru. Sistem akan menghitung kebutuhan tulangan berdasarkan input yang diberikan.";
  } else {
    return "Mode Evaluasi digunakan untuk memeriksa keamanan elemen struktur yang sudah ada. Sistem akan menganalisis kapasitas elemen berdasarkan tulangan yang dimasukkan.";
  }
}

// Event delegation untuk tombol tips di card headers
function setupTipsButtons() {
  document.addEventListener('click', function(e) {
    if (e.target.closest('.circle-tips-btn')) {
      const tipsBtn = e.target.closest('.circle-tips-btn');
      const tipsText = tipsBtn.getAttribute('data-tips');
      
      const tipsContent = document.getElementById('tipsContent');
      
      // Cek apakah ini tombol di Quick Inputs atau di Module Form
      if (tipsText.includes('Quick Inputs')) {
        tipsContent.innerHTML = `
          <h3>Quick Inputs</h3>
          <p>${tipsText}</p>
          <p>Nilai yang dimasukkan di sini dapat digunakan untuk mengisi field material secara otomatis.</p>
        `;
      } else {
        // Tips untuk module form
        const currentModule = modules[currentModuleKey];
        if (currentModule) {
          tipsContent.innerHTML = `
            <h3>${currentModule.name} — ${capitalize(currentMode)}</h3>
            <p>${tipsText}</p>
            <h3>Field yang Tersedia</h3>
            <ul>
              ${currentModule.fields[currentMode].map(field => 
                `<li><strong>${field.label}</strong>: ${field.placeholder} (${field.unit})</li>`
              ).join('')}
            </ul>
          `;
        } else {
          tipsContent.innerHTML = '<p>Modul tidak tersedia.</p>';
        }
      }
      
      document.getElementById('tipsModal').classList.add('active');
    }
  });
}

/* custom dropdown handler */
function initCustomDropdown() {
  const dropdownSelected = document.getElementById('dropdownSelected');
  const dropdownOptions = document.getElementById('dropdownOptions');
  
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
      
      // Update tampilan dropdown
      dropdownSelected.querySelector('span').textContent = this.textContent;
      dropdownSelected.classList.remove('open');
      dropdownOptions.classList.remove('show');
      
      // Update state dan render
      currentModuleKey = value;
      renderModule();
      
      // Update active state di desktop nav
      const btns = document.querySelectorAll('.nav-btn');
      btns.forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector(`.nav-btn[data-target="${value}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    });
  });
  
  // Tutup dropdown ketika klik di luar
  document.addEventListener('click', function() {
    dropdownSelected.classList.remove('open');
    dropdownOptions.classList.remove('show');
  });
}

/* Update custom dropdown berdasarkan modul aktif */
function updateCustomDropdown() {
  const dropdownSelected = document.getElementById('dropdownSelected');
  const dropdownOptions = document.getElementById('dropdownOptions');

  if (dropdownSelected && dropdownOptions) {
    // Update teks yang ditampilkan
    const currentModule = modules[currentModuleKey];
    if (currentModule) {
      dropdownSelected.querySelector('span').textContent = currentModule.name;
    }

    // Update status aktif di opsi
    dropdownOptions.querySelectorAll('.dropdown-option').forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-value') === currentModuleKey) {
        option.classList.add('active');
      }
    });
  }
}

/* load draft if exists */
function init(){
  console.log('Initializing application...');
  console.log('Available modules:', Object.keys(modules));
  
  try {
    const raw = localStorage.getItem('concretecalc_draft');
    if(raw) {
      const draftData = JSON.parse(raw);
      formState = draftData.formState || {};
      quickInputsState = draftData.quickInputsState || {};
      bebanMode = draftData.bebanMode || {};  // Load bebanMode dari draft
      updateLog('Draft loaded from localStorage (including quick inputs and bebanMode).');
    }
  } catch(e){ console.warn(e) }
  
  // setup color inputs
  setupColorInputs();
  // setup custom dropdown
  initCustomDropdown();
  // load saved colors
  loadColorsFromLocalStorage();
  // setup quick inputs listeners
  setupQuickInputsListeners();
  // load quick inputs state
  loadQuickInputsState();
  // setup tips buttons
  setupTipsButtons();
  // load general settings
  loadGeneralSettingsFromLocalStorage();
  // initial render after loading settings
  renderModule();
  // setup remember module checkbox listener
  document.getElementById('rememberModuleCheckbox').addEventListener('change', saveGeneralSettingsToLocalStorage);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  // Initialize the application
  init();
  
  // Navigation button event listeners
  document.querySelectorAll('.nav-btn').forEach(button => {
    if (button.id !== 'settingsBtn') {
      button.addEventListener('click', switchModule);
    }
  });
  
  // Settings button event listeners
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('mobileSettingsBtn').addEventListener('click', openSettings);
  
  // Mode toggle event listeners
  document.getElementById('desainModeBtn').addEventListener('click', switchMode);
  document.getElementById('evaluasiModeBtn').addEventListener('click', switchMode);
  
  // Action button event listeners
  document.getElementById('saveDraftBtn').addEventListener('click', saveDraft);
  document.getElementById('calculateBtn').addEventListener('click', calculate);
  
  // Modal event listeners
  document.getElementById('closeModalBtn').addEventListener('click', closeSettings);
  document.getElementById('settingsModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeSettings();
    }
  });
  
  // Tips modal event listeners
  document.getElementById('mainTipsBtn').addEventListener('click', openTips);
  document.getElementById('closeTipsModalBtn').addEventListener('click', closeTips);
  document.getElementById('tipsModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeTips();
    }
  });
  
  // Color action event listeners
  document.getElementById('randomColorsBtn').addEventListener('click', applyRandomColors);
  document.getElementById('resetColorsBtn').addEventListener('click', resetColors);
  document.getElementById('applyColorsBtn').addEventListener('click', applyColors);
});