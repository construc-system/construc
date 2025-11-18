// cut-generator.js - Versi dengan perbaikan jarak torsi Snv + D

// Konfigurasi global untuk CAD
window.cadConfig = {
    tumpuan: null,
    lapangan: null,
    activeType: 'tumpuan'
};

// Fungsi utama untuk merender penampang balok
window.renderPenampangBalok = function(config, containerId = "svg-container") {
    console.log("🎨 Rendering penampang dengan config:", config);
    console.log("🔍 Snv di cut-generator:", config.Snv);
    console.log("🔍 Jumlah torsi di cut-generator:", config.jumlahTorsi);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Error: Element dengan ID '${containerId}' tidak ditemukan!`);
        return;
    }

    // Hapus konten sebelumnya
    container.innerHTML = "";

    // Gunakan config yang diberikan atau default
    const renderConfig = config || {
        lebar: 300,
        tinggi: 500,
        D: 19,
        begel: 10,
        jumlahAtas: 2,
        jumlahBawah: 3,
        selimut: 30,
        m: 3,
        jumlahTorsi: 0,
        jarakTorsi: 100,
        Snv: 25  // Default Snv
    };

    // Simpan config berdasarkan jenis penampang
    if (containerId.includes('tumpuan')) {
        window.cadConfig.tumpuan = { ...renderConfig, containerId };
    } else if (containerId.includes('lapangan')) {
        window.cadConfig.lapangan = { ...renderConfig, containerId };
    }

    // Ambil nilai dari config - TAMBAH Snv
    const { lebar, tinggi, D, begel, jumlahAtas, jumlahBawah, selimut, m, jumlahTorsi, jarakTorsi, Snv } = renderConfig;
    const r = D / 2;
    const jarakAntarBaris = Math.max(25, D);

    // Pastikan Snv tersedia, jika tidak hitung dari D
    const actualSnv = Snv || Math.max(25, D);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("viewBox", `0 0 ${lebar + 60} ${tinggi + 20}`);
    container.appendChild(svg);

    // Array untuk menyimpan data lingkaran
    const lingkaranData = [];
    const lingkaranTorsiData = [];

    // Beton utama
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", 30);
    rect.setAttribute("y", 10);
    rect.setAttribute("width", lebar);
    rect.setAttribute("height", tinggi);
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#0f172a");
    rect.setAttribute("stroke-width", 2);
    svg.appendChild(rect);

    // Radius sudut begel
    const radiusLuar = D/2 + begel;
    const radiusDalam = D/2;

    // Begel luar
    const rectBegelLuar = document.createElementNS(svgNS, "rect");
    rectBegelLuar.setAttribute("x", 30 + selimut);
    rectBegelLuar.setAttribute("y", 10 + selimut);
    rectBegelLuar.setAttribute("width", lebar - 2 * selimut);
    rectBegelLuar.setAttribute("height", tinggi - 2 * selimut);
    rectBegelLuar.setAttribute("rx", radiusLuar);
    rectBegelLuar.setAttribute("ry", radiusLuar);
    rectBegelLuar.setAttribute("fill", "none");
    rectBegelLuar.setAttribute("stroke", "black");
    rectBegelLuar.setAttribute("stroke-width", 1.5);
    svg.appendChild(rectBegelLuar);

    // Begel dalam
    const rectBegelDalam = document.createElementNS(svgNS, "rect");
    rectBegelDalam.setAttribute("x", 30 + selimut + begel);
    rectBegelDalam.setAttribute("y", 10 + selimut + begel);
    rectBegelDalam.setAttribute("width", lebar - 2 * (selimut + begel));
    rectBegelDalam.setAttribute("height", tinggi - 2 * (selimut + begel));
    rectBegelDalam.setAttribute("rx", radiusDalam);
    rectBegelDalam.setAttribute("ry", radiusDalam);
    rectBegelDalam.setAttribute("fill", "none");
    rectBegelDalam.setAttribute("stroke", "black");
    rectBegelDalam.setAttribute("stroke-width", 1.5);
    svg.appendChild(rectBegelDalam);

    // Fungsi bikin lingkaran tulangan utama
    function buatLingkaran(cx, cy, isTorsi = false) {
        const circle = document.createElementNS(svgNS, "circle");
        const actualCx = 30 + cx;
        const actualCy = 10 + cy;

        circle.setAttribute("cx", actualCx);
        circle.setAttribute("cy", actualCy);
        circle.setAttribute("r", r);
        
        if (isTorsi) {
            // Tulangan torsi: warna merah dengan stroke yang lebih tebal
            circle.setAttribute("fill", "#dc2626");
            circle.setAttribute("stroke", "#991b1b");
            circle.setAttribute("stroke-width", "1.5");
            lingkaranTorsiData.push({ cx, cy, r });
        } else {
            // Tulangan utama: warna hitam
            circle.setAttribute("fill", "#0f172a");
            lingkaranData.push({ cx, cy, r });
        }
        
        svg.appendChild(circle);
    }

    // Fungsi bikin barisan tulangan utama
    function buatBaris(jumlah, cy, isAtas) {
        const barisUtuh = Math.floor(jumlah / m);
        const sisa = jumlah % m;

        for (let b = 0; b < barisUtuh; b++) {
            const spacingY = 2 * r + jarakAntarBaris;
            const cyBaris = cy + (isAtas ? b * spacingY : -b * spacingY);
            const spacingX = (lebar - 2 * (selimut + begel + r)) / (m - 1);
            for (let i = 0; i < m; i++) {
                const cx = selimut + begel + r + i * spacingX;
                buatLingkaran(cx, cyBaris);
            }
        }

        if (sisa > 0) {
            const spacingY = 2 * r + jarakAntarBaris;
            const cySisa = cy + (isAtas ? barisUtuh * spacingY : -barisUtuh * spacingY);
            if (sisa === 1) {
                const cx = selimut + begel + r;
                buatLingkaran(cx, cySisa);
            } else {
                const spacingX = (lebar - 2 * (selimut + begel + r)) / (sisa - 1);
                for (let i = 0; i < sisa; i++) {
                    const cx = selimut + begel + r + i * spacingX;
                    buatLingkaran(cx, cySisa);
                }
            }
        }
    }

    // Render tulangan atas dan bawah
    const cyAtas = selimut + begel + r;
    buatBaris(jumlahAtas, cyAtas, true);

    const cyBawah = tinggi - (selimut + begel + r);
    buatBaris(jumlahBawah, cyBawah, false);

    // Render tulangan torsi jika ada (menggunakan Snv + D)
    if (jumlahTorsi > 0) {
        renderTulanganTorsi(jumlahTorsi, jarakTorsi);
    }

    // FUNGSI RENDER TULANGAN TORSI YANG DIPERBAIKI
    function renderTulanganTorsi(jumlah, jarak) {
        console.log(`🔧 Render tulangan torsi: jumlah=${jumlah}, Snv=${actualSnv}, D=${D}`);
        
        // Posisi tengah vertikal
        const yMid = tinggi / 2;

        // Posisi X - menempel di dalam begel
        const xKiri = selimut + begel + r;
        const xKanan = lebar - selimut - begel - r;

        // Hitung berapa di kanan dan kiri (mengikuti logika VBA)
        const nKanan = Math.ceil(jumlah / 2);   // ceiling
        const nKiri = Math.floor(jumlah / 2);   // floor

        // JARAK YANG BENAR: Gunakan Snv + D untuk jarak pusat ke pusat
        const jarakPusatKePusat = actualSnv + D;

        console.log(`🔧 Jarak pusat ke pusat: ${jarakPusatKePusat} = ${actualSnv} + ${D}`);
        console.log(`🔧 Distribusi: Kanan=${nKanan} batang, Kiri=${nKiri} batang`);

        // Tempatkan batang di sisi kanan (nKanan batang)
        for (let i = 1; i <= nKanan; i++) {
            const offsetY = (i - (nKanan + 1) / 2) * jarakPusatKePusat;
            const cy = yMid + offsetY;

            console.log(`🔧 Torsi kanan ${i}: offsetY=${offsetY.toFixed(1)}, cy=${cy.toFixed(1)}`);
            buatLingkaran(xKanan, cy, true);
        }

        // Tempatkan batang di sisi kiri (nKiri batang)
        for (let i = 1; i <= nKiri; i++) {
            const offsetY = (i - (nKiri + 1) / 2) * jarakPusatKePusat;
            const cy = yMid + offsetY;

            console.log(`🔧 Torsi kiri ${i}: offsetY=${offsetY.toFixed(1)}, cy=${cy.toFixed(1)}`);
            buatLingkaran(xKiri, cy, true);
        }
    }

    // Tambahkan legenda jika ada tulangan torsi
    if (jumlahTorsi > 0) {
        tambahkanLegendaTorsi();
    }

    function tambahkanLegendaTorsi() {
        const legendGroup = document.createElementNS(svgNS, "g");
        
        // Kotak legenda
        const legendRect = document.createElementNS(svgNS, "rect");
        legendRect.setAttribute("x", 30 + lebar + 5);
        legendRect.setAttribute("y", 10);
        legendRect.setAttribute("width", 120);
        legendRect.setAttribute("height", 60);
        legendRect.setAttribute("fill", "white");
        legendRect.setAttribute("stroke", "#666");
        legendRect.setAttribute("stroke-width", "1");
        legendGroup.appendChild(legendRect);
        
        // Judul legenda
        const legendTitle = document.createElementNS(svgNS, "text");
        legendTitle.setAttribute("x", 30 + lebar + 15);
        legendTitle.setAttribute("y", 25);
        legendTitle.setAttribute("font-size", "10");
        legendTitle.setAttribute("font-weight", "bold");
        legendTitle.textContent = "Legenda Tulangan";
        legendGroup.appendChild(legendTitle);
        
        // Contoh tulangan utama
        const mainExample = document.createElementNS(svgNS, "circle");
        mainExample.setAttribute("cx", 30 + lebar + 20);
        mainExample.setAttribute("cy", 40);
        mainExample.setAttribute("r", 4);
        mainExample.setAttribute("fill", "#0f172a");
        legendGroup.appendChild(mainExample);
        
        const mainText = document.createElementNS(svgNS, "text");
        mainText.setAttribute("x", 30 + lebar + 30);
        mainText.setAttribute("y", 43);
        mainText.setAttribute("font-size", "9");
        mainText.textContent = "Tulangan Utama";
        legendGroup.appendChild(mainText);
        
        // Contoh tulangan torsi
        const torsiExample = document.createElementNS(svgNS, "circle");
        torsiExample.setAttribute("cx", 30 + lebar + 20);
        torsiExample.setAttribute("cy", 55);
        torsiExample.setAttribute("r", 4);
        torsiExample.setAttribute("fill", "#dc2626");
        torsiExample.setAttribute("stroke", "#991b1b");
        torsiExample.setAttribute("stroke-width", "1");
        legendGroup.appendChild(torsiExample);
        
        const torsiText = document.createElementNS(svgNS, "text");
        torsiText.setAttribute("x", 30 + lebar + 30);
        torsiText.setAttribute("y", 58);
        torsiText.setAttribute("font-size", "9");
        torsiText.textContent = "Tulangan Torsi";
        legendGroup.appendChild(torsiText);
        
        svg.appendChild(legendGroup);
    }

    // Simpan data lingkaran untuk jenis penampang ini
    if (containerId.includes('tumpuan')) {
        window.cadConfig.tumpuan.lingkaranData = lingkaranData;
        window.cadConfig.tumpuan.lingkaranTorsiData = lingkaranTorsiData;
    } else if (containerId.includes('lapangan')) {
        window.cadConfig.lapangan.lingkaranData = lingkaranData;
        window.cadConfig.lapangan.lingkaranTorsiData = lingkaranTorsiData;
    }

    // Set default untuk CAD
    if (containerId.includes('tumpuan') || !window.cadConfig.activeType) {
        window.config = renderConfig;
        window.lingkaranData = lingkaranData;
        window.lingkaranTorsiData = lingkaranTorsiData;
        window.cadConfig.activeType = 'tumpuan';
    }

    console.log(`✅ Penampang ${containerId} berhasil di-render. Total tulangan: ${lingkaranData.length}, Tulangan torsi: ${lingkaranTorsiData.length}`);

    return {
        config: renderConfig,
        lingkaranData: lingkaranData,
        lingkaranTorsiData: lingkaranTorsiData,
        containerId: containerId
    };
};

// Fungsi untuk beralih antara CAD tumpuan dan lapangan
window.switchCADType = function(type) {
    if (type === 'tumpuan' && window.cadConfig.tumpuan) {
        window.config = window.cadConfig.tumpuan;
        window.lingkaranData = window.cadConfig.tumpuan.lingkaranData || [];
        window.lingkaranTorsiData = window.cadConfig.tumpuan.lingkaranTorsiData || [];
        window.cadConfig.activeType = 'tumpuan';
        console.log("🔁 CAD switched to: TUMPUAN");
        return true;
    } else if (type === 'lapangan' && window.cadConfig.lapangan) {
        window.config = window.cadConfig.lapangan;
        window.lingkaranData = window.cadConfig.lapangan.lingkaranData || [];
        window.lingkaranTorsiData = window.cadConfig.lapangan.lingkaranTorsiData || [];
        window.cadConfig.activeType = 'lapangan';
        console.log("🔁 CAD switched to: LAPANGAN");
        return true;
    }
    return false;
};

// Fungsi generate CAD (tetap sama)
window.generateCADText = function() {
    try {
        // Gunakan config aktif
        const config = window.config;
        if (!config) {
            throw new Error("Config tidak ditemukan!");
        }
        
        const { lebar, tinggi, D, begel, selimut, jumlahTorsi } = config;
        const r = D / 2;

        const lingkaranList = window.lingkaranData || [];
        const lingkaranTorsiList = window.lingkaranTorsiData || [];

        // Gabungkan semua tulangan
        const semuaLingkaran = [...lingkaranList, ...lingkaranTorsiList];

        // Gunakan radius yang sama dengan render
        const radiusLuar = D/2 + begel;
        const radiusDalam = D/2;

        const cadVars = {
            lebarRect: lebar,
            tinggiRect: tinggi,
            x1: selimut + begel + r,
            x2: selimut,
            x3: lebar - selimut - begel - r,
            x4: lebar - selimut,
            x5: selimut + begel,
            x6: lebar - selimut - begel,
            x7: selimut + begel + r + (begel + r) * Math.cos(45 * Math.PI / 180),
            x8: selimut + begel + r + r * Math.cos(45 * Math.PI / 180),
            get x9() { return this.x8 + (50 * Math.cos(315 * Math.PI / 180)); },
            get x10() { return this.x9 + (begel * Math.cos(45 * Math.PI / 180)); },
            x11: selimut + begel + r + (r * Math.cos(225 * Math.PI / 180)),
            get x12() { return this.x11 + (50 * Math.cos(315 * Math.PI / 180)); },
            get x13() { return this.x12 + (begel * Math.cos(225 * Math.PI / 180)); },
            get x14() {
                const theta = 135 * Math.PI / 180;
                const yTarget = tinggi - (selimut + begel);
                const denom = Math.tan(theta);
                if (denom === 0) return this.x10;
                return this.x10 + (yTarget - this.y7) / denom;
            },
            y1: tinggi - selimut - begel - r,
            y2: tinggi - selimut,
            y3: tinggi - selimut - begel,
            y4: tinggi - selimut - begel - r + (begel + r) * Math.sin(45 * Math.PI / 180),
            y5: tinggi - selimut - begel - r + r * Math.sin(45 * Math.PI / 180),
            get y6() { return this.y5 + (50 * Math.sin(315 * Math.PI / 180)); },
            get y7() { return this.y6 + (begel * Math.sin(45 * Math.PI / 180)); },
            y8: tinggi - selimut - begel - r + (r * Math.sin(225 * Math.PI / 180)),
            get y9() { return this.y8 + (50 * Math.sin(315 * Math.PI / 180)); },
            get y10() { return this.y9 + (begel * Math.sin(225 * Math.PI / 180)); },
            get y11() {
                const denom = Math.cos(135 * Math.PI / 180);
                if (denom === 0) return this.y10;
                const distX = (selimut + begel) - this.x13;
                return this.y10 + (distX / denom) * Math.sin(135 * Math.PI / 180);
            },
            rLingkaran: r,
            radiusLuar: radiusLuar,
            radiusDalam: radiusDalam
        };

        const cadLines = [
            `RECTANGLE 0,0 ${cadVars.lebarRect},${cadVars.tinggiRect}`,
            `ARC C ${cadVars.x1},${cadVars.y1} ${cadVars.x7},${cadVars.y4} ${cadVars.x2},${cadVars.y1}`,
            `ARC C ${cadVars.x3},${cadVars.y1} ${cadVars.x4},${cadVars.y1} ${cadVars.x3},${cadVars.y2}`,
            `ARC C ${cadVars.x3},${cadVars.x1} ${cadVars.x3},${cadVars.x2} ${cadVars.x4},${cadVars.x1}`,
            `ARC C ${cadVars.x1},${cadVars.x1} ${cadVars.x2},${cadVars.x1} ${cadVars.x1},${cadVars.x2}`,

            `PL ${cadVars.x2},${cadVars.x1} ${cadVars.x2},${cadVars.y1} C`,
            "ENTER",
            `PL ${cadVars.x1},${cadVars.y2} ${cadVars.x3},${cadVars.y2} C`,
            "ENTER",
            `PL ${cadVars.x4},${cadVars.y1} ${cadVars.x4},${cadVars.x1} C`,
            "ENTER",
            `PL ${cadVars.x3},${cadVars.x2} ${cadVars.x1},${cadVars.x2} C`,
            "ENTER",

            `PL ${cadVars.x5},${cadVars.x1} ${cadVars.x5},${cadVars.y1} C`,
            "ENTER",
            `PL ${cadVars.x14},${cadVars.y3} ${cadVars.x3},${cadVars.y3} C`,
            "ENTER",
            `PL ${cadVars.x6},${cadVars.y1} ${cadVars.x6},${cadVars.x1} C`,
            "ENTER",
            `PL ${cadVars.x3},${cadVars.x5} ${cadVars.x1},${cadVars.x5} C`,
            "ENTER",

            `PL ${cadVars.x8},${cadVars.y5} ${cadVars.x9},${cadVars.y6} C`,
            "ENTER",
            `PL ${cadVars.x9},${cadVars.y6} ${cadVars.x10},${cadVars.y7} C`,
            "ENTER",
            `PL ${cadVars.x10},${cadVars.y7} ${cadVars.x7},${cadVars.y4} C`,
            "ENTER",
            `PL ${cadVars.x11},${cadVars.y8} ${cadVars.x12},${cadVars.y9} C`,
            "ENTER",
            `PL ${cadVars.x12},${cadVars.y9} ${cadVars.x13},${cadVars.y10} C`,
            "ENTER",
            `PL ${cadVars.x13},${cadVars.y10} ${cadVars.x5},${cadVars.y11} C`,
            "ENTER",
        ];

        // Tambahkan semua lingkaran (utama dan torsi)
        semuaLingkaran.forEach(c => {
            const cyCAD = tinggi - c.cy;
            cadLines.push(`CIRCLE ${c.cx},${cyCAD} ${c.r} `);
        });

        // Tambahkan header dengan informasi jenis penampang
        const header = [
            `; ==============================================`,
            `; CAD TEXT FOR PENAMPANG ${window.cadConfig.activeType.toUpperCase()}`,
            `; Generated by ConcreteCalc`,
            `; Date: ${new Date().toLocaleDateString()}`,
            `; Dimensi: ${lebar} x ${tinggi} mm`,
            `; Tulangan: ${config.jumlahBawah || 'N/A'}D${D} bawah, ${config.jumlahAtas || 'N/A'}D${D} atas`,
            `; Tulangan Torsi: ${jumlahTorsi || 0}D${D}`,
            `; Radius Begel: ${radiusLuar.toFixed(1)}mm (luar), ${radiusDalam.toFixed(1)}mm (dalam)`,
            `; ==============================================`,
            ``
        ];

        return header.join('\n') + cadLines.join('\n');
    } catch (error) {
        console.error("Error in generateCADText:", error);
        return "Error generating CAD text: " + error.message;
    }
};

// Fungsi untuk mendapatkan informasi penampang aktif
window.getActiveCADInfo = function() {
    const activeType = window.cadConfig.activeType || 'tumpuan';
    const config = window.config || {};
    
    return {
        type: activeType,
        lebar: config.lebar || 0,
        tinggi: config.tinggi || 0,
        D: config.D || 0,
        jumlahAtas: config.jumlahAtas || 0,
        jumlahBawah: config.jumlahBawah || 0,
        jumlahTorsi: config.jumlahTorsi || 0
    };
};

console.log("✅ cut-generator.js loaded (VERSION FINAL - dengan Snv + D untuk torsi)");