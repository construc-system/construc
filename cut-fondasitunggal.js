(function() {
    // Fungsi hitung posisi dot dengan aturan yang sama seperti fondasi menerus
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

        // Cek penambahan dot di ujung kiri
        if (positions.length > 0) {
            const jarakKiri = positions[0] - leftBound;
            if (jarakKiri >= 3 * diameterTulanganDisplay) {
                positions.unshift(leftBound);
            }
        } else {
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

    function renderFondasiTunggal(config, containerId) {
        console.log("🏗️ Rendering fondasi tunggal:", config, containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} tidak ditemukan`);
            return { config, containerId, scaleInfo: null, jenisFondasi: 'tunggal', error: true };
        }
        container.innerHTML = "";

        const { jenis, lx, ly, h } = config;

        // Validasi parameter
        if (jenis === 'atas') {
            if (!lx || !ly) {
                console.error("Parameter fondasi tunggal tampak atas tidak lengkap", config);
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi tidak lengkap</p><p>Periksa lx, ly</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'tunggal', error: true };
            }
        } else if (jenis === 'samping') {
            if (!lx || !h) {
                console.error("Parameter fondasi tunggal tampak samping tidak lengkap", config);
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi tidak lengkap</p><p>Periksa lx, h</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'tunggal', error: true };
            }
        } else if (jenis === 'depan') {
            if (!ly || !h) {
                console.error("Parameter fondasi tunggal tampak depan tidak lengkap", config);
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data fondasi tidak lengkap</p><p>Periksa ly, h</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'tunggal', error: true };
            }
        } else {
            console.error("Jenis tampak tidak dikenal:", jenis);
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Jenis tampak harus 'atas', 'samping', atau 'depan'</p></div>`;
            return { config, containerId, scaleInfo: null, jenisFondasi: 'tunggal', error: true };
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

        let selimutBeton = 75; // default

        // Deteksi mode: bujur sangkar atau persegi panjang
        const isBujurSangkar = Math.abs(lx - ly) < 0.001;
        let spasiUtama = null;
        let diameterUtama = null;
        let spasiTepi = null;
        let spasiPusat = null;
        let diameterPendek = null;

        if (isBujurSangkar) {
            spasiUtama = getData('data.tulangan.s', null);
            if (fondasiData && fondasiData.rekap && fondasiData.rekap.tulangan_utama) {
                const match = fondasiData.rekap.tulangan_utama.match(/ɸ(\d+)/);
                if (match) diameterUtama = parseInt(match[1], 10);
            }
        } else {
            spasiUtama = getData('data.tulangan.bujur.s', null);
            if (spasiUtama && fondasiData && fondasiData.rekap && fondasiData.rekap.tulangan_panjang) {
                const match = fondasiData.rekap.tulangan_panjang.match(/ɸ(\d+)/);
                if (match) diameterUtama = parseInt(match[1], 10);
            }
            spasiTepi = getData('data.tulangan.persegi.s_tepi', null);
            spasiPusat = getData('data.tulangan.persegi.s_pusat', null);
            if (fondasiData && fondasiData.rekap && fondasiData.rekap.tulangan_pendek_tepi) {
                const match = fondasiData.rekap.tulangan_pendek_tepi.match(/ɸ(\d+)/);
                if (match) diameterPendek = parseInt(match[1], 10);
            }
        }

        console.log("Data tulangan:", { isBujurSangkar, spasiUtama, diameterUtama, spasiTepi, spasiPusat, diameterPendek });

        // Validasi data berdasarkan jenis tampak
        if (jenis === 'samping') {
            if (!spasiUtama) {
                console.error("Data tulangan utama tidak tersedia untuk tampak samping");
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data tulangan utama tidak tersedia untuk tampak samping</p><p>Periksa hasil perhitungan fondasi</p></div>`;
                return { config, containerId, scaleInfo: null, jenisFondasi: 'tunggal', error: true };
            }
        }
        if (jenis === 'depan') {
            if (isBujurSangkar) {
                if (!spasiUtama || !diameterUtama) {
                    console.error("Data tulangan utama tidak tersedia untuk tampak depan bujur sangkar", { spasiUtama, diameterUtama });
                    container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data tulangan utama tidak tersedia untuk tampak depan bujur sangkar</p><p>Periksa hasil perhitungan fondasi</p></div>`;
                    return { config, containerId, scaleInfo: null, jenisFondasi: 'tunggal', error: true };
                }
            } else {
                if (!spasiTepi || !spasiPusat || !diameterPendek) {
                    console.error("Data tulangan pendek tidak lengkap untuk tampak depan persegi panjang", { spasiTepi, spasiPusat, diameterPendek });
                    container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data tulangan pendek tidak tersedia untuk tampak depan persegi panjang</p><p>Periksa hasil perhitungan fondasi</p></div>`;
                    return { config, containerId, scaleInfo: null, jenisFondasi: 'tunggal', error: true };
                }
            }
        }

        // Dimensi asli (mm)
        let width_original_mm, height_original_mm;
        if (jenis === 'atas') {
            width_original_mm = ly * 1000;
            height_original_mm = lx * 1000;
        } else if (jenis === 'samping') {
            width_original_mm = lx * 1000;
            height_original_mm = h * 1000;
        } else { // depan
            width_original_mm = ly * 1000;
            height_original_mm = h * 1000;
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
        const warnaBiru = "#0000FF";
        // Ukuran visual
        const segitigaLebar = height_display * 0.035;
        const segitigaTinggi = height_display * 0.035;
        const radiusTitik = strokePx * 8;        // 16px
        const offsetTitikDariGaris = strokePx * 10; // 20px

        // Gambar fondasi
        buatRect(offsetX, offsetY, width_display, height_display, warnaHitam, strokePx, "#f8f9fa");

        // ================== TAMPAK ATAS ==================
        if (jenis === 'atas') {
            const gapHor = width_display * 0.02;
            const gapVer = height_display * 0.02;
            
            // Penentuan warna untuk garis vertikal
            let x_vert_list = [];
            let warnaList = [];
            
            if (isBujurSangkar) {
                const x_tengah = offsetX + (7/15) * width_display;
                x_vert_list.push(x_tengah);
                warnaList.push(warnaHitam);
            } else {
                const lebarFondasi_m = ly;
                const panjangFondasi_m = lx;
                const jarakSamping_m = (lebarFondasi_m - panjangFondasi_m) / 2;
                const propJarakSamping = jarakSamping_m / lebarFondasi_m;
                const x_kiri = offsetX + propJarakSamping * width_display;
                const x_kanan = offsetX + (1 - propJarakSamping) * width_display;
                const x_tengah = offsetX + (7/15) * width_display;
                x_vert_list.push(x_kiri, x_tengah, x_kanan);
                warnaList.push(warnaBiru, warnaMerah, warnaBiru);
            }
            
            const y_atas_vert = offsetY + gapVer;
            const y_bawah_vert = offsetY + height_display - gapVer;
            const y_segitiga_vert = offsetY + (7/15) * height_display;
            
            function gambarGarisVertikal(x, warna) {
                if (x < offsetX || x > offsetX + width_display) return;
                buatGaris(x, y_atas_vert, x, y_bawah_vert, warna, strokePx);
                buatSegitiga('left', x, y_segitiga_vert, segitigaLebar, segitigaTinggi, warna, 2);
                const deltaVer = segitigaTinggi;
                buatGaris(x, y_atas_vert, x - deltaVer, y_atas_vert + deltaVer, warna, strokePx);
                buatGaris(x, y_bawah_vert, x - deltaVer, y_bawah_vert - deltaVer, warna, strokePx);
            }
            
            for (let i = 0; i < x_vert_list.length; i++) {
                gambarGarisVertikal(x_vert_list[i], warnaList[i]);
            }
            
            // Garis horizontal (tetap hitam)
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
        }

        // ================== TAMPAK DEPAN ==================
        if (jenis === 'depan') {
            const gapDepan = width_display * 0.02;
            const x_kiri_garis = offsetX + gapDepan;
            const x_kanan_garis = offsetX + width_display - gapDepan;

            if (isBujurSangkar) {
                const jarakDariBawah_mm = selimutBeton + diameterUtama;
                const tinggiTotal_mm = h * 1000;
                const propDariBawah = jarakDariBawah_mm / tinggiTotal_mm;
                const y_garis_hitam = offsetY + height_display * (1 - propDariBawah);
                buatGaris(x_kiri_garis, y_garis_hitam, x_kanan_garis, y_garis_hitam, warnaHitam, strokePx);
                
                const y_dot = y_garis_hitam + offsetTitikDariGaris;
                const lebarFondasi_m = ly;
                const faktorSkala = width_display / (lebarFondasi_m * 1000);
                const stepUtama = spasiUtama * faktorSkala;
                const diameterUtamaDisplay = diameterUtama * faktorSkala;
                
                const posTitik = hitungPosisiTitik(x_kiri_garis, x_kanan_garis, stepUtama, radiusTitik, diameterUtamaDisplay);
                for (let cx of posTitik) {
                    buatLingkaran(cx, y_dot, radiusTitik, warnaHitam);
                }
            } else {
                const jarakDariBawah_mm = selimutBeton + diameterPendek;
                const tinggiTotal_mm = h * 1000;
                const propDariBawah = jarakDariBawah_mm / tinggiTotal_mm;
                const y_garis_hitam = offsetY + height_display * (1 - propDariBawah);
                buatGaris(x_kiri_garis, y_garis_hitam, x_kanan_garis, y_garis_hitam, warnaHitam, strokePx);
                
                const y_dot = y_garis_hitam + offsetTitikDariGaris;
                const lebarFondasi_m = ly;
                const panjangFondasi_m = lx;
                const lebarTepi_m = (lebarFondasi_m - panjangFondasi_m) / 2;
                const propTepi = lebarTepi_m / lebarFondasi_m;
                const batasTepiKanan = offsetX + propTepi * width_display;
                const batasTepiKiri = offsetX + (1 - propTepi) * width_display;
                
                const faktorSkala = width_display / (lebarFondasi_m * 1000);
                const stepTepi = spasiTepi * faktorSkala;
                const stepPusat = spasiPusat * faktorSkala;
                const diameterPendekDisplay = diameterPendek * faktorSkala;
                
                // Dot tepi (warna biru) menggunakan batas asli
                const posTepiKiri = hitungPosisiTitik(x_kiri_garis, batasTepiKanan, stepTepi, radiusTitik, diameterPendekDisplay);
                const posTepiKanan = hitungPosisiTitik(batasTepiKiri, x_kanan_garis, stepTepi, radiusTitik, diameterPendekDisplay);
                
                // Dot pusat: batasan dikurangi offset spasi pusat agar tidak menyentuh tepi zona pusat
                const offsetPusatDisplay = spasiPusat * faktorSkala;
                const batasPusatKanan = batasTepiKanan + offsetPusatDisplay;
                const batasPusatKiri = batasTepiKiri - offsetPusatDisplay;
                
                let posTengah = [];
                if (batasPusatKanan < batasPusatKiri) {
                    posTengah = hitungPosisiTitik(batasPusatKanan, batasPusatKiri, stepPusat, radiusTitik, diameterPendekDisplay);
                } else {
                    // Jika terlalu sempit, taruh satu dot di tengah
                    const tengahX = (batasTepiKanan + batasTepiKiri) / 2;
                    posTengah = [tengahX];
                }
                
                // Tepi: warna biru, Tengah: warna merah
                for (let cx of posTepiKiri) buatLingkaran(cx, y_dot, radiusTitik, warnaBiru);
                for (let cx of posTepiKanan) buatLingkaran(cx, y_dot, radiusTitik, warnaBiru);
                for (let cx of posTengah) buatLingkaran(cx, y_dot, radiusTitik, warnaMerah);
            }
        }

        // ================== TAMPAK SAMPING ==================
        if (jenis === 'samping') {
            const gapSamping = width_display * 0.02;
            const x_kiri_garis = offsetX + gapSamping;
            const x_kanan_garis = offsetX + width_display - gapSamping;
            const warnaGaris = isBujurSangkar ? warnaHitam : warnaMerah;
            
            const jarakDariBawah_mm = selimutBeton; // untuk samping, posisi garis berdasarkan selimut
            const tinggiTotal_mm = h * 1000;
            const propDariBawah = selimutBeton / tinggiTotal_mm;
            const y_garis = offsetY + height_display * (1 - propDariBawah);
            buatGaris(x_kiri_garis, y_garis, x_kanan_garis, y_garis, warnaGaris, strokePx);
            
            const y_dot = y_garis - radiusTitik; // dot di atas garis
            
            const lebarFondasi_m = lx;
            const faktorSkala = width_display / (lebarFondasi_m * 1000);
            const stepUtama = spasiUtama * faktorSkala;
            const diameterUtamaDisplay = diameterUtama * faktorSkala;
            
            const posTitik = hitungPosisiTitik(x_kiri_garis, x_kanan_garis, stepUtama, radiusTitik, diameterUtamaDisplay);
            for (let cx of posTitik) {
                buatLingkaran(cx, y_dot, radiusTitik, warnaHitam);
            }
        }

        if (needScaleNote) {
            const note = document.createElementNS(svgNS, "text");
            note.setAttribute("x", viewBoxWidth / 2);
            note.setAttribute("y", viewBoxHeight - 5);
            note.setAttribute("text-anchor", "middle");
            note.setAttribute("font-size", "10");
            note.setAttribute("fill", "#666");
            note.setAttribute("font-style", "italic");
            note.textContent = `Skala tidak proporsional (${jenis === 'atas' ? 'rasio Lx:Ly' : 'rasio panjang:tinggi'} > batas)`;
            svg.appendChild(note);
        }

        console.log(`✅ Fondasi tunggal tampak ${jenis} selesai.`);
        return {
            config,
            containerId,
            jenisFondasi: 'tunggal',
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

    window.foundationRenderers.tunggal = renderFondasiTunggal;
    console.log("✅ cut-fondasitunggal.js (tampak atas biru/merah, dot biru/merah, dot pusat dengan batasan spasiPusat)");
    function generateCADFondasiTunggal(jenisTampak) {
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

        // Ambil dimensi fondasi
        if (fondasiData && fondasiData.inputData?.fondasi?.dimensi) {
            const dim = fondasiData.inputData.fondasi.dimensi;
            lx = parseFloat(dim.lx) || lx;
            ly = parseFloat(dim.ly) || ly;
            h = parseFloat(dim.h) || h;
            bx = parseFloat(dim.bx) || bx;
            by = parseFloat(dim.by) || by;
        } else if (fondasiData && fondasiData.data?.parameter) {
            lx = parseFloat(fondasiData.data.parameter.lx) || lx;
            ly = parseFloat(fondasiData.data.parameter.ly) || ly;
            h = parseFloat(fondasiData.data.parameter.h) || h;
        } else if (fondasiData && fondasiData.rekap?.dimensi) {
            const match = fondasiData.rekap.dimensi.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*[×x]\s*([\d.]+)/);
            if (match) {
                lx = parseFloat(match[1]);
                ly = parseFloat(match[2]);
                h = parseFloat(match[3]);
            }
        }

        const isBujurSangkar = Math.abs(lx - ly) < 0.001;
        const selimutBeton = 75; // default, bisa diambil dari storage jika ada

        // Data tulangan
        let spasiUtama = 250, diameterUtama = 22;
        let spasiTepi = 250, spasiPusat = 250, diameterPendek = 16;

        if (isBujurSangkar) {
            spasiUtama = getData('data.tulangan.s', 250);
            if (fondasiData?.rekap?.tulangan_utama) {
                const match = fondasiData.rekap.tulangan_utama.match(/ɸ(\d+)/);
                if (match) diameterUtama = parseInt(match[1], 10);
            }
        } else {
            spasiUtama = getData('data.tulangan.bujur.s', 250);
            if (fondasiData?.rekap?.tulangan_panjang) {
                const match = fondasiData.rekap.tulangan_panjang.match(/ɸ(\d+)/);
                if (match) diameterUtama = parseInt(match[1], 10);
            }
            spasiTepi = getData('data.tulangan.persegi.s_tepi', 250);
            spasiPusat = getData('data.tulangan.persegi.s_pusat', 250);
            if (fondasiData?.rekap?.tulangan_pendek_tepi) {
                const match = fondasiData.rekap.tulangan_pendek_tepi.match(/ɸ(\d+)/);
                if (match) diameterPendek = parseInt(match[1], 10);
            }
        }

        // Dimensi dalam mm
        const Lx_mm = lx * 1000;
        const Ly_mm = ly * 1000;
        const H_mm = h * 1000;

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

        // Tentukan tinggi total untuk flip Y
        let tinggiTotal;
        if (jenisTampak === 'depan') tinggiTotal = H_mm;
        else if (jenisTampak === 'atas') tinggiTotal = Lx_mm;
        else tinggiTotal = H_mm; // samping

        // Frame kotak
        if (jenisTampak === 'depan') {
            cadLines.push(garis(0, 0, Ly_mm, 0));
            cadLines.push(garis(Ly_mm, 0, Ly_mm, H_mm));
            cadLines.push(garis(Ly_mm, H_mm, 0, H_mm));
            cadLines.push(garis(0, H_mm, 0, 0));
        } else if (jenisTampak === 'atas') {
            cadLines.push(garis(0, 0, Ly_mm, 0));
            cadLines.push(garis(Ly_mm, 0, Ly_mm, Lx_mm));
            cadLines.push(garis(Ly_mm, Lx_mm, 0, Lx_mm));
            cadLines.push(garis(0, Lx_mm, 0, 0));
        } else if (jenisTampak === 'samping') {
            cadLines.push(garis(0, 0, Lx_mm, 0));
            cadLines.push(garis(Lx_mm, 0, Lx_mm, H_mm));
            cadLines.push(garis(Lx_mm, H_mm, 0, H_mm));
            cadLines.push(garis(0, H_mm, 0, 0));
        }

        const ukuranSegitiga = 0.035 * Lx_mm; // 3.5% dari Lx

        // ========== TAMPAK ATAS ==========
        if (jenisTampak === 'atas') {
            const y_atas = selimutBeton;
            const y_bawah = Lx_mm - selimutBeton;
            const y_segitiga = Lx_mm * (7/15);

            if (isBujurSangkar) {
                const x_tengah = Ly_mm * (7/15);
                const delta = ukuranSegitiga;
                cadLines.push(polyline([
                    [x_tengah - delta, flipY(y_atas + delta, tinggiTotal)],
                    [x_tengah, flipY(y_atas, tinggiTotal)],
                    [x_tengah, flipY(y_bawah, tinggiTotal)],
                    [x_tengah - delta, flipY(y_bawah - delta, tinggiTotal)]
                ], diameterUtama));
                cadLines.push(buatSegitigaCAD(x_tengah, flipY(y_segitiga, tinggiTotal), 'left', ukuranSegitiga, diameterUtama));
                cadLines.push(buatSegitigaCAD(x_tengah, flipY(y_segitiga, tinggiTotal)+ukuranSegitiga, 'left', ukuranSegitiga, diameterUtama));
            } else {
                // Persegi panjang: tiga garis vertikal (tepi biru, tengah merah)
                const jarakSamping = (Ly_mm - Lx_mm) / 2;
                const x_kiri = jarakSamping;
                const x_kanan = Ly_mm - jarakSamping;
                const x_tengah = Ly_mm * (7/15);
                // Garis kiri (biru)
                cadLines.push(polyline([
                    [x_kiri - ukuranSegitiga, y_atas + ukuranSegitiga],
                    [x_kiri, y_atas],
                    [x_kiri, y_bawah],
                    [x_kiri - ukuranSegitiga, y_bawah - ukuranSegitiga]
                ], diameterPendek));
                // Segitiga kiri
                cadLines.push(buatSegitigaCAD(x_kiri, flipY(y_segitiga, tinggiTotal), 'left', ukuranSegitiga, diameterPendek));
                cadLines.push(buatSegitigaCAD(x_kiri, flipY(y_segitiga, tinggiTotal)+ukuranSegitiga, 'left', ukuranSegitiga, diameterPendek));
                // Garis tengah (merah)
                cadLines.push(polyline([
                    [x_tengah - ukuranSegitiga, y_atas + ukuranSegitiga],
                    [x_tengah, y_atas],
                    [x_tengah, y_bawah],
                    [x_tengah - ukuranSegitiga, y_bawah - ukuranSegitiga]
                ], diameterPendek));
                cadLines.push(buatSegitigaCAD(x_tengah, flipY(y_segitiga, tinggiTotal), 'left', ukuranSegitiga, diameterPendek));
                cadLines.push(buatSegitigaCAD(x_tengah, flipY(y_segitiga, tinggiTotal)+ukuranSegitiga, 'left', ukuranSegitiga, diameterPendek));
                // Garis kanan (biru)
                cadLines.push(polyline([
                    [x_kanan - ukuranSegitiga, y_atas + ukuranSegitiga],
                    [x_kanan, y_atas],
                    [x_kanan, y_bawah],
                    [x_kanan - ukuranSegitiga, y_bawah - ukuranSegitiga]
                ], diameterPendek));
                cadLines.push(buatSegitigaCAD(x_kanan, flipY(y_segitiga, tinggiTotal), 'left', ukuranSegitiga, diameterPendek));
                cadLines.push(buatSegitigaCAD(x_kanan, flipY(y_segitiga, tinggiTotal)+ukuranSegitiga, 'left', ukuranSegitiga, diameterPendek));
            }

            // Garis horizontal (selalu hitam)
            const y_garis_hor = Lx_mm * (8/15);
            const x_kiri_hor = selimutBeton;
            const x_kanan_hor = Ly_mm - selimutBeton;
            const x_segitiga_hor = x_kiri_hor + (8/15) * (x_kanan_hor - x_kiri_hor);
            cadLines.push(polyline([
                [x_kiri_hor + ukuranSegitiga, flipY(y_garis_hor - ukuranSegitiga, tinggiTotal)],
                [x_kiri_hor, flipY(y_garis_hor, tinggiTotal)],
                [x_kanan_hor, flipY(y_garis_hor, tinggiTotal)],
                [x_kanan_hor - ukuranSegitiga, flipY(y_garis_hor - ukuranSegitiga, tinggiTotal)]
            ], diameterUtama));
            cadLines.push(buatSegitigaCAD(x_segitiga_hor, flipY(y_garis_hor, tinggiTotal), 'down', ukuranSegitiga, diameterUtama));
        }

        // ========== TAMPAK DEPAN ==========
        if (jenisTampak === 'depan') {
            const x_kiri = selimutBeton;
            const x_kanan = Ly_mm - selimutBeton;
            const y_garis = (selimutBeton + (isBujurSangkar ? diameterUtama : diameterPendek) + diameterUtama/2);

            // Garis tulangan horizontal
            cadLines.push(polyline([[x_kiri, y_garis], [x_kanan, y_garis]], diameterUtama));

            const y_titik = selimutBeton + (isBujurSangkar ? diameterUtama : diameterPendek)/2;

            if (isBujurSangkar) {
                const step = spasiUtama * (Ly_mm / Ly_mm); // step dalam mm
                const posTitik = hitungPosisiTitikCAD(x_kiri + diameterUtama/2, x_kanan - diameterUtama/2, step, diameterUtama);
                for (let x of posTitik) {
                    cadLines.push(lingkaran(x, y_titik, diameterUtama));
                }
            } else {
                // Persegi panjang: tepi biru, pusat merah
                const lebarFondasi = Ly_mm;
                const panjangFondasi = Lx_mm;
                const jarakTepi = (lebarFondasi - panjangFondasi) / 2;
                const batasTepiKanan = jarakTepi;
                const batasTepiKiri = lebarFondasi - jarakTepi;

                const stepTepi = spasiTepi;
                const stepPusat = spasiPusat;
                const diameter = diameterPendek;

                // Tepi kiri
                const posTepiKiri = hitungPosisiTitikCAD(x_kiri + diameter/2, batasTepiKanan - diameter/2, stepTepi, diameter);
                for (let x of posTepiKiri) {
                    cadLines.push(lingkaran(x, y_titik, diameter));
                }
                // Tepi kanan
                const posTepiKanan = hitungPosisiTitikCAD(batasTepiKiri + diameter/2, x_kanan - diameter/2, stepTepi, diameter);
                for (let x of posTepiKanan) {
                    cadLines.push(lingkaran(x, y_titik, diameter));
                }
                // Pusat
                const offsetPusat = stepPusat;
                const batasPusatKanan = batasTepiKanan + offsetPusat;
                const batasPusatKiri = batasTepiKiri - offsetPusat;
                if (batasPusatKanan < batasPusatKiri) {
                    const posPusat = hitungPosisiTitikCAD(batasPusatKanan + diameter/2, batasPusatKiri - diameter/2, stepPusat, diameter);
                    for (let x of posPusat) {
                        cadLines.push(lingkaran(x, y_titik, diameter));
                    }
                } else {
                    const tengahX = (batasTepiKanan + batasTepiKiri) / 2;
                    cadLines.push(lingkaran(tengahX,y_titik , diameter));
                }
            }
        }

        // ========== TAMPAK SAMPING ==========
        if (jenisTampak === 'samping') {
            const gap = selimutBeton;
            const x_kiri = gap;
            const x_kanan = Lx_mm - gap;
            const y_garis = selimutBeton+(isBujurSangkar ? diameterUtama : diameterPendek)/2;
            if (isBujurSangkar) {
            cadLines.push(polyline([[x_kiri, y_garis], [x_kanan, y_garis]], diameterUtama));
            } else {
            cadLines.push(polyline([[x_kiri, y_garis], [x_kanan, y_garis]], diameterPendek));
            }
            const y_titik = selimutBeton+(isBujurSangkar ? diameterUtama : diameterPendek)+diameterUtama/2; // offset di atas garis
            const step = spasiUtama;
            const posTitik = hitungPosisiTitikCAD(x_kiri + diameterUtama/2, x_kanan - diameterUtama/2, step, diameterUtama);
            for (let x of posTitik) {
                cadLines.push(lingkaran(x, y_titik, diameterUtama));
            }
        }

        return cadLines.join("\n");
    } catch (error) {
        console.error("Gagal generate CAD fondasi tunggal:", error);
        return "ERROR DETECTED: " + error.message + "\n" + error.stack;
    }
}

// Fungsi helper buat segitiga untuk CAD (sama seperti pada pelat)
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
    // Polyline tertutup
    let cmd = `PL ${p1[0]},${p1[1]} W ${tebal} ${tebal} `;
    cmd += `@${p2[0]-p1[0]},${p2[1]-p1[1]} `;
    cmd += `@${p3[0]-p2[0]},${p3[1]-p2[1]} `;
    cmd += `C `;
    return cmd;
}

// Ekspos fungsi ke global
window.generateCADFondasiTunggal = generateCADFondasiTunggal;
window.buatSegitigaCAD = buatSegitigaCAD;

console.log("✅ cut-fondasitunggal.js - fungsi CAD untuk fondasi tunggal (bujur sangkar & persegi panjang) selesai");
})();