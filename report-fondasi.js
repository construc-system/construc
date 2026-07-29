// report-fondasi.js (final - updated with Efisiensi, Safe Reorder & Global CAD Button)
(function() {
    'use strict';

    // ==================== DISPATCHER CAD ====================
    window.exportCADFondasiGlobal = function() {
        let fondasiMode = 'bujur_sangkar';
        try {
            const saved = sessionStorage.getItem('calculationResultFondasi') || sessionStorage.getItem('calculationResult');
            if (saved) {
                const data = JSON.parse(saved);
                fondasiMode = data.inputData?.fondasi?.mode || data.optimasi?.as_rincian_per_meter?.mode_fondasi || data.data?.actualFondasiMode || 'bujur_sangkar';
            }
        } catch(e) { console.warn(e); }
        
        let cadText = '';
        let label = `CAD Fondasi ${fondasiMode}`;
        
        if (fondasiMode === 'menerus') {
            if (typeof window.generateCADFondasiMenerus === 'function') {
                // Sesuai update fungsi CAD, dipanggil tanpa parameter agar merender ketiganya
                cadText = window.generateCADFondasiMenerus();
            } else {
                alert('Modul CAD untuk fondasi menerus belum tersedia.'); 
                return;
            }
        } else {
            if (typeof window.generateCADFondasiTunggal === 'function') {
                // Sama halnya untuk fondasi tunggal, panggil tanpa parameter
                cadText = window.generateCADFondasiTunggal();
            } else {
                alert('Modul CAD untuk fondasi tunggal belum tersedia.'); 
                return;
            }
        }
        
        if (cadText && cadText.trim() !== '') {
            if (typeof window.copyToClipboard === 'function') {
                window.copyToClipboard(cadText, label);
            } else {
                navigator.clipboard.writeText(cadText).then(() => alert(`${label} berhasil disalin ke clipboard!`))
                    .catch(err => { console.error(err); alert('Gagal menyalin text CAD.'); });
            }
        } else {
            alert(`Gagal menghasilkan kode CAD untuk fondasi ${fondasiMode}`);
        }
    };

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

                // 1. Render komponen satu per satu (Lokasinya akan diatur ulang oleh safeReorder)
                renderRekapDanStatusFondasi(result); // Target: #resultContainer
                renderPenampangFondasi(result, document.getElementById('resultContainer')); // Target: .penampang-section
                renderRingkasanFondasi(result);      // Target: #controlContainer
                
                // --- FITUR BARU: Efisiensi ---
                renderEfisiensiFondasi(result);      // Target: #efisiensi-section-fondasi

                // Update ulang status setelah luasan tulangan dicek
                renderRekapDanStatusFondasi(window.lastResultObject);
                
                // 2. Susun ulang urutan elemen secara aman
                safeReorderSectionsFondasi();

                console.log("✅ Laporan fondasi berhasil di-render dengan Efisiensi, Urutan Ter-update, dan Global CAD!");
            } catch (error) {
                console.error('Error rendering fondasi report:', error);
                showError(`Error merender laporan fondasi: ${error.message}`);
            }
    }

    function safeReorderSectionsFondasi() {
        // Ambil elemen wrapper (.section) dari masing-masing kontainer
        const controlSec = document.getElementById('controlContainer')?.closest('.section');
        const efisiensiSec = document.getElementById('efisiensi-section-fondasi');
        const resultSec = document.getElementById('resultContainer')?.closest('.section');
        const penampangSec = document.querySelector('.penampang-section');

        // Urutan yang diminta: Control (Perhitungan) -> Efisiensi -> Result (Tulangan) -> Penampang
        // Jadikan Control Section sebagai patokan
        if (controlSec && controlSec.parentNode) {
            const parent = controlSec.parentNode;
            let currentAnchor = controlSec;
            
            if (efisiensiSec) {
                parent.insertBefore(efisiensiSec, currentAnchor.nextSibling);
                currentAnchor = efisiensiSec;
            }
            if (resultSec) {
                parent.insertBefore(resultSec, currentAnchor.nextSibling);
                currentAnchor = resultSec;
            }
            if (penampangSec) {
                parent.insertBefore(penampangSec, currentAnchor.nextSibling);
            }
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
    // INPUT DATA
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
    // REKAP + STATUS KEAMANAN
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
                    const label = field.replace(/_/g, ' ').replace(/ \w/g, l => l.toUpperCase());
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
        
        let semuaLuasAman = true;

        if (jenis === "bujur_sangkar") {
            if (detail.K !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Faktor Momen Pikul Tulangan', `K = ${detail.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`, detail.Kontrol_K === "AMAN");
            
            const As_perlu = detail.As_perlu || Math.max(detail.As1 || 0, detail.As2 || 0, detail.As3 || 0);
            const As_terpasang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTulangan?.bujur?.As_terpasang || 0;
            
            const isAman = As_terpasang >= As_perlu;
            if(!isAman) semuaLuasAman = false;

            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan', `A<sub>s,d</sub> = ${As_terpasang.toFixed(0)} mm²/m ≥ A<sub>s,u</sub> = ${As_perlu.toFixed(0)} mm²/m`, isAman);
        }
        else if (jenis === "persegi_panjang") {
            if (detail.bujur?.K !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Faktor Momen Pikul Tulangan Panjang', `K = ${detail.bujur.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`, detail.bujur.Kontrol_K === "AMAN");
            
            const As_panjang = detail.bujur?.As_perlu || Math.max(detail.bujur?.As1 || 0, detail.bujur?.As2 || 0, detail.bujur?.As3 || 0);
            const As_terpasang_panjang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTulangan?.bujur?.As_terpasang || 0;
            const isPanjangAman = As_terpasang_panjang >= As_panjang;
            if(!isPanjangAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Panjang', `A<sub>s,d</sub> = ${As_terpasang_panjang.toFixed(0)} mm²/m ≥ A<sub>s,u</sub> = ${As_panjang.toFixed(0)} mm²/m`, isPanjangAman);

            if (detail.persegi?.K !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Faktor Momen Pikul Tulangan Pendek', `K = ${detail.persegi.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`, detail.persegi.Kontrol_K === "AMAN");
            
            const As_pusat = detail.persegi?.Aspusat || 0;
            const As_terpasang_pusat = optimasi?.as_rincian_per_meter?.asPusatPerMeter || dataTulangan?.persegi?.As_terpasang_pusat || 0;
            const isPusatAman = As_terpasang_pusat >= As_pusat;
            if(!isPusatAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Pendek Pusat', `A<sub>s,d</sub> = ${As_terpasang_pusat.toFixed(0)} mm²/m ≥ A<sub>s,u</sub> = ${As_pusat.toFixed(0)} mm²/m`, isPusatAman);

            const As_tepi = detail.persegi?.Astepi || 0;
            const As_terpasang_tepi = optimasi?.as_rincian_per_meter?.asTepiPerMeter || dataTulangan?.persegi?.As_terpasang_tepi || 0;
            const isTepiAman = As_terpasang_tepi >= As_tepi;
            if(!isTepiAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Pendek Tepi', `A<sub>s,d</sub> = ${As_terpasang_tepi.toFixed(0)} mm²/m ≥ A<sub>s,u</sub> = ${As_tepi.toFixed(0)} mm²/m`, isTepiAman);
        }
        else if (jenis === "menerus") {
            if (detail.K !== undefined) html += renderStepFondasi(stepNumberGenerator.next().value, 'Faktor Momen Pikul Tulangan', `K = ${detail.K?.toFixed(6)} ≤ K<sub>max</sub> = ${Kmax?.toFixed(6)}`, detail.Kontrol_K === "AMAN");
            
            const As_utama = detail.As_perlu || Math.max(detail.As1 || 0, detail.As2 || 0, detail.As3 || 0);
            const As_terpasang_utama = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTulangan?.menerus?.As_terpasang || 0;
            const isUtamaAman = As_terpasang_utama >= As_utama;
            if(!isUtamaAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Utama', `A<sub>s,d</sub> = ${As_terpasang_utama.toFixed(0)} mm²/m ≥ A<sub>s,u</sub> = ${As_utama.toFixed(0)} mm²/m`, isUtamaAman);
            
            const As_bagi = detail.Asb_perlu || Math.max(detail.Asb1 || 0, detail.Asb2 || 0, detail.Asb3 || 0);
            const As_terpasang_bagi = optimasi?.as_rincian_per_meter?.asBagiPerMeter || dataTulangan?.menerus?.As_terpasang_bagi || 0;
            const isBagiAman = As_terpasang_bagi >= As_bagi;
            if(!isBagiAman) semuaLuasAman = false;
            html += renderStepFondasi(stepNumberGenerator.next().value, 'Kontrol Luas Tulangan Bagi', `A<sub>s,d</sub> = ${As_terpasang_bagi.toFixed(0)} mm²/m ≥ A<sub>s,u</sub> = ${As_bagi.toFixed(0)} mm²/m`, isBagiAman);
        }

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
    // EFISIENSI FONDASI
    // ========================
    function renderEfisiensiFondasi(result) {
        let existingSection = document.getElementById('efisiensi-section-fondasi');
        if (existingSection) existingSection.remove();

        const section = document.createElement('section');
        section.className = 'section efisiensi-tulangan';
        section.id = 'efisiensi-section-fondasi';

        const { kontrol, data, optimasi, inputData } = result;
        if (!kontrol) return;

        const safeDiv = (num, den) => (den && den > 0) ? (num / den) : 0;
        const fondasiMode = data?.actualFondasiMode || optimasi?.as_rincian_per_meter?.mode_fondasi || inputData?.fondasi?.mode || 'bujur_sangkar';

        // 1. Dimensi Fondasi (Geser)
        const getGeser = () => {
            const det = kontrol?.geser?.detail;
            if(!det) return [];
            let res = [];
            if(det.Vu1 !== undefined && det.Vc1 !== undefined) {
                res.push({ label: 'Geser 1 Arah', val: { b: det.Vu1, k: det.Vc1, e: safeDiv(det.Vu1, det.Vc1)*100, valid: true, type: 'V' } });
            }
            if(det.Vu2 !== undefined && det.phiVc2 !== undefined) {
                res.push({ label: 'Geser 2 Arah', val: { b: det.Vu2, k: det.phiVc2, e: safeDiv(det.Vu2, det.phiVc2)*100, valid: true, type: 'V' } });
            }
            return res;
        };

        // 2. Tulangan Lentur
        const getTulangan = () => {
            const det = kontrol?.tulangan?.detail;
            const dataTul = data?.tulangan;
            if(!det) return [];
            let res = [];
            const jenis = det.jenis || fondasiMode;

            if (jenis === 'bujur_sangkar') {
                const As_perlu = det.As_perlu || Math.max(det.As1 || 0, det.As2 || 0, det.As3 || 0);
                const As_terpasang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTul?.bujur?.As_terpasang || 1;
                res.push({ label: 'Tulangan Utama', val: { b: As_perlu, k: As_terpasang, e: safeDiv(As_perlu, As_terpasang)*100, valid: true, type: 'As' }});
            } else if (jenis === 'persegi_panjang') {
                const As_panjang = det.bujur?.As_perlu || Math.max(det.bujur?.As1 || 0, det.bujur?.As2 || 0, det.bujur?.As3 || 0);
                const As_terpasang_panjang = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTul?.bujur?.As_terpasang || 1;
                res.push({ label: 'Arah Panjang', val: { b: As_panjang, k: As_terpasang_panjang, e: safeDiv(As_panjang, As_terpasang_panjang)*100, valid: true, type: 'As' }});

                const As_pusat = det.persegi?.Aspusat || 0;
                const As_terpasang_pusat = optimasi?.as_rincian_per_meter?.asPusatPerMeter || dataTul?.persegi?.As_terpasang_pusat || 1;
                res.push({ label: 'Arah Pendek (Pusat)', val: { b: As_pusat, k: As_terpasang_pusat, e: safeDiv(As_pusat, As_terpasang_pusat)*100, valid: true, type: 'As' }});

                const As_tepi = det.persegi?.Astepi || 0;
                const As_terpasang_tepi = optimasi?.as_rincian_per_meter?.asTepiPerMeter || dataTul?.persegi?.As_terpasang_tepi || 1;
                res.push({ label: 'Arah Pendek (Tepi)', val: { b: As_tepi, k: As_terpasang_tepi, e: safeDiv(As_tepi, As_terpasang_tepi)*100, valid: true, type: 'As' }});
            } else if (jenis === 'menerus') {
                const As_utama = det.As_perlu || Math.max(det.As1 || 0, det.As2 || 0, det.As3 || 0);
                const As_terpasang_utama = optimasi?.as_rincian_per_meter?.asUtamaPerMeter || dataTul?.menerus?.As_terpasang || 1;
                res.push({ label: 'Tulangan Utama', val: { b: As_utama, k: As_terpasang_utama, e: safeDiv(As_utama, As_terpasang_utama)*100, valid: true, type: 'As' }});

                const As_bagi = det.Asb_perlu || Math.max(det.Asb1 || 0, det.Asb2 || 0, det.Asb3 || 0);
                const As_terpasang_bagi = optimasi?.as_rincian_per_meter?.asBagiPerMeter || dataTul?.menerus?.As_terpasang_bagi || 1;
                res.push({ label: 'Tulangan Bagi', val: { b: As_bagi, k: As_terpasang_bagi, e: safeDiv(As_bagi, As_terpasang_bagi)*100, valid: true, type: 'As' }});
            }
            return res;
        };

        // 3. Kuat Dukung Fondasi (P)
        const getKuatDukung = () => {
            const det = kontrol?.kuatDukung?.detail;
            if(!det || det.Pu_cap === undefined) return [];
            const Pu_input = inputData?.beban?.pu ? parseFloat(inputData.beban.pu) : 0;
            return [{ label: 'Kapasitas Aksial', val: { b: Pu_input, k: det.Pu_cap, e: safeDiv(Pu_input, det.Pu_cap) * 100, valid: true, type: 'P' } }];
        };

        const listGeser = getGeser();
        const listTulangan = getTulangan();
        const listKuatDukung = getKuatDukung();

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

        const renderCard = (title, items) => {
            if (items.length === 0) return '';
            
            const validItems = items.filter(i => i.val.valid);
            if (validItems.length === 0) return '';
            
            const rawAvg = Math.round(validItems.reduce((acc, curr) => acc + curr.val.e, 0) / validItems.length) || 0;
            
            // Tentukan mana yang gagal (melebihi 100%)
            let failedNames = [];
            validItems.forEach(item => {
                if(item.val.e > 100) failedNames.push(item.label);
            })

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
                } else if (failedNames.length > 2) {
                    failedText = failedNames.slice(0, -1).join(', ') + ", dan " + failedNames[failedNames.length - 1];
                }
                infoText = `Nilai efisiensi <strong>${failedText}</strong> melebihi batas kapasitas desain (> 100%), sehingga struktur dinyatakan gagal karna struktur tidak mampu menahan beban.`;
            } else {
                infoText = `Nilai&nbsp;<strong>${rawAvg}%</strong> merupakan hasil rata-rata tingkat efisiensi untuk ${title.toLowerCase()}.`;
            }


            const renderSub = (label, val) => {
                // Logika utama untuk mengganti tulisan dan warna jika > 100
                const isSubGagal = val.e > 100;
                const eStr = isSubGagal ? "Gagal" : `${val.e.toFixed(1)}%`;
                const cCol = isSubGagal ? failedColor : getColorForEfficiency(val.e);
                
                let labelB, labelK, unit, symB, symK;
                if (val.type === 'sigma') {
                    labelB = 'σ<sub>max</sub>&nbsp; (Beban)'; labelK = 'q<sub>a</sub>&nbsp; (Kapasitas)'; unit = 'kPa'; symB = 'σ<sub>max</sub>'; symK = 'q<sub>a</sub>';
                } else if (val.type === 'V') {
                    labelB = 'V<sub>u</sub>&nbsp; (Beban)'; labelK = 'φV<sub>c</sub>&nbsp; (Kapasitas)'; unit = 'kN'; symB = 'V<sub>u</sub>'; symK = 'φV<sub>c</sub>';
                } else if (val.type === 'As') {
                    labelB = 'A<sub>s,u</sub>&nbsp; (Perlu)'; labelK = 'A<sub>s,d</sub>&nbsp; (Desain)'; unit = 'mm&sup2;/m'; symB = 'A<sub>s,u</sub>'; symK = 'A<sub>s,d</sub>';
                } else if (val.type === 'P') {
                    labelB = 'P<sub>u</sub>&nbsp; (Beban)'; labelK = 'φP<sub>n</sub>&nbsp; (Kapasitas)'; unit = 'kN'; symB = 'P<sub>u</sub>'; symK = 'φP<sub>n</sub>';
                }

                return `
                <div class="sub-item">
                    <div class="sub-item-header">${label}</div>
                    <div class="calc-details">
                        <div class="calc-row"><span>${labelB}</span><span>${val.b.toFixed(2)} ${unit}</span></div>
                        <div class="calc-row"><span>${labelK}</span><span>${val.k.toFixed(2)} ${unit}</span></div>
                        <div class="calc-formula">
                            <span>Efisiensi</span>
                            <span style="color: ${cCol}; font-weight: 700;">${symB} / ${symK} &times; 100% = ${eStr}</span>
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
                        ${validItems.map(i => renderSub(i.label, i.val)).join('')}
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

        let cardsHtml = '';
        cardsHtml += renderCard('Dimensi Fondasi', listGeser);
        cardsHtml += renderCard('Tulangan Lentur', listTulangan);
        cardsHtml += renderCard('Kuat Dukung Fondasi', listKuatDukung);

        if (!cardsHtml) return;

        section.innerHTML = `
            <h2>EFISIENSI FONDASI</h2>
            <div class="efisiensi-container">
                ${cardsHtml}
            </div>
        `;

        if (!document.getElementById('efisiensi-style')) {
            const style = document.createElement('style');
            style.id = 'efisiensi-style';
            style.textContent = `
                .efisiensi-container { display: flex; flex-direction: column; gap: 0.75rem; }
                .efisiensi-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; border-left: 4px solid var(--color-borders); overflow: hidden; transition: box-shadow 0.2s; }
                .efisiensi-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .efisiensi-header { padding: 1rem; cursor: pointer; display: grid; grid-template-columns: 200px 1fr 60px 30px; align-items: center; gap: 1rem; transition: background-color 0.2s ease; }
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

        // Tahan elemen sementara untuk diatur di safeReorderSectionsFondasi()
        document.body.appendChild(section);
    }

    // ========================
    // PENAMPANG FONDASI
    // ========================
    function renderPenampangFondasi(result, insertAfterElement = null) {
        // Hapus penampang lama jika ada
        const existingSection = document.querySelector('.penampang-section');
        if (existingSection) existingSection.remove();

        const container = document.createElement('div');
        container.className = 'penampang-section section';
        
        // Buat struktur utama penampang termasuk tombol global CAD di tengah bawah card SVG
        container.innerHTML = `
            <h2>PENAMPANG FONDASI</h2>
            <div class="penampang-grid"></div>
            <div class="cad-global-action" style="display: flex; justify-content: center; margin-top: 1.5rem;">
                <button class="btn secondary" onclick="window.exportCADFondasiGlobal()">Copy ke CAD</button>
            </div>
        `;

        // PENTING: Masukkan DOM dulu agar module eksternal bisa cari ID nya
        document.body.appendChild(container);

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

        // Card button CAD di hapus, cukup config display nya
        const tampilan = [
            { jenis: 'depan', title: 'Tampak Depan', containerId: 'svg-fondasi-depan' },
            { jenis: 'atas', title: 'Tampak Atas', containerId: 'svg-fondasi-atas' },
            { jenis: 'samping', title: 'Tampak Samping', containerId: 'svg-fondasi-samping' }
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
            
            // Tombol "Copy ke CAD" sudah dihapus dari masing-masing card penampang
            card.innerHTML = `
                <h3>${t.title}</h3>
                <div id="${t.containerId}" class="svg-container" style="min-height: 250px; background: #fafafa; border-radius: 8px; margin-bottom: 0.5rem;"></div>
                <div class="penampang-footer" style="display: flex; justify-content: space-between; align-items: flex-start; margin: 0.5rem 0 0.75rem 0;">
                    <div class="legend" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; font-size: 0.9rem; color: #000000;">${legendHtml}</div>
                    <div class="scale-info"></div>
                </div>
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

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 4px; z-index: 1000; max-width: 400px;`;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    window.renderFondasiReport = renderFondasiReport;
    
    // Mengekspor fungsi fallback untuk keamanan
    window.exportCADFondasi = window.exportCADFondasiGlobal;

    console.log("✅ report-fondasi.js final (Global CAD, Efisiensi 3 Parameter tanpa Daya Dukung)");
})();