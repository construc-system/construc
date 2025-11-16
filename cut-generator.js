// cut-generator.js - Versi terintegrasi dengan hasil perhitungan

// Fungsi utama untuk merender penampang balok
window.renderPenampangBalok = function(config) {
    console.log("🎨 Rendering penampang dengan config:", config);
    
    const container = document.getElementById("svg-container");
    if (!container) {
        console.error("Error: Element dengan ID 'svg-container' tidak ditemukan!");
        return;
    }

    // Hapus konten sebelumnya
    container.innerHTML = "";

    // Gunakan config yang diberikan atau default
    window.config = config || {
        lebar: 300,
        tinggi: 500,
        D: 19,
        begel: 10,
        jumlahAtas: 2,
        jumlahBawah: 3,
        selimut: 30,
        m: 3
    };

    // Ambil nilai dari config
    const { lebar, tinggi, D, begel, jumlahAtas, jumlahBawah, selimut, m } = window.config;
    const r = D / 2;
    const jarakAntarBaris = Math.max(25, D);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("viewBox", `0 0 ${lebar + 60} ${tinggi + 40}`);
    container.appendChild(svg);

    // Array untuk menyimpan data lingkaran
    const lingkaranData = [];

    // Beton utama
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", 30);
    rect.setAttribute("y", 20);
    rect.setAttribute("width", lebar);
    rect.setAttribute("height", tinggi);
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#0f172a");
    rect.setAttribute("stroke-width", 2);
    svg.appendChild(rect);

    // Begel luar (offset selimut)
    const rectBegelLuar = document.createElementNS(svgNS, "rect");
    rectBegelLuar.setAttribute("x", 30 + selimut);
    rectBegelLuar.setAttribute("y", 20 + selimut);
    rectBegelLuar.setAttribute("width", lebar - 2 * selimut);
    rectBegelLuar.setAttribute("height", tinggi - 2 * selimut);
    rectBegelLuar.setAttribute("rx", 2 * begel);
    rectBegelLuar.setAttribute("ry", 2 * begel);
    rectBegelLuar.setAttribute("fill", "none");
    rectBegelLuar.setAttribute("stroke", "black");
    rectBegelLuar.setAttribute("stroke-width", 1.5);
    svg.appendChild(rectBegelLuar);

    // Begel dalam (offset begel)
    const rectBegelDalam = document.createElementNS(svgNS, "rect");
    rectBegelDalam.setAttribute("x", 30 + selimut + begel);
    rectBegelDalam.setAttribute("y", 20 + selimut + begel);
    rectBegelDalam.setAttribute("width", lebar - 2 * (selimut + begel));
    rectBegelDalam.setAttribute("height", tinggi - 2 * (selimut + begel));
    rectBegelDalam.setAttribute("rx", begel);
    rectBegelDalam.setAttribute("ry", begel);
    rectBegelDalam.setAttribute("fill", "none");
    rectBegelDalam.setAttribute("stroke", "black");
    rectBegelDalam.setAttribute("stroke-width", 1.5);
    svg.appendChild(rectBegelDalam);

    // Fungsi bikin lingkaran
    function buatLingkaran(cx, cy) {
        const circle = document.createElementNS(svgNS, "circle");
        const actualCx = 30 + cx;
        const actualCy = 20 + cy;

        circle.setAttribute("cx", actualCx);
        circle.setAttribute("cy", actualCy);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", "#0f172a");
        svg.appendChild(circle);

        lingkaranData.push({ cx: cx, cy: cy, r: r });
    }

    // Fungsi bikin barisan tulangan
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

    // Simpan data untuk CAD
    window.lingkaranData = lingkaranData;

    console.log("✅ Penampang berhasil di-render. Total tulangan:", lingkaranData.length);
    
    // Tambahkan informasi dimensi
    const infoText = document.createElementNS(svgNS, "text");
    infoText.setAttribute("x", 30 + lebar / 2);
    infoText.setAttribute("y", 20 + tinggi + 25);
    infoText.setAttribute("text-anchor", "middle");
    infoText.setAttribute("font-family", "Arial, sans-serif");
    infoText.setAttribute("font-size", "12");
    infoText.setAttribute("fill", "#666");
    infoText.textContent = `${lebar} × ${tinggi} mm`;
    svg.appendChild(infoText);
};

// Fungsi generate CAD
window.generateCADText = function() {
    try {
        const config = window.config;
        if (!config) {
            throw new Error("Config tidak ditemukan!");
        }
        const { lebar, tinggi, D, begel, selimut } = config;
        const r = D / 2;

        const lingkaranList = window.lingkaranData || [];

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
            rLingkaran: r
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

        lingkaranList.forEach(c => {
            const cyCAD = tinggi - c.cy;
            cadLines.push(`CIRCLE ${c.cx},${cyCAD} ${c.r} `);
        });

        return cadLines.join("\n");
    } catch (error) {
        console.error("Error in generateCADText:", error);
        return "Error generating CAD text: " + error.message;
    }
};

console.log("✅ cut-generator.js loaded (integrated version)");