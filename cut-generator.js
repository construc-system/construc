// cut-generator.js - Final untuk Kolom (dengan perbaikan path pencarian dimensi dan nX/nY)

// ==================== FUNGSI UMUM ====================
function applyNonScalingStroke(element) {
    if (element && element.setAttribute) {
        element.setAttribute("vector-effect", "non-scaling-stroke");
    }
    return element;
}

function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => alert(`${label} berhasil disalin ke clipboard!`))
        .catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert(`${label} berhasil disalin ke clipboard!`);
        });
}

function getPelatDataFromStorage() {
    try {
        const saved = sessionStorage.getItem('calculationResultPelat');
        if (!saved) return null;
        return JSON.parse(saved);
    } catch (e) {
        console.warn('Gagal membaca data pelat:', e);
        return null;
    }
}

function getJenisPelatLengkap() {
    const data = getPelatDataFromStorage();
    if (!data) return "dua_arah";
    let tumpuanHuruf = null;
    let jenisPelatFromCalc = null;
    let lx, ly;
    if (data.rekap && data.rekap.tabel) {
        tumpuanHuruf = data.rekap.tabel.tumpuanHuruf;
        jenisPelatFromCalc = data.rekap.tabel.jenisPelat;
    }
    if (data.rekap && data.rekap.input && data.rekap.input.dimensi) {
        lx = data.rekap.input.dimensi.lx;
        ly = data.rekap.input.dimensi.ly;
    }
    if (data.rekap && data.rekap.formatted && data.rekap.formatted.tumpuan_manual) {
        const tumpuanManual = data.rekap.formatted.tumpuan_manual;
        if (tumpuanManual === "Kantilever") return "kantilever";
        if (tumpuanManual === "Satu Arah") return "satu_arah";
        if (tumpuanManual === "Dua Arah") return "dua_arah";
    }
    if (tumpuanHuruf === "F" || tumpuanHuruf === "G") return "kantilever";
    if (tumpuanHuruf === "D" || tumpuanHuruf === "E") return "satu_arah";
    if (lx && ly && ly >= 2 * lx) return "satu_arah";
    if (jenisPelatFromCalc === "satu_arah") return "satu_arah";
    return "dua_arah";
}

function getSubJenisSatuArah() {
    const data = getPelatDataFromStorage();
    if (!data) return "pendek";
    let tumpuanHuruf = null;
    let lx, ly;
    if (data.rekap && data.rekap.tabel) {
        tumpuanHuruf = data.rekap.tabel.tumpuanHuruf;
    }
    if (data.rekap && data.rekap.input && data.rekap.input.dimensi) {
        lx = data.rekap.input.dimensi.lx;
        ly = data.rekap.input.dimensi.ly;
    }
    if (tumpuanHuruf === "E") return "panjang";
    if (tumpuanHuruf === "D") return "pendek";
    if (ly >= 2 * lx) return "pendek";
    return "pendek";
}

function hitungPosisiTitikKiriKanan(startX, endX, stepDisplay, diameterDisplay, offsetUjung, aturanUjungKhusus) {
    const leftMost = startX + offsetUjung;
    const rightMost = endX - offsetUjung;
    if (leftMost >= rightMost) return [];
    let positions = [];
    let current = leftMost;
    while (current <= rightMost) {
        positions.push(current);
        current += stepDisplay;
    }
    if (aturanUjungKhusus) {
        positions.push(rightMost);
        if (positions.length >= 2) {
            const secondLast = positions[positions.length - 2];
            const last = positions[positions.length - 1];
            if (last - secondLast < 4 * diameterDisplay) {
                positions[positions.length - 2] = last;
                positions.pop();
            }
        }
    }
    return positions;
}

function hitungPosisiTitikKananKiri(startX, endX, stepDisplay, diameterDisplay, offsetUjung, aturanUjungKhusus) {
    const leftMost = startX + offsetUjung;
    const rightMost = endX - offsetUjung;
    if (leftMost >= rightMost) return [];
    let positions = [];
    let current = rightMost;
    while (current >= leftMost) {
        positions.push(current);
        current -= stepDisplay;
    }
    if (aturanUjungKhusus) {
        positions.push(leftMost);
        if (positions.length >= 2) {
            const secondLast = positions[positions.length - 2];
            const last = positions[positions.length - 1];
            if (last - secondLast < 4 * diameterDisplay) {
                positions[positions.length - 2] = last;
                positions.pop();
            }
        }
    }
    return positions;
}

function buatSegitiga(svg, orientasi, jumlah, posisiX, posisiY, lebar, tinggi, warna) {
    if (jumlah === 1) {
        let points = '';
        switch (orientasi) {
            case 'left':
                points = `${posisiX - lebar},${posisiY} ${posisiX},${posisiY - tinggi/2} ${posisiX},${posisiY + tinggi/2}`;
                break;
            case 'right':
                points = `${posisiX + lebar},${posisiY} ${posisiX},${posisiY - tinggi/2} ${posisiX},${posisiY + tinggi/2}`;
                break;
            case 'up':
                points = `${posisiX},${posisiY - tinggi} ${posisiX - lebar/2},${posisiY} ${posisiX + lebar/2},${posisiY}`;
                break;
            case 'down':
                points = `${posisiX},${posisiY + tinggi} ${posisiX - lebar/2},${posisiY} ${posisiX + lebar/2},${posisiY}`;
                break;
        }
        const polygon = document.createElementNS(svg.namespaceURI, "polygon");
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
                const polygon = document.createElementNS(svg.namespaceURI, "polygon");
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
                const polygon = document.createElementNS(svg.namespaceURI, "polygon");
                polygon.setAttribute("points", points);
                polygon.setAttribute("fill", warna);
                polygon.setAttribute("stroke", "none");
                svg.appendChild(polygon);
            }
        }
    }
}

function buatSegitigaVertikalTunggal(svg, orientasi, posisiX, posisiY, lebar, tinggi, warna) {
    let points = '';
    if (orientasi === 'left') {
        points = `${posisiX - lebar},${posisiY} ${posisiX},${posisiY - tinggi/2} ${posisiX},${posisiY + tinggi/2}`;
    } else if (orientasi === 'right') {
        points = `${posisiX + lebar},${posisiY} ${posisiX},${posisiY - tinggi/2} ${posisiX},${posisiY + tinggi/2}`;
    }
    const polygon = document.createElementNS(svg.namespaceURI, "polygon");
    polygon.setAttribute("points", points);
    polygon.setAttribute("fill", warna);
    polygon.setAttribute("stroke", "none");
    svg.appendChild(polygon);
}

function buatLingkaran(svg, cx, cy, radius, warna) {
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", radius);
    circle.setAttribute("fill", warna);
    circle.setAttribute("stroke", "none");
    svg.appendChild(circle);
}

// ==================== RENDER PENAMPANG BALOK ====================
window.renderPenampangBalok = function(config, containerId = "svg-container") {
    console.log("🎨 Rendering penampang balok dengan config:", config);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Error: Element dengan ID '${containerId}' tidak ditemukan!`);
        return;
    }
    container.innerHTML = "";
    const requiredParams = ['lebar', 'tinggi', 'D', 'begel', 'jumlahAtas', 'jumlahBawah', 'selimut', 'm'];
    for (const param of requiredParams) {
        if (config[param] === undefined || config[param] === null) {
            console.error(`❌ Parameter ${param} tidak ditemukan dalam config`);
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data penampang balok tidak lengkap</p><p style="font-size: 0.9rem;">Parameter '${param}' diperlukan tetapi tidak tersedia</p></div>`;
            return;
        }
    }
    const renderConfig = config;
    if (containerId.includes('tumpuan')) window.cadConfig.tumpuan = { ...renderConfig, containerId };
    else if (containerId.includes('lapangan')) window.cadConfig.lapangan = { ...renderConfig, containerId };
    const { lebar, tinggi, D, begel, jumlahAtas, jumlahBawah, selimut, m, jumlahTorsi, jarakTorsi, Snv } = renderConfig;
    const r = D / 2;
    const jarakAntarBaris = Math.max(25, D);
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("viewBox", `0 0 ${lebar + 60} ${tinggi + 20}`);
    container.appendChild(svg);
    const lingkaranData = [];
    const lingkaranTorsiData = [];
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", 30);
    rect.setAttribute("y", 10);
    rect.setAttribute("width", lebar);
    rect.setAttribute("height", tinggi);
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#000000");
    rect.setAttribute("stroke-width", 4);
    applyNonScalingStroke(rect);
    svg.appendChild(rect);
    const radiusLuar = D/2 + begel;
    const radiusDalam = D/2;
    const rectBegelLuar = document.createElementNS(svgNS, "rect");
    rectBegelLuar.setAttribute("x", 30 + selimut);
    rectBegelLuar.setAttribute("y", 10 + selimut);
    rectBegelLuar.setAttribute("width", lebar - 2 * selimut);
    rectBegelLuar.setAttribute("height", tinggi - 2 * selimut);
    rectBegelLuar.setAttribute("rx", radiusLuar);
    rectBegelLuar.setAttribute("ry", radiusLuar);
    rectBegelLuar.setAttribute("fill", "none");
    rectBegelLuar.setAttribute("stroke", "#000000");
    rectBegelLuar.setAttribute("stroke-width", 3);
    applyNonScalingStroke(rectBegelLuar);
    svg.appendChild(rectBegelLuar);
    const rectBegelDalam = document.createElementNS(svgNS, "rect");
    rectBegelDalam.setAttribute("x", 30 + selimut + begel);
    rectBegelDalam.setAttribute("y", 10 + selimut + begel);
    rectBegelDalam.setAttribute("width", lebar - 2 * (selimut + begel));
    rectBegelDalam.setAttribute("height", tinggi - 2 * (selimut + begel));
    rectBegelDalam.setAttribute("rx", radiusDalam);
    rectBegelDalam.setAttribute("ry", radiusDalam);
    rectBegelDalam.setAttribute("fill", "none");
    rectBegelDalam.setAttribute("stroke", "#000000");
    rectBegelDalam.setAttribute("stroke-width", 3);
    applyNonScalingStroke(rectBegelDalam);
    svg.appendChild(rectBegelDalam);
    function buatLingkaranCAD(cx, cy, isTorsi = false) {
        const circle = document.createElementNS(svgNS, "circle");
        const actualCx = 30 + cx;
        const actualCy = 10 + cy;
        circle.setAttribute("cx", actualCx);
        circle.setAttribute("cy", actualCy);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", "#000000");
        circle.setAttribute("stroke", "#000000");
        circle.setAttribute("stroke-width", "2");
        applyNonScalingStroke(circle);
        if (isTorsi) lingkaranTorsiData.push({ cx, cy, r });
        else lingkaranData.push({ cx, cy, r });
        svg.appendChild(circle);
    }
    function buatBaris(jumlah, cy, isAtas) {
        const barisUtuh = Math.floor(jumlah / m);
        const sisa = jumlah % m;
        for (let b = 0; b < barisUtuh; b++) {
            const spacingY = 2 * r + jarakAntarBaris;
            const cyBaris = cy + (isAtas ? b * spacingY : -b * spacingY);
            const spacingX = (lebar - 2 * (selimut + begel + r)) / (m - 1);
            for (let i = 0; i < m; i++) {
                const cx = selimut + begel + r + i * spacingX;
                buatLingkaranCAD(cx, cyBaris);
            }
        }
        if (sisa > 0) {
            const spacingY = 2 * r + jarakAntarBaris;
            const cySisa = cy + (isAtas ? barisUtuh * spacingY : -barisUtuh * spacingY);
            if (sisa === 1) {
                const cx = selimut + begel + r;
                buatLingkaranCAD(cx, cySisa);
            } else {
                const spacingX = (lebar - 2 * (selimut + begel + r)) / (sisa - 1);
                for (let i = 0; i < sisa; i++) {
                    const cx = selimut + begel + r + i * spacingX;
                    buatLingkaranCAD(cx, cySisa);
                }
            }
        }
    }
    const cyAtas = selimut + begel + r;
    buatBaris(jumlahAtas, cyAtas, true);
    const cyBawah = tinggi - (selimut + begel + r);
    buatBaris(jumlahBawah, cyBawah, false);
    if (jumlahTorsi > 0) {
        const actualSnv = Snv || Math.max(25, D);
        const yMid = tinggi / 2;
        const xKiri = selimut + begel + r;
        const xKanan = lebar - selimut - begel - r;
        const nKanan = Math.ceil(jumlahTorsi / 2);
        const nKiri = Math.floor(jumlahTorsi / 2);
        const jarakPusatKePusat = actualSnv + D;
        for (let i = 1; i <= nKanan; i++) {
            const offsetY = (i - (nKanan + 1) / 2) * jarakPusatKePusat;
            const cy = yMid + offsetY;
            buatLingkaranCAD(xKanan, cy, true);
        }
        for (let i = 1; i <= nKiri; i++) {
            const offsetY = (i - (nKiri + 1) / 2) * jarakPusatKePusat;
            const cy = yMid + offsetY;
            buatLingkaranCAD(xKiri, cy, true);
        }
    }
    if (containerId.includes('tumpuan')) {
        window.cadConfig.tumpuan.lingkaranData = lingkaranData;
        window.cadConfig.tumpuan.lingkaranTorsiData = lingkaranTorsiData;
    } else if (containerId.includes('lapangan')) {
        window.cadConfig.lapangan.lingkaranData = lingkaranData;
        window.cadConfig.lapangan.lingkaranTorsiData = lingkaranTorsiData;
    }
    if (containerId.includes('tumpuan') || !window.cadConfig.activeType) {
        window.config = renderConfig;
        window.lingkaranData = lingkaranData;
        window.lingkaranTorsiData = lingkaranTorsiData;
        window.cadConfig.activeType = 'tumpuan';
    }
    console.log(`✅ Penampang ${containerId} berhasil di-render. Total tulangan: ${lingkaranData.length}, Tulangan torsi: ${lingkaranTorsiData.length}`);
    return { config: renderConfig, lingkaranData, lingkaranTorsiData, containerId };
};

// ==================== RENDER PENAMPANG KOLOM ====================
window.renderPenampangKolom = function(config, containerId = "svg-container-tumpuan") {
    console.log("🏗️ Rendering penampang kolom dengan config:", config);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Error: Element dengan ID '${containerId}' tidak ditemukan!`);
        return;
    }
    container.innerHTML = "";
    let renderConfig = config;
    if (!config || Object.keys(config).length === 0) {
        const data = window.loadDataFromStorage('calculationResultKolom') || window.loadDataFromStorage('calculationResult');
        if (data) {
            renderConfig = createKolomConfigFromData(data);
            if (!renderConfig) {
                container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>❌ Data kolom tidak lengkap.</p><p style="font-size: 0.9rem;">Perhitungan kolom biaxial tidak menyediakan nX dan nY yang valid.</p><p style="font-size: 0.9rem;">Silakan lakukan perhitungan ulang dengan versi terbaru.</p></div>`;
                return;
            }
        } else {
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #666;"><p>Data penampang kolom tidak tersedia</p><p style="font-size: 0.9rem;">Silakan lakukan perhitungan kolom terlebih dahulu</p></div>`;
            return;
        }
    }
    const requiredParams = ['lebar', 'tinggi', 'D', 'begel', 'selimut', 'nX', 'nY'];
    for (const param of requiredParams) {
        if (renderConfig[param] === undefined || renderConfig[param] === null) {
            console.error(`❌ Parameter ${param} tidak ditemukan dalam config kolom`);
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data penampang kolom tidak lengkap (${param} hilang).</p><p style="font-size: 0.9rem;">Gunakan hasil perhitungan kolom biaxial yang valid.</p></div>`;
            return;
        }
    }
    window.cadConfig.kolom = { ...renderConfig, containerId };
    const { lebar, tinggi, D, begel, selimut, nX, nY } = renderConfig;
    const r = D / 2;
    const offset = selimut + begel + r;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("viewBox", `0 0 ${lebar + 60} ${tinggi + 20}`);
    container.appendChild(svg);
    const lingkaranData = [];
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", 30);
    rect.setAttribute("y", 10);
    rect.setAttribute("width", lebar);
    rect.setAttribute("height", tinggi);
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#000000");
    rect.setAttribute("stroke-width", 4);
    applyNonScalingStroke(rect);
    svg.appendChild(rect);
    const radiusLuar = D/2 + begel;
    const radiusDalam = D/2;
    const rectBegelLuar = document.createElementNS(svgNS, "rect");
    rectBegelLuar.setAttribute("x", 30 + selimut);
    rectBegelLuar.setAttribute("y", 10 + selimut);
    rectBegelLuar.setAttribute("width", lebar - 2 * selimut);
    rectBegelLuar.setAttribute("height", tinggi - 2 * selimut);
    rectBegelLuar.setAttribute("rx", radiusLuar);
    rectBegelLuar.setAttribute("ry", radiusLuar);
    rectBegelLuar.setAttribute("fill", "none");
    rectBegelLuar.setAttribute("stroke", "#000000");
    rectBegelLuar.setAttribute("stroke-width", 3);
    applyNonScalingStroke(rectBegelLuar);
    svg.appendChild(rectBegelLuar);
    const rectBegelDalam = document.createElementNS(svgNS, "rect");
    rectBegelDalam.setAttribute("x", 30 + selimut + begel);
    rectBegelDalam.setAttribute("y", 10 + selimut + begel);
    rectBegelDalam.setAttribute("width", lebar - 2 * (selimut + begel));
    rectBegelDalam.setAttribute("height", tinggi - 2 * (selimut + begel));
    rectBegelDalam.setAttribute("rx", radiusDalam);
    rectBegelDalam.setAttribute("ry", radiusDalam);
    rectBegelDalam.setAttribute("fill", "none");
    rectBegelDalam.setAttribute("stroke", "#000000");
    rectBegelDalam.setAttribute("stroke-width", 3);
    applyNonScalingStroke(rectBegelDalam);
    svg.appendChild(rectBegelDalam);
    function buatLingkaranKolom(cx, cy) {
        const circle = document.createElementNS(svgNS, "circle");
        const actualCx = 30 + cx;
        const actualCy = 10 + cy;
        circle.setAttribute("cx", actualCx);
        circle.setAttribute("cy", actualCy);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", "#000000");
        circle.setAttribute("stroke", "#000000");
        circle.setAttribute("stroke-width", "2");
        applyNonScalingStroke(circle);
        lingkaranData.push({ cx, cy, r });
        svg.appendChild(circle);
    }
    const nXPerSisi = nX / 2;
    const yMin = offset;
    const yMax = tinggi - offset;
    const jarakY = (nXPerSisi > 1) ? (yMax - yMin) / (nXPerSisi - 1) : 0;
    for (let i = 0; i < nXPerSisi; i++) {
        const cy = yMin + i * jarakY;
        buatLingkaranKolom(offset, cy);
        buatLingkaranKolom(lebar - offset, cy);
    }
    let sisaY = nY - 4;
    if (sisaY > 0) {
        const nYPerSisi = sisaY / 2;
        const xMin = offset;
        const xMax = lebar - offset;
        const jarakX = (nYPerSisi > 0) ? (xMax - xMin) / (nYPerSisi + 1) : 0;
        for (let i = 1; i <= nYPerSisi; i++) {
            const cx = xMin + i * jarakX;
            buatLingkaranKolom(cx, offset);
            buatLingkaranKolom(cx, tinggi - offset);
        }
    }
    window.cadConfig.kolom.lingkaranData = lingkaranData;
    if (containerId.includes('tumpuan') || !window.cadConfig.activeType) {
        window.config = renderConfig;
        window.lingkaranData = lingkaranData;
        window.cadConfig.activeType = 'kolom';
    }
    console.log(`✅ Penampang kolom biaxial: nX=${nX}, nY=${nY}, total batang = ${lingkaranData.length}`);
    return { config: renderConfig, lingkaranData, containerId };
};

// ==================== LOAD DATA DARI STORAGE ====================
if (!window.loadDataFromStorage) {
    window.loadDataFromStorage = function(key) {
        try {
            const saved = sessionStorage.getItem(key);
            if (!saved) return null;
            return JSON.parse(saved);
        } catch (e) {
            console.warn(`Gagal load ${key}:`, e);
            return null;
        }
    };
}

// ==================== CREATE KOLOM CONFIG (DENGAN PATH YANG DIPERBAIKI) ====================
function createKolomConfigFromData(data) {
    try {
        // Cari dimensi dari berbagai kemungkinan lokasi
        const dimensi =
            data.inputData?.dimensi ||
            data.rekap?.input?.dimensi ||
            data.data?.parsedInput?.dimensi ||
            data.parsedInput?.dimensi ||
            data.dimensi ||
            {};
        const lebar = parseInt(dimensi.b);
        const tinggi = parseInt(dimensi.h);
        const selimut = parseInt(dimensi.sb);
        
        const D =
            data.rekap?.tulangan?.D ||
            data.data?.D ||
            data.data?.hasilTulangan?.D ||
            data.optimizerData?.data?.D ||
            data.data?.parsedInput?.tulangan?.d_tul ||
            data.parsedInput?.tulangan?.d_tul ||
            data.inputData?.tulangan?.d_tul ||
            null;
        
        const begel =
            data.rekap?.tulangan?.phi ||
            data.data?.phi ||
            data.data?.hasilTulangan?.phi ||
            data.optimizerData?.data?.phi ||
            data.data?.parsedInput?.tulangan?.phi_tul ||
            data.parsedInput?.tulangan?.phi_tul ||
            data.inputData?.tulangan?.phi_tul ||
            null;
        
        if (!lebar || !tinggi || !selimut || !D || !begel) {
            console.error("❌ Data dimensi atau tulangan dasar tidak lengkap");
            return null;
        }
        
        let nX = null, nY = null;
        if (data.rekap?.tulanganArahX?.n_terpakai) nX = data.rekap.tulanganArahX.n_terpakai;
        if (data.rekap?.tulanganArahY?.n_terpakai) nY = data.rekap.tulanganArahY.n_terpakai;
        if (!nX && data.data?.hasilTulangan?.hasilArahX?.n_terpakai) nX = data.data.hasilTulangan.hasilArahX.n_terpakai;
        if (!nY && data.data?.hasilTulangan?.hasilArahY?.n_terpakai) nY = data.data.hasilTulangan.hasilArahY.n_terpakai;
        if (!nX && data.optimizerData?.data?.nX) nX = data.optimizerData.data.nX;
        if (!nY && data.optimizerData?.data?.nY) nY = data.optimizerData.data.nY;
        
        if ((!nX || !nY) && data.rekap?.tulangan?.n_terpakai) {
            const total = data.rekap.tulangan.n_terpakai;
            if (total >= 4) {
                let asumsi = Math.floor(total / 2);
                if (asumsi % 2 !== 0) asumsi++;
                nX = nX || asumsi;
                nY = nY || asumsi;
            }
        }
        
        if (!nX || !nY) {
            console.error("❌ nX atau nY tidak ditemukan dalam data.");
            return null;
        }
        
        if (nX % 2 !== 0) nX++;
        if (nY % 2 !== 0) nY++;
        
        return { lebar, tinggi, D, begel, selimut, nX, nY, tipe: 'kolom', source: 'session-storage-biaxial' };
    } catch (error) {
        console.error("❌ Error membuat config kolom:", error);
        return null;
    }
}

window.renderKolomFromStorage = function(containerId = "svg-container-tumpuan") {
    console.log("🔄 Memuat dan merender kolom dari session storage");
    const data = window.loadDataFromStorage('calculationResultKolom') || window.loadDataFromStorage('calculationResult');
    if (!data) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #666;"><p>Data kolom tidak ditemukan</p></div>`;
        return null;
    }
    const config = createKolomConfigFromData(data);
    if (!config) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>❌ Data kolom tidak lengkap.</p></div>`;
        return null;
    }
    return window.renderPenampangKolom(config, containerId);
};

// ==================== REGISTRI PELAT & RENDER UTAMA ====================
window.pelatRenderers = {
    dua_arah: null,
    kantilever: null,
    satu_arah: null
};

window.renderPenampangPelat = function(config, containerId) {
    const jenisPelat = getJenisPelatLengkap();
    const renderer = window.pelatRenderers[jenisPelat];
    if (!renderer) {
        console.error(`Renderer untuk jenis pelat '${jenisPelat}' tidak ditemukan.`);
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Renderer untuk ${jenisPelat} tidak tersedia.</p></div>`;
        return { config, containerId, scaleInfo: null, jenisPelat };
    }
    return renderer(config, containerId);
};

// ==================== REGISTRI FONDASI & RENDER UTAMA ====================
window.foundationRenderers = {
    tunggal: null,
    menerus: null
};

window.renderPenampangFondasiByType = function(jenisFondasi, config, containerId) {
    const renderer = window.foundationRenderers[jenisFondasi];
    if (!renderer) {
        console.error(`Renderer untuk fondasi '${jenisFondasi}' tidak ditemukan.`);
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Renderer untuk fondasi ${jenisFondasi} tidak tersedia.</p></div>`;
        return { config, containerId, scaleInfo: null, jenisFondasi };
    }
    return renderer(config, containerId);
};

// ==================== FUNGSI CAD ====================
window.cadConfig = { tumpuan: null, lapangan: null, kolom: null, fondasi: null, activeType: 'tumpuan' };

function generateCADForPenampangNonCircle(config, offsetX = 0) {
    try {
        const { lebar, tinggi, D, begel, selimut } = config;
        const r = D / 2;
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
            }
        };
        const cadLines = [];
        const addOffset = (x, y) => `${x + offsetX},${y}`;
        cadLines.push(`RECTANGLE ${addOffset(0, 0)} ${addOffset(cadVars.lebarRect, cadVars.tinggiRect)}`);
        cadLines.push(`ARC C ${addOffset(cadVars.x1, cadVars.y1)} ${addOffset(cadVars.x7, cadVars.y4)} ${addOffset(cadVars.x2, cadVars.y1)}`);
        cadLines.push(`ARC C ${addOffset(cadVars.x3, cadVars.y1)} ${addOffset(cadVars.x4, cadVars.y1)} ${addOffset(cadVars.x3, cadVars.y2)}`);
        cadLines.push(`ARC C ${addOffset(cadVars.x3, cadVars.x1)} ${addOffset(cadVars.x3, cadVars.x2)} ${addOffset(cadVars.x4, cadVars.x1)}`);
        cadLines.push(`ARC C ${addOffset(cadVars.x1, cadVars.x1)} ${addOffset(cadVars.x2, cadVars.x1)} ${addOffset(cadVars.x1, cadVars.x2)}`);
        cadLines.push(`PL ${addOffset(cadVars.x2, cadVars.x1)} ${addOffset(cadVars.x2, cadVars.y1)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x1, cadVars.y2)} ${addOffset(cadVars.x3, cadVars.y2)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x4, cadVars.y1)} ${addOffset(cadVars.x4, cadVars.x1)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x3, cadVars.x2)} ${addOffset(cadVars.x1, cadVars.x2)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x5, cadVars.x1)} ${addOffset(cadVars.x5, cadVars.y1)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x14, cadVars.y3)} ${addOffset(cadVars.x3, cadVars.y3)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x6, cadVars.y1)} ${addOffset(cadVars.x6, cadVars.x1)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x3, cadVars.x5)} ${addOffset(cadVars.x1, cadVars.x5)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x8, cadVars.y5)} ${addOffset(cadVars.x9, cadVars.y6)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x9, cadVars.y6)} ${addOffset(cadVars.x10, cadVars.y7)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x10, cadVars.y7)} ${addOffset(cadVars.x7, cadVars.y4)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x11, cadVars.y8)} ${addOffset(cadVars.x12, cadVars.y9)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x12, cadVars.y9)} ${addOffset(cadVars.x13, cadVars.y10)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x13, cadVars.y10)} ${addOffset(cadVars.x5, cadVars.y11)} C`);
        cadLines.push("ENTER");
        return cadLines;
    } catch (error) {
        console.error("Error in generateCADForPenampangNonCircle:", error);
        return [];
    }
}

function generateCADForKolomNonCircle(config, offsetX = 0) {
    try {
        const { lebar, tinggi, D, begel, selimut } = config;
        const r = D / 2;
        const cadVars = {
            lebarRect: lebar,
            tinggiRect: tinggi,
            x1: selimut + begel + r,
            x2: selimut,
            x3: lebar - selimut - begel - r,
            x4: lebar - selimut,
            x5: selimut + begel,
            x6: lebar - selimut - begel
        };
        const cadLines = [];
        const addOffset = (x, y) => `${x + offsetX},${y}`;
        cadLines.push(`RECTANGLE ${addOffset(0, 0)} ${addOffset(cadVars.lebarRect, cadVars.tinggiRect)}`);
        cadLines.push(`PL ${addOffset(cadVars.x2, cadVars.x2)} ${addOffset(cadVars.x2, cadVars.tinggiRect - cadVars.x2)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x2, cadVars.tinggiRect - cadVars.x2)} ${addOffset(cadVars.lebarRect - cadVars.x2, cadVars.tinggiRect - cadVars.x2)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.lebarRect - cadVars.x2, cadVars.tinggiRect - cadVars.x2)} ${addOffset(cadVars.lebarRect - cadVars.x2, cadVars.x2)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.lebarRect - cadVars.x2, cadVars.x2)} ${addOffset(cadVars.x2, cadVars.x2)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x5, cadVars.x5)} ${addOffset(cadVars.x5, cadVars.tinggiRect - cadVars.x5)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.x5, cadVars.tinggiRect - cadVars.x5)} ${addOffset(cadVars.lebarRect - cadVars.x5, cadVars.tinggiRect - cadVars.x5)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.lebarRect - cadVars.x5, cadVars.tinggiRect - cadVars.x5)} ${addOffset(cadVars.lebarRect - cadVars.x5, cadVars.x5)} C`);
        cadLines.push("ENTER");
        cadLines.push(`PL ${addOffset(cadVars.lebarRect - cadVars.x5, cadVars.x5)} ${addOffset(cadVars.x5, cadVars.x5)} C`);
        cadLines.push("ENTER");
        return cadLines;
    } catch (error) {
        console.error("Error in generateCADForKolomNonCircle:", error);
        return [];
    }
}

function generateCADForCircle(config, lingkaranData, lingkaranTorsiData, offsetX = 0) {
    try {
        const { tinggi } = config;
        const semuaLingkaran = [...lingkaranData, ...lingkaranTorsiData];
        const circleLines = [];
        const addOffset = (x, y) => `${x + offsetX},${y}`;
        semuaLingkaran.forEach(c => {
            const cyCAD = tinggi - c.cy;
            circleLines.push(`CIRCLE ${addOffset(c.cx, cyCAD)} ${c.r} `);
        });
        return circleLines;
    } catch (error) {
        console.error("Error in generateCADForCircle:", error);
        return [];
    }
}

function generateCADForKolomCircle(config, lingkaranData, offsetX = 0) {
    try {
        const { tinggi } = config;
        const circleLines = [];
        const addOffset = (x, y) => `${x + offsetX},${y}`;
        lingkaranData.forEach(c => {
            const cyCAD = tinggi - c.cy;
            circleLines.push(`CIRCLE ${addOffset(c.cx, cyCAD)} ${c.r} `);
        });
        return circleLines;
    } catch (error) {
        console.error("Error in generateCADForKolomCircle:", error);
        return [];
    }
}

window.generateCADText = function() {
    try {
        const tumpuan = window.cadConfig.tumpuan;
        const lapangan = window.cadConfig.lapangan;
        const kolom = window.cadConfig.kolom;
        const combinedLines = [];
        if (!tumpuan && !lapangan && !kolom) {
            throw new Error("Tidak ada data penampang!");
        }
        
        // KOLOM SAJA (tanpa balok tumpuan/lapangan)
        if (kolom && !tumpuan && !lapangan) {
            // Gunakan fungsi balok untuk menggambar persegi & begel (sistem lainnya)
            const kolomNonCircle = generateCADForPenampangNonCircle(kolom, 0);
            combinedLines.push(...kolomNonCircle);
            // Tetap gunakan fungsi kolom untuk lingkaran tulangan
            const kolomCircles = generateCADForKolomCircle(kolom, kolom.lingkaranData || [], 0);
            combinedLines.push(...kolomCircles);
        }
        else if (tumpuan && !lapangan && !kolom) {
            const tumpuanNonCircle = generateCADForPenampangNonCircle(tumpuan, 0);
            combinedLines.push(...tumpuanNonCircle);
            const tumpuanCircles = generateCADForCircle(tumpuan, tumpuan.lingkaranData || [], tumpuan.lingkaranTorsiData || [], 0);
            combinedLines.push(...tumpuanCircles);
        }
        else if (!tumpuan && lapangan && !kolom) {
            const lapanganNonCircle = generateCADForPenampangNonCircle(lapangan, 0);
            combinedLines.push(...lapanganNonCircle);
            const lapanganCircles = generateCADForCircle(lapangan, lapangan.lingkaranData || [], lapangan.lingkaranTorsiData || [], 0);
            combinedLines.push(...lapanganCircles);
        }
        else if (tumpuan && lapangan && !kolom) {
            const offsetLapangan = tumpuan.lebar + 30;
            const tumpuanNonCircle = generateCADForPenampangNonCircle(tumpuan, 0);
            combinedLines.push(...tumpuanNonCircle);
            const lapanganNonCircle = generateCADForPenampangNonCircle(lapangan, offsetLapangan);
            combinedLines.push(...lapanganNonCircle);
            const tumpuanCircles = generateCADForCircle(tumpuan, tumpuan.lingkaranData || [], tumpuan.lingkaranTorsiData || [], 0);
            combinedLines.push(...tumpuanCircles);
            const lapanganCircles = generateCADForCircle(lapangan, lapangan.lingkaranData || [], lapangan.lingkaranTorsiData || [], offsetLapangan);
            combinedLines.push(...lapanganCircles);
        }
        
        if (combinedLines.length === 0) return "Error generating CAD text";
        return combinedLines.join("\n");
    } catch (error) {
        console.error("Error in generateCADText:", error);
        return "Error generating CAD text: " + error.message;
    }
};

window.getActiveCADInfo = function() {
    const activeType = window.cadConfig.activeType || 'tumpuan';
    const config = window.config || {};
    let info = { type: activeType, lebar: config.lebar || 0, tinggi: config.tinggi || 0, D: config.D || 0 };
    if (activeType === 'kolom') {
        info.nX = config.nX || 0;
        info.nY = config.nY || 0;
        info.jumlahTulangan = (config.nX || 0) + (config.nY || 0);
    } else {
        info.jumlahAtas = config.jumlahAtas || 0;
        info.jumlahBawah = config.jumlahBawah || 0;
        info.jumlahTorsi = config.jumlahTorsi || 0;
    }
    return info;
};

window.switchCADType = function(type) {
    if (type === 'tumpuan' && window.cadConfig.tumpuan) {
        window.config = window.cadConfig.tumpuan;
        window.lingkaranData = window.cadConfig.tumpuan.lingkaranData || [];
        window.lingkaranTorsiData = window.cadConfig.tumpuan.lingkaranTorsiData || [];
        window.cadConfig.activeType = 'tumpuan';
        return true;
    } else if (type === 'lapangan' && window.cadConfig.lapangan) {
        window.config = window.cadConfig.lapangan;
        window.lingkaranData = window.cadConfig.lapangan.lingkaranData || [];
        window.lingkaranTorsiData = window.cadConfig.lapangan.lingkaranTorsiData || [];
        window.cadConfig.activeType = 'lapangan';
        return true;
    } else if (type === 'kolom' && window.cadConfig.kolom) {
        window.config = window.cadConfig.kolom;
        window.lingkaranData = window.cadConfig.kolom.lingkaranData || [];
        window.lingkaranTorsiData = [];
        window.cadConfig.activeType = 'kolom';
        return true;
    }
    return false;
};

window.lastPelatConfig = null;

window.addEventListener('DOMContentLoaded', function() {
    const isKolomPage = window.location.pathname.includes('kolom') || document.querySelector('.penampang-section h2')?.textContent.includes('KOLOM');
    if (isKolomPage) {
        setTimeout(() => window.renderKolomFromStorage(), 500);
    }
});

console.log("✅ cut-generator.js final (balok, kolom, pelat) dengan perbaikan path pencarian kolom");