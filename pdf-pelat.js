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

    // FUNGSI FORMAT NUMBER YANG DIPERBAIKI: Sama seperti di pdf-kolom.js
    function formatNumber(num, decimals = null) {
        if (num === null || num === undefined || num === 'N/A' || isNaN(num)) return 'N/A';
        
        const numFloat = parseFloat(num);
        
        if (decimals !== null) {
            if (decimals === 0) {
                return Math.round(numFloat).toString();
            }
            return numFloat.toFixed(decimals);
        }
        
        if (Number.isInteger(numFloat)) {
            return numFloat.toString();
        }
        
        const numStr = numFloat.toString();
        const parts = numStr.split('.');
        const integerPart = Math.abs(parseInt(parts[0]));
        
        let targetDecimals;
        if (integerPart <= 9) {
            targetDecimals = 3;
        } else {
            targetDecimals = 2;
        }
        
        const formatted = numFloat.toFixed(targetDecimals);
        return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }

    // Fungsi untuk memformat tanggal
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

    // Fungsi untuk mengambil diameter tulangan pokok
    function getDiameterPokok() {
        const mode = getData('mode', 'desain');
        
        // Untuk mode evaluasi, ambil dari inputData.tulangan.d
        if (mode === 'evaluasi') {
            return formatNumber(getData('inputData.tulangan.d', 'N/A'), 0);
        }
        
        // Untuk mode desain, ambil dari data.tulangan (dari perhitungan)
        const tulanganPokokX = getData('data.tulangan.pokokX', {});
        if (tulanganPokokX && tulanganPokokX.AsTerpasang) {
            const tulanganData = getData('data.tulangan', {});
            if (tulanganData.pokokX && tulanganData.pokokX.sDigunakan && tulanganData.pokokX.AsTerpasang) {
                const AsTerpasang = tulanganData.pokokX.AsTerpasang;
                const s = tulanganData.pokokX.sDigunakan;
                const D = Math.sqrt((AsTerpasang * s) / (Math.PI * 250));
                return formatNumber(Math.round(D), 0);
            }
        }
        
        // Coba dari rekap.formatted
        const rekapTulangan = getData('rekap.formatted.tulangan_pokok_x', '');
        if (rekapTulangan && rekapTulangan.includes('D')) {
            const match = rekapTulangan.match(/D(\d+)-/);
            if (match) return formatNumber(match[1], 0);
        }
        
        return 'N/A';
    }

    // Fungsi untuk mengambil diameter tulangan bagi
    function getDiameterBagi() {
        const mode = getData('mode', 'desain');
        
        // Untuk mode evaluasi, ambil dari inputData.tulangan.db
        if (mode === 'evaluasi') {
            return formatNumber(getData('inputData.tulangan.db', 'N/A'), 0);
        }
        
        // Untuk mode desain, ambil dari data.tulangan (dari perhitungan)
        const tulanganBagiX = getData('data.tulangan.bagiX', {});
        if (tulanganBagiX && tulanganBagiX.AsbTerpasang) {
            const tulanganData = getData('data.tulangan', {});
            if (tulanganData.bagiX && tulanganData.bagiX.sDigunakan && tulanganData.bagiX.AsbTerpasang) {
                const AsbTerpasang = tulanganData.bagiX.AsbTerpasang;
                const s = tulanganData.bagiX.sDigunakan;
                const Db = Math.sqrt((AsbTerpasang * s) / (Math.PI * 250));
                return formatNumber(Math.round(Db), 0);
            }
        }
        
        // Coba dari rekap.formatted
        const rekapTulangan = getData('rekap.formatted.tulangan_bagi_x', '');
        if (rekapTulangan && rekapTulangan.includes('D')) {
            const match = rekapTulangan.match(/D(\d+)-/);
            if (match) return formatNumber(match[1], 0);
        }
        
        return 'N/A';
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
            const isHeader = row.parameter && row.parameter.includes('<strong>') && !row.hasil;
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
            } else if (row.isConditionValue) {
                html += `
                    <tr class="${rowClass}">
                        <td class="col-param">${row.parameter}</td>
                        <td class="col-value" colspan="2" style="text-align: center">
                            ${row.hasil}
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
    
    // Fungsi untuk membuat tabel Tulangan Terpasang
    function createTulanganTerpasangTable() {
        const rekap = getData('rekap.formatted', {});
        
        let html = '<table class="tulangan-terpasang-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th class="tulangan-col-tulangan">Tulangan</th>';
        html += '<th class="tulangan-col-terpasang" style="text-align: center">Terpasang</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        html += '<tr>';
        html += '<td class="tulangan-col-tulangan"><strong>Tulangan Pokok Arah X</strong></td>';
        html += '<td class="tulangan-col-terpasang text-center">' + (rekap.tulangan_pokok_x || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="tulangan-col-tulangan"><strong>Tulangan Pokok Arah Y</strong></td>';
        html += '<td class="tulangan-col-terpasang text-center">' + (rekap.tulangan_pokok_y || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="tulangan-col-tulangan"><strong>Tulangan Bagi Arah X</strong></td>';
        html += '<td class="tulangan-col-terpasang text-center">' + (rekap.tulangan_bagi_x || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="tulangan-col-tulangan"><strong>Tulangan Bagi Arah Y</strong></td>';
        html += '<td class="tulangan-col-terpasang text-center">' + (rekap.tulangan_bagi_y || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '</tbody>';
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
                { parameter: "Jenis Pelat", hasil: jenisPelat, satuan: "-" }
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
            { parameter: `$s_2 = ${arah === 'X' ? '2h' : '3h'} = ${formatNumber(arah === 'X' ? 2*h : 3*h, 0)}$`, hasil: formatNumber(data?.s2), satuan: 'mm' },
            { parameter: `$s_3 = 450$`, hasil: formatNumber(data?.s3), satuan: 'mm' },
            { parameter: `$s = \\min(s_1, s_2, s_3)$`, hasil: formatNumber(data?.sDigunakan, 0), satuan: 'mm' },
            { parameter: `$\\displaystyle A_{s} = \\frac{0.25 \\pi D^2 \\times b}{s}$`, hasil: formatNumber(data?.AsTerpasang), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle M_n = A_{s} \\times f_y \\times (d - a/2)$`, hasil: formatNumber(data?.Mn), satuan: 'kNm/m' },
            { parameter: `$\\displaystyle M_d = \\phi \\times M_n$`, hasil: formatNumber(data?.Md), satuan: 'kNm/m' },
            { parameter: `$M_d \\ge M_u$`, isStatus: true, statusHtml: `<span class="${data?.Md >= data?.Mu ? 'status-aman' : 'status-tidak-aman'}">${data?.Md >= data?.Mu ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `$A_{s} \\ge A_{s,perlu}$`, isStatus: true, statusHtml: `<span class="${data?.AsTerpasang >= data?.AsDigunakan ? 'status-aman' : 'status-tidak-aman'}">${data?.AsTerpasang >= data?.AsDigunakan ? 'AMAN' : 'TIDAK AMAN'}</span>` }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    // Fungsi untuk membuat tabel perhitungan tulangan bagi pelat
    function createTulanganBagiTable(data, arah, b, h, fc, fy, Db, mode) {
        // Hitung Asb2 berdasarkan fy
        let Asb2Formula = '';
        let Asb2Value = 0;
        
        if (fy <= 350) {
            Asb2Formula = '0.002';
            Asb2Value = 0.002 * b * h;
        } else if (fy < 420) {
            Asb2Formula = `0.002 - (${formatNumber(fy)} - 350)/350000`;
            Asb2Value = (0.002 - (fy - 350)/350000) * b * h;
        } else {
            Asb2Formula = '0.0018 × (420/fy)';
            Asb2Value = 0.0018 * (420/fy) * b * h;
        }
        
        const rows = [
            { parameter: `$\\displaystyle A_{sb1} = \\frac{A_{s,pokok}}{5}$`, hasil: formatNumber(data?.Asb1), satuan: 'mm²/m' },
            { parameter: `$A_{sb2} = ${Asb2Formula} \\times b \\times h$`, hasil: formatNumber(Asb2Value), satuan: 'mm²/m' },
            { parameter: `$A_{sb3} = 0.0014 \\times b \\times h$`, hasil: formatNumber(data?.Asb3), satuan: 'mm²/m' },
            { parameter: `$A_{sb,perlu} = \\max(A_{sb1}, A_{sb2}, A_{sb3})$`, hasil: formatNumber(data?.AsbDigunakan), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle s_1 = \\frac{0.25 \\pi D_b^2 \\times 1000}{A_{sb,perlu}}$`, hasil: formatNumber(data?.s1), satuan: 'mm' },
            { parameter: `$s_2 = 5h = ${formatNumber(5*h, 0)}$`, hasil: formatNumber(data?.s2), satuan: 'mm' },
            { parameter: `$s_3 = 450$`, hasil: formatNumber(data?.s3), satuan: 'mm' },
            { parameter: `$s = \\min(s_1, s_2, s_3)$`, hasil: formatNumber(data?.sDigunakan, 0), satuan: 'mm' },
            { parameter: `$\\displaystyle A_{sb} = \\frac{0.25 \\pi D_b^2 \\times 1000}{s}$`, hasil: formatNumber(data?.AsbTerpasang), satuan: 'mm²/m' },
            { parameter: `$\\displaystyle A_{v,u} = \\frac{\\pi D_b^2 \\times s}{4 \\times 1000}$`, hasil: formatNumber(data?.Av_u), satuan: 'mm²/mm' },
            { parameter: `$A_{sb} \\ge A_{sb,perlu}$`, isStatus: true, statusHtml: `<span class="${data?.AsbTerpasang >= data?.AsbDigunakan ? 'status-aman' : 'status-tidak-aman'}">${data?.AsbTerpasang >= data?.AsbDigunakan ? 'AMAN' : 'TIDAK AMAN'}</span>` }
        ];
        
        return createThreeColumnTable(rows, true);
    }

    // ==============================================
    // FUNGSI BARU: Kesimpulan Fleksibel untuk Pelat
    // ==============================================
    function generateDynamicConclusion() {
        // Hitung status pelat secara dinamis
        const statusPelat = cekStatusPelat();
        
        const dimensi = getData('inputData.dimensi', {});
        const material = getData('inputData.material', {});
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
                masalah.push(`<span class="problem-item">• Luas tulangan terpasang tidak mencukupi pada arah X (A_s = ${formatNumber(detail.As_terpasang)} mm²/m < A_s,perlu = ${formatNumber(detail.As_dibutuhkan)} mm²/m)</span>`);
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
                masalah.push(`<span class="problem-item">• Luas tulangan terpasang tidak mencukupi pada arah Y (A_s = ${formatNumber(detail.As_terpasang)} mm²/m < A_s,perlu = ${formatNumber(detail.As_dibutuhkan)} mm²/m)</span>`);
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
            rekomendasi.push(`Gunakan tulangan pokok ${rekap.tulangan_pokok_x || 'N/A'}`);
            rekomendasi.push(`Gunakan tulangan bagi ${rekap.tulangan_bagi_x || 'N/A'}`);
            rekomendasi.push(`Pastikan mutu beton mencapai f'c = ${formatNumber(material.fc)} MPa`);
            rekomendasi.push(`Pastikan mutu baja mencapai fy = ${formatNumber(material.fy)} MPa`);
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
                <p>Struktur pelat dengan dimensi ${formatNumber(dimensi.lx, 0)} × ${formatNumber(dimensi.ly, 0)} × ${formatNumber(dimensi.h, 0)} mm memenuhi semua persyaratan SNI 2847:2019 untuk:</p>
                <ul>
                    <li>Kuat lentur arah X dan Y</li>
                    <li>Persyaratan tulangan pokok minimum</li>
                    <li>Persyaratan tulangan bagi</li>
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
        
        // Data Material dan Dimensi
        const dimensiMaterialRows = [
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: formatNumber(getData('inputData.material.fc')), satuan: 'MPa' },
            { parameter: "$f_y$ (Tegangan leleh tulangan)", hasil: formatNumber(getData('inputData.material.fy')), satuan: 'MPa' },
            { parameter: "$L_x$ (Panjang arah X)", hasil: formatNumber(getData('inputData.dimensi.lx'), 0), satuan: 'mm' },
            { parameter: "$L_y$ (Panjang arah Y)", hasil: formatNumber(getData('inputData.dimensi.ly'), 0), satuan: 'mm' },
            { parameter: "$h$ (Tebal pelat)", hasil: formatNumber(getData('inputData.dimensi.h'), 0), satuan: 'mm' },
            { parameter: "$s_b$ (Selimut beton)", hasil: formatNumber(getData('inputData.dimensi.sb'), 0), satuan: 'mm' }
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
            { parameter: "$D$ (Diameter tulangan pokok)", hasil: getDiameterPokok(), satuan: 'mm' },
            { parameter: "$D_b$ (Diameter tulangan bagi)", hasil: getDiameterBagi(), satuan: 'mm' }
        ];
        
        // Hanya tambahkan s dan sb jika mode adalah evaluasi
        const mode = getData('mode', 'desain');
        if (mode === 'evaluasi') {
            tulanganRows.push(
                { parameter: "$s$ (Spasi tulangan pokok - input evaluasi)", hasil: formatNumber(getData('inputData.tulangan.s'), 0), satuan: 'mm' },
                { parameter: "$s_b$ (Spasi tulangan bagi - input evaluasi)", hasil: formatNumber(getData('inputData.tulangan.sb'), 0), satuan: 'mm' }
            );
        }
        
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
        const material = getData('inputData.material', {});
        const fc = material.fc || 20;
        
        // Hitung beta1 seperti di kolom
        const beta1_calc = fc <= 28 ? 0.85 : (fc < 55 ? 0.85 - 0.05 * ((fc - 28) / 7) : 0.65);
        
        const parameterRows = [
            { parameter: "$\\displaystyle \\text{Rasio } L_y/L_x$", hasil: formatNumber(geometri.rasioLyLx), satuan: '-' },
            { parameter: "$\\displaystyle S_n = \\max(25, 1.5D)$", hasil: formatNumber(parameter.Sn, 0), satuan: 'mm' },
            { parameter: "$\\displaystyle d_{s} = s_b + D/2$", hasil: formatNumber(parameter.ds, 0), satuan: 'mm' },
            { parameter: "$\\displaystyle d = h - d_{s}$", hasil: formatNumber(parameter.d, 0), satuan: 'mm' },
            { parameter: "$\\displaystyle d_{s2} = S_n + D$", hasil: formatNumber(parameter.ds2, 0), satuan: 'mm' },
            { parameter: "$\\displaystyle d_2 = h - d_{s2}$", hasil: formatNumber(parameter.d2, 0), satuan: 'mm' },
            { 
                parameter: "$\\displaystyle \\beta_1 = \\begin{cases} 0.85 & f'_c \\leq 28 \\text{ MPa} \\\\ 0.85 - 0.05\\dfrac{f'_c - 28}{7} & 28 < f'_c < 55 \\text{ MPa} \\\\ 0.65 & f'_c \\geq 55 \\text{ MPa} \\end{cases}$", 
                hasil: formatNumber(parameter.beta1 || beta1_calc), 
                satuan: '-' 
            },
            { parameter: "$\\displaystyle K_{maks} = \\dfrac{382.5 \\beta_1 f'_c (600 + f_y - 225\\beta_1)}{(600 + f_y)^2}$", hasil: formatNumber(parameter.Kmaks), satuan: 'MPa' }
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
                { parameter: "$C_{tx}$ (Koefisien momen tumpuan X)", hasil: formatNumber(tabel.Ctx), satuan: '-' },
                { parameter: "$C_{lx}$ (Koefisien momen lapangan X)", hasil: formatNumber(tabel.Clx), satuan: '-' },
                { parameter: "$C_{ty}$ (Koefisien momen tumpuan Y)", hasil: formatNumber(tabel.Cty), satuan: '-' },
                { parameter: "$C_{ly}$ (Koefisien momen lapangan Y)", hasil: formatNumber(tabel.Cly), satuan: '-' }
            ];
            
            blocks.push(`
                <div class="section-group">
                    <h3>5. Koefisien Momen dari Tabel</h3>
                    ${createThreeColumnTable(tabelRows, false, true)}
                </div>
            `);
        }
        
        // Momen Hasil Perhitungan - hanya untuk mode auto
        const momen = data.momen || {};
        const bebanData = getData('inputData.beban', {});
        const auto = bebanData.auto || {};
        const qu = auto.qu || 0;
        const lx = getData('inputData.dimensi.lx', 0);
        
        // Buat tabel momen dengan rumus 0,001 * q * Lx² * koefisien untuk mode auto
        if (bebanMode === 'auto') {
            const momenRows = [
                { 
                    parameter: "$M_{tx} = 0.001 \\times q_u \\times L_x^2 \\times C_{tx}$", 
                    hasil: formatNumber(momen.Mtx), 
                    satuan: 'kNm/m' 
                },
                { 
                    parameter: "$M_{lx} = 0.001 \\times q_u \\times L_x^2 \\times C_{lx}$", 
                    hasil: formatNumber(momen.Mlx), 
                    satuan: 'kNm/m' 
                },
                { 
                    parameter: "$M_{ty} = 0.001 \\times q_u \\times L_x^2 \\times C_{ty}$", 
                    hasil: formatNumber(momen.Mty), 
                    satuan: 'kNm/m' 
                },
                { 
                    parameter: "$M_{ly} = 0.001 \\times q_u \\times L_x^2 \\times C_{ly}$", 
                    hasil: formatNumber(momen.Mly), 
                    satuan: 'kNm/m' 
                }
            ];
            
            blocks.push(`
                <h2>B. PERHITUNGAN MOMEN DAN TULANGAN</h2>
                <div class="section-group">
                    <h3>1. Momen Hasil Perhitungan</h3>
                    ${createThreeColumnTable(momenRows, false, true)}
                </div>
            `);
        } else {
            // Untuk mode manual, langsung tampilkan momen dari input
            const manual = bebanData.manual || {};
            const momenRows = [
                { 
                    parameter: "$M_u$ (Momen terfaktor dari input)", 
                    hasil: formatNumber(manual.mu), 
                    satuan: 'kNm/m' 
                }
            ];
            
            blocks.push(`
                <h2>B. PERHITUNGAN MOMEN DAN TULANGAN</h2>
                <div class="section-group">
                    <h3>1. Momen dari Input</h3>
                    ${createThreeColumnTable(momenRows, false, true)}
                </div>
            `);
        }
        
        // Tulangan Pokok Arah X
        const tulanganData = data.tulangan || {};
        const pokokX = tulanganData.pokokX || {};
        const pokokY = tulanganData.pokokY || {};
        const bagiX = tulanganData.bagiX || {};
        const bagiY = tulanganData.bagiY || {};
        
        const inputData = getData('inputData', {});
        const fcVal = inputData.material?.fc || 20;
        const fyVal = inputData.material?.fy || 300;
        const DVal = parseFloat(getDiameterPokok()) || 10;
        const DbVal = parseFloat(getDiameterBagi()) || 8;
        const hVal = inputData.dimensi?.h || 120;
        const modeTulangan = getData('mode', 'desain');
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Tulangan Pokok Arah X</h3>
                <p class="note">Direncanakan untuk momen maksimum arah X: $M_u = ${formatNumber(Math.max(momen.Mtx || 0, momen.Mlx || 0))} \\text{ kNm/m}$</p>
                ${createTulanganPokokTable(pokokX, 'X', parameter.d, fcVal, fyVal, DVal, hVal, modeTulangan)}
            </div>
        `);
        
        // Tulangan Pokok Arah Y
        blocks.push(`
            <div class="section-group">
                <h3>3. Tulangan Pokok Arah Y</h3>
                <p class="note">Direncanakan untuk momen maksimum arah Y: $M_u = ${formatNumber(Math.max(momen.Mty || 0, momen.Mly || 0))} \\text{ kNm/m}$</p>
                ${createTulanganPokokTable(pokokY, 'Y', parameter.d2, fcVal, fyVal, DVal, hVal, modeTulangan)}
            </div>
        `);
        
        // Tulangan Bagi Arah X
        blocks.push(`
            <div class="section-group">
                <h3>4. Tulangan Bagi Arah X</h3>
                ${createTulanganBagiTable(bagiX, 'X', 1000, hVal, fcVal, fyVal, DbVal, modeTulangan)}
            </div>
        `);
        
        // Tulangan Bagi Arah Y
        blocks.push(`
            <div class="section-group">
                <h3>5. Tulangan Bagi Arah Y</h3>
                ${createTulanganBagiTable(bagiY, 'Y', 1000, hVal, fcVal, fyVal, DbVal, modeTulangan)}
            </div>
        `);
        
        // Tulangan Terpasang (ganti dari Rekapitulasi Tulangan)
        blocks.push(`
            <h2>C. REKAPITULASI HASIL DESAIN</h2>
            <div class="section-group">
                <h3>1. Tulangan Terpasang</h3>
                ${createTulanganTerpasangTable()}
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
                parameter: "Kontrol $A_{s} \\ge A_{s,perlu}$ arah X", 
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
                parameter: "Kontrol $A_{s} \\ge A_{s,perlu}$ arah Y", 
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

    // Ekspos fungsi-fungsi yang diperlukan
    window.pelatReport = {
        setData: setData,
        generateContentBlocks: generateContentBlocks,
        cekStatusPelat: cekStatusPelat,
        formatNumber: formatNumber,
        getData: getData,
        formatTimestampFull: formatTimestampFull,
        getDiameterPokok: getDiameterPokok,
        getDiameterBagi: getDiameterBagi
    };
})();