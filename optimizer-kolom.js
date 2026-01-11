// ============================================================================
// KONFIGURASI OPTIMIZER KOLOM
// ============================================================================
const OPTIMIZER_KOLOM = {
    D_KOLOM: [10, 13, 16, 19, 22, 25, 29, 32, 36],
    PHI_KOLOM: [6, 8, 10, 12, 14, 16, 19, 22, 25],
    MAX_ITERATIONS: 200,
    CALCULATION_TIMEOUT: 5000
};

// ============================================================================
// VALIDASI INPUT KHUSUS KOLOM
// ============================================================================
function validateKolomInput(inputData) {
    if (!inputData) throw new Error("Input data kolom tidak boleh kosong");
    
    const module = inputData.module || inputData.parsed?.module || 
                  inputData.raw?.module || 'unknown';
    
    if (module !== 'kolom') {
        throw new Error(`Module harus 'kolom', tetapi menerima: '${module}'`);
    }
    
    return true;
}

// ============================================================================
// FUNGSI KONTROL KHUSUS KOLOM
// ============================================================================
function isKontrolKolomAman(kontrol, kondisi, dataHasil) {
    if (!kontrol || !kontrol.lentur || !kontrol.geser) return false;
    
    const { lentur, geser } = kontrol;
    
    const kontrolWajib = (
        lentur.Ast_ok === true &&
        lentur.rho_ok === true && 
        lentur.n_ok === true &&
        geser.Vs_ok === true &&
        geser.Av_ok === true
    );
    
    if (!kontrolWajib) return false;
    
    const isKondisi6 = kondisi === 'at2 > ac' || kondisi === 'kondisi6';
    if (isKondisi6 && lentur.K_ok !== true) return false;
    
    if (dataHasil) {
        const nDibutuhkan = Math.ceil(dataHasil.Ast_u / dataHasil.Ast_satu);
        const nTerpasang = dataHasil.n_terpakai || 0;
        if (nTerpasang < nDibutuhkan) return false;
    }
    
    return true;
}

// ============================================================================
// FUNGSI SKOR OPTIMALITAS KOLOM
// ============================================================================
function hitungSkorOptimalitasKolom(result, D, phi) {
    try {
        const data = result.data?.hasilTulangan || {};
        const begel = result.data?.begel || {};
        
        const As_terpakai = data.Ast_i || 0;
        const Av_terpakai = begel.Av_terpakai || 0;
        
        const skor = As_terpakai + Av_terpakai;
        
        return skor;
    } catch (error) {
        return Infinity;
    }
}

// ============================================================================
// FUNGSI UNTUK MENYIMPAN TOP 10 KE SESSION STORAGE
// ============================================================================
function saveTop10ToSessionStorage(hasilTerbaik, semuaHasil, inputData) {
    try {
        const amanResults = semuaHasil.filter(h => h.status === 'aman');
        amanResults.sort((a, b) => (a.skor || Infinity) - (b.skor || Infinity));
        const top10 = amanResults.slice(0, 10);
        
        const top10Display = top10.map((hasil, index) => ({
            rank: index + 1,
            D: hasil.D,
            phi: hasil.phi,
            n: hasil.n_terpakai,
            s: hasil.s,
            rho: hasil.rho,
            Ast_i: hasil.Ast_i,
            Ast_u: hasil.Ast_u,
            Av_terpakai: hasil.Av_terpakai,
            skor: hasil.skor,
            kondisi: hasil.kondisi,
            minimum_diterapkan: hasil.minimum_diterapkan
        }));
        
        const top10Data = {
            timestamp: new Date().toISOString(),
            total_kombinasi: semuaHasil.length,
            kombinasi_valid: amanResults.length,
            top10: top10Display,
            kombinasi_terbaik: hasilTerbaik ? {
                D: hasilTerbaik.D,
                phi: hasilTerbaik.phi,
                n: hasilTerbaik.n_terpakai,
                s: hasilTerbaik.s,
                skor: hasilTerbaik.skor,
                minimum_diterapkan: hasilTerbaik.minimum_diterapkan
            } : null
        };
        
        sessionStorage.setItem('kolom_optimizer_top10', JSON.stringify(top10Data));
        return top10Display;
        
    } catch (error) {
        return null;
    }
}

// ============================================================================
// OPTIMIZER UTAMA KHUSUS KOLOM
// ============================================================================
async function optimizeKolom(inputData) {
    console.log('🚀 OPTIMIZER KOLOM DIMULAI...');
    
    try {
        validateKolomInput(inputData);
    } catch (error) {
        return { status: "error", message: error.message };
    }
    
    let rawData;
    if (inputData.raw) {
        rawData = inputData.raw;
    } else if (inputData.parsed?.raw) {
        rawData = inputData.parsed.raw;
    } else {
        rawData = inputData;
    }
    
    console.log(`📊 Kolom ${rawData.dimensi?.b}x${rawData.dimensi?.h} mm | Pu=${rawData.beban?.Pu} kN`);
    
    let kombinasiList = [];
    for (const D of OPTIMIZER_KOLOM.D_KOLOM) {
        for (const phi of OPTIMIZER_KOLOM.PHI_KOLOM) {
            kombinasiList.push({ D, phi });
        }
    }
    
    kombinasiList.sort((a, b) => {
        if (a.D !== b.D) return a.D - b.D;
        return a.phi - b.phi;
    });
    
    console.log(`🔍 Menguji ${kombinasiList.length} kombinasi`);
    
    let hasilTerbaik = null;
    let skorTerbaik = Infinity;
    let kombinasiValid = 0;
    const semuaHasil = [];
    
    for (let i = 0; i < kombinasiList.length; i++) {
        const { D, phi } = kombinasiList[i];
        
        console.log(`🔧 [${i+1}/${kombinasiList.length}] Testing: D${D} φ${phi}`);
        
        try {
            const inputKolom = {
                ...rawData,
                mode: "desain",
                tulangan: { d_tul: D, phi_tul: phi }
            };
            
            let result;
            try {
                result = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(
                        () => reject(new Error('Timeout')),
                        OPTIMIZER_KOLOM.CALCULATION_TIMEOUT
                    );
                    
                    window.calculateKolom(inputKolom, { 
                        autoSave: false, 
                        skipOptimizer: true 
                    })
                        .then(resolve)
                        .catch(reject)
                        .finally(() => clearTimeout(timeout));
                });
            } catch (calcError) {
                semuaHasil.push({ 
                    D, phi, 
                    status: 'calc_error'
                });
                continue;
            }
            
            if (!result || result.status !== 'sukses' || result.data?.aman === false) {
                semuaHasil.push({ 
                    D, phi, 
                    status: result?.status || 'no_result'
                });
                continue;
            }
            
            const kondisiAktif = result.data?.hasilTulangan?.kondisi || '';
            const hasilTulangan = result.data?.hasilTulangan || {};
            
            if (!isKontrolKolomAman(result.kontrol, kondisiAktif, hasilTulangan)) {
                semuaHasil.push({ 
                    D, phi, 
                    status: 'kontrol_gagal', 
                    kondisi: kondisiAktif
                });
                continue;
            }
            
            const skor = hitungSkorOptimalitasKolom(result, D, phi);
            if (!isFinite(skor) || skor <= 0) continue;
            
            kombinasiValid++;
            
            const hasilDetail = {
                D, phi, skor, kondisi: kondisiAktif,
                n_terpakai: hasilTulangan.n_terpakai,
                Ast_i: hasilTulangan.Ast_i,
                Ast_u: hasilTulangan.Ast_u,
                rho: hasilTulangan.rho,
                s: result.data?.begel?.s,
                Av_terpakai: result.data?.begel?.Av_terpakai,
                kontrol_lentur: result.kontrol?.lentur,
                kontrol_geser: result.kontrol?.geser,
                minimum_diterapkan: hasilTulangan.minimum_diterapkan || false,
                result: result
            };
            
            semuaHasil.push({ ...hasilDetail, status: 'aman' });
            
            if (skor < skorTerbaik) {
                skorTerbaik = skor;
                hasilTerbaik = hasilDetail;
            }
            
        } catch (error) {
            semuaHasil.push({ 
                D, phi, 
                status: 'error'
            });
            continue;
        }
    }
    
    saveTop10ToSessionStorage(hasilTerbaik, semuaHasil, inputData);
    
    console.log(`📊 Statistik: ${kombinasiValid}/${kombinasiList.length} valid`);
    
    if (kombinasiValid === 0 || !hasilTerbaik) {
        return {
            status: "error",
            code: "NO_VALID_COMBINATION",
            message: "Tidak ditemukan kombinasi tulangan yang memenuhi semua kontrol untuk kolom ini."
        };
    }
    
    const rekapLengkap = {
        input: rawData,
        Dimensi: hasilTerbaik.result.data.Dimensi,
        tulangan: {
            D: hasilTerbaik.D,
            phi: hasilTerbaik.phi,
            Ast_satu: hasilTerbaik.result.data.hasilTulangan.Ast_satu,
            Ast_i: hasilTerbaik.Ast_i,
            Ast_u: hasilTerbaik.Ast_u,
            n_calculated: hasilTerbaik.result.data.hasilTulangan.n,
            n_terpakai: hasilTerbaik.n_terpakai,
            rho: hasilTerbaik.rho,
            status_n: hasilTerbaik.result.data.hasilTulangan.status,
            e: hasilTerbaik.result.data.hasilTulangan.e,
            Pu: rawData.beban?.Pu,
            Mu: rawData.beban?.Mu,
            Pu_phi: hasilTerbaik.result.data.hasilTulangan.Pu_phi,
            K: hasilTerbaik.result.data.hasilTulangan.K,
            Kmaks: hasilTerbaik.result.data.hasilTulangan.Kmaks,
            K_ok: !hasilTerbaik.result.data.hasilTulangan.K_melebihi_Kmaks,
            kondisi: hasilTerbaik.kondisi,
            faktorPhi: hasilTerbaik.result.data.hasilTulangan.faktorPhi,
            minimum_diterapkan: hasilTerbaik.minimum_diterapkan
        },
        begel: {
            s: hasilTerbaik.s,
            Av_u: hasilTerbaik.result.data.begel.Av_u,
            Av_terpakai: hasilTerbaik.Av_terpakai,
            Vs: hasilTerbaik.result.data.begel.Vs,
            Vs_max: hasilTerbaik.result.data.begel.Vs_max
        },
        kontrol: hasilTerbaik.result.kontrol,
        formatted: {
            tulangan_utama: `${hasilTerbaik.n_terpakai}D${hasilTerbaik.D}`,
            begel: `Φ${hasilTerbaik.phi}-${hasilTerbaik.s}`
        }
    };
    
    return {
        status: "sukses",
        data: hasilTerbaik.result.data,
        kontrol: hasilTerbaik.result.kontrol,
        rekap: rekapLengkap,
        D_opt: hasilTerbaik.D,
        phi_opt: hasilTerbaik.phi,
        d_tul: hasilTerbaik.D,
        phi_tul: hasilTerbaik.phi,
        n_opt: hasilTerbaik.n_terpakai,
        s_opt: hasilTerbaik.s,
        optimasi: {
            kombinasi_terbaik: {
                D: hasilTerbaik.D,
                phi: hasilTerbaik.phi
            }
        }
    };
}

// ============================================================================
// EKSPOR FUNGSI KE WINDOW
// ============================================================================
if (typeof window !== 'undefined') {
    window.optimizeKolom = optimizeKolom;
    window.hitungSkorOptimalitasKolom = hitungSkorOptimalitasKolom;
}

console.log("✅ optimizer-kolom.js loaded - Lengkap dengan semua perbaikan");