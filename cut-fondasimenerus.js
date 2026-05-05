// cut-fondasimenerus.js - Render tampak fondasi menerus (strip footing)
// Revisi: Perbaikan posisi dot dengan offset radius titik dari ujung garis,
//        serta aturan jarak minimum antar dot (2.5 * radiusTitik) dan jarak ujung (3 * diameter tulangan)

(function() {
    function renderFondasiMenerus(config, containerId) {
        console.log("🏗️ Rendering fondasi menerus (konsep tunggal):", config, containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} tidak ditemukan`);
            return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
        }
        container.innerHTML = "";

        const { jenis, L, B, H } = config;

        // Validasi parameter
        if (jenis === 'atas') {
            if (!L || !B) {
                console.error("Parameter fondasi menerus tampak atas tidak lengkap", config);
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi menerus tidak lengkap</p><p>Periksa L, B</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
            }
        } else if (jenis === 'samping') {
            if (!L || !H) {
                console.error("Parameter fondasi menerus tampak samping tidak lengkap", config);
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi menerus tidak lengkap</p><p>Periksa L, H</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
            }
        } else if (jenis === 'depan') {
            if (!B || !H) {
                console.error("Parameter fondasi menerus tampak depan tidak lengkap", config);
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi menerus tidak lengkap</p><p>Periksa B, H</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
            }
        } else {
            console.error("Jenis tampak tidak dikenal:", jenis);
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Jenis tampak harus 'atas', 'samping', atau 'depan'</p></div>`;
            return { config, containerId, scaleInfo: null, jenisFondasi: 'menerus', error: true };
        }

        // Ambil data dari session storage
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
                if (current[p] === undefined) return defaultValue;
                current = current[p];
            }
            return current;
        }

        // Parameter tulangan
        let selimutBeton = 75; // default
        let diameterUtama = 16, spasiUtama = 250;
        let diameterBagi = 16, spasiBagi = 400;

        // Ambil dari rekap
        const tulanganUtamaStr = getData('rekap.tulangan_utama', '');
        const tulanganBagiStr = getData('rekap.tulangan_bagi', '');
        if (tulanganUtamaStr) {
            const matchUtama = tulanganUtamaStr.match(/ɸ(\d+)-(\d+)/);
            if (matchUtama) {
                diameterUtama = parseInt(matchUtama[1], 10);
                spasiUtama = parseInt(matchUtama[2], 10);
            }
        }
        if (tulanganBagiStr) {
            const matchBagi = tulanganBagiStr.match(/ɸ(\d+)-(\d+)/);
            if (matchBagi) {
                diameterBagi = parseInt(matchBagi[1], 10);
                spasiBagi = parseInt(matchBagi[2], 10);
            }
        }

        // Coba ambil selimut dari data
        const ds = getData('data.parameter.ds', null);
        const cb = getData('data.kuatDukung.Cb', null);
        if (ds) selimutBeton = Number(ds);
        else if (cb) selimutBeton = Number(cb);
        else {
            // Hitung dari tinggi efektif jika ada
            const d = getData('data.parameter.d', null);
            if (d && H) {
                const h_mm = H * 1000;
                selimutBeton = Math.round(h_mm - d - diameterUtama/2);
                if (selimutBeton < 20) selimutBeton = 75;
            }
        }
        console.log(`Selimut beton: ${selimutBeton} mm, Utama: D${diameterUtama}-${spasiUtama}, Bagi: D${diameterBagi}-${spasiBagi}`);

        // Dimensi asli (mm)
        let width_original_mm, height_original_mm;
        if (jenis === 'atas') {
            // Tampak atas: width = B (lebar), height = L (panjang)
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

        /**
         * Menghitung posisi dot pada garis dengan aturan:
         * - Dot tidak boleh keluar dari ujung garis (offset radius titik)
         * - Jarak minimum antar dot = max(stepAsli, 2.5 * radiusTitik)
         * - Dot ujung (batas kiri/kanan) ditambahkan hanya jika jarak ke dot terdekat >= 3 * diameterTulanganDisplay
         * @param {number} startX - ujung kiri garis
         * @param {number} endX - ujung kanan garis
         * @param {number} stepAsli - jarak antar tulangan dalam display (berdasarkan spasi)
         * @param {number} radiusTitik - radius dot dalam display
         * @param {number} diameterTulanganDisplay - diameter tulangan (mm) dalam display
         * @returns {number[]} array posisi x dot
         */
        function hitungPosisiTitik(startX, endX, stepAsli, radiusTitik, diameterTulanganDisplay) {
            const leftBound = startX + radiusTitik;
            const rightBound = endX - radiusTitik;
            if (leftBound >= rightBound) return [];

            // Step minimum 2.5 * radius titik
            const minStep = 2.5 * radiusTitik;
            const step = Math.max(stepAsli, minStep);

            let positions = [];
            let current = leftBound;
            while (current <= rightBound) {
                positions.push(current);
                current += step;
            }

            // Cek penambahan dot di ujung kiri
            if (positions.length > 0) {
                const jarakKiri = positions[0] - leftBound;
                if (jarakKiri >= 3 * diameterTulanganDisplay) {
                    positions.unshift(leftBound);
                }
            } else {
                // Jika tidak ada dot sama sekali, tambahkan di tengah? Tapi seharusnya tidak terjadi
                positions.push(leftBound);
            }

            // Cek penambahan dot di ujung kanan
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
        // Ukuran visual konsisten dengan fondasi tunggal
        const segitigaLebar = height_display * 0.035;
        const segitigaTinggi = height_display * 0.035;
        const radiusTitik = strokePx * 8;      // 16px
        const offsetTitikDariGaris = strokePx * 10; // 20px

        // Gambar outline fondasi
        buatRect(offsetX, offsetY, width_display, height_display, "#000000", strokePx, "#f8f9fa");

        // ================== TAMPAK ATAS ==================
        if (jenis === 'atas') {
            const gapHor = width_display * 0.02;
            const gapVer = height_display * 0.02;

            // === Tulangan utama (hitam) - garis horizontal di tengah ===
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

            // === Tulangan bagi (merah) - satu garis vertikal di tengah ===
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

            // Hitung posisi garis tulangan bagi (dari bawah)
            const jarakDariBawah_mm = selimutBeton + diameterBagi;
            const tinggiTotal_mm = H * 1000;
            const propDariBawah = jarakDariBawah_mm / tinggiTotal_mm;
            const y_garis = offsetY + height_display * (1 - propDariBawah);
            // Garis warna hitam (batas tulangan)
            buatGaris(x_kiri_garis, y_garis, x_kanan_garis, y_garis, warnaHitam, strokePx);

            const y_dot = y_garis + offsetTitikDariGaris; // dot di bawah garis

            const lebarFondasi_m = B;
            const faktorSkala = width_display / (lebarFondasi_m * 1000);
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

            // Hitung posisi garis tulangan utama (dari bawah) - warna merah
            const jarakDariBawah_mm = selimutBeton + diameterUtama;
            const tinggiTotal_mm = H * 1000;
            const propDariBawah = jarakDariBawah_mm / tinggiTotal_mm;
            const y_garis = offsetY + height_display * (1 - propDariBawah);
            buatGaris(x_kiri_garis, y_garis, x_kanan_garis, y_garis, warnaMerah, strokePx);

            const y_dot = y_garis - radiusTitik; // dot di atas garis

            const panjangFondasi_m = L;
            const faktorSkala = width_display / (panjangFondasi_m * 1000);
            const stepUtama = spasiUtama * faktorSkala;
            const diameterUtamaDisplay = diameterUtama * faktorSkala;

            const posTitik = hitungPosisiTitik(x_kiri_garis, x_kanan_garis, stepUtama, radiusTitik, diameterUtamaDisplay);
            for (let cx of posTitik) {
                buatLingkaran(cx, y_dot, radiusTitik, warnaHitam);
            }
        }

        // Teks skala tidak proporsional dihilangkan
        console.log(`✅ Fondasi menerus tampak ${jenis} selesai (dot dengan aturan jarak) .`);
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
    console.log("✅ cut-fondasimenerus.js (dot dengan offset radius dan aturan jarak)");
    function generateCADFondasiMenerus(jenisTampak) {
    try {
        // Ambil data dari session storage
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
                if (current[p] === undefined) return defaultValue;
                current = current[p];
            }
            return current;
        }

        // Parameter dimensi (meter) – coba ambil dari berbagai sumber
        let L = 2.0, B = 1.0, H = 0.5;
        if (fondasiData?.inputData?.fondasi?.dimensi) {
            const dim = fondasiData.inputData.fondasi.dimensi;
            L = parseFloat(dim.lx) || L;
            B = parseFloat(dim.ly) || B;
            H = parseFloat(dim.h) || H;
        } else if (fondasiData?.data?.parameter) {
            L = parseFloat(fondasiData.data.parameter.lx) || L;
            B = parseFloat(fondasiData.data.parameter.ly) || B;
            H = parseFloat(fondasiData.data.parameter.h) || H;
        } else if (fondasiData?.rekap?.dimensi) {
            const match = fondasiData.rekap.dimensi.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*[×x]\s*([\d.]+)/);
            if (match) {
                L = parseFloat(match[1]);
                B = parseFloat(match[2]);
                H = parseFloat(match[3]);
            }
        }

        // Parameter tulangan
        let selimutBeton = 75;
        let diameterUtama = 16, spasiUtama = 250;
        let diameterBagi = 16, spasiBagi = 400;

        const tulanganUtamaStr = getData('rekap.tulangan_utama', '');
        const tulanganBagiStr = getData('rekap.tulangan_bagi', '');
        if (tulanganUtamaStr) {
            const matchUtama = tulanganUtamaStr.match(/ɸ(\d+)-(\d+)/);
            if (matchUtama) {
                diameterUtama = parseInt(matchUtama[1], 10);
                spasiUtama = parseInt(matchUtama[2], 10);
            }
        }
        if (tulanganBagiStr) {
            const matchBagi = tulanganBagiStr.match(/ɸ(\d+)-(\d+)/);
            if (matchBagi) {
                diameterBagi = parseInt(matchBagi[1], 10);
                spasiBagi = parseInt(matchBagi[2], 10);
            }
        }

        // Hitung selimut dari data jika tersedia
        const ds = getData('data.parameter.ds', null);
        const cb = getData('data.kuatDukung.Cb', null);
        if (ds) selimutBeton = Number(ds);
        else if (cb) selimutBeton = Number(cb);
        else {
            const d = getData('data.parameter.d', null);
            if (d && H) {
                const h_mm = H * 1000;
                selimutBeton = Math.round(h_mm - d - diameterUtama/2);
                if (selimutBeton < 20) selimutBeton = 75;
            }
        }

        // Dimensi dalam mm
        const L_mm = L * 1000;
        const B_mm = B * 1000;
        const H_mm = H * 1000;

        // Helper CAD
        const lingkaran = (cx, cy, diameter) => `CIRCLE ${cx},${cy} ${diameter/2} `;
        const garis = (x1, y1, x2, y2) => `LINE ${x1},${y1} ${x2},${y2} `;
        const polyline = (points, tebal, closed = false) => {
            if (!points.length) return '';
            let cmd = `PL ${points[0][0]},${points[0][1]} W ${tebal} ${tebal} `;
            for (let i = 1; i < points.length; i++) {
                const dx = points[i][0] - points[i-1][0];
                const dy = points[i][1] - points[i-1][1];
                cmd += `@${dx},${dy} `;
            }
            if (closed) cmd += 'C ';
            return cmd;
        };

        function hitungPosisiTitikCAD(startXmm, endXmm, stepmm, diameterMM) {
            let positions = [];
            if (startXmm >= endXmm) return positions;
            let current = startXmm;
            while (current <= endXmm) {
                positions.push(current);
                current += stepmm;
            }
            const last = positions[positions.length - 1];
            if (endXmm - last >= 3 * diameterMM) positions.push(endXmm);
            else positions[positions.length - 1] = endXmm;
            return positions;
        }

        const flipY = (y, tinggiTotal) => tinggiTotal - y;
        let cadLines = [];

        // Tentukan tinggi total untuk flip Y (mengikuti orientasi CAD)
        let tinggiTotal;
        if (jenisTampak === 'depan') tinggiTotal = H_mm;
        else if (jenisTampak === 'atas') tinggiTotal = L_mm;   // karena tinggi tampak atas = L (panjang)
        else if (jenisTampak === 'samping') tinggiTotal = H_mm;
        else return "ERROR: jenisTampak tidak valid";

        // Frame kotak (outline fondasi)
        if (jenisTampak === 'depan') {
            cadLines.push(garis(0, 0, B_mm, 0));
            cadLines.push(garis(B_mm, 0, B_mm, H_mm));
            cadLines.push(garis(B_mm, H_mm, 0, H_mm));
            cadLines.push(garis(0, H_mm, 0, 0));
        } else if (jenisTampak === 'atas') {
            cadLines.push(garis(0, 0, B_mm, 0));
            cadLines.push(garis(B_mm, 0, B_mm, L_mm));
            cadLines.push(garis(B_mm, L_mm, 0, L_mm));
            cadLines.push(garis(0, L_mm, 0, 0));
        } else if (jenisTampak === 'samping') {
            cadLines.push(garis(0, 0, L_mm, 0));
            cadLines.push(garis(L_mm, 0, L_mm, H_mm));
            cadLines.push(garis(L_mm, H_mm, 0, H_mm));
            cadLines.push(garis(0, H_mm, 0, 0));
        }

        const ukuranSegitiga = 0.035 * (jenisTampak === 'atas' ? L_mm : L_mm); // proporsional

        // ========== TAMPAK ATAS ==========
        if (jenisTampak === 'atas') {
            const gapHor = selimutBeton;
            const gapVer = selimutBeton;

            // Tulangan utama (hitam) – garis horizontal
            const y_garis_hor = L_mm * (8/15);
            const x_kiri_hor = gapHor;
            const x_kanan_hor = B_mm - gapHor;
            cadLines.push(polyline([
                [x_kiri_hor + ukuranSegitiga, flipY(y_garis_hor - ukuranSegitiga, tinggiTotal)],
                [x_kiri_hor, flipY(y_garis_hor, tinggiTotal)],
                [x_kanan_hor, flipY(y_garis_hor, tinggiTotal)],
                [x_kanan_hor - ukuranSegitiga, flipY(y_garis_hor - ukuranSegitiga, tinggiTotal)]
            ], diameterUtama));
            const x_segitiga_hor = x_kiri_hor + (8/15) * (x_kanan_hor - x_kiri_hor);
            cadLines.push(buatSegitigaCAD(x_segitiga_hor, flipY(y_garis_hor, tinggiTotal), 'down', ukuranSegitiga, diameterUtama));

            // Tulangan bagi (merah) – garis vertikal tengah
            const x_tengah = B_mm / 2;
            const y_atas_vert = gapVer;
            const y_bawah_vert = L_mm - gapVer;
            const y_segitiga_vert = L_mm * (7/15);
            cadLines.push(polyline([
                [x_tengah - ukuranSegitiga, flipY(y_atas_vert + ukuranSegitiga, tinggiTotal)],
                [x_tengah, flipY(y_atas_vert, tinggiTotal)],
                [x_tengah, flipY(y_bawah_vert, tinggiTotal)],
                [x_tengah - ukuranSegitiga, flipY(y_bawah_vert - ukuranSegitiga, tinggiTotal)]
            ], diameterBagi));
            cadLines.push(buatSegitigaCAD(x_tengah, flipY(y_segitiga_vert, tinggiTotal), 'left', ukuranSegitiga, diameterBagi));
            cadLines.push(buatSegitigaCAD(x_tengah, flipY(y_segitiga_vert, tinggiTotal), 'left', ukuranSegitiga, diameterBagi)); // double untuk dua segitiga
        }

        // ========== TAMPAK DEPAN (arah lebar B) ==========
        if (jenisTampak === 'depan') {
            const gap = selimutBeton;
            const x_kiri = gap;
            const x_kanan = B_mm - gap;

            // Garis tulangan bagi (merah)
            const y_garis = selimutBeton+diameterBagi+diameterUtama/2;
            cadLines.push(polyline([[x_kiri, y_garis], [x_kanan, y_garis]], diameterUtama));

            const y_titik = selimutBeton+diameterBagi/2; // offset ke bawah (karena dot di bawah garis)
            const step = spasiBagi;
            const posTitik = hitungPosisiTitikCAD(x_kiri + diameterBagi/2, x_kanan - diameterBagi/2, step, diameterBagi);
            for (let x of posTitik) {
                cadLines.push(lingkaran(x, y_titik, diameterBagi));
            }
        }

        // ========== TAMPAK SAMPING (arah panjang L) ==========
        if (jenisTampak === 'samping') {
            const gap = selimutBeton;
            const x_kiri = gap;
            const x_kanan = L_mm - gap;

            // Garis tulangan utama (merah)
            const y_garis = selimutBeton+diameterBagi/2;
            cadLines.push(polyline([[x_kiri, y_garis], [x_kanan, y_garis]], diameterBagi));

            const y_titik = selimutBeton+diameterBagi+diameterUtama/2;
            const step = spasiUtama;
            const posTitik = hitungPosisiTitikCAD(x_kiri + diameterUtama/2, x_kanan - diameterUtama/2, step, diameterUtama);
            for (let x of posTitik) {
                cadLines.push(lingkaran(x, y_titik, diameterUtama));
            }
        }

        return cadLines.join("\n");
    } catch (error) {
        console.error("Gagal generate CAD fondasi menerus:", error);
        return "ERROR DETECTED: " + error.message + "\n" + error.stack;
    }
}

// Fungsi helper buat segitiga untuk CAD
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

// Ekspos fungsi ke global
window.generateCADFondasiMenerus = generateCADFondasiMenerus;
window.buatSegitigaCADMenerus = buatSegitigaCAD; // opsional

console.log("✅ cut-fondasimenerus.js - fungsi CAD untuk fondasi menerus selesai");
})();