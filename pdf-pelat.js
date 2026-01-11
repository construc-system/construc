(function() {
    let resultData;

    function setData(data) {
        resultData = data;
    }

    // ==============================================
    // FUNGSI BARU: Cek Status Pelat Dinamis
    // ==============================================
    function cekStatusPelat() {
        const kontrol = getData('kontrol', {});
        const lentur = kontrol.lentur || {};
        const bagi = kontrol.bagi || {};
        
        let semuaAman = true;
        
        // Cek kontrol lentur arah X
        if (lentur.arahX) {
            if (!lentur.arahX.K_aman || !lentur.arahX.Md_aman || !lentur.arahX.As_terpasang_aman) {
                semuaAman = false;
            }
        }
        
        // Cek kontrol lentur arah Y
        if (lentur.arahY) {
            if (!lentur.arahY.K_aman || !lentur.arahY.Md_aman || !lentur.arahY.As_terpasang_aman) {
                semuaAman = false;
            }
        }
        
        // Cek kontrol tulangan bagi arah X
        if (bagi.arahX) {
            if (!bagi.arahX.As_aman || !bagi.arahX.As_terpasang_aman) {
                semuaAman = false;
            }
        }
        
        // Cek kontrol tulangan bagi arah Y
        if (bagi.arahY) {
            if (!bagi.arahY.As_aman || !bagi.arahY.As_terpasang_aman) {
                semuaAman = false;
            }
        }
        
        return semuaAman ? 'aman' : 'tidak aman';
    }

    // Fungsi helper untuk mengambil data dengan fallback ke N/A
    function getData(path, defaultValue = 'N/A') {
        try {
            const keys = path.split('.');
            let value = resultData;
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return defaultValue;
                }
            }
            return value !== undefined && value !== null ? value : defaultValue;
        } catch (error) {
            console.warn(`Error getting data for path ${path}:`, error);
            return defaultValue;
        }
    }

    // Fungsi untuk memformat angka
    function formatNumber(num, decimals = 2) {
        if (num === null || num === undefined || num === 'N/A' || isNaN(num)) return 'N/A';
        const numFloat = parseFloat(num);
        
        if (decimals === 0) {
            return Math.round(numFloat).toString();
        }
        
        return numFloat.toFixed(decimals);
    }

    // Fungsi untuk membuat tabel 3 kolom
    function createThreeColumnTable(rows, withStatus = false, isDataTable = false) {
        let html = '<table class="three-col-table">';
        
        if (isDataTable) {
            html += '<tr>';
            html += '<th class="col-param">Parameter</th>';
            html += '<th class="col-value" style="text-align: center">Data</th>';
            html += '<th class="col-unit" style="text-align: center">Satuan</th>';
            html += '</tr>';
        } else {
            html += '<tr>';
            html += '<th class="col-param">Parameter Perhitungan</th>';
            html += '<th class="col-value" style="text-align: center">Hasil</th>';
            html += '<th class="col-unit" style="text-align: center">Satuan</th>';
            html += '</tr>';
        }
        
        rows.forEach(row => {
            const isHeader = row.parameter.includes('<strong>') && !row.hasil;
            const rowClass = isHeader ? 'header-row' : '';
            
            if (row.isFullRow) {
                html += `
                    <tr class="${rowClass}">
                        <td class="col-full-width" colspan="3" style="text-align: center;">
                            ${row.parameter}
                        </td>
                    </tr>
                `;
            } else if (row.isStatus && withStatus) {
                html += `
                    <tr class="${rowClass}">
                        <td class="col-param">${row.parameter}</td>
                        <td class="col-status-merged" colspan="2" style="text-align: center">
                            ${row.statusHtml}
                        </td>
                    </tr>
                `;
            } else if (row.isComparison && withStatus) {
                html += `
                    <tr class="${rowClass}">
                        <td class="col-param rumus-kondisi">${row.parameter}</td>
                        <td class="col-status-merged" colspan="2" style="text-align: center">
                            ${row.statusHtml}
                        </td>
                    </tr>
                `;
            } else {
                const hasilTampilan = row.hasilHtml || row.hasil || '';
                const satuanTampilan = row.satuan || '';
                html += `
                    <tr class="${rowClass}">
                        <td class="col-param">${row.parameter}</td>
                        <td class="col-value" style="text-align: center">${hasilTampilan}</td>
                        <td class="col-unit" style="text-align: center">${satuanTampilan}</td>
                    </tr>
                `;
            }
        });
        
        html += '</table>';
        return html;
    }

    // Fungsi untuk membuat tabel 2 kolom
    function createTwoColumnTable(rows) {
        let html = '<table class="two-col-table">';
        html += '<tr>';
        html += '<th class="col-param-2">Parameter</th>';
        html += '<th class="col-status-2" style="text-align: center">Status</th>';
        html += '</tr>';
        
        rows.forEach(row => {
            if (row.isFullRow) {
                html += `
                    <tr>
                        <td class="col-full-width" colspan="2" style="text-align: center;">
                            ${row.parameter}
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td class="col-param-2">${row.parameter}</td>
                        <td class="col-status-2" style="text-align: center">${row.statusHtml}</td>
                    </tr>
                `;
            }
        });
        
        html += '</table>';
        return html;
    }
    
    // Fungsi untuk membuat tabel Data Beban Pelat
    function createBebanTable() {
        const bebanData = getData('inputData.beban', {});
        const bebanMode = getData('inputData.beban.mode', 'auto');
        
        let rows = [];
        
        if (bebanMode === 'manual') {
            const manual = bebanData.manual || {};
            rows = [
                { parameter: "<strong>Beban Manual</strong>", hasil: "", satuan: "" },
                { parameter: "$M_u$ (Momen terfaktor)", hasil: formatNumber(manual.mu || 'N/A'), satuan: "kNm/m" },
                { parameter: "Jenis Tumpuan", hasil: manual.tumpuan_type || 'N/A', satuan: "-" }
            ];
        } else {
            const auto = bebanData.auto || {};
            const tabelData = getData('data.tabel', {});
            const jenisPelat = tabelData.jenisPelat === 'satu_arah' ? 'Satu Arah' : 'Dua Arah';
            
            rows = [
                { parameter: "<strong>Beban Auto</strong>", hasil: "", satuan: "" },
                { parameter: "$q_u$ (Beban terfaktor)", hasil: formatNumber(auto.qu || 'N/A'), satuan: "kN/m²" },
                { parameter: "Tipe Tumpuan", hasil: auto.tumpuan_type || 'N/A', satuan: "-" },
                { parameter: "Jenis Tumpuan", hasil: jenisPelat, satuan: "-" }
            ];
        }
        
        return createThreeColumnTable(rows, false, true);
    }
    
    // Fungsi untuk membuat tabel perhitungan tulangan pokok pelat
    function createTulanganPokokTable(data, arah, d, fc, fy, D, h, mode) {
        const b = 1000; // lebar per meter
        const phi = 0.9;
        
        const rows = [
            { parameter: `$\\displaystyle K = \\frac{M_u}{\\phi b d^2}$`, hasil: formatNumber(data?.K), satuan: 'MPa' },
            { parameter: `$\\displaystyle a = \\left(1 - \\sqrt{1 - \\frac{2K}{0.85 f'_c}}\\right) d$`, hasil: formatNumber(data?.a), satuan: 'mm' },
            { parameter: `$\\displaystyle A_{s1} = \\frac{0.85 f'_c a b}{f_y}$`, hasil: formatNumber(data?.As1), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle A_{s2} = \\frac{\\sqrt{f'_c}}{4f_y} b d$`, hasil: formatNumber(data?.As2), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle A_{s3} = \\frac{1.4}{f_y} b d$`, hasil: formatNumber(data?.As3), satuan: 'mm²/m' },
            { parameter: `$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$`, hasil: formatNumber(data?.AsDigunakan), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle s_1 = \\frac{0.25 \\pi D^2 \\times b}{A_{s,perlu}}$`, hasil: formatNumber(data?.s1), satuan: 'mm' },
            { parameter: `$s_2 = ${arah === 'X' ? '2h' : '3h'} = ${arah === 'X' ? 2*h : 3*h}$`, hasil: formatNumber(data?.s2), satuan: 'mm' },
            { parameter: `$s_3 = 450$`, hasil: formatNumber(data?.s3), satuan: 'mm' },
            { parameter: `$s_{maks} = \\min(s_1, s_2, s_3)$`, hasil: formatNumber(Math.min(data?.s1 || Infinity, data?.s2 || Infinity, data?.s3 || Infinity)), satuan: 'mm' },
            { parameter: `$s_{terpasang}$ (dibulatkan kelipatan 25)`, hasil: formatNumber(data?.sDigunakan, 0), satuan: 'mm' },
            { parameter: `$\\displaystyle A_{s,terpasang} = \\frac{0.25 \\pi D^2 \\times b}{s_{terpasang}}$`, hasil: formatNumber(data?.AsTerpasang, 1), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle M_n = A_{s,terpasang} \\times f_y \\times (d - a/2)$`, hasil: formatNumber(data?.Mn), satuan: 'kNm/m' },
            { parameter: `$\\displaystyle M_d = \\phi \\times M_n$`, hasil: formatNumber(data?.Md), satuan: 'kNm/m' },
            { parameter: `$M_d \\ge M_u$`, isStatus: true, statusHtml: `<span class="${data?.Md >= data?.Mu ? 'status-aman' : 'status-tidak-aman'}">${data?.Md >= data?.Mu ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `$A_{s,terpasang} \\ge A_{s,perlu}$`, isStatus: true, statusHtml: `<span class="${data?.AsTerpasang >= data?.AsDigunakan ? 'status-aman' : 'status-tidak-aman'}">${data?.AsTerpasang >= data?.AsDigunakan ? 'AMAN' : 'TIDAK AMAN'}</span>` }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    // Fungsi untuk membuat tabel perhitungan tulangan bagi pelat
    function createTulanganBagiTable(data, arah, b, h, fc, fy, Db, mode) {
        const rows = [
            { parameter: `$\\displaystyle A_{sb1} = \\frac{A_{s,pokok}}{5}$`, hasil: formatNumber(data?.Asb1), satuan: 'mm²/m' },
            { parameter: `$A_{sb2} = ${fy <= 350 ? '0.002' : fy < 420 ? `(0.002 - (${fy} - 350)/350000)` : '0.0018 × (420/fy)'} \\times b \\times h$`, hasil: formatNumber(data?.Asb2), satuan: 'mm²/m' },
            { parameter: `$A_{sb3} = 0.0014 \\times b \\times h$`, hasil: formatNumber(data?.Asb3), satuan: 'mm²/m' },
            { parameter: `$A_{sb,perlu} = \\max(A_{sb1}, A_{sb2}, A_{sb3})$`, hasil: formatNumber(data?.AsbDigunakan), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle s_1 = \\frac{0.25 \\pi D_b^2 \\times 1000}{A_{sb,perlu}}$`, hasil: formatNumber(data?.s1), satuan: 'mm' },
            { parameter: `$s_2 = 5h = ${5*h}$`, hasil: formatNumber(data?.s2), satuan: 'mm' },
            { parameter: `$s_3 = 450$`, hasil: formatNumber(data?.s3), satuan: 'mm' },
            { parameter: `$s_{maks} = \\min(s_1, s_2, s_3)$`, hasil: formatNumber(Math.min(data?.s1 || Infinity, data?.s2 || Infinity, data?.s3 || Infinity)), satuan: 'mm' },
            { parameter: `$s_{terpasang}$ (dibulatkan kelipatan 25)`, hasil: formatNumber(data?.sDigunakan, 0), satuan: 'mm' },
            { parameter: `$\\displaystyle A_{sb,terpasang} = \\frac{0.25 \\pi D_b^2 \\times 1000}{s_{terpasang}}$`, hasil: formatNumber(data?.AsbTerpasang, 1), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle A_{v,u} = \\frac{\\pi D_b^2 \\times s}{4 \\times 1000}$`, hasil: formatNumber(data?.Av_u, 4), satuan: 'mm²/mm' },
            { parameter: `$A_{sb,terpasang} \\ge A_{sb,perlu}$`, isStatus: true, statusHtml: `<span class="${data?.AsbTerpasang >= data?.AsbDigunakan ? 'status-aman' : 'status-tidak-aman'}">${data?.AsbTerpasang >= data?.AsbDigunakan ? 'AMAN' : 'TIDAK AMAN'}</span>` }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    // Fungsi untuk membuat tabel rekapitulasi pelat
    function createRekapitulasiPelatTable() {
        const rekap = getData('rekap.formatted', {});
        
        let html = '<table class="rekap-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th class="rekap-col-parameter">Parameter</th>';
        html += '<th class="rekap-col-nilai">Nilai</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        html += '<tr>';
        html += '<td class="rekap-col-parameter"><strong>Jenis Pelat</strong></td>';
        html += '<td class="rekap-col-nilai text-center">' + (rekap.jenis_pelat || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-parameter"><strong>Dimensi Pelat (Lx × Ly × h)</strong></td>';
        html += '<td class="rekap-col-nilai text-center">' + (rekap.dimensi || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-parameter"><strong>Rasio Ly/Lx</strong></td>';
        html += '<td class="rekap-col-nilai text-center">' + (rekap.rasio_ly_lx || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-parameter"><strong>Tulangan Pokok Arah X</strong></td>';
        html += '<td class="rekap-col-nilai text-center">' + (rekap.tulangan_pokok_x || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-parameter"><strong>Tulangan Pokok Arah Y</strong></td>';
        html += '<td class="rekap-col-nilai text-center">' + (rekap.tulangan_pokok_y || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-parameter"><strong>Tulangan Bagi Arah X</strong></td>';
        html += '<td class="rekap-col-nilai text-center">' + (rekap.tulangan_bagi_x || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-parameter"><strong>Tulangan Bagi Arah Y</strong></td>';
        html += '<td class="rekap-col-nilai text-center">' + (rekap.tulangan_bagi_y || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '</tbody>';
        html += '</table>';
        return html;
    }

    // ==============================================
    // FUNGSI BARU: Kesimpulan Fleksibel untuk Pelat
    // ==============================================
    function generateDynamicConclusion() {
        // Hitung status pelat secara dinamis
        const statusPelat = cekStatusPelat();
        
        const dimensi = getData('inputData.dimensi', {});
        const material = getData('inputData.material', {});
        const tulangan = getData('inputData.tulangan', {});
        const rekap = getData('rekap.formatted', {});
        
        // Ambil semua status kontrol
        const kontrol = getData('kontrol', {});
        const lentur = kontrol.lentur || {};
        const bagi = kontrol.bagi || {};
        
        // Analisis status per komponen
        let masalah = [];
        let rekomendasi = [];
        
        // Analisis Lentur Arah X
        if (lentur.arahX) {
            const detail = lentur.arahX.detail || {};
            if (!lentur.arahX.K_aman) {
                masalah.push(`<span class="problem-item">• Kontrol K tidak aman pada arah X (K = ${formatNumber(detail.K)} > K_maks = ${formatNumber(detail.Kmaks)})</span>`);
            }
            if (!lentur.arahX.Md_aman) {
                masalah.push(`<span class="problem-item">• Kapasitas momen tidak cukup pada arah X (M_d = ${formatNumber(detail.Md)} kNm/m < M_u = ${formatNumber(detail.Mu)} kNm/m)</span>`);
            }
            if (!lentur.arahX.As_terpasang_aman) {
                masalah.push(`<span class="problem-item">• Luas tulangan terpasang tidak mencukupi pada arah X (A_s,terpasang = ${formatNumber(detail.As_terpasang)} mm²/m < A_s,perlu = ${formatNumber(detail.As_dibutuhkan)} mm²/m)</span>`);
            }
        }
        
        // Analisis Lentur Arah Y
        if (lentur.arahY) {
            const detail = lentur.arahY.detail || {};
            if (!lentur.arahY.K_aman) {
                masalah.push(`<span class="problem-item">• Kontrol K tidak aman pada arah Y (K = ${formatNumber(detail.K)} > K_maks = ${formatNumber(detail.Kmaks)})</span>`);
            }
            if (!lentur.arahY.Md_aman) {
                masalah.push(`<span class="problem-item">• Kapasitas momen tidak cukup pada arah Y (M_d = ${formatNumber(detail.Md)} kNm/m < M_u = ${formatNumber(detail.Mu)} kNm/m)</span>`);
            }
            if (!lentur.arahY.As_terpasang_aman) {
                masalah.push(`<span class="problem-item">• Luas tulangan terpasang tidak mencukupi pada arah Y (A_s,terpasang = ${formatNumber(detail.As_terpasang)} mm²/m < A_s,perlu = ${formatNumber(detail.As_dibutuhkan)} mm²/m)</span>`);
            }
        }
        
        // Analisis Tulangan Bagi
        if (bagi.arahX && !bagi.arahX.As_terpasang_aman) {
            masalah.push(`<span class="problem-item">• Tulangan bagi arah X tidak memenuhi persyaratan minimum</span>`);
        }
        if (bagi.arahY && !bagi.arahY.As_terpasang_aman) {
            masalah.push(`<span class="problem-item">• Tulangan bagi arah Y tidak memenuhi persyaratan minimum</span>`);
        }
        
        // Rekomendasi berdasarkan masalah
        if (masalah.length > 0) {
            rekomendasi.push("Perlu penambahan atau perubahan tulangan pokok");
            rekomendasi.push("Pertimbangkan untuk menambah jumlah atau diameter tulangan");
            rekomendasi.push("Evaluasi ulang dimensi pelat jika masalah berlanjut");
        } else {
            rekomendasi.push(`Gunakan tulangan pokok D${tulangan.d} dengan spasi ${rekap.tulangan_pokok_x?.split('-')[1] || 'N/A'} mm`);
            rekomendasi.push(`Gunakan tulangan bagi D${tulangan.db} dengan spasi ${rekap.tulangan_bagi_x?.split('-')[1] || 'N/A'} mm`);
            rekomendasi.push(`Pastikan mutu beton mencapai f'c = ${material.fc || 'N/A'} MPa`);
            rekomendasi.push(`Pastikan mutu baja mencapai fy = ${material.fy || 'N/A'} MPa`);
        }
        
        // Buat HTML kesimpulan dinamis
        let conclusionHTML = `
            <div class="section-group">
                <h3>3. Kesimpulan</h3>
                <div class="conclusion-box">
                    <h4 style="text-align: center; ${statusPelat === 'aman' ? 'color: #155724;' : 'color: #721c24;'} margin-bottom: 8px;">
                        <strong>STRUKTUR PELAT BETON BERTULANG ${statusPelat === 'aman' ? 'AMAN' : 'TIDAK AMAN'}</strong>
                    </h4>
        `;
        
        // Ringkasan status
        if (statusPelat === 'aman') {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p>
                <p>Struktur pelat ${rekap.jenis_pelat || 'N/A'} dengan dimensi ${dimensi.lx || 'N/A'} × ${dimensi.ly || 'N/A'} × ${dimensi.h || 'N/A'} mm memenuhi semua persyaratan SNI 2847:2019 untuk:</p>
                <ul>
                    <li>Kuat lentur arah X dan Y</li>
                    <li>Persyaratan tulangan pokok minimum</li>
                    <li>Persyaratan tulangan bagi/susut</li>
                    <li>Persyaratan spasi maksimum tulangan</li>
                </ul>
            `;
        } else {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-tidak-aman">TIDAK AMAN - PERLU PERBAIKAN DESAIN</span></p>
                <p>Ditemukan masalah pada beberapa aspek desain:</p>
                <div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                    ${masalah.length > 0 ? masalah.join('') : '<p class="problem-item">• Terdapat masalah pada satu atau lebih kontrol keamanan</p>'}
                </div>
            `;
        }
        
        // Rekomendasi
        conclusionHTML += `
            <p style="margin-top: 8px;"><strong>Rekomendasi:</strong></p>
            <div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f0f8ff; border-radius: 4px;">
                ${rekomendasi.map(r => `<p class="recommendation-item">• ${r}</p>`).join('')}
            </div>
        `;
        
        // Catatan teknis
        conclusionHTML += `
            <p style="margin-top: 8px; font-size: 10pt; color: #666;">
                <strong>Catatan:</strong> Hasil perhitungan ini berdasarkan SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung) 
                dan metode perencanaan pelat dua arah. Pastikan semua aspek konstruksi sesuai dengan spesifikasi teknis 
                dan dilakukan pengawasan yang memadai.
            </p>
        `;
        
        conclusionHTML += `
                </div>
            </div>
        `;
        
        return conclusionHTML;
    }
    
    // ==============================================
    // FUNGSI UTAMA: Generate Content Blocks untuk Pelat
    // ==============================================
    function generateContentBlocks() {
        const blocks = [];
        
        // Gunakan status pelat yang dihitung secara dinamis
        const statusPelatDinamis = cekStatusPelat();
        
        blocks.push(`
            <h1>LAPORAN PERHITUNGAN PELAT BETON BERTULANG</h1>
            <div class="header-info">
                <div>
                    <span><strong>Mode:</strong> ${getData('mode', 'N/A').toUpperCase()}</span>
                    <span><strong>Modul:</strong> ${getData('module', 'N/A').toUpperCase()}</span>
                </div>
                <div>
                    <span><strong>Tanggal:</strong> ${formatTimestampFull(getData('timestamp'))}</span>
                    <span><strong>Status:</strong> <span class="${statusPelatDinamis === 'aman' ? 'status-aman' : 'status-tidak-aman'}">${statusPelatDinamis.toUpperCase()}</span></span>
                </div>
            </div>
            <h2>A. DATA INPUT DAN PARAMETER</h2>
        `);
        
        // Data Material dan Dimensi (GABUNGAN)
        const dimensiMaterialRows = [
            { parameter: "$L_x$ (Panjang arah X)", hasil: getData('inputData.dimensi.lx'), satuan: 'mm' },
            { parameter: "$L_y$ (Panjang arah Y)", hasil: getData('inputData.dimensi.ly'), satuan: 'mm' },
            { parameter: "$h$ (Tebal pelat)", hasil: getData('inputData.dimensi.h'), satuan: 'mm' },
            { parameter: "$s_b$ (Selimut beton)", hasil: getData('inputData.dimensi.sb'), satuan: 'mm' },
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: getData('inputData.material.fc'), satuan: 'MPa' },
            { parameter: "$f_y$ (Tegangan leleh tulangan)", hasil: getData('inputData.material.fy'), satuan: 'MPa' }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Data Material dan Dimensi</h3>
                ${createThreeColumnTable(dimensiMaterialRows, false, true)}
            </div>
        `);
        
        // Data Beban
        blocks.push(`
            <div class="section-group">
                <h3>2. Data Beban</h3>
                ${createBebanTable()}
            </div>
        `);
        
        // Data Tulangan
        const tulanganRows = [
            { parameter: "$D$ (Diameter tulangan pokok)", hasil: getData('inputData.tulangan.d'), satuan: 'mm' },
            { parameter: "$D_b$ (Diameter tulangan bagi)", hasil: getData('inputData.tulangan.db'), satuan: 'mm' },
            { parameter: "$s$ (Spasi tulangan pokok - input evaluasi)", hasil: getData('inputData.tulangan.s'), satuan: 'mm' },
            { parameter: "$s_b$ (Spasi tulangan bagi - input evaluasi)", hasil: getData('inputData.tulangan.sb'), satuan: 'mm' }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>3. Data Tulangan</h3>
                ${createThreeColumnTable(tulanganRows, false, true)}
            </div>
        `);
        
        // Parameter Perhitungan
        const data = getData('data', {});
        const parameter = data.parameter || {};
        const geometri = data.geometri || {};
        
        const parameterRows = [
            { parameter: "$\\displaystyle \\text{Rasio } L_y/L_x$", hasil: formatNumber(geometri.rasioLyLx, 3), satuan: '-' },
            { parameter: "$\\displaystyle S_n = \\max(25, 1.5D)$", hasil: formatNumber(parameter.Sn), satuan: 'mm' },
            { parameter: "$\\displaystyle d_{s} = s_b + D/2$ (dibulatkan kelipatan 5)", hasil: formatNumber(parameter.ds), satuan: 'mm' },
            { parameter: "$\\displaystyle d = h - d_{s}$ (tinggi efektif arah X)", hasil: formatNumber(parameter.d), satuan: 'mm' },
            { parameter: "$\\displaystyle d_{s2} = S_n + D$ (dibulatkan kelipatan 5)", hasil: formatNumber(parameter.ds2), satuan: 'mm' },
            { parameter: "$\\displaystyle d_2 = h - d_{s2}$ (tinggi efektif arah Y)", hasil: formatNumber(parameter.d2), satuan: 'mm' },
            { parameter: "$\\displaystyle \\beta_1 = $", hasil: formatNumber(parameter.beta1, 3), satuan: '-' },
            { parameter: "$\\displaystyle K_{maks} = \\dfrac{382.5 \\beta_1 f'_c (600 + f_y - 225 \\beta_1)}{(600 + f_y)^2}$", hasil: formatNumber(parameter.Kmaks, 3), satuan: 'MPa' }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>4. Parameter Perhitungan</h3>
                ${createThreeColumnTable(parameterRows)}
            </div>
        `);
        
        // Informasi Tabel Momen (hanya untuk mode auto)
        const bebanMode = getData('inputData.beban.mode', 'auto');
        const tabel = data.tabel || {};
        
        if (bebanMode === 'auto') {
            const tabelRows = [
                { parameter: "<strong>Informasi Tabel Momen</strong>", hasil: "", satuan: "" },
                { parameter: "Kondisi Tumpuan", hasil: tabel.kondisi || 'N/A', satuan: '-' },
                { parameter: "Huruf Tumpuan", hasil: tabel.tumpuanHuruf || 'N/A', satuan: '-' },
                { parameter: "Jenis Pelat", hasil: tabel.jenisPelat === 'satu_arah' ? 'Satu Arah' : 'Dua Arah', satuan: '-' },
                { parameter: "$C_{tx}$ (Koefisien momen tumpuan X)", hasil: formatNumber(tabel.Ctx, 3), satuan: '-' },
                { parameter: "$C_{lx}$ (Koefisien momen lapangan X)", hasil: formatNumber(tabel.Clx, 3), satuan: '-' },
                { parameter: "$C_{ty}$ (Koefisien momen tumpuan Y)", hasil: formatNumber(tabel.Cty, 3), satuan: '-' },
                { parameter: "$C_{ly}$ (Koefisien momen lapangan Y)", hasil: formatNumber(tabel.Cly, 3), satuan: '-' }
            ];
            
            blocks.push(`
                <div class="section-group">
                    <h3>5. Koefisien Momen dari Tabel</h3>
                    ${createThreeColumnTable(tabelRows, false, true)}
                </div>
            `);
        }
        
        // Momen Hasil Perhitungan
        const momen = data.momen || {};
        const momenRows = [
            { parameter: "$M_{tx}$ (Momen tumpuan arah X)", hasil: formatNumber(momen.Mtx, 3), satuan: 'kNm/m' },
            { parameter: "$M_{lx}$ (Momen lapangan arah X)", hasil: formatNumber(momen.Mlx, 3), satuan: 'kNm/m' },
            { parameter: "$M_{ty}$ (Momen tumpuan arah Y)", hasil: formatNumber(momen.Mty, 3), satuan: 'kNm/m' },
            { parameter: "$M_{ly}$ (Momen lapangan arah Y)", hasil: formatNumber(momen.Mly, 3), satuan: 'kNm/m' }
        ];
        
        blocks.push(`
            <h2>B. PERHITUNGAN MOMEN DAN TULANGAN</h2>
            <div class="section-group">
                <h3>1. Momen Hasil Perhitungan</h3>
                ${createThreeColumnTable(momenRows, false, true)}
            </div>
        `);
        
        // Tulangan Pokok Arah X
        const tulanganData = data.tulangan || {};
        const pokokX = tulanganData.pokokX || {};
        const pokokY = tulanganData.pokokY || {};
        const bagiX = tulanganData.bagiX || {};
        const bagiY = tulanganData.bagiY || {};
        
        const inputData = getData('inputData', {});
        const fc = inputData.material?.fc || 20;
        const fy = inputData.material?.fy || 300;
        const D = inputData.tulangan?.d || 10;
        const Db = inputData.tulangan?.db || 8;
        const h = inputData.dimensi?.h || 120;
        const mode = inputData.mode || 'evaluasi';
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Tulangan Pokok Arah X</h3>
                <p class="note">Direncanakan untuk momen maksimum arah X: $M_u = ${formatNumber(Math.max(momen.Mtx || 0, momen.Mlx || 0), 3)} \\text{ kNm/m}$</p>
                ${createTulanganPokokTable(pokokX, 'X', parameter.d, fc, fy, D, h, mode)}
            </div>
        `);
        
        // Tulangan Pokok Arah Y
        blocks.push(`
            <div class="section-group">
                <h3>3. Tulangan Pokok Arah Y</h3>
                <p class="note">Direncanakan untuk momen maksimum arah Y: $M_u = ${formatNumber(Math.max(momen.Mty || 0, momen.Mly || 0), 3)} \\text{ kNm/m}$</p>
                ${createTulanganPokokTable(pokokY, 'Y', parameter.d2, fc, fy, D, h, mode)}
            </div>
        `);
        
        // Tulangan Bagi Arah X
        blocks.push(`
            <div class="section-group">
                <h3>4. Tulangan Bagi/Susut Arah X</h3>
                ${createTulanganBagiTable(bagiX, 'X', 1000, h, fc, fy, Db, mode)}
            </div>
        `);
        
        // Tulangan Bagi Arah Y
        blocks.push(`
            <div class="section-group">
                <h3>5. Tulangan Bagi/Susut Arah Y</h3>
                ${createTulanganBagiTable(bagiY, 'Y', 1000, h, fc, fy, Db, mode)}
            </div>
        `);
        
        // Rekapitulasi
        blocks.push(`
            <h2>C. REKAPITULASI HASIL DESAIN</h2>
            <div class="section-group">
                <h3>1. Rekapitulasi Tulangan</h3>
                ${createRekapitulasiPelatTable()}
            </div>
        `);
        
        // Kontrol Keamanan
        const kontrol = getData('kontrol', {});
        const lentur = kontrol.lentur || {};
        const tulanganBagi = kontrol.bagi || {};
        
        const kontrolRows = [
            { 
                parameter: "Kontrol $K$ arah X", 
                statusHtml: `<span class="${lentur.arahX?.K_aman ? 'status-aman' : 'status-tidak-aman'}">${lentur.arahX?.K_aman ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Kontrol $M_d \\ge M_u$ arah X", 
                statusHtml: `<span class="${lentur.arahX?.Md_aman ? 'status-aman' : 'status-tidak-aman'}">${lentur.arahX?.Md_aman ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Kontrol $A_{s,terpasang} \\ge A_{s,perlu}$ arah X", 
                statusHtml: `<span class="${lentur.arahX?.As_terpasang_aman ? 'status-aman' : 'status-tidak-aman'}">${lentur.arahX?.As_terpasang_aman ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Kontrol $K$ arah Y", 
                statusHtml: `<span class="${lentur.arahY?.K_aman ? 'status-aman' : 'status-tidak-aman'}">${lentur.arahY?.K_aman ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Kontrol $M_d \\ge M_u$ arah Y", 
                statusHtml: `<span class="${lentur.arahY?.Md_aman ? 'status-aman' : 'status-tidak-aman'}">${lentur.arahY?.Md_aman ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Kontrol $A_{s,terpasang} \\ge A_{s,perlu}$ arah Y", 
                statusHtml: `<span class="${lentur.arahY?.As_terpasang_aman ? 'status-aman' : 'status-tidak-aman'}">${lentur.arahY?.As_terpasang_aman ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Kontrol tulangan bagi arah X", 
                statusHtml: `<span class="${tulanganBagi.arahX?.As_terpasang_aman ? 'status-aman' : 'status-tidak-aman'}">${tulanganBagi.arahX?.As_terpasang_aman ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Kontrol tulangan bagi arah Y", 
                statusHtml: `<span class="${tulanganBagi.arahY?.As_terpasang_aman ? 'status-aman' : 'status-tidak-aman'}">${tulanganBagi.arahY?.As_terpasang_aman ? 'AMAN' : 'TIDAK AMAN'}</span>`
            }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Ringkasan Kontrol Keamanan</h3>
                ${createTwoColumnTable(kontrolRows)}
            </div>
        `);
        
        // Gunakan fungsi baru untuk kesimpulan dinamis
        blocks.push(generateDynamicConclusion());
        
        // Referensi
        blocks.push(`
            <p class="note" style="margin-top: 10px;">
                <strong>Referensi:</strong> SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung)
            </p>
        `);
        
        return blocks;
    }

    // Fungsi untuk memformat tanggal (sama dengan pdf-balok.js)
    function formatTimestampFull(timestamp) {
        if (!timestamp) {
            const now = new Date();
            const day = now.getDate();
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                               "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const month = monthNames[now.getMonth()];
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${day} ${month} ${year} pukul ${hours}.${minutes}`;
        }
        
        const date = new Date(timestamp);
        const day = date.getDate();
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                           "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${year} pukul ${hours}.${minutes}`;
    }

    // Ekspos fungsi-fungsi yang diperlukan
    window.pelatReport = {
        setData: setData,
        generateContentBlocks: generateContentBlocks,
        cekStatusPelat: cekStatusPelat,
        formatNumber: formatNumber,
        getData: getData,
        formatTimestampFull: formatTimestampFull
    };
})();