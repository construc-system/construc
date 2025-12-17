// report-pelat.js - Renderer khusus untuk laporan pelat
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
    function renderPelatReport(result) {
        try {
            updateReportTitle(result);
            renderInputDataPelat(result.inputData || {});
            renderHasilPerhitunganPelat(result);
            renderRingkasanPelat(result);
            renderPenampangPelat(result);
            
            console.log("✅ Laporan pelat berhasil di-render");
        } catch (error) {
            console.error('Error rendering pelat report:', error);
            showError(`Error merender laporan pelat: ${error.message}`);
        }
    }
    
    // ==================== FUNGSI RENDER ====================
    function renderInputDataPelat(inputData) {
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
    
        // DATA BEBAN - 2 baris layout
        if (inputData.beban) {
            html += `
                <div class="data-card">
                    <h3>Beban</h3>
            `;
            
            if (inputData.beban.mode === "auto") {
                html += `
                    <div class="data-row">
                        <span class="data-label">Jenis Tumpuan</span>
                        <span class="data-value">${inputData.beban.auto?.tumpuan_type || 'N/A'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">q<sub>u</sub></span>
                        <span class="data-value">${inputData.beban.auto?.qu || 'N/A'} kN/m²</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="data-row">
                        <span class="data-label">M<sub>u</sub></span>
                        <span class="data-value">${inputData.beban.manual?.mu || 'N/A'} kNm/m</span>
                    </div>
                `;
            }
            
            html += `</div>`;
        }
    
        // DATA TULANGAN (hanya untuk mode evaluasi)
        const isEvaluasiMode = inputData.mode === 'evaluasi';
        
        if (isEvaluasiMode && inputData.tulangan) {
            html += `
                <div class="data-card">
                    <h3>Tulangan</h3>
                    <div class="data-row">
                        <span class="data-label">D</span>
                        <span class="data-value">${inputData.tulangan.d || 'N/A'} mm</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">D<sub>bagi</sub></span>
                        <span class="data-value">${inputData.tulangan.db || 'N/A'} mm</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">s</span>
                        <span class="data-value">${inputData.tulangan.s || 'N/A'} mm</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">s<sub>bagi</sub></span>
                        <span class="data-value">${inputData.tulangan.sb || 'N/A'} mm</span>
                    </div>
                </div>
            `;
        }
    
        // DATA LANJUTAN - hanya tampilkan jika tidak default
        const lambda = inputData.lanjutan?.lambda;
        
        // Tampilkan lambda hanya jika tidak sama dengan 1
        if (lambda && parseFloat(lambda) !== 1) {
            html += `
                <div class="data-card">
                    <h3>Konstanta</h3>
                    <div class="data-row">
                        <span class="data-label">λ</span>
                        <span class="data-value">${lambda}</span>
                    </div>
                </div>
            `;
        }
    
        container.innerHTML = html;
    }
    
    function renderHasilPerhitunganPelat(result) {
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
    
        const { rekap, kontrol } = result;
        console.log("📊 Data rekap untuk hasil:", rekap);
        console.log("📊 Data kontrol untuk hasil:", kontrol);
    
        let html = '';
    
        // REKAP TULANGAN - format sederhana untuk pelat
        if (rekap.formatted) {
            html += `
                <div class="result-item" style="grid-column: 1 / -1;">
                    <h4>Rekap Tulangan</h4>
                    ${rekap.formatted.tulangan_pokok_x ? `<p><strong>Tulangan Utama:</strong> ${rekap.formatted.tulangan_pokok_x}</p>` : ''}
                    ${rekap.formatted.tulangan_bagi_x ? `<p><strong>Tulangan Bagi:</strong> ${rekap.formatted.tulangan_bagi_x}</p>` : ''}
                </div>
            `;
        }
    
        // KESIMPULAN KEAMANAN - hanya jika kontrol tersedia
        if (kontrol) {
            const statusKeamanan = getStatusKeamananPelat(kontrol);
            console.log("Status Keamanan Pelat:", statusKeamanan);
    
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
    
    // Fungsi untuk mendapatkan status keamanan struktur pelat
    function getStatusKeamananPelat(kontrol) {
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
        if (kontrol.lentur) {
            const lentur = kontrol.lentur;
            
            if (!lentur.arahX.K_aman) {
                kontrolTidakAman.push('Rasio K arah X melebihi Kmaks');
                saranPerbaikan.push('Perbesar tebal pelat atau tingkatkan mutu beton');
            }
            
            if (!lentur.arahY.K_aman) {
                kontrolTidakAman.push('Rasio K arah Y melebihi Kmaks');
                saranPerbaikan.push('Perbesar tebal pelat atau tingkatkan mutu beton');
            }
            
            if (!lentur.arahX.Md_aman) {
                kontrolTidakAman.push('Kapasitas lentur arah X tidak mencukupi');
                saranPerbaikan.push('Tambahkan tulangan pokok arah X atau perbesar tebal pelat');
            }
            
            if (!lentur.arahY.Md_aman) {
                kontrolTidakAman.push('Kapasitas lentur arah Y tidak mencukupi');
                saranPerbaikan.push('Tambahkan tulangan pokok arah Y atau perbesar tebal pelat');
            }
            
            if (!lentur.arahX.As_terpasang_aman) {
                kontrolTidakAman.push('Tulangan terpasang arah X tidak mencukupi');
                saranPerbaikan.push('Perkecil jarak tulangan pokok arah X');
            }
            
            if (!lentur.arahY.As_terpasang_aman) {
                kontrolTidakAman.push('Tulangan terpasang arah Y tidak mencukupi');
                saranPerbaikan.push('Perkecil jarak tulangan pokok arah Y');
            }
        }
    
        // Cek kontrol tulangan bagi
        if (kontrol.bagi) {
            const bagi = kontrol.bagi;
            
            if (!bagi.arahX.As_aman) {
                kontrolTidakAman.push('Tulangan bagi arah X tidak memenuhi syarat minimum');
                saranPerbaikan.push('Perkecil jarak tulangan bagi arah X');
            }
            
            if (!bagi.arahY.As_aman) {
                kontrolTidakAman.push('Tulangan bagi arah Y tidak memenuhi syarat minimum');
                saranPerbaikan.push('Perkecil jarak tulangan bagi arah Y');
            }
            
            if (!bagi.arahX.As_terpasang_aman) {
                kontrolTidakAman.push('Tulangan bagi terpasang arah X tidak mencukupi');
                saranPerbaikan.push('Perkecil jarak tulangan bagi arah X');
            }
            
            if (!bagi.arahY.As_terpasang_aman) {
                kontrolTidakAman.push('Tulangan bagi terpasang arah Y tidak mencukupi');
                saranPerbaikan.push('Perkecil jarak tulangan bagi arah Y');
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
    
    function renderRingkasanPelat(result) {
        const container = document.getElementById('controlContainer');
        
        if (!container) {
            console.error("Element #controlContainer tidak ditemukan");
            return;
        }
        
        const { kontrol, data, rekap, inputData } = result;
        const isAutoMode = inputData?.beban?.mode === 'auto';
        
        console.log("📋 Data kontrol detail pelat:", kontrol);
        console.log("📋 Data hasil perhitungan pelat:", data);
        console.log("📋 Data rekap pelat:", rekap);
    
        let html = '';
    
        // Reset step number generator (LOKAL)
        stepNumberGenerator = createStepNumber();
    
        if (kontrol && data && rekap) {
            html = `
                <div class="steps">
                    ${renderParameterDasarPelat(data, rekap, isAutoMode)}
                    ${renderKontrolLenturPelat(kontrol.lentur, rekap)}
                    ${renderKontrolBagiPelat(kontrol.bagi, rekap)}
                </div>
            `;
        } else {
            html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
        }
    
        container.innerHTML = html;
    }
    
    function renderParameterDasarPelat(data, rekap, isAutoMode) {
        let html = '';
        
        // Untuk mode auto, tampilkan jenis tumpuan dengan keterangan PBI
        if (isAutoMode && rekap.tabel && rekap.tabel.tumpuanHuruf) {
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Jenis Tumpuan',
                `Tipe ${rekap.tabel.tumpuanHuruf} (Berdasarkan Tabel PBI 71)`
            );
        }
        
        // Untuk mode auto, tampilkan koefisien momen dengan format baru
        if (isAutoMode && rekap.tabel && rekap.tabel.jenisPelat === "dua_arah" && rekap.tabel.Ctx !== undefined) {
            let koefisienHtml = '';
            
            // Format koefisien dengan momen bersusun ke bawah
            if (rekap.tabel.Ctx !== undefined && data.momen && data.momen.Mtx !== undefined) {
                koefisienHtml += `C<sub>tx</sub> = ${rekap.tabel.Ctx.toFixed(1)} &nbsp; → &nbsp; M<sub>tx</sub> = ${data.momen.Mtx.toFixed(3)} kNm/m<br>`;
            }
            if (rekap.tabel.Clx !== undefined && data.momen && data.momen.Mlx !== undefined) {
                koefisienHtml += `C<sub>lx</sub> = ${rekap.tabel.Clx.toFixed(1)} &nbsp; → &nbsp; M<sub>lx</sub> = ${data.momen.Mlx.toFixed(3)} kNm/m<br>`;
            }
            if (rekap.tabel.Cly !== undefined && data.momen && data.momen.Mly !== undefined) {
                koefisienHtml += `C<sub>ly</sub> = ${rekap.tabel.Cly.toFixed(1)} &nbsp; → &nbsp; M<sub>ly</sub> = ${data.momen.Mly.toFixed(3)} kNm/m<br>`;
            }
            if (rekap.tabel.Cty !== undefined && data.momen && data.momen.Mty !== undefined) {
                koefisienHtml += `C<sub>ty</sub> = ${rekap.tabel.Cty.toFixed(1)} &nbsp; → &nbsp; M<sub>ty</sub> = ${data.momen.Mty.toFixed(3)} kNm/m`;
            }
            
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Koefisien dan Momen',
                koefisienHtml
            );
        }
        
        return html;
    }
    
    function renderKontrolLenturPelat(kontrolLentur, rekap) {
        if (!kontrolLentur) return '';
        
        let html = '';
        
        // Hitung nilai Md maksimum dari kedua arah
        const mdMaxX = Math.max(
            kontrolLentur.arahX?.detail?.Md || 0,
            kontrolLentur.arahY?.detail?.Md || 0
        );
        
        const mdMaxY = mdMaxX; // Gunakan nilai yang sama untuk kedua arah
        
        // Kontrol untuk arah X
        if (kontrolLentur.arahX) {
            // Kontrol K ≤ Kmaks
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Kontrol Rasio K Arah X',
                `K = ${kontrolLentur.arahX.detail?.K?.toFixed(4) || 'N/A'} ≤ K<sub>maks</sub> = ${kontrolLentur.arahX.detail?.Kmaks?.toFixed(4) || 'N/A'}`,
                kontrolLentur.arahX.K_aman
            );
            
            // Kontrol Md ≥ Mu - gunakan Md maksimum
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Kontrol Kapasitas Lentur Arah X',
                `M<sub>d</sub> = ${mdMaxX.toFixed(3)} kNm/m ≥ M<sub>u</sub> = ${kontrolLentur.arahX.detail?.Mu?.toFixed(3) || 'N/A'} kNm/m`,
                kontrolLentur.arahX.Md_aman
            );
            
            // Kontrol As terpasang
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Kontrol Tulangan Pokok Arah X',
                `A<sub>s,terpasang</sub> = ${kontrolLentur.arahX.detail?.As_terpasang?.toFixed(1) || 'N/A'} mm²/m ≥ A<sub>s,dibutuhkan</sub> = ${kontrolLentur.arahX.detail?.As_dibutuhkan?.toFixed(1) || 'N/A'} mm²/m`,
                kontrolLentur.arahX.As_terpasang_aman
            );
        }
        
        // Kontrol untuk arah Y
        if (kontrolLentur.arahY) {
            // Kontrol K ≤ Kmaks
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Kontrol Rasio K Arah Y',
                `K = ${kontrolLentur.arahY.detail?.K?.toFixed(4) || 'N/A'} ≤ K<sub>maks</sub> = ${kontrolLentur.arahY.detail?.Kmaks?.toFixed(4) || 'N/A'}`,
                kontrolLentur.arahY.K_aman
            );
            
            // Kontrol Md ≥ Mu - gunakan Md maksimum
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Kontrol Kapasitas Lentur Arah Y',
                `M<sub>d</sub> = ${mdMaxY.toFixed(3)} kNm/m ≥ M<sub>u</sub> = ${kontrolLentur.arahY.detail?.Mu?.toFixed(3) || 'N/A'} kNm/m`,
                kontrolLentur.arahY.Md_aman
            );
            
            // Kontrol As terpasang
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Kontrol Tulangan Pokok Arah Y',
                `A<sub>s,terpasang</sub> = ${kontrolLentur.arahY.detail?.As_terpasang?.toFixed(1) || 'N/A'} mm²/m ≥ A<sub>s,dibutuhkan</sub> = ${kontrolLentur.arahY.detail?.As_dibutuhkan?.toFixed(1) || 'N/A'} mm²/m`,
                kontrolLentur.arahY.As_terpasang_aman
            );
        }
        
        return html;
    }
    
    function renderKontrolBagiPelat(kontrolBagi, rekap) {
        if (!kontrolBagi) return '';
        
        let html = '';
        
        // Kontrol untuk arah X
        if (kontrolBagi.arahX) {
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Kontrol Tulangan Bagi Arah X',
                `A<sub>s,terpasang</sub> = ${kontrolBagi.arahX.detail?.As_terpasang?.toFixed(1) || 'N/A'} mm²/m ≥ A<sub>s,dibutuhkan</sub> = ${kontrolBagi.arahX.detail?.As_dibutuhkan?.toFixed(1) || 'N/A'} mm²/m`,
                kontrolBagi.arahX.As_terpasang_aman
            );
        }
        
        // Kontrol untuk arah Y
        if (kontrolBagi.arahY) {
            html += renderStepPelat(
                stepNumberGenerator.next().value,
                'Kontrol Tulangan Bagi Arah Y',
                `A<sub>s,terpasang</sub> = ${kontrolBagi.arahY.detail?.As_terpasang?.toFixed(1) || 'N/A'} mm²/m ≥ A<sub>s,dibutuhkan</sub> = ${kontrolBagi.arahY.detail?.As_dibutuhkan?.toFixed(1) || 'N/A'} mm²/m`,
                kontrolBagi.arahY.As_terpasang_aman
            );
        }
        
        return html;
    }
    
    // Helper function untuk render step pelat
    function renderStepPelat(number, desc, formula, aman = null) {
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
    
    // FUNGSI: Render Penampang Pelat (Dual View - Tampak Depan & Tampak Atas)
    function renderPenampangPelat(result) {
        const container = document.querySelector('.penampang-section');
        if (!container) {
            console.error("Element .penampang-section tidak ditemukan");
            return;
        }
    
        // Update judul section
        const title = container.querySelector('h2');
        if (title) {
            title.textContent = 'PENAMPANG PELAT';
        }
    
        // Update judul card
        const cards = container.querySelectorAll('.penampang-card h3');
        if (cards[0]) cards[0].textContent = 'Tampak Depan';
        if (cards[1]) cards[1].textContent = 'Tampak Atas';
    
        // Update tombol CAD
        const cadButton = container.querySelector('.btn.primary[onclick="exportCAD()"]');
        if (cadButton) {
            cadButton.textContent = 'Copy ke CAD (Tampak Depan)';
            // Update onclick untuk pelat
            cadButton.setAttribute('onclick', 'exportCADPelat()');
        }
    
        // Render kedua tampilan
        renderSinglePenampangPelat(result, 'depan', 'svg-container-tumpuan');
        renderSinglePenampangPelat(result, 'atas', 'svg-container-lapangan');
    }
    
    function renderSinglePenampangPelat(result, jenis, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Element #${containerId} tidak ditemukan`);
            return;
        }
    
        const { data, inputData, rekap } = result;
        
        if (!data || !inputData || !rekap) {
            console.error("Data tidak lengkap untuk render penampang pelat");
            container.innerHTML = '<p style="text-align: center; color: #888;">Data penampang tidak tersedia</p>';
            return;
        }
    
        try {
            // Ambil data dimensi
            const dimensi = inputData.dimensi || {};
            const ly = parseFloat(dimensi.ly) || 4000;
            const lx = parseFloat(dimensi.lx) || 3000;
            const h = parseFloat(dimensi.h) || 120;
            const sb = parseFloat(dimensi.sb) || 20;
    
            // Ambil data tulangan
            const tulangan = inputData.tulangan || {};
            const D = parseFloat(tulangan.d) || 10;
            const Db = parseFloat(tulangan.db) || 8;
            const s_pokok = parseFloat(tulangan.s) || 200;
            const s_bagi = parseFloat(tulangan.sb) || 250;
    
            // Ambil informasi dari rekap
            const jenisPelat = rekap.tabel?.jenisPelat || "dua_arah";
    
            console.log(`📐 Data untuk penampang pelat ${jenis}:`, {
                ly, lx, h, D, Db, s_pokok, s_bagi, sb, jenisPelat
            });
    
            // Tampilkan loading terlebih dahulu
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #666;">
                    <p>Memuat gambar ${jenis}...</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">
                        ${jenisPelat === "satu_arah" ? "Pelat Satu Arah" : "Pelat Dua Arah"}<br>
                        Pokok: D${D}-${s_pokok}, Bagi: D${Db}-${s_bagi}
                    </p>
                </div>
            `;
    
            // Panggil fungsi render dari cut-generator dengan parameter untuk pelat
            if (typeof window.renderPenampangPelat === 'function') {
                window.renderPenampangPelat({
                    ly: ly,
                    lx: lx,
                    h: h,
                    D_pokok: D,
                    D_bagi: Db,
                    s_pokok: s_pokok,
                    s_bagi: s_bagi,
                    selimut: sb,
                    jenis: jenis,
                    jenisPelat: jenisPelat
                }, containerId);
                
            } else {
                console.warn("Fungsi renderPenampangPelat belum tersedia di cut-generator");
                container.innerHTML = `
                    <div style="text-align: center; padding: 1rem; color: #dc3545;">
                        <p>Gagal memuat gambar</p>
                        <p style="font-size: 0.8rem;">Modul tidak tersedia</p>
                    </div>
                `;
            }
    
        } catch (error) {
            console.error(`Error rendering penampang pelat ${jenis}:`, error);
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #dc3545;">
                    <p>Error memuat gambar</p>
                    <p style="font-size: 0.8rem;">${error.message}</p>
                </div>
            `;
        }
    }
    
    // Fungsi utilitas tambahan
    function showError(message) {
        console.error(message);
        // Anda bisa menambahkan notifikasi UI di sini jika diperlukan
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
    
    // ==================== EKSPOS KE GLOBAL ====================
    // Ekspos hanya fungsi yang diperlukan
    window.renderPelatReport = renderPelatReport;
    window.exportCADPelat = exportCADPelat;
    
    console.log("✅ report-pelat.js loaded successfully (IIFE Protected)");
    
})(); // END IIFE