// report.js - Universal Report Renderer untuk semua modul

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
        } catch (e) {
            console.error("Error applying color settings:", e);
        }
    }
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
    let cardNumber = 1;

    // DATA MATERIAL
    html += `
        <div class="data-card">
            <h3 style="display: flex; align-items: center; gap: 10px;">
                <div class="feature-icon">${cardNumber++}</div>
                Material
            </h3>
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
            <h3 style="display: flex; align-items: center; gap: 10px;">
                <div class="feature-icon">${cardNumber++}</div>
                Dimensi
            </h3>
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
                    <h3 style="display: flex; align-items: center; gap: 10px;">
                        <div class="feature-icon">${cardNumber++}</div>
                        Beban Kiri
                    </h3>
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
                    <h3 style="display: flex; align-items: center; gap: 10px;">
                        <div class="feature-icon">${cardNumber++}</div>
                        Beban Lapangan
                    </h3>
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
                    <h3 style="display: flex; align-items: center; gap: 10px;">
                        <div class="feature-icon">${cardNumber++}</div>
                        Beban Kanan
                    </h3>
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
    if (inputData.mode === 'evaluasi' && inputData.tulangan) {
        // Ukuran Tulangan
        if (inputData.tulangan.d || inputData.tulangan.phi) {
            html += `
                <div class="data-card">
                    <h3 style="display: flex; align-items: center; gap: 10px;">
                        <div class="feature-icon">${cardNumber++}</div>
                        Ukuran Tulangan
                    </h3>
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
        }

        // Tulangan Kiri
        if (inputData.tulangan.support && hasTulanganData(inputData.tulangan.support)) {
            html += `
                <div class="data-card">
                    <h3 style="display: flex; align-items: center; gap: 10px;">
                        <div class="feature-icon">${cardNumber++}</div>
                        Tulangan Kiri
                    </h3>
            `;
            
            if (inputData.tulangan.support.n) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n</span>
                        <span class="data-value">${inputData.tulangan.support.n}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.support.np) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n'</span>
                        <span class="data-value">${inputData.tulangan.support.np}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.support.nt) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n<sub>t</sub></span>
                        <span class="data-value">${inputData.tulangan.support.nt}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.support.s) {
                html += `
                    <div class="data-row">
                        <span class="data-label">s</span>
                        <span class="data-value">${inputData.tulangan.support.s} mm</span>
                    </div>
                `;
            }
            
            html += `</div>`;
        }

        // Tulangan Lapangan
        if (inputData.tulangan.field && hasTulanganData(inputData.tulangan.field)) {
            html += `
                <div class="data-card">
                    <h3 style="display: flex; align-items: center; gap: 10px;">
                        <div class="feature-icon">${cardNumber++}</div>
                        Tulangan Lapangan
                    </h3>
            `;
            
            if (inputData.tulangan.field.n) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n</span>
                        <span class="data-value">${inputData.tulangan.field.n}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.field.np) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n'</span>
                        <span class="data-value">${inputData.tulangan.field.np}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.field.nt) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n<sub>t</sub></span>
                        <span class="data-value">${inputData.tulangan.field.nt}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.field.s) {
                html += `
                    <div class="data-row">
                        <span class="data-label">s</span>
                        <span class="data-value">${inputData.tulangan.field.s} mm</span>
                    </div>
                `;
            }
            
            html += `</div>`;
        }

        // Tulangan Kanan
        if (inputData.tulangan.supportRight && hasTulanganData(inputData.tulangan.supportRight)) {
            html += `
                <div class="data-card">
                    <h3 style="display: flex; align-items: center; gap: 10px;">
                        <div class="feature-icon">${cardNumber++}</div>
                        Tulangan Kanan
                    </h3>
            `;
            
            if (inputData.tulangan.supportRight.n) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n</span>
                        <span class="data-value">${inputData.tulangan.supportRight.n}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.supportRight.np) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n'</span>
                        <span class="data-value">${inputData.tulangan.supportRight.np}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.supportRight.nt) {
                html += `
                    <div class="data-row">
                        <span class="data-label">n<sub>t</sub></span>
                        <span class="data-value">${inputData.tulangan.supportRight.nt}</span>
                    </div>
                `;
            }
            
            if (inputData.tulangan.supportRight.s) {
                html += `
                    <div class="data-row">
                        <span class="data-label">s</span>
                        <span class="data-value">${inputData.tulangan.supportRight.s} mm</span>
                    </div>
                `;
            }
            
            html += `</div>`;
        }
    }

    // DATA LANJUTAN - hanya tampilkan jika ada nilai atau default
    const lambda = inputData.lanjutan?.lambda;
    const n = inputData.lanjutan?.n;
    
    if (lambda || n) {
        html += `
            <div class="data-card">
                <h3 style="display: flex; align-items: center; gap: 10px;">
                    <div class="feature-icon">${cardNumber++}</div>
                    Konstanta
                </h3>
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

// Helper function untuk mengecek apakah ada data tulangan
function hasTulanganData(tulanganSection) {
    return tulanganSection && (
        tulanganSection.n || 
        tulanganSection.np || 
        tulanganSection.nt || 
        tulanganSection.s
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

    let html = '';

    // REKAP TULANGAN - Dua card: Tumpuan dan Lapangan
    if (rekap.tumpuan && rekap.lapangan) {
        html += `
            <div class="result-item">
                <h4>Tumpuan</h4>
                <p><strong>Tulangan Negatif:</strong> ${rekap.tumpuan.tulangan_negatif || 'N/A'}</p>
                <p><strong>Tulangan Positif:</strong> ${rekap.tumpuan.tulangan_positif || 'N/A'}</p>
                <p><strong>Begel:</strong> ${rekap.tumpuan.begel || 'N/A'}</p>
                ${rekap.tumpuan.torsi && rekap.tumpuan.torsi !== '-' ? `<p><strong>Torsi:</strong> ${rekap.tumpuan.torsi}</p>` : ''}
            </div>
            <div class="result-item">
                <h4>Lapangan</h4>
                <p><strong>Tulangan Negatif:</strong> ${rekap.lapangan.tulangan_negatif || 'N/A'}</p>
                <p><strong>Tulangan Positif:</strong> ${rekap.lapangan.tulangan_positif || 'N/A'}</p>
                <p><strong>Begel:</strong> ${rekap.lapangan.begel || 'N/A'}</p>
                ${rekap.lapangan.torsi && rekap.lapangan.torsi !== '-' ? `<p><strong>Torsi:</strong> ${rekap.lapangan.torsi}</p>` : ''}
            </div>
        `;
    } else {
        html = '<div class="result-item"><p>Data hasil perhitungan tidak tersedia</p></div>';
    }

    container.innerHTML = html;
}

function renderRingkasan(result) {
    const container = document.getElementById('controlContainer');
    
    if (!container) {
        console.error("Element #controlContainer tidak ditemukan");
        return;
    }
    
    const { kontrol_rekap } = result;

    let html = '';

    // RINGKASAN KEKUATAN - Format baru dengan nomor
    if (kontrol_rekap) {
        html += `
            <div class="steps">
        `;

        let stepNumber = 1;

        // Kontrol tumpuan
        if (kontrol_rekap.tumpuan?.lentur_positif) {
            const lentur = kontrol_rekap.tumpuan.lentur_positif;
            html += `
                <div class="step-item">
                    <div class="step-number">${stepNumber++}</div>
                    <div class="step-content">
                        <div class="step-desc">Tahanan Momen Positif Tumpuan</div>
                        <div class="step-body">
                            <div class="step-formula">φM<sub>n</sub> = ${lentur.Md?.toFixed(3) || 'N/A'} kNm ≥ M<sub>u</sub> = ${lentur.Mu?.toFixed(3) || 'N/A'} kNm</div>
                            <div class="step-result">${lentur.aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (kontrol_rekap.tumpuan?.lentur_negatif) {
            const lentur = kontrol_rekap.tumpuan.lentur_negatif;
            html += `
                <div class="step-item">
                    <div class="step-number">${stepNumber++}</div>
                    <div class="step-content">
                        <div class="step-desc">Tahanan Momen Negatif Tumpuan</div>
                        <div class="step-body">
                            <div class="step-formula">φM<sub>n</sub> = ${lentur.Md?.toFixed(3) || 'N/A'} kNm ≥ M<sub>u</sub> = ${lentur.Mu?.toFixed(3) || 'N/A'} kNm</div>
                            <div class="step-result">${lentur.aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (kontrol_rekap.tumpuan?.geser) {
            const geser = kontrol_rekap.tumpuan.geser;
            html += `
                <div class="step-item">
                    <div class="step-number">${stepNumber++}</div>
                    <div class="step-content">
                        <div class="step-desc">Tahanan Geser Tumpuan</div>
                        <div class="step-body">
                            <div class="step-formula">A<sub>v,terpakai</sub> = ${geser.Av_terpakai?.toFixed(2) || 'N/A'} mm² ≥ A<sub>v,perlu</sub> = ${geser.Av_u?.toFixed(2) || 'N/A'} mm²</div>
                            <div class="step-result">${geser.aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Kontrol lapangan
        if (kontrol_rekap.lapangan?.lentur_positif) {
            const lentur = kontrol_rekap.lapangan.lentur_positif;
            html += `
                <div class="step-item">
                    <div class="step-number">${stepNumber++}</div>
                    <div class="step-content">
                        <div class="step-desc">Tahanan Momen Positif Lapangan</div>
                        <div class="step-body">
                            <div class="step-formula">φM<sub>n</sub> = ${lentur.Md?.toFixed(3) || 'N/A'} kNm ≥ M<sub>u</sub> = ${lentur.Mu?.toFixed(3) || 'N/A'} kNm</div>
                            <div class="step-result">${lentur.aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (kontrol_rekap.lapangan?.lentur_negatif) {
            const lentur = kontrol_rekap.lapangan.lentur_negatif;
            html += `
                <div class="step-item">
                    <div class="step-number">${stepNumber++}</div>
                    <div class="step-content">
                        <div class="step-desc">Tahanan Momen Negatif Lapangan</div>
                        <div class="step-body">
                            <div class="step-formula">φM<sub>n</sub> = ${lentur.Md?.toFixed(3) || 'N/A'} kNm ≥ M<sub>u</sub> = ${lentur.Mu?.toFixed(3) || 'N/A'} kNm</div>
                            <div class="step-result">${lentur.aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (kontrol_rekap.lapangan?.geser) {
            const geser = kontrol_rekap.lapangan.geser;
            html += `
                <div class="step-item">
                    <div class="step-number">${stepNumber++}</div>
                    <div class="step-content">
                        <div class="step-desc">Tahanan Geser Lapangan</div>
                        <div class="step-body">
                            <div class="step-formula">A<sub>v,terpakai</sub> = ${geser.Av_terpakai?.toFixed(2) || 'N/A'} mm² ≥ A<sub>v,perlu</sub> = ${geser.Av_u?.toFixed(2) || 'N/A'} mm²</div>
                            <div class="step-result">${geser.aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        html += `</div>`;
    } else {
        html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
    }

    container.innerHTML = html;
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