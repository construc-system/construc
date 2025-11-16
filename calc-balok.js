// =====================================================
// calc-balok.js (versi lengkap dengan evaluasi tulangan)
// =====================================================

// ===== UTILITAS DASAR =====
function ceil5(x) {
    return Math.ceil(x / 5) * 5;
}

function floor5(x) {
    return Math.floor(x / 5) * 5;
}

// =====================================================
// ===== FUNGSI UTAMA =====
function calculateBalok(data, options = {}) {
    console.log("📥 Input diterima:", data);

    const { module, mode } = data;
    if (!module || !mode) {
        return { status: 'error', message: 'Module atau mode tidak ditemukan' };
    }

    // ===== Cabang Mode =====
    if (mode === "desain") {
        // Gunakan optimizer dari file terpisah
        if (typeof window.optimizeDesain === 'function') {
            return window.optimizeDesain(data);
        } else {
            return { status: 'error', message: 'Optimizer tidak tersedia' };
        }
    } else if (mode === "evaluasi") {
        return hitungEvaluasi(data, options);
    } else {
        return { status: "error", message: `Mode tidak dikenali: ${mode}` };
    }
}

// =====================================================
// ===== FUNGSI KONTROL TERPUSAT =====
function kontrolBalok(hasil) {
    const {
        Kmaks, m, ms1, ms2,
        tulanganKirinegatif, tulanganTengahnegatif, tulanganKanannegatif,
        tulanganKiripositif, tulanganTengahpositif, tulanganKananpositif,
        begelkiri, begeltengah, begelkanan,
        torsikiri, torsitengah, torsikanan
    } = hasil;

    // === KONTROL LENTUR ===
    const kontrolLentur = {};
    const configLentur = [
        { key: 'kiri_negatif', data: tulanganKirinegatif, ms: ms1, tipe: 'tumpuan_negatif' },
        { key: 'tengah_negatif', data: tulanganTengahnegatif, ms: ms2, tipe: 'lapangan_negatif' },
        { key: 'kanan_negatif', data: tulanganKanannegatif, ms: ms1, tipe: 'tumpuan_negatif' },
        { key: 'kiri_positif', data: tulanganKiripositif, ms: ms2, tipe: 'tumpuan_positif' },
        { key: 'tengah_positif', data: tulanganTengahpositif, ms: ms1, tipe: 'lapangan_positif' },
        { key: 'kanan_positif', data: tulanganKananpositif, ms: ms2, tipe: 'tumpuan_positif' }
    ];

    configLentur.forEach(({ key, data, ms, tipe }) => {
        kontrolLentur[key] = kontrolTulanganLentur(data, Kmaks, m, ms, tipe);
    });

    // === KONTROL GESER ===
    const kontrolGeser = {};
    const configGeser = [
        { key: 'kiri', data: begelkiri },
        { key: 'tengah', data: begeltengah },
        { key: 'kanan', data: begelkanan }
    ];

    configGeser.forEach(({ key, data }) => {
        kontrolGeser[key] = kontrolTulanganGeser(data);
    });

    // === KONTROL TORSI ===
    const kontrolTorsi = {};
    const configTorsi = [
        { key: 'kiri', data: torsikiri },
        { key: 'tengah', data: torsitengah },
        { key: 'kanan', data: torsikanan }
    ];

    configTorsi.forEach(({ key, data }) => {
        kontrolTorsi[key] = kontrolTulanganTorsi(data);
    });

    return { kontrolLentur, kontrolGeser, kontrolTorsi };
}

// =====================================================
// ===== FUNGSI CEK KELAYAKAN =====
function isKontrolAman(kontrol) {
    if (!kontrol) return false;

    // Cek semua kontrol lentur
    for (const key in kontrol.kontrolLentur) {
        const lentur = kontrol.kontrolLentur[key];
        if (!lentur.K_aman || !lentur.Md_aman || !lentur.rho_aman || !lentur.kapasitas_aman) {
            return false;
        }
    }

    // Cek semua kontrol geser
    for (const key in kontrol.kontrolGeser) {
        const geser = kontrol.kontrolGeser[key];
        if (!geser.Vs_aman || !geser.Av_aman) {
            return false;
        }
    }

    // Cek semua kontrol torsi
    for (const key in kontrol.kontrolTorsi) {
        const torsi = kontrol.kontrolTorsi[key];
        if (!torsi.perluDanAman) {
            return false;
        }
    }

    return true;
}

// =====================================================
// ===== FUNGSI KONTROL DETAIL =====
function kontrolTulanganLentur(tulangan, Kmaks, m, ms, tipe) {
    const { K, Md, Mu, rho, pmin, pmax, n } = tulangan;
    
    const kapasitas_aman = n <= m * ms;
    
    return {
        K_aman: K <= Kmaks,
        Md_aman: Md >= Mu,
        rho_aman: rho >= pmin && rho <= pmax,
        kapasitas_aman,
        detail: { K, Kmaks, Md, Mu, rho, pmin, pmax, n, m, ms, max_allowed: m * ms }
    };
}

function kontrolTulanganGeser(begel) {
    const { phiVc, Vs, Vs_maks, Av_u, Av_terpakai, Vu } = begel;
    
    const phiVcNum = parseFloat(phiVc);
    const VsNum = parseFloat(Vs);
    const VsMaksNum = parseFloat(Vs_maks);
    const AvUNum = parseFloat(Av_u);
    const AvTerpakaiNum = parseFloat(Av_terpakai);
    const VuNum = parseFloat(Vu || 0);
    
    return {
        Vs_aman: VsNum <= VsMaksNum,
        Av_aman: AvTerpakaiNum >= AvUNum,
        detail: { 
            Vu: VuNum, 
            phiVc: phiVcNum, 
            Vs: VsNum, 
            Vs_maks: VsMaksNum, 
            Av_u: AvUNum, 
            Av_terpakai: AvTerpakaiNum 
        }
    };
}

function kontrolTulanganTorsi(torsi) {
    const { perluTorsi, amanBegel1, amanBegel2, amanTorsi, Tu_min, Tn } = torsi;
    
    const TuNum = parseFloat(torsi.Tu || 0);
    const TuMinNum = parseFloat(Tu_min);
    
    return {
        perluDanAman: perluTorsi ? (amanBegel1 && amanBegel2 && amanTorsi) : true,
        detail: { 
            perluTorsi, 
            amanBegel1, 
            amanBegel2, 
            amanTorsi, 
            Tu: TuNum, 
            Tu_min: TuMinNum, 
            Tn: parseFloat(Tn) 
        }
    };
}

// =====================================================
// ===== FUNGSI HITUNG KONTROL REKAP =====
function hitungKontrolRekap(hasil) {
    const {
        tulanganKirinegatif, tulanganKanannegatif,
        tulanganKiripositif, tulanganKananpositif,
        tulanganTengahnegatif, tulanganTengahpositif,
        begelkiri, begelkanan, begeltengah
    } = hasil;

    const Mu_neg_tumpuan = Math.max(tulanganKirinegatif.Mu, tulanganKanannegatif.Mu);
    const Md_neg_tumpuan = Math.max(tulanganKirinegatif.Md, tulanganKanannegatif.Md);
    const Mu_pos_tumpuan = Math.max(tulanganKiripositif.Mu, tulanganKananpositif.Mu);
    const Md_pos_tumpuan = Math.max(tulanganKiripositif.Md, tulanganKananpositif.Md);

    const Mu_neg_lapangan = tulanganTengahnegatif.Mu;
    const Md_neg_lapangan = tulanganTengahnegatif.Md;
    const Mu_pos_lapangan = tulanganTengahpositif.Mu;
    const Md_pos_lapangan = tulanganTengahpositif.Md;

    const Av_u_tumpuan = Math.max(parseFloat(begelkiri.Av_u), parseFloat(begelkanan.Av_u));
    const Av_terpakai_tumpuan = Math.max(parseFloat(begelkiri.Av_terpakai), parseFloat(begelkanan.Av_terpakai));
    const Av_u_lapangan = parseFloat(begeltengah.Av_u);
    const Av_terpakai_lapangan = parseFloat(begeltengah.Av_terpakai);

    return {
        tumpuan: {
            lentur_negatif: { Md: Md_neg_tumpuan, Mu: Mu_neg_tumpuan, aman: Md_neg_tumpuan >= Mu_neg_tumpuan },
            lentur_positif: { Md: Md_pos_tumpuan, Mu: Mu_pos_tumpuan, aman: Md_pos_tumpuan >= Mu_pos_tumpuan },
            geser: { 
                Av_terpakai: Av_terpakai_tumpuan, 
                Av_u: Av_u_tumpuan, 
                aman: Av_terpakai_tumpuan >= Av_u_tumpuan 
            }
        },
        lapangan: {
            lentur_negatif: { Md: Md_neg_lapangan, Mu: Mu_neg_lapangan, aman: Md_neg_lapangan >= Mu_neg_lapangan },
            lentur_positif: { Md: Md_pos_lapangan, Mu: Mu_pos_lapangan, aman: Md_pos_lapangan >= Mu_pos_lapangan },
            geser: { 
                Av_terpakai: Av_terpakai_lapangan, 
                Av_u: Av_u_lapangan, 
                aman: Av_terpakai_lapangan >= Av_u_lapangan 
            }
        }
    };
}

// =====================================================
// ===== FUNGSI HITUNG EVALUASI =====
function hitungEvaluasi(data, options = {}) {
    const { module, mode, dimensi, beban, material, lanjutan, tulangan } = data;
    
    const h = parseFloat(dimensi.h) || 0;
    const b = parseFloat(dimensi.b) || 0;
    const sb = parseFloat(dimensi.sb) || 0;
    const fr1 = 0.9;
    const fr2 = 0.75;

    const fc = parseFloat(material.fc) || 0;
    const fy = parseFloat(material.fy) || 0;
    const fyt = parseFloat(material.fyt) || 0;

    const lambda = parseFloat(lanjutan.lambda) || 1;
    const n_val = parseFloat(lanjutan.n) || 2;

    // Ambil nilai dari options (untuk desain) atau dari input tulangan (untuk evaluasi)
    const D = options.D || (tulangan ? parseFloat(tulangan.d) : 0) || 0;
    const phi = options.phi || (tulangan ? parseFloat(tulangan.phi) : 0) || 0;
    
    let ms1, ms2;

    // Hitung m (jumlah maksimal tulangan per baris)
    const selimut = 40;
    const Snv = Math.max(25, D);
    const ds1 = ceil5(selimut + phi + D / 2);
    const m = Math.max(1, Math.floor((b - 2 * ds1) / (D + sb)) + 1);

    // Untuk evaluasi, ambil nilai n dan np dari input tulangan
    let n_neg_support, n_pos_support, n_neg_field, n_pos_field;
    let nt_support, s_support, nt_field, s_field;

    if (mode === "desain") {
        // Untuk mode desain, gunakan ms1 dan ms2 dari optimizer
        ms1 = options.ms1 || 1;
        ms2 = options.ms2 || 1;
        // Untuk desain, nilai n_neg_support, dll tidak digunakan, karena nanti dihitung oleh hitungTulang
        n_neg_support = 0;
        n_pos_support = 0;
        n_neg_field = 0;
        n_pos_field = 0;
        nt_support = 0;
        s_support = 0;
        nt_field = 0;
        s_field = 0;
    } else {
        // Untuk mode evaluasi, hitung ms1 dan ms2 berdasarkan input tulangan
        if (tulangan && tulangan.support && tulangan.field) {
            // Hitung ms1 dan ms2 berdasarkan ceil(n/m) dan ceil(np/m)
            const n_support_neg = parseFloat(tulangan.support.n) || 0;
            const np_support_pos = parseFloat(tulangan.support.np) || 0;
            const n_field_neg = parseFloat(tulangan.field.n) || 0;
            const np_field_pos = parseFloat(tulangan.field.np) || 0;

            ms1 = Math.ceil(n_support_neg / m); // Untuk tulangan negatif tumpuan
            ms2 = Math.ceil(np_support_pos / m); // Untuk tulangan positif tumpuan
            
            // Untuk lapangan, gunakan yang terbesar antara kebutuhan lapangan dan tumpuan
            ms1 = Math.max(ms1, Math.ceil(n_field_neg / m));
            ms2 = Math.max(ms2, Math.ceil(np_field_pos / m));

            // Ambil nilai n dan np untuk setiap lokasi
            n_neg_support = n_support_neg;
            n_pos_support = np_support_pos;
            n_neg_field = n_field_neg;
            n_pos_field = np_field_pos;

            // Ambil nilai nt dan s untuk evaluasi
            nt_support = parseFloat(tulangan.support.nt) || 0;
            s_support = parseFloat(tulangan.support.s) || 0;
            nt_field = parseFloat(tulangan.field.nt) || 0;
            s_field = parseFloat(tulangan.field.s) || 0;
        } else {
            ms1 = 1;
            ms2 = 1;
            n_neg_support = 0;
            n_pos_support = 0;
            n_neg_field = 0;
            n_pos_field = 0;
            nt_support = 0;
            s_support = 0;
            nt_field = 0;
            s_field = 0;
        }
    }

    const muposl = parseFloat(beban.left?.mu_pos ?? 0);
    const munegl = parseFloat(beban.left?.mu_neg ?? 0);
    const vul = parseFloat(beban.left?.vu ?? 0);
    const tul_val = parseFloat(beban.left?.tu ?? 0);

    const muposc = parseFloat(beban.center?.mu_pos ?? 0);
    const munegc = parseFloat(beban.center?.mu_neg ?? 0);
    const vuc = parseFloat(beban.center?.vu ?? 0);
    const tuc = parseFloat(beban.center?.tu ?? 0);

    const muposr = parseFloat(beban.right?.mu_pos ?? 0);
    const munegr = parseFloat(beban.right?.mu_neg ?? 0); // PERBAIKAN: beben -> beban
    const vur = parseFloat(beban.right?.vu ?? 0);
    const tur = parseFloat(beban.right?.tu ?? 0);

    const hasil = hitungBalok({
        mode, h, b, sb, fc, fy, fyt, lambda, n_val, D, phi, ms1, ms2,
        nt_support, s_support, nt_field, s_field,
        n_neg_support, n_pos_support, n_neg_field, n_pos_field,
        muposl, munegl, muposc, munegc, muposr, munegr,
        vul, vuc, vur, tul: tul_val, tuc, tur, fr1, fr2
    });

    const kontrol = kontrolBalok(hasil);
    const rekap = rekapHasil(hasil, D, phi);
    const kontrol_rekap = hitungKontrolRekap(hasil);

    if (mode === "desain") {
        return prosesDesain(hasil, kontrol, rekap, kontrol_rekap);
    } else {
        return prosesEvaluasi(hasil, kontrol, rekap, kontrol_rekap, { D, phi, ms1, ms2 });
    }
}

// =====================================================
// ===== PERHITUNGAN INTI BALOK =====
function hitungBalok(params) {
    const {
        mode, h, b, sb, fc, fy, fyt, lambda, n_val, D, phi, ms1, ms2, 
        nt_support, s_support, nt_field, s_field,
        n_neg_support, n_pos_support, n_neg_field, n_pos_field,
        muposl, muposc, muposr, munegc, munegl, munegr, vul, vuc, vur, tul, tuc, tur, fr1, fr2
    } = params;

    const selimut = 40;
    const Snv = Math.max(25, D);
    
    const ds1 = ceil5(selimut + phi + D / 2);
    const ds2 = ceil5(ds1 + (D + Snv) / 2);
    const ds3 = ceil5(ds1 + (D + Snv));
    
    const m = Math.max(1, Math.floor((b - 2 * ds1) / (D + sb)) + 1);

    let ds, ds_;
    if (ms1 === 1) ds = ds1;
    else if (ms1 === 2) ds = ds2;
    else ds = ds3;
    
    if (ms2 === 1) ds_ = ds1;
    else if (ms2 === 2) ds_ = ds2;
    else ds_ = ds3;

    const d = Math.max(0, h - ds);
    const d_ = Math.max(0, h - ds_);
    const dmin = Math.min(d, d_);

    let beta1 = 0.85;
    if (fc > 28 && fc < 55) beta1 = 0.85 - 0.05 * ((fc - 28) / 7);
    if (fc >= 55) beta1 = 0.65;

    const Kmaks = (382.5 * beta1 * fc * (600 + fy - 225 * beta1)) / Math.pow((600 + fy), 2);

    const mumax = Math.max(muposl, muposc, muposr, munegc, munegl, munegr);
    const Muni = Math.max(munegl, mumax / 3);
    const Munl = Math.max(munegc, mumax / 5);
    const Muna = Math.max(munegr, mumax / 3);
    const Mupi = Math.max(muposl, mumax / 3);
    const Mupl = Math.max(muposc, mumax / 5);
    const Mupa = Math.max(muposr, mumax / 3);

    // Hitung tulangan dengan memasukkan n_pasang untuk evaluasi, atau null untuk desain
    const tulanganKirinegatif = hitungTulang(Muni, fc, fy, b, d, D, fr1, beta1, mode === "evaluasi" ? n_neg_support : null);
    const tulanganTengahnegatif = hitungTulang(Munl, fc, fy, b, d, D, fr1, beta1, mode === "evaluasi" ? n_neg_field : null);
    const tulanganKanannegatif = hitungTulang(Muna, fc, fy, b, d, D, fr1, beta1, mode === "evaluasi" ? n_neg_support : null);
    const tulanganKiripositif = hitungTulang(Mupi, fc, fy, b, d_, D, fr1, beta1, mode === "evaluasi" ? n_pos_support : null);
    const tulanganTengahpositif = hitungTulang(Mupl, fc, fy, b, d_, D, fr1, beta1, mode === "evaluasi" ? n_pos_field : null);
    const tulanganKananpositif = hitungTulang(Mupa, fc, fy, b, d_, D, fr1, beta1, mode === "evaluasi" ? n_pos_support : null);
    
    const begelkiri = hitungBegel(vul, fc, fyt, b, dmin, phi, lambda, n_val, fr2, mode, s_support);
    const begeltengah = hitungBegel(vuc, fc, fyt, b, dmin, phi, lambda, n_val, fr2, mode, s_field);
    const begelkanan = hitungBegel(vur, fc, fyt, b, dmin, phi, lambda, n_val, fr2, mode, s_support);

    const torsikiri = hitungTorsi(tul, fc, fy, fyt, b, h, phi, sb, fr2, parseFloat(begelkiri.Av_u), D, mode, nt_support);
    const torsitengah = hitungTorsi(tuc, fc, fy, fyt, b, h, phi, sb, fr2, parseFloat(begeltengah.Av_u), D, mode, nt_field);
    const torsikanan = hitungTorsi(tur, fc, fy, fyt, b, h, phi, sb, fr2, parseFloat(begelkanan.Av_u), D, mode, nt_support);

    return {
        status: "aman",
        m, ms1, ms2,
        Snv, ds1, ds2, ds3, ds, ds_,
        d, d_, dmin,
        beta1, Kmaks,
        tulanganKirinegatif, tulanganTengahnegatif, tulanganKanannegatif,
        tulanganKiripositif, tulanganTengahpositif, tulanganKananpositif,
        begelkiri, begeltengah, begelkanan,
        torsikiri, torsitengah, torsikanan
    };
}

// =====================================================
// ===== FUNGSI REKAP HASIL =====
function rekapHasil(hasil, D, phi) {
    const {
        tulanganKirinegatif, tulanganKanannegatif,
        tulanganKiripositif, tulanganKananpositif,
        tulanganTengahnegatif, tulanganTengahpositif,
        begelkiri, begelkanan, begeltengah,
        torsikiri, torsikanan, torsitengah
    } = hasil;

    const formatTulangan = (n, diameter) => {
        if (!n || n === 0) return "-";
        return `${n}D${diameter}`;
    };

    const formatBegel = (diameter, jarak) => {
        if (!jarak || jarak === 0) return "-";
        return `ɸ${diameter}-${jarak}`;
    };

    const rekapTumpuan = {
        tulangan_negatif: formatTulangan(Math.max(tulanganKirinegatif.n, tulanganKanannegatif.n), D),
        tulangan_positif: formatTulangan(Math.max(tulanganKiripositif.n, tulanganKananpositif.n), D),
        begel: formatBegel(phi, Math.min(parseFloat(begelkiri.sTerkecil), parseFloat(begelkanan.sTerkecil))),
        torsi: formatTulangan(Math.max(
            torsikiri.perluTorsi ? parseFloat(torsikiri.n) : 0,
            torsikanan.perluTorsi ? parseFloat(torsikanan.n) : 0
        ), D)
    };

    const rekapLapangan = {
        tulangan_negatif: formatTulangan(tulanganTengahnegatif.n, D),
        tulangan_positif: formatTulangan(tulanganTengahpositif.n, D),
        begel: formatBegel(phi, parseFloat(begeltengah.sTerkecil)),
        torsi: formatTulangan(torsitengah.perluTorsi ? parseFloat(torsitengah.n) : 0, D)
    };

    return { tumpuan: rekapTumpuan, lapangan: rekapLapangan };
}

// =====================================================
// ===== SUB-FUNGSI PERHITUNGAN DETAIL =====

// -- Tulangan Lentur (dimodifikasi untuk menerima n_pasang)
function hitungTulang(Mu, fc, fy, b, d, D, fr1, beta1, n_pasang = null) {
    if (b <= 0 || d <= 0 || fc <= 0 || fy <= 0) {
        return { Mu, K: 0, a: 0, As: 0, AsTerpakai: 0, n: 0, rho: 0, pmin: 0, pmax: 0, Md: 0, Mn: 0 };
    }

    const K = (Mu * 1e6) / (fr1 * b * Math.pow(d, 2));
    const a = (1 - Math.sqrt(1 - (2 * K) / (0.85 * fc))) * d;

    const As1 = (0.85 * fc * a * b) / fy;
    const As2 = (Math.sqrt(fc) / (4 * fy)) * b * d;
    const As3 = (1.4 * b * d) / fy;
    const As = Math.max(As1, As2, As3);

    const luasTulangan = 0.25 * Math.PI * D**2;
    
    let n, AsTerpakai;
    if (n_pasang !== null) {
        // Mode evaluasi: gunakan n_pasang yang diberikan
        n = n_pasang;
        AsTerpakai = n * luasTulangan;
    } else {
        // Mode desain: hitung n berdasarkan kebutuhan
        n = Math.max(luasTulangan > 0 ? Math.ceil(As / luasTulangan) : 0, 2);
        AsTerpakai = n * luasTulangan;
    }

    const rho = (AsTerpakai / (b * d)) * 100;
    const pmin = Math.max((Math.sqrt(fc) / (4 * fy)) * 100, (1.4 / fy) * 100);
    const pmax = (0.75 * (beta1 * 0.85 * fc / fy * 600 / (600 + fy))) * 100;

    const a2 = (AsTerpakai * fy) / (0.85 * fc * b);
    const Mn = (AsTerpakai * fy * (d - a2 / 2)) * 1e-6;
    const Md = fr1 * Mn;

    return { Mu, K, a, As, AsTerpakai, n, rho, pmin, pmax, Md, Mn };
}

// -- Tulangan Geser (Begel) - dimodifikasi untuk evaluasi dan aturan s=100
function hitungBegel(Vu, fc, fyt, b, dmin, phi, lambda, n_val, fr2, mode = "desain", s_pasang = null) {
    if (fc <= 0 || b <= 0 || dmin <= 0 || fyt <= 0 || n_val <= 0) {
        return {
            Vu: Vu.toFixed(2), phiVc: "0.00", Vs: "0.00", Vs_maks: "0.00",
            Av1: "0.00", Av2: "0.00", Av3: "0.00", Av_u: "0.00",
            Av_terpakai: "0.00", sTerkecil: "600.0"
        };
    }

    const sqrtFc = Math.sqrt(fc);
    const phiVc = fr2 * 0.17 * lambda * sqrtFc * b * dmin * 1e-3;
    const Vs = (Vu > phiVc && fr2 > 0) ? (Vu - phiVc) / fr2 : 0;
    const Vs_maks = (Vu > phiVc) ? (2/3) * sqrtFc * b * dmin * 1e-3 : 0;

    const Av1 = 0.062 * sqrtFc * b * 1000 / fyt;
    const Av2 = 0.35 * b * 1000 / fyt;
    const Av3 = (fyt > 0 && dmin > 0) ? (Vs * 1e3 * 1000) / (fyt * dmin) : 0;

    const Av_u = Math.max(Av1, Av2, Av3);
    const luasSengkang = n_val * 0.25 * Math.PI * phi ** 2;
    
    let sTerkecil, Av_terpakai;

    if (mode === "evaluasi" && s_pasang) {
        // Untuk evaluasi, gunakan spasi yang dipasang
        sTerkecil = s_pasang;
        Av_terpakai = (luasSengkang * 1000) / sTerkecil;
    } else {
        // Untuk desain, hitung spasi berdasarkan kebutuhan
        const s1 = (Av_u > 0) ? (luasSengkang * 1000) / Av_u : 600;
        const s2 = (Vu > phiVc && Vs > 0.5 * Vs_maks) ? dmin / 4 : dmin / 2;
        const s3 = (Vu > phiVc && Vs > 0.5 * Vs_maks) ? 300 : 600;

        sTerkecil = floor5(Math.min(s1, s2, s3));
        
        // Untuk mode desain, jika sTerkecil < 100, gunakan s = 100
        if (mode === "desain" && sTerkecil < 100) {
            sTerkecil = 100;
        }

        Av_terpakai = (sTerkecil > 0) ? (luasSengkang * 1000) / sTerkecil : 0;
    }

    return {
        Vu: Vu.toFixed(2), phiVc: phiVc.toFixed(2), Vs: Vs.toFixed(2), Vs_maks: Vs_maks.toFixed(2),
        Av1: Av1.toFixed(2), Av2: Av2.toFixed(2), Av3: Av3.toFixed(2), Av_u: Av_u.toFixed(2),
        Av_terpakai: Av_terpakai.toFixed(2), sTerkecil: sTerkecil.toFixed(1)
    };
}

// -- Tulangan Torsi - dimodifikasi untuk evaluasi
function hitungTorsi(Tu, fc, fy, fyt, b, h, phi, Sb, fr2, Av, D, mode = "desain", nt_pasang = null) {
    if (Tu <= 0 || fc <= 0 || fy <= 0 || fyt <= 0 || b <= 0 || h <= 0) {
        return {
            Tu: Tu.toFixed(3), status: "Tidak Perlu", perluTorsi: false,
            amanBegel1: true, amanBegel2: true, amanTorsi: true, n: 0
        };
    }

    const cot = 1 / Math.tan(45 * Math.PI / 180);
    const cot2 = cot * cot;
    const Tn = Tu / fr2;
    const Acp = b * h;
    const Pcp = 2 * (b + h);
    const Tu_min = fr2 * 0.083 * Math.sqrt(fc) * (Acp * Acp) / Pcp * 1e-6;

    const perluTorsi = Tu > Tu_min;

    let A0h = 0, ph = 0, A0 = 0, At = 0, A1 = 0;
    const S = 1000;

    if (perluTorsi) {
        A0h = (b - 2 * (phi/2 + Sb)) * (h - 2 * (phi/2 + Sb));
        ph = 2 * (b + h - 4 * phi - 4 * Sb);
        A0 = 0.85 * A0h;
        At = (Tn * 1e6 * 1000) / (2 * A0 * fyt * cot);
        A1 = (At / S) * ph * (fyt / fy) * cot2;
    }

    const Avt = parseFloat(Av) + At;
    const kontrolBegel1 = 0.062 * Math.sqrt(fc) * b * 1000 / fyt;
    const kontrolBegel2 = 0.35 * b * 1000 / fyt;
    const amanBegel1 = Avt >= kontrolBegel1;
    const amanBegel2 = Avt >= kontrolBegel2;

    const At_per_S = At / S;
    const A1_alt = Math.max(
        At_per_S * ph * (fyt / fy) * cot2,
        0.42 * Math.sqrt(fc) * Acp / fy - At_per_S * ph * (fyt / fy)
    );

    const kontrolTorsi = 0.175 * b / fyt;
    
    let n, amanTorsi;
    const luasTulanganMemanjang = 0.25 * Math.PI * D * D;
    
    if (mode === "evaluasi" && nt_pasang) {
        // Untuk evaluasi, gunakan jumlah tulangan torsi yang dipasang
        n = nt_pasang;
        const A1_terpasang = n * luasTulanganMemanjang;
        amanTorsi = A1_terpasang >= A1;
    } else {
        // Untuk desain, hitung jumlah tulangan torsi berdasarkan kebutuhan
        n = luasTulanganMemanjang > 0 ? Math.ceil(A1 / luasTulanganMemanjang) : 0;
        amanTorsi = At_per_S >= kontrolTorsi;
    }

    return {
        Tu: Tu.toFixed(3), Tn: Tn.toFixed(3), Acp: Acp.toFixed(0), Pcp: Pcp.toFixed(0),
        Tu_min: Tu_min.toFixed(3), perluTorsi, A0h: A0h.toFixed(0), ph: ph.toFixed(0),
        A0: A0.toFixed(0), At: At.toFixed(0), A1: A1.toFixed(0), Avt: Avt.toFixed(0),
        kontrolBegel1: kontrolBegel1.toFixed(0), kontrolBegel2: kontrolBegel2.toFixed(0),
        amanBegel1, amanBegel2, At_per_S: At_per_S.toFixed(3), A1_alt: A1_alt.toFixed(0),
        kontrolTorsi: kontrolTorsi.toFixed(3), amanTorsi, n,
        status: perluTorsi ? (amanBegel1 && amanBegel2 && amanTorsi ? "Aman" : "Tidak Aman") : "Tidak Perlu"
    };
}

// =====================================================
// ===== MODE OPERASI =====

// -- Mode Desain
function prosesDesain(hasil, kontrol, rekap, kontrol_rekap) {
    return {
        status: "sukses", mode: "desain", data: hasil,
        kontrol: kontrol, rekap: rekap, kontrol_rekap: kontrol_rekap
    };
}

// -- Mode Evaluasi
function prosesEvaluasi(hasil, kontrol, rekap, kontrol_rekap, { D, phi, ms1, ms2 }) {
    return {
        status: "sukses", mode: "evaluasi", data: hasil,
        kontrol: kontrol, rekap: rekap, kontrol_rekap: kontrol_rekap,
        info: { D, phi, ms1, ms2 }
    };
}

// =====================================================
// EKSPOR DAN INTEGRASI DENGAN REPORT
// =====================================================

// Ekspos fungsi ke window
window.calculateBalok = calculateBalok;
window.hitungEvaluasi = hitungEvaluasi;
window.kontrolBalok = kontrolBalok;
window.hitungKontrolRekap = hitungKontrolRekap;
window.isKontrolAman = isKontrolAman;

// Fungsi untuk menyimpan hasil dan redirect ke report
function saveResultAndRedirect(result, inputData) {
    sessionStorage.setItem('calculationResult', JSON.stringify({
        module: inputData.module,
        mode: inputData.mode,
        data: result.data,
        kontrol: result.kontrol,
        rekap: result.rekap,
        kontrol_rekap: result.kontrol_rekap,
        optimasi: result.optimasi,
        inputData: inputData,
        timestamp: new Date().toISOString()
    }));
    
    saveColorSettings();
    window.location.href = 'report.html';
}

// Fungsi untuk menyimpan pengaturan warna
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
}

// Modifikasi fungsi calculateBalok untuk auto-redirect
function calculateBalokWithRedirect(data) {
    console.log("🚀 Menghitung dengan redirect...", data);
    
    try {
        const result = calculateBalok(data);
        
        if (result.status === "sukses") {
            saveResultAndRedirect(result, data);
        } else {
            if (typeof showAlert === 'function') {
                showAlert(`Perhitungan gagal: ${result.message || 'Terjadi kesalahan'}`);
            } else {
                alert(`Perhitungan gagal: ${result.message || 'Terjadi kesalahan'}`);
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error dalam calculateBalok:', error);
        if (typeof showAlert === 'function') {
            showAlert(`Terjadi kesalahan dalam perhitungan: ${error.message}`);
        } else {
            alert(`Terjadi kesalahan dalam perhitungan: ${error.message}`);
        }
        throw error;
    }
}

// Ekspos kedua fungsi
window.calculateBalokWithRedirect = calculateBalokWithRedirect;

console.log("✅ calc-balok.js loaded (complete with evaluation mode)");