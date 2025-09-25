document.addEventListener("DOMContentLoaded", function() {
  // deklarasi variabel utama
  const lebar = 250;        // mm
  const tinggi = 500;       // mm
  const D = 16;             // diameter tulangan (mm)
  const begel = 8;          // diameter begel (mm)
  const jumlahAtas = 2;     // jumlah tulangan atas
  const jumlahBawah = 5;    // jumlah tulangan bawah
  const selimut = 40;       // selimut beton (mm)
  const m = 3;              // jumlah maksimal tulangan per baris

  const r = D / 2;          // radius tulangan
  const jarakAntarBaris = Math.max(25, D); // jarak antar baris

  const container = document.getElementById("svg-container");
  const svgNS = "http://www.w3.org/2000/svg";

  container.innerHTML = "";

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  container.appendChild(svg);

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
  rectBegelLuar.setAttribute("rx", 2*begel); // sudut melengkung
  rectBegelLuar.setAttribute("ry", 2*begel);
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
  rectBegelDalam.setAttribute("rx", begel); // sudut melengkung
  rectBegelDalam.setAttribute("ry", begel);
  rectBegelDalam.setAttribute("fill", "none");
  rectBegelDalam.setAttribute("stroke", "black");
  rectBegelDalam.setAttribute("stroke-width", 1.5);
  svg.appendChild(rectBegelDalam);

  // fungsi bikin lingkaran
  function buatLingkaran(cx, cy) {
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", 30 + cx); // offset 30 biar sesuai rect.x
    circle.setAttribute("cy", 20 + cy); // offset 20 biar sesuai rect.y
    circle.setAttribute("r", r);
    circle.setAttribute("fill", "#0f172a");
    svg.appendChild(circle);
  }

  // fungsi bikin barisan tulangan
  function buatBaris(jumlah, cy, isAtas) {
    const barisUtuh = Math.floor(jumlah / m);
    const sisa = jumlah % m;

    // bikin baris penuh
    for (let b = 0; b < barisUtuh; b++) {
      const cyBaris = cy + (isAtas ? b * (2*r + jarakAntarBaris) : -b * (2*r + jarakAntarBaris)); 
      const spacing = (lebar - 2 * (selimut + begel + r)) / (m - 1);
      for (let i = 0; i < m; i++) {
        const cx = selimut + begel + r + i * spacing;
        buatLingkaran(cx, cyBaris);
      }
    }

    // bikin baris sisa
    if (sisa > 0) {
      const cySisa = cy + (isAtas ? barisUtuh * (2*r + jarakAntarBaris) : -barisUtuh * (2*r + jarakAntarBaris));
      if (sisa === 1) {
        // rata kiri
        const cx = selimut + begel + r;
        buatLingkaran(cx, cySisa);
      } else {
        const spacing = (lebar - 2 * (selimut + begel + r)) / (sisa - 1);
        for (let i = 0; i < sisa; i++) {
          const cx = selimut + begel + r + i * spacing;
          buatLingkaran(cx, cySisa);
        }
      }
    }
  }

  // group A (atas)
  const cyAtas = selimut + begel + r;
  buatBaris(jumlahAtas, cyAtas, true);

  // group B (bawah)
  const cyBawah = tinggi - (selimut + begel + r);
  buatBaris(jumlahBawah, cyBawah, false);

  const bbox = svg.getBBox();
  const padding = 10;
  svg.setAttribute(
    "viewBox",
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + 2*padding} ${bbox.height + 2*padding}`
  );
});
