// report-balok.js - Renderer khusus untuk laporan balok
// Dibungkus dengan IIFE untuk mencegah konflik variabel global

(function() {
    'use strict';
    
    // Generator untuk step number - LOKAL SCOPE
    function* createStepNumber() {
        let step = 1;
        while (true) {
            yield step++;
        }
    }
    
    // Variabel generator - LOKAL SCOPE
    let stepNumberGenerator;
    
    // ==================== FUNGSI UTAMA ====================
    function renderBalokReport(result) {
        try {
            updateReportTitle(result);
            renderInputData(result.inputData || {});
            renderHasilPerhitungan(result);
            renderRingkasan(result);
            renderEfisiensiTulangan(result);
            renderPenampang(result);
            
            console.log("✅ Laporan balok berhasil di-render");
        } catch (error) {
            console.error('Error rendering balok report:', error);
            showError(`Error merender laporan balok: ${error.message}`);
        }
    }
    
    // ==================== FUNGSI RENDER ====================
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
    
        // Cek kontrol torsi (diperbarui untuk 2 kondisi torsi)
        if (kontrol.kontrolTorsi) {
            for (const [key, value] of Object.entries(kontrol.kontrolTorsi)) {
                const label = getLabelFromKey(key);
                
                if (value.perluDanAman === false) {
                    kontrolTidakAman.push(`Torsi ${label}`);
                    const detail = value.detail;
                    
                    // Berikan saran spesifik berdasarkan kondisi torsi yang tidak aman
                    if (detail) {
                        if (detail.perluTorsi) {
                            if (!detail.amanTorsi1) {
                                saranPerbaikan.push(`Perbesar At/s sengkang torsi pada ${label} (minimum: ${detail.kontrolTorsi?.toFixed(3) || 'N/A'} mm²/mm)`);
                            }
                            if (!detail.amanTorsi2) {
                                const A1_kebutuhan = detail.A1 || 0;
                                const A1_terpasang = detail.A1_terpasang || 0;
                                saranPerbaikan.push(`Tambahkan tulangan longitudinal torsi (A1) pada ${label}: dibutuhkan ${A1_kebutuhan.toFixed(2)} mm², terpasang ${A1_terpasang.toFixed(2)} mm²`);
                            }
                        } else {
                            saranPerbaikan.push(`Tidak perlu torsi pada ${label}, tetapi ada masalah dalam kontrol torsi`);
                        }
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
    
        // Reset step number generator (LOKAL)
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
                // Diperbarui satuan mm² menjadi mm²/m 
                html += renderStep(
                    stepNumberGenerator.next().value,
                    `Kontrol Tulangan Geser ${lokasi}`,
                    `A<sub>v,d</sub> = ${kontrolData.detail?.Av_terpakai?.toFixed(2) || 'N/A'} mm²/m ≥ A<sub>v,u</sub> = ${kontrolData.detail?.Av_u?.toFixed(2) || 'N/A'} mm²/m`,
                    kontrolData.Av_aman
                );
            }
        }
    
        // 5. KONTROL TORSI
        if (kontrol.kontrolTorsi && kontrol.kontrolTorsi[config.torsi]) {
            const kontrolData = kontrol.kontrolTorsi[config.torsi];
            const detail = kontrolData.detail;
            
            if (detail?.perluTorsi) {
                // Kontrol 3: amanTorsi1 (At_per_S >= kontrolTorsi)
                html += renderStep(
                    stepNumberGenerator.next().value,
                    `Kontrol Sengkang Torsi ${lokasi}`,
                    `A<sub>t</sub>/s = ${detail?.At_per_S?.toFixed(3) || 'N/A'} mm²/mm ≥ ${detail?.kontrolTorsi?.toFixed(3) || 'N/A'} mm²/mm`,
                    detail?.amanTorsi1
                );
                
                // Kontrol 4: amanTorsi2 (A1_terpasang >= A1) -> Diubah A1,d dan A1,u
                const A1_terpasang = detail?.A1_terpasang || 0;
                const A1 = detail?.A1 || 0;
                html += renderStep(
                    stepNumberGenerator.next().value,
                    `Kontrol Tulangan Longitudinal Torsi ${lokasi}`,
                    `A<sub>1,d</sub> = ${A1_terpasang.toFixed(2)} mm² ≥ A<sub>1,u</sub> = ${A1.toFixed(2)} mm²`,
                    detail?.amanTorsi2
                );
            } else {
                // Tidak perlu torsi
                html += renderStep(
                    stepNumberGenerator.next().value,
                    `Kontrol Torsi ${lokasi}`,
                    `T<sub>u</sub> = ${detail?.Tu?.toFixed(3) || 'N/A'} kNm ≤ T<sub>u,min</sub> = ${detail?.Tu_min?.toFixed(3) || 'N/A'} kNm (Tidak Perlu Torsi)`,
                    true
                );
            }
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

    // ==================== FUNGSI EFISIENSI TULANGAN ====================
    function renderEfisiensiTulangan(result) {
        const controlContainer = document.getElementById('controlContainer');
        if (!controlContainer) return;
        const parentSection = controlContainer.closest('.section');

        // Pastikan tidak menduplikasi saat re-render
        let existingSection = document.getElementById('efisiensi-section-balok');
        if (existingSection) existingSection.remove();

        const section = document.createElement('section');
        section.className = 'section efisiensi-tulangan';
        section.id = 'efisiensi-section-balok';

        const { data, kontrol } = result;
        if (!data || !kontrol) return;

        // Helper fungsi amankan pembagian dengan 0
        const safeDiv = (num, den) => (den && den > 0) ? (num / den) : 0;

        // Ambil data untuk Utama (Lentur) - Batas Math.min(100) dilepas
        const getLentur = (loc) => {
            let pos, neg;
            if (loc === 'kiri') { pos = data?.tulanganKiripositif; neg = data?.tulanganKirinegatif; }
            if (loc === 'tengah') { pos = data?.tulanganTengahpositif; neg = data?.tulanganTengahnegatif; }
            if (loc === 'kanan') { pos = data?.tulanganKananpositif; neg = data?.tulanganKanannegatif; }

            const posRatio = safeDiv(pos?.Mu || 0, pos?.Md || 1);
            const negRatio = safeDiv(neg?.Mu || 0, neg?.Md || 1);

            if (posRatio > negRatio) {
                return { b: pos?.Mu || 0, k: pos?.Md || 1, e: posRatio * 100 };
            } else {
                return { b: neg?.Mu || 0, k: neg?.Md || 1, e: negRatio * 100 };
            }
        };

        // Ambil data untuk Geser - Batas Math.min(100) dilepas
        const getGeser = (loc) => {
            const det = kontrol?.kontrolGeser?.[loc]?.detail;
            const b = det?.Av_u || 0;
            const k = det?.Av_terpakai || 1;
            return { b, k, e: safeDiv(b, k) * 100 };
        };

        // Ambil data untuk Torsi - Batas Math.min(100) dilepas
        const getTorsi = (loc) => {
            const det = kontrol?.kontrolTorsi?.[loc]?.detail;
            if (!det) return { b: 0, k: 1, e: 0, type: 'Tu' };

            if (det.perluTorsi) {
                const b = det.A1 || 0; 
                const k = det.A1_terpasang || 1; 
                return { b, k, e: safeDiv(b, k) * 100, type: 'A1' };
            } else {
                const b = det.Tu || 0;
                const k = det.Tu_min || 1;
                return { b, k, e: safeDiv(b, k) * 100, type: 'Tu' };
            }
        };

        const dataKiri = { lentur: getLentur('kiri'), geser: getGeser('kiri'), torsi: getTorsi('kiri') };
        const dataTengah = { lentur: getLentur('tengah'), geser: getGeser('tengah'), torsi: getTorsi('tengah') };
        const dataKanan = { lentur: getLentur('kanan'), geser: getGeser('kanan'), torsi: getTorsi('kanan') };

        // Kalkulasi warna gradient
        function getColorForEfficiency(pct) {
            if (isNaN(pct)) return '#888';
            pct = Math.max(0, Math.min(100, pct)); // Cap untuk warna tetap di 100
            let r, g, b;
            if (pct < 50) {
                const factor = pct / 50;
                r = Math.round(114 + factor * (255 - 114));
                g = Math.round(28 + factor * (193 - 28));
                b = Math.round(36 + factor * (7 - 36));
            } else {
                const factor = (pct - 50) / 50;
                r = Math.round(255 + factor * (21 - 255));
                g = Math.round(193 + factor * (87 - 193));
                b = Math.round(7 + factor * (36 - 7));
            }
            return `rgb(${r}, ${g}, ${b})`;
        }

        // Fungsi render UI HTML untuk Card
        const renderCard = (title, simB, simK, labelB, labelK, unit, valKiri, valTengah, valKanan) => {
            const rawAvg = Math.round((valKiri.e + valTengah.e + valKanan.e) / 3) || 0;
            
            // Tentukan mana yang gagal (melebihi 100%)
            let failedNames = [];
            if (valKiri.e > 100) failedNames.push("Tumpuan Kiri");
            if (valTengah.e > 100) failedNames.push("Lapangan");
            if (valKanan.e > 100) failedNames.push("Tumpuan Kanan");

            const isCardGagal = failedNames.length > 0;
            
            // Set output teks dan warna
            const avgDisplay = isCardGagal ? "Gagal" : `${rawAvg}%`;
            const failedColor = getColorForEfficiency(0); // Warna yang persis sama dengan 0%
            const col = isCardGagal ? failedColor : getColorForEfficiency(rawAvg);
            const progressWidth = Math.min(100, rawAvg);

            // Logika teks informasi bagian bawah
            let infoText = '';
            if (isCardGagal) {
                let failedText = "";
                if (failedNames.length === 1) {
                    failedText = failedNames[0];
                } else if (failedNames.length === 2) {
                    failedText = failedNames[0] + " dan " + failedNames[1];
                } else if (failedNames.length === 3) {
                    failedText = "Tumpuan Kiri, Lapangan, dan Tumpuan Kanan";
                }
                infoText = `Nilai efisiensi <strong>${failedText}</strong> melebihi batas kapasitas desain (> 100%), sehingga struktur dinyatakan gagal karna struktur tidak mampu menahan beban.`;
            } else {
                infoText = `Nilai&nbsp;<strong>${rawAvg}%</strong> merupakan hasil rata-rata tingkat efisiensi dari Tumpuan Kiri, Lapangan, dan Tumpuan Kanan.`;
            }

            const renderSub = (label, val) => {
                let sb = simB, sk = simK, un = unit, lb = labelB, lk = labelK;
                if (val.type === 'Tu') {
                    sb = 'T<sub>u</sub>'; sk = 'T<sub>u,min</sub>'; un = 'kNm'; lb = '(Beban)'; lk = '(Batas)';
                }
                
                // Logika utama untuk mengganti tulisan dan warna jika > 100
                const isSubGagal = val.e > 100;
                const eStr = isSubGagal ? "Gagal" : `${val.e.toFixed(1)}%`;
                const cCol = isSubGagal ? failedColor : getColorForEfficiency(val.e);

                return `
                <div class="sub-item">
                    <div class="sub-item-header">${label}</div>
                    <div class="calc-details">
                        <div class="calc-row"><span>${sb}&nbsp; ${lb}</span><span>${val.b.toFixed(2)} ${un}</span></div>
                        <div class="calc-row"><span>${sk}&nbsp; ${lk}</span><span>${val.k.toFixed(2)} ${un}</span></div>
                        <div class="calc-formula">
                            <span>Efisiensi</span>
                            <span style="color: ${cCol}; font-weight: 700;">${sb} / ${sk} &times; 100% = ${eStr}</span>
                        </div>
                    </div>
                </div>`;
            };

            return `
            <div class="efisiensi-card">
                <div class="efisiensi-header" onclick="this.parentElement.classList.toggle('active')">
                    <div class="efisiensi-title">${title}</div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progressWidth}%; background-color: ${col};"></div>
                    </div>
                    <div class="efisiensi-value" style="color: ${col}">${avgDisplay}</div>
                    <div class="chevron">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </div>
                </div>
                <div class="efisiensi-body">
                    <div class="sub-efisiensi">
                        ${renderSub('Tumpuan Kiri', valKiri)}
                        ${renderSub('Lapangan', valTengah)}
                        ${renderSub('Tumpuan Kanan', valKanan)}
                    </div>
                    <div class="info-text-bottom">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>${infoText}</span>
                    </div>
                </div>
            </div>`;
        };

        section.innerHTML = `
            <h2>EFISIENSI TULANGAN</h2>
            <div class="efisiensi-container">
                ${renderCard('Tulangan Utama', 'M<sub>u</sub>', 'M<sub>d</sub>', '(Beban)', '(Kapasitas)', 'kNm', dataKiri.lentur, dataTengah.lentur, dataKanan.lentur)}
                ${renderCard('Tulangan Geser', 'A<sub>v,u</sub>', 'A<sub>v,d</sub>', '(Perlu)', '(Desain)', 'mm&sup2;/m', dataKiri.geser, dataTengah.geser, dataKanan.geser)}
                ${renderCard('Tulangan Torsi', 'A<sub>1,u</sub>', 'A<sub>1,d</sub>', '(Perlu)', '(Desain)', 'mm&sup2;', dataKiri.torsi, dataTengah.torsi, dataKanan.torsi)}
            </div>
        `;

        // Inject custom CSS untuk Efisiensi Tulangan
        if (!document.getElementById('efisiensi-style')) {
            const style = document.createElement('style');
            style.id = 'efisiensi-style';
            style.textContent = `
                .efisiensi-container { display: flex; flex-direction: column; gap: 0.75rem; }
                .efisiensi-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; border-left: 4px solid var(--color-borders); overflow: hidden; transition: box-shadow 0.2s; }
                .efisiensi-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .efisiensi-header { padding: 1rem; cursor: pointer; display: grid; grid-template-columns: 180px 1fr 60px 30px; align-items: center; gap: 1rem; transition: background-color 0.2s ease; }
                .efisiensi-header:hover { background: #f1f3f5; }
                .efisiensi-title { font-weight: 600; color: #333; font-size: 0.95rem; }
                .efisiensi-value { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700; text-align: right; }
                .progress-track { background: #e9ecef; border-radius: 10px; height: 10px; width: 100%; overflow: hidden; }
                .progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease-in-out; }
                .chevron { transition: transform 0.3s ease; color: #666; display: flex; justify-content: center; }
                .efisiensi-card.active .chevron { transform: rotate(180deg); }
                .efisiensi-body { display: none; padding: 1rem; background: #ffffff; border-top: 1px dashed #ddd; animation: fadeIn 0.3s ease; }
                .efisiensi-card.active .efisiensi-body { display: block; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .sub-efisiensi { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem; margin-bottom: 0.5rem; }
                .sub-item { background: #f8f9fa; border: 1px solid #eee; border-radius: 6px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .sub-item-header { font-size: 0.9rem; font-weight: 600; color: #222; padding-bottom: 0.25rem; border-bottom: 2px solid #e0e0e0; }
                .calc-details { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #555; background: #fff; padding: 0.5rem; border-radius: 4px; border: 1px solid #e0e0e0; display: flex; flex-direction: column; gap: 0.4rem; }
                .calc-row { display: flex; justify-content: space-between; }
                .calc-formula { margin-top: 0.2rem; padding-top: 0.4rem; border-top: 1px dashed #d0d0d0; display: flex; justify-content: space-between; align-items: center; }
                .info-text-bottom { font-size: 0.75rem; color: #888; margin-top: 1.2rem; padding-top: 0.75rem; border-top: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 0.5rem; }
                .info-text-bottom svg { flex-shrink: 0; opacity: 0.7; margin-top: 0.1rem; }
                .info-text-bottom span { line-height: 1.4; display: block; }
                @media (max-width: 600px) {
                    .efisiensi-header { grid-template-columns: 1fr auto auto; grid-template-areas: "title value chevron" "bar bar bar"; gap: 0.5rem; }
                    .efisiensi-title { grid-area: title; } .efisiensi-value { grid-area: value; } .chevron { grid-area: chevron; } .progress-track { grid-area: bar; margin-top: 0.25rem; }
                    .sub-efisiensi { grid-template-columns: 1fr; }
                }
            `;
            document.head.appendChild(style);
        }

        parentSection.insertAdjacentElement('afterend', section);
    }
    
    // FUNGSI BARU: Render Penampang Balok (Dual View) dengan responsive
    function renderPenampang(result) {
        const container = document.querySelector('.penampang-section');
        if (!container) {
            console.error("Element .penampang-section tidak ditemukan");
            return;
        }
    
        // Cek jika mobile device
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Untuk mobile: buat layout vertikal
            const mobileHTML = `
                <h2>PENAMPANG BALOK</h2>
                <div class="penampang-container">
                    <!-- Tumpuan -->
                    <div class="penampang-card">
                        <h3>Penampang Tumpuan</h3>
                        <div class="svg-container" id="svg-container-tumpuan">
                            <!-- SVG untuk tumpuan akan diisi oleh JavaScript -->
                        </div>
                    </div>
                    
                    <!-- Lapangan -->
                    <div class="penampang-card">
                        <h3>Penampang Lapangan</h3>
                        <div class="svg-container" id="svg-container-lapangan">
                            <!-- SVG untuk lapangan akan diisi oleh JavaScript -->
                        </div>
                    </div>
                </div>
                
                <!-- Tombol Copy CAD -->
                <div style="text-align: center; margin-top: 0.5rem;">
                    <button class="btn primary" onclick="exportCAD()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy ke CAD
                    </button>
                </div>
            `;
            
            // Ganti konten section penampang
            const existingContent = container.innerHTML;
            container.innerHTML = mobileHTML;
            
            // Render gambar setelah HTML di-update
            setTimeout(() => {
                renderSinglePenampang(result, 'tumpuan', 'svg-container-tumpuan');
                renderSinglePenampang(result, 'lapangan', 'svg-container-lapangan');
            }, 100);
            
        } else {
            // Untuk desktop: gunakan layout existing
            renderSinglePenampang(result, 'tumpuan', 'svg-container-tumpuan');
            renderSinglePenampang(result, 'lapangan', 'svg-container-lapangan');
        }
    }
    
    // FUNGSI BARU: Render Single Penampang (Lengkap dengan Torsi)
    function renderSinglePenampang(result, jenis, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Element #${containerId} tidak ditemukan`);
            return;
        }
    
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
    
            // Tentukan jumlah tulangan berdasarkan jenis (tumpuan/lapangan)
            let jumlahAtas, jumlahBawah;
            
            if (jenis === 'tumpuan') {
                // Untuk tumpuan, gunakan jumlah maksimum dari kiri/kanan
                jumlahAtas = Math.max(
                    data.tulanganKirinegatif?.n || 2,
                    data.tulanganKanannegatif?.n || 2
                );
                jumlahBawah = Math.max(
                    data.tulanganKiripositif?.n || 3,
                    data.tulanganKananpositif?.n || 3
                );
            } else { // lapangan
                // Untuk lapangan, gunakan jumlah dari tengah
                jumlahAtas = data.tulanganTengahnegatif?.n || 2;
                jumlahBawah = data.tulanganTengahpositif?.n || 3;
            }
    
            // Tentukan jumlah tulangan torsi dan jarak berdasarkan jenis penampang
            let jumlahTorsi, jarakTorsi;
    
            if (jenis === 'tumpuan') {
                // Untuk tumpuan, ambil maksimum dari kiri/kanan
                jumlahTorsi = Math.max(
                    data.torsikiri?.n || 0,
                    data.torsikanan?.n || 0
                );
                // Jarak torsi menggunakan spasi begel minimum
                jarakTorsi = Math.min(
                    parseFloat(data.begelkiri?.sTerkecil) || 100,
                    parseFloat(data.begelkanan?.sTerkecil) || 100
                );
            } else { // lapangan
                jumlahTorsi = data.torsitengah?.n || 0;
                jarakTorsi = parseFloat(data.begeltengah?.sTerkecil) || 100;
            }
    
            // Ambil m dari hasil perhitungan
            const m = data.m || 3;
    
            console.log(`📐 Data untuk penampang ${jenis}:`, {
                lebar, tinggi, D, phi, jumlahAtas, jumlahBawah, sb, m, jumlahTorsi, jarakTorsi
            });
    
            // Tampilkan loading terlebih dahulu
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #666;">
                    <p>Memuat gambar ${jenis}...</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">
                        ${jumlahBawah}D${D} bawah, ${jumlahAtas}D${D} atas
                        ${jumlahTorsi > 0 ? `, ${jumlahTorsi}D${D} torsi` : ''}
                    </p>
                </div>
            `;
    
            // Panggil fungsi render dari cut-generator dengan parameter lengkap
            if (typeof window.renderPenampangBalok === 'function') {
                window.renderPenampangBalok({
                    lebar: lebar,
                    tinggi: tinggi,
                    D: D,
                    begel: phi,
                    jumlahAtas: jumlahAtas,
                    jumlahBawah: jumlahBawah,
                    selimut: sb,
                    m: m,
                    jumlahTorsi: jumlahTorsi,
                    jarakTorsi: jarakTorsi
                }, containerId);
                
            } else {
                console.warn("cut-generator.js belum dimuat");
                container.innerHTML = `
                    <div style="text-align: center; padding: 1rem; color: #dc3545;">
                        <p>Gagal memuat gambar</p>
                        <p style="font-size: 0.8rem;">Modul tidak tersedia</p>
                    </div>
                `;
            }
    
        } catch (error) {
            console.error(`Error rendering penampang ${jenis}:`, error);
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #dc3545;">
                    <p>Error memuat gambar</p>
                    <p style="font-size: 0.8rem;">${error.message}</p>
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
    
    // ==================== FUNGSI UNTUK MEMUAT DATA DARI SESSION STORAGE ====================
    function loadResultFromStorage() {
        const saved = sessionStorage.getItem('calculationResult');
        if (!saved) return null;
        
        try {
            const result = JSON.parse(saved);
            
            // Pastikan struktur data lengkap
            if (result.data && result.data.torsikiri) {
                // Data sudah lengkap
                return result;
            }
            
            // Jika data lama, tambahkan properti yang diperlukan
            if (result.data) {
                // Periksa dan perbarui struktur torsi jika perlu
                ['torsikiri', 'torsitengah', 'torsikanan'].forEach(key => {
                    if (result.data[key] && !result.data[key].A11) {
                        // Data torsi lama, tambahkan properti baru
                        result.data[key].A11 = result.data[key].A1 || "0.00";
                        result.data[key].A12 = result.data[key].A1_alt || "0.00";
                        result.data[key].A1_terpasang = "0.00";
                        result.data[key].luasTulanganMemanjang = "0.00";
                        result.data[key].amanTorsi1 = result.data[key].amanTorsi || true;
                        result.data[key].amanTorsi2 = true;
                        
                        // Perbarui kontrol torsi jika ada
                        if (result.kontrol && result.kontrol.kontrolTorsi && result.kontrol.kontrolTorsi[key]) {
                            const kontrolTorsi = result.kontrol.kontrolTorsi[key];
                            kontrolTorsi.detail = {
                                ...kontrolTorsi.detail,
                                A11: parseFloat(result.data[key].A11),
                                A12: parseFloat(result.data[key].A12),
                                A1: parseFloat(result.data[key].A1 || result.data[key].A1_alt || 0),
                                A1_terpasang: 0,
                                amanTorsi1: result.data[key].amanTorsi1,
                                amanTorsi2: true,
                                amanTorsi: result.data[key].amanTorsi1 && true
                            };
                        }
                    }
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error parsing saved result:', error);
            return null;
        }
    }
    
    // ==================== EKSPOS KE GLOBAL ====================
    // Ekspos hanya fungsi yang diperlukan
    window.renderBalokReport = renderBalokReport;
    window.loadResultFromStorage = loadResultFromStorage;
    
    // Tambahkan fungsi untuk event listener resize
    window.addEventListener('resize', function() {
        const resultData = sessionStorage.getItem('calculationResult') || 
                          sessionStorage.getItem('calculationResultKolom');
        if (resultData) {
            try {
                const result = JSON.parse(resultData);
                if (result.module === 'balok') {
                    renderPenampang(result);
                }
            } catch (error) {
                console.error('Error re-rendering responsive penampang:', error);
            }
        }
    });
    
    console.log("✅ report-balok.js loaded successfully (IIFE Protected)");
    
})(); // END IIFE