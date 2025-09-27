document.addEventListener("DOMContentLoaded", function() {
  // SATU SUMBER KEBENARAN: Objek config global untuk semua variabel
  // Edit di sini saja, semuanya akan update otomatis di SVG dan CAD
  window.config = {
    lebar: 250,             // mm
    tinggi: 500,            // mm
    D: 19,                  // diameter tulangan (mm)
    begel: 12,               // diameter begel (mm)
    jumlahAtas: 2,          // jumlah tulangan atas
    jumlahBawah: 5,         // jumlah tulangan bawah
    selimut: 30,            // selimut beton (mm)
    m: 3                    // jumlah maksimal tulangan per baris
  };

  // Ambil nilai dari config
  const { lebar, tinggi, D, begel, jumlahAtas, jumlahBawah, selimut, m } = window.config;
  const r = D / 2;          // radius tulangan (tidak perlu di config, dihitung dari D)
  const jarakAntarBaris = Math.max(25, D); // jarak antar baris (dihitung)

  const container = document.getElementById("svg-container");
  if (!container) {
    console.error("Error: Element dengan ID 'svg-container' tidak ditemukan!");
    return;
  }

  container.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  container.appendChild(svg);

  // Array untuk menyimpan data lingkaran
  const lingkaranData = [];

  // beton utama
  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", 30);
  rect.setAttribute("y", 20);
  rect.setAttribute("width", lebar);
  rect.setAttribute("height", tinggi);
  rect.setAttribute("fill", "#ffffffff");
  rect.setAttribute("stroke", "#0f172a");
  rect.setAttribute("stroke-width", 2);
  svg.appendChild(rect);

  // begel luar (offset selimut)
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

  // begel dalam (offset begel)
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

  // fungsi bikin lingkaran
  function buatLingkaran(cx, cy) {
    const circle = document.createElementNS(svgNS, "circle");
    const actualCx = 30 + cx; // Koordinat aktual di SVG
    const actualCy = 20 + cy; // Koordinat aktual di SVG

    circle.setAttribute("cx", actualCx);
    circle.setAttribute("cy", actualCy);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", "#0f172a");
    svg.appendChild(circle);

    // Simpan data lingkaran ke array global (koordinat relatif terhadap 0,0 dari beton utama)
    lingkaranData.push({ cx: cx, cy: cy, r: r });
  }

  // fungsi bikin barisan tulangan (dengan fix untuk sisa=1 di kiri)
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
        // Fix: tempatkan tulangan tunggal di kiri
        const cx = selimut + begel + r; // Posisi paling kiri
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

  const cyAtas = selimut + begel + r;
  buatBaris(jumlahAtas, cyAtas, true);

  const cyBawah = tinggi - (selimut + begel + r);
  buatBaris(jumlahBawah, cyBawah, false);

  const bbox = svg.getBBox();
  const padding = 10;
  svg.setAttribute(
    "viewBox",
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + 2 * padding} ${bbox.height + 2 * padding}`
  );

  // Ekspos data untuk akses eksternal
  window.lingkaranData = lingkaranData; // Lebih sederhana, langsung assign ke window

  console.log("Script loaded successfully! Total lingkaran:", lingkaranData.length);
  console.log("Config loaded:", window.config); // Log config untuk verifikasi
});

// Fungsi generate CAD (menggunakan window.config untuk konsistensi, tanpa duplikasi variabel)
document.addEventListener("DOMContentLoaded", function() {
  window.generateCADText = function() {
    try {
      // Ambil SEMUA dari config global (tidak ada duplikasi!)
      const config = window.config;
      if (!config) {
        throw new Error("Config tidak ditemukan! Pastikan script utama sudah dijalankan.");
      }
      const { lebar, tinggi, D, begel, selimut } = config;
      const r = D / 2; // Dihitung dari config.D

      // Ambil data lingkaran dari window (aman setelah DOM loaded)
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
          const theta = 135 * Math.PI / 180; // radian
          const yTarget = tinggi - (selimut + begel);
          const denom = Math.tan(theta);
          if (denom === 0) return this.x10; // Hindari division by zero
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
          if (denom === 0) return this.y10; // Hindari division by zero
          const distX = (selimut + begel) - this.x13;
          return this.y10 + (distX / denom) * Math.sin(135 * Math.PI / 180);
        },
        rLingkaran: r
      };

      // Ganti hardcoded 77.57 dengan perhitungan dinamis (asumsi posisi begel kiri + offset)
      const posisiBegelKiri = cadVars.x5 + 10; // Contoh: sesuaikan jika perlu

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
        `PL ${cadVars.x14},${cadVars.y3} ${cadVars.x3},${cadVars.y3} C`, // Ganti hardcoded
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

      // otomatis CIRCLE dari lingkaran SVG (dengan invert y untuk CAD dan spasi di akhir)
      lingkaranList.forEach(c => {
        // Invert y agar posisi atas/bawah tidak terbalik di CAD (y_CAD = tinggi - y_SVG)
        const cyCAD = tinggi - c.cy;
        // Koordinat x tetap sama
        cadLines.push(`CIRCLE ${c.cx},${cyCAD} ${c.r} `);  // Tambah spasi di akhir
      });

      return cadLines.join("\n");
    } catch (error) {
      console.error("Error in generateCADText:", error);
      return "Error generating CAD text: " + error.message;
    }
  };

  console.log("generateCADText function ready! Call it with window.generateCADText()");
});