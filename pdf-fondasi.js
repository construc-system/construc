(function() {
    let resultData;

    function setData(data) {
        resultData = data;
    }

    // ==============================================
    // FUNGSI BARU: Cek Status Fondasi Dinamis
    // ==============================================
    function cekStatusFondasi() {
        const kontrol = getData('kontrol', {});
        
        let semuaAman = true;
        
        // Cek semua kontrol
        if (kontrol) {
            const kriteria = [
                kontrol.sigmaMinAman,
                kontrol.dayaDukung?.aman,
                kontrol.geser?.aman1,
                kontrol.geser?.aman2,
                kontrol.tulangan?.aman,
                kontrol.kuatDukung?.aman,
                kontrol.tulanganTambahan?.aman
            ];
            
            // Tambahkan kontrol evaluasi tulangan jika mode evaluasi
            if (getData('mode') === 'evaluasi' && kontrol.evaluasiTulangan) {
                kriteria.push(kontrol.evaluasiTulangan.aman);
            }
            
            semuaAman = kriteria.every(k => k === true);
        }
        
        return semuaAman ? 'aman' : 'tidak aman';
    }

    // Fungsi helper untuk mengambil data dengan fallback
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

    // Fungsi untuk memformat timestamp
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

    // ==============================================
    // FUNGSI KHUSUS FONDASI
    // ==============================================

    // Fungsi untuk membuat tabel data input fondasi
    function createFondasiInputTable() {
        const fondasi = getData('inputData.fondasi', {});
        const dimensi = fondasi.dimensi || {};
        const tanah = getData('inputData.tanah', {});
        const beban = getData('inputData.beban', {});
        const material = getData('inputData.material', {});
        const tulangan = getData('inputData.tulangan', {});
        const lanjutan = getData('inputData.lanjutan', {});
        
        const modeTanah = tanah.mode || 'auto';
        
        const rows = [
            { parameter: "<strong>Dimensi Fondasi</strong>", hasil: "", satuan: "" },
            { parameter: "$l_x$ (Panjang fondasi)", hasil: formatNumber(dimensi.lx, 3), satuan: "m" },
            { parameter: "$l_y$ (Lebar fondasi)", hasil: formatNumber(dimensi.ly, 3), satuan: "m" },
            { parameter: "$b_x$ (Lebar kolom arah x)", hasil: formatNumber(dimensi.bx), satuan: "mm" },
            { parameter: "$b_y$ (Lebar kolom arah y)", hasil: formatNumber(dimensi.by), satuan: "mm" },
            { parameter: "$h$ (Tinggi fondasi)", hasil: formatNumber(dimensi.h, 3), satuan: "m" },
            { parameter: "$\\alpha_s$ (Parameter geser pons)", hasil: formatNumber(dimensi.alpha_s), satuan: "-" },
            
            { parameter: "<strong>Beban</strong>", hasil: "", satuan: "" },
            { parameter: "$P_u$ (Beban aksial)", hasil: formatNumber(beban.pu, 2), satuan: "kN" },
            { parameter: "$M_{ux}$ (Momen arah x)", hasil: formatNumber(beban.mux, 2), satuan: "kNm" },
            { parameter: "$M_{uy}$ (Momen arah y)", hasil: formatNumber(beban.muy, 2), satuan: "kNm" },
            
            { parameter: "<strong>Material</strong>", hasil: "", satuan: "" },
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: formatNumber(material.fc), satuan: "MPa" },
            { parameter: "$f_y$ (Tegangan leleh baja)", hasil: formatNumber(material.fy), satuan: "MPa" },
            { parameter: "$\\gamma_c$ (Berat jenis beton)", hasil: formatNumber(material.gammaC, 1), satuan: "kN/m³" },
            
            { parameter: "<strong>Tulangan</strong>", hasil: "", satuan: "" },
            { parameter: "$D$ (Diameter tulangan utama)", hasil: formatNumber(tulangan.d), satuan: "mm" },
            { parameter: "$D_b$ (Diameter tulangan bagi)", hasil: formatNumber(tulangan.db), satuan: "mm" }
        ];
        
        // Tambahkan data tanah berdasarkan mode
        if (modeTanah === 'manual') {
            const tanahManual = tanah.manual || {};
            rows.push({ parameter: "<strong>Tanah (Mode Manual)</strong>", hasil: "", satuan: "" });
            rows.push({ parameter: "$q_a$ (Daya dukung ijin)", hasil: formatNumber(tanahManual.qa), satuan: "kPa" });
            rows.push({ parameter: "$D_f$ (Kedalaman fondasi)", hasil: formatNumber(tanahManual.df, 2), satuan: "m" });
            rows.push({ parameter: "$\\gamma$ (Berat jenis tanah)", hasil: formatNumber(tanahManual.gamma, 1), satuan: "kN/m³" });
        } else {
            const tanahAuto = tanah.auto || {};
            rows.push({ parameter: "<strong>Tanah (Mode Otomatis)</strong>", hasil: "", satuan: "" });
            rows.push({ parameter: "$\\phi$ (Sudut geser dalam)", hasil: formatNumber(tanahAuto.phi), satuan: "°" });
            rows.push({ parameter: "$c$ (Kohesi)", hasil: formatNumber(tanahAuto.c), satuan: "kPa" });
            rows.push({ parameter: "$q_c$ (Tahanan konus)", hasil: formatNumber(tanahAuto.qc), satuan: "MPa" });
            rows.push({ parameter: "$D_f$ (Kedalaman fondasi)", hasil: formatNumber(tanahAuto.df, 2), satuan: "m" });
            rows.push({ parameter: "$\\gamma$ (Berat jenis tanah)", hasil: formatNumber(tanahAuto.gamma, 1), satuan: "kN/m³" });
        }
        
        // Tambahkan parameter lanjutan jika ada
        if (lanjutan.lambda) {
            rows.push({ parameter: "<strong>Parameter Lanjutan</strong>", hasil: "", satuan: "" });
            rows.push({ parameter: "$\\lambda$ (Faktor reduksi untuk beton ringan)", hasil: formatNumber(lanjutan.lambda), satuan: "-" });
        }
        
        return createThreeColumnTable(rows, false, true);
    }

    // Fungsi untuk membuat tabel parameter perhitungan
    function createParameterTable() {
        const parameter = getData('data.parameter', {});
        
        const rows = [
            { parameter: "$d_s = \\lceil s_{beton} + D/2 \\rceil_{5}$", hasil: formatNumber(parameter.ds), satuan: "mm" },
            { parameter: "$d = h - d_s$", hasil: formatNumber(parameter.d), satuan: "mm" },
            { parameter: "$a = l_y/2 - b_y/2 - d$", hasil: formatNumber(parameter.a, 3), satuan: "m" },
            { parameter: "$q = \\gamma_c \\times h + \\gamma \\times (D_f - h)$", hasil: formatNumber(parameter.q, 2), satuan: "kPa" },
            { parameter: "$A = l_x \\times l_y$", hasil: formatNumber(parameter.area, 4), satuan: "m²" },
            { parameter: "$W_x = (l_x \\times l_y^2)/6$", hasil: formatNumber(parameter.Wx, 4), satuan: "m³" },
            { parameter: "$W_y = (l_y \\times l_x^2)/6$", hasil: formatNumber(parameter.Wy, 4), satuan: "m³" },
            { parameter: "$\\sigma_{avg} = P_u/A$", hasil: formatNumber(parameter.sigma_avg, 2), satuan: "kPa" },
            { parameter: "$\\sigma_{mux} = M_{ux}/W_x$", hasil: formatNumber(parameter.sigma_mux, 2), satuan: "kPa" },
            { parameter: "$\\sigma_{muy} = M_{uy}/W_y$", hasil: formatNumber(parameter.sigma_muy, 2), satuan: "kPa" },
            { parameter: "$\\sigma_{min} = \\sigma_{avg} - \\sigma_{mux} - \\sigma_{muy} + q$", hasil: formatNumber(parameter.sigma_min, 2), satuan: "kPa" },
            { parameter: "$\\sigma_{max} = \\sigma_{avg} + \\sigma_{mux} + \\sigma_{muy} + q$", hasil: formatNumber(parameter.sigma_max, 2), satuan: "kPa" },
            { 
                parameter: "$\\sigma_{min} > 0$", 
                isStatus: true, 
                statusHtml: `<span class="${parameter.sigma_status === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${parameter.sigma_status || 'N/A'}</span>` 
            },
            { parameter: "$\\beta_1$", hasil: formatNumber(parameter.beta1, 3), satuan: "-" },
            { parameter: "$K_{max}$", hasil: formatNumber(parameter.Kmax, 3), satuan: "MPa" }
        ];
        
        return createThreeColumnTable(rows, true);
    }

    // Fungsi untuk membuat tabel daya dukung tanah
    function createDayaDukungTable() {
        const dayaDukung = getData('data.dayaDukung', {});
        const modeTanah = getData('inputData.tanah.mode', 'auto');
        
        if (modeTanah === 'manual') {
            const rows = [
                { parameter: "Metode", hasil: "Manual (qa langsung)", satuan: "-" },
                { parameter: "$q_a$ (Input manual)", hasil: formatNumber(dayaDukung.qa, 2), satuan: "kPa" },
                { parameter: "$\\sigma_{max}$ (Tegangan maksimum)", hasil: formatNumber(dayaDukung.sigma_max, 2), satuan: "kPa" },
                { 
                    parameter: "$q_a \\geq \\sigma_{max}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${dayaDukung.status === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${dayaDukung.status || 'N/A'}</span>` 
                }
            ];
            return createThreeColumnTable(rows, true);
        } else {
            const rows = [
                { parameter: "Metode", hasil: dayaDukung.method || 'N/A', satuan: "-" },
                { parameter: "$\\phi_{rad} = \\phi \\times \\pi / 180$", hasil: formatNumber(dayaDukung.phi_rad, 4), satuan: "rad" },
                { parameter: "$a = e^{(3\\pi/4 - \\phi/2) \\tan \\phi}$", hasil: formatNumber(dayaDukung.a, 4), satuan: "-" },
                { parameter: "$K_{p\\gamma}$", hasil: formatNumber(dayaDukung.Kp_gamma, 2), satuan: "-" },
                { parameter: "$N_c$ (Faktor kapasitas dukung kohesi)", hasil: formatNumber(dayaDukung.Nc, 2), satuan: "-" },
                { parameter: "$N_q$ (Faktor kapasitas dukung beban)", hasil: formatNumber(dayaDukung.Nq, 2), satuan: "-" },
                { parameter: "$N_{\\gamma}$ (Faktor kapasitas dukung berat)", hasil: formatNumber(dayaDukung.Ngamma, 2), satuan: "-" },
                { parameter: "$q_u$ (Kapasitas dukung ultimit)", hasil: formatNumber(dayaDukung.qu_terzaghi, 2), satuan: "kPa" },
                { parameter: "$q_a$ (Kapasitas dukung ijin)", hasil: formatNumber(dayaDukung.qa, 2), satuan: "kPa" },
                { parameter: "$\\sigma_{max}$ (Tegangan maksimum)", hasil: formatNumber(dayaDukung.sigma_max, 2), satuan: "kPa" },
                { 
                    parameter: "$q_a \\geq \\sigma_{max}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${dayaDukung.status === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${dayaDukung.status || 'N/A'}</span>` 
                }
            ];
            return createThreeColumnTable(rows, true);
        }
    }

    // Fungsi untuk membuat tabel kontrol geser
    function createKontrolGeserTable() {
        const kontrolGeser = getData('data.kontrolGeser', {});
        const fondasiMode = getData('data.actualFondasiMode', 'tunggal');
        
        let rows = [];
        
        if (fondasiMode === 'menerus') {
            rows = [
                { parameter: "<strong>Geser Satu Arah</strong>", hasil: "", satuan: "" },
                { parameter: "$V_{u1} = a \\times l_y \\times \\sigma_{max}$", hasil: formatNumber(kontrolGeser.Vu1, 2), satuan: "kN" },
                { parameter: "$V_{c1} = \\phi \\times 0.17 \\times \\lambda \\sqrt{f'_c} \\times b_y \\times d$", hasil: formatNumber(kontrolGeser.Vc1, 2), satuan: "kN" },
                { 
                    parameter: "$V_{u1} \\leq V_{c1}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kontrolGeser.amanGeser1 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.amanGeser1 || 'N/A'}</span>` 
                },
                
                { parameter: "<strong>Geser Dua Arah (Pons)</strong>", hasil: "", satuan: "" },
                { parameter: "$V_{u2} = (l_x - b_x - d) \\times l_y \\times (\\sigma_{max} + \\sigma_{min})/2$", hasil: formatNumber(kontrolGeser.Vu2, 2), satuan: "kN" },
                { parameter: "$V_{c21} = 0.17(1 + 2/\\beta_c)\\lambda\\sqrt{f'_c}b_0d$", hasil: formatNumber(kontrolGeser.Vc21, 2), satuan: "kN" },
                { parameter: "$V_{c22} = 0.083(2 + \\alpha_s d/b_0)\\lambda\\sqrt{f'_c}b_0d$", hasil: formatNumber(kontrolGeser.Vc22, 2), satuan: "kN" },
                { parameter: "$V_{c23} = 0.33\\sqrt{f'_c}b_0d$", hasil: formatNumber(kontrolGeser.Vc23, 2), satuan: "kN" },
                { parameter: "$V_{c2} = \\min(V_{c21}, V_{c22}, V_{c23})$", hasil: formatNumber(kontrolGeser.Vc2, 2), satuan: "kN" },
                { parameter: "$\\phi V_{c2}$", hasil: formatNumber(kontrolGeser.phiVc2, 2), satuan: "kN" },
                { 
                    parameter: "$V_{u2} \\leq \\phi V_{c2}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kontrolGeser.amanGeser2 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.amanGeser2 || 'N/A'}</span>` 
                }
            ];
        } else {
            rows = [
                { parameter: "<strong>Geser Satu Arah</strong>", hasil: "", satuan: "" },
                { parameter: "$V_{u1} = a \\times l_x \\times (\\sigma_{max} + \\sigma_a)/2$", hasil: formatNumber(kontrolGeser.Vu1, 2), satuan: "kN" },
                { parameter: "$V_{c1} = \\phi \\times 0.17 \\times \\lambda \\sqrt{f'_c} \\times l_x \\times d$", hasil: formatNumber(kontrolGeser.Vc1, 2), satuan: "kN" },
                { 
                    parameter: "$V_{u1} \\leq V_{c1}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kontrolGeser.amanGeser1 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.amanGeser1 || 'N/A'}</span>` 
                },
                
                { parameter: "<strong>Geser Dua Arah (Pons)</strong>", hasil: "", satuan: "" },
                { parameter: "$V_{u2} = (l_x l_y - (b_x+d)(b_y+d)) \\times (\\sigma_{max} + \\sigma_{min})/2$", hasil: formatNumber(kontrolGeser.Vu2, 2), satuan: "kN" },
                { parameter: "$V_{c21} = 0.17(1 + 2/\\beta_c)\\lambda\\sqrt{f'_c}b_0d$", hasil: formatNumber(kontrolGeser.Vc21, 2), satuan: "kN" },
                { parameter: "$V_{c22} = 0.083(2 + \\alpha_s d/b_0)\\lambda\\sqrt{f'_c}b_0d$", hasil: formatNumber(kontrolGeser.Vc22, 2), satuan: "kN" },
                { parameter: "$V_{c23} = 0.33\\sqrt{f'_c}b_0d$", hasil: formatNumber(kontrolGeser.Vc23, 2), satuan: "kN" },
                { parameter: "$V_{c2} = \\min(V_{c21}, V_{c22}, V_{c23})$", hasil: formatNumber(kontrolGeser.Vc2, 2), satuan: "kN" },
                { parameter: "$\\phi V_{c2}$", hasil: formatNumber(kontrolGeser.phiVc2, 2), satuan: "kN" },
                { 
                    parameter: "$V_{u2} \\leq \\phi V_{c2}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kontrolGeser.amanGeser2 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.amanGeser2 || 'N/A'}</span>` 
                }
            ];
        }
        
        return createThreeColumnTable(rows, true);
    }

    // Fungsi untuk membuat tabel tulangan berdasarkan jenis fondasi
    function createTulanganTable() {
        const tulangan = getData('data.tulangan', {});
        const jenis = tulangan.jenis || 'bujur_sangkar';
        
        if (jenis === 'bujur_sangkar') {
            const rows = [
                { parameter: "<strong>Tulangan Arah Memanjang</strong>", hasil: "", satuan: "" },
                { parameter: "$\\sigma = \\sigma_{min} + (l_y - x_1)(\\sigma_{max} - \\sigma_{min})/l_y$", hasil: formatNumber(tulangan.sigma, 2), satuan: "kPa" },
                { parameter: "$M_u = 0.5\\sigma x_1^2 + \\frac{1}{3}(\\sigma_{max} - \\sigma)x_1^2$", hasil: formatNumber(tulangan.Mu, 2), satuan: "kNm/m" },
                { parameter: "$K = M_u \\times 10^6 / (\\phi b d^2)$", hasil: formatNumber(tulangan.K, 3), satuan: "MPa" },
                { 
                    parameter: "$K \\leq K_{max}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${tulangan.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.Kontrol_K || 'N/A'}</span>` 
                },
                { parameter: "$a = (1 - \\sqrt{1 - 2K/(0.85f'_c)})d$", hasil: formatNumber(tulangan.a_val, 2), satuan: "mm" },
                { parameter: "$A_{s1} = 0.85f'_c a b / f_y$", hasil: formatNumber(tulangan.As1, 2), satuan: "mm²/m" },
                { parameter: "$A_{s2} = (\\sqrt{f'_c}/(4f_y)) b d$", hasil: formatNumber(tulangan.As2, 2), satuan: "mm²/m" },
                { parameter: "$A_{s3} = 1.4 b d / f_y$", hasil: formatNumber(tulangan.As3, 2), satuan: "mm²/m" },
                { parameter: "$A_s = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(tulangan.As, 2), satuan: "mm²/m" },
                { parameter: "$s_1 = 0.25\\pi D^2 \\times 1000 / A_s$", hasil: formatNumber(tulangan.s1, 0), satuan: "mm" },
                { parameter: "$s_2 = 3h$", hasil: formatNumber(tulangan.s2, 0), satuan: "mm" },
                { parameter: "$s = \\lfloor \\min(s_1, s_2, 450) \\rfloor_{25}$", hasil: formatNumber(tulangan.s, 0), satuan: "mm" },
                { parameter: "<strong>Digunakan tulangan ɸ" + getData('inputData.tulangan.d', 'N/A') + "-" + formatNumber(tulangan.s, 0) + "</strong>", isFullRow: true, hasil: "", satuan: "" }
            ];
            return createThreeColumnTable(rows, true);
            
        } else if (jenis === 'persegi_panjang') {
            const bujur = tulangan.bujur || {};
            const persegi = tulangan.persegi || {};
            
            const rows = [
                { parameter: "<strong>Tulangan Arah Memanjang (l_y)</strong>", hasil: "", satuan: "" },
                { parameter: "$\\sigma = \\sigma_{min} + (l_y - x_1)(\\sigma_{max} - \\sigma_{min})/l_y$", hasil: formatNumber(bujur.sigma, 2), satuan: "kPa" },
                { parameter: "$M_u = 0.5\\sigma x_1^2 + \\frac{1}{3}(\\sigma_{max} - \\sigma)x_1^2$", hasil: formatNumber(bujur.Mu, 2), satuan: "kNm/m" },
                { parameter: "$K = M_u \\times 10^6 / (\\phi b d^2)$", hasil: formatNumber(bujur.K, 3), satuan: "MPa" },
                { 
                    parameter: "$K \\leq K_{max}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${bujur.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${bujur.Kontrol_K || 'N/A'}</span>` 
                },
                { parameter: "$a = (1 - \\sqrt{1 - 2K/(0.85f'_c)})d$", hasil: formatNumber(bujur.a_val, 2), satuan: "mm" },
                { parameter: "$A_s = \\max(0.85f'_c a b/f_y, (\\sqrt{f'_c}/(4f_y)) b d, 1.4 b d/f_y)$", hasil: formatNumber(bujur.As, 2), satuan: "mm²/m" },
                { parameter: "$s = \\lfloor \\min(0.25\\pi D^2 \\times 1000/A_s, 3h, 450) \\rfloor_{25}$", hasil: formatNumber(bujur.s, 0), satuan: "mm" },
                
                { parameter: "<strong>Tulangan Arah Pendek (l_x)</strong>", hasil: "", satuan: "" },
                { parameter: "$M_u = 0.5\\sigma_{max} x_2^2$", hasil: formatNumber(persegi.Mu, 2), satuan: "kNm/m" },
                { parameter: "$K = M_u \\times 10^6 / (\\phi b d_2^2)$", hasil: formatNumber(persegi.K, 3), satuan: "MPa" },
                { 
                    parameter: "$K \\leq K_{max}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${persegi.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${persegi.Kontrol_K || 'N/A'}</span>` 
                },
                { parameter: "$a = (1 - \\sqrt{1 - 2K/(0.85f'_c)})d_2$", hasil: formatNumber(persegi.a_val, 2), satuan: "mm" },
                { parameter: "$A_s = \\max(0.85f'_c a b/f_y, (\\sqrt{f'_c}/(4f_y)) b d_2, 1.4 b d_2/f_y)$", hasil: formatNumber(persegi.As, 2), satuan: "mm²/m" },
                { parameter: "$A_{s,pusat} = (2l_x A_s)/(l_y + l_x)$", hasil: formatNumber(persegi.Aspusat, 2), satuan: "mm²/m" },
                { parameter: "$s_{pusat} = \\lfloor \\min(0.25\\pi D_b^2 \\times 1000/A_{s,pusat}, 3h, 450) \\rfloor_{25}$", hasil: formatNumber(persegi.s_pusat, 0), satuan: "mm" },
                { parameter: "$A_{s,tepi} = A_s - A_{s,pusat}$", hasil: formatNumber(persegi.Astepi, 2), satuan: "mm²/m" },
                { parameter: "$s_{tepi} = \\lfloor \\min(0.25\\pi D_b^2 \\times 1000/A_{s,tepi}, 3h, 450) \\rfloor_{25}$", hasil: formatNumber(persegi.s_tepi, 0), satuan: "mm" },
                
                { 
                    parameter: "<strong>Digunakan tulangan:</strong><br>" +
                               "• Arah memanjang: ɸ" + getData('inputData.tulangan.d', 'N/A') + "-" + formatNumber(bujur.s, 0) + "<br>" +
                               "• Arah pendek pusat: ɸ" + getData('inputData.tulangan.db', 'N/A') + "-" + formatNumber(persegi.s_pusat, 0) + "<br>" +
                               "• Arah pendek tepi: ɸ" + getData('inputData.tulangan.db', 'N/A') + "-" + formatNumber(persegi.s_tepi, 0), 
                    isFullRow: true, 
                    hasil: "", 
                    satuan: "" 
                }
            ];
            return createThreeColumnTable(rows, true);
            
        } else if (jenis === 'menerus') {
            const rows = [
                { parameter: "<strong>Tulangan Utama (Arah Lentur)</strong>", hasil: "", satuan: "" },
                { parameter: "$M_u = 0.5\\sigma_{max} x_2^2$", hasil: formatNumber(tulangan.Mu, 2), satuan: "kNm/m" },
                { parameter: "$K = M_u \\times 10^6 / (\\phi b d^2)$", hasil: formatNumber(tulangan.K, 3), satuan: "MPa" },
                { 
                    parameter: "$K \\leq K_{max}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${tulangan.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.Kontrol_K || 'N/A'}</span>` 
                },
                { parameter: "$a = (1 - \\sqrt{1 - 2K/(0.85f'_c)})d$", hasil: formatNumber(tulangan.a_val, 2), satuan: "mm" },
                { parameter: "$A_s = \\max(0.85f'_c a b/f_y, (\\sqrt{f'_c}/(4f_y)) b d, 1.4 b d/f_y)$", hasil: formatNumber(tulangan.As, 2), satuan: "mm²/m" },
                { parameter: "$s_{utama} = \\lfloor \\min(0.25\\pi D^2 \\times 1000/A_s, 3h, 450) \\rfloor_{25}$", hasil: formatNumber(tulangan.s_utama, 0), satuan: "mm" },
                
                { parameter: "<strong>Tulangan Bagi (Susut & Suhu)</strong>", hasil: "", satuan: "" },
                { parameter: "$A_{sb1} = A_s/5$", hasil: formatNumber(tulangan.Asb1, 2), satuan: "mm²/m" },
                { parameter: "$A_{sb2} = \\rho_{min} \\times b \\times h \\times 1000$", hasil: formatNumber(tulangan.Asb2, 2), satuan: "mm²/m" },
                { parameter: "$A_{sb3} = 0.0014 \\times b \\times h \\times 1000$", hasil: formatNumber(tulangan.Asb3, 2), satuan: "mm²/m" },
                { parameter: "$A_{sb} = \\max(A_{sb1}, A_{sb2}, A_{sb3})$", hasil: formatNumber(tulangan.Asb, 2), satuan: "mm²/m" },
                { parameter: "$s_{bagi} = \\lfloor \\min(0.25\\pi D_b^2 \\times 1000/A_{sb}, 5h, 450) \\rfloor_{25}$", hasil: formatNumber(tulangan.s_bagi, 0), satuan: "mm" },
                
                { 
                    parameter: "<strong>Digunakan tulangan:</strong><br>" +
                               "• Tulangan utama: ɸ" + getData('inputData.tulangan.d', 'N/A') + "-" + formatNumber(tulangan.s_utama, 0) + "<br>" +
                               "• Tulangan bagi: ɸ" + getData('inputData.tulangan.db', 'N/A') + "-" + formatNumber(tulangan.s_bagi, 0), 
                    isFullRow: true, 
                    hasil: "", 
                    satuan: "" 
                }
            ];
            return createThreeColumnTable(rows, true);
        }
        
        return '<p class="note">Jenis fondasi tidak dikenali</p>';
    }

    // Fungsi untuk membuat tabel kuat dukung
    function createKuatDukungTable() {
        const kuatDukung = getData('data.kuatDukung', {});
        const fondasiMode = getData('data.actualFondasiMode', 'tunggal');
        
        if (fondasiMode === 'menerus') {
            const rows = [
                { parameter: "$A_1 = b_x$", hasil: formatNumber(kuatDukung.A1), satuan: "mm²" },
                { parameter: "$P_{u,cap} = 0.65 \\times 0.85 f'_c \\times A_1$", hasil: formatNumber(kuatDukung.Pu_cap, 2), satuan: "kN" },
                { parameter: "$P_u$ (Beban aksial)", hasil: formatNumber(getData('inputData.beban.pu'), 2), satuan: "kN" },
                { 
                    parameter: "$P_{u,cap} \\geq P_u$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kuatDukung.Kontrol_Pu === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Pu || 'N/A'}</span>` 
                },
                { parameter: "$I_t = l_x/2 - b_x/2 - s_{beton}$", hasil: formatNumber(kuatDukung.It, 0), satuan: "mm" },
                { parameter: "$C_b = \\min(75, s_{utama})$", hasil: formatNumber(kuatDukung.Cb, 0), satuan: "mm" },
                { parameter: "$C = \\min((C_b + 0)/D_b, 2.5)$", hasil: formatNumber(kuatDukung.C, 2), satuan: "-" },
                { parameter: "$l_{dh1} = (f_y/(1.1\\lambda\\sqrt{f'_c})) \\times (0.8/C) \\times D_b$", hasil: formatNumber(kuatDukung.Idh1, 0), satuan: "mm" },
                { parameter: "$l_{dh2} = 8 \\times D_b$", hasil: formatNumber(kuatDukung.Idh2, 0), satuan: "mm" },
                { parameter: "$l_{dh} = \\lceil \\max(l_{dh1}, l_{dh2}, 300) \\rceil_5$", hasil: formatNumber(kuatDukung.Idh, 0), satuan: "mm" },
                { 
                    parameter: "$I_t \\geq l_{dh}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kuatDukung.Kontrol_Idh === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Idh || 'N/A'}</span>` 
                }
            ];
            return createThreeColumnTable(rows, true);
        } else {
            const rows = [
                { parameter: "$A_1 = b_x \\times b_y$", hasil: formatNumber(kuatDukung.A1), satuan: "mm²" },
                { parameter: "$P_{u,cap} = 0.65 \\times 0.85 f'_c \\times A_1 / 1000$", hasil: formatNumber(kuatDukung.Pu_cap, 2), satuan: "kN" },
                { parameter: "$P_u$ (Beban aksial)", hasil: formatNumber(getData('inputData.beban.pu'), 2), satuan: "kN" },
                { 
                    parameter: "$P_{u,cap} \\geq P_u$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kuatDukung.Kontrol_Pu === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Pu || 'N/A'}</span>` 
                },
                { parameter: "$I_t = l_x/2 - b_x/2 - s_{beton}$", hasil: formatNumber(kuatDukung.It, 0), satuan: "mm" },
                { parameter: "$A_{s,perlu}$", hasil: formatNumber(kuatDukung.As_perlu, 2), satuan: "mm²/m" },
                { parameter: "$A_{s,terpasang}$", hasil: formatNumber(kuatDukung.Asterpasang, 2), satuan: "mm²/m" },
                { parameter: "$f_3 = A_{s,perlu} / A_{s,terpasang}$", hasil: formatNumber(kuatDukung.f3, 2), satuan: "-" },
                { parameter: "$l_{dh1} = (0.24 f_y/(\\lambda\\sqrt{f'_c})) \\times D \\times f_3$", hasil: formatNumber(kuatDukung.Idh1, 0), satuan: "mm" },
                { parameter: "$l_{dh2} = 8 \\times D$", hasil: formatNumber(kuatDukung.Idh2, 0), satuan: "mm" },
                { parameter: "$l_{dh} = \\lceil \\max(l_{dh1}, l_{dh2}, 150) \\rceil_5$", hasil: formatNumber(kuatDukung.Idh, 0), satuan: "mm" },
                { 
                    parameter: "$I_t \\geq l_{dh}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kuatDukung.Kontrol_Idh === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Idh || 'N/A'}</span>` 
                }
            ];
            return createThreeColumnTable(rows, true);
        }
    }

    // Fungsi untuk membuat tabel rekapitulasi
    function createRekapitulasiTable() {
        const rekap = getData('rekap', {});
        const tulangan = getData('data.tulangan', {});
        const jenis = tulangan.jenis || 'bujur_sangkar';
        
        let html = '<table class="rekap-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th class="rekap-col-tulangan">Parameter</th>';
        html += '<th class="rekap-col-tumpuan">Nilai</th>';
        html += '<th class="rekap-col-lapangan">Status</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        // Dimensi
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Dimensi Fondasi</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.dimensi || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">-</td>';
        html += '</tr>';
        
        // Tegangan minimum
        const sigmaMinStatus = rekap.sigma_min ? (rekap.sigma_min.includes('AMAN') ? '✅ AMAN' : '❌ BAHAYA') : 'N/A';
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tegangan Minimum (σ<sub>min</sub>)</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.sigma_min ? rekap.sigma_min.split('(')[0].trim() : 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + sigmaMinStatus + '</td>';
        html += '</tr>';
        
        // Daya dukung tanah
        const dayaDukungStatus = rekap.tekanan_tanah ? (rekap.tekanan_tanah.includes('AMAN') ? '✅ AMAN' : '❌ BAHAYA') : 'N/A';
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Daya Dukung Tanah</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.tekanan_tanah ? rekap.tekanan_tanah.split('(')[0].trim() : 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + dayaDukungStatus + '</td>';
        html += '</tr>';
        
        // Kontrol geser
        const geserStatus = rekap.geser ? (rekap.geser.includes('AMAN') ? '✅ AMAN' : '❌ BAHAYA') : 'N/A';
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kontrol Geser</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.geser ? rekap.geser.split('(')[0].trim() : 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + geserStatus + '</td>';
        html += '</tr>';
        
        // Kontrol K
        const kontrolKStatus = rekap.kontrol_K ? (rekap.kontrol_K.includes('AMAN') ? '✅ AMAN' : '❌ BAHAYA') : 'N/A';
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kontrol Rasio Tulangan (K)</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.kontrol_K ? rekap.kontrol_K.split('(')[0].trim() : 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + kontrolKStatus + '</td>';
        html += '</tr>';
        
        // Kuat dukung
        const kuatDukungStatus = rekap.kuat_dukung ? (rekap.kuat_dukung.includes('AMAN') ? '✅ AMAN' : '❌ BAHAYA') : 'N/A';
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kuat Dukung Kolom-Fondasi</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.kuat_dukung ? rekap.kuat_dukung.split('(')[0].trim() : 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + kuatDukungStatus + '</td>';
        html += '</tr>';
        
        // Tulangan
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan</td>';
        if (jenis === 'bujur_sangkar') {
            html += '<td class="rekap-col-tumpuan text-center">' + (rekap.tulangan_utama || 'N/A') + '</td>';
        } else if (jenis === 'persegi_panjang') {
            html += '<td class="rekap-col-tumpuan text-center">' + 
                    (rekap.tulangan_panjang || 'N/A') + '<br>' +
                    (rekap.tulangan_pendek_pusat || 'N/A') + '<br>' +
                    (rekap.tulangan_pendek_tepi || 'N/A') + '</td>';
        } else if (jenis === 'menerus') {
            html += '<td class="rekap-col-tumpuan text-center">' + 
                    (rekap.tulangan_utama || 'N/A') + '<br>' +
                    (rekap.tulangan_bagi || 'N/A') + '</td>';
        } else {
            html += '<td class="rekap-col-tumpuan text-center">N/A</td>';
        }
        html += '<td class="rekap-col-lapangan text-center">-</td>';
        html += '</tr>';
        
        // Kontrol jarak tulangan minimal
        if (rekap.kontrol_s_minimal) {
            const sMinStatus = rekap.kontrol_s_minimal.includes('AMAN') ? '✅ AMAN' : '❌ BAHAYA';
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kontrol Jarak Tulangan (s ≥ 100mm)</td>';
            html += '<td class="rekap-col-tumpuan text-center">' + rekap.kontrol_s_minimal + '</td>';
            html += '<td class="rekap-col-lapangan text-center">' + sMinStatus + '</td>';
            html += '</tr>';
        }
        
        // Evaluasi tulangan (mode evaluasi)
        if (getData('mode') === 'evaluasi' && rekap.evaluasi_tulangan) {
            const evaluasiStatus = rekap.evaluasi_tulangan.includes('AMAN') ? '✅ AMAN' : '❌ BAHAYA';
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Evaluasi Tulangan Terpasang</td>';
            html += '<td class="rekap-col-tumpuan text-center">' + rekap.evaluasi_tulangan + '</td>';
            html += '<td class="rekap-col-lapangan text-center">' + evaluasiStatus + '</td>';
            html += '</tr>';
        }
        
        html += '</tbody>';
        html += '</table>';
        return html;
    }

    // ==============================================
    // FUNGSI BARU: Kesimpulan Fleksibel untuk Fondasi
    // ==============================================
    function generateDynamicConclusion() {
        // Hitung status fondasi secara dinamis
        const statusFondasi = cekStatusFondasi();
        
        const inputData = getData('inputData', {});
        const fondasi = inputData.fondasi || {};
        const dimensi = fondasi.dimensi || {};
        const beban = inputData.beban || {};
        const material = inputData.material || {};
        const tanah = inputData.tanah || {};
        
        // Ambil semua status kontrol
        const kontrol = getData('kontrol', {});
        
        // Analisis status per komponen
        let masalah = [];
        let rekomendasi = [];
        
        // Analisis tegangan minimum
        if (!kontrol.sigmaMinAman) {
            masalah.push("Tegangan minimum (σ<sub>min</sub>) negatif atau nol");
            rekomendasi.push("Perlu penyesuaian dimensi fondasi atau beban");
            rekomendasi.push("Pertimbangkan untuk memperbesar dimensi fondasi");
        }
        
        // Analisis daya dukung tanah
        if (kontrol.dayaDukung && !kontrol.dayaDukung.aman) {
            masalah.push("Daya dukung tanah tidak mencukupi");
            rekomendasi.push("Perlu perbaikan tanah atau memperbesar dimensi fondasi");
            rekomendasi.push("Pertimbangkan untuk menggunakan fondasi dalam atau perbaikan tanah");
        }
        
        // Analisis geser
        if (kontrol.geser) {
            if (!kontrol.geser.aman1) {
                masalah.push("Kontrol geser satu arah tidak aman");
                rekomendasi.push("Perlu penambahan tinggi fondasi atau mutu beton");
            }
            if (!kontrol.geser.aman2) {
                masalah.push("Kontrol geser pons tidak aman");
                rekomendasi.push("Perlu penambahan tinggi fondasi atau ukuran kolom");
            }
        }
        
        // Analisis tulangan
        if (kontrol.tulangan && !kontrol.tulangan.aman) {
            masalah.push("Kontrol rasio tulangan (K) tidak aman");
            rekomendasi.push("Perlu penambahan tulangan atau perubahan diameter");
            rekomendasi.push("Pertimbangkan untuk menggunakan mutu beton yang lebih tinggi");
        }
        
        // Analisis kuat dukung
        if (kontrol.kuatDukung && !kontrol.kuatDukung.aman) {
            masalah.push("Kuat dukung kolom-fondasi tidak aman");
            rekomendasi.push("Perlu penambahan luas kolom atau mutu beton");
            rekomendasi.push("Pertimbangkan untuk menggunakan dowel atau tulangan tambahan");
        }
        
        // Analisis jarak tulangan minimal
        if (kontrol.tulanganTambahan && !kontrol.tulanganTambahan.aman) {
            masalah.push("Jarak tulangan kurang dari minimum (100 mm)");
            rekomendasi.push("Perlu penyesuaian jarak tulangan");
        }
        
        // Analisis evaluasi tulangan (mode evaluasi)
        if (getData('mode') === 'evaluasi' && kontrol.evaluasiTulangan && !kontrol.evaluasiTulangan.aman) {
            masalah.push("Tulangan terpasang tidak memenuhi kebutuhan");
            rekomendasi.push("Perlu penambahan tulangan sesuai hasil perhitungan");
        }
        
        // Buat HTML kesimpulan dinamis
        let conclusionHTML = `
            <div class="section-group">
                <h3>7. Kesimpulan</h3>
                <div class="conclusion-box">
                    <h4 style="text-align: center; ${statusFondasi === 'aman' ? 'color: #155724;' : 'color: #721c24;'} margin-bottom: 8px;">
                        <strong>STRUKTUR FONDASI ${statusFondasi === 'aman' ? 'AMAN' : 'TIDAK AMAN'}</strong>
                    </h4>
        `;
        
        // Ringkasan status
        if (statusFondasi === 'aman') {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p>
                <p>Struktur fondasi dengan dimensi ${dimensi.lx || 'N/A'}m × ${dimensi.ly || 'N/A'}m memenuhi semua persyaratan untuk:</p>
                <ul>
                    <li>Tegangan tanah (σ<sub>min</sub> > 0)</li>
                    <li>Daya dukung tanah</li>
                    <li>Kontrol geser satu arah dan pons</li>
                    <li>Kontrol rasio tulangan (K ≤ K<sub>max</sub>)</li>
                    <li>Kuat dukung kolom-fondasi</li>
                    <li>Persyaratan detail tulangan</li>
                </ul>
            `;
            
            // Rekomendasi untuk kondisi aman
            rekomendasi = [
                "Gunakan dimensi fondasi " + (dimensi.lx || 'N/A') + "m × " + (dimensi.ly || 'N/A') + "m",
                "Gunakan tulangan sesuai hasil perhitungan",
                "Pastikan mutu beton mencapai f'c = " + (material.fc || 'N/A') + " MPa",
                "Pastikan mutu baja mencapai fy = " + (material.fy || 'N/A') + " MPa",
                "Lakukan pengecoran dengan metode yang sesuai standar",
                "Pastikan tanah memiliki daya dukung yang sesuai"
            ];
        } else {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-tidak-aman">TIDAK AMAN - PERLU PERBAIKAN DESAIN</span></p>
                <p>Ditemukan masalah pada beberapa aspek desain:</p>
                <div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                    ${masalah.length > 0 ? masalah.map(m => `<p class="problem-item">• ${m}</p>`).join('') : '<p class="problem-item">• Terdapat masalah pada satu atau lebih kontrol keamanan</p>'}
                </div>
            `;
            
            // Rekomendasi tambahan untuk kondisi tidak aman
            if (masalah.length === 0) {
                rekomendasi.push("Tinjau kembali dimensi fondasi: " + (dimensi.lx || 'N/A') + "m × " + (dimensi.ly || 'N/A') + "m");
                rekomendasi.push("Evaluasi ulang mutu material yang digunakan");
                rekomendasi.push("Pertimbangkan untuk menggunakan fondasi dengan dimensi lebih besar");
                rekomendasi.push("Periksa kembali data tanah dan beban");
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
    // FUNGSI UTAMA: Generate Content Blocks untuk Fondasi
    // ==============================================
    function generateContentBlocks() {
        const blocks = [];
        
        // Gunakan status fondasi yang dihitung secara dinamis
        const statusFondasiDinamis = cekStatusFondasi();
        
        blocks.push(`
            <h1>LAPORAN PERHITUNGAN FONDASI</h1>
            <div class="header-info">
                <div>
                    <span><strong>Mode:</strong> ${getData('mode', 'N/A').toUpperCase()}</span>
                    <span><strong>Modul:</strong> ${getData('module', 'N/A').toUpperCase()}</span>
                    <span><strong>Jenis Fondasi:</strong> ${getData('data.actualFondasiMode', 'N/A').toUpperCase().replace('_', ' ')}</span>
                </div>
                <div>
                    <span><strong>Tanggal:</strong> ${formatTimestampFull(getData('timestamp'))}</span>
                    <span><strong>Status:</strong> <span class="${statusFondasiDinamis === 'aman' ? 'status-aman' : 'status-tidak-aman'}">${statusFondasiDinamis.toUpperCase()}</span></span>
                </div>
            </div>
            <h2>A. DATA INPUT DAN PARAMETER</h2>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Data Input Fondasi</h3>
                ${createFondasiInputTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Parameter Perhitungan</h3>
                ${createParameterTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>B. PERHITUNGAN DAYA DUKUNG TANAH</h2>
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Analisis Daya Dukung</h3>
                ${createDayaDukungTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>C. PERHITUNGAN TULANGAN FONDASI</h2>
                <p class="note">Perhitungan tulangan berdasarkan momen lentur maksimum</p>
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Tulangan Lentur</h3>
                ${createTulanganTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>D. KONTROL GESER</h2>
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Kontrol Geser Satu Arah dan Pons</h3>
                ${createKontrolGeserTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>E. KUAT DUKUNG KOLOM-FONDASI</h2>
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Analisis Kuat Dukung</h3>
                ${createKuatDukungTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>F. REKAPITULASI HASIL DESAIN</h2>
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>1. Ringkasan Hasil</h3>
                ${createRekapitulasiTable()}
            </div>
        `);
        
        // Ringkasan kontrol keamanan
        const kontrolRows = [
            { 
                parameter: "$\\sigma_{min} > 0$", 
                statusHtml: `<span class="${getData('kontrol.sigmaMinAman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.sigmaMinAman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "Daya dukung tanah", 
                statusHtml: `<span class="${getData('kontrol.dayaDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.dayaDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "Geser satu arah", 
                statusHtml: `<span class="${getData('kontrol.geser.aman1', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.geser.aman1', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "Geser pons", 
                statusHtml: `<span class="${getData('kontrol.geser.aman2', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.geser.aman2', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$K \\leq K_{max}$", 
                statusHtml: `<span class="${getData('kontrol.tulangan.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.tulangan.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "Kuat dukung kolom-fondasi", 
                statusHtml: `<span class="${getData('kontrol.kuatDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kuatDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
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
    window.fondasiReport = {
        setData: setData,
        generateContentBlocks: generateContentBlocks,
        cekStatusFondasi: cekStatusFondasi,
        formatNumber: formatNumber,
        getData: getData
    };
})();