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
                        Copy ke CAD (Tumpuan)
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
    
    // ==================== EKSPOS KE GLOBAL ====================
    // Ekspos hanya fungsi yang diperlukan
    window.renderBalokReport = renderBalokReport;
    
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