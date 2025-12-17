// ============================================================================
//   calc-pelat.js — versi lengkap dengan sistem kontrol, rekap, dan session storage
// ============================================================================

// --------------------------------------------------------
// 0. UTILITAS & DEFAULTS - DENGAN MODIFIKASI PEMBULATAN 25
// --------------------------------------------------------
function toNum(v, def = 0) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : def;
}
function ceil5(x) { return Math.ceil(x / 5) * 5; }
function floor5(x) { return Math.floor(x / 5) * 5; }
// ⬇️⬇️⬇️ FUNGSI BARU: Pembulatan kelipatan 25 ⬇️⬇️⬇️
function floor25(x) { return Math.floor(x / 25) * 25; }
function ceil25(x) { return Math.ceil(x / 25) * 25; }
// ⬆️⬆️⬆️ FUNGSI BARU: Pembulatan kelipatan 25 ⬆️⬆️⬆️
function clamp(v, minV, maxV){ return Math.max(minV, Math.min(maxV, v)); }
function safeDiv(a,b,def=0){ return b===0?def:a/b }

const DEFAULTS_PELAT = {
    phi: 0.9,
    selimut_default: 20,
    sessionInputKey: 'pelatInput',
    resultKey: 'calculationResultPelat'
};

// --------------------------------------------------------
// 1. PARSER & SESSION HELPERS - DENGAN MODIFIKASI UNTUK MODE MANUAL
// --------------------------------------------------------
function readSessionInputPelat(){
    try {
        const s = sessionStorage.getItem(DEFAULTS_PELAT.sessionInputKey);
        if (!s) return null;
        return JSON.parse(s);
    } catch(e){
        console.warn('Tidak bisa parse session input pelat:', e);
        return null;
    }
}

function parseInputPelat(raw) {
    let data = raw;
    if (!data) {
        data = readSessionInputPelat() || {};
    } else if (typeof raw === "string") {
        try { data = JSON.parse(raw); } catch { data = {}; }
    }

    const dim = data.dimensi || {};
    const beb = data.beban || {};
    const mat = data.material || {};
    const lanj = data.lanjutan || {};
    const tul = data.tulangan || {};

    return {
        module: data.module || "pelat",
        mode: data.mode || "evaluasi",

        dimensi: {
            ly: toNum(dim.ly),
            lx: toNum(dim.lx),
            h:  toNum(dim.h),
            sb: toNum(dim.sb || DEFAULTS_PELAT.selimut_default)
        },

        beban: {
            mode: beb.mode || "manual",
            auto: {
                qu: toNum(beb.auto?.qu),
                tumpuan_type: beb.auto?.tumpuan_type || "",
                pattern_binary: beb.auto?.pattern_binary || "0000"
            },
            manual: {
                mu: toNum(beb.manual?.mu),
                tumpuan_type: beb.manual?.tumpuan_type || ""  // ⬅️ TAMBAHKAN INI
            }
        },

        material: {
            fc: toNum(mat.fc, 20),
            fy: toNum(mat.fy, 300)
        },

        lanjutan: {
            lambda: toNum(lanj.lambda, 1)
        },

        tulangan: {
            d: toNum(tul.d),
            db: toNum(tul.db),
            s: toNum(tul.s),
            sb: toNum(tul.sb)
        },

        raw: data
    };
}

function validatePelat(parsed){
    const problems = [];
    if (parsed.module !== 'pelat') problems.push('Module bukan pelat');
    if (parsed.dimensi.h <= 0) problems.push('Tebal pelat h harus > 0');
    if (parsed.dimensi.lx <= 0) problems.push('Panjang Lx harus > 0');
    if (parsed.dimensi.ly <= 0) problems.push('Panjang Ly harus > 0');
    if (parsed.material.fc <= 0) problems.push('fc harus > 0');
    if (parsed.material.fy <= 0) problems.push('fy harus > 0');
    return problems;
}

// --------------------------------------------------------
// 2. MAPPING PATTERN BINARY → HURUF A–I
// --------------------------------------------------------
function getTumpuanHuruf(pattern) {
    switch (pattern) {
        case "1111": return "A";
        case "0000": return "B";
        case "0011":
        case "1100":
        case "1001":
        case "0110": return "C";
        case "0101": return "D";
        case "1010": return "E";
        case "0111":
        case "1101": return "F";
        case "1011":
        case "1110": return "G";
        case "0100":
        case "0001": return "H";
        case "0010":
        case "1000": return "I";
        default: return "X";
    }
}

// --------------------------------------------------------
// 3. FUNGSI BARU: TENTUKAN JENIS PELAT (SATU ARAH / DUA ARAH)
// --------------------------------------------------------
function getJenisPelat(ly, lx, pattern) {
    const rasio = ly / lx;
    const huruf = getTumpuanHuruf(pattern);
    
    // Kriteria: Ly/Lx > 2.5 ATAU tumpuan jenis D atau E → pelat satu arah
    if (rasio > 2.5 || huruf === "D" || huruf === "E") {
        return "satu_arah";
    } else {
        return "dua_arah";
    }
}

// --------------------------------------------------------
// 4. TABEL MOMEN (sesuai data yang diberikan) + FUNGSI INTERPOLASI
// --------------------------------------------------------
const tabelMomen = {
    "Menerus": {
        "A": {
            "Mtx": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            "Mlx": [44,52,59,66,73,78,84,88,93,97,100,103,106,108,110,112,125],
            "Mly": [44,45,45,44,44,43,41,40,39,38,37,36,35,34,32,32,25],
            "Mty": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        "B": {
            "Mtx": [36,42,46,50,53,56,58,59,60,61,62,62,62,63,63,63,63],
            "Mlx": [36,42,46,50,53,56,58,59,60,61,62,62,62,63,63,63,63],
            "Mly": [36,37,38,38,38,37,36,36,35,35,35,34,34,34,34,34,13],
            "Mty": [36,37,38,38,38,37,36,36,35,35,35,34,34,34,34,34,38]
        },
        "C": {
            "Mtx": [48,55,61,67,71,76,79,82,84,86,88,89,90,91,92,92,94],
            "Mlx": [48,55,61,67,71,76,79,82,84,86,88,89,90,91,92,92,94],
            "Mly": [48,50,51,51,51,51,51,50,50,49,49,49,48,48,47,47,19],
            "Mty": [48,50,51,51,51,51,51,50,50,49,49,49,48,48,47,47,56]
        },
        "D": {
            "Mtx": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            "Mlx": [22,28,34,41,48,55,62,68,74,80,85,89,93,97,100,103,125],
            "Mly": [51,57,62,67,70,73,75,77,78,79,79,79,79,79,79,79,25],
            "Mty": [51,57,62,67,70,73,75,77,78,79,79,79,79,79,79,79,75]
        },
        "E": {
            "Mtx": [51,54,57,59,60,61,62,62,63,63,63,63,63,63,63,63,63],
            "Mlx": [51,54,57,59,60,61,62,62,63,63,63,63,63,63,63,63,63],
            "Mly": [22,20,18,17,15,14,13,12,11,10,10,10,9,9,9,9,13],
            "Mty": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        "F": {
            "Mtx": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            "Mlx": [31,38,45,53,59,66,72,78,83,88,92,96,99,102,105,108,125],
            "Mly": [60,65,69,73,75,77,78,79,79,80,80,80,79,79,79,79,25],
            "Mty": [60,65,69,73,75,77,78,79,79,80,80,80,79,79,79,79,75]
        },
        "G": {
            "Mtx": [60,66,71,76,79,82,85,87,88,89,90,91,91,92,92,93,94],
            "Mlx": [60,66,71,76,79,82,85,87,88,89,90,91,91,92,92,93,94],
            "Mly": [31,30,28,27,25,24,22,21,20,19,18,17,17,16,16,15,12],
            "Mty": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        "H": {
            "Mtx": [38,46,53,59,65,69,73,77,80,83,85,86,87,88,89,90,54],
            "Mlx": [38,46,53,59,65,69,73,77,80,83,85,86,87,88,89,90,54],
            "Mly": [43,46,48,50,51,51,51,51,50,50,50,49,49,48,48,48,19],
            "Mty": [43,46,48,50,51,51,51,51,50,50,50,49,49,48,48,48,56]
        },
        "I": {
            "Mtx": [13,48,51,55,57,58,60,61,62,62,62,63,63,63,63,63,63],
            "Mlx": [13,48,51,55,57,58,60,61,62,62,62,63,63,63,63,63,63],
            "Mly": [38,39,38,38,37,36,36,35,35,34,34,34,33,33,33,33,13],
            "Mty": [38,39,38,38,37,36,36,35,35,34,34,34,33,33,33,33,38]
        }
    },
    "Penuh": {
        "A": {
            "Mtx": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            "Mlx": [44,52,59,66,73,78,84,88,93,97,100,103,106,108,110,112,125],
            "Mly": [44,45,45,44,44,43,41,40,39,38,37,36,35,34,32,32,25],
            "Mty": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        "B": {
            "Mtx": [52,59,64,69,73,76,79,81,82,83,83,83,83,83,83,83,83],
            "Mlx": [21,25,28,31,34,36,37,38,40,40,41,41,41,42,42,42,42],
            "Mly": [21,21,20,19,18,17,16,14,13,12,12,11,11,11,10,10,8],
            "Mty": [52,54,56,57,57,57,57,57,57,57,57,57,57,57,57,57,57]
        },
        "C": {
            "Mtx": [68,77,85,92,98,103,107,111,113,116,118,119,120,121,122,122,125],
            "Mlx": [28,33,38,42,45,48,51,53,55,57,58,59,59,60,61,61,63],
            "Mly": [28,28,28,27,26,25,23,23,22,21,19,18,17,17,16,16,43],
            "Mty": [68,72,74,76,77,77,78,78,78,78,79,79,79,79,79,79,79]
        },
        "D": {
            "Mtx": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            "Mlx": [22,28,34,42,49,55,62,68,74,80,85,89,93,97,100,103,125],
            "Mly": [32,35,37,39,40,41,41,41,41,40,39,38,37,36,35,35,25],
            "Mty": [70,79,87,94,100,105,109,112,115,117,119,120,121,122,123,123,125]
        },
        "E": {
            "Mtx": [70,74,77,79,81,82,83,84,84,84,84,84,83,83,83,83,83],
            "Mlx": [32,34,36,38,39,40,41,41,42,42,42,42,42,42,42,42,42],
            "Mly": [22,20,18,17,15,14,13,12,11,10,10,10,9,9,9,9,8],
            "Mty": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        "F": {
            "Mtx": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            "Mlx": [31,38,45,53,60,66,72,78,83,88,92,96,99,102,105,108,125],
            "Mly": [37,39,41,41,42,42,41,41,40,39,38,37,36,35,34,33,25],
            "Mty": [84,92,99,104,109,112,115,117,119,121,122,122,123,123,124,124,125]
        },
        "G": {
            "Mtx": [84,92,98,103,108,111,114,117,119,120,121,122,122,123,123,124,125],
            "Mlx": [37,41,45,48,51,53,55,56,56,59,60,60,60,61,61,62,63],
            "Mly": [31,30,28,27,25,24,22,21,20,19,18,17,17,16,16,15,13],
            "Mty": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        "H": {
            "Mtx": [55,65,74,82,89,94,99,103,106,110,114,116,117,118,119,120,125],
            "Mlx": [21,26,31,36,40,43,46,49,51,53,55,56,57,58,59,60,63],
            "Mly": [26,27,28,28,27,26,25,23,22,21,21,20,20,19,19,18,13],
            "Mty": [60,65,69,72,74,76,77,78,78,78,78,78,78,78,78,79,79]
        },
        "I": {
            "Mtx": [60,66,71,74,77,79,80,82,83,83,83,83,83,83,83,83,83],
            "Mlx": [26,29,32,35,36,38,39,40,40,41,41,42,42,42,42,42,42],
            "Mly": [21,20,19,18,17,15,14,13,12,12,11,11,10,10,10,10,8],
            "Mty": [55,57,57,57,58,57,57,57,57,57,57,57,57,57,57,57,57]
        }
    }
};

function getTabelMomen(kondisi, tumpuan, momen, lyLx) {
    const kondisiKey = kondisi === 'Menerus' ? 'Menerus' : 'Penuh';
    const tumpuanKey = tumpuan.toUpperCase();
    const momenKey = momen.charAt(0).toUpperCase() + momen.slice(1).toLowerCase();

    // Nilai rasio Ly/Lx yang tersedia dalam tabel
    const lyLxValues = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6];
    
    try {
        // Cek apakah data tersedia
        if (!tabelMomen[kondisiKey] || !tabelMomen[kondisiKey][tumpuanKey] || !tabelMomen[kondisiKey][tumpuanKey][momenKey]) {
            throw new Error("Kombinasi parameter tumpuan/momen tidak valid.");
        }
        
        const nilaiTabel = tabelMomen[kondisiKey][tumpuanKey][momenKey];
        
        // Jika lyLx persis sama dengan salah satu nilai dalam tabel
        const exactIndex = lyLxValues.findIndex(val => Math.abs(val - lyLx) < 0.001);
        if (exactIndex !== -1) {
            return nilaiTabel[exactIndex];
        }
        
        // Jika lyLx di luar rentang tabel
        if (lyLx <= lyLxValues[0]) {
            return nilaiTabel[0];
        }
        if (lyLx >= lyLxValues[lyLxValues.length - 1]) {
            return nilaiTabel[nilaiTabel.length - 1];
        }
        
        // Cari dua titik terdekat untuk interpolasi
        let indexBawah = -1;
        let indexAtas = -1;
        
        for (let i = 0; i < lyLxValues.length - 1; i++) {
            if (lyLx >= lyLxValues[i] && lyLx <= lyLxValues[i + 1]) {
                indexBawah = i;
                indexAtas = i + 1;
                break;
            }
        }
        
        // Jika tidak ditemukan (seharusnya tidak terjadi)
        if (indexBawah === -1 || indexAtas === -1) {
            return nilaiTabel[nilaiTabel.length - 1];
        }
        
        // Interpolasi linear
        const x0 = lyLxValues[indexBawah];
        const x1 = lyLxValues[indexAtas];
        const y0 = nilaiTabel[indexBawah];
        const y1 = nilaiTabel[indexAtas];
        
        // Rumus interpolasi linear: y = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
        const hasilInterpolasi = y0 + (y1 - y0) * (lyLx - x0) / (x1 - x0);
        
        console.log(`📊 Interpolasi: Ly/Lx = ${lyLx}, ${x0}->${y0}, ${x1}->${y1}, hasil = ${hasilInterpolasi.toFixed(2)}`);
        
        return hasilInterpolasi;
        
    } catch (error) {
        console.error("Error dalam getTabelMomen:", error);
        throw new Error("Kombinasi parameter tumpuan/momen tidak valid atau terjadi kesalahan interpolasi.");
    }
}

// --------------------------------------------------------
// 5. TEMPLATE TULANGAN POKOK (dipakai X & Y) - DENGAN MODIFIKASI UNTUK MODE EVALUASI
// --------------------------------------------------------
function hitungTulanganPokok({
    Mu, b, d, fc, fy, D, h,
    arahDuaArah = true,
    mode = 'desain', // Parameter baru untuk mode
    s_input = null   // Parameter baru untuk input spasi (hanya untuk mode evaluasi)
}) {
    const phi = DEFAULTS_PELAT.phi;

    const K = (Mu * 1e6) / (phi * b * d * d);

    const val = 1 - (2 * K) / (0.85 * fc);
    const a = val < 0 ? d : (1 - Math.sqrt(Math.max(0, val))) * d;

    const As1 = 0.85 * fc * a * b / fy;
    const As2 = (Math.sqrt(fc) / (4 * fy)) * b * d;
    const As3 = 1.4 * b * d / fy;

    const As = Math.max(As1, As2, As3);

    let s, s1, s2, s3;

    // ⬇️⬇️⬇️ MODIFIKASI: Perbedaan perhitungan berdasarkan mode ⬇️⬇️⬇️
    if (mode === 'evaluasi' && s_input !== null) {
        // Mode evaluasi: gunakan spasi dari input langsung
        s = s_input;
        s1 = s2 = s3 = s; // Untuk konsistensi output
    } else {
        // Mode desain: hitung spasi seperti biasa dengan pembulatan
        s1 = (0.25 * Math.PI * D * D * b) / As;
        s2 = arahDuaArah ? (2 * h) : (3 * h);
        s3 = 450;

        const sMin = Math.min(s1, s2, s3);
        s = floor25(sMin);
        
        // Batasi spasi minimum 100mm (hanya untuk mode desain)
        s = Math.max(s, 100);
    }

    // Hitung momen nominal dan desain
    const a_desain = (As * fy) / (0.85 * fc * b);
    const Mn = (As * fy * (d - a_desain/2)) / 1e6;
    const Md = phi * Mn;

    // Hitung As terpasang berdasarkan spasi aktual
    const As_terpasang = (0.25 * Math.PI * D * D * b) / s;

    return {
        K, a,
        As1, As2, As3,
        AsDigunakan: As,
        AsTerpasang: As_terpasang,
        s1, s2, s3,
        sDigunakan: s,
        Mn, Md, Mu,
        a_desain
    };
}

// --------------------------------------------------------
// 6. TEMPLATE TULANGAN BAGI (dipakai X & Y) - DENGAN MODIFIKASI UNTUK MODE EVALUASI
// --------------------------------------------------------
function hitungTulanganBagi({
    As_pokok, b, h, fc, fy, Db,
    mode = 'desain', // Parameter baru untuk mode
    s_input = null   // Parameter baru untuk input spasi (hanya untuk mode evaluasi)
}) {
    const Asb1 = As_pokok / 5;

    let Asb2;
    if (fy <= 350) {
        Asb2 = 0.002 * b * h;
    } else if (fy < 420) {
        Asb2 = (0.002 - (fy - 350) / 350000) * b * h;
    } else {
        Asb2 = 0.0018 * b * h * (420 / fy);
    }

    const Asb3 = 0.0014 * b * h;
    const Asb = Math.max(Asb1, Asb2, Asb3);

    let s, s1, s2, s3;

    // ⬇️⬇️⬇️ MODIFIKASI: Perbedaan perhitungan berdasarkan mode ⬇️⬇️⬇️
    if (mode === 'evaluasi' && s_input !== null) {
        // Mode evaluasi: gunakan spasi dari input langsung
        s = s_input;
        s1 = s2 = s3 = s; // Untuk konsistensi output
    } else {
        // Mode desain: hitung spasi seperti biasa dengan pembulatan
        s1 = 0.25 * Math.PI * Db * Db * 1000 / Asb;
        s2 = 5 * h;
        s3 = 450;

        const sMin = Math.min(s1, s2, s3);
        s = floor25(sMin);
        
        // Batasi spasi minimum 100mm (hanya untuk mode desain)
        s = Math.max(s, 100);
    }

    // Hitung Av,u berdasarkan rumus baru
    const Av_u = (Math.PI * Db * Db * s) / (4 * 1000);
    const Asb_terpasang = (0.25 * Math.PI * Db * Db * 1000) / s;

    return {
        Asb1, Asb2, Asb3,
        AsbDigunakan: Asb,
        AsbTerpasang: Asb_terpasang,
        Av_u: Av_u,
        s1, s2, s3,
        sDigunakan: s
    };
}

// --------------------------------------------------------
// 7. FUNGSI INTI: hitungPelat() - DENGAN MODIFIKASI UNTUK MODE MANUAL
// --------------------------------------------------------
function hitungPelat(p) {
    const { dimensi, beban, material, lanjutan, tulangan } = p;

    const Ly = dimensi.ly;
    const Lx = dimensi.lx;
    const h  = dimensi.h;
    const Sb = dimensi.sb;
    const fc = material.fc;
    const fy = material.fy;

    // =============== PARAMETER ===============
    const Sn = Math.max(25, 1.5 * tulangan.d);
    const ds = ceil5(Sb + tulangan.d / 2);
    const ds2 = ceil5(Sn + tulangan.d);
    const d = h - ds;
    const d2 = h - ds2;

    let beta1;
    if (fc <= 28) beta1 = 0.85;
    else if (fc >= 55) beta1 = 0.65;
    else beta1 = 0.85 - 0.05 * (fc - 28) / 7;

    const rasioLyLx = Ly / Lx;
    const rasioTabel = rasioLyLx > 2.5 ? 2.6 : rasioLyLx;

    let Mtx, Mlx, Mly, Mty;
    let kondisi, tumpuanHuruf, Ctx, Clx, Cly, Cty;
    let jenisPelat = "dua_arah"; // Default

    // ⬇️⬇️⬇️ MODIFIKASI BESAR: Handle mode manual dengan input tp ⬇️⬇️⬇️
    if (beban.mode === "manual") {
        const tumpuanManual = beban.manual.tumpuan_type;
        
        // Tentukan jenis pelat berdasarkan input manual
        if (tumpuanManual === "Satu Arah" || tumpuanManual === "Kantilever") {
            jenisPelat = "satu_arah";
        } else if (tumpuanManual === "Dua Arah") {
            jenisPelat = "dua_arah";
        } else {
            jenisPelat = "dua_arah"; // Default jika kosong
        }
        
        // Untuk mode manual, gunakan nilai Mu langsung
        // Untuk pelat satu arah, momen hanya di arah X
        if (jenisPelat === "satu_arah") {
            Mtx = beban.manual.mu;
            Mlx = beban.manual.mu;
            Mly = 0;
            Mty = 0;
        } else {
            // Untuk pelat dua arah, gunakan Mu untuk semua arah
            Mtx = Mlx = Mly = Mty = beban.manual.mu;
        }
        
        kondisi = "Manual";
        tumpuanHuruf = "-";
        Ctx = Clx = Cly = Cty = 0;
        
        console.log(`🔍 Mode Manual - Jenis Pelat: ${jenisPelat}, Mu: ${beban.manual.mu} kNm/m`);
        
    } else {
        // Mode Auto
        const pattern = beban.auto.pattern_binary || "0000";
        tumpuanHuruf = getTumpuanHuruf(pattern);
        kondisi = beban.auto.tumpuan_type.includes("Penuh") ? "Penuh" : "Menerus";
        
        // Tentukan jenis pelat berdasarkan rasio dan tumpuan (auto)
        jenisPelat = getJenisPelat(Ly, Lx, pattern);
        console.log(`🔍 Mode Auto - Jenis Pelat: ${jenisPelat} (Ly/Lx = ${rasioLyLx.toFixed(2)}, Tumpuan = ${tumpuanHuruf})`);

        if (jenisPelat === "satu_arah") {
            // =============== PERHITUNGAN PELAT SATU ARAH ===============
            // Untuk pelat satu arah, momen hanya dihitung dalam arah Lx
            // Momen tumpuan dan lapangan arah X
            const qu = beban.auto.qu;
            
            // Koefisien momen untuk pelat satu arah
            // Asumsi: tumpuan sederhana (sendi-sendi)
            Mtx = 0; // Tumpuan
            Mlx = (qu * Lx * Lx) / 8; // Lapangan
            Mly = 0; // Tidak ada momen arah Y
            Mty = 0; // Tidak ada momen arah Y
            
            Ctx = Clx = Cly = Cty = 0;
            
            console.log(`📐 Pelat Satu Arah - Mlx: ${Mlx.toFixed(3)} kNm/m`);
            
        } else {
            // =============== PERHITUNGAN PELAT DUA ARAH ===============
            Ctx = getTabelMomen(kondisi, tumpuanHuruf, "Mtx", rasioTabel);
            Clx = getTabelMomen(kondisi, tumpuanHuruf, "Mlx", rasioTabel);
            Cly = getTabelMomen(kondisi, tumpuanHuruf, "Mly", rasioTabel);
            Cty = getTabelMomen(kondisi, tumpuanHuruf, "Mty", rasioTabel);

            // Hitung momen dari beban terfaktor
            Mtx = 0.001 * beban.auto.qu * (Lx ** 2) * Ctx;
            Mlx = 0.001 * beban.auto.qu * (Lx ** 2) * Clx;
            Mly = 0.001 * beban.auto.qu * (Lx ** 2) * Cly;
            Mty = 0.001 * beban.auto.qu * (Lx ** 2) * Cty;
        }
    }
    // ⬆️⬆️⬆️ MODIFIKASI BESAR: Handle mode manual dengan input tp ⬆️⬆️⬆️

    // =============== Tulangan Pokok ===============
    const pokokX = hitungTulanganPokok({
        Mu: Math.max(Mtx, Mlx), b: 1000, d, fc, fy,
        D: tulangan.d, h,
        arahDuaArah: (jenisPelat === "dua_arah"),
        mode: p.mode, // ⬅️ TAMBAH PARAMETER MODE
        s_input: (p.mode === 'evaluasi') ? tulangan.s : null // ⬅️ TAMBAH INPUT SPASI UNTUK EVALUASI
    });

    const pokokY = hitungTulanganPokok({
        Mu: Math.max(Mly, Mty), b: 1000, d: d2, fc, fy,
        D: tulangan.d, h,
        arahDuaArah: (jenisPelat === "dua_arah"),
        mode: p.mode, // ⬅️ TAMBAH PARAMETER MODE
        s_input: (p.mode === 'evaluasi') ? tulangan.s : null // ⬅️ TAMBAH INPUT SPASI UNTUK EVALUASI
    });

    // =============== Tulangan Bagi ===============
    const bagiX = hitungTulanganBagi({
        As_pokok: pokokX.AsDigunakan,
        b: 1000, h, fc, fy, Db: tulangan.db,
        mode: p.mode, // ⬅️ TAMBAH PARAMETER MODE
        s_input: (p.mode === 'evaluasi') ? tulangan.sb : null // ⬅️ TAMBAH INPUT SPASI UNTUK EVALUASI
    });

    const bagiY = hitungTulanganBagi({
        As_pokok: pokokY.AsDigunakan,
        b: 1000, h, fc, fy, Db: tulangan.db,
        mode: p.mode, // ⬅️ TAMBAH PARAMETER MODE
        s_input: (p.mode === 'evaluasi') ? tulangan.sb : null // ⬅️ TAMBAH INPUT SPASI UNTUK EVALUASI
    });

    // ⬇️⬇️⬇️ MODIFIKASI: Penyamaan spasi hanya untuk mode desain ⬇️⬇️⬇️
    if (p.mode === 'desain') {
        // =============== SAMAKAN SPASI TULANGAN POKOK ===============
        const s_pokok_terkecil = Math.min(pokokX.sDigunakan, pokokY.sDigunakan);
        
        // Update kedua arah dengan spasi terkecil
        pokokX.sDigunakan = s_pokok_terkecil;
        pokokY.sDigunakan = s_pokok_terkecil;
        
        // Hitung ulang AsTerpasang dengan spasi yang disamakan
        pokokX.AsTerpasang = (0.25 * Math.PI * tulangan.d * tulangan.d * 1000) / s_pokok_terkecil;
        pokokY.AsTerpasang = (0.25 * Math.PI * tulangan.d * tulangan.d * 1000) / s_pokok_terkecil;

        // =============== SAMAKAN SPASI TULANGAN BAGI ===============
        const s_bagi_terkecil = Math.min(bagiX.sDigunakan, bagiY.sDigunakan);
        
        // Update kedua arah dengan spasi terkecil
        bagiX.sDigunakan = s_bagi_terkecil;
        bagiY.sDigunakan = s_bagi_terkecil;
        
        // Hitung ulang AsbTerpasang dengan spasi yang disamakan
        bagiX.AsbTerpasang = (0.25 * Math.PI * tulangan.db * tulangan.db * 1000) / s_bagi_terkecil;
        bagiY.AsbTerpasang = (0.25 * Math.PI * tulangan.db * tulangan.db * 1000) / s_bagi_terkecil;
        
        // Hitung ulang Av,u dengan spasi yang disamakan
        bagiX.Av_u = (Math.PI * tulangan.db * tulangan.db * s_bagi_terkecil) / (4 * 1000);
        bagiY.Av_u = (Math.PI * tulangan.db * tulangan.db * s_bagi_terkecil) / (4 * 1000);
    }
    // ⬆️⬆️⬆️ MODIFIKASI: Penyamaan spasi hanya untuk mode desain ⬆️⬆️⬆️

    // =============== Kmaks (untuk evaluasi dimensi) ===============
    const Kmaks = (382.5 * beta1 * fc * (600 + fy - 225 * beta1)) / ((600 + fy) ** 2);

    // ⬇️⬇️⬇️ TAMBAHKAN INFORMASI TUMPUAN MANUAL KE TABEL ⬇️⬇️⬇️
    return {
        geometri: { Ly, Lx, h, Sb, rasioLyLx },
        parameter: { Sn, ds, ds2, d, d2, beta1, Kmaks, fc, fy },
        tabel: { 
            kondisi, 
            tumpuanHuruf, 
            rasioTabel, 
            Ctx, Clx, Cly, Cty, 
            jenisPelat,
            tumpuanManual: beban.mode === "manual" ? beban.manual.tumpuan_type : null // ⬅️ SIMPAN INFORMASI TUMPUAN MANUAL
        },
        momen: { Mtx, Mlx, Mly, Mty },
        tulangan: {
            pokokX,
            pokokY,
            bagiX,
            bagiY
        }
    };
}

// --------------------------------------------------------
// 8. SISTEM KONTROL PELAT
// --------------------------------------------------------
function kontrolLenturPelat(hasilTulangan, momen, parameter) {
    // Kontrol untuk arah X (Mtx dan Mlx)
    const As_terpasang_aman_X = hasilTulangan.pokokX.AsTerpasang >= hasilTulangan.pokokX.AsDigunakan;
    const kontrolX = {
        K_aman: hasilTulangan.pokokX.K <= parameter.Kmaks,
        Md_aman: hasilTulangan.pokokX.Md >= Math.max(momen.Mtx, momen.Mlx),
        As_terpasang_aman: As_terpasang_aman_X,
        detail: {
            K: hasilTulangan.pokokX.K,
            Kmaks: parameter.Kmaks,
            Md: hasilTulangan.pokokX.Md,
            Mu: Math.max(momen.Mtx, momen.Mlx),
            As_terpasang: hasilTulangan.pokokX.AsTerpasang,
            As_dibutuhkan: hasilTulangan.pokokX.AsDigunakan,
            As_terpasang_aman: As_terpasang_aman_X
        }
    };

    // Kontrol untuk arah Y (Mly dan Mty)
    const As_terpasang_aman_Y = hasilTulangan.pokokY.AsTerpasang >= hasilTulangan.pokokY.AsDigunakan;
    const kontrolY = {
        K_aman: hasilTulangan.pokokY.K <= parameter.Kmaks,
        Md_aman: hasilTulangan.pokokY.Md >= Math.max(momen.Mly, momen.Mty),
        As_terpasang_aman: As_terpasang_aman_Y,
        detail: {
            K: hasilTulangan.pokokY.K,
            Kmaks: parameter.Kmaks,
            Md: hasilTulangan.pokokY.Md,
            Mu: Math.max(momen.Mly, momen.Mty),
            As_terpasang: hasilTulangan.pokokY.AsTerpasang,
            As_dibutuhkan: hasilTulangan.pokokY.AsDigunakan,
            As_terpasang_aman: As_terpasang_aman_Y
        }
    };

    return {
        arahX: kontrolX,
        arahY: kontrolY,
        ok: kontrolX.K_aman && kontrolX.Md_aman && kontrolX.As_terpasang_aman && 
            kontrolY.K_aman && kontrolY.Md_aman && kontrolY.As_terpasang_aman
    };
}

function kontrolTulanganBagiPelat(hasilTulangan) {
    // Kontrol untuk arah X
    const Asb_terpasang_aman_X = hasilTulangan.bagiX.AsbTerpasang >= hasilTulangan.bagiX.AsbDigunakan;
    const kontrolBagiX = {
        As_aman: hasilTulangan.bagiX.AsbTerpasang >= hasilTulangan.bagiX.Asb1 &&
                hasilTulangan.bagiX.AsbTerpasang >= hasilTulangan.bagiX.Asb2 &&
                hasilTulangan.bagiX.AsbTerpasang >= hasilTulangan.bagiX.Asb3,
        As_terpasang_aman: Asb_terpasang_aman_X,
        detail: {
            As_terpasang: hasilTulangan.bagiX.AsbTerpasang,
            As_dibutuhkan: hasilTulangan.bagiX.AsbDigunakan,
            As_terpasang_aman: Asb_terpasang_aman_X,
            As_min1: hasilTulangan.bagiX.Asb1,
            As_min2: hasilTulangan.bagiX.Asb2,
            As_min3: hasilTulangan.bagiX.Asb3,
            Av_u: hasilTulangan.bagiX.Av_u
        }
    };

    // Kontrol untuk arah Y
    const Asb_terpasang_aman_Y = hasilTulangan.bagiY.AsbTerpasang >= hasilTulangan.bagiY.AsbDigunakan;
    const kontrolBagiY = {
        As_aman: hasilTulangan.bagiY.AsbTerpasang >= hasilTulangan.bagiY.Asb1 &&
                hasilTulangan.bagiY.AsbTerpasang >= hasilTulangan.bagiY.Asb2 &&
                hasilTulangan.bagiY.AsbTerpasang >= hasilTulangan.bagiY.Asb3,
        As_terpasang_aman: Asb_terpasang_aman_Y,
        detail: {
            As_terpasang: hasilTulangan.bagiY.AsbTerpasang,
            As_dibutuhkan: hasilTulangan.bagiY.AsbDigunakan,
            As_terpasang_aman: Asb_terpasang_aman_Y,
            As_min1: hasilTulangan.bagiY.Asb1,
            As_min2: hasilTulangan.bagiY.Asb2,
            As_min3: hasilTulangan.bagiY.Asb3,
            Av_u: hasilTulangan.bagiY.Av_u
        }
    };

    return {
        arahX: kontrolBagiX,
        arahY: kontrolBagiY,
        ok: kontrolBagiX.As_aman && kontrolBagiX.As_terpasang_aman && 
            kontrolBagiY.As_aman && kontrolBagiY.As_terpasang_aman
    };
}

function isKontrolAmanPelat(kontrol) {
    if (!kontrol) return false;
    const lentur = kontrol.lentur;
    const bagi = kontrol.bagi;
    if (!lentur || !bagi) return false;
    
    // Periksa semua kondisi termasuk kontrol As terpasang yang baru
    const lentur_aman = lentur.ok && 
                      lentur.arahX.As_terpasang_aman && 
                      lentur.arahY.As_terpasang_aman;
    
    const bagi_aman = bagi.ok && 
                     bagi.arahX.As_terpasang_aman && 
                     bagi.arahY.As_terpasang_aman;
    
    return lentur_aman && bagi_aman;
}

// --------------------------------------------------------
// 9. REKAP SEMUA HASIL - DENGAN INFORMASI JENIS PELAT YANG LEBIH DETAIL
// --------------------------------------------------------
function rekapPelatAll(parsed, hasil) {
    const formatTulangan = (s, D) => {
        if (!s || s === 0) return "-";
        return `D${D}-${s}`;
    };

    // ⬇️⬇️⬇️ TAMBAHKAN LOGIKA UNTUK JENIS PELAT YANG LEBIH DETAIL ⬇️⬇️⬇️
    let jenis_pelat_str;
    
    if (parsed.beban.mode === "manual") {
        // Untuk mode manual, gunakan input user langsung
        const tumpuanManual = parsed.beban.manual.tumpuan_type;
        if (tumpuanManual === "Satu Arah") {
            jenis_pelat_str = "Pelat Satu Arah";
        } else if (tumpuanManual === "Dua Arah") {
            jenis_pelat_str = "Pelat Dua Arah";
        } else if (tumpuanManual === "Kantilever") {
            jenis_pelat_str = "Pelat Kantilever";
        } else {
            jenis_pelat_str = "Pelat Dua Arah (default)";
        }
    } else {
        // Untuk mode auto, gunakan hasil deteksi
        if (hasil.tabel.jenisPelat === "satu_arah") {
            jenis_pelat_str = "Pelat Satu Arah";
        } else {
            jenis_pelat_str = "Pelat Dua Arah";
        }
    }

    const rekap = {
        input: parsed.raw,
        geometri: hasil.geometri,
        parameter: hasil.parameter,
        tabel: hasil.tabel,
        momen: hasil.momen,
        tulangan: {
            pokokX: hasil.tulangan.pokokX,
            pokokY: hasil.tulangan.pokokY,
            bagiX: hasil.tulangan.bagiX,
            bagiY: hasil.tulangan.bagiY
        },
        formatted: {
            // ⬇️⬇️⬇️ INFO BARU: Jenis Pelat dengan informasi lebih detail ⬇️⬇️⬇️
            jenis_pelat: jenis_pelat_str,
            jenis_pelat_kode: hasil.tabel.jenisPelat,
            tumpuan_manual: parsed.beban.mode === "manual" ? parsed.beban.manual.tumpuan_type : null,
            beban_mode: parsed.beban.mode,
            dimensi: `${hasil.geometri.Lx} x ${hasil.geometri.Ly} x ${hasil.geometri.h}`,
            tulangan_pokok_x: formatTulangan(
                hasil.tulangan.pokokX.sDigunakan,
                parsed.tulangan.d
            ),
            tulangan_pokok_y: formatTulangan(
                hasil.tulangan.pokokY.sDigunakan,
                parsed.tulangan.d
            ),
            tulangan_bagi_x: formatTulangan(
                hasil.tulangan.bagiX.sDigunakan,
                parsed.tulangan.db
            ),
            tulangan_bagi_y: formatTulangan(
                hasil.tulangan.bagiY.sDigunakan,
                parsed.tulangan.db
            ),
            rasio_ly_lx: `${hasil.geometri.rasioLyLx.toFixed(2)}`,
            tumpuan: `${hasil.tabel.kondisi} - ${hasil.tabel.tumpuanHuruf}`,
            momen_tx: `Mtx = ${hasil.momen.Mtx.toFixed(3)} kNm/m`,
            momen_lx: `Mlx = ${hasil.momen.Mlx.toFixed(3)} kNm/m`,
            momen_ty: `Mty = ${hasil.momen.Mty.toFixed(3)} kNm/m`,
            momen_ly: `Mly = ${hasil.momen.Mly.toFixed(3)} kNm/m`,
            av_u_x: `Av,u(X) = ${hasil.tulangan.bagiX.Av_u.toFixed(4)} mm²/mm`,
            av_u_y: `Av,u(Y) = ${hasil.tulangan.bagiY.Av_u.toFixed(4)} mm²/mm`,
            as_terpasang_x: `As(X) = ${hasil.tulangan.pokokX.AsTerpasang.toFixed(1)} mm²/m`,
            as_terpasang_y: `As(Y) = ${hasil.tulangan.pokokY.AsTerpasang.toFixed(1)} mm²/m`,
            asb_terpasang_x: `Asb(X) = ${hasil.tulangan.bagiX.AsbTerpasang.toFixed(1)} mm²/m`,
            asb_terpasang_y: `Asb(Y) = ${hasil.tulangan.bagiY.AsbTerpasang.toFixed(1)} mm²/m`
        }
    };

    return rekap;
}

// --------------------------------------------------------
// 10. SESSION STORAGE & REDIRECT
// --------------------------------------------------------
function saveColorSettings() {
    const colorSettings = {
        bgBody: getComputedStyle(document.documentElement).getPropertyValue('--bg-body').trim(),
        colorButtons: getComputedStyle(document.documentElement).getPropertyValue('--color-buttons').trim(),
        colorBorders: getComputedStyle(document.documentElement).getPropertyValue('--color-borders').trim(),
        colorLabels: getComputedStyle(document.documentElement).getPropertyValue('--color-labels').trim(),
        buttonTextColor: getComputedStyle(document.documentElement).getPropertyValue('--button-text-color').trim(),
        toggleTextColor: getComputedStyle(document.documentElement).getPropertyValue('--toggle-text-color').trim(),
        toggleActiveTextColor: getComputedStyle(document.documentElement).getPropertyValue('--toggle-active-text-color').trim()
    };
    
    sessionStorage.setItem('colorSettings', JSON.stringify(colorSettings));
    console.log("✅ Warna pelat disimpan ke sessionStorage");
}

function saveResultAndRedirectPelat(result, inputData) {
    try {
        sessionStorage.setItem(DEFAULTS_PELAT.resultKey, JSON.stringify({
            module: inputData.module || 'pelat',
            mode: inputData.mode || 'evaluasi',
            data: result.data,
            kontrol: result.kontrol,
            rekap: result.rekap,
            timestamp: new Date().toISOString(),
            inputData: inputData
        }));
        saveColorSettings();
        if (typeof window !== 'undefined') {
            window.location.href = 'report.html';
        }
    } catch(e) {
        console.warn('Gagal simpan result pelat:', e);
    }
}

// --------------------------------------------------------
// 11. HIGH-LEVEL CALCULATOR - DENGAN VALIDASI DIAMETER MINIMUM 10mm HANYA UNTUK DESAIN
// --------------------------------------------------------
async function calculatePelat(rawInput, options = {}) {
    // Parse & validate
    const parsed = parseInputPelat(rawInput);
    const problems = validatePelat(parsed);
    if (problems.length) return { status: 'error', problems, parsed };

    const mode = parsed.mode;
    let D, db;

    // If mode desain -> call optimizer
    if (mode === 'desain') {
        console.log("🚀 MODE DESAIN - Memanggil optimizer...");
        
        if (typeof window !== 'undefined' && typeof window.optimizePelat === 'function') {
            try {
                const optInput = { 
                    parsed, 
                    options,
                    fc: parsed.material.fc,
                    fy: parsed.material.fy,
                    h: parsed.dimensi.h,
                    lx: parsed.dimensi.lx,
                    ly: parsed.dimensi.ly,
                    sb: parsed.dimensi.sb,
                    beban: parsed.beban.auto.qu
                };
                
                console.log("📤 Input ke optimizer:", optInput);
                const optRes = await Promise.resolve(window.optimizePelat(optInput));
                console.log("📥 Hasil dari optimizer:", optRes);
                
                // ⬇️⬇️⬇️ MODIFIKASI: Validasi diameter minimum 10mm HANYA untuk mode desain ⬇️⬇️⬇️
                if (optRes && optRes.D_opt && optRes.db_opt) {
                    // Validasi diameter minimum 10mm
                    if (optRes.D_opt < 10 || optRes.db_opt < 10) {
                        return { 
                            status: 'error', 
                            message: 'Optimizer menghasilkan diameter tulangan di bawah 10 mm, yang tidak diizinkan' 
                        };
                    }
                    D = optRes.D_opt;
                    db = optRes.db_opt;
                    console.log("✅ Nilai dari optimizer - D:", D, "db:", db);
                } else {
                    console.error("❌ Optimizer gagal mengembalikan nilai yang valid");
                    return { 
                        status: 'error', 
                        message: 'Optimizer gagal menemukan solusi optimal',
                        optimizerResult: optRes 
                    };
                }
                
            } catch(e) {
                console.error('❌ Optimizer gagal:', e);
                return { 
                    status: 'error', 
                    message: 'Terjadi kesalahan saat menjalankan optimizer',
                    error: String(e) 
                };
            }
        } else {
            console.error('❌ Window.optimizePelat tidak ditemukan!');
            return { 
                status: 'error', 
                message: 'Mode desain membutuhkan optimizer.js — window.optimizePelat tidak ditemukan' 
            };
        }
    } else {
        // mode evaluasi: gunakan nilai dari input
        console.log("🔍 MODE EVALUASI - Menggunakan input manual");
        D = parsed.tulangan.d;
        db = parsed.tulangan.db;
        
        // ⬇️⬇️⬇️ MODIFIKASI: Untuk mode evaluasi, hanya validasi keberadaan, TIDAK ADA batasan minimum ⬇️⬇️⬇️
        if (!D || !db) {
            return { 
                status: 'error', 
                message: 'Mode evaluasi membutuhkan input diameter tulangan (D dan db)' 
            };
        }
        // HAPUS validasi minimum untuk mode evaluasi
        // if (D < 10 || db < 10) {
        //     return { 
        //         status: 'error', 
        //         message: 'Diameter tulangan minimum adalah 10 mm' 
        //     };
        // }
    }

    // Update parsed tulangan dengan nilai yang sudah ditentukan
    parsed.tulangan.d = D;
    parsed.tulangan.db = db;

    // Hitung pelat
    const hasil = hitungPelat(parsed);

    // Kontrol
    const kontrol_lentur = kontrolLenturPelat(hasil.tulangan, hasil.momen, hasil.parameter);
    const kontrol_bagi = kontrolTulanganBagiPelat(hasil.tulangan);
    const kontrol = { lentur: kontrol_lentur, bagi: kontrol_bagi };
    const aman = isKontrolAmanPelat(kontrol);

    // Rekap lengkap
    const rekap = rekapPelatAll(parsed, hasil);

    // Build final result object
    const result = {
        status: aman ? 'sukses' : 'cek',
        mode: mode,
        data: {
            parsedInput: parsed.raw,
            geometri: hasil.geometri,
            parameter: hasil.parameter,
            tabel: hasil.tabel,
            momen: hasil.momen,
            tulangan: hasil.tulangan,
            kontrol: kontrol,
            aman: aman
        },
        kontrol: kontrol,
        rekap: rekap
    };

    // Auto redirect jika diminta
    if (options.autoSave) {
        try { saveResultAndRedirectPelat(result, parsed.raw); } catch(e) { /* ignore */ }
    }

    return result;
}

// Wrapper dengan redirect
async function calculatePelatWithRedirect(data) {
    try {
        const result = await calculatePelat(data, { autoSave: true });
        if (result && (result.status === 'sukses' || result.status === 'cek')) {
            return result;
        } else {
            if (typeof showAlert === 'function') {
                showAlert(`Perhitungan pelat gagal: ${result.message || (result.problems && result.problems.join('; ')) || 'Terjadi kesalahan'}`);
            } else {
                console.warn('Perhitungan pelat gagal:', result);
            }
            return result;
        }
    } catch (err) {
        console.error('Error dalam calculatePelatWithRedirect:', err);
        throw err;
    }
}

// --------------------------------------------------------
// 12. EKSPOR FUNGSI
// --------------------------------------------------------
if (typeof window !== 'undefined') {
    window.calculatePelat = calculatePelat;
    window.calculatePelatWithRedirect = calculatePelatWithRedirect;
    window.hitungPelat = hitungPelat;
    window.kontrolLenturPelat = kontrolLenturPelat;
    window.isKontrolAmanPelat = isKontrolAmanPelat;
    window.getJenisPelat = getJenisPelat; // ⬅️ EKSPOR FUNGSI BARU
}

// Convenience: quick synchronous wrapper
function calculatePelatSync(rawInput, options = {}) {
    return (async () => await calculatePelat(rawInput, options))();
}

// --------------------------------------------------------
// 13. LOGGING / READY
// --------------------------------------------------------
console.log('✅ calc-pelat.js (extended) loaded — modes: desain|evaluasi, kontrol, rekap, optimizer-ready, satu_arah|dua_arah');