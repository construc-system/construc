// pdf-kolom.js (Final - Fixed: Smart Decimal seperti balok)
(function() {
    // ==============================================
    // CSS UNTUK PAGE BREAK (PRINT MEDIA)
    // ==============================================
    const style = document.createElement('style');
    style.textContent = `
        .section-group { break-inside: auto; page-break-inside: auto; }
        table { break-inside: auto; page-break-inside: auto; }
        tr { break-inside: avoid; page-break-inside: avoid; }
        h2, h3 { page-break-after: avoid; break-after: avoid; }
        .keep-together { break-inside: avoid; page-break-inside: avoid; }
        @media print {
            .section-group { break-inside: auto !important; page-break-inside: auto !important; }
            table { break-inside: auto !important; page-break-inside: auto !important; }
            tr { break-inside: avoid !important; page-break-inside: avoid !important; }
            h2, h3 { page-break-after: avoid !important; break-after: avoid !important; }
            .keep-together { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
    `;
    document.head.appendChild(style);

    let resultData;

    function setData(data) { resultData = data; }

    // ==============================================
    // FUNGSI SMART DECIMAL (sama seperti di balok)
    // ==============================================
    function formatNumber(num, fixedDecimals = null) {
        if (num === null || num === undefined || num === 'N/A' || isNaN(num)) return 'N/A';
        let value = parseFloat(num);
        // Koreksi ghost value
        const roundedInt = Math.round(value);
        if (Math.abs(value - roundedInt) < 1e-10) return roundedInt.toString();
        // Jika fixedDecimals ditentukan, gunakan itu (dengan pemotongan trailing zero)
        if (fixedDecimals !== null && !isNaN(fixedDecimals)) {
            let formatted = value.toFixed(fixedDecimals);
            // Hapus trailing zeros hanya jika bukan desimal penting? Tapi untuk konsistensi, kita ikuti balok
            formatted = formatted.replace(/\.?0+$/, '');
            return formatted;
        }
        // Smart decimal: tentukan max desimal berdasarkan digit di depan koma
        const absVal = Math.abs(value);
        const intPart = Math.floor(absVal);
        const digitCount = intPart.toString().length;
        let maxDecimals;
        if (digitCount === 1) maxDecimals = 3;
        else if (digitCount === 2) maxDecimals = 2;
        else maxDecimals = 1;
        // Cari desimal minimal yang masih merepresentasikan nilai dengan tepat
        let bestDecimals = maxDecimals;
        for (let k = maxDecimals; k >= 1; k--) {
            const rounded = value.toFixed(k);
            if (Math.abs(parseFloat(rounded) - value) < 1e-10) {
                bestDecimals = k;
                break;
            }
        }
        return value.toFixed(bestDecimals);
    }

    // ==============================================
    // CEK STATUS KOLOM
    // ==============================================
    function cekStatusKolom() {
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolGeser = getData('kontrol.geser', {});
        const hasilX = getData('data.hasilTulangan.hasilArahX', {});
        const hasilY = getData('data.hasilTulangan.hasilArahY', {});
        const nX = parseFloat(hasilX.n_terpakai) || 0;
        const nMaxX = parseFloat(hasilX.n_max) || 0;
        const nY = parseFloat(hasilY.n_terpakai) || 0;
        const nMaxY = parseFloat(hasilY.n_max) || 0;
        const n_ok = (nX <= nMaxX) && (nY <= nMaxY);
        let semuaAman = true;
        if (kontrolLentur && (!kontrolLentur.Ast_ok || !kontrolLentur.rho_ok || !n_ok || !kontrolLentur.K_ok)) semuaAman = false;
        if (kontrolGeser && (!kontrolGeser.Vs_ok || !kontrolGeser.Av_ok)) semuaAman = false;
        return semuaAman ? 'aman' : 'tidak aman';
    }

    function getData(path, defaultValue = 'N/A') {
        try {
            const keys = path.split('.');
            let value = resultData;
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) value = value[key];
                else { value = undefined; break; }
            }
            if (value !== undefined && value !== null && value !== 'N/A') return value;
            const sessionData = sessionStorage.getItem('calculationResultKolom');
            if (sessionData) {
                let sessionValue = JSON.parse(sessionData);
                for (const key of keys) {
                    if (sessionValue && typeof sessionValue === 'object' && key in sessionValue) sessionValue = sessionValue[key];
                    else { sessionValue = undefined; break; }
                }
                if (sessionValue !== undefined && sessionValue !== null && sessionValue !== 'N/A') return sessionValue;
            }
            return defaultValue;
        } catch (error) { return defaultValue; }
    }

    function formatTimestampFull(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        const day = date.getDate();
        const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2,'0');
        const minutes = String(date.getMinutes()).padStart(2,'0');
        return `${day} ${month} ${year} pukul ${hours}.${minutes}`;
    }

    function createThreeColumnTable(rows, withStatus = false, isDataTable = false) {
        let html = '<table class="three-col-table">';
        if (isDataTable) html += '<thead><th class="col-param">Parameter</th><th class="col-value" style="text-align: center">Data</th><th class="col-unit" style="text-align: center">Satuan</th></thead>';
        else html += '<thead><th class="col-param">Parameter Perhitungan</th><th class="col-value" style="text-align: center">Hasil</th><th class="col-unit" style="text-align: center">Satuan</th></thead>';
        rows.forEach(row => {
            const isHeader = row.parameter && row.parameter.includes('<strong>') && !row.hasil;
            const rowClass = isHeader ? 'header-row' : '';
            if (row.isFullRow) html += `<tr class="${rowClass}"><td class="col-full-width" colspan="3" style="text-align: center;">${row.parameter}</td></tr>`;
            else if (row.isStatus && withStatus) html += `<tr class="${rowClass}"><td class="col-param">${row.parameter}</td><td class="col-status-merged" colspan="2" style="text-align: center">${row.statusHtml}</td></tr>`;
            else if (row.isComparison && withStatus) html += `<tr class="${rowClass}"><td class="col-param rumus-kondisi">${row.parameter}</td><td class="col-status-merged" colspan="2" style="text-align: center">${row.statusHtml}</td></tr>`;
            else if (row.isConditionValue) html += `<tr class="${rowClass}"><td class="col-param">${row.parameter}</td><td class="col-value" colspan="2" style="text-align: center">${row.hasil}</td></tr>`;
            else html += `<tr class="${rowClass}"><td class="col-param">${row.parameter}</td><td class="col-value" style="text-align: center">${row.hasilHtml || row.hasil || ''}</td><td class="col-unit" style="text-align: center">${row.satuan || ''}</td></tr>`;
        });
        html += '</table>';
        return html;
    }

    function createTwoColumnTable(rows) {
        let html = '<table class="two-col-table"><thead><th class="col-param-2">Parameter</th><th class="col-status-2" style="text-align: center">Status</th></thead>';
        rows.forEach(row => {
            if (row.isFullRow) html += `<tr><td class="col-full-width" colspan="2" style="text-align: center;">${row.parameter}</td></tr>`;
            else html += `<tr><td class="col-param-2">${row.parameter}</td><td class="col-status-2" style="text-align: center">${row.statusHtml}</td></tr>`;
        });
        html += '</table>';
        return html;
    }

    // Fungsi untuk mendapatkan total batang dan rasio (tidak diubah)
    function getTotalBatangDanRasio() {
        const mode = getData('mode', 'evaluasi');
        const dimensi = getData('data.parsedInput.dimensi', {});
        const b = parseFloat(dimensi.b) || 1;
        const h = parseFloat(dimensi.h) || 1;
        let D = getData('data.D', null);
        if (!D) D = getData('data.parsedInput.tulangan.d_tul', null);
        if (!D) D = getData('data.parsedInput.tulangan.d', 16);
        const Ast_satu = Math.PI * D * D / 4;
        if (mode === 'desain') {
            const nX = getData('data.hasilTulangan.hasilArahX.n_terpakai', 0);
            const nY = getData('data.hasilTulangan.hasilArahY.n_terpakai', 0);
            let totalBatang = nX + nY - 4;
            if (totalBatang < 0) totalBatang = 0;
            const Ast_total = totalBatang * Ast_satu;
            const rho_total = (Ast_total / (b * h)) * 100;
            return { totalBatang, Ast_total, rho_total, D };
        } else {
            let nx = getData('data.parsedInput.tulangan.nx_tul', 0);
            if (nx === 'N/A' || nx === undefined) nx = getData('data.parsedInput.tulangan.nx', 0);
            let ny = getData('data.parsedInput.tulangan.ny_tul', 0);
            if (ny === 'N/A' || ny === undefined) ny = getData('data.parsedInput.tulangan.ny', 0);
            nx = parseFloat(nx) || 0;
            ny = parseFloat(ny) || 0;
            let totalBatang = nx + ny - 4;
            if (totalBatang < 0) totalBatang = 0;
            const Ast_total = totalBatang * Ast_satu;
            const rho_total = (Ast_total / (b * h)) * 100;
            return { totalBatang, Ast_total, rho_total, D };
        }
    }

    function createTulanganTerpasangTable() {
        const rekap = getData('rekap', {});
        const formatted = rekap.formatted || {};
        let begel = formatted.begel || 'N/A';
        let tulanganUtama = 'N/A';
        let rhoTotal = 'N/A';
        const { totalBatang, rho_total, D } = getTotalBatangDanRasio();
        if (totalBatang > 0 && D && D !== 'N/A') {
            tulanganUtama = `${totalBatang}D${D}`;
            rhoTotal = formatNumber(rho_total) + ' %';
        } else if (formatted.tulangan_utama) {
            tulanganUtama = formatted.tulangan_utama;
            if (rhoTotal === 'N/A' && rekap.tulangan && rekap.tulangan.rho !== undefined) rhoTotal = formatNumber(rekap.tulangan.rho) + ' %';
        }
        if (tulanganUtama === 'N/A') { if (totalBatang > 0 && D) tulanganUtama = `${totalBatang}D${D}`; if (rhoTotal === 'N/A') rhoTotal = formatNumber(rho_total) + ' %'; }
        if (begel === 'N/A' && rekap.begel && rekap.begel.s) { const phi = getData('data.parsedInput.tulangan.phi_tul', 8); begel = `φ${phi}-${rekap.begel.s}`; }
        const rows = [
            { parameter: "Tulangan Utama", hasil: tulanganUtama },
            { parameter: "Sengkang/Begel", hasil: begel },
            { parameter: "Rasio Tulangan (ρ)", hasil: rhoTotal }
        ];
        let html = '<table class="two-col-table tulangan-terpasang"><thead><th class="col-tulangan">Tulangan</th><th class="col-terpasang" style="text-align: center">Terpasang</th></thead>';
        rows.forEach(row => { html += `<tr><td class="col-tulangan">${row.parameter}</td><td class="col-terpasang" style="text-align: center">${row.hasil}</td></tr>`; });
        html += '</table>';
        return html;
    }

    function createMaterialDimensiTable() {
        const material = getData('data.parsedInput.material', {});
        const dimensi = getData('data.parsedInput.dimensi', {});
        const lanjutan = getData('data.parsedInput.lanjutan', {});
        const rows = [
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: formatNumber(material.fc), satuan: 'MPa' },
            { parameter: "$f_y$ (Tegangan leleh tulangan lentur)", hasil: formatNumber(material.fy), satuan: 'MPa' },
            { parameter: "$f_{yt}$ (Tegangan leleh tulangan geser)", hasil: formatNumber(material.fyt || material.fy), satuan: 'MPa' },
            { parameter: "$h$ (Tinggi kolom)", hasil: formatNumber(dimensi.h, 0), satuan: 'mm' },
            { parameter: "$b$ (Lebar kolom)", hasil: formatNumber(dimensi.b, 0), satuan: 'mm' },
            { parameter: "$s_b$ (Selimut beton)", hasil: formatNumber(dimensi.sb, 0), satuan: 'mm' },
            { parameter: "$\\lambda$ (Faktor reduksi untuk beton ringan)", hasil: formatNumber(lanjutan.lambda || 1), satuan: '-' },
            { parameter: "$n_{kaki}$ (Jumlah kaki sengkang)", hasil: formatNumber(lanjutan.n_kaki || 2, 0), satuan: 'kaki' }
        ];
        return createThreeColumnTable(rows, false, true);
    }

    function createBebanTable() {
        const beban = getData('data.parsedInput.beban', {});
        const rows = [
            { parameter: "$P_u$ (Beban aksial)", hasil: formatNumber(beban.Pu || beban.pu), satuan: 'kN' },
            { parameter: "$M_{ux}$ (Momen arah X)", hasil: formatNumber(beban.Mux || beban.mux), satuan: 'kNm' },
            { parameter: "$M_{uy}$ (Momen arah Y)", hasil: formatNumber(beban.Muy || beban.muy), satuan: 'kNm' },
            { parameter: "$V_u$ (Gaya geser)", hasil: formatNumber(beban.Vu || beban.vu), satuan: 'kN' }
        ];
        return createThreeColumnTable(rows, false, true);
    }

    function createTulanganTable() {
        const tulangan = getData('data.parsedInput.tulangan', {});
        const mode = getData('mode', 'evaluasi');
        const D = tulangan.d_tul || tulangan.d || getData('data.D', 'N/A');
        const phi = tulangan.phi_tul || tulangan.phi || getData('data.phi', 'N/A');
        const rows = [
            { parameter: "D (Diameter tulangan utama)", hasil: formatNumber(D, 0), satuan: 'mm' },
            { parameter: "φ (Diameter tulangan sengkang)", hasil: formatNumber(phi, 0), satuan: 'mm' }
        ];
        if (mode === 'evaluasi') {
            let nx = tulangan.nx || tulangan.nx_tul || 0;
            let ny = tulangan.ny || tulangan.ny_tul || 0;
            rows.push(
                { parameter: "$n_x$ (Jumlah tulangan arah X)", hasil: formatNumber(parseFloat(nx), 0), satuan: 'batang' },
                { parameter: "$n_y$ (Jumlah tulangan arah Y)", hasil: formatNumber(parseFloat(ny), 0), satuan: 'batang' },
                { parameter: "$s$ (Jarak sengkang)", hasil: formatNumber(tulangan.s || tulangan.s_tul, 0), satuan: 'mm' }
            );
        }
        return createThreeColumnTable(rows, false, true);
    }

    function createParameterTable() {
        const dimensi = getData('data.parsedInput.dimensi', {});
        const b = parseFloat(dimensi.b) || 0;
        const h = parseFloat(dimensi.h) || 0;
        const sb = parseFloat(dimensi.sb) || 0;
        const material = getData('data.parsedInput.material', {});
        const fc = parseFloat(material.fc) || 20;
        const D = getData('data.D', 0);
        const phi = getData('data.phi', 0);
        const ds = sb + phi + D/2;
        const d_X = h - ds;
        const d_Y = b - ds;
        const Sn = Math.max(40, 1.5 * D);
        let beta1;
        if (fc <= 28) beta1 = 0.85;
        else if (fc < 55) beta1 = 0.85 - 0.05 * ((fc - 28) / 7);
        else beta1 = 0.65;
        const m_X = Math.floor((b - 2 * ds) / (D + sb)) + 1;
        const m_Y = Math.floor((h - 2 * ds) / (D + sb)) + 1;
        const hasilX = getData('data.hasilTulangan.hasilArahX', {});
        const hasilY = getData('data.hasilTulangan.hasilArahY', {});
        const m_X_calc = hasilX.m || m_X;
        const m_Y_calc = hasilY.m || m_Y;
        const d_X_calc = hasilX.inputVariables?.d || d_X;
        const d_Y_calc = hasilY.inputVariables?.d || d_Y;
        const rows = [
            { parameter: "$\\displaystyle d_s = s_b + \\phi + \\dfrac{D}{2}$", hasil: formatNumber(ds, 1), satuan: 'mm' },
            { parameter: "$\\displaystyle d_X = h - d_s$ (untuk arah X)", hasil: formatNumber(d_X_calc, 1), satuan: 'mm' },
            { parameter: "$\\displaystyle d_Y = b - d_s$ (untuk arah Y)", hasil: formatNumber(d_Y_calc, 1), satuan: 'mm' },
            { parameter: "$\\displaystyle m_X = \\left\\lfloor \\dfrac{b - 2d_s}{D + s_b} \\right\\rfloor + 1$", hasil: formatNumber(m_X_calc, 0), satuan: '-' },
            { parameter: "$\\displaystyle m_Y = \\left\\lfloor \\dfrac{h - 2d_s}{D + s_b} \\right\\rfloor + 1$", hasil: formatNumber(m_Y_calc, 0), satuan: '-' },
            { parameter: "$\\displaystyle S_n = \\max(40, 1.5 \\times D)$", hasil: formatNumber(Sn, 0), satuan: 'mm' },
            { parameter: "$\\displaystyle \\beta_1 = \\begin{cases} 0.85 & f'_c \\leq 28 \\text{ MPa} \\\\ 0.85 - 0.05\\dfrac{f'_c - 28}{7} & 28 < f'_c < 55 \\text{ MPa} \\\\ 0.65 & f'_c \\geq 55 \\text{ MPa} \\end{cases}$", hasil: formatNumber(beta1, 3), satuan: '-' }
        ];
        return createThreeColumnTable(rows);
    }

    function createKondisiPenampangTableForArah(arah) {
        const hasilArah = getData(`data.hasilTulangan.hasilArah${arah}`, {});
        const rows = [
            { parameter: "$\\displaystyle a_b = \\dfrac{600 \\beta_1 d}{600 + f_y}$", hasil: formatNumber(hasilArah.ab), satuan: 'mm' },
            { parameter: "$\\displaystyle a_c = \\dfrac{P_u \\times 1000}{0.65 \\times 0.85 \\times f'_c \\times b}$", hasil: formatNumber(hasilArah.ac), satuan: 'mm' },
            { parameter: "$\\displaystyle a_{b1} = \\dfrac{600 \\beta_1 d}{600 - f_y}$", hasil: formatNumber(hasilArah.ab1), satuan: 'mm' },
            { parameter: "$\\displaystyle a_{b2} = \\beta_1 d$", hasil: formatNumber(hasilArah.ab2), satuan: 'mm' },
            { parameter: "$\\displaystyle a_{t1} = \\dfrac{600 \\beta_1 d_s}{600 - f_y}$", hasil: formatNumber(hasilArah.at1), satuan: 'mm' },
            { parameter: "$\\displaystyle a_{t2} = \\beta_1 d_s$", hasil: formatNumber(hasilArah.at2), satuan: 'mm' },
            { parameter: "Kondisi yang berlaku", hasil: hasilArah.kondisi, isConditionValue: true }
        ];
        return createThreeColumnTable(rows, false);
    }

    function createAnalisisTulanganLenturTableForArah(arah) {
        const hasilArah = getData(`data.hasilTulangan.hasilArah${arah}`, {});
        const semuaKondisi = hasilArah.semuaKondisi || {};
        const kondisi = hasilArah.kondisi || '';
        const kondisiAktif = hasilArah.kondisiDetail || {};
        let kondisiData = null;
        if (kondisi === 'ac > ab1') kondisiData = semuaKondisi.kondisi1 || kondisiAktif;
        else if (kondisi === 'ab1 > ac > ab2') kondisiData = semuaKondisi.kondisi2 || kondisiAktif;
        else if (kondisi === 'ab2 > ac > ab') kondisiData = semuaKondisi.kondisi3 || kondisiAktif;
        else if (kondisi === 'ab > ac > at1') kondisiData = semuaKondisi.kondisi4 || kondisiAktif;
        else if (kondisi === 'at1 > ac > at2') kondisiData = semuaKondisi.kondisi5 || kondisiAktif;
        else if (kondisi === 'at2 > ac') kondisiData = semuaKondisi.kondisi6 || kondisiAktif;
        const tampilkanK = kondisi === 'at2 > ac';
        const beban = getData('data.parsedInput.beban', {});
        const Mu = arah === 'X' ? (beban.Mux || beban.mux || 0) : (beban.Muy || beban.muy || 0);
        const Pu = beban.Pu || beban.pu || 0;
        const kontrolLentur = getData('kontrol.lentur', {});
        const K_ok = arah === 'X' ? kontrolLentur.K_ok_X : kontrolLentur.K_ok_Y;
        const Ast_ok = kontrolLentur.Ast_ok;
        const rho_ok = kontrolLentur.rho_ok;
        const d = hasilArah.inputVariables?.d || (arah === 'X' ? getData('data.Dimensi.d_X', 0) : getData('data.Dimensi.d_Y', 0));
        const ds = hasilArah.inputVariables?.ds || getData('data.Dimensi.ds', 0);
        const beta1 = hasilArah.beta1 || getData('data.Dimensi.beta1', 0.85);
        const fy = getData('data.parsedInput.material.fy', 300);
        const fc = getData('data.parsedInput.material.fc', 20);
        const b = getData('data.parsedInput.dimensi.b', 300);
        const h = getData('data.parsedInput.dimensi.h', 400);
        const n = hasilArah.n_terpakai !== undefined ? hasilArah.n_terpakai : (hasilArah.n || 'N/A');
        let D_tul = hasilArah.D;
        if (!D_tul) D_tul = getData('data.parsedInput.tulangan.d_tul', null);
        if (!D_tul) D_tul = getData('data.parsedInput.tulangan.d', null);
        if (!D_tul) D_tul = getData('data.D', 'N/A');
        let As_terpasang = 'N/A';
        let rho_arah = 'N/A';
        if (n !== 'N/A' && D_tul !== 'N/A' && !isNaN(parseFloat(n)) && !isNaN(parseFloat(D_tul))) {
            const nVal = parseFloat(n);
            const Dval = parseFloat(D_tul);
            const Ast_satu = Math.PI * Dval * Dval / 4;
            As_terpasang = nVal * Ast_satu;
            const b_val = parseFloat(b);
            const h_val = parseFloat(h);
            if (!isNaN(b_val) && !isNaN(h_val) && b_val > 0 && h_val > 0) rho_arah = (As_terpasang / (b_val * h_val)) * 100;
        }
        const n_terpakai_val = parseFloat(n);
        const n_max_val = hasilArah.n_max || 0;
        const n_ok_per_arah = (n_terpakai_val <= n_max_val);
        const rows = [
            { parameter: "$P_u$", hasil: formatNumber(Pu), satuan: 'kN' },
            { parameter: `$M_u$ (Arah ${arah.toLowerCase()})`, hasil: formatNumber(Mu), satuan: 'kNm' },
            { parameter: "$\\displaystyle e = \\dfrac{M_u}{P_u} \\times 1000$", hasil: formatNumber(hasilArah.e), satuan: 'mm' },
            { parameter: "$\\displaystyle P_{u\\phi} = 0.1 \\cdot f'_c \\cdot b \\cdot h / 1000$", hasil: formatNumber(hasilArah.Pu_phi), satuan: 'kN' },
            { parameter: "$\\displaystyle \\phi = \\begin{cases} 0.65 & \\text{jika } a_c > a_b \\text{ atau } P_u \\geq P_{u\\phi} \\\\ 0.9 - 0.25 \\cdot \\dfrac{P_u}{P_{u\\phi}} & \\text{jika } P_u < P_{u\\phi} \\end{cases}$", hasil: formatNumber(hasilArah.faktorPhi), satuan: '-' }
        ];
        if (kondisiData && !kondisiData.error) {
            if (kondisi === 'ac > ab1') {
                rows.push({ parameter: "<strong>Perhitungan Kondisi 1: $a_c > a_{b1}$</strong>", isFullRow: true });
                rows.push({ parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{1.25 \\cdot \\dfrac{P_u}{\\phi} - 0.85 f'_c b h}{2(f_y - 0.85 f'_c)}$", hasil: formatNumber(kondisiData.A1), satuan: 'mm²' });
            } else if (kondisi === 'ab1 > ac > ab2') {
                rows.push({ parameter: "<strong>Perhitungan Kondisi 2: $a_{b1} > a_c > a_{b2}$</strong>", isFullRow: true });
                rows.push({ parameter: "$\\displaystyle a_{p1} = \\dfrac{(600 - f_y)(d - d_s)}{600 + f_y}$", hasil: formatNumber(kondisiData.ap1), satuan: 'mm' });
                rows.push({ parameter: "$R_1 = -(a_b + a_{p1} + h)$", hasil: formatNumber(kondisiData.R1), satuan: 'mm' });
                rows.push({ parameter: "$R_2 = 2a_b d + a_c(a_{p1} + 2e)$", hasil: formatNumber(kondisiData.R2), satuan: 'mm²' });
                rows.push({ parameter: "$R_3 = -a_c a_b(d - d_s + 2e)$", hasil: formatNumber(kondisiData.R3), satuan: 'mm³' });
                rows.push({ parameter: "$f(a) = a^3 + R_1 \\cdot a^2 + R_2 \\cdot a + R_3 = 0$", hasil: formatNumber(kondisiData.a_cubic), satuan: 'mm' });
                rows.push({ parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{a(P_u/\\phi - 0.85 f'_c a b)}{(600 + f_y)a - 600\\beta_1 d}$", hasil: formatNumber(kondisiData.A1), satuan: 'mm²' });
            } else if (kondisi === 'ab2 > ac > ab') {
                rows.push({ parameter: "<strong>Perhitungan Kondisi 3: $a_{b2} > a_c > a_b$</strong>", isFullRow: true });
                rows.push({ parameter: "$\\displaystyle a_{p2} = \\dfrac{2f_y d_s + 1200d}{600 + f_y}$", hasil: formatNumber(kondisiData.ap2), satuan: 'mm' });
                rows.push({ parameter: "$R_4 = -(a_b + a_{p2})$", hasil: formatNumber(kondisiData.R4), satuan: 'mm' });
                rows.push({ parameter: "$R_5 = 2a_b d - a_c(h - a_{p2} - 2e)$", hasil: formatNumber(kondisiData.R5), satuan: 'mm²' });
                rows.push({ parameter: "$R_6 = -a_c a_b(d - d_s + 2e)$", hasil: formatNumber(kondisiData.R6), satuan: 'mm³' });
                rows.push({ parameter: "$f(a) = a^3 + R_4 \\cdot a^2 + R_5 \\cdot a + R_6 = 0$", hasil: formatNumber(kondisiData.a_cubic), satuan: 'mm' });
                rows.push({ parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{a(P_u/\\phi - 0.85 f'_c a b)}{(600 + f_y)a - 600\\beta_1 d}$", hasil: formatNumber(kondisiData.A1), satuan: 'mm²' });
            } else if (kondisi === 'ab > ac > at1') {
                rows.push({ parameter: "<strong>Perhitungan Kondisi 4: $a_b > a_c > a_{t1}$</strong>", isFullRow: true });
                rows.push({ parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{0.5 P_u (2e - h + a_c)}{\\phi (d - d_s) f_y}$", hasil: formatNumber(kondisiData.A1), satuan: 'mm²' });
            } else if (kondisi === 'at1 > ac > at2') {
                rows.push({ parameter: "<strong>Perhitungan Kondisi 5: $a_{t1} > a_c > a_{t2}$</strong>", isFullRow: true });
                rows.push({ parameter: "$\\displaystyle a_{p3} = \\dfrac{2f_y d - 1200d_s}{600 - f_y}$", hasil: formatNumber(kondisiData.ap3), satuan: 'mm' });
                rows.push({ parameter: "$R_7 = a_{p3} - a_{t1}$", hasil: formatNumber(kondisiData.R7), satuan: 'mm' });
                rows.push({ parameter: "$R_8 = a_c(2e - h - a_{p3}) + 2a_{t1} d_s$", hasil: formatNumber(kondisiData.R8), satuan: 'mm²' });
                rows.push({ parameter: "$R_9 = a_c a_{t1}(d - d_s - 2e)$", hasil: formatNumber(kondisiData.R9), satuan: 'mm³' });
                rows.push({ parameter: "$f(a) = a^3 + R_7 \\cdot a^2 + R_8 \\cdot a + R_9 = 0$", hasil: formatNumber(kondisiData.a_cubic), satuan: 'mm' });
                rows.push({ parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{a(P_u/\\phi - 0.85 f'_c a b)}{(600 + f_y)a - 600\\beta_1 d}$", hasil: formatNumber(kondisiData.A1), satuan: 'mm²' });
            } else if (kondisi === 'at2 > ac') {
                rows.push({ parameter: "<strong>Perhitungan Kondisi 6: $a_{t2} > a_c$</strong>", isFullRow: true });
                rows.push({ parameter: "$\\displaystyle K = \\dfrac{M_u \\times 10^6}{\\phi_1 b d^2}$", hasil: formatNumber(kondisiData.K, 4), satuan: 'MPa' });
                rows.push({ parameter: "$\\displaystyle K_{maks} = \\dfrac{382.5 \\beta_1 f'_c (600 + f_y - 225\\beta_1)}{(600 + f_y)^2}$", hasil: formatNumber(kondisiData.Kmaks, 4), satuan: 'MPa' });
                rows.push({ parameter: "$\\displaystyle a = \\left(1 - \\sqrt{1 - \\dfrac{2K}{0.85 f'_c}}\\right) d$", hasil: formatNumber(kondisiData.a_flexure), satuan: 'mm' });
                rows.push({ parameter: "$\\displaystyle A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", hasil: formatNumber(kondisiData.As1), satuan: 'mm²' });
                rows.push({ parameter: "$\\displaystyle A_{s2} = \\dfrac{1.4 b d}{f_y}$", hasil: formatNumber(kondisiData.As2), satuan: 'mm²' });
            }
            if (kondisiData.As_tu !== undefined) rows.push({ parameter: "$A_{s,perlu} = A_1 + A_2$", hasil: formatNumber(kondisiData.As_tu), satuan: 'mm²' });
        }
        rows.push(
            { parameter: "$\\displaystyle n = \\dfrac{A_{s,perlu}}{0.25 \\cdot \\pi \\cdot D^2}$", hasil: formatNumber(n, 0), satuan: 'batang' },
            { parameter: "$n_{maks} = 2 \\cdot m$", hasil: formatNumber(n_max_val, 0), satuan: 'batang' },
            { parameter: "$n \\le n_{maks}$", isStatus: true, statusHtml: `<span class="${n_ok_per_arah ? 'status-aman' : 'status-tidak-aman'}">${n_ok_per_arah ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\displaystyle A_{s,terpasang} = n \\cdot 0.25 \\cdot \\pi \\cdot D^2$", hasil: formatNumber(As_terpasang), satuan: 'mm²' },
            { parameter: "$A_{s,terpasang} \\ge A_{s,perlu}$", isStatus: true, statusHtml: `<span class="${Ast_ok ? 'status-aman' : 'status-tidak-aman'}">${Ast_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\displaystyle \\rho = \\dfrac{A_{s,terpasang}}{b \\cdot h} \\times 100\\%$", hasil: formatNumber(rho_arah), satuan: '%' },
            { parameter: "$\\rho_{min} = 1\\%$ (syarat SNI)", isStatus: true, statusHtml: `<span class="${rho_ok ? 'status-aman' : 'status-tidak-aman'}">${rho_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` }
        );
        if (tampilkanK && kondisiData && kondisiData.K !== undefined && kondisiData.Kmaks !== undefined) {
            rows.push({ parameter: "$K \\le K_{maks}$", isStatus: true, statusHtml: `<span class="${K_ok ? 'status-aman' : 'status-tidak-aman'}">${K_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` });
        }
        return createThreeColumnTable(rows, true);
    }

    function createGeserTableDetail() {
        const begel = getData('data.begel', {});
        const kontrolGeser = getData('kontrol.geser', {});
        const beban = getData('data.parsedInput.beban', {});
        const dimensi = getData('data.Dimensi', {});
        const material = getData('data.parsedInput.material', {});
        const tulangan = getData('data.parsedInput.tulangan', {});
        const lanjutan = getData('data.parsedInput.lanjutan', {});
        const h = getData('data.parsedInput.dimensi.h', 0);
        const b = getData('data.parsedInput.dimensi.b', 0);
        let d = begel.inputVariables?.d;
        if (!d) d = getData('data.d_begel', null);
        if (!d) d = getData('data.d', null);
        if (!d) d = getData('data.Dimensi.d_X', 0);
        const Ag = h * b;
        const fc = material.fc || 20;
        const fyt = material.fyt || material.fy || 300;
        const lambda = lanjutan.lambda || 1;
        const nKaki = lanjutan.n_kaki || 2;
        const phi = tulangan.phi_tul || tulangan.phi || 8;
        const Vs = begel.Vs || 0;
        const Vs_max = begel.Vs_max || 0;
        const Av_u = begel.Av_u || 0;
        const luasSatuSengkang = 0.25 * Math.PI * phi * phi;
        const luasTotalSengkang = nKaki * luasSatuSengkang;
        const s1 = Av_u > 0 ? (luasTotalSengkang * 1000) / Av_u : 0;
        let s2, s3, rumusS2, rumusS3;
        if (Vs < Vs_max / 2) { s2 = d / 2; rumusS2 = "$s_2 = d/2$"; } else { s2 = d / 4; rumusS2 = "$s_2 = d/4$"; }
        if (Vs < Vs_max / 2) { s3 = 600; rumusS3 = "$s_3 = 600$"; } else { s3 = 300; rumusS3 = "$s_3 = 300$"; }
        const rows = [
            { parameter: "$V_u$", hasil: formatNumber(beban.Vu || beban.vu), satuan: 'kN' },
            { parameter: "$\\displaystyle A_g = b \\cdot h$", hasil: formatNumber(Ag, 0), satuan: 'mm²' },
            { parameter: "$\\displaystyle \\phi V_c = 0.75 \\cdot 0.17 \\cdot \\left(1 + \\dfrac{P_u \\cdot 1000}{14 \\cdot A_g}\\right) \\cdot \\lambda \\cdot \\sqrt{f'_c} \\cdot b \\cdot d / 1000$", hasil: formatNumber(begel.Vc_phi), satuan: 'kN' },
            { parameter: "$\\displaystyle V_s = \\dfrac{V_u - \\phi V_c}{0.75}$", hasil: formatNumber(begel.Vs), satuan: 'kN' },
            { parameter: "$\\displaystyle V_{s,max} = \\dfrac{2}{3} \\cdot \\sqrt{f'_c} \\cdot b \\cdot d / 1000$", hasil: formatNumber(begel.Vs_max), satuan: 'kN' },
            { parameter: "$V_s \\le V_{s,max}$", isStatus: true, statusHtml: `<span class="${kontrolGeser.Vs_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Vs_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\displaystyle A_{v,u1} = 0.062 \\cdot \\sqrt{f'_c} \\cdot b \\cdot \\dfrac{1000}{f_{yt}}$", hasil: formatNumber(begel.Avu1), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle A_{v,u2} = 0.35 \\cdot b \\cdot \\dfrac{1000}{f_{yt}}$", hasil: formatNumber(begel.Avu2), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle A_{v,u3} = \\dfrac{V_s \\cdot 10^6}{f_{yt} \\cdot d}$", hasil: formatNumber(begel.Avu3), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle A_{v,u} = \\max(A_{v,u1}, A_{v,u2}, A_{v,u3})$", hasil: formatNumber(begel.Av_u), satuan: 'mm²/m' },
            { parameter: "$\\displaystyle s_1 = \\dfrac{n_{kaki} \\cdot \\pi \\cdot \\phi^2}{4 \\cdot A_{v,u}} \\cdot 1000$", hasil: formatNumber(s1), satuan: 'mm' },
            { parameter: rumusS2, hasil: formatNumber(s2), satuan: 'mm' },
            { parameter: rumusS3, hasil: formatNumber(s3), satuan: 'mm' },
            { parameter: "$\\displaystyle s = \\min(s_1, s_2, s_3)$", hasil: formatNumber(begel.s, 0), satuan: 'mm' },
            { parameter: "$\\displaystyle A_{v,terpasang} = \\dfrac{n_{kaki} \\cdot \\pi \\cdot \\phi^2}{4 \\cdot s} \\cdot 1000$", hasil: formatNumber(begel.Av_terpakai), satuan: 'mm²/m' },
            { parameter: "$A_{v,terpasang} \\ge A_{v,u}$", isStatus: true, statusHtml: `<span class="${kontrolGeser.Av_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Av_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` }
        ];
        return createThreeColumnTable(rows, true);
    }

    function createKontrolTable() {
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolGeser = getData('kontrol.geser', {});
        const hasilX = getData('data.hasilTulangan.hasilArahX', {});
        const hasilY = getData('data.hasilTulangan.hasilArahY', {});
        const n_X = parseFloat(hasilX.n_terpakai) || 0;
        const n_max_X = parseFloat(hasilX.n_max) || 0;
        const n_ok_X = (n_X <= n_max_X);
        const n_Y = parseFloat(hasilY.n_terpakai) || 0;
        const n_max_Y = parseFloat(hasilY.n_max) || 0;
        const n_ok_Y = (n_Y <= n_max_Y);
        const rows = [
            { parameter: "$A_{s,terpasang} \\ge A_{s,perlu}$", statusHtml: `<span class="${kontrolLentur.Ast_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.Ast_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$\\rho \\ge 1\\%$", statusHtml: `<span class="${kontrolLentur.rho_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.rho_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$n_X \\le n_{maks,X}$", statusHtml: `<span class="${n_ok_X ? 'status-aman' : 'status-tidak-aman'}">${n_ok_X ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$n_Y \\le n_{maks,Y}$", statusHtml: `<span class="${n_ok_Y ? 'status-aman' : 'status-tidak-aman'}">${n_ok_Y ? 'AMAN' : 'TIDAK AMAN'}</span>` }
        ];
        if (kontrolLentur.K_ok_X !== undefined) rows.push({ parameter: "$K_X \\le K_{maks,X}$", statusHtml: `<span class="${kontrolLentur.K_ok_X ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.K_ok_X ? 'AMAN' : 'TIDAK AMAN'}</span>` });
        if (kontrolLentur.K_ok_Y !== undefined) rows.push({ parameter: "$K_Y \\le K_{maks,Y}$", statusHtml: `<span class="${kontrolLentur.K_ok_Y ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.K_ok_Y ? 'AMAN' : 'TIDAK AMAN'}</span>` });
        rows.push(
            { parameter: "$V_s \\le V_{s,max}$", statusHtml: `<span class="${kontrolGeser.Vs_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Vs_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` },
            { parameter: "$A_{v,terpasang} \\ge A_{v,u}$", statusHtml: `<span class="${kontrolGeser.Av_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Av_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` }
        );
        return createTwoColumnTable(rows);
    }

    function generateDynamicConclusion() {
        const statusKolom = cekStatusKolom();
        const dimensi = getData('data.parsedInput.dimensi', {});
        const b = dimensi.b || 'N/A';
        const h = dimensi.h || 'N/A';
        let conclusionHTML = `<div class="section-group" style="page-break-inside: avoid;"><h3>3. Kesimpulan</h3><div class="conclusion-box"><h4 style="text-align: center; ${statusKolom === 'aman' ? 'color: #155724;' : 'color: #721c24;'} margin-bottom: 8px;"><strong>STRUKTUR KOLOM BETON BERTULANG ${statusKolom === 'aman' ? 'AMAN' : 'TIDAK AMAN'}</strong></h4>`;
        if (statusKolom === 'aman') {
            conclusionHTML += `<p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p><p>Struktur kolom dengan dimensi ${b} × ${h} mm memenuhi semua persyaratan SNI 2847:2019 untuk:</p><ul><li>Kuat lentur aksial dengan eksentrisitas (dua arah)</li><li>Kuat geser</li><li>Persyaratan rasio tulangan minimum</li><li>Batasan jumlah tulangan maksimum</li></ul>`;
        } else {
            const masalah = [];
            const kontrolLentur = getData('kontrol.lentur', {});
            const kontrolGeser = getData('kontrol.geser', {});
            const hasilX = getData('data.hasilTulangan.hasilArahX', {});
            const hasilY = getData('data.hasilTulangan.hasilArahY', {});
            if (!kontrolLentur.Ast_ok) masalah.push("Luas tulangan terpasang tidak mencukupi");
            if (!kontrolLentur.rho_ok) masalah.push("Rasio tulangan kurang dari 1%");
            if (!kontrolLentur.K_ok_X) masalah.push("Nilai K arah X melebihi Kmaks");
            if (!kontrolLentur.K_ok_Y) masalah.push("Nilai K arah Y melebihi Kmaks");
            if ((parseFloat(hasilX.n_terpakai) || 0) > (parseFloat(hasilX.n_max) || 0)) masalah.push("Jumlah tulangan arah X melebihi batas maksimum");
            if ((parseFloat(hasilY.n_terpakai) || 0) > (parseFloat(hasilY.n_max) || 0)) masalah.push("Jumlah tulangan arah Y melebihi batas maksimum");
            if (!kontrolGeser.Vs_ok) masalah.push("Kebutuhan tulangan geser melebihi kapasitas maksimum");
            if (!kontrolGeser.Av_ok) masalah.push("Luas sengkang tidak mencukupi");
            conclusionHTML += `<p><strong>Status:</strong> <span class="status-tidak-aman">TIDAK AMAN - PERLU PERBAIKAN DESAIN</span></p><p>Ditemukan masalah pada beberapa aspek desain:</p><div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">${masalah.length > 0 ? masalah.map(m => `<p class="problem-item">• ${m}</p>`).join('') : '<p class="problem-item">• Terdapat masalah pada satu atau lebih kontrol keamanan</p>'}</div>`;
        }
        conclusionHTML += `<p style="margin-top: 8px; font-size: 10pt; color: #666;"><strong>Catatan:</strong> Hasil perhitungan ini berdasarkan SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung). Pastikan semua aspek konstruksi sesuai dengan spesifikasi teknis dan dilakukan pengawasan yang memadai. Untuk kolom dengan eksentrisitas besar, perhatikan juga kontrol stabilitas dan tekuk.</p></div></div>`;
        return conclusionHTML;
    }

    function generateContentBlocks() {
        const blocks = [];
        const statusKolomDinamis = cekStatusKolom();
        blocks.push(`<h1>LAPORAN PERHITUNGAN KOLOM BETON BERTULANG</h1><div class="header-info"><div><span><strong>Mode:</strong> ${getData('mode', 'N/A').toUpperCase()}</span><span><strong>Modul:</strong> ${getData('module', 'N/A').toUpperCase()}</span></div><div><span><strong>Tanggal:</strong> ${formatTimestampFull(getData('timestamp'))}</span><span><strong>Status:</strong> <span class="${statusKolomDinamis === 'aman' ? 'status-aman' : 'status-tidak-aman'}">${statusKolomDinamis.toUpperCase()}</span></span></div></div><div class="keep-together"><h2>A. DATA INPUT DAN PARAMETER</h2><div class="section-group"><h3>1. Data Material dan Dimensi</h3>${createMaterialDimensiTable()}</div></div>`);
        blocks.push(`<div class="section-group"><h3>2. Data Beban</h3>${createBebanTable()}</div>`);
        blocks.push(`<div class="section-group"><h3>3. Data Tulangan</h3>${createTulanganTable()}</div>`);
        blocks.push(`<div class="section-group"><h3>4. Perhitungan Parameter Dasar</h3>${createParameterTable()}</div>`);
        blocks.push(`<div class="header-content-group"><h2>B. PERHITUNGAN TULANGAN LENTUR KOLOM</h2><p class="note">Perhitungan tulangan lentur dengan beban aksial dan momen dua arah (kolom biaxial)</p></div><div class="section-group"><h3>1. Perhitungan Kondisi Penampang Kolom Arah X</h3>${createKondisiPenampangTableForArah('X')}</div>`);
        blocks.push(`<div class="section-group"><h3>2. Analisis Tulangan Lentur Arah X</h3>${createAnalisisTulanganLenturTableForArah('X')}</div>`);
        blocks.push(`<div class="section-group"><h3>3. Perhitungan Kondisi Penampang Kolom Arah Y</h3>${createKondisiPenampangTableForArah('Y')}</div>`);
        blocks.push(`<div class="section-group"><h3>4. Analisis Tulangan Lentur Arah Y</h3>${createAnalisisTulanganLenturTableForArah('Y')}</div>`);
        blocks.push(`<div class="header-content-group"><h2>C. PERHITUNGAN TULANGAN GESER</h2><p class="note">Perhitungan tulangan geser untuk menahan gaya geser pada kolom</p><div class="section-group"><h3>1. Analisis Tulangan Geser</h3>${createGeserTableDetail()}</div></div>`);
        blocks.push(`<div class="header-content-group"><h2>D. REKAPITULASI HASIL DESAIN</h2></div><div class="section-group"><h3>1. Tulangan Terpasang</h3>${createTulanganTerpasangTable()}</div>`);
        blocks.push(`<div class="section-group"><h3>2. Ringkasan Kontrol Keamanan</h3>${createKontrolTable()}</div>`);
        blocks.push(generateDynamicConclusion());
        blocks.push(`<p class="note" style="margin-top: 10px;"><strong>Referensi:</strong> SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung)</p>`);
        return blocks;
    }

    window.kolomReport = {
        setData: setData,
        generateContentBlocks: generateContentBlocks,
        cekStatusKolom: cekStatusKolom,
        formatNumber: formatNumber,
        getData: getData
    };
})();