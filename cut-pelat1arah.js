// cut-pelat1arah.js - Render tampak pelat satu arah + Ekspor CAD (real size, no scale)

(function() {
    // ==================== RENDER SVG (SAMA SEPERTI SEBELUMNYA) ====================
    function renderPelatSatuArah(config, containerId) {
        console.log("🎨 Rendering pelat satu arah (revisi 3):", config, containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} tidak ditemukan`);
            return { config, containerId, scaleInfo: null, jenisPelat: 'satu_arah' };
        }
        container.innerHTML = "";

        const { jenis, lx, ly, h } = config;
        const Lx_mm = lx * 1000;
        const Ly_mm = ly * 1000;
        const H_mm = h;

        let width_original_mm, height_original_mm;
        if (jenis === 'atas') {
            width_original_mm = Ly_mm;
            height_original_mm = Lx_mm;
        } else if (jenis === 'depan') {
            width_original_mm = Lx_mm;
            height_original_mm = H_mm;
        } else {
            width_original_mm = Ly_mm;
            height_original_mm = H_mm;
        }

        let width_display, height_display;
        let skala_horizontal = 1, skala_vertikal = 1;
        let needScaleNote = false;
        const RASIO_ATAS_MAKS = 1.5;
        const RASIO_DEPAN_SAMPING_MAKS = 8;

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
        } else if (jenis === 'depan') {
            let lebar = width_original_mm;
            let tinggi = height_original_mm;
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
            let lebar = width_original_mm;
            let tinggi = height_original_mm;
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
        }

        const padding = width_display * 0.05;
        const viewBoxWidth = width_display + padding * 2;
        const viewBoxHeight = height_display + padding * 2;
        const offsetX = padding;
        const offsetY = padding;

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

        const subJenis = getSubJenisSatuArah();
        console.log(`Sub-jenis satu arah: ${subJenis}`);

        const step1_mm = Lx_mm / 5;
        const step2_mm = Lx_mm / 20;
        const panjangPendek_mm = Lx_mm / 3;

        function toDisplayX(x_mm, y_mm) {
            if (jenis === 'atas') {
                return offsetX + (x_mm / Ly_mm) * width_display;
            } else if (jenis === 'depan') {
                return offsetX + (x_mm / Lx_mm) * width_display;
            } else {
                return offsetX + (x_mm / Ly_mm) * width_display;
            }
        }

        function toDisplayY(x_mm, y_mm) {
            if (jenis === 'atas') {
                return offsetY + (y_mm / Lx_mm) * height_display;
            } else if (jenis === 'depan') {
                return offsetY + (y_mm / H_mm) * height_display;
            } else {
                return offsetY + (y_mm / H_mm) * height_display;
            }
        }

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

        const strokePx = 2;
        const segitigaLebar = height_display * 0.035;
        const segitigaTinggi = height_display * 0.035;
        const warnaTulangan = "#000000";
        const warnaMerah = "#FF0000";
        const radiusTitik = strokePx * 3;
        const offsetTitikDariGaris = strokePx * 4;
        const offsetUjung = strokePx * 3;

        // ========== SATU ARAH PANJANG ==========
        if (subJenis === 'panjang') {
            if (jenis === 'atas') {
                rect.setAttribute("stroke-width", strokePx);
                const y1_mm = Lx_mm / 6;
                const y2_mm = Lx_mm / 1.8;
                const y3_mm = (5 * Lx_mm) / 6;
                const y1 = toDisplayY(0, y1_mm);
                const y2 = toDisplayY(0, y2_mm);
                const y3 = toDisplayY(0, y3_mm);
                buatGaris(offsetX, y1, offsetX + width_display, y1, warnaMerah, strokePx);
                buatGaris(offsetX, y2, offsetX + width_display, y2, warnaMerah, strokePx);
                buatGaris(offsetX, y3, offsetX + width_display, y3, warnaMerah, strokePx);
                
                const xSegitigaMerah = toDisplayX((7/15) * Ly_mm, 0);
                buatSegitiga(svg, 'down', 2, xSegitigaMerah, y1, segitigaLebar, segitigaTinggi, warnaMerah);
                buatSegitiga(svg, 'up', 2, xSegitigaMerah, y2, segitigaLebar, segitigaTinggi, warnaMerah);
                buatSegitiga(svg, 'down', 2, xSegitigaMerah, y3, segitigaLebar, segitigaTinggi, warnaMerah);
                
                const jarakSet_mm = Ly_mm * 0.04167;
                const tengahX_mm = Ly_mm / 2;
                const xSet1_mm = tengahX_mm + jarakSet_mm;
                const xSet2_mm = xSet1_mm + jarakSet_mm * 1.8;
                
                const gambarSetAsli = (x_mm) => {
                    const p1 = { x: x_mm, y: 0 };
                    const p2 = { x: x_mm, y: step1_mm };
                    const p3 = { x: x_mm + step2_mm, y: step1_mm + step2_mm };
                    const p4 = { x: x_mm + step2_mm, y: Lx_mm };
                    const points = `${toDisplayX(p1.x, p1.y)},${toDisplayY(p1.x, p1.y)} ` +
                                   `${toDisplayX(p2.x, p2.y)},${toDisplayY(p2.x, p2.y)} ` +
                                   `${toDisplayX(p3.x, p3.y)},${toDisplayY(p3.x, p3.y)} ` +
                                   `${toDisplayX(p4.x, p4.y)},${toDisplayY(p4.x, p4.y)}`;
                    buatPolyline(points, warnaTulangan, strokePx);
                    const y_start_bawah = Lx_mm - panjangPendek_mm;
                    const y_end_bawah = Lx_mm;
                    buatGaris(toDisplayX(x_mm, y_start_bawah), toDisplayY(x_mm, y_start_bawah),
                              toDisplayX(x_mm, y_end_bawah), toDisplayY(x_mm, y_end_bawah),
                              warnaTulangan, strokePx);
                    const ySegitigaPendek = y_start_bawah + panjangPendek_mm * 0.667;
                    buatSegitiga(svg, 'right', 1, toDisplayX(x_mm, ySegitigaPendek), toDisplayY(x_mm, ySegitigaPendek),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                    const tengahY_step1 = step1_mm / 2;
                    buatSegitiga(svg, 'right', 1, toDisplayX(x_mm, tengahY_step1), toDisplayY(x_mm, tengahY_step1),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                    const tengahBentangY = Lx_mm / 2;
                    buatSegitiga(svg, 'left', 1, toDisplayX(p3.x, tengahBentangY), toDisplayY(p3.x, tengahBentangY),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                };
                
                const gambarSetTerbalik = (x_mm) => {
                    const p1 = { x: x_mm, y: Lx_mm };
                    const p2 = { x: x_mm, y: Lx_mm - step1_mm };
                    const p3 = { x: x_mm + step2_mm, y: Lx_mm - step1_mm - step2_mm };
                    const p4 = { x: x_mm + step2_mm, y: 0 };
                    const points = `${toDisplayX(p1.x, p1.y)},${toDisplayY(p1.x, p1.y)} ` +
                                   `${toDisplayX(p2.x, p2.y)},${toDisplayY(p2.x, p2.y)} ` +
                                   `${toDisplayX(p3.x, p3.y)},${toDisplayY(p3.x, p3.y)} ` +
                                   `${toDisplayX(p4.x, p4.y)},${toDisplayY(p4.x, p4.y)}`;
                    buatPolyline(points, warnaTulangan, strokePx);
                    const y_start_atas = 0;
                    const y_end_atas = panjangPendek_mm;
                    buatGaris(toDisplayX(x_mm, y_start_atas), toDisplayY(x_mm, y_start_atas),
                              toDisplayX(x_mm, y_end_atas), toDisplayY(x_mm, y_end_atas),
                              warnaTulangan, strokePx);
                    const ySegitigaPendek = y_start_atas + panjangPendek_mm * 0.3;
                    buatSegitiga(svg, 'right', 1, toDisplayX(x_mm, ySegitigaPendek), toDisplayY(x_mm, ySegitigaPendek),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                    const tengahY_step1_flip = Lx_mm - step1_mm / 2;
                    buatSegitiga(svg, 'right', 1, toDisplayX(x_mm, tengahY_step1_flip), toDisplayY(x_mm, tengahY_step1_flip),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                    const tengahBentangY = Lx_mm / 2;
                    buatSegitiga(svg, 'left', 1, toDisplayX(p3.x, tengahBentangY), toDisplayY(p3.x, tengahBentangY),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                };
                
                if (xSet1_mm <= Ly_mm) {
                    gambarSetAsli(xSet1_mm);
                    if (xSet2_mm + step2_mm <= Ly_mm) {
                        gambarSetTerbalik(xSet2_mm);
                    }
                }
                console.log("Tampak atas satu arah panjang selesai (revisi 3).");
            }
            else if (jenis === 'depan') {
                rect.setAttribute("stroke-width", strokePx);
                const offsetTebal = diameterTulanganUtama / 2;
                const y_atas_mm = selimutBeton + offsetTebal;
                const y_bawah_mm = H_mm - (selimutBeton + offsetTebal);
                const y_atas = toDisplayY(0, y_atas_mm);
                const y_bawah = toDisplayY(0, y_bawah_mm);
                buatGaris(offsetX, y_atas, offsetX + width_display, y_atas, warnaMerah, strokePx);
                buatGaris(offsetX, y_bawah, offsetX + width_display, y_bawah, warnaMerah, strokePx);
                const jarakUtama_mm = jarakTulanganUtama;
                const stepUtamaDisplay = jarakUtama_mm * (width_display / Lx_mm);
                const posTitikAtas = hitungPosisiTitikKiriKanan(offsetX, offsetX + width_display, stepUtamaDisplay, diameterTulanganUtama, offsetUjung, true);
                for (let cx of posTitikAtas) buatLingkaran(svg, cx, y_atas - offsetTitikDariGaris, radiusTitik, warnaTulangan);
                const posTitikBawah = hitungPosisiTitikKiriKanan(offsetX, offsetX + width_display, stepUtamaDisplay, diameterTulanganUtama, offsetUjung, true);
                for (let cx of posTitikBawah) buatLingkaran(svg, cx, y_bawah + offsetTitikDariGaris, radiusTitik, warnaTulangan);
                console.log("Tampak depan satu arah panjang selesai.");
            }
            else if (jenis === 'samping') {
                rect.setAttribute("stroke-width", strokePx);
                const y_atas_mm = selimutBeton;
                const y_bawah_mm = H_mm - selimutBeton;
                const y_atas = toDisplayY(0, y_atas_mm);
                const y_bawah = toDisplayY(0, y_bawah_mm);
                const step1_display = step1_mm * (width_display / Ly_mm);
                const step2_display = step2_mm * (width_display / Ly_mm);
                const tengahX = offsetX + width_display / 2;
                const pointsKiri = `${offsetX},${y_atas} ${offsetX + step1_display},${y_atas} ${offsetX + step1_display + step2_display},${y_bawah} ${tengahX},${y_bawah}`;
                buatPolyline(pointsKiri, warnaTulangan, strokePx);
                const pointsKanan = `${offsetX + width_display},${y_atas} ${offsetX + width_display - step1_display},${y_atas} ${offsetX + width_display - step1_display - step2_display},${y_bawah} ${tengahX},${y_bawah}`;
                buatPolyline(pointsKanan, warnaTulangan, strokePx);
                const panjangPendek_display = panjangPendek_mm * (width_display / Ly_mm);
                buatGaris(offsetX, y_atas, offsetX + panjangPendek_display, y_atas, warnaTulangan, strokePx);
                buatGaris(offsetX + width_display - panjangPendek_display, y_atas, offsetX + width_display, y_atas, warnaTulangan, strokePx);
                buatGaris(offsetX, y_bawah, offsetX + panjangPendek_display, y_bawah, warnaTulangan, strokePx);
                buatGaris(offsetX + width_display - panjangPendek_display, y_bawah, offsetX + width_display, y_bawah, warnaTulangan, strokePx);
                const jarakBagi_mm = jarakTulanganBagiY;
                const stepBagiDisplay = jarakBagi_mm * (width_display / Ly_mm);
                const posAtasKiri = hitungPosisiTitikKiriKanan(offsetX, offsetX + panjangPendek_display, stepBagiDisplay, diameterTulanganBagiY, offsetUjung, true);
                for (let cx of posAtasKiri) buatLingkaran(svg, cx, y_atas + offsetTitikDariGaris, radiusTitik, warnaMerah);
                const posAtasKanan = hitungPosisiTitikKiriKanan(offsetX + width_display - panjangPendek_display, offsetX + width_display, stepBagiDisplay, diameterTulanganBagiY, offsetUjung, true);
                for (let cx of posAtasKanan) buatLingkaran(svg, cx, y_atas + offsetTitikDariGaris, radiusTitik, warnaMerah);
                const xStartBawah = offsetX + step1_display + step2_display;
                const xEndBawah = offsetX + width_display - step1_display - step2_display;
                if (xStartBawah < xEndBawah) {
                    const posBawahTengah = hitungPosisiTitikKiriKanan(xStartBawah, xEndBawah, stepBagiDisplay, diameterTulanganBagiY, offsetUjung, true);
                    for (let cx of posBawahTengah) buatLingkaran(svg, cx, y_bawah - offsetTitikDariGaris, radiusTitik, warnaMerah);
                }
                console.log("Tampak samping satu arah panjang selesai.");
            }
        }
        // ========== SATU ARAH PENDEK ==========
        else if (subJenis === 'pendek') {
            if (jenis === 'atas') {
                rect.setAttribute("stroke-width", strokePx);
                const x_kiri_mm = Lx_mm / 6;
                const x_tengah_mm = (7/15) * Ly_mm;
                const x_kanan_mm = Ly_mm - Lx_mm / 6;
                const xKiri = toDisplayX(x_kiri_mm, 0);
                const xTengah = toDisplayX(x_tengah_mm, 0);
                const xKanan = toDisplayX(x_kanan_mm, 0);
                buatGaris(xKiri, offsetY, xKiri, offsetY + height_display, warnaMerah, strokePx);
                buatGaris(xTengah, offsetY, xTengah, offsetY + height_display, warnaMerah, strokePx);
                buatGaris(xKanan, offsetY, xKanan, offsetY + height_display, warnaMerah, strokePx);
                
                const ySegitigaMerah_mm = Lx_mm / 3;
                const ySegitigaMerah = toDisplayY(0, ySegitigaMerah_mm);
                buatSegitiga(svg, 'right', 2, xKiri, ySegitigaMerah, segitigaLebar, segitigaTinggi, warnaMerah);
                buatSegitiga(svg, 'left', 2, xTengah, ySegitigaMerah, segitigaLebar, segitigaTinggi, warnaMerah);
                buatSegitiga(svg, 'right', 2, xKanan, ySegitigaMerah, segitigaLebar, segitigaTinggi, warnaMerah);
                
                const jarakSet_mm = Lx_mm * 0.04167;
                const tengahY_mm = Lx_mm / 2;
                const ySet1_mm = tengahY_mm + jarakSet_mm;
                const ySet2_mm = tengahY_mm - jarakSet_mm * 1.5;
                
                const gambarSetAsli = (y_mm) => {
                    const p1 = { x: 0, y: y_mm };
                    const p2 = { x: step1_mm, y: y_mm };
                    const p3 = { x: step1_mm + step2_mm, y: y_mm + step2_mm };
                    const p4 = { x: Ly_mm, y: y_mm + step2_mm };
                    const points = `${toDisplayX(p1.x, p1.y)},${toDisplayY(p1.x, p1.y)} ` +
                                   `${toDisplayX(p2.x, p2.y)},${toDisplayY(p2.x, p2.y)} ` +
                                   `${toDisplayX(p3.x, p3.y)},${toDisplayY(p3.x, p3.y)} ` +
                                   `${toDisplayX(p4.x, p4.y)},${toDisplayY(p4.x, p4.y)}`;
                    buatPolyline(points, warnaTulangan, strokePx);
                    const x_start_kanan = Ly_mm - panjangPendek_mm;
                    const x_end_kanan = Ly_mm;
                    buatGaris(toDisplayX(x_start_kanan, y_mm), toDisplayY(x_start_kanan, y_mm),
                              toDisplayX(x_end_kanan, y_mm), toDisplayY(x_end_kanan, y_mm),
                              warnaTulangan, strokePx);
                    const xSegitigaPendek = x_start_kanan + panjangPendek_mm * 0.6;
                    buatSegitiga(svg, 'down', 1, toDisplayX(xSegitigaPendek, y_mm), toDisplayY(xSegitigaPendek, y_mm),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                    const tengahX_step1 = step1_mm / 2;
                    buatSegitiga(svg, 'down', 1, toDisplayX(tengahX_step1, y_mm), toDisplayY(tengahX_step1, y_mm),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                    const tengahBentangX = Ly_mm / 2;
                    buatSegitiga(svg, 'up', 1, toDisplayX(tengahBentangX, p3.y), toDisplayY(tengahBentangX, p3.y),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                };
                
                const gambarSetFlip = (y_mm) => {
                    const p1 = { x: Ly_mm, y: y_mm };
                    const p2 = { x: Ly_mm - step1_mm, y: y_mm };
                    const p3 = { x: Ly_mm - (step1_mm + step2_mm), y: y_mm + step2_mm };
                    const p4 = { x: 0, y: y_mm + step2_mm };
                    const points = `${toDisplayX(p1.x, p1.y)},${toDisplayY(p1.x, p1.y)} ` +
                                   `${toDisplayX(p2.x, p2.y)},${toDisplayY(p2.x, p2.y)} ` +
                                   `${toDisplayX(p3.x, p3.y)},${toDisplayY(p3.x, p3.y)} ` +
                                   `${toDisplayX(p4.x, p4.y)},${toDisplayY(p4.x, p4.y)}`;
                    buatPolyline(points, warnaTulangan, strokePx);
                    const x_start_kiri = 0;
                    const x_end_kiri = panjangPendek_mm;
                    buatGaris(toDisplayX(x_start_kiri, y_mm), toDisplayY(x_start_kiri, y_mm),
                              toDisplayX(x_end_kiri, y_mm), toDisplayY(x_end_kiri, y_mm),
                              warnaTulangan, strokePx);
                    const xSegitigaPendek = x_start_kiri + panjangPendek_mm * 0.3;
                    buatSegitiga(svg, 'down', 1, toDisplayX(xSegitigaPendek, y_mm), toDisplayY(xSegitigaPendek, y_mm),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                    const tengahX_step1_flip = Ly_mm - step1_mm / 2;
                    buatSegitiga(svg, 'down', 1, toDisplayX(tengahX_step1_flip, y_mm), toDisplayY(tengahX_step1_flip, y_mm),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                    const tengahBentangX = Ly_mm / 2;
                    buatSegitiga(svg, 'up', 1, toDisplayX(tengahBentangX, p3.y), toDisplayY(tengahBentangX, p3.y),
                                 segitigaLebar, segitigaTinggi, warnaTulangan);
                };
                
                if (ySet1_mm <= Lx_mm) gambarSetAsli(ySet1_mm);
                if (ySet2_mm >= 0) gambarSetFlip(ySet2_mm);
                console.log("Tampak atas satu arah pendek selesai (revisi 3).");
            }
            else if (jenis === 'depan') {
                rect.setAttribute("stroke-width", strokePx);
                const y_atas_mm = selimutBeton;
                const y_bawah_mm = H_mm - selimutBeton;
                const y_atas = toDisplayY(0, y_atas_mm);
                const y_bawah = toDisplayY(0, y_bawah_mm);
                const step1_display = step1_mm * (width_display / Lx_mm);
                const step2_display = step2_mm * (width_display / Lx_mm);
                const tengahX = offsetX + width_display / 2;
                const pointsKiri = `${offsetX},${y_atas} ${offsetX + step1_display},${y_atas} ${offsetX + step1_display + step2_display},${y_bawah} ${tengahX},${y_bawah}`;
                buatPolyline(pointsKiri, warnaTulangan, strokePx);
                const pointsKanan = `${offsetX + width_display},${y_atas} ${offsetX + width_display - step1_display},${y_atas} ${offsetX + width_display - step1_display - step2_display},${y_bawah} ${tengahX},${y_bawah}`;
                buatPolyline(pointsKanan, warnaTulangan, strokePx);
                const panjangPendek_display = panjangPendek_mm * (width_display / Lx_mm);
                buatGaris(offsetX, y_atas, offsetX + panjangPendek_display, y_atas, warnaTulangan, strokePx);
                buatGaris(offsetX + width_display - panjangPendek_display, y_atas, offsetX + width_display, y_atas, warnaTulangan, strokePx);
                buatGaris(offsetX, y_bawah, offsetX + panjangPendek_display, y_bawah, warnaTulangan, strokePx);
                buatGaris(offsetX + width_display - panjangPendek_display, y_bawah, offsetX + width_display, y_bawah, warnaTulangan, strokePx);
                const jarakBagi_mm = jarakTulanganBagi;
                const stepBagiDisplay = jarakBagi_mm * (width_display / Lx_mm);
                const posAtasKiri = hitungPosisiTitikKiriKanan(offsetX, offsetX + panjangPendek_display, stepBagiDisplay, diameterTulanganBagi, offsetUjung, true);
                for (let cx of posAtasKiri) buatLingkaran(svg, cx, y_atas + offsetTitikDariGaris, radiusTitik, warnaMerah);
                const posAtasKanan = hitungPosisiTitikKiriKanan(offsetX + width_display - panjangPendek_display, offsetX + width_display, stepBagiDisplay, diameterTulanganBagi, offsetUjung, true);
                for (let cx of posAtasKanan) buatLingkaran(svg, cx, y_atas + offsetTitikDariGaris, radiusTitik, warnaMerah);
                const xStartBawah = offsetX + step1_display + step2_display;
                const xEndBawah = offsetX + width_display - step1_display - step2_display;
                if (xStartBawah < xEndBawah) {
                    const posBawahTengah = hitungPosisiTitikKiriKanan(xStartBawah, xEndBawah, stepBagiDisplay, diameterTulanganBagi, offsetUjung, true);
                    for (let cx of posBawahTengah) buatLingkaran(svg, cx, y_bawah - offsetTitikDariGaris, radiusTitik, warnaMerah);
                }
                console.log("Tampak depan satu arah pendek selesai.");
            }
            else if (jenis === 'samping') {
                rect.setAttribute("stroke-width", strokePx);
                const offsetTebal = diameterTulanganUtama / 2;
                const y_atas_mm = selimutBeton + offsetTebal;
                const y_bawah_mm = H_mm - (selimutBeton + offsetTebal);
                const y_atas = toDisplayY(0, y_atas_mm);
                const y_bawah = toDisplayY(0, y_bawah_mm);
                buatGaris(offsetX, y_atas, offsetX + width_display, y_atas, warnaMerah, strokePx);
                buatGaris(offsetX, y_bawah, offsetX + width_display, y_bawah, warnaMerah, strokePx);
                const jarakUtama_mm = jarakTulanganUtama;
                const stepUtamaDisplay = jarakUtama_mm * (width_display / Ly_mm);
                const posAtas = hitungPosisiTitikKiriKanan(offsetX, offsetX + width_display, stepUtamaDisplay, diameterTulanganUtama, offsetUjung, true);
                for (let cx of posAtas) buatLingkaran(svg, cx, y_atas - offsetTitikDariGaris, radiusTitik, warnaTulangan);
                const posBawah = hitungPosisiTitikKiriKanan(offsetX, offsetX + width_display, stepUtamaDisplay, diameterTulanganUtama, offsetUjung, true);
                for (let cx of posBawah) buatLingkaran(svg, cx, y_bawah + offsetTitikDariGaris, radiusTitik, warnaTulangan);
                console.log("Tampak samping satu arah pendek selesai.");
            }
        }

        return {
            config,
            containerId,
            jenisPelat: 'satu_arah',
            subJenis,
            scaleInfo: {
                needScaleNote,
                skala_horizontal,
                skala_vertikal,
                originalWidth: width_original_mm,
                originalHeight: height_original_mm,
                displayedWidth: width_display,
                displayedHeight: height_display
            }
        };
    }

    window.pelatRenderers.satu_arah = renderPelatSatuArah;
    console.log("✅ cut-pelat1arah.js (revisi 3) loaded");

    // ==================== EKSPOR CAD UNTUK PELAT SATU ARAH (REAL SIZE, NO SCALE) ====================
    
    /**
     * Generate perintah CAD untuk pelat satu arah berdasarkan jenis tampak
     * @param {string} jenisTampak - 'depan', 'atas', atau 'samping'
     * @returns {string} Kode CAD dalam format teks
     */
    function generateCADPelatSatuArah(jenisTampak) {
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
            
            const subJenis = getSubJenisSatuArah();
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
            const step1_mm = Lx_mm / 5;
            const step2_mm = Lx_mm / 20;
            const panjangPendek_mm = Lx_mm / 3;
            
            // Helper untuk format perintah CAD (setiap perintah diakhiri spasi)
            const lingkaran = (cx, cy, diameter) => `CIRCLE ${cx},${cy} ${diameter/2} `;
            
            // Garis biasa (hanya untuk frame)
            const garis = (x1, y1, x2, y2) => `LINE ${x1},${y1} ${x2},${y2} `;
            
            // Polyline dengan ketebalan tertentu (untuk tulangan)
            // points: array of [x,y] absolut
            // tebal: ketebalan garis (biasanya diameter tulangan)
            // closed: apakah ditutup (C)
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
            
            // Fungsi hitung posisi titik dengan aturan ujung (offset awal setengah spasi)
            function hitungPosisiTitikCAD(start, end, step, diameter) {
                let positions = [];
                if (start <= end) {
                    // Arah normal (kiri ke kanan)
                    for (let x = start; x <= end; x += step) {
                        positions.push(x);
                    }
                    // Aturan ujung (kanan)
                    const last = positions[positions.length - 1];
                    if (end - last >= 4 * diameter) positions.push(end);
                    else positions[positions.length - 1] = end;
                } else {
                    // Arah terbalik (kanan ke kiri)
                    for (let x = start; x >= end; x -= step) {
                        positions.push(x);
                    }
                    // Aturan ujung (kiri) - karena sekarang ujungnya adalah end (nilai kecil)
                    const last = positions[positions.length - 1];
                    if (last - end >= 4 * diameter) positions.push(end);
                    else positions[positions.length - 1] = end;
                }
                return positions;
            }
            
            // Fungsi untuk membuat segitiga (polyline tertutup) dengan orientasi yang benar
            // arah: 'up', 'down', 'left', 'right' (menunjuk menjauhi garis)
            // centerX, centerY: titik tengah sisi segitiga yang menempel pada garis
            // ukuran: panjang sisi segitiga (2% dari Lx)
            // tebal: ketebalan garis (biasanya 2 untuk segitiga merah)
            const buatSegitigaCAD = (centerX, centerY, arah, ukuran, tebal) => {
                const setengah = ukuran / 2;
                let p1, p2, p3;
                if (arah === 'up') {
                    // sisi di bawah, ujung ke atas
                    p1 = [centerX - setengah, centerY];
                    p2 = [centerX + setengah, centerY];
                    p3 = [centerX, centerY - ukuran];
                } else if (arah === 'down') {
                    // sisi di atas, ujung ke bawah
                    p1 = [centerX - setengah, centerY];
                    p2 = [centerX + setengah, centerY];
                    p3 = [centerX, centerY + ukuran];
                } else if (arah === 'left') {
                    // sisi di kanan, ujung ke kiri
                    p1 = [centerX, centerY - setengah];
                    p2 = [centerX, centerY + setengah];
                    p3 = [centerX - ukuran, centerY];
                } else if (arah === 'right') {
                    // sisi di kiri, ujung ke kanan
                    p1 = [centerX, centerY - setengah];
                    p2 = [centerX, centerY + setengah];
                    p3 = [centerX + ukuran, centerY];
                } else {
                    return '';
                }
                return polyline([p1, p2, p3], tebal, true);
            };
            
            // Fungsi untuk membalik koordinat Y (karena SVG Y ke bawah, CAD Y ke atas)
            // tinggiTotal: tinggi total gambar dalam mm (Lx_mm untuk tampak atas, H_mm untuk depan/samping)
            const flipY = (y, tinggiTotal) => tinggiTotal - y;
            
            let cadLines = [];
            
            // Tentukan tinggi total untuk flip Y
            let tinggiTotal;
            if (jenisTampak === 'depan') tinggiTotal = H_mm;
            else if (jenisTampak === 'atas') tinggiTotal = Lx_mm;
            else tinggiTotal = H_mm; // samping
            
            // ========== TAMBAH FRAME KOTAK (menggunakan garis biasa) ==========
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
            
            // Ukuran segitiga = 2% dari Lx_mm
            const ukuranSegitiga = 0.02 * Lx_mm;
            
            if (jenisTampak === 'depan') {
                // ================= TAMPAK DEPAN =================
                if (subJenis === 'panjang') {
                    const yAtas = selimutBeton + diameterTulanganUtama/2;
                    const yBawah = H_mm - (selimutBeton + diameterTulanganUtama/2);
                    // Garis tulangan bagi (merah) - menggunakan polyline dengan diameter bagi
                    cadLines.push(polyline([[0+selimutBeton, flipY(yAtas + diameterTulanganUtama/2 + diameterTulanganBagi/2, tinggiTotal)], 
                                            [Lx_mm-selimutBeton, flipY(yAtas + diameterTulanganUtama/2 + diameterTulanganBagi/2, tinggiTotal)]], 
                                           diameterTulanganBagi));
                    cadLines.push(polyline([[0+selimutBeton, flipY(yBawah - diameterTulanganUtama/2 - diameterTulanganBagi/2, tinggiTotal)], 
                                            [Lx_mm-selimutBeton, flipY(yBawah - diameterTulanganUtama/2 - diameterTulanganBagi/2, tinggiTotal)]], 
                                           diameterTulanganBagi));
                    // Lingkaran tulangan utama atas dan bawah (hitam)
                    const step = jarakTulanganUtama;
                    const posAtas = hitungPosisiTitikCAD(0+selimutBeton+diameterTulanganUtama/2, Lx_mm-selimutBeton-diameterTulanganUtama/2, step, diameterTulanganUtama);
                    for (let x of posAtas) {
                        cadLines.push(lingkaran(x, flipY(yAtas, tinggiTotal), diameterTulanganUtama));
                    }
                    const posBawah = hitungPosisiTitikCAD(0+selimutBeton+diameterTulanganUtama/2, Lx_mm-selimutBeton-diameterTulanganUtama/2, step, diameterTulanganUtama);
                    for (let x of posBawah) {
                        cadLines.push(lingkaran(x, flipY(yBawah, tinggiTotal), diameterTulanganUtama));
                    }
                } 
                else if (subJenis === 'pendek') {
                    const yAtas = selimutBeton+diameterTulanganUtama/2;
                    const yBawah = H_mm - selimutBeton-diameterTulanganUtama/2;
                    const tengahX = Lx_mm / 2;
                    const tebal = diameterTulanganUtama;
                    // Polyline tulangan utama (hitam)
                    const pointsKiri = [[0, flipY(yAtas, tinggiTotal)], 
                                        [step1_mm, flipY(yAtas, tinggiTotal)], 
                                        [step1_mm+step2_mm, flipY(yBawah, tinggiTotal)], 
                                        [tengahX, flipY(yBawah, tinggiTotal)]];
                    const pointsKanan = [[Lx_mm, flipY(yAtas, tinggiTotal)], 
                                         [Lx_mm-step1_mm, flipY(yAtas, tinggiTotal)], 
                                         [Lx_mm-step1_mm-step2_mm, flipY(yBawah, tinggiTotal)], 
                                         [tengahX, flipY(yBawah, tinggiTotal)]];
                    cadLines.push(polyline(pointsKiri, tebal));
                    cadLines.push(polyline(pointsKanan, tebal));
                    // Garis pendek kiri dan kanan (tulangan utama)
                    cadLines.push(polyline([[0, flipY(yAtas, tinggiTotal)], [panjangPendek_mm, flipY(yAtas, tinggiTotal)]], tebal));
                    cadLines.push(polyline([[Lx_mm - panjangPendek_mm, flipY(yAtas, tinggiTotal)], [Lx_mm, flipY(yAtas, tinggiTotal)]], tebal));
                    cadLines.push(polyline([[0, flipY(yBawah, tinggiTotal)], [panjangPendek_mm, flipY(yBawah, tinggiTotal)]], tebal));
                    cadLines.push(polyline([[Lx_mm - panjangPendek_mm, flipY(yBawah, tinggiTotal)], [Lx_mm, flipY(yBawah, tinggiTotal)]], tebal));
                    // Lingkaran tulangan bagi (merah) di atas kiri & kanan
                    const stepBagi = jarakTulanganBagi;
                    const yTitikAtas = selimutBeton + diameterTulanganUtama + diameterTulanganBagi/2;
                    const posAtasKiri = hitungPosisiTitikCAD(0+diameterTulanganBagi/2, panjangPendek_mm-diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                    for (let x of posAtasKiri) {
                        cadLines.push(lingkaran(x, flipY(yTitikAtas, tinggiTotal), diameterTulanganBagi));
                    }
                    const posAtasKanan = hitungPosisiTitikCAD(Lx_mm-diameterTulanganBagi/2, Lx_mm-panjangPendek_mm+diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                    for (let x of posAtasKanan) {
                        cadLines.push(lingkaran(x, flipY(yTitikAtas, tinggiTotal), diameterTulanganBagi));
                    }
                    // Lingkaran tulangan bagi (merah) di bawah tengah
                    const xStart = step1_mm + step2_mm;
                    const xEnd = Lx_mm - step1_mm - step2_mm;
                    const yTitikBawah = H_mm - selimutBeton - diameterTulanganUtama - diameterTulanganBagi/2;
                    const posBawahTengah = hitungPosisiTitikCAD(xStart, xEnd, stepBagi, diameterTulanganBagi);
                    for (let x of posBawahTengah) {
                        cadLines.push(lingkaran(x, flipY(yTitikBawah, tinggiTotal), diameterTulanganBagi));
                    }
                }
            }
            else if (jenisTampak === 'atas') {
                // ================= TAMPAK ATAS =================
                if (subJenis === 'panjang') {
                    const y1 = Lx_mm / 6;
                    const y2 = Lx_mm / 1.8;
                    const y3 = (5 * Lx_mm) / 6;
                    cadLines.push(polyline([[0, flipY(y1, tinggiTotal)], [Ly_mm, flipY(y1, tinggiTotal)]], diameterTulanganBagi));
                    cadLines.push(polyline([[0, flipY(y2, tinggiTotal)], [Ly_mm, flipY(y2, tinggiTotal)]], diameterTulanganBagi));
                    cadLines.push(polyline([[0, flipY(y3, tinggiTotal)], [Ly_mm, flipY(y3, tinggiTotal)]], diameterTulanganBagi));
                    
                    // Segitiga merah (arah: y1 down, y2 up, y3 down)
                    const xSegitiga = (7/15) * Ly_mm;
                    cadLines.push(buatSegitigaCAD(xSegitiga, flipY(y1, tinggiTotal), 'up', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(xSegitiga, flipY(y2, tinggiTotal), 'down', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(xSegitiga, flipY(y3, tinggiTotal), 'up', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(xSegitiga-ukuranSegitiga, flipY(y1, tinggiTotal), 'up', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(xSegitiga-ukuranSegitiga, flipY(y2, tinggiTotal), 'down', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(xSegitiga-ukuranSegitiga, flipY(y3, tinggiTotal), 'up', ukuranSegitiga, diameterTulanganBagi));
                    // Polyline tulangan utama (hitam)
                    const jarakSet = Ly_mm * 0.04167;
                    const xSet1 = Ly_mm/2 + jarakSet;
                    const xSet2 = xSet1 + jarakSet * 1.8;
                    const tebalTulangan = diameterTulanganUtama;
                    
                    // Set asli
                    const setAsli = [[xSet1, flipY(0, tinggiTotal)], 
                                     [xSet1, flipY(step1_mm, tinggiTotal)], 
                                     [xSet1 + step2_mm, flipY(step1_mm + step2_mm, tinggiTotal)], 
                                     [xSet1 + step2_mm, flipY(Lx_mm, tinggiTotal)]];
                    cadLines.push(polyline(setAsli, tebalTulangan));
                    cadLines.push(polyline([[xSet1, flipY(Lx_mm - panjangPendek_mm, tinggiTotal)], 
                                            [xSet1, flipY(Lx_mm, tinggiTotal)]], tebalTulangan));
                    // Segitiga pada set asli (arah right)
                    const ySegitigaPendek = Lx_mm - panjangPendek_mm + (panjangPendek_mm * 0.667);
                    cadLines.push(buatSegitigaCAD(xSet1, flipY(ySegitigaPendek, tinggiTotal), 'right', ukuranSegitiga, tebalTulangan));
                    const tengahY_step1 = step1_mm/2;
                    cadLines.push(buatSegitigaCAD(xSet1, flipY(tengahY_step1, tinggiTotal), 'right', ukuranSegitiga, tebalTulangan));
                    const tengahBentangY = Lx_mm/2;
                    const xTitik3 = xSet1 + step2_mm;
                    cadLines.push(buatSegitigaCAD(xTitik3, flipY(tengahBentangY, tinggiTotal), 'left', ukuranSegitiga, tebalTulangan));
                    
                    // Set terbalik (jika ada)
                    if (xSet2 + step2_mm <= Ly_mm) {
                        const setTerbalik = [[xSet2, flipY(Lx_mm, tinggiTotal)], 
                                             [xSet2, flipY(Lx_mm - step1_mm, tinggiTotal)], 
                                             [xSet2 + step2_mm, flipY(Lx_mm - step1_mm - step2_mm, tinggiTotal)], 
                                             [xSet2 + step2_mm, flipY(0, tinggiTotal)]];
                        cadLines.push(polyline(setTerbalik, tebalTulangan));
                        cadLines.push(polyline([[xSet2, flipY(0, tinggiTotal)], 
                                                [xSet2, flipY(panjangPendek_mm, tinggiTotal)]], tebalTulangan));
                        const ySegitigaPendekFlip = panjangPendek_mm * 0.3;
                        cadLines.push(buatSegitigaCAD(xSet2, flipY(ySegitigaPendekFlip, tinggiTotal), 'right', ukuranSegitiga, tebalTulangan));
                        const tengahY_step1_flip = Lx_mm - step1_mm/2;
                        cadLines.push(buatSegitigaCAD(xSet2, flipY(tengahY_step1_flip, tinggiTotal), 'right', ukuranSegitiga, tebalTulangan));
                        const xTitik3Flip = xSet2 + step2_mm;
                        cadLines.push(buatSegitigaCAD(xTitik3Flip, flipY(tengahBentangY, tinggiTotal), 'left', ukuranSegitiga, tebalTulangan));
                    }
                }
                else if (subJenis === 'pendek') {
                    // Tiga garis merah vertikal (menggunakan polyline dengan ketebalan 2)
                    const x1 = Lx_mm / 6;
                    const x2 = (7/15) * Ly_mm;
                    const x3 = Ly_mm - Lx_mm / 6;
                    cadLines.push(polyline([[x1, 0], [x1, Lx_mm]], diameterTulanganBagi));
                    cadLines.push(polyline([[x2, 0], [x2, Lx_mm]], diameterTulanganBagi));
                    cadLines.push(polyline([[x3, 0], [x3, Lx_mm]], diameterTulanganBagi));
                    
                    // Segitiga merah (arah: x1 right, x2 left, x3 right)
                    const ySegitiga = Lx_mm / 3;
                    cadLines.push(buatSegitigaCAD(x1, flipY(ySegitiga, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(x2, flipY(ySegitiga, tinggiTotal), 'left', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(x3, flipY(ySegitiga, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(x1, flipY(ySegitiga-ukuranSegitiga, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(x2, flipY(ySegitiga-ukuranSegitiga, tinggiTotal), 'left', ukuranSegitiga, diameterTulanganBagi));
                    cadLines.push(buatSegitigaCAD(x3, flipY(ySegitiga-ukuranSegitiga, tinggiTotal), 'right', ukuranSegitiga, diameterTulanganBagi));
                    
                    // Polyline tulangan utama (hitam)
                    const jarakSet = Lx_mm * 0.04167;
                    const ySet1 = Lx_mm/2 + jarakSet;
                    const ySet2 = Lx_mm/2 - jarakSet * 1.5;
                    const tebalTulangan = diameterTulanganUtama;
                    
                    // Set asli
                    const setAsli = [[0, flipY(ySet1, tinggiTotal)], 
                                     [step1_mm, flipY(ySet1, tinggiTotal)], 
                                     [step1_mm + step2_mm, flipY(ySet1 + step2_mm, tinggiTotal)], 
                                     [Ly_mm, flipY(ySet1 + step2_mm, tinggiTotal)]];
                    cadLines.push(polyline(setAsli, tebalTulangan));
                    cadLines.push(polyline([[Ly_mm - panjangPendek_mm, flipY(ySet1, tinggiTotal)], 
                                            [Ly_mm, flipY(ySet1, tinggiTotal)]], tebalTulangan));
                    const xSegitigaPendek = Ly_mm - panjangPendek_mm + (panjangPendek_mm * 0.6);
                    cadLines.push(buatSegitigaCAD(xSegitigaPendek, flipY(ySet1, tinggiTotal), 'down', ukuranSegitiga, tebalTulangan));
                    const tengahX_step1 = step1_mm/2;
                    cadLines.push(buatSegitigaCAD(tengahX_step1, flipY(ySet1, tinggiTotal), 'down', ukuranSegitiga, tebalTulangan));
                    const tengahBentangX = Ly_mm/2;
                    const yTitik3 = ySet1 + step2_mm;
                    cadLines.push(buatSegitigaCAD(tengahBentangX, flipY(yTitik3, tinggiTotal), 'up', ukuranSegitiga, tebalTulangan));
                    
                    // Set flip (jika ySet2 >= 0)
                    if (ySet2 >= 0) {
                        const setFlip = [[Ly_mm, flipY(ySet2, tinggiTotal)], 
                                         [Ly_mm - step1_mm, flipY(ySet2, tinggiTotal)], 
                                         [Ly_mm - (step1_mm + step2_mm), flipY(ySet2 + step2_mm, tinggiTotal)], 
                                         [0, flipY(ySet2 + step2_mm, tinggiTotal)]];
                        cadLines.push(polyline(setFlip, tebalTulangan));
                        cadLines.push(polyline([[0, flipY(ySet2, tinggiTotal)], 
                                                [panjangPendek_mm, flipY(ySet2, tinggiTotal)]], tebalTulangan));
                        const xSegitigaPendekFlip = panjangPendek_mm * 0.3;
                        cadLines.push(buatSegitigaCAD(xSegitigaPendekFlip, flipY(ySet2, tinggiTotal), 'down', ukuranSegitiga, tebalTulangan));
                        const tengahX_step1_flip = Ly_mm - step1_mm/2;
                        cadLines.push(buatSegitigaCAD(tengahX_step1_flip, flipY(ySet2, tinggiTotal), 'down', ukuranSegitiga, tebalTulangan));
                        const yTitik3Flip = ySet2 + step2_mm;
                        cadLines.push(buatSegitigaCAD(tengahBentangX, flipY(yTitik3Flip, tinggiTotal), 'up', ukuranSegitiga, tebalTulangan));
                    }
                }
            }
            else if (jenisTampak === 'samping') {
                // ================= TAMPAK SAMPING =================
                if (subJenis === 'panjang') {
                    const yAtas = selimutBeton+diameterTulanganUtama/2;
                    const yBawah = H_mm - selimutBeton-diameterTulanganUtama/2;

                    const tengahX = Ly_mm / 2;
                    const tebal = diameterTulanganUtama;
                    
                    // Polyline tulangan utama (hitam)
                    const pointsKiri = [[0, flipY(yAtas, tinggiTotal)], 
                                        [step1_mm, flipY(yAtas, tinggiTotal)], 
                                        [step1_mm+step2_mm, flipY(yBawah, tinggiTotal)], 
                                        [tengahX, flipY(yBawah, tinggiTotal)]];
                    const pointsKanan = [[Ly_mm, flipY(yAtas, tinggiTotal)], 
                                         [Ly_mm-step1_mm, flipY(yAtas, tinggiTotal)], 
                                         [Ly_mm-step1_mm-step2_mm, flipY(yBawah, tinggiTotal)], 
                                         [tengahX, flipY(yBawah, tinggiTotal)]];
                    cadLines.push(polyline(pointsKiri, tebal));
                    cadLines.push(polyline(pointsKanan, tebal));
                    // Garis pendek kiri dan kanan
                    cadLines.push(polyline([[0, flipY(yAtas, tinggiTotal)], [panjangPendek_mm, flipY(yAtas, tinggiTotal)]], tebal));
                    cadLines.push(polyline([[Ly_mm-panjangPendek_mm, flipY(yAtas, tinggiTotal)], [Ly_mm, flipY(yAtas, tinggiTotal)]], tebal));
                    cadLines.push(polyline([[0, flipY(yBawah, tinggiTotal)], [panjangPendek_mm, flipY(yBawah, tinggiTotal)]], tebal));
                    cadLines.push(polyline([[Ly_mm-panjangPendek_mm, flipY(yBawah, tinggiTotal)], [Ly_mm, flipY(yBawah, tinggiTotal)]], tebal));
                    
                    // Lingkaran tulangan bagi (merah) di atas kiri & kanan
                    const yTitikAtas = selimutBeton+diameterTulanganUtama+diameterTulanganBagi/2;
                    const posAtasKiri = hitungPosisiTitikCAD(diameterTulanganBagi/2, panjangPendek_mm-diameterTulanganBagi/2, jarakTulanganBagi, diameterTulanganBagi);
                    for (let x of posAtasKiri) {
                        cadLines.push(lingkaran(x, flipY(yTitikAtas, tinggiTotal), diameterTulanganBagi));
                    }
                    const posAtasKanan = hitungPosisiTitikCAD(Ly_mm-diameterTulanganBagi/2, Ly_mm-panjangPendek_mm+diameterTulanganBagi/2, jarakTulanganBagi, diameterTulanganBagi);
                    for (let x of posAtasKanan) {
                        cadLines.push(lingkaran(x, flipY(yTitikAtas, tinggiTotal), diameterTulanganBagi));
                    }
                    // Lingkaran tulangan utama (hitam) di bawah tengah
                    const xStart = step1_mm + step2_mm;
                    const xEnd = Ly_mm - step1_mm - step2_mm;
                    const stepUtama_ly = (jarakTulanganUtama / Lx_mm) * Ly_mm;
                    const yTitikBawah = yBawah-diameterTulanganUtama/2-diameterTulanganBagi/2;
                    const posBawahTengah = hitungPosisiTitikCAD(xStart, xEnd, stepUtama_ly, diameterTulanganBagi);
                    for (let x of posBawahTengah) {
                        cadLines.push(lingkaran(x, flipY(yTitikBawah, tinggiTotal), diameterTulanganBagi));
                    }
                }
                else if (subJenis === 'pendek') {
                    const yAtas = selimutBeton + diameterTulanganUtama/2;
                    const yBawah = H_mm - (selimutBeton + diameterTulanganUtama/2);
                    cadLines.push(polyline([[selimutBeton, flipY(yAtas+diameterTulanganUtama/2+diameterTulanganBagi/2, tinggiTotal)], [Ly_mm-selimutBeton, flipY(yAtas+diameterTulanganUtama/2+diameterTulanganBagi/2, tinggiTotal)]], diameterTulanganBagi));
                    cadLines.push(polyline([[selimutBeton, flipY(yBawah-diameterTulanganUtama/2-diameterTulanganBagi/2, tinggiTotal)], [Ly_mm-selimutBeton, flipY(yBawah-diameterTulanganUtama/2-diameterTulanganBagi/2, tinggiTotal)]], diameterTulanganBagi));
                    // Lingkaran tulangan utama (hitam) di atas dan bawah
                    const stepUtama_ly = (jarakTulanganUtama / Lx_mm) * Ly_mm;
                    const posAtas = hitungPosisiTitikCAD(selimutBeton+diameterTulanganUtama/2, Ly_mm-selimutBeton-diameterTulanganUtama/2, stepUtama_ly, diameterTulanganUtama);
                    for (let x of posAtas) {
                        cadLines.push(lingkaran(x, flipY(yAtas, tinggiTotal), diameterTulanganUtama));
                    }
                    const posBawah = hitungPosisiTitikCAD(selimutBeton+diameterTulanganUtama/2, Ly_mm-selimutBeton-diameterTulanganUtama/2, stepUtama_ly, diameterTulanganUtama);
                    for (let x of posBawah) {
                        cadLines.push(lingkaran(x, flipY(yBawah, tinggiTotal), diameterTulanganUtama));
                    }
                }
            }
            
            return cadLines.join("\n");
        } catch (error) {
            console.error("Gagal generate CAD pelat satu arah:", error);
            alert("Gagal generate CAD: " + error.message);
            return "";
        }
    }
    
    // Ekspos fungsi generate CAD untuk digunakan oleh dispatcher global
    window.generateCADPelatSatuArah = generateCADPelatSatuArah;
    
    console.log("✅ cut-pelat1arah.js - fungsi CAD untuk pelat satu arah selesai (dengan perbaikan orientasi dan polyline)");
})();