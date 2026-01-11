(function() {
    let resultData;

    function setData(data) {
        resultData = data;
    }

    // ==============================================
    // FUNGSI UTILITY
    // ==============================================
    
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

    function formatNumber(num, decimals = 2) {
        if (num === null || num === undefined || num === 'N/A' || isNaN(num)) return 'N/A';
        const numFloat = parseFloat(num);
        
        if (decimals === 0) {
            return Math.round(numFloat).toString();
        }
        
        return numFloat.toFixed(decimals);
    }

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

    // ==============================================
    // FUNGSI STATUS FONDASI DINAMIS
    // ==============================================
    
    function cekStatusFondasi() {
        const kontrol = getData('kontrol', {});
        
        // Cek semua kontrol keamanan
        const semuaAman = 
            kontrol.sigmaMinAman === true &&
            kontrol.dayaDukung?.aman === true &&
            kontrol.geser?.aman1 === true &&
            kontrol.geser?.aman2 === true &&
            kontrol.tulangan?.aman === true &&
            kontrol.kuatDukung?.aman === true &&
            kontrol.tulanganTambahan?.aman === true;
        
        // Untuk mode evaluasi, cek juga evaluasi tulangan
        if (getData('mode') === 'evaluasi' && kontrol.evaluasiTulangan) {
            return semuaAman && kontrol.evaluasiTulangan.aman === true ? 'aman' : 'tidak aman';
        }
        
        return semuaAman ? 'aman' : 'tidak aman';
    }

    // ==============================================
    // FUNGSI PEMBUATAN TABEL
    // ==============================================
    
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
    // FUNGSI TABEL SPESIFIK FONDASI
    // ==============================================
    
    function createDimensiTable() {
        const fondasi = getData('inputData.fondasi.dimensi', {});
        const tulangan = getData('inputData.tulangan', {});
        
        const rows = [
            { parameter: "<strong>Dimensi Fondasi</strong>", hasil: "", satuan: "" },
            { parameter: "$L_x$ (Panjang arah x)", hasil: formatNumber(fondasi.lx, 3), satuan: "m" },
            { parameter: "$L_y$ (Panjang arah y)", hasil: formatNumber(fondasi.ly, 3), satuan: "m" },
            { parameter: "$B_x$ (Lebar kolom arah x)", hasil: formatNumber(fondasi.bx, 0), satuan: "mm" },
            { parameter: "$B_y$ (Lebar kolom arah y)", hasil: formatNumber(fondasi.by, 0), satuan: "mm" },
            { parameter: "$h$ (Tinggi fondasi)", hasil: formatNumber(fondasi.h, 3), satuan: "m" },
            { parameter: "$\\alpha_s$", hasil: formatNumber(fondasi.alpha_s, 0), satuan: "-" },
            { parameter: "<strong>Data Tulangan</strong>", hasil: "", satuan: "" },
            { parameter: "$D$ (Diameter tulangan utama)", hasil: formatNumber(tulangan.d, 0), satuan: "mm" },
            { parameter: "$D_b$ (Diameter tulangan bagi)", hasil: formatNumber(tulangan.db, 0), satuan: "mm" },
            { parameter: "$s$ (Jarak tulangan utama)", hasil: formatNumber(tulangan.s, 0), satuan: "mm" },
            { parameter: "$s_p$ (Jarak tulangan pendek pusat)", hasil: formatNumber(tulangan.sp, 0), satuan: "mm" },
            { parameter: "$s_t$ (Jarak tulangan pendek tepi)", hasil: formatNumber(tulangan.st, 0), satuan: "mm" },
            { parameter: "$s_b$ (Jarak tulangan bagi)", hasil: formatNumber(tulangan.sb, 0), satuan: "mm" }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }
    
    function createMaterialTable() {
        const material = getData('inputData.material', {});
        
        const rows = [
            { parameter: "<strong>Material Beton dan Baja</strong>", hasil: "", satuan: "" },
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: formatNumber(material.fc, 0), satuan: "MPa" },
            { parameter: "$f_y$ (Tegangan leleh baja)", hasil: formatNumber(material.fy, 0), satuan: "MPa" },
            { parameter: "$\\gamma_c$ (Berat jenis beton)", hasil: formatNumber(material.gammaC, 1), satuan: "kN/m³" },
            { parameter: "$\\lambda$ (Faktor reduksi beton ringan)", hasil: formatNumber(material.lambda || 1, 2), satuan: "-" }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }
    
    function createBebanTable() {
        const beban = getData('inputData.beban', {});
        
        const rows = [
            { parameter: "<strong>Beban Struktur</strong>", hasil: "", satuan: "" },
            { parameter: "$P_u$ (Beban aksial ultimit)", hasil: formatNumber(beban.pu, 1), satuan: "kN" },
            { parameter: "$M_{ux}$ (Momen ultimit arah x)", hasil: formatNumber(beban.mux, 1), satuan: "kNm" },
            { parameter: "$M_{uy}$ (Momen ultimit arah y)", hasil: formatNumber(beban.muy, 1), satuan: "kNm" }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }
    
    function createTanahTable() {
        const tanah = getData('inputData.tanah', {});
        const modeTanah = tanah.mode || "manual";
        
        let rows = [
            { parameter: "<strong>Parameter Tanah</strong>", hasil: "", satuan: "" },
            { parameter: "<strong>Mode:</strong> " + (modeTanah === "auto" ? "Otomatis (Terzaghi/Meyerhof)" : "Manual (qa diberikan)"), hasil: "", satuan: "" }
        ];
        
        if (modeTanah === "auto") {
            const auto = tanah.auto || {};
            rows = rows.concat([
                { parameter: "$D_f$ (Kedalaman fondasi)", hasil: formatNumber(auto.df, 2), satuan: "m" },
                { parameter: "$\\gamma$ (Berat jenis tanah)", hasil: formatNumber(auto.gamma, 1), satuan: "kN/m³" },
                { parameter: "$\\phi$ (Sudut geser dalam)", hasil: formatNumber(auto.phi, 1), satuan: "°" },
                { parameter: "$c$ (Kohesi)", hasil: formatNumber(auto.c, 1), satuan: "kPa" },
                { parameter: "$q_c$ (Tekanan konus)", hasil: formatNumber(auto.qc, 0), satuan: "kPa" },
                { parameter: "<strong>Metode yang digunakan:</strong>", hasil: "", satuan: "" },
                { parameter: "&nbsp;&nbsp;• Terzaghi", hasil: auto.terzaghi ? "Ya" : "Tidak", satuan: "-" },
                { parameter: "&nbsp;&nbsp;• Meyerhof", hasil: auto.mayerhoff ? "Ya" : "Tidak", satuan: "-" }
            ]);
        } else {
            const manual = tanah.manual || {};
            rows = rows.concat([
                { parameter: "$q_a$ (Daya dukung ijin)", hasil: formatNumber(manual.qa, 0), satuan: "kPa" },
                { parameter: "$D_f$ (Kedalaman fondasi)", hasil: formatNumber(manual.df, 2), satuan: "m" },
                { parameter: "$\\gamma$ (Berat jenis tanah)", hasil: formatNumber(manual.gamma, 1), satuan: "kN/m³" }
            ]);
        }
        
        return createThreeColumnTable(rows, false, true);
    }

    // ==============================================
    // FUNGSI TABEL PERHITUNGAN FONDASI
    // ==============================================
    
    function createParameterTable() {
        const parameter = getData('data.parameter', {});
        
        const rows = [
            { parameter: "<strong>Parameter Geometri</strong>", hasil: "", satuan: "" },
            { parameter: "$d_s$ (Jarak pusat tulangan ke tepi bawah)", hasil: formatNumber(parameter.ds, 0), satuan: "mm" },
            { parameter: "$d_s'$ (Jarak pusat tulangan ke tepi bawah lapis 2)", hasil: formatNumber(parameter.ds2, 0), satuan: "mm" },
            { parameter: "$d$ (Tinggi efektif)", hasil: formatNumber(parameter.d, 0), satuan: "mm" },
            { parameter: "$d'$ (Tinggi efektif lapis 2)", hasil: formatNumber(parameter.d2, 0), satuan: "mm" },
            { parameter: "$a$ (Jarak geser kritis)", hasil: formatNumber(parameter.a, 3), satuan: "m" },
            { parameter: "$q$ (Tekanan overburden)", hasil: formatNumber(parameter.q, 2), satuan: "kPa" },
            { parameter: "<strong>Parameter Beban</strong>", hasil: "", satuan: "" },
            { parameter: "$\\sigma_{min}$ (Tegangan tanah minimum)", hasil: formatNumber(parameter.sigma_min, 2), satuan: "kPa" },
            { parameter: "$\\sigma_{max}$ (Tegangan tanah maksimum)", hasil: formatNumber(parameter.sigma_max, 2), satuan: "kPa" },
            { parameter: "$\\sigma_{avg}$ (Tegangan tanah rata-rata)", hasil: formatNumber(parameter.sigma_avg, 2), satuan: "kPa" },
            { parameter: "$\\sigma_a$ (Tegangan tanah di muka kolom)", hasil: formatNumber(parameter.sigma_a, 2), satuan: "kPa" },
            { parameter: "<strong>Status:</strong>", hasil: "", satuan: "" },
            { 
                parameter: "$\\sigma_{min} > 0$", 
                isStatus: true, 
                statusHtml: `<span class="${parameter.sigma_status === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${parameter.sigma_status || 'N/A'}</span>` 
            },
            { parameter: "<strong>Parameter Lainnya</strong>", hasil: "", satuan: "" },
            { parameter: "$x_1$ (Jarak momen kritis arah panjang)", hasil: formatNumber(parameter.x1, 3), satuan: "m" },
            { parameter: "$x_2$ (Jarak momen kritis arah pendek)", hasil: formatNumber(parameter.x2, 3), satuan: "m" },
            { parameter: "$b_0$ (Keliling geser kritis)", hasil: formatNumber(parameter.b0, 0), satuan: "mm" },
            { parameter: "$\\beta_1$ (Faktor reduksi tegangan beton)", hasil: formatNumber(parameter.beta1, 3), satuan: "-" },
            { parameter: "$K_{max}$ (Parameter lentur maksimum)", hasil: formatNumber(parameter.Kmax, 3), satuan: "MPa" }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    function createDayaDukungTable() {
        const dayaDukung = getData('data.dayaDukung', {});
        
        let rows = [
            { parameter: "<strong>Parameter Daya Dukung Tanah</strong>", hasil: "", satuan: "" }
        ];
        
        // Tambahkan baris berdasarkan metode yang digunakan
        if (dayaDukung.method === "Manual") {
            rows = rows.concat([
                { parameter: "<strong>Metode: Manual (qa diberikan)</strong>", hasil: "", satuan: "" },
                { parameter: "$q_a$ (Daya dukung ijin)", hasil: formatNumber(dayaDukung.qa, 0), satuan: "kPa" },
                { parameter: "$\\sigma_{max}$ (Tegangan maksimum)", hasil: formatNumber(dayaDukung.sigma_max, 0), satuan: "kPa" }
            ]);
        } else {
            // Metode Terzaghi/Meyerhof
            rows = rows.concat([
                { parameter: `<strong>Metode: ${dayaDukung.method || 'N/A'}</strong>`, hasil: "", satuan: "" },
                { parameter: "$\\phi_{rad}$ (Sudut geser dalam radian)", hasil: formatNumber(dayaDukung.phi_rad, 4), satuan: "rad" },
                { parameter: "$a$ (Parameter Terzaghi)", hasil: formatNumber(dayaDukung.a, 4), satuan: "-" },
                { parameter: "$K_{p\\gamma}$ (Koefisien tekanan tanah pasif)", hasil: formatNumber(dayaDukung.Kp_gamma, 2), satuan: "-" },
                { parameter: "$N_c$ (Faktor daya dukung kohesi)", hasil: formatNumber(dayaDukung.Nc, 2), satuan: "-" },
                { parameter: "$N_q$ (Faktor daya dukung beban)", hasil: formatNumber(dayaDukung.Nq, 2), satuan: "-" },
                { parameter: "$N_\\gamma$ (Faktor daya dukung berat)", hasil: formatNumber(dayaDukung.Ngamma, 2), satuan: "-" }
            ]);
            
            if (dayaDukung.method?.includes("Terzaghi")) {
                rows.push({ parameter: "$q_u$ (Daya dukung ultimit Terzaghi)", hasil: formatNumber(dayaDukung.qu_terzaghi, 0), satuan: "kPa" });
                rows.push({ parameter: "$q_a$ (Daya dukung ijin Terzaghi)", hasil: formatNumber(dayaDukung.qa_terzaghi, 0), satuan: "kPa" });
            }
            
            if (dayaDukung.method?.includes("Meyerhof")) {
                rows.push({ parameter: "$K_d$ (Faktor kedalaman Meyerhof)", hasil: formatNumber(dayaDukung.Kd, 2), satuan: "-" });
                rows.push({ parameter: "$q_a$ (Daya dukung ijin Meyerhof)", hasil: formatNumber(dayaDukung.qa_meyerhof, 0), satuan: "kPa" });
            }
            
            rows.push({ parameter: "$q_a$ (Daya dukung ijin yang digunakan)", hasil: formatNumber(dayaDukung.qa, 0), satuan: "kPa" });
            rows.push({ parameter: "$\\sigma_{max}$ (Tegangan maksimum)", hasil: formatNumber(dayaDukung.sigma_max, 0), satuan: "kPa" });
        }
        
        rows.push({
            parameter: `<strong>Kontrol: $\\sigma_{max} \\le q_a$</strong>`,
            isStatus: true,
            statusHtml: `<span class="${dayaDukung.status === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${dayaDukung.status || 'N/A'}</span>`
        });
        
        return createThreeColumnTable(rows, true);
    }
    
    function createGeserTable() {
        const kontrolGeser = getData('data.kontrolGeser', {});
        const fondasiMode = getData('data.actualFondasiMode', 'tunggal');
        
        let rows = [
            { parameter: "<strong>Kontrol Geser Satu Arah</strong>", hasil: "", satuan: "" },
            { parameter: "$V_{u1}$ (Gaya geser ultimit)", hasil: formatNumber(kontrolGeser.Vu1, 1), satuan: "kN" },
            { parameter: "$V_{c1}$ (Kapasitas geser beton)", hasil: formatNumber(kontrolGeser.Vc1, 1), satuan: "kN" },
            { 
                parameter: "$V_{u1} \\le V_{c1}$", 
                isComparison: true, 
                statusHtml: `<span class="${kontrolGeser.amanGeser1 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.amanGeser1 || 'N/A'}</span>` 
            },
            { parameter: "<strong>Kontrol Geser Dua Arah</strong>", hasil: "", satuan: "" },
            { parameter: "$V_{u2}$ (Gaya geser ultimit)", hasil: formatNumber(kontrolGeser.Vu2, 1), satuan: "kN" },
            { parameter: "$V_{c2,1}$ (Kapasitas geser formula 1)", hasil: formatNumber(kontrolGeser.Vc21, 1), satuan: "kN" },
            { parameter: "$V_{c2,2}$ (Kapasitas geser formula 2)", hasil: formatNumber(kontrolGeser.Vc22, 1), satuan: "kN" },
            { parameter: "$V_{c2,3}$ (Kapasitas geser formula 3)", hasil: formatNumber(kontrolGeser.Vc23, 1), satuan: "kN" },
            { parameter: "$V_{c2}$ (Kapasitas geser terkecil)", hasil: formatNumber(kontrolGeser.Vc2, 1), satuan: "kN" },
            { parameter: "$\\phi V_{c2}$ (Kapasitas geser terfaktor)", hasil: formatNumber(kontrolGeser.phiVc2, 1), satuan: "kN" },
            { 
                parameter: "$V_{u2} \\le \\phi V_{c2}$", 
                isComparison: true, 
                statusHtml: `<span class="${kontrolGeser.amanGeser2 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.amanGeser2 || 'N/A'}</span>` 
            }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    function createTulanganTable() {
        const tulangan = getData('data.tulangan', {});
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        let rows = [];
        
        if (fondasiMode === 'bujur_sangkar') {
            rows = [
                { parameter: "<strong>Fondasi Bujur Sangkar</strong>", hasil: "", satuan: "" },
                { parameter: "$\\sigma$ (Tegangan tanah di muka kolom)", hasil: formatNumber(tulangan.sigma, 2), satuan: "kPa" },
                { parameter: "$M_u$ (Momen ultimit)", hasil: formatNumber(tulangan.Mu, 1), satuan: "kNm/m" },
                { parameter: "$K = \\dfrac{M_u}{\\phi b d^2}$", hasil: formatNumber(tulangan.K, 3), satuan: "MPa" },
                { parameter: "$K_{max}$ (Batas parameter lentur)", hasil: formatNumber(getData('data.parameter.Kmax'), 3), satuan: "MPa" },
                { 
                    parameter: "$K \\le K_{max}$", 
                    isComparison: true, 
                    statusHtml: `<span class="${tulangan.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.Kontrol_K || 'N/A'}</span>` 
                },
                { parameter: "$a = \\left(1 - \\sqrt{1 - \\frac{2K}{0.85 f'_c}}\\right) d$", hasil: formatNumber(tulangan.a_val, 1), satuan: "mm" },
                { parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", hasil: formatNumber(tulangan.As1, 0), satuan: "mm²/m" },
                { parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", hasil: formatNumber(tulangan.As2, 0), satuan: "mm²/m" },
                { parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", hasil: formatNumber(tulangan.As3, 0), satuan: "mm²/m" },
                { parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", hasil: formatNumber(tulangan.As, 0), satuan: "mm²/m" },
                { parameter: "$s_1 = \\dfrac{0.25\\pi D^2 \\times 1000}{A_{s,perlu}}$", hasil: formatNumber(tulangan.s1, 0), satuan: "mm" },
                { parameter: "$s_2 = 3h$", hasil: formatNumber(tulangan.s2, 0), satuan: "mm" },
                { parameter: "$s = \\min(s_1, s_2, 450)$", hasil: formatNumber(tulangan.s, 0), satuan: "mm" },
                { parameter: `<strong>Digunakan: ɸ${getData('inputData.tulangan.d')}-${formatNumber(tulangan.s, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" }
            ];
        } else if (fondasiMode === 'persegi_panjang') {
            rows = [
                { parameter: "<strong>Fondasi Persegi Panjang - Arah Panjang</strong>", hasil: "", satuan: "" },
                { parameter: "$\\sigma$ (Tegangan tanah di muka kolom)", hasil: formatNumber(tulangan.bujur?.sigma, 2), satuan: "kPa" },
                { parameter: "$M_u$ (Momen ultimit)", hasil: formatNumber(tulangan.bujur?.Mu, 1), satuan: "kNm/m" },
                { parameter: "$K = \\dfrac{M_u}{\\phi b d^2}$", hasil: formatNumber(tulangan.bujur?.K, 3), satuan: "MPa" },
                { parameter: "$K_{max}$ (Batas parameter lentur)", hasil: formatNumber(getData('data.parameter.Kmax'), 3), satuan: "MPa" },
                { 
                    parameter: "$K \\le K_{max}$", 
                    isComparison: true, 
                    statusHtml: `<span class="${tulangan.bujur?.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.bujur?.Kontrol_K || 'N/A'}</span>` 
                },
                { parameter: "$A_{s,perlu}$", hasil: formatNumber(tulangan.bujur?.As, 0), satuan: "mm²/m" },
                { parameter: "$s$", hasil: formatNumber(tulangan.bujur?.s, 0), satuan: "mm" },
                { parameter: `<strong>Arah Panjang: ɸ${getData('inputData.tulangan.d')}-${formatNumber(tulangan.bujur?.s, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" },
                { parameter: "<strong>Fondasi Persegi Panjang - Arah Pendek</strong>", hasil: "", satuan: "" },
                { parameter: "$M_u$ (Momen ultimit)", hasil: formatNumber(tulangan.persegi?.Mu, 1), satuan: "kNm/m" },
                { parameter: "$K = \\dfrac{M_u}{\\phi b d^2}$", hasil: formatNumber(tulangan.persegi?.K, 3), satuan: "MPa" },
                { parameter: "$K_{max}$ (Batas parameter lentur)", hasil: formatNumber(getData('data.parameter.Kmax'), 3), satuan: "MPa" },
                { 
                    parameter: "$K \\le K_{max}$", 
                    isComparison: true, 
                    statusHtml: `<span class="${tulangan.persegi?.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.persegi?.Kontrol_K || 'N/A'}</span>` 
                },
                { parameter: "$A_{s,perlu}$", hasil: formatNumber(tulangan.persegi?.As, 0), satuan: "mm²/m" },
                { parameter: "$A_{s,pusat} = \\dfrac{2L_x A_s}{L_y + L_x}$", hasil: formatNumber(tulangan.persegi?.Aspusat, 0), satuan: "mm²/m" },
                { parameter: "$A_{s,tepi} = A_s - A_{s,pusat}$", hasil: formatNumber(tulangan.persegi?.Astepi, 0), satuan: "mm²/m" },
                { parameter: "$s_{pusat}$", hasil: formatNumber(tulangan.persegi?.s_pusat, 0), satuan: "mm" },
                { parameter: "$s_{tepi}$", hasil: formatNumber(tulangan.persegi?.s_tepi, 0), satuan: "mm" },
                { parameter: `<strong>Arah Pendek Pusat: ɸ${getData('inputData.tulangan.db')}-${formatNumber(tulangan.persegi?.s_pusat, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" },
                { parameter: `<strong>Arah Pendek Tepi: ɸ${getData('inputData.tulangan.db')}-${formatNumber(tulangan.persegi?.s_tepi, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" }
            ];
        } else if (fondasiMode === 'menerus') {
            rows = [
                { parameter: "<strong>Fondasi Menerus - Tulangan Utama</strong>", hasil: "", satuan: "" },
                { parameter: "$M_u$ (Momen ultimit)", hasil: formatNumber(tulangan.Mu, 1), satuan: "kNm/m" },
                { parameter: "$K = \\dfrac{M_u}{\\phi b d^2}$", hasil: formatNumber(tulangan.K, 3), satuan: "MPa" },
                { parameter: "$K_{max}$ (Batas parameter lentur)", hasil: formatNumber(getData('data.parameter.Kmax'), 3), satuan: "MPa" },
                { 
                    parameter: "$K \\le K_{max}$", 
                    isComparison: true, 
                    statusHtml: `<span class="${tulangan.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.Kontrol_K || 'N/A'}</span>` 
                },
                { parameter: "$A_{s,perlu}$", hasil: formatNumber(tulangan.As, 0), satuan: "mm²/m" },
                { parameter: "$s_{utama}$", hasil: formatNumber(tulangan.s_utama, 0), satuan: "mm" },
                { parameter: `<strong>Tulangan Utama: ɸ${getData('inputData.tulangan.d')}-${formatNumber(tulangan.s_utama, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" },
                { parameter: "<strong>Fondasi Menerus - Tulangan Bagi</strong>", hasil: "", satuan: "" },
                { parameter: "$A_{sb1} = A_s / 5$", hasil: formatNumber(tulangan.Asb1, 0), satuan: "mm²/m" },
                { parameter: "$A_{sb2}$ (Tulangan minimum SNI)", hasil: formatNumber(tulangan.Asb2, 0), satuan: "mm²/m" },
                { parameter: "$A_{sb3} = 0.0014 b h$", hasil: formatNumber(tulangan.Asb3, 0), satuan: "mm²/m" },
                { parameter: "$A_{sb,perlu} = \\max(A_{sb1}, A_{sb2}, A_{sb3})$", hasil: formatNumber(tulangan.Asb, 0), satuan: "mm²/m" },
                { parameter: "$s_{bagi}$", hasil: formatNumber(tulangan.s_bagi, 0), satuan: "mm" },
                { parameter: `<strong>Tulangan Bagi: ɸ${getData('inputData.tulangan.db')}-${formatNumber(tulangan.s_bagi, 0)}</strong>`, isFullRow: true, hasil: "", satuan: "" }
            ];
        }
        
        return createThreeColumnTable(rows, true);
    }
    
    function createKuatDukungTable() {
        const kuatDukung = getData('data.kuatDukung', {});
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        let rows = [
            { parameter: "<strong>Kontrol Kuat Dukung Aksial</strong>", hasil: "", satuan: "" },
            { parameter: "$A_1$ (Luas penampang kolom)", hasil: formatNumber(kuatDukung.A1, 0), satuan: "mm²" },
            { parameter: "$P_{u,cap} = 0.65 \\times 0.85 \\times f'_c \\times A_1$", hasil: formatNumber(kuatDukung.Pu_cap, 1), satuan: "kN" },
            { parameter: "$P_u$ (Beban aksial ultimit)", hasil: formatNumber(getData('inputData.beban.pu'), 1), satuan: "kN" },
            { 
                parameter: "$P_{u,cap} \\ge P_u$", 
                isComparison: true, 
                statusHtml: `<span class="${kuatDukung.Kontrol_Pu === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Pu || 'N/A'}</span>` 
            }
        ];
        
        if (fondasiMode === 'menerus') {
            rows = rows.concat([
                { parameter: "<strong>Kontrol Panjang Penyaluran (Tulangan Tarik)</strong>", hasil: "", satuan: "" },
                { parameter: "$l_t$ (Panjang penyaluran tersedia)", hasil: formatNumber(kuatDukung.It, 0), satuan: "mm" },
                { parameter: "$C_b$ (Jarak bersih atau setengah spasi)", hasil: formatNumber(kuatDukung.Cb, 0), satuan: "mm" },
                { parameter: "$C = \\min\\left(\\dfrac{C_b}{D_b}, 2.5\\right)$", hasil: formatNumber(kuatDukung.C, 2), satuan: "-" },
                { parameter: "$l_{dh1} = \\dfrac{f_y}{1.1\\lambda\\sqrt{f'_c}} \\times \\dfrac{0.8}{C} \\times D_b$", hasil: formatNumber(kuatDukung.Idh1, 0), satuan: "mm" },
                { parameter: "$l_{dh2} = 8D_b$", hasil: formatNumber(kuatDukung.Idh2, 0), satuan: "mm" },
                { parameter: "$l_{dh} = \\max(l_{dh1}, l_{dh2}, 300)$", hasil: formatNumber(kuatDukung.Idh, 0), satuan: "mm" },
                { 
                    parameter: "$l_t > l_{dh}$", 
                    isComparison: true, 
                    statusHtml: `<span class="${kuatDukung.Kontrol_Idh === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Idh || 'N/A'}</span>` 
                }
            ]);
        } else {
            rows = rows.concat([
                { parameter: "<strong>Kontrol Panjang Penyaluran (Tulangan Tarik)</strong>", hasil: "", satuan: "" },
                { parameter: "$l_t$ (Panjang penyaluran tersedia)", hasil: formatNumber(kuatDukung.It, 0), satuan: "mm" },
                { parameter: "$A_{s,perlu}$", hasil: formatNumber(kuatDukung.As_perlu, 0), satuan: "mm²" },
                { parameter: "$A_{s,terpasang}$", hasil: formatNumber(kuatDukung.Asterpasang, 0), satuan: "mm²" },
                { parameter: "$f_3 = \\dfrac{A_{s,perlu}}{A_{s,terpasang}}$", hasil: formatNumber(kuatDukung.f3, 2), satuan: "-" },
                { parameter: "$l_{dh1} = \\dfrac{0.24\\psi f_y}{\\lambda\\sqrt{f'_c}} \\times D \\times \\psi_e \\times \\psi_t \\times f_3$", hasil: formatNumber(kuatDukung.Idh1, 0), satuan: "mm" },
                { parameter: "$l_{dh2} = 8D$", hasil: formatNumber(kuatDukung.Idh2, 0), satuan: "mm" },
                { parameter: "$l_{dh} = \\max(l_{dh1}, l_{dh2}, 150)$", hasil: formatNumber(kuatDukung.Idh, 0), satuan: "mm" },
                { 
                    parameter: "$l_t > l_{dh}$", 
                    isComparison: true, 
                    statusHtml: `<span class="${kuatDukung.Kontrol_Idh === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Idh || 'N/A'}</span>` 
                }
            ]);
        }
        
        return createThreeColumnTable(rows, true);
    }

    // ==============================================
    // FUNGSI REKAPITULASI
    // ==============================================
    
    function createRekapitulasiTable() {
        const rekap = getData('rekap', {});
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        let html = '<table class="rekap-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th class="rekap-col-tulangan" style="width: 30%;">Parameter</th>';
        html += '<th class="rekap-col-tumpuan" style="width: 35%;">Nilai</th>';
        html += '<th class="rekap-col-lapangan" style="width: 35%;">Status</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        // Dimensi
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Dimensi Fondasi</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.dimensi || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">-</td>';
        html += '</tr>';
        
        // Tegangan tanah minimum
        const sigmaMinParts = (rekap.sigma_min || '').split('(');
        const sigmaMinValue = sigmaMinParts[0] || 'N/A';
        const sigmaMinStatus = sigmaMinParts[1] ? sigmaMinParts[1].replace(')', '') : 'N/A';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tegangan Tanah Minimum</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + sigmaMinValue.trim() + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + sigmaMinStatus.trim() + '</td>';
        html += '</tr>';
        
        // Daya dukung tanah
        const tanahParts = (rekap.tekanan_tanah || '').split('(');
        const tanahValue = tanahParts[0] || 'N/A';
        const tanahStatus = tanahParts[1] ? tanahParts[1].replace(')', '') : 'N/A';
        
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Daya Dukung Tanah</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + tanahValue.trim() + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + tanahStatus.trim() + '</td>';
        html += '</tr>';
        
        // Kontrol geser
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kontrol Geser</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.geser || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + (rekap.geser ? '✅' : '❌') + '</td>';
        html += '</tr>';
        
        // Kontrol K
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kontrol Parameter Lentur (K)</td>';
        html += '<td class="rekap-col-tumpuan text-center">-</td>';
        html += '<td class="rekap-col-lapangan text-center">' + (rekap.kontrol_K || 'N/A') + '</td>';
        html += '</tr>';
        
        // Kontrol kuat dukung
        html += '<tr>';
        html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kontrol Kuat Dukung</td>';
        html += '<td class="rekap-col-tumpuan text-center">' + (rekap.kuat_dukung || 'N/A') + '</td>';
        html += '<td class="rekap-col-lapangan text-center">' + (rekap.kuat_dukung ? '✅' : '❌') + '</td>';
        html += '</tr>';
        
        // Tulangan berdasarkan mode fondasi
        if (fondasiMode === 'bujur_sangkar') {
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Utama</td>';
            html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (rekap.tulangan_utama || 'N/A') + '</td>';
            html += '</tr>';
        } else if (fondasiMode === 'persegi_panjang') {
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Arah Panjang</td>';
            html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (rekap.tulangan_panjang || 'N/A') + '</td>';
            html += '</tr>';
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Arah Pendek (Pusat)</td>';
            html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (rekap.tulangan_pendek_pusat || 'N/A') + '</td>';
            html += '</tr>';
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Arah Pendek (Tepi)</td>';
            html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (rekap.tulangan_pendek_tepi || 'N/A') + '</td>';
            html += '</tr>';
        } else if (fondasiMode === 'menerus') {
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Utama</td>';
            html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (rekap.tulangan_utama || 'N/A') + '</td>';
            html += '</tr>';
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Tulangan Bagi</td>';
            html += '<td class="rekap-col-tumpuan text-center" colspan="2">' + (rekap.tulangan_bagi || 'N/A') + '</td>';
            html += '</tr>';
        }
        
        // Kontrol s minimal
        if (rekap.kontrol_s_minimal) {
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Kontrol Jarak Tulangan Min.</td>';
            html += '<td class="rekap-col-tumpuan text-center">-</td>';
            html += '<td class="rekap-col-lapangan text-center">' + rekap.kontrol_s_minimal + '</td>';
            html += '</tr>';
        }
        
        // Evaluasi tulangan (mode evaluasi)
        if (getData('mode') === 'evaluasi' && rekap.evaluasi_tulangan) {
            html += '<tr>';
            html += '<td class="rekap-col-tulangan text-bold vertical-middle">Evaluasi Tulangan</td>';
            html += '<td class="rekap-col-tumpuan text-center">-</td>';
            html += '<td class="rekap-col-lapangan text-center">' + rekap.evaluasi_tulangan + '</td>';
            html += '</tr>';
        }
        
        html += '</tbody>';
        html += '</table>';
        return html;
    }

    // ==============================================
    // FUNGSI KESIMPULAN DINAMIS
    // ==============================================
    
    function generateDynamicConclusion() {
        const statusFondasi = cekStatusFondasi();
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        const mode = getData('mode', 'desain');
        const dimensi = getData('inputData.fondasi.dimensi', {});
        const material = getData('inputData.material', {});
        const tanah = getData('inputData.tanah', {});
        const kontrol = getData('kontrol', {});
        
        let masalah = [];
        let rekomendasi = [];
        
        // Analisis masalah berdasarkan kontrol
        if (!kontrol.sigmaMinAman) {
            masalah.push("Tegangan tanah minimum negatif atau nol");
            rekomendasi.push("Perbesar dimensi fondasi atau kurangi momen");
        }
        
        if (!kontrol.dayaDukung?.aman) {
            masalah.push("Daya dukung tanah tidak mencukupi");
            rekomendasi.push("Perbesar dimensi fondasi atau perbaiki kondisi tanah");
        }
        
        if (!kontrol.geser?.aman1 || !kontrol.geser?.aman2) {
            masalah.push("Kontrol geser tidak aman");
            rekomendasi.push("Tingkatkan tinggi fondasi atau mutu beton");
        }
        
        if (!kontrol.tulangan?.aman) {
            masalah.push("Parameter lentur (K) melebihi batas");
            rekomendasi.push("Tingkatkan tinggi fondasi atau gunakan tulangan lebih banyak");
        }
        
        if (!kontrol.kuatDukung?.aman) {
            masalah.push("Kuat dukung aksial tidak mencukupi");
            rekomendasi.push("Perbesar dimensi kolom atau tingkatkan mutu beton");
        }
        
        if (!kontrol.tulanganTambahan?.aman) {
            masalah.push("Jarak tulangan kurang dari minimum");
            rekomendasi.push("Kurangi jarak tulangan sesuai syarat minimum");
        }
        
        if (mode === 'evaluasi' && kontrol.evaluasiTulangan && !kontrol.evaluasiTulangan.aman) {
            masalah.push("Tulangan terpasang tidak memenuhi kebutuhan");
            rekomendasi.push("Tambahkan tulangan atau kurangi jarak tulangan");
        }
        
        // Buat kesimpulan
        let conclusionHTML = `
            <div class="section-group">
                <h3>Kesimpulan</h3>
                <div class="conclusion-box">
                    <h4 style="text-align: center; ${statusFondasi === 'aman' ? 'color: #155724;' : 'color: #721c24;'} margin-bottom: 8px;">
                        <strong>STRUKTUR FONDASI ${getFondasiModeName(fondasiMode)} ${statusFondasi === 'aman' ? 'AMAN' : 'TIDAK AMAN'}</strong>
                    </h4>
        `;
        
        if (statusFondasi === 'aman') {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-aman">SEMUA KONTROL AMAN</span></p>
                <p>Struktur fondasi ${getFondasiModeName(fondasiMode)} dengan dimensi ${dimensi.lx || 'N/A'} m × ${dimensi.ly || 'N/A'} m memenuhi semua persyaratan:</p>
                <ul>
                    <li>Tegangan tanah merata dan positif</li>
                    <li>Daya dukung tanah mencukupi</li>
                    <li>Kuat geser satu dan dua arah aman</li>
                    <li>Tulangan memenuhi kebutuhan lentur</li>
                    <li>Kuat dukung aksial kolom mencukupi</li>
                    <li>Detail tulangan memenuhi persyaratan</li>
                </ul>
            `;
            
            // Rekomendasi untuk kondisi aman
            rekomendasi = [
                "Gunakan mutu beton f'c = " + (material.fc || 'N/A') + " MPa sesuai perhitungan",
                "Gunakan mutu baja fy = " + (material.fy || 'N/A') + " MPa",
                "Pasang tulangan sesuai hasil perhitungan",
                "Pastikan pelaksanaan sesuai spesifikasi teknis",
                "Lakukan pengawasan ketat selama pelaksanaan"
            ];
        } else {
            conclusionHTML += `
                <p><strong>Status:</strong> <span class="status-tidak-aman">TIDAK AMAN - PERLU PERBAIKAN DESAIN</span></p>
                <p>Ditemukan masalah pada beberapa aspek desain:</p>
                <div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                    ${masalah.length > 0 ? masalah.map(m => `<p class="problem-item">• ${m}</p>`).join('') : '<p class="problem-item">• Terdapat masalah pada satu atau lebih kontrol keamanan</p>'}
                </div>
            `;
            
            if (rekomendasi.length === 0) {
                rekomendasi = [
                    "Tinjau kembali dimensi fondasi",
                    "Evaluasi ulang parameter tanah",
                    "Pertimbangkan untuk meningkatkan mutu material",
                    "Periksa kembali konfigurasi tulangan"
                ];
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
                <strong>Catatan:</strong> Hasil perhitungan ini berdasarkan SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung) 
                dan SNI 8460:2017 (Persyaratan Perancangan Geoteknik). Pastikan semua aspek konstruksi sesuai dengan spesifikasi teknis 
                dan dilakukan pengawasan yang memadai.
            </p>
        `;
        
        conclusionHTML += `
                </div>
            </div>
        `;
        
        return conclusionHTML;
    }
    
    function getFondasiModeName(mode) {
        switch(mode) {
            case 'bujur_sangkar': return 'BUJUR SANGKAR';
            case 'persegi_panjang': return 'PERSEGI PANJANG';
            case 'menerus': return 'MENERUS';
            default: return 'TUNGGAL';
        }
    }

    // ==============================================
    // FUNGSI UTAMA: GENERATE CONTENT BLOCKS
    // ==============================================
    
    function generateContentBlocks() {
        const blocks = [];
        const statusFondasi = cekStatusFondasi();
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        // Header
        blocks.push(`
            <h1>LAPORAN PERHITUNGAN FONDASI</h1>
            <div class="header-info">
                <div>
                    <span><strong>Mode:</strong> ${getData('mode', 'N/A').toUpperCase()}</span>
                    <span><strong>Tipe Fondasi:</strong> ${getFondasiModeName(fondasiMode)}</span>
                </div>
                <div>
                    <span><strong>Tanggal:</strong> ${formatTimestampFull(getData('timestamp'))}</span>
                    <span><strong>Status:</strong> <span class="${statusFondasi === 'aman' ? 'status-aman' : 'status-tidak-aman'}">${statusFondasi.toUpperCase()}</span></span>
                </div>
            </div>
            <h2>A. DATA INPUT DAN PARAMETER</h2>
        `);
        
        // Data Input
        blocks.push(`
            <div class="section-group">
                <h3>1. Dimensi Fondasi dan Tulangan</h3>
                ${createDimensiTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Material Beton dan Baja</h3>
                ${createMaterialTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>3. Beban Struktur</h3>
                ${createBebanTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>4. Parameter Tanah</h3>
                ${createTanahTable()}
            </div>
        `);
        
        // Perhitungan
        blocks.push(`
            <div class="header-content-group">
                <h2>B. PERHITUNGAN PARAMETER FONDASI</h2>
            </div>
            <div class="section-group">
                <h3>1. Parameter Geometri dan Beban</h3>
                ${createParameterTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>C. PERHITUNGAN DAYA DUKUNG TANAH</h2>
            </div>
            <div class="section-group">
                <h3>1. Analisis Daya Dukung</h3>
                ${createDayaDukungTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>D. KONTROL GESER</h2>
            </div>
            <div class="section-group">
                <h3>1. Kontrol Geser Satu dan Dua Arah</h3>
                ${createGeserTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>E. PERHITUNGAN TULANGAN</h2>
            </div>
            <div class="section-group">
                <h3>1. Kebutuhan Tulangan Lentur</h3>
                ${createTulanganTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group">
                <h2>F. KONTROL KUAT DUKUNG</h2>
            </div>
            <div class="section-group">
                <h3>1. Kuat Dukung Aksial dan Panjang Penyaluran</h3>
                ${createKuatDukungTable()}
            </div>
        `);
        
        // Rekapitulasi dan Kesimpulan
        blocks.push(`
            <div class="header-content-group">
                <h2>G. REKAPITULASI HASIL</h2>
            </div>
            <div class="section-group">
                <h3>1. Ringkasan Hasil Perhitungan</h3>
                ${createRekapitulasiTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Ringkasan Kontrol Keamanan</h3>
                ${createTwoColumnTable([
                    { 
                        parameter: "$\\sigma_{min} > 0$", 
                        statusHtml: `<span class="${getData('kontrol.sigmaMinAman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.sigmaMinAman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
                    },
                    { 
                        parameter: "$\\sigma_{max} \\le q_a$", 
                        statusHtml: `<span class="${getData('kontrol.dayaDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.dayaDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
                    },
                    { 
                        parameter: "$V_{u1} \\le V_{c1}$ (Geser 1 arah)", 
                        statusHtml: `<span class="${getData('kontrol.geser.aman1', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.geser.aman1', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
                    },
                    { 
                        parameter: "$V_{u2} \\le \\phi V_{c2}$ (Geser 2 arah)", 
                        statusHtml: `<span class="${getData('kontrol.geser.aman2', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.geser.aman2', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
                    },
                    { 
                        parameter: "$K \\le K_{max}$", 
                        statusHtml: `<span class="${getData('kontrol.tulangan.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.tulangan.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
                    },
                    { 
                        parameter: "$P_{u,cap} \\ge P_u$", 
                        statusHtml: `<span class="${getData('kontrol.kuatDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.kuatDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
                    }
                ])}
            </div>
        `);
        
        // Kesimpulan
        blocks.push(generateDynamicConclusion());
        
        // Referensi
        blocks.push(`
            <p class="note" style="margin-top: 10px;">
                <strong>Referensi:</strong> SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung), 
                SNI 8460:2017 (Persyaratan Perancangan Geoteknik)
            </p>
        `);
        
        return blocks;
    }

    // ==============================================
    // EKSPOS FUNGSI KE GLOBAL SCOPE
    // ==============================================
    
    window.fondasiReport = {
        setData: setData,
        generateContentBlocks: generateContentBlocks,
        cekStatusFondasi: cekStatusFondasi,
        formatNumber: formatNumber,
        getData: getData
    };
})();