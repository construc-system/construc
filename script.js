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
            fytField.style.display = 'flex';
        } else {
            fytField.style.display = 'none';
        }
    }

    // Show/hide gammaC field based on module
    const gammaCField = document.getElementById('gammaCField');
    if (gammaCField) {
        if (currentModuleKey === 'fondasi') {
            gammaCField.style.display = 'flex';
        } else {
            gammaCField.style.display = 'none';
        }
    }
    
    // PERBAIKAN: Simpan pengaturan setelah render jika remember module aktif
    const checkbox = document.getElementById('rememberModuleCheckbox');
    if (checkbox && checkbox.checked) {
        saveGeneralSettingsToLocalStorage();
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
    bebanMode: bebanMode
  };
  
  // Debug: Tampilkan state saat ini
  console.log('Saving draft with formState:', formState);
  console.log('Saving draft with quickInputsState:', quickInputsState);
  console.log('Saving draft with bebanMode:', bebanMode);
  
  try {
    localStorage.setItem('concretecalc_draft', JSON.stringify(draftData));
    updateLog('Draft saved to localStorage (including quick inputs and bebanMode).');
    showAlert('Draft berhasil disimpan (lokal).\n\nData yang disimpan:\n- Data Dimensi\n- Data Beban\n- Data Tulangan\n- Data Material\n- Data Lanjutan', '💾 Draft Tersimpan');
  } catch (e) {
    console.error('Error saving draft:', e);
    showAlert('Gagal menyimpan draft. Kemungkinan storage penuh atau data terlalu besar.', '❌ Error Menyimpan Draft');
  }
}

// Hapus fungsi calculate lama karena sekarang ditangani oleh masing-masing modul

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
    document.documentElement.style.setProperty('--label-text-color', '#ffffff');
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
  document.documentElement.style.setProperty('--bg-body', '#ffffff');
  document.documentElement.style.setProperty('--color-buttons', '#282B53');
  document.documentElement.style.setProperty('--color-borders', '#1C1136');
  document.documentElement.style.setProperty('--color-labels', '#202242');
  
  // Reset input fields
  document.getElementById('colorInput1').value = '#ffffff';
  document.getElementById('colorInput2').value = '#282B53';
  document.getElementById('colorInput3').value = '#1C1136';
  document.getElementById('colorInput4').value = '#202242';
  
  document.getElementById('colorPicker1').value = '#ffffff';
  document.getElementById('colorPicker2').value = '#282B53';
  document.getElementById('colorPicker3').value = '#1C1136';
  document.getElementById('colorPicker4').value = '#202242';
  
  // Update warna teks label
  updateLabelTextColor('#202242');
  
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

/* ========= MODAL FUNCTIONS WITH ESC SUPPORT ========= */

// Fungsi untuk menangani tombol ESC
function handleEscKey(e) {
  if (e.key === 'Escape') {
    // Cek modal mana yang sedang aktif dan tutup
    if (document.getElementById('tipsModal').classList.contains('active')) {
      closeTips();
    } else if (document.getElementById('settingsModal').classList.contains('active')) {
      closeSettings();
    } else if (document.getElementById('alertModal').classList.contains('active')) {
      closeAlert();
    }
  }
}

/* Settings Modal Functions */
function openSettings() {
  document.getElementById('settingsModal').classList.add('active');
  updateLog('Settings panel opened');
  // Tambahkan event listener untuk tombol ESC
  document.addEventListener('keydown', handleEscKey);
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');
  // Hapus event listener untuk tombol ESC
  document.removeEventListener('keydown', handleEscKey);
  updateLog('Settings panel closed');
}

/* Tips Modal Functions */
function openTips() {
  const tipsContent = document.getElementById('tipsContent');
  
  // KONTEN TIPS YANG SAMA UNTUK SEMUA MODUL
  tipsContent.innerHTML = `
    <h3>Mode Desain dan Evaluasi</h3>
    <p><strong>Mode Desain</strong> digunakan ketika data tulangan belum ditentukan. Pada mode ini, sistem akan melakukan perhitungan otomatis untuk mencari kombinasi tulangan yang paling efisien dan memenuhi syarat perencanaan.</p>
    <p><strong>Mode Evaluasi</strong> digunakan ketika data tulangan sudah tersedia. Mode ini memungkinkan pengguna meninjau apakah jumlah tulangan yang digunakan telah memenuhi ketentuan kekuatan dan keamanan struktur.</p>
  `;
  
  document.getElementById('tipsModal').classList.add('active');
  updateLog('Tips panel opened - General mode tips');
  
  // Tambahkan event listener untuk tombol ESC
  document.addEventListener('keydown', handleEscKey);
}

function closeTips() {
  document.getElementById('tipsModal').classList.remove('active');
  // Hapus event listener untuk tombol ESC
  document.removeEventListener('keydown', handleEscKey);
  updateLog('Tips panel closed');
}

/* Alert Modal Functions */
function showAlert(message, title = "‼️ Alert") {
  const alertContent = document.getElementById('alertContent');
  const alertModal = document.getElementById('alertModal');
  const alertTitle = document.querySelector('#alertModal .modal-header h2');
  
  alertContent.innerHTML = message;
  alertTitle.textContent = title;
  alertModal.classList.add('active');
  
  // Tambahkan event listener untuk tombol ESC
  document.addEventListener('keydown', handleEscKey);
}

function closeAlert() {
  document.getElementById('alertModal').classList.remove('active');
  // Hapus event listener untuk tombol ESC
  document.removeEventListener('keydown', handleEscKey);
}

// Setup alert modal listeners
function setupAlertModal() {
  const alertModal = document.getElementById('alertModal');
  const closeBtn = document.getElementById('closeAlertModalBtn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAlert);
  }
  
  alertModal.addEventListener('click', function(e) {
    if (e.target === alertModal) {
      closeAlert();
    }
  });
}

// Make showAlert available globally
window.showAlert = showAlert;

// ========== EVENT DELEGATION UNTUK INPUT DINAMIS ==========

// Fungsi event delegation untuk menangani input dinamis
function setupGlobalInputListeners() {
  // Event delegation untuk semua input dengan data-key
  document.addEventListener('input', function(e) {
    if (e.target.matches('input[data-key], select[data-key]')) {
      const input = e.target;
      const key = input.dataset.key;
      
      ensureState(currentModuleKey, currentMode);
      formState[currentModuleKey][currentMode][key] = input.value;
      updateLog(`set ${currentModuleKey}.${currentMode}.${key} = ${input.value}`);
    }
  });

  // Event delegation untuk checkbox
  document.addEventListener('change', function(e) {
    if (e.target.matches('input[type="checkbox"][data-key]')) {
      const checkbox = e.target;
      const key = checkbox.dataset.key;
      
      ensureState(currentModuleKey, currentMode);
      formState[currentModuleKey][currentMode][key] = checkbox.checked;
      updateLog(`set ${currentModuleKey}.${currentMode}.${key} = ${checkbox.checked}`);
    }
  });
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
    const checkbox = document.getElementById('rememberModuleCheckbox');
    if (checkbox) {
      checkbox.checked = settings.rememberModule || false;
    }
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

  const quickGammaC = document.getElementById('quickGammaC');
  if (quickGammaC) {
    quickGammaC.addEventListener('input', function() {
      quickInputsState.quickGammaC = this.value;
      updateLog(`Quick input gammaC updated: ${this.value}`);
    });
  }
}

/* Load quick inputs state */
function loadQuickInputsState() {
  // Load fc
  if (quickInputsState.quickFc !== undefined) {
    const fcInput = document.getElementById('quickFc');
    if (fcInput) fcInput.value = quickInputsState.quickFc;
  }

  // Load fy
  if (quickInputsState.quickFy !== undefined) {
    const fyInput = document.getElementById('quickFy');
    if (fyInput) fyInput.value = quickInputsState.quickFy;
  }

  // Load fyt
  if (quickInputsState.quickFyt !== undefined) {
    const fytInput = document.getElementById('quickFyt');
    if (fytInput) fytInput.value = quickInputsState.quickFyt;
  }

  // Load gammaC
  if (quickInputsState.quickGammaC !== undefined) {
    const gammaCInput = document.getElementById('quickGammaC');
    if (gammaCInput) gammaCInput.value = quickInputsState.quickGammaC;
  }
  
  updateLog('Quick inputs state loaded');
}

// Event delegation untuk tombol tips di card headers
function setupTipsButtons() {
  document.addEventListener('click', function(e) {
    if (e.target.closest('.circle-tips-btn')) {
      const tipsBtn = e.target.closest('.circle-tips-btn');
      
      // JANGAN proses tombol tips utama (yang di samping toggle)
      if (tipsBtn.id === 'mainTipsBtn') {
        return; // Biarkan event handler khusus yang menangani
      }
      
      const tipsText = tipsBtn.getAttribute('data-tips');
      
      const tipsContent = document.getElementById('tipsContent');
      
      // Cek apakah ini tombol di Quick Inputs atau di Module Form
      if (tipsText && tipsText.includes('f\'c —')) {
        // Tips untuk Data Material dengan format baru - Filter berdasarkan modul aktif
        const tipsItems = tipsText.split('\n\n');
        let filteredTips = [];
        
        // Selalu tampilkan f'c dan fy
        filteredTips.push(tipsItems.find(item => item.includes('f\'c —')));
        filteredTips.push(tipsItems.find(item => item.includes('fy —')));
        
        // Tampilkan fyt hanya untuk Balok dan Kolom
        if (currentModuleKey === 'balok' || currentModuleKey === 'kolom') {
          const fytTip = tipsItems.find(item => item.includes('fyt —'));
          if (fytTip) filteredTips.push(fytTip);
        }
        
        // Tampilkan gammaC hanya untuk Fondasi
        if (currentModuleKey === 'fondasi') {
          const gammaCTip = tipsItems.find(item => item.includes('ɣc —'));
          if (gammaCTip) filteredTips.push(gammaCTip);
        }
        
        // Filter null values
        filteredTips = filteredTips.filter(item => item !== undefined);
        
        tipsContent.innerHTML = `
          <h3>Data Material - Panduan Pengisian</h3>
          <div style="line-height: 1.6;">
            ${filteredTips.map(item => {
              const [label, description] = item.split(' — ');
              return `<p><strong>${label}</strong> — ${description}</p>`;
            }).join('')}
          </div>
        `;
      } else if (tipsText && tipsText.includes('Quick Inputs')) {
        tipsContent.innerHTML = `
          <h3>Quick Inputs</h3>
          <p>${tipsText}</p>
          <p>Nilai yang dimasukkan di sini dapat digunakan untuk mengisi field material secara otomatis.</p>
        `;
      } else if (tipsText) {
        // Tips untuk module form - Hapus bagian "Field yang Tersedia"
        const currentModule = modules[currentModuleKey];
        if (currentModule) {
          tipsContent.innerHTML = `
            <h3>${currentModule.name} — ${capitalize(currentMode)}</h3>
            <p>${tipsText}</p>
          `;
        } else {
          tipsContent.innerHTML = '<p>Modul tidak tersedia.</p>';
        }
      }
      
      document.getElementById('tipsModal').classList.add('active');
      
      // Tambahkan event listener untuk tombol ESC
      document.addEventListener('keydown', handleEscKey);
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
      
      // PERBAIKAN: Simpan pengaturan jika remember module aktif
      const checkbox = document.getElementById('rememberModuleCheckbox');
      if (checkbox && checkbox.checked) {
        saveGeneralSettingsToLocalStorage();
      }
      
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

function resetAllData() {
  // Konfirmasi sebelum menghapus
  showAlert(
    'Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.',
    '⚠️ Reset All Data'
  );
  
  // Setup confirm buttons
  const alertContent = document.getElementById('alertContent');
  const confirmHTML = `
    <div style="text-align: center; margin-top: 20px;">
      <button id="confirmReset" class="btn" style="background: #ff6b6b; color: white; margin-right: 10px;">Ya, Hapus Semua</button>
      <button id="cancelReset" class="btn ghost">Batal</button>
    </div>
  `;
  
  alertContent.innerHTML += confirmHTML;
  
  document.getElementById('confirmReset').addEventListener('click', function() {
    // Hapus semua data localStorage yang terkait dengan aplikasi
    localStorage.removeItem('concretecalc_draft');
    localStorage.removeItem('concretecalc_colors');
    localStorage.removeItem('concretecalc_general');
    
    // Reset state aplikasi
    formState = {};
    quickInputsState = {};
    bebanMode = {};
    
    // Reset ke modul dan mode default
    currentModuleKey = 'balok';
    currentMode = 'desain';
    
    // Update UI untuk navigasi dan mode
    updateUIAfterReset();
    
    // Reset warna ke default
    resetColors();
    
    // Reset checkbox remember module
    const checkbox = document.getElementById('rememberModuleCheckbox');
    if (checkbox) {
      checkbox.checked = false;
    }
    
    // Render ulang modul untuk menampilkan form kosong
    renderModule();
    
    // Reset quick inputs
    document.getElementById('quickFc').value = '';
    document.getElementById('quickFy').value = '';
    document.getElementById('quickFyt').value = '';
    document.getElementById('quickGammaC').value = '';
    
    updateLog('All data reset successfully');
    closeAlert();
    showAlert('Semua data telah direset. Aplikasi sekarang dalam keadaan seperti baru.', '✅ Reset Berhasil');
    
    // Tutup modal pengaturan
    closeSettings();
  });
  
  document.getElementById('cancelReset').addEventListener('click', function() {
    closeAlert();
  });
}

/* PERBAIKAN: Fungsi untuk update UI setelah reset */
function updateUIAfterReset() {
  // Update nav buttons di desktop
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.target === 'balok') {
      btn.classList.add('active');
    }
  });

  // Update mode toggle buttons
  const modeBtns = document.querySelectorAll('.mode-toggle button');
  modeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === 'desain') {
      btn.classList.add('active');
    }
  });

  // Update custom dropdown di mobile
  updateCustomDropdown();

  // Update judul modul
  document.getElementById('currentModuleName').textContent = 'Balok';
  
  // Update tombol calculate
  document.getElementById('calculateBtn').textContent = 'Hitung Desain';

  updateLog(`UI reset to default: module=balok, mode=desain`);
}

/* TAMBAHAN: Fungsi untuk setup tombol reset data */
function setupResetDataButton() {
  const resetBtn = document.getElementById('resetAllDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllData);
  }
}

// Fungsi debug untuk memeriksa state
function debugFormState() {
  console.log('=== DEBUG FORM STATE ===');
  console.log('currentModuleKey:', currentModuleKey);
  console.log('currentMode:', currentMode);
  console.log('formState:', formState);
  console.log('quickInputsState:', quickInputsState);
  console.log('bebanMode:', bebanMode);
  
  // Cek nilai specific untuk modul balok
  if (formState.balok) {
    console.log('=== BALOK STATE ===');
    console.log('Desain:', formState.balok.desain);
    console.log('Evaluasi:', formState.balok.evaluasi);
  }
}

// Tambahkan ke window untuk akses dari console
window.debugFormState = debugFormState;
window.getFormState = () => formState;

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
      bebanMode = draftData.bebanMode || {};
      updateLog('Draft loaded from localStorage (including quick inputs and bebanMode).');
    }
  } catch(e){ console.warn(e) }
  
  // Setup berbagai komponen
  loadGeneralSettingsFromLocalStorage();
  setupColorInputs();
  initCustomDropdown();
  loadColorsFromLocalStorage();
  setupQuickInputsListeners();
  loadQuickInputsState();
  setupTipsButtons();
  setupResetDataButton();
  setupAlertModal();
  setupGlobalInputListeners(); // ← TAMBAH INI
  
  // PERBAIKAN: Setup remember module checkbox listener SEBELUM render
  const rememberCheckbox = document.getElementById('rememberModuleCheckbox');
  if (rememberCheckbox) {
    rememberCheckbox.addEventListener('change', function() {
      saveGeneralSettingsToLocalStorage();
      // Jika dicentang, simpan state saat ini
      if (this.checked) {
        saveGeneralSettingsToLocalStorage();
      }
    });
  }
  
  // initial render after loading settings
  renderModule();
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
  // HAPUS: event listener untuk calculateBtn karena sekarang ditangani oleh modul-balok.js
  
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
  
  // TAMBAHAN: Reset data button event listener
  document.getElementById('resetAllDataBtn').addEventListener('click', resetAllData);
});
// Deteksi ketika kembali dari report dan reset state autoDimensi
window.addEventListener('load', function() {
    console.log('[GLOBAL] Page loaded, checking for report back...');
    
    // Cek apakah kita baru saja kembali dari report
    const fromReport = sessionStorage.getItem('fromReport');
    if (fromReport === 'true') {
        console.log('[GLOBAL] Detected back from report, resetting autoDimensi states...');
        
        // Reset semua autoDimensi state untuk semua modul
        Object.keys(formState).forEach(moduleKey => {
            Object.keys(formState[moduleKey] || {}).forEach(modeKey => {
                // Reset autoDimensi untuk semua mode fondasi
                delete formState[moduleKey][modeKey]['autoDimensi_tunggal'];
                delete formState[moduleKey][modeKey]['autoDimensi_menerus'];
                
                console.log(`[GLOBAL] Reset autoDimensi states for ${moduleKey}.${modeKey}`);
            });
        });
        
        // Hapus flag
        sessionStorage.removeItem('fromReport');
        
        // Force re-render modul
        if (typeof renderModule === 'function') {
            setTimeout(() => {
                renderModule();
            }, 100);
        }
    }
});

// Di report.html, tambahkan kode berikut sebelum redirect back:
function goBackToIndex() {
    sessionStorage.setItem('fromReport', 'true');
    window.location.href = 'index.html';
}