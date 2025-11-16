// report.js - Universal Report Renderer untuk semua modul

// Generator untuk step number
function* createStepNumber() {
    let step = 1;
    while (true) {
        yield step++;
    }
}

let stepNumberGenerator;

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
    const resultData = sessionStorage.getItem('calculationResult');
    
    if (!resultData) {
        showError("Tidak ada data hasil perhitungan. Silakan kembali dan lakukan perhitungan terlebih dahulu.");
        return;
    }
    
    try {
        const result = JSON.parse(resultData);
        console.log("📊 Data dari sessionStorage:", result);
        
        // Validasi data result
        if (!isValidResult(result)) {
            showError("Data hasil perhitungan tidak valid. Struktur data tidak sesuai.");
            return;
        }
        
        renderAllSections(result);
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

function renderAllSections(result) {
    try {
        renderInputData(result.inputData || {});
        renderHasilPerhitungan(result);
        renderRingkasan(result);
        renderPenampang(result); // Tambahkan render penampang
        
        // Update judul laporan
        updateReportTitle(result);
    } catch (error) {
        console.error('Error rendering sections:', error);
        showError(`Error merender laporan: ${error.message}`);
    }
}

function updateReportTitle(result) {
    const module = (result.module || 'balok').toUpperCase();
    const mode = (result.mode || 'desain').toUpperCase();
    
    document.getElementById('reportModuleName').textContent = `${module} - ${mode}`;
    
    console.log(`📝 Judul laporan: ${module} - ${mode}`);
}

function renderInputData(inputData) {
    const container = document.getElementById('inputDataContainer');
    
    if (!container) {
        console.error("Element #inputDataContainer tidak ditemukan");
        return;
    }

    if (!inputData || Object.keys(inputData).length === 0) {
        container.innerHTML = '<div class="data-card"><p>Tidak ada data input</p></div>';
        return;
    }

    let html = '';

    // DATA MATERIAL
    html += `
        <div class="data-card">
            <h3>Material</h3>
            <div class="data-row">
                <span class="data-label">f'<sub>c</sub></span>
                <span class="data-value">${inputData.material?.fc || 'N/A'} MPa</span>
            </div>
            <div class="data-row">
                <span class="data-label">f<sub>y</sub></span>
                <span class="data-value">${inputData.material?.fy || 'N/A'} MPa</span>
            </div>
            <div class="data-row">
                <span class="data-label">f<sub>yt</sub></span>
                <span class="data-value">${inputData.material?.fyt || 'N/A'} MPa</span>
            </div>
        </div>
    `;

    // DATA DIMENSI
    html += `
        <div class="data-card">
            <h3>Dimensi</h3>
            <div class="data-row">
                <span class="data-label">h</span>
                <span class="data-value">${inputData.dimensi?.h || 'N/A'} mm</span>
            </div>
            <div class="data-row">
                <span class="data-label">b</span>
                <span class="data-value">${inputData.dimensi?.b || 'N/A'} mm</span>
            </div>
            <div class="data-row">
                <span class="data-label">S<sub>b</sub></span>
                <span class="data-value">${inputData.dimensi?.sb || 'N/A'} mm</span>
            </div>
        </div>
    `;

    // DATA BEBAN - 3 card terpisah
    if (inputData.beban) {
        // Beban Kiri
        if (hasBebanData(inputData.beban.left)) {
            html += `
                <div class="data-card">
                    <h3>Beban Kiri</h3>
            `;
            
            if (inputData.beban.left?.mu_pos) {
                html += `<div class="data-row"><span class="data-label">M<sub>u</sub><sup>+</sup></span><span class="data-value">${inputData.beban.left.mu_pos} kNm</span></div>`;
            }
            if (inputData.beban.left?.mu_neg) {
                html += `<div class="data-row"><span class="data-label">M<sub>u</sub><sup>-</sup></span><span class="data-value">${inputData.beban.left.mu_neg} kNm</span></div>`;
            }
            if (inputData.beban.left?.vu) {
                html += `<div class="data-row"><span class="data-label">V<sub>u</sub></span><span class="data-value">${inputData.beban.left.vu} kN</span></div>`;
            }
            if (inputData.beban.left?.tu) {
                html += `<div class="data-row"><span class="data-label">T<sub>u</sub></span><span class="data-value">${inputData.beban.left.tu} kNm</span></div>`;
            }
            
            html += `</div>`;
        }

        // Beban Lapangan
        if (hasBebanData(inputData.beban.center)) {
            html += `
                <div class="data-card">
                    <h3>Beban Lapangan</h3>
            `;
            
            if (inputData.beban.center?.mu_pos) {
                html += `<div class="data-row"><span class="data-label">M<sub>u</sub><sup>+</sup></span><span class="data-value">${inputData.beban.center.mu_pos} kNm</span></div>`;
            }
            if (inputData.beban.center?.mu_neg) {
                html += `<div class="data-row"><span class="data-label">M<sub>u</sub><sup>-</sup></span><span class="data-value">${inputData.beban.center.mu_neg} kNm</span></div>`;
            }
            if (inputData.beban.center?.vu) {
                html += `<div class="data-row"><span class="data-label">V<sub>u</sub></span><span class="data-value">${inputData.beban.center.vu} kN</span></div>`;
            }
            if (inputData.beban.center?.tu) {
                html += `<div class="data-row"><span class="data-label">T<sub>u</sub></span><span class="data-value">${inputData.beban.center.tu} kNm</span></div>`;
            }
            
            html += `</div>`;
        }

        // Beban Kanan
        if (hasBebanData(inputData.beban.right)) {
            html += `
                <div class="data-card">
                    <h3>Beban Kanan</h3>
            `;
            
            if (inputData.beban.right?.mu_pos) {
                html += `<div class="data-row"><span class="data-label">M<sub>u</sub><sup>+</sup></span><span class="data-value">${inputData.beban.right.mu_pos} kNm</span></div>`;
            }
            if (inputData.beban.right?.mu_neg) {
                html += `<div class="data-row"><span class="data-label">M<sub>u</sub><sup>-</sup></span><span class="data-value">${inputData.beban.right.mu_neg} kNm</span></div>`;
            }
            if (inputData.beban.right?.vu) {
                html += `<div class="data-row"><span class="data-label">V<sub>u</sub></span><span class="data-value">${inputData.beban.right.vu} kN</span></div>`;
            }
            if (inputData.beban.right?.tu) {
                html += `<div class="data-row"><span class="data-label">T<sub>u</sub></span><span class="data-value">${inputData.beban.right.tu} kNm</span></div>`;
            }
            
            html += `</div>`;
        }
    }

    // DATA TULANGAN (hanya untuk mode evaluasi)
    const isEvaluasiMode = inputData.mode === 'evaluasi';
    
    if (isEvaluasiMode && inputData.tulangan) {
        console.log("🔍 Data tulangan untuk evaluasi:", inputData.tulangan);
        
        // Ukuran Tulangan
        html += `
            <div class="data-card">
                <h3>Ukuran Tulangan</h3>
        `;
        
        if (inputData.tulangan.d) {
            html += `
                <div class="data-row">
                    <span class="data-label">D</span>
                    <span class="data-value">${inputData.tulangan.d} mm</span>
                </div>
            `;
        }
        
        if (inputData.tulangan.phi) {
            html += `
                <div class="data-row">
                    <span class="data-label">ɸ</span>
                    <span class="data-value">${inputData.tulangan.phi} mm</span>
                </div>
            `;
        }
        
        html += `</div>`;

        // Tulangan Tumpuan
        html += `
            <div class="data-card">
                <h3>Tulangan Tumpuan</h3>
        `;
        
        const tulanganTumpuan = inputData.tulangan.support || {};
        if (tulanganTumpuan.n !== undefined && tulanganTumpuan.n !== null) {
            html += `
                <div class="data-row">
                    <span class="data-label">n</span>
                    <span class="data-value">${tulanganTumpuan.n}</span>
                </div>
            `;
        } else {
            html += `<div class="data-row"><span class="data-label">n</span><span class="data-value">-</span></div>`;
        }
        
        if (tulanganTumpuan.np !== undefined && tulanganTumpuan.np !== null) {
            html += `
                <div class="data-row">
                    <span class="data-label">n'</span>
                    <span class="data-value">${tulanganTumpuan.np}</span>
                </div>
            `;
        } else {
            html += `<div class="data-row"><span class="data-label">n'</span><span class="data-value">-</span></div>`;
        }
        
        if (tulanganTumpuan.nt !== undefined && tulanganTumpuan.nt !== null) {
            html += `
                <div class="data-row">
                    <span class="data-label">n<sub>t</sub></span>
                    <span class="data-value">${tulanganTumpuan.nt}</span>
                </div>
            `;
        } else {
            html += `<div class="data-row"><span class="data-label">n<sub>t</sub></span><span class="data-value">-</span></div>`;
        }
        
        if (tulanganTumpuan.s !== undefined && tulanganTumpuan.s !== null) {
            html += `
                <div class="data-row">
                    <span class="data-label">s</span>
                    <span class="data-value">${tulanganTumpuan.s} mm</span>
                </div>
            `;
        } else {
            html += `<div class="data-row"><span class="data-label">s</span><span class="data-value">-</span></div>`;
        }
        
        html += `</div>`;

        // Tulangan Lapangan
        html += `
            <div class="data-card">
                <h3>Tulangan Lapangan</h3>
        `;
        
        const tulanganLapangan = inputData.tulangan.field || {};
        if (tulanganLapangan.n !== undefined && tulanganLapangan.n !== null) {
            html += `
                <div class="data-row">
                    <span class="data-label">n</span>
                    <span class="data-value">${tulanganLapangan.n}</span>
                </div>
            `;
        } else {
            html += `<div class="data-row"><span class="data-label">n</span><span class="data-value">-</span></div>`;
        }
        
        if (tulanganLapangan.np !== undefined && tulanganLapangan.np !== null) {
            html += `
                <div class="data-row">
                    <span class="data-label">n'</span>
                    <span class="data-value">${tulanganLapangan.np}</span>
                </div>
            `;
        } else {
            html += `<div class="data-row"><span class="data-label">n'</span><span class="data-value">-</span></div>`;
        }
        
        if (tulanganLapangan.nt !== undefined && tulanganLapangan.nt !== null) {
            html += `
                <div class="data-row">
                    <span class="data-label">n<sub>t</sub></span>
                    <span class="data-value">${tulanganLapangan.nt}</span>
                </div>
            `;
        } else {
            html += `<div class="data-row"><span class="data-label">n<sub>t</sub></span><span class="data-value">-</span></div>`;
        }
        
        if (tulanganLapangan.s !== undefined && tulanganLapangan.s !== null) {
            html += `
                <div class="data-row">
                    <span class="data-label">s</span>
                    <span class="data-value">${tulanganLapangan.s} mm</span>
                </div>
            `;
        } else {
            html += `<div class="data-row"><span class="data-label">s</span><span class="data-value">-</span></div>`;
        }
        
        html += `</div>`;
    }

    // DATA LANJUTAN
    const lambda = inputData.lanjutan?.lambda;
    const n = inputData.lanjutan?.n;
    
    if (lambda || n) {
        html += `
            <div class="data-card">
                <h3>Konstanta</h3>
        `;
        
        if (lambda) {
            html += `
                <div class="data-row">
                    <span class="data-label">λ</span>
                    <span class="data-value">${lambda}</span>
                </div>
            `;
        }
        
        if (n) {
            html += `
                <div class="data-row">
                    <span class="data-label">n (kaki begel)</span>
                    <span class="data-value">${n}</span>
                </div>
            `;
        }
        
        html += `</div>`;
    }

    container.innerHTML = html;
}

// Helper function untuk mengecek apakah ada data beban
function hasBebanData(bebanSection) {
    return bebanSection && (
        bebanSection.mu_pos || 
        bebanSection.mu_neg || 
        bebanSection.vu || 
        bebanSection.tu
    );
}

function renderHasilPerhitungan(result) {
    const container = document.getElementById('resultContainer');
    
    if (!container) {
        console.error("Element #resultContainer tidak ditemukan");
        return;
    }
    
    // Validasi data yang diperlukan
    if (!result.rekap) {
        container.innerHTML = '<div class="result-item"><p>Data hasil perhitungan tidak tersedia</p></div>';
        return;
    }

    const { rekap } = result;
    const kontrol = result.kontrol; // Ambil kontrol dari result
    console.log("📊 Data rekap untuk hasil:", rekap);
    console.log("📊 Data kontrol untuk hasil:", kontrol); // Debug

    let html = '';

    // REKAP TULANGAN - Perbaikan pengecekan data
    if (rekap.tumpuan || rekap.lapangan) {
        // Tumpuan
        if (rekap.tumpuan) {
            html += `
                <div class="result-item">
                    <h4>Tumpuan</h4>
                    ${rekap.tumpuan.tulangan_negatif ? `<p><strong>Tulangan Negatif:</strong> ${rekap.tumpuan.tulangan_negatif}</p>` : ''}
                    ${rekap.tumpuan.tulangan_positif ? `<p><strong>Tulangan Positif:</strong> ${rekap.tumpuan.tulangan_positif}</p>` : ''}
                    ${rekap.tumpuan.begel ? `<p><strong>Begel:</strong> ${rekap.tumpuan.begel}</p>` : ''}
                    ${rekap.tumpuan.torsi && rekap.tumpuan.torsi !== '-' ? `<p><strong>Torsi:</strong> ${rekap.tumpuan.torsi}</p>` : ''}
                </div>
            `;
        }

        // Lapangan
        if (rekap.lapangan) {
            html += `
                <div class="result-item">
                    <h4>Lapangan</h4>
                    ${rekap.lapangan.tulangan_negatif ? `<p><strong>Tulangan Negatif:</strong> ${rekap.lapangan.tulangan_negatif}</p>` : ''}
                    ${rekap.lapangan.tulangan_positif ? `<p><strong>Tulangan Positif:</strong> ${rekap.lapangan.tulangan_positif}</p>` : ''}
                    ${rekap.lapangan.begel ? `<p><strong>Begel:</strong> ${rekap.lapangan.begel}</p>` : ''}
                    ${rekap.lapangan.torsi && rekap.lapangan.torsi !== '-' ? `<p><strong>Torsi:</strong> ${rekap.lapangan.torsi}</p>` : ''}
                </div>
            `;
        }

        // KESIMPULAN KEAMANAN - hanya jika kontrol tersedia
        if (kontrol) {
            const statusKeamanan = getStatusKeamanan(kontrol);
            console.log("Status Keamanan:", statusKeamanan); // Untuk debugging

            html += `
                <div class="result-item" style="grid-column: 1 / -1; background: ${statusKeamanan.aman ? '#d4edda' : '#f8d7da'} !important;">
                    <h4>STATUS KEAMANAN STRUKTUR</h4>
                    <div style="text-align: center; padding: 1rem;">
                        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                            ${statusKeamanan.aman ? 
                              '<span class="status-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">✓ STRUKTUR AMAN</span>' : 
                              '<span class="status-tidak-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">✗ PERLU PERBAIKAN</span>'}
                        </div>
                        <p style="margin: 0.5rem 0; color: #666;">${statusKeamanan.detail}</p>
                        
                        ${statusKeamanan.kontrolTidakAman && statusKeamanan.kontrolTidakAman.length > 0 ? `
                            <div style="margin-top: 1rem; text-align: left;">
                                <strong>Bagian yang perlu diperbaiki:</strong>
                                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                                    ${statusKeamanan.kontrolTidakAman.map(kontrol => `<li>${kontrol}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${statusKeamanan.saranPerbaikan && statusKeamanan.saranPerbaikan.length > 0 ? `
                            <div style="margin-top: 1rem; text-align: left;">
                                <strong>Saran perbaikan:</strong>
                                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                                    ${statusKeamanan.saranPerbaikan.map(saran => `<li>${saran}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            // Jika kontrol tidak tersedia
            html += `
                <div class="result-item" style="grid-column: 1 / -1; background: #fff3cd !important;">
                    <h4>STATUS KEAMANAN STRUKTUR</h4>
                    <div style="text-align: center; padding: 1rem;">
                        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.2rem; padding: 0.5rem 1rem; background: #fff3cd; color: #856404;">⚠ DATA KONTROL TIDAK TERSEDIA</span>
                        </div>
                        <p style="margin: 0.5rem 0; color: #666;">Tidak dapat menampilkan status keamanan karena data kontrol tidak ditemukan</p>
                    </div>
                </div>
            `;
        }
    } else {
        html = '<div class="result-item"><p>Data hasil perhitungan tidak tersedia</p></div>';
    }

    container.innerHTML = html;
}

// Fungsi untuk mendapatkan status keamanan struktur
function getStatusKeamanan(kontrol) {
    if (!kontrol) {
        return {
            aman: false,
            detail: 'Data kontrol tidak tersedia',
            saranPerbaikan: ['Tidak dapat memberikan saran karena data kontrol tidak tersedia'],
            kontrolTidakAman: ['Data kontrol tidak ditemukan']
        };
    }

    const kontrolTidakAman = [];
    const saranPerbaikan = [];

    // Cek kontrol lentur
    if (kontrol.kontrolLentur) {
        for (const [key, value] of Object.entries(kontrol.kontrolLentur)) {
            const label = getLabelFromKey(key);
            
            if (value.K_aman === false) {
                kontrolTidakAman.push(`Rasio K ${label}`);
                saranPerbaikan.push(`Perbesar dimensi balok atau tingkatkan mutu beton pada ${label}`);
            }
            
            if (value.Md_aman === false) {
                kontrolTidakAman.push(`Kapasitas lentur ${label}`);
                saranPerbaikan.push(`Tambahkan tulangan lentur atau perbesar dimensi balok pada ${label}`);
            }
            
            if (value.rho_aman === false) {
                if (value.detail?.rho < value.detail?.pmin) {
                    kontrolTidakAman.push(`Rasio ρ minimum ${label}`);
                    saranPerbaikan.push(`Tambahkan tulangan lentur pada ${label} untuk memenuhi rasio minimum`);
                } else {
                    kontrolTidakAman.push(`Rasio ρ maksimum ${label}`);
                    saranPerbaikan.push(`Kurangi tulangan lentur atau perbesar dimensi balok pada ${label}`);
                }
            }
            
            if (value.kapasitas_aman === false) {
                kontrolTidakAman.push(`Kapasitas penampang ${label}`);
                saranPerbaikan.push(`Kurangi jumlah tulangan atau gunakan penampang yang lebih besar pada ${label}`);
            }
        }
    }

    // Cek kontrol geser
    if (kontrol.kontrolGeser) {
        for (const [key, value] of Object.entries(kontrol.kontrolGeser)) {
            const label = getLabelFromKey(key);
            
            if (value.Vs_aman === false) {
                kontrolTidakAman.push(`Tegangan geser ${label}`);
                saranPerbaikan.push(`Perbesar dimensi balok atau tingkatkan mutu beton pada ${label}`);
            }
            
            if (value.Av_aman === false) {
                kontrolTidakAman.push(`Tulangan geser ${label}`);
                saranPerbaikan.push(`Tambahkan tulangan geser (perkecil jarak sengkang, tambah diameter, atau tambah jumlah kaki) pada ${label}`);
            }
        }
    }

    // Cek kontrol torsi
    if (kontrol.kontrolTorsi) {
        for (const [key, value] of Object.entries(kontrol.kontrolTorsi)) {
            const label = getLabelFromKey(key);
            
            if (value.perluDanAman === false) {
                kontrolTidakAman.push(`Torsi ${label}`);
                if (value.detail?.amanTorsi === false) {
                    saranPerbaikan.push(`Tambahkan tulangan torsi (longitudinal dan sengkang tertutup) pada ${label}`);
                } else if (value.detail?.amanBegel1 === false || value.detail?.amanBegel2 === false) {
                    saranPerbaikan.push(`Tambahkan tulangan sengkang torsi pada ${label}`);
                } else {
                    saranPerbaikan.push(`Periksa dan perbaiki tulangan torsi pada ${label}`);
                }
            }
        }
    }

    const aman = kontrolTidakAman.length === 0;

    return {
        aman: aman,
        detail: aman ? 
            'Semua persyaratan keamanan struktur telah terpenuhi' :
            'Beberapa persyaratan keamanan struktur belum terpenuhi',
        saranPerbaikan: saranPerbaikan,
        kontrolTidakAman: kontrolTidakAman
    };
}

function renderRingkasan(result) {
    const container = document.getElementById('controlContainer');
    
    if (!container) {
        console.error("Element #controlContainer tidak ditemukan");
        return;
    }
    
    const { kontrol, data } = result;
    console.log("📋 Data kontrol detail:", kontrol);
    console.log("📋 Data hasil perhitungan:", data);

    let html = '';

    // Reset step number generator
    stepNumberGenerator = createStepNumber();

    if (kontrol && data) {
        html = `
            <div class="steps">
                ${renderKontrolPerLokasi('KIRI', kontrol, data)}
                ${renderKontrolPerLokasi('LAPANGAN', kontrol, data)} 
                ${renderKontrolPerLokasi('KANAN', kontrol, data)}
            </div>
        `;
    } else {
        html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
    }

    container.innerHTML = html;
}

function renderKontrolPerLokasi(lokasi, kontrol, data) {
    let html = '';

    const mapping = {
        'KIRI': {
            lentur_negatif: 'kiri_negatif',
            lentur_positif: 'kiri_positif', 
            geser: 'kiri',
            torsi: 'kiri',
            data_lentur_neg: data.tulanganKirinegatif,
            data_lentur_pos: data.tulanganKiripositif,
            data_geser: data.begelkiri,
            data_torsi: data.torsikiri
        },
        'LAPANGAN': {
            lentur_negatif: 'tengah_negatif',
            lentur_positif: 'tengah_positif',
            geser: 'tengah', 
            torsi: 'tengah',
            data_lentur_neg: data.tulanganTengahnegatif,
            data_lentur_pos: data.tulanganTengahpositif,
            data_geser: data.begeltengah,
            data_torsi: data.torsitengah
        },
        'KANAN': {
            lentur_negatif: 'kanan_negatif',
            lentur_positif: 'kanan_positif',
            geser: 'kanan',
            torsi: 'kanan',
            data_lentur_neg: data.tulanganKanannegatif,
            data_lentur_pos: data.tulanganKananpositif,
            data_geser: data.begelkanan,
            data_torsi: data.torsikanan
        }
    };

    const config = mapping[lokasi];
    if (!config) return '';

    // 1. KONTROL RASIO TULANGAN (K)
    if (kontrol.kontrolLentur && kontrol.kontrolLentur[config.lentur_negatif]) {
        const kontrolData = kontrol.kontrolLentur[config.lentur_negatif];
        if (kontrolData.K_aman !== undefined) {
            html += renderStep(
                stepNumberGenerator.next().value,
                `Kontrol Rasio Tulangan (K) ${lokasi} Negatif`,
                `K = ${kontrolData.detail?.K?.toFixed(4) || 'N/A'} ≤ K<sub>max</sub> = ${kontrolData.detail?.Kmaks?.toFixed(4) || 'N/A'}`,
                kontrolData.K_aman
            );
        }
    }

    if (kontrol.kontrolLentur && kontrol.kontrolLentur[config.lentur_positif]) {
        const kontrolData = kontrol.kontrolLentur[config.lentur_positif];
        if (kontrolData.K_aman !== undefined) {
            html += renderStep(
                stepNumberGenerator.next().value,
                `Kontrol Rasio Tulangan (K) ${lokasi} Positif`,
                `K = ${kontrolData.detail?.K?.toFixed(4) || 'N/A'} ≤ K<sub>max</sub> = ${kontrolData.detail?.Kmaks?.toFixed(4) || 'N/A'}`,
                kontrolData.K_aman
            );
        }
    }

    // 2. KONTROL RASIO TULANGAN (ρ)
    if (kontrol.kontrolLentur && kontrol.kontrolLentur[config.lentur_negatif]) {
        const kontrolData = kontrol.kontrolLentur[config.lentur_negatif];
        if (kontrolData.rho_aman !== undefined) {
            html += renderStep(
                stepNumberGenerator.next().value,
                `Kontrol Rasio Tulangan (ρ) ${lokasi} Negatif`,
                `ρ<sub>min</sub> = ${kontrolData.detail?.pmin?.toFixed(4) || 'N/A'} ≤ ρ = ${kontrolData.detail?.rho?.toFixed(4) || 'N/A'} ≤ ρ<sub>max</sub> = ${kontrolData.detail?.pmax?.toFixed(4) || 'N/A'}`,
                kontrolData.rho_aman
            );
        }
    }

    if (kontrol.kontrolLentur && kontrol.kontrolLentur[config.lentur_positif]) {
        const kontrolData = kontrol.kontrolLentur[config.lentur_positif];
        if (kontrolData.rho_aman !== undefined) {
            html += renderStep(
                stepNumberGenerator.next().value,
                `Kontrol Rasio Tulangan (ρ) ${lokasi} Positif`,
                `ρ<sub>min</sub> = ${kontrolData.detail?.pmin?.toFixed(4) || 'N/A'} ≤ ρ = ${kontrolData.detail?.rho?.toFixed(4) || 'N/A'} ≤ ρ<sub>max</sub> = ${kontrolData.detail?.pmax?.toFixed(4) || 'N/A'}`,
                kontrolData.rho_aman
            );
        }
    }

    // 3. KONTROL KAPASITAS LENTUR
    if (config.data_lentur_neg && config.data_lentur_neg.Md !== undefined && config.data_lentur_neg.Mu !== undefined) {
        const aman = config.data_lentur_neg.Md >= config.data_lentur_neg.Mu;
        html += renderStep(
            stepNumberGenerator.next().value,
            `Kontrol Kapasitas Lentur ${lokasi} Negatif`,
            `M<sub>d</sub> = ${config.data_lentur_neg.Md?.toFixed(3)} kNm ≥ M<sub>u</sub> = ${config.data_lentur_neg.Mu?.toFixed(3)} kNm`,
            aman
        );
    }

    if (config.data_lentur_pos && config.data_lentur_pos.Md !== undefined && config.data_lentur_pos.Mu !== undefined) {
        const aman = config.data_lentur_pos.Md >= config.data_lentur_pos.Mu;
        html += renderStep(
            stepNumberGenerator.next().value,
            `Kontrol Kapasitas Lentur ${lokasi} Positif`,
            `M<sub>d</sub> = ${config.data_lentur_pos.Md?.toFixed(3)} kNm ≥ M<sub>u</sub> = ${config.data_lentur_pos.Mu?.toFixed(3)} kNm`,
            aman
        );
    }

    // 4. KONTROL GESER
    if (kontrol.kontrolGeser && kontrol.kontrolGeser[config.geser]) {
        const kontrolData = kontrol.kontrolGeser[config.geser];
        if (kontrolData.Vs_aman !== undefined) {
            const Vs = kontrolData.detail?.Vs;
            const Vs_maks = kontrolData.detail?.Vs_maks;
            html += renderStep(
                stepNumberGenerator.next().value,
                `Kontrol Geser ${lokasi}`,
                `V<sub>s</sub> = ${Vs !== undefined ? Vs.toFixed(2) : 'N/A'} kN ≤ V<sub>s,max</sub> = ${Vs_maks !== undefined ? Vs_maks.toFixed(2) : 'N/A'} kN`,
                kontrolData.Vs_aman
            );
        }
    }

    if (kontrol.kontrolGeser && kontrol.kontrolGeser[config.geser]) {
        const kontrolData = kontrol.kontrolGeser[config.geser];
        if (kontrolData.Av_aman !== undefined) {
            html += renderStep(
                stepNumberGenerator.next().value,
                `Kontrol Tulangan Geser ${lokasi}`,
                `A<sub>v,d</sub> = ${kontrolData.detail?.Av_terpakai?.toFixed(2) || 'N/A'} mm² ≥ A<sub>v,u</sub> = ${kontrolData.detail?.Av_u?.toFixed(2) || 'N/A'} mm²`,
                kontrolData.Av_aman
            );
        }
    }

    // 5. KONTROL TORSI
    if (kontrol.kontrolTorsi && kontrol.kontrolTorsi[config.torsi]) {
        const kontrolData = kontrol.kontrolTorsi[config.torsi];
        if (kontrolData.perluDanAman !== undefined && kontrolData.detail?.perluTorsi) {
            html += renderStep(
                stepNumberGenerator.next().value,
                `Kontrol Torsi ${lokasi}`,
                `T<sub>n</sub> = ${kontrolData.detail?.Tn?.toFixed(3) || 'N/A'} kNm ≥ T<sub>u</sub> = ${kontrolData.detail?.Tu?.toFixed(3) || 'N/A'} kNm`,
                kontrolData.perluDanAman
            );
        }
    }

    if (config.data_torsi && config.data_torsi.perluTorsi) {
        const kontrolBegel1 = config.data_torsi.kontrolBegel1;
        html += renderStep(
            stepNumberGenerator.next().value,
            `Kontrol Begel Torsi ${lokasi}`,
            `A<sub>v,t</sub> ≥ ${kontrolBegel1 !== undefined ? parseFloat(kontrolBegel1).toFixed(0) : 'N/A'} mm²`,
            config.data_torsi.amanBegel1
        );
    }

    return html;
}

// Helper function untuk render step
function renderStep(number, desc, formula, aman) {
    return `
        <div class="step-item">
            <div class="step-number">${number}</div>
            <div class="step-content">
                <div class="step-desc">${desc}</div>
                <div class="step-body">
                    <div class="step-formula">${formula}</div>
                    <div class="step-result">${aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>
                </div>
            </div>
        </div>
    `;
}

// Helper function untuk membuat label yang lebih readable
function getLabelFromKey(key) {
    const labels = {
        'kiri_negatif': 'Tumpuan Kiri Negatif',
        'tengah_negatif': 'Lapangan Negatif', 
        'kanan_negatif': 'Tumpuan Kanan Negatif',
        'kiri_positif': 'Tumpuan Kiri Positif',
        'tengah_positif': 'Lapangan Positif',
        'kanan_positif': 'Tumpuan Kanan Positif',
        'kiri': 'Tumpuan Kiri',
        'tengah': 'Lapangan',
        'kanan': 'Tumpuan Kanan'
    };
    
    return labels[key] || key.replace(/_/g, ' ').toUpperCase();
}

// FUNGSI BARU: Render Penampang Balok
function renderPenampang(result) {
    const container = document.getElementById('svg-container');
    if (!container) {
        console.error("Element #svg-container tidak ditemukan");
        return;
    }

    // Ambil data dari hasil perhitungan
    const { data, inputData, mode } = result;
    
    if (!data || !inputData) {
        console.error("Data tidak lengkap untuk render penampang");
        container.innerHTML = '<p style="text-align: center; color: #888;">Data penampang tidak tersedia</p>';
        return;
    }

    try {
        // Ambil data dimensi
        const dimensi = inputData.dimensi || {};
        const lebar = parseFloat(dimensi.b) || 300;
        const tinggi = parseFloat(dimensi.h) || 500;
        const sb = parseFloat(dimensi.sb) || 30;

        // Ambil data material dan tulangan
        const material = inputData.material || {};
        const tulangan = inputData.tulangan || {};

        // Tentukan D dan phi berdasarkan mode
        let D, phi;
        if (mode === 'evaluasi' && tulangan) {
            D = parseFloat(tulangan.d) || 19;
            phi = parseFloat(tulangan.phi) || 10;
        } else {
            // Untuk mode desain, gunakan nilai default atau dari hasil optimasi
            D = 19;
            phi = 10;
        }

        // Ambil jumlah tulangan dari hasil perhitungan
        // Gunakan jumlah maksimum dari tumpuan kiri/kanan untuk konservatif
        const jumlahAtas = Math.max(
            data.tulanganKirinegatif?.n || 2,
            data.tulanganKanannegatif?.n || 2
        );
        const jumlahBawah = Math.max(
            data.tulanganKiripositif?.n || 3,
            data.tulanganKananpositif?.n || 3
        );

        // Ambil m dari hasil perhitungan
        const m = data.m || 3;

        console.log("📐 Data untuk penampang:", {
            lebar, tinggi, D, phi, jumlahAtas, jumlahBawah, sb, m
        });

        // Tampilkan loading terlebih dahulu
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <p>Memuat gambar penampang...</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                    Lebar: ${lebar} mm, Tinggi: ${tinggi} mm<br>
                    Tulangan: ${jumlahBawah}D${D} bawah, ${jumlahAtas}D${D} atas<br>
                    Begel: Ø${phi}
                </p>
            </div>
        `;

        // Panggil fungsi render dari cut-generator
        if (typeof window.renderPenampangBalok === 'function') {
            window.renderPenampangBalok({
                lebar: lebar,
                tinggi: tinggi,
                D: D,
                begel: phi,
                jumlahAtas: jumlahAtas,
                jumlahBawah: jumlahBawah,
                selimut: sb,
                m: m
            });
        } else {
            // Fallback jika cut-generator belum siap
            console.warn("cut-generator.js belum dimuat, menunggu...");
            
            // Coba load ulang cut-generator
            setTimeout(() => {
                if (typeof window.renderPenampangBalok === 'function') {
                    window.renderPenampangBalok({
                        lebar: lebar,
                        tinggi: tinggi,
                        D: D,
                        begel: phi,
                        jumlahAtas: jumlahAtas,
                        jumlahBawah: jumlahBawah,
                        selimut: sb,
                        m: m
                    });
                } else {
                    // Jika masih gagal, tampilkan pesan error
                    container.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: #dc3545;">
                            <p>Gagal memuat gambar penampang</p>
                            <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                                Modul cut-generator.js tidak tersedia
                            </p>
                        </div>
                    `;
                }
            }, 1000);
        }

    } catch (error) {
        console.error('Error rendering penampang:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #dc3545;">
                <p>Error memuat gambar penampang</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                    ${error.message}
                </p>
            </div>
        `;
    }
}

// Fungsi utilitas
function isAllControlsAman(kontrol_rekap) {
    if (!kontrol_rekap) return false;
    
    return (
        kontrol_rekap.tumpuan?.lentur_negatif?.aman &&
        kontrol_rekap.tumpuan?.lentur_positif?.aman &&
        kontrol_rekap.tumpuan?.geser?.aman &&
        kontrol_rekap.lapangan?.lentur_negatif?.aman &&
        kontrol_rekap.lapangan?.lentur_positif?.aman &&
        kontrol_rekap.lapangan?.geser?.aman
    );
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
                <p><strong>Session Storage Data:</strong> ${sessionStorage.getItem('calculationResult') ? 'Available' : 'Not Available'}</p>
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
    sessionStorage.removeItem('calculationResult');
    sessionStorage.removeItem('colorSettings');
    location.reload();
}

function goBack() {
    window.location.href = 'index.html';
}

console.log("✅ report.js loaded successfully");