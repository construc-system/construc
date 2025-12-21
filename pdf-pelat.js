[file name]: pdf-pelat.js
[file content begin]
(function() {
    let resultData;

    function setData(data) {
        resultData = data;
    }

    // ==============================================
    // FUNGSI BARU: Cek Status Pelat Dinamis
    // ==============================================
    function cekStatusPelat() {
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolBagi = getData('kontrol.bagi', {});
        
        let semuaAman = true;
        
        // Cek kontrol lentur
        if (kontrolLentur) {
            // Cek arah X
            if (!kontrolLentur.arahX || 
                !kontrolLentur.arahX.K_aman || 
                !kontrolLentur.arahX.Md_aman || 
                !kontrolLentur.arahX.As_terpasang_aman) {
                semuaAman = false;
            }
            
            // Cek arah Y
            if (!kontrolLentur.arahY || 
                !kontrolLentur.arahY.K_aman || 
                !kontrolLentur.arahY.Md_aman || 
                !kontrolLentur.arahY.As_terpasang_aman) {
                semuaAman = false;
            }
        }
        
        // Cek kontrol tulangan bagi
        if (kontrolBagi) {
            // Cek arah X
            if (!kontrolBagi.arahX || 
                !kontrolBagi.arahX.As_aman || 
                !kontrolBagi.arahX.As_terpasang_aman) {
                semuaAman = false;
            }
            
            // Cek arah Y
            if (!kontrolBagi.arahY || 
                !kontrolBagi.arahY.As_aman || 
                !kontrolBagi.arahY.As_terpasang_aman) {
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
    function createBebanPelatTable() {
        const inputData = getData('inputData', {});
        const bebanData = inputData.beban || {};
        const dimensi = inputData.dimensi || {};
        
        let rows = [];
        
        if (bebanData.mode === 'manual') {
            // Mode manual
            rows = [
                { parameter: "<strong>Mode Input</strong>", hasil: "", satuan: "" },
                { parameter: "Mode beban", hasil: "Manual", satuan: "" },
                { parameter: "Momen ultimate ($M_u$)", hasil: formatNumber(bebanData.manual?.mu), satuan: "kNm/m" },
                { parameter: "Tipe tumpuan", hasil: bebanData.manual?.tumpuan_type || 'N/A', satuan: "" }
            ];
        } else {
            // Mode auto
            const qu = formatNumber(bebanData.auto?.qu);
            const pattern = bebanData.auto?.pattern_binary || '0000';
            const tumpuanType = bebanData.auto?.tumpuan_type || 'N/A';
            
            rows = [
                { parameter: "<strong>Mode Input</strong>", hasil: "", satuan: "" },
                { parameter: "Mode beban", hasil: "Otomatis (PBI)", satuan: "" },
                { parameter: "Beban terfaktor ($q_u$)", hasil: qu, satuan: "kN/m²" },
                { parameter: "Pola tumpuan (binary)", hasil: pattern, satuan: "" },
                { parameter: "Tipe tumpuan", hasil: tumpuanType, satuan: "" }
            ];
        }
        
        return createThreeColumnTable(rows, false, true);
    }
    
    // Fungsi untuk membuat tabel perhitungan tulangan pokok
    function createTulanganPokokTable(data, arah, status, fc, fy, D, h, d, Mu, b = 1000) {
        const rows = [
            { parameter: "$M_u$", hasil: formatNumber(Mu, 3), satuan: 'kNm/m' },
            { parameter: "$\\displaystyle K = \\frac{M_u}{\\phi b d^2}$", hasil: formatNumber(data.K), satuan: 'MPa' },
            { parameter: "$K \\le K_{maks}$", isStatus: true, statusHtml: `<span class="${status?.K_aman ? 'status-aman' : 'status-tidak-aman'}">${status?.K_aman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\displaystyle a = \\left(1 - \\sqrt{1 - \\frac{2K}{0.85 f'_c}}\\right) d$", hasil: formatNumber(data.a), satuan: 'mm' },
            { parameter: "$\\displaystyle A_{s1} = \\frac{0.85 f'_c a b}{f_y}$", hasil: formatNumber(data.As1), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle A_{s2} = \\frac{\\sqrt{f'_c}}{4f_y} b d$", hasil: formatNumber(data.As2), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle A_{s3} = \\frac{1.4}{f_y} b d$", hasil: formatNumber(data.As3), satuan: 'mm²/m' },
            { parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(data.AsDigunakan), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle s_1 = \\frac{A_s D^2}{A_{s,perlu}}$", hasil: formatNumber(data.s1), satuan: 'mm' },
            { parameter: "$\\displaystyle s_2 = \\begin{cases} 2h & \\text{(dua arah)} \\\\ 3h & \\text{(satu arah)} \\end{cases}$", hasil: formatNumber(data.s2), satuan: 'mm' },
            { parameter: "$s_3 = 450$ mm", hasil: "450", satuan: 'mm' },
            { parameter: "$s = \\min(s_1, s_2, s_3)$", hasil: formatNumber(data.sDigunakan), satuan: 'mm' },
            { parameter: "$A_{s,terpasang} = \\dfrac{\\pi D^2 / 4 \\times 1000}{s}$", hasil: formatNumber(data.AsTerpasang, 1), satuan: 'mm²/m' },
            { parameter: "$A_{s,perlu} \\le A_{s,terpasang}$", isStatus: true, statusHtml: `<span class="${status?.As_terpasang_aman ? 'status-aman' : 'status-tidak-aman'}">${status?.As_terpasang_aman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\displaystyle a = \\frac{A_{s,terpasang} f_y}{0.85 f'_c b}$", hasil: formatNumber(data.a_desain), satuan: 'mm' },
            { parameter: "$\\displaystyle M_n = A_{s,terpasang} f_y (d - a/2)$", hasil: formatNumber(data.Mn, 3), satuan: 'kNm/m' },
            { parameter: "$\\displaystyle M_d = \\phi M_n$", hasil: formatNumber(data.Md, 3), satuan: 'kNm/m' },
            { parameter: "$M_d \\ge M_u$", isStatus: true, statusHtml: `<span class="${status?.Md_aman ? 'status-aman' : 'status-tidak-aman'}">${status?.Md_aman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `<strong>Digunakan Tulangan Pokok ${arah}: D${D}-${formatNumber(data.sDigunakan, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    // Fungsi untuk membuat tabel perhitungan tulangan bagi
    function createTulanganBagiTable(data, arah, status, fc, fy, Db, h, As_pokok, b = 1000) {
        const rows = [
            { parameter: "$A_{s,pokok}$", hasil: formatNumber(As_pokok, 1), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle A_{sb1} = \\frac{A_{s,pokok}}{5}$", hasil: formatNumber(data.Asb1), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle A_{sb2} = \\begin{cases} 0.002bh & (f_y \\le 350) \\\\ \\left[0.002 - \\frac{f_y - 350}{350000}\\right]bh & (350 < f_y < 420) \\\\ 0.0018bh\\frac{420}{f_y} & (f_y \\ge 420) \\end{cases}$", hasil: formatNumber(data.Asb2), satuan: 'mm²/m' },
            { parameter: "$A_{sb3} = 0.0014bh$", hasil: formatNumber(data.Asb3), satuan: 'mm²/m' },
            { parameter: "$A_{sb,perlu} = \\max(A_{sb1}, A_{sb2}, A_{sb3})$", hasil: formatNumber(data.AsbDigunakan), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle s_1 = \\frac{\\pi D_b^2 / 4 \\times 1000}{A_{sb,perlu}}$", hasil: formatNumber(data.s1), satuan: 'mm' },
            { parameter: "$s_2 = 5h$", hasil: formatNumber(data.s2), satuan: 'mm' },
            { parameter: "$s_3 = 450$ mm", hasil: "450", satuan: 'mm' },
            { parameter: "$s = \\min(s_1, s_2, s_3)$", hasil: formatNumber(data.sDigunakan), satuan: 'mm' },
            { parameter: "$A_{sb,terpasang} = \\dfrac{\\pi D_b^2 / 4 \\times 1000}{s}$", hasil: formatNumber(data.AsbTerpasang, 1), satuan: 'mm²/m' },
            { parameter: "$A_{sb,perlu} \\le A_{sb,terpasang}$", isStatus: true, statusHtml: `<span class="${status?.As_terpasang_aman ? 'status-aman' : 'status-tidak-aman'}">${status?.As_terpasang_aman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\displaystyle A_{v,u} = \\frac{\\pi D_b^2 s}{4 \\times 1000}$", hasil: formatNumber(data.Av_u, 4), satuan: 'mm²/mm' },
            { parameter: `<strong>Digunakan Tulangan Bagi ${arah}: D${Db}-${formatNumber(data.sDigunakan, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    // Fungsi untuk membuat tabel rekapitulasi pelat
    function createRekapitulasiPelatTable() {
        const rekap = getData('rekap.formatted', {});
        const jenisPelat = getData('data.tabel.jenisPelat', 'dua_arah');
        const jenisPelatStr = jenisPelat === 'satu_arah' ? 'Pelat Satu Arah' : 'Pelat Dua Arah';
        
        let html = '<table class="rekap-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th class="rekap-col-tulangan" rowspan="2">Jenis Tulangan</th>';
        html += '<th class="rekap-col-tumpuan" colspan="2">Arah X</th>';
        html += '<th class="rekap-col-lapangan" colspan="2">Arah Y</th>';
        html += '</tr>';
        html += '<tr>';
        html += '<th class="rekap-col-tumpuan">Tulangan</th>';
        html += '<th class="rekap-col-tumpuan">Spasi</th>';
        html += '<th class="rekap-col-lapangan">Tulangan</th>';
        html += '<th class="rekap-col-lapangan">Spasi</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        // Info jenis pelat
        html += '<tr class="row-merged">';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle" colspan="5" style="text-align: center;">';
        html += `<strong>${jenisPelatStr}</strong>`;
        html += '</td>';
        html += '</tr>';
        
        // Tulangan pokok
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Pokok</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.tulangan_pokok_x || 'N/A') + '</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + formatNumber(getData('data.tulangan.pokokX.sDigunakan', 'N/A'), 0) + ' mm</td>';
        html += '<td class="rekap-col-lapangan text-center">' + (rekap.tulangan_pokok_y || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + formatNumber(getData('data.tulangan.pokokY.sDigunakan', 'N/A'), 0) + ' mm</td>';
        html += '</tr>';
        
        // Tulangan bagi
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Bagi</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.tulangan_bagi_x || 'N/A') + '</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + formatNumber(getData('data.tulangan.bagiX.sDigunakan', 'N/A'), 0) + ' mm</td>';
        html += '<td class="rekap-col-lapangan text-center">' + (rekap.tulangan_bagi_y || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + formatNumber(getData('data.tulangan.bagiY.sDigunakan', 'N/A'), 0) + ' mm</td>';
        html += '</tr>';
        
        // As terpasang
        html += '<tr class="row-merged">';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle" colspan="5" style="text-align: center;">';
        html += '<strong>Luas Tulangan Terpasang</strong>';
        html += '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Arah X</td>';
        html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (rekap.as_terpasang_x || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center" colspan="2">' + (rekap.asb_terpasang_x || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Arah Y</td>';
        html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (rekap.as_terpasang_y || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center" colspan="2">' + (rekap.asb_terpasang_y || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '</tbody>';
        html += '</table>';
        return html;
    }

    // Fungsi untuk mendapatkan informasi tulangan pelat
    function getTulanganInfoPelat() {
        const inputData = getData('inputData', {});
        const mode = getData('mode', 'evaluasi');
        
        let D = 'N/A';
        let Db = 'N/A';
        
        // Cek di inputData
        if (inputData.tulangan) {
            D = inputData.tulangan.d || 'N/A';
            Db = inputData.tulangan.db || 'N/A';
        }
        
        // Cek di data hasil perhitungan
        if (D === 'N/A') {
            D = getData('rekap.input.tulangan.d', 'N/A');
        }
        if (Db === 'N/A') {
            Db = getData('rekap.input.tulangan.db', 'N/A');
        }
        
        return { D, Db };
    }
    
    // ==============================================
    // FUNGSI BARU: Kesimpulan Fleksibel untuk Pelat
    // ==============================================
    function generateDynamicConclusionPelat() {
        // Hitung status pelat secara dinamis
        const statusPelat = cekStatusPelat();
        
        const dimensi = getData('inputData.dimensi', {});
        const material = getData('inputData.material', {});
        const tulanganInfo = getTulanganInfoPelat();
        
        // Ambil semua status kontrol
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolBagi = getData('kontrol.bagi', {});
        
        // Analisis status per komponen
        let masalah = [];
        let rekomendasi = [];
        
        // Analisis Lentur
        if (kontrolLentur) {
            const lenturProblems = [];
            let lenturCount = 0;
            
            // Cek arah X
            if (kontrolLentur.arahX) {
                if (!kontrolLentur.arahX.K_aman) {
                    lenturProblems.push("Kontrol K tidak aman pada arah X");
                    lenturCount++;
                }
                if (!kontrolLentur.arahX.Md_aman) {
                    lenturProblems.push("Kapasitas momen tidak cukup pada arah X");
                    lenturCount++;
                }
                if (!kontrolLentur.arahX.As_terpasang_aman) {
                    lenturProblems.push("Luas tulangan pokok tidak memadai pada arah X");
                    lenturCount++;
                }
            }
            
            // Cek arah Y
            if (kontrolLentur.arahY) {
                if (!kontrolLentur.arahY.K_aman) {
                    lenturProblems.push("Kontrol K tidak aman pada arah Y");
                    lenturCount++;
                }
                if (!kontrolLentur.arahY.Md_aman) {
                    lenturProblems.push("Kapasitas momen tidak cukup pada arah Y");
                    lenturCount++;
                }
                if (!kontrolLentur.arahY.As_terpasang_aman) {
                    lenturProblems.push("Luas tulangan pokok tidak memadai pada arah Y");
                    lenturCount++;
                }
            }
            
            if (lenturProblems.length > 0) {
                masalah.push(`<strong>Masalah pada tulangan pokok (${lenturCount} masalah):</strong>`);
                masalah.push(...lenturProblems.map(p => `<span class="problem-item">• ${p}</span>`));
                rekomendasi.push("Perlu penambahan atau perubahan tulangan pokok");
                rekomendasi.push("Pertimbangkan untuk mengurangi jarak tulangan pokok");
            }
        }
        
        // Analisis Tulangan Bagi
        if (kontrolBagi) {
            const bagiProblems = [];
            let bagiCount = 0;
            
            // Cek arah X
            if (kontrolBagi.arahX) {
                if (!kontrolBagi.arahX.As_aman) {
                    bagiProblems.push("Tulangan bagi tidak memenuhi syarat minimum pada arah X");
                    bagiCount++;
                }
                if (!kontrolBagi.arahX.As_terpasang_aman) {
                    bagiProblems.push("Luas tulangan bagi tidak memadai pada arah X");
                    bagiCount++;
                }
            }
            
            // Cek arah Y
            if (kontrolBagi.arahY) {
                if (!kontrolBagi.arahY.As_aman) {
                    bagiProblems.push("Tulangan bagi tidak memenuhi syarat minimum pada arah Y");
                    bagiCount++;
                }
                if (!kontrolBagi.arahY.As_terpasang_aman) {
                    bagiProblems.push("Luas tulangan bagi tidak memadai pada arah Y");
                    bagiCount++;
                }
            }
            
            if (bagiProblems.length > 0) {
                masalah.push(`<strong>Masalah pada tulangan bagi (${bagiCount} masalah):</strong>`);
                masalah.push(...bagiProblems.map(p => `<span class="problem-item">• ${p}</span>`));
                rekomendasi.push("Perlu penambahan atau perubahan tulangan bagi");
                rekomendasi.push("Pertimbangkan untuk mengurangi jarak tulangan bagi");
            }
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
        
        // Informasi jenis pelat
        const jenisPelat = getData('data.tabel.jenisPelat', 'dua_arah');
        const jenisPelatStr = jenisPelat === 'satu_arah' ? 'Pelat Satu Arah' : 'Pelat Dua Arah';
        const dimensiPelat = `${dimensi.lx || 'N/A'} × ${dimensi.ly || 'N/A'} mm`;
        const tebal = dimensi.h || 'N/A';
        
        // Ringkasan status
        if (statusPelat === 'aman') {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p>
                <p>Struktur ${jenisPelatStr.toLowerCase()} dengan dimensi ${dimensiPelat} tebal ${tebal} mm memenuhi semua persyaratan untuk:</p>
                <ul>
                    <li>Kuat lentur arah X dan Y</li>
                    <li>Kebutuhan tulangan pokok dan bagi</li>
                    <li>Persyaratan spasi tulangan maksimum</li>
                    <li>Persyaratan detail tulangan minimum</li>
                </ul>
            `;
            
            // Rekomendasi untuk kondisi aman
            rekomendasi = [
                "Gunakan tulangan pokok D" + tulanganInfo.D + " dengan spasi sesuai hasil perhitungan",
                "Gunakan tulangan bagi D" + tulanganInfo.Db + " dengan spasi sesuai hasil perhitungan",
                "Pastikan mutu beton mencapai f'c = " + (material.fc || 'N/A') + " MPa",
                "Pastikan mutu baja mencapai fy = " + (material.fy || 'N/A') + " MPa",
                "Lakukan pengecoran dengan metode yang sesuai standar",
                "Pastikan tulangan dipasang dengan selimut beton yang memadai"
            ];
        } else {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-tidak-aman">TIDAK AMAN - PERLU PERBAIKAN DESAIN</span></p>
                <p>${jenisPelatStr} dengan dimensi ${dimensiPelat} tebal ${tebal} mm ditemukan masalah pada beberapa aspek desain:</p>
                <div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                    ${masalah.length > 0 ? masalah.join('') : '<p class="problem-item">• Terdapat masalah pada satu atau lebih kontrol keamanan</p>'}
                </div>
            `;
            
            // Rekomendasi tambahan untuk kondisi tidak aman
            if (masalah.length === 0) {
                rekomendasi.push("Tinjau kembali dimensi pelat: " + dimensiPelat + " tebal " + tebal + " mm");
                rekomendasi.push("Evaluasi ulang mutu material yang digunakan");
                rekomendasi.push("Pertimbangkan untuk menggunakan tulangan dengan diameter lebih besar");
                rekomendasi.push("Periksa kembali konfigurasi tulangan pokok dan bagi");
            }
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
                <strong>Catatan:</strong> Hasil perhitungan ini berdasarkan PBI 71 N.I-2 (Peraturan Beton Bertulang Indonesia). 
                Pastikan semua aspek konstruksi sesuai dengan spesifikasi teknis dan dilakukan pengawasan yang memadai.
            </p>
        `;
        
        conclusionHTML += `
                </div>
            </div>
        `;
        
        return conclusionHTML;
    }
    
    // ==============================================
    // FUNGSI UTAMA: Generate Content Blocks Pelat
    // ==============================================
    function generateContentBlocksPelat() {
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
        
        const materialDimensiRows = [
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: getData('inputData.material.fc'), satuan: 'MPa' },
            { parameter: "$f_y$ (Tegangan leleh tulangan)", hasil: getData('inputData.material.fy'), satuan: 'MPa' },
            { parameter: "$L_x$ (Bentang pendek)", hasil: getData('inputData.dimensi.lx'), satuan: 'mm' },
            { parameter: "$L_y$ (Bentang panjang)", hasil: getData('inputData.dimensi.ly'), satuan: 'mm' },
            { parameter: "$h$ (Tebal pelat)", hasil: getData('inputData.dimensi.h'), satuan: 'mm' },
            { parameter: "$S_b$ (Selimut beton)", hasil: getData('inputData.dimensi.sb'), satuan: 'mm' },
            { parameter: "$\\lambda$ (Faktor reduksi beban hidup)", hasil: getData('inputData.lanjutan.lambda'), satuan: '-' }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Data Material dan Dimensi</h3>
                ${createThreeColumnTable(materialDimensiRows, false, true)}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Data Beban</h3>
                ${createBebanPelatTable()}
            </div>
        `);
        
        // Data Tulangan (jika mode evaluasi)
        const mode = getData('mode', 'evaluasi');
        const tulanganInfo = getTulanganInfoPelat();
        
        if (mode === 'evaluasi') {
            const tulanganRows = [
                { parameter: "Diameter tulangan pokok ($D$)", hasil: tulanganInfo.D, satuan: "mm" },
                { parameter: "Diameter tulangan bagi ($D_b$)", hasil: tulanganInfo.Db, satuan: "mm" }
            ];
            
            const inputTulangan = getData('inputData.tulangan', {});
            if (inputTulangan.s) {
                tulanganRows.push({ parameter: "Spasi tulangan pokok", hasil: inputTulangan.s, satuan: "mm" });
            }
            if (inputTulangan.sb) {
                tulanganRows.push({ parameter: "Spasi tulangan bagi", hasil: inputTulangan.sb, satuan: "mm" });
            }
            
            blocks.push(`
                <div class="section-group">
                    <h3>3. Data Tulangan Input</h3>
                    ${createThreeColumnTable(tulanganRows, false, true)}
                </div>
            `);
        } else {
            // Mode desain: tampilkan hasil optimasi
            const tulanganRows = [
                { parameter: "<strong>Hasil Optimasi Tulangan</strong>", hasil: "", satuan: "" },
                { parameter: "Diameter tulangan pokok ($D$)", hasil: tulanganInfo.D, satuan: "mm" },
                { parameter: "Diameter tulangan bagi ($D_b$)", hasil: tulanganInfo.Db, satuan: "mm" }
            ];
            
            blocks.push(`
                <div class="section-group">
                    <h3>3. Data Tulangan Hasil Desain</h3>
                    ${createThreeColumnTable(tulanganRows, false, true)}
                </div>
            `);
        }
        
        const parameterRows = [
            { parameter: "$S_n = \\max(25, 1.5D)$", hasil: getData('data.parameter.Sn'), satuan: 'mm' },
            { parameter: "$d_s = S_b + D/2$", hasil: getData('data.parameter.ds'), satuan: 'mm' },
            { parameter: "$d_{s2} = S_n + D$", hasil: getData('data.parameter.ds2'), satuan: 'mm' },
            { parameter: "$d = h - d_s$ (arah X)", hasil: getData('data.parameter.d'), satuan: 'mm' },
            { parameter: "$d_2 = h - d_{s2}$ (arah Y)", hasil: getData('data.parameter.d2'), satuan: 'mm' },
            { parameter: "$\\displaystyle \\beta_1 = \\begin{cases} 0.85 & f'_c \\leq 28 \\text{ MPa} \\\\ 0.85 - 0.05\\dfrac{f'_c - 28}{7} & 28 < f'_c < 55 \\text{ MPa} \\\\ 0.65 & f'_c \\geq 55 \\text{ MPa} \\end{cases}$", hasil: getData('data.parameter.beta1'), satuan: '-' },
            { parameter: "$\\displaystyle K_{\\text{maks}} = \\dfrac{382.5 \\beta_1 f'_c (600 + f_y - 225 \\beta_1)}{(600 + f_y)^2}$", hasil: formatNumber(getData('data.parameter.Kmaks')), satuan: 'MPa' },
            { parameter: "$\\text{Rasio } L_y/L_x$", hasil: formatNumber(getData('data.geometri.rasioLyLx'), 2), satuan: '-' }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>4. Perhitungan Parameter</h3>
                ${createThreeColumnTable(parameterRows)}
            </div>
        `);
        
        // Informasi jenis pelat dan tumpuan
        const tabelData = getData('data.tabel', {});
        const jenisPelat = tabelData.jenisPelat === 'satu_arah' ? 'Satu Arah' : 'Dua Arah';
        const kondisi = tabelData.kondisi || 'N/A';
        const tumpuanHuruf = tabelData.tumpuanHuruf || 'N/A';
        
        blocks.push(`
            <div class="section-group">
                <h3>5. Informasi Jenis Pelat dan Tumpuan</h3>
                <table class="three-col-table">
                    <tr>
                        <th class="col-param">Parameter</th>
                        <th class="col-value" style="text-align: center">Data</th>
                        <th class="col-unit" style="text-align: center">Keterangan</th>
                    </tr>
                    <tr>
                        <td class="col-param">Jenis Pelat</td>
                        <td class="col-value" style="text-align: center">${jenisPelat}</td>
                        <td class="col-unit" style="text-align: center">-</td>
                    </tr>
                    <tr>
                        <td class="col-param">Kondisi Tumpuan</td>
                        <td class="col-value" style="text-align: center">${kondisi}</td>
                        <td class="col-unit" style="text-align: center">-</td>
                    </tr>
                    <tr>
                        <td class="col-param">Tipe Tumpuan</td>
                        <td class="col-value" style="text-align: center">${tumpuanHuruf}</td>
                        <td class="col-unit" style="text-align: center">Kode huruf A-I</td>
                    </tr>
                </table>
            </div>
        `);
        
        // Data momen
        const momen = getData('data.momen', {});
        
        blocks.push(`
            <div class="header-content-group">
                <h2>B. MOMEN PERHITUNGAN</h2>
                <p class="note">Momen ultimate berdasarkan PBI 71 N.I-2 (Tabel 3.3.3.A)</p>
            </div>
        `);
        
        const momenRows = [
            { parameter: "<strong>Momen Ultimate (kNm/m)</strong>", hasil: "", satuan: "" },
            { parameter: "$M_{tx}$ (Momen tumpuan arah X)", hasil: formatNumber(momen.Mtx, 3), satuan: 'kNm/m' },
            { parameter: "$M_{lx}$ (Momen lapangan arah X)", hasil: formatNumber(momen.Mlx, 3), satuan: 'kNm/m' },
            { parameter: "$M_{ty}$ (Momen tumpuan arah Y)", hasil: formatNumber(momen.Mty, 3), satuan: 'kNm/m' },
            { parameter: "$M_{ly}$ (Momen lapangan arah Y)", hasil: formatNumber(momen.Mly, 3), satuan: 'kNm/m' }
        ];
        
        blocks.push(`
            <div class="section-group">
                ${createThreeColumnTable(momenRows, false, true)}
            </div>
        `);
        
        // Koefisien momen (jika mode auto)
        const bebanMode = getData('inputData.beban.mode', 'auto');
        if (bebanMode === 'auto') {
            const koefRows = [
                { parameter: "<strong>Koefisien Momen (%)</strong>", hasil: "", satuan: "" },
                { parameter: "$C_{tx}$", hasil: formatNumber(tabelData.Ctx, 1), satuan: '%' },
                { parameter: "$C_{lx}$", hasil: formatNumber(tabelData.Clx, 1), satuan: '%' },
                { parameter: "$C_{ty}$", hasil: formatNumber(tabelData.Cty, 1), satuan: '%' },
                { parameter: "$C_{ly}$", hasil: formatNumber(tabelData.Cly, 1), satuan: '%' }
            ];
            
            blocks.push(`
                <div class="section-group">
                    <h3>Koefisien Momen dari Tabel 3.3.3.A PBI</h3>
                    ${createThreeColumnTable(koefRows, false, true)}
                </div>
            `);
        }
        
        const headerC = `
            <div class="header-content-group keep-together">
                <h2>C. PERHITUNGAN TULANGAN POKOK</h2>
                <p class="note">Tulangan pokok dipasang untuk menahan momen lentur</p>
            </div>
        `;
        
        blocks.push(headerC);
        
        const fc = parseFloat(getData('inputData.material.fc', 20));
        const fy = parseFloat(getData('inputData.material.fy', 300));
        const D = parseFloat(tulanganInfo.D);
        const h = parseFloat(getData('inputData.dimensi.h', 100));
        const d = parseFloat(getData('data.parameter.d', 80));
        const d2 = parseFloat(getData('data.parameter.d2', 75));
        
        // Tulangan pokok arah X (gunakan momen maksimum antara Mtx dan Mlx)
        const momenX = Math.max(momen.Mtx || 0, momen.Mlx || 0);
        const pokokX = getData('data.tulangan.pokokX', {});
        const statusPokokX = getData('kontrol.lentur.arahX', {});
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Arah X ($M_u = ${formatNumber(momenX, 3)} \\text{ kNm/m}$)</h3>
                ${createTulanganPokokTable(pokokX, "X", statusPokokX, fc, fy, D, h, d, momenX)}
            </div>
        `);
        
        // Tulangan pokok arah Y (gunakan momen maksimum antara Mty dan Mly)
        const momenY = Math.max(momen.Mty || 0, momen.Mly || 0);
        const pokokY = getData('data.tulangan.pokokY', {});
        const statusPokokY = getData('kontrol.lentur.arahY', {});
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Arah Y ($M_u = ${formatNumber(momenY, 3)} \\text{ kNm/m}$)</h3>
                ${createTulanganPokokTable(pokokY, "Y", statusPokokY, fc, fy, D, h, d2, momenY)}
            </div>
        `);
        
        const headerD = `
            <div class="header-content-group keep-together">
                <h2>D. PERHITUNGAN TULANGAN BAGI</h2>
                <p class="note">Tulangan bagi dipasang untuk menahan susut dan suhu</p>
            </div>
        `;
        
        blocks.push(headerD);
        
        const Db = parseFloat(tulanganInfo.Db);
        const bagiX = getData('data.tulangan.bagiX', {});
        const statusBagiX = getData('kontrol.bagi.arahX', {});
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Arah X (terkait tulangan pokok arah X)</h3>
                ${createTulanganBagiTable(bagiX, "X", statusBagiX, fc, fy, Db, h, pokokX.AsDigunakan || 0)}
            </div>
        `);
        
        const bagiY = getData('data.tulangan.bagiY', {});
        const statusBagiY = getData('kontrol.bagi.arahY', {});
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Arah Y (terkait tulangan pokok arah Y)</h3>
                ${createTulanganBagiTable(bagiY, "Y", statusBagiY, fc, fy, Db, h, pokokY.AsDigunakan || 0)}
            </div>
        `);
        
        const headerE = `
            <div class="header-content-group">
                <h2>E. REKAPITULASI HASIL DESAIN</h2>
            </div>
        `;
        
        const contentE1 = `
            <div class="section-group">
                <h3>1. Tulangan Terpasang</h3>
                ${createRekapitulasiPelatTable()}
            </div>
        `;
        
        blocks.push(headerE + contentE1);
        
        const kontrolRows = [
            { 
                parameter: "$K \\le K_{maks}$ (Arah X)", 
                statusHtml: `<span class="${getData('kontrol.lentur.arahX.K_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.lentur.arahX.K_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$M_d \\ge M_u$ (Arah X)", 
                statusHtml: `<span class="${getData('kontrol.lentur.arahX.Md_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.lentur.arahX.Md_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$A_{s,perlu} \\le A_{s,terpasang}$ (Arah X)", 
                statusHtml: `<span class="${getData('kontrol.lentur.arahX.As_terpasang_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.lentur.arahX.As_terpasang_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$K \\le K_{maks}$ (Arah Y)", 
                statusHtml: `<span class="${getData('kontrol.lentur.arahY.K_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.lentur.arahY.K_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$M_d \\ge M_u$ (Arah Y)", 
                statusHtml: `<span class="${getData('kontrol.lentur.arahY.Md_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.lentur.arahY.Md_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$A_{s,perlu} \\le A_{s,terpasang}$ (Arah Y)", 
                statusHtml: `<span class="${getData('kontrol.lentur.arahY.As_terpasang_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.lentur.arahY.As_terpasang_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Tulangan bagi (Arah X)", 
                statusHtml: `<span class="${getData('kontrol.bagi.arahX.As_terpasang_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.bagi.arahX.As_terpasang_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Tulangan bagi (Arah Y)", 
                statusHtml: `<span class="${getData('kontrol.bagi.arahY.As_terpasang_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.bagi.arahY.As_terpasang_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Ringkasan Kontrol Keamanan</h3>
                ${createTwoColumnTable(kontrolRows)}
            </div>
        `);
        
        // Gunakan fungsi baru untuk kesimpulan dinamis
        blocks.push(generateDynamicConclusionPelat());
        
        // Referensi
        blocks.push(`
            <p class="note" style="margin-top: 10px;">
                <strong>Referensi:</strong> PBI 71 N.I-2 (Peraturan Beton Bertulang Indonesia) - Tabel 3.3.3.A
            </p>
        `);
        
        return blocks;
    }

    // Helper function untuk format timestamp (sama seperti di pdf.html)
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
        generateContentBlocks: generateContentBlocksPelat,
        cekStatusPelat: cekStatusPelat,
        formatNumber: formatNumber,
        getData: getData,
        formatTimestampFull: formatTimestampFull
    };
})();
[file content end]