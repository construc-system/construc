// cut-pelatkantilever.js - Render tampak pelat kantilever (tipe F dan G) + Ekspor CAD

(function() {
    function renderPelatKantilever(config, containerId) {
        console.log("🎨 Rendering pelat kantilever (revisi dot spacing):", config, containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} tidak ditemukan`);
            return { config, containerId, scaleInfo: null, jenisPelat: 'kantilever' };
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

        // ==================== FUNGSI HITUNG POSISI DOT SVG (ANTIDEMPET) ====================
        function hitungPosisiTitik(startX, endX, stepAsli, radiusTitik, diameterTulanganDisplay) {
            const leftBound = startX + radiusTitik;
            const rightBound = endX - radiusTitik;
            if (leftBound >= rightBound) return [];

            const minStep = Math.max(stepAsli, 4.5 * radiusTitik); 
            const step = minStep;

            let positions = [];
            let current = leftBound;
            while (current <= rightBound) {
                positions.push(current);
                current += step;
            }

            const batasAmanUjung = Math.max(3 * diameterTulanganDisplay, 3 * radiusTitik);

            if (positions.length > 0) {
                const jarakKiri = positions[0] - leftBound;
                if (jarakKiri >= batasAmanUjung) {
                    positions.unshift(leftBound);
                }
            } else {
                positions.push(leftBound);
            }

            const lastIdx = positions.length - 1;
            const jarakKanan = rightBound - positions[lastIdx];
            if (jarakKanan >= batasAmanUjung) {
                positions.push(rightBound);
            }

            return positions;
        }

        function buatLingkaran(svg, cx, cy, radius, warna) {
            const circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("cx", cx);
            circle.setAttribute("cy", cy);
            circle.setAttribute("r", radius);
            circle.setAttribute("fill", warna);
            circle.setAttribute("stroke", "none");
            svg.appendChild(circle);
        }

        const W = width_display;
        const strokePx = 2;
        const segitigaLebar = height_display * 0.035;
        const segitigaTinggi = height_display * 0.035;
        const warnaTulangan = "#000000";
        const warnaMerah = "#FF0000";
        const radiusTitik = strokePx * 3;
        const offsetTitikDariGaris = strokePx * 4;
        const offsetUjung = strokePx * 3;

        const tumpuanHuruf = (dataStorage && dataStorage.rekap && dataStorage.rekap.tabel) ? dataStorage.rekap.tabel.tumpuanHuruf : 'F';
        const isTipeF = (tumpuanHuruf === 'F');
        const isTipeG = (tumpuanHuruf === 'G');

        if (jenis === 'atas') {
            rect.setAttribute("stroke-width", strokePx);
            const warnaHorizontal = isTipeF ? warnaTulangan : warnaMerah;
            const warnaVertikal = isTipeF ? warnaMerah : warnaTulangan;
            const jumlahSegitigaHorizontal = isTipeF ? 1 : 2;
            const jumlahSegitigaVertikal = isTipeF ? 2 : 1;
            
            const posYHorizontal = offsetY + (2/3) * height_display;
            const posXVertikal = offsetX + (2/3) * width_display;
            const tengahX = offsetX + width_display / 2;
            const tengahY = offsetY + height_display / 2;
            
            buatGaris(offsetX, posYHorizontal, offsetX + width_display, posYHorizontal, warnaHorizontal, strokePx);
            buatGaris(posXVertikal, offsetY, posXVertikal, offsetY + height_display, warnaVertikal, strokePx);
            
            if (jumlahSegitigaHorizontal === 1) {
                buatSegitiga(svg, 'down', 1, tengahX, posYHorizontal, segitigaLebar, segitigaTinggi, warnaHorizontal);
            } else {
                buatSegitiga(svg, 'down', 2, tengahX, posYHorizontal, segitigaLebar, segitigaTinggi, warnaHorizontal);
            }
            
            if (jumlahSegitigaVertikal === 1) {
                buatSegitiga(svg, 'right', 1, posXVertikal, tengahY, segitigaLebar, segitigaTinggi, warnaVertikal);
            } else {
                buatSegitiga(svg, 'right', 2, posXVertikal, tengahY, segitigaLebar, segitigaTinggi, warnaVertikal);
            }
        } 
        else if (jenis === 'depan') {
            rect.setAttribute("stroke-width", strokePx);
            const h_asli = config.h;
            const faktorSkala = height_display / h_asli;
            const gap_display = selimutBeton * (width_display / (lx * 1000));
            const x_start = offsetX + gap_display;
            const x_end = offsetX + width_display - gap_display;
            
            if (isTipeF) {
                const y_garis_mm = selimutBeton;
                let y_garis = offsetY + y_garis_mm * faktorSkala;
                y_garis = Math.min(Math.max(y_garis, offsetY + strokePx), offsetY + height_display - strokePx);
                if (x_start < x_end) {
                    buatGaris(x_start, y_garis, x_end, y_garis, warnaTulangan, strokePx);
                }
                const stepBagiDisplay = jarakTulanganBagi * (width_display / (lx * 1000));
                const diameterBagiDisplay = diameterTulanganBagi * (width_display / (lx * 1000));
                const posTitik = hitungPosisiTitik(x_start, x_end, stepBagiDisplay, radiusTitik, diameterBagiDisplay);
                const y_titik = y_garis + offsetTitikDariGaris;
                for (let cx of posTitik) buatLingkaran(svg, cx, y_titik, radiusTitik, warnaMerah);
            } else if (isTipeG) {
                const offsetTebal = diameterTulanganUtama / 2;
                const y_garis_mm = selimutBeton + offsetTebal;
                let y_garis = offsetY + y_garis_mm * faktorSkala;
                y_garis = Math.min(Math.max(y_garis, offsetY + strokePx), offsetY + height_display - strokePx);
                if (x_start < x_end) {
                    buatGaris(x_start, y_garis, x_end, y_garis, warnaMerah, strokePx);
                }
                const stepUtamaDisplay = jarakTulanganUtama * (width_display / (lx * 1000));
                const diameterUtamaDisplay = diameterTulanganUtama * (width_display / (lx * 1000));
                const posTitik = hitungPosisiTitik(x_start, x_end, stepUtamaDisplay, radiusTitik, diameterUtamaDisplay);
                const y_titik = y_garis - offsetTitikDariGaris;
                for (let cx of posTitik) buatLingkaran(svg, cx, y_titik, radiusTitik, warnaTulangan);
            }
        } 
        else if (jenis === 'samping') {
            rect.setAttribute("stroke-width", strokePx);
            const h_asli = config.h;
            const faktorSkala = height_display / h_asli;
            const gap_display = selimutBeton * (width_display / (ly * 1000));
            const x_start = offsetX + gap_display;
            const x_end = offsetX + width_display - gap_display;
            
            if (isTipeF) {
                const offsetTebal = diameterTulanganUtama / 2;
                const y_garis_mm = selimutBeton + offsetTebal;
                let y_garis = offsetY + y_garis_mm * faktorSkala;
                y_garis = Math.min(Math.max(y_garis, offsetY + strokePx), offsetY + height_display - strokePx);
                if (x_start < x_end) {
                    buatGaris(x_start, y_garis, x_end, y_garis, warnaMerah, strokePx);
                }
                const stepUtamaDisplay = jarakTulanganUtama * (width_display / (ly * 1000));
                const diameterUtamaDisplay = diameterTulanganUtama * (width_display / (ly * 1000));
                const posTitik = hitungPosisiTitik(x_start, x_end, stepUtamaDisplay, radiusTitik, diameterUtamaDisplay);
                const y_titik = y_garis - offsetTitikDariGaris;
                for (let cx of posTitik) buatLingkaran(svg, cx, y_titik, radiusTitik, warnaTulangan);
            } else if (isTipeG) {
                const y_garis_mm = selimutBeton;
                let y_garis = offsetY + y_garis_mm * faktorSkala;
                y_garis = Math.min(Math.max(y_garis, offsetY + strokePx), offsetY + height_display - strokePx);
                if (x_start < x_end) {
                    buatGaris(x_start, y_garis, x_end, y_garis, warnaTulangan, strokePx);
                }
                const stepBagiDisplay = jarakTulanganBagiY * (width_display / (ly * 1000));
                const diameterBagiDisplay = diameterTulanganBagiY * (width_display / (ly * 1000));
                const posTitik = hitungPosisiTitik(x_start, x_end, stepBagiDisplay, radiusTitik, diameterBagiDisplay);
                const y_titik = y_garis + offsetTitikDariGaris;
                for (let cx of posTitik) buatLingkaran(svg, cx, y_titik, radiusTitik, warnaMerah);
            }
        }

        console.log(`✅ Tampak ${jenis} kantilever tipe ${tumpuanHuruf} selesai.`);
        return {
            config,
            containerId,
            jenisPelat: 'kantilever',
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

    window.pelatRenderers.kantilever = renderPelatKantilever;
    console.log("✅ cut-pelatkantilever.js loaded");

    // ==================== EKSPOR CAD UNTUK PELAT KANTILEVER ====================

    function generateCADPelatKantilever() {
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
            const tumpuanHuruf = (dataStorage.rekap?.tabel?.tumpuanHuruf) || 'F';
            const isTipeF = (tumpuanHuruf === 'F');
            const isTipeG = (tumpuanHuruf === 'G');

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

            let cadLinesNonCircle = [];
            let cadLinesCircle = [];

            const tambahPerintah = (cmd, adalahCircle = false) => {
                if (!cmd) return;
                if (adalahCircle) {
                    cadLinesCircle.push(cmd);
                } else {
                    cadLinesNonCircle.push(cmd);
                }
            };

            const daftarTampak = ['depan', 'samping', 'atas'];

            daftarTampak.forEach(jenisTampak => {
                // ==================== TAMBAHAN OFFSET POSISI Y ====================
                let cadOffsetY = 0;
                if (jenisTampak === 'samping') {
                    cadOffsetY = 0;
                } else if (jenisTampak === 'atas') {
                    cadOffsetY = 1.5 * H_mm;
                } else if (jenisTampak === 'depan') {
                    cadOffsetY = (2 * H_mm) + Lx_mm;
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
                const ukuranSegitiga = 0.035 * Lx_mm;

                let tinggiTotal;
                if (jenisTampak === 'depan') tinggiTotal = H_mm;
                else if (jenisTampak === 'atas') tinggiTotal = Lx_mm;
                else tinggiTotal = H_mm;

                // Frame kotak
                if (jenisTampak === 'depan') {
                    tambahPerintah(garis(0, 0, Lx_mm, 0));
                    tambahPerintah(garis(Lx_mm, 0, Lx_mm, H_mm));
                    tambahPerintah(garis(Lx_mm, H_mm, 0, H_mm));
                    tambahPerintah(garis(0, H_mm, 0, 0));
                } else if (jenisTampak === 'atas') {
                    tambahPerintah(garis(0, 0, Ly_mm, 0));
                    tambahPerintah(garis(Ly_mm, 0, Ly_mm, Lx_mm));
                    tambahPerintah(garis(Ly_mm, Lx_mm, 0, Lx_mm));
                    tambahPerintah(garis(0, Lx_mm, 0, 0));
                } else if (jenisTampak === 'samping') {
                    tambahPerintah(garis(0, 0, Ly_mm, 0));
                    tambahPerintah(garis(Ly_mm, 0, Ly_mm, H_mm));
                    tambahPerintah(garis(Ly_mm, H_mm, 0, H_mm));
                    tambahPerintah(garis(0, H_mm, 0, 0));
                }

                // ========== TAMPAK ATAS ==========
                if (jenisTampak === 'atas') {
                    const posYHorizontal = (2/3) * Lx_mm;
                    const posXVertikal = (2/3) * Ly_mm;
                    const tengahX = Ly_mm / 2;
                    const tengahY = Lx_mm / 2;
                    const warnaHorizontal = isTipeF ? diameterTulanganUtama : diameterTulanganBagi;
                    const warnaVertikal = isTipeF ? diameterTulanganBagi : diameterTulanganUtama;
                    const jumlahSegitigaHorizontal = isTipeF ? 1 : 2;
                    const jumlahSegitigaVertikal = isTipeF ? 2 : 1;

                    tambahPerintah(polyline([[0, flipY(posYHorizontal, tinggiTotal)], [Ly_mm, flipY(posYHorizontal, tinggiTotal)]], warnaHorizontal));
                    if (jumlahSegitigaHorizontal === 1) {
                        tambahPerintah(buatSegitigaCAD(tengahX, flipY(posYHorizontal, tinggiTotal), 'up', ukuranSegitiga, warnaHorizontal));
                    } else {
                        tambahPerintah(buatSegitigaCAD(tengahX - ukuranSegitiga/2, flipY(posYHorizontal, tinggiTotal), 'up', ukuranSegitiga, warnaHorizontal));
                        tambahPerintah(buatSegitigaCAD(tengahX + ukuranSegitiga/2, flipY(posYHorizontal, tinggiTotal), 'up', ukuranSegitiga, warnaHorizontal));
                    }

                    tambahPerintah(polyline([[posXVertikal, 0], [posXVertikal, Lx_mm]], warnaVertikal));
                    if (jumlahSegitigaVertikal === 1) {
                        tambahPerintah(buatSegitigaCAD(posXVertikal, flipY(tengahY, tinggiTotal), 'right', ukuranSegitiga, warnaVertikal));
                    } else {
                        tambahPerintah(buatSegitigaCAD(posXVertikal, flipY(tengahY - ukuranSegitiga/2, tinggiTotal), 'right', ukuranSegitiga, warnaVertikal));
                        tambahPerintah(buatSegitigaCAD(posXVertikal, flipY(tengahY + ukuranSegitiga/2, tinggiTotal), 'right', ukuranSegitiga, warnaVertikal));
                    }
                }

                // ========== TAMPAK DEPAN ==========
                else if (jenisTampak === 'depan') {
                    const lebar = Lx_mm;
                    const gap = selimutBeton;
                    const x_start = gap;
                    const x_end = lebar - gap;

                    if (isTipeF) {
                        const y_garis = selimutBeton + diameterTulanganUtama/2;
                        tambahPerintah(polyline([[x_start, flipY(y_garis, tinggiTotal)], [x_end, flipY(y_garis, tinggiTotal)]], diameterTulanganUtama));
                        const stepBagi = jarakTulanganBagi;
                        const y_titik = y_garis + diameterTulanganUtama/2 + diameterTulanganBagi/2;
                        const posTitik = hitungPosisiTitikCAD(x_start + diameterTulanganBagi/2, x_end - diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                        for (let x of posTitik) {
                            tambahPerintah(lingkaran(x, flipY(y_titik, tinggiTotal), diameterTulanganBagi), true);
                        }
                    } else if (isTipeG) {
                        const y_garis = selimutBeton + diameterTulanganUtama + diameterTulanganBagi/2;
                        tambahPerintah(polyline([[x_start, flipY(y_garis, tinggiTotal)], [x_end, flipY(y_garis, tinggiTotal)]], diameterTulanganBagi));
                        const stepUtama = jarakTulanganUtama;
                        const y_titik = selimutBeton + diameterTulanganUtama/2;
                        const posTitik = hitungPosisiTitikCAD(x_start + diameterTulanganUtama/2, x_end - diameterTulanganUtama/2, stepUtama, diameterTulanganUtama);
                        for (let x of posTitik) {
                            tambahPerintah(lingkaran(x, flipY(y_titik, tinggiTotal), diameterTulanganUtama), true);
                        }
                    }
                }

                // ========== TAMPAK SAMPING ==========
                else if (jenisTampak === 'samping') {
                    const lebar = Ly_mm;
                    const gap = selimutBeton;
                    const x_start = gap;
                    const x_end = lebar - gap;

                    if (isTipeF) {
                        const y_garis = selimutBeton + diameterTulanganUtama/2 + diameterTulanganBagi;
                        tambahPerintah(polyline([[x_start, flipY(y_garis, tinggiTotal)], [x_end, flipY(y_garis, tinggiTotal)]], diameterTulanganBagi));
                        const stepUtama = jarakTulanganUtama;
                        const y_titik = selimutBeton + diameterTulanganUtama/2;
                        const posTitik = hitungPosisiTitikCAD(x_start + diameterTulanganUtama/2, x_end - diameterTulanganUtama/2, stepUtama, diameterTulanganUtama);
                        for (let x of posTitik) {
                            tambahPerintah(lingkaran(x, flipY(y_titik, tinggiTotal), diameterTulanganUtama), true);
                        }
                    } else if (isTipeG) {
                        const y_garis = selimutBeton + diameterTulanganUtama/2;
                        tambahPerintah(polyline([[x_start, flipY(y_garis, tinggiTotal)], [x_end, flipY(y_garis, tinggiTotal)]], diameterTulanganUtama));
                        const stepBagi = jarakTulanganBagiY;
                        const y_titik = selimutBeton + diameterTulanganUtama + diameterTulanganBagi/2;
                        const posTitik = hitungPosisiTitikCAD(x_start + diameterTulanganBagi/2, x_end - diameterTulanganBagi/2, stepBagi, diameterTulanganBagi);
                        for (let x of posTitik) {
                            tambahPerintah(lingkaran(x, flipY(y_titik, tinggiTotal), diameterTulanganBagi), true);
                        }
                    }
                }
            });
            
            // Hapus spasi pada baris PL/LINE paling akhir
            if (cadLinesNonCircle.length > 0) {
                let lastIdx = cadLinesNonCircle.length - 1;
                cadLinesNonCircle[lastIdx] = cadLinesNonCircle[lastIdx].trimEnd();
            }
            
            let finalLines = [...cadLinesNonCircle];
            
            // Sisipkan perintah ENTER antara PL/LINE dan kumpulan CIRCLE
            if (cadLinesCircle.length > 0 && cadLinesNonCircle.length > 0) {
                finalLines.push("ENTER");
            }
            
            finalLines = finalLines.concat(cadLinesCircle);
            return finalLines.join("\n");
        } catch (error) {
            console.error("Gagal generate CAD pelat kantilever:", error);
            alert("Gagal generate CAD: " + error.message);
            return "ERROR DETECTED: " + error.message + "\n" + error.stack;
        }
    }

    window.generateCADPelatKantilever = generateCADPelatKantilever;
    console.log("✅ cut-pelatkantilever.js - fungsi CAD untuk pelat kantilever selesai");
})();