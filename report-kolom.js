// report-kolom.js

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
        
        // Panggil fungsi efisiensi (diagram interaksi & kalkulasi ter-trigger di dalamnya)
        renderEfisiensiTulanganKolom(result);
        
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

    // DATA BEBAN
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

    // DATA TULANGAN
    const isEvaluasiMode = inputData.mode === 'evaluasi';
    
    if (isEvaluasiMode && inputData.tulangan) {
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

        if (inputData.tulangan.nx_tul || inputData.tulangan.nx) {
            html += `
                <div class="data-row">
                    <span class="data-label">n<sub>x</sub></span>
                    <span class="data-value">${inputData.tulangan.nx_tul || inputData.tulangan.nx}</span>
                </div>
            `;
        }

        if (inputData.tulangan.ny_tul || inputData.tulangan.ny) {
            html += `
                <div class="data-row">
                    <span class="data-label">n<sub>y</sub></span>
                    <span class="data-value">${inputData.tulangan.ny_tul || inputData.tulangan.ny}</span>
                </div>
            `;
        }

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

    // DATA LANJUTAN 
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
    if (!container) return;
    
    if (!result.rekap) {
        container.innerHTML = '<div class="result-item"><p>Data hasil perhitungan tidak tersedia</p></div>';
        return;
    }

    const { rekap, kontrol, data, inputData } = result;

    let html = '';
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
        }
    }

    if (rekap.formatted || tulanganUtamaDisplay) {
        html += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h4>Rekap Tulangan</h4>
                ${tulanganUtamaDisplay ? `<p><strong>Tulangan Utama:</strong> ${tulanganUtamaDisplay}</p>` : ''}
                ${rekap.formatted?.begel ? `<p><strong>Begel:</strong> ${rekap.formatted.begel}</p>` : ''}
            </div>
        `;
    }

    const statusKeamanan = getStatusKeamananKolom(kontrol, rekap);

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

    const hasilArahX = rekap?.hasilPerhitunganArahX;
    const hasilArahY = rekap?.hasilPerhitunganArahY;

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
            if (!lentur.n_ok) {
                kontrolTidakAman.push('Jumlah tulangan melebihi kapasitas penampang');
                saranPerbaikan.push('Kurangi jumlah tulangan atau perbesar dimensi kolom');
            }
        }
        
        if (lentur.K_ok_X !== undefined && !lentur.K_ok_X) {
            kontrolTidakAman.push('Rasio K untuk arah X melebihi Kmaks');
            saranPerbaikan.push('Perbesar dimensi kolom atau tingkatkan mutu beton untuk arah X');
        }
        if (lentur.K_ok_Y !== undefined && !lentur.K_ok_Y) {
            kontrolTidakAman.push('Rasio K untuk arah Y melebihi Kmaks');
            saranPerbaikan.push('Perbesar dimensi kolom atau tingkatkan mutu beton untuk arah Y');
        }
    }

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
    if (!container) return;
    
    let hasilArahX = result.rekap?.hasilPerhitunganArahX || result.data?.hasilTulangan?.hasilArahX;
    let hasilArahY = result.rekap?.hasilPerhitunganArahY || result.data?.hasilTulangan?.hasilArahY;
    
    const { kontrol } = result;
    let html = '';

    if (kontrol && hasilArahX && hasilArahY) {
        const getStepNumber = createStepNumberGenerator();
        
        html += renderParameterDasarKolomArah(hasilArahX, 'X', getStepNumber);
        html += renderKontrolLenturPerArah(hasilArahX, kontrol.lentur, 'X', getStepNumber);
        
        html += renderParameterDasarKolomArah(hasilArahY, 'Y', getStepNumber);
        html += renderKontrolLenturPerArah(hasilArahY, kontrol.lentur, 'Y', getStepNumber);
        
        html += renderKontrolGeserKolom(kontrol.geser, result.rekap, getStepNumber);
    } else {
        html = '<div class="step-item"><p>Data ringkasan tidak tersedia</p></div>';
    }
    
    container.innerHTML = html;
}

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

function renderKontrolLenturPerArah(hasilArah, kontrolLentur, arah, getStepNumber) {
    if (!hasilArah) return '';
    
    let rho = hasilArah.rho;
    let n_terpakai = hasilArah.n_terpakai;
    let n_max = hasilArah.n_max;
    let Ast_i = hasilArah.Ast_i;
    let Ast_u = hasilArah.As_tu;  
    let K = hasilArah.K;
    let Kmaks = hasilArah.Kmaks;
    let K_melebihi_Kmaks = hasilArah.K_melebihi_Kmaks;
    
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
    
    const rhoFormatted = (rho !== undefined && !isNaN(rho)) ? rho.toFixed(3) : 'N/A';
    html += renderStepKolom(
        getStepNumber(),
        `Kontrol Rasio Tulangan Minimum Arah ${arah === 'X' ? 'x' : 'y'}`,
        `&#x03C1; = ${rhoFormatted}% &#x2265; 1%`,
        rho_ok
    );
    
    let nFormatted = (n_terpakai !== undefined) ? n_terpakai : 'N/A';
    let nMaxFormatted = (n_max !== undefined) ? n_max : 'N/A';
    html += renderStepKolom(
        getStepNumber(),
        `Kontrol Jumlah Tulangan Arah ${arah === 'X' ? 'x' : 'y'}`,
        `n = ${nFormatted} &#x2264; 2m = ${nMaxFormatted}`,
        n_ok
    );
    
    let Ast_iFormatted = (Ast_i !== undefined) ? Ast_i.toFixed(0) : 'N/A';
    let Ast_uFormatted = (Ast_u !== undefined) ? Ast_u.toFixed(0) : 'N/A';
    html += renderStepKolom(
        getStepNumber(),
        `Kontrol Kapasitas Tulangan Arah ${arah === 'X' ? 'x' : 'y'}`,
        `A<sub>s,d</sub> = ${Ast_iFormatted} mm&#xB2; &#x2265; A<sub>s,u</sub> = ${Ast_uFormatted} mm&#xB2;`,
        Ast_ok
    );
    
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
    
    return html;
}

function renderKontrolGeserKolom(kontrolGeser, rekap, getStepNumber) {
    if (!kontrolGeser) return '';
    
    let html = '';
    const begel = rekap?.begel || {};
    
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
            `A<sub>v,d</sub> = ${Av_terpakai?.toFixed(2) || 'N/A'} mm&#xB2;/m &#x2265; A<sub>v,u</sub> = ${Av_u?.toFixed(2) || 'N/A'} mm&#xB2;/m`,
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

// ==================== FUNGSI WARNA GLOBAL UNTUK EFISIENSI & DIAGRAM ====================
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

// =======================================================================================
// FUNGSI PERHITUNGAN KURVA INTERAKSI
// =======================================================================================
function generateKurvaInteraksi(fc, fy, b, h, d_tulangan, d_begel, arahLabel = "X") {
    const Es = 200000;
    const Es_kN = Es / 1000;
    const fc_kN = fc / 1000;
    const fy_kN = fy / 1000;
    const ey = fy / Es; 
    
    const beta1 = fc <= 30 ? 0.85 : 0.85 - 0.008 * (fc - 30);
    const ds = Math.ceil((40 + d_begel + d_tulangan / 2) / 5) * 5; 
    
    const cb = (600 * (h - ds)) / (600 + fy); 
    const step_c = h / 200; 

    let dataKurva = {};

    for (let i = 1; i <= 8; i++) {
        const rho = i / 100;
        const Ast = rho * b * h; 
        const A1 = Ast / 2;
        
        let titik_interaksi = [];

        const phi_P0 = 0.65 * (0.85 * fc_kN * (b * h - Ast) + Ast * fy_kN); 
        const P0 = phi_P0 / 0.65;
        titik_interaksi.push({ tinjauan: "1_Sentris", c: null, Pn: P0, Mn: 0, phi_Pn: phi_P0, phi_Mn: 0 });

        for (let c_2 = h; c_2 > cb; c_2 -= step_c) {
            const a_2 = beta1 * c_2;
            const eps1_2 = ((h - c_2) - ds) / c_2 * 0.003; 
            const f1_2 = eps1_2 < ey ? eps1_2 * Es_kN : fy_kN; 
            const eps2_2 = (c_2 - ds) / c_2 * 0.003; 
            const f2_2 = eps2_2 < ey ? eps2_2 * Es_kN : fy_kN; 

            const gaya_T1_2 = -A1 * f1_2;
            const lengan_T1_2 = -(h / 2 - ds);
            const gaya_Cc_2 = 0.85 * fc_kN * a_2 * b; 
            const lengan_Cc_2 = (h - a_2) / 2;
            const gaya_C2_2 = A1 * f2_2;
            const lengan_C2_2 = Math.abs(lengan_T1_2);

            const Pn_2 = gaya_T1_2 + gaya_Cc_2 + gaya_C2_2;
            const Mn_2 = (gaya_T1_2 * lengan_T1_2) + (gaya_Cc_2 * lengan_Cc_2) + (gaya_C2_2 * lengan_C2_2);

            titik_interaksi.push({ tinjauan: "2_Tekan", c: c_2, Pn: Pn_2, Mn: Mn_2, phi_Pn: 0.65 * Pn_2, phi_Mn: 0.65 * Mn_2 });
        }

        {
            const c_3 = cb;
            const a_3 = beta1 * c_3;
            const eps1_3 = ((h - c_3) - ds) / c_3 * 0.003;
            const f1_3 = eps1_3 < ey ? eps1_3 * Es_kN : fy_kN;
            const eps2_3 = (c_3 - ds) / c_3 * 0.003;
            const f2_3 = eps2_3 < ey ? eps2_3 * Es_kN : fy_kN;

            const gaya_T1_3 = -A1 * f1_3;
            const lengan_T1_3 = -(h / 2 - ds);
            const gaya_Cc_3 = 0.85 * fc_kN * a_3 * b;
            const lengan_Cc_3 = (h - a_3) / 2;
            const gaya_C2_3 = A1 * f2_3;
            const lengan_C2_3 = Math.abs(lengan_T1_3);

            const Pnb_3 = gaya_T1_3 + gaya_Cc_3 + gaya_C2_3;
            const Mnb_3 = (gaya_T1_3 * lengan_T1_3) + (gaya_Cc_3 * lengan_Cc_3) + (gaya_C2_3 * lengan_C2_3);

            titik_interaksi.push({ tinjauan: "3_Seimbang", c: c_3, Pn: Pnb_3, Mn: Mnb_3, phi_Pn: 0.65 * Pnb_3, phi_Mn: 0.65 * Mnb_3 });
        }

        for (let c_4 = cb - step_c; c_4 >= step_c; c_4 -= step_c) {
            const a_4 = beta1 * c_4;
            const eps1_4 = ((h - c_4) - ds) / c_4 * 0.003;
            const f1_4 = eps1_4 < ey ? eps1_4 * Es_kN : fy_kN;
            const eps2_4 = (c_4 - ds) / c_4 * 0.003; 
            const f2_4 = eps2_4 < ey ? eps2_4 * Es_kN : fy_kN;

            const gaya_T1_4 = -A1 * f1_4;
            const lengan_T1_4 = -(h / 2 - ds);
            const gaya_Cc_4 = 0.85 * fc_kN * a_4 * b;
            const lengan_Cc_4 = (h - a_4) / 2;
            const gaya_C2_4 = A1 * f2_4;
            const lengan_C2_4 = Math.abs(lengan_T1_4);

            const Pn_4 = gaya_T1_4 + gaya_Cc_4 + gaya_C2_4;
            const Mn_4 = (gaya_T1_4 * lengan_T1_4) + (gaya_Cc_4 * lengan_Cc_4) + (gaya_C2_4 * lengan_C2_4);

            titik_interaksi.push({ tinjauan: "4_Tarik", c: c_4, Pn: Pn_4, Mn: Mn_4, phi_Pn: 0.65 * Pn_4, phi_Mn: 0.65 * Mn_4 });
        }

        {
            const p_5 = (600 * A1 - A1 * fy) / (1.7 * fc * b);
            const q_5 = (600 * beta1 * A1 * ds) / (0.85 * fc * b);
            const a_5 = Math.sqrt(Math.pow(p_5, 2) + q_5) - p_5;
            
            const f_double_prime = 600 * ((a_5 - beta1 * ds) / a_5);
            const Mns_5 = f_double_prime < 0 ? 0 : A1 * f_double_prime * ((h - ds) - ds);
            const Mn_5 = (0.85 * fc * a_5 * b * ((h - ds) - a_5 / 2) + Mns_5) / 1000;

            titik_interaksi.push({ tinjauan: "5_LenturMurni", c: null, Pn: 0, Mn: Mn_5, phi_Pn: 0, phi_Mn: 0.65 * Mn_5 }); 
        }

        dataKurva[`rho_${i}_persen`] = titik_interaksi;
    }

    return dataKurva;
}

// ==================== FUNGSI UTAMA: EFISIENSI & DIAGRAM ====================
function renderEfisiensiTulanganKolom(result) {
    const controlContainer = document.getElementById('controlContainer');
    if (!controlContainer) return;
    const parentSection = controlContainer.closest('.section');

    let existingSection = document.getElementById('efisiensi-section-kolom');
    if (existingSection) existingSection.remove();

    const section = document.createElement('section');
    section.className = 'section efisiensi-tulangan';
    section.id = 'efisiensi-section-kolom';

    const { data, kontrol, rekap, inputData } = result;
    if (!data || !kontrol) return;

    const safeDiv = (num, den) => (den && den > 0) ? (num / den) : 0;

    const getUtamaData = (arah) => {
        const det = rekap?.[`hasilPerhitunganArah${arah}`] || data?.hasilTulangan?.[`hasilArah${arah}`];
        if (!det) return { b: 0, k: 1, e: 0 };
        let u = det.As_tu || 0; 
        if (u < 0) u = 0;
        let d = det.Ast_i || 1; 
        return { b: u, k: d, e: safeDiv(u, d) * 100, valid: true, label: `Arah ${arah}` };
    };

    const getGeserData = () => {
        const det = kontrol?.geser?.detail || rekap?.begel;
        if (!det) return { b: 0, k: 1, e: 0 };
        const u = det.Av_u || 0;
        const d = det.Av_terpakai || 1;
        return { b: u, k: d, e: safeDiv(u, d) * 100, valid: true, label: 'Geser' };
    };

    const dataX = getUtamaData('X');
    const dataY = getUtamaData('Y');
    const dataGeser = getGeserData();

    const rho_x = data?.hasilTulangan?.hasilArahX?.detailTulangan?.rho_awal || 0;
    const rho_y = data?.hasilTulangan?.hasilArahY?.detailTulangan?.rho_awal || 0;

    const getRhoStatus = (rho) => {
        if (rho < 1.0) {
            return {
                title: 'Penampang Terlalu Besar',
                desc: `Rasio kebutuhan awal (ρ) sebesar <strong>${rho.toFixed(2)}%</strong> berada di bawah batas minimum SNI (1%). Untuk memenuhi standar baku, rasio tulangan dinaikkan menjadi 1%. Kondisi ini menunjukkan bahwa dimensi penampang lebih besar dari yang dibutuhkan, sehingga kurang efisien secara material. Pertimbangkan untuk memperkecil ukuran penampang.`,
                pct: (rho / 1.0) * 100,
                color: '#ffc107',
                isBad: true
            };
        } else if (rho > 2.0) {
            return {
                title: 'Desain Kurang Ekonomis',
                desc: `Rasio kebutuhan awal (ρ) mencapai <strong>${rho.toFixed(2)}%</strong>. Walaupun secara struktural masih memenuhi batas maksimum SNI (8%), penggunaan rasio di atas 2% akan menghasilkan penulangan yang sangat padat. Hal ini berpotensi mengurangi efisiensi biaya dan menyulitkan proses pengecoran di lapangan. Pertimbangkan untuk memperbesar dimensi penampang.`,
                pct: (2.0 / rho) * 100,
                color: '#dc3545',
                isBad: true
            };
        } else {
            return {
                title: 'Dimensi Optimal',
                desc: `Rasio kebutuhan awal (ρ) sebesar <strong>${rho.toFixed(2)}%</strong> berada dalam rentang ideal (1% - 2%). Desain penampang dinilai ekonomis dan akan memudahkan pelaksanaan pengecoran di lapangan.`,
                pct: 100,
                color: '#28a745',
                isBad: false
            };
        }
    };

    const statX = getRhoStatus(rho_x);
    const statY = getRhoStatus(rho_y);

    const isWarningTriggered = (Math.round((dataX.e + dataY.e) / 2) || 0) > 70 && (statX.isBad || statY.isBad);
    const failedColor = getColorForEfficiency(0);

    const renderCombinedSub = (label, simB, simK, unit, labelB, labelK, valAs, statRho) => {
        const isSubGagal = valAs.e > 100;
        const eStrAs = isSubGagal ? "Gagal" : `${valAs.e.toFixed(1)}%`;
        const cColAs = isSubGagal ? failedColor : getColorForEfficiency(valAs.e);
        
        return `
        <div class="sub-item">
            <div class="sub-item-header" style="text-align: center; font-size: 1.05rem;">${label}</div>
            
            <div style="margin: 0.75rem 0; padding: 0.85rem; background: #fff; border: 1px solid #e0e0e0; border-left: 4px solid ${statRho.color}; border-radius: 4px;">
                <div style="font-size: 0.95rem; font-weight: bold; color: #333; margin-bottom: 0.4rem;">${statRho.title}</div>
                <div style="font-size: 0.8rem; color: #555; line-height: 1.5; margin-bottom: 0.6rem;">${statRho.desc}</div>
                <div style="font-size: 0.85rem; font-weight: bold; color: ${statRho.color}; border-top: 1px dashed #eee; padding-top: 0.4rem;">Efisiensi Penampang: ${statRho.pct.toFixed(1)}%</div>
            </div>

            <div class="calc-details">
                <div class="calc-row"><span>${simB}&nbsp; ${labelB}</span><span>${valAs.b.toFixed(2)} ${unit}</span></div>
                <div class="calc-row"><span>${simK}&nbsp; ${labelK}</span><span>${valAs.k.toFixed(2)} ${unit}</span></div>
                <div class="calc-formula">
                    <span>Efisiensi Tulangan</span>
                    <span style="color: ${cColAs}; font-weight: 700;">${simB} / ${simK} &times; 100% = ${eStrAs}</span>
                </div>
            </div>
        </div>`;
    };

    const processCardData = (title, itemsArray) => {
        const validItems = itemsArray.filter(i => i.valid);
        if (validItems.length === 0) return { rawAvg: 0, isCardGagal: false, failedNames: [] };
        
        const rawAvg = Math.round(validItems.reduce((acc, curr) => acc + curr.e, 0) / validItems.length) || 0;
        let failedNames = [];
        validItems.forEach(item => {
            if(item.e > 100) failedNames.push(item.label);
        })
        return { rawAvg, isCardGagal: failedNames.length > 0, failedNames };
    };

    const renderCard = (title, itemsHtml, cardData, isDiagram = false, hasWarning = false) => {
        let avgDisplay = `${cardData.rawAvg}%`;
        let col = isDiagram ? '#333' : getColorForEfficiency(cardData.rawAvg);
        let progressWidth = Math.min(100, cardData.rawAvg);

        if (cardData.isCardGagal && !isDiagram) {
            avgDisplay = "Gagal";
            col = failedColor;
        }

        const badgeHtml = isDiagram ? '' : `
            <div class="progress-track">
                <div class="progress-fill" style="width: ${progressWidth}%; background-color: ${col};"></div>
            </div>
            <div class="efisiensi-value" style="color: ${col}">${avgDisplay}</div>
        `;
        const headerInteractive = isDiagram ? '' : `onclick="this.parentElement.classList.toggle('active')"`;
        const chevronHtml = isDiagram ? '' : `
            <div class="chevron">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
        `;
        
        const warningIconHtml = hasWarning ? `
            <div class="warning-icon" title="Efisiensi tulangan tinggi, namun terdapat isu pada dimensi penampang. Silakan periksa detailnya.">!</div>
        ` : '';

        let infoText = '';
        if (cardData.isCardGagal && !isDiagram) {
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
        } else if (!isDiagram) {
             infoText = `Nilai&nbsp;<strong>${cardData.rawAvg}%</strong> merupakan hasil rata-rata tingkat efisiensi tulangan untuk ${title.toLowerCase()}.`;
        }

        const infoHtml = isDiagram ? '' : `
            <div class="info-text-bottom" style="font-size: 0.75rem; color: #888; margin-top: 1.2rem; padding-top: 0.75rem; border-top: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 0.5rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; opacity: 0.7; margin-top: 0.1rem;">
                    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>${infoText}</span>
            </div>
        `;

        return `
        <div class="efisiensi-card ${isDiagram ? 'diagram-card active' : ''}">
            <div class="efisiensi-header" ${headerInteractive} ${isDiagram ? 'style="cursor: default;"' : ''}>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="efisiensi-title">${title}</div>
                    ${warningIconHtml}
                </div>
                ${badgeHtml}
                ${chevronHtml}
            </div>
            <div class="efisiensi-body" ${isDiagram ? 'style="display: block;"' : ''}>
                ${itemsHtml}
                ${infoHtml}
            </div>
        </div>`;
    };

    const renderSubGeser = (label, simB, simK, unit, labelB, labelK, val) => {
        const isSubGagal = val.e > 100;
        const eStr = isSubGagal ? "Gagal" : `${val.e.toFixed(1)}%`;
        const cCol = isSubGagal ? failedColor : getColorForEfficiency(val.e);
        return `
        <div class="sub-item">
            <div class="sub-item-header">${label}</div>
            <div class="calc-details">
                <div class="calc-row"><span>${simB}&nbsp; ${labelB}</span><span>${val.b.toFixed(2)} ${unit}</span></div>
                <div class="calc-row"><span>${simK}&nbsp; ${labelK}</span><span>${val.k.toFixed(2)} ${unit}</span></div>
                <div class="calc-formula">
                    <span>Efisiensi</span>
                    <span style="color: ${cCol}; font-weight: 700;">${simB} / ${simK} &times; 100% = ${eStr}</span>
                </div>
            </div>
        </div>`;
    };

    const cardDataUtama = processCardData('Tulangan Utama', [dataX, dataY]);
    const cardDataGeser = processCardData('Tulangan Geser', [dataGeser]);

    const renderCombinedDiagramHTML = () => {
        let legendHtml = '';
        for (let i = 0; i < 8; i++) {
            const color = getColorForEfficiency(100 - (i / 7) * 100);
            legendHtml += `<span style="color: ${color}; font-weight: bold; white-space: nowrap;">&#9644; ${i + 1}%</span>`;
        }
        return `
            <div style="background: #fff; padding: 1rem; border-radius: 6px;">
                <p style="font-size: 0.8rem; color: #666; margin-bottom: 1.5rem; text-align: center;">
                    <em>Kurva Kapasitas Interaksi P-M (&#x2205;Pn vs &#x2205;Mn)</em>
                </p>
                <div class="diagram-grid">
                    <div>
                        <h5 style="text-align: center; margin-bottom: 0.5rem; font-size: 0.9rem; color: #444;">Arah X</h5>
                        <div style="position: relative; width: 100%; max-width: 500px; margin: 0 auto; aspect-ratio: 4/3;">
                            <canvas id="canvasInteraksiX" style="width: 100%; height: 100%; background: #fafafa; border: 1px solid #f0f0f0;"></canvas>
                        </div>
                    </div>
                    <div>
                        <h5 style="text-align: center; margin-bottom: 0.5rem; font-size: 0.9rem; color: #444;">Arah Y</h5>
                        <div style="position: relative; width: 100%; max-width: 500px; margin: 0 auto; aspect-ratio: 4/3;">
                            <canvas id="canvasInteraksiY" style="width: 100%; height: 100%; background: #fafafa; border: 1px solid #f0f0f0;"></canvas>
                        </div>
                    </div>
                </div>
                <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap; font-size: 0.8rem;">
                    ${legendHtml}
                </div>
            </div>
        `;
    };

    const hideDiagram = true; 
    const diagramCardStyle = hideDiagram ? 'style="display: none;"' : '';

    section.innerHTML = `
        <h2>EFISIENSI TULANGAN & PENAMPANG</h2>
        <div class="efisiensi-container">
            ${renderCard('Tulangan Utama', 
                `<div class="sub-efisiensi">
                    ${renderCombinedSub('Evaluasi Arah X', 'A<sub>s,u</sub>', 'A<sub>s,d</sub>', 'mm&sup2;', '(Perlu)', '(Desain)', dataX, statX)}
                    ${renderCombinedSub('Evaluasi Arah Y', 'A<sub>s,u</sub>', 'A<sub>s,d</sub>', 'mm&sup2;', '(Perlu)', '(Desain)', dataY, statY)}
                </div>`, 
            cardDataUtama, false, isWarningTriggered)}
            
            ${renderCard('Tulangan Geser', 
                `<div class="sub-efisiensi">
                    ${renderSubGeser('Geser', 'A<sub>v,u</sub>', 'A<sub>v,d</sub>', 'mm&sup2;/m', '(Perlu)', '(Desain)', dataGeser)}
                </div>`, 
            cardDataGeser)}

            <div ${diagramCardStyle}>
                ${renderCard('Diagram Interaksi Kolom', renderCombinedDiagramHTML(), {rawAvg: 0}, true)}
            </div>
        </div>
    `;

    if (!document.getElementById('efisiensi-style')) {
        const style = document.createElement('style');
        style.id = 'efisiensi-style';
        style.textContent = `
            .efisiensi-container { display: flex; flex-direction: column; gap: 0.75rem; }
            .efisiensi-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; border-left: 4px solid var(--color-borders); overflow: hidden; transition: box-shadow 0.2s; }
            .efisiensi-card.diagram-card { border-left-color: #6c757d; }
            .efisiensi-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .efisiensi-header { padding: 1rem; cursor: pointer; display: grid; grid-template-columns: 240px 1fr 60px 30px; align-items: center; gap: 1rem; transition: background-color 0.2s ease; }
            .diagram-card .efisiensi-header { grid-template-columns: 1fr; }
            .efisiensi-header:hover { background: #f1f3f5; }
            .efisiensi-title { font-weight: 600; color: #333; font-size: 0.95rem; }
            .efisiensi-value { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700; text-align: right; }
            .progress-track { background: #e9ecef; border-radius: 10px; height: 10px; width: 100%; overflow: hidden; }
            .progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease-in-out; }
            .chevron { transition: transform 0.3s ease; color: #666; display: flex; justify-content: center; }
            .efisiensi-card.active .chevron { transform: rotate(180deg); }
            .efisiensi-body { display: none; padding: 1rem; background: #ffffff; border-top: 1px dashed #ddd; animation: fadeIn 0.3s ease; }
            .efisiensi-card.active .efisiensi-body { display: block; }
            .diagram-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .warning-icon { background: #dc3545; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; font-family: monospace; cursor: help; box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3); animation: pulse 2s infinite; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); } 70% { transform: scale(1.1); box-shadow: 0 0 0 5px rgba(220, 53, 69, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); } }
            .sub-efisiensi { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
            .sub-item { background: #f8f9fa; border: 1px solid #eee; border-radius: 6px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .sub-item-header { font-size: 0.9rem; font-weight: 600; color: #222; padding-bottom: 0.25rem; border-bottom: 2px solid #e0e0e0; }
            .calc-details { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #555; background: #fff; padding: 0.5rem; border-radius: 4px; border: 1px solid #e0e0e0; display: flex; flex-direction: column; gap: 0.4rem; }
            .calc-row { display: flex; justify-content: space-between; }
            .calc-formula { margin-top: 0.2rem; padding-top: 0.4rem; border-top: 1px dashed #d0d0d0; display: flex; justify-content: space-between; align-items: center; }
            @media (max-width: 768px) {
                .diagram-grid { grid-template-columns: 1fr; gap: 1.5rem; }
            }
            @media (max-width: 600px) {
                .efisiensi-header { grid-template-columns: 1fr auto auto; grid-template-areas: "title value chevron" "bar bar bar"; gap: 0.5rem; }
                .diagram-card .efisiensi-header { grid-template-columns: 1fr; grid-template-areas: "title"; }
                .efisiensi-title { grid-area: title; } .efisiensi-value { grid-area: value; } .chevron { grid-area: chevron; } .progress-track { grid-area: bar; margin-top: 0.25rem; }
                .sub-efisiensi { grid-template-columns: 1fr; }
            }
        `;
        document.head.appendChild(style);
    }

    parentSection.insertAdjacentElement('afterend', section);

    const fc = parseFloat(inputData?.material?.fc) || 30;
    const fy = parseFloat(inputData?.material?.fy) || 400;
    const b = parseFloat(inputData?.dimensi?.b) || 400;
    const h = parseFloat(inputData?.dimensi?.h) || 400;
    
    const isEval = inputData?.mode === 'evaluasi';
    const d_tul = parseFloat(isEval ? (inputData?.tulangan?.d_tul || inputData?.tulangan?.d) : (rekap?.tulangan?.D || data?.D)) || 16;
    const d_begel = parseFloat(isEval ? (inputData?.tulangan?.phi_tul || inputData?.tulangan?.phi) : data?.phi) || 10;

    const Pu = parseFloat(inputData?.beban?.pu) || 0;
    const Mux = parseFloat(inputData?.beban?.mux) || 0;
    const Muy = parseFloat(inputData?.beban?.muy) || 0;

    setTimeout(() => {
        const kurvaX = generateKurvaInteraksi(fc, fy, b, h, d_tul, d_begel, "X");
        const kurvaY = generateKurvaInteraksi(fc, fy, h, b, d_tul, d_begel, "Y");

        drawDiagramInteraksi('canvasInteraksiX', 'X', kurvaX, { Pu: Pu, Mu: Mux });
        drawDiagramInteraksi('canvasInteraksiY', 'Y', kurvaY, { Pu: Pu, Mu: Muy });
    }, 50);
}

function drawDiagramInteraksi(canvasId, arah, dataKurva, beban) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !dataKurva) return;
    
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    
    const paddingLeft = 70;
    const paddingBottom = 60; 
    const paddingTop = 30;
    const paddingRight = 40;
    
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    let maxPn = 0;
    let maxMn = 0;
    
    for (let i = 1; i <= 8; i++) {
        const titik = dataKurva[`rho_${i}_persen`];
        if (!titik) continue;
        titik.forEach(p => {
            if (p.phi_Pn > maxPn) maxPn = p.phi_Pn;
            if (p.phi_Mn > maxMn) maxMn = p.phi_Mn;
        });
    }

    maxPn = Math.ceil(maxPn / 1000) * 1000 + 500;
    maxMn = Math.ceil(maxMn / 100) * 100 + 100;
    
    if(maxPn === 500) maxPn = 3000;
    if(maxMn === 100) maxMn = 500;

    const scaleX = (val) => paddingLeft + (val / maxMn) * chartW;
    const scaleY = (val) => h - paddingBottom - (val / maxPn) * chartH;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const gridCols = 5;
    const gridRows = 5;
    
    for (let i = 0; i <= gridCols; i++) {
        let x = paddingLeft + (chartW / gridCols) * i;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, h - paddingBottom);
        ctx.stroke();
    }
    for (let i = 0; i <= gridRows; i++) {
        let y = paddingTop + (chartH / gridRows) * i;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(w - paddingRight, y);
        ctx.stroke();
    }
    ctx.setLineDash([]); 

    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop);
    ctx.lineTo(paddingLeft, h - paddingBottom); 
    ctx.lineTo(w - paddingRight, h - paddingBottom); 
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (let i = 0; i <= gridCols; i++) {
        let x = paddingLeft + (chartW / gridCols) * i;
        let valM = Math.round((maxMn / gridCols) * i);
        ctx.beginPath();
        ctx.moveTo(x, h - paddingBottom);
        ctx.lineTo(x, h - paddingBottom + 5);
        ctx.stroke();
        ctx.fillText(valM.toString(), x, h - paddingBottom + 8);
    }
    
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= gridRows; i++) {
        let y = h - paddingBottom - (chartH / gridRows) * i;
        let valP = Math.round((maxPn / gridRows) * i);
        ctx.beginPath();
        ctx.moveTo(paddingLeft - 5, y);
        ctx.lineTo(paddingLeft, y);
        ctx.stroke();
        ctx.fillText(valP.toString(), paddingLeft - 8, y);
    }

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelX = (arah === 'X') ? 'Mux' : 'Muy';
    ctx.fillText(`Momen ∅Mn / ${labelX} (kNm)`, paddingLeft + (chartW / 2), h - 20);
    
    ctx.save();
    ctx.translate(20, paddingTop + (chartH / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Beban Aksial ∅Pn / Pu (kN)`, 0, 0);
    ctx.restore();

    for (let i = 1; i <= 8; i++) {
        const titikArray = dataKurva[`rho_${i}_persen`];
        if (!titikArray || titikArray.length === 0) continue;

        ctx.beginPath();
        titikArray.forEach((p, index) => {
            const px = scaleX(p.phi_Mn);
            const py = scaleY(p.phi_Pn);
            
            if (index === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });

        ctx.strokeStyle = getColorForEfficiency(100 - ((i - 1) / 7) * 100);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    if (beban && beban.Pu !== undefined && beban.Mu !== undefined) {
        const loadX = scaleX(beban.Mu);
        const loadY = scaleY(beban.Pu);
        
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, loadY);
        ctx.lineTo(loadX, loadY);
        ctx.lineTo(loadX, h - paddingBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(loadX, loadY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`(${beban.Mu}, ${beban.Pu})`, loadX + 8, loadY - 5);
    }
}

// ===========================================================================
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
            const nx = parseFloat(tulangan.nx_tul || tulangan.nx) || 0;
            const ny = parseFloat(tulangan.ny_tul || tulangan.ny) || 0;
            jumlahTulangan = Math.max(0, nx + ny - 4) || null;
            console.log(`📐 Penampang evaluasi: nx=${nx}, ny=${ny}, total batang = ${jumlahTulangan}D${D}`);
        } else {
            jumlahTulangan = data.hasilTulangan?.n_terpakai || 
                             result.rekap?.tulangan?.n_terpakai || null;
        }

        const m = data.m || null;

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

function updateLayoutForKolom() {
    const lapanganCard = document.querySelector('.penampang-card:nth-child(2)');
    if (lapanganCard) {
        lapanganCard.style.display = 'none';
    }
    
    const penampangSection = document.querySelector('.penampang-section');
    if (penampangSection) {
        const title = penampangSection.querySelector('h2');
        if (title) {
            title.textContent = 'PENAMPANG KOLOM';
        }
        
        const penampangContainer = penampangSection.querySelector('.penampang-container');
        if (penampangContainer) {
            penampangContainer.style.gridTemplateColumns = '1fr';
            penampangContainer.style.maxWidth = '100%';
        }
    }
    
    const tumpuanCard = document.querySelector('.penampang-card:first-child');
    if (tumpuanCard) {
        const title = tumpuanCard.querySelector('h3');
        if (title) {
            title.textContent = 'Penampang Kolom';
        }
        tumpuanCard.style.gridColumn = '1 / -1';
        tumpuanCard.style.width = '100%';
        tumpuanCard.style.maxWidth = '100%';
    }
    
    const cadButton = document.querySelector('.btn.primary[onclick="exportCAD()"]');
    if (cadButton) {
        cadButton.textContent = 'Copy ke CAD';
        cadButton.setAttribute('onclick', 'exportCADKolom()');
    }
}

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

window.renderKolomReport = renderKolomReport;
window.exportCADKolom = exportCADKolom;
window.updateReportTitle = updateReportTitle;