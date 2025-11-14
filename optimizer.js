// =====================================================
// optimizer.js
// =====================================================

const { calculateBalok } = require('./calc-balok.js');

function optimizeBalok(data) {
    // Daftar parameter yang akan dioptimasi
    const list_D = [10, 13, 16, 19, 22, 25, 29, 32, 36];
    const list_phi = [6, 8, 10, 12, 14, 16, 19, 22, 25];
    const list_ms1 = [1, 2, 3];
    const list_ms2 = [1, 2, 3];

    let results = [];
    let kombinasi_tercoba = 0;

    console.log("🚀 Memulai optimasi...");
    console.log(`📊 Jumlah kombinasi: ${list_D.length * list_phi.length * list_ms1.length * list_ms2.length}`);

    // Coba semua kombinasi
    for (const D of list_D) {
        for (const phi of list_phi) {
            for (const ms1 of list_ms1) {
                for (const ms2 of list_ms2) {
                    kombinasi_tercoba++;
                    
                    if (kombinasi_tercoba % 100 === 0) {
                        console.log(`⏳ Mencoba kombinasi ke-${kombinasi_tercoba}...`);
                    }

                    try {
                        // Panggil calculateBalok dengan parameter saat ini
                        const result = calculateBalok(data, {
                            D: D,
                            phi: phi,
                            ms1: ms1,
                            ms2: ms2
                        });

                        // Jika perhitungan berhasil dan memenuhi semua kriteria
                        if (result.status === "sukses" && isKontrolAman(result.kontrol)) {
                            // Hitung skor optimalitas
                            const skor = hitungSkorOptimalitas(result, D, phi);
                            
                            results.push({
                                D,
                                phi,
                                ms1,
                                ms2,
                                skor,
                                rekap: result.rekap,
                                kontrol: result.kontrol,
                                data: result.data
                            });
                        }
                    } catch (error) {
                        // Lewati kombinasi yang error
                        continue;
                    }
                }
            }
        }
    }

    console.log(`✅ Optimasi selesai! ${results.length} dari ${kombinasi_tercoba} kombinasi memenuhi syarat`);

    // Urutkan hasil berdasarkan skor terbaik (terkecil)
    results.sort((a, b) => a.skor - b.skor);

    return results.slice(0, 10); // Return 10 hasil terbaik
}

function isKontrolAman(kontrol) {
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

function hitungSkorOptimalitas(result, D, phi) {
    const { rekap, data } = result;
    
    // Faktor bobot untuk masing-masing kriteria
    const bobot_Md = 0.4;    // Momen desain (semakin kecil semakin baik)
    const bobot_Av = 0.3;    // Kebutuhan begel (semakin kecil semakin baik)
    const bobot_torsi = 0.2; // Kebutuhan torsi (semakin kecil semakin baik)
    const bobot_tulangan = 0.1; // Jumlah tulangan (semakin sedikit semakin baik)

    // Hitung total luas tulangan lentur
    const luasPerBatang = 0.25 * Math.PI * D * D;
    
    // Tulangan tumpuan
    const n_tumpuan_neg = parseInt(rekap.tumpuan.tulangan_negatif.split('D')[0]) || 0;
    const n_tumpuan_pos = parseInt(rekap.tumpuan.tulangan_positif.split('D')[0]) || 0;
    
    // Tulangan lapangan
    const n_lapangan_neg = parseInt(rekap.lapangan.tulangan_negatif.split('D')[0]) || 0;
    const n_lapangan_pos = parseInt(rekap.lapangan.tulangan_positif.split('D')[0]) || 0;
    
    // Total tulangan lentur
    const total_tulangan_lentur = (n_tumpuan_neg + n_tumpuan_pos + n_lapangan_neg + n_lapangan_pos) * luasPerBatang;

    // Kebutuhan begel (ambil yang terbesar)
    const Av_terpakai = Math.max(
        parseFloat(data.begelkiri.Av_terpakai) || 0,
        parseFloat(data.begeltengah.Av_terpakai) || 0,
        parseFloat(data.begelkanan.Av_terpakai) || 0
    );

    // Kebutuhan torsi (ambil yang terbesar)
    const n_torsi_tumpuan = parseInt(rekap.tumpuan.torsi.split('D')[0]) || 0;
    const n_torsi_lapangan = parseInt(rekap.lapangan.torsi.split('D')[0]) || 0;
    const total_tulangan_torsi = Math.max(n_torsi_tumpuan, n_torsi_lapangan) * luasPerBatang;

    // Total jumlah batang tulangan
    const total_batang = n_tumpuan_neg + n_tumpuan_pos + n_lapangan_neg + n_lapangan_pos;

    // Hitung skor final
    const skor = (
        bobot_Md * total_tulangan_lentur +
        bobot_Av * Av_terpakai +
        bobot_torsi * total_tulangan_torsi +
        bobot_tulangan * total_batang
    );

    return skor;
}

// Fungsi untuk menampilkan hasil optimasi
function tampilkanHasilOptimasi(results) {
    console.log("\n" + "=".repeat(80));
    console.log("🎯 HASIL OPTIMASI TERBAIK");
    console.log("=".repeat(80));

    results.forEach((result, index) => {
        console.log(`\n🏆 Ranking ${index + 1}:`);
        console.log(`   Diameter Tulangan (D): ${result.D} mm`);
        console.log(`   Diameter Begel (φ): ${result.phi} mm`);
        console.log(`   MS1: ${result.ms1}, MS2: ${result.ms2}`);
        console.log(`   Skor Optimalitas: ${result.skor.toFixed(2)}`);
        
        console.log(`   📋 Rekap Tumpuan:`);
        console.log(`      Tulangan Negatif: ${result.rekap.tumpuan.tulangan_negatif}`);
        console.log(`      Tulangan Positif: ${result.rekap.tumpuan.tulangan_positif}`);
        console.log(`      Begel: ${result.rekap.tumpuan.begel}`);
        console.log(`      Torsi: ${result.rekap.tumpuan.torsi}`);
        
        console.log(`   📋 Rekap Lapangan:`);
        console.log(`      Tulangan Negatif: ${result.rekap.lapangan.tulangan_negatif}`);
        console.log(`      Tulangan Positif: ${result.rekap.lapangan.tulangan_positif}`);
        console.log(`      Begel: ${result.rekap.lapangan.begel}`);
        console.log(`      Torsi: ${result.rekap.lapangan.torsi}`);
    });
}

module.exports = { optimizeBalok, tampilkanHasilOptimasi };