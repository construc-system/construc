// report-fondasi.js (final)
(function() {
    'use strict';

    function* createStepNumber() {
        let step = 1;
        while (true) yield step++;
    }
    let stepNumberGenerator;

    // ========================
    // RENDER UTAMA
    // ========================
    function renderFondasiReport(result) {
            try {
                cleanupLegacyPenampang();
                updateReportTitle(result);
                renderInputDataFondasi(result.inputData || {});
                
                // Simpan reference data ke scope global window agar dapat diakses/dimodifikasi secara dinamis antar-fungsi
                window.lastResultObject = result;

                // 1. Rekap Tulangan + Status Keamanan Awal
                renderRekapDanStatusFondasi(result);

                // 2. Penampang Fondasi
                const resultContainer = document.getElementById('resultContainer');
                renderPenampangFondasi(result, resultContainer);

                // 3. Ringkasan Kontrol (Fungsi ini sekarang akan meng-update status `luasTulanganAman`)
                renderRingkasanFondasi(result);

                // 4. Render Ulang Status Keamanan untuk memastikan kesimpulan sinkron dengan data evaluasi As terbaru
                renderRekapDanStatusFondasi(window.lastResultObject);

                console.log("✅ Laporan fondasi berhasil di-render dengan validasi status luas tulangan ter-update!");
            } catch (error) {
                console.error('Error rendering fondasi report:', error);
                showError(`Error merender laporan fondasi: ${error.message}`);
            }
    }

    function cleanupLegacyPenampang() {
        document.querySelectorAll('.penampang-section').forEach(section => section.remove());
        document.querySelectorAll('.penampang-container, .penampang-wrapper, .penampang-card').forEach(el => el.remove());
    }

    function updateReportTitle(result) {
        const titleElement = document.getElementById('reportModuleName');
        if (!titleElement) {
            const fallback = document.querySelector('.main-sub');
            if (fallback) {
                const mode = result.mode || result.inputData?.mode || 'desain';
                const modeText = mode === 'desain' ? 'DESAIN' : 'EVALUASI';
                fallback.textContent = `FONDASI - ${modeText}`;
            }
            return;
        }
        const mode = result.mode || result.inputData?.mode || 'desain';
        const modeText = mode === 'desain' ? 'DESAIN' : 'EVALUASI';
        titleElement.textContent = `FONDASI - ${modeText}`;
    }

    // ========================
    // INPUT DATA (tidak berubah)
    // ========================
    function renderInputDataFondasi(inputData) {
        const container = document.getElementById('inputDataContainer');
        if (!container) return;
        if (!inputData || Object.keys(inputData).length === 0) {
            container.innerHTML = '<div class="data-card"><p>Tidak ada data input</p></div>';
            return;
        }

        let html = '';
        html += `<div class="data-card"><h3>Material</h3>
            <div class="data-row"><span class="data-label">f'<sub>c</sub></span><span class="data-value">${inputData.material?.fc || 'N/A'} MPa</span></div>
            <div class="data-row"><span class="data-label">f<sub>y</sub></span><span class="data-value">${inputData.material?.fy || 'N/A'} MPa</span></div>
            <div class="data-row"><span class="data-label">ɣ<sub>beton</sub></span><span class="data-value">${inputData.material?.gammaC || 'N/A'} kN/m³</span></div>
        </div>`;

        const fondasi = inputData.fondasi || {};
        const dimensi = fondasi.dimensi || {};
        const fondasiMode = fondasi.mode || 'bujur_sangkar';
        const isAutodimensi = inputData.fondasi?.autodimensi || false;

        html += `<div class="data-card"><h3>Dimensi Fondasi</h3>
            <div class="data-row"><span class="data-label">Jenis</span><span class="data-value">${getFondasiTypeLabel(fondasiMode)}</span></div>`;
        if (!isAutodimensi) {
            if (dimensi.lx) html += `<div class="data-row"><span class="data-label">L<sub>x</sub></span><span class="data-value">${dimensi.lx} m</span></div>`;
            if (dimensi.ly) html += `<div class="data-row"><span class="data-label">L<sub>y</sub></span><span class="data-value">${dimensi.ly} m</span></div>`;
            if (dimensi.h) html += `<div class="data-row"><span class="data-label">h</span><span class="data-value">${dimensi.h} m</span></div>`;
        }
        if (dimensi.bx && dimensi.bx !== 'N/A') html += `<div class="data-row"><span class="data-label">b<sub>x</sub></span><span class="data-value">${dimensi.bx} mm</span></div>`;
        if (dimensi.by && dimensi.by !== 'N/A') html += `<div class="data-row"><span class="data-label">b<sub>y</sub></span><span class="data-value">${dimensi.by} mm</span></div>`;
        html += `<div class="data-row"><span class="data-label">α<sub>s</sub></span><span class="data-value">${dimensi.alpha_s || '40'}</span></div>
            </div>`;

        const beban = inputData.beban || {};
        html += `<div class="data-card"><h3>Beban</h3>
            <div class="data-row"><span class="data-label">P<sub>u</sub></span><span class="data-value">${beban.pu || 'N/A'} kN</span></div>`;
        if (beban.mux) html += `<div class="data-row"><span class="data-label">M<sub>ux</sub></span><span class="data-value">${beban.mux} kNm</span></div>`;
        if (beban.muy) html += `<div class="data-row"><span class="data-label">M<sub>uy</sub></span><span class="data-value">${beban.muy} kNm</span></div>`;
        html += `</div>`;

        const tanah = inputData.tanah || {};
        const tanahMode = tanah.mode || 'auto';
        html += `<div class="data-card"><h3>Data Tanah</h3>`;
        if (tanahMode === 'auto') {
            const auto = tanah.auto || {};
            html += `<div class="data-row"><span class="data-label">D<sub>f</sub></span><span class="data-value">${auto.df || 'N/A'} m</span></div>
                     <div class="data-row"><span class="data-label">ɣ<sub>tanah</sub></span><span class="data-value">${auto.gamma || 'N/A'} kN/m³</span></div>
                     <div class="data-row"><span class="data-label">φ</span><span class="data-value">${auto.phi || 'N/A'}°</span></div>
                     <div class="data-row"><span class="data-label">c</span><span class="data-value">${auto.c || 'N/A'} kPa</span></div>
                     <div class="data-row"><span class="data-label">q<sub>c</sub></span><span class="data-value">${auto.qc || 'N/A'} kPa</span></div>`;
        } else {
            const manual = tanah.manual || {};
            html += `<div class="data-row"><span class="data-label">q<sub>a</sub></span><span class="data-value">${manual.qa || 'N/A'} kPa</span></div>
                     <div class="data-row"><span class="data-label">D<sub>f</sub></span><span class="data-value">${manual.df || 'N/A'} m</span></div>
                     <div class="data-row"><span class="data-label">ɣ<sub>tanah</sub></span><span class="data-value">${manual.gamma || 'N/A'} kN/m³</span></div>`;
        }
        html += `</div>`;

        const isEvaluasiMode = inputData.mode === 'evaluasi';
        const tulangan = inputData.tulangan || {};
        if (isEvaluasiMode) {
            html += `<div class="data-card"><h3>Tulangan</h3>`;
            if (tulangan.d) html += `<div class="data-row"><span class="data-label">D<sub>utama</sub></span><span class="data-value">${tulangan.d} mm</span></div>`;
            if (tulangan.db) html += `<div class="data-row"><span class="data-label">D<sub>b</sub></span><span class="data-value">${tulangan.db} mm</span></div>`;
            if (tulangan.s) html += `<div class="data-row"><span class="data-label">s<sub>utama</sub></span><span class="data-value">${tulangan.s} mm</span></div>`;
            if (tulangan.sp) html += `<div class="data-row"><span class="data-label">s<sub>pusat</sub></span><span class="data-value">${tulangan.sp} mm</span></div>`;
            if (tulangan.st) html += `<div class="data-row"><span class="data-label">s<sub>tepi</sub></span><span class="data-value">${tulangan.st} mm</span></div>`;
            if (tulangan.sb) html += `<div class="data-row"><span class="data-label">s<sub>bagi</sub></span><span class="data-value">${tulangan.sb} mm</span></div>`;
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

    // ========================
    // REKAP + STATUS KEAMANAN (digabung dalam satu container)
    // ========================
    function renderRekapDanStatusFondasi(result) {
        const container = document.getElementById('resultContainer');
        if (!container) return;
        const { rekap, kontrol, data, optimasi, inputData } = result;
        
        let html = '';
        
        // --- Bagian Rekap Tulangan ---
        if (rekap) {
            html += `<div class="result-item" style="grid-column: 1 / -1;"><h4>Rekap Tulangan</h4>`;
            const lx = data?.parameter?.lx || data?.dimensiOptimal?.Lx || optimasi?.kombinasi_terpilih?.Lx || inputData?.fondasi?.dimensi?.lx;
            const ly = data?.parameter?.ly || data?.dimensiOptimal?.Ly || optimasi?.kombinasi_terpilih?.Ly || inputData?.fondasi?.dimensi?.ly;
            const h = data?.dimensiOptimal?.h || optimasi?.kombinasi_terpilih?.h || data?.parameter?.h || inputData?.fondasi?.dimensi?.h;
            if (lx && ly && h) {
                html += `<p><strong>Dimensi Fondasi:</strong> ${parseFloat(lx).toFixed(2)}m × ${parseFloat(ly).toFixed(2)}m × ${parseFloat(h).toFixed(2)}m</p>`;
            } else if (rekap.dimensi) {
                html += `<p><strong>Dimensi Fondasi:</strong> ${rekap.dimensi}</p>`;
            }
            const tulanganFields = ['tulangan_utama', 'tulangan_bagi', 'tulangan_panjang', 'tulangan_pendek_pusat', 'tulangan_pendek_tepi'];
            for (const field of tulanganFields) {
                if (rekap[field] && rekap[field] !== '-') {
                    const label = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    html += `<p><strong>${label}:</strong> ${rekap[field]}</p>`;
                }
            }
            html += `</div>`;
        } else {
            html += `<div class="result-item"><p>Data rekap tulangan tidak tersedia</p></div>`;
        }

        // --- Bagian Status Keamanan ---
        if (kontrol) {
            const statusKeamanan = getStatusKeamananFondasi(kontrol);
            html += `<div class="result-item" style="grid-column: 1 / -1; background: ${statusKeamanan.aman ? '#d4edda' : '#f8d7da'} !important;">
                <h4>STATUS KEAMANAN STRUKTUR</h4>
                <div style="text-align: center; padding: 1rem;">
                    <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                        ${statusKeamanan.aman ? '<span class="status-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">✓ STRUKTUR AMAN</span>' : '<span class="status-tidak-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">✗ PERLU PERBAIKAN</span>'}
                    </div>
                    <p style="margin: 0.5rem 0; color: #666;">${statusKeamanan.detail}</p>
                    ${statusKeamanan.kontrolTidakAman?.length ? `<div style="margin-top: 1rem; text-align: left;"><strong>Bagian yang perlu diperbaiki:</strong><ul>${statusKeamanan.kontrolTidakAman.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''}
                    ${statusKeamanan.saranPerbaikan?.length ? `<div style="margin-top: 1rem; text-align: left;"><strong>Saran perbaikan:</strong><ul>${statusKeamanan.saranPerbaikan.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
                </div>
            </div>`;
        } else {
            html += `<div class="result-item" style="grid-column: 1 / -1; background: #fff3cd;"><h4>⚠ DATA KONTROL TIDAK TERSEDIA</h4></div>`;
        }

        container.innerHTML = html;
    }

    function getStatusKeamananFondasi(kontrol) {
            if (!kontrol) return { aman: false, detail: 'Data kontrol tidak tersedia', saranPerbaikan: [], kontrolTidakAman: [] };
            const kontrolTidakAman = [];
            const saranPerbaikan = [];
            if (kontrol.dayaDukung && !kontrol.dayaDukung.aman) { kontrolTidakAman.push('Tekanan tanah melebihi daya dukung'); saranPerbaikan.push('Perbesar dimensi fondasi atau ganti lokasi dengan tanah yang lebih baik'); }
            if (kontrol.geser) {
                if (!kontrol.geser.aman1) { kontrolTidakAman.push('Geser 1 arah tidak memenuhi'); saranPerbaikan.push('Perbesar tebal fondasi atau tingkatkan mutu beton'); }
                if (!kontrol.geser.aman2) { kontrolTidakAman.push('Geser 2 arah tidak memenuhi'); saranPerbaikan.push('Perbesar tebal fondasi atau tingkatkan mutu beton'); }
            }
            if (kontrol.tulangan && !kontrol.tulangan.aman) { kontrolTidakAman.push('Tulangan tidak memenuhi persyaratan kapasitas momen'); saranPerbaikan.push('Perbanyak jumlah tulangan atau gunakan diameter tulangan yang lebih besar'); }
            if (kontrol.kuatDukung && !kontrol.kuatDukung.aman) { kontrolTidakAman.push('Kuat dukung fondasi tidak mencukupi'); saranPerbaikan.push('Perbesar dimensi fondasi atau tingkatkan mutu beton'); }
            if (kontrol.tulanganTambahan && !kontrol.tulanganTambahan.aman) { kontrolTidakAman.push('Jarak tulangan terlalu besar (s >= 100mm)'); saranPerbaikan.push('Perkecil jarak tulangan menjadi <= 100mm'); }
            if (kontrol.evaluasiTulangan && !kontrol.evaluasiTulangan.aman) { kontrolTidakAman.push('Tulangan terpasang lebih jarang dari yang dibutuhkan'); saranPerbaikan.push('Perkecil jarak tulangan sesuai hasil perhitungan'); }
            
            // Tambahan validasi otomatis jika status kontrol luas tulangan dari UI bernilai false
            if (kontrol.luasTulanganAman === false) {
                kontrolTidakAman.push('Luas tulangan terpasang (As terpasang) kurang dari luas tulangan yang diperlukan (As perlu)');
                saranPerbaikan.push('Tambahkan jumlah tulangan atau perbesar diameter tulangan');
            }

            const aman = kontrolTidakAman.length === 0;
            return { aman, detail: aman ? 'Semua persyaratan keamanan struktur telah terpenuhi' : 'Beberapa persyaratan keamanan struktur belum terpenuhi', saranPerbaikan, kontrolTidakAman };
    }
    // ========================
    // RINGKASAN KONTROL (step-step)
    // ========================
    function renderRingkasanFondasi(result) {
        const container = document.getElementById('controlContainer');
        if (!container) return;
        const { kontrol, data, rekap, inputData, optimasi } = result;
        const fondasiMode = data?.actualFondasiMode || optimasi?.as_rincian_per_meter?.mode_fondasi || inputData?.fondasiMode || 'bujur_sangkar';
        stepNumberGenerator = createStepNumber();
        let html = '';
        if (kontrol && data && rekap) {
            html = `<div class="steps">
                ${renderKontrolParameterDasar(data.parameter, kontrol.dayaDukung?.detail)}
                ${renderKontrolDayaDukungFondasi(kontrol.dayaDukung)}
                ${renderKontrolGeserFondasi(kontrol.geser)}
                ${renderKontrolTulanganFondasi(kontrol.tulangan, data.tulangan, fondasiMode, data.parameter, optimasi)}
                ${renderKontrolKuatDukungFondasi(kontrol.kuatDukung, inputData, data.kuatDukung, data.tulangan, fondasiMode, optimasi)}
                ${renderKontrolTambahanFondasi(kontrol)}
            </div>`;
        } else {
            html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
        }
        container.innerHTML = html;
    }

    function renderKontrolParameterDasar(parameter) {
        if (!parameter || parameter.sigma_min === undefined) return '';
        return renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Tekanan Minimum', `σ<sub>min</sub> = ${parameter.sigma_min?.toFixed(2)} kPa > 0`, parameter.sigma_min > 0);
    }
    function renderKontrolDayaDukungFondasi(kontrolDayaDukung) {
        if (!kontrolDayaDukung?.detail?.sigma_max) return '';
        const d = kontrolDayaDukung.detail;
        return renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Tekanan Maksimum', `σ<sub>max</sub> = ${d.sigma_max?.toFixed(2)} kPa ≤ q<sub>a</sub> = ${d.qa?.toFixed(2)} kPa`, d.sigma_max <= d.qa);
    }
    function renderKontrolGeserFondasi(kontrolGeser) {
        if (!kontrolGeser?.detail) return '';
        let html = '';
        const d = kontrolGeser.detail;
        if (d.Vu1 !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Geser 1 Arah', `V<sub>u1</sub> = ${d.Vu1?.toFixed(2)} kN ≤ φV<sub>c1</sub> = ${d.Vc1?.toFixed(2)} kN`, d.Vu1 <= d.Vc1);
        if (d.Vu2 !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Geser 2 Arah', `V<sub>u2</sub> = ${d.Vu2?.toFixed(2)} kN ≤ φV<sub>c2</sub> = ${d.phiVc2?.toFixed(2)} kN`, d.Vu2 <= d.phiVc2);
        return html;
    }
function renderKontrolTulanganFondasi(kontrolTulangan, dataTulangan, fondasiMode, parameter, optimasi) {
        if (!kontrolTulangan?.detail) return '';
        const detail = kontrolTulangan.detail;
        const Kmax = parameter?.Kmax || 0;
        const jenis = detail.jenis || fondasiMode;
        let html = '';
        
        // Flag internal untuk mencatat status aman seluruh komponen luas tulangan
        let semuaLuasAman = true;

        if (jenis === "bujur_sangkar") {
            if (detail.K !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Faktor Momen Pikul Tulangan', `K = ${detail.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`, detail.Kontrol_K === "AMAN");
            
            const As_perlu = detail.As_perlu || Math.max(detail.As1 || 0, detail.As2 || 0, detail.As3 || 0);
            const As_terpasang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTulangan?.bujur?.As_terpasang || 0;
            
            const isAman = As_terpasang >= As_perlu;
            if(!isAman) semuaLuasAman = false;

            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan', `A<sub>s terpasang</sub> = ${As_terpasang.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_perlu.toFixed(0)} mm²/m`, isAman);
        }
        else if (jenis === "persegi_panjang") {
            if (detail.bujur?.K !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Faktor Momen Pikul Tulangan Panjang', `K = ${detail.bujur.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`, detail.bujur.Kontrol_K === "AMAN");
            
            // 1. Tulangan Panjang
            const As_panjang = detail.bujur?.As_perlu || Math.max(detail.bujur?.As1 || 0, detail.bujur?.As2 || 0, detail.bujur?.As3 || 0);
            const As_terpasang_panjang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTulangan?.bujur?.As_terpasang || 0;
            const isPanjangAman = As_terpasang_panjang >= As_panjang;
            if(!isPanjangAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Panjang', `A<sub>s terpasang</sub> = ${As_terpasang_panjang.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_panjang.toFixed(0)} mm²/m`, isPanjangAman);

            if (detail.persegi?.K !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Faktor Momen Pikul Tulangan Pendek', `K = ${detail.persegi.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`, detail.persegi.Kontrol_K === "AMAN");
            
            // 2. Tulangan Pendek Pusat
            const As_pusat = detail.persegi?.Aspusat || 0;
            const As_terpasang_pusat = optimasi?.as_rincian_per_meter?.asPusatPerMeter || dataTulangan?.persegi?.As_terpasang_pusat || 0;
            const isPusatAman = As_terpasang_pusat >= As_pusat;
            if(!isPusatAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Pendek Pusat', `A<sub>s terpasang</sub> = ${As_terpasang_pusat.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_pusat.toFixed(0)} mm²/m`, isPusatAman);

            // 3. Tulangan Pendek Tepi
            const As_tepi = detail.persegi?.Astepi || 0;
            const As_terpasang_tepi = optimasi?.as_rincian_per_meter?.asTepiPerMeter || dataTulangan?.persegi?.As_terpasang_tepi || 0;
            const isTepiAman = As_terpasang_tepi >= As_tepi;
            if(!isTepiAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Pendek Tepi', `A<sub>s terpasang</sub> = ${As_terpasang_tepi.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_tepi.toFixed(0)} mm²/m`, isTepiAman);
        }
        else if (jenis === "menerus") {
            if (detail.K !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Faktor Momen Pikul Tulangan', `K = ${detail.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`, detail.Kontrol_K === "AMAN");
            
            // 1. Tulangan Utama
            const As_utama = detail.As_perlu || Math.max(detail.As1 || 0, detail.As2 || 0, detail.As3 || 0);
            const As_terpasang_utama = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTulangan?.menerus?.As_terpasang || 0;
            const isUtamaAman = As_terpasang_utama >= As_utama;
            if(!isUtamaAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Utama', `A<sub>s terpasang</sub> = ${As_terpasang_utama.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_utama.toFixed(0)} mm²/m`, isUtamaAman);
            
            // 2. Tulangan Bagi
            const As_bagi = detail.Asb_perlu || Math.max(detail.Asb1 || 0, detail.Asb2 || 0, detail.Asb3 || 0);
            const As_terpasang_bagi = optimasi?.as_rincian_per_meter?.asBagiPerMeter || dataTulangan?.menerus?.As_terpasang_bagi || 0;
            const isBagiAman = As_terpasang_bagi >= As_bagi;
            if(!isBagiAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Bagi', `A<sub>s terpasang</sub> = ${As_terpasang_bagi.toFixed(0)} mm²/m ≥ A<sub>s perlu</sub> = ${As_bagi.toFixed(0)} mm²/m`, isBagiAman);
        }

        // Tembuskan status keamanan luas tulangan ini ke objek result global agar dibaca oleh fungsi utama pembentuk komponen Kesimpulan Utama.
        if (window.lastResultObject) {
            window.lastResultObject.kontrol.luasTulanganAman = semuaLuasAman;
        }

        return html;
    }
        function renderKontrolKuatDukungFondasi(kontrolKuatDukung, inputData) {
        if (!kontrolKuatDukung?.detail) return '';
        let html = '';
        const detail = kontrolKuatDukung.detail;
        if (detail.Pu_cap !== undefined) {
            const Pu_input = inputData?.beban?.pu ? parseFloat(inputData.beban.pu) : 0;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Kuat Dukung Beton', `φP<sub>n</sub> = ${detail.Pu_cap?.toFixed(2)} kN ≥ P<sub>u</sub> = ${Pu_input.toFixed(2)} kN`, detail.Kontrol_Pu === "AMAN");
        }
        if (detail.It !== undefined && detail.Idh !== undefined) {
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Panjang Penyaluran', `ℓ<sub>t</sub> = ${detail.It?.toFixed(0)} mm ≥ ℓ<sub>dh</sub> = ${detail.Idh?.toFixed(0)} mm`, detail.Kontrol_Idh === "AMAN");
        }
        return html;
    }
    function renderKontrolTambahanFondasi(kontrol) {
        let html = '';
        if (kontrol.evaluasiTulangan?.detail) {
            for (const [key, value] of Object.entries(kontrol.evaluasiTulangan.detail)) {
                if (!value.aman) html += renderStepFondasi(stepNumberGenerator.next().value, `Evaluasi Tulangan (${key})`, `s<sub>input</sub> = ${value.s_input} mm ≤ s<sub>hitung</sub> = ${value.s_hitung} mm`, false);
            }
        }
        if (kontrol.tulanganTambahan?.detail) {
            for (const [key, value] of Object.entries(kontrol.tulanganTambahan.detail)) {
                if (!value.aman) html += renderStepFondasi(stepNumberGenerator.next().value, `Kontrol Jarak Minimum (${key})`, `s = ${value.nilai?.toFixed(0)} mm ≥ 100 mm`, false);
            }
        }
        return html;
    }
    function renderStepFondasi(number, desc, formula, aman = null) {
        const statusHtml = aman !== null ? `<div class="step-result">${aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>` : '';
        return `<div class="step-item"><div class="step-number">${number}</div><div class="step-content"><div class="step-desc">${desc}</div><div class="step-body"><div class="step-formula">${formula}</div>${statusHtml}</div></div></div>`;
    }

    // ========================
    // PENAMPANG FONDASI (diletakkan setelah resultContainer)
    // ========================
    function renderPenampangFondasi(result, insertAfterElement = null) {
        // Hapus penampang lama jika ada
        const existingSection = document.querySelector('.penampang-section');
        if (existingSection) existingSection.remove();

        const container = document.createElement('div');
        container.className = 'penampang-section';
        container.innerHTML = '<h2>PENAMPANG FONDASI</h2><div class="penampang-grid"></div>';

        if (insertAfterElement && insertAfterElement.parentNode) {
            insertAfterElement.parentNode.insertBefore(container, insertAfterElement.nextSibling);
        } else {
            const controlContainer = document.getElementById('controlContainer');
            if (controlContainer && controlContainer.parentNode) {
                controlContainer.parentNode.insertBefore(container, controlContainer.nextSibling);
            } else {
                document.body.appendChild(container);
            }
        }

        const grid = container.querySelector('.penampang-grid');
        const { data, inputData, optimasi } = result;
        const lx = data?.parameter?.lx || data?.dimensiOptimal?.Lx || optimasi?.kombinasi_terpilih?.Lx || inputData?.fondasi?.dimensi?.lx || 2.0;
        const ly = data?.parameter?.ly || data?.dimensiOptimal?.Ly || optimasi?.kombinasi_terpilih?.Ly || inputData?.fondasi?.dimensi?.ly || 2.0;
        const h = data?.dimensiOptimal?.h || optimasi?.kombinasi_terpilih?.h || data?.parameter?.h || inputData?.fondasi?.dimensi?.h || 0.5;
        const bx = parseFloat(inputData.fondasi?.dimensi?.bx) || 300;
        const by = parseFloat(inputData.fondasi?.dimensi?.by) || 300;
        const fondasiMode = data?.actualFondasiMode || optimasi?.as_rincian_per_meter?.mode_fondasi || inputData?.fondasi?.mode || 'bujur_sangkar';
        const D = optimasi?.kombinasi_terpilih?.D || 22;
        const Db = optimasi?.kombinasi_terpilih?.Db || 16;
        const s = data?.tulangan?.bujur?.s || 250;

        window.lastFondasiConfig = { lx, ly, h, bx, by, D, Db, s, fondasiMode };

        const tampilan = [
            { jenis: 'depan', title: 'Tampak Depan', containerId: 'svg-fondasi-depan', exportFunc: 'exportCADFondasiDepan' },
            { jenis: 'atas', title: 'Tampak Atas', containerId: 'svg-fondasi-atas', exportFunc: 'exportCADFondasiAtas' },
            { jenis: 'samping', title: 'Tampak Samping', containerId: 'svg-fondasi-samping', exportFunc: 'exportCADFondasiSamping' }
        ];

        let rendererType = (fondasiMode === 'menerus') ? 'menerus' : 'tunggal';

        tampilan.forEach(t => {
            let legendItems = [];
            const isPersegiPanjang = (fondasiMode === 'persegi_panjang');
            const isDepanAtas = (t.jenis === 'depan' || t.jenis === 'atas');
            if (isPersegiPanjang) {
                if (isDepanAtas) {
                    legendItems = [
                        { color: '#000000', label: 'Tulangan Panjang' },
                        { color: '#ff0000', label: 'Tulangan Pendek Pusat' },
                        { color: '#0000ff', label: 'Tulangan Pendek Tepi' }
                    ];
                } else {
                    legendItems = [
                        { color: '#000000', label: 'Tulangan Panjang' },
                        { color: '#ff0000', label: 'Tulangan Pendek' }
                    ];
                }
            } else {
                legendItems = [
                    { color: '#000000', label: 'Tulangan Utama' },
                    { color: '#ff0000', label: 'Tulangan Bagi' }
                ];
            }
            const legendHtml = legendItems.map(item => `<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="display: inline-block; width: 12px; height: 12px; background-color: ${item.color}; border-radius: 50%;"></span><span>${item.label}</span></div>`).join('');
            const card = document.createElement('div');
            card.className = 'penampang-card';
            card.innerHTML = `
                <h3>${t.title}</h3>
                <div id="${t.containerId}" class="svg-container" style="min-height: 250px; background: #fafafa; border-radius: 8px; margin-bottom: 0.5rem;"></div>
                <div class="penampang-footer" style="display: flex; justify-content: space-between; align-items: flex-start; margin: 0.5rem 0 0.75rem 0;">
                    <div class="legend" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; font-size: 0.9rem; color: #000000;">${legendHtml}</div>
                    <div class="scale-info"></div>
                </div>
                <div class="cad-actions"><button class="btn secondary" onclick="${t.exportFunc}()">Copy ke CAD</button></div>
                <div class="penampang-disclaimer">*Penampang ini hanya ilustrasi dan tidak 100% sesuai dengan CAD</div>
            `;
            grid.appendChild(card);
            let renderConfig;
            if (rendererType === 'tunggal') {
                renderConfig = { jenis: t.jenis, lx: parseFloat(lx), ly: parseFloat(ly), h: parseFloat(h), bx: parseFloat(bx), by: parseFloat(by) };
            } else {
                renderConfig = { jenis: t.jenis, L: parseFloat(lx), B: parseFloat(ly), H: parseFloat(h), bx: parseFloat(bx), by: parseFloat(by) };
            }
            if (typeof window.renderPenampangFondasiByType === 'function') {
                const renderResult = window.renderPenampangFondasiByType(rendererType, renderConfig, t.containerId);
                const scaleDiv = card.querySelector('.scale-info');
                let skalaH = '1 : 1', skalaV = '1 : 1';
                if (renderResult?.scaleInfo?.needScaleNote) {
                    const si = renderResult.scaleInfo;
                    const formatScale = (val) => Math.abs(val - Math.round(val)) < 1e-6 ? Math.round(val).toString() : val.toFixed(1);
                    skalaH = `1 : ${formatScale(1 / si.skala_horizontal)}`;
                    skalaV = `1 : ${formatScale(1 / si.skala_vertikal)}`;
                }
                const [firstH, secondH] = splitScale(skalaH);
                const [firstV, secondV] = splitScale(skalaV);
                scaleDiv.innerHTML = `<span class="scale-label">Skala Horizontal</span><span class="scale-first">${firstH}</span><span class="scale-second">${secondH}</span><span class="scale-label">Skala Vertikal</span><span class="scale-first">${firstV}</span><span class="scale-second">${secondV}</span>`;
            } else {
                document.getElementById(t.containerId).innerHTML = '<p style="color:red;">Renderer fondasi tidak tersedia.</p>';
                const scaleDiv = card.querySelector('.scale-info');
                if (scaleDiv) scaleDiv.innerHTML = `<span class="scale-label">Skala Horizontal</span><span class="scale-first">1 :</span><span class="scale-second">1</span><span class="scale-label">Skala Vertikal</span><span class="scale-first">1 :</span><span class="scale-second">1</span>`;
            }
        });
        ensureResponsiveGridStyle();
    }

    function splitScale(scaleStr) {
        const parts = scaleStr.split(':');
        if (parts.length >= 2) return [parts[0].trim() + ' :', parts.slice(1).join(':').trim()];
        return [scaleStr, ''];
    }

    function ensureResponsiveGridStyle() {
        if (document.getElementById('fondasi-grid-style')) return;
        const style = document.createElement('style');
        style.id = 'fondasi-grid-style';
        style.textContent = `
            .penampang-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
            .penampang-card .scale-info { display: grid; grid-template-columns: auto auto 1fr; gap: 0.25rem 0.5rem; margin-right: 10px; font-size: 0.9rem; }
            .scale-label, .scale-first, .scale-second { text-align: right; white-space: nowrap; }
            .penampang-disclaimer { text-align: right; font-size: 0.7rem; color: #888; margin-top: 8px; border-top: 1px solid #eee; padding-top: 6px; }
            @media (max-width: 768px) {
                .penampang-grid { grid-template-columns: 1fr; }
                .penampang-footer { flex-direction: column-reverse !important; align-items: flex-start !important; }
                .penampang-card .scale-info { margin-right: 0 !important; margin-bottom: 0 !important; justify-self: start; font-size: 0.9rem; }
                .scale-label, .scale-first, .scale-second { text-align: left !important; }
                .penampang-card .legend { margin-top: 0 !important; padding-top: 0 !important; }
                .penampang-disclaimer { text-align: right; font-size: 0.65rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // ========================
    // EKSPORT CAD
    // ========================
    function exportCADFondasiDepan() { exportCADFondasiWithType('depan'); }
    function exportCADFondasiSamping() { exportCADFondasiWithType('samping'); }
    function exportCADFondasiAtas() { exportCADFondasiWithType('atas'); }
    function exportCADFondasiWithType(jenis) {
        let fondasiMode = 'bujur_sangkar';
        try {
            const saved = sessionStorage.getItem('calculationResultFondasi') || sessionStorage.getItem('calculationResult');
            if (saved) {
                const data = JSON.parse(saved);
                fondasiMode = data.inputData?.fondasi?.mode || data.optimasi?.as_rincian_per_meter?.mode_fondasi || data.data?.actualFondasiMode || 'bujur_sangkar';
            }
        } catch(e) { console.warn(e); }
        let cadText = '';
        if (fondasiMode === 'menerus') {
            if (typeof window.generateCADFondasiMenerus === 'function') cadText = window.generateCADFondasiMenerus(jenis);
            else { alert('Modul CAD untuk fondasi menerus belum tersedia.'); return; }
        } else {
            if (typeof window.generateCADFondasiTunggal === 'function') cadText = window.generateCADFondasiTunggal(jenis);
            else { alert('Modul CAD untuk fondasi tunggal belum tersedia.'); return; }
        }
        if (cadText && cadText.trim() !== '') {
            navigator.clipboard.writeText(cadText).then(() => alert(`Text CAD untuk penampang fondasi (${jenis}) berhasil disalin ke clipboard!`)).catch(err => { console.error(err); alert('Gagal menyalin text CAD.'); });
        } else {
            alert(`Gagal menghasilkan kode CAD untuk fondasi ${fondasiMode} tampak ${jenis}`);
        }
    }
    function exportCADFondasi() { exportCADFondasiDepan(); }
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 4px; z-index: 1000; max-width: 400px;`;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    window.renderFondasiReport = renderFondasiReport;
    window.exportCADFondasi = exportCADFondasi;
    window.exportCADFondasiDepan = exportCADFondasiDepan;
    window.exportCADFondasiSamping = exportCADFondasiSamping;
    window.exportCADFondasiAtas = exportCADFondasiAtas;

    console.log("✅ report-fondasi.js final: rekap+status → penampang → kontrol");
})();