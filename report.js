// report.js - Universal Report Renderer untuk semua modul
// Di report.js, tambahkan di bagian paling atas
function loadScript(src, onLoad) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            onLoad && onLoad();
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load report-pelat.js jika belum ada
if (typeof window.renderPelatReport === 'undefined') {
    console.log("🔄 report-pelat.js belum dimuat, loading sekarang...");
    loadScript('report-pelat.js', function() {
        console.log("✅ report-pelat.js loaded dynamically");
        // Setelah loaded, coba render lagi
        setTimeout(loadAndRenderResult, 100);
    }).catch(err => {
        console.error("❌ Gagal memuat report-pelat.js:", err);
    });
}

document.addEventListener("DOMContentLoaded", function() {
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

function loadAndRenderResult() {
    // CEK SEMUA KEY YANG MUNGKIN UNTUK SEMUA MODUL
    let resultData = sessionStorage.getItem('calculationResult'); // Balok
    let moduleType = 'balok';
    
    if (!resultData) {
        resultData = sessionStorage.getItem('calculationResultPelat'); // Pelat
        moduleType = 'pelat';
    }
    
    if (!resultData) {
        resultData = sessionStorage.getItem('calculationResultKolom'); // Kolom
        moduleType = 'kolom';
    }
    
    // PERBAIKAN: Tambahkan penanganan untuk fondasi
    if (!resultData) {
        resultData = sessionStorage.getItem('calculationResultFondasi'); // Fondasi
        moduleType = 'fondasi';
    }
    
    console.log("🔍 Mencari data di sessionStorage:", {
        balok: sessionStorage.getItem('calculationResult') ? 'ADA' : 'TIDAK ADA',
        pelat: sessionStorage.getItem('calculationResultPelat') ? 'ADA' : 'TIDAK ADA', 
        kolom: sessionStorage.getItem('calculationResultKolom') ? 'ADA' : 'TIDAK ADA',
        fondasi: sessionStorage.getItem('calculationResultFondasi') ? 'ADA' : 'TIDAK ADA', // TAMBAHKAN INI
        moduleType: moduleType
    });
    
    if (!resultData) {
        showError("Tidak ada data hasil perhitungan. Silakan kembali dan lakukan perhitungan terlebih dahulu.");
        return;
    }
    
    try {
        const result = JSON.parse(resultData);
        console.log("📊 Data dari sessionStorage:", { moduleType, result });
        
        // Validasi data result
        if (!isValidResult(result)) {
            showError("Data hasil perhitungan tidak valid. Struktur data tidak sesuai.");
            return;
        }
        
        // Pilih renderer berdasarkan modul
        const module = result.module || moduleType;
        
        if (module === 'balok') {
            if (typeof window.renderBalokReport === 'function') {
                window.renderBalokReport(result);
            } else {
                showError("Renderer balok tidak tersedia. Pastikan report-balok.js sudah dimuat.");
            }
        } else if (module === 'pelat') {
            if (typeof window.renderPelatReport === 'function') {
                window.renderPelatReport(result);
            } else {
                showError("Renderer pelat tidak tersedia. Pastikan report-pelat.js sudah dimuat.");
            }
        } else if (module === 'kolom') {
            if (typeof window.renderKolomReport === 'function') {
                window.renderKolomReport(result);
            } else {
                showError("Renderer kolom tidak tersedia. Pastikan report-kolom.js sudah dimuat.");
            }
        } else if (module === 'fondasi') { // PERBAIKAN: Tambahkan case untuk fondasi
            if (typeof window.renderFondasiReport === 'function') {
                window.renderFondasiReport(result);
            } else {
                showError("Renderer fondasi tidak tersedia. Pastikan report-fondasi.js sudah dimuat.");
            }
        } else {
            showError(`Modul tidak dikenali: ${module}`);
        }
        
    } catch (error) {
        console.error('Error parsing result:', error);
        showError(`Error memuat hasil perhitungan: ${error.message}`);
    }
}

function isValidResult(result) {
    // Validasi dasar struktur data
    if (!result || typeof result !== 'object') {
        console.error("❌ Result is not an object:", result);
        return false;
    }
    
    // Validasi properti yang diperlukan
    const requiredProps = ['module', 'mode', 'data'];
    for (const prop of requiredProps) {
        if (!result[prop]) {
            console.error(`❌ Missing required property: ${prop}`, result);
            return false;
        }
    }
    
    return true;
}

function updateReportTitle(result) {
    const module = (result.module || 'balok').toUpperCase();
    const mode = (result.mode || 'desain').toUpperCase();
    
    document.getElementById('reportModuleName').textContent = `${module} - ${mode}`;
    
    console.log(`📝 Judul laporan: ${module} - ${mode}`);
}

function showError(message) {
    const container = document.getElementById('contentRoot');
    if (!container) {
        console.error("Element #contentRoot tidak ditemukan");
        return;
    }
    
    container.innerHTML = `
        <div class="section" style="text-align: center;">
            <h2>❌ Error</h2>
            <p>${message}</p>
            <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; text-align: left;">
                <h4>Debug Information:</h4>
                <p><strong>Session Storage Data (Balok):</strong> ${sessionStorage.getItem('calculationResult') ? 'Available' : 'Not Available'}</p>
                <p><strong>Session Storage Pelat:</strong> ${sessionStorage.getItem('calculationResultPelat') ? 'Available' : 'Not Available'}</p>
                <p><strong>Session Storage Kolom:</strong> ${sessionStorage.getItem('calculationResultKolom') ? 'Available' : 'Not Available'}</p>
                <p><strong>Session Storage Fondasi:</strong> ${sessionStorage.getItem('calculationResultFondasi') ? 'Available' : 'Not Available'}</p> <!-- TAMBAHKAN INI -->
                <p><strong>Color Settings:</strong> ${sessionStorage.getItem('colorSettings') ? 'Available' : 'Not Available'}</p>
                <button class="btn ghost" onclick="clearStorageAndRetry()">Clear Storage & Retry</button>
            </div>
            <div class="action-buttons">
                <button class="btn primary" onclick="goBack()">Kembali ke Beranda</button>
            </div>
        </div>
    `;
}

function clearStorageAndRetry() {
    // PERBAIKAN: Hapus semua key yang mungkin ada
    sessionStorage.removeItem('calculationResult');
    sessionStorage.removeItem('calculationResultPelat');
    sessionStorage.removeItem('calculationResultKolom');
    sessionStorage.removeItem('calculationResultFondasi'); // TAMBAHKAN INI
    sessionStorage.removeItem('colorSettings');
    location.reload();
}

function goBack() {
    window.location.href = 'index.html';
}

// Fungsi utilitas umum
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return parseFloat(value).toFixed(decimals);
}

function getStatusClass(aman) {
    return aman ? 'status-aman' : 'status-tidak-aman';
}

function getStatusText(aman) {
    return aman ? '✓ AMAN' : '✗ TIDAK AMAN';
}

console.log("✅ report.js loaded successfully (with fondasi support)");