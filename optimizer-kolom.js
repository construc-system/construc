// ============================================================================
// optimizer-kolom.js - OPTIMIZER DEDICATED UNTUK KOLOM
// ============================================================================

// ============================================================================
// KONFIGURASI OPTIMIZER KOLOM
// ============================================================================
const OPTIMIZER_KOLOM = {
    // Diameter tulangan utama untuk kolom
    D_KOLOM: [10, 13, 16, 19, 22, 25, 29, 32, 36],
    
    // Diameter sengkang untuk kolom  
    PHI_KOLOM: [6, 8, 10, 12, 14, 16, 19, 22, 25],
    
    // Batasan maksimum iterasi untuk mencegah infinite loop
    MAX_ITERATIONS: 500,
    
    // Timeout untuk setiap perhitungan (ms)
    CALCULATION_TIMEOUT: 3000
};

// ============================================================================
// VALIDASI INPUT KHUSUS KOLOM
// ============================================================================
function validateKolomInput(inputData) {
    if (!inputData) {
        throw new Error("Input data kolom tidak boleh kosong");
    }
    
    // Cek module harus kolom
    const module = inputData.module || inputData.parsed?.module || 
                  inputData.raw?.module || 'unknown';
    
    if (module !== 'kolom') {
        throw new Error(`Module harus 'kolom', tetapi menerima: '${module}'`);
    }
    
    // Validasi data dasar kolom
    const parsed = inputData.parsed || inputData.raw || inputData;
    if (!parsed.dimensi || !parsed.beban || !parsed.material) {
        throw new Error("Data kolom tidak lengkap (dimensi, beban, material diperlukan)");
    }
    
    if (!parsed.dimensi.h || !parsed.dimensi.b) {
        throw new Error("Dimensi kolom (h dan b) harus diisi");
    }
    
    if (!parsed.beban.Pu) {
        throw new Error("Beban aksial (Pu) harus diisi");
    }
    
    return module;
}

// ============================================================================
// FUNGSI KONTROL KHUSUS KOLOM
// ============================================================================
function isKontrolKolomAman(kontrol) {
    if (!kontrol) return false;
    
    // Format kontrol kolom
    if (kontrol.lentur && kontrol.geser) {
        return (
            kontrol.lentur.Ast_ok &&
            kontrol.lentur.rho_ok && 
            kontrol.lentur.n_ok &&
            kontrol.lentur.K_ok &&  // Kontrol K vs Kmaks
            kontrol.geser.Vs_ok &&
            kontrol.geser.Av_ok
        );
    }
    
    return false;
}

// ============================================================================
// FUNGSI SKOR OPTIMALITAS KOLOM
// ============================================================================
function hitungSkorOptimalitasKolom(result, D, phi) {
    if (!result || !result.rekap) return Infinity;

    try {
        const luasPerBatang = 0.25 * Math.PI * D * D;
        const rekap = result.rekap;
        
        // Ekstrak jumlah tulangan dari format string (contoh: "8D19" -> 8)
        const extractNumber = (str) => {
            if (!str || str === '-') return 0;
            const match = str.toString().match(/(\d+)D/);
            return match ? parseInt(match[1]) : 0;
        };
        
        const nMain = extractNumber(rekap.formatted?.tulangan_utama);
        const sBegel = rekap.begel?.s || 100;
        
        // Skor: minimalisasi luas tulangan utama + pertimbangan spasi begel
        // Faktor bobot: luas tulangan lebih penting daripada spasi begel
        return (nMain * luasPerBatang) + (sBegel * 0.01);
        
    } catch (error) {
        console.warn('Error menghitung skor kolom:', error);
        return Infinity;
    }
}

// ============================================================================
// OPTIMIZER UTAMA KHUSUS KOLOM
// ============================================================================
async function optimizeKolom(inputData) {
    console.log('🚀 OPTIMIZER KOLOM DIMULAI...');
    
    // Validasi input khusus kolom
    let rawData;
    try {
        validateKolomInput(inputData);
        
        // Ekstrak raw data berdasarkan struktur input
        if (inputData.raw) {
            rawData = inputData.raw;
        } else if (inputData.parsed && inputData.parsed.raw) {
            rawData = inputData.parsed.raw;
        } else {
            rawData = inputData;
        }
        
        console.log(`📦 Module: KOLOM | Pu: ${rawData.beban?.Pu || 'N/A'} kN | Dimensi: ${rawData.dimensi?.b || 'N/A'}x${rawData.dimensi?.h || 'N/A'} mm`);
        
    } catch (error) {
        return {
            status: "error",
            message: `Validasi input kolom gagal: ${error.message}`
        };
    }
    
    // Generate kombinasi D dan phi untuk kolom
    let kombinasiList = [];
    
    for (const D of OPTIMIZER_KOLOM.D_KOLOM) {
        for (const phi of OPTIMIZER_KOLOM.PHI_KOLOM) {
            kombinasiList.push({ D, phi });
        }
    }
    
    // Batasi jumlah kombinasi jika terlalu banyak
    if (kombinasiList.length > OPTIMIZER_KOLOM.MAX_ITERATIONS) {
        console.warn(`⚠️  Terlalu banyak kombinasi (${kombinasiList.length}), membatasi ke ${OPTIMIZER_KOLOM.MAX_ITERATIONS}`);
        kombinasiList = kombinasiList.slice(0, OPTIMIZER_KOLOM.MAX_ITERATIONS);
    }
    
    console.log(`🔍 Menguji ${kombinasiList.length} kombinasi tulangan kolom...`);
    
    let hasilTerbaik = null;
    let skorTerbaik = Infinity;
    let kombinasiValid = 0;
    const semuaHasil = [];
    
    // Test setiap kombinasi
    for (let i = 0; i < kombinasiList.length; i++) {
        const kombinasi = kombinasiList[i];
        const { D, phi } = kombinasi;
        
        console.log(`🔧 [${i+1}/${kombinasiList.length}] Testing: D${D} φ${phi}`);
        
        try {
            let result;
            
            // Panggil fungsi calculateKolom
            if (!window.calculateKolom) {
                throw new Error("Fungsi calculateKolom tidak tersedia");
            }
            
            const inputKolom = {
                ...rawData,
                mode: "evaluasi",
                tulangan: { 
                    d_tul: D, 
                    phi_tul: phi 
                }
            };
            
            // Gunakan safeCalculate dengan timeout
            result = await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error(`Timeout setelah ${OPTIMIZER_KOLOM.CALCULATION_TIMEOUT}ms`));
                }, OPTIMIZER_KOLOM.CALCULATION_TIMEOUT);
                
                try {
                    const calcResult = window.calculateKolom(inputKolom);
                    clearTimeout(timeoutId);
                    resolve(calcResult);
                } catch (error) {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            });
            
            // Validasi result
            if (!result) {
                console.log(`  ❌ Tidak ada hasil`);
                semuaHasil.push({ ...kombinasi, status: 'no_result' });
                continue;
            }
            
            if (result.status !== 'sukses' && result.status !== 'cek') {
                console.log(`  ❌ Status: ${result.status} - ${result.message || ''}`);
                semuaHasil.push({ ...kombinasi, status: result.status, message: result.message });
                continue;
            }
            
            // Cek kontrol kolom khusus
            if (!isKontrolKolomAman(result.kontrol)) {
                console.log(`  ❌ Kontrol kolom tidak aman`);
                
                // Debug detail kontrol
                if (result.kontrol) {
                    if (result.kontrol.lentur) {
                        const lentur = result.kontrol.lentur;
                        console.log(`     Lentur: Ast_ok=${lentur.Ast_ok}, rho_ok=${lentur.rho_ok}, n_ok=${lentur.n_ok}, K_ok=${lentur.K_ok}`);
                    }
                    if (result.kontrol.geser) {
                        const geser = result.kontrol.geser;
                        console.log(`     Geser: Vs_ok=${geser.Vs_ok}, Av_ok=${geser.Av_ok}`);
                    }
                }
                
                semuaHasil.push({ ...kombinasi, status: 'kontrol_gagal' });
                continue;
            }
            
            // Hitung skor optimalitas khusus kolom
            const skor = hitungSkorOptimalitasKolom(result, D, phi);
            
            if (!isFinite(skor)) {
                console.log(`  ❌ Skor tidak valid: ${skor}`);
                semuaHasil.push({ ...kombinasi, status: 'skor_invalid', skor });
                continue;
            }
            
            // Kombinasi VALID dan AMAN
            kombinasiValid++;
            console.log(`  ✅ AMAN | Skor: ${skor.toFixed(2)} | Tulangan: ${result.rekap?.formatted?.tulangan_utama || 'N/A'} | Begel: ${result.rekap?.formatted?.begel || 'N/A'}`);
            
            // Simpan hasil
            const hasilDetail = {
                ...kombinasi,
                status: 'aman',
                skor: skor,
                result: result
            };
            
            semuaHasil.push(hasilDetail);
            
            // Update hasil terbaik
            if (skor < skorTerbaik) {
                skorTerbaik = skor;
                hasilTerbaik = hasilDetail;
                console.log(`  🏆 KOMBINASI TERBAIK BARU!`);
            }
            
        } catch (error) {
            console.log(`  💥 Error: ${error.message}`);
            semuaHasil.push({ 
                ...kombinasi, 
                status: 'error', 
                message: error.message 
            });
        }
    }
    
    // HASIL AKHIR
    console.log('\n🎉 OPTIMIZER KOLOM SELESAI');
    console.log(`📊 Statistik:`);
    console.log(`   - Total kombinasi: ${kombinasiList.length}`);
    console.log(`   - Kombinasi valid: ${kombinasiValid}`);
    console.log(`   - Success rate: ${((kombinasiValid / kombinasiList.length) * 100).toFixed(1)}%`);
    
    // ============================================================================
    // FINAL VALIDATION - TAMBAHAN BARU
    // ============================================================================
    if (kombinasiValid === 0 || !hasilTerbaik) {
        console.log('\n❌ VALIDASI AKHIR: TIDAK ADA KOMBINASI YANG AMAN UNTUK KOLOM INI');
        
        return {
            status: "error",
            code: "NO_VALID_COMBINATION",
            message: "Tidak ditemukan kombinasi tulangan kolom yang memenuhi seluruh kontrol.",
            summary: {
                total_kombinasi: kombinasiList.length,
                kombinasi_valid: kombinasiValid
            }
        };
    }
    
    if (!hasilTerbaik) {
        console.log('\n❌ TIDAK ADA KOMBINASI YANG AMAN UNTUK KOLOM INI');
        
        // Analisis penyebab kegagalan
        const statistikStatus = {};
        semuaHasil.forEach(hasil => {
            statistikStatus[hasil.status] = (statistikStatus[hasil.status] || 0) + 1;
        });
        
        console.log('📋 Analisis kegagalan:');
        Object.entries(statistikStatus).forEach(([status, count]) => {
            console.log(`   - ${status}: ${count} kombinasi`);
        });
        
        return {
            status: "error",
            message: "Tidak ditemukan kombinasi tulangan yang memenuhi semua kontrol untuk kolom ini",
            statistik: statistikStatus,
            semua_hasil: semuaHasil,
            rekomendasi: "Perbesar dimensi kolom atau tingkatkan mutu beton/baja"
        };
    }
    
    console.log('\n🏆 KOMBINASI TERBAIK UNTUK KOLOM DITEMUKAN!');
    console.log(`   - Diameter tulangan utama: D${hasilTerbaik.D}`);
    console.log(`   - Diameter sengkang: φ${hasilTerbaik.phi}`);
    console.log(`   - Konfigurasi tulangan: ${hasilTerbaik.result.rekap?.formatted?.tulangan_utama || 'N/A'}`);
    console.log(`   - Konfigurasi begel: ${hasilTerbaik.result.rekap?.formatted?.begel || 'N/A'}`);
    console.log(`   - Skor optimalitas: ${hasilTerbaik.skor.toFixed(2)}`);
    
    // Siapkan hasil final khusus kolom
    const resultFinal = {
        status: "sukses",
        mode: "desain",
        module: "kolom",
        data: hasilTerbaik.result.data,
        kontrol: hasilTerbaik.result.kontrol,
        rekap: hasilTerbaik.result.rekap,
        optimasi: {
            kombinasi_terbaik: {
                D: hasilTerbaik.D,
                phi: hasilTerbaik.phi,
                d_tul: hasilTerbaik.D,      // alias untuk kompatibilitas
                phi_tul: hasilTerbaik.phi   // alias untuk kompatibilitas
            },
            skor: hasilTerbaik.skor,
            total_kombinasi: kombinasiList.length,
            kombinasi_valid: kombinasiValid,
            semua_hasil: semuaHasil
        }
    };
    
    return resultFinal;
}

// ============================================================================
// FUNGSI BANTUAN UNTUK INTEGRASI
// ============================================================================
function getDefaultKolomInput() {
    return {
        module: "kolom",
        mode: "desain",
        dimensi: { h: 400, b: 400, sb: 40 },
        beban: { Pu: 1500, Mu: 100, Vu: 50 },
        material: { fc: 25, fy: 400, fyt: 240 },
        lanjutan: { lambda: 1, n_kaki: 2 }
    };
}

function analyzeKolomFailure(hasilOptimasi) {
    if (hasilOptimasi.status !== "error") return null;
    
    const analysis = {
        total_kombinasi: hasilOptimasi.semua_hasil?.length || 0,
        gagal_kontrol: 0,
        gagal_lentur: 0,
        gagal_geser: 0,
        rekomendasi: []
    };
    
    hasilOptimasi.semua_hasil?.forEach(hasil => {
        if (hasil.status === 'kontrol_gagal' && hasil.result) {
            analysis.gagal_kontrol++;
            
            const kontrol = hasil.result.kontrol;
            if (kontrol.lentur && !kontrol.lentur.ok) {
                analysis.gagal_lentur++;
            }
            if (kontrol.geser && !kontrol.geser.ok) {
                analysis.gagal_geser++;
            }
        }
    });
    
    // Berikan rekomendasi berdasarkan analisis
    if (analysis.gagal_lentur > analysis.gagal_geser) {
        analysis.rekomendasi.push("Perbesar dimensi kolom untuk meningkatkan kapasitas lentur");
    }
    if (analysis.gagal_geser > analysis.gagal_lentur) {
        analysis.rekomendasi.push("Perbesar dimensi kolom atau gunakan sengkang lebih rapat untuk meningkatkan kapasitas geser");
    }
    if (analysis.gagal_lentur > 0 && analysis.gagal_geser > 0) {
        analysis.rekomendasi.push("Kolom mungkin terlalu kecil untuk beban yang diberikan - pertimbangkan perbesaran dimensi");
    }
    
    return analysis;
}

// ============================================================================
// EKSPOR FUNGSI
// ============================================================================
if (typeof window !== 'undefined') {
    window.optimizeKolom = optimizeKolom;
    window.isKontrolKolomAman = isKontrolKolomAman;
    window.hitungSkorOptimalitasKolom = hitungSkorOptimalitasKolom;
    window.getDefaultKolomInput = getDefaultKolomInput;
    window.analyzeKolomFailure = analyzeKolomFailure;
}

console.log("✅ optimizer-kolom.js loaded - Optimizer dedicated untuk struktur KOLOM");