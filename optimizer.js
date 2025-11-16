// =====================================================
// optimizer.js - Modul Optimizer Terpisah
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

// ===== FUNGSI HITUNG SKOR OPTIMALITAS =====
function hitungSkorOptimalitas(result, D, phi) {
    const { rekap, data } = result;
    
    const bobot_Md = 0.4;
    const bobot_Av = 0.3;
    const bobot_torsi = 0.2;
    const bobot_tulangan = 0.1;

    const luasPerBatang = 0.25 * Math.PI * D * D;
    
    const n_tumpuan_neg = parseInt(rekap.tumpuan.tulangan_negatif.split('D')[0]) || 0;
    const n_tumpuan_pos = parseInt(rekap.tumpuan.tulangan_positif.split('D')[0]) || 0;
    const n_lapangan_neg = parseInt(rekap.lapangan.tulangan_negatif.split('D')[0]) || 0;
    const n_lapangan_pos = parseInt(rekap.lapangan.tulangan_positif.split('D')[0]) || 0;
    
    const total_tulangan_lentur = (n_tumpuan_neg + n_tumpuan_pos + n_lapangan_neg + n_lapangan_pos) * luasPerBatang;

    const Av_terpakai = Math.max(
        parseFloat(data.begelkiri.Av_terpakai) || 0,
        parseFloat(data.begeltengah.Av_terpakai) || 0,
        parseFloat(data.begelkanan.Av_terpakai) || 0
    );

    const n_torsi_tumpuan = parseInt(rekap.tumpuan.torsi.split('D')[0]) || 0;
    const n_torsi_lapangan = parseInt(rekap.lapangan.torsi.split('D')[0]) || 0;
    const total_tulangan_torsi = Math.max(n_torsi_tumpuan, n_torsi_lapangan) * luasPerBatang;

    const total_batang = n_tumpuan_neg + n_tumpuan_pos + n_lapangan_neg + n_lapangan_pos;

    const skor = (
        bobot_Md * total_tulangan_lentur +
        bobot_Av * Av_terpakai +
        bobot_torsi * total_tulangan_torsi +
        bobot_tulangan * total_batang
    );

    return skor;
}

// ===== OPTIMIZER UNTUK MODE DESAIN =====
function optimizeDesain(data) {
    const list_D = [10, 13, 16, 19, 22, 25, 29, 32, 36];
    const list_phi = [6, 8, 10, 12, 14, 16, 19, 22, 25];
    const list_ms1 = [1, 2, 3];
    const list_ms2 = [1, 2, 3];

    let hasilTerbaik = null;
    let skorTerbaik = Infinity;
    let kombinasi_tercoba = 0;
    let kombinasi_berhasil = 0;

    console.log("🚀 Memulai optimasi untuk mode desain...");

    // Coba semua kombinasi
    for (const D of list_D) {
        for (const phi of list_phi) {
            for (const ms1 of list_ms1) {
                for (const ms2 of list_ms2) {
                    kombinasi_tercoba++;
                    
                    try {
                        const result = window.hitungEvaluasi(data, { D, phi, ms1, ms2 });

                        if (result.status === "sukses" && isKontrolAman(result.kontrol)) {
                            kombinasi_berhasil++;
                            const skor = hitungSkorOptimalitas(result, D, phi);
                            
                            if (skor < skorTerbaik) {
                                skorTerbaik = skor;
                                hasilTerbaik = { ...result, kombinasi: { D, phi, ms1, ms2 }, skor };
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
        }
    }

    console.log(`✅ Optimasi selesai! ${kombinasi_berhasil} dari ${kombinasi_tercoba} kombinasi memenuhi syarat`);

    if (hasilTerbaik) {
        const kontrol_rekap = window.hitungKontrolRekap(hasilTerbaik.data);
        
        return {
            status: "sukses",
            mode: "desain",
            data: hasilTerbaik.data,
            kontrol: hasilTerbaik.kontrol,
            rekap: hasilTerbaik.rekap,
            kontrol_rekap: kontrol_rekap,
            optimasi: {
                kombinasi_terbaik: hasilTerbaik.kombinasi,
                skor: hasilTerbaik.skor,
                kombinasi_tercoba,
                kombinasi_berhasil
            }
        };
    } else {
        return { 
            status: "error", 
            message: "Tidak ditemukan desain yang memenuhi semua syarat kontrol" 
        };
    }
}

// Ekspos fungsi optimizer ke window
window.optimizeDesain = optimizeDesain;
window.isKontrolAman = isKontrolAman;
window.hitungSkorOptimalitas = hitungSkorOptimalitas;

console.log("✅ optimizer.js loaded");