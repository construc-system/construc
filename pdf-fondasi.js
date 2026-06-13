// pdf-fondasi.js dengan formatNumber smart decimal yang lebih baik
// REVISI:
// - Header tabel center align
// - Hapus page-break-inside: avoid untuk sub-bagian tulangan persegi panjang (poin 1 dan 2)
// - Data tulangan: untuk bujur sangkar hanya tampilkan D dan s (Db tidak muncul)
// - Kontrol luas tulangan dan spasi minimal tetap ada

(function() {
    let resultData;

    function setData(data) { resultData = data; }

    function getData(path, defaultValue = 'N/A') {
        try {
            const keys = path.split('.');
            let value = resultData;
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) value = value[key];
                else return defaultValue;
            }
            return value !== undefined && value !== null ? value : defaultValue;
        } catch (error) { return defaultValue; }
    }

    // ==============================================
    // SMART DECIMAL
    // ==============================================
    function formatNumber(num, fixedDecimals = null) {
        if (num === null || num === undefined || num === 'N/A' || isNaN(num)) return 'N/A';
        let value = parseFloat(num);
        const roundedInt = Math.round(value);
        if (Math.abs(value - roundedInt) < 1e-10) return roundedInt.toString();
        if (fixedDecimals !== null && !isNaN(fixedDecimals)) {
            return value.toFixed(fixedDecimals);
        }
        const absVal = Math.abs(value);
        const intPart = Math.floor(absVal);
        const digitCount = intPart.toString().length;
        let maxDecimals;
        if (digitCount === 1) maxDecimals = 3;
        else if (digitCount === 2) maxDecimals = 2;
        else maxDecimals = 1;
        let bestDecimals = maxDecimals;
        for (let k = maxDecimals; k >= 1; k--) {
            const rounded = value.toFixed(k);
            if (Math.abs(parseFloat(rounded) - value) < 1e-8) {
                bestDecimals = k;
                break;
            }
        }
        for (let k = bestDecimals - 1; k >= 1; k--) {
            const rounded = value.toFixed(k);
            if (Math.abs(parseFloat(rounded) - value) < 1e-8) {
                bestDecimals = k;
            } else {
                break;
            }
        }
        return value.toFixed(bestDecimals);
    }

    function formatTimestampFull(timestamp) {
        const src = timestamp ? new Date(timestamp) : new Date();
        const day = src.getDate();
        const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
        const month = monthNames[src.getMonth()];
        const year = src.getFullYear();
        const hours = String(src.getHours()).padStart(2,'0');
        const minutes = String(src.getMinutes()).padStart(2,'0');
        return `${day} ${month} ${year} pukul ${hours}.${minutes}`;
    }

    function cekStatusFondasi() {
        const kontrol = getData('kontrol', {});
        const semuaAman = kontrol.sigmaMinAman === true && kontrol.dayaDukung?.aman === true &&
                          kontrol.geser?.aman1 === true && kontrol.geser?.aman2 === true &&
                          kontrol.tulangan?.aman === true && kontrol.kuatDukung?.aman === true &&
                          kontrol.tulanganTambahan?.aman === true &&
                          kontrol.luasTulangan?.aman === true;
        if (getData('mode') === 'evaluasi' && kontrol.evaluasiTulangan)
            return semuaAman && kontrol.evaluasiTulangan.aman === true ? 'aman' : 'tidak aman';
        return semuaAman ? 'aman' : 'tidak aman';
    }

    // REVISI: header tabel center align
    function createThreeColumnTable(rows, withStatus = false, isDataTable = false) {
        let html = '<table class="three-col-table" style="width:100%; border-collapse:collapse; table-layout:fixed;"><colgroup><col style="width:65%"><col style="width:20%"><col style="width:15%"></colgroup><thead>';
        if (isDataTable) html += '<tr><th style="text-align:left;">Parameter</th><th style="text-align:center;">Data</th><th style="text-align:center;">Satuan</th></tr>';
        else html += '<tr><th style="text-align:left;">Parameter Perhitungan</th><th style="text-align:center;">Hasil</th><th style="text-align:center;">Satuan</th></tr>';
        html += '</thead><tbody>';
        rows.forEach(row => {
            const rowClass = row.parameter.includes('<strong>') && !row.hasil ? 'header-row' : '';
            if (row.isFullRow) html += `<tr class="${rowClass}"><td colspan="3" style="text-align:center;">${row.parameter}</td></tr>`;
            else if ((row.isStatus || row.isComparison) && withStatus)
                html += `<tr class="${rowClass}"><td class="col-param${row.isComparison ? ' rumus-kondisi' : ''}" style="text-align:left;">${row.parameter}</td><td colspan="2" style="text-align:center;">${row.statusHtml}</td></tr>`;
            else
                html += `<tr class="${rowClass}"><td style="text-align:left;">${row.parameter}</td><td style="text-align:center;">${row.hasilHtml || row.hasil || ''}</td><td style="text-align:center;">${row.satuan || ''}</td></tr>`;
        });
        html += '</tbody></table>';
        return html;
    }

    function createTwoColumnTable(rows) {
        let html = '<table class="two-col-table" style="width:100%; border-collapse:collapse;"><thead><tr><th style="text-align:center;">Parameter</th><th style="text-align:center;">Status</th></tr></thead><tbody>';
        rows.forEach(row => {
            if (row.isFullRow) html += `<tr><td colspan="2" style="text-align:center;">${row.parameter}</td></tr>`;
            else html += `<tr><td style="text-align:left;">${row.parameter}</td><td style="text-align:center;">${row.statusHtml}</td></tr>`;
        });
        html += '</tbody></table>';
        return html;
    }

    // ==================== TABEL DATA INPUT ====================
    function createMaterialDimensiTable() {
        const fd = getData('inputData.fondasi.dimensi', {});
        const mat = getData('inputData.material', {});
        return createThreeColumnTable([
            { parameter: "$L_x$ (Panjang arah x)", hasil: formatNumber(fd.lx), satuan: "m" },
            { parameter: "$L_y$ (Panjang arah y)", hasil: formatNumber(fd.ly), satuan: "m" },
            { parameter: "$B_x$ (Lebar kolom arah x)", hasil: formatNumber(fd.bx), satuan: "mm" },
            { parameter: "$B_y$ (Lebar kolom arah y)", hasil: formatNumber(fd.by), satuan: "mm" },
            { parameter: "$h$ (Tinggi fondasi)", hasil: formatNumber(fd.h), satuan: "m" },
            { parameter: "$\\alpha_s$ (Faktor letak fondasi)", hasil: formatNumber(fd.alpha_s), satuan: "-" },
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: formatNumber(mat.fc), satuan: "MPa" },
            { parameter: "$f_y$ (Tegangan leleh baja)", hasil: formatNumber(mat.fy), satuan: "MPa" },
            { parameter: "$\\gamma_c$ (Berat jenis beton)", hasil: formatNumber(mat.gammaC), satuan: "kN/m³" },
            { parameter: "$\\lambda$ (Faktor reduksi beton ringan)", hasil: formatNumber(mat.lambda || 1), satuan: "-" }
        ], false, true);
    }

    function createTanahTable() {
        const tanah = getData('inputData.tanah', {});
        const mode = getData('inputData.tanah.mode', 'auto');
        let rows = [];
        if (mode === 'manual') {
            const m = tanah.manual || {};
            rows.push({ parameter: "$q_a$ (Daya dukung tanah ijin)", hasil: formatNumber(m.qa), satuan: "kPa" });
            rows.push({ parameter: "$D_f$ (Kedalaman fondasi)", hasil: formatNumber(m.df), satuan: "m" });
            rows.push({ parameter: "$\\gamma$ (Berat jenis tanah)", hasil: formatNumber(m.gamma), satuan: "kN/m³" });
        } else {
            const a = tanah.auto || {};
            if (a.df && a.df !== 'N/A') rows.push({ parameter: "$D_f$ (Kedalaman fondasi)", hasil: formatNumber(a.df), satuan: "m" });
            if (a.gamma && a.gamma !== 'N/A') rows.push({ parameter: "$\\gamma$ (Berat jenis tanah)", hasil: formatNumber(a.gamma), satuan: "kN/m³" });
            if (a.terzaghi === true || a.terzaghi === 'true') {
                if (a.phi && a.phi !== 'N/A') rows.push({ parameter: "$\\phi$ (Sudut geser dalam)", hasil: formatNumber(a.phi), satuan: "°" });
                if (a.c && a.c !== 'N/A') rows.push({ parameter: "$c$ (Kohesi)", hasil: formatNumber(a.c), satuan: "kPa" });
            }
            if (a.mayerhoff === true || a.mayerhoff === 'true') {
                if (a.qc && a.qc !== 'N/A') rows.push({ parameter: "$q_c$ (Tekanan konus)", hasil: formatNumber(a.qc), satuan: "kPa" });
            }
        }
        return createThreeColumnTable(rows, false, true);
    }

    function createBebanTable() {
        const b = getData('inputData.beban', {});
        return createThreeColumnTable([
            { parameter: "$P_u$ (Beban aksial ultimit)", hasil: formatNumber(b.pu), satuan: "kN" },
            { parameter: "$M_{ux}$ (Momen ultimit arah x)", hasil: formatNumber(b.mux), satuan: "kNm" },
            { parameter: "$M_{uy}$ (Momen ultimit arah y)", hasil: formatNumber(b.muy), satuan: "kNm" }
        ], false, true);
    }

    // REVISI: Data tulangan hanya tampilkan Db jika mode persegi_panjang atau menerus
    function createTulanganTable() {
        const mode = getData('mode', 'desain');
        const fMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        let tul = getData('inputData.tulangan', {});
        if (!tul || Object.keys(tul).length === 0) {
            const opt = getData('optimasi.kombinasi_terpilih', {});
            const asR = getData('optimasi.as_rincian_per_meter', {});
            tul = opt.D || opt.Db ? { d: opt.D, db: opt.Db, s: asR?.spasiUtama || 'N/A', sp: asR?.spasiPusat || 'N/A', st: asR?.spasiTepi || 'N/A', sb: 'N/A' }
                                 : { d: 'N/A', db: 'N/A', s: 'N/A', sp: 'N/A', st: 'N/A', sb: 'N/A' };
        }
        const rows = [
            { parameter: "$D$ (Diameter tulangan utama)", hasil: formatNumber(tul.d), satuan: "mm" }
        ];
        // Hanya tampilkan Db jika fondasi persegi panjang atau menerus (butuh tulangan bagi)
        if (fMode === 'persegi_panjang' || fMode === 'menerus') {
            rows.push({ parameter: "$D_b$ (Diameter tulangan bagi)", hasil: formatNumber(tul.db), satuan: "mm" });
        }
        if (mode === 'evaluasi') {
            if (fMode === 'bujur_sangkar') {
                rows.push({ parameter: "$s$ (Jarak tulangan utama)", hasil: formatNumber(tul.s), satuan: "mm" });
            } else if (fMode === 'persegi_panjang') {
                rows.push({ parameter: "$s$ (Jarak tulangan utama arah panjang)", hasil: formatNumber(tul.s), satuan: "mm" });
                rows.push({ parameter: "$s_p$ (Jarak tulangan pendek pusat)", hasil: formatNumber(tul.sp), satuan: "mm" });
                rows.push({ parameter: "$s_t$ (Jarak tulangan pendek tepi)", hasil: formatNumber(tul.st), satuan: "mm" });
            } else if (fMode === 'menerus') {
                rows.push({ parameter: "$s$ (Jarak tulangan utama)", hasil: formatNumber(tul.s), satuan: "mm" });
                rows.push({ parameter: "$s_b$ (Jarak tulangan bagi)", hasil: formatNumber(tul.sb), satuan: "mm" });
            }
        }
        return createThreeColumnTable(rows, false, true);
    }

    function createParameterTable() {
        const p = getData('data.parameter', {});
        const mat = getData('inputData.material', {});
        const tMode = getData('inputData.tanah.mode', 'auto');
        const fc = mat.fc || 20;
        const beta1_calc = fc <= 28 ? 0.85 : (fc < 55 ? 0.85 - 0.05 * ((fc - 28) / 7) : 0.65);
        let rows = [
            { parameter: "$d_s = s_{beton} + \\dfrac{D}{2}$", hasil: formatNumber(p.ds), satuan: "mm" },
            { parameter: "$d'_s = s_{beton} + D + \\dfrac{D}{2}$", hasil: formatNumber(p.ds2), satuan: "mm" },
            { parameter: "$d = h - d_s$", hasil: formatNumber(p.d), satuan: "mm" },
            { parameter: "$d' = h - d'_s$", hasil: formatNumber(p.d2), satuan: "mm" },
            { parameter: "$a = \\dfrac{L_y}{2} - \\dfrac{B_y}{2} - d$", hasil: formatNumber(p.a), satuan: "m" },
            { parameter: "$q = h \\cdot \\gamma_c + (D_f - h) \\cdot \\gamma$", hasil: formatNumber(p.q), satuan: "kPa" },
            { parameter: "$\\sigma_{min} = \\dfrac{P_u}{L_x L_y} - \\dfrac{M_{ux}}{\\frac{1}{6} L_x L_y^{2}} - \\dfrac{M_{uy}}{\\frac{1}{6} L_y L_x^{2}} + q$", hasil: formatNumber(p.sigma_min, 2), satuan: "kPa" },
            { parameter: "$\\sigma_{min} > 0$", isStatus: true, statusHtml: `<span class="${p.sigma_status === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${p.sigma_status || 'N/A'}</span>` },
            { parameter: "$\\sigma_{max} = \\dfrac{P_u}{L_x L_y} + \\dfrac{M_{ux}}{\\frac{1}{6} L_x L_y^{2}} + \\dfrac{M_{uy}}{\\frac{1}{6} L_y L_x^{2}} + q$", hasil: formatNumber(p.sigma_max, 2), satuan: "kPa" },
            { parameter: "$\\sigma_a = \\sigma_{min} + (L_y - a) \\cdot \\dfrac{\\sigma_{max} - \\sigma_{min}}{L_y}$", hasil: formatNumber(p.sigma_a, 2), satuan: "kPa" }
        ];
        if (tMode === 'manual') rows.push({ parameter: "$\\sigma_{max} \\le q_a$", isStatus: true, statusHtml: `<span class="${getData('kontrol.dayaDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.dayaDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` });
        rows.push(
            { parameter: "$x_1 = \\dfrac{L_y}{2} - \\dfrac{B_y}{2}$", hasil: formatNumber(p.x1), satuan: "m" },
            { parameter: "$x_2 = \\dfrac{L_x}{2} - \\dfrac{B_x}{2}$", hasil: formatNumber(p.x2), satuan: "m" },
            { parameter: "$b_0 = 2 \\times (B_x + d) + 2 \\times (B_y + d)$", hasil: formatNumber(p.b0), satuan: "mm" },
            { parameter: "$\\beta_1 = \\begin{cases} 0.85 & f'_c \\leq 28 \\text{ MPa} \\\\ 0.85 - 0.05\\dfrac{f'_c - 28}{7} & 28 < f'_c < 55 \\text{ MPa} \\\\ 0.65 & f'_c \\geq 55 \\text{ MPa} \\end{cases}$", hasil: formatNumber(p.beta1 || beta1_calc), satuan: "-" },
            { parameter: "$K_{\\max} = \\dfrac{382.5 \\beta_1 f'_c (600 + f_y - 225 \\beta_1)}{(600 + f_y)^{2}}$", hasil: formatNumber(p.Kmax), satuan: "MPa" }
        );
        return createThreeColumnTable(rows, true);
    }

    // ==================== DAYA DUKUNG ====================
    function createDayaDukungTable() {
        if (getData('inputData.tanah.mode', 'auto') === 'manual') return '<p class="note">Mode tanah: manual. Daya dukung tanah langsung dari input (tidak ada perhitungan).</p>';
        const dd = getData('data.dayaDukung', {});
        const auto = getData('inputData.tanah.auto', {});
        const terz = auto.terzaghi === true || auto.terzaghi === 'true';
        const meyer = auto.mayerhoff === true || auto.mayerhoff === 'true';
        let html = '';
        if (meyer) {
            let rows = [];
            if (dd.Kd && dd.Kd !== 'N/A') rows.push({ parameter: "$K_d = 1 + 0.33 \\dfrac{D_f}{L_x} \\le 1.33$", hasil: formatNumber(dd.Kd), satuan: "-" });
            if (dd.qa_meyerhof && dd.qa_meyerhof !== 'N/A') rows.push({ parameter: "$q_{a, Meyerhof} = \\dfrac{q_c}{33} \\cdot \\left(\\dfrac{L_x + 0.3}{L_x}\\right)^{2} \\cdot K_d \\times 100$", hasil: formatNumber(dd.qa_meyerhof), satuan: "kPa" });
            if (rows.length) html += `<div class="section-subgroup"><h4>1. Metode Meyerhof</h4>${createThreeColumnTable(rows)}</div>`;
        }
        if (terz) {
            let rows = [];
            if (dd.phi_rad && dd.phi_rad !== 'N/A') rows.push({ parameter: "$\\phi_{rad} = \\phi \\times \\dfrac{\\pi}{180}$", hasil: formatNumber(dd.phi_rad), satuan: "rad" });
            if (dd.a && dd.a !== 'N/A') rows.push({ parameter: "$a = e^{\\left(\\frac{3\\pi}{4} - \\frac{\\phi_{rad}}{2}\\right) \\tan(\\phi_{rad})}$", hasil: formatNumber(dd.a), satuan: "-" });
            if (dd.Kp_gamma && dd.Kp_gamma !== 'N/A') rows.push({ parameter: "$K_{p\\gamma} = 3 \\tan^{2}\\left(45^\\circ + \\dfrac{\\phi + 33^\\circ}{2}\\right)$", hasil: formatNumber(dd.Kp_gamma), satuan: "-" });
            if (dd.Nc && dd.Nc !== 'N/A') rows.push({ parameter: "$N_c = \\dfrac{1}{\\tan(\\phi_{rad})} \\left(\\dfrac{a^{2}}{2 \\cos^{2}\\left(\\frac{\\pi}{4} + \\frac{\\phi_{rad}}{2}\\right)} - 1\\right)$", hasil: formatNumber(dd.Nc), satuan: "-" });
            if (dd.Nq && dd.Nq !== 'N/A') rows.push({ parameter: "$N_q = \\dfrac{a^{2}}{2 \\cos^{2}\\left(\\frac{\\pi}{4} + \\frac{\\phi_{rad}}{2}\\right)}$", hasil: formatNumber(dd.Nq), satuan: "-" });
            if (dd.Ngamma && dd.Ngamma !== 'N/A') rows.push({ parameter: "$N_\\gamma = 0.5 \\tan(\\phi_{rad}) \\left(\\dfrac{K_{p\\gamma}}{\\cos^{2}(\\phi_{rad})} - 1\\right)$", hasil: formatNumber(dd.Ngamma), satuan: "-" });
            if (dd.qu_terzaghi && dd.qu_terzaghi !== 'N/A') rows.push({ parameter: "$q_u = c N_c \\left(1 + 0.3 \\frac{L_x}{L_y}\\right) + \\gamma D_f N_q + 0.5 \\gamma L_x N_\\gamma \\left(1 - 0.2 \\frac{L_x}{L_y}\\right)$", hasil: formatNumber(dd.qu_terzaghi), satuan: "kPa" });
            if (dd.qa_terzaghi && dd.qa_terzaghi !== 'N/A') rows.push({ parameter: "$q_{a, Terzaghi} = \\dfrac{q_u}{3}$", hasil: formatNumber(dd.qa_terzaghi), satuan: "kPa" });
            if (rows.length) html += `<div class="section-subgroup"><h4>${meyer ? '2. ' : '1. '}Metode Terzaghi</h4>${createThreeColumnTable(rows)}</div>`;
        }
        let kapRows = [];
        if (terz && meyer) kapRows.push({ parameter: "$q_a = \\min(q_{a, Terzaghi}, q_{a, Meyerhof})$", hasil: formatNumber(dd.qa), satuan: "kPa" });
        else if (terz) kapRows.push({ parameter: "$q_a = q_{a, Terzaghi}$", hasil: formatNumber(dd.qa), satuan: "kPa" });
        else if (meyer) kapRows.push({ parameter: "$q_a = q_{a, Meyerhof}$", hasil: formatNumber(dd.qa), satuan: "kPa" });
        if (kapRows.length) {
            kapRows.push({ parameter: "$\\sigma_{max} \\le q_a$", isStatus: true, statusHtml: `<span class="${getData('kontrol.dayaDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.dayaDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` });
            let num = 1 + (terz?1:0) + (meyer?1:0);
            html += `<div class="section-subgroup"><h4>${num}. Kapasitas Dukung yang Digunakan</h4>${createThreeColumnTable(kapRows, true)}</div>`;
        }
        return html;
    }

    // ==================== GESER ====================
    function createGeserSatuArahTable() {
        const g = getData('data.kontrolGeser', {});
        const mode = getData('data.actualFondasiMode', 'bujur_sangkar');
        let rows = mode === 'menerus' ? [
            { parameter: "$V_u = a \\cdot L_y \\cdot \\sigma_{max}$", hasil: formatNumber(g.Vu1), satuan: "kN" },
            { parameter: "$V_c = \\phi \\cdot 0.17 \\cdot \\lambda \\cdot \\sqrt{f'_c} \\cdot B_y \\cdot d$", hasil: formatNumber(g.Vc1), satuan: "kN" }
        ] : [
            { parameter: "$V_u = a \\cdot L_x \\cdot \\dfrac{\\sigma_{max} + \\sigma_a}{2}$", hasil: formatNumber(g.Vu1), satuan: "kN" },
            { parameter: "$V_c = \\phi \\cdot 0.17 \\cdot \\lambda \\cdot \\sqrt{f'_c} \\cdot L_x \\cdot d$", hasil: formatNumber(g.Vc1), satuan: "kN" }
        ];
        rows.push({ parameter: "$V_u \\le V_c$", isComparison: true, statusHtml: `<span class="${g.amanGeser1 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${g.amanGeser1 || 'N/A'}</span>` });
        return createThreeColumnTable(rows, true);
    }

    function createGeserDuaArahTable() {
        const g = getData('data.kontrolGeser', {});
        const mode = getData('data.actualFondasiMode', 'bujur_sangkar');
        let rows = mode === 'menerus' ? [{ parameter: "$V_u = \\left(L_x - B_x - d\\right) \\cdot L_y \\cdot \\dfrac{\\sigma_{max} + \\sigma_{min}}{2}$", hasil: formatNumber(g.Vu2), satuan: "kN" }]
                                      : [{ parameter: "$V_u = \\left[L_x \\cdot L_y - \\dfrac{(B_x + d)(B_y + d)}{10^{6}}\\right] \\cdot \\dfrac{\\sigma_{max} + \\sigma_{min}}{2}$", hasil: formatNumber(g.Vu2), satuan: "kN" }];
        rows.push(
            { parameter: "$V_{c1} = 0.17 \\left(1 + \\dfrac{2}{B_y/B_x}\\right) \\lambda \\sqrt{f'_c} b_0 d$", hasil: formatNumber(g.Vc21), satuan: "kN" },
            { parameter: "$V_{c2} = 0.083 \\left(2 + \\dfrac{\\alpha_s d}{b_0}\\right) \\lambda \\sqrt{f'_c} b_0 d$", hasil: formatNumber(g.Vc22), satuan: "kN" },
            { parameter: "$V_{c3} = 0.33 \\sqrt{f'_c} b_0 d$", hasil: formatNumber(g.Vc23), satuan: "kN" },
            { parameter: "$V_c = \\min(V_{c1}, V_{c2}, V_{c3})$", hasil: formatNumber(g.Vc2), satuan: "kN" },
            { parameter: "$\\phi V_c = \\phi \\cdot V_c$", hasil: formatNumber(g.phiVc2), satuan: "kN" },
            { parameter: "$V_u \\le \\phi V_c$", isComparison: true, statusHtml: `<span class="${g.amanGeser2 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${g.amanGeser2 || 'N/A'}</span>` }
        );
        return createThreeColumnTable(rows, true);
    }

    // ==================== TULANGAN ====================
    function createTulanganBujurSangkarTable() {
        const t = getData('data.tulangan', {});
        const sMinAman = getData('kontrol.tulanganTambahan.detail.s_bujur.aman', false);
        const As_perlu = t.As;
        const As_terpasang = t.AsTerpasang;
        const amanAs = (As_terpasang >= As_perlu);
        return createThreeColumnTable([
            { parameter: "$\\sigma_x = \\sigma_{min} + (L_y - x_1) \\cdot \\dfrac{\\sigma_{max} - \\sigma_{min}}{L_y}$", hasil: formatNumber(t.sigma), satuan: "kPa" },
            { parameter: "$M_u = \\dfrac{1}{2} \\cdot \\sigma_x \\cdot x_1^{2} + \\dfrac{1}{3} \\cdot (\\sigma_{max} - \\sigma_x) \\cdot x_1^{2}$", hasil: formatNumber(t.Mu), satuan: "kNm/m" },
            { parameter: "$K = \\dfrac{M_u}{\\phi b d^{2}}$", hasil: formatNumber(t.K), satuan: "MPa" },
            { parameter: "$K \\le K_{max}$", isComparison: true, statusHtml: `<span class="${t.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${t.Kontrol_K || 'N/A'}</span>` },
            { parameter: "$a = \\left(1 - \\sqrt{1 - \\dfrac{2K}{0.85 f'_c}}\\right) d$", hasil: formatNumber(t.a_val), satuan: "mm" },
            { parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", hasil: formatNumber(t.As1), satuan: "mm²/m" },
            { parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", hasil: formatNumber(t.As2), satuan: "mm²/m" },
            { parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", hasil: formatNumber(t.As3), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(t.As), satuan: "mm²/m" },
            { parameter: "$s_1 = \\dfrac{0.25\\pi D^{2} \\times 1000}{A_{s,perlu}}$", hasil: formatNumber(t.s1), satuan: "mm" },
            { parameter: "$s_2 = 3h$", hasil: formatNumber(t.s2), satuan: "mm" },
            { parameter: "$s_3 = 450$", hasil: "450", satuan: "mm" },
            { parameter: "$s = \\min(s_1, s_2, s_3)$", hasil: formatNumber(t.s), satuan: "mm" },
            { parameter: "$s \\ge 100$", isComparison: true, statusHtml: `<span class="${sMinAman ? 'status-aman' : 'status-tidak-aman'}">${sMinAman ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$A_{s,terpasang} = \\dfrac{0.25\\pi D^{2} \\times 1000}{s}$", hasil: formatNumber(As_terpasang), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} \\le A_{s,terpasang}$", isComparison: true, statusHtml: `<span class="${amanAs ? 'status-aman' : 'status-tidak-aman'}">${amanAs ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `<strong>Digunakan: ɸ${getData('inputData.tulangan.d', getData('optimasi.kombinasi_terpilih.D', 'N/A'))}-${formatNumber(t.s)}</strong>`, isFullRow: true }
        ], true);
    }

    function createTulanganPersegiPanjangArahPanjang() {
        const t = getData('data.tulangan', {});
        const bujur = t.bujur || {};
        const sMinAman = getData('kontrol.tulanganTambahan.detail.s_bujur.aman', false);
        const As_perlu = bujur.As;
        const As_terpasang = bujur.AsTerpasang;
        const amanAs = (As_terpasang >= As_perlu);
        return createThreeColumnTable([
            { parameter: "$\\sigma_x = \\sigma_{min} + (L_y - x_1) \\cdot \\dfrac{\\sigma_{max} - \\sigma_{min}}{L_y}$", hasil: formatNumber(bujur.sigma), satuan: "kPa" },
            { parameter: "$M_u = \\dfrac{1}{2} \\cdot \\sigma_x \\cdot x_1^{2} + \\dfrac{1}{3} \\cdot (\\sigma_{max} - \\sigma_x) \\cdot x_1^{2}$", hasil: formatNumber(bujur.Mu), satuan: "kNm/m" },
            { parameter: "$K = \\dfrac{M_u}{\\phi b d^{2}}$", hasil: formatNumber(bujur.K), satuan: "MPa" },
            { parameter: "$K \\le K_{max}$", isComparison: true, statusHtml: `<span class="${bujur.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${bujur.Kontrol_K || 'N/A'}</span>` },
            { parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", hasil: formatNumber(bujur.As1), satuan: "mm²/m" },
            { parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", hasil: formatNumber(bujur.As2), satuan: "mm²/m" },
            { parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", hasil: formatNumber(bujur.As3), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(bujur.As), satuan: "mm²/m" },
            { parameter: "$s_1 = \\dfrac{0.25\\pi D^{2} \\times 1000}{A_{s,perlu}}$", hasil: formatNumber(bujur.s1), satuan: "mm" },
            { parameter: "$s_2 = 3h$", hasil: formatNumber(bujur.s2), satuan: "mm" },
            { parameter: "$s_3 = 450$", hasil: "450", satuan: "mm" },
            { parameter: "$s = \\min(s_1, s_2, s_3)$", hasil: formatNumber(bujur.s), satuan: "mm" },
            { parameter: "$A_{s,terpasang} = \\dfrac{0.25\\pi D^{2} \\times 1000}{s}$", hasil: formatNumber(As_terpasang), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} \\le A_{s,terpasang}$", isComparison: true, statusHtml: `<span class="${amanAs ? 'status-aman' : 'status-tidak-aman'}">${amanAs ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `<strong>Arah Panjang: ɸ${getData('inputData.tulangan.d', getData('optimasi.kombinasi_terpilih.D', 'N/A'))}-${formatNumber(bujur.s)}</strong>`, isFullRow: true }
        ], true);
    }

    function createTulanganPersegiPanjangArahPendek() {
        const t = getData('data.tulangan', {});
        const persegi = t.persegi || {};
        const sPusatMinAman = getData('kontrol.tulanganTambahan.detail.s_pusat.aman', false);
        const sTepiMinAman = getData('kontrol.tulanganTambahan.detail.s_tepi.aman', false);
        const As_perlu = persegi.As;
        const As_terpasang_pusat = persegi.AsTerpasangPusat;
        const As_terpasang_tepi = persegi.AsTerpasangTepi;
        const amanPusat = (As_terpasang_pusat >= As_perlu);
        const amanTepi = (As_terpasang_tepi >= As_perlu);
        return createThreeColumnTable([
            { parameter: "$M_u = \\dfrac{1}{2} \\cdot \\sigma_{max} \\cdot x_2^{2}$", hasil: formatNumber(persegi.Mu), satuan: "kNm/m" },
            { parameter: "$K = \\dfrac{M_u}{\\phi b d^{2}}$", hasil: formatNumber(persegi.K), satuan: "MPa" },
            { parameter: "$K \\le K_{max}$", isComparison: true, statusHtml: `<span class="${persegi.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${persegi.Kontrol_K || 'N/A'}</span>` },
            { parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", hasil: formatNumber(persegi.As21), satuan: "mm²/m" },
            { parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", hasil: formatNumber(persegi.As22), satuan: "mm²/m" },
            { parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", hasil: formatNumber(persegi.As23), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(persegi.As), satuan: "mm²/m" },
            // Tulangan pusat
            { parameter: "$A_{s,pusat} = \\dfrac{2L_x A_s}{L_y + L_x}$", hasil: formatNumber(persegi.Aspusat), satuan: "mm²/m" },
            { parameter: "$s_{1,pusat} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{A_{s,pusat}}$", hasil: formatNumber(persegi.s1_pusat), satuan: "mm" },
            { parameter: "$s_{2,pusat} = 3h$", hasil: formatNumber(persegi.s2_pusat), satuan: "mm" },
            { parameter: "$s_{3,pusat} = 450$", hasil: "450", satuan: "mm" },
            { parameter: "$s_{pusat} = \\min(s_{1,pusat}, s_{2,pusat}, s_{3,pusat})$", hasil: formatNumber(persegi.s_pusat), satuan: "mm" },
            { parameter: "$A_{s,terpasang} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{s_{pusat}}$", hasil: formatNumber(As_terpasang_pusat), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} \\le A_{s,terpasang}$", isComparison: true, statusHtml: `<span class="${amanPusat ? 'status-aman' : 'status-tidak-aman'}">${amanPusat ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            // Tulangan tepi
            { parameter: "$A_{s,tepi} = A_{s,perlu} - A_{s,pusat}$", hasil: formatNumber(persegi.Astepi), satuan: "mm²/m" },
            { parameter: "$s_{1,tepi} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{A_{s,tepi}}$", hasil: formatNumber(persegi.s1_tepi), satuan: "mm" },
            { parameter: "$s_{2,tepi} = 3h$", hasil: formatNumber(persegi.s2_tepi), satuan: "mm" },
            { parameter: "$s_{3,tepi} = 450$", hasil: "450", satuan: "mm" },
            { parameter: "$s_{tepi} = \\min(s_{1,tepi}, s_{2,tepi}, s_{3,tepi})$", hasil: formatNumber(persegi.s_tepi), satuan: "mm" },
            { parameter: "$A_{s,terpasang} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{s_{tepi}}$", hasil: formatNumber(As_terpasang_tepi), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} \\le A_{s,terpasang}$", isComparison: true, statusHtml: `<span class="${amanTepi ? 'status-aman' : 'status-tidak-aman'}">${amanTepi ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `<strong>Arah Pendek Pusat: ɸ${getData('inputData.tulangan.db', getData('optimasi.kombinasi_terpilih.Db', 'N/A'))}-${formatNumber(persegi.s_pusat)}</strong>`, isFullRow: true },
            { parameter: `<strong>Arah Pendek Tepi: ɸ${getData('inputData.tulangan.db', getData('optimasi.kombinasi_terpilih.Db', 'N/A'))}-${formatNumber(persegi.s_tepi)}</strong>`, isFullRow: true }
        ], true);
    }

    function createTulanganMenerusTable() {
        const t = getData('data.tulangan', {});
        const sUtamaMinAman = getData('kontrol.tulanganTambahan.detail.s_utama.aman', false);
        const sBagiMinAman = getData('kontrol.tulanganTambahan.detail.s_bagi.aman', false);
        const As_perlu_utama = t.As;
        const As_terpasang_utama = t.AsTerpasangUtama;
        const amanUtama = (As_terpasang_utama >= As_perlu_utama);
        const As_perlu_bagi = t.Asb;
        const As_terpasang_bagi = t.AsTerpasangBagi;
        const amanBagi = (As_terpasang_bagi >= As_perlu_bagi);
        
        const utama = createThreeColumnTable([
            { parameter: "$M_u = 0.5 \\cdot \\sigma_{max} \\cdot x_2^{2}$", hasil: formatNumber(t.Mu), satuan: "kNm/m" },
            { parameter: "$K = \\dfrac{M_u}{\\phi b d^{2}}$", hasil: formatNumber(t.K), satuan: "MPa" },
            { parameter: "$K \\le K_{max}$", isComparison: true, statusHtml: `<span class="${t.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${t.Kontrol_K || 'N/A'}</span>` },
            { parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", hasil: formatNumber(t.As1), satuan: "mm²/m" },
            { parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", hasil: formatNumber(t.As2), satuan: "mm²/m" },
            { parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", hasil: formatNumber(t.As3), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(t.As), satuan: "mm²/m" },
            { parameter: "$s_1 = \\dfrac{0.25\\pi D^{2} \\times 1000}{A_{s,perlu}}$", hasil: formatNumber(t.s1_utama), satuan: "mm" },
            { parameter: "$s_2 = 3h$", hasil: formatNumber(t.s2_utama), satuan: "mm" },
            { parameter: "$s_3 = 450$", hasil: "450", satuan: "mm" },
            { parameter: "$s_{utama} = \\min(s_1, s_2, s_3)$", hasil: formatNumber(t.s_utama), satuan: "mm" },
            { parameter: "$A_{s,terpasang} = \\dfrac{0.25\\pi D^{2} \\times 1000}{s_{utama}}$", hasil: formatNumber(As_terpasang_utama), satuan: "mm²/m" },
            { parameter: "$A_{s,perlu} \\le A_{s,terpasang}$", isComparison: true, statusHtml: `<span class="${amanUtama ? 'status-aman' : 'status-tidak-aman'}">${amanUtama ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `<strong>Tulangan Utama: ɸ${getData('inputData.tulangan.d', getData('optimasi.kombinasi_terpilih.D', 'N/A'))}-${formatNumber(t.s_utama)}</strong>`, isFullRow: true }
        ], true);
        const bagi = createThreeColumnTable([
            { parameter: "$A_{sb1} = 0.20\\% \\cdot b \\cdot h$", hasil: formatNumber(t.Asb1), satuan: "mm²/m" },
            { parameter: "$A_{sb2} = \\rho_{min} \\cdot b \\cdot h$", hasil: formatNumber(t.Asb2), satuan: "mm²/m" },
            { parameter: "$A_{sb3} = 0.0014 \\cdot b \\cdot h$", hasil: formatNumber(t.Asb3), satuan: "mm²/m" },
            { parameter: "$A_{sb,perlu} = \\max(A_{sb1}, A_{sb2}, A_{sb3})$", hasil: formatNumber(t.Asb), satuan: "mm²/m" },
            { parameter: "$s_{bagi} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{A_{sb,perlu}}$", hasil: formatNumber(t.s_bagi), satuan: "mm" },
            { parameter: "$A_{s,terpasang,bagi} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{s_{bagi}}$", hasil: formatNumber(As_terpasang_bagi), satuan: "mm²/m" },
            { parameter: "$A_{sb,perlu} \\le A_{s,terpasang,bagi}$", isComparison: true, statusHtml: `<span class="${amanBagi ? 'status-aman' : 'status-tidak-aman'}">${amanBagi ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `<strong>Tulangan Bagi: ɸ${getData('inputData.tulangan.db', getData('optimasi.kombinasi_terpilih.Db', 'N/A'))}-${formatNumber(t.s_bagi)}</strong>`, isFullRow: true }
        ], true);
        return `<div class="section-subgroup"><h4>1. Tulangan Utama</h4>${utama}</div><div class="section-subgroup"><h4>2. Tulangan Bagi</h4>${bagi}</div>`;
    }
    function createTulanganMenerusUtama() {
    const t = getData('data.tulangan', {});
    const sUtamaMinAman = getData('kontrol.tulanganTambahan.detail.s_utama.aman', false);
    const As_perlu_utama = t.As;
    const As_terpasang_utama = t.AsTerpasangUtama;
    const amanUtama = (As_terpasang_utama >= As_perlu_utama);
    return createThreeColumnTable([
        { parameter: "$M_u = 0.5 \\cdot \\sigma_{max} \\cdot x_2^{2}$", hasil: formatNumber(t.Mu), satuan: "kNm/m" },
        { parameter: "$K = \\dfrac{M_u}{\\phi b d^{2}}$", hasil: formatNumber(t.K), satuan: "MPa" },
        { parameter: "$K \\le K_{max}$", isComparison: true, statusHtml: `<span class="${t.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${t.Kontrol_K || 'N/A'}</span>` },
        { parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", hasil: formatNumber(t.As1), satuan: "mm²/m" },
        { parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", hasil: formatNumber(t.As2), satuan: "mm²/m" },
        { parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", hasil: formatNumber(t.As3), satuan: "mm²/m" },
        { parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(t.As), satuan: "mm²/m" },
        { parameter: "$s_1 = \\dfrac{0.25\\pi D^{2} \\times 1000}{A_{s,perlu}}$", hasil: formatNumber(t.s1_utama), satuan: "mm" },
        { parameter: "$s_2 = 3h$", hasil: formatNumber(t.s2_utama), satuan: "mm" },
        { parameter: "$s_3 = 450$", hasil: "450", satuan: "mm" },
        { parameter: "$s_{utama} = \\min(s_1, s_2, s_3)$", hasil: formatNumber(t.s_utama), satuan: "mm" },
        { parameter: "$A_{s,terpasang} = \\dfrac{0.25\\pi D^{2} \\times 1000}{s_{utama}}$", hasil: formatNumber(As_terpasang_utama), satuan: "mm²/m" },
        { parameter: "$A_{s,perlu} \\le A_{s,terpasang}$", isComparison: true, statusHtml: `<span class="${amanUtama ? 'status-aman' : 'status-tidak-aman'}">${amanUtama ? 'AMAN' : 'TIDAK AMAN'}</span>` },
        { parameter: `<strong>Tulangan Utama: ɸ${getData('inputData.tulangan.d', getData('optimasi.kombinasi_terpilih.D', 'N/A'))}-${formatNumber(t.s_utama)}</strong>`, isFullRow: true }
    ], true);
    }

    function createTulanganMenerusBagi() {
        const t = getData('data.tulangan', {});
        const fy = getData('mat.fy', {});
        const sBagiMinAman = getData('kontrol.tulanganTambahan.detail.s_bagi.aman', false);
        const As_perlu_bagi = t.Asb;
        const As_terpasang_bagi = t.AsTerpasangBagi;
        const amanBagi = (As_terpasang_bagi >= As_perlu_bagi);
        return createThreeColumnTable([
            { parameter: "$A_{sb1} = 0.20\\% \\cdot A_{s}$", hasil: formatNumber(t.Asb1), satuan: "mm²/m" },
            { 
                parameter: fy <= 350 
                    ? "$A_{sb2} = 0{,}0020 \\cdot b \\cdot h$" 
                    : (fy > 350 && fy < 420) 
                        ? `$A_{sb2} = \\left(0{,}0020 - \\frac{fy - 350}{350.000}\\right) \\cdot b \\cdot h$` 
                        : `$A_{sb2} = 0{,}0018 \\cdot b \\cdot h \\cdot \\left(\\frac{420}{fy}\\right)$`, 
                hasil: formatNumber(t.Asb2), 
                satuan: "mm²/m" 
            },
            { parameter: "$A_{sb3} = 0.0014 \\cdot b \\cdot h$", hasil: formatNumber(t.Asb3), satuan: "mm²/m" },
            { parameter: "$A_{sb,perlu} = \\max(A_{sb1}, A_{sb2}, A_{sb3})$", hasil: formatNumber(t.Asb), satuan: "mm²/m" },
            { parameter: "$s_{1,bagi} = \\dfrac{0.25 \\cdot \\pi \\cdot D_b^2}{A_{sb,perlu}}$", hasil: formatNumber(t.s1_bagi), satuan: "mm" },
            { parameter: "$s_{2,bagi} = 5 \\cdot h$", hasil: formatNumber(t.s2_bagi), satuan: "mm" },
            { parameter: "$s_{3,bagi} = 450$", hasil: formatNumber(t.s3_bagi), satuan: "mm" },
            { parameter: "$s_{bagi} = \\max(s_{1}, s_{2}, s_{3})$", hasil: formatNumber(t.s_bagi), satuan: "mm" },            
            { parameter: "$A_{s,terpasang} = \\dfrac{0.25\\pi D_b^{2}}{s_{bagi}}$", hasil: formatNumber(As_terpasang_bagi), satuan: "mm²/m" },
            { parameter: "$A_{sb,perlu} \\le A_{s,terpasang}$", isComparison: true, statusHtml: `<span class="${amanBagi ? 'status-aman' : 'status-tidak-aman'}">${amanBagi ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: `<strong>Tulangan Bagi: ɸ${getData('inputData.tulangan.db', getData('optimasi.kombinasi_terpilih.Db', 'N/A'))}-${formatNumber(t.s_bagi)}</strong>`, isFullRow: true }
        ], true);
    }

// ==================== KUAT DUKUNG ====================
    function createKuatDukungTable() {
        const kd = getData('data.kuatDukung', {});
        const fMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        let rows = [];

        if (fMode === 'menerus') {
            // RUMUS KHUSUS FONDASI MENERUS
            rows = [
                { parameter: "$A_1 = B_x \\times B_y$", hasil: formatNumber(kd.A1), satuan: "mm²" },
                { parameter: "$P_{u,cap} = 0.65 \\times 0.85 \\times f'_c \\times A_1$", hasil: formatNumber(kd.Pu_cap), satuan: "kN" },
                { parameter: "$P_{u,cap} \\ge P_u$", isComparison: true, statusHtml: `<span class="${kd.Kontrol_Pu === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kd.Kontrol_Pu || 'N/A'}</span>` },
                { parameter: "$l_t = \\dfrac{L_x \\cdot 1000}{2} - \\dfrac{B_x}{2} - s_{beton}$", hasil: formatNumber(kd.It), satuan: "mm" },
                { parameter: "$C_b = \\min(75, s_{utama})$", hasil: formatNumber(kd.Cb || kd.cb), satuan: "mm" },
                { parameter: "$C = \\min\\left(\\dfrac{C_b + K_{tr}}{D_b}, 2.5\\right)$", hasil: formatNumber(kd.C || kd.c), satuan: "-" },
                { parameter: "$l_{dh1} = \\dfrac{f_y}{1.1 \\cdot \\lambda \\cdot \\sqrt{f'_c}} \\times \\dfrac{\\psi_t \\cdot \\psi_e \\cdot \\psi_s}{C} \\times D_b$", hasil: formatNumber(kd.Idh1), satuan: "mm" },
                { parameter: "$l_{dh2} = 300$", hasil: "300", satuan: "mm" },
                { parameter: "$l_{dh} = \\max(l_{dh1}, l_{dh2})$", hasil: formatNumber(kd.Idh), satuan: "mm" },
                { parameter: "$l_t > l_{dh}$", isComparison: true, statusHtml: `<span class="${kd.Kontrol_Idh === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kd.Kontrol_Idh || 'N/A'}</span>` }
            ];
        } else {
            // RUMUS LAMA (BUJUR SANGKAR / PERSEGI PANJANG)
            rows = [
                { parameter: "$A_1 = B_x \\times B_y$", hasil: formatNumber(kd.A1), satuan: "mm²" },
                { parameter: "$P_{u,cap} = 0.65 \\times 0.85 \\times f'_c \\times A_1$", hasil: formatNumber(kd.Pu_cap), satuan: "kN" },
                { parameter: "$P_{u,cap} \\ge P_u$", isComparison: true, statusHtml: `<span class="${kd.Kontrol_Pu === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kd.Kontrol_Pu || 'N/A'}</span>` },
                { parameter: "$l_t = \\dfrac{L_x}{2} - \\dfrac{B_x}{2} - s_{beton}$", hasil: formatNumber(kd.It), satuan: "mm" },
                { parameter: "$A_{s,terpasang} = \\dfrac{0.25\\pi D^{2} \\times 1000}{s}$", hasil: formatNumber(kd.Asterpasang), satuan: "mm²" },
                { parameter: "$f_3 = \\dfrac{A_{s,perlu}}{A_{s,terpasang}}$", hasil: formatNumber(kd.f3), satuan: "-" },
                { parameter: "$l_{dh1} = \\dfrac{0.24\\psi f_y}{\\lambda\\sqrt{f'_c}} \\times D \\times \\psi_e \\times \\psi_t \\times f_3$", hasil: formatNumber(kd.Idh1), satuan: "mm" },
                { parameter: "$l_{dh2} = 8D$", hasil: formatNumber(kd.Idh2), satuan: "mm" },
                { parameter: "$l_{dh3} = 150$", hasil: "150", satuan: "mm" },
                { parameter: "$l_{dh} = \\max(l_{dh1}, l_{dh2}, l_{dh3})$", hasil: formatNumber(kd.Idh), satuan: "mm" },
                { parameter: "$l_t > l_{dh}$", isComparison: true, statusHtml: `<span class="${kd.Kontrol_Idh === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kd.Kontrol_Idh || 'N/A'}</span>` }
            ];
        }
        
        return createThreeColumnTable(rows, true);
    }
    // ==================== REKAPITULASI ====================
    function createTulanganTerpasangTable() {
        const rekap = getData('rekap', {});
        const mode = getData('data.actualFondasiMode', 'bujur_sangkar');
        const centerTd = (content) => `<td style="text-align: center; font-weight: bold;">${content}</td>`;
        const centerTh = (content) => `<th style="text-align: center;">${content}</th>`;
        if (mode === 'persegi_panjang') {
            return `<table class="tulangan-terpasang-table" style="width:100%; border-collapse:collapse;"><thead><tr>${centerTh('Tulangan')}${centerTh('Terpasang')}</tr></thead><tbody>
                      <tr><td style="text-align: center;">Arah Panjang</td>${centerTd(rekap.tulangan_panjang || 'N/A')}</tr>
                      <tr><td style="text-align: center;">Arah Pendek - Pusat</td>${centerTd(rekap.tulangan_pendek_pusat || 'N/A')}</tr>
                      <tr><td style="text-align: center;">Arah Pendek - Tepi</td>${centerTd(rekap.tulangan_pendek_tepi || 'N/A')}</tr>
                    </tbody></table>`;
        }
        let html = '<table class="tulangan-terpasang-table" style="width:100%; border-collapse:collapse;"><thead><tr><th style="text-align: center;">Tulangan</th><th style="text-align: center;">Terpasang</th></tr></thead><tbody>';
        if (mode === 'bujur_sangkar') {
            html += `<tr><td style="text-align: center;">Tulangan Utama</td>${centerTd(rekap.tulangan_utama || 'N/A')}</tr>`;
        } else if (mode === 'menerus') {
            html += `<tr><td style="text-align: center;">Tulangan Utama</td>${centerTd(rekap.tulangan_utama || 'N/A')}</tr>
                      <tr><td style="text-align: center;">Tulangan Bagi</td>${centerTd(rekap.tulangan_bagi || 'N/A')}</tr>`;
        }
        html += '</tbody></table>';
        return html;
    }

    // ==================== KESIMPULAN ====================
    function generateDynamicConclusion() {
        const status = cekStatusFondasi();
        const mode = getData('data.actualFondasiMode', 'bujur_sangkar');
        const dim = getData('inputData.fondasi.dimensi', {});
        let html = `<div class="section-group"><h3>Kesimpulan</h3><div class="conclusion-box">
                    <h4 style="text-align:center; ${status === 'aman' ? 'color:#155724' : 'color:#721c24'}"><strong>STRUKTUR FONDASI ${getFondasiModeName(mode)} ${status === 'aman' ? 'AMAN' : 'TIDAK AMAN'}</strong></h4>`;
        if (status === 'aman') {
            html += `<p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p>
                     <p>Struktur fondasi ${getFondasiModeName(mode)} dengan dimensi ${formatNumber(dim.lx)} m × ${formatNumber(dim.ly)} m memenuhi semua persyaratan SNI 2847:2019 dan SNI 8460:2017 untuk:</p>
                     <ul><li>Tegangan tanah merata dan positif (σ<sub>min</sub> > 0)</li>
                         <li>Daya dukung tanah mencukupi (σ<sub>max</sub> ≤ q<sub>a</sub>)</li>
                         <li>Kuat geser satu arah (V<sub>u</sub> ≤ V<sub>c</sub>)</li>
                         <li>Kuat geser dua arah (V<sub>u</sub> ≤ φ V<sub>c</sub>)</li>
                         <li>Persyaratan lentur (K ≤ K<sub>max</sub>)</li>
                         <li>Kuat dukung aksial kolom (P<sub>u,cap</sub> ≥ P<sub>u</sub>)</li>
                         <li>Panjang penyaluran tulangan (l<sub>t</sub> > l<sub>dh</sub>)</li>
                         <li>Luas tulangan terpasang cukup (A<sub>s,terpasang</sub> ≥ A<sub>s,perlu</sub>)</li>
                         <li>Jarak tulangan minimal (s ≥ 100 mm)</li>
                     </ul>`;
        } else {
            html += `<p><strong>Status:</strong> <span class="status-tidak-aman">TIDAK AMAN - PERLU PERBAIKAN DESAIN</span></p>
                     <p>Struktur fondasi ${getFondasiModeName(mode)} dengan dimensi ${formatNumber(dim.lx)} m × ${formatNumber(dim.ly)} m <strong>TIDAK MEMENUHI</strong> persyaratan SNI 2847:2019 dan SNI 8460:2017.</p>
                     <p>Periksa kembali parameter desain seperti dimensi fondasi, kedalaman, mutu beton, atau konfigurasi tulangan.</p>`;
        }
        html += `<p style="margin-top:12px; font-size:10pt; color:#666;"><strong>Catatan:</strong> Hasil perhitungan ini berdasarkan SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung) dan SNI 8460:2017 (Persyaratan Perancangan Geoteknik). Pastikan semua aspek konstruksi sesuai dengan spesifikasi teknis dan dilakukan pengawasan yang memadai. Untuk fondasi dengan momen besar, perhatikan juga kontrol stabilitas guling dan geser.</p>
                </div></div>`;
        return html;
    }

    function getFondasiModeName(mode) {
        switch(mode) {
            case 'bujur_sangkar': return 'BUJUR SANGKAR';
            case 'persegi_panjang': return 'PERSEGI PANJANG';
            case 'menerus': return 'MENERUS';
            default: return 'TUNGGAL';
        }
    }

    // ==================== GENERATE CONTENT BLOCKS ====================
    // REVISI: Untuk persegi panjang, poin 1 dan 2 tidak dipaksakan satu halaman (hilangkan page-break-inside: avoid)
    function generateContentBlocks() {
        const blocks = [];
        const status = cekStatusFondasi();
        const fMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        const tMode = getData('inputData.tanah.mode', 'auto');

        blocks.push(`<h1>LAPORAN PERHITUNGAN FONDASI BETON BERTULANG</h1>
            <div class="header-info"><div><span><strong>Mode:</strong> ${getData('mode', 'N/A').toUpperCase()}</span><span><strong>Modul:</strong> Fondasi</span></div>
            <div><span><strong>Tanggal:</strong> ${formatTimestampFull(getData('timestamp'))}</span><span><strong>Status:</strong> <span class="${status === 'aman' ? 'status-aman' : 'status-tidak-aman'}">${status.toUpperCase()}</span></span></div></div>
            <h2>A. DATA INPUT DAN PARAMETER</h2>`);

        blocks.push(`<div class="section-group" style="page-break-inside: avoid;"><h3>1. Data Material dan Dimensi</h3>${createMaterialDimensiTable()}</div>`);
        blocks.push(`<div class="section-group" style="page-break-inside: avoid;"><h3>2. Data Tanah</h3>${createTanahTable()}</div>`);
        blocks.push(`<div class="section-group" style="page-break-inside: avoid;"><h3>3. Data Beban</h3>${createBebanTable()}</div>`);
        blocks.push(`<div class="section-group" style="page-break-inside: avoid;"><h3>4. Data Tulangan</h3>${createTulanganTable()}</div>`);
        blocks.push(`<div class="section-group" style="page-break-inside: avoid;"><h3>5. Parameter Perhitungan</h3>${createParameterTable()}</div>`);

        if (tMode === 'auto') blocks.push(`<div class="header-content-group"><h2>B. PERHITUNGAN DAYA DUKUNG TANAH</h2></div><div class="section-group" style="page-break-inside: avoid;"><h3>1. Analisis Daya Dukung</h3>${createDayaDukungTable()}</div>`);

        const geserSec = tMode === 'auto' ? 'C' : 'B';
        blocks.push(`<div class="header-content-group"><h2>${geserSec}. KONTROL GESER</h2></div><div class="section-group" style="page-break-inside: avoid;"><h3>1. Kontrol Geser Satu Arah</h3>${createGeserSatuArahTable()}</div>`);
        blocks.push(`<div class="section-group" style="page-break-inside: avoid;"><h3>2. Kontrol Geser Dua Arah</h3>${createGeserDuaArahTable()}</div>`);

        const tulSec = tMode === 'auto' ? 'D' : 'C';
        if (fMode === 'persegi_panjang') {
            blocks.push(`<div class="header-content-group"><h2>${tulSec}. PERHITUNGAN TULANGAN</h2></div><div class="section-group"><h3>1. Perhitungan Tulangan Arah Panjang</h3>${createTulanganPersegiPanjangArahPanjang()}</div>`);
            blocks.push(`<div class="section-group"><h3>2. Perhitungan Tulangan Arah Pendek</h3>${createTulanganPersegiPanjangArahPendek()}</div>`);
        } else if (fMode === 'bujur_sangkar') {
            blocks.push(`<div class="header-content-group"><h2>${tulSec}. PERHITUNGAN TULANGAN</h2></div><div class="section-group" style="page-break-inside: avoid;"><h3>1. Perhitungan Tulangan</h3>${createTulanganBujurSangkarTable()}</div>`);
        } else if (fMode === 'menerus') {
            blocks.push(`<div class="header-content-group"><h2>${tulSec}. PERHITUNGAN TULANGAN</h2></div><div class="section-group" style="page-break-inside: avoid;"><h3>1. Tulangan Utama</h3>${createTulanganMenerusUtama()}</div>`);
            blocks.push(`<div class="section-group" style="page-break-inside: avoid;"><h3>2. Tulangan Bagi</h3>${createTulanganMenerusBagi()}</div>`);        }

        const kuatSec = tMode === 'auto' ? 'E' : 'D';
        blocks.push(`<div class="header-content-group"><h2>${kuatSec}. KONTROL KUAT DUKUNG</h2></div><div class="section-group" style="page-break-inside: avoid;"><h3>1. Kuat Dukung Aksial dan Panjang Penyaluran</h3>${createKuatDukungTable()}</div>`);

        const rekapSec = tMode === 'auto' ? 'F' : 'E';
        blocks.push(`<div class="header-content-group"><h2>${rekapSec}. REKAPITULASI HASIL</h2></div>
                     <div class="section-group" style="page-break-inside: avoid;"><h3>1. Tulangan Terpasang</h3>${createTulanganTerpasangTable()}</div>`);
        
        // Ringkasan kontrol
        blocks.push(`<div class="section-group" style="page-break-inside: avoid;"><h3>2. Ringkasan Kontrol Keamanan</h3>${createTwoColumnTable([
            { parameter: "$\\sigma_{min} > 0$", statusHtml: `<span class="${getData('kontrol.sigmaMinAman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.sigmaMinAman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\sigma_{max} \\le q_a$", statusHtml: `<span class="${getData('kontrol.dayaDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.dayaDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$V_{u} \\le V_{c}$ (Geser 1 arah)", statusHtml: `<span class="${getData('kontrol.geser.aman1', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.geser.aman1', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$V_{u} \\le \\phi V_{c}$ (Geser 2 arah)", statusHtml: `<span class="${getData('kontrol.geser.aman2', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.geser.aman2', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$K \\le K_{max}$", statusHtml: `<span class="${getData('kontrol.tulangan.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.tulangan.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$P_{u,cap} \\ge P_u$", statusHtml: `<span class="${getData('kontrol.kuatDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kuatDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$A_{s,terpasang} \\ge A_{s,perlu}$", statusHtml: `<span class="${getData('kontrol.luasTulangan.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.luasTulangan.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` },
        ])}</div>`);
        
        blocks.push(generateDynamicConclusion() + `<p class="note" style="margin-top:10px;"><strong>Referensi:</strong> SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung), SNI 8460:2017 (Persyaratan Perancangan Geoteknik)</p>`);        return blocks;
    }

    window.fondasiReport = {
        setData, generateContentBlocks, cekStatusFondasi, formatNumber, getData
    };
})();