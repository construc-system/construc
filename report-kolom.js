// report-kolom.js - Renderer khusus untuk laporan kolom

// Generator untuk step number - dibuat sebagai fungsi factory
function createStepNumberGenerator() {
    let step = 1;
    return function() {
        return step++;
    };
}

function renderKolomReport(result) {
    try {
        updateReportTitle(result);
        renderInputDataKolom(result.inputData || {});
        renderHasilPerhitunganKolom(result);
        renderRingkasanKolom(result);
        renderPenampangKolom(result);
        
        // PERBAIKAN: Panggil update layout untuk kolom
        updateLayoutForKolom();
        
        console.log("✅ Laporan kolom berhasil di-render");
    } catch (error) {
        console.error('Error rendering kolom report:', error);
        showError(`Error merender laporan kolom: ${error.message}`);
    }
}

function renderInputDataKolom(inputData) {
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

    // DATA BEBAN - lebih sederhana dari balok
    if (inputData.beban) {
        html += `
            <div class="data-card">
                <h3>Beban</h3>
        `;
        
        if (inputData.beban.pu !== undefined && inputData.beban.pu !== null) {
            html += `<div class="data-row"><span class="data-label">P<sub>u</sub></span><span class="data-value">${inputData.beban.pu} kN</span></div>`;
        }
        if (inputData.beban.mu !== undefined && inputData.beban.mu !== null) {
            html += `<div class="data-row"><span class="data-label">M<sub>u</sub></span><span class="data-value">${inputData.beban.mu} kNm</span></div>`;
        }
        if (inputData.beban.vu !== undefined && inputData.beban.vu !== null) {
            html += `<div class="data-row"><span class="data-label">V<sub>u</sub></span><span class="data-value">${inputData.beban.vu} kN</span></div>`;
        }
        
        html += `</div>`;
    }

    // DATA TULANGAN (hanya untuk mode evaluasi)
    const isEvaluasiMode = inputData.mode === 'evaluasi';
    
    if (isEvaluasiMode && inputData.tulangan) {
        console.log("🔍 Data tulangan untuk evaluasi:", inputData.tulangan);
        
        html += `
            <div class="data-card">
                <h3>Tulangan</h3>
        `;
        
        if (inputData.tulangan.d_tul || inputData.tulangan.d) {
            html += `
                <div class="data-row">
                    <span class="data-label">D</span>
                    <span class="data-value">${inputData.tulangan.d_tul || inputData.tulangan.d} mm</span>
                </div>
            `;
        }
        
        if (inputData.tulangan.phi_tul || inputData.tulangan.phi) {
            html += `
                <div class="data-row">
                    <span class="data-label">ɸ</span>
                    <span class="data-value">${inputData.tulangan.phi_tul || inputData.tulangan.phi} mm</span>
                </div>
            `;
        }
        
        if (inputData.tulangan.n_tul || inputData.tulangan.n) {
            html += `
                <div class="data-row">
                    <span class="data-label">n</span>
                    <span class="data-value">${inputData.tulangan.n_tul || inputData.tulangan.n}</span>
                </div>
            `;
        }
        
        if (inputData.tulangan.s_tul || inputData.tulangan.s) {
            html += `
                <div class="data-row">
                    <span class="data-label">s</span>
                    <span class="data-value">${inputData.tulangan.s_tul || inputData.tulangan.s} mm</span>
                </div>
            `;
        }
        
        html += `</div>`;
    }

    // DATA LANJUTAN - hanya tampilkan jika tidak default
    const lambda = inputData.lanjutan?.lambda;
    const n_kaki = inputData.lanjutan?.n_kaki;
    const n_val = inputData.lanjutan?.n_val;
    
    // PERBAIKAN: Cek jika nilai tidak default - sembunyikan jika lambda=1 DAN n=2
    const showLambda = lambda !== undefined && lambda !== null && parseFloat(lambda) !== 1;
    const showN = (n_kaki !== undefined && n_kaki !== null && parseFloat(n_kaki) !== 2) || 
                 (n_val !== undefined && n_val !== null && parseFloat(n_val) !== 2);
    
    console.log("🔍 Data konstanta:", { lambda, n_kaki, n_val, showLambda, showN });
    
    if (showLambda || showN) {
        html += `
            <div class="data-card">
                <h3>Konstanta</h3>
        `;
        
        if (showLambda) {
            html += `
                <div class="data-row">
                    <span class="data-label">λ</span>
                    <span class="data-value">${lambda}</span>
                </div>
            `;
        }
        
        if (showN) {
            const nValue = n_kaki || n_val;
            html += `
                <div class="data-row">
                    <span class="data-label">n (kaki begel)</span>
                    <span class="data-value">${nValue}</span>
                </div>
            `;
        }
        
        html += `</div>`;
    }

    container.innerHTML = html;
}

function renderHasilPerhitunganKolom(result) {
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

    // REKAP TULANGAN - untuk kolom lebih sederhana (HANYA tulangan utama dan begel)
    if (rekap.formatted) {
        html += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h4>Rekap Tulangan</h4>
                ${rekap.formatted.tulangan_utama ? `<p><strong>Tulangan Utama:</strong> ${rekap.formatted.tulangan_utama}</p>` : ''}
                ${rekap.formatted.begel ? `<p><strong>Begel:</strong> ${rekap.formatted.begel}</p>` : ''}
            </div>
        `;
    }

    // KESIMPULAN KEAMANAN - hanya jika kontrol tersedia
    if (kontrol) {
        const statusKeamanan = getStatusKeamananKolom(kontrol);
        console.log("Status Keamanan Kolom:", statusKeamanan);

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

// Fungsi untuk mendapatkan status keamanan struktur kolom
function getStatusKeamananKolom(kontrol) {
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
        
        if (!lentur.Ast_ok) {
            kontrolTidakAman.push('Luas tulangan terpasang tidak mencukupi');
            saranPerbaikan.push('Tambahkan jumlah tulangan utama');
        }
        
        if (!lentur.rho_ok) {
            kontrolTidakAman.push('Rasio tulangan tidak memenuhi syarat (min 1%)');
            saranPerbaikan.push('Tambahkan jumlah tulangan untuk mencapai rasio minimum 1%');
        }
        
        if (!lentur.n_ok) {
            kontrolTidakAman.push('Jumlah tulangan melebihi kapasitas penampang');
            saranPerbaikan.push('Kurangi jumlah tulangan atau perbesar dimensi kolom');
        }
        
        // TAMBAHAN: Kontrol K ≤ Kmaks
        if (!lentur.K_ok) {
            kontrolTidakAman.push('Rasio K melebihi Kmaks');
            saranPerbaikan.push('Perbesar dimensi kolom atau tingkatkan mutu beton');
        }
    }

    // Cek kontrol geser
    if (kontrol.geser) {
        const geser = kontrol.geser;
        
        if (!geser.Vs_ok) {
            kontrolTidakAman.push('Tegangan geser melebihi kapasitas');
            saranPerbaikan.push('Perbesar dimensi kolom atau tingkatkan mutu beton');
        }
        
        if (!geser.Av_ok) {
            kontrolTidakAman.push('Tulangan geser tidak mencukupi');
            saranPerbaikan.push('Tambahkan tulangan geser (perkecil jarak sengkang)');
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

function renderRingkasanKolom(result) {
    const container = document.getElementById('controlContainer');
    
    if (!container) {
        console.error("Element #controlContainer tidak ditemukan");
        return;
    }
    
    const { kontrol, data, rekap } = result;
    console.log("📋 Data kontrol detail kolom:", kontrol);
    console.log("📋 Data hasil perhitungan kolom:", data);
    console.log("📋 Data rekap kolom:", rekap);

    let html = '';

    // Buat generator step number lokal untuk fungsi ini
    const getStepNumber = createStepNumberGenerator();

    if (kontrol && data && rekap) {
        html = `
            <div class="steps">
                ${renderParameterDasarKolom(data, rekap, getStepNumber)}
                ${renderKontrolLenturKolom(kontrol.lentur, rekap, getStepNumber)}
                ${renderKontrolGeserKolom(kontrol.geser, rekap, getStepNumber)}
            </div>
        `;
    } else {
        html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
    }

    container.innerHTML = html;
}

function renderParameterDasarKolom(data, rekap, getStepNumber) {
    let html = '';
    const tulangan = rekap.tulangan || {};
    
    console.log("🔍 Data tulangan untuk parameter:", tulangan);
    
    // PERBANDINGAN Pu dan Pu∅ - TANPA INDIKATOR AMAN/TIDAK AMAN
    if (tulangan.Pu !== undefined && tulangan.Pu_phi !== undefined) {
        const simbol = tulangan.Pu >= tulangan.Pu_phi ? '≥' : '<';
        html += renderStepKolom(
            getStepNumber(),
            'Perbandingan Pu dan Pu∅',
            `P<sub>u</sub> = ${tulangan.Pu?.toFixed(2) || 'N/A'} kN ${simbol} P<sub>u</sub>∅ = ${tulangan.Pu_phi?.toFixed(2) || 'N/A'} kN`
            // Tidak ada parameter aman - hanya perbandingan nilai
        );
    }
    
    // PERBANDINGAN ab dan ac - HANYA PERBANDINGAN TANPA KONTROL KEAMANAN
    if (tulangan.ab !== undefined && tulangan.ac !== undefined) {
        const simbol = tulangan.ab >= tulangan.ac ? '≥' : '<';
        html += renderStepKolom(
            getStepNumber(),
            'Perbandingan Parameter Teknis',
            `ab = ${tulangan.ab?.toFixed(1) || 'N/A'} mm ${simbol} ac = ${tulangan.ac?.toFixed(1) || 'N/A'} mm`
        );
    }
    
    // Nilai faktor Phi
    if (tulangan.faktorPhi !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            'Faktor Reduksi Kekuatan',
            `∅ = ${tulangan.faktorPhi?.toFixed(3) || 'N/A'}`
        );
    }
    
    // Kondisi yang digunakan
    if (tulangan.kondisiAktif) {
        html += renderStepKolom(
            getStepNumber(),
            'Kondisi Perhitungan yang Digunakan',
            tulangan.kondisiAktif
        );
    }
    
    return html;
}

function renderKontrolLenturKolom(kontrolLentur, rekap, getStepNumber) {
    if (!kontrolLentur) return '';
    
    let html = '';
    const tulangan = rekap.tulangan || {};
    
    // Kontrol K ≤ Kmaks (khusus kondisi at2>ac)
    if (tulangan.K !== undefined && tulangan.Kmaks !== undefined) {
        const amanK = !tulangan.K_melebihi_Kmaks;
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Rasio Tulangan (K)',
            `K = ${tulangan.K?.toFixed(4) || 'N/A'} ≤ K<sub>maks</sub> = ${tulangan.Kmaks?.toFixed(4) || 'N/A'}`,
            amanK
        );
    }
    
    // Kontrol rho ≥ 1%
    if (kontrolLentur.detail && kontrolLentur.detail.rho !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Rasio Tulangan Minimum',
            `ρ = ${kontrolLentur.detail.rho?.toFixed(3) || 'N/A'}% ≥ 1%`,
            kontrolLentur.rho_ok
        );
    }
    
    // Kontrol n ≤ 2m
    if (kontrolLentur.detail && kontrolLentur.detail.n !== undefined && kontrolLentur.detail.n_max !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Jumlah Tulangan',
            `n = ${kontrolLentur.detail.n} ≤ 2m = ${kontrolLentur.detail.n_max}`,
            kontrolLentur.n_ok
        );
    }
    
    // Kontrol kapasitas tulangan
    if (kontrolLentur.detail && kontrolLentur.detail.Ast_i !== undefined && kontrolLentur.detail.Ast_u !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Kapasitas Tulangan',
            `A<sub>s,terpasang</sub> = ${kontrolLentur.detail.Ast_i?.toFixed(0) || 'N/A'} mm² ≥ A<sub>s,diperlukan</sub> = ${kontrolLentur.detail.Ast_u?.toFixed(0) || 'N/A'} mm²`,
            kontrolLentur.Ast_ok
        );
    }
    
    return html;
}

function renderKontrolGeserKolom(kontrolGeser, rekap, getStepNumber) {
    if (!kontrolGeser) return '';
    
    let html = '';
    const begel = rekap.begel || {};
    
    // Kontrol Vs ≤ Vs_maks
    if (kontrolGeser.detail && kontrolGeser.detail.Vs !== undefined && kontrolGeser.detail.Vs_max !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Tegangan Geser',
            `V<sub>s</sub> = ${kontrolGeser.detail.Vs?.toFixed(2) || 'N/A'} kN ≤ V<sub>s,maks</sub> = ${kontrolGeser.detail.Vs_max?.toFixed(2) || 'N/A'} kN`,
            kontrolGeser.Vs_ok
        );
    }
    
    // Kontrol Av_terpakai ≥ Av_u
    if (kontrolGeser.detail && kontrolGeser.detail.Av_terpakai !== undefined && kontrolGeser.detail.Av_u !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Tulangan Geser',
            `A<sub>v,terpasang</sub> = ${kontrolGeser.detail.Av_terpakai?.toFixed(2) || 'N/A'} mm²/m ≥ A<sub>v,diperlukan</sub> = ${kontrolGeser.detail.Av_u?.toFixed(2) || 'N/A'} mm²/m`,
            kontrolGeser.Av_ok
        );
    }
    
    return html;
}

// Helper function untuk render step kolom
function renderStepKolom(number, desc, formula, aman = null) {
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

// FUNGSI: Render Penampang Kolom (Single View)
function renderPenampangKolom(result) {
    const container = document.getElementById('svg-container-tumpuan');
    
    if (!container) {
        console.error("Element #svg-container-tumpuan tidak ditemukan");
        return;
    }

    const { data, inputData, mode } = result;
    
    if (!data || !inputData) {
        console.error("Data tidak lengkap untuk render penampang kolom");
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
            D = parseFloat(tulangan.d_tul || tulangan.d) || 19;
            phi = parseFloat(tulangan.phi_tul || tulangan.phi) || 10;
        } else {
            // Untuk mode desain, gunakan nilai dari hasil optimasi
            D = data.D || 19;
            phi = data.phi || 10;
        }

        // Tentukan jumlah tulangan
        let jumlahTulangan;
        if (mode === 'evaluasi' && tulangan) {
            jumlahTulangan = parseFloat(tulangan.n_tul || tulangan.n) || 4;
        } else {
            // Untuk mode desain, gunakan jumlah dari hasil perhitungan
            jumlahTulangan = data.hasilTulangan?.n_terpakai || 4;
        }

        // Ambil m dari hasil perhitungan
        const m = data.m || 2;

        console.log("📐 Data untuk penampang kolom:", {
            lebar, tinggi, D, phi, jumlahTulangan, sb, m
        });

        // Tampilkan loading terlebih dahulu
        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: #666;">
                <p>Memuat gambar penampang kolom...</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">
                    ${jumlahTulangan}D${D}, begel ɸ${phi}
                </p>
            </div>
        `;

        // Panggil fungsi render dari cut-generator dengan parameter untuk kolom
        if (typeof window.renderPenampangKolom === 'function') {
            window.renderPenampangKolom({
                lebar: lebar,
                tinggi: tinggi,
                D: D,
                begel: phi,
                jumlahTulangan: jumlahTulangan,
                selimut: sb,
                m: m
            }, 'svg-container-tumpuan');
            
        } else {
            console.warn("Fungsi renderPenampangKolom belum tersedia di cut-generator");
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #dc3545;">
                    <p>Gagal memuat gambar</p>
                    <p style="font-size: 0.8rem;">Modul tidak tersedia</p>
                </div>
            `;
        }

    } catch (error) {
        console.error(`Error rendering penampang kolom:`, error);
        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: #dc3545;">
                <p>Error memuat gambar</p>
                <p style="font-size: 0.8rem;">${error.message}</p>
            </div>
        `;
    }
}

// Update layout untuk kolom - FULL WIDTH
function updateLayoutForKolom() {
    console.log("🔄 Mengupdate layout untuk kolom...");
    
    // Sembunyikan card lapangan
    const lapanganCard = document.querySelector('.penampang-card:nth-child(2)');
    if (lapanganCard) {
        lapanganCard.style.display = 'none';
        console.log("✅ Card lapangan disembunyikan");
    }
    
    // Update judul penampang utama
    const penampangSection = document.querySelector('.penampang-section');
    if (penampangSection) {
        const title = penampangSection.querySelector('h2');
        if (title) {
            title.textContent = 'PENAMPANG KOLOM';
            console.log("✅ Judul section diubah menjadi PENAMPANG KOLOM");
        }
        
        // UBAH LAYOUT PENAMPANG CONTAINER MENJADI FULL WIDTH
        const penampangContainer = penampangSection.querySelector('.penampang-container');
        if (penampangContainer) {
            penampangContainer.style.gridTemplateColumns = '1fr';
            penampangContainer.style.maxWidth = '100%';
            console.log("✅ Layout penampang diubah menjadi full width");
        }
    }
    
    // Update judul card tumpuan
    const tumpuanCard = document.querySelector('.penampang-card:first-child');
    if (tumpuanCard) {
        const title = tumpuanCard.querySelector('h3');
        if (title) {
            title.textContent = 'Penampang Kolom';
            console.log("✅ Judul card diubah menjadi Penampang Kolom");
        }
        
        // Pastikan card mengambil lebar penuh
        tumpuanCard.style.gridColumn = '1 / -1';
        tumpuanCard.style.width = '100%';
        tumpuanCard.style.maxWidth = '100%';
    }
    
    // Update tombol CAD
    const cadButton = document.querySelector('.btn.primary[onclick="exportCAD()"]');
    if (cadButton) {
        cadButton.textContent = 'Copy ke CAD';
        // Update onclick untuk kolom
        cadButton.setAttribute('onclick', 'exportCADKolom()');
        console.log("✅ Tombol CAD diupdate untuk kolom");
    }
    
    console.log("✅ Layout kolom berhasil diupdate");
}

// Fungsi export CAD khusus kolom
function exportCADKolom() {
    if (typeof window.generateCADText === 'function') {
        const cadText = window.generateCADText();
        navigator.clipboard.writeText(cadText).then(() => {
            alert('Text CAD untuk penampang kolom berhasil disalin ke clipboard!');
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

// Ekspos fungsi ke window
window.renderKolomReport = renderKolomReport;
window.exportCADKolom = exportCADKolom;

console.log("✅ report-kolom.js loaded successfully");