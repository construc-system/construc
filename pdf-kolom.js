[file name]: pdf-kolom.js
[file content begin]
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
        
        if (!kontrolLentur || !kontrolGeser) return 'tidak aman';
        
        // TAMBAHAN: Periksa juga K_ok untuk kontrol lentur
        const semuaKontrolLentur = kontrolLentur.Ast_ok && kontrolLentur.rho_ok && 
                                  kontrolLentur.n_ok && kontrolLentur.K_ok;
        const semuaKontrolGeser = kontrolGeser.Vs_ok && kontrolGeser.Av_ok;
        
        return (semuaKontrolLentur && semuaKontrolGeser) ? 'aman' : 'tidak aman';
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

    // Fungsi untuk memformat timestamp (sama seperti di pdf.html)
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

    // Fungsi untuk membuat tabel 3 kolom (sama seperti di pdf-balok.js)
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
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Tabel Data Beban Kolom
    // ==============================================
    function createBebanTableKolom() {
        const bebanData = getData('inputData.beban', {});
        
        const rows = [
            { parameter: "<strong>Beban Aksial dan Momen</strong>", hasil: "", satuan: "" },
            { parameter: "$P_u$ (Beban aksial tekan)", hasil: formatNumber(bebanData.Pu), satuan: "kN" },
            { parameter: "$M_u$ (Momen lentur)", hasil: formatNumber(bebanData.Mu), satuan: "kNm" },
            { parameter: "$V_u$ (Gaya geser)", hasil: formatNumber(bebanData.Vu), satuan: "kN" }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Tabel Data Tulangan Kolom
    // ==============================================
    function createTulanganTableKolom() {
        let tulanganRows = [];
        const mode = getData('mode', 'N/A');
        
        // Data tulangan dari hasil perhitungan
        const tulanganResult = getData('rekap.tulangan', {});
        
        // Data dasar
        tulanganRows.push(
            { parameter: "<strong>Data Tulangan Utama</strong>", hasil: "", satuan: "" },
            { parameter: "$D$ (Diameter tulangan utama)", hasil: tulanganResult.D || 'N/A', satuan: "mm" },
            { parameter: "$\\phi$ (Diameter sengkang/begel)", hasil: tulanganResult.phi || 'N/A', satuan: "mm" },
            { parameter: "$n_{terpasang}$ (Jumlah tulangan)", hasil: tulanganResult.n_terpakai || 'N/A', satuan: "batang" },
            { parameter: "$A_{st,terpasang}$ (Luas tulangan terpasang)", hasil: formatNumber(tulanganResult.Ast_i), satuan: "mm²" }
        );
        
        // Untuk mode evaluasi: tampilkan data input tambahan
        if (mode === 'evaluasi') {
            const inputTulangan = getData('inputData.tulangan', {});
            
            if (inputTulangan.n_tul) {
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;$n_{input}$ (Jumlah tulangan input)", 
                    hasil: inputTulangan.n_tul, 
                    satuan: "batang" 
                });
            }
            
            if (inputTulangan.s_tul) {
                tulanganRows.push({ 
                    parameter: "&nbsp;&nbsp;$s_{input}$ (Jarak sengkang input)", 
                    hasil: inputTulangan.s_tul, 
                    satuan: "mm" 
                });
            }
        }
        
        // Untuk mode desain: tampilkan s dari hasil perhitungan begel
        if (mode === 'desain') {
            const begelResult = getData('rekap.begel', {});
            tulanganRows.push({ 
                parameter: "&nbsp;&nbsp;$s_{hasil}$ (Jarak sengkang hasil)", 
                hasil: formatNumber(begelResult.s, 0), 
                satuan: "mm" 
            });
        }
        
        return createThreeColumnTable(tulanganRows, false, true);
    }
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Tabel Parameter Dimensi
    // ==============================================
    function createParameterDimensiTable() {
        const dimensiData = getData('data.Dimensi', {});
        const tulanganResult = getData('rekap.tulangan', {});
        
        const rows = [
            { parameter: "$\\phi_1$ (Faktor reduksi lentur)", hasil: dimensiData.phi1 || 'N/A', satuan: "-" },
            { parameter: "$\\phi_2$ (Faktor reduksi geser)", hasil: dimensiData.phi2 || 'N/A', satuan: "-" },
            { parameter: "$S_n$ (Spasi minimum antar tulangan)", hasil: formatNumber(dimensiData.Sn), satuan: "mm" },
            { parameter: "$d_{s1}$ (Jarak tulangan ke sisi terdekat)", hasil: formatNumber(dimensiData.ds1), satuan: "mm" },
            { parameter: "$d_{s2}$ (Spasi bersih antar tulangan)", hasil: formatNumber(dimensiData.ds2), satuan: "mm" },
            { parameter: "$d_s$ (Titik berat tulangan tarik)", hasil: formatNumber(dimensiData.ds), satuan: "mm" },
            { parameter: "$d$ (Tinggi efektif penampang)", hasil: formatNumber(dimensiData.d), satuan: "mm" },
            { parameter: "$\\beta_1$ (Faktor tinggi blok tekan)", hasil: formatNumber(tulanganResult.beta1 || dimensiData.beta1), satuan: "-" },
            { parameter: "$m$ (Jumlah maksimum tulangan per baris)", hasil: dimensiData.m || 'N/A', satuan: "-" }
        ];
        
        return createThreeColumnTable(rows);
    }
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Tabel Perhitungan Kondisi
    // ==============================================
    function createKondisiTable() {
        const tulanganResult = getData('rekap.tulangan', {});
        const kondisiAktif = tulanganResult.kondisiAktif || 'N/A';
        const semuaKondisi = tulanganResult.semuaKondisi || {};
        
        let rows = [
            { parameter: "<strong>Parameter Kondisi Lentur-Aksial</strong>", hasil: "", satuan: "" },
            { parameter: "$a_b$ (Tinggi blok tekan balanced)", hasil: formatNumber(tulanganResult.ab), satuan: "mm" },
            { parameter: "$a_c$ (Tinggi blok tekan beban aksial)", hasil: formatNumber(tulanganResult.ac), satuan: "mm" },
            { parameter: "$a_{b1}$", hasil: formatNumber(tulanganResult.ab1), satuan: "mm" },
            { parameter: "$a_{b2}$", hasil: formatNumber(tulanganResult.ab2), satuan: "mm" },
            { parameter: "$a_{t1}$", hasil: formatNumber(tulanganResult.at1), satuan: "mm" },
            { parameter: "$a_{t2}$", hasil: formatNumber(tulanganResult.at2), satuan: "mm" },
            { parameter: "$e$ (Eksentrisitas)", hasil: formatNumber(tulanganResult.e), satuan: "mm" }
        ];
        
        // Tambahkan kondisi aktif
        rows.push({ 
            parameter: "<strong>Kondisi Aktif</strong>", 
            isFullRow: true, 
            hasil: "", 
            satuan: "" 
        });
        
        rows.push({ 
            parameter: kondisiAktif, 
            isStatus: true, 
            statusHtml: `<span class="status-aman">TERPENUHI</span>` 
        });
        
        // Tampilkan data kondisi spesifik jika tersedia
        if (tulanganResult.a_cubic && tulanganResult.a_cubic !== 'N/A') {
            rows.push({ 
                parameter: "$a_{cubic}$ (Solusi persamaan kubik)", 
                hasil: formatNumber(tulanganResult.a_cubic), 
                satuan: "mm" 
            });
        }
        
        if (tulanganResult.a_flexure && tulanganResult.a_flexure !== 'N/A') {
            rows.push({ 
                parameter: "$a_{flexure}$ (Tinggi blok tekan lentur murni)", 
                hasil: formatNumber(tulanganResult.a_flexure), 
                satuan: "mm" 
            });
        }
        
        return createThreeColumnTable(rows, true);
    }
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Tabel Perhitungan Tulangan Utama
    // ==============================================
    function createTulanganUtamaTable() {
        const tulanganResult = getData('rekap.tulangan', {});
        const kontrolLentur = getData('kontrol.lentur', {});
        const faktorPhi = tulanganResult.faktorPhi || 0.65;
        
        let rows = [
            { parameter: "<strong>Perhitungan Kebutuhan Tulangan</strong>", hasil: "", satuan: "" },
            { parameter: "$\\phi$ (Faktor reduksi aktual)", hasil: formatNumber(faktorPhi, 3), satuan: "-" },
            { parameter: "$A_1$ (Luas tulangan tarik)", hasil: formatNumber(tulanganResult.A1), satuan: "mm²" },
            { parameter: "$A_2$ (Luas tulangan tekan)", hasil: formatNumber(tulanganResult.A2), satuan: "mm²" },
            { parameter: "$A_{s,tu}$ (Luas tulangan total perlu)", hasil: formatNumber(tulanganResult.As_tu), satuan: "mm²" },
            { parameter: "$A_{st,u}$ (Luas tulangan perlu terkoreksi)", hasil: formatNumber(tulanganResult.Ast_u), satuan: "mm²" },
            { 
                parameter: "$A_{st,terpasang} \\ge A_{st,u}$", 
                isComparison: true, 
                statusHtml: `<span class="${kontrolLentur.Ast_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.Ast_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            }
        ];
        
        // TAMBAHAN: Untuk kondisi at2>ac, tampilkan perhitungan K
        if (tulanganResult.kondisi === 'at2 > ac') {
            rows.push({ 
                parameter: "$K$ (Parameter momen ternormalisasi)", 
                hasil: formatNumber(tulanganResult.K, 4), 
                satuan: "MPa" 
            });
            
            rows.push({ 
                parameter: "$K_{maks}$", 
                hasil: formatNumber(tulanganResult.Kmaks, 4), 
                satuan: "MPa" 
            });
            
            rows.push({ 
                parameter: "$K \\le K_{maks}$", 
                isComparison: true, 
                statusHtml: `<span class="${kontrolLentur.K_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.K_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            });
        }
        
        rows.push({ 
            parameter: "<strong>Konfigurasi Tulangan</strong>", 
            isFullRow: true, 
            hasil: "", 
            satuan: "" 
        });
        
        rows.push({ 
            parameter: "$A_{st,satu}$ (Luas satu tulangan)", 
            hasil: formatNumber(tulanganResult.Ast_satu), 
            satuan: "mm²" 
        });
        
        rows.push({ 
            parameter: "$n_{perlu}$ (Jumlah tulangan perlu)", 
            hasil: tulanganResult.n_calculated || 'N/A', 
            satuan: "batang" 
        });
        
        rows.push({ 
            parameter: "$n_{maks}$ (Jumlah maksimum tulangan)", 
            hasil: tulanganResult.n_max || 'N/A', 
            satuan: "batang" 
        });
        
        rows.push({ 
            parameter: "$n_{terpasang} \\le n_{maks}$", 
            isComparison: true, 
            statusHtml: `<span class="${kontrolLentur.n_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.n_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
        });
        
        rows.push({ 
            parameter: "$\\rho$ (Rasio tulangan)", 
            hasil: formatNumber(tulanganResult.rho, 4), 
            satuan: "%" 
        });
        
        rows.push({ 
            parameter: "$\\rho \\ge 1.0\\%$", 
            isComparison: true, 
            statusHtml: `<span class="${kontrolLentur.rho_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.rho_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
        });
        
        rows.push({ 
            parameter: `<strong>Digunakan Tulangan ${tulanganResult.n_terpakai || 'N/A'}D${tulanganResult.D || 'N/A'}</strong>`, 
            isFullRow: true, 
            hasil: "", 
            satuan: "" 
        });
        
        return createThreeColumnTable(rows, true);
    }
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Tabel Perhitungan Begel
    // ==============================================
    function createBegelTable() {
        const begelResult = getData('rekap.begel', {});
        const kontrolGeser = getData('kontrol.geser', {});
        const dimensi = getData('inputData.dimensi', {});
        const material = getData('inputData.material', {});
        
        const b = parseFloat(dimensi.b) || 300;
        const h = parseFloat(dimensi.h) || 400;
        const Ag = b * h;
        const fc = parseFloat(material.fc) || 20;
        const fyt = parseFloat(material.fyt) || 300;
        
        let rows = [
            { parameter: "<strong>Perhitungan Kapasitas Geser</strong>", hasil: "", satuan: "" },
            { parameter: "$A_g = b \\times h$", hasil: formatNumber(Ag, 0), satuan: "mm²" },
            { parameter: "$V_{c,\\phi}$ (Kontribusi beton)", hasil: formatNumber(begelResult.Vc_phi, 2), satuan: "kN" },
            { parameter: "$V_s$ (Kebutuhan tulangan geser)", hasil: formatNumber(begelResult.Vs, 2), satuan: "kN" },
            { parameter: "$V_{s,max}$ (Kapasitas geser maksimum)", hasil: formatNumber(begelResult.Vs_max, 2), satuan: "kN" },
            { 
                parameter: "$V_s \\le V_{s,max}$", 
                isComparison: true, 
                statusHtml: `<span class="${kontrolGeser.Vs_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Vs_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            }
        ];
        
        // Jika ada warning
        if (begelResult.warning && begelResult.warning !== 'AMAN') {
            rows.push({ 
                parameter: "<strong>Peringatan</strong>", 
                isFullRow: true, 
                hasil: "", 
                satuan: "" 
            });
            
            rows.push({ 
                parameter: begelResult.warning, 
                isStatus: true, 
                statusHtml: `<span class="status-tidak-aman">PERHATIAN</span>` 
            });
        }
        
        rows.push({ 
            parameter: "<strong>Perhitungan Luas Sengkang Perlu</strong>", 
            isFullRow: true, 
            hasil: "", 
            satuan: "" 
        });
        
        rows.push({ 
            parameter: "$A_{v,u1} = 0.062 \\sqrt{f'_c} \\dfrac{b \\cdot s}{f_{yt}}$", 
            hasil: formatNumber(begelResult.Avu1, 2), 
            satuan: "mm²/m" 
        });
        
        rows.push({ 
            parameter: "$A_{v,u2} = 0.35 \\dfrac{b \\cdot s}{f_{yt}}$", 
            hasil: formatNumber(begelResult.Avu2, 2), 
            satuan: "mm²/m" 
        });
        
        rows.push({ 
            parameter: "$A_{v,u3} = \\dfrac{V_s \\cdot s}{f_{yt} \\cdot d}$", 
            hasil: formatNumber(begelResult.Avu3, 2), 
            satuan: "mm²/m" 
        });
        
        rows.push({ 
            parameter: "$A_{v,u} = \\max(A_{v,u1}, A_{v,u2}, A_{v,u3})$", 
            hasil: formatNumber(begelResult.Av_u, 2), 
            satuan: "mm²/m" 
        });
        
        rows.push({ 
            parameter: "$A_{v,terpasang}$ (Luas sengkang terpasang)", 
            hasil: formatNumber(begelResult.Av_terpakai, 2), 
            satuan: "mm²/m" 
        });
        
        rows.push({ 
            parameter: "$A_{v,terpasang} \\ge A_{v,u}$", 
            isComparison: true, 
            statusHtml: `<span class="${kontrolGeser.Av_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Av_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
        });
        
        rows.push({ 
            parameter: "$s$ (Jarak sengkang)", 
            hasil: formatNumber(begelResult.s, 0), 
            satuan: "mm" 
        });
        
        const tulanganResult = getData('rekap.tulangan', {});
        const diameterSengkang = tulanganResult.phi || 'N/A';
        
        rows.push({ 
            parameter: `<strong>Digunakan Sengkang ɸ${diameterSengkang}-${formatNumber(begelResult.s, 0)}</strong>`, 
            isFullRow: true, 
            hasil: "", 
            satuan: "" 
        });
        
        return createThreeColumnTable(rows, true);
    }
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Tabel Rekapitulasi Kolom
    // ==============================================
    function createRekapitulasiTableKolom() {
        const tulanganResult = getData('rekap.tulangan', {});
        const begelResult = getData('rekap.begel', {});
        const formatted = getData('rekap.formatted', {});
        
        let html = '<table class="rekap-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th class="rekap-col-tulangan" style="width: 40%">Parameter</th>';
        html += '<th class="rekap-col-tumpuan" style="width: 60%">Hasil Desain</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        html += '<tr class="row-merged">';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Dimensi Kolom</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + 
                `${getData('inputData.dimensi.b', 'N/A')} × ${getData('inputData.dimensi.h', 'N/A')} mm` + 
                '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Utama</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + 
                (formatted.tulangan_utama || `${tulanganResult.n_terpakai || 'N/A'}D${tulanganResult.D || 'N/A'}`) + 
                '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Sengkang/Begel</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + 
                (formatted.begel || `ɸ${tulanganResult.phi || 'N/A'}-${formatNumber(begelResult.s, 0)}`) + 
                '</td>';
        html += '</tr>';
        
        html += '<tr class="row-merged">';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Luas Tulangan (A<sub>st</sub>)</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + 
                `${formatNumber(tulanganResult.Ast_i, 0)} mm²` + 
                '</td>';
        html += '</tr>';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Rasio Tulangan (ρ)</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + 
                `${formatNumber(tulanganResult.rho, 3)} %` + 
                '</td>';
        html += '</tr>';
        
        // TAMBAHAN: Tampilkan informasi P_u vs P_u∅
        if (formatted.Pu_vs_Pu_phi) {
            html += '<tr class="row-merged">';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">P<sub>u</sub> vs P<sub>u</sub>∅</td>';
            html += '<td class="rekap-col-tumpuan text-center">' + 
                    formatted.Pu_vs_Pu_phi + 
                    '</td>';
            html += '</tr>';
        }
        
        // TAMBAHAN: Tampilkan informasi K vs K_maks untuk kondisi at2>ac
        if (formatted.K) {
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kontrol K</td>';
            html += '<td class="rekap-col-tumpuan text-center">' + 
                    formatted.K + 
                    '</td>';
            html += '</tr>';
        }
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Eksentrisitas (e)</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + 
                formatted.e || `${formatNumber(tulanganResult.e, 2)} mm` + 
                '</td>';
        html += '</tr>';
        
        html += '</tbody>';
        html += '</table>';
        return html;
    }
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Ringkasan Kontrol Keamanan
    // ==============================================
    function createKontrolTableKolom() {
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolGeser = getData('kontrol.geser', {});
        
        const rows = [
            { 
                parameter: "$A_{st,terpasang} \\ge A_{st,u}$ (Kapasitas tulangan)", 
                statusHtml: `<span class="${kontrolLentur.Ast_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.Ast_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$\\rho \\ge 1.0\\%$ (Rasio tulangan minimum)", 
                statusHtml: `<span class="${kontrolLentur.rho_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.rho_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$n \\le n_{maks}$ (Jumlah tulangan)", 
                statusHtml: `<span class="${kontrolLentur.n_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.n_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            // TAMBAHAN: Kontrol K untuk kondisi at2>ac
            { 
                parameter: "$K \\le K_{maks}$ (Kontrol momen ternormalisasi)", 
                statusHtml: `<span class="${kontrolLentur.K_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.K_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$V_s \\le V_{s,max}$ (Kapasitas geser)", 
                statusHtml: `<span class="${kontrolGeser.Vs_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Vs_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            },
            { 
                parameter: "$A_{v,terpasang} \\ge A_{v,u}$ (Luas sengkang)", 
                statusHtml: `<span class="${kontrolGeser.Av_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Av_ok ? 'AMAN' : 'TIDAK AMAN'}</span>`
            }
        ];
        
        return createTwoColumnTable(rows);
    }
    
    // ==============================================
    // FUNGSI KHUSUS KOLOM: Kesimpulan Dinamis Kolom
    // ==============================================
    function generateDynamicConclusionKolom() {
        // Hitung status kolom secara dinamis
        const statusKolom = cekStatusKolom();
        
        const dimensi = getData('inputData.dimensi', {});
        const material = getData('inputData.material', {});
        const beban = getData('inputData.beban', {});
        const tulanganResult = getData('rekap.tulangan', {});
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolGeser = getData('kontrol.geser', {});
        
        // Analisis status per komponen
        let masalah = [];
        let rekomendasi = [];
        
        // Analisis Lentur-Aksial
        if (kontrolLentur) {
            const lenturProblems = [];
            
            if (!kontrolLentur.Ast_ok) {
                lenturProblems.push("Luas tulangan tidak mencukupi untuk menahan beban lentur-aksial");
            }
            if (!kontrolLentur.rho_ok) {
                lenturProblems.push("Rasio tulangan kurang dari 1% (minimum SNI)");
            }
            if (!kontrolLentur.n_ok) {
                lenturProblems.push("Jumlah tulangan melebihi kapasitas penampang");
            }
            // TAMBAHAN: Kontrol K
            if (!kontrolLentur.K_ok) {
                lenturProblems.push("Parameter momen ternormalisasi (K) melebihi batas maksimum");
            }
            
            if (lenturProblems.length > 0) {
                masalah.push(`<strong>Masalah pada tulangan lentur-aksial (${lenturProblems.length} masalah):</strong>`);
                masalah.push(...lenturProblems.map(p => `<span class="problem-item">• ${p}</span>`));
                rekomendasi.push("Perlu penambahan atau perubahan tulangan utama");
                rekomendasi.push("Pertimbangkan untuk menambah jumlah atau diameter tulangan");
            }
        }
        
        // Analisis Geser
        if (kontrolGeser) {
            const geserProblems = [];
            
            if (!kontrolGeser.Vs_ok) {
                geserProblems.push("Kapasitas geser tidak mencukupi, perlu perbesaran dimensi kolom");
            }
            if (!kontrolGeser.Av_ok) {
                geserProblems.push("Luas sengkang tidak memadai");
            }
            
            if (geserProblems.length > 0) {
                masalah.push(`<strong>Masalah pada tulangan geser (${geserProblems.length} masalah):</strong>`);
                masalah.push(...geserProblems.map(p => `<span class="problem-item">• ${p}</span>`));
                rekomendasi.push("Perlu penambahan atau pengurangan jarak sengkang");
                rekomendasi.push("Pertimbangkan untuk menambah diameter sengkang atau jumlah kaki");
            }
        }
        
        // Buat HTML kesimpulan dinamis
        let conclusionHTML = `
            <div class="section-group">
                <h3>3. Kesimpulan</h3>
                <div class="conclusion-box">
                    <h4 style="text-align: center; ${statusKolom === 'aman' ? 'color: #155724;' : 'color: #721c24;'} margin-bottom: 8px;">
                        <strong>STRUKTUR KOLOM BETON BERTULANG ${statusKolom === 'aman' ? 'AMAN' : 'TIDAK AMAN'}</strong>
                    </h4>
        `;
        
        // Ringkasan status
        if (statusKolom === 'aman') {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p>
                <p>Struktur kolom dengan dimensi ${dimensi.b || 'N/A'} × ${dimensi.h || 'N/A'} mm memenuhi semua persyaratan SNI 2847:2019 untuk:</p>
                <ul>
                    <li>Kuat lentur dan aksial (P<sub>u</sub> = ${beban.Pu || 'N/A'} kN, M<sub>u</sub> = ${beban.Mu || 'N/A'} kNm)</li>
                    <li>Kuat geser (V<sub>u</sub> = ${beban.Vu || 'N/A'} kN)</li>
                    <li>Persyaratan rasio tulangan minimum (ρ ≥ 1%)</li>
                    <li>Persyaratan detail tulangan dan sengkang</li>
                </ul>
            `;
            
            // Rekomendasi untuk kondisi aman
            rekomendasi = [
                "Gunakan tulangan " + (tulanganResult.n_terpakai || 'N/A') + "D" + (tulanganResult.D || 'N/A') + " untuk tulangan utama",
                "Gunakan sengkang ɸ" + (tulanganResult.phi || 'N/A') + " dengan jarak " + formatNumber(getData('rekap.begel.s', 'N/A'), 0) + " mm",
                "Pastikan mutu beton mencapai f'c = " + (material.fc || 'N/A') + " MPa",
                "Pastikan mutu baja mencapai fy = " + (material.fy || 'N/A') + " MPa",
                "Pastikan tulangan didistribusi merata di semua sisi kolom",
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
                rekomendasi.push("Tinjau kembali dimensi kolom: " + (dimensi.b || 'N/A') + " × " + (dimensi.h || 'N/A') + " mm");
                rekomendasi.push("Evaluasi ulang mutu material yang digunakan");
                rekomendasi.push("Pertimbangkan untuk menggunakan tulangan dengan diameter lebih besar");
                rekomendasi.push("Periksa kembali konfigurasi sengkang");
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
                Kolom merupakan elemen struktur tekan utama, pastikan pelaksanaan sesuai dengan spesifikasi teknis dan dilakukan pengawasan yang ketat.
            </p>
        `;
        
        conclusionHTML += `
                </div>
            </div>
        `;
        
        return conclusionHTML;
    }
    
    // ==============================================
    // FUNGSI UTAMA: Generate Content Blocks untuk Kolom
    // ==============================================
    function generateContentBlocks() {
        const blocks = [];
        
        // Gunakan status kolom yang dihitung secara dinamis
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
        
        const materialDimensiRows = [
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: getData('inputData.material.fc'), satuan: 'MPa' },
            { parameter: "$f_y$ (Tegangan leleh tulangan lentur)", hasil: getData('inputData.material.fy'), satuan: 'MPa' },
            { parameter: "$f_{yt}$ (Tegangan leleh tulangan geser)", hasil: getData('inputData.material.fyt', getData('inputData.material.fy')), satuan: 'MPa' },
            { parameter: "$h$ (Tinggi kolom)", hasil: getData('inputData.dimensi.h'), satuan: 'mm' },
            { parameter: "$b$ (Lebar kolom)", hasil: getData('inputData.dimensi.b'), satuan: 'mm' },
            { parameter: "$S_b$ (Selimut beton)", hasil: getData('inputData.dimensi.sb', 40), satuan: 'mm' },
            { parameter: "$\\lambda$ (Faktor agregat ringan)", hasil: getData('inputData.lanjutan.lambda', 1), satuan: '-' },
            { parameter: "$n_{kaki}$ (Jumlah kaki sengkang)", hasil: getData('inputData.lanjutan.n_kaki', 2), satuan: '-' }
        ];
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Data Material dan Dimensi</h3>
                ${createThreeColumnTable(materialDimensiRows, false, true)}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Data Beban Kolom</h3>
                ${createBebanTableKolom()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>3. Data Tulangan</h3>
                ${createTulanganTableKolom()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>4. Perhitungan Parameter Dimensi</h3>
                ${createParameterDimensiTable()}
            </div>
        `);
        
        const headerB = `
            <div class="header-content-group">
                <h2>B. ANALISIS KONDISI LENTUR-AKSIAL</h2>
                <p class="note">Analisis interaksi lentur dan aksial pada kolom beton bertulang</p>
            </div>
        `;
        
        blocks.push(headerB);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Parameter Kondisi</h3>
                ${createKondisiTable()}
            </div>
        `);
        
        const headerC = `
            <div class="header-content-group">
                <h2>C. PERHITUNGAN TULANGAN UTAMA</h2>
                <p class="note">Perhitungan kebutuhan tulangan longitudinal untuk menahan beban lentur dan aksial</p>
            </div>
        `;
        
        blocks.push(headerC);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Kebutuhan Tulangan Lentur-Aksial</h3>
                ${createTulanganUtamaTable()}
            </div>
        `);
        
        const headerD = `
            <div class="header-content-group keep-together">
                <h2>D. PERHITUNGAN TULANGAN GESER (SENGKANG)</h2>
                <p class="note">Perhitungan kebutuhan sengkang/begel untuk menahan gaya geser</p>
            </div>
        `;
        
        const contentD = `
            <div class="section-group">
                <h3>1. Kebutuhan Tulangan Geser</h3>
                ${createBegelTable()}
            </div>
        `;
        
        blocks.push(headerD + contentD);
        
        const headerE = `
            <div class="header-content-group">
                <h2>E. REKAPITULASI HASIL DESAIN</h2>
            </div>
        `;
        
        const contentE1 = `
            <div class="section-group">
                <h3>1. Spesifikasi Tulangan Terpasang</h3>
                ${createRekapitulasiTableKolom()}
            </div>
        `;
        
        blocks.push(headerE + contentE1);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Ringkasan Kontrol Keamanan</h3>
                ${createKontrolTableKolom()}
            </div>
        `);
        
        // Gunakan fungsi kesimpulan khusus kolom
        blocks.push(generateDynamicConclusionKolom());
        
        // Referensi
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
[file content end]