(function() {
    let resultData;

    function setData(data) {
        resultData = data;
    }

    // ==============================================
    // FUNGSI BARU: Cek Status Balok Dinamis
    // ==============================================
    function cekStatusBalok() {
        const kontrolLentur = getData('kontrol.kontrolLentur', {});
        const kontrolGeser = getData('kontrol.kontrolGeser', {});
        const kontrolTorsi = getData('kontrol.kontrolTorsi', {});
        
        let semuaAman = true;
        
        // Cek kontrol lentur
        if (kontrolLentur) {
            Object.values(kontrolLentur).forEach(kontrol => {
                if (kontrol && (!kontrol.K_aman || !kontrol.Md_aman || !kontrol.rho_aman || !kontrol.kapasitas_aman)) {
                    semuaAman = false;
                }
            });
        }
        
        // Cek kontrol geser
        if (kontrolGeser) {
            Object.values(kontrolGeser).forEach(kontrol => {
                if (kontrol && (!kontrol.Vs_aman || !kontrol.Av_aman)) {
                    semuaAman = false;
                }
            });
        }
        
        // Cek kontrol torsi
        if (kontrolTorsi) {
            Object.values(kontrolTorsi).forEach(kontrol => {
                if (kontrol && !kontrol.perluDanAman) {
                    semuaAman = false;
                }
            });
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
    
    // Fungsi khusus untuk mengambil data torsi dengan fallback yang benar
    function getTorsionData(path) {
        const keys = path.split('.');
        const location = keys[1]; // torsikiri, torsitengah, torsikanan
        const property = keys[2]; // property yang dicari
        
        if (!resultData.data || !resultData.data[location]) {
            return undefined;
        }
        
        const torsion = resultData.data[location];
        
        // Ambil langsung dari data torsi dengan nama properti asli
        if (property === 'A1_formula1') {
            return torsion.A11 !== undefined ? torsion.A11 : torsion.A1_formula1;
        }
        if (property === 'A1_formula2') {
            return torsion.A12 !== undefined ? torsion.A12 : torsion.A1_formula2;
        }
        if (property === 'A1') {
            return torsion.A1;
        }
        if (property === 'A1_terpasang') {
            return torsion.A1_terpasang;
        }
        if (property === 'amanTorsi1') {
            return torsion.amanTorsi1 !== undefined ? torsion.amanTorsi1 : torsion.amanTorsi;
        }
        if (property === 'amanTorsi2') {
            return torsion.amanTorsi2 !== undefined ? torsion.amanTorsi2 : torsion.amanTorsi;
        }
        if (property in torsion) {
            return torsion[property];
        }
        
        return undefined;
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
    
    // Fungsi untuk membuat tabel Data Beban
    function createBebanTable() {
        const bebanData = getData('inputData.beban', {});
        
        const rows = [
            { parameter: "<strong>Tumpuan Kiri</strong>", hasil: "", satuan: "" },
            { parameter: "$M_u^+$ (Momen positif)", hasil: formatNumber(bebanData.left?.mu_pos || 'N/A'), satuan: "kNm" },
            { parameter: "$M_u^-$ (Momen negatif)", hasil: formatNumber(bebanData.left?.mu_neg || 'N/A'), satuan: "kNm" },
            { parameter: "$V_u$ (Gaya geser)", hasil: formatNumber(bebanData.left?.vu || 'N/A'), satuan: "kN" },
            { parameter: "$T_u$ (Momen torsi)", hasil: formatNumber(bebanData.left?.tu || 'N/A'), satuan: "kNm" },
            
            { parameter: "<strong>Lapangan</strong>", hasil: "", satuan: "" },
            { parameter: "$M_u^+$ (Momen positif)", hasil: formatNumber(bebanData.center?.mu_pos || 'N/A'), satuan: "kNm" },
            { parameter: "$M_u^-$ (Momen negatif)", hasil: formatNumber(bebanData.center?.mu_neg || 'N/A'), satuan: "kNm" },
            { parameter: "$V_u$ (Gaya geser)", hasil: formatNumber(bebanData.center?.vu || 'N/A'), satuan: "kN" },
            { parameter: "$T_u$ (Momen torsi)", hasil: formatNumber(bebanData.center?.tu || 'N/A'), satuan: "kNm" },
            
            { parameter: "<strong>Tumpuan Kanan</strong>", hasil: "", satuan: "" },
            { parameter: "$M_u^+$ (Momen positif)", hasil: formatNumber(bebanData.right?.mu_pos || 'N/A'), satuan: "kNm" },
            { parameter: "$M_u^-$ (Momen negatif)", hasil: formatNumber(bebanData.right?.mu_neg || 'N/A'), satuan: "kNm" },
            { parameter: "$V_u$ (Gaya geser)", hasil: formatNumber(bebanData.right?.vu || 'N/A'), satuan: "kN" },
            { parameter: "$T_u$ (Momen torsi)", hasil: formatNumber(bebanData.right?.tu || 'N/A'), satuan: "kNm" }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }
    
    // Fungsi untuk membuat tabel perhitungan lentur lengkap
    function createLenturTableFull(data, status, d_eff, fc, fy, b, title, Mu) {
        // Gunakan nilai dari data jika ada, jika tidak gunakan N/A
        const As1 = data && d_eff !== 'N/A' && fc !== 'N/A' && fy !== 'N/A' && b !== 'N/A' && data.a && data.a !== 'N/A' ? 
            formatNumber((0.85 * parseFloat(fc) * parseFloat(data.a) * parseFloat(b)) / parseFloat(fy)) : 'N/A';
        const As2 = data && fc !== 'N/A' && fy !== 'N/A' && b !== 'N/A' && d_eff !== 'N/A' ? 
            formatNumber((Math.sqrt(parseFloat(fc)) / (4 * parseFloat(fy))) * parseFloat(b) * parseFloat(d_eff)) : 'N/A';
        const As3 = data && fy !== 'N/A' && b !== 'N/A' && d_eff !== 'N/A' ? 
            formatNumber((1.4 * parseFloat(b) * parseFloat(d_eff)) / parseFloat(fy)) : 'N/A';
        const a2 = data && data.AsTerpakai !== 'N/A' && data.AsTerpakai && fy !== 'N/A' && fc !== 'N/A' && b !== 'N/A' ? 
            formatNumber((parseFloat(data.AsTerpakai) * parseFloat(fy)) / (0.85 * parseFloat(fc) * parseFloat(b))) : 'N/A';
        
        const rows = [
            { parameter: "$\\displaystyle K = \\frac{M_u}{\\phi b d^2}$", hasil: formatNumber(data?.K), satuan: 'MPa' },
            { parameter: "$K \\le K_{maks}$", isStatus: true, statusHtml: `<span class="${status?.K_aman ? 'status-aman' : 'status-tidak-aman'}">${status?.K_aman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\displaystyle a = \\left(1 - \\sqrt{1 - \\frac{2K}{0.85 f'_c}}\\right) d$", hasil: formatNumber(data?.a), satuan: 'mm' },
            { parameter: "$\\displaystyle A_{s1} = \\frac{0.85 f'_c a b}{f_y}$", hasil: As1, satuan: 'mm²' },
            { parameter: "$\\displaystyle A_{s2} = \\frac{\\sqrt{f'_c}}{4f_y} b d$", hasil: As2, satuan: 'mm²' },
            { parameter: "$\\displaystyle A_{s3} = \\frac{1.4}{f_y} b d$", hasil: As3, satuan: 'mm²' },
            { parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(data?.As), satuan: 'mm²' },
            { parameter: "$\\displaystyle n = \\frac{A_{s,perlu}}{A_{D19}}$", hasil: data?.n || 'N/A', satuan: 'batang' },
            { parameter: "$A_{s,terpasang} = n \\times (0.25 \\times \\pi \\times D^2)$", hasil: formatNumber(data?.AsTerpakai), satuan: 'mm²' },
            { parameter: "$\\displaystyle \\rho = \\frac{A_{s,terpasang}}{b \\times d} \\times 100\\%$", hasil: formatNumber(data?.rho, 4), satuan: '%' },
            { parameter: "$\\displaystyle \\rho_{min} = \\max\\left(\\frac{\\sqrt{f'_c}}{4f_y}, \\frac{1.4}{f_y}\\right) \\times 100\\%$", hasil: formatNumber(data?.pmin, 4), satuan: '%' },
            { parameter: "$\\displaystyle \\rho_{max} = 0.75 \\times \\frac{0.85 f'_c \\beta_1}{f_y} \\times \\frac{600}{600+f_y} \\times 100\\%$", hasil: formatNumber(data?.pmax, 4), satuan: '%' },
            { parameter: "$\\rho_{min} \\le \\rho \\le \\rho_{max}$", isStatus: true, statusHtml: `<span class="${status?.rho_aman ? 'status-aman' : 'status-tidak-aman'}">${status?.rho_aman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\displaystyle a = \\frac{A_{s,terpasang} \\times f_y}{0.85 \\times f'_c \\times b}$", hasil: a2, satuan: 'mm' },
            { parameter: "$\\displaystyle M_n = A_{s,terpasang} \\times f_y \\times (d - a/2)$", hasil: formatNumber(data?.Mn), satuan: 'kNm' },
            { parameter: "$\\displaystyle M_d = \\phi \\times M_n$", hasil: formatNumber(data?.Md), satuan: 'kNm' },
            { parameter: "$M_d \\ge M_u$", isStatus: true, statusHtml: `<span class="${status?.Md_aman ? 'status-aman' : 'status-tidak-aman'}">${status?.Md_aman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `<strong>Digunakan Tulangan ${data?.n || 'N/A'}D${getData('inputData.tulangan.d', 'N/A')}</strong>`, isFullRow: true, hasil: "", satuan: "" }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    // Fungsi untuk membuat tabel perhitungan geser detail
    function createGeserTableDetail(data, lokasi, status, fc, fyt, b, dmin, nKaki = 2, diameterSengkang = 8) {
        const Vu = parseFloat(data?.Vu) || 0;
        const phiVc = parseFloat(data?.phiVc) || 0;
        const Vs = parseFloat(data?.Vs) || 0;
        const Vs_maks = parseFloat(data?.Vs_maks) || 0;
        const Av_terpakai = parseFloat(data?.Av_terpakai) || 0;
        const phiVc_half = phiVc / 2;
        let kondisi = "";
        let keterangan = "";
        let rows = [];
        
        if (Vu < phiVc_half) {
            kondisi = "$V_u < \\phi V_c / 2$";
            keterangan = "Tidak perlu begel atau digunakan begel minimum";
            const s_calc = parseFloat(data?.sTerkecil) || 600;
            
            rows = [
                { parameter: "$V_u$", hasil: formatNumber(Vu), satuan: 'kN' },
                { parameter: "$\\phi V_c$", hasil: formatNumber(phiVc), satuan: 'kN' },
                { parameter: "$\\phi V_c / 2$", hasil: formatNumber(phiVc_half), satuan: 'kN' },
                { 
                    parameter: kondisi, 
                    isStatus: true, 
                    statusHtml: `<span class="kondisi-text">${keterangan}</span>` 
                },
                { parameter: "$s$", hasil: formatNumber(s_calc, 0), satuan: 'mm' },
                { parameter: "$A_{v,terpasang}$", hasil: formatNumber(Av_terpakai, 2), satuan: 'mm²/m' },
                { parameter: "$A_{v,u} \\le A_{v,terpasang}$", isStatus: true, statusHtml: `<span class="${Av_terpakai >= 0 ? 'status-aman' : 'status-tidak-aman'}">${Av_terpakai >= 0 ? 'AMAN' : 'TIDAK AMAN'}</span>` },
                { parameter: `<strong>Digunakan Tulangan Geser ɸ${diameterSengkang}-${formatNumber(s_calc, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" }
            ];
        } else if (Vu < phiVc) {
            kondisi = "$\\phi V_c / 2 < V_u < \\phi V_c$";
            keterangan = "Digunakan luas begel perlu minimum";
            const Av1 = parseFloat(data?.Av1) || 0;
            const Av2 = parseFloat(data?.Av2) || 0;
            const Av_u_calc = parseFloat(data?.Av_u) || 0;
            const s_calc = parseFloat(data?.sTerkecil) || 300;
            
            rows = [
                { parameter: "$V_u$", hasil: formatNumber(Vu), satuan: 'kN' },
                { parameter: "$\\phi V_c$", hasil: formatNumber(phiVc), satuan: 'kN' },
                { 
                    parameter: kondisi, 
                    isStatus: true, 
                    statusHtml: `<span class="kondisi-text">${keterangan}</span>` 
                },
                { parameter: "$\\displaystyle A_{v1} = 0.062 \\sqrt{f'_c} \\frac{b \\cdot s}{f_{yt}}$", hasil: formatNumber(Av1), satuan: 'mm²/m' },
                { parameter: "$\\displaystyle A_{v2} = 0.35 \\frac{b \\cdot s}{f_{yt}}$", hasil: formatNumber(Av2), satuan: 'mm²/m' },
                { parameter: "$A_{v,u} = \\max(A_{v1}, A_{v2})$", hasil: formatNumber(Av_u_calc), satuan: 'mm²/m' },
                { parameter: "$s$", hasil: formatNumber(s_calc, 0), satuan: 'mm' },
                { parameter: "$A_{v,terpasang}$", hasil: formatNumber(Av_terpakai, 2), satuan: 'mm²/m' },
                { parameter: "$A_{v,u} \\le A_{v,terpasang}$", isStatus: true, statusHtml: `<span class="${Av_u_calc <= Av_terpakai ? 'status-aman' : 'status-tidak-aman'}">${Av_u_calc <= Av_terpakai ? 'AMAN' : 'TIDAK AMAN'}</span>` },
                { parameter: `<strong>Digunakan Tulangan Geser ɸ${diameterSengkang}-${formatNumber(s_calc, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" }
            ];
        } else {
            kondisi = "$V_u > \\phi V_c$";
            keterangan = "Perlu perhitungan tulangan geser";
            const Av1 = parseFloat(data?.Av1) || 0;
            const Av2 = parseFloat(data?.Av2) || 0;
            const Av3 = parseFloat(data?.Av3) || 0;
            const Av_u_calc = parseFloat(data?.Av_u) || 0;
            const Vs_aman = parseFloat(data?.Vs) <= parseFloat(data?.Vs_maks);
            const s_calc = parseFloat(data?.sTerkecil) || 125;
            
            rows = [
                { parameter: "$V_u$", hasil: formatNumber(Vu), satuan: 'kN' },
                { parameter: "$\\phi V_c$", hasil: formatNumber(phiVc), satuan: 'kN' },
                { 
                    parameter: kondisi, 
                    isStatus: true, 
                    statusHtml: `<span class="kondisi-text">${keterangan}</span>` 
                },
                { parameter: "$V_s = \\dfrac{V_u - \\phi V_c}{\\phi}$", hasil: formatNumber(Vs), satuan: 'kN' },
                { parameter: "$V_{s,max}$", hasil: formatNumber(Vs_maks), satuan: 'kN' },
                { parameter: "$V_s \\le V_{s,max}$", isStatus: true, statusHtml: `<span class="${Vs_aman ? 'status-aman' : 'status-tidak-aman'}">${Vs_aman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
                { parameter: "$\\displaystyle A_{v1} = 0.062 \\sqrt{f'_c} \\frac{b \\cdot s}{f_{yt}}$", hasil: formatNumber(Av1), satuan: 'mm²/m' },
                { parameter: "$\\displaystyle A_{v2} = 0.35 \\frac{b \\cdot s}{f_{yt}}$", hasil: formatNumber(Av2), satuan: 'mm²/m' },
                { parameter: "$\\displaystyle A_{v3} = \\frac{V_s \\cdot s}{f_{yt} \\cdot d}$", hasil: formatNumber(Av3), satuan: 'mm²/m' },
                { parameter: "$A_{v,u} = \\max(A_{v1}, A_{v2}, A_{v3})$", hasil: formatNumber(Av_u_calc), satuan: 'mm²/m' },
                { parameter: "$s$", hasil: formatNumber(s_calc, 0), satuan: 'mm' },
                { parameter: "$A_{v,terpasang}$", hasil: formatNumber(Av_terpakai, 2), satuan: 'mm²/m' },
                { parameter: "$A_{v,u} \\le A_{v,terpasang}$", isStatus: true, statusHtml: `<span class="${Av_u_calc <= Av_terpakai ? 'status-aman' : 'status-tidak-aman'}">${Av_u_calc <= Av_terpakai ? 'AMAN' : 'TIDAK AMAN'}</span>` },
                { parameter: `<strong>Digunakan Tulangan Geser ɸ${diameterSengkang}-${formatNumber(s_calc, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" }
            ];
        }
        
        return createThreeColumnTable(rows, true);
    }
    
    // ==============================================
    // FUNGSI BARU: Tabel Perhitungan Torsi Detail (Disesuaikan)
    // ==============================================
    function createTorsiTableDetail(data, lokasi, status, fc, fy, fyt, b, h, nKaki = 2, diameterSengkang = 8, diameterTulangan = 19) {
        const Tu = parseFloat(data?.Tu) || 0;
        const Tn = parseFloat(data?.Tn) || 0;
        const Tu_min = parseFloat(data?.Tu_min) || 0;
        const perluTorsi = data?.perluTorsi || false;
        const n = data?.n || 0;
        const At_per_S = parseFloat(data?.At_per_S) || 0;
        
        // Ambil data dengan fallback yang benar - dari A11 dan A12 di sessionStorage
        const A1_formula1 = parseFloat(data?.A11 || data?.A1_formula1 || 0);
        const A1_formula2 = parseFloat(data?.A12 || data?.A1_formula2 || 0);
        const A1 = parseFloat(data?.A1) || 0;
        const A1_terpasang = parseFloat(data?.A1_terpasang) || 0;
        const luasTulanganMemanjang = parseFloat(data?.luasTulanganMemanjang) || 0;
        const Avt = parseFloat(data?.Avt) || 0;
        const amanBegel1 = data?.amanBegel1 || false;
        const amanBegel2 = data?.amanBegel2 || false;
        const amanTorsi1 = data?.amanTorsi1 || data?.amanTorsi || false;
        const amanTorsi2 = data?.amanTorsi2 || data?.amanTorsi || false;
        const Acp = parseFloat(data?.Acp) || 0;
        const Pcp = parseFloat(data?.Pcp) || 0;
        const A0h = parseFloat(data?.A0h) || 0;
        const ph = parseFloat(data?.ph) || 0;
        const A0 = parseFloat(data?.A0) || 0;
        const At = parseFloat(data?.At) || 0;
        
        let rows = [];
        
        if (perluTorsi) {
            rows = [
                { parameter: "$T_n = T_u / \\phi$", hasil: formatNumber(Tn, 3), satuan: 'kNm' },
                { parameter: "$A_{cp} = b \\times h$", hasil: formatNumber(Acp, 0), satuan: 'mm²' },
                { parameter: "$P_{cp} = 2 \\times (b + h)$", hasil: formatNumber(Pcp, 0), satuan: 'mm' },
                { parameter: "$T_{u,min} = \\phi \\times 0.083 \\times \\sqrt{f'_c} \\times (A_{cp}^2 / P_{cp})$", hasil: formatNumber(Tu_min, 3), satuan: 'kNm' },
                { 
                    parameter: "$T_u > T_{u,min}$", 
                    isStatus: true, 
                    statusHtml: `<span class="kondisi-text">Perlu tulangan torsi</span>` 
                },
                { parameter: "$A_{0h} = (b - 2 \\times (\\phi + S_b)) \\times (h - 2 \\times (\\phi + S_b))$", hasil: formatNumber(A0h, 0), satuan: 'mm²' },
                { parameter: "$p_h = 2 \\times (b + h - 4\\phi - 4S_b)$", hasil: formatNumber(ph, 0), satuan: 'mm' },
                { parameter: "$A_0 = 0.85 \\times A_{0h}$", hasil: formatNumber(A0, 0), satuan: 'mm²' },
                { parameter: "$A_t = \\dfrac{T_n \\times s}{2 \\times A_0 \\times f_{yt} \\times \\cot\\theta}$", hasil: formatNumber(At, 2), satuan: 'mm²' },
                { 
                    parameter: "$A_{1,formula1} = \\dfrac{A_t}{s} \\times p_h \\times \\dfrac{f_{yt}}{f_y} \\times \\cot^2\\theta$", 
                    hasil: formatNumber(A1_formula1, 2), 
                    satuan: 'mm²' 
                },
                { 
                    parameter: "$A_{1,formula2} = 0.42 \\dfrac{\\sqrt{f'_c} \\times A_{cp}}{f_y} - \\dfrac{A_t}{s} \\times p_h \\times \\dfrac{f_{yt}}{f_y}$", 
                    hasil: formatNumber(A1_formula2, 2), 
                    satuan: 'mm²' 
                },
                { parameter: "$A_1 = \\max(A_{1,formula1}, A_{1,formula2})$", hasil: formatNumber(A1, 2), satuan: 'mm²' },
                { parameter: "$(A_v + A_t)$", hasil: formatNumber(Avt, 2), satuan: 'mm²' },
                { 
                    parameter: "$0.062 \\sqrt{f'_c} \\dfrac{b \\cdot s}{f_{yt}} \\le (A_v + A_t)$", 
                    isComparison: true, 
                    statusHtml: `<span class="${amanBegel1 ? 'status-aman' : 'status-tidak-aman'}">${amanBegel1 ? 'AMAN' : 'TIDAK AMAN'}</span>`
                },
                { 
                    parameter: "$0.35 \\dfrac{b \\cdot s}{f_{yt}} \\le (A_v + A_t)$", 
                    isComparison: true, 
                    statusHtml: `<span class="${amanBegel2 ? 'status-aman' : 'status-tidak-aman'}">${amanBegel2 ? 'AMAN' : 'TIDAK AMAN'}</span>`
                },
                { parameter: "$A_t / s$", hasil: formatNumber(At_per_S, 3), satuan: 'mm²/mm' },
                { 
                    parameter: "$0.175 \\dfrac{b}{f_{yt}} \\le A_t/s$", 
                    isComparison: true, 
                    statusHtml: `<span class="${amanTorsi1 ? 'status-aman' : 'status-tidak-aman'}">${amanTorsi1 ? 'AMAN' : 'TIDAK AMAN'}</span>`
                },
                { 
                    parameter: "$n = \\lceil A_1 / (0.25 \\times \\pi \\times D^2) \\rceil$", 
                    hasil: n, 
                    satuan: 'batang' 
                },
                { 
                    parameter: "$A_{1,terpasang} = n \\times 0.25 \\times \\pi \\times D^2$", 
                    hasil: formatNumber(A1_terpasang, 2), 
                    satuan: 'mm²' 
                },
                { 
                    parameter: "$A_1 \\le A_{1,terpasang}$", 
                    isComparison: true, 
                    statusHtml: `<span class="${amanTorsi2 ? 'status-aman' : 'status-tidak-aman'}">${amanTorsi2 ? 'AMAN' : 'TIDAK AMAN'}</span>`
                },
                { parameter: `<strong>Digunakan Tulangan Torsi ${n}D${diameterTulangan}</strong>`, isFullRow: true, hasil: "", satuan: "" }
            ];
        } else {
            rows = [
                { parameter: "$T_n = T_u / \\phi$", hasil: formatNumber(Tn, 3), satuan: 'kNm' },
                { parameter: "$A_{cp} = b \\times h$", hasil: formatNumber(Acp, 0), satuan: 'mm²' },
                { parameter: "$P_{cp} = 2 \\times (b + h)$", hasil: formatNumber(Pcp, 0), satuan: 'mm' },
                { parameter: "$T_{u,min} = \\phi \\times 0.083 \\times \\sqrt{f'_c} \\times (A_{cp}^2 / P_{cp})$", hasil: formatNumber(Tu_min, 3), satuan: 'kNm' },
                { 
                    parameter: "$T_u \\le T_{u,min}$", 
                    isStatus: true, 
                    statusHtml: `<span class="kondisi-text">Tidak perlu tulangan torsi</span>` 
                },
                { parameter: `<strong>Tidak diperlukan tulangan torsi khusus</strong>`, isFullRow: true, hasil: "", satuan: "" }
            ];
        }
        
        return createThreeColumnTable(rows, true);
    }
    
    // Fungsi untuk membuat tabel rekapitulasi
    function createRekapitulasiTable() {
        const rekap = getData('rekap', {});
        const tumpuan = rekap?.tumpuan || {};
        const lapangan = rekap?.lapangan || {};
        
        let html = '<table class="rekap-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th class="rekap-col-tulangan" rowspan="2">Tulangan</th>';
        html += '<th class="rekap-col-tumpuan" colspan="2">Tumpuan</th>';
        html += '<th class="rekap-col-lapangan" colspan="2">Lapangan</th>';
        html += '</tr>';
        html += '<tr>';
        html += '<th class="rekap-col-tumpuan">Atas</th>';
        html += '<th class="rekap-col-tumpuan">Bawah</th>';
        html += '<th class="rekap-col-lapangan">Atas</th>';
        html += '<th class="rekap-col-lapangan">Bawah</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Lentur</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (tumpuan.tulangan_negatif || 'N/A') + '</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (tumpuan.tulangan_positif || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + (lapangan.tulangan_negatif || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + (lapangan.tulangan_positif || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Geser</td>';
        html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (tumpuan.begel || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center" colspan="2">' + (lapangan.begel || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Torsi</td>';
        html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (tumpuan.torsi || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center" colspan="2">' + (lapangan.torsi || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '</tbody>';
        html += '</table>';
        return html;
    }

    // Fungsi untuk mendapatkan informasi tulangan
    function getTulanganInfo() {
        let D = 'N/A';
        let phi = 'N/A';
        
        // Cek di inputData (mode evaluasi)
        if (getData('inputData.tulangan.d', 'N/A') !== 'N/A') {
            D = getData('inputData.tulangan.d');
        }
        if (getData('inputData.tulangan.phi', 'N/A') !== 'N/A') {
            phi = getData('inputData.tulangan.phi');
        }
        
        // Cek di optimasi (mode desain dengan optimasi)
        if (getData('optimasi.kombinasi_terpilih.D', 'N/A') !== 'N/A') {
            D = getData('optimasi.kombinasi_terpilih.D');
        }
        if (getData('optimasi.kombinasi_terpilih.phi', 'N/A') !== 'N/A') {
            phi = getData('optimasi.kombinasi_terpilih.phi');
        }
        
        return { D, phi };
    }
    
    // ==============================================
    // FUNGSI BARU: Kesimpulan Fleksibel (DIPERBAIKI)
    // ==============================================
    function generateDynamicConclusion() {
        // Hitung status balok secara dinamis
        const statusBalok = cekStatusBalok();
        
        const dimensi = getData('inputData.dimensi', {});
        const material = getData('inputData.material', {});
        const tulanganInfo = getTulanganInfo();
        
        // Ambil semua status kontrol
        const kontrolLentur = getData('kontrol.kontrolLentur', {});
        const kontrolGeser = getData('kontrol.kontrolGeser', {});
        const kontrolTorsi = getData('kontrol.kontrolTorsi', {});
        
        // Analisis status per komponen
        let masalah = [];
        let rekomendasi = [];
        
        // Analisis Lentur
        if (kontrolLentur) {
            const lenturProblems = [];
            let lenturCount = 0;
            
            // Cek tumpuan kiri negatif
            if (kontrolLentur.kiri_negatif) {
                if (!kontrolLentur.kiri_negatif.K_aman) {
                    lenturProblems.push("Kontrol K tidak aman pada tumpuan kiri momen negatif");
                    lenturCount++;
                }
                if (!kontrolLentur.kiri_negatif.rho_aman) {
                    lenturProblems.push("Rasio tulangan tidak memenuhi pada tumpuan kiri momen negatif");
                    lenturCount++;
                }
                if (!kontrolLentur.kiri_negatif.Md_aman) {
                    lenturProblems.push("Kapasitas momen tidak cukup pada tumpuan kiri momen negatif");
                    lenturCount++;
                }
            }
            
            // Cek tumpuan kanan negatif
            if (kontrolLentur.kanan_negatif) {
                if (!kontrolLentur.kanan_negatif.K_aman) {
                    lenturProblems.push("Kontrol K tidak aman pada tumpuan kanan momen negatif");
                    lenturCount++;
                }
                if (!kontrolLentur.kanan_negatif.rho_aman) {
                    lenturProblems.push("Rasio tulangan tidak memenuhi pada tumpuan kanan momen negatif");
                    lenturCount++;
                }
                if (!kontrolLentur.kanan_negatif.Md_aman) {
                    lenturProblems.push("Kapasitas momen tidak cukup pada tumpuan kanan momen negatif");
                    lenturCount++;
                }
            }
            
            // Cek lapangan positif
            if (kontrolLentur.tengah_positif) {
                if (!kontrolLentur.tengah_positif.K_aman) {
                    lenturProblems.push("Kontrol K tidak aman pada lapangan momen positif");
                    lenturCount++;
                }
                if (!kontrolLentur.tengah_positif.rho_aman) {
                    lenturProblems.push("Rasio tulangan tidak memenuhi pada lapangan momen positif");
                    lenturCount++;
                }
                if (!kontrolLentur.tengah_positif.Md_aman) {
                    lenturProblems.push("Kapasitas momen tidak cukup pada lapangan momen positif");
                    lenturCount++;
                }
            }
            
            if (lenturProblems.length > 0) {
                masalah.push(`<strong>Masalah pada tulangan lentur (${lenturCount} masalah):</strong>`);
                masalah.push(...lenturProblems.map(p => `<span class="problem-item">• ${p}</span>`));
                rekomendasi.push("Perlu penambahan atau perubahan tulangan lentur");
                rekomendasi.push("Pertimbangkan untuk menambah jumlah atau diameter tulangan");
            }
        }
        
        // Analisis Geser
        if (kontrolGeser) {
            const geserProblems = [];
            let geserCount = 0;
            
            if (kontrolGeser.kiri) {
                if (!kontrolGeser.kiri.Vs_aman) {
                    geserProblems.push("Kapasitas geser tidak mencukupi pada tumpuan kiri");
                    geserCount++;
                }
                if (!kontrolGeser.kiri.Av_aman) {
                    geserProblems.push("Luas tulangan geser tidak memadai pada tumpuan kiri");
                    geserCount++;
                }
            }
            if (kontrolGeser.tengah) {
                if (!kontrolGeser.tengah.Vs_aman) {
                    geserProblems.push("Kapasitas geser tidak mencukupi pada lapangan");
                    geserCount++;
                }
                if (!kontrolGeser.tengah.Av_aman) {
                    geserProblems.push("Luas tulangan geser tidak memadai pada lapangan");
                    geserCount++;
                }
            }
            if (kontrolGeser.kanan) {
                if (!kontrolGeser.kanan.Vs_aman) {
                    geserProblems.push("Kapasitas geser tidak mencukupi pada tumpuan kanan");
                    geserCount++;
                }
                if (!kontrolGeser.kanan.Av_aman) {
                    geserProblems.push("Luas tulangan geser tidak memadai pada tumpuan kanan");
                    geserCount++;
                }
            }
            
            if (geserProblems.length > 0) {
                masalah.push(`<strong>Masalah pada tulangan geser (${geserCount} masalah):</strong>`);
                masalah.push(...geserProblems.map(p => `<span class="problem-item">• ${p}</span>`));
                rekomendasi.push("Perlu penambahan atau pengurangan jarak sengkang");
                rekomendasi.push("Pertimbangkan untuk menambah jumlah kaki sengkang atau diameter sengkang");
            }
        }
        
        // Analisis Torsi
        if (kontrolTorsi) {
            const torsiProblems = [];
            let torsiCount = 0;
            
            if (kontrolTorsi.kiri && !kontrolTorsi.kiri.perluDanAman) {
                torsiProblems.push("Tulangan torsi tidak memadai pada tumpuan kiri");
                torsiCount++;
            }
            if (kontrolTorsi.tengah && !kontrolTorsi.tengah.perluDanAman) {
                torsiProblems.push("Tulangan torsi tidak memadai pada lapangan");
                torsiCount++;
            }
            if (kontrolTorsi.kanan && !kontrolTorsi.kanan.perluDanAman) {
                torsiProblems.push("Tulangan torsi tidak memadai pada tumpuan kanan");
                torsiCount++;
            }
            
            if (torsiProblems.length > 0) {
                masalah.push(`<strong>Masalah pada tulangan torsi (${torsiCount} masalah):</strong>`);
                masalah.push(...torsiProblems.map(p => `<span class="problem-item">• ${p}</span>`));
                rekomendasi.push("Perlu penambahan tulangan torsi longitudinal");
                rekomendasi.push("Periksa kebutuhan tulangan torsi tambahan");
            }
        }
        
        // Buat HTML kesimpulan dinamis
        let conclusionHTML = `
            <div class="section-group">
                <h3>3. Kesimpulan</h3>
                <div class="conclusion-box">
                    <h4 style="text-align: center; ${statusBalok === 'aman' ? 'color: #155724;' : 'color: #721c24;'} margin-bottom: 8px;">
                        <strong>STRUKTUR BALOK BETON BERTULANG ${statusBalok === 'aman' ? 'AMAN' : 'TIDAK AMAN'}</strong>
                    </h4>
        `;
        
        // Ringkasan status
        if (statusBalok === 'aman') {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p>
                <p>Struktur balok dengan dimensi ${dimensi.b || 'N/A'} × ${dimensi.h || 'N/A'} mm memenuhi semua persyaratan SNI 2847:2019 untuk:</p>
                <ul>
                    <li>Kuat lentur (momen positif dan negatif)</li>
                    <li>Kuat geser</li>
                    <li>Kuat torsi (jika diperlukan)</li>
                    <li>Persyaratan detail tulangan</li>
                </ul>
            `;
            
            // Rekomendasi untuk kondisi aman
            rekomendasi = [
                "Gunakan tulangan D" + tulanganInfo.D + " untuk tulangan lentur",
                "Gunakan sengkang ɸ" + tulanganInfo.phi + " dengan jarak sesuai hasil perhitungan",
                "Pasang tulangan torsi sesuai hasil perhitungan",
                "Pastikan mutu beton mencapai f'c = " + (material.fc || 'N/A') + " MPa",
                "Pastikan mutu baja mencapai fy = " + (material.fy || 'N/A') + " MPa",
                "Lakukan pengecoran dengan metode yang sesuai standar"
            ];
        } else {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-tidak-aman">TIDAK AMAN - PERLU PERBAIKAN DESAIN</span></p>
                <p>Ditemukan masalah pada beberapa aspek desain:</p>
                <div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                    ${masalah.length > 0 ? masalah.join('') : '<p class="problem-item">• Terdapat masalah pada satu atau lebih kontrol keamanan</p>'}
                </div>
            `;
            
            // Rekomendasi tambahan untuk kondisi tidak aman
            if (masalah.length === 0) {
                rekomendasi.push("Tinjau kembali dimensi balok: " + (dimensi.b || 'N/A') + " × " + (dimensi.h || 'N/A') + " mm");
                rekomendasi.push("Evaluasi ulang mutu material yang digunakan");
                rekomendasi.push("Pertimbangkan untuk menggunakan tulangan dengan diameter lebih besar");
                rekomendasi.push("Periksa kembali konfigurasi tulangan torsi dan geser");
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
                <strong>Catatan:</strong> Hasil perhitungan ini berdasarkan SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung). 
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
    // MODIFIKASI: Data Tulangan Sesuai Permintaan
    // ==============================================
    function createTulanganTable() {
        let tulanganRows = [];
        const tulanganInfo = getTulanganInfo();
        const mode = getData('mode', 'N/A');
        
        // Data dasar tulangan (selalu tampilkan D dan ɸ)
        tulanganRows.push(
            { parameter: "D (Diameter tulangan utama)", hasil: tulanganInfo.D, satuan: "mm" },
            { parameter: "ɸ (Diameter tulangan bagi)", hasil: tulanganInfo.phi, satuan: "mm" }
        );
        
        // Untuk mode evaluasi: tampilkan data tambahan
        if (mode === 'evaluasi') {
            const inputTulangan = getData('inputData.tulangan', {});
            
            // Data tulangan tumpuan
            if (inputTulangan.support && Object.keys(inputTulangan.support).length > 0) {
                tulanganRows.push({ parameter: "<strong>Data Tulangan Tumpuan</strong>", hasil: "", satuan: "" });
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;n (jumlah tulangan tarik)", 
                    hasil: inputTulangan.support.n || 'N/A', 
                    satuan: "batang" 
                });
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;n' (jumlah tulangan tekan)", 
                    hasil: inputTulangan.support.np || 'N/A', 
                    satuan: "batang" 
                });
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;nt (jumlah tulangan torsi)", 
                    hasil: inputTulangan.support.nt || 'N/A', 
                    satuan: "batang" 
                });
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;s (jarak sengkang)", 
                    hasil: inputTulangan.support.s || 'N/A', 
                    satuan: "mm" 
                });
            }
            
            // Data tulangan lapangan
            if (inputTulangan.field && Object.keys(inputTulangan.field).length > 0) {
                tulanganRows.push({ parameter: "<strong>Data Tulangan Lapangan</strong>", hasil: "", satuan: "" });
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;n (jumlah tulangan tarik)", 
                    hasil: inputTulangan.field.n || 'N/A', 
                    satuan: "batang" 
                });
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;n' (jumlah tulangan tekan)", 
                    hasil: inputTulangan.field.np || 'N/A', 
                    satuan: "batang" 
                });
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;nt (jumlah tulangan torsi)", 
                    hasil: inputTulangan.field.nt || 'N/A', 
                    satuan: "batang" 
                });
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;s (jarak sengkang)", 
                    hasil: inputTulangan.field.s || 'N/A', 
                    satuan: "mm" 
                });
            }
        } 
        
        return createThreeColumnTable(tulanganRows, false, true);
    }
    
    // ==============================================
    // FUNGSI UTAMA: Generate Content Blocks
    // ==============================================
    function generateContentBlocks() {
        const blocks = [];
        
        // Gunakan status balok yang dihitung secara dinamis
        const statusBalokDinamis = cekStatusBalok();
        
        blocks.push(`
            <h1>LAPORAN PERHITUNGAN BALOK BETON BERTULANG</h1>
            <div class="header-info">
                <div>
                    <span><strong>Mode:</strong> ${getData('mode', 'N/A').toUpperCase()}</span>
                    <span><strong>Modul:</strong> ${getData('module', 'N/A').toUpperCase()}</span>
                </div>
                <div>
                    <span><strong>Tanggal:</strong> ${formatTimestampFull(getData('timestamp'))}</span>
                    <span><strong>Status:</strong> <span class="${statusBalokDinamis === 'aman' ? 'status-aman' : 'status-tidak-aman'}">${statusBalokDinamis.toUpperCase()}</span></span>
                </div>
            </div>
            <h2>A. DATA INPUT DAN PARAMETER</h2>
        `);
        
        const materialDimensiRows = [
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: getData('inputData.material.fc'), satuan: 'MPa' },
            { parameter: "$f_y$ (Tegangan leleh tulangan lentur)", hasil: getData('inputData.material.fy'), satuan: 'MPa' },
            { parameter: "$f_{yt}$ (Tegangan leleh tulangan geser)", hasil: getData('inputData.material.fyt'), satuan: 'MPa' },
            { parameter: "$h$ (Tinggi balok)", hasil: getData('inputData.dimensi.h'), satuan: 'mm' },
            { parameter: "$b$ (Lebar balok)", hasil: getData('inputData.dimensi.b'), satuan: 'mm' },
            { parameter: "$s_b$ (Selimut beton)", hasil: getData('inputData.dimensi.sb'), satuan: 'mm' }
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
                ${createBebanTable()}
            </div>
        `);
        
        // Gunakan fungsi baru untuk tabel tulangan
        blocks.push(`
            <div class="section-group">
                <h3>3. Data Tulangan</h3>
                ${createTulanganTable()}
            </div>
        `);
        
        const parameterRows = [
            { parameter: "$\\displaystyle m = \\left\\lfloor \\frac{b - 2d_{s1}}{D + s_b} \\right\\rfloor + 1$", hasil: getData('data.m'), satuan: '-' },
            { parameter: "$S_{nv} = \\max(25, D)$", hasil: getData('data.Snv'), satuan: 'mm' },
            { parameter: "$\\displaystyle d_{s1} = S_b + \\phi + \\frac{D}{2}$", hasil: getData('data.ds1'), satuan: 'mm' },
            { parameter: "$\\displaystyle d_{s2} = d_{s1} + \\frac{D + S_{nv}}{2}$", hasil: getData('data.ds2'), satuan: 'mm' },
            { parameter: "$\\displaystyle d_{s3} = d_{s1} + D + S_{nv}$", hasil: getData('data.ds3'), satuan: 'mm' },
            { parameter: "$d_s$", hasil: getData('data.ds'), satuan: 'mm' },
            { parameter: "$d_s'$", hasil: getData('data.ds_'), satuan: 'mm' },
            { parameter: "$\\displaystyle d = h - d_s$", hasil: getData('data.d'), satuan: 'mm' },
            { parameter: "$\\displaystyle d' = h - d_s'$", hasil: getData('data.d_'), satuan: 'mm' },
            { parameter: "$\\displaystyle \\beta_1 = \\begin{cases} 0.85 & f'_c \\leq 28 \\text{ MPa} \\\\ 0.85 - 0.05\\dfrac{f'_c - 28}{7} & 28 < f'_c < 55 \\text{ MPa} \\\\ 0.65 & f'_c \\geq 55 \\text{ MPa} \\end{cases}$", hasil: getData('data.beta1'), satuan: '-' },
            { parameter: "$\\displaystyle K_{\\text{maks}} = \\dfrac{382.5 \\beta_1 f'_c (600 + f_y - 225 \\beta_1)}{(600 + f_y)^2}$", hasil: getData('data.Kmaks'), satuan: 'MPa' }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>4. Perhitungan Parameter</h3>
                ${createThreeColumnTable(parameterRows)}
            </div>
        `);
        
        const headerB = `
            <div class="header-content-group">
                <h2>B. PERHITUNGAN TULANGAN LENTUR NEGATIF</h2>
                <p class="note">Tulangan negatif dipasang pada daerah tarik di atas (saat momen negatif)</p>
            </div>
        `;
        
        const fc = parseFloat(getData('inputData.material.fc', 20));
        const fy = parseFloat(getData('inputData.material.fy', 300));
        const b_val = parseFloat(getData('inputData.dimensi.b', 250));
        const d_eff_negatif = getData('data.d', 315);
        
        let contentB1 = '';
        if (getData('data.tulanganKirinegatif') && getData('data.tulanganKirinegatif') !== 'N/A') {
            const data = getData('data.tulanganKirinegatif');
            const status = getData('kontrol.kontrolLentur.kiri_negatif');
            
            contentB1 = `
                <div class="section-group">
                    <h3>1. Tumpuan Kiri ($M_u^- = ${formatNumber(data.Mu, 3)} \\text{ kNm}$)</h3>
                    ${createLenturTableFull(data, status, d_eff_negatif, fc, fy, b_val, "Tumpuan Kiri", data.Mu)}
                </div>
            `;
        }
        
        if (contentB1) {
            blocks.push(headerB + contentB1);
        } else {
            blocks.push(headerB);
        }
        
        if (getData('data.tulanganTengahnegatif') && getData('data.tulanganTengahnegatif') !== 'N/A') {
            const data = getData('data.tulanganTengahnegatif');
            const status = getData('kontrol.kontrolLentur.tengah_negatif');
            
            blocks.push(`
                <div class="section-group">
                    <h3>2. Lapangan Tengah ($M_u^- = ${formatNumber(data.Mu, 3)} \\text{ kNm}$)</h3>
                    ${createLenturTableFull(data, status, d_eff_negatif, fc, fy, b_val, "Lapangan Tengah", data.Mu)}
                </div>
            `);
        }
        
        if (getData('data.tulanganKanannegatif') && getData('data.tulanganKanannegatif') !== 'N/A') {
            const data = getData('data.tulanganKanannegatif');
            const status = getData('kontrol.kontrolLentur.kanan_negatif');
            
            blocks.push(`
                <div class="section-group">
                    <h3>3. Tumpuan Kanan ($M_u^- = ${formatNumber(data.Mu, 3)} \\text{ kNm}$)</h3>
                    ${createLenturTableFull(data, status, d_eff_negatif, fc, fy, b_val, "Tumpuan Kanan", data.Mu)}
                </div>
            `);
        }
        
        const headerC = `
            <div class="header-content-group">
                <h2>C. PERHITUNGAN TULANGAN LENTUR POSITIF</h2>
                <p class="note">Tulangan positif dipasang pada daerah tarik di bawah (saat momen positif)</p>
            </div>
        `;
        
        const d_eff_positif = getData('data.d_', 340);
        
        let contentC1 = '';
        if (getData('data.tulanganKiripositif') && getData('data.tulanganKiripositif') !== 'N/A') {
            const data = getData('data.tulanganKiripositif');
            const status = getData('kontrol.kontrolLentur.kiri_positif');
            
            contentC1 = `
                <div class="section-group">
                    <h3>1. Tumpuan Kiri ($M_u^+ = ${formatNumber(data.Mu, 3)} \\text{ kNm}$)</h3>
                    ${createLenturTableFull(data, status, d_eff_positif, fc, fy, b_val, "Tumpuan Kiri", data.Mu)}
                </div>
            `;
        }
        
        if (contentC1) {
            blocks.push(headerC + contentC1);
        } else {
            blocks.push(headerC);
        }
        
        if (getData('data.tulanganTengahpositif') && getData('data.tulanganTengahpositif') !== 'N/A') {
            const data = getData('data.tulanganTengahpositif');
            const status = getData('kontrol.kontrolLentur.tengah_positif');
            
            blocks.push(`
                <div class="section-group">
                    <h3>2. Lapangan Tengah ($M_u^+ = ${formatNumber(data.Mu, 3)} \\text{ kNm}$)</h3>
                    ${createLenturTableFull(data, status, d_eff_positif, fc, fy, b_val, "Lapangan Tengah", data.Mu)}
                </div>
            `);
        }
        
        if (getData('data.tulanganKananpositif') && getData('data.tulanganKananpositif') !== 'N/A') {
            const data = getData('data.tulanganKananpositif');
            const status = getData('kontrol.kontrolLentur.kanan_positif');
            
            blocks.push(`
                <div class="section-group">
                    <h3>3. Tumpuan Kanan ($M_u^+ = ${formatNumber(data.Mu, 3)} \\text{ kNm}$)</h3>
                    ${createLenturTableFull(data, status, d_eff_positif, fc, fy, b_val, "Tumpuan Kanan", data.Mu)}
                </div>
            `);
        }
        
        let bagianDContent = `
            <div class="header-content-group keep-together">
                <h2>D. PERHITUNGAN TULANGAN GESER DAN TORSI</h2>
        `;
        
        const fyt = parseFloat(getData('inputData.material.fyt', 300));
        const dmin = getData('data.dmin', 315);
        const h_val = parseFloat(getData('inputData.dimensi.h', 400));
        const nKaki = 2;
        const tulanganInfo = getTulanganInfo();
        const diameterSengkang = tulanganInfo.phi === 'N/A' ? 8 : parseFloat(tulanganInfo.phi);
        const diameterTulangan = tulanganInfo.D === 'N/A' ? 19 : parseFloat(tulanganInfo.D);
        
        if (getData('data.begelkiri') && getData('data.begelkiri') !== 'N/A') {
            const data = getData('data.begelkiri');
            const status = getData('kontrol.kontrolGeser.kiri');
            
            bagianDContent += `
                <div class="section-group">
                    <h3>1. Tulangan Geser - Tumpuan Kiri ($V_u = ${formatNumber(data.Vu)} \\text{ kN}$)</h3>
                    ${createGeserTableDetail(data, "Tumpuan Kiri", status, fc, fyt, b_val, dmin, nKaki, diameterSengkang)}
                </div>
            `;
        }
        
        bagianDContent += `</div>`;
        blocks.push(bagianDContent);
        
        if (getData('data.begeltengah') && getData('data.begeltengah') !== 'N/A') {
            const data = getData('data.begeltengah');
            const status = getData('kontrol.kontrolGeser.tengah');
            
            blocks.push(`
                <div class="section-group">
                    <h3>2. Tulangan Geser - Lapangan ($V_u = ${formatNumber(data.Vu)} \\text{ kN}$)</h3>
                    ${createGeserTableDetail(data, "Lapangan", status, fc, fyt, b_val, dmin, nKaki, diameterSengkang)}
                </div>
            `);
        }
        
        if (getData('data.begelkanan') && getData('data.begelkanan') !== 'N/A') {
            const data = getData('data.begelkanan');
            const status = getData('kontrol.kontrolGeser.kanan');
            
            blocks.push(`
                <div class="section-group">
                    <h3>3. Tulangan Geser - Tumpuan Kanan ($V_u = ${formatNumber(data.Vu)} \\text{ kN}$)</h3>
                    ${createGeserTableDetail(data, "Tumpuan Kanan", status, fc, fyt, b_val, dmin, nKaki, diameterSengkang)}
                </div>
            `);
        }
        
        // Perhitungan Torsi dengan struktur data baru
        if (getData('data.torsikiri') && getData('data.torsikiri') !== 'N/A') {
            const data = getData('data.torsikiri');
            const status = getData('kontrol.kontrolTorsi.kiri');
            
            blocks.push(`
                <div class="section-group">
                    <h3>4. Tulangan Torsi - Tumpuan Kiri ($T_u = ${formatNumber(data.Tu, 3)} \\text{ kNm}$)</h3>
                    ${createTorsiTableDetail(data, "Tumpuan Kiri", status, fc, fy, fyt, b_val, h_val, nKaki, diameterSengkang, diameterTulangan)}
                </div>
            `);
        }
        
        if (getData('data.torsitengah') && getData('data.torsitengah') !== 'N/A') {
            const data = getData('data.torsitengah');
            const status = getData('kontrol.kontrolTorsi.tengah');
            
            blocks.push(`
                <div class="section-group">
                    <h3>5. Tulangan Torsi - Lapangan ($T_u = ${formatNumber(data.Tu, 3)} \\text{ kNm}$)</h3>
                    ${createTorsiTableDetail(data, "Lapangan", status, fc, fy, fyt, b_val, h_val, nKaki, diameterSengkang, diameterTulangan)}
                </div>
            `);
        }
        
        if (getData('data.torsikanan') && getData('data.torsikanan') !== 'N/A') {
            const data = getData('data.torsikanan');
            const status = getData('kontrol.kontrolTorsi.kanan');
            
            blocks.push(`
                <div class="section-group">
                    <h3>6. Tulangan Torsi - Tumpuan Kanan ($T_u = ${formatNumber(data.Tu, 3)} \\text{ kNm}$)</h3>
                    ${createTorsiTableDetail(data, "Tumpuan Kanan", status, fc, fy, fyt, b_val, h_val, nKaki, diameterSengkang, diameterTulangan)}
                </div>
            `);
        }
        
        const headerE = `
            <div class="header-content-group">
                <h2>E. REKAPITULASI HASIL DESAIN</h2>
            </div>
        `;
        
        const contentE1 = `
            <div class="section-group">
                <h3>1. Tulangan Terpasang</h3>
                ${createRekapitulasiTable()}
            </div>
        `;
        
        blocks.push(headerE + contentE1);
        
        const kontrolRows = [
            { 
                parameter: "$K \\le K_{maks}$", 
                statusHtml: `<span class="${getData('kontrol.kontrolLentur.kiri_negatif.K_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kontrolLentur.kiri_negatif.K_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$\\rho_{min} \\le \\rho \\le \\rho_{max}$", 
                statusHtml: `<span class="${getData('kontrol.kontrolLentur.kiri_negatif.rho_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kontrolLentur.kiri_negatif.rho_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$M_d \\ge M_u$", 
                statusHtml: `<span class="${getData('kontrol.kontrolLentur.kiri_negatif.Md_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kontrolLentur.kiri_negatif.Md_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$V_s \\le V_{s,max}$", 
                statusHtml: `<span class="${getData('kontrol.kontrolGeser.kiri.Vs_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kontrolGeser.kiri.Vs_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$A_{v,terpasang} \\ge A_{v,u}$", 
                statusHtml: `<span class="${getData('kontrol.kontrolGeser.kiri.Av_aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kontrolGeser.kiri.Av_aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "Kontrol torsi (kebutuhan & kapasitas)", 
                statusHtml: `<span class="${getData('kontrol.kontrolTorsi.kiri.perluDanAman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kontrolTorsi.kiri.perluDanAman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
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
    window.balokReport = {
        setData: setData,
        generateContentBlocks: generateContentBlocks,
        cekStatusBalok: cekStatusBalok,
        formatNumber: formatNumber,
        getData: getData
    };
})();