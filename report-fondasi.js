// report-fondasi.js - Renderer khusus untuk laporan fondasi
// Versi dengan IIFE untuk mencegah konflik variabel global

(function() {
    'use strict';
    
    // Generator untuk step number (LOCAL SCOPE - tidak bentrok)
    function* createStepNumber() {
        let step = 1;
        while (true) {
            yield step++;
        }
    }
    
    let stepNumberGenerator; // Variabel hanya ada di dalam scope IIFE ini

    function renderFondasiReport(result) {
        try {
            updateReportTitle(result);
            renderInputDataFondasi(result.inputData || {});
            renderHasilPerhitunganFondasi(result);
            renderRingkasanFondasi(result);
            renderPenampangFondasi(result);
            
            console.log("✅ Laporan fondasi berhasil di-render");
        } catch (error) {
            console.error('Error rendering fondasi report:', error);
            showError(`Error merender laporan fondasi: ${error.message}`);
        }
    }

    function renderInputDataFondasi(inputData) {
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
                    <span class="data-label">ɣ<sub>beton</sub></span>
                    <span class="data-value">${inputData.material?.gammaC || 'N/A'} kN/m³</span>
                </div>
            </div>
        `;

        // DATA DIMENSI FONDASI
        const fondasi = inputData.fondasi || {};
        const dimensi = fondasi.dimensi || {};
        const fondasiMode = fondasi.mode || 'bujur_sangkar';
        const isAutodimensi = inputData.fondasi?.autodimensi || false;
        
        html += `
            <div class="data-card">
                <h3>Dimensi Fondasi</h3>
                <div class="data-row">
                    <span class="data-label">Jenis</span>
                    <span class="data-value">${getFondasiTypeLabel(fondasiMode)}</span>
                </div>
        `;
        
        // Tampilkan Lx, Ly, dan h hanya jika bukan autodimensi
        if (!isAutodimensi) {
            if (dimensi.lx) {
                html += `
                    <div class="data-row">
                        <span class="data-label">L<sub>x</sub></span>
                        <span class="data-value">${dimensi.lx} m</span>
                    </div>
                `;
            }
            
            if (dimensi.ly) {
                html += `
                    <div class="data-row">
                        <span class="data-label">L<sub>y</sub></span>
                        <span class="data-value">${dimensi.ly} m</span>
                    </div>
                `;
            }
            
            if (dimensi.h) {
                html += `
                    <div class="data-row">
                        <span class="data-label">h</span>
                        <span class="data-value">${dimensi.h} m</span>
                    </div>
                `;
            }
        }
        
        if (dimensi.bx && dimensi.bx !== 'N/A') {
            html += `
                <div class="data-row">
                    <span class="data-label">b<sub>x</sub></span>
                    <span class="data-value">${dimensi.bx} mm</span>
                </div>
            `;
        }
        
        if (dimensi.by && dimensi.by !== 'N/A') {
            html += `
                <div class="data-row">
                    <span class="data-label">b<sub>y</sub></span>
                    <span class="data-value">${dimensi.by} mm</span>
                </div>
            `;
        }
        
        html += `
                <div class="data-row">
                    <span class="data-label">α<sub>s</sub></span>
                    <span class="data-value">${dimensi.alpha_s || '40'}</span>
                </div>
            </div>
        `;

        // DATA BEBAN
        const beban = inputData.beban || {};
        html += `
            <div class="data-card">
                <h3>Beban</h3>
                <div class="data-row">
                    <span class="data-label">P<sub>u</sub></span>
                    <span class="data-value">${beban.pu || 'N/A'} kN</span>
                </div>
        `;
        
        if (beban.mux) {
            html += `
                <div class="data-row">
                    <span class="data-label">M<sub>ux</sub></span>
                    <span class="data-value">${beban.mux} kNm</span>
                </div>
            `;
        }
        
        if (beban.muy) {
            html += `
                <div class="data-row">
                    <span class="data-label">M<sub>uy</sub></span>
                    <span class="data-value">${beban.muy} kNm</span>
                </div>
            `;
        }
        
        html += `</div>`;

        // DATA TANAH - DIUBAH: hilangkan mode, judul jadi "Data Tanah" saja
        const tanah = inputData.tanah || {};
        const tanahMode = tanah.mode || 'auto';
        
        html += `
            <div class="data-card">
                <h3>Data Tanah</h3>
        `;
        
        if (tanahMode === 'auto') {
            const auto = tanah.auto || {};
            html += `
                <div class="data-row">
                    <span class="data-label">D<sub>f</sub></span>
                    <span class="data-value">${auto.df || 'N/A'} m</span>
                </div>
                <div class="data-row">
                    <span class="data-label">ɣ<sub>tanah</sub></span>
                    <span class="data-value">${auto.gamma || 'N/A'} kN/m³</span>
                </div>
                <div class="data-row">
                    <span class="data-label">φ</span>
                    <span class="data-value">${auto.phi || 'N/A'}°</span> <!-- TAMBAHKAN DERAJAT -->
                </div>
                <div class="data-row">
                    <span class="data-label">c</span>
                    <span class="data-value">${auto.c || 'N/A'} kPa</span>
                </div>
                <div class="data-row">
                    <span class="data-label">q<sub>c</sub></span>
                    <span class="data-value">${auto.qc || 'N/A'} kPa</span>
                </div>
            `;
        } else {
            const manual = tanah.manual || {};
            html += `
                <div class="data-row">
                    <span class="data-label">q<sub>a</sub></span>
                    <span class="data-value">${manual.qa || 'N/A'} kPa</span>
                </div>
                <div class="data-row">
                    <span class="data-label">D<sub>f</sub></span>
                    <span class="data-value">${manual.df || 'N/A'} m</span>
                </div>
                <div class="data-row">
                    <span class="data-label">ɣ<sub>tanah</sub></span>
                    <span class="data-value">${manual.gamma || 'N/A'} kN/m³</span>
                </div>
            `;
        }
        
        html += `</div>`;

        // DATA TULANGAN (hanya untuk mode evaluasi)
        const isEvaluasiMode = inputData.mode === 'evaluasi';
        const tulangan = inputData.tulangan || {};
        
        if (isEvaluasiMode) {
            html += `
                <div class="data-card">
                    <h3>Tulangan</h3>
            `;
            
            if (tulangan.d) {
                html += `
                    <div class="data-row">
                        <span class="data-label">D<sub>utama</sub></span>
                        <span class="data-value">${tulangan.d} mm</span>
                    </div>
                `;
            }
            
            if (tulangan.db) {
                html += `
                    <div class="data-row">
                        <span class="data-label">D<sub>b</sub></span>
                        <span class="data-value">${tulangan.db} mm</span>
                    </div>
                `;
            }
            
            if (tulangan.s) {
                html += `
                    <div class="data-row">
                        <span class="data-label">s<sub>utama</sub></span>
                        <span class="data-value">${tulangan.s} mm</span>
                    </div>
                `;
            }
            
            if (tulangan.sp) {
                html += `
                    <div class="data-row">
                        <span class="data-label">s<sub>pusat</sub></span>
                        <span class="data-value">${tulangan.sp} mm</span>
                    </div>
                `;
            }
            
            if (tulangan.st) {
                html += `
                    <div class="data-row">
                        <span class="data-label">s<sub>tepi</sub></span>
                        <span class="data-value">${tulangan.st} mm</span>
                    </div>
                `;
            }
            
            if (tulangan.sb) {
                html += `
                    <div class="data-row">
                        <span class="data-label">s<sub>bagi</sub></span>
                        <span class="data-value">${tulangan.sb} mm</span>
                    </div>
                `;
            }
            
            html += `</div>`;
        }

        container.innerHTML = html;
    }

    function getFondasiTypeLabel(mode) {
        const types = {
            'bujur_sangkar': 'Bujur Sangkar',
            'persegi_panjang': 'Persegi Panjang',
            'menerus': 'Menerus',
            'tunggal': 'Tunggal'
        };
        return types[mode] || mode;
    }

    function renderHasilPerhitunganFondasi(result) {
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

        const { rekap, kontrol, inputData, data, optimasi } = result;
        console.log("📊 Data rekap untuk hasil:", rekap);
        console.log("📊 Data kontrol untuk hasil:", kontrol);

        let html = '';

        // REKAP TULANGAN - DIPERBAIKI: Ambil h dari berbagai sumber
        if (rekap) {
            html += `
                <div class="result-item" style="grid-column: 1 / -1;">
                    <h4>Rekap Tulangan</h4>
            `;
            
            // Tampilkan dimensi dengan format Lx x Ly x h
            // Prioritaskan dari data.parameter, lalu data.dimensiOptimal, lalu optimasi, lalu inputData
            const lx = data?.parameter?.lx || 
                      data?.dimensiOptimal?.Lx || 
                      optimasi?.kombinasi_terpilih?.Lx || 
                      inputData?.fondasi?.dimensi?.lx;
            
            const ly = data?.parameter?.ly || 
                      data?.dimensiOptimal?.Ly || 
                      optimasi?.kombinasi_terpilih?.Ly || 
                      inputData?.fondasi?.dimensi?.ly;
            
            // Untuk h, cari dari berbagai sumber dengan prioritas:
            const h = data?.dimensiOptimal?.h || 
                     optimasi?.kombinasi_terpilih?.h || 
                     data?.parameter?.h || 
                     inputData?.fondasi?.dimensi?.h;
            
            if (lx && ly && h) {
                html += `<p><strong>Dimensi Fondasi:</strong> ${parseFloat(lx).toFixed(2)}m × ${parseFloat(ly).toFixed(2)}m × ${parseFloat(h).toFixed(2)}m</p>`;
            } else if (rekap.dimensi && rekap.dimensi.includes('×')) {
                // Jika sudah dalam format yang benar di rekap
                html += `<p><strong>Dimensi Fondasi:</strong> ${rekap.dimensi}</p>`;
            } else if (rekap.dimensi) {
                // Coba format ulang dari rekap.dimensi
                const dimMatch = rekap.dimensi.match(/(\d+\.?\d*)m\s*x\s*(\d+\.?\d*)m/);
                if (dimMatch && h) {
                    html += `<p><strong>Dimensi Fondasi:</strong> ${parseFloat(dimMatch[1]).toFixed(2)}m × ${parseFloat(dimMatch[2]).toFixed(2)}m × ${parseFloat(h).toFixed(2)}m</p>`;
                } else {
                    html += `<p><strong>Dimensi Fondasi:</strong> ${rekap.dimensi}</p>`;
                }
            }
            
            // Tampilkan tulangan berdasarkan jenis fondasi
            const tulanganFields = ['tulangan_utama', 'tulangan_bagi', 'tulangan_panjang', 
                                    'tulangan_pendek_pusat', 'tulangan_pendek_tepi'];
            
            for (const field of tulanganFields) {
                if (rekap[field] && rekap[field] !== '-') {
                    const label = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    html += `<p><strong>${label}:</strong> ${rekap[field]}</p>`;
                }
            }
            
            html += `</div>`;
        }

        // KESIMPULAN KEAMANAN
        if (kontrol) {
            const statusKeamanan = getStatusKeamananFondasi(kontrol);
            console.log("Status Keamanan Fondasi:", statusKeamanan);

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

        container.innerHTML = html;
    }

    // Fungsi untuk mendapatkan status keamanan struktur fondasi
    function getStatusKeamananFondasi(kontrol) {
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

        // Cek kontrol daya dukung tanah
        if (kontrol.dayaDukung && !kontrol.dayaDukung.aman) {
            kontrolTidakAman.push('Tekanan tanah melebihi daya dukung');
            saranPerbaikan.push('Perbesar dimensi fondasi atau ganti lokasi dengan tanah yang lebih baik');
        }

        // Cek kontrol geser
        if (kontrol.geser) {
            if (!kontrol.geser.aman1) {
                kontrolTidakAman.push('Geser 1 arah tidak memenuhi');
                saranPerbaikan.push('Perbesar tebal fondasi atau tingkatkan mutu beton');
            }
            
            if (!kontrol.geser.aman2) {
                kontrolTidakAman.push('Geser 2 arah tidak memenuhi');
                saranPerbaikan.push('Perbesar tebal fondasi atau tingkatkan mutu beton');
            }
        }

        // Cek kontrol tulangan
        if (kontrol.tulangan && !kontrol.tulangan.aman) {
            kontrolTidakAman.push('Tulangan tidak memenuhi persyaratan');
            saranPerbaikan.push('Perbanyak jumlah tulangan atau gunakan diameter tulangan yang lebih besar');
        }

        // Cek kontrol kuat dukung
        if (kontrol.kuatDukung && !kontrol.kuatDukung.aman) {
            kontrolTidakAman.push('Kuat dukung fondasi tidak mencukupi');
            saranPerbaikan.push('Perbesar dimensi fondasi atau tingkatkan mutu beton');
        }

        // Cek kontrol s minimal
        if (kontrol.tulanganTambahan && !kontrol.tulanganTambahan.aman) {
            kontrolTidakAman.push('Jarak tulangan terlalu besar (s ≥ 100mm)');
            saranPerbaikan.push('Perkecil jarak tulangan menjadi ≤ 100mm');
        }

        // Cek evaluasi tulangan untuk mode evaluasi
        if (kontrol.evaluasiTulangan && !kontrol.evaluasiTulangan.aman) {
            kontrolTidakAman.push('Tulangan terpasang lebih jarang dari yang dibutuhkan');
            saranPerbaikan.push('Perkecil jarak tulangan sesuai hasil perhitungan');
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

    function renderRingkasanFondasi(result) {
        const container = document.getElementById('controlContainer');
        
        if (!container) {
            console.error("Element #controlContainer tidak ditemukan");
            return;
        }
        
        const { kontrol, data, rekap, inputData, optimasi } = result;
        const fondasiMode = data?.actualFondasiMode || optimasi?.as_rincian_per_meter?.mode_fondasi || inputData?.fondasiMode || 'bujur_sangkar';
        
        console.log("📋 Data kontrol detail fondasi:", kontrol);
        console.log("📋 Data hasil perhitungan fondasi:", data);
        console.log("📋 Data rekap fondasi:", rekap);
        console.log("📋 Data optimasi:", optimasi);

        let html = '';

        // Reset step number generator
        stepNumberGenerator = createStepNumber();

        if (kontrol && data && rekap) {
            html = `
                <div class="steps">
                    ${renderKontrolParameterDasar(data.parameter, kontrol.dayaDukung?.detail)}
                    ${renderKontrolDayaDukungFondasi(kontrol.dayaDukung)}
                    ${renderKontrolGeserFondasi(kontrol.geser)}
                    ${renderKontrolTulanganFondasi(kontrol.tulangan, data.tulangan, fondasiMode, data.parameter, optimasi)}
                    ${renderKontrolKuatDukungFondasi(kontrol.kuatDukung, inputData, data.kuatDukung, data.tulangan, fondasiMode, optimasi)}
                    ${renderKontrolTambahanFondasi(kontrol)}
                </div>
            `;
        } else {
            html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
        }

        container.innerHTML = html;
    }

    // FUNGSI BARU: Render kontrol parameter dasar (DIPERBAIKI)
    function renderKontrolParameterDasar(parameter, dayaDukungDetail) {
        if (!parameter) return '';
        
        let html = '';
        
        // Kontrol sigma_min > 0 (TERPISAH)
        if (parameter.sigma_min !== undefined) {
            const aman = parameter.sigma_min > 0;
            html += renderStepFondasi(
                stepNumberGenerator.next().value,
                'Kontrol Tekanan Minimum',
                `σ<sub>min</sub> = ${parameter.sigma_min?.toFixed(2) || 'N/A'} kPa > 0`,
                aman
            );
        }
        
        return html;
    }

    function renderKontrolDayaDukungFondasi(kontrolDayaDukung) {
        if (!kontrolDayaDukung || !kontrolDayaDukung.detail) return '';
        
        let html = '';
        const detail = kontrolDayaDukung.detail;
        
        // Kontrol sigma_max <= qa (TERPISAH)
        if (detail.sigma_max !== undefined && detail.qa !== undefined) {
            const aman = detail.sigma_max <= detail.qa;
            html += renderStepFondasi(
                stepNumberGenerator.next().value,
                'Kontrol Tekanan Maksimum',
                `σ<sub>max</sub> = ${detail.sigma_max?.toFixed(2) || 'N/A'} kPa ≤ q<sub>a</sub> = ${detail.qa?.toFixed(2) || 'N/A'} kPa`,
                aman
            );
        }
        
        return html;
    }

    function renderKontrolGeserFondasi(kontrolGeser) {
        if (!kontrolGeser || !kontrolGeser.detail) return '';
        
        let html = '';
        const detail = kontrolGeser.detail;
        
        // Kontrol Geser 1 Arah (DIPERBAIKI - tanpa rasio, tanpa Vc2 = min(...))
        if (detail.Vu1 !== undefined && detail.Vc1 !== undefined) {
            const aman = detail.Vu1 <= detail.Vc1;
            html += renderStepFondasi(
                stepNumberGenerator.next().value,
                'Kontrol Geser 1 Arah',
                `V<sub>u1</sub> = ${detail.Vu1?.toFixed(2) || 'N/A'} kN ≤ φV<sub>c1</sub> = ${detail.Vc1?.toFixed(2) || 'N/A'} kN`,
                aman
            );
        }
        
        // Kontrol Geser 2 Arah (DIPERBAIKI - tanpa rasio, tanpa Vc2 = min(...))
        if (detail.Vu2 !== undefined && detail.phiVc2 !== undefined) {
            const aman = detail.Vu2 <= detail.phiVc2;
            
            html += renderStepFondasi(
                stepNumberGenerator.next().value,
                'Kontrol Geser 2 Arah',
                `V<sub>u2</sub> = ${detail.Vu2?.toFixed(2) || 'N/A'} kN ≤ φV<sub>c2</sub> = ${detail.phiVc2?.toFixed(2) || 'N/A'} kN`,
                aman
            );
        }
        
        return html;
    }

    // FUNGSI UTAMA YANG DIPERBAIKI: Render kontrol tulangan fondasi (DENGAN URUTAN BARU)
    function renderKontrolTulanganFondasi(kontrolTulangan, dataTulangan, fondasiMode, parameter, optimasi) {
        if (!kontrolTulangan || !kontrolTulangan.detail) {
            console.log("❌ kontrolTulangan atau detail tidak ada");
            return '';
        }
        
        let html = '';
        const detail = kontrolTulangan.detail;
        const Kmax = parameter?.Kmax || 0;
        
        console.log("🔍 Data detail tulangan:", detail);
        console.log("🔍 Kmax dari parameter:", Kmax);
        console.log("🔍 Jenis fondasi:", detail.jenis);
        console.log("🔍 Data optimasi:", optimasi);
        
        // Gunakan jenis dari detail untuk konsistensi
        const jenisFondasi = detail.jenis || fondasiMode;
        
        if (jenisFondasi === "bujur_sangkar" || detail.jenis === "bujur_sangkar") {
            // 5. KONTROL K untuk bujur sangkar
            if (detail.K !== undefined) {
                const aman = detail.Kontrol_K === "AMAN";
                console.log("✅ Faktor Momen Pikul Tulangan:", detail.K, "Kmax:", Kmax, "Aman:", aman);
                html += renderStepFondasi(
                    stepNumberGenerator.next().value,
                    'Faktor Momen Pikul Tulangan',
                    `K = ${detail.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`,
                    aman
                );
            }
            
            // 6. KONTROL LUAS TULANGAN untuk bujur sangkar - DIUBAH: langsung bandingkan As perlu vs As terpasang
            if (detail.As_perlu !== undefined || (detail.As1 !== undefined && detail.As2 !== undefined && detail.As3 !== undefined)) {
                // Hitung As perlu (jika tidak langsung disediakan)
                const As_perlu = detail.As_perlu || Math.max(detail.As1, detail.As2, detail.As3);
                
                // Ambil As terpasang dari optimasi
                const As_terpasang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter;
                
                if (As_terpasang !== undefined) {
                    const aman = As_terpasang >= As_perlu;
                    console.log("✅ Kontrol luas tulangan bujur sangkar:", As_perlu, "As terpasang:", As_terpasang, "Aman:", aman);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan',
                        `A<sub>s terpasang</sub> = ${As_terpasang?.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_perlu?.toFixed(0)} mm²/m`,
                        aman
                    );
                } else {
                    console.log("✅ Kontrol luas tulangan bujur sangkar:", As_perlu);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan',
                        `A<sub>s perlu</sub> = ${As_perlu?.toFixed(0)} mm²/m`,
                        null
                    );
                }
            }
            
        } else if (jenisFondasi === "persegi_panjang" || detail.jenis === "persegi_panjang") {
            console.log("📏 Jenis fondasi: persegi_panjang");
            
            // 5. KONTROL K untuk tulangan PANJANG (bujur)
            if (detail.bujur?.K !== undefined) {
                const aman = detail.bujur?.Kontrol_K === "AMAN";
                console.log("✅ Faktor Momen Pikul Tulangan Panjang:", detail.bujur.K, "Kmax:", Kmax, "Aman:", aman);
                html += renderStepFondasi(
                    stepNumberGenerator.next().value,
                    'Faktor Momen Pikul Tulangan Panjang',
                    `K = ${detail.bujur.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`,
                    aman
                );
            }
            
            // 6. KONTROL LUAS TULANGAN PANJANG - DIUBAH: langsung bandingkan As perlu vs As terpasang
            if (detail.bujur?.As_perlu !== undefined || (detail.bujur?.As1 !== undefined && detail.bujur?.As2 !== undefined && detail.bujur?.As3 !== undefined)) {
                // Hitung As perlu (jika tidak langsung disediakan)
                const As_perlu = detail.bujur?.As_perlu || Math.max(detail.bujur.As1, detail.bujur.As2, detail.bujur.As3);
                
                // Ambil As terpasang dari optimasi
                const As_terpasang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter;
                
                if (As_terpasang !== undefined) {
                    const aman = As_terpasang >= As_perlu;
                    console.log("✅ Kontrol luas tulangan panjang:", As_perlu, "As terpasang:", As_terpasang, "Aman:", aman);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Panjang',
                        `A<sub>s terpasang</sub> = ${As_terpasang?.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_perlu?.toFixed(0)} mm²/m`,
                        aman
                    );
                } else {
                    console.log("✅ Kontrol luas tulangan panjang:", As_perlu);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Panjang',
                        `A<sub>s perlu</sub> = ${As_perlu?.toFixed(0)} mm²/m`,
                        null
                    );
                }
            }
            
            // 7. KONTROL K untuk tulangan PENDEK (persegi)
            if (detail.persegi?.K !== undefined) {
                const aman = detail.persegi?.Kontrol_K === "AMAN";
                console.log("✅ Faktor Momen Pikul Tulangan Pendek:", detail.persegi.K, "Kmax:", Kmax, "Aman:", aman);
                html += renderStepFondasi(
                    stepNumberGenerator.next().value,
                    'Faktor Momen Pikul Tulangan Pendek',
                    `K = ${detail.persegi.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`,
                    aman
                );
            }
            
            // 8. KONTROL LUAS TULANGAN PENDEK PUSAT - DIUBAH: langsung bandingkan As perlu vs As terpasang
            if (detail.persegi?.Aspusat !== undefined) {
                const As_perlu_pusat = detail.persegi.Aspusat;
                const As_terpasang_pusat = optimasi?.as_rincian_per_meter?.asPusatPerMeter;
                
                if (As_terpasang_pusat !== undefined) {
                    const aman = As_terpasang_pusat >= As_perlu_pusat;
                    console.log("✅ Kontrol luas tulangan pendek pusat:", As_perlu_pusat, "As terpasang:", As_terpasang_pusat, "Aman:", aman);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Pendek Pusat',
                        `A<sub>s terpasang</sub> = ${As_terpasang_pusat?.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_perlu_pusat?.toFixed(0)} mm²/m`,
                        aman
                    );
                } else {
                    console.log("✅ Kontrol luas tulangan pendek pusat:", As_perlu_pusat);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Pendek Pusat',
                        `A<sub>s perlu</sub> = ${As_perlu_pusat?.toFixed(0)} mm²/m`,
                        null
                    );
                }
            }
            
            // 9. KONTROL LUAS TULANGAN PENDEK TEPI - DIUBAH: langsung bandingkan As perlu vs As terpasang
            if (detail.persegi?.Astepi !== undefined) {
                const As_perlu_tepi = detail.persegi.Astepi;
                const As_terpasang_tepi = optimasi?.as_rincian_per_meter?.asTepiPerMeter;
                
                if (As_terpasang_tepi !== undefined) {
                    const aman = As_terpasang_tepi >= As_perlu_tepi;
                    console.log("✅ Kontrol luas tulangan pendek tepi:", As_perlu_tepi, "As terpasang:", As_terpasang_tepi, "Aman:", aman);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Pendek Tepi',
                        `A<sub>s terpasang</sub> = ${As_terpasang_tepi?.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_perlu_tepi?.toFixed(0)} mm²/m`,
                        aman
                    );
                } else {
                    console.log("✅ Kontrol luas tulangan pendek tepi:", As_perlu_tepi);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Pendek Tepi',
                        `A<sub>s perlu</sub> = ${As_perlu_tepi?.toFixed(0)} mm²/m`,
                        null
                    );
                }
            }
            
        } else if (jenisFondasi === "menerus" || detail.jenis === "menerus") {
            // 5. KONTROL K untuk menerus
            if (detail.K !== undefined) {
                const aman = detail.Kontrol_K === "AMAN";
                console.log("✅ Faktor Momen Pikul Tulangan:", detail.K, "Kmax:", Kmax, "Aman:", aman);
                html += renderStepFondasi(
                    stepNumberGenerator.next().value,
                    'Faktor Momen Pikul Tulangan',
                    `K = ${detail.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`,
                    aman
                );
            }
            
            // 6. KONTROL LUAS TULANGAN UTAMA untuk menerus - DIUBAH: langsung bandingkan As perlu vs As terpasang
            if (detail.As_perlu !== undefined || (detail.As1 !== undefined && detail.As2 !== undefined && detail.As3 !== undefined)) {
                // Hitung As perlu (jika tidak langsung disediakan)
                const As_perlu = detail.As_perlu || Math.max(detail.As1, detail.As2, detail.As3);
                
                // Ambil As terpasang dari optimasi
                const As_terpasang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter;
                
                if (As_terpasang !== undefined) {
                    const aman = As_terpasang >= As_perlu;
                    console.log("✅ Kontrol luas tulangan utama menerus:", As_perlu, "As terpasang:", As_terpasang, "Aman:", aman);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Utama',
                        `A<sub>s terpasang</sub> = ${As_terpasang?.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_perlu?.toFixed(0)} mm²/m`,
                        aman
                    );
                } else {
                    console.log("✅ Kontrol luas tulangan utama menerus:", As_perlu);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Utama',
                        `A<sub>s perlu</sub> = ${As_perlu?.toFixed(0)} mm²/m`,
                        null
                    );
                }
            }
            
            // KONTROL LUAS TULANGAN BAGI untuk menerus - DIUBAH: langsung bandingkan As perlu vs As terpasang
            if (detail.Asb_perlu !== undefined || (detail.Asb1 !== undefined && detail.Asb2 !== undefined && detail.Asb3 !== undefined)) {
                // Hitung As perlu (jika tidak langsung disediakan)
                const Asb_perlu = detail.Asb_perlu || Math.max(detail.Asb1, detail.Asb2, detail.Asb3);
                
                // Ambil As terpasang dari optimasi
                const Asb_terpasang = optimasi?.as_rincian_per_meter?.asBagiPerMeter;
                
                if (Asb_terpasang !== undefined) {
                    const aman = Asb_terpasang >= Asb_perlu;
                    console.log("✅ Kontrol luas tulangan bagi menerus:", Asb_perlu, "As terpasang:", Asb_terpasang, "Aman:", aman);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Bagi',
                        `A<sub>s terpasang</sub> = ${Asb_terpasang?.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${Asb_perlu?.toFixed(0)} mm²/m`,
                        aman
                    );
                } else {
                    console.log("✅ Kontrol luas tulangan bagi menerus:", Asb_perlu);
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        'Kontrol Luas Tulangan Bagi',
                        `A<sub>s perlu</sub> = ${Asb_perlu?.toFixed(0)} mm²/m`,
                        null
                    );
                }
            }
        }
        
        return html;
    }

    // FUNGSI YANG DIPERBAIKI: Render kontrol kuat dukung fondasi
    function renderKontrolKuatDukungFondasi(kontrolKuatDukung, inputData, kuatDukungData, tulanganData, fondasiMode, optimasi) {
        if (!kontrolKuatDukung || !kontrolKuatDukung.detail) {
            console.log("❌ kontrolKuatDukung atau detail tidak ada");
            return '';
        }
        
        let html = '';
        const detail = kontrolKuatDukung.detail;
        
        console.log("🔍 Data kuatDukung detail:", detail);
        console.log("🔍 Data tulangan untuk As:", tulanganData);
        console.log("🔍 Data optimasi untuk As terpasang:", optimasi);
        
        // 10. KONTROL Pu (Kuat Dukung Beton)
        if (detail.Pu_cap !== undefined && detail.Kontrol_Pu !== undefined) {
            const Pu_input = inputData?.beban?.pu ? parseFloat(inputData.beban.pu) : 0;
            const aman = detail.Kontrol_Pu === "AMAN";
            console.log("✅ Kontrol Pu:", detail.Pu_cap, "Pu input:", Pu_input, "Aman:", aman);
            html += renderStepFondasi(
                stepNumberGenerator.next().value,
                'Kontrol Kuat Dukung Beton',
                `φP<sub>n</sub> = ${detail.Pu_cap?.toFixed(2)} kN ≥ P<sub>u</sub> = ${Pu_input.toFixed(2)} kN`,
                aman
            );
        }
        
        // 11. KONTROL PANJANG PENYALURAN (ℓ_t dan ℓ_dh) - DIUBAH: ganti l dengan ℓ
        if (detail.It !== undefined && detail.Idh !== undefined && detail.Kontrol_Idh !== undefined) {
            const aman = detail.Kontrol_Idh === "AMAN";
            console.log("✅ Kontrol panjang penyaluran:", detail.It, detail.Idh, "Aman:", aman);
            html += renderStepFondasi(
                stepNumberGenerator.next().value,
                'Kontrol Panjang Penyaluran',
                `ℓ<sub>t</sub> = ${detail.It?.toFixed(0)} mm ≥ ℓ<sub>dh</sub> = ${detail.Idh?.toFixed(0)} mm`,
                aman
            );
        }
        
        return html;
    }

    function renderKontrolTambahanFondasi(kontrol) {
        let html = '';
        
        // Kontrol evaluasi tulangan untuk mode evaluasi
        if (kontrol.evaluasiTulangan && !kontrol.evaluasiTulangan.aman) {
            const detail = kontrol.evaluasiTulangan.detail;
            for (const [key, value] of Object.entries(detail)) {
                if (!value.aman) {
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        `Evaluasi Tulangan (${key})`,
                        `s<sub>input</sub> = ${value.s_input} mm ≤ s<sub>hitung</sub> = ${value.s_hitung} mm`,
                        false
                    );
                }
            }
        }
        
        // Kontrol s minimal (opsional, bisa diaktifkan jika diperlukan)
        if (kontrol.tulanganTambahan && !kontrol.tulanganTambahan.aman) {
            const detail = kontrol.tulanganTambahan.detail;
            for (const [key, value] of Object.entries(detail)) {
                if (!value.aman) {
                    html += renderStepFondasi(
                        stepNumberGenerator.next().value,
                        `Kontrol Jarak Minimum (${key})`,
                        `s = ${value.nilai?.toFixed(0) || 'N/A'} mm ≥ 100 mm`,
                        false
                    );
                }
            }
        }
        
        return html;
    }

    // Helper function untuk render step fondasi
    function renderStepFondasi(number, desc, formula, aman = null) {
        const statusHtml = aman !== null ? 
            `<div class="step-result">${aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>` : 
            '';
        
        return `
            <div class="step-item">
                <div class="step-number">${number}</div>
                <div class="step-content">
                    <div class="step-desc">${desc}</div>
                    <div class="step-body">
                        <div class="step-formula">${formula}</div>
                        ${statusHtml}
                    </div>
                </div>
            </div>
        `;
    }

    // FUNGSI: Render Penampang Fondasi
    function renderPenampangFondasi(result) {
        const container = document.querySelector('.penampang-section');
        if (!container) {
            console.error("Element .penampang-section tidak ditemukan");
            return;
        }

        // Update judul section
        const title = container.querySelector('h2');
        if (title) {
            title.textContent = 'PENAMPANG FONDASI';
        }

        // Update judul card
        const cards = container.querySelectorAll('.penampang-card h3');
        if (cards[0]) cards[0].textContent = 'Tampak Samping';
        if (cards[1]) cards[1].textContent = 'Tampak Atas';

        // Update tombol CAD
        const cadButton = container.querySelector('.btn.primary[onclick*="CAD"]');
        if (cadButton) {
            cadButton.textContent = 'Copy ke CAD (Tampak Samping)';
            // Update onclick untuk fondasi
            cadButton.setAttribute('onclick', 'exportCADFondasi()');
        }

        // Render kedua tampilan
        renderSinglePenampangFondasi(result, 'samping', 'svg-container-tumpuan');
        renderSinglePenampangFondasi(result, 'atas', 'svg-container-lapangan');
    }

    function renderSinglePenampangFondasi(result, jenis, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Element #${containerId} tidak ditemukan`);
            return;
        }

        const { data, inputData, rekap, optimasi } = result;
        
        if (!data || !inputData || !rekap) {
            console.error("Data tidak lengkap untuk render penampang fondasi");
            container.innerHTML = '<p style="text-align: center; color: #888;">Data penampang tidak tersedia</p>';
            return;
        }

        try {
            // Ambil data dimensi dari berbagai sumber dengan prioritas
            const lx = data?.parameter?.lx || 
                      data?.dimensiOptimal?.Lx || 
                      optimasi?.kombinasi_terpilih?.Lx || 
                      inputData?.fondasi?.dimensi?.lx || 2.0;
            
            const ly = data?.parameter?.ly || 
                      data?.dimensiOptimal?.Ly || 
                      optimasi?.kombinasi_terpilih?.Ly || 
                      inputData?.fondasi?.dimensi?.ly || 2.0;
            
            const h = data?.dimensiOptimal?.h || 
                     optimasi?.kombinasi_terpilih?.h || 
                     data?.parameter?.h || 
                     inputData?.fondasi?.dimensi?.h || 0.5;
            
            const dimensi = inputData.fondasi?.dimensi || {};
            const bx = parseFloat(dimensi.bx) || 300;
            const by = parseFloat(dimensi.by) || 300;
            
            // Gunakan actual fondasi mode dari data atau optimasi
            const fondasiMode = data?.actualFondasiMode || optimasi?.as_rincian_per_meter?.mode_fondasi || inputData?.fondasi?.mode || 'bujur_sangkar';

            // Ambil data tulangan dari optimasi atau rekap
            const D = optimasi?.kombinasi_terpilih?.D || 22;
            const Db = optimasi?.kombinasi_terpilih?.Db || 16;
            const s = data?.tulangan?.bujur?.s || 250;

            console.log(`📐 Data untuk penampang fondasi ${jenis}:`, {
                lx, ly, h, bx, by, D, Db, s, fondasiMode
            });

            // Tampilkan loading terlebih dahulu
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #666;">
                    <p>Memuat gambar ${jenis}...</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">
                        ${getFondasiTypeLabel(fondasiMode)}<br>
                        Dimensi: ${parseFloat(lx).toFixed(2)}m × ${parseFloat(ly).toFixed(2)}m × ${parseFloat(h).toFixed(2)}m<br>
                        Tulangan: D${D}-${s}
                    </p>
                </div>
            `;

            // Panggil fungsi render dari cut-generator dengan parameter untuk fondasi
            if (typeof window.renderPenampangFondasi === 'function') {
                window.renderPenampangFondasi({
                    lx: parseFloat(lx),
                    ly: parseFloat(ly),
                    h: parseFloat(h),
                    bx: bx,
                    by: by,
                    D: D,
                    Db: Db,
                    s: s,
                    jenis: jenis,
                    fondasiMode: fondasiMode
                }, containerId);
                
            } else {
                console.warn("Fungsi renderPenampangFondasi belum tersedia di cut-generator");
                container.innerHTML = `
                    <div style="text-align: center; padding: 1rem; color: #dc3545;">
                        <p>Gagal memuat gambar</p>
                        <p style="font-size: 0.8rem;">Modul tidak tersedia</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error(`Error rendering penampang fondasi ${jenis}:`, error);
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #dc3545;">
                    <p>Error memuat gambar</p>
                    <p style="font-size: 0.8rem;">${error.message}</p>
                </div>
            `;
        }
    }

    // Fungsi export CAD khusus fondasi
    function exportCADFondasi() {
        if (typeof window.generateCADTextFondasi === 'function') {
            const cadText = window.generateCADTextFondasi();
            navigator.clipboard.writeText(cadText).then(() => {
                alert('Text CAD untuk penampang fondasi (tampak samping) berhasil disalin ke clipboard!');
            }).catch(err => {
                console.error('Gagal menyalin text: ', err);
                alert('Gagal menyalin text CAD. Silakan coba lagi.');
            });
        } else {
            alert('Fitur export CAD belum tersedia.');
        }
    }

    // Fungsi utilitas tambahan
    function showError(message) {
        console.error(message);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
            z-index: 1000;
            max-width: 400px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }

    // Ekspos fungsi ke window global
    window.renderFondasiReport = renderFondasiReport;
    window.exportCADFondasi = exportCADFondasi;

    console.log("✅ report-fondasi.js loaded successfully (IIFE version)");

})(); // Akhir IIFE