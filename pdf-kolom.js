// pdf-kolom.js
(function() {
    let resultData;

    function setData(data) {
        resultData = data;
    }

    // ==============================================
    // FUNGSI UTAMA: Cek Status Kolom Dinamis
    // ==============================================
    function cekStatusKolom() {
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolGeser = getData('kontrol.geser', {});
        
        let semuaAman = true;
        
        // Cek kontrol lentur
        if (kontrolLentur) {
            if (!kontrolLentur.Ast_ok || !kontrolLentur.rho_ok || !kontrolLentur.n_ok || !kontrolLentur.K_ok) {
                semuaAman = false;
            }
        }
        
        // Cek kontrol geser
        if (kontrolGeser) {
            if (!kontrolGeser.Vs_ok || !kontrolGeser.Av_ok) {
                semuaAman = false;
            }
        }
        
        return semuaAman ? 'aman' : 'tidak aman';
    }

    // Fungsi helper untuk mengambil data dengan fallback ke sessionStorage
    function getData(path, defaultValue = 'N/A') {
        try {
            // Coba ambil dari resultData terlebih dahulu
            const keys = path.split('.');
            let value = resultData;
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    value = undefined;
                    break;
                }
            }
            
            // Jika ditemukan di resultData, kembalikan
            if (value !== undefined && value !== null && value !== 'N/A') {
                return value;
            }
            
            // Jika tidak ditemukan, coba ambil dari sessionStorage
            const sessionData = sessionStorage.getItem('calculationResultKolom');
            if (sessionData) {
                const parsedData = JSON.parse(sessionData);
                let sessionValue = parsedData;
                for (const key of keys) {
                    if (sessionValue && typeof sessionValue === 'object' && key in sessionValue) {
                        sessionValue = sessionValue[key];
                    } else {
                        sessionValue = undefined;
                        break;
                    }
                }
                
                if (sessionValue !== undefined && sessionValue !== null && sessionValue !== 'N/A') {
                    return sessionValue;
                }
            }
            
            return defaultValue;
        } catch (error) {
            console.warn(`Error getting data for path ${path}:`, error);
            return defaultValue;
        }
    }

    // Fungsi untuk memformat angka dengan desimal fleksibel
    function formatNumber(num, decimals = null) {
        if (num === null || num === undefined || num === 'N/A' || isNaN(num)) return 'N/A';
        
        const numFloat = parseFloat(num);
        
        // Jika decimals diberikan secara eksplisit, gunakan itu
        if (decimals !== null) {
            if (decimals === 0) {
                return Math.round(numFloat).toString();
            }
            return numFloat.toFixed(decimals);
        }
        
        // Cek apakah angka sudah bulat (tanpa desimal)
        if (Number.isInteger(numFloat)) {
            return numFloat.toString();
        }
        
        // Ambil bagian integer dan desimal
        const numStr = numFloat.toString();
        const parts = numStr.split('.');
        const integerPart = Math.abs(parseInt(parts[0]));
        
        // Tentukan jumlah digit desimal berdasarkan aturan:
        // - Jika bagian integer hanya 1 digit, tampilkan 3 digit desimal
        // - Jika bagian integer lebih dari 1 digit, tampilkan 2 digit desimal
        let targetDecimals;
        if (integerPart <= 9) { // 0-9 (termasuk angka negatif yang diambil absolut)
            targetDecimals = 3;
        } else {
            targetDecimals = 2;
        }
        
        // Pastikan tidak menampilkan trailing zeros yang tidak perlu
        const formatted = numFloat.toFixed(targetDecimals);
        return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }

    // Fungsi untuk memformat tanggal
    function formatTimestampFull(timestamp) {
        if (!timestamp) return 'N/A';
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

    // Fungsi untuk membuat tabel data material dan dimensi (DIPERBAIKI)
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

    // Fungsi untuk membuat tabel data beban (DIPERBAIKI)
    function createBebanTable() {
        const beban = getData('data.parsedInput.beban', {});
        
        const rows = [
            { parameter: "$P_u$ (Beban aksial)", hasil: formatNumber(beban.Pu || beban.pu), satuan: 'kN' },
            { parameter: "$M_u$ (Momen lentur)", hasil: formatNumber(beban.Mu || beban.mu), satuan: 'kNm' },
            { parameter: "$V_u$ (Gaya geser)", hasil: formatNumber(beban.Vu || beban.vu), satuan: 'kN' }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }

    // Fungsi untuk membuat tabel data tulangan (DIPERBAIKI)
    function createTulanganTable() {
        const tulangan = getData('data.parsedInput.tulangan', {});
        const mode = getData('mode', 'evaluasi');
        
        const rows = [
            { parameter: "D (Diameter tulangan utama)", hasil: formatNumber(tulangan.d || tulangan.d_tul || getData('data.D', 'N/A'), 0), satuan: 'mm' },
            { parameter: "ɸ (Diameter tulangan sengkang)", hasil: formatNumber(tulangan.phi || tulangan.phi_tul || getData('data.phi', 'N/A'), 0), satuan: 'mm' }
        ];
        
        if (mode === 'evaluasi') {
            rows.push(
                { parameter: "$n$ (Jumlah tulangan)", hasil: formatNumber(tulangan.n || tulangan.n_tul, 0), satuan: 'batang' },
                { parameter: "$s$ (Jarak sengkang)", hasil: formatNumber(tulangan.s || tulangan.s_tul, 0), satuan: 'mm' }
            );
        }
        
        return createThreeColumnTable(rows, false, true);
    }

    // Fungsi untuk membuat tabel parameter perhitungan
    function createParameterTable() {
        const dimensi = getData('data.Dimensi', {});
        const hasilTulangan = getData('data.hasilTulangan', {});
        
        const rows = [
            { parameter: "$\\displaystyle m = \\left\\lfloor \\frac{b - 2d_{s1}}{D + s_b} \\right\\rfloor + 1$", hasil: formatNumber(dimensi.m, 0), satuan: '-' },
            { parameter: "$S_n$ (Jarak bersih antar tulangan)", hasil: formatNumber(dimensi.Sn), satuan: 'mm' },
            { parameter: "$d_{s1}$ (Jarak pusat tulangan ke muka beton)", hasil: formatNumber(dimensi.ds1), satuan: 'mm' },
            { parameter: "$d_{s2}$", hasil: formatNumber(dimensi.ds2), satuan: 'mm' },
            { parameter: "$d_s$", hasil: formatNumber(dimensi.ds), satuan: 'mm' },
            { parameter: "$d$ (Tinggi efektif)", hasil: formatNumber(dimensi.d), satuan: 'mm' },
            { parameter: "$\\beta_1$", hasil: formatNumber(dimensi.beta1), satuan: '-' },
            { parameter: "$\\phi_1$ (Faktor reduksi lentur)", hasil: formatNumber(dimensi.phi1), satuan: '-' },
            { parameter: "$\\phi_2$ (Faktor reduksi geser)", hasil: formatNumber(dimensi.phi2), satuan: '-' },
            { parameter: "$\\displaystyle a_b = \\frac{600 \\beta_1 d}{600 + f_y}$", hasil: formatNumber(hasilTulangan.ab), satuan: 'mm' },
            { parameter: "$\\displaystyle a_{b1} = \\frac{600 \\beta_1 d}{600 - f_y}$", hasil: formatNumber(hasilTulangan.ab1), satuan: 'mm' },
            { parameter: "$\\displaystyle a_{b2} = \\beta_1 d$", hasil: formatNumber(hasilTulangan.ab2), satuan: 'mm' },
            { parameter: "$\\displaystyle a_{t1} = \\frac{600 \\beta_1 d_s}{600 - f_y}$", hasil: formatNumber(hasilTulangan.at1), satuan: 'mm' },
            { parameter: "$\\displaystyle a_{t2} = \\beta_1 d_s$", hasil: formatNumber(hasilTulangan.at2), satuan: 'mm' }
        ];
        
        return createThreeColumnTable(rows);
    }

    // Fungsi untuk membuat tabel perhitungan lentur detail
    function createLenturTableDetail() {
        const hasilTulangan = getData('data.hasilTulangan', {});
        const kontrolLentur = getData('kontrol.lentur', {});
        const beban = getData('data.parsedInput.beban', {});
        const dimensi = getData('data.Dimensi', {});
        
        const rows = [
            { parameter: "$P_u$", hasil: formatNumber(beban.Pu || beban.pu), satuan: 'kN' },
            { parameter: "$M_u$", hasil: formatNumber(beban.Mu || beban.mu), satuan: 'kNm' },
            { parameter: "$\\displaystyle e = \\frac{M_u}{P_u}$ (jika $P_u \\neq 0$)", hasil: formatNumber(hasilTulangan.e), satuan: 'mm' },
            { parameter: "$\\displaystyle a_c = \\frac{P_u \\times 1000}{0.65 \\times 0.85 \\times f'_c \\times b}$", hasil: formatNumber(hasilTulangan.ac), satuan: 'mm' },
            { parameter: "Kondisi yang berlaku", hasil: hasilTulangan.kondisi || 'N/A', satuan: '-' },
            { parameter: "$\\displaystyle P_{u\\phi} = 0.1 \\times f'_c \\times b \\times h / 1000$", hasil: formatNumber(hasilTulangan.Pu_phi), satuan: 'kN' },
            { parameter: "Faktor $\\phi$ yang digunakan", hasil: formatNumber(hasilTulangan.faktorPhi), satuan: '-' },
            { parameter: "$A_{s,perlu}$ (Tulangan tarik perlu)", hasil: formatNumber(hasilTulangan.As_tu), satuan: 'mm²' },
            { parameter: "$A_{s,tunggal}$ (Luas 1 tulangan)", hasil: formatNumber(hasilTulangan.Ast_satu), satuan: 'mm²' },
            { parameter: "$n_{perlu}$", hasil: formatNumber(hasilTulangan.n, 0), satuan: 'batang' },
            { parameter: "$n_{maks} = 2 \\times m$", hasil: formatNumber(hasilTulangan.n_max, 0), satuan: 'batang' },
            { parameter: "$n_{terpasang}$", hasil: formatNumber(hasilTulangan.n_terpakai, 0), satuan: 'batang' },
            { 
                parameter: "$n \\le n_{maks}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolLentur.n_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.n_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { parameter: "$A_{s,terpasang}$", hasil: formatNumber(hasilTulangan.Ast_i), satuan: 'mm²' },
            { 
                parameter: "$A_{s,terpasang} \\ge A_{s,perlu}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolLentur.Ast_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.Ast_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { parameter: "$\\displaystyle \\rho = \\frac{A_{s,terpasang}}{b \\times h} \\times 100\\%$", hasil: formatNumber(hasilTulangan.rho, 3), satuan: '%' },
            { 
                parameter: "$\\rho \\ge 1\\%$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolLentur.rho_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.rho_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { parameter: "$\\displaystyle K = \\frac{M_u \\times 10^6}{\\phi_1 \\times b \\times d^2}$", hasil: formatNumber(hasilTulangan.K, 4), satuan: 'MPa' },
            { parameter: "$K_{maks}$", hasil: formatNumber(hasilTulangan.Kmaks, 4), satuan: 'MPa' },
            { 
                parameter: "$K \\le K_{maks}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolLentur.K_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.K_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            }
        ];
        
        return createThreeColumnTable(rows, true);
    }

    // Fungsi untuk membuat tabel perhitungan geser detail
    function createGeserTableDetail() {
        const begel = getData('data.begel', {});
        const kontrolGeser = getData('kontrol.geser', {});
        const beban = getData('data.parsedInput.beban', {});
        const dimensi = getData('data.Dimensi', {});
        const material = getData('data.parsedInput.material', {});
        
        const h = getData('data.parsedInput.dimensi.h', 0);
        const b = getData('data.parsedInput.dimensi.b', 0);
        const Ag = h * b;
        
        const rows = [
            { parameter: "$V_u$", hasil: formatNumber(beban.Vu || beban.vu), satuan: 'kN' },
            { parameter: "$A_g = b \\times h$", hasil: formatNumber(Ag, 0), satuan: 'mm²' },
            { parameter: "$\\displaystyle \\phi V_c = \\phi_2 \\times 0.17 \\times \\left(1 + \\frac{P_u \\times 1000}{14 \\times A_g}\\right) \\times \\lambda \\times \\sqrt{f'_c} \\times b \\times d / 1000$", hasil: formatNumber(begel.Vc_phi), satuan: 'kN' },
            { parameter: "$V_s = (V_u - \\phi V_c) / \\phi_2$", hasil: formatNumber(begel.Vs), satuan: 'kN' },
            { parameter: "$V_{s,max} = \\frac{2}{3} \\times \\sqrt{f'_c} \\times b \\times d / 1000$", hasil: formatNumber(begel.Vs_max), satuan: 'kN' },
            { 
                parameter: "$V_s \\le V_{s,max}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolGeser.Vs_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Vs_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { parameter: "$A_{v,u1} = 0.062 \\times \\sqrt{f'_c} \\times b \\times 1000 / f_{yt}$", hasil: formatNumber(begel.Avu1), satuan: 'mm²/m' },
            { parameter: "$A_{v,u2} = 0.35 \\times b \\times 1000 / f_{yt}$", hasil: formatNumber(begel.Avu2), satuan: 'mm²/m' },
            { parameter: "$A_{v,u3} = \\frac{V_s \\times 10^6}{f_{yt} \\times d}$", hasil: formatNumber(begel.Avu3), satuan: 'mm²/m' },
            { parameter: "$A_{v,u} = \\max(A_{v,u1}, A_{v,u2}, A_{v,u3})$", hasil: formatNumber(begel.Av_u), satuan: 'mm²/m' },
            { parameter: "$s$ (Jarak sengkang)", hasil: formatNumber(begel.s, 0), satuan: 'mm' },
            { parameter: "$A_{v,terpasang}$", hasil: formatNumber(begel.Av_terpakai), satuan: 'mm²/m' },
            { 
                parameter: "$A_{v,terpasang} \\ge A_{v,u}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolGeser.Av_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Av_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            }
        ];
        
        return createThreeColumnTable(rows, true);
    }

    // Fungsi untuk membuat tabel rekap hasil
    function createRekapitulasiTable() {
        const rekap = getData('rekap', {});
        const tulangan = rekap?.tulangan || {};
        const begel = rekap?.begel || {};
        
        const rows = [
            { 
                parameter: "Tulangan Utama", 
                hasil: rekap?.formatted?.tulangan_utama || 'N/A', 
                satuan: '-' 
            },
            { 
                parameter: "Sengkang/Begel", 
                hasil: rekap?.formatted?.begel || 'N/A', 
                satuan: '-' 
            },
            { 
                parameter: "Eksentrisitas (e)", 
                hasil: rekap?.formatted?.e || formatNumber(tulangan.e), 
                satuan: 'mm' 
            },
            { 
                parameter: "Rasio Tulangan (ρ)", 
                hasil: formatNumber(tulangan.rho, 3), 
                satuan: '%' 
            },
            { 
                parameter: "Kontrol K", 
                hasil: rekap?.formatted?.K || (tulangan.K_ok !== undefined ? (tulangan.K_ok ? 'AMAN' : 'TIDAK AMAN') : 'N/A'), 
                satuan: '-' 
            }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }

    // Fungsi untuk membuat ringkasan kontrol
    function createKontrolTable() {
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolGeser = getData('kontrol.geser', {});
        
        const rows = [
            { 
                parameter: "$A_{s,terpasang} \\ge A_{s,perlu}$", 
                statusHtml: `<span class="${kontrolLentur.Ast_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.Ast_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$\\rho \\ge 1\\%$", 
                statusHtml: `<span class="${kontrolLentur.rho_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.rho_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$n \\le n_{maks}$", 
                statusHtml: `<span class="${kontrolLentur.n_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.n_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$K \\le K_{maks}$", 
                statusHtml: `<span class="${kontrolLentur.K_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.K_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$V_s \\le V_{s,max}$", 
                statusHtml: `<span class="${kontrolGeser.Vs_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Vs_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$A_{v,terpasang} \\ge A_{v,u}$", 
                statusHtml: `<span class="${kontrolGeser.Av_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Av_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            }
        ];
        
        return createTwoColumnTable(rows);
    }

    // Fungsi untuk membuat kesimpulan dinamis
    function generateDynamicConclusion() {
        const statusKolom = cekStatusKolom();
        const dimensi = getData('data.parsedInput.dimensi', {});
        const material = getData('data.parsedInput.material', {});
        const beban = getData('data.parsedInput.beban', {});
        const tulangan = getData('data.parsedInput.tulangan', {});
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolGeser = getData('kontrol.geser', {});
        
        let masalah = [];
        let rekomendasi = [];
        
        // Analisis masalah
        if (kontrolLentur) {
            if (!kontrolLentur.Ast_ok) {
                masalah.push("Luas tulangan terpasang tidak mencukupi");
                rekomendasi.push("Tambah jumlah atau diameter tulangan utama");
            }
            if (!kontrolLentur.rho_ok) {
                masalah.push("Rasio tulangan kurang dari 1%");
                rekomendasi.push("Tambah jumlah tulangan hingga ρ ≥ 1%");
            }
            if (!kontrolLentur.n_ok) {
                masalah.push("Jumlah tulangan melebihi batas maksimum");
                rekomendasi.push("Kurangi jumlah tulangan atau perbesar dimensi kolom");
            }
            if (!kontrolLentur.K_ok) {
                masalah.push("Nilai K melebihi Kmaks (momen terlalu besar)");
                rekomendasi.push("Perbesar dimensi kolom atau tambah mutu beton");
            }
        }
        
        if (kontrolGeser) {
            if (!kontrolGeser.Vs_ok) {
                masalah.push("Kebutuhan tulangan geser melebihi kapasitas maksimum");
                rekomendasi.push("Perbesar dimensi kolom atau tambah mutu beton");
            }
            if (!kontrolGeser.Av_ok) {
                masalah.push("Luas sengkang tidak mencukupi");
                rekomendasi.push("Perkecil jarak sengkang atau gunakan diameter sengkang lebih besar");
            }
        }
        
        // Buat HTML kesimpulan
        let conclusionHTML = `
            <div class="section-group">
                <h3>3. Kesimpulan</h3>
                <div class="conclusion-box">
                    <h4 style="text-align: center; ${statusKolom === 'aman' ? 'color: #155724;' : 'color: #721c24;'} margin-bottom: 8px;">
                        <strong>STRUKTUR KOLOM BETON BERTULANG ${statusKolom === 'aman' ? 'AMAN' : 'TIDAK AMAN'}</strong>
                    </h4>
        `;
        
        if (statusKolom === 'aman') {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p>
                <p>Struktur kolom dengan dimensi ${dimensi.b || 'N/A'} × ${dimensi.h || 'N/A'} mm memenuhi semua persyaratan SNI 2847:2019 untuk:</p>
                <ul>
                    <li>Kuat lentur aksial dengan eksentrisitas</li>
                    <li>Kuat geser</li>
                    <li>Persyaratan rasio tulangan minimum</li>
                    <li>Batasan jumlah tulangan maksimum</li>
                </ul>
            `;
            
            rekomendasi = [
                `Gunakan tulangan utama ${getData('rekap.formatted.tulangan_utama', 'N/A')}`,
                `Gunakan sengkang ${getData('rekap.formatted.begel', 'N/A')}`,
                `Pastikan mutu beton mencapai f'c = ${formatNumber(material.fc)} MPa`,
                `Pastikan mutu baja mencapai fy = ${formatNumber(material.fy)} MPa`,
                "Lakukan pengecoran dengan metode yang sesuai standar",
                "Perhatikan penempatan tulangan dan sengkang sesuai detil"
            ];
        } else {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-tidak-aman">TIDAK AMAN - PERLU PERBAIKAN DESAIN</span></p>
                <p>Ditemukan masalah pada beberapa aspek desain:</p>
                <div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                    ${masalah.length > 0 ? masalah.map(m => `<p class="problem-item">• ${m}</p>`).join('') : '<p class="problem-item">• Terdapat masalah pada satu atau lebih kontrol keamanan</p>'}
                </div>
            `;
            
            if (masalah.length === 0) {
                rekomendasi.push("Tinjau kembali dimensi kolom: " + (dimensi.b || 'N/A') + " × " + (dimensi.h || 'N/A') + " mm");
                rekomendasi.push("Evaluasi ulang mutu material yang digunakan");
                rekomendasi.push("Pertimbangkan untuk menggunakan tulangan dengan diameter lebih besar");
                rekomendasi.push("Periksa kembali konfigurasi tulangan dan sengkang");
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
                Untuk kolom dengan eksentrisitas besar, perhatikan juga kontrol stabilitas dan tekuk.
            </p>
        `;
        
        conclusionHTML += `
                </div>
            </div>
        `;
        
        return conclusionHTML;
    }

    // ==============================================
    // FUNGSI UTAMA: Generate Content Blocks
    // ==============================================
    function generateContentBlocks() {
        const blocks = [];
        const statusKolomDinamis = cekStatusKolom();
        
        blocks.push(`
            <h1>LAPORAN PERHITUNGAN KOLOM BETON BERTULANG</h1>
            <div class="header-info">
                <div>
                    <span><strong>Mode:</strong> ${getData('mode', 'N/A').toUpperCase()}</span>
                    <span><strong>Modul:</strong> ${getData('module', 'N/A').toUpperCase()}</span>
                </div>
                <div>
                    <span><strong>Tanggal:</strong> ${formatTimestampFull(getData('timestamp'))}</span>
                    <span><strong>Status:</strong> <span class="${statusKolomDinamis === 'aman' ? 'status-aman' : 'status-tidak-aman'}">${statusKolomDinamis.toUpperCase()}</span></span>
                </div>
            </div>
            <h2>A. DATA INPUT DAN PARAMETER</h2>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Data Material dan Dimensi</h3>
                ${createMaterialDimensiTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Data Beban</h3>
                ${createBebanTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>3. Data Tulangan</h3>
                ${createTulanganTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>4. Perhitungan Parameter</h3>
                ${createParameterTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>B. PERHITUNGAN TULANGAN LENTUR KOLOM</h2>
                <p class="note">Perhitungan tulangan lentur dengan beban aksial dan momen (kolom dengan eksentrisitas)</p>
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Analisis Lentur Aksial</h3>
                ${createLenturTableDetail()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>C. PERHITUNGAN TULANGAN GESER (SENGKANG)</h2>
                <p class="note">Perhitungan tulangan geser untuk menahan gaya geser pada kolom</p>
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Analisis Geser</h3>
                ${createGeserTableDetail()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>D. REKAPITULASI HASIL DESAIN</h2>
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Tulangan Terpasang</h3>
                ${createRekapitulasiTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Ringkasan Kontrol Keamanan</h3>
                ${createKontrolTable()}
            </div>
        `);
        
        blocks.push(generateDynamicConclusion());
        
        blocks.push(`
            <p class="note" style="margin-top: 10px;">
                <strong>Referensi:</strong> SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung)
            </p>
        `);
        
        return blocks;
    }

    // Ekspos fungsi-fungsi yang diperlukan
    window.kolomReport = {
        setData: setData,
        generateContentBlocks: generateContentBlocks,
        cekStatusKolom: cekStatusKolom,
        formatNumber: formatNumber,
        getData: getData
    };
})();