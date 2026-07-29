// cut-fondasimenerus.js - Render tampak fondasi menerus (strip footing)
// Revisi: Perbaikan AutoDimensi, Hapus nilai default, Penggabungan fungsi CAD, dan Urutan perintah (LINE -> PL -> CIRCLE)

(function() {
    function renderFondasiMenerus(config, containerId) {
        console.log("🏗️ Rendering fondasi menerus (konsep tunggal):", config, containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} tidak ditemukan`);
            return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
        }
        container.innerHTML = "";

        // Ambil data dari session storage terlebih dahulu agar bisa ditimpa ke config jika autodimensi on
        let fondasiData = null;
        try {
            const saved = sessionStorage.getItem('calculationResultFondasi') || sessionStorage.getItem('calculationResult');
            if (saved) fondasiData = JSON.parse(saved);
            console.log("📦 Data fondasi dari sessionStorage:", fondasiData);
        } catch(e) { console.warn("Gagal baca session storage", e); }

        function getData(path, defaultValue = null) {
            if (!fondasiData) return defaultValue;
            const parts = path.split('.');
            let current = fondasiData;
            for (let p of parts) {
                if (current[p] === undefined || current[p] === null) return defaultValue;
                current = current[p];
            }
            return current;
        }

        // Prioritaskan hasil kalkulasi autodimensi jika ada
        let { jenis, L, B, H } = config;
        L = parseFloat(getData('data.dimensiOptimal.Lx')) || parseFloat(L) || 0;
        B = parseFloat(getData('data.dimensiOptimal.Ly')) || parseFloat(B) || 0;
        H = parseFloat(getData('data.dimensiOptimal.h')) || parseFloat(H) || 0;

        // Validasi parameter
        if (jenis === 'atas') {
            if (!L || !B) {
                console.error("Parameter fondasi menerus tampak atas tidak lengkap", {L, B});
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi menerus tidak lengkap</p><p>Periksa L, B</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
            }
        } else if (jenis === 'samping') {
            if (!L || !H) {
                console.error("Parameter fondasi menerus tampak samping tidak lengkap", {L, H});
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi menerus tidak lengkap</p><p>Periksa L, H</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
            }
        } else if (jenis === 'depan') {
            if (!B || !H) {
                console.error("Parameter fondasi menerus tampak depan tidak lengkap", {B, H});
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi menerus tidak lengkap</p><p>Periksa B, H</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
            }
        }

        // Hapus nilai default
        let selimutBeton = parseFloat(getData('data.parameter.sbeton')) || parseFloat(getData('data.parameter.ds')) || parseFloat(getData('data.kuatDukung.Cb')) || 0;
        let diameterUtama = 0, spasiUtama = 0;
        let diameterBagi = 0, spasiBagi = 0;

        // Ambil dari rekap
        const tulanganUtamaStr = getData('rekap.tulangan_utama', '');
        const tulanganBagiStr = getData('rekap.tulangan_bagi', '');
        if (tulanganUtamaStr) {
            const matchUtama = tulanganUtamaStr.match(/[Øɸ](\d+)-(\d+)/);
            if (matchUtama) {
                diameterUtama = parseInt(matchUtama[1], 10);
                spasiUtama = parseInt(matchUtama[2], 10);
            }
        }
        if (tulanganBagiStr) {
            const matchBagi = tulanganBagiStr.match(/[Øɸ](\d+)-(\d+)/);
            if (matchBagi) {
                diameterBagi = parseInt(matchBagi[1], 10);
                spasiBagi = parseInt(matchBagi[2], 10);
            }
        }

        // Ambil dari input jika direkap masih 0
        if (diameterUtama === 0) diameterUtama = parseFloat(getData('inputData.tulangan.d')) || 0;
        if (spasiUtama === 0) spasiUtama = parseFloat(getData('data.tulangan.s')) || parseFloat(getData('inputData.tulangan.s')) || 0;
        if (diameterBagi === 0) diameterBagi = parseFloat(getData('inputData.tulangan.db')) || 0;
        if (spasiBagi === 0) spasiBagi = parseFloat(getData('data.tulangan.sb')) || parseFloat(getData('inputData.tulangan.sb')) || 0;

        if (!selimutBeton) {
            const d = getData('data.parameter.d', null);
            if (d && H) {
                const h_mm = H * 1000;
                selimutBeton = Math.round(h_mm - d - diameterUtama/2);
                if (selimutBeton < 20) selimutBeton = 0; 
            }
        }
        
        console.log(`Selimut beton: ${selimutBeton} mm, Utama: D${diameterUtama}-${spasiUtama}, Bagi: D${diameterBagi}-${spasiBagi}`);

        // Dimensi asli (mm)
        let width_original_mm, height_original_mm;
        if (jenis === 'atas') {
            width_original_mm = B * 1000;
            height_original_mm = L * 1000;
        } else if (jenis === 'samping') {
            width_original_mm = L * 1000;
            height_original_mm = H * 1000;
        } else { // depan
            width_original_mm = B * 1000;
            height_original_mm = H * 1000;
        }

        // Hitung skala
        let width_display, height_display;
        let skala_horizontal = 1, skala_vertikal = 1;
        let needScaleNote = false;
        const RASIO_ATAS_MAKS = 1.5;
        const RASIO_SAMPING_MAKS = 8;

        if (jenis === 'atas') {
            let panjang = Math.max(width_original_mm, height_original_mm);
            let pendek = Math.min(width_original_mm, height_original_mm);
            if (panjang / pendek > RASIO_ATAS_MAKS) {
                needScaleNote = true;
                const faktor = RASIO_ATAS_MAKS * pendek / panjang;
                if (width_original_mm > height_original_mm) {
                    skala_horizontal = faktor;
                    width_display = width_original_mm * faktor;
                    height_display = height_original_mm;
                } else {
                    skala_vertikal = faktor;
                    width_display = width_original_mm;
                    height_display = height_original_mm * faktor;
                }
            } else {
                width_display = width_original_mm;
                height_display = height_original_mm;
            }
        } else {
            let lebar = width_original_mm;
            let tinggi = height_original_mm;
            if (lebar / tinggi > RASIO_SAMPING_MAKS) {
                needScaleNote = true;
                skala_horizontal = RASIO_SAMPING_MAKS * tinggi / lebar;
                width_display = lebar * skala_horizontal;
                height_display = tinggi;
            } else if (tinggi / lebar > RASIO_SAMPING_MAKS) {
                needScaleNote = true;
                skala_vertikal = RASIO_SAMPING_MAKS * lebar / tinggi;
                width_display = lebar;
                height_display = tinggi * skala_vertikal;
            } else {
                width_display = lebar;
                height_display = tinggi;
            }
        }

        const padding = width_display * 0.05;
        const viewBoxWidth = width_display + padding * 2;
        const viewBoxHeight = height_display + padding * 2;
        const offsetX = padding;
        const offsetY = padding;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        container.appendChild(svg);

        // Fungsi bantu
        function buatRect(x, y, w, h, warna, strokeWidth = 2, fill = "none") {
            const rect = document.createElementNS(svgNS, "rect");
            rect.setAttribute("x", x);
            rect.setAttribute("y", y);
            rect.setAttribute("width", w);
            rect.setAttribute("height", h);
            rect.setAttribute("fill", fill);
            rect.setAttribute("stroke", warna);
            rect.setAttribute("stroke-width", strokeWidth);
            rect.setAttribute("vector-effect", "non-scaling-stroke");
            svg.appendChild(rect);
            return rect;
        }

        function buatGaris(x1, y1, x2, y2, warna, strokeWidth = 2) {
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
            line.setAttribute("stroke", warna);
            line.setAttribute("stroke-width", strokeWidth);
            line.setAttribute("vector-effect", "non-scaling-stroke");
            line.setAttribute("stroke-linecap", "round");
            svg.appendChild(line);
            return line;
        }

        function buatSegitiga(orientasi, posisiX, posisiY, lebar, tinggi, warna, jumlah = 1) {
            if (jumlah === 1) {
                let points = '';
                if (orientasi === 'up') {
                    points = `${posisiX},${posisiY - tinggi} ${posisiX - lebar/2},${posisiY} ${posisiX + lebar/2},${posisiY}`;
                } else if (orientasi === 'down') {
                    points = `${posisiX},${posisiY + tinggi} ${posisiX - lebar/2},${posisiY} ${posisiX + lebar/2},${posisiY}`;
                } else if (orientasi === 'left') {
                    points = `${posisiX - lebar},${posisiY} ${posisiX},${posisiY - tinggi/2} ${posisiX},${posisiY + tinggi/2}`;
                } else if (orientasi === 'right') {
                    points = `${posisiX + lebar},${posisiY} ${posisiX},${posisiY - tinggi/2} ${posisiX},${posisiY + tinggi/2}`;
                }
                const polygon = document.createElementNS(svgNS, "polygon");
                polygon.setAttribute("points", points);
                polygon.setAttribute("fill", warna);
                polygon.setAttribute("stroke", "none");
                svg.appendChild(polygon);
            } else if (jumlah === 2) {
                if (orientasi === 'left' || orientasi === 'right') {
                    const offset = tinggi / 2;
                    const y1 = posisiY - offset;
                    const y2 = posisiY + offset;
                    for (let y of [y1, y2]) {
                        let points = '';
                        if (orientasi === 'left') {
                            points = `${posisiX - lebar},${y} ${posisiX},${y - tinggi/2} ${posisiX},${y + tinggi/2}`;
                        } else {
                            points = `${posisiX + lebar},${y} ${posisiX},${y - tinggi/2} ${posisiX},${y + tinggi/2}`;
                        }
                        const polygon = document.createElementNS(svgNS, "polygon");
                        polygon.setAttribute("points", points);
                        polygon.setAttribute("fill", warna);
                        polygon.setAttribute("stroke", "none");
                        svg.appendChild(polygon);
                    }
                } else {
                    const offset = lebar / 2;
                    const x1 = posisiX - offset;
                    const x2 = posisiX + offset;
                    for (let x of [x1, x2]) {
                        let points = '';
                        if (orientasi === 'up') {
                            points = `${x},${posisiY - tinggi} ${x - lebar/2},${posisiY} ${x + lebar/2},${posisiY}`;
                        } else {
                            points = `${x},${posisiY + tinggi} ${x - lebar/2},${posisiY} ${x + lebar/2},${posisiY}`;
                        }
                        const polygon = document.createElementNS(svgNS, "polygon");
                        polygon.setAttribute("points", points);
                        polygon.setAttribute("fill", warna);
                        polygon.setAttribute("stroke", "none");
                        svg.appendChild(polygon);
                    }
                }
            }
        }

        function hitungPosisiTitik(startX, endX, stepAsli, radiusTitik, diameterTulanganDisplay) {
            const leftBound = startX + radiusTitik;
            const rightBound = endX - radiusTitik;
            if (leftBound >= rightBound) return [];

            const minStep = 2.5 * radiusTitik;
            const step = Math.max(stepAsli, minStep);

            let positions = [];
            let current = leftBound;
            while (current <= rightBound) {
                positions.push(current);
                current += step;
            }

            if (positions.length > 0) {
                const jarakKiri = positions[0] - leftBound;
                if (jarakKiri >= 3 * diameterTulanganDisplay) {
                    positions.unshift(leftBound);
                }
            } else {
                positions.push(leftBound);
            }

            const lastIdx = positions.length - 1;
            const jarakKanan = rightBound - positions[lastIdx];
            if (jarakKanan >= 3 * diameterTulanganDisplay) {
                positions.push(rightBound);
            }

            return positions;
        }

        function buatLingkaran(cx, cy, radius, warna) {
            const circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("cx", cx);
            circle.setAttribute("cy", cy);
            circle.setAttribute("r", radius);
            circle.setAttribute("fill", warna);
            circle.setAttribute("stroke", "none");
            svg.appendChild(circle);
        }

        const strokePx = 2;
        const warnaHitam = "#000000";
        const warnaMerah = "#FF0000";
        const segitigaLebar = height_display * 0.035;
        const segitigaTinggi = height_display * 0.035;
        const radiusTitik = strokePx * 8;      
        const offsetTitikDariGaris = strokePx * 10; 

        // Gambar outline fondasi
        buatRect(offsetX, offsetY, width_display, height_display, "#000000", strokePx, "#f8f9fa");

        // ================== TAMPAK ATAS ==================
        if (jenis === 'atas') {
            const gapHor = width_display * 0.02;
            const gapVer = height_display * 0.02;

            const y_garis_hor = offsetY + (8/15) * height_display;
            const x_kiri_hor = offsetX + gapHor;
            const x_kanan_hor = offsetX + width_display - gapHor;
            buatGaris(x_kiri_hor, y_garis_hor, x_kanan_hor, y_garis_hor, warnaHitam, strokePx);
            const panjangGarisHor = x_kanan_hor - x_kiri_hor;
            const x_segitiga_hor = x_kiri_hor + (8/15) * panjangGarisHor;
            buatSegitiga('up', x_segitiga_hor, y_garis_hor, segitigaLebar, segitigaTinggi, warnaHitam, 1);
            const deltaHor = segitigaTinggi;
            buatGaris(x_kiri_hor, y_garis_hor, x_kiri_hor + deltaHor, y_garis_hor - deltaHor, warnaHitam, strokePx);
            buatGaris(x_kanan_hor, y_garis_hor, x_kanan_hor - deltaHor, y_garis_hor - deltaHor, warnaHitam, strokePx);

            const x_tengah = offsetX + width_display / 2;
            const y_atas_vert = offsetY + gapVer;
            const y_bawah_vert = offsetY + height_display - gapVer;
            const y_segitiga_vert = offsetY + (7/15) * height_display;
            buatGaris(x_tengah, y_atas_vert, x_tengah, y_bawah_vert, warnaMerah, strokePx);
            buatSegitiga('left', x_tengah, y_segitiga_vert, segitigaLebar, segitigaTinggi, warnaMerah, 2);
            const deltaVer = segitigaTinggi;
            buatGaris(x_tengah, y_atas_vert, x_tengah - deltaVer, y_atas_vert + deltaVer, warnaMerah, strokePx);
            buatGaris(x_tengah, y_bawah_vert, x_tengah - deltaVer, y_bawah_vert - deltaVer, warnaMerah, strokePx);
        }

        // ================== TAMPAK DEPAN (arah lebar B) ==================
        if (jenis === 'depan') {
            const gapDepan = width_display * 0.02;
            const x_kiri_garis = offsetX + gapDepan;
            const x_kanan_garis = offsetX + width_display - gapDepan;

            const jarakDariBawah_mm = selimutBeton + diameterBagi;
            const tinggiTotal_mm = H * 1000;
            const propDariBawah = (tinggiTotal_mm !== 0) ? (jarakDariBawah_mm / tinggiTotal_mm) : 0;
            const y_garis = offsetY + height_display * (1 - propDariBawah);
            buatGaris(x_kiri_garis, y_garis, x_kanan_garis, y_garis, warnaHitam, strokePx);

            const y_dot = y_garis + offsetTitikDariGaris;

            const lebarFondasi_m = B;
            const faktorSkala = (lebarFondasi_m !== 0) ? (width_display / (lebarFondasi_m * 1000)) : 0;
            const stepBagi = spasiBagi * faktorSkala;
            const diameterBagiDisplay = diameterBagi * faktorSkala;

            const posTitik = hitungPosisiTitik(x_kiri_garis, x_kanan_garis, stepBagi, radiusTitik, diameterBagiDisplay);
            for (let cx of posTitik) {
                buatLingkaran(cx, y_dot, radiusTitik, warnaMerah);
            }
        }

        // ================== TAMPAK SAMPING (arah panjang L) ==================
        if (jenis === 'samping') {
            const gapSamping = width_display * 0.02;
            const x_kiri_garis = offsetX + gapSamping;
            const x_kanan_garis = offsetX + width_display - gapSamping;

            const jarakDariBawah_mm = selimutBeton + diameterUtama;
            const tinggiTotal_mm = H * 1000;
            const propDariBawah = (tinggiTotal_mm !== 0) ? (jarakDariBawah_mm / tinggiTotal_mm) : 0;
            const y_garis = offsetY + height_display * (1 - propDariBawah);
            buatGaris(x_kiri_garis, y_garis, x_kanan_garis, y_garis, warnaMerah, strokePx);

            const y_dot = y_garis - radiusTitik; 

            const panjangFondasi_m = L;
            const faktorSkala = (panjangFondasi_m !== 0) ? (width_display / (panjangFondasi_m * 1000)) : 0;
            const stepUtama = spasiUtama * faktorSkala;
            const diameterUtamaDisplay = diameterUtama * faktorSkala;

            const posTitik = hitungPosisiTitik(x_kiri_garis, x_kanan_garis, stepUtama, radiusTitik, diameterUtamaDisplay);
            for (let cx of posTitik) {
                buatLingkaran(cx, y_dot, radiusTitik, warnaHitam);
            }
        }

        console.log(`✅ Fondasi menerus tampak ${jenis} selesai (dot dengan aturan jarak).`);
        return {
            config,
            containerId,
            jenisFondasi: 'menerus',
            scaleInfo: {
                needScaleNote,
                skala_horizontal,
                skala_vertikal,
                originalWidth: width_original_mm,
                originalHeight: height_original_mm,
                displayedWidth: width_display,
                displayedHeight: height_display
            },
            error: false
        };
    }

    window.foundationRenderers.menerus = renderFondasiMenerus;
    console.log("✅ cut-fondasimenerus.js renderer terpasang");

    // =========================================================================
    // Fungsi CAD Fondasi Menerus (Tanpa Parameter, Gabung 3 View)
    // =========================================================================
    function generateCADFondasiMenerus() {
        try {
            let fondasiData = null;
            try {
                const saved = sessionStorage.getItem('calculationResultFondasi') || sessionStorage.getItem('calculationResult');
                if (saved) fondasiData = JSON.parse(saved);
            } catch(e) { console.warn("Gagal baca session storage", e); }

            function getData(path, defaultValue = null) {
                if (!fondasiData) return defaultValue;
                const parts = path.split('.');
                let current = fondasiData;
                for (let p of parts) {
                    if (current[p] === undefined || current[p] === null) return defaultValue;
                    current = current[p];
                }
                return current;
            }

            // Hapus nilai default, pastikan membaca dimensi dari Autodimensi terlebih dulu
            let L = parseFloat(getData('data.dimensiOptimal.Lx')) || parseFloat(getData('data.parameter.lx')) || parseFloat(getData('inputData.fondasi.dimensi.lx')) || 0;
            let B = parseFloat(getData('data.dimensiOptimal.Ly')) || parseFloat(getData('data.parameter.ly')) || parseFloat(getData('inputData.fondasi.dimensi.ly')) || 0;
            let H = parseFloat(getData('data.dimensiOptimal.h')) || parseFloat(getData('data.parameter.h')) || parseFloat(getData('inputData.fondasi.dimensi.h')) || 0;

            // Fallback dimensi dari hasil rekap jika semuanya masih 0
            if (L === 0 || B === 0 || H === 0) {
                const rekapDim = getData('rekap.dimensi');
                if (rekapDim) {
                    const match = rekapDim.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*[×x]\s*([\d.]+)/);
                    if (match) {
                        L = parseFloat(match[1]);
                        B = parseFloat(match[2]);
                        H = parseFloat(match[3]);
                    }
                }
            }

            // Parameter tulangan
            let selimutBeton = parseFloat(getData('data.parameter.sbeton')) || parseFloat(getData('data.parameter.ds')) || parseFloat(getData('data.kuatDukung.Cb')) || 0;
            let diameterUtama = 0, spasiUtama = 0;
            let diameterBagi = 0, spasiBagi = 0;

            const tulanganUtamaStr = getData('rekap.tulangan_utama', '');
            const tulanganBagiStr = getData('rekap.tulangan_bagi', '');
            if (tulanganUtamaStr) {
                const matchUtama = tulanganUtamaStr.match(/[Øɸ](\d+)-(\d+)/);
                if (matchUtama) {
                    diameterUtama = parseInt(matchUtama[1], 10);
                    spasiUtama = parseInt(matchUtama[2], 10);
                }
            }
            if (tulanganBagiStr) {
                const matchBagi = tulanganBagiStr.match(/[Øɸ](\d+)-(\d+)/);
                if (matchBagi) {
                    diameterBagi = parseInt(matchBagi[1], 10);
                    spasiBagi = parseInt(matchBagi[2], 10);
                }
            }

            if (diameterUtama === 0) diameterUtama = parseFloat(getData('inputData.tulangan.d')) || 0;
            if (spasiUtama === 0) spasiUtama = parseFloat(getData('data.tulangan.s')) || parseFloat(getData('inputData.tulangan.s')) || 0;
            if (diameterBagi === 0) diameterBagi = parseFloat(getData('inputData.tulangan.db')) || 0;
            if (spasiBagi === 0) spasiBagi = parseFloat(getData('data.tulangan.sb')) || parseFloat(getData('inputData.tulangan.sb')) || 0;

            if (!selimutBeton) {
                const d = getData('data.parameter.d', null);
                if (d && H) {
                    const h_mm = H * 1000;
                    selimutBeton = Math.round(h_mm - d - diameterUtama/2);
                    if (selimutBeton < 20) selimutBeton = 0;
                }
            }

            // Dimensi dalam mm
            const L_mm = L * 1000;
            const B_mm = B * 1000;
            const H_mm = H * 1000;

            // Pemisahan pengumpulan baris perintah secara rapi (mencegah bug PL ngikut LINE)
            let cadLinesLine = [];
            let cadLinesPL = [];
            let cadLinesCircle = [];

            const tambahPerintah = (cmd) => {
                if (!cmd) return;
                const trimCmd = cmd.trimStart();
                if (trimCmd.startsWith("LINE")) {
                    cadLinesLine.push(cmd);
                } else if (trimCmd.startsWith("PL")) {
                    cadLinesPL.push(cmd);
                } else if (trimCmd.startsWith("CIRCLE")) {
                    cadLinesCircle.push(cmd);
                } else {
                    cadLinesLine.push(cmd);
                }
            };

            function hitungPosisiTitikCAD(startXmm, endXmm, stepmm, diameterMM) {
                let positions = [];
                if (startXmm >= endXmm || stepmm <= 0) return positions;
                let current = startXmm;
                while (current <= endXmm) {
                    positions.push(current);
                    current += stepmm;
                }
                if (positions.length > 0) {
                    const last = positions[positions.length - 1];
                    if (endXmm - last >= 3 * diameterMM) positions.push(endXmm);
                    else positions[positions.length - 1] = endXmm;
                }
                return positions;
            }

            // Urutan disatukan agar saat dicopy semua gambar langsung dieksekusi bersamaan
            const daftarTampak = ['samping', 'atas', 'depan'];

            daftarTampak.forEach(jenisTampak => {
                let cadOffsetY = 0;
                if (jenisTampak === 'samping') {
                    cadOffsetY = 0;
                } else if (jenisTampak === 'atas') {
                    cadOffsetY = 1.5 * H_mm;
                } else if (jenisTampak === 'depan') {
                    cadOffsetY = (2 * H_mm) + L_mm;
                }

                // Helper CAD
                const lingkaran = (cx, cy, diameter) => `CIRCLE ${cx},${cy + cadOffsetY} ${diameter/2} `;
                const garis = (x1, y1, x2, y2) => `LINE ${x1},${y1 + cadOffsetY} ${x2},${y2 + cadOffsetY} `;
                
                const polyline = (points, tebal, closed = false) => {
                    if (!points.length) return '';
                    let cmd = `PL ${points[0][0]},${points[0][1] + cadOffsetY} W ${tebal} ${tebal} `;
                    for (let i = 1; i < points.length; i++) {
                        const dx = points[i][0] - points[i-1][0];
                        const dy = points[i][1] - points[i-1][1];
                        cmd += `@${dx},${dy} `;
                    }
                    if (closed) {
                        cmd += 'C ';
                    } else {
                        cmd += 'ENTER ';
                    }
                    return cmd;
                };

                const buatSegitigaCADLocal = (centerX, centerY, arah, ukuran, tebal) => {
                    const setengah = ukuran / 2;
                    let p1, p2, p3;
                    if (arah === 'up') {
                        p1 = [centerX - setengah, centerY];
                        p2 = [centerX + setengah, centerY];
                        p3 = [centerX, centerY - ukuran];
                    } else if (arah === 'down') {
                        p1 = [centerX - setengah, centerY];
                        p2 = [centerX + setengah, centerY];
                        p3 = [centerX, centerY + ukuran];
                    } else if (arah === 'left') {
                        p1 = [centerX, centerY - setengah];
                        p2 = [centerX, centerY + setengah];
                        p3 = [centerX - ukuran, centerY];
                    } else if (arah === 'right') {
                        p1 = [centerX, centerY - setengah];
                        p2 = [centerX, centerY + setengah];
                        p3 = [centerX + ukuran, centerY];
                    } else {
                        return '';
                    }
                    return polyline([p1, p2, p3], tebal, true);
                };

                const flipY = (y, tinggiTotal) => tinggiTotal - y;
                
                let tinggiTotal;
                if (jenisTampak === 'depan') tinggiTotal = H_mm;
                else if (jenisTampak === 'atas') tinggiTotal = L_mm;
                else if (jenisTampak === 'samping') tinggiTotal = H_mm;
                else return;

                // Frame kotak (outline fondasi)
                if (jenisTampak === 'depan') {
                    tambahPerintah(garis(0, 0, B_mm, 0));
                    tambahPerintah(garis(B_mm, 0, B_mm, H_mm));
                    tambahPerintah(garis(B_mm, H_mm, 0, H_mm));
                    tambahPerintah(garis(0, H_mm, 0, 0));
                } else if (jenisTampak === 'atas') {
                    tambahPerintah(garis(0, 0, B_mm, 0));
                    tambahPerintah(garis(B_mm, 0, B_mm, L_mm));
                    tambahPerintah(garis(B_mm, L_mm, 0, L_mm));
                    tambahPerintah(garis(0, L_mm, 0, 0));
                } else if (jenisTampak === 'samping') {
                    tambahPerintah(garis(0, 0, L_mm, 0));
                    tambahPerintah(garis(L_mm, 0, L_mm, H_mm));
                    tambahPerintah(garis(L_mm, H_mm, 0, H_mm));
                    tambahPerintah(garis(0, H_mm, 0, 0));
                }

                const ukuranSegitiga = 0.035 * L_mm;

                // ========== TAMPAK ATAS ==========
                if (jenisTampak === 'atas') {
                    const gapHor = selimutBeton;
                    const gapVer = selimutBeton;

                    // Tulangan utama (hitam) – garis horizontal
                    const y_garis_hor = L_mm * (8/15);
                    const x_kiri_hor = gapHor;
                    const x_kanan_hor = B_mm - gapHor;
                    
                    tambahPerintah(polyline([
                        [x_kiri_hor + ukuranSegitiga, flipY(y_garis_hor - ukuranSegitiga, tinggiTotal)],
                        [x_kiri_hor, flipY(y_garis_hor, tinggiTotal)],
                        [x_kanan_hor, flipY(y_garis_hor, tinggiTotal)],
                        [x_kanan_hor - ukuranSegitiga, flipY(y_garis_hor - ukuranSegitiga, tinggiTotal)]
                    ], diameterUtama));
                    
                    const x_segitiga_hor = x_kiri_hor + (8/15) * (x_kanan_hor - x_kiri_hor);
                    tambahPerintah(buatSegitigaCADLocal(x_segitiga_hor, flipY(y_garis_hor, tinggiTotal), 'down', ukuranSegitiga, diameterUtama));

                    // Tulangan bagi (merah) – garis vertikal tengah
                    const x_tengah = B_mm / 2;
                    const y_atas_vert = gapVer;
                    const y_bawah_vert = L_mm - gapVer;
                    const y_segitiga_vert = L_mm * (7/15);
                    
                    tambahPerintah(polyline([
                        [x_tengah - ukuranSegitiga, flipY(y_atas_vert + ukuranSegitiga, tinggiTotal)],
                        [x_tengah, flipY(y_atas_vert, tinggiTotal)],
                        [x_tengah, flipY(y_bawah_vert, tinggiTotal)],
                        [x_tengah - ukuranSegitiga, flipY(y_bawah_vert - ukuranSegitiga, tinggiTotal)]
                    ], diameterBagi));
                    
                    tambahPerintah(buatSegitigaCADLocal(x_tengah, flipY(y_segitiga_vert, tinggiTotal), 'left', ukuranSegitiga, diameterBagi));
                    tambahPerintah(buatSegitigaCADLocal(x_tengah, flipY(y_segitiga_vert, tinggiTotal)+ukuranSegitiga, 'left', ukuranSegitiga, diameterBagi)); // double untuk dua segitiga
                }

                // ========== TAMPAK DEPAN (arah lebar B) ==========
                if (jenisTampak === 'depan') {
                    const gap = selimutBeton;
                    const x_kiri = gap;
                    const x_kanan = B_mm - gap;

                    // Garis tulangan bagi (merah)
                    const y_garis = selimutBeton+diameterBagi+diameterUtama/2;
                    tambahPerintah(polyline([[x_kiri, y_garis], [x_kanan, y_garis]], diameterUtama));

                    const y_titik = selimutBeton+diameterBagi/2; 
                    const step = spasiBagi;
                    const posTitik = hitungPosisiTitikCAD(x_kiri + diameterBagi/2, x_kanan - diameterBagi/2, step, diameterBagi);
                    for (let x of posTitik) {
                        tambahPerintah(lingkaran(x, y_titik, diameterBagi));
                    }
                }

                // ========== TAMPAK SAMPING (arah panjang L) ==========
                if (jenisTampak === 'samping') {
                    const gap = selimutBeton;
                    const x_kiri = gap;
                    const x_kanan = L_mm - gap;

                    // Garis tulangan utama (merah)
                    const y_garis = selimutBeton+diameterBagi/2;
                    tambahPerintah(polyline([[x_kiri, y_garis], [x_kanan, y_garis]], diameterBagi));

                    const y_titik = selimutBeton+diameterBagi+diameterUtama/2;
                    const step = spasiUtama;
                    const posTitik = hitungPosisiTitikCAD(x_kiri + diameterUtama/2, x_kanan - diameterUtama/2, step, diameterUtama);
                    for (let x of posTitik) {
                        tambahPerintah(lingkaran(x, y_titik, diameterUtama));
                    }
                }
            });

            // Penggabungan final dengan memastikan LINE dipisah dengan ENTER, dan PL dieksekusi sebelum CIRCLE
            let finalLines = [];
            
            if (cadLinesLine.length > 0) {
                finalLines = finalLines.concat(cadLinesLine);
                finalLines.push("ENTER"); // Menghindari bug bocor / line tersangkut
            }
            
            if (cadLinesPL.length > 0) {
                finalLines = finalLines.concat(cadLinesPL);
                finalLines.push("ENTER"); // Menghindari bug command polyline nyangkut
            }
            
            if (cadLinesCircle.length > 0) {
                finalLines = finalLines.concat(cadLinesCircle);
            }
            
            return finalLines.join("\n");

        } catch (error) {
            console.error("Gagal generate CAD fondasi menerus:", error);
            return "ERROR DETECTED: " + error.message + "\n" + error.stack;
        }
    }

    // Fungsi helper buat segitiga untuk CAD (Global fallback)
    function buatSegitigaCAD(centerX, centerY, arah, ukuran, tebal) {
        const setengah = ukuran / 2;
        let p1, p2, p3;
        if (arah === 'up') {
            p1 = [centerX - setengah, centerY];
            p2 = [centerX + setengah, centerY];
            p3 = [centerX, centerY - ukuran];
        } else if (arah === 'down') {
            p1 = [centerX - setengah, centerY];
            p2 = [centerX + setengah, centerY];
            p3 = [centerX, centerY + ukuran];
        } else if (arah === 'left') {
            p1 = [centerX, centerY - setengah];
            p2 = [centerX, centerY + setengah];
            p3 = [centerX - ukuran, centerY];
        } else if (arah === 'right') {
            p1 = [centerX, centerY - setengah];
            p2 = [centerX, centerY + setengah];
            p3 = [centerX + ukuran, centerY];
        } else {
            return '';
        }
        let cmd = `PL ${p1[0]},${p1[1]} W ${tebal} ${tebal} `;
        cmd += `@${p2[0]-p1[0]},${p2[1]-p1[1]} `;
        cmd += `@${p3[0]-p2[0]},${p3[1]-p2[1]} `;
        cmd += `C `;
        return cmd;
    }

    // Ekspos fungsi ke global (Tanpa parameter jenisTampak)
    window.generateCADFondasiMenerus = generateCADFondasiMenerus;
    window.buatSegitigaCADMenerus = buatSegitigaCAD;

    console.log("✅ cut-fondasimenerus.js - fungsi CAD gabungan 3 view selesai diload");
})();