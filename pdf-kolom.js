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
        
        if (kontrolLentur) {
            if (!kontrolLentur.Ast_ok || !kontrolLentur.rho_ok || !kontrolLentur.n_ok || !kontrolLentur.K_ok) {
                semuaAman = false;
            }
        }
        
        if (kontrolGeser) {
            if (!kontrolGeser.Vs_ok || !kontrolGeser.Av_ok) {
                semuaAman = false;
            }
        }
        
        return semuaAman ? 'aman' : 'tidak aman';
    }

    function getData(path, defaultValue = 'N/A') {
        try {
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
            
            if (value !== undefined && value !== null && value !== 'N/A') {
                return value;
            }
            
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

    // Fungsi untuk membuat tabel 2 kolom untuk tulangan terpasang
    function createTulanganTerpasangTable() {
        const rekap = getData('rekap', {});
        const tulangan = rekap?.tulangan || {};
        const begel = rekap?.begel || {};
        
        const rows = [
            {
                parameter: "Tulangan Utama",
                hasil: rekap?.formatted?.tulangan_utama || 'N/A'
            },
            {
                parameter: "Sengkang/Begel",
                hasil: rekap?.formatted?.begel || 'N/A'
            },
            {
                parameter: "Rasio Tulangan (ρ)",
                hasil: formatNumber(tulangan.rho, 3) + ' %'
            }
        ];
        
        let html = '<table class="two-col-table tulangan-terpasang">';
        html += '<tr>';
        html += '<th class="col-tulangan">Tulangan</th>';
        html += '<th class="col-terpasang" style="text-align: center">Terpasang</th>';
        html += '</tr>';
        
        rows.forEach(row => {
            html += `
                <tr>
                    <td class="col-tulangan">${row.parameter}</td>
                    <td class="col-terpasang" style="text-align: center">${row.hasil}</td>
                </tr>
            `;
        });
        
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
            { parameter: "$M_u$ (Momen lentur)", hasil: formatNumber(beban.Mu || beban.mu), satuan: 'kNm' },
            { parameter: "$V_u$ (Gaya geser)", hasil: formatNumber(beban.Vu || beban.vu), satuan: 'kN' }
        ];
        
        return createThreeColumnTable(rows, false, true);
    }

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

    function createParameterTable() {
        const dimensi = getData('data.Dimensi', {});
        const hasilTulangan = getData('data.hasilTulangan', {});
        const material = getData('data.parsedInput.material', {});
        const tulangan = getData('data.parsedInput.tulangan', {});
        const lanjutan = getData('data.parsedInput.lanjutan', {});
        
        const fc = material.fc || 20;
        const fy = material.fy || 300;
        const b = dimensi.b || 300;
        const h = dimensi.h || 400;
        const sb = dimensi.sb || 40;
        const phi = tulangan.phi || tulangan.phi_tul || 8;
        const D = tulangan.d || tulangan.d_tul || 16;
        const ds = dimensi.ds || (sb + phi + D/2);
        
        const beta1_calc = fc <= 28 ? 0.85 : (fc < 55 ? 0.85 - 0.05 * ((fc - 28) / 7) : 0.65);
        
        const rows = [
            { 
                parameter: "$\\displaystyle d_s = s_b + \\phi + \\dfrac{D}{2}$", 
                hasil: formatNumber(ds), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle d = h - d_s$", 
                hasil: formatNumber(dimensi.d), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle m = \\left\\lfloor \\dfrac{b - 2d_s}{D + s_b} \\right\\rfloor + 1$", 
                hasil: formatNumber(dimensi.m, 0), 
                satuan: '-' 
            },
            { 
                parameter: "$\\displaystyle S_n = \\max(40, 1.5 \\times D)$", 
                hasil: formatNumber(dimensi.Sn), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle \\beta_1 = \\begin{cases} 0.85 & f'_c \\leq 28 \\text{ MPa} \\\\ 0.85 - 0.05\\dfrac{f'_c - 28}{7} & 28 < f'_c < 55 \\text{ MPa} \\\\ 0.65 & f'_c \\geq 55 \\text{ MPa} \\end{cases}$", 
                hasil: formatNumber(dimensi.beta1 || beta1_calc, 3), 
                satuan: '-' 
            },
            { 
                parameter: "$\\displaystyle a_b = \\dfrac{600 \\beta_1 d}{600 + f_y}$", 
                hasil: formatNumber(hasilTulangan.ab), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle a_c = \\dfrac{P_u \\times 1000}{0.65 \\times 0.85 \\times f'_c \\times b}$", 
                hasil: formatNumber(hasilTulangan.ac), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle a_{b1} = \\dfrac{600 \\beta_1 d}{600 - f_y}$", 
                hasil: formatNumber(hasilTulangan.ab1), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle a_{b2} = \\beta_1 d$", 
                hasil: formatNumber(hasilTulangan.ab2), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle a_{t1} = \\dfrac{600 \\beta_1 d_s}{600 - f_y}$", 
                hasil: formatNumber(hasilTulangan.at1), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle a_{t2} = \\beta_1 d_s$", 
                hasil: formatNumber(hasilTulangan.at2), 
                satuan: 'mm' 
            },
            { 
                parameter: "Kondisi yang berlaku", 
                hasil: hasilTulangan.kondisi || 'N/A',
                satuan: '',
                isConditionValue: true
            }
        ];
        
        return createThreeColumnTable(rows);
    }

    // ==============================================
    // FUNGSI DIPERBAIKI: Analisis Tulangan Lentur dengan Detail Kondisi
    // ==============================================
    function createLenturTableDetail() {
        const hasilTulangan = getData('data.hasilTulangan', {});
        const kontrolLentur = getData('kontrol.lentur', {});
        const beban = getData('data.parsedInput.beban', {});
        const dimensi = getData('data.Dimensi', {});
        const material = getData('data.parsedInput.material', {});
        
        const semuaKondisi = hasilTulangan.semuaKondisi || {};
        const kondisi = hasilTulangan.kondisi || '';
        const kondisiAktif = getData('kondisiAktif', {}) || {};
        
        let kondisiData = null;
        
        if (kondisi === 'ac > ab1') {
            kondisiData = semuaKondisi.kondisi1 || kondisiAktif;
        } else if (kondisi === 'ab1 > ac > ab2') {
            kondisiData = semuaKondisi.kondisi2 || kondisiAktif;
        } else if (kondisi === 'ab2 > ac > ab') {
            kondisiData = semuaKondisi.kondisi3 || kondisiAktif;
        } else if (kondisi === 'ab > ac > at1') {
            kondisiData = semuaKondisi.kondisi4 || kondisiAktif;
        } else if (kondisi === 'at1 > ac > at2') {
            kondisiData = semuaKondisi.kondisi5 || kondisiAktif;
        } else if (kondisi === 'at2 > ac') {
            kondisiData = semuaKondisi.kondisi6 || kondisiAktif;
        }
        
        const tampilkanK = kondisi === 'at2 > ac';
        
        const rows = [
            { parameter: "$P_u$", hasil: formatNumber(beban.Pu || beban.pu), satuan: 'kN' },
            { parameter: "$M_u$", hasil: formatNumber(beban.Mu || beban.mu), satuan: 'kNm' },
            { parameter: "$\\displaystyle e = \\dfrac{M_u}{P_u} \\times 1000$", hasil: formatNumber(hasilTulangan.e), satuan: 'mm' },
            { parameter: "$\\displaystyle P_{u\\phi} = 0.1 \\cdot f'_c \\cdot b \\cdot h / 1000$", hasil: formatNumber(hasilTulangan.Pu_phi), satuan: 'kN' },
            { 
                parameter: "$\\displaystyle \\phi = \\begin{cases} 0.65 & \\text{jika } a_c > a_b \\text{ atau } P_u \\geq P_{u\\phi} \\\\ 0.9 - 0.25 \\cdot \\dfrac{P_u}{P_{u\\phi}} & \\text{jika } P_u < P_{u\\phi} \\end{cases}$", 
                hasil: formatNumber(hasilTulangan.faktorPhi), 
                satuan: '-' 
            }
        ];
        
        if (kondisiData && !kondisiData.error) {
            if (kondisi === 'ac > ab1') {
                rows.push(
                    { 
                        parameter: "<strong>Perhitungan Kondisi 1: $a_c > a_{b1}$</strong>", 
                        isFullRow: true 
                    },
                    { 
                        parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{1.25 \\cdot \\dfrac{P_u}{\\phi} - 0.85 f'_c b h}{2(f_y - 0.85 f'_c)}$", 
                        hasil: formatNumber(kondisiData.A1), 
                        satuan: 'mm²' 
                    }
                );
            } 
            else if (kondisi === 'ab1 > ac > ab2') {
                rows.push(
                    { 
                        parameter: "<strong>Perhitungan Kondisi 2: $a_{b1} > a_c > a_{b2}$</strong>", 
                        isFullRow: true 
                    },
                    { 
                        parameter: "$\\displaystyle a_{p1} = \\dfrac{(600 - f_y)(d - d_s)}{600 + f_y}$", 
                        hasil: formatNumber(kondisiData.ap1), 
                        satuan: 'mm' 
                    },
                    { parameter: "$R_1 = -(a_b + a_{p1} + h)$", hasil: formatNumber(kondisiData.R1), satuan: 'mm' },
                    { parameter: "$R_2 = 2a_b d + a_c(a_{p1} + 2e)$", hasil: formatNumber(kondisiData.R2), satuan: 'mm²' },
                    { parameter: "$R_3 = -a_c a_b(d - d_s + 2e)$", hasil: formatNumber(kondisiData.R3), satuan: 'mm³' },
                    { 
                        parameter: "$f(a) = a^3 + R_1 \\cdot a^2 + R_2 \\cdot a + R_3 = 0$", 
                        hasil: formatNumber(kondisiData.a_cubic), 
                        satuan: 'mm' 
                    },
                    { 
                        parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{a(P_u/\\phi - 0.85 f'_c a b)}{(600 + f_y)a - 600\\beta_1 d}$", 
                        hasil: formatNumber(kondisiData.A1), 
                        satuan: 'mm²' 
                    }
                );
            }
            else if (kondisi === 'ab2 > ac > ab') {
                rows.push(
                    { 
                        parameter: "<strong>Perhitungan Kondisi 3: $a_{b2} > a_c > a_b$</strong>", 
                        isFullRow: true 
                    },
                    { 
                        parameter: "$\\displaystyle a_{p2} = \\dfrac{2f_y d_s + 1200d}{600 + f_y}$", 
                        hasil: formatNumber(kondisiData.ap2), 
                        satuan: 'mm' 
                    },
                    { parameter: "$R_4 = -(a_b + a_{p2})$", hasil: formatNumber(kondisiData.R4), satuan: 'mm' },
                    { parameter: "$R_5 = 2a_b d - a_c(h - a_{p2} - 2e)$", hasil: formatNumber(kondisiData.R5), satuan: 'mm²' },
                    { parameter: "$R_6 = -a_c a_b(d - d_s + 2e)$", hasil: formatNumber(kondisiData.R6), satuan: 'mm³' },
                    { 
                        parameter: "$f(a) = a^3 + R_4 \\cdot a^2 + R_5 \\cdot a + R_6 = 0$", 
                        hasil: formatNumber(kondisiData.a_cubic), 
                        satuan: 'mm' 
                    },
                    { 
                        parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{a(P_u/\\phi - 0.85 f'_c a b)}{(600 + f_y)a - 600\\beta_1 d}$", 
                        hasil: formatNumber(kondisiData.A1), 
                        satuan: 'mm²' 
                    }
                );
            }
            else if (kondisi === 'ab > ac > at1') {
                rows.push(
                    { 
                        parameter: "<strong>Perhitungan Kondisi 4: $a_b > a_c > a_{t1}$</strong>", 
                        isFullRow: true 
                    },
                    { 
                        parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{0.5 P_u (2e - h + a_c)}{\\phi (d - d_s) f_y}$", 
                        hasil: formatNumber(kondisiData.A1), 
                        satuan: 'mm²' 
                    }
                );
            }
            else if (kondisi === 'at1 > ac > at2') {
                rows.push(
                    { 
                        parameter: "<strong>Perhitungan Kondisi 5: $a_{t1} > a_c > a_{t2}$</strong>", 
                        isFullRow: true 
                    },
                    { 
                        parameter: "$\\displaystyle a_{p3} = \\dfrac{2f_y d - 1200d_s}{600 - f_y}$", 
                        hasil: formatNumber(kondisiData.ap3), 
                        satuan: 'mm' 
                    },
                    { parameter: "$R_7 = a_{p3} - a_{t1}$", hasil: formatNumber(kondisiData.R7), satuan: 'mm' },
                    { parameter: "$R_8 = a_c(2e - h - a_{p3}) + 2a_{t1} d_s$", hasil: formatNumber(kondisiData.R8), satuan: 'mm²' },
                    { parameter: "$R_9 = a_c a_{t1}(d - d_s - 2e)$", hasil: formatNumber(kondisiData.R9), satuan: 'mm³' },
                    { 
                        parameter: "$f(a) = a^3 + R_7 \\cdot a^2 + R_8 \\cdot a + R_9 = 0$", 
                        hasil: formatNumber(kondisiData.a_cubic), 
                        satuan: 'mm' 
                    },
                    { 
                        parameter: "$\\displaystyle A_1 = A_2 = \\dfrac{a(P_u/\\phi - 0.85 f'_c a b)}{(600 + f_y)a - 600\\beta_1 d}$", 
                        hasil: formatNumber(kondisiData.A1), 
                        satuan: 'mm²' 
                    }
                );
            }
            else if (kondisi === 'at2 > ac') {
                rows.push(
                    { 
                        parameter: "<strong>Perhitungan Kondisi 6: $a_{t2} > a_c$</strong>", 
                        isFullRow: true 
                    },
                    { 
                        parameter: "$\\displaystyle K = \\dfrac{M_u \\times 10^6}{\\phi_1 b d^2}$", 
                        hasil: formatNumber(kondisiData.K, 4), 
                        satuan: 'MPa' 
                    },
                    { 
                        parameter: "$\\displaystyle K_{maks} = \\dfrac{382.5 \\beta_1 f'_c (600 + f_y - 225\\beta_1)}{(600 + f_y)^2}$", 
                        hasil: formatNumber(kondisiData.Kmaks, 4), 
                        satuan: 'MPa' 
                    },
                    { 
                        parameter: "$\\displaystyle a = \\left(1 - \\sqrt{1 - \\dfrac{2K}{0.85 f'_c}}\\right) d$", 
                        hasil: formatNumber(kondisiData.a_flexure), 
                        satuan: 'mm' 
                    },
                    { 
                        parameter: "$\\displaystyle A_{s1} = \\dfrac{0.85 f'_c a b}{f_y}$", 
                        hasil: formatNumber(kondisiData.As1), 
                        satuan: 'mm²' 
                    },
                    { 
                        parameter: "$\\displaystyle A_{s2} = \\dfrac{1.4 b d}{f_y}$", 
                        hasil: formatNumber(kondisiData.As2), 
                        satuan: 'mm²' 
                    }
                );
            }
            
            if (kondisiData.As_tu !== undefined) {
                rows.push({ 
                    parameter: "$A_{s,perlu} = A_1 + A_2$", 
                    hasil: formatNumber(kondisiData.As_tu), 
                    satuan: 'mm²' 
                });
            }
        }
        
        const n = hasilTulangan.n || 0;
        const D = getData('data.parsedInput.tulangan.d', 16);
        const As_terpasang = n * Math.PI * Math.pow(D, 2) / 4;
        
        rows.push(
            { parameter: "$\\displaystyle n = \\dfrac{A_{s,perlu}}{0.25 \\cdot \\pi \\cdot D^2}$", hasil: formatNumber(hasilTulangan.n, 0), satuan: 'batang' },
            { parameter: "$n_{maks} = 2 \\cdot m$", hasil: formatNumber(hasilTulangan.n_max, 0), satuan: 'batang' },
            { 
                parameter: "$n \\le n_{maks}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolLentur.n_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.n_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$\\displaystyle A_{s,terpasang} = n \\cdot 0.25 \\cdot \\pi \\cdot D^2$", 
                hasil: formatNumber(As_terpasang), 
                satuan: 'mm²' 
            },
            { 
                parameter: "$A_{s,terpasang} \\ge A_{s,perlu}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolLentur.Ast_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.Ast_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { parameter: "$\\displaystyle \\rho = \\dfrac{A_{s,terpasang}}{b \\cdot h} \\times 100\\%$", hasil: formatNumber(hasilTulangan.rho, 3), satuan: '%' },
            { 
                parameter: "$\\rho \\ge 1\\%$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolLentur.rho_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.rho_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            }
        );
        
        if (tampilkanK && kondisiData && kondisiData.K !== undefined && kondisiData.Kmaks !== undefined) {
            rows.push(
                { 
                    parameter: "$K \\le K_{maks}$", 
                    isStatus: true, 
                    statusHtml: `<span class="${kontrolLentur.K_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.K_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
                }
            );
        }
        
        return createThreeColumnTable(rows, true);
    }

    // ==============================================
    // FUNGSI DIPERBAIKI: Analisis Tulangan Geser dengan Detail s
    // ==============================================
    function createGeserTableDetail() {
        const begel = getData('data.begel', {});
        const kontrolGeser = getData('kontrol.geser', {});
        const beban = getData('data.parsedInput.beban', {});
        const dimensi = getData('data.Dimensi', {});
        const material = getData('data.parsedInput.material', {});
        const tulangan = getData('data.parsedInput.tulangan', {});
        const lanjutan = getData('data.parsedInput.lanjutan', {});
        const detailBegel = getData('detailBegel', {});
        
        const h = getData('data.parsedInput.dimensi.h', 0);
        const b = getData('data.parsedInput.dimensi.b', 0);
        const d = dimensi.d || 0;
        const Ag = h * b;
        const fc = material.fc || 20;
        const fyt = material.fyt || material.fy || 300;
        const lambda = lanjutan.lambda || 1;
        const nKaki = lanjutan.n_kaki || 2;
        const phi = tulangan.phi || tulangan.phi_tul || 8;
        const Vs = begel.Vs || 0;
        const Vs_max = begel.Vs_max || 0;
        const Av_u = begel.Av_u || 0;
        
        // Hitung s1, s2, s3 sesuai dengan kondisi
        const luasSatuSengkang = 0.25 * Math.PI * phi * phi;
        const luasTotalSengkang = nKaki * luasSatuSengkang;
        const s1 = Av_u > 0 ? (luasTotalSengkang * 1000) / Av_u : 0;
        
        let s2, s3, rumusS2, rumusS3;
        
        if (Vs < Vs_max / 2) {
            s2 = d / 2;
            rumusS2 = "$s_2 = d/2$";
        } else {
            s2 = d / 4;
            rumusS2 = "$s_2 = d/4$";
        }
        
        if (Vs < Vs_max / 2) {
            s3 = 600;
            rumusS3 = "$s_3 = 600$";
        } else {
            s3 = 300;
            rumusS3 = "$s_3 = 300$";
        }
        
        const rows = [
            { parameter: "$V_u$", hasil: formatNumber(beban.Vu || beban.vu), satuan: 'kN' },
            { parameter: "$\\displaystyle A_g = b \\cdot h$", hasil: formatNumber(Ag, 0), satuan: 'mm²' },
            { 
                parameter: "$\\displaystyle \\phi V_c = 0.75 \\cdot 0.17 \\cdot \\left(1 + \\dfrac{P_u \\cdot 1000}{14 \\cdot A_g}\\right) \\cdot \\lambda \\cdot \\sqrt{f'_c} \\cdot b \\cdot d / 1000$", 
                hasil: formatNumber(begel.Vc_phi), 
                satuan: 'kN' 
            },
            { 
                parameter: "$\\displaystyle V_s = \\dfrac{V_u - \\phi V_c}{0.75}$", 
                hasil: formatNumber(begel.Vs), 
                satuan: 'kN' 
            },
            { 
                parameter: "$\\displaystyle V_{s,max} = \\dfrac{2}{3} \\cdot \\sqrt{f'_c} \\cdot b \\cdot d / 1000$", 
                hasil: formatNumber(begel.Vs_max), 
                satuan: 'kN' 
            },
            { 
                parameter: "$V_s \\le V_{s,max}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolGeser.Vs_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Vs_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$\\displaystyle A_{v,u1} = 0.062 \\cdot \\sqrt{f'_c} \\cdot b \\cdot \\dfrac{1000}{f_{yt}}$", 
                hasil: formatNumber(begel.Avu1), 
                satuan: 'mm²/m' 
            },
            { 
                parameter: "$\\displaystyle A_{v,u2} = 0.35 \\cdot b \\cdot \\dfrac{1000}{f_{yt}}$", 
                hasil: formatNumber(begel.Avu2), 
                satuan: 'mm²/m' 
            },
            { 
                parameter: "$\\displaystyle A_{v,u3} = \\dfrac{V_s \\cdot 10^6}{f_{yt} \\cdot d}$", 
                hasil: formatNumber(begel.Avu3), 
                satuan: 'mm²/m' 
            },
            { 
                parameter: "$\\displaystyle A_{v,u} = \\max(A_{v,u1}, A_{v,u2}, A_{v,u3})$", 
                hasil: formatNumber(begel.Av_u), 
                satuan: 'mm²/m' 
            },
            { 
                parameter: "$\\displaystyle s_1 = \\dfrac{n_{kaki} \\cdot \\pi \\cdot \\phi^2}{4 \\cdot A_{v,u}} \\cdot 1000$", 
                hasil: formatNumber(s1), 
                satuan: 'mm' 
            },
            { 
                parameter: rumusS2, 
                hasil: formatNumber(s2), 
                satuan: 'mm' 
            },
            { 
                parameter: rumusS3, 
                hasil: formatNumber(s3), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle s = \\min(s_1, s_2, s_3)$", 
                hasil: formatNumber(begel.s, 0), 
                satuan: 'mm' 
            },
            { 
                parameter: "$\\displaystyle A_{v,terpasang} = \\dfrac{n_{kaki} \\cdot \\pi \\cdot \\phi^2}{4 \\cdot s} \\cdot 1000$", 
                hasil: formatNumber(begel.Av_terpakai), 
                satuan: 'mm²/m' 
            },
            { 
                parameter: "$A_{v,terpasang} \\ge A_{v,u}$", 
                isStatus: true, 
                statusHtml: `<span class="${kontrolGeser.Av_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Av_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            }
        ];
        
        return createThreeColumnTable(rows, true);
    }

    // ==============================================
    // FUNGSI DIPERBAIKI: Ringkasan Kontrol Keamanan
    // ==============================================
    function createKontrolTable() {
        const kontrolLentur = getData('kontrol.lentur', {});
        const kontrolGeser = getData('kontrol.geser', {});
        const hasilTulangan = getData('data.hasilTulangan', {});
        const kondisi = hasilTulangan.kondisi || '';
        
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
            }
        ];
        
        // Hanya tampilkan kontrol K jika kondisi adalah 'at2 > ac'
        if (kondisi === 'at2 > ac') {
            rows.push({ 
                parameter: "$K \\le K_{maks}$", 
                statusHtml: `<span class="${kontrolLentur.K_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolLentur.K_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            });
        }
        
        rows.push(
            { 
                parameter: "$V_s \\le V_{s,max}$", 
                statusHtml: `<span class="${kontrolGeser.Vs_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Vs_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            },
            { 
                parameter: "$A_{v,terpasang} \\ge A_{v,u}$", 
                statusHtml: `<span class="${kontrolGeser.Av_ok ? 'status-aman' : 'status-tidak-aman'}">${kontrolGeser.Av_ok ? 'AMAN' : 'TIDAK AMAN'}</span>` 
            }
        );
        
        return createTwoColumnTable(rows);
    }

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
        
        conclusionHTML += `
            <p style="margin-top: 8px;"><strong>Rekomendasi:</strong></p>
            <div style="margin: 8px 0 12px 0; padding: 8px; background-color: #f0f8ff; border-radius: 4px;">
                ${rekomendasi.map(r => `<p class="recommendation-item">• ${r}</p>`).join('')}
            </div>
        `;
        
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
            <div class="keep-together">
                <h2>A. DATA INPUT DAN PARAMETER</h2>
                <div class="section-group">
                    <h3>1. Data Material dan Dimensi</h3>
                    ${createMaterialDimensiTable()}
                </div>
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
            <div class="header-content-group keep-together">
                <h2>B. PERHITUNGAN TULANGAN LENTUR KOLOM</h2>
                <p class="note">Perhitungan tulangan lentur dengan beban aksial dan momen (kolom dengan eksentrisitas)</p>
                <div class="section-group">
                    <h3>1. Analisis Tulangan Lentur</h3>
                    ${createLenturTableDetail()}
                </div>
            </div>
        `);
        
        blocks.push(`
            <div class="header-content-group keep-together">
                <h2>C. PERHITUNGAN TULANGAN GESER</h2>
                <p class="note">Perhitungan tulangan geser untuk menahan gaya geser pada kolom</p>
                <div class="section-group">
                    <h3>1. Analisis Tulangan Geser</h3>
                    ${createGeserTableDetail()}
                </div>
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
                ${createTulanganTerpasangTable()}
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

    window.kolomReport = {
        setData: setData,
        generateContentBlocks: generateContentBlocks,
        cekStatusKolom: cekStatusKolom,
        formatNumber: formatNumber,
        getData: getData
    };
})();