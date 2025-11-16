// =====================================================
// calc-kolom.js (Struktur dasar untuk perhitungan kolom)
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
function calculateKolom(data, options = {}) {
    console.log("📥 Input kolom diterima:", data);

    const { module, mode } = data;
    if (!module || !mode) {
        return { status: 'error', message: 'Module atau mode tidak ditemukan' };
    }

    // ===== Cabang Mode =====
    if (mode === "desain") {
        return hitungDesainKolom(data, options);
    } else if (mode === "evaluasi") {
        return hitungEvaluasiKolom(data, options);
    } else {
        return { status: "error", message: `Mode tidak dikenali: ${mode}` };
    }
}

// =====================================================
// ===== FUNGSI KONTROL TERPUSAT UNTUK KOLOM =====
function kontrolKolom(hasil) {
    const {
        tulanganUtama, tulanganGeser, kontrolAksial, kontrolLentur, kontrolGeser
    } = hasil;

    // === KONTROL AKSIAL ===
    const kontrolAksialResult = {
        aman: kontrolAksial.aman,
        detail: {
            Pu: kontrolAksial.Pu,
            Pn: kontrolAksial.Pn,
            phiPn: kontrolAksial.phiPn,
            rasio: kontrolAksial.rasio
        }
    };

    // === KONTROL LENTUR ===
    const kontrolLenturResult = {
        aman: kontrolLentur.aman,
        detail: {
            Mu: kontrolLentur.Mu,
            Mn: kontrolLentur.Mn,
            phiMn: kontrolLentur.phiMn,
            rasio: kontrolLentur.rasio
        }
    };

    // === KONTROL GESER ===
    const kontrolGeserResult = {
        aman: kontrolGeser.aman,
        detail: {
            Vu: kontrolGeser.Vu,
            Vn: kontrolGeser.Vn,
            phiVn: kontrolGeser.phiVn,
            rasio: kontrolGeser.rasio
        }
    };

    // === KONTROL INTERAKSI AKSIAL-LENTUR ===
    const kontrolInteraksi = kontrolInteraksiAksialLentur(hasil);

    return {
        kontrolAksial: kontrolAksialResult,
        kontrolLentur: kontrolLenturResult,
        kontrolGeser: kontrolGeserResult,
        kontrolInteraksi: kontrolInteraksi
    };
}

// =====================================================
// ===== FUNGSI CEK KELAYAKAN KOLOM =====
function isKontrolKolomAman(kontrol) {
    if (!kontrol) return false;

    return (
        kontrol.kontrolAksial.aman &&
        kontrol.kontrolLentur.aman &&
        kontrol.kontrolGeser.aman &&
        kontrol.kontrolInteraksi.aman
    );
}

// =====================================================
// ===== FUNGSI KONTROL DETAIL KOLOM =====
function kontrolInteraksiAksialLentur(hasil) {
    const { kontrolAksial, kontrolLentur, diagramInteraksi } = hasil;
    
    // Implementasi kontrol diagram interaksi P-M
    // Untuk sementara, return sederhana
    return {
        aman: kontrolAksial.aman && kontrolLentur.aman,
        detail: {
            titikInteraksi: diagramInteraksi.titikInteraksi || "Dalam batas aman",
            faktorAmplifikasi: diagramInteraksi.faktorAmplifikasi || 1.0
        }
    };
}

// =====================================================
// ===== FUNGSI HITUNG KONTROL REKAP KOLOM =====
function hitungKontrolRekapKolom(hasil) {
    const {
        kontrolAksial, kontrolLentur, kontrolGeser, tulanganUtama, tulanganGeser
    } = hasil;

    return {
        aksial: {
            beban: kontrolAksial.Pu,
            kapasitas: kontrolAksial.phiPn,
            aman: kontrolAksial.aman,
            rasio: kontrolAksial.rasio
        },
        lentur: {
            beban: kontrolLentur.Mu,
            kapasitas: kontrolLentur.phiMn,
            aman: kontrolLentur.aman,
            rasio: kontrolLentur.rasio
        },
        geser: {
            beban: kontrolGeser.Vu,
            kapasitas: kontrolGeser.phiVn,
            aman: kontrolGeser.aman,
            rasio: kontrolGeser.rasio
        },
        tulangan: {
            utama: tulanganUtama.n,
            geser: tulanganGeser.sTerkecil,
            status: "Cukup" // akan dihitung berdasarkan kontrol
        }
    };
}

// =====================================================
// ===== FUNGSI HITUNG DESAIN KOLOM =====
function hitungDesainKolom(data, options = {}) {
    const { module, mode, dimensi, beban, material, lanjutan } = data;
    
    // Ekstrak parameter dasar
    const h = parseFloat(dimensi.h) || 0;
    const b = parseFloat(dimensi.b) || 0;
    const sb = parseFloat(dimensi.sb) || 0;
    
    const fc = parseFloat(material.fc) || 0;
    const fy = parseFloat(material.fy) || 0;
    const fyt = parseFloat(material.fyt) || 0;

    const lambda = parseFloat(lanjutan.lambda) || 1;
    const n_kaki = parseFloat(lanjutan.n_kaki) || 2;

    // Beban
    const Pu = parseFloat(beban.pu) || 0;
    const Mu = parseFloat(beban.mu) || 0;
    const Vu = parseFloat(beban.vu) || 0;

    // Hitung kolom
    const hasil = hitungKolom({
        mode, h, b, sb, fc, fy, fyt, lambda, n_kaki,
        Pu, Mu, Vu,
        // Parameter untuk desain (akan dihitung optimal)
        D: options.D || 0,
        phi: options.phi || 0,
        n_tulangan: options.n_tulangan || 0,
        s_begel: options.s_begel || 0
    });

    const kontrol = kontrolKolom(hasil);
    const rekap = rekapHasilKolom(hasil);
    const kontrol_rekap = hitungKontrolRekapKolom(hasil);

    return {
        status: "sukses",
        mode: "desain",
        data: hasil,
        kontrol: kontrol,
        rekap: rekap,
        kontrol_rekap: kontrol_rekap
    };
}

// =====================================================
// ===== FUNGSI HITUNG EVALUASI KOLOM =====
function hitungEvaluasiKolom(data, options = {}) {
    const { module, mode, dimensi, beban, material, lanjutan, tulangan } = data;
    
    // Ekstrak parameter dasar
    const h = parseFloat(dimensi.h) || 0;
    const b = parseFloat(dimensi.b) || 0;
    const sb = parseFloat(dimensi.sb) || 0;
    
    const fc = parseFloat(material.fc) || 0;
    const fy = parseFloat(material.fy) || 0;
    const fyt = parseFloat(material.fyt) || 0;

    const lambda = parseFloat(lanjutan.lambda) || 1;
    const n_kaki = parseFloat(lanjutan.n_kaki) || 2;

    // Beban
    const Pu = parseFloat(beban.pu) || 0;
    const Mu = parseFloat(beban.mu) || 0;
    const Vu = parseFloat(beban.vu) || 0;

    // Data tulangan yang terpasang (untuk evaluasi)
    const D = parseFloat(tulangan.d) || 0;
    const phi = parseFloat(tulangan.phi) || 0;
    const n_tulangan = parseFloat(tulangan.n) || 0;
    const s_begel = parseFloat(tulangan.s) || 0;

    // Hitung kolom dengan tulangan terpasang
    const hasil = hitungKolom({
        mode, h, b, sb, fc, fy, fyt, lambda, n_kaki,
        Pu, Mu, Vu,
        D, phi, n_tulangan, s_begel
    });

    const kontrol = kontrolKolom(hasil);
    const rekap = rekapHasilKolom(hasil);
    const kontrol_rekap = hitungKontrolRekapKolom(hasil);

    return {
        status: "sukses",
        mode: "evaluasi",
        data: hasil,
        kontrol: kontrol,
        rekap: rekap,
        kontrol_rekap: kontrol_rekap,
        info: { D, phi, n_tulangan, s_begel }
    };
}

// =====================================================
// ===== PERHITUNGAN INTI KOLOM =====
function hitungKolom(params) {
    const {
        mode, h, b, sb, fc, fy, fyt, lambda, n_kaki,
        Pu, Mu, Vu,
        D, phi, n_tulangan, s_begel
    } = params;

    // Hitung parameter dasar
    const d = h - sb - phi - D/2; // Tinggi efektif
    const Ag = b * h; // Luas penampang kotor
    const gamma = (h - 2 * sb - 2 * phi - D) / h; // Rasio dimensi kern

    // Hitung tulangan utama
    const tulanganUtama = hitungTulanganUtamaKolom({
        mode, Pu, Mu, fc, fy, b, h, d, Ag, gamma,
        D, n_tulangan
    });

    // Hitung tulangan geser
    const tulanganGeser = hitungGeserKolom({
        mode, Vu, fc, fyt, b, d, lambda, n_kaki, phi, s_begel
    });

    // Kontrol kapasitas
    const kontrolAksial = hitungKontrolAksial(Pu, tulanganUtama.Pn, 0.65); // phi = 0.65 untuk aksial
    const kontrolLentur = hitungKontrolLentur(Mu, tulanganUtama.Mn, 0.65); // phi = 0.65 untuk lentur
    const kontrolGeser = hitungKontrolGeser(Vu, tulanganGeser.Vn, 0.75); // phi = 0.75 untuk geser

    // Diagram interaksi (placeholder)
    const diagramInteraksi = hitungDiagramInteraksi({
        fc, fy, b, h, tulanganUtama, gamma
    });

    return {
        status: "aman",
        parameter: { d, Ag, gamma },
        tulanganUtama,
        tulanganGeser,
        kontrolAksial,
        kontrolLentur,
        kontrolGeser,
        diagramInteraksi
    };
}

// =====================================================
// ===== SUB-FUNGSI PERHITUNGAN DETAIL KOLOM =====

// -- Tulangan Utama Kolom (Aksial + Lentur)
function hitungTulanganUtamaKolom(params) {
    const { mode, Pu, Mu, fc, fy, b, h, d, Ag, gamma, D, n_tulangan } = params;

    // Hitung tulangan minimum dan maksimum
    const As_min = 0.01 * Ag; // 1% dari Ag (minimum)
    const As_max = 0.08 * Ag; // 8% dari Ag (maksimum)

    let As_terpasang, n, Pn, Mn;

    if (mode === "desain") {
        // Mode desain: hitung kebutuhan tulangan
        // Untuk sementara, hitung sederhana berdasarkan beban
        const bebanTotal = Math.sqrt(Pu * Pu + Mu * Mu);
        const As_dibutuhkan = Math.max(As_min, bebanTotal / (0.85 * fc));
        
        // Hitung jumlah tulangan
        const luasSatuTulangan = 0.25 * Math.PI * D * D;
        n = Math.max(4, Math.ceil(As_dibutuhkan / luasSatuTulangan));
        As_terpasang = n * luasSatuTulangan;

    } else {
        // Mode evaluasi: gunakan tulangan terpasang
        n = n_tulangan;
        const luasSatuTulangan = 0.25 * Math.PI * D * D;
        As_terpasang = n * luasSatuTulangan;
    }

    // Hitung kapasitas nominal (placeholder - perlu rumus yang tepat)
    Pn = 0.85 * fc * (Ag - As_terpasang) + fy * As_terpasang;
    Mn = 0.85 * fc * b * Math.pow(h, 2) / 6 + fy * As_terpasang * (d - h/2);

    // Kontrol batas tulangan
    const rho = As_terpasang / Ag;
    const rho_min = 0.01; // 1%
    const rho_max = 0.08; // 8%
    const tulanganAman = rho >= rho_min && rho <= rho_max;

    return {
        n,
        D,
        As_terpasang: As_terpasang.toFixed(2),
        As_min: As_min.toFixed(2),
        As_max: As_max.toFixed(2),
        rho: (rho * 100).toFixed(3),
        rho_min: (rho_min * 100).toFixed(1),
        rho_max: (rho_max * 100).toFixed(1),
        tulanganAman,
        Pn: Pn.toFixed(2),
        Mn: (Mn / 1e6).toFixed(2), // Convert to kNm
        detail: "Tulangan utama kolom"
    };
}

// -- Tulangan Geser Kolom (Sengkang)
function hitungGeserKolom(params) {
    const { mode, Vu, fc, fyt, b, d, lambda, n_kaki, phi, s_begel } = params;

    // Kuat geser beton
    const Vc = 0.17 * lambda * Math.sqrt(fc) * b * d * 1e-3; // kN

    let Vs, Av_terpasang, s, Av_dibutuhkan;

    if (mode === "desain") {
        // Mode desain: hitung kebutuhan sengkang
        Vs = Math.max(0, Vu / 0.75 - Vc); // phi = 0.75 untuk geser
        Av_dibutuhkan = (Vs * 1e3 * s_begel) / (fyt * d); // sementara gunakan s_begel sebagai referensi
        
        const luasSatuKaki = 0.25 * Math.PI * phi * phi;
        Av_terpasang = n_kaki * luasSatuKaki;
        
        // Hitung spasi required
        const s_max = Math.min(d/2, 600); // mm
        const s_required = (Av_terpasang * fyt * d) / (Vs * 1e3);
        s = Math.min(s_max, floor5(s_required));

    } else {
        // Mode evaluasi: gunakan sengkang terpasang
        s = s_begel;
        const luasSatuKaki = 0.25 * Math.PI * phi * phi;
        Av_terpasang = n_kaki * luasSatuKaki;
        
        // Hitung kuat geser tulangan
        Vs = (Av_terpasang * fyt * d) / (s * 1e3); // kN
        Av_dibutuhkan = Av_terpasang; // Untuk evaluasi, asumsikan cukup
    }

    // Kuat geser nominal total
    const Vn = Vc + Vs;

    // Kontrol spasi maksimum
    const s_max = Math.min(d/2, 600);
    const s_aman = s <= s_max;

    return {
        phi,
        n_kaki,
        s: s.toFixed(1),
        s_max: s_max.toFixed(1),
        s_aman,
        Vc: Vc.toFixed(2),
        Vs: Vs.toFixed(2),
        Vn: Vn.toFixed(2),
        Av_terpasang: Av_terpasang.toFixed(2),
        Av_dibutuhkan: Av_dibutuhkan?.toFixed(2) || Av_terpasang.toFixed(2),
        detail: "Tulangan geser kolom"
    };
}

// -- Kontrol Kapasitas
function hitungKontrolAksial(Pu, Pn, phi) {
    const phiPn = phi * Pn;
    const rasio = Pu / phiPn;
    return {
        Pu: Pu.toFixed(2),
        Pn: Pn.toFixed(2),
        phiPn: phiPn.toFixed(2),
        rasio: rasio.toFixed(3),
        aman: rasio <= 1.0
    };
}

function hitungKontrolLentur(Mu, Mn, phi) {
    const phiMn = phi * Mn;
    const rasio = Mu / phiMn;
    return {
        Mu: Mu.toFixed(2),
        Mn: Mn.toFixed(2),
        phiMn: phiMn.toFixed(2),
        rasio: rasio.toFixed(3),
        aman: rasio <= 1.0
    };
}

function hitungKontrolGeser(Vu, Vn, phi) {
    const phiVn = phi * Vn;
    const rasio = Vu / phiVn;
    return {
        Vu: Vu.toFixed(2),
        Vn: Vn.toFixed(2),
        phiVn: phiVn.toFixed(2),
        rasio: rasio.toFixed(3),
        aman: rasio <= 1.0
    };
}

// -- Diagram Interaksi (Placeholder)
function hitungDiagramInteraksi(params) {
    const { fc, fy, b, h, tulanganUtama, gamma } = params;
    
    // Implementasi diagram interaksi P-M yang sebenarnya lebih kompleks
    // Untuk sementara, return data placeholder
    return {
        titikInteraksi: "Titik dalam diagram interaksi",
        faktorAmplifikasi: 1.0,
        kurvaInteraksi: [
            { P: tulanganUtama.Pn * 1.0, M: 0 },
            { P: tulanganUtama.Pn * 0.8, M: tulanganUtama.Mn * 0.3 },
            { P: tulanganUtama.Pn * 0.5, M: tulanganUtama.Mn * 0.6 },
            { P: tulanganUtama.Pn * 0.2, M: tulanganUtama.Mn * 0.8 },
            { P: 0, M: tulanganUtama.Mn * 1.0 }
        ]
    };
}

// =====================================================
// ===== FUNGSI REKAP HASIL KOLOM =====
function rekapHasilKolom(hasil) {
    const {
        tulanganUtama, tulanganGeser, kontrolAksial, kontrolLentur, kontrolGeser
    } = hasil;

    const formatTulangan = (n, diameter) => {
        if (!n || n === 0) return "-";
        return `${n}D${diameter}`;
    };

    const formatBegel = (diameter, jarak, n_kaki) => {
        if (!jarak || jarak === 0) return "-";
        return `ɸ${diameter}-${jarak} (${n_kaki}kaki)`;
    };

    return {
        tulangan_utama: formatTulangan(tulanganUtama.n, tulanganUtama.D),
        tulangan_geser: formatBegel(tulanganGeser.phi, tulanganGeser.s, tulanganGeser.n_kaki),
        kontrol_aksial: {
            status: kontrolAksial.aman ? "Aman" : "Tidak Aman",
            rasio: kontrolAksial.rasio
        },
        kontrol_lentur: {
            status: kontrolLentur.aman ? "Aman" : "Tidak Aman",
            rasio: kontrolLentur.rasio
        },
        kontrol_geser: {
            status: kontrolGeser.aman ? "Aman" : "Tidak Aman",
            rasio: kontrolGeser.rasio
        }
    };
}

// =====================================================
// ===== EKSPOR DAN INTEGRASI DENGAN REPORT =====

// Ekspos fungsi ke window
window.calculateKolom = calculateKolom;
window.hitungEvaluasiKolom = hitungEvaluasiKolom;
window.kontrolKolom = kontrolKolom;
window.hitungKontrolRekapKolom = hitungKontrolRekapKolom;
window.isKontrolKolomAman = isKontrolKolomAman;

// Fungsi untuk menyimpan hasil dan redirect ke report
function saveResultAndRedirectKolom(result, inputData) {
    sessionStorage.setItem('calculationResult', JSON.stringify({
        module: inputData.module,
        mode: inputData.mode,
        data: result.data,
        kontrol: result.kontrol,
        rekap: result.rekap,
        kontrol_rekap: result.kontrol_rekap,
        inputData: inputData,
        timestamp: new Date().toISOString()
    }));
    
    saveColorSettingsKolom();
    window.location.href = 'report.html';
}

// Fungsi untuk menyimpan pengaturan warna
function saveColorSettingsKolom() {
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

// Modifikasi fungsi calculateKolom untuk auto-redirect
function calculateKolomWithRedirect(data) {
    console.log("🚀 Menghitung kolom dengan redirect...", data);
    
    try {
        const result = calculateKolom(data);
        
        if (result.status === "sukses") {
            saveResultAndRedirectKolom(result, data);
        } else {
            if (typeof showAlert === 'function') {
                showAlert(`Perhitungan kolom gagal: ${result.message || 'Terjadi kesalahan'}`);
            } else {
                alert(`Perhitungan kolom gagal: ${result.message || 'Terjadi kesalahan'}`);
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error dalam calculateKolom:', error);
        if (typeof showAlert === 'function') {
            showAlert(`Terjadi kesalahan dalam perhitungan kolom: ${error.message}`);
        } else {
            alert(`Terjadi kesalahan dalam perhitungan kolom: ${error.message}`);
        }
        throw error;
    }
}

// Ekspos kedua fungsi
window.calculateKolomWithRedirect = calculateKolomWithRedirect;

console.log("✅ calc-kolom.js loaded (basic structure ready for formulas)");