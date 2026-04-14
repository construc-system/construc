// report-pelat.js - Renderer khusus untuk laporan pelat dengan 3 tampilan penampang
// Versi final: memastikan tidak ada sisa elemen balok/kolom, judul benar, hanya 3 penampang pelat

(function() {
    'use strict';
    
    // Generator untuk step number
    function* createStepNumber() {
        let step = 1;
        while (true) {
            yield step++;
        }
    }
    
    let stepNumberGenerator;
    
    // ==================== FUNGSI UTAMA ====================
    function renderPelatReport(result) {
        try {
            // Bersihkan sisa-sisa penampang dari modul lain (balok/kolom)
            cleanupLegacyPenampang();
            
            updateReportTitle(result);
            renderInputDataPelat(result.inputData || {});
            renderHasilPerhitunganPelat(result);
            renderRingkasanPelat(result);
            renderPenampangPelat(result); // hanya 3 tampilan pelat
            
            console.log("✅ Laporan pelat berhasil di-render");
        } catch (error) {
            console.error('Error rendering pelat report:', error);
            showError(`Error merender laporan pelat: ${error.message}`);
        }
    }
    
    // Hapus elemen penampang yang tidak diinginkan (dari balok/kolom)
    function cleanupLegacyPenampang() {
        // Hapus semua section penampang yang mungkin dibuat oleh modul lain
        const existingSections = document.querySelectorAll('.penampang-section');
        existingSections.forEach(section => {
            // Hanya hapus jika bukan bagian dari pelat (atau hapus semua, nanti dibuat ulang)
            section.remove();
        });
        
        // Hapus juga container yang mungkin tersisa dari balok (misalnya penampang-container)
        const balokContainers = document.querySelectorAll('.penampang-container, .penampang-wrapper, .penampang-tumpuan, .penampang-lapangan');
        balokContainers.forEach(el => el.remove());
        
        // Pastikan tombol export CAD untuk balok tidak mengganggu
        const cadButtons = document.querySelectorAll('.cad-actions .btn');
        // Tidak dihapus, nanti akan diganti dengan yang baru
    }
    
    // ==================== RENDER INPUT DATA ====================
    function renderInputDataPelat(inputData) {
        const container = document.getElementById('inputDataContainer');
        if (!container) return;
        
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
            </div>
        `;
    
        // DATA DIMENSI
        html += `
            <div class="data-card">
                <h3>Dimensi</h3>
                <div class="data-row">
                    <span class="data-label">L<sub>y</sub></span>
                    <span class="data-value">${inputData.dimensi?.ly || 'N/A'} mm</span>
                </div>
                <div class="data-row">
                    <span class="data-label">L<sub>x</sub></span>
                    <span class="data-value">${inputData.dimensi?.lx || 'N/A'} mm</span>
                </div>
                <div class="data-row">
                    <span class="data-label">h</span>
                    <span class="data-value">${inputData.dimensi?.h || 'N/A'} mm</span>
                </div>
                <div class="data-row">
                    <span class="data-label">S<sub>b</sub></span>
                    <span class="data-value">${inputData.dimensi?.sb || 'N/A'} mm</span>
                </div>
            </div>
        `;
    
        // DATA BEBAN
        if (inputData.beban) {
            html += `<div class="data-card"><h3>Beban</h3>`;
            if (inputData.beban.mode === "auto") {
                html += `
                    <div class="data-row"><span class="data-label">Jenis Tumpuan</span><span class="data-value">${inputData.beban.auto?.tumpuan_type || 'N/A'}</span></div>
                    <div class="data-row"><span class="data-label">q<sub>u</sub></span><span class="data-value">${inputData.beban.auto?.qu || 'N/A'} kN/m²</span></div>
                `;
            } else {
                html += `<div class="data-row"><span class="data-label">M<sub>u</sub></span><span class="data-value">${inputData.beban.manual?.mu || 'N/A'} kNm/m</span></div>`;
            }
            html += `</div>`;
        }
    
        // DATA TULANGAN (mode evaluasi)
        const isEvaluasiMode = inputData.mode === 'evaluasi';
        if (isEvaluasiMode && inputData.tulangan) {
            html += `
                <div class="data-card">
                    <h3>Tulangan</h3>
                    <div class="data-row"><span class="data-label">D</span><span class="data-value">${inputData.tulangan.d || 'N/A'} mm</span></div>
                    <div class="data-row"><span class="data-label">D<sub>bagi</sub></span><span class="data-value">${inputData.tulangan.db || 'N/A'} mm</span></div>
                    <div class="data-row"><span class="data-label">s</span><span class="data-value">${inputData.tulangan.s || 'N/A'} mm</span></div>
                    <div class="data-row"><span class="data-label">s<sub>bagi</sub></span><span class="data-value">${inputData.tulangan.sb || 'N/A'} mm</span></div>
                </div>
            `;
        }
    
        const lambda = inputData.lanjutan?.lambda;
        if (lambda && parseFloat(lambda) !== 1) {
            html += `<div class="data-card"><h3>Konstanta</h3><div class="data-row"><span class="data-label">λ</span><span class="data-value">${lambda}</span></div></div>`;
        }
    
        container.innerHTML = html;
    }
    
    // ==================== RENDER HASIL PERHITUNGAN ====================
    function renderHasilPerhitunganPelat(result) {
        const container = document.getElementById('resultContainer');
        if (!container) return;
        if (!result.rekap) {
            container.innerHTML = '<div class="result-item"><p>Data hasil perhitungan tidak tersedia</p></div>';
            return;
        }
    
        const { rekap, kontrol } = result;
        let html = '';
    
        if (rekap.formatted) {
            html += `
                <div class="result-item" style="grid-column: 1 / -1;">
                    <h4>Rekap Tulangan</h4>
                    ${rekap.formatted.tulangan_pokok_x ? `<p><strong>Tulangan Utama:</strong> ${rekap.formatted.tulangan_pokok_x}</p>` : ''}
                    ${rekap.formatted.tulangan_bagi_x ? `<p><strong>Tulangan Bagi:</strong> ${rekap.formatted.tulangan_bagi_x}</p>` : ''}
                </div>
            `;
        }
    
        if (kontrol) {
            const statusKeamanan = getStatusKeamananPelat(kontrol);
            html += `
                <div class="result-item" style="grid-column: 1 / -1; background: ${statusKeamanan.aman ? '#d4edda' : '#f8d7da'} !important;">
                    <h4>STATUS KEAMANAN STRUKTUR</h4>
                    <div style="text-align: center; padding: 1rem;">
                        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                            ${statusKeamanan.aman ? '<span class="status-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">✓ STRUKTUR AMAN</span>' : '<span class="status-tidak-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">✗ PERLU PERBAIKAN</span>'}
                        </div>
                        <p style="margin: 0.5rem 0; color: #666;">${statusKeamanan.detail}</p>
                        ${statusKeamanan.kontrolTidakAman && statusKeamanan.kontrolTidakAman.length > 0 ? `
                            <div style="margin-top: 1rem; text-align: left;">
                                <strong>Bagian yang perlu diperbaiki:</strong>
                                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                                    ${statusKeamanan.kontrolTidakAman.map(k => `<li>${k}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        ${statusKeamanan.saranPerbaikan && statusKeamanan.saranPerbaikan.length > 0 ? `
                            <div style="margin-top: 1rem; text-align: left;">
                                <strong>Saran perbaikan:</strong>
                                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                                    ${statusKeamanan.saranPerbaikan.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            html += `<div class="result-item" style="grid-column: 1 / -1; background: #fff3cd;"><h4>⚠ DATA KONTROL TIDAK TERSEDIA</h4></div>`;
        }
    
        container.innerHTML = html;
    }
    
    function getStatusKeamananPelat(kontrol) {
        if (!kontrol) return { aman: false, detail: 'Data kontrol tidak tersedia', saranPerbaikan: [], kontrolTidakAman: [] };
        const kontrolTidakAman = [];
        const saranPerbaikan = [];
        if (kontrol.lentur) {
            const l = kontrol.lentur;
            if (!l.arahX?.K_aman) { kontrolTidakAman.push('Rasio K arah X melebihi Kmaks'); saranPerbaikan.push('Perbesar tebal pelat atau tingkatkan mutu beton'); }
            if (!l.arahY?.K_aman) { kontrolTidakAman.push('Rasio K arah Y melebihi Kmaks'); saranPerbaikan.push('Perbesar tebal pelat atau tingkatkan mutu beton'); }
            if (!l.arahX?.Md_aman) { kontrolTidakAman.push('Kapasitas lentur arah X tidak mencukupi'); saranPerbaikan.push('Tambahkan tulangan pokok arah X atau perbesar tebal pelat'); }
            if (!l.arahY?.Md_aman) { kontrolTidakAman.push('Kapasitas lentur arah Y tidak mencukupi'); saranPerbaikan.push('Tambahkan tulangan pokok arah Y atau perbesar tebal pelat'); }
            if (!l.arahX?.As_terpasang_aman) { kontrolTidakAman.push('Tulangan terpasang arah X tidak mencukupi'); saranPerbaikan.push('Perkecil jarak tulangan pokok arah X'); }
            if (!l.arahY?.As_terpasang_aman) { kontrolTidakAman.push('Tulangan terpasang arah Y tidak mencukupi'); saranPerbaikan.push('Perkecil jarak tulangan pokok arah Y'); }
        }
        if (kontrol.bagi) {
            const b = kontrol.bagi;
            if (!b.arahX?.As_aman) { kontrolTidakAman.push('Tulangan bagi arah X tidak memenuhi syarat minimum'); saranPerbaikan.push('Perkecil jarak tulangan bagi arah X'); }
            if (!b.arahY?.As_aman) { kontrolTidakAman.push('Tulangan bagi arah Y tidak memenuhi syarat minimum'); saranPerbaikan.push('Perkecil jarak tulangan bagi arah Y'); }
            if (!b.arahX?.As_terpasang_aman) { kontrolTidakAman.push('Tulangan bagi terpasang arah X tidak mencukupi'); saranPerbaikan.push('Perkecil jarak tulangan bagi arah X'); }
            if (!b.arahY?.As_terpasang_aman) { kontrolTidakAman.push('Tulangan bagi terpasang arah Y tidak mencukupi'); saranPerbaikan.push('Perkecil jarak tulangan bagi arah Y'); }
        }
        const aman = kontrolTidakAman.length === 0;
        return { aman, detail: aman ? 'Semua persyaratan keamanan struktur telah terpenuhi' : 'Beberapa persyaratan keamanan struktur belum terpenuhi', saranPerbaikan, kontrolTidakAman };
    }
    
    // ==================== RINGKASAN STEP ====================
    function renderRingkasanPelat(result) {
        const container = document.getElementById('controlContainer');
        if (!container) return;
        const { kontrol, data, rekap, inputData } = result;
        const isAutoMode = inputData?.beban?.mode === 'auto';
        stepNumberGenerator = createStepNumber();
        let html = '';
        if (kontrol && data && rekap) {
            html = `<div class="steps">
                ${renderParameterDasarPelat(data, rekap, isAutoMode)}
                ${renderKontrolLenturPelat(kontrol.lentur, rekap)}
                ${renderKontrolBagiPelat(kontrol.bagi, rekap)}
            </div>`;
        } else {
            html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
        }
        container.innerHTML = html;
    }
    
    function renderParameterDasarPelat(data, rekap, isAutoMode) {
        let html = '';
        if (isAutoMode && rekap.tabel?.tumpuanHuruf) {
            html += renderStepPelat(stepNumberGenerator.next().value, 'Jenis Tumpuan', `Tipe ${rekap.tabel.tumpuanHuruf} (Berdasarkan Tabel PBI 71)`);
        }
        if (isAutoMode && rekap.tabel?.jenisPelat === "dua_arah" && rekap.tabel.Ctx !== undefined) {
            let koefHtml = '';
            if (rekap.tabel.Ctx !== undefined && data.momen?.Mtx !== undefined) koefHtml += `C<sub>tx</sub> = ${rekap.tabel.Ctx.toFixed(1)} → M<sub>tx</sub> = ${data.momen.Mtx.toFixed(3)} kNm/m<br>`;
            if (rekap.tabel.Clx !== undefined && data.momen?.Mlx !== undefined) koefHtml += `C<sub>lx</sub> = ${rekap.tabel.Clx.toFixed(1)} → M<sub>lx</sub> = ${data.momen.Mlx.toFixed(3)} kNm/m<br>`;
            if (rekap.tabel.Cly !== undefined && data.momen?.Mly !== undefined) koefHtml += `C<sub>ly</sub> = ${rekap.tabel.Cly.toFixed(1)} → M<sub>ly</sub> = ${data.momen.Mly.toFixed(3)} kNm/m<br>`;
            if (rekap.tabel.Cty !== undefined && data.momen?.Mty !== undefined) koefHtml += `C<sub>ty</sub> = ${rekap.tabel.Cty.toFixed(1)} → M<sub>ty</sub> = ${data.momen.Mty.toFixed(3)} kNm/m`;
            html += renderStepPelat(stepNumberGenerator.next().value, 'Koefisien dan Momen', koefHtml);
        }
        return html;
    }
    
    function renderKontrolLenturPelat(kontrolLentur, rekap) {
        if (!kontrolLentur) return '';
        let html = '';
        const mdMax = Math.max(kontrolLentur.arahX?.detail?.Md || 0, kontrolLentur.arahY?.detail?.Md || 0);
        if (kontrolLentur.arahX) {
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Rasio K Arah X', `K = ${kontrolLentur.arahX.detail?.K?.toFixed(4)} ≤ K<sub>maks</sub> = ${kontrolLentur.arahX.detail?.Kmaks?.toFixed(4)}`, kontrolLentur.arahX.K_aman);
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Kapasitas Lentur Arah X', `M<sub>d</sub> = ${mdMax.toFixed(3)} kNm/m ≥ M<sub>u</sub> = ${kontrolLentur.arahX.detail?.Mu?.toFixed(3)} kNm/m`, kontrolLentur.arahX.Md_aman);
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Tulangan Pokok Arah X', `A<sub>s,terpasang</sub> = ${kontrolLentur.arahX.detail?.As_terpasang?.toFixed(1)} mm²/m ≥ A<sub>s,dibutuhkan</sub> = ${kontrolLentur.arahX.detail?.As_dibutuhkan?.toFixed(1)} mm²/m`, kontrolLentur.arahX.As_terpasang_aman);
        }
        if (kontrolLentur.arahY) {
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Rasio K Arah Y', `K = ${kontrolLentur.arahY.detail?.K?.toFixed(4)} ≤ K<sub>maks</sub> = ${kontrolLentur.arahY.detail?.Kmaks?.toFixed(4)}`, kontrolLentur.arahY.K_aman);
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Kapasitas Lentur Arah Y', `M<sub>d</sub> = ${mdMax.toFixed(3)} kNm/m ≥ M<sub>u</sub> = ${kontrolLentur.arahY.detail?.Mu?.toFixed(3)} kNm/m`, kontrolLentur.arahY.Md_aman);
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Tulangan Pokok Arah Y', `A<sub>s,terpasang</sub> = ${kontrolLentur.arahY.detail?.As_terpasang?.toFixed(1)} mm²/m ≥ A<sub>s,dibutuhkan</sub> = ${kontrolLentur.arahY.detail?.As_dibutuhkan?.toFixed(1)} mm²/m`, kontrolLentur.arahY.As_terpasang_aman);
        }
        return html;
    }
    
    function renderKontrolBagiPelat(kontrolBagi, rekap) {
        if (!kontrolBagi) return '';
        let html = '';
        if (kontrolBagi.arahX) {
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Tulangan Bagi Arah X', `A<sub>s,terpasang</sub> = ${kontrolBagi.arahX.detail?.As_terpasang?.toFixed(1)} mm²/m ≥ A<sub>s,dibutuhkan</sub> = ${kontrolBagi.arahX.detail?.As_dibutuhkan?.toFixed(1)} mm²/m`, kontrolBagi.arahX.As_terpasang_aman);
        }
        if (kontrolBagi.arahY) {
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Tulangan Bagi Arah Y', `A<sub>s,terpasang</sub> = ${kontrolBagi.arahY.detail?.As_terpasang?.toFixed(1)} mm²/m ≥ A<sub>s,dibutuhkan</sub> = ${kontrolBagi.arahY.detail?.As_dibutuhkan?.toFixed(1)} mm²/m`, kontrolBagi.arahY.As_terpasang_aman);
        }
        return html;
    }
    
    function renderStepPelat(number, desc, formula, aman = null) {
        const statusHtml = aman !== null ? `<div class="step-result">${aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>` : '';
        return `<div class="step-item"><div class="step-number">${number}</div><div class="step-content"><div class="step-desc">${desc}</div><div class="step-body"><div class="step-formula">${formula}</div>${statusHtml}</div></div></div>`;
    }
    
    // ==================== RENDER PENAMPANG PELAT (3 TAMPILAN) ====================
    function renderPenampangPelat(result) {
        // Hapus semua penampang lama terlebih dahulu
        cleanupLegacyPenampang();
        
        // Buat container baru
        const container = document.createElement('div');
        container.className = 'penampang-section';
        container.innerHTML = '<h2>PENAMPANG PELAT</h2><div class="penampang-grid"></div>';
        
        const controlContainer = document.getElementById('controlContainer');
        if (controlContainer && controlContainer.parentNode) {
            controlContainer.parentNode.insertBefore(container, controlContainer.nextSibling);
        } else {
            document.body.appendChild(container);
        }
        
        const grid = container.querySelector('.penampang-grid');
        
        const dimensi = result.inputData?.dimensi || {};
        let lx = parseFloat(dimensi.lx);
        let ly = parseFloat(dimensi.ly);
        let h = parseFloat(dimensi.h);
        window.lastPelatConfig = { lx, ly, h };
        const jenisPelat = result.rekap?.tabel?.jenisPelat || "dua_arah";
        
        const tampilan = [
            { jenis: 'depan', title: 'Tampak Depan', containerId: 'svg-pelat-depan', exportFunc: 'exportCADPelatDepan' },
            { jenis: 'atas', title: 'Tampak Atas', containerId: 'svg-pelat-atas', exportFunc: 'exportCADPelatAtas' },
            { jenis: 'samping', title: 'Tampak Samping', containerId: 'svg-pelat-samping', exportFunc: 'exportCADSampingPelat' }
        ];
        
        tampilan.forEach(t => {
            const card = document.createElement('div');
            card.className = 'penampang-card';
            card.innerHTML = `
                <h3>${t.title}</h3>
                <div id="${t.containerId}" class="svg-container" style="min-height: 250px; background: #fafafa; border-radius: 8px; margin-bottom: 1rem;"></div>
                <div class="cad-actions">
                    <button class="btn secondary" onclick="${t.exportFunc}()">Copy ke CAD (${t.title})</button>
                </div>
            `;
            grid.appendChild(card);
            
            if (typeof window.renderPenampangPelat === 'function') {
                window.renderPenampangPelat({
                    jenis: t.jenis,
                    lx: lx,
                    ly: ly,
                    h: h,
                    jenisPelat: jenisPelat
                }, t.containerId);
            } else {
                console.warn(`Fungsi renderPenampangPelat tidak tersedia untuk ${t.title}`);
                document.getElementById(t.containerId).innerHTML = '<p style="color:red;">Modul render tidak tersedia</p>';
            }
        });
        
        // Pastikan CSS grid responsif
        ensureResponsiveGridStyle();
    }
    
    function ensureResponsiveGridStyle() {
        if (document.getElementById('pelat-grid-style')) return;
        const style = document.createElement('style');
        style.id = 'pelat-grid-style';
        style.textContent = `
            .penampang-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1.5rem;
            }
            @media (max-width: 768px) {
                .penampang-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ==================== UPDATE JUDUL ====================
    function updateReportTitle(result) {
        // Cari elemen judul laporan (beberapa kemungkinan selector)
        let titleElement = document.querySelector('.report-title');
        if (!titleElement) titleElement = document.getElementById('reportTitle');
        if (!titleElement) return;
        
        const mode = result.mode || result.inputData?.mode || 'desain';
        titleElement.textContent = `Laporan Perhitungan Pelat (Mode ${mode === 'desain' ? 'Desain' : 'Evaluasi'})`;
    }
    
    function showError(message) {
        console.error(message);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 4px; z-index: 1000; max-width: 400px;`;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    // Ekspos ke global
    window.renderPelatReport = renderPelatReport;
    console.log("✅ report-pelat.js loaded (final - hanya 3 penampang, judul pelat, tanpa sisa balok)");
})();