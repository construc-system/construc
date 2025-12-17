// =====================================================
// OPTIMIZER UNTUK DESAIN BALOK
// =====================================================

window.optimizeDesain = function(data) {
    console.log("🚀 Memulai optimasi desain balok...");
    
    const list_D = [10, 13, 16, 19, 22, 25, 29, 32, 36];
    const list_phi = [6, 8, 10, 12, 14, 16, 19, 22, 25];
    const list_ms1 = [1, 2, 3];
    const list_ms2 = [1, 2, 3];
    
    let kombinasiValid = [];
    let totalKombinasi = list_D.length * list_phi.length * list_ms1.length * list_ms2.length;
    let kombinasiDicoba = 0;
    
    console.log(`🔢 Total kombinasi yang akan diuji: ${totalKombinasi}`);
    
    // Iterasi semua kombinasi
    for (let D of list_D) {
        for (let phi of list_phi) {
            for (let ms1 of list_ms1) {
                for (let ms2 of list_ms2) {
                    kombinasiDicoba++;
                    
                    if (kombinasiDicoba % 100 === 0) {
                        console.log(`⏳ Progress: ${kombinasiDicoba}/${totalKombinasi} kombinasi`);
                    }
                    
                    try {
                        // Hitung dengan kombinasi saat ini
                        const options = { D, phi, ms1, ms2 };
                        const hasil = hitungEvaluasi(data, options);
                        
                        if (hasil.status === "sukses") {
                            const kontrol = hasil.kontrol;
                            
                            // Cek apakah kombinasi ini memenuhi semua kontrol
                            if (isKontrolAman(kontrol)) {
                                // Hitung kriteria optimalisasi
                                const kriteria = hitungKriteriaOptimal(hasil.data, D, phi);
                                
                                kombinasiValid.push({
                                    D,
                                    phi,
                                    ms1,
                                    ms2,
                                    hasil,
                                    kriteria,
                                    skor: hitungSkorOptimal(kriteria)
                                });
                            }
                        }
                    } catch (error) {
                        console.warn(`⚠️ Kombinasi D=${D}, phi=${phi}, ms1=${ms1}, ms2=${ms2} error:`, error.message);
                        // Lanjut ke kombinasi berikutnya
                        continue;
                    }
                }
            }
        }
    }
    
    console.log(`✅ Optimasi selesai. ${kombinasiValid.length} kombinasi valid dari ${totalKombinasi} total.`);
    
    if (kombinasiValid.length === 0) {
        return {
            status: 'error', 
            message: 'Tidak ditemukan kombinasi yang memenuhi semua kontrol. Coba relaksasi kriteria atau periksa input.'
        };
    }
    
    // Urutkan berdasarkan skor terbaik (skor lebih kecil = lebih baik)
    kombinasiValid.sort((a, b) => a.skor - b.skor);
    
    // Ambil 5 terbaik
    const terbaik = kombinasiValid.slice(0, 5);
    
    console.log("🏆 5 Kombinasi Terbaik:");
    terbaik.forEach((item, index) => {
        console.log(`${index + 1}. D=${item.D}, phi=${item.phi}, ms1=${item.ms1}, ms2=${item.ms2}, skor=${item.skor.toFixed(2)}`);
    });
    
    // Gunakan kombinasi terbaik
    const kombinasiTerbaik = terbaik[0];
    const hasilAkhir = kombinasiTerbaik.hasil;
    
    // Tambahkan info optimasi ke hasil
    hasilAkhir.optimasi = {
        status: 'sukses',
        total_kombinasi: totalKombinasi,
        kombinasi_valid: kombinasiValid.length,
        kombinasi_terpilih: {
            D: kombinasiTerbaik.D,
            phi: kombinasiTerbaik.phi,
            ms1: kombinasiTerbaik.ms1,
            ms2: kombinasiTerbaik.ms2
        },
        kriteria: kombinasiTerbaik.kriteria,
        skor: kombinasiTerbaik.skor,
        alternatif: terbaik.slice(1).map(item => ({
            D: item.D,
            phi: item.phi,
            ms1: item.ms1,
            ms2: item.ms2,
            skor: item.skor
        }))
    };
    
    return hasilAkhir;
};

// =====================================================
// FUNGSI HITUNG KRITERIA OPTIMAL
// =====================================================

function hitungKriteriaOptimal(hasil, D, phi) {
    const {
        tulanganKirinegatif, tulanganKanannegatif,
        tulanganKiripositif, tulanganKananpositif,
        tulanganTengahnegatif, tulanganTengahpositif,
        begelkiri, begelkanan, begeltengah
    } = hasil;
    
    // 1. Hitung total luas tulangan lentur (As) - kita ingin minimal
    const totalAs = 
        tulanganKirinegatif.AsTerpakai +
        tulanganKanannegatif.AsTerpakai +
        tulanganKiripositif.AsTerpakai +
        tulanganKananpositif.AsTerpakai +
        tulanganTengahnegatif.AsTerpakai +
        tulanganTengahpositif.AsTerpakai;
    
    // 2. Hitung total luas tulangan geser (Av) per meter - kita ingin minimal
    const totalAvPerMeter = 
        parseFloat(begelkiri.Av_terpakai) +
        parseFloat(begelkanan.Av_terpakai) +
        parseFloat(begeltengah.Av_terpakai);
    
    // 3. Hitung faktor efisiensi (mendekati 1 lebih baik)
    const faktorEfisiensi = hitungFaktorEfisiensi(hasil, D);
    
    // 4. Hitung total jumlah batang tulangan (lebih sedikit lebih baik)
    const totalBatang = hitungTotalBatang(hasil);
    
    return {
        totalAs,
        totalAvPerMeter,
        faktorEfisiensi,
        totalBatang,
        D,
        phi
    };
}

// =====================================================
// FUNGSI HITUNG SKOR OPTIMAL
// =====================================================

function hitungSkorOptimal(kriteria) {
    const { totalAs, totalAvPerMeter, faktorEfisiensi, totalBatang, D, phi } = kriteria;
    
    // Bobot untuk setiap kriteria (dapat disesuaikan)
    const bobotAs = 0.4;       // Luas tulangan lentur
    const bobotAv = 0.3;       // Luas tulangan geser
    const bobotEfisiensi = 0.2; // Efisiensi penampang
    const bobotBatang = 0.1;   // Jumlah batang
    
    // Normalisasi nilai (kita ingin semua nilai sekecil mungkin)
    // Untuk skor akhir, kita gunakan pendekatan bahwa nilai lebih kecil = lebih baik
    
    const skorAs = totalAs / 1000; // Normalisasi ke skala yang wajar
    const skorAv = totalAvPerMeter / 100;
    const skorEfisiensi = 1 / faktorEfisiensi; // Efisiensi tinggi = skor rendah
    const skorBatang = totalBatang / 10;
    
    // Hitung skor akhir dengan bobot
    const skorAkhir = 
        (bobotAs * skorAs) +
        (bobotAv * skorAv) +
        (bobotEfisiensi * skorEfisiensi) +
        (bobotBatang * skorBatang);
    
    return skorAkhir;
}

// =====================================================
// FUNGSI BANTUAN OPTIMALISASI
// =====================================================

function hitungFaktorEfisiensi(hasil, D) {
    const {
        tulanganKirinegatif, tulanganKanannegatif,
        tulanganKiripositif, tulanganKananpositif,
        tulanganTengahnegatif, tulanganTengahpositif
    } = hasil;
    
    // Hitung rasio antara kapasitas yang tersedia vs yang dibutuhkan
    // Mendekati 1 berarti sangat efisien
    let totalKapasitas = 0;
    let totalKebutuhan = 0;
    
    const tulanganList = [
        tulanganKirinegatif, tulanganKanannegatif,
        tulanganKiripositif, tulanganKananpositif,
        tulanganTengahnegatif, tulanganTengahpositif
    ];
    
    tulanganList.forEach(tul => {
        if (tul.Md > 0 && tul.Mu > 0) {
            totalKapasitas += tul.Md;
            totalKebutuhan += tul.Mu;
        }
    });
    
    if (totalKebutuhan === 0) return 1;
    
    return Math.min(totalKapasitas / totalKebutuhan, 2); // Maksimal 2x over-design
}

function hitungTotalBatang(hasil) {
    const {
        tulanganKirinegatif, tulanganKanannegatif,
        tulanganKiripositif, tulanganKananpositif,
        tulanganTengahnegatif, tulanganTengahpositif,
        m, ms1, ms2
    } = hasil;
    
    // Hitung total jumlah batang tulangan lentur
    const totalBatangLentur = 
        tulanganKirinegatif.n +
        tulanganKanannegatif.n +
        tulanganKiripositif.n +
        tulanganKananpositif.n +
        tulanganTengahnegatif.n +
        tulanganTengahpositif.n;
    
    // Estimasi jumlah begel (asumsi panjang balok 1 meter untuk perbandingan)
    const estimasiBegel = 1000 / Math.min(
        parseFloat(hasil.begelkiri.sTerkecil),
        parseFloat(hasil.begelkanan.sTerkecil),
        parseFloat(hasil.begeltengah.sTerkecil)
    );
    
    return totalBatangLentur + estimasiBegel;
}

// =====================================================
// FUNGSI FALLBACK JIKA OPTIMIZER TIDAK ADA
// =====================================================

if (typeof window.optimizeDesain === 'undefined') {
    window.optimizeDesain = function(data) {
        console.warn("⚠️ Optimizer tidak tersedia, menggunakan desain default");
        
        // Fallback: coba kombinasi default
        const kombinasiDefault = [
            { D: 16, phi: 10, ms1: 1, ms2: 1 },
            { D: 19, phi: 10, ms1: 1, ms2: 1 },
            { D: 22, phi: 10, ms1: 1, ms2: 1 },
            { D: 16, phi: 12, ms1: 1, ms2: 1 },
            { D: 19, phi: 12, ms1: 1, ms2: 1 }
        ];
        
        for (let kombinasi of kombinasiDefault) {
            try {
                const options = kombinasi;
                const hasil = hitungEvaluasi(data, options);
                
                if (hasil.status === "sukses" && isKontrolAman(hasil.kontrol)) {
                    hasil.optimasi = {
                        status: 'fallback',
                        kombinasi_terpilih: kombinasi,
                        catatan: 'Menggunakan kombinasi default karena optimizer tidak tersedia'
                    };
                    return hasil;
                }
            } catch (error) {
                continue;
            }
        }
        
        return {
            status: 'error', 
            message: 'Tidak ditemukan kombinasi yang memenuhi dengan desain default'
        };
    };
}

console.log("✅ Optimizer untuk desain balok loaded");