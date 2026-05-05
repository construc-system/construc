// cut-pelat2arah.js - Render tampak pelat dua arah
// (MODIFIKASI: tampak atas pakai height_display sebagai acuan offset)

(function() {
    function renderPelatDuaArah(config, containerId) {
        console.log("🎨 Rendering pelat dua arah:", config, containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} tidak ditemukan`);
            return { config, containerId, scaleInfo: null, jenisPelat: 'dua_arah' };
        }
        container.innerHTML = "";

        const { jenis, lx, ly, h } = config;
        let width_mm, height_mm;
        if (jenis === 'atas') {
            width_mm = ly * 1000;
            height_mm = lx * 1000;
        } else {
            width_mm = lx * 1000;
            height_mm = (jenis === 'depan' ? h : ly * 1000);
        }

        const dataStorage = getPelatDataFromStorage();
        let selimutBeton = 20;
        if (dataStorage && dataStorage.rekap && dataStorage.rekap.input && dataStorage.rekap.input.dimensi) {
            selimutBeton = dataStorage.rekap.input.dimensi.sb || 20;
        }
        selimutBeton = Number(selimutBeton);

        let jarakTulanganBagi = 325, diameterTulanganBagi = 10;
        let jarakTulanganUtama = 150, diameterTulanganUtama = 10;
        let jarakTulanganBagiY = 325, diameterTulanganBagiY = 10;
        if (dataStorage && dataStorage.rekap && dataStorage.rekap.formatted) {
            const bagiX = dataStorage.rekap.formatted.tulangan_bagi_x;
            if (bagiX) {
                const match = bagiX.match(/D(\d+)-(\d+)/);
                if (match) {
                    diameterTulanganBagi = parseInt(match[1], 10);
                    jarakTulanganBagi = parseInt(match[2], 10);
                }
            }
            const bagiY = dataStorage.rekap.formatted.tulangan_bagi_y;
            if (bagiY) {
                const match = bagiY.match(/D(\d+)-(\d+)/);
                if (match) {
                    diameterTulanganBagiY = parseInt(match[1], 10);
                    jarakTulanganBagiY = parseInt(match[2], 10);
                }
            }
            const pokokX = dataStorage.rekap.formatted.tulangan_pokok_x;
            if (pokokX) {
                const match = pokokX.match(/D(\d+)-(\d+)/);
                if (match) {
                    diameterTulanganUtama = parseInt(match[1], 10);
                    jarakTulanganUtama = parseInt(match[2], 10);
                }
            }
        }

        // Hitung skala tampilan
        let width_display, height_display;
        let skala_horizontal = 1, skala_vertikal = 1;
        let needScaleNote = false;
        const RASIO_ATAS_MAKS = 1.5;
        const RASIO_DEPAN_SAMPING_MAKS = 8;

        if (jenis === 'atas') {
            let panjang = Math.max(width_mm, height_mm);
            let pendek = Math.min(width_mm, height_mm);
            if (panjang / pendek > RASIO_ATAS_MAKS) {
                needScaleNote = true;
                const faktor = RASIO_ATAS_MAKS * pendek / panjang;
                if (width_mm > height_mm) {
                    skala_horizontal = faktor;
                    width_display = width_mm * faktor;
                    height_display = height_mm;
                } else {
                    skala_vertikal = faktor;
                    width_display = width_mm;
                    height_display = height_mm * faktor;
                }
            } else {
                width_display = width_mm;
                height_display = height_mm;
            }
        } else if (jenis === 'depan') {
            let lebar = width_mm;
            let tinggi = h;
            if (lebar / tinggi > RASIO_DEPAN_SAMPING_MAKS) {
                needScaleNote = true;
                skala_horizontal = RASIO_DEPAN_SAMPING_MAKS * tinggi / lebar;
                width_display = lebar * skala_horizontal;
                height_display = tinggi;
            } else if (tinggi / lebar > RASIO_DEPAN_SAMPING_MAKS) {
                needScaleNote = true;
                skala_vertikal = RASIO_DEPAN_SAMPING_MAKS * lebar / tinggi;
                width_display = lebar;
                height_display = tinggi * skala_vertikal;
            } else {
                width_display = lebar;
                height_display = tinggi;
            }
        } else if (jenis === 'samping') {
            let lebar = ly * 1000;
            let tinggi = h;
            if (lebar / tinggi > RASIO_DEPAN_SAMPING_MAKS) {
                needScaleNote = true;
                skala_horizontal = RASIO_DEPAN_SAMPING_MAKS * tinggi / lebar;
                width_display = lebar * skala_horizontal;
                height_display = tinggi;
            } else if (tinggi / lebar > RASIO_DEPAN_SAMPING_MAKS) {
                needScaleNote = true;
                skala_vertikal = RASIO_DEPAN_SAMPING_MAKS * lebar / tinggi;
                width_display = lebar;
                height_display = tinggi * skala_vertikal;
            } else {
                width_display = lebar;
                height_display = tinggi;
            }
        } else {
            width_display = width_mm;
            height_display = height_mm;
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

        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", offsetX);
        rect.setAttribute("y", offsetY);
        rect.setAttribute("width", width_display);
        rect.setAttribute("height", height_display);
        rect.setAttribute("fill", "#f8f9fa");
        rect.setAttribute("stroke", "#777777");
        rect.setAttribute("vector-effect", "non-scaling-stroke");
        svg.appendChild(rect);

        // Fungsi bantu lokal
        function buatGaris(x1, y1, x2, y2, warna, strokeWidthPx = 2) {
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
            line.setAttribute("stroke", warna);
            line.setAttribute("stroke-width", strokeWidthPx);
            line.setAttribute("vector-effect", "non-scaling-stroke");
            line.setAttribute("stroke-linecap", "round");
            line.setAttribute("stroke-linejoin", "round");
            svg.appendChild(line);
            return line;
        }

        function buatPolyline(points, warna, strokeWidthPx = 2) {
            const poly = document.createElementNS(svgNS, "polyline");
            poly.setAttribute("points", points);
            poly.setAttribute("stroke", warna);
            poly.setAttribute("stroke-width", strokeWidthPx);
            poly.setAttribute("vector-effect", "non-scaling-stroke");
            poly.setAttribute("stroke-linecap", "round");
            poly.setAttribute("stroke-linejoin", "round");
            poly.setAttribute("fill", "none");
            svg.appendChild(poly);
            return poly;
        }

        const W = width_display;
        const strokePx = 2;
        // segitiga 3.5% dari tinggi tampilan
        const segitigaLebar = height_display * 0.035;
        const segitigaTinggi = height_display * 0.035;
        const jarak25 = W * 0.04167;   // default global, akan ditimpa di tampak atas
        const jarak40 = W * 0.06667;
        const jarak50 = W * 0.05833;
        const jarak15 = W * 0.025;
        const warnaTulangan = "#000000";
        const warnaMerah = "#FF0000";
        const radiusTitik = strokePx * 3;
        const offsetTitikDariGaris = strokePx * 4;
        const offsetUjung = strokePx * 3;

        // ========== GAMBAR UNTUK DUA ARAH ==========
        if (jenis === 'atas') {
            // --- MODIFIKASI: semua offset pakai height_display dengan faktor 1.5 ---
            const H = height_display;
            // nilai asli 0.04167*1.5=0.0625; 0.06667*1.5=0.1; 0.05833*1.5=0.0875
            const jarak25 = H * 0.0625;
            const jarak40 = H * 0.1;
            const jarak50 = H * 0.0875;
            // --- akhir modifikasi ---

            rect.setAttribute("stroke-width", strokePx);
            const tengahX_asli = offsetX + width_display / 2;
            const tengahY_asli = offsetY + height_display / 2;
            
            // Garis merah vertikal (kanan)
            const xDasarMerah = offsetX + width_display - jarak25;
            const xLuar = xDasarMerah;
            const xDalam = xLuar - jarak50;
            const ySegitigaMerahVert = offsetY + (1/4) * height_display;
            buatGaris(xLuar, offsetY, xLuar, offsetY + height_display, warnaMerah, strokePx);
            buatSegitigaVertikalTunggal(svg, 'left', xLuar, ySegitigaMerahVert, segitigaLebar, segitigaTinggi, warnaMerah);
            buatGaris(xDalam, offsetY, xDalam, offsetY + height_display, warnaMerah, strokePx);
            buatSegitigaVertikalTunggal(svg, 'right', xDalam, ySegitigaMerahVert, segitigaLebar, segitigaTinggi, warnaMerah);
            
            // Garis merah horizontal (bawah)
            const yDasarMerah = offsetY + height_display - jarak25;
            const yLuar = yDasarMerah;
            const yDalam = yLuar - jarak50;
            const xSegitigaMerahHor = offsetX + (1/4) * width_display;
            buatGaris(offsetX, yLuar, offsetX + width_display, yLuar, warnaMerah, strokePx);
            buatSegitiga(svg, 'up', 2, xSegitigaMerahHor, yLuar, segitigaLebar, segitigaTinggi, warnaMerah);
            buatGaris(offsetX, yDalam, offsetX + width_display, yDalam, warnaMerah, strokePx);
            buatSegitiga(svg, 'down', 2, xSegitigaMerahHor, yDalam, segitigaLebar, segitigaTinggi, warnaMerah);
            
            // Garis tulangan hitam vertikal lurus
            const tengahX = tengahX_asli + jarak25;
            const tengahY = tengahY_asli + jarak25;
            buatGaris(tengahX, offsetY, tengahX, offsetY + height_display, warnaTulangan, strokePx);
            buatGaris(offsetX, tengahY, offsetX + width_display, tengahY, warnaTulangan, strokePx);
            const yTengahVert = offsetY + height_display / 2;
            buatSegitiga(svg, 'left', 1, tengahX, yTengahVert, segitigaLebar, segitigaTinggi, warnaTulangan);
            const xTengahHor = offsetX + width_display / 2;
            buatSegitiga(svg, 'up', 2, xTengahHor, tengahY, segitigaLebar, segitigaTinggi, warnaTulangan);
            
            // Garis pendek vertikal di tengah
            const panjangPendekVert = height_display / 4;
            const yAtas = offsetY;
            const yBawah = offsetY + height_display;
            buatGaris(tengahX_asli, yAtas, tengahX_asli, yAtas + panjangPendekVert, warnaTulangan, strokePx);
            const yTengahAtas = yAtas + panjangPendekVert / 2;
            buatSegitiga(svg, 'right', 1, tengahX_asli, yTengahAtas, segitigaLebar, segitigaTinggi, warnaTulangan);
            buatGaris(tengahX_asli, yBawah - panjangPendekVert, tengahX_asli, yBawah, warnaTulangan, strokePx);
            const yTengahBawah = yBawah - panjangPendekVert / 2;
            buatSegitiga(svg, 'right', 1, tengahX_asli, yTengahBawah, segitigaLebar, segitigaTinggi, warnaTulangan);
            
            // Garis pendek horizontal di tengah
            const panjangPendekHor = height_display / 4;
            const xKiri = offsetX;
            const xKanan = offsetX + width_display;
            buatGaris(xKiri, tengahY_asli, xKiri + panjangPendekHor, tengahY_asli, warnaTulangan, strokePx);
            const xTengahKiri = xKiri + panjangPendekHor / 2;
            buatSegitiga(svg, 'down', 1, xTengahKiri, tengahY_asli, segitigaLebar, segitigaTinggi, warnaTulangan);
            buatGaris(xKanan - panjangPendekHor, tengahY_asli, xKanan, tengahY_asli, warnaTulangan, strokePx);
            const xTengahKanan = xKanan - panjangPendekHor / 2;
            buatSegitiga(svg, 'down', 1, xTengahKanan, tengahY_asli, segitigaLebar, segitigaTinggi, warnaTulangan);
            
            // Polyline horizontal (bawah tengah)
            const y0 = tengahY_asli - jarak40;
            const lxUser = height_display;
            const step1 = lxUser / 5;
            const step2 = lxUser / 20;
            const p1kiri = { x: offsetX, y: y0 };
            const p2kiri = { x: offsetX + step1, y: y0 };
            const p3kiri = { x: offsetX + step1 + step2, y: y0 + step2 };
            const p4kiri = { x: offsetX + width_display / 2, y: y0 + step2 };
            buatPolyline(`${p1kiri.x},${p1kiri.y} ${p2kiri.x},${p2kiri.y} ${p3kiri.x},${p3kiri.y} ${p4kiri.x},${p4kiri.y}`, warnaTulangan, strokePx);
            const p1kanan = { x: offsetX + width_display, y: y0 };
            const p2kanan = { x: offsetX + width_display - step1, y: y0 };
            const p3kanan = { x: offsetX + width_display - (step1 + step2), y: y0 + step2 };
            const p4kanan = { x: offsetX + width_display / 2, y: y0 + step2 };
            buatPolyline(`${p1kanan.x},${p1kanan.y} ${p2kanan.x},${p2kanan.y} ${p3kanan.x},${p3kanan.y} ${p4kanan.x},${p4kanan.y}`, warnaTulangan, strokePx);
            const yRendah = y0 + step2;
            const xTengahBentang = offsetX + width_display / 2;
            buatSegitiga(svg, 'up', 2, xTengahBentang, yRendah, segitigaLebar, segitigaTinggi, warnaTulangan);
            const xTengahKiriSegmen = offsetX + step1 / 2;
            buatSegitiga(svg, 'down', 1, xTengahKiriSegmen, y0, segitigaLebar, segitigaTinggi, warnaTulangan);
            const xTengahKananSegmen = offsetX + width_display - step1 / 2;
            buatSegitiga(svg, 'down', 1, xTengahKananSegmen, y0, segitigaLebar, segitigaTinggi, warnaTulangan);
            
            // Polyline vertikal kiri (atas & bawah ke tengah)
            const xKiriVert = tengahX_asli - jarak40;
            const pAtasKiri1 = { x: xKiriVert, y: offsetY };
            const pAtasKiri2 = { x: xKiriVert, y: offsetY + step1 };
            const pAtasKiri3 = { x: xKiriVert + step2, y: offsetY + step1 + step2 };
            const pAtasKiri4 = { x: xKiriVert + step2, y: tengahY_asli };
            const pBawahKiri1 = { x: xKiriVert, y: offsetY + height_display };
            const pBawahKiri2 = { x: xKiriVert, y: offsetY + height_display - step1 };
            const pBawahKiri3 = { x: xKiriVert + step2, y: offsetY + height_display - step1 - step2 };
            const pBawahKiri4 = { x: xKiriVert + step2, y: tengahY_asli };
            buatPolyline(`${pAtasKiri1.x},${pAtasKiri1.y} ${pAtasKiri2.x},${pAtasKiri2.y} ${pAtasKiri3.x},${pAtasKiri3.y} ${pAtasKiri4.x},${pAtasKiri4.y}`, warnaTulangan, strokePx);
            buatPolyline(`${pBawahKiri1.x},${pBawahKiri1.y} ${pBawahKiri2.x},${pBawahKiri2.y} ${pBawahKiri3.x},${pBawahKiri3.y} ${pBawahKiri4.x},${pBawahKiri4.y}`, warnaTulangan, strokePx);
            buatSegitiga(svg, 'left', 1, xKiriVert + step2, tengahY_asli, segitigaLebar, segitigaTinggi, warnaTulangan);
            const yTengahAtasKiri = offsetY + step1 / 2;
            const yTengahBawahKiri = offsetY + height_display - step1 / 2;
            buatSegitiga(svg, 'right', 1, xKiriVert, yTengahAtasKiri, segitigaLebar, segitigaTinggi, warnaTulangan);
            buatSegitiga(svg, 'right', 1, xKiriVert, yTengahBawahKiri, segitigaLebar, segitigaTinggi, warnaTulangan);
        } 
        else if (jenis === 'depan') {
            // ... (kode asli untuk tampak depan, tidak diubah)
            rect.setAttribute("stroke-width", strokePx);
            const h_asli = config.h;
            const y_ratio_atas = selimutBeton / h_asli;
            let y_atas = offsetY + y_ratio_atas * height_display;
            y_atas = Math.min(Math.max(y_atas, offsetY + strokePx), offsetY + height_display - strokePx);
            const y_ratio_bawah = (h_asli - selimutBeton) / h_asli;
            let y_bawah = offsetY + y_ratio_bawah * height_display;
            y_bawah = Math.min(Math.max(y_bawah, offsetY + strokePx), offsetY + height_display - strokePx);
            
            const step1 = width_display / 5;
            const step2 = width_display / 20;
            const tengahX = offsetX + width_display / 2;
            const maxStep = width_display / 2;
            const finalStep2 = Math.min(step2, maxStep - step1);
            const pointsKiri = `${offsetX},${y_atas} ${offsetX + step1},${y_atas} ${offsetX + step1 + finalStep2},${y_bawah} ${tengahX},${y_bawah}`;
            buatPolyline(pointsKiri, warnaTulangan, strokePx);
            const pointsKanan = `${offsetX + width_display},${y_atas} ${offsetX + width_display - step1},${y_atas} ${offsetX + width_display - step1 - finalStep2},${y_bawah} ${tengahX},${y_bawah}`;
            buatPolyline(pointsKanan, warnaTulangan, strokePx);
            
            const panjangPendek = width_display / 4;
            buatGaris(offsetX, y_atas, offsetX + panjangPendek, y_atas, warnaTulangan, strokePx);
            buatGaris(offsetX + width_display - panjangPendek, y_atas, offsetX + width_display, y_atas, warnaTulangan, strokePx);
            buatGaris(offsetX, y_bawah, offsetX + panjangPendek, y_bawah, warnaTulangan, strokePx);
            buatGaris(offsetX + width_display - panjangPendek, y_bawah, offsetX + width_display, y_bawah, warnaTulangan, strokePx);
            
            const lebarAsliMm = lx * 1000;
            const faktorSkala = width_display / lebarAsliMm;
            const stepBagiDisplay = jarakTulanganBagi * faktorSkala;
            const stepUtamaDisplay = jarakTulanganUtama * faktorSkala;
            const diameterBagiDisplay = diameterTulanganBagi * faktorSkala;
            const diameterUtamaDisplay = diameterTulanganUtama * faktorSkala;
            
            const posAtasKiri = hitungPosisiTitikKiriKanan(offsetX, offsetX + panjangPendek, stepBagiDisplay, diameterBagiDisplay, offsetUjung, true);
            for (let cx of posAtasKiri) buatLingkaran(svg, cx, y_atas + offsetTitikDariGaris, radiusTitik, warnaMerah);
            const posAtasKanan = hitungPosisiTitikKiriKanan(offsetX + width_display - panjangPendek, offsetX + width_display, stepBagiDisplay, diameterBagiDisplay, offsetUjung, true);
            for (let cx of posAtasKanan) buatLingkaran(svg, cx, y_atas + offsetTitikDariGaris, radiusTitik, warnaMerah);
            
            const posBawahKiri = hitungPosisiTitikKiriKanan(offsetX, offsetX + panjangPendek, stepBagiDisplay, diameterBagiDisplay, offsetUjung, false);
            for (let cx of posBawahKiri) buatLingkaran(svg, cx, y_bawah - offsetTitikDariGaris, radiusTitik, warnaMerah);
            const posBawahKanan = hitungPosisiTitikKananKiri(offsetX + width_display - panjangPendek, offsetX + width_display, stepBagiDisplay, diameterBagiDisplay, offsetUjung, false);
            for (let cx of posBawahKanan) buatLingkaran(svg, cx, y_bawah - offsetTitikDariGaris, radiusTitik, warnaMerah);
            
            const xStartBawah = offsetX + step1 + finalStep2;
            const xEndBawah = offsetX + width_display - step1 - finalStep2;
            if (xStartBawah < xEndBawah) {
                const posHitam = hitungPosisiTitikKiriKanan(xStartBawah, xEndBawah, stepUtamaDisplay, diameterUtamaDisplay, offsetUjung, true);
                for (let cx of posHitam) buatLingkaran(svg, cx, y_bawah - offsetTitikDariGaris, radiusTitik, warnaTulangan);
            }
        }
        else if (jenis === 'samping') {
            // ... (kode asli untuk tampak samping, tidak diubah)
            rect.setAttribute("stroke-width", strokePx);
            let diameterTulanganBagiY_local = 10;
            if (dataStorage && dataStorage.rekap && dataStorage.rekap.formatted && dataStorage.rekap.formatted.tulangan_bagi_y) {
                const match = dataStorage.rekap.formatted.tulangan_bagi_y.match(/D(\d+)/);
                if (match) diameterTulanganBagiY_local = parseInt(match[1], 10);
            }
            const offsetTebal = diameterTulanganBagiY_local / 2;
            const selimutBetonNum = Number(selimutBeton);
            const offsetTebalNum = Number(offsetTebal);
            const h_asli = config.h;
            const y_ratio_atas = (selimutBetonNum + offsetTebalNum) / h_asli;
            let y_atas = offsetY + y_ratio_atas * height_display;
            y_atas = Math.min(Math.max(y_atas, offsetY + strokePx), offsetY + height_display - strokePx);
            const y_ratio_bawah = (h_asli - (selimutBetonNum + offsetTebalNum)) / h_asli;
            let y_bawah = offsetY + y_ratio_bawah * height_display;
            y_bawah = Math.min(Math.max(y_bawah, offsetY + strokePx), offsetY + height_display - strokePx);
            
            const lebarLyMm = ly * 1000;
            const faktorSkala = width_display / lebarLyMm;
            const lebarLxMm = lx * 1000;
            const step1_mm = lebarLxMm / 5;
            const step2_mm = lebarLxMm / 20;
            const step1_display = step1_mm * faktorSkala;
            const step2_display = step2_mm * faktorSkala;
            const tengahX = offsetX + width_display / 2;
            
            const pointsKiri = `${offsetX},${y_atas} ${offsetX + step1_display},${y_atas} ${offsetX + step1_display + step2_display},${y_bawah} ${tengahX},${y_bawah}`;
            buatPolyline(pointsKiri, warnaTulangan, strokePx);
            const pointsKanan = `${offsetX + width_display},${y_atas} ${offsetX + width_display - step1_display},${y_atas} ${offsetX + width_display - step1_display - step2_display},${y_bawah} ${tengahX},${y_bawah}`;
            buatPolyline(pointsKanan, warnaTulangan, strokePx);
            
            const panjangPendekMm = lebarLxMm / 4;
            const panjangPendek = panjangPendekMm * faktorSkala;
            const xKiri = offsetX;
            const xKanan = offsetX + width_display;
            buatGaris(xKiri, y_atas, xKiri + panjangPendek, y_atas, warnaTulangan, strokePx);
            buatGaris(xKiri, y_bawah, xKiri + panjangPendek, y_bawah, warnaTulangan, strokePx);
            buatGaris(xKanan - panjangPendek, y_atas, xKanan, y_atas, warnaTulangan, strokePx);
            buatGaris(xKanan - panjangPendek, y_bawah, xKanan, y_bawah, warnaTulangan, strokePx);
            
            const stepBagiDisplay = jarakTulanganBagiY * faktorSkala;
            const diameterBagiDisplay = diameterTulanganBagiY * faktorSkala;
            const stepUtamaDisplay = jarakTulanganUtama * faktorSkala;
            const diameterUtamaDisplay = diameterTulanganUtama * faktorSkala;
            
            const posAtasKiri = hitungPosisiTitikKiriKanan(xKiri, xKiri + panjangPendek, stepBagiDisplay, diameterBagiDisplay, offsetUjung, true);
            for (let cx of posAtasKiri) buatLingkaran(svg, cx, y_atas - offsetTitikDariGaris, radiusTitik, warnaMerah);
            const posAtasKanan = hitungPosisiTitikKiriKanan(xKanan - panjangPendek, xKanan, stepBagiDisplay, diameterBagiDisplay, offsetUjung, true);
            for (let cx of posAtasKanan) buatLingkaran(svg, cx, y_atas - offsetTitikDariGaris, radiusTitik, warnaMerah);
            
            const posBawahKiri = hitungPosisiTitikKiriKanan(xKiri, xKiri + panjangPendek, stepBagiDisplay, diameterBagiDisplay, offsetUjung, false);
            for (let cx of posBawahKiri) buatLingkaran(svg, cx, y_bawah + offsetTitikDariGaris, radiusTitik, warnaMerah);
            const posBawahKanan = hitungPosisiTitikKananKiri(xKanan - panjangPendek, xKanan, stepBagiDisplay, diameterBagiDisplay, offsetUjung, false);
            for (let cx of posBawahKanan) buatLingkaran(svg, cx, y_bawah + offsetTitikDariGaris, radiusTitik, warnaMerah);
            
            const xStartBawah = offsetX + step1_display + step2_display;
            const xEndBawah = offsetX + width_display - step1_display - step2_display;
            if (xStartBawah < xEndBawah) {
                const posHitam = hitungPosisiTitikKiriKanan(xStartBawah, xEndBawah, stepUtamaDisplay, diameterUtamaDisplay, offsetUjung, true);
                for (let cx of posHitam) buatLingkaran(svg, cx, y_bawah + offsetTitikDariGaris, radiusTitik, warnaTulangan);
            }
        }

        console.log(`✅ Tampak ${jenis} dua arah selesai.`);
        return {
            config,
            containerId,
            jenisPelat: 'dua_arah',
            scaleInfo: {
                needScaleNote,
                skala_horizontal,
                skala_vertikal,
                originalWidth: width_mm,
                originalHeight: height_mm,
                displayedWidth: width_display,
                displayedHeight: height_display
            }
        };
    }

    window.pelatRenderers.dua_arah = renderPelatDuaArah;
    console.log("✅ cut-pelat2arah.js loaded");

   window.pelatRenderers.dua_arah = renderPelatDuaArah;
    console.log("✅ cut-pelat2arah.js loaded");

    // ==================== EKSPOR CAD UNTUK PELAT DUA ARAH ====================
    
    function generateCADPelatDuaArah(jenisTampak) {
        try {
            const dataStorage = getPelatDataFromStorage();
            if (!dataStorage) {
                alert("Data pelat tidak ditemukan. Silakan hitung ulang.");
                return "";
            }
            const dimensi = dataStorage.rekap?.input?.dimensi || {};
            let lx = parseFloat(dimensi.lx) || 0;
            let ly = parseFloat(dimensi.ly) || 0;
            let h = parseFloat(dimensi.h) || 0;
            if (lx === 0 || ly === 0 || h === 0) {
                alert("Dimensi pelat tidak lengkap.");
                return "";
            }
            
            const selimutBeton = Number(dimensi.sb) || 20;
            
            // Ambil data tulangan dari storage
            let jarakTulanganBagi = 325, diameterTulanganBagi = 10;
            let jarakTulanganUtama = 150, diameterTulanganUtama = 10;
            let jarakTulanganBagiY = 325, diameterTulanganBagiY = 10;
            if (dataStorage.rekap?.formatted) {
                const bagiX = dataStorage.rekap.formatted.tulangan_bagi_x;
                if (bagiX) {
                    const match = bagiX.match(/D(\d+)-(\d+)/);
                    if (match) {
                        diameterTulanganBagi = parseInt(match[1], 10);
                        jarakTulanganBagi = parseInt(match[2], 10);
                    }
                }
                const bagiY = dataStorage.rekap.formatted.tulangan_bagi_y;
                if (bagiY) {
                    const match = bagiY.match(/D(\d+)-(\d+)/);
                    if (match) {
                        diameterTulanganBagiY = parseInt(match[1], 10);
                        jarakTulanganBagiY = parseInt(match[2], 10);
                    }
                }
                const pokokX = dataStorage.rekap.formatted.tulangan_pokok_x;
                if (pokokX) {
                    const match = pokokX.match(/D(\d+)-(\d+)/);
                    if (match) {
                        diameterTulanganUtama = parseInt(match[1], 10);
                        jarakTulanganUtama = parseInt(match[2], 10);
                    }
                }
            }
            
            const Lx_mm = lx * 1000;
            const Ly_mm = ly * 1000;
            const H_mm = h;
            
            // ==================== HELPER CAD ====================
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
            
            function hitungPosisiTitikCAD(start, end, step, diameter) {
                let positions = [];
                if (start <= end) {
                    for (let x = start; x <= end; x += step) {
                        positions.push(x);
                    }
                    const last = positions[positions.length - 1];
                    if (end - last >= 4 * diameter) positions.push(end);
                    else positions[positions.length - 1] = end;
                } else {
                    for (let x = start; x >= end; x -= step) {
                        positions.push(x);
                    }
                    const last = positions[positions.length - 1];
                    if (last - end >= 4 * diameter) positions.push(end);
                    else positions[positions.length - 1] = end;
                }
                return positions;
            }
            function hitungPosisiTitikCAD1(start, end, step, diameter) {
                let positions = [];
                let current = start;

                if (start <= end) {
                    // Logika hitung maju (Normal)
                    while (current <= end) {
                        positions.push(current);
                        current += step;
                    }
                } else {
                    // Logika hitung mundur (Jika start > end)
                    while (current >= end) {
                        positions.push(current);
                        current -= step; // Gunakan pengurangan agar nilai mengecil
                    }
                }
                return positions;
            }
            const buatSegitigaCAD = (centerX, centerY, arah, ukuran, tebal) => {
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
            
            let cadLines = [];
            
            // Tentukan tinggi total untuk flip Y
            let tinggiTotal;
            if (jenisTampak === 'depan') tinggiTotal = H_mm;
            else if (jenisTampak === 'atas') tinggiTotal = Lx_mm;
            else tinggiTotal = H_mm; // samping
            
            // Frame
            if (jenisTampak === 'depan') {
                cadLines.push(garis(0, 0, Lx_mm, 0));
                cadLines.push(garis(Lx_mm, 0, Lx_mm, H_mm));
                cadLines.push(garis(Lx_mm, H_mm, 0, H_mm));
                cadLines.push(garis(0, H_mm, 0, 0));
            } else if (jenisTampak === 'atas') {
                cadLines.push(garis(0, 0, Ly_mm, 0));
                cadLines.push(garis(Ly_mm, 0, Ly_mm, Lx_mm));
                cadLines.push(garis(Ly_mm, Lx_mm, 0, Lx_mm));
                cadLines.push(garis(0, Lx_mm, 0, 0));
            } else if (jenisTampak === 'samping') {
                cadLines.push(garis(0, 0, Ly_mm, 0));
                cadLines.push(garis(Ly_mm, 0, Ly_mm, H_mm));
                cadLines.push(garis(Ly_mm, H_mm, 0, H_mm));
                cadLines.push(garis(0, H_mm, 0, 0));
            }
            
            const ukuranSegitiga = 0.035 * Lx_mm; // 3.5% Lx (sesuai tinggi tampilan)
            const setdiameterTulanganUtama = diameterTulanganUtama/2; // 3.5% Lx (sesuai tinggi tampilan)
            const setdiameterTulanganBagi = diameterTulanganBagi/2; // 3.5% Lx (sesuai tinggi tampilan)

            // ========== TAMPAK DEPAN ==========
            if (jenisTampak === 'depan') {
                const yAtas = selimutBeton+setdiameterTulanganUtama;
                const yBawah = H_mm - selimutBeton-setdiameterTulanganUtama;
                const step1 = Lx_mm / 5;
                const step2 = Lx_mm / 20;
                const tengahX = Lx_mm / 2;
                const panjangPendek = Lx_mm / 4;
                const tebal = diameterTulanganUtama;
                
                // Polyline utama
                cadLines.push(polyline([
                    [0, flipY(yAtas, tinggiTotal)],
                    [step1, flipY(yAtas, tinggiTotal)],
                    [step1 + step2, flipY(yBawah, tinggiTotal)],
                    [tengahX, flipY(yBawah, tinggiTotal)]
                ], tebal));
                
                cadLines.push(polyline([
                    [Lx_mm, flipY(yAtas, tinggiTotal)],
                    [Lx_mm - step1, flipY(yAtas, tinggiTotal)],
                    [Lx_mm - step1 - step2, flipY(yBawah, tinggiTotal)],
                    [tengahX, flipY(yBawah, tinggiTotal)]
                ], tebal));
                
                // Garis pendek
                cadLines.push(polyline([[0, flipY(yAtas, tinggiTotal)], [panjangPendek, flipY(yAtas, tinggiTotal)]], tebal));
                cadLines.push(polyline([[Lx_mm - panjangPendek, flipY(yAtas, tinggiTotal)], [Lx_mm, flipY(yAtas, tinggiTotal)]], tebal));
                cadLines.push(polyline([[0, flipY(yBawah, tinggiTotal)], [panjangPendek, flipY(yBawah, tinggiTotal)]], tebal));
                cadLines.push(polyline([[Lx_mm - panjangPendek, flipY(yBawah, tinggiTotal)], [Lx_mm, flipY(yBawah, tinggiTotal)]], tebal));
                
                // Lingkaran tulangan bagi (merah)
                const yBagiAtas = selimutBeton + diameterTulanganUtama + diameterTulanganBagi/2;
                const yBagiBawah = H_mm - (selimutBeton + diameterTulanganUtama + diameterTulanganBagi/2);
                const stepBagi = jarakTulanganBagi;
                const dStart = diameterTulanganBagi/2;
                
                const posAtasKiri = hitungPosisiTitikCAD(dStart, panjangPendek - diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                for (let x of posAtasKiri) {
                    cadLines.push(lingkaran(x, flipY(yBagiAtas, tinggiTotal), diameterTulanganBagi));
                }
                const posAtasKanan = hitungPosisiTitikCAD(Lx_mm - dStart, Lx_mm - panjangPendek + diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                for (let x of posAtasKanan) {
                    cadLines.push(lingkaran(x, flipY(yBagiAtas, tinggiTotal), diameterTulanganBagi));
                }
                console.log("Cek yBagiBawah:", yBagiBawah, "tinggiTotal:", tinggiTotal);
                const posBawahKiri = hitungPosisiTitikCAD1(dStart, panjangPendek - diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                for (let x of posBawahKiri) {
                    cadLines.push(lingkaran(x, flipY(yBagiBawah, tinggiTotal), diameterTulanganBagi));
                }
                const posBawahKanan = hitungPosisiTitikCAD1(Lx_mm - dStart, Lx_mm - panjangPendek + dStart, stepBagi, diameterTulanganBagi);
                for (let x of posBawahKanan) {
                    cadLines.push(lingkaran(x, flipY(yBagiBawah, tinggiTotal), diameterTulanganBagi));
                }
                
                // Lingkaran tulangan utama (hitam) di bawah tengah
                const xStart = panjangPendek;
                const xEnd = Lx_mm - panjangPendek;
                const yUtamaBawah = H_mm - (selimutBeton + diameterTulanganUtama + setdiameterTulanganUtama);
                const posHitam = hitungPosisiTitikCAD(xStart + diameterTulanganUtama/2, xEnd - diameterTulanganUtama/2, jarakTulanganUtama, diameterTulanganUtama);
                for (let x of posHitam) {
                    cadLines.push(lingkaran(x, flipY(yUtamaBawah, tinggiTotal), diameterTulanganUtama));
                }
            }
            
            // ========== TAMPAK ATAS ==========
            else if (jenisTampak === 'atas') {
                const y0 = Lx_mm/2 - Lx_mm*0.12;
                const step1 = Lx_mm / 5;
                const step2 = Lx_mm / 20;
                const step3 = step1/4;
                const y0CAD = flipY(y0, tinggiTotal);
                const yRendah = flipY(y0 + step2, tinggiTotal);
                // ---- Garis merah vertikal kanan ----
                const xLuar = Ly_mm - step3;
                const xDalam = xLuar - step3*2;
                cadLines.push(polyline([[xLuar, 0], [xLuar, Lx_mm]], diameterTulanganBagi));
                cadLines.push(polyline([[xDalam, 0], [xDalam, Lx_mm]], diameterTulanganBagi));
                const ySegiMVert = Lx_mm / 4;
                cadLines.push(buatSegitigaCAD(xLuar, flipY(ySegiMVert, tinggiTotal), 'left', ukuranSegitiga, diameterTulanganBagi));
                cadLines.push(buatSegitigaCAD(xDalam, flipY(ySegiMVert, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganBagi));
                
                // ---- Garis merah horizontal bawah ----
                const yLuar = Lx_mm - step3;
                const yDalam = yLuar - step3*2;
                cadLines.push(polyline([[0, flipY(yLuar, tinggiTotal)], [Ly_mm, flipY(yLuar, tinggiTotal)]], diameterTulanganBagi));
                cadLines.push(polyline([[0, flipY(yDalam, tinggiTotal)], [Ly_mm, flipY(yDalam, tinggiTotal)]], diameterTulanganBagi));
                const xSegiMHor = Ly_mm / 4;
                cadLines.push(buatSegitigaCAD(xSegiMHor-ukuranSegitiga/2, flipY(yLuar, tinggiTotal), 'down', ukuranSegitiga, diameterTulanganBagi));
                cadLines.push(buatSegitigaCAD(xSegiMHor-ukuranSegitiga/2, flipY(yDalam, tinggiTotal), 'up', ukuranSegitiga, diameterTulanganBagi));
                cadLines.push(buatSegitigaCAD(xSegiMHor+ukuranSegitiga/2, flipY(yLuar, tinggiTotal), 'down', ukuranSegitiga, diameterTulanganBagi));
                cadLines.push(buatSegitigaCAD(xSegiMHor+ukuranSegitiga/2, flipY(yDalam, tinggiTotal), 'up', ukuranSegitiga, diameterTulanganBagi));

                // ---- Garis hitam vertikal lurus ----
                const xHitamVert = Ly_mm/2 + Lx_mm*0.06;
                cadLines.push(polyline([[xHitamVert, 0], [xHitamVert, Lx_mm]], diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(xHitamVert, flipY(Lx_mm/2, tinggiTotal), 'left', ukuranSegitiga, diameterTulanganUtama));
                
                // ---- Garis hitam horizontal lurus ----
                const yHitamHor = Lx_mm/2 + Lx_mm*0.06;
                cadLines.push(polyline([[0, flipY(yHitamHor, tinggiTotal)], [Ly_mm, flipY(yHitamHor, tinggiTotal)]], diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(Ly_mm/2-ukuranSegitiga/2, flipY(yHitamHor, tinggiTotal), 'down', ukuranSegitiga, diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(Ly_mm/2+ukuranSegitiga/2, flipY(yHitamHor, tinggiTotal), 'down', ukuranSegitiga, diameterTulanganUtama));
                
                // ---- Garis pendek vertikal tengah ----
                const xTengah = Ly_mm/2;
                const pVert = Lx_mm / 4;
                cadLines.push(polyline([[xTengah, 0], [xTengah, pVert]], diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(xTengah, flipY(step1/2, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganUtama));
                cadLines.push(polyline([[xTengah, Lx_mm - pVert], [xTengah, Lx_mm]], diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(xTengah, flipY(Lx_mm - step1/2, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganUtama));
                
                // ---- Garis pendek horizontal tengah ----
                const yTengah = Lx_mm/2;
                const pHor = Lx_mm / 4;   // perhatikan: lebar pendek horizontal = Lx/4
                cadLines.push(polyline([[0, flipY(yTengah, tinggiTotal)], [pHor, flipY(yTengah, tinggiTotal)]], diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(step1/2, flipY(yTengah, tinggiTotal), 'up', ukuranSegitiga, diameterTulanganUtama));
                cadLines.push(polyline([[Ly_mm - pHor, flipY(yTengah, tinggiTotal)], [Ly_mm, flipY(yTengah, tinggiTotal)]], diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(Ly_mm - step1/2, flipY(yTengah, tinggiTotal), 'up', ukuranSegitiga, diameterTulanganUtama));
                
                // ---- Polyline horizontal bawah ----
              
                // Kiri
                cadLines.push(polyline([
                    [0, y0CAD],
                    [step1, y0CAD],
                    [step1 + step2, yRendah],
                    [Ly_mm/2, yRendah]
                ], diameterTulanganUtama));
                // Kanan
                cadLines.push(polyline([
                    [Ly_mm, y0CAD],
                    [Ly_mm - step1, y0CAD],
                    [Ly_mm - step1 - step2, yRendah],
                    [Ly_mm/2, yRendah]
                ], diameterTulanganUtama));
                
                cadLines.push(buatSegitigaCAD(Ly_mm/2-ukuranSegitiga/2, yRendah, 'down', ukuranSegitiga, diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(Ly_mm/2+ukuranSegitiga/2, yRendah, 'down', ukuranSegitiga, diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(step1/2, y0CAD, 'up', ukuranSegitiga, diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(Ly_mm - step1/2, y0CAD, 'up', ukuranSegitiga, diameterTulanganUtama));
                
                // ---- Polyline vertikal kiri ----
                const xKiriVert = Ly_mm/2 - Lx_mm*0.12;
                const xTitik = xKiriVert + step2;
                const yTengahCAD = flipY(Lx_mm/2, tinggiTotal);
                
                // Atas
                cadLines.push(polyline([
                    [xKiriVert, flipY(0, tinggiTotal)],
                    [xKiriVert, flipY(step1, tinggiTotal)],
                    [xTitik, flipY(step1 + step2, tinggiTotal)],
                    [xTitik, yTengahCAD]
                ], diameterTulanganUtama));
                // Bawah
                cadLines.push(polyline([
                    [xKiriVert, flipY(Lx_mm, tinggiTotal)],
                    [xKiriVert, flipY(Lx_mm - step1, tinggiTotal)],
                    [xTitik, flipY(Lx_mm - step1 - step2, tinggiTotal)],
                    [xTitik, yTengahCAD]
                ], diameterTulanganUtama));
                
                cadLines.push(buatSegitigaCAD(xTitik, yTengahCAD, 'left', ukuranSegitiga, diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(xKiriVert, flipY(step1/2, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganUtama));
                cadLines.push(buatSegitigaCAD(xKiriVert, flipY(Lx_mm - step1/2, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganUtama));
            }
            
            // ========== TAMPAK SAMPING ==========
            else if (jenisTampak === 'samping') {
                const yAtas = selimutBeton + diameterTulanganUtama/2+diameterTulanganBagi;
                const yBawah = H_mm - (selimutBeton + Math.max(diameterTulanganUtama, diameterTulanganBagi)+diameterTulanganUtama/2);
                const step1 = Lx_mm / 5;   // dipakai sebagai jarak horizontal (mm)
                const step2 = Lx_mm / 20;
                const tengahX = Ly_mm / 2;
                const panjangPendek = Lx_mm / 4;
                
                // Polyline utama
                cadLines.push(polyline([
                    [0, flipY(yAtas, tinggiTotal)],
                    [step1, flipY(yAtas, tinggiTotal)],
                    [step1 + step2, flipY(yBawah, tinggiTotal)],
                    [tengahX, flipY(yBawah, tinggiTotal)]
                ], diameterTulanganUtama));
                
                cadLines.push(polyline([
                    [Ly_mm, flipY(yAtas, tinggiTotal)],
                    [Ly_mm - step1, flipY(yAtas, tinggiTotal)],
                    [Ly_mm - step1 - step2, flipY(yBawah, tinggiTotal)],
                    [tengahX, flipY(yBawah, tinggiTotal)]
                ], diameterTulanganUtama));
                
                // Garis pendek
                cadLines.push(polyline([[0, flipY(yAtas, tinggiTotal)], [panjangPendek, flipY(yAtas, tinggiTotal)]], diameterTulanganUtama));
                cadLines.push(polyline([[Ly_mm - panjangPendek, flipY(yAtas, tinggiTotal)], [Ly_mm, flipY(yAtas, tinggiTotal)]], diameterTulanganUtama));
                cadLines.push(polyline([[0, flipY(yBawah, tinggiTotal)], [panjangPendek, flipY(yBawah, tinggiTotal)]], diameterTulanganUtama));
                cadLines.push(polyline([[Ly_mm - panjangPendek, flipY(yBawah, tinggiTotal)], [Ly_mm, flipY(yBawah, tinggiTotal)]], diameterTulanganUtama));
                
                // Lingkaran bagi (merah)
                const yBagiAtas = yAtas - diameterTulanganBagi/2-diameterTulanganUtama/2;
                const yBagiBawah = yBawah + diameterTulanganBagi/2+diameterTulanganUtama/2;
                const stepBagi = jarakTulanganBagiY;
                
                const posAtasKiri = hitungPosisiTitikCAD(diameterTulanganBagi/2, panjangPendek - diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                for (let x of posAtasKiri) {
                    cadLines.push(lingkaran(x, flipY(yBagiAtas, tinggiTotal), diameterTulanganBagi));
                }
                const posAtasKanan = hitungPosisiTitikCAD(Ly_mm - diameterTulanganBagi/2, Ly_mm - panjangPendek + diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                for (let x of posAtasKanan) {
                    cadLines.push(lingkaran(x, flipY(yBagiAtas, tinggiTotal), diameterTulanganBagi));
                }
                
                const posBawahKiri = hitungPosisiTitikCAD1(diameterTulanganBagi/2, panjangPendek - diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                for (let x of posBawahKiri) {
                    cadLines.push(lingkaran(x, flipY(yBagiBawah, tinggiTotal), diameterTulanganBagi));
                }
                const posBawahKanan = hitungPosisiTitikCAD1(Ly_mm - diameterTulanganBagi/2, Ly_mm - panjangPendek + diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                for (let x of posBawahKanan) {
                    cadLines.push(lingkaran(x, flipY(yBagiBawah, tinggiTotal), diameterTulanganBagi));
                }
                
                // Lingkaran utama (hitam) di bawah tengah
                const xStart = step1 + step2;
                const xEnd = Ly_mm - step1 - step2;
                const yUtamaBawah = yBawah + diameterTulanganUtama;
                const posHitam = hitungPosisiTitikCAD(xStart + diameterTulanganUtama/2, xEnd - diameterTulanganUtama/2, jarakTulanganUtama, diameterTulanganUtama);
                for (let x of posHitam) {
                    cadLines.push(lingkaran(x, flipY(yUtamaBawah, tinggiTotal), diameterTulanganUtama));
                }
            }
            
            return cadLines.join("\n");
        } catch (error) {
            console.error("Gagal generate CAD pelat dua arah:", error);
            alert("Gagal generate CAD: " + error.message);
            // Ubah return "" menjadi return pesan error agar tercopy ke clipboard
            return "ERROR DETECTED: " + error.message + "\nDI BARIS/STACK: " + error.stack; 
        }
    }
    
    window.generateCADPelatDuaArah = generateCADPelatDuaArah;
    
    console.log("✅ cut-pelat2arah.js - fungsi CAD untuk pelat dua arah selesai");
})();