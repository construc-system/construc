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

    // FUNGSI FORMAT NUMBER FLEKSIBEL
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
            html += '<th class="col-param" style="text-align: center;">Parameter</th>';
            html += '<th class="col-value" style="text-align: center;">Data</th>';
            html += '<th class="col-unit" style="text-align: center;">Satuan</th>';
            html += '</tr>';
        } else {
            html += '<tr>';
            html += '<th class="col-param" style="text-align: center;">Parameter Perhitungan</th>';
            html += '<th class="col-value" style="text-align: center;">Hasil</th>';
            html += '<th class="col-unit" style="text-align: center;">Satuan</th>';
            html += '</tr>';
        }
        
        rows.forEach(row => {
            const isHeader = row.parameter.includes('<strong>') && !row.hasil;
            const rowClass = isHeader ? 'header-row' : '';
            
            if (row.isFullRow) {
                html += `
                    <tr class="${rowClass}">
                        <td class="col-full-width" colspan="3">
                            ${row.parameter}
                        </td>
                    </tr>
                `;
            } else if (row.isStatus && withStatus) {
                html += `
                    <tr class="${rowClass}">
                        <td class="col-param">${row.parameter}</td>
                        <td class="col-status-merged" colspan="2">
                            ${row.statusHtml}
                        </td>
                    </tr>
                `;
            } else if (row.isComparison && withStatus) {
                html += `
                    <tr class="${rowClass}">
                        <td class="col-param rumus-kondisi">${row.parameter}</td>
                        <td class="col-status-merged" colspan="2">
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
                        <td class="col-value">${hasilTampilan}</td>
                        <td class="col-unit">${satuanTampilan}</td>
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
        html += '<th class="col-param-2" style="text-align: center;">Parameter</th>';
        html += '<th class="col-status-2" style="text-align: center;">Status</th>';
        html += '</tr>';
        
        rows.forEach(row => {
            if (row.isFullRow) {
                html += `
                    <tr>
                        <td class="col-full-width" colspan="2">
                            ${row.parameter}
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td class="col-param-2">${row.parameter}</td>
                        <td class="col-status-2">${row.statusHtml}</td>
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
    
    function createMaterialDimensiTable() {
        const fondasi = getData('inputData.fondasi.dimensi', {});
        const material = getData('inputData.material', {});
        
        const rows = [
            { parameter: "$L_x$ (Panjang arah x)", hasil: formatNumber(fondasi.lx), satuan: "m" },
            { parameter: "$L_y$ (Panjang arah y)", hasil: formatNumber(fondasi.ly), satuan: "m" },
            { parameter: "$B_x$ (Lebar kolom arah x)", hasil: formatNumber(fondasi.bx), satuan: "mm" },
            { parameter: "$B_y$ (Lebar kolom arah y)", hasil: formatNumber(fondasi.by), satuan: "mm" },
            { parameter: "$h$ (Tinggi fondasi)", hasil: formatNumber(fondasi.h), satuan: "m" },
            { parameter: "$\\alpha_s$ (Faktor letak fondasi)", hasil: formatNumber(fondasi.alpha_s), satuan: "-" },
            { parameter: "$f'_c$ (Kuat tekan beton)", hasil: formatNumber(material.fc), satuan: "MPa" },
            { parameter: "$f_y$ (Tegangan leleh baja)", hasil: formatNumber(material.fy), satuan: "MPa" },
            { parameter: "$\\gamma_c$ (Berat jenis beton)", hasil: formatNumber(material.gammaC), satuan: "kN/m³" },
            { parameter: "$\\lambda$ (Faktor reduksi beton ringan)", hasil: formatNumber(material.lambda || 1), satuan: "-" }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }
    
    function createTanahTable() {
        const tanah = getData('inputData.tanah', {});
        const tanahMode = getData('inputData.tanah.mode', 'auto');
        
        let rows = [];
        
        if (tanahMode === 'manual') {
            // Mode manual: hanya tampilkan qa, Df, dan gamma
            const manual = tanah.manual || {};
            rows.push({ parameter: "$q_a$ (Daya dukung tanah ijin)", hasil: formatNumber(manual.qa), satuan: "kPa" });
            rows.push({ parameter: "$D_f$ (Kedalaman fondasi)", hasil: formatNumber(manual.df), satuan: "m" });
            rows.push({ parameter: "$\\gamma$ (Berat jenis tanah)", hasil: formatNumber(manual.gamma), satuan: "kN/m³" });
        } else {
            // Mode auto: tampilkan data sesuai dengan yang diisi
            const auto = tanah.auto || {};
            
            if (auto.df && auto.df !== 'N/A') {
                rows.push({ parameter: "$D_f$ (Kedalaman fondasi)", hasil: formatNumber(auto.df), satuan: "m" });
            }
            
            if (auto.gamma && auto.gamma !== 'N/A') {
                rows.push({ parameter: "$\\gamma$ (Berat jenis tanah)", hasil: formatNumber(auto.gamma), satuan: "kN/m³" });
            }
            
            // Tampilkan parameter untuk Terzaghi jika aktif
            if (auto.terzaghi === true || auto.terzaghi === 'true') {
                if (auto.phi && auto.phi !== 'N/A') {
                    rows.push({ parameter: "$\\phi$ (Sudut geser dalam)", hasil: formatNumber(auto.phi), satuan: "°" });
                }
                if (auto.c && auto.c !== 'N/A') {
                    rows.push({ parameter: "$c$ (Kohesi)", hasil: formatNumber(auto.c), satuan: "kPa" });
                }
            }
            
            // Tampilkan parameter untuk Meyerhof jika aktif
            if (auto.mayerhoff === true || auto.mayerhoff === 'true') {
                if (auto.qc && auto.qc !== 'N/A') {
                    rows.push({ parameter: "$q_c$ (Tekanan konus)", hasil: formatNumber(auto.qc), satuan: "kPa" });
                }
            }
        }
        
        return createThreeColumnTable(rows, false, true);
    }
    
    function createBebanTable() {
        const beban = getData('inputData.beban', {});
        
        const rows = [
            { parameter: "$P_u$ (Beban aksial ultimit)", hasil: formatNumber(beban.pu), satuan: "kN" },
            { parameter: "$M_{ux}$ (Momen ultimit arah x)", hasil: formatNumber(beban.mux), satuan: "kNm" },
            { parameter: "$M_{uy}$ (Momen ultimit arah y)", hasil: formatNumber(beban.muy), satuan: "kNm" }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }
    
    function createTulanganTable() {
        const mode = getData('mode', 'desain');
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        // Coba ambil dari berbagai lokasi
        let tulangan = getData('inputData.tulangan', {});
        
        // Jika tidak ada di inputData, coba ambil dari session storage atau data hasil optimasi
        if (!tulangan || Object.keys(tulangan).length === 0) {
            // Cek dari data optimasi
            const optimasi = getData('optimasi.kombinasi_terpilih', {});
            const asRincian = getData('optimasi.as_rincian_per_meter', {});
            
            if (optimasi.D || optimasi.Db) {
                tulangan = {
                    d: optimasi.D,
                    db: optimasi.Db,
                    s: asRincian?.spasiUtama || 'N/A',
                    sp: asRincian?.spasiPusat || 'N/A',
                    st: asRincian?.spasiTepi || 'N/A',
                    sb: 'N/A'
                };
            } else {
                // Default values jika tidak ditemukan
                tulangan = {
                    d: 'N/A',
                    db: 'N/A',
                    s: 'N/A',
                    sp: 'N/A',
                    st: 'N/A',
                    sb: 'N/A'
                };
            }
        }
        
        const rows = [
            { parameter: "$D$ (Diameter tulangan utama)", hasil: formatNumber(tulangan.d), satuan: "mm" },
            { parameter: "$D_b$ (Diameter tulangan bagi)", hasil: formatNumber(tulangan.db), satuan: "mm" }
        ];
        
        // Mode evaluasi: tampilkan jarak tulangan sesuai jenis fondasi
        if (mode === 'evaluasi') {
            if (fondasiMode === 'bujur_sangkar') {
                // Tunggal persegi: hanya jarak tulangan utama
                rows.push({ parameter: "$s$ (Jarak tulangan utama)", hasil: formatNumber(tulangan.s), satuan: "mm" });
            } else if (fondasiMode === 'persegi_panjang') {
                // Tunggal persegi panjang: jarak tulangan utama, pendek pusat, dan tepi
                rows.push({ parameter: "$s$ (Jarak tulangan utama arah panjang)", hasil: formatNumber(tulangan.s), satuan: "mm" });
                rows.push({ parameter: "$s_p$ (Jarak tulangan pendek pusat)", hasil: formatNumber(tulangan.sp), satuan: "mm" });
                rows.push({ parameter: "$s_t$ (Jarak tulangan pendek tepi)", hasil: formatNumber(tulangan.st), satuan: "mm" });
            } else if (fondasiMode === 'menerus') {
                // Menerus: jarak tulangan utama dan tulangan bagi
                rows.push({ parameter: "$s$ (Jarak tulangan utama)", hasil: formatNumber(tulangan.s), satuan: "mm" });
                rows.push({ parameter: "$s_b$ (Jarak tulangan bagi)", hasil: formatNumber(tulangan.sb), satuan: "mm" });
            }
        }
        // Mode desain: tidak menampilkan jarak tulangan
        
        return createThreeColumnTable(rows, false, true);
    }
    
    function createParameterTable() {
        const parameter = getData('data.parameter', {});
        const material = getData('inputData.material', {});
        const fondasi = getData('inputData.fondasi.dimensi', {});
        const beban = getData('inputData.beban', {});
        const tanah = getData('inputData.tanah', {});
        const tanahMode = getData('inputData.tanah.mode', 'auto');
        
        const fc = material.fc || 20;
        
        // Hitung nilai-nilai yang diperlukan
        const Lx = fondasi.lx || 0;
        const Ly = fondasi.ly || 0;
        const Pu = beban.pu || 0;
        const Mux = beban.mux || 0;
        const Muy = beban.muy || 0;
        const q = parameter.q || 0;
        
        // Hitung beta1 seperti di pelat.js
        const beta1_calc = fc <= 28 ? 0.85 : (fc < 55 ? 0.85 - 0.05 * ((fc - 28) / 7) : 0.65);
        
        // Buat rows dasar
        let rows = [
            { 
                parameter: "$d_s = s_{beton} + \\dfrac{D}{2}$", 
                hasil: formatNumber(parameter.ds), 
                satuan: "mm" 
            },
            { 
                parameter: "$d'_s = s_{beton} + D + \\dfrac{D}{2}$", 
                hasil: formatNumber(parameter.ds2), 
                satuan: "mm" 
            },
            { 
                parameter: "$d = h - d_s$", 
                hasil: formatNumber(parameter.d), 
                satuan: "mm" 
            },
            { 
                parameter: "$d' = h - d'_s$", 
                hasil: formatNumber(parameter.d2), 
                satuan: "mm" 
            },
            { 
                parameter: "$a = \\dfrac{L_y}{2} - \\dfrac{B_y}{2} - d$", 
                hasil: formatNumber(parameter.a), 
                satuan: "m" 
            },
            { 
                parameter: "$q = h \\cdot \\gamma_c + (D_f - h) \\cdot \\gamma$", 
                hasil: formatNumber(parameter.q), 
                satuan: "kPa" 
            },
            { 
                // Rumus sigma_min yang baru - DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                parameter: "$\\displaystyle \\sigma_{min} = \\dfrac{P_u}{L_x L_y} - \\dfrac{M_{ux}}{\\frac{1}{6} L_x L_y^{2}} - \\dfrac{M_{uy}}{\\frac{1}{6} L_y L_x^{2}} + q$", 
                hasil: formatNumber(parameter.sigma_min, 2), 
                satuan: "kPa" 
            },
            { 
                // Kontrol sigma_min > 0 dipindah di bawah sigma_min
                parameter: "$\\sigma_{min} > 0$", 
                isStatus: true, 
                statusHtml: `<span class="${parameter.sigma_status === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${parameter.sigma_status || 'N/A'}</span>` 
            },
            { 
                // Rumus sigma_max yang baru - DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                parameter: "$\\displaystyle \\sigma_{max} = \\dfrac{P_u}{L_x L_y} + \\dfrac{M_{ux}}{\\frac{1}{6} L_x L_y^{2}} + \\dfrac{M_{uy}}{\\frac{1}{6} L_y L_x^{2}} + q$", 
                hasil: formatNumber(parameter.sigma_max, 2), 
                satuan: "kPa" 
            },
            { 
                parameter: "$\\sigma_a = \\sigma_{min} + (L_y - a) \\cdot \\dfrac{\\sigma_{max} - \\sigma_{min}}{L_y}$", 
                hasil: formatNumber(parameter.sigma_a, 2), 
                satuan: "kPa" 
            }
        ];
        
        // Jika mode manual, tambahkan kontrol sigma_max <= qa
        if (tanahMode === 'manual') {
            rows.push({ 
                parameter: "$\\sigma_{max} \\le q_a$", 
                isStatus: true, 
                statusHtml: `<span class="${getData('kontrol.dayaDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.dayaDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            });
        }
        
        // Tambahkan parameter lainnya
        rows = rows.concat([
            { 
                parameter: "$x_1 = \\dfrac{L_y}{2} - \\dfrac{B_y}{2}$", 
                hasil: formatNumber(parameter.x1), 
                satuan: "m" 
            },
            { 
                parameter: "$x_2 = \\dfrac{L_x}{2} - \\dfrac{B_x}{2}$", 
                hasil: formatNumber(parameter.x2), 
                satuan: "m" 
            },
            { 
                parameter: "$b_0 = 2 \\times (B_x + d) + 2 \\times (B_y + d)$", 
                hasil: formatNumber(parameter.b0), 
                satuan: "mm" 
            },
            { 
                // Diubah: format beta1 seperti di pelat.js
                parameter: "$\\displaystyle \\beta_1 = \\begin{cases} 0.85 & f'_c \\leq 28 \\text{ MPa} \\\\ 0.85 - 0.05\\dfrac{f'_c - 28}{7} & 28 < f'_c < 55 \\text{ MPa} \\\\ 0.65 & f'_c \\geq 55 \\text{ MPa} \\end{cases}$", 
                hasil: formatNumber(parameter.beta1 || beta1_calc), 
                satuan: "-" 
            },
            { 
                // Diubah: menggunakan kurung kurawal untuk pangkat
                parameter: "$\\displaystyle K_{\\max} = \\dfrac{382.5 \\beta_1 f'_c (600 + f_y - 225 \\beta_1)}{(600 + f_y)^{2}}$", 
                hasil: formatNumber(parameter.Kmax), 
                satuan: "MPa" 
            }
        ]);
        
        return createThreeColumnTable(rows, true);
    }

    function createDayaDukungTable() {
        const tanahMode = getData('inputData.tanah.mode', 'auto');
        
        // Jika mode manual, tidak ada perhitungan daya dukung tanah
        if (tanahMode === 'manual') {
            return '<p class="note">Mode tanah: manual. Daya dukung tanah langsung dari input (tidak ada perhitungan).</p>';
        }
        
        // Mode auto: ambil data perhitungan
        const dayaDukung = getData('data.dayaDukung', {});
        const tanah = getData('inputData.tanah', {});
        const auto = tanah.auto || {};
        
        let tablesHTML = '';
        
        // Periksa metode mana yang aktif
        const terzaghiAktif = auto.terzaghi === true || auto.terzaghi === 'true';
        const meyerhofAktif = auto.mayerhoff === true || auto.mayerhoff === 'true';
        
        // Tabel 1: Perhitungan Meyerhof (jika aktif)
        if (meyerhofAktif) {
            let rowsMeyerhof = [];
            
            if (dayaDukung.Kd && dayaDukung.Kd !== 'N/A') {
                rowsMeyerhof.push({ 
                    parameter: "$K_d = 1 + 0.33 \\dfrac{D_f}{L_x} \\le 1.33$", 
                    hasil: formatNumber(dayaDukung.Kd), 
                    satuan: "-" 
                });
            }
            
            if (dayaDukung.qa_meyerhof && dayaDukung.qa_meyerhof !== 'N/A') {
                rowsMeyerhof.push({ 
                    // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                    parameter: "$\\displaystyle q_{a, Meyerhof} = \\dfrac{q_c}{33} \\cdot \\left(\\dfrac{L_x + 0.3}{L_x}\\right)^{2} \\cdot K_d \\times 100$", 
                    hasil: formatNumber(dayaDukung.qa_meyerhof), 
                    satuan: "kPa" 
                });
            }
            
            if (rowsMeyerhof.length > 0) {
                tablesHTML += `
                    <div class="section-subgroup">
                        <h4>1. Metode Meyerhof</h4>
                        ${createThreeColumnTable(rowsMeyerhof)}
                    </div>
                `;
            }
        }
        
        // Tabel 2: Perhitungan Terzaghi (jika aktif)
        if (terzaghiAktif) {
            let rowsTerzaghi = [];
            
            if (dayaDukung.phi_rad && dayaDukung.phi_rad !== 'N/A') {
                rowsTerzaghi.push({ 
                    parameter: "$\\phi_{rad} = \\phi \\times \\dfrac{\\pi}{180}$", 
                    hasil: formatNumber(dayaDukung.phi_rad), 
                    satuan: "rad" 
                });
            }
            
            if (dayaDukung.a && dayaDukung.a !== 'N/A') {
                rowsTerzaghi.push({ 
                    parameter: "$a = e^{\\left(\\frac{3\\pi}{4} - \\frac{\\phi_{rad}}{2}\\right) \\tan(\\phi_{rad})}$", 
                    hasil: formatNumber(dayaDukung.a), 
                    satuan: "-" 
                });
            }
            
            if (dayaDukung.Kp_gamma && dayaDukung.Kp_gamma !== 'N/A') {
                rowsTerzaghi.push({ 
                    // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                    parameter: "$K_{p\\gamma} = 3 \\tan^{2}\\left(45^\\circ + \\dfrac{\\phi + 33^\\circ}{2}\\right)$", 
                    hasil: formatNumber(dayaDukung.Kp_gamma), 
                    satuan: "-" 
                });
            }
            
            if (dayaDukung.Nc && dayaDukung.Nc !== 'N/A') {
                rowsTerzaghi.push({ 
                    // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                    parameter: "$\\displaystyle N_c = \\dfrac{1}{\\tan(\\phi_{rad})} \\left(\\dfrac{a^{2}}{2 \\cos^{2}\\left(\\frac{\\pi}{4} + \\frac{\\phi_{rad}}{2}\\right)} - 1\\right)$", 
                    hasil: formatNumber(dayaDukung.Nc), 
                    satuan: "-" 
                });
            }
            
            if (dayaDukung.Nq && dayaDukung.Nq !== 'N/A') {
                rowsTerzaghi.push({ 
                    // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                    parameter: "$\\displaystyle N_q = \\dfrac{a^{2}}{2 \\cos^{2}\\left(\\frac{\\pi}{4} + \\frac{\\phi_{rad}}{2}\\right)}$", 
                    hasil: formatNumber(dayaDukung.Nq), 
                    satuan: "-" 
                });
            }
            
            if (dayaDukung.Ngamma && dayaDukung.Ngamma !== 'N/A') {
                rowsTerzaghi.push({ 
                    // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                    parameter: "$\\displaystyle N_\\gamma = 0.5 \\tan(\\phi_{rad}) \\left(\\dfrac{K_{p\\gamma}}{\\cos^{2}(\\phi_{rad})} - 1\\right)$", 
                    hasil: formatNumber(dayaDukung.Ngamma), 
                    satuan: "-" 
                });
            }
            
            if (dayaDukung.qu_terzaghi && dayaDukung.qu_terzaghi !== 'N/A') {
                rowsTerzaghi.push({ 
                    // Diubah: rumus qu Terzaghi yang lebih ringkas
                    parameter: "$q_u = c N_c \\left(1 + 0.3 \\frac{L_x}{L_y}\\right) + \\gamma D_f N_q + 0.5 \\gamma L_x N_\\gamma \\left(1 - 0.2 \\frac{L_x}{L_y}\\right)$", 
                    hasil: formatNumber(dayaDukung.qu_terzaghi), 
                    satuan: "kPa" 
                });
            }
            
            if (dayaDukung.qa_terzaghi && dayaDukung.qa_terzaghi !== 'N/A') {
                rowsTerzaghi.push({ 
                    parameter: "$q_{a, Terzaghi} = \\dfrac{q_u}{3}$", 
                    hasil: formatNumber(dayaDukung.qa_terzaghi), 
                    satuan: "kPa" 
                });
            }
            
            if (rowsTerzaghi.length > 0) {
                tablesHTML += `
                    <div class="section-subgroup">
                        <h4>${meyerhofAktif ? '2. ' : '1. '}Metode Terzaghi</h4>
                        ${createThreeColumnTable(rowsTerzaghi)}
                    </div>
                `;
            }
        }
        
        // Tabel 3: Kapasitas Dukung yang Digunakan
        let rowsKapasitas = [];
        
        if (terzaghiAktif && meyerhofAktif) {
            // Kedua metode aktif: qa adalah nilai minimum
            rowsKapasitas.push({ 
                parameter: "$q_a = \\min(q_{a, Terzaghi}, q_{a, Meyerhof})$", 
                hasil: formatNumber(dayaDukung.qa), 
                satuan: "kPa" 
            });
        } else if (terzaghiAktif) {
            // Hanya Terzaghi aktif
            rowsKapasitas.push({ 
                parameter: "$q_a = q_{a, Terzaghi}$", 
                hasil: formatNumber(dayaDukung.qa), 
                satuan: "kPa" 
            });
        } else if (meyerhofAktif) {
            // Hanya Meyerhof aktif
            rowsKapasitas.push({ 
                parameter: "$q_a = q_{a, Meyerhof}$", 
                hasil: formatNumber(dayaDukung.qa), 
                satuan: "kPa" 
            });
        }
        
        // Tambahkan kontrol sigma_max <= qa untuk mode auto
        if (rowsKapasitas.length > 0) {
            rowsKapasitas.push({
                parameter: "$\\sigma_{max} \\le q_a$",
                isStatus: true,
                statusHtml: `<span class="${getData('kontrol.dayaDukung.aman', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.dayaDukung.aman', false) ? 'AMAN' : 'TIDAK AMAN'}</span>`
            });
        }
        
        // Hanya tambahkan tabel kapasitas jika ada data
        if (rowsKapasitas.length > 0) {
            let tableNumber = 1;
            if (terzaghiAktif) tableNumber++;
            if (meyerhofAktif) tableNumber++;
            
            tablesHTML += `
                <div class="section-subgroup">
                    <h4>${tableNumber}. Kapasitas Dukung yang Digunakan</h4>
                    ${createThreeColumnTable(rowsKapasitas, true)}
                </div>
            `;
        }
        
        return tablesHTML;
    }
    
    // ==============================================
    // FUNGSI KONTROL GESER YANG DIPERBAIKI
    // ==============================================
    
    function createGeserSatuArahTable() {
        const kontrolGeser = getData('data.kontrolGeser', {});
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        const parameter = getData('data.parameter', {});
        const input = getData('inputData', {});
        
        let rows = [];
        
        if (fondasiMode === 'menerus') {
            // Rumus untuk fondasi menerus
            rows = [
                { 
                    parameter: "$V_u = a \\cdot L_y \\cdot \\sigma_{max}$", 
                    hasil: formatNumber(kontrolGeser.Vu1), 
                    satuan: "kN" 
                },
                { 
                    parameter: "$V_c = \\phi \\cdot 0.17 \\cdot \\lambda \\cdot \\sqrt{f'_c} \\cdot B_y \\cdot d$", 
                    hasil: formatNumber(kontrolGeser.Vc1), 
                    satuan: "kN" 
                }
            ];
        } else {
            // Rumus untuk fondasi tunggal (bujur_sangkar atau persegi_panjang)
            rows = [
                { 
                    parameter: "$V_u = a \\cdot L_x \\cdot \\dfrac{\\sigma_{max} + \\sigma_a}{2}$", 
                    hasil: formatNumber(kontrolGeser.Vu1), 
                    satuan: "kN" 
                },
                { 
                    parameter: "$V_c = \\phi \\cdot 0.17 \\cdot \\lambda \\cdot \\sqrt{f'_c} \\cdot L_x \\cdot d$", 
                    hasil: formatNumber(kontrolGeser.Vc1), 
                    satuan: "kN" 
                }
            ];
        }
        
        // Tambahkan status kontrol
        rows.push({ 
            parameter: "$V_u \\le V_c$", 
            isComparison: true, 
            statusHtml: `<span class="${kontrolGeser.amanGeser1 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.amanGeser1 || 'N/A'}</span>` 
        });
        
        return createThreeColumnTable(rows, true);
    }
    
    function createGeserDuaArahTable() {
        const kontrolGeser = getData('data.kontrolGeser', {});
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        const parameter = getData('data.parameter', {});
        
        let rows = [];
        
        if (fondasiMode === 'menerus') {
            // Rumus untuk fondasi menerus (DIPERBAIKI: menghilangkan /1000)
            rows = [
                { 
                    parameter: "$V_u = \\left(L_x - B_x - d\\right) \\cdot L_y \\cdot \\dfrac{\\sigma_{max} + \\sigma_{min}}{2}$", 
                    hasil: formatNumber(kontrolGeser.Vu2), 
                    satuan: "kN" 
                }
            ];
        } else {
            // Rumus untuk fondasi tunggal - DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
            rows = [
                { 
                    parameter: "$V_u = \\left[L_x \\cdot L_y - \\dfrac{(B_x + d)(B_y + d)}{10^{6}}\\right] \\cdot \\dfrac{\\sigma_{max} + \\sigma_{min}}{2}$", 
                    hasil: formatNumber(kontrolGeser.Vu2), 
                    satuan: "kN" 
                }
            ];
        }
        
        // Tambahkan perhitungan Vc
        rows = rows.concat([
            { 
                parameter: "$V_{c1} = 0.17 \\left(1 + \\dfrac{2}{B_y/B_x}\\right) \\lambda \\sqrt{f'_c} b_0 d$", 
                hasil: formatNumber(kontrolGeser.Vc21), 
                satuan: "kN" 
            },
            { 
                parameter: "$V_{c2} = 0.083 \\left(2 + \\dfrac{\\alpha_s d}{b_0}\\right) \\lambda \\sqrt{f'_c} b_0 d$", 
                hasil: formatNumber(kontrolGeser.Vc22), 
                satuan: "kN" 
            },
            { 
                parameter: "$V_{c3} = 0.33 \\sqrt{f'_c} b_0 d$", 
                hasil: formatNumber(kontrolGeser.Vc23), 
                satuan: "kN" 
            },
            { 
                parameter: "$V_c = \\min(V_{c1}, V_{c2}, V_{c3})$", 
                hasil: formatNumber(kontrolGeser.Vc2), 
                satuan: "kN" 
            },
            { 
                parameter: "$\\phi V_c = \\phi \\cdot V_c$", 
                hasil: formatNumber(kontrolGeser.phiVc2), 
                satuan: "kN" 
            },
            { 
                parameter: "$V_u \\le \\phi V_c$", 
                isComparison: true, 
                statusHtml: `<span class="${kontrolGeser.amanGeser2 === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.amanGeser2 || 'N/A'}</span>` 
            }
        ]);
        
        return createThreeColumnTable(rows, true);
    }
    
    // ==============================================
    // FUNGSI TULANGAN LENTUR YANG DIPERBAIKI
    // ==============================================
    
    function createTulanganBujurSangkarTable() {
        const tulangan = getData('data.tulangan', {});
        const parameter = getData('data.parameter', {});
        const input = getData('inputData', {});
        const fondasi = input.fondasi?.dimensi || {};
        
        const Ly = fondasi.ly || 0;
        const x1 = parameter.x1 || 0;
        
        const rows = [
            { 
                parameter: "$\\displaystyle \\sigma_x = \\sigma_{min} + (L_y - x_1) \\cdot \\dfrac{\\sigma_{max} - \\sigma_{min}}{L_y}$", 
                hasil: formatNumber(tulangan.sigma), 
                satuan: "kPa" 
            },
            { 
                // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                parameter: "$\\displaystyle M_u = \\dfrac{1}{2} \\cdot \\sigma_x \\cdot x_1^{2} + \\dfrac{1}{3} \\cdot (\\sigma_{max} - \\sigma_x) \\cdot x_1^{2}$", 
                hasil: formatNumber(tulangan.Mu), 
                satuan: "kNm/m" 
            },
            { 
                // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                parameter: "$\\displaystyle K = \\dfrac{M_u}{\\phi b d^{2}}$", 
                hasil: formatNumber(tulangan.K), 
                satuan: "MPa" 
            },
            { 
                parameter: "$K \\le K_{max}$", 
                isComparison: true, 
                statusHtml: `<span class="${tulangan.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.Kontrol_K || 'N/A'}</span>` 
            },
            { 
                parameter: "$\\displaystyle a = \\left(1 - \\sqrt{1 - \\dfrac{2K}{0.85 f'_c}}\\right) d$", 
                hasil: formatNumber(tulangan.a_val), 
                satuan: "mm" 
            },
            { 
                parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", 
                hasil: formatNumber(tulangan.As1), 
                satuan: "mm²/m" 
            },
            { 
                parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", 
                hasil: formatNumber(tulangan.As2), 
                satuan: "mm²/m" 
            },
            { 
                parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", 
                hasil: formatNumber(tulangan.As3), 
                satuan: "mm²/m" 
            },
            { 
                parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", 
                hasil: formatNumber(tulangan.As), 
                satuan: "mm²/m" 
            },
            { 
                // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                parameter: "$s_1 = \\dfrac{0.25\\pi D^{2} \\times 1000}{A_{s,perlu}}$", 
                hasil: formatNumber(tulangan.s1), 
                satuan: "mm" 
            },
            { 
                parameter: "$s_2 = 3h$", 
                hasil: formatNumber(tulangan.s2), 
                satuan: "mm" 
            },
            { 
                parameter: "$s_3 = 450$", 
                hasil: "450", 
                satuan: "mm" 
            },
            { 
                parameter: "$s = \\min(s_1, s_2, s_3)$", 
                hasil: formatNumber(tulangan.s), 
                satuan: "mm" 
            },
            { 
                parameter: `<strong>Digunakan: ɸ${getData('inputData.tulangan.d', getData('optimasi.kombinasi_terpilih.D', 'N/A'))}-${formatNumber(tulangan.s)}</strong>`, 
                isFullRow: true, 
                hasil: "", 
                satuan: "" 
            }
        ];
        
        return createThreeColumnTable(rows, true);
    }
    
    function createTulanganPersegiPanjangTable() {
        const tulangan = getData('data.tulangan', {});
        const parameter = getData('data.parameter', {});
        const input = getData('inputData', {});
        const fondasi = input.fondasi?.dimensi || {};
        
        const Ly = fondasi.ly || 0;
        const x1 = parameter.x1 || 0;
        
        // Tabel untuk tulangan arah panjang
        let tablesHTML = `
            <div class="section-subgroup">
                <h4>1. Tulangan Arah Panjang</h4>
                ${createThreeColumnTable([
                    { 
                        parameter: "$\\displaystyle \\sigma_x = \\sigma_{min} + (L_y - x_1) \\cdot \\dfrac{\\sigma_{max} - \\sigma_{min}}{L_y}$", 
                        hasil: formatNumber(tulangan.bujur?.sigma), 
                        satuan: "kPa" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle M_u = \\dfrac{1}{2} \\cdot \\sigma_x \\cdot x_1^{2} + \\dfrac{1}{3} \\cdot (\\sigma_{max} - \\sigma_x) \\cdot x_1^{2}$", 
                        hasil: formatNumber(tulangan.bujur?.Mu), 
                        satuan: "kNm/m" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle K = \\dfrac{M_u}{\\phi b d^{2}}$", 
                        hasil: formatNumber(tulangan.bujur?.K), 
                        satuan: "MPa" 
                    },
                    { 
                        parameter: "$K \\le K_{max}$", 
                        isComparison: true, 
                        statusHtml: `<span class="${tulangan.bujur?.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.bujur?.Kontrol_K || 'N/A'}</span>` 
                    },
                    { 
                        parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", 
                        hasil: formatNumber(tulangan.bujur?.As1), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", 
                        hasil: formatNumber(tulangan.bujur?.As2), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", 
                        hasil: formatNumber(tulangan.bujur?.As3), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", 
                        hasil: formatNumber(tulangan.bujur?.As), 
                        satuan: "mm²/m" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$s_1 = \\dfrac{0.25\\pi D^{2} \\times 1000}{A_{s,perlu}}$", 
                        hasil: formatNumber(tulangan.bujur?.s1), 
                        satuan: "mm" 
                    },
                    { 
                        parameter: "$s_2 = 3h$", 
                        hasil: formatNumber(tulangan.bujur?.s2), 
                        satuan: "mm" 
                    },
                    { 
                        parameter: "$s_3 = 450$", 
                        hasil: "450", 
                        satuan: "mm" 
                    },
                    { 
                        parameter: "$s = \\min(s_1, s_2, s_3)$", 
                        hasil: formatNumber(tulangan.bujur?.s), 
                        satuan: "mm" 
                    },
                    { 
                        parameter: `<strong>Arah Panjang: ɸ${getData('inputData.tulangan.d', getData('optimasi.kombinasi_terpilih.D', 'N/A'))}-${formatNumber(tulangan.bujur?.s)}</strong>`, 
                        isFullRow: true, 
                        hasil: "", 
                        satuan: "" 
                    }
                ], true)}
            </div>
            
            <div class="section-subgroup">
                <h4>2. Tulangan Arah Pendek</h4>
                ${createThreeColumnTable([
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle M_u = \\dfrac{1}{2} \\cdot \\sigma_{max} \\cdot x_2^{2}$", 
                        hasil: formatNumber(tulangan.persegi?.Mu), 
                        satuan: "kNm/m" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle K = \\dfrac{M_u}{\\phi b d^{2}}$", 
                        hasil: formatNumber(tulangan.persegi?.K), 
                        satuan: "MPa" 
                    },
                    { 
                        parameter: "$K \\le K_{max}$", 
                        isComparison: true, 
                        statusHtml: `<span class="${tulangan.persegi?.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.persegi?.Kontrol_K || 'N/A'}</span>` 
                    },
                    { 
                        parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", 
                        hasil: formatNumber(tulangan.persegi?.As21), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", 
                        hasil: formatNumber(tulangan.persegi?.As22), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", 
                        hasil: formatNumber(tulangan.persegi?.As23), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", 
                        hasil: formatNumber(tulangan.persegi?.As), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$\\displaystyle A_{s,pusat} = \\dfrac{2L_x A_s}{L_y + L_x}$", 
                        hasil: formatNumber(tulangan.persegi?.Aspusat), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$\\displaystyle A_{s,tepi} = A_s - A_{s,pusat}$", 
                        hasil: formatNumber(tulangan.persegi?.Astepi), 
                        satuan: "mm²/m" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle s_{pusat} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{A_{s,pusat}}$", 
                        hasil: formatNumber(tulangan.persegi?.s_pusat), 
                        satuan: "mm" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle s_{tepi} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{A_{s,tepi}}$", 
                        hasil: formatNumber(tulangan.persegi?.s_tepi), 
                        satuan: "mm" 
                    },
                    { 
                        parameter: `<strong>Arah Pendek Pusat: ɸ${getData('inputData.tulangan.db', getData('optimasi.kombinasi_terpilih.Db', 'N/A'))}-${formatNumber(tulangan.persegi?.s_pusat)}</strong>`, 
                        isFullRow: true, 
                        hasil: "", 
                        satuan: "" 
                    },
                    { 
                        parameter: `<strong>Arah Pendek Tepi: ɸ${getData('inputData.tulangan.db', getData('optimasi.kombinasi_terpilih.Db', 'N/A'))}-${formatNumber(tulangan.persegi?.s_tepi)}</strong>`, 
                        isFullRow: true, 
                        hasil: "", 
                        satuan: "" 
                    }
                ], true)}
            </div>
        `;
        
        return tablesHTML;
    }
    
    function createTulanganMenerusTable() {
        const tulangan = getData('data.tulangan', {});
        const parameter = getData('data.parameter', {});
        const material = getData('inputData.material', {});
        const fondasi = getData('inputData.fondasi.dimensi', {});
        
        const b = 1000; // lebar per meter
        const h = (fondasi.h || 0) * 1000; // tinggi dalam mm
        
        // Tabel untuk tulangan menerus
        let tablesHTML = `
            <div class="section-subgroup">
                <h4>1. Tulangan Utama</h4>
                ${createThreeColumnTable([
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle M_u = 0.5 \\cdot \\sigma_{max} \\cdot x_2^{2}$", 
                        hasil: formatNumber(tulangan.Mu), 
                        satuan: "kNm/m" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle K = \\dfrac{M_u}{\\phi b d^{2}}$", 
                        hasil: formatNumber(tulangan.K), 
                        satuan: "MPa" 
                    },
                    { 
                        parameter: "$K \\le K_{max}$", 
                        isComparison: true, 
                        statusHtml: `<span class="${tulangan.Kontrol_K === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${tulangan.Kontrol_K || 'N/A'}</span>` 
                    },
                    { 
                        parameter: "$A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", 
                        hasil: formatNumber(tulangan.As1), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s2} = \\dfrac{\\sqrt{f'_c}}{4f_y} b d$", 
                        hasil: formatNumber(tulangan.As2), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s3} = \\dfrac{1.4}{f_y} b d$", 
                        hasil: formatNumber(tulangan.As3), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{s,perlu} = \\max(A_{s1}, A_{s2}, A_{s3})$", 
                        hasil: formatNumber(tulangan.As), 
                        satuan: "mm²/m" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$s_1 = \\dfrac{0.25\\pi D^{2} \\times 1000}{A_{s,perlu}}$", 
                        hasil: formatNumber(tulangan.s1), 
                        satuan: "mm" 
                    },
                    { 
                        parameter: "$s_2 = 3h$", 
                        hasil: formatNumber(tulangan.s2), 
                        satuan: "mm" 
                    },
                    { 
                        parameter: "$s_3 = 450$", 
                        hasil: "450", 
                        satuan: "mm" 
                    },
                    { 
                        parameter: "$s_{utama} = \\min(s_1, s_2, s_3)$", 
                        hasil: formatNumber(tulangan.s_utama), 
                        satuan: "mm" 
                    },
                    { 
                        parameter: `<strong>Tulangan Utama: ɸ${getData('inputData.tulangan.d', getData('optimasi.kombinasi_terpilih.D', 'N/A'))}-${formatNumber(tulangan.s_utama)}</strong>`, 
                        isFullRow: true, 
                        hasil: "", 
                        satuan: "" 
                    }
                ], true)}
            </div>
            
            <div class="section-subgroup">
                <h4>2. Tulangan Bagi</h4>
                ${createThreeColumnTable([
                    { 
                        // DIPERBAIKI: dari As/5 menjadi 0.20% * b * h
                        parameter: "$A_{sb1} = 0.20\\% \\cdot b \\cdot h$", 
                        hasil: formatNumber(tulangan.Asb1), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{sb2} = \\rho_{min} \\cdot b \\cdot h$", 
                        hasil: formatNumber(tulangan.Asb2), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{sb3} = 0.0014 \\cdot b \\cdot h$", 
                        hasil: formatNumber(tulangan.Asb3), 
                        satuan: "mm²/m" 
                    },
                    { 
                        parameter: "$A_{sb,perlu} = \\max(A_{sb1}, A_{sb2}, A_{sb3})$", 
                        hasil: formatNumber(tulangan.Asb), 
                        satuan: "mm²/m" 
                    },
                    { 
                        // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                        parameter: "$\\displaystyle s_{bagi} = \\dfrac{0.25\\pi D_b^{2} \\times 1000}{A_{sb,perlu}}$", 
                        hasil: formatNumber(tulangan.s_bagi), 
                        satuan: "mm" 
                    },
                    { 
                        parameter: `<strong>Tulangan Bagi: ɸ${getData('inputData.tulangan.db', getData('optimasi.kombinasi_terpilih.Db', 'N/A'))}-${formatNumber(tulangan.s_bagi)}</strong>`, 
                        isFullRow: true, 
                        hasil: "", 
                        satuan: "" 
                    }
                ], true)}
            </div>
        `;
        
        return tablesHTML;
    }
    
    function createTulanganPerhitunganTable() {
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        if (fondasiMode === 'bujur_sangkar') {
            return `
                <div class="section-subgroup">
                    <h4>1. Tulangan Utama</h4>
                    ${createTulanganBujurSangkarTable()}
                </div>
            `;
        } else if (fondasiMode === 'persegi_panjang') {
            return createTulanganPersegiPanjangTable();
        } else if (fondasiMode === 'menerus') {
            return createTulanganMenerusTable();
        }
        
        return '<p class="note">Jenis fondasi tidak dikenali.</p>';
    }
    
    function createKuatDukungTable() {
        const kuatDukung = getData('data.kuatDukung', {});
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        let rows = [
            { 
                parameter: "$A_1 = B_x \\times B_y$", 
                hasil: formatNumber(kuatDukung.A1), 
                satuan: "mm²" 
            },
            { 
                parameter: "$\\displaystyle P_{u,cap} = 0.65 \\times 0.85 \\times f'_c \\times A_1$", 
                hasil: formatNumber(kuatDukung.Pu_cap), 
                satuan: "kN" 
            },
            { 
                // DIHAPUS: baris P_u (beban aksial ultimit)
                // Langsung ke kontrol
                parameter: "$P_{u,cap} \\ge P_u$", 
                isComparison: true, 
                statusHtml: `<span class="${kuatDukung.Kontrol_Pu === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Pu || 'N/A'}</span>` 
            }
        ];
        
        if (fondasiMode === 'menerus') {
            rows = rows.concat([
                { 
                    parameter: "$\\displaystyle l_t = \\dfrac{L_x}{2} - \\dfrac{B_x}{2} - s_{beton}$", 
                    hasil: formatNumber(kuatDukung.It), 
                    satuan: "mm" 
                },
                { 
                    parameter: "$C_b = \\min(75, s_{utama})$", 
                    hasil: formatNumber(kuatDukung.Cb), 
                    satuan: "mm" 
                },
                { 
                    parameter: "$\\displaystyle C = \\min\\left(\\dfrac{C_b}{D_b}, 2.5\\right)$", 
                    hasil: formatNumber(kuatDukung.C), 
                    satuan: "-" 
                },
                { 
                    parameter: "$\\displaystyle l_{dh1} = \\dfrac{f_y}{1.1\\lambda\\sqrt{f'_c}} \\times \\dfrac{0.8}{C} \\times D_b$", 
                    hasil: formatNumber(kuatDukung.Idh1), 
                    satuan: "mm" 
                },
                { 
                    parameter: "$l_{dh2} = 8D_b$", 
                    hasil: formatNumber(kuatDukung.Idh2), 
                    satuan: "mm" 
                },
                { 
                    parameter: "$l_{dh3} = 300$", 
                    hasil: "300", 
                    satuan: "mm" 
                },
                { 
                    parameter: "$l_{dh} = \\max(l_{dh1}, l_{dh2}, l_{dh3})$", 
                    hasil: formatNumber(kuatDukung.Idh), 
                    satuan: "mm" 
                },
                { 
                    parameter: "$l_t > l_{dh}$", 
                    isComparison: true, 
                    statusHtml: `<span class="${kuatDukung.Kontrol_Idh === 'AMAN' ? 'status-aman' : 'status-tidak-aman'}">${kuatDukung.Kontrol_Idh || 'N/A'}</span>` 
                }
            ]);
        } else {
            rows = rows.concat([
                { 
                    parameter: "$\\displaystyle l_t = \\dfrac{L_x}{2} - \\dfrac{B_x}{2} - s_{beton}$", 
                    hasil: formatNumber(kuatDukung.It), 
                    satuan: "mm" 
                },
                { 
                    parameter: "$A_{s,perlu}$ (dari perhitungan tulangan)", 
                    hasil: formatNumber(kuatDukung.As_perlu), 
                    satuan: "mm²" 
                },
                { 
                    // DIPERBAIKI: menggunakan kurung kurawal untuk pangkat
                    parameter: "$\\displaystyle A_{s,terpasang} = \\dfrac{0.25\\pi D^{2} \\times 1000}{s}$", 
                    hasil: formatNumber(kuatDukung.Asterpasang), 
                    satuan: "mm²" 
                },
                { 
                    parameter: "$\\displaystyle f_3 = \\dfrac{A_{s,perlu}}{A_{s,terpasang}}$", 
                    hasil: formatNumber(kuatDukung.f3), 
                    satuan: "-" 
                },
                { 
                    parameter: "$\\displaystyle l_{dh1} = \\dfrac{0.24\\psi f_y}{\\lambda\\sqrt{f'_c}} \\times D \\times \\psi_e \\times \\psi_t \\times f_3$", 
                    hasil: formatNumber(kuatDukung.Idh1), 
                    satuan: "mm" 
                },
                { 
                    parameter: "$l_{dh2} = 8D$", 
                    hasil: formatNumber(kuatDukung.Idh2), 
                    satuan: "mm" 
                },
                { 
                    parameter: "$l_{dh3} = 150$", 
                    hasil: "150", 
                    satuan: "mm" 
                },
                { 
                    parameter: "$l_{dh} = \\max(l_{dh1}, l_{dh2}, l_{dh3})$", 
                    hasil: formatNumber(kuatDukung.Idh), 
                    satuan: "mm" 
                },
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
    // FUNGSI REKAPITULASI TULANGAN TERPASANG
    // ==============================================
    
    // Fungsi khusus untuk tabel tulangan persegi panjang
    function createTulanganTerpasangTablePersegiPanjang() {
        const rekap = getData('rekap', {});
        
        let html = '<table class="tulangan-terpasang-table" style="width: 100%;">';
        
        // Header dengan 2 kolom (kolom pertama colspan=2, kolom kedua adalah terpasang)
        html += '<thead>';
        html += '<tr>';
        html += '<th colspan="2" style="text-align: center;">Tulangan</th>';
        html += '<th style="text-align: center; width: 40%;">Terpasang</th>';
        html += '</tr>';
        html += '</thead>';
        
        html += '<tbody>';
        
        // Baris 1: Arah Panjang (colspan=2 untuk menggabungkan 2 kolom pertama)
        html += '<tr>';
        html += '<td colspan="2" style="text-align: center;">Arah Panjang</td>';
        html += '<td style="text-align: center; width: 40%; font-weight: bold;">' + (rekap.tulangan_panjang || 'N/A') + '</td>';
        html += '</tr>';
        
        // Baris 2: Arah Pendek - bagian Pusat
        html += '<tr>';
        html += '<td rowspan="2" style="text-align: center; vertical-align: middle;">Arah Pendek</td>';
        html += '<td style="text-align: center;">Pusat</td>';
        html += '<td style="text-align: center; width: 40%; font-weight: bold;">' + (rekap.tulangan_pendek_pusat || 'N/A') + '</td>';
        html += '</tr>';
        
        // Baris 3: Arah Pendek - bagian Tepi
        html += '<tr>';
        // Kolom pertama sudah di-merge dengan rowspan=2
        html += '<td style="text-align: center;">Tepi</td>';
        html += '<td style="text-align: center; width: 40%; font-weight: bold;">' + (rekap.tulangan_pendek_tepi || 'N/A') + '</td>';
        html += '</tr>';
        
        html += '</tbody>';
        html += '</table>';
        
        return html;
    }
    
    // Fungsi utama untuk tabel tulangan terpasang
    function createTulanganTerpasangTable() {
        const rekap = getData('rekap', {});
        const fondasiMode = getData('data.actualFondasiMode', 'bujur_sangkar');
        
        // Untuk fondasi persegi panjang, gunakan tabel khusus
        if (fondasiMode === 'persegi_panjang') {
            return createTulanganTerpasangTablePersegiPanjang();
        }
        
        // Untuk mode lainnya, gunakan tabel 2 kolom standar
        let html = '<table class="tulangan-terpasang-table" style="width: 100%;">';
        html += '<tr>';
        html += '<th style="text-align: center;">Tulangan</th>';
        html += '<th style="text-align: center; width: 40%;">Terpasang</th>';
        html += '</tr>';
        
        if (fondasiMode === 'bujur_sangkar') {
            html += '<tr>';
            html += '<td style="text-align: center;">Tulangan Utama</td>';
            html += '<td style="text-align: center; width: 40%; font-weight: bold;">' + (rekap.tulangan_utama || 'N/A') + '</td>';
            html += '</tr>';
        } else if (fondasiMode === 'menerus') {
            html += '<tr>';
            html += '<td style="text-align: center;">Tulangan Utama</td>';
            html += '<td style="text-align: center; width: 40%; font-weight: bold;">' + (rekap.tulangan_utama || 'N/A') + '</td>';
            html += '</tr>';
            html += '<tr>';
            html += '<td style="text-align: center;">Tulangan Bagi</td>';
            html += '<td style="text-align: center; width: 40%; font-weight: bold;">' + (rekap.tulangan_bagi || 'N/A') + '</td>';
            html += '</tr>';
        }
        
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
                <p>Struktur fondasi ${getFondasiModeName(fondasiMode)} dengan dimensi ${formatNumber(dimensi.lx)} m × ${formatNumber(dimensi.ly)} m memenuhi semua persyaratan:</p>
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
                "Gunakan mutu beton f'c = " + formatNumber(material.fc) + " MPa sesuai perhitungan",
                "Gunakan mutu baja fy = " + formatNumber(material.fy) + " MPa",
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
        const tanahMode = getData('inputData.tanah.mode', 'auto');
        
        // Header - DIPERBAIKI: Mengubah tampilan header informasi
        blocks.push(`
            <h1>LAPORAN PERHITUNGAN FONDASI</h1>
            <div class="header-info">
                <div>
                    <span><strong>Mode:</strong> ${getData('mode', 'N/A').toUpperCase()}</span>
                    <span><strong>Modul:</strong> Fondasi</span>
                </div>
                <div>
                    <span><strong>Tanggal:</strong> ${formatTimestampFull(getData('timestamp'))}</span>
                    <span><strong>Status:</strong> <span class="${statusFondasi === 'aman' ? 'status-aman' : 'status-tidak-aman'}">${statusFondasi.toUpperCase()}</span></span>
                </div>
            </div>
            <h2>A. DATA INPUT DAN PARAMETER</h2>
        `);
        
        // Data Input - 5 bagian baru
        blocks.push(`
            <div class="section-group">
                <h3>1. Data Material dan Dimensi</h3>
                ${createMaterialDimensiTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>2. Data Tanah</h3>
                ${createTanahTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>3. Data Beban</h3>
                ${createBebanTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>4. Data Tulangan</h3>
                ${createTulanganTable()}
            </div>
        `);
        
        blocks.push(`
            <div class="section-group">
                <h3>5. Parameter Perhitungan</h3>
                ${createParameterTable()}
            </div>
        `);
        
        // Perhitungan - hanya tampilkan daya dukung jika mode auto
        if (tanahMode === 'auto') {
            blocks.push(`
                <div class="header-content-group">
                    <h2>B. PERHITUNGAN DAYA DUKUNG TANAH</h2>
                </div>
                <div class="section-group">
                    <h3>1. Analisis Daya Dukung</h3>
                    ${createDayaDukungTable()}
                </div>
            `);
        }
        
        // Kontrol Geser - dipisah menjadi dua tabel
        const kontrolGeserSection = tanahMode === 'auto' ? 'C' : 'B';
        blocks.push(`
            <div class="header-content-group">
                <h2>${kontrolGeserSection}. KONTROL GESER</h2>
            </div>
            <div class="section-group">
                <h3>1. Kontrol Geser Satu Arah</h3>
                ${createGeserSatuArahTable()}
            </div>
            
            <div class="section-group">
                <h3>2. Kontrol Geser Dua Arah</h3>
                ${createGeserDuaArahTable()}
            </div>
        `);
        
        // Perhitungan Tulangan Lentur
        const tulanganLenturSection = tanahMode === 'auto' ? 'D' : 'C';
        blocks.push(`
            <div class="header-content-group">
                <h2>${tulanganLenturSection}. PERHITUNGAN TULANGAN LENTUR</h2>
            </div>
            ${createTulanganPerhitunganTable()}
        `);
        
        // Kontrol Kuat Dukung
        const kuatDukungSection = tanahMode === 'auto' ? 'E' : 'D';
        blocks.push(`
            <div class="header-content-group">
                <h2>${kuatDukungSection}. KONTROL KUAT DUKUNG</h2>
            </div>
            <div class="section-group">
                <h3>1. Kuat Dukung Aksial dan Panjang Penyaluran</h3>
                ${createKuatDukungTable()}
            </div>
        `);
        
        // Rekapitulasi dan Kesimpulan
        const rekapSection = tanahMode === 'auto' ? 'F' : 'E';
        blocks.push(`
            <div class="header-content-group">
                <h2>${rekapSection}. REKAPITULASI HASIL</h2>
            </div>
            <div class="section-group">
                <h3>1. Tulangan Terpasang</h3>
                ${createTulanganTerpasangTable()}
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
                        parameter: "$V_{u} \\le V_{c}$ (Geser 1 arah)", 
                        statusHtml: `<span class="${getData('kontrol.geser.aman1', false) ? 'status-aman' : 'status-tidak-aman'}">${getData('kontrol.geser.aman1', false) ? 'AMAN' : 'TIDAK AMAN'}</span>` 
                    },
                    { 
                        parameter: "$V_{u} \\le \\phi V_{c}$ (Geser 2 arah)", 
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