// report.js - Universal Report Renderer untuk semua modul
// Versi 3.1 - Enhanced multi-module support with balok fix

// Generator untuk step number
function* createStepNumber() {
    let step = 1;
    while (true) {
        yield step++;
    }
}

let stepNumberGenerator;

document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 Report.js initialized - Enhanced multi-module support v3.1");
    
    // Terapkan warna dari sessionStorage
    applyColorSettings();
    
    // Muat dan render hasil perhitungan
    loadAndRenderResult();
});

function applyColorSettings() {
    const savedColors = sessionStorage.getItem('colorSettings');
    if (savedColors) {
        try {
            const colors = JSON.parse(savedColors);
            
            // Terapkan semua variabel CSS
            document.documentElement.style.setProperty('--bg-body', colors.bgBody || '#ffffff');
            document.documentElement.style.setProperty('--color-buttons', colors.colorButtons || '#282B53');
            document.documentElement.style.setProperty('--color-borders', colors.colorBorders || '#1C1136');
            document.documentElement.style.setProperty('--color-labels', colors.colorLabels || '#202242');
            document.documentElement.style.setProperty('--button-text-color', colors.buttonTextColor || '#ffffff');
            document.documentElement.style.setProperty('--toggle-text-color', colors.toggleTextColor || '#ffffff');
            document.documentElement.style.setProperty('--toggle-active-text-color', colors.toggleActiveTextColor || '#ffffff');
            
            console.log("✅ Warna diterapkan dari sessionStorage");
            
            // Update warna adaptif
            updateAdaptiveTextColors();
        } catch (e) {
            console.error("Error applying color settings:", e);
        }
    } else {
        // Jika tidak ada warna yang disimpan, update warna adaptif dengan default
        updateAdaptiveTextColors();
    }
}

// Fungsi untuk menghitung kecerahan warna (luminance)
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

// Fungsi untuk mengupdate warna teks yang adaptif
function updateAdaptiveTextColors() {
    const root = document.documentElement;
    const colorButtons = getComputedStyle(root).getPropertyValue('--color-buttons').trim();
    const colorLabels = getComputedStyle(root).getPropertyValue('--color-labels').trim();
    
    // Hitung kecerahan untuk colorButtons
    const luminanceButtons = calculateLuminance(colorButtons);
    const buttonTextColor = luminanceButtons > 0.5 ? '#000000' : '#FFFFFF';
    root.style.setProperty('--button-text-color', buttonTextColor);
    
    // Hitung kecerahan untuk colorLabels
    const luminanceLabels = calculateLuminance(colorLabels);
    const labelTextColor = luminanceLabels > 0.5 ? '#000000' : '#FFFFFF';
    root.style.setProperty('--label-text-color', labelTextColor);
    
    console.log("🎨 Adaptive colors updated:", {
        buttonTextColor,
        labelTextColor,
        luminanceButtons,
        luminanceLabels
    });
}

// ==================== FUNGSI UTAMA: LOAD & RENDER ====================
function loadAndRenderResult() {
    console.log("🔄 Memuat data dari sessionStorage...");
    
    // DEBUG: Tampilkan SEMUA kunci di sessionStorage
    console.log("=== DEBUG SESSION STORAGE ===");
    console.log("Jumlah item di sessionStorage:", sessionStorage.length);
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        console.log(`${i}: ${key} = ${value ? value.substring(0, 100) + '...' : '(empty)'}`);
    }
    console.log("=== END DEBUG ===");
    
    // Daftar semua kemungkinan kunci sessionStorage dari berbagai modul
    const possibleKeys = [
        'calculationResult',      // Default/balok
        'calculateResultPelat',   // Pelat
        'calculateResultKolom',   // Kolom  
        'calculateResultFondasi', // Fondasi
        'calculationResultBalok', // Balok alternatif
        'resultPelat',           // Alternatif pelat
        'resultKolom',           // Alternatif kolom
        'resultFondasi',         // Alternatif fondasi
        'resultBalok',           // Alternatif balok
        'pelatResult',           // Pelat alternatif 2
        'kolomResult',           // Kolom alternatif 2
        'fondasiResult',         // Fondasi alternatif 2
        'balokResult',           // Balok alternatif 2
    ];
    
    let resultData = null;
    let usedKey = null;
    
    // Coba semua kunci yang mungkin
    for (const key of possibleKeys) {
        const data = sessionStorage.getItem(key);
        if (data) {
            resultData = data;
            usedKey = key;
            console.log(`✅ Data ditemukan di sessionStorage dengan kunci: "${key}"`);
            break;
        }
    }
    
    if (!resultData) {
        // Cari kunci yang mengandung 'result' (case insensitive)
        console.log("🔍 Mencari kunci yang mengandung 'result'...");
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.toLowerCase().includes('result')) {
                const data = sessionStorage.getItem(key);
                if (data) {
                    resultData = data;
                    usedKey = key;
                    console.log(`✅ Data ditemukan dengan pencarian 'result': "${key}"`);
                    break;
                }
            }
        }
    }
    
    if (!resultData) {
        // Jika masih tidak ditemukan, tampilkan error dengan detail
        showError("Tidak ada data hasil perhitungan. Silakan kembali dan lakukan perhitungan terlebih dahulu.");
        return;
    }
    
    try {
        const result = JSON.parse(resultData);
        console.log("📊 Data dari sessionStorage (kunci: " + usedKey + "):", result);
        
        // Tambahkan info kunci yang digunakan ke result untuk debugging
        result.sessionStorageKey = usedKey;
        
        // Validasi dan perbaiki data result jika perlu
        const validatedResult = validateAndFixResult(result, usedKey);
        if (!validatedResult) {
            showError("Data hasil perhitungan tidak valid. Struktur data tidak sesuai.");
            return;
        }
        
        // PILIH RENDERER BERDASARKAN MODUL
        const module = validatedResult.module || 'balok';
        console.log(`🎯 Modul yang akan dirender: ${module}`);
        
        // Jalankan renderer yang sesuai berdasarkan modul
        executeModuleRenderer(module, validatedResult);
        
    } catch (error) {
        console.error('Error parsing result:', error);
        showError(`Error memuat hasil perhitungan: ${error.message}`);
    }
}

// Fungsi untuk validasi dan perbaikan data result
function validateAndFixResult(result, usedKey) {
    // Validasi dasar struktur data
    if (!result || typeof result !== 'object') {
        console.error("❌ Result is not an object:", result);
        return null;
    }
    
    // Tentukan modul dari kunci jika tidak ada di data
    if (!result.module) {
        console.warn("⚠ Modul tidak ditemukan dalam data, mencoba menentukan dari kunci...");
        result.module = determineModuleFromKey(usedKey);
        
        if (!result.module) {
            console.error("❌ Tidak dapat menentukan modul dari kunci:", usedKey);
            return null;
        }
        console.log(`✅ Modul ditentukan dari kunci: ${result.module}`);
    }
    
    // Pastikan modul didukung
    const supportedModules = ['balok', 'kolom', 'pelat', 'fondasi'];
    if (!supportedModules.includes(result.module.toLowerCase())) {
        console.error(`❌ Unsupported module: ${result.module}`);
        return null;
    }
    
    // Set default untuk mode jika tidak ada
    if (!result.mode) {
        console.warn("⚠ Mode tidak ditemukan, set default ke 'desain'");
        result.mode = 'desain';
    }
    
    // Pastikan ada properti data
    if (!result.data) {
        console.warn("⚠ Data properti tidak ditemukan, membuat objek kosong");
        result.data = {};
    }
    
    // Untuk modul tertentu, pastikan properti penting ada
    switch(result.module.toLowerCase()) {
        case 'pelat':
            if (!result.inputData && result.data.inputData) {
                result.inputData = result.data.inputData;
            }
            break;
        case 'kolom':
            if (!result.rekap && result.data.rekap) {
                result.rekap = result.data.rekap;
            }
            break;
    }
    
    console.log("✅ Data divalidasi dan diperbaiki:", result);
    return result;
}

// Fungsi untuk menentukan modul dari kunci sessionStorage
function determineModuleFromKey(key) {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('pelat')) return 'pelat';
    if (keyLower.includes('kolom')) return 'kolom';
    if (keyLower.includes('fondasi')) return 'fondasi';
    if (keyLower.includes('balok')) return 'balok';
    
    // Default untuk kunci umum
    if (keyLower === 'calculationresult') return 'balok';
    
    return null;
}

// ==================== MODULE RENDERER DISPATCHER ====================
function executeModuleRenderer(module, result) {
    switch(module.toLowerCase()) {
        case 'kolom':
            if (typeof window.renderKolomReport === 'function') {
                console.log("🔄 Menjalankan renderer untuk KOLOM");
                window.renderKolomReport(result);
            } else {
                console.error('Fungsi renderKolomReport tidak ditemukan');
                console.log("⚠ Menggunakan renderer default sebagai fallback");
                renderAllSections(result);
            }
            break;
            
        case 'pelat':
            if (typeof window.renderPelatReport === 'function') {
                console.log("🔄 Menjalankan renderer untuk PELAT");
                window.renderPelatReport(result);
            } else {
                console.error('Fungsi renderPelatReport tidak ditemukan');
                console.log("⚠ Menggunakan renderer default sebagai fallback");
                renderAllSections(result);
            }
            break;
            
        case 'fondasi':
            if (typeof window.renderFondasiReport === 'function') {
                console.log("🔄 Menjalankan renderer untuk FONDASI");
                window.renderFondasiReport(result);
            } else {
                console.error('Fungsi renderFondasiReport tidak ditemukan');
                console.log("⚠ Menggunakan renderer default sebagai fallback");
                renderAllSections(result);
            }
            break;
            
        case 'balok':
        default:
            console.log("🔄 Menjalankan renderer untuk BALOK");
            // Gunakan renderBalokReport jika tersedia
            if (typeof window.renderBalokReport === 'function') {
                window.renderBalokReport(result);
            } else {
                console.error('Fungsi renderBalokReport tidak ditemukan');
                console.log("⚠ Menggunakan renderer default sebagai fallback");
                renderAllSections(result);
            }
            break;
    }
}

// ==================== FUNGSI RENDER UMUM (FALLBACK) ====================
// Ini hanya digunakan sebagai fallback jika renderer spesifik tidak tersedia
function renderAllSections(result) {
    try {
        console.log("🎨 Rendering semua section (fallback) untuk modul:", result.module);
        
        // Update judul
        updateReportTitle(result);
        
        // Tampilkan data dalam format JSON di setiap container yang ada
        const containers = [
            { id: 'inputDataContainer', title: 'Data Input', data: result.inputData },
            { id: 'resultContainer', title: 'Hasil Perhitungan', data: result.data },
            { id: 'controlContainer', title: 'Kontrol', data: result.kontrol }
        ];
        
        containers.forEach(container => {
            const element = document.getElementById(container.id);
            if (element) {
                if (container.data && Object.keys(container.data).length > 0) {
                    element.innerHTML = `
                        <div class="data-card">
                            <h3>${container.title}</h3>
                            <pre style="font-size: 0.8rem; overflow: auto; max-height: 300px;">${JSON.stringify(container.data, null, 2)}</pre>
                        </div>
                    `;
                } else {
                    element.innerHTML = `<div class="data-card"><p>${container.title} tidak tersedia</p></div>`;
                }
            }
        });
        
        // Untuk penampang, jika ada container-nya, tampilkan pesan
        const penampangContainer = document.querySelector('.penampang-section');
        if (penampangContainer) {
            penampangContainer.innerHTML = `
                <h2>PENAMPANG</h2>
                <p>Gambar penampang tidak tersedia dalam mode fallback.</p>
            `;
        }
        
        console.log("✅ Fallback rendering selesai");
    } catch (error) {
        console.error('Error rendering sections:', error);
        showError(`Error merender laporan: ${error.message}`);
    }
}

// Fungsi utilitas untuk mendapatkan data dari sessionStorage dengan logging
function getResultFromStorage() {
    console.log("🔍 Mencari data di sessionStorage...");
    
    // Cari semua kunci yang mungkin
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        keys.push(sessionStorage.key(i));
    }
    
    console.log("📋 Kunci yang tersedia:", keys);
    
    // Cari kunci yang paling mungkin berisi data result
    const resultKeys = keys.filter(key => 
        key.toLowerCase().includes('result') || 
        key.toLowerCase().includes('calculate')
    );
    
    console.log("🎯 Kunci yang mungkin berisi data:", resultKeys);
    
    if (resultKeys.length === 0) {
        console.error("❌ Tidak ada kunci yang mengandung 'result' atau 'calculate'");
        return null;
    }
    
    // Prioritaskan kunci berdasarkan pola
    const priorityPatterns = [
        /calculateResult/i,
        /result/i,
        /calculation/i
    ];
    
    for (const pattern of priorityPatterns) {
        for (const key of resultKeys) {
            if (pattern.test(key)) {
                const data = sessionStorage.getItem(key);
                console.log(`✅ Data ditemukan dengan pola ${pattern}: ${key}`);
                return { data, key };
            }
        }
    }
    
    // Jika tidak ditemukan dengan pola, ambil kunci pertama
    const firstKey = resultKeys[0];
    const data = sessionStorage.getItem(firstKey);
    console.log(`⚠ Menggunakan kunci pertama yang ditemukan: ${firstKey}`);
    return { data, key: firstKey };
}

// ==================== FUNGSI UTILITAS ====================

function updateReportTitle(result) {
    const module = (result.module || 'balok').toUpperCase();
    const mode = (result.mode || 'desain').toUpperCase();
    
    const titleElement = document.getElementById('reportModuleName');
    if (titleElement) {
        titleElement.textContent = `${module} - ${mode}`;
    }
    
    console.log(`📝 Judul laporan: ${module} - ${mode}`);
}

function showError(message) {
    console.error("❌ Error:", message);
    
    const container = document.getElementById('contentRoot');
    if (!container) {
        console.error("Element #contentRoot tidak ditemukan");
        return;
    }
    
    // Backup content yang sudah ada
    const existingContent = container.innerHTML;
    
    // Buat HTML untuk error message
    let debugHtml = `
        <div class="section" style="text-align: center; margin-bottom: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
            <h2 style="color: #721c24;">❌ Error</h2>
            <p style="color: #721c24; padding: 1rem;">
                ${message}
            </p>
            <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; text-align: left;">
                <h4>Debug Information:</h4>
                <p><strong>Session Storage Keys (${sessionStorage.length} items):</strong></p>
                <ul style="font-family: monospace; font-size: 0.9rem; max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 0.5rem;">
    `;
    
    // Tampilkan semua kunci sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        debugHtml += `<li><strong>${key}:</strong> ${value ? value.substring(0, 200) + (value.length > 200 ? '...' : '') : '(empty)'}</li>`;
    }
    
    debugHtml += `
                </ul>
                <div style="margin-top: 1rem;">
                    <button class="btn primary" onclick="clearStorageAndRetry()" style="margin-right: 0.5rem; background: #dc3545; color: white;">Clear Storage & Retry</button>
                    <button class="btn" onclick="goBack()" style="background: #6c757d; color: white;">Kembali ke Beranda</button>
                </div>
            </div>
        </div>
    `;
    
    // Gabungkan error message dengan konten yang sudah ada
    container.innerHTML = debugHtml + existingContent;
}

function clearStorageAndRetry() {
    console.log("🧹 Membersihkan sessionStorage...");
    
    // Buat daftar semua kunci
    const allKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        allKeys.push(sessionStorage.key(i));
    }
    
    // Simpan colorSettings terlebih dahulu
    const colorSettings = sessionStorage.getItem('colorSettings');
    
    // Clear semua
    sessionStorage.clear();
    
    // Restore colorSettings jika ada
    if (colorSettings) {
        sessionStorage.setItem('colorSettings', colorSettings);
        console.log("✅ colorSettings dipulihkan");
    }
    
    console.log(`🧹 Dihapus ${allKeys.length} kunci dari sessionStorage`);
    console.log("🔄 Reloading page...");
    
    setTimeout(() => {
        location.reload();
    }, 500);
}

function goBack() {
    window.location.href = 'index.html';
}

// ==================== EKSPOR FUNGSI KE GLOBAL SCOPE ====================

// Ekspos fungsi penting ke window untuk digunakan oleh modul lain
window.renderAllSections = renderAllSections;
window.showError = showError;
window.updateReportTitle = updateReportTitle;
window.getResultFromStorage = getResultFromStorage;
window.loadAndRenderResult = loadAndRenderResult;

console.log("✅ report.js loaded successfully - Enhanced multi-module support v3.1");