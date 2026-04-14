// cut-generator.js - Versi final dengan perbaikan posisi kotak skala (di bawah gambar, tidak menempel tepi, ukuran seragam)
// Semua fungsi asli dipertahankan, ditambah renderPenampangPelat dan export CAD pelat.

// Konfigurasi global untuk CAD
window.cadConfig = {
    tumpuan: null,
    lapangan: null,
    kolom: null,
    fondasi: null,
    activeType: 'tumpuan'
};

// Fungsi untuk memuat data dari session storage
window.loadDataFromStorage = function(storageKey = 'calculationResult') {
    try {
        const saved = sessionStorage.getItem(storageKey);
        if (!saved) {
            console.log(`📭 Tidak ada data di session storage dengan key: ${storageKey}`);
            return null;
        }
        const data = JSON.parse(saved);
        console.log(`📥 Data loaded from ${storageKey}:`, data);
        return data;
    } catch (error) {
        console.error(`Error loading data from ${storageKey}:`, error);
        return null;
    }
};

// Helper untuk menambahkan vector-effect non-scaling-stroke pada elemen SVG
function applyNonScalingStroke(element) {
    if (element && element.setAttribute) {
        element.setAttribute("vector-effect", "non-scaling-stroke");
    }
    return element;
}

// ==================== RENDER PENAMPANG BALOK (LENGKAP) ====================
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

    if (containerId.includes('tumpuan')) {
        window.cadConfig.tumpuan = { ...renderConfig, containerId };
    } else if (containerId.includes('lapangan')) {
        window.cadConfig.lapangan = { ...renderConfig, containerId };
    }

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

    function buatLingkaran(cx, cy, isTorsi = false) {
        const circle = document.createElementNS(svgNS, "circle");
        const actualCx = 30 + cx;
        const actualCy = 10 + cy;
        circle.setAttribute("cx", actualCx);
        circle.setAttribute("cy", actualCy);
        circle.setAttribute("r", r);
        if (isTorsi) {
            circle.setAttribute("fill", "#000000");
            circle.setAttribute("stroke", "#000000");
            circle.setAttribute("stroke-width", "3");
            lingkaranTorsiData.push({ cx, cy, r });
        } else {
            circle.setAttribute("fill", "#000000");
            lingkaranData.push({ cx, cy, r });
        }
        applyNonScalingStroke(circle);
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

    const cyAtas = selimut + begel + r;
    buatBaris(jumlahAtas, cyAtas, true);
    const cyBawah = tinggi - (selimut + begel + r);
    buatBaris(jumlahBawah, cyBawah, false);

    if (jumlahTorsi > 0) {
        renderTulanganTorsi(jumlahTorsi, jarakTorsi);
    }

    function renderTulanganTorsi(jumlah, jarak) {
        const actualSnv = Snv || Math.max(25, D);
        const yMid = tinggi / 2;
        const xKiri = selimut + begel + r;
        const xKanan = lebar - selimut - begel - r;
        const nKanan = Math.ceil(jumlah / 2);
        const nKiri = Math.floor(jumlah / 2);
        const jarakPusatKePusat = actualSnv + D;
        for (let i = 1; i <= nKanan; i++) {
            const offsetY = (i - (nKanan + 1) / 2) * jarakPusatKePusat;
            const cy = yMid + offsetY;
            buatLingkaran(xKanan, cy, true);
        }
        for (let i = 1; i <= nKiri; i++) {
            const offsetY = (i - (nKiri + 1) / 2) * jarakPusatKePusat;
            const cy = yMid + offsetY;
            buatLingkaran(xKiri, cy, true);
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

// ==================== RENDER PENAMPANG KOLOM (BIAXIAL - DIPERBAIKI) ====================
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
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #dc3545;">
                        <p>❌ Data kolom tidak lengkap.</p>
                        <p style="font-size: 0.9rem;">Perhitungan kolom biaxial tidak menyediakan nX dan nY yang valid.</p>
                        <p style="font-size: 0.9rem;">Silakan lakukan perhitungan ulang dengan versi terbaru.</p>
                    </div>
                `;
                return;
            }
        } else {
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #666;"><p>Data penampang kolom tidak tersedia</p><p style="font-size: 0.9rem;">Silakan lakukan perhitungan kolom terlebih dahulu</p></div>`;
            return;
        }
    }

    console.log("🔧 Config kolom untuk rendering:", renderConfig);

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

    function buatLingkaran(cx, cy) {
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

    // Tulangan arah X (vertikal) di dua sisi
    const nXPerSisi = nX / 2;
    const yMin = offset;
    const yMax = tinggi - offset;
    const jarakY = (nXPerSisi > 1) ? (yMax - yMin) / (nXPerSisi - 1) : 0;
    for (let i = 0; i < nXPerSisi; i++) {
        const cy = yMin + i * jarakY;
        buatLingkaran(offset, cy);
        buatLingkaran(lebar - offset, cy);
    }

    // Tulangan arah Y (horizontal) di dua sisi (sisa setelah 4 sudut)
    let sisaY = nY - 4;
    if (sisaY > 0) {
        const nYPerSisi = sisaY / 2;
        const xMin = offset;
        const xMax = lebar - offset;
        const jarakX = (nYPerSisi > 0) ? (xMax - xMin) / (nYPerSisi + 1) : 0;
        for (let i = 1; i <= nYPerSisi; i++) {
            const cx = xMin + i * jarakX;
            buatLingkaran(cx, offset);
            buatLingkaran(cx, tinggi - offset);
        }
    } else if (sisaY < 0) {
        console.warn(`⚠️ nY (${nY}) kurang dari 4, tidak ada tulangan horizontal tambahan.`);
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

// ==================== FUNGSI MEMBUAT CONFIG KOLOM DARI DATA SESSION ====================
function createKolomConfigFromData(data) {
    try {
        console.log("📦 Membuat config kolom dari data:", data);
        
        const dimensi = data.inputData?.dimensi || data.rekap?.input?.dimensi || {};
        const tulangan = data.rekap?.tulangan || data.data?.hasilTulangan || {};
        const begelData = data.rekap?.begel || data.data?.begel || {};
        
        const lebar = parseInt(dimensi.b);
        const tinggi = parseInt(dimensi.h);
        const selimut = parseInt(dimensi.sb);
        const D = tulangan.D || data.data?.D || data.optimizerData?.data?.D;
        const begel = tulangan.phi || data.data?.phi || data.optimizerData?.data?.phi;
        
        if (!lebar || !tinggi || !selimut || !D || !begel) {
            console.error("❌ Data dimensi atau tulangan dasar tidak lengkap");
            return null;
        }
        
        let nX = null, nY = null;
        
        if (data.rekap?.tulanganArahX?.n_terpakai) nX = data.rekap.tulanganArahX.n_terpakai;
        if (data.rekap?.tulanganArahY?.n_terpakai) nY = data.rekap.tulanganArahY.n_terpakai;
        
        if (!nX && data.data?.hasilArahX?.n_terpakai) nX = data.data.hasilArahX.n_terpakai;
        if (!nY && data.data?.hasilArahY?.n_terpakai) nY = data.data.hasilArahY.n_terpakai;
        
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
                console.warn(`⚠️ Menggunakan nilai asumsi nX=nY=${asumsi} dari total batang ${total}`);
            }
        }
        
        if (!nX || !nY) {
            console.error("❌ nX atau nY tidak ditemukan dalam data.");
            return null;
        }
        
        if (nX % 2 !== 0) { nX++; }
        if (nY % 2 !== 0) { nY++; }
        
        return {
            lebar, tinggi, D, begel, selimut,
            nX: nX, nY: nY,
            tipe: 'kolom',
            source: 'session-storage-biaxial'
        };
    } catch (error) {
        console.error("❌ Error membuat config kolom:", error);
        return null;
    }
}

// ==================== RENDER PENAMPANG FONDASI ====================
window.renderPenampangFondasi = function(config, containerId = "svg-container-tumpuan") {
    console.log("🏗️ Rendering penampang fondasi dengan config:", config);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Error: Element dengan ID '${containerId}' tidak ditemukan!`);
        return;
    }

    container.innerHTML = "";

    if (!config) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data penampang fondasi tidak ditemukan</p><p style="font-size: 0.9rem;">Silakan berikan config yang valid</p></div>`;
        return;
    }

    window.cadConfig.fondasi = { ...config, containerId };

    const { lx, ly, h, bx, by, D, Db, s, jenis } = config;
    
    if (jenis === 'samping') {
        const required = ['lx', 'h', 'bx', 'by'];
        for (const p of required) if (config[p] === undefined) {
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data penampang fondasi tidak lengkap</p><p>Parameter '${p}' diperlukan untuk tampak samping</p></div>`;
            return;
        }
    } else if (jenis === 'atas') {
        const required = ['lx', 'ly', 'bx', 'by'];
        for (const p of required) if (config[p] === undefined) {
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Data penampang fondasi tidak lengkap</p><p>Parameter '${p}' diperlukan untuk tampak atas</p></div>`;
            return;
        }
    } else {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>Jenis fondasi tidak valid</p><p>Jenis harus 'samping' atau 'atas'</p></div>`;
        return;
    }

    const svgNS = "http://www.w3.org/2000/svg";
    let svg, viewBoxWidth, viewBoxHeight;
    const STROKE_WIDTH_MAIN = 1.0;
    const STROKE_WIDTH_DASHED = 0.6;
    const STROKE_WIDTH_DIMENSION = 0.4;
    
    if (jenis === 'samping') {
        const scale = 0.2;
        const lxMM = lx * 1000 * scale;
        const hMM = h * 1000 * scale;
        const bxMM = bx * scale;
        let byTerbatas = by;
        if (by > 1.5 * bx) byTerbatas = bx;
        else byTerbatas = Math.min(by, 1.5 * bx);
        const byMM = byTerbatas * scale;
        viewBoxWidth = lxMM + 100;
        viewBoxHeight = hMM + 100;
        svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        container.appendChild(svg);
        
        const fondasiBawah = document.createElementNS(svgNS, "line");
        fondasiBawah.setAttribute("x1", 50);
        fondasiBawah.setAttribute("y1", 50 + hMM);
        fondasiBawah.setAttribute("x2", 50 + lxMM);
        fondasiBawah.setAttribute("y2", 50 + hMM);
        fondasiBawah.setAttribute("stroke", "#000000");
        fondasiBawah.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(fondasiBawah);
        svg.appendChild(fondasiBawah);
        
        const fondasiKiri = document.createElementNS(svgNS, "line");
        fondasiKiri.setAttribute("x1", 50);
        fondasiKiri.setAttribute("y1", 50);
        fondasiKiri.setAttribute("x2", 50);
        fondasiKiri.setAttribute("y2", 50 + hMM);
        fondasiKiri.setAttribute("stroke", "#000000");
        fondasiKiri.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(fondasiKiri);
        svg.appendChild(fondasiKiri);
        
        const fondasiKanan = document.createElementNS(svgNS, "line");
        fondasiKanan.setAttribute("x1", 50 + lxMM);
        fondasiKanan.setAttribute("y1", 50);
        fondasiKanan.setAttribute("x2", 50 + lxMM);
        fondasiKanan.setAttribute("y2", 50 + hMM);
        fondasiKanan.setAttribute("stroke", "#000000");
        fondasiKanan.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(fondasiKanan);
        svg.appendChild(fondasiKanan);
        
        const kolomX = 50 + (lxMM / 2) - (bxMM / 2);
        const kolomY = 50 - byMM;
        const atasFondasiKiri = document.createElementNS(svgNS, "line");
        atasFondasiKiri.setAttribute("x1", 50);
        atasFondasiKiri.setAttribute("y1", 50);
        atasFondasiKiri.setAttribute("x2", kolomX);
        atasFondasiKiri.setAttribute("y2", 50);
        atasFondasiKiri.setAttribute("stroke", "#000000");
        atasFondasiKiri.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(atasFondasiKiri);
        svg.appendChild(atasFondasiKiri);
        
        const atasFondasiKanan = document.createElementNS(svgNS, "line");
        atasFondasiKanan.setAttribute("x1", kolomX + bxMM);
        atasFondasiKanan.setAttribute("y1", 50);
        atasFondasiKanan.setAttribute("x2", 50 + lxMM);
        atasFondasiKanan.setAttribute("y2", 50);
        atasFondasiKanan.setAttribute("stroke", "#000000");
        atasFondasiKanan.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(atasFondasiKanan);
        svg.appendChild(atasFondasiKanan);
        
        const kolomKiri = document.createElementNS(svgNS, "line");
        kolomKiri.setAttribute("x1", kolomX);
        kolomKiri.setAttribute("y1", 50);
        kolomKiri.setAttribute("x2", kolomX);
        kolomKiri.setAttribute("y2", kolomY);
        kolomKiri.setAttribute("stroke", "#000000");
        kolomKiri.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(kolomKiri);
        svg.appendChild(kolomKiri);
        
        const kolomAtas = document.createElementNS(svgNS, "line");
        kolomAtas.setAttribute("x1", kolomX);
        kolomAtas.setAttribute("y1", kolomY);
        kolomAtas.setAttribute("x2", kolomX + bxMM);
        kolomAtas.setAttribute("y2", kolomY);
        kolomAtas.setAttribute("stroke", "#000000");
        kolomAtas.setAttribute("stroke-width", STROKE_WIDTH_DASHED);
        kolomAtas.setAttribute("stroke-dasharray", `${STROKE_WIDTH_DASHED*10},${STROKE_WIDTH_DASHED*10}`);
        applyNonScalingStroke(kolomAtas);
        svg.appendChild(kolomAtas);
        
        const kolomKanan = document.createElementNS(svgNS, "line");
        kolomKanan.setAttribute("x1", kolomX + bxMM);
        kolomKanan.setAttribute("y1", kolomY);
        kolomKanan.setAttribute("x2", kolomX + bxMM);
        kolomKanan.setAttribute("y2", 50);
        kolomKanan.setAttribute("stroke", "#000000");
        kolomKanan.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(kolomKanan);
        svg.appendChild(kolomKanan);
        
        const lineLx1 = document.createElementNS(svgNS, "line");
        lineLx1.setAttribute("x1", 50);
        lineLx1.setAttribute("y1", 50 + hMM + 20);
        lineLx1.setAttribute("x2", 50 + lxMM);
        lineLx1.setAttribute("y2", 50 + hMM + 20);
        lineLx1.setAttribute("stroke", "#666");
        lineLx1.setAttribute("stroke-width", STROKE_WIDTH_DIMENSION);
        lineLx1.setAttribute("stroke-dasharray", `${STROKE_WIDTH_DIMENSION*10},${STROKE_WIDTH_DIMENSION*10}`);
        applyNonScalingStroke(lineLx1);
        svg.appendChild(lineLx1);
        
        const textLx = document.createElementNS(svgNS, "text");
        textLx.setAttribute("x", 50 + lxMM/2);
        textLx.setAttribute("y", 50 + hMM + 40);
        textLx.setAttribute("text-anchor", "middle");
        textLx.setAttribute("font-size", "12");
        textLx.setAttribute("fill", "#000000");
        textLx.textContent = `Lx = ${lx}m`;
        svg.appendChild(textLx);
        
    } else if (jenis === 'atas') {
        const scale = 0.08;
        const lxMM = lx * 1000 * scale;
        const bxMM = bx * scale;
        const byMM = by * scale;
        let lyTerbatas = Math.min(ly, 3 * lx);
        const lyMM = lyTerbatas * 1000 * scale;
        const isLy3TimesLx = ly >= 3 * lx;
        viewBoxWidth = lxMM + 100;
        viewBoxHeight = lyMM + 100;
        svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        container.appendChild(svg);
        
        const xStart = 50;
        const yStart = 50;
        const fondasiKiri = document.createElementNS(svgNS, "line");
        fondasiKiri.setAttribute("x1", xStart);
        fondasiKiri.setAttribute("y1", yStart);
        fondasiKiri.setAttribute("x2", xStart);
        fondasiKiri.setAttribute("y2", yStart + lyMM);
        fondasiKiri.setAttribute("stroke", "#000000");
        fondasiKiri.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(fondasiKiri);
        svg.appendChild(fondasiKiri);
        
        const fondasiKanan = document.createElementNS(svgNS, "line");
        fondasiKanan.setAttribute("x1", xStart + lxMM);
        fondasiKanan.setAttribute("y1", yStart);
        fondasiKanan.setAttribute("x2", xStart + lxMM);
        fondasiKanan.setAttribute("y2", yStart + lyMM);
        fondasiKanan.setAttribute("stroke", "#000000");
        fondasiKanan.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        applyNonScalingStroke(fondasiKanan);
        svg.appendChild(fondasiKanan);
        
        const fondasiAtas = document.createElementNS(svgNS, "line");
        fondasiAtas.setAttribute("x1", xStart);
        fondasiAtas.setAttribute("y1", yStart);
        fondasiAtas.setAttribute("x2", xStart + lxMM);
        fondasiAtas.setAttribute("y2", yStart);
        fondasiAtas.setAttribute("stroke", "#000000");
        fondasiAtas.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        if (isLy3TimesLx) fondasiAtas.setAttribute("stroke-dasharray", `${STROKE_WIDTH_MAIN*10},${STROKE_WIDTH_MAIN*10}`);
        applyNonScalingStroke(fondasiAtas);
        svg.appendChild(fondasiAtas);
        
        const fondasiBawah = document.createElementNS(svgNS, "line");
        fondasiBawah.setAttribute("x1", xStart);
        fondasiBawah.setAttribute("y1", yStart + lyMM);
        fondasiBawah.setAttribute("x2", xStart + lxMM);
        fondasiBawah.setAttribute("y2", yStart + lyMM);
        fondasiBawah.setAttribute("stroke", "#000000");
        fondasiBawah.setAttribute("stroke-width", STROKE_WIDTH_MAIN);
        if (isLy3TimesLx) fondasiBawah.setAttribute("stroke-dasharray", `${STROKE_WIDTH_MAIN*10},${STROKE_WIDTH_MAIN*10}`);
        applyNonScalingStroke(fondasiBawah);
        svg.appendChild(fondasiBawah);
        
        const kolomX = xStart + (lxMM / 2) - (bxMM / 2);
        const kolomY = yStart + (lyMM / 2) - (byMM / 2);
        const kolomRect = document.createElementNS(svgNS, "rect");
        kolomRect.setAttribute("x", kolomX);
        kolomRect.setAttribute("y", kolomY);
        kolomRect.setAttribute("width", bxMM);
        kolomRect.setAttribute("height", byMM);
        kolomRect.setAttribute("fill", "none");
        kolomRect.setAttribute("stroke", "#000000");
        kolomRect.setAttribute("stroke-width", STROKE_WIDTH_DASHED);
        kolomRect.setAttribute("stroke-dasharray", `${STROKE_WIDTH_DASHED*10},${STROKE_WIDTH_DASHED*10}`);
        applyNonScalingStroke(kolomRect);
        svg.appendChild(kolomRect);
        
        const lineLx1 = document.createElementNS(svgNS, "line");
        lineLx1.setAttribute("x1", xStart);
        lineLx1.setAttribute("y1", yStart + lyMM + 20);
        lineLx1.setAttribute("x2", xStart + lxMM);
        lineLx1.setAttribute("y2", yStart + lyMM + 20);
        lineLx1.setAttribute("stroke", "#666");
        lineLx1.setAttribute("stroke-width", STROKE_WIDTH_DIMENSION);
        lineLx1.setAttribute("stroke-dasharray", `${STROKE_WIDTH_DIMENSION*10},${STROKE_WIDTH_DIMENSION*10}`);
        applyNonScalingStroke(lineLx1);
        svg.appendChild(lineLx1);
        
        const textLx = document.createElementNS(svgNS, "text");
        textLx.setAttribute("x", xStart + lxMM/2);
        textLx.setAttribute("y", yStart + lyMM + 40);
        textLx.setAttribute("text-anchor", "middle");
        textLx.setAttribute("font-size", "12");
        textLx.setAttribute("fill", "#000000");
        textLx.textContent = `Lx = ${lx}m`;
        svg.appendChild(textLx);
        
        const lineLy1 = document.createElementNS(svgNS, "line");
        lineLy1.setAttribute("x1", xStart + lxMM + 20);
        lineLy1.setAttribute("y1", yStart);
        lineLy1.setAttribute("x2", xStart + lxMM + 20);
        lineLy1.setAttribute("y2", yStart + lyMM);
        lineLy1.setAttribute("stroke", "#666");
        lineLy1.setAttribute("stroke-width", STROKE_WIDTH_DIMENSION);
        lineLy1.setAttribute("stroke-dasharray", `${STROKE_WIDTH_DIMENSION*10},${STROKE_WIDTH_DIMENSION*10}`);
        applyNonScalingStroke(lineLy1);
        svg.appendChild(lineLy1);
        
        const textLy = document.createElementNS(svgNS, "text");
        textLy.setAttribute("x", xStart + lxMM + 40);
        textLy.setAttribute("y", yStart + lyMM/2);
        textLy.setAttribute("text-anchor", "middle");
        textLy.setAttribute("font-size", "12");
        textLy.setAttribute("fill", "#000000");
        textLy.setAttribute("transform", `rotate(-90, ${xStart + lxMM + 40}, ${yStart + lyMM/2})`);
        if (ly > 3 * lx) textLy.textContent = `Ly = ${ly}m (ditampilkan ${lyTerbatas}m)`;
        else textLy.textContent = `Ly = ${ly}m`;
        svg.appendChild(textLy);
        
        if (ly > 3 * lx) {
            const noteText = document.createElementNS(svgNS, "text");
            noteText.setAttribute("x", xStart + lxMM/2);
            noteText.setAttribute("y", yStart + lyMM + 60);
            noteText.setAttribute("text-anchor", "middle");
            noteText.setAttribute("font-size", "10");
            noteText.setAttribute("fill", "#666");
            noteText.setAttribute("font-style", "italic");
            noteText.textContent = `Ly dibatasi untuk tampilan (maks 3×Lx)`;
            svg.appendChild(noteText);
        }
    }

    if (containerId.includes('tumpuan') || !window.cadConfig.activeType) {
        window.config = config;
        window.lingkaranData = [];
        window.cadConfig.activeType = 'fondasi';
    }

    console.log(`✅ Penampang fondasi (${jenis}) berhasil di-render`);
    return { config, containerId };
};

// ==================== FUNGSI CAD TEXT DAN LAIN-LAIN (LENGKAP) ====================
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

function generateCADForFondasiNonCircle(config, offsetX = 0) {
    try {
        const { lx, ly, h, bx, by, jenis } = config;
        const lxMM = lx * 1000;
        const lyMM = ly * 1000;
        const hMM = h * 1000;
        const cadLines = [];
        const addOffset = (x, y) => `${x + offsetX},${y}`;
        if (jenis === 'samping') {
            cadLines.push(`LINE ${addOffset(0, hMM)} ${addOffset(lxMM, hMM)}`);
            cadLines.push(`LINE ${addOffset(0, 0)} ${addOffset(0, hMM)}`);
            cadLines.push(`LINE ${addOffset(lxMM, 0)} ${addOffset(lxMM, hMM)}`);
            const kolomX = (lxMM / 2) - (bx / 2);
            cadLines.push(`LINE ${addOffset(0, 0)} ${addOffset(kolomX, 0)}`);
            cadLines.push(`LINE ${addOffset(kolomX + bx, 0)} ${addOffset(lxMM, 0)}`);
            const kolomY = -by;
            cadLines.push(`LINE ${addOffset(kolomX, 0)} ${addOffset(kolomX, kolomY)}`);
            cadLines.push(`LINE ${addOffset(kolomX, kolomY)} ${addOffset(kolomX + bx, kolomY)} DASHED`);
            cadLines.push(`LINE ${addOffset(kolomX + bx, kolomY)} ${addOffset(kolomX + bx, 0)}`);
        } else if (jenis === 'atas') {
            cadLines.push(`RECTANGLE ${addOffset(0, 0)} ${addOffset(lxMM, lyMM)}`);
            const kolomX = (lxMM / 2) - (bx / 2);
            const kolomY = (lyMM / 2) - (by / 2);
            cadLines.push(`RECTANGLE ${addOffset(kolomX, kolomY)} ${addOffset(kolomX + bx, kolomY + by)} DASHED`);
        }
        return cadLines;
    } catch (error) {
        console.error("Error in generateCADForFondasiNonCircle:", error);
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
        const fondasi = window.cadConfig.fondasi;
        const combinedLines = [];
        
        if (!tumpuan && !lapangan && !kolom && !fondasi) {
            throw new Error("Tidak ada data penampang! Silakan render penampang terlebih dahulu.");
        }
        
        if (fondasi && !tumpuan && !lapangan && !kolom) {
            const fondasiCAD = generateCADForFondasiNonCircle(fondasi, 0);
            combinedLines.push(...fondasiCAD);
        }
        else if (kolom && !tumpuan && !lapangan && !fondasi) {
            const kolomNonCircle = generateCADForKolomNonCircle(kolom, 0);
            combinedLines.push(...kolomNonCircle);
            const kolomCircles = generateCADForKolomCircle(kolom, kolom.lingkaranData || [], 0);
            combinedLines.push(...kolomCircles);
        }
        else if (tumpuan && !lapangan && !kolom && !fondasi) {
            const tumpuanNonCircle = generateCADForPenampangNonCircle(tumpuan, 0);
            combinedLines.push(...tumpuanNonCircle);
            const tumpuanCircles = generateCADForCircle(tumpuan, tumpuan.lingkaranData || [], tumpuan.lingkaranTorsiData || [], 0);
            combinedLines.push(...tumpuanCircles);
        }
        else if (!tumpuan && lapangan && !kolom && !fondasi) {
            const lapanganNonCircle = generateCADForPenampangNonCircle(lapangan, 0);
            combinedLines.push(...lapanganNonCircle);
            const lapanganCircles = generateCADForCircle(lapangan, lapangan.lingkaranData || [], lapangan.lingkaranTorsiData || [], 0);
            combinedLines.push(...lapanganCircles);
        }
        else if (tumpuan && lapangan && !kolom && !fondasi) {
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
    } else if (activeType === 'fondasi') {
        info.lx = config.lx || 0;
        info.ly = config.ly || 0;
        info.h = config.h || 0;
        info.bx = config.bx || 0;
        info.by = config.by || 0;
        info.jenis = config.jenis || 'samping';
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
    } else if (type === 'fondasi' && window.cadConfig.fondasi) {
        window.config = window.cadConfig.fondasi;
        window.lingkaranData = [];
        window.lingkaranTorsiData = [];
        window.cadConfig.activeType = 'fondasi';
        return true;
    }
    return false;
};

window.renderKolomFromStorage = function(containerId = "svg-container-tumpuan") {
    console.log("🔄 Memuat dan merender kolom dari session storage");
    const data = window.loadDataFromStorage('calculationResultKolom') || window.loadDataFromStorage('calculationResult');
    if (!data) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #666;"><p>Data kolom tidak ditemukan di session storage</p><p style="font-size: 0.9rem;">Silakan lakukan perhitungan kolom terlebih dahulu</p></div>`;
        return null;
    }
    const config = createKolomConfigFromData(data);
    if (!config) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><p>❌ Data kolom tidak lengkap.</p><p style="font-size: 0.9rem;">Perhitungan kolom biaxial tidak menyediakan nX dan nY yang valid.</p><p style="font-size: 0.9rem;">Silakan lakukan perhitungan ulang dengan versi terbaru.</p></div>`;
        return null;
    }
    return window.renderPenampangKolom(config, containerId);
};

function createFondasiConfigFromData(data, jenis = 'samping') {
    try {
        console.log("📦 Membuat config fondasi dari data:", data);
        const inputData = data.inputData || {};
        const fondasiData = inputData.fondasi || {};
        const dimensiFondasi = fondasiData.dimensi || {};
        const dataHasil = data.data || {};
        let requiredData = {};
        if (jenis === 'samping') {
            requiredData = {
                lx: dataHasil.parameter?.lx || dataHasil.dimensiOptimal?.Lx || dimensiFondasi.lx,
                h: dataHasil.dimensiOptimal?.h || dimensiFondasi.h,
                bx: parseFloat(dimensiFondasi.bx),
                by: parseFloat(dimensiFondasi.by)
            };
        } else if (jenis === 'atas') {
            requiredData = {
                lx: dataHasil.parameter?.lx || dataHasil.dimensiOptimal?.Lx || dimensiFondasi.lx,
                ly: dataHasil.parameter?.ly || dataHasil.dimensiOptimal?.Ly || dimensiFondasi.ly,
                bx: parseFloat(dimensiFondasi.bx),
                by: parseFloat(dimensiFondasi.by)
            };
        }
        for (const [key, value] of Object.entries(requiredData)) {
            if (value === undefined || value === null || isNaN(value)) {
                console.error(`❌ Data ${key} tidak ditemukan dalam data fondasi`);
                return null;
            }
        }
        const tulangan = inputData.tulangan || {};
        const D = parseFloat(tulangan.d);
        const Db = parseFloat(tulangan.db);
        const s = parseFloat(tulangan.s);
        const config = {
            lx: parseFloat(requiredData.lx),
            ly: parseFloat(requiredData.ly) || 0,
            h: parseFloat(requiredData.h) || 0,
            bx: requiredData.bx,
            by: requiredData.by,
            D: D || undefined,
            Db: Db || undefined,
            s: s || undefined,
            jenis: jenis,
            tipe: 'fondasi',
            source: 'session-storage'
        };
        return config;
    } catch (error) {
        console.error("❌ Error membuat config fondasi:", error);
        return null;
    }
}

window.renderFondasiFromStorage = function(containerId = "svg-container-tumpuan", jenis = 'samping') {
    console.log("🔄 Memuat dan merender fondasi dari session storage");
    const data = window.loadDataFromStorage('calculationResultFondasi') || window.loadDataFromStorage('calculationResult');
    if (!data) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #666;"><p>Data fondasi tidak ditemukan di session storage</p><p style="font-size: 0.9rem;">Silakan lakukan perhitungan fondasi terlebih dahulu</p></div>`;
        return null;
    }
    const config = createFondasiConfigFromData(data, jenis);
    if (!config) return null;
    return window.renderPenampangFondasi(config, containerId);
};

window.exportCADKolom = function() {
    try {
        if (!window.cadConfig.kolom) window.renderKolomFromStorage();
        const cadText = window.generateCADText();
        if (cadText && cadText !== "Error generating CAD text") {
            navigator.clipboard.writeText(cadText).then(() => alert('Text CAD untuk penampang kolom berhasil disalin ke clipboard!'))
                .catch(() => {
                    const textArea = document.createElement('textarea');
                    textArea.value = cadText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Text CAD untuk penampang kolom berhasil disalin ke clipboard!');
                });
        } else alert('Tidak ada data CAD yang dapat diekspor. Silakan render penampang kolom terlebih dahulu.');
    } catch (error) {
        console.error('Error exporting CAD for kolom:', error);
        alert('Error saat mengekspor CAD: ' + error.message);
    }
};

window.exportCADFondasi = function(jenis = 'samping') {
    try {
        if (!window.cadConfig.fondasi || window.cadConfig.fondasi.jenis !== jenis) window.renderFondasiFromStorage('svg-container-tumpuan', jenis);
        const cadText = window.generateCADText();
        if (cadText && cadText !== "Error generating CAD text") {
            navigator.clipboard.writeText(cadText).then(() => alert(`Text CAD untuk penampang fondasi (${jenis}) berhasil disalin ke clipboard!`))
                .catch(() => {
                    const textArea = document.createElement('textarea');
                    textArea.value = cadText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert(`Text CAD untuk penampang fondasi (${jenis}) berhasil disalin ke clipboard!`);
                });
        } else alert('Tidak ada data CAD yang dapat diekspor. Silakan render penampang fondasi terlebih dahulu.');
    } catch (error) {
        console.error('Error exporting CAD for fondasi:', error);
        alert('Error saat mengekspor CAD: ' + error.message);
    }
};

// ==================== FUNGSI RENDER PENAMPANG PELAT (DENGAN KOTAK SKALA DI BAWAH GAMBAR, UKURAN SERAGAM) ====================
window.renderPenampangPelat = function(config, containerId) {
    console.log("🎨 Rendering penampang pelat dengan config:", config, "containerId:", containerId);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container dengan ID '${containerId}' tidak ditemukan`);
        return;
    }
    
    container.innerHTML = "";
    
    // Parameter dasar
    const { jenis, lx, ly, h } = config;
    
    // Konversi ke satuan mm
    let lx_mm = lx * 1000;
    let ly_mm = ly * 1000;
    let h_mm = h;
    
    // Variabel untuk dimensi tampilan
    let width_display, height_display;
    let skala_horizontal = 1, skala_vertikal = 1;
    let needScaleNote = false;
    
    // Batas rasio: tampak atas = 1.5 (2:3), tampak depan/samping = 8 (1:8)
    const RASIO_ATAS_MAKS = 1.5;
    const RASIO_DEPAN_SAMPING_MAKS = 8;
    
    if (jenis === 'atas') {
        let panjang = Math.max(lx_mm, ly_mm);
        let pendek = Math.min(lx_mm, ly_mm);
        if (panjang / pendek > RASIO_ATAS_MAKS) {
            needScaleNote = true;
            const faktor = RASIO_ATAS_MAKS * pendek / panjang;
            if (lx_mm > ly_mm) {
                skala_horizontal = faktor;
                skala_vertikal = 1;
                width_display = lx_mm * faktor;
                height_display = ly_mm;
            } else {
                skala_horizontal = 1;
                skala_vertikal = faktor;
                width_display = lx_mm;
                height_display = ly_mm * faktor;
            }
        } else {
            width_display = lx_mm;
            height_display = ly_mm;
        }
    } 
    else if (jenis === 'depan') {
        let lebar = lx_mm;
        let tinggi = h_mm;
        if (lebar / tinggi > RASIO_DEPAN_SAMPING_MAKS) {
            needScaleNote = true;
            skala_horizontal = RASIO_DEPAN_SAMPING_MAKS * tinggi / lebar;
            skala_vertikal = 1;
            width_display = lebar * skala_horizontal;
            height_display = tinggi;
        } 
        else if (tinggi / lebar > RASIO_DEPAN_SAMPING_MAKS) {
            needScaleNote = true;
            skala_vertikal = RASIO_DEPAN_SAMPING_MAKS * lebar / tinggi;
            skala_horizontal = 1;
            width_display = lebar;
            height_display = tinggi * skala_vertikal;
        } 
        else {
            width_display = lebar;
            height_display = tinggi;
        }
    }
    else if (jenis === 'samping') {
        let lebar = ly_mm;
        let tinggi = h_mm;
        if (lebar / tinggi > RASIO_DEPAN_SAMPING_MAKS) {
            needScaleNote = true;
            skala_horizontal = RASIO_DEPAN_SAMPING_MAKS * tinggi / lebar;
            skala_vertikal = 1;
            width_display = lebar * skala_horizontal;
            height_display = tinggi;
        } 
        else if (tinggi / lebar > RASIO_DEPAN_SAMPING_MAKS) {
            needScaleNote = true;
            skala_vertikal = RASIO_DEPAN_SAMPING_MAKS * lebar / tinggi;
            skala_horizontal = 1;
            width_display = lebar;
            height_display = tinggi * skala_vertikal;
        } 
        else {
            width_display = lebar;
            height_display = tinggi;
        }
    }
    else {
        width_display = lx_mm;
        height_display = ly_mm || h_mm;
    }
    
    // Padding yang cukup untuk teks skala (font 24px, 2 baris)
    const padding = 80;
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
    
    // Gambar kotak utama
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", offsetX);
    rect.setAttribute("y", offsetY);
    rect.setAttribute("width", width_display);
    rect.setAttribute("height", height_display);
    rect.setAttribute("fill", "#f8f9fa");
    rect.setAttribute("stroke", "#000000");
    rect.setAttribute("stroke-width", 3);
    applyNonScalingStroke(rect);
    svg.appendChild(rect);
    
    // Tambahkan keterangan skala jika ada perubahan rasio
    if (needScaleNote) {
        const skalaHVal = (1 / skala_horizontal).toFixed(1);
        const skalaVVal = (1 / skala_vertikal).toFixed(1);
        
        const fontSize = 24;
        const lineHeight = fontSize + 8;
        const bgWidth = 340;
        const bgHeight = lineHeight * 2 + 16;
        // Posisi: di kanan, dan di bawah gambar (tidak menempel tepi viewBox)
        const marginRight = 20;
        const jarakDariGambar = 15; // jarak vertikal dari batas bawah gambar ke kotak skala
        let bgX = viewBoxWidth - bgWidth - marginRight;
        let bgY = offsetY + height_display + jarakDariGambar;
        // Pastikan tidak keluar viewBox (jika terlalu ke bawah, geser ke atas)
        if (bgY + bgHeight > viewBoxHeight - 5) {
            bgY = viewBoxHeight - bgHeight - 5;
        }
        
        // Background semi-transparan
        const textBg = document.createElementNS(svgNS, "rect");
        textBg.setAttribute("x", bgX);
        textBg.setAttribute("y", bgY);
        textBg.setAttribute("width", bgWidth);
        textBg.setAttribute("height", bgHeight);
        textBg.setAttribute("fill", "white");
        textBg.setAttribute("fill-opacity", "0.85");
        textBg.setAttribute("stroke", "#ccc");
        textBg.setAttribute("stroke-width", "1");
        applyNonScalingStroke(textBg);
        svg.appendChild(textBg);
        
        // Posisi label dan nilai - jarak diperlebar
        const labelX = bgX + 12;
        const valueX = bgX + 230;
        
        // Baris 1: Skala Horizontal
        const label1 = document.createElementNS(svgNS, "text");
        label1.setAttribute("x", labelX);
        label1.setAttribute("y", bgY + lineHeight + 4);
        label1.setAttribute("font-size", fontSize);
        label1.setAttribute("fill", "#333");
        label1.setAttribute("font-family", "sans-serif");
        label1.textContent = "Skala Horizontal:";
        svg.appendChild(label1);
        
        const value1 = document.createElementNS(svgNS, "text");
        value1.setAttribute("x", valueX);
        value1.setAttribute("y", bgY + lineHeight + 4);
        value1.setAttribute("font-size", fontSize);
        value1.setAttribute("fill", "#333");
        value1.setAttribute("font-family", "sans-serif");
        value1.textContent = `1 : ${skalaHVal}`;
        svg.appendChild(value1);
        
        // Baris 2: Skala Vertikal
        const label2 = document.createElementNS(svgNS, "text");
        label2.setAttribute("x", labelX);
        label2.setAttribute("y", bgY + lineHeight * 2 + 4);
        label2.setAttribute("font-size", fontSize);
        label2.setAttribute("fill", "#333");
        label2.setAttribute("font-family", "sans-serif");
        label2.textContent = "Skala Vertikal:";
        svg.appendChild(label2);
        
        const value2 = document.createElementNS(svgNS, "text");
        value2.setAttribute("x", valueX);
        value2.setAttribute("y", bgY + lineHeight * 2 + 4);
        value2.setAttribute("font-size", fontSize);
        value2.setAttribute("fill", "#333");
        value2.setAttribute("font-family", "sans-serif");
        value2.textContent = `1 : ${skalaVVal}`;
        svg.appendChild(value2);
    }
    
    console.log(`✅ Penampang pelat (${jenis}) berhasil di-render. Dimensi tampilan: ${width_display} x ${height_display} mm, skala H=${skala_horizontal}, V=${skala_vertikal}`);
    return { config, containerId };
};

// Fungsi export CAD untuk pelat (tampak depan, atas, samping) - output dalam meter
window.exportCADPelatDepan = function() {
    const cfg = window.lastPelatConfig;
    if (!cfg) { alert('Data pelat tidak tersedia. Render ulang laporan.'); return; }
    const cad = `* PELAT TAMPAK DEPAN (Lx=${cfg.lx} m, h=${cfg.h/1000} m)
RECTANGLE 0,0 ${cfg.lx},${cfg.h/1000}`;
    copyToClipboard(cad, 'CAD tampak depan');
};

window.exportCADPelatAtas = function() {
    const cfg = window.lastPelatConfig;
    if (!cfg) { alert('Data pelat tidak tersedia. Render ulang laporan.'); return; }
    const cad = `* PELAT TAMPAK ATAS (Lx=${cfg.lx} m, Ly=${cfg.ly} m)
RECTANGLE 0,0 ${cfg.lx},${cfg.ly}`;
    copyToClipboard(cad, 'CAD tampak atas');
};

window.exportCADSampingPelat = function() {
    const cfg = window.lastPelatConfig;
    if (!cfg) { alert('Data pelat tidak tersedia. Render ulang laporan.'); return; }
    const cad = `* PELAT TAMPAK SAMPING (Ly=${cfg.ly} m, h=${cfg.h/1000} m)
RECTANGLE 0,0 ${cfg.ly},${cfg.h/1000}`;
    copyToClipboard(cad, 'CAD tampak samping');
};

function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Text ${label} berhasil disalin ke clipboard!`);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert(`Text ${label} berhasil disalin ke clipboard!`);
    });
}

// Simpan config global untuk pelat (akan diisi saat render)
window.lastPelatConfig = null;

// Inisialisasi otomatis jika halaman adalah report (bisa dipanggil dari report-pelat.js)
window.addEventListener('DOMContentLoaded', function() {
    const isKolomPage = window.location.pathname.includes('kolom') || document.querySelector('.penampang-section h2')?.textContent.includes('KOLOM');
    const isFondasiPage = window.location.pathname.includes('fondasi') || document.querySelector('.penampang-section h2')?.textContent.includes('FONDASI');
    const isPelatPage = window.location.pathname.includes('pelat') || document.querySelector('.penampang-section h2')?.textContent.includes('PELAT');
    
    if (isKolomPage) {
        setTimeout(() => window.renderKolomFromStorage(), 500);
    } else if (isFondasiPage) {
        setTimeout(() => {
            window.renderFondasiFromStorage('svg-container-tumpuan', 'samping');
            setTimeout(() => window.renderFondasiFromStorage('svg-container-lapangan', 'atas'), 100);
        }, 500);
    }
    // Untuk pelat, render akan dipanggil dari report-pelat.js setelah data tersedia.
});

console.log("✅ cut-generator.js loaded (FINAL: posisi kotak skala di bawah gambar, tidak menempel tepi, ukuran seragam)");