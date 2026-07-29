// report-pelat.js - Renderer laporan pelat dengan dispatcher CAD
// Versi: mendukung tiga jenis pelat melalui satu tombol global (Fixed SVG Render & Safe Reorder)

(function() {
    'use strict';
    
    // ==================== DISPATCHER CAD ====================
    window.exportCADPelat = function() {
        const jenisPelat = window.getJenisPelatLengkap ? window.getJenisPelatLengkap() : 'dua_arah';
        
        let cadText = '';
        let label = `CAD Pelat ${jenisPelat}`;
        
        switch (jenisPelat) {
            case 'satu_arah':
                if (typeof window.generateCADPelatSatuArah === 'function') {
                    cadText = window.generateCADPelatSatuArah();
                } else {
                    alert('Modul CAD untuk pelat satu arah tidak tersedia');
                    return;
                }
                break;
            case 'dua_arah':
                if (typeof window.generateCADPelatDuaArah === 'function') {
                    cadText = window.generateCADPelatDuaArah();
                } else {
                    alert('Modul CAD untuk pelat dua arah tidak tersedia');
                    return;
                }
                break;
            case 'kantilever':
                if (typeof window.generateCADPelatKantilever === 'function') {
                    cadText = window.generateCADPelatKantilever();
                } else {
                    alert('Modul CAD untuk pelat kantilever tidak tersedia');
                    return;
                }
                break;
            default:
                alert('Jenis pelat tidak dikenali');
                return;
        }
        
        if (cadText && cadText.trim() !== '') {
            if (typeof window.copyToClipboard === 'function') {
                window.copyToClipboard(cadText, label);
            } else {
                navigator.clipboard.writeText(cadText).then(() => alert(`${label} berhasil disalin ke clipboard!`))
                    .catch(() => alert('Gagal menyalin ke clipboard'));
            }
        } else {
            alert('Gagal menghasilkan kode CAD untuk pelat ' + jenisPelat);
        }
    };
    
    // ==================== RENDER LAPORAN ====================
    function* createStepNumber() {
        let step = 1;
        while (true) yield step++;
    }
    let stepNumberGenerator;
    
    function renderPelatReport(result) {
        try {
            cleanupLegacyPenampang();
            updateReportTitle(result);
            renderInputDataPelat(result.inputData || {});
            
            // 1. Render semua komponen
            renderHasilPerhitunganPelat(result);
            renderRingkasanPelat(result);
            renderEfisiensiTulanganPelat(result);
            renderPenampangPelat(result);
            
            // 2. Susun urutannya dengan metode aman (Safe Reorder)
            safeReorderSections();
            
            console.log("✅ Laporan pelat berhasil di-render");
        } catch (error) {
            console.error('Error rendering pelat report:', error);
            showError(`Error merender laporan pelat: ${error.message}`);
        }
    }

    // FUNGSI PENGURUTAN AMAN
    function safeReorderSections() {
        const controlSec = document.getElementById('controlContainer')?.closest('.section');
        const efisiensiSec = document.getElementById('efisiensi-section-pelat');
        const resultSec = document.getElementById('resultContainer')?.closest('.section');
        const penampangSec = document.querySelector('.penampang-section');

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
        document.querySelectorAll('.penampang-container, .penampang-wrapper, .penampang-tumpuan, .penampang-lapangan').forEach(el => el.remove());
    }
    
    function renderInputDataPelat(inputData) {
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
        </div>`;
        html += `<div class="data-card"><h3>Dimensi</h3>
            <div class="data-row"><span class="data-label">L<sub>y</sub></span><span class="data-value">${inputData.dimensi?.ly || 'N/A'} m</span></div>
            <div class="data-row"><span class="data-label">L<sub>x</sub></span><span class="data-value">${inputData.dimensi?.lx || 'N/A'} m</span></div>
            <div class="data-row"><span class="data-label">h</span><span class="data-value">${inputData.dimensi?.h || 'N/A'} mm</span></div>
            <div class="data-row"><span class="data-label">S<sub>b</sub></span><span class="data-value">${inputData.dimensi?.sb || 'N/A'} mm</span></div>
        </div>`;
        if (inputData.beban) {
            html += `<div class="data-card"><h3>Beban</h3>`;
            if (inputData.beban.mode === "auto") {
                html += `<div class="data-row"><span class="data-label">Jenis Tumpuan</span><span class="data-value">${inputData.beban.auto?.tumpuan_type || 'N/A'}</span></div>
                         <div class="data-row"><span class="data-label">q<sub>u</sub></span><span class="data-value">${inputData.beban.auto?.qu || 'N/A'} kN/m²</span></div>`;
            } else {
                html += `<div class="data-row"><span class="data-label">M<sub>u</sub></span><span class="data-value">${inputData.beban.manual?.mu || 'N/A'} kNm/m</span></div>`;
            }
            html += `</div>`;
        }
        const isEvaluasiMode = inputData.mode === 'evaluasi';
        if (isEvaluasiMode && inputData.tulangan) {
            html += `<div class="data-card"><h3>Tulangan</h3>
                <div class="data-row"><span class="data-label">D</span><span class="data-value">${inputData.tulangan.d || 'N/A'} mm</span></div>
                <div class="data-row"><span class="data-label">D<sub>bagi</sub></span><span class="data-value">${inputData.tulangan.db || 'N/A'} mm</span></div>
                <div class="data-row"><span class="data-label">s</span><span class="data-value">${inputData.tulangan.s || 'N/A'} mm</span></div>
                <div class="data-row"><span class="data-label">s<sub>bagi</sub></span><span class="data-value">${inputData.tulangan.sb || 'N/A'} mm</span></div>
            </div>`;
        }
        const lambda = inputData.lanjutan?.lambda;
        if (lambda && parseFloat(lambda) !== 1) {
            html += `<div class="data-card"><h3>Konstanta</h3><div class="data-row"><span class="data-label">λ</span><span class="data-value">${lambda}</span></div></div>`;
        }
        container.innerHTML = html;
    }
    
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
            html += `<div class="result-item" style="grid-column: 1 / -1;"><h4>Rekap Tulangan</h4>
                ${rekap.formatted.tulangan_pokok_x ? `<p><strong>Tulangan Utama:</strong> ${rekap.formatted.tulangan_pokok_x}</p>` : ''}
                ${rekap.formatted.tulangan_bagi_x ? `<p><strong>Tulangan Bagi:</strong> ${rekap.formatted.tulangan_bagi_x}</p>` : ''}
            </div>`;
        }
        if (kontrol) {
            const statusKeamanan = getStatusKeamananPelat(kontrol);
            html += `<div class="result-item" style="grid-column: 1 / -1; background: ${statusKeamanan.aman ? '#d4edda' : '#f8d7da'} !important;">
                <h4>STATUS KEAMANAN STRUKTUR</h4>
                <div style="text-align: center; padding: 1rem;">
                    <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                        ${statusKeamanan.aman ? '<span class="status-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">✓ STRUKTUR AMAN</span>' : '<span class="status-tidak-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">✗ PERLU PERBAIKAN</span>'}
                    </div>
                    <p style="margin: 0.5rem 0; color: #666;">${statusKeamanan.detail}</p>
                    ${statusKeamanan.kontrolTidakAman && statusKeamanan.kontrolTidakAman.length > 0 ? `<div style="margin-top: 1rem; text-align: left;"><strong>Bagian yang perlu diperbaiki:</strong><ul>${statusKeamanan.kontrolTidakAman.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''}
                    ${statusKeamanan.saranPerbaikan && statusKeamanan.saranPerbaikan.length > 0 ? `<div style="margin-top: 1rem; text-align: left;"><strong>Saran perbaikan:</strong><ul>${statusKeamanan.saranPerbaikan.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
                </div>
            </div>`;
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
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Tulangan Pokok Arah X', `A<sub>s,d</sub> = ${kontrolLentur.arahX.detail?.As_terpasang?.toFixed(1)} mm²/m ≥ A<sub>s,u</sub> = ${kontrolLentur.arahX.detail?.As_dibutuhkan?.toFixed(1)} mm²/m`, kontrolLentur.arahX.As_terpasang_aman);
        }
        if (kontrolLentur.arahY) {
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Rasio K Arah Y', `K = ${kontrolLentur.arahY.detail?.K?.toFixed(4)} ≤ K<sub>maks</sub> = ${kontrolLentur.arahY.detail?.Kmaks?.toFixed(4)}`, kontrolLentur.arahY.K_aman);
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Kapasitas Lentur Arah Y', `M<sub>d</sub> = ${mdMax.toFixed(3)} kNm/m ≥ M<sub>u</sub> = ${kontrolLentur.arahY.detail?.Mu?.toFixed(3)} kNm/m`, kontrolLentur.arahY.Md_aman);
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Tulangan Pokok Arah Y', `A<sub>s,d</sub> = ${kontrolLentur.arahY.detail?.As_terpasang?.toFixed(1)} mm²/m ≥ A<sub>s,u</sub> = ${kontrolLentur.arahY.detail?.As_dibutuhkan?.toFixed(1)} mm²/m`, kontrolLentur.arahY.As_terpasang_aman);
        }
        return html;
    }
    
    function renderKontrolBagiPelat(kontrolBagi, rekap) {
        if (!kontrolBagi) return '';
        let html = '';
        if (kontrolBagi.arahX) {
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Tulangan Bagi Arah X', `A<sub>s,d</sub> = ${kontrolBagi.arahX.detail?.As_terpasang?.toFixed(1)} mm²/m ≥ A<sub>s,u</sub> = ${kontrolBagi.arahX.detail?.As_dibutuhkan?.toFixed(1)} mm²/m`, kontrolBagi.arahX.As_terpasang_aman);
        }
        if (kontrolBagi.arahY) {
            html += renderStepPelat(stepNumberGenerator.next().value, 'Kontrol Tulangan Bagi Arah Y', `A<sub>s,d</sub> = ${kontrolBagi.arahY.detail?.As_terpasang?.toFixed(1)} mm²/m ≥ A<sub>s,u</sub> = ${kontrolBagi.arahY.detail?.As_dibutuhkan?.toFixed(1)} mm²/m`, kontrolBagi.arahY.As_terpasang_aman);
        }
        return html;
    }
    
    function renderStepPelat(number, desc, formula, aman = null) {
        const statusHtml = aman !== null ? `<div class="step-result">${aman ? '<span class="status-aman">✓ AMAN</span>' : '<span class="status-tidak-aman">✗ TIDAK AMAN</span>'}</div>` : '';
        return `<div class="step-item"><div class="step-number">${number}</div><div class="step-content"><div class="step-desc">${desc}</div><div class="step-body"><div class="step-formula">${formula}</div>${statusHtml}</div></div></div>`;
    }

    // ==================== FUNGSI EFISIENSI TULANGAN PELAT ====================
    function renderEfisiensiTulanganPelat(result) {
        let existingSection = document.getElementById('efisiensi-section-pelat');
        if (existingSection) existingSection.remove();

        const section = document.createElement('section');
        section.className = 'section efisiensi-tulangan';
        section.id = 'efisiensi-section-pelat';

        const { kontrol } = result;
        if (!kontrol) return;

        const safeDiv = (num, den) => (den && den > 0) ? (num / den) : 0;

        const getUtama = (arah) => {
            const det = kontrol.lentur?.[arah]?.detail;
            if (!det) return { b: 0, k: 1, e: 0, valid: false };
            
            const b = det.Mu || 0;
            const mdMax = Math.max(kontrol.lentur?.arahX?.detail?.Md || 0, kontrol.lentur?.arahY?.detail?.Md || 0);
            const k = mdMax || 1;
            
            return { b, k, e: safeDiv(b, k) * 100, valid: true, type: 'M', labelArah: arah === 'arahX' ? 'Arah X' : 'Arah Y' };
        };

        const getBagi = (arah) => {
            const det = kontrol.bagi?.[arah]?.detail;
            if (!det) return { b: 0, k: 1, e: 0, valid: false };
            
            const b = det.As_dibutuhkan || 0; 
            const k = det.As_terpasang || 1;  
            
            return { b, k, e: safeDiv(b, k) * 100, valid: true, type: 'As', labelArah: arah === 'arahX' ? 'Arah X' : 'Arah Y' };
        };

        const utamaX = getUtama('arahX');
        const utamaY = getUtama('arahY');
        const bagiX = getBagi('arahX');
        const bagiY = getBagi('arahY');

        function getColorForEfficiency(pct) {
            if (isNaN(pct)) return '#888';
            pct = Math.max(0, Math.min(100, pct));
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
        
        const failedColor = getColorForEfficiency(0);

        const processCardData = (itemsArray) => {
            const validItems = itemsArray.filter(i => i.val.valid);
            if (validItems.length === 0) return { rawAvg: 0, isCardGagal: false, failedNames: [] };
            
            const rawAvg = Math.round(validItems.reduce((acc, curr) => acc + curr.val.e, 0) / validItems.length) || 0;
            let failedNames = [];
            validItems.forEach(item => {
                if(item.val.e > 100) failedNames.push(item.val.labelArah);
            })
            return { rawAvg, isCardGagal: failedNames.length > 0, failedNames };
        };

        const renderCard = (title, items) => {
            const validItems = items.filter(i => i.val.valid);
            if (validItems.length === 0) return '';
            
            const cardData = processCardData(items);
            
            let avgDisplay = `${cardData.rawAvg}%`;
            let col = getColorForEfficiency(cardData.rawAvg);
            let progressWidth = Math.min(100, cardData.rawAvg);

            if (cardData.isCardGagal) {
                avgDisplay = "Gagal";
                col = failedColor;
            }

            const renderSub = (label, val) => {
                const isSubGagal = val.e > 100;
                const eStr = isSubGagal ? "Gagal" : `${val.e.toFixed(1)}%`;
                const cCol = isSubGagal ? failedColor : getColorForEfficiency(val.e);
                
                const isMomen = val.type === 'M';
                const labelB = isMomen ? 'M<sub>u</sub>&nbsp; (Beban)' : 'A<sub>s,u</sub>&nbsp; (Perlu)';
                const labelK = isMomen ? 'M<sub>d</sub>&nbsp; (Kapasitas)' : 'A<sub>s,d</sub>&nbsp; (Desain)';
                const unit = isMomen ? 'kNm/m' : 'mm&sup2;/m';
                const symB = isMomen ? 'M<sub>u</sub>' : 'A<sub>s,u</sub>';
                const symK = isMomen ? 'M<sub>d</sub>' : 'A<sub>s,d</sub>';

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
            
            let infoText = '';
            if (cardData.isCardGagal) {
                let failedText = "";
                const failedNames = cardData.failedNames;
                if (failedNames.length === 1) {
                    failedText = failedNames[0];
                } else if (failedNames.length === 2) {
                    failedText = failedNames[0] + " dan " + failedNames[1];
                } else if (failedNames.length > 2) {
                    failedText = failedNames.slice(0, -1).join(', ') + ", dan " + failedNames[failedNames.length - 1];
                }
                infoText = `Nilai efisiensi <strong>${failedText}</strong> melebihi batas kapasitas desain (> 100%), sehingga struktur dinyatakan gagal karna struktur tidak mampu menahan beban.`;
            } else {
                 infoText = `Nilai&nbsp;<strong>${cardData.rawAvg}%</strong> merupakan hasil rata-rata tingkat efisiensi untuk ${title.toLowerCase()}.`;
            }

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
        cardsHtml += renderCard('Tulangan Utama', [
            { label: 'Arah X', val: utamaX },
            { label: 'Arah Y', val: utamaY }
        ]);
        cardsHtml += renderCard('Tulangan Bagi', [
            { label: 'Arah X', val: bagiX },
            { label: 'Arah Y', val: bagiY }
        ]);

        if (!cardsHtml) return;

        section.innerHTML = `
            <h2>EFISIENSI TULANGAN</h2>
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

        document.body.appendChild(section); 
    }
    
    function splitScale(scaleStr) {
        const parts = scaleStr.split(':');
        if (parts.length >= 2) {
            const firstPart = parts[0].trim() + ' :';
            const secondPart = parts.slice(1).join(':').trim();
            return [firstPart, secondPart];
        }
        return [scaleStr, ''];
    }
    
    function renderPenampangPelat(result) {
        cleanupLegacyPenampang();
        
        const container = document.createElement('div');
        container.className = 'penampang-section section'; 
        
        // Buat struktur utama penampang termasuk tombol global CAD di tengah bawah card SVG
        container.innerHTML = `
            <h2>PENAMPANG PELAT</h2>
            <div class="penampang-grid"></div>
            <div class="cad-global-action" style="display: flex; justify-content: center; margin-top: 1.5rem;">
                <button class="btn secondary" onclick="window.exportCADPelat()">Copy ke CAD</button>
            </div>
        `;
        
        document.body.appendChild(container);
        
        const grid = container.querySelector('.penampang-grid');
        const dimensi = result.inputData?.dimensi || {};
        let lx = parseFloat(dimensi.lx);
        let ly = parseFloat(dimensi.ly);
        let h = parseFloat(dimensi.h);
        window.lastPelatConfig = { lx, ly, h };
        const jenisPelat = result.rekap?.tabel?.jenisPelat || "dua_arah";
        
        const tampilan = [
            { jenis: 'depan', title: 'Tampak Depan', containerId: 'svg-pelat-depan' },
            { jenis: 'atas', title: 'Tampak Atas', containerId: 'svg-pelat-atas' },
            { jenis: 'samping', title: 'Tampak Samping', containerId: 'svg-pelat-samping' }
        ];
        
        tampilan.forEach(t => {
            const card = document.createElement('div');
            card.className = 'penampang-card';
            // Tombol Copy ke CAD di dalam card individu sudah dihapus
            card.innerHTML = `
                <h3>${t.title}</h3>
                <div id="${t.containerId}" class="svg-container" style="min-height: 250px; background: #fafafa; border-radius: 8px; margin-bottom: 0.5rem;"></div>
                <div class="penampang-footer" style="display: flex; justify-content: space-between; align-items: flex-start; margin: 0.5rem 0 0.75rem 0;">
                    <div class="legend" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; font-size: 0.9rem; color: #000000;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="display: inline-block; width: 12px; height: 12px; background-color: #000000; border-radius: 50%;"></span>
                            <span>Tulangan Utama</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="display: inline-block; width: 12px; height: 12px; background-color: #ff0000; border-radius: 50%;"></span>
                            <span>Tulangan Bagi</span>
                        </div>
                    </div>
                    <div class="scale-info"></div>
                </div>
                <div class="penampang-disclaimer">
                    *Penampang ini hanya ilustrasi dan tidak 100% sesuai dengan CAD
                </div>
            `;
            grid.appendChild(card);
            
            if (typeof window.renderPenampangPelat === 'function') {
                const renderResult = window.renderPenampangPelat({
                    jenis: t.jenis,
                    lx: lx,
                    ly: ly,
                    h: h,
                    jenisPelat: jenisPelat
                }, t.containerId);
                
                const scaleDiv = card.querySelector('.scale-info');
                let skalaH = '1 : 1';
                let skalaV = '1 : 1';
                
                if (renderResult && renderResult.scaleInfo) {
                    const si = renderResult.scaleInfo;
                    const formatScale = (val) => {
                        if (Math.abs(val - Math.round(val)) < 1e-6) return Math.round(val).toString();
                        return val.toFixed(1);
                    };
                    if (si.needScaleNote) {
                        skalaH = `1 : ${formatScale(1 / si.skala_horizontal)}`;
                        skalaV = `1 : ${formatScale(1 / si.skala_vertikal)}`;
                    }
                }
                
                const [firstH, secondH] = splitScale(skalaH);
                const [firstV, secondV] = splitScale(skalaV);
                
                scaleDiv.innerHTML = `
                    <span class="scale-label">Skala Horizontal</span>
                    <span class="scale-first">${firstH}</span>
                    <span class="scale-second">${secondH}</span>
                    <span class="scale-label">Skala Vertikal</span>
                    <span class="scale-first">${firstV}</span>
                    <span class="scale-second">${secondV}</span>
                `;
            } else {
                console.warn(`Fungsi renderPenampangPelat tidak tersedia untuk ${t.title}`);
                document.getElementById(t.containerId).innerHTML = '<p style="color:red;">Modul render tidak tersedia</p>';
                const scaleDiv = card.querySelector('.scale-info');
                if (scaleDiv) {
                    scaleDiv.innerHTML = `
                        <span class="scale-label">Skala Horizontal</span>
                        <span class="scale-first">1 :</span>
                        <span class="scale-second">1</span>
                        <span class="scale-label">Skala Vertikal</span>
                        <span class="scale-first">1 :</span>
                        <span class="scale-second">1</span>
                    `;
                }
            }
        });
        
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
            
            .penampang-card .scale-info {
                display: grid;
                grid-template-columns: auto auto 1fr;
                gap: 0.25rem 0.5rem;
                margin-right: 10px;
                font-size: 0.9rem;
            }
            .scale-label, .scale-first, .scale-second {
                text-align: right;
                white-space: nowrap;
            }
            
            .penampang-disclaimer {
                text-align: right;
                font-size: 0.7rem;
                color: #888;
                margin-top: 8px;
                border-top: 1px solid #eee;
                padding-top: 6px;
            }
            
            @media (max-width: 768px) {
                .penampang-grid {
                    grid-template-columns: 1fr;
                }
                .penampang-footer {
                    flex-direction: column-reverse !important;
                    align-items: flex-start !important;
                }
                .penampang-card .scale-info {
                    margin-right: 0 !important;
                    margin-bottom: 0 !important;
                    justify-self: start;
                    font-size: 0.9rem;
                }
                .scale-label, .scale-first, .scale-second {
                    text-align: left !important;
                }
                .penampang-card .legend {
                    margin-top: 0 !important;
                    padding-top: 0 !important;
                }
                .penampang-disclaimer {
                    text-align: right;
                    font-size: 0.65rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    function updateReportTitle(result) {
        const titleElement = document.getElementById('reportModuleName');
        if (!titleElement) {
            const fallback = document.querySelector('.main-sub');
            if (fallback) {
                const mode = result.mode || result.inputData?.mode || 'desain';
                const modeText = mode === 'desain' ? 'DESAIN' : 'EVALUASI';
                fallback.textContent = `PELAT - ${modeText}`;
            }
            return;
        }
        const mode = result.mode || result.inputData?.mode || 'desain';
        const modeText = mode === 'desain' ? 'DESAIN' : 'EVALUASI';
        titleElement.textContent = `PELAT - ${modeText}`;
    }
    
    function showError(message) {
        console.error(message);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 4px; z-index: 1000; max-width: 400px;`;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    window.renderPelatReport = renderPelatReport;
    console.log("✅ report-pelat.js loaded (dengan Safe Reorder dan Efisiensi Mu/Md ter-fix)");
})();