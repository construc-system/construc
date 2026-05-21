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

    // DATA BEBAN - dua momen
    if (inputData.beban) {
        html += `
            <div class="data-card">
                <h3>Beban</h3>
        `;
        
        if (inputData.beban.pu !== undefined && inputData.beban.pu !== null) {
            html += `<div class="data-row"><span class="data-label">P<sub>u</sub></span><span class="data-value">${inputData.beban.pu} kN</span></div>`;
        }
        if (inputData.beban.mux !== undefined && inputData.beban.mux !== null) {
            html += `<div class="data-row"><span class="data-label">M<sub>ux</sub></span><span class="data-value">${inputData.beban.mux} kNm</span></div>`;
        }
        if (inputData.beban.muy !== undefined && inputData.beban.muy !== null) {
            html += `<div class="data-row"><span class="data-label">M<sub>uy</sub></span><span class="data-value">${inputData.beban.muy} kNm</span></div>`;
        }
        if (inputData.beban.vu !== undefined && inputData.beban.vu !== null) {
            html += `<div class="data-row"><span class="data-label">V<sub>u</sub></span><span class="data-value">${inputData.beban.vu} kN</span></div>`;
        }
        
        html += `</div>`;
    }

    // DATA TULANGAN (hanya untuk mode evaluasi)
    // REVISI: tampilkan nx dan ny secara terpisah, plus total = nx + ny - 4
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
                    <span class="data-label">&#x03D5;</span>
                    <span class="data-value">${inputData.tulangan.phi_tul || inputData.tulangan.phi} mm</span>
                </div>
            `;
        }

        // REVISI: nx menggantikan n tunggal untuk arah X
        if (inputData.tulangan.nx_tul || inputData.tulangan.nx) {
            html += `
                <div class="data-row">
                    <span class="data-label">n<sub>x</sub></span>
                    <span class="data-value">${inputData.tulangan.nx_tul || inputData.tulangan.nx}</span>
                </div>
            `;
        }

        // REVISI: ny untuk arah Y
        if (inputData.tulangan.ny_tul || inputData.tulangan.ny) {
            html += `
                <div class="data-row">
                    <span class="data-label">n<sub>y</sub></span>
                    <span class="data-value">${inputData.tulangan.ny_tul || inputData.tulangan.ny}</span>
                </div>
            `;
        }

        // Tampilkan total batang = nx + ny - 4 sebagai informasi tambahan
        const nx = parseFloat(inputData.tulangan.nx_tul || inputData.tulangan.nx) || 0;
        const ny = parseFloat(inputData.tulangan.ny_tul || inputData.tulangan.ny) || 0;
        if (nx > 0 && ny > 0) {
            const nTotal = Math.max(0, nx + ny - 4);
            html += `
                <div class="data-row">
                    <span class="data-label">n<sub>total</sub></span>
                    <span class="data-value">${nTotal} batang</span>
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
    
    const showLambda = lambda !== undefined && lambda !== null && parseFloat(lambda) !== 1;
    const showN = (n_kaki !== undefined && n_kaki !== null && parseFloat(n_kaki) !== 2) || 
                 (n_val !== undefined && n_val !== null && parseFloat(n_val) !== 2);
    
    if (showLambda || showN) {
        html += `
            <div class="data-card">
                <h3>Konstanta</h3>
        `;
        
        if (showLambda) {
            html += `
                <div class="data-row">
                    <span class="data-label">&#x03BB;</span>
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
    
    if (!result.rekap) {
        container.innerHTML = '<div class="result-item"><p>Data hasil perhitungan tidak tersedia</p></div>';
        return;
    }

    const { rekap, kontrol, data, inputData } = result;
    console.log("📊 Data rekap untuk hasil:", rekap);
    console.log("📊 Data kontrol untuk hasil:", kontrol);

    let html = '';

    // ==================== PERBAIKAN: HITUNG ULANG TULANGAN UTAMA UNTUK MODE DESAIN ====================
    let tulanganUtamaDisplay = rekap.formatted?.tulangan_utama || '';
    const isDesain = (inputData?.mode === 'desain' || result.mode === 'desain');
    
    if (isDesain && data?.hasilTulangan?.hasilArahX && data?.hasilTulangan?.hasilArahY) {
        const nX = data.hasilTulangan.hasilArahX.n_terpakai || 0;
        const nY = data.hasilTulangan.hasilArahY.n_terpakai || 0;
        const D = rekap.tulangan?.D || data.D || 0;
        let totalBatang = nX + nY - 4;
        if (totalBatang < 0) totalBatang = 0;
        if (totalBatang > 0 && D > 0) {
            tulanganUtamaDisplay = `${totalBatang}D${D}`;
            console.log(`✅ Koreksi tulangan utama: ${nX}+${nY}-4 = ${totalBatang}D${D}`);
        }
    }

    // REKAP TULANGAN - menggunakan nilai yang sudah dikoreksi, tanpa Sn
    if (rekap.formatted || tulanganUtamaDisplay) {
        html += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h4>Rekap Tulangan</h4>
                ${tulanganUtamaDisplay ? `<p><strong>Tulangan Utama:</strong> ${tulanganUtamaDisplay}</p>` : ''}
                ${rekap.formatted?.begel ? `<p><strong>Begel:</strong> ${rekap.formatted.begel}</p>` : ''}
            </div>
        `;
    }

    // KESIMPULAN KEAMANAN - menggunakan fungsi yang sudah diperbaiki dengan parameter tambahan rekap
    const statusKeamanan = getStatusKeamananKolom(kontrol, rekap);
    console.log("Status Keamanan Kolom:", statusKeamanan);

    html += `
        <div class="result-item" style="grid-column: 1 / -1; background: ${statusKeamanan.aman ? '#d4edda' : '#f8d7da'} !important;">
            <h4>STATUS KEAMANAN STRUKTUR</h4>
            <div style="text-align: center; padding: 1rem;">
                <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                    ${statusKeamanan.aman ? 
                      '<span class="status-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">&#x2713; STRUKTUR AMAN</span>' : 
                      '<span class="status-tidak-aman" style="font-size: 1.2rem; padding: 0.5rem 1rem;">&#x2717; PERLU PERBAIKAN</span>'}
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

    container.innerHTML = html;
}

// Fungsi untuk mendapatkan status keamanan struktur kolom (Biaxial) - DIPERBAIKI untuk cek per arah
function getStatusKeamananKolom(kontrol, rekap) {
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

    // Ambil data hasil per arah dari rekap
    const hasilArahX = rekap?.hasilPerhitunganArahX;
    const hasilArahY = rekap?.hasilPerhitunganArahY;

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
        
        // PERBAIKAN: Cek jumlah tulangan per arah (nx dan ny) bukan total
        let n_ok_X = true;
        let n_ok_Y = true;
        if (hasilArahX && hasilArahY) {
            const nx = hasilArahX.n_terpakai;
            const ny = hasilArahY.n_terpakai;
            const n_max_X = hasilArahX.n_max;
            const n_max_Y = hasilArahY.n_max;
            
            if (nx !== undefined && n_max_X !== undefined && nx > n_max_X) {
                n_ok_X = false;
                kontrolTidakAman.push(`Jumlah tulangan arah X (nx = ${nx}) melebihi kapasitas penampang (n_max = ${n_max_X})`);
                saranPerbaikan.push('Kurangi jumlah tulangan arah X atau perbesar dimensi kolom');
            }
            if (ny !== undefined && n_max_Y !== undefined && ny > n_max_Y) {
                n_ok_Y = false;
                kontrolTidakAman.push(`Jumlah tulangan arah Y (ny = ${ny}) melebihi kapasitas penampang (n_max = ${n_max_Y})`);
                saranPerbaikan.push('Kurangi jumlah tulangan arah Y atau perbesar dimensi kolom');
            }
        } else {
            // Fallback ke properti lama jika data per arah tidak tersedia
            if (!lentur.n_ok) {
                kontrolTidakAman.push('Jumlah tulangan melebihi kapasitas penampang');
                saranPerbaikan.push('Kurangi jumlah tulangan atau perbesar dimensi kolom');
            }
        }
        
        // Kontrol K untuk arah X
        if (lentur.K_ok_X !== undefined && !lentur.K_ok_X) {
            kontrolTidakAman.push('Rasio K untuk arah X melebihi Kmaks');
            saranPerbaikan.push('Perbesar dimensi kolom atau tingkatkan mutu beton untuk arah X');
        }
        
        // Kontrol K untuk arah Y
        if (lentur.K_ok_Y !== undefined && !lentur.K_ok_Y) {
            kontrolTidakAman.push('Rasio K untuk arah Y melebihi Kmaks');
            saranPerbaikan.push('Perbesar dimensi kolom atau tingkatkan mutu beton untuk arah Y');
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
    
    // Ambil data hasil per arah dari rekap (sudah disimpan di hasilPerhitunganArahX/Y)
    let hasilArahX = null;
    let hasilArahY = null;
    
    if (result.rekap) {
        hasilArahX = result.rekap.hasilPerhitunganArahX;
        hasilArahY = result.rekap.hasilPerhitunganArahY;
    }
    
    // Fallback jika tidak ada
    if (!hasilArahX && result.data && result.data.hasilTulangan) {
        hasilArahX = result.data.hasilTulangan.hasilArahX;
        hasilArahY = result.data.hasilTulangan.hasilArahY;
    }
    
    console.log("📋 Data hasilArahX:", hasilArahX);
    console.log("📋 Data hasilArahY:", hasilArahY);
    
    const { kontrol } = result;
    
    let html = '';

    if (kontrol && hasilArahX && hasilArahY) {
        const getStepNumber = createStepNumberGenerator();
        
        // Arah X: 2 poin parameter dasar + 3 poin kontrol lentur
        html += renderParameterDasarKolomArah(hasilArahX, 'X', getStepNumber);
        html += renderKontrolLenturPerArah(hasilArahX, kontrol.lentur, 'X', getStepNumber);
        
        // Arah Y: 2 poin parameter dasar + 3 poin kontrol lentur
        html += renderParameterDasarKolomArah(hasilArahY, 'Y', getStepNumber);
        html += renderKontrolLenturPerArah(hasilArahY, kontrol.lentur, 'Y', getStepNumber);
        
        // Kontrol geser: 2 poin
        html += renderKontrolGeserKolom(kontrol.geser, result.rekap, getStepNumber);
    } else {
        html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
    }
    
    container.innerHTML = html;
}

// Fungsi untuk merender parameter dasar per arah (faktor reduksi dan kondisi)
function renderParameterDasarKolomArah(hasilArah, arah, getStepNumber) {
    let faktorPhi = hasilArah?.faktorPhi;
    let kondisi = hasilArah?.kondisi;
    
    let html = '';
    
    if (faktorPhi !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            `Faktor Reduksi Kekuatan Arah ${arah === 'X' ? 'x' : 'y'}`,
            `&#x2205; = ${faktorPhi?.toFixed(3) || 'N/A'}`
        );
    } else {
        html += renderStepKolom(
            getStepNumber(),
            `Faktor Reduksi Kekuatan Arah ${arah === 'X' ? 'x' : 'y'}`,
            `&#x2205; = N/A (data tidak tersedia)`
        );
    }
    
    if (kondisi) {
        html += renderStepKolom(
            getStepNumber(),
            `Kondisi Perhitungan Arah ${arah === 'X' ? 'x' : 'y'}`,
            kondisi
        );
    } else {
        html += renderStepKolom(
            getStepNumber(),
            `Kondisi Perhitungan Arah ${arah === 'X' ? 'x' : 'y'}`,
            `Tidak diketahui`
        );
    }
    
    return html;
}

// Fungsi untuk merender kontrol lentur per arah (3 poin: rasio, jumlah, kapasitas)
// Tidak menampilkan "Penerapan Persyaratan Minimum" sesuai permintaan user
function renderKontrolLenturPerArah(hasilArah, kontrolLentur, arah, getStepNumber) {
    if (!hasilArah) return '';
    
    // Ambil data dari hasilArah
    let rho = hasilArah.rho;
    let n_terpakai = hasilArah.n_terpakai;
    let n_max = hasilArah.n_max;
    let Ast_i = hasilArah.Ast_i;
    let Ast_u = hasilArah.As_tu;  // kebutuhan luas tulangan
    let K = hasilArah.K;
    let Kmaks = hasilArah.Kmaks;
    let K_melebihi_Kmaks = hasilArah.K_melebihi_Kmaks;
    
    // Jika Ast_u negatif, set ke 0 (karena tidak butuh tulangan)
    if (Ast_u !== undefined && Ast_u < 0) Ast_u = 0;
    
    let Ast_ok = false;
    if (Ast_i !== undefined && Ast_u !== undefined) {
        Ast_ok = Ast_i >= Ast_u;
    }
    
    let rho_ok = false;
    if (rho !== undefined) {
        rho_ok = rho >= 1.0;
    }
    
    let n_ok = false;
    if (n_terpakai !== undefined && n_max !== undefined) {
        n_ok = n_terpakai <= n_max;
    }
    
    let K_ok = false;
    if (K !== undefined && Kmaks !== undefined) {
        K_ok = !K_melebihi_Kmaks;
    }
    
    let html = '';
    
    // 1. Kontrol rasio tulangan
    const rhoFormatted = (rho !== undefined && !isNaN(rho)) ? rho.toFixed(3) : 'N/A';
    html += renderStepKolom(
        getStepNumber(),
        `Kontrol Rasio Tulangan Minimum Arah ${arah === 'X' ? 'x' : 'y'}`,
        `&#x03C1; = ${rhoFormatted}% &#x2265; 1%`,
        rho_ok
    );
    
    // 2. Kontrol jumlah tulangan per arah (nx atau ny)
    let nFormatted = (n_terpakai !== undefined) ? n_terpakai : 'N/A';
    let nMaxFormatted = (n_max !== undefined) ? n_max : 'N/A';
    html += renderStepKolom(
        getStepNumber(),
        `Kontrol Jumlah Tulangan Arah ${arah === 'X' ? 'x' : 'y'}`,
        `n = ${nFormatted} &#x2264; 2m = ${nMaxFormatted}`,
        n_ok
    );
    
    // 3. Kontrol kapasitas tulangan
    let Ast_iFormatted = (Ast_i !== undefined) ? Ast_i.toFixed(0) : 'N/A';
    let Ast_uFormatted = (Ast_u !== undefined) ? Ast_u.toFixed(0) : 'N/A';
    html += renderStepKolom(
        getStepNumber(),
        `Kontrol Kapasitas Tulangan Arah ${arah === 'X' ? 'x' : 'y'}`,
        `A<sub>s,terpasang</sub> = ${Ast_iFormatted} mm&#xB2; &#x2265; A<sub>s,diperlukan</sub> = ${Ast_uFormatted} mm&#xB2;`,
        Ast_ok
    );
    
    // 4. Kontrol K (rasio momen) - jika ada
    if (K !== undefined && Kmaks !== undefined && !isNaN(K) && !isNaN(Kmaks)) {
        const KFormatted = K.toFixed(2);
        const KmaksFormatted = Kmaks.toFixed(2);
        html += renderStepKolom(
            getStepNumber(),
            `Kontrol Rasio Momen (K) Arah ${arah === 'X' ? 'x' : 'y'}`,
            `K = ${KFormatted} &#x2264; K<sub>maks</sub> = ${KmaksFormatted}`,
            K_ok
        );
    }
    
    // Catatan: Tidak menampilkan step "Penerapan Persyaratan Minimum" sesuai permintaan user
    
    return html;
}

// Fungsi untuk merender kontrol geser (2 poin)
function renderKontrolGeserKolom(kontrolGeser, rekap, getStepNumber) {
    if (!kontrolGeser) return '';
    
    let html = '';
    const begel = rekap?.begel || {};
    
    // Kontrol Vs ≤ Vs_maks
    let Vs = kontrolGeser.detail?.Vs ?? begel.Vs;
    let Vs_max = kontrolGeser.detail?.Vs_max ?? begel.Vs_max;
    let Vs_ok = kontrolGeser.Vs_ok;
    if (Vs === undefined && begel.Vs !== undefined) Vs = begel.Vs;
    if (Vs_max === undefined && begel.Vs_max !== undefined) Vs_max = begel.Vs_max;
    if (Vs_ok === undefined && Vs !== undefined && Vs_max !== undefined) Vs_ok = Vs <= Vs_max;
    
    if (Vs !== undefined && Vs_max !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Tegangan Geser',
            `V<sub>s</sub> = ${Vs?.toFixed(2) || 'N/A'} kN &#x2264; V<sub>s,maks</sub> = ${Vs_max?.toFixed(2) || 'N/A'} kN`,
            Vs_ok === true
        );
    } else {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Tegangan Geser',
            `Data tidak tersedia`,
            null
        );
    }
    
    // Kontrol Av_terpakai ≥ Av_u
    let Av_terpakai = kontrolGeser.detail?.Av_terpakai ?? begel.Av_terpakai;
    let Av_u = kontrolGeser.detail?.Av_u ?? begel.Av_u;
    let Av_ok = kontrolGeser.Av_ok;
    if (Av_terpakai === undefined && begel.Av_terpakai !== undefined) Av_terpakai = begel.Av_terpakai;
    if (Av_u === undefined && begel.Av_u !== undefined) Av_u = begel.Av_u;
    if (Av_ok === undefined && Av_terpakai !== undefined && Av_u !== undefined) Av_ok = Av_terpakai >= Av_u;
    
    if (Av_terpakai !== undefined && Av_u !== undefined) {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Tulangan Geser',
            `A<sub>v,terpasang</sub> = ${Av_terpakai?.toFixed(2) || 'N/A'} mm&#xB2;/m &#x2265; A<sub>v,diperlukan</sub> = ${Av_u?.toFixed(2) || 'N/A'} mm&#xB2;/m`,
            Av_ok === true
        );
    } else {
        html += renderStepKolom(
            getStepNumber(),
            'Kontrol Tulangan Geser',
            `Data tidak tersedia`,
            null
        );
    }
    
    return html;
}

// Helper function untuk render step kolom
function renderStepKolom(number, desc, formula, aman = null) {
    const statusHtml = aman !== null ? 
        `<div class="step-result">${aman ? '<span class="status-aman">&#x2713; AMAN</span>' : '<span class="status-tidak-aman">&#x2717; TIDAK AMAN</span>'}</div>` : 
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

// FUNGSI: Render Penampang Kolom (Single View) dengan jumlah batang yang benar
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
        const dimensi = inputData.dimensi || {};
        const lebar = parseFloat(dimensi.b) || null;
        const tinggi = parseFloat(dimensi.h) || null;
        const sb = parseFloat(dimensi.sb) || null;

        const tulangan = inputData.tulangan || {};

        let D, phi;
        if (mode === 'evaluasi' && tulangan) {
            D = parseFloat(tulangan.d_tul || tulangan.d) || null;
            phi = parseFloat(tulangan.phi_tul || tulangan.phi) || null;
        } else {
            D = data.D || null;
            phi = data.phi || null;
        }

        let jumlahTulangan;
        const isDesain = (mode === 'desain');
        
        if (isDesain && data?.hasilTulangan?.hasilArahX && data?.hasilTulangan?.hasilArahY) {
            const nX = data.hasilTulangan.hasilArahX.n_terpakai || 0;
            const nY = data.hasilTulangan.hasilArahY.n_terpakai || 0;
            jumlahTulangan = nX + nY - 4;
            if (jumlahTulangan < 0) jumlahTulangan = 0;
            console.log(`📐 Penampang desain: nX=${nX}, nY=${nY}, total batang = ${jumlahTulangan}D${D}`);
        } else if (mode === 'evaluasi' && tulangan) {
            // REVISI: Hitung total dari nx + ny - 4 untuk evaluasi biaxial
            const nx = parseFloat(tulangan.nx_tul || tulangan.nx) || 0;
            const ny = parseFloat(tulangan.ny_tul || tulangan.ny) || 0;
            jumlahTulangan = Math.max(0, nx + ny - 4) || null;
            console.log(`📐 Penampang evaluasi: nx=${nx}, ny=${ny}, total batang = ${jumlahTulangan}D${D}`);
        } else {
            jumlahTulangan = data.hasilTulangan?.n_terpakai || 
                             result.rekap?.tulangan?.n_terpakai || null;
        }

        const m = data.m || null;

        console.log("📐 Data untuk penampang kolom:", {
            lebar, tinggi, D, phi, jumlahTulangan, sb, m
        });

        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: #666;">
                <p>Memuat gambar penampang kolom...</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">
                    ${jumlahTulangan}D${D}, begel &#x03D5;${phi}
                </p>
            </div>
        `;

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
    
    const lapanganCard = document.querySelector('.penampang-card:nth-child(2)');
    if (lapanganCard) {
        lapanganCard.style.display = 'none';
        console.log("✅ Card lapangan disembunyikan");
    }
    
    const penampangSection = document.querySelector('.penampang-section');
    if (penampangSection) {
        const title = penampangSection.querySelector('h2');
        if (title) {
            title.textContent = 'PENAMPANG KOLOM';
            console.log("✅ Judul section diubah menjadi PENAMPANG KOLOM");
        }
        
        const penampangContainer = penampangSection.querySelector('.penampang-container');
        if (penampangContainer) {
            penampangContainer.style.gridTemplateColumns = '1fr';
            penampangContainer.style.maxWidth = '100%';
            console.log("✅ Layout penampang diubah menjadi full width");
        }
    }
    
    const tumpuanCard = document.querySelector('.penampang-card:first-child');
    if (tumpuanCard) {
        const title = tumpuanCard.querySelector('h3');
        if (title) {
            title.textContent = 'Penampang Kolom';
            console.log("✅ Judul card diubah menjadi Penampang Kolom");
        }
        tumpuanCard.style.gridColumn = '1 / -1';
        tumpuanCard.style.width = '100%';
        tumpuanCard.style.maxWidth = '100%';
    }
    
    const cadButton = document.querySelector('.btn.primary[onclick="exportCAD()"]');
    if (cadButton) {
        cadButton.textContent = 'Copy ke CAD';
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

// Update judul laporan berdasarkan modul
function updateReportTitle(result) {
    const titleElement = document.getElementById('reportTitle');
    if (!titleElement) return;
    
    let title = 'Laporan Perhitungan Struktur';
    
    if (result.inputData?.module === 'kolom') {
        title = 'Laporan Perhitungan Kolom';
    } else if (result.inputData?.module === 'balok') {
        title = 'Laporan Perhitungan Balok';
    }
    
    if (result.inputData?.mode) {
        title += ` - Mode ${result.inputData.mode === 'desain' ? 'Desain' : 'Evaluasi'}`;
    }
    
    titleElement.textContent = title;
}

// Ekspos fungsi ke window
window.renderKolomReport = renderKolomReport;
window.exportCADKolom = exportCADKolom;
window.updateReportTitle = updateReportTitle;

console.log("✅ report-kolom.js loaded — Biaxial evaluasi nx/ny terpisah — total penampang = nx+ny-4 — Sn dihapus — status keamanan cek per arah");