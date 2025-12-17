// =====================================================
// calc-fondasi.js (versi terstruktur dengan kontrol logging dan validasi lengkap)
// =====================================================

// ===== UTILITAS DASAR =====
function ceili(x, i) {
    return Math.ceil(Number(x) / i) * i;
}

function floori(x, i) {
    return Math.floor(Number(x) / i) * i;
}

function hitungAsTerpasang(D, s) {
    return (Math.PI * D * D * 1000) / (4 * Math.max(s, 1));
}

// ===== VARIABEL KONTROL LOGGING =====
let ENABLE_DETAILED_LOGGING = false;

function setDetailedLogging(enabled) {
    ENABLE_DETAILED_LOGGING = enabled;
}

function logDetail(message) {
    if (ENABLE_DETAILED_LOGGING) {
        // Logging dinonaktifkan
    }
}

// =====================================================
// ===== FUNGSI UTAMA DENGAN VALIDASI LENGKAP =====
function calculateFondasi(data, options = {}) {
    // ===== VALIDASI DASAR =====
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { 
            status: 'error', 
            message: 'Data input tidak valid. Harus berupa object JavaScript.',
            details: 'Data yang diterima: ' + typeof data,
            timestamp: new Date().toISOString()
        };
    }
    
    const { module, mode } = data;
    
    if (!module || module !== "fondasi") {
        return { 
            status: 'error', 
            message: `Module tidak dikenali: ${module}. Harus "fondasi".`,
            timestamp: new Date().toISOString()
        };
    }
    
    if (!mode || (mode !== "desain" && mode !== "evaluasi")) {
        return { 
            status: "error", 
            message: `Mode tidak dikenali: ${mode}. Harus "desain" atau "evaluasi".`,
            timestamp: new Date().toISOString()
        };
    }
    
    // ===== VALIDASI DATA WAJIB =====
    const requiredFields = ['fondasi', 'material', 'beban'];
    const missingFields = [];
    
    for (const field of requiredFields) {
        if (!data[field]) {
            missingFields.push(field);
        }
    }
    
    if (missingFields.length > 0) {
        return { 
            status: 'error', 
            message: `Field wajib tidak ditemukan: ${missingFields.join(', ')}`,
            timestamp: new Date().toISOString()
        };
    }
    
    // ===== CABANG MODE =====
    if (mode === "desain") {
        if (typeof window.optimizeDesainFondasi === 'function') {
            const previousLoggingState = ENABLE_DETAILED_LOGGING;
            setDetailedLogging(false);
            
            try {
                const result = window.optimizeDesainFondasi(data);
                setDetailedLogging(previousLoggingState);
                
                // PERBAIKAN: Deteksi jika optimizer tidak menemukan solusi
                if (result && result.status === "error") {
                    return {
                        status: 'error',
                        message: result.message || 'Tidak ditemukan fondasi yang memenuhi syarat',
                        details: {
                            type: 'no_solution_found',
                            attempts: result.details?.attempts || 100
                        },
                        timestamp: new Date().toISOString()
                    };
                }
                
                // PERBAIKAN: Deteksi fallback dari optimizer
                if (result && result.optimasi && result.optimasi.status === 'fallback') {
                    return {
                        status: 'error',
                        message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                        details: {
                            type: 'fallback_no_solution',
                            catatan: result.optimasi.catatan || 'Menggunakan fallback karena tidak ada solusi valid'
                        },
                        timestamp: new Date().toISOString()
                    };
                }
                
                // PERBAIKAN: Validasi kontrol hasil optimasi
                if (result && result.kontrol) {
                    const semuaAman = isSemuaKontrolAman(result.kontrol);
                    if (!semuaAman) {
                        return {
                            status: 'error',
                            message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                            details: {
                                type: 'kontrol_tidak_aman',
                                kontrol: result.kontrol
                            },
                            timestamp: new Date().toISOString()
                        };
                    }
                }
                
                if (result && result.status === "sukses") {
                    if (!result.timestamp) {
                        result.timestamp = new Date().toISOString();
                    }
                    if (!result.optimasi) {
                        result.optimasi = {
                            status: 'optimized',
                            catatan: 'Perhitungan dengan optimizer'
                        };
                    }
                }
                
                return result;
            } catch (optimizerError) {
                setDetailedLogging(previousLoggingState);
                
                return {
                    status: 'error',
                    message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                    details: {
                        type: 'optimizer_error',
                        error: optimizerError.message
                    },
                    timestamp: new Date().toISOString()
                };
            }
        } else {
            const result = hitungDesainFondasi(data, options);
            
            // PERBAIKAN: Validasi kontrol untuk desain tanpa optimizer
            if (result && result.status === "sukses" && result.kontrol) {
                const semuaAman = isSemuaKontrolAman(result.kontrol);
                if (!semuaAman) {
                    return {
                        status: 'error',
                        message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                        details: {
                            type: 'kontrol_tidak_aman',
                            kontrol: result.kontrol
                        },
                        timestamp: new Date().toISOString()
                    };
                }
                
                if (!result.optimasi) {
                    result.optimasi = {
                        status: 'no_optimizer',
                        catatan: 'Perhitungan tanpa optimizer'
                    };
                }
            }
            
            return result;
        }
    } else if (mode === "evaluasi") {
        const result = hitungEvaluasiFondasi(data, options);
        
        // PERBAIKAN: Validasi kontrol untuk evaluasi
        if (result && result.status === "sukses" && result.kontrol) {
            const semuaAman = isSemuaKontrolAman(result.kontrol);
            if (!semuaAman) {
                return {
                    status: 'error',
                    message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                    details: {
                        type: 'kontrol_tidak_aman',
                        kontrol: result.kontrol
                    },
                    timestamp: new Date().toISOString()
                };
            }
            
            if (!result.optimasi) {
                result.optimasi = {
                    status: 'evaluated',
                    catatan: 'Perhitungan evaluasi tanpa optimasi'
                };
            }
        }
        
        return result;
    }
}

// =====================================================
// ===== FUNGSI BANTU UNTUK VALIDASI KONTROL =====
function isSemuaKontrolAman(kontrol) {
    if (!kontrol) return false;
    
    const kriteria = [
        kontrol.sigmaMinAman,
        kontrol.dayaDukung?.aman,
        kontrol.geser?.aman1,
        kontrol.geser?.aman2,
        kontrol.tulangan?.aman,
        kontrol.kuatDukung?.aman,
        kontrol.tulanganTambahan?.aman
    ];
    
    // PERBAIKAN: Tambahkan validasi untuk evaluasi tulangan jika ada
    if (kontrol.evaluasiTulangan) {
        kriteria.push(kontrol.evaluasiTulangan.aman);
    }
    
    return kriteria.every(k => k === true);
}

// =====================================================
// ===== MODE OPERASI UNTUK KONSISTENSI =====

function processDesainFondasi(hasil, kontrol, rekap, optimasi = {}) {
    // PERBAIKAN: Validasi kontrol sebelum mengembalikan sukses
    if (!isSemuaKontrolAman(kontrol)) {
        return {
            status: "error",
            message: "Tidak ditemukan fondasi yang memenuhi syarat",
            details: "Kontrol desain tidak aman",
            timestamp: new Date().toISOString()
        };
    }
    
    return {
        status: "sukses",
        mode: "desain",
        data: hasil,
        kontrol: kontrol,
        rekap: rekap,
        optimasi: optimasi,
        timestamp: new Date().toISOString()
    };
}

function processEvaluasiFondasi(hasil, kontrol, rekap) {
    // PERBAIKAN: Validasi kontrol sebelum mengembalikan sukses
    if (!isSemuaKontrolAman(kontrol)) {
        return {
            status: "error",
            message: "Tidak ditemukan fondasi yang memenuhi syarat",
            details: "Kontrol evaluasi tidak aman",
            timestamp: new Date().toISOString()
        };
    }
    
    return {
        status: "sukses",
        mode: "evaluasi",
        data: hasil,
        kontrol: kontrol,
        rekap: rekap,
        optimasi: {
            status: 'evaluated',
            catatan: 'Perhitungan evaluasi'
        },
        timestamp: new Date().toISOString()
    };
}

// =====================================================
// ===== FUNGSI HITUNG DESAIN DENGAN ERROR HANDLING =====
function hitungDesainFondasi(data, options = {}) {
    try {
        const input = parseInputFondasi(data);
        
        if (input.error) {
            return { 
                status: 'error', 
                message: `Error parsing input: ${input.detail}`,
                timestamp: new Date().toISOString()
            };
        }

        const hasil = hitungFondasiInti(input);
        
        if (!hasil) {
            return {
                status: 'error',
                message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                details: 'Perhitungan inti tidak menghasilkan output',
                timestamp: new Date().toISOString()
            };
        }
        
        const requiredComponents = ['parameter', 'dayaDukung', 'kontrolGeser', 'tulangan', 'kuatDukung'];
        const missingComponents = requiredComponents.filter(comp => !hasil[comp]);
        
        if (missingComponents.length > 0) {
            return {
                status: 'error',
                message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                details: 'Hasil perhitungan tidak lengkap: ' + missingComponents.join(', '),
                timestamp: new Date().toISOString()
            };
        }
        
        // PERBAIKAN: Validasi nilai kritis
        if (hasil.parameter.sigma_min <= 0) {
            return {
                status: 'error',
                message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                details: 'Sigma_min negatif atau nol',
                timestamp: new Date().toISOString()
            };
        }
        
        if (hasil.dayaDukung.status !== "AMAN") {
            return {
                status: 'error',
                message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                details: 'Daya dukung tanah tidak aman',
                timestamp: new Date().toISOString()
            };
        }
        
        const kontrol = kontrolFondasi(hasil, input, "desain");
        const rekap = rekapHasilFondasi(hasil, input, "desain");
        
        // PERBAIKAN: Kembalikan hasil dengan validasi kontrol
        return processDesainFondasi(hasil, kontrol, rekap, {
            status: 'no_optimizer',
            catatan: 'Perhitungan tanpa optimizer'
        });
        
    } catch (error) {
        return {
            status: "error",
            message: 'Tidak ditemukan fondasi yang memenuhi syarat',
            details: `Error dalam perhitungan desain: ${error.message}`,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
    }
}

// =====================================================
// ===== FUNGSI HITUNG EVALUASI DENGAN ERROR HANDLING =====
function hitungEvaluasiFondasi(data, options = {}) {
    try {
        const input = parseInputFondasi(data);
        
        if (input.error) {
            return { 
                status: 'error', 
                message: `Error parsing input: ${input.detail}`,
                timestamp: new Date().toISOString()
            };
        }

        const hasil = hitungFondasiInti(input);
        
        if (!hasil) {
            return {
                status: 'error',
                message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                details: 'Perhitungan evaluasi tidak menghasilkan output',
                timestamp: new Date().toISOString()
            };
        }
        
        const requiredComponents = ['parameter', 'dayaDukung', 'kontrolGeser', 'tulangan', 'kuatDukung'];
        const missingComponents = requiredComponents.filter(comp => !hasil[comp]);
        
        if (missingComponents.length > 0) {
            return {
                status: 'error',
                message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                details: 'Komponen hasil tidak lengkap: ' + missingComponents.join(', '),
                timestamp: new Date().toISOString()
            };
        }
        
        // PERBAIKAN: Validasi nilai kritis
        if (hasil.parameter.sigma_min <= 0) {
            return {
                status: 'error',
                message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                details: 'Sigma_min negatif atau nol',
                timestamp: new Date().toISOString()
            };
        }
        
        if (hasil.dayaDukung.status !== "AMAN") {
            return {
                status: 'error',
                message: 'Tidak ditemukan fondasi yang memenuhi syarat',
                details: 'Daya dukung tanah tidak aman',
                timestamp: new Date().toISOString()
            };
        }
        
        const kontrol = kontrolFondasi(hasil, input, "evaluasi");
        const rekap = rekapHasilFondasi(hasil, input, "evaluasi");
        
        // PERBAIKAN: Kembalikan hasil dengan validasi kontrol
        return processEvaluasiFondasi(hasil, kontrol, rekap);
        
    } catch (error) {
        return {
            status: "error",
            message: 'Tidak ditemukan fondasi yang memenuhi syarat',
            details: `Error dalam perhitungan evaluasi: ${error.message}`,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
    }
}

// =====================================================
// ===== FUNGSI PARSING INPUT DENGAN VALIDASI =====
function parseInputFondasi(data) {
    try {
        if (!data) {
            throw new Error("Data input kosong");
        }
        
        const fondasi = data.fondasi || {};
        const dimensi = fondasi.dimensi || {};
        const tanah = data.tanah || {};
        const tanahAuto = tanah.auto || {};
        const tanahManual = tanah.manual || {};
        const beban = data.beban || {};
        const material = data.material || {};
        const lanjutan = data.lanjutan || {};
        const tulangan = data.tulangan || {};

        const validationErrors = [];
        
        if (!dimensi.lx || !dimensi.ly) {
            validationErrors.push("Dimensi lx dan ly harus diisi");
        } else {
            if (parseFloat(dimensi.lx) <= 0) validationErrors.push("lx harus > 0");
            if (parseFloat(dimensi.ly) <= 0) validationErrors.push("ly harus > 0");
        }
        
        if (!beban.pu || parseFloat(beban.pu) <= 0) {
            validationErrors.push("Beban Pu harus diisi dan > 0");
        }
        
        if (!material.fc || parseFloat(material.fc) <= 0) {
            validationErrors.push("Material fc harus diisi dan > 0");
        }
        
        if (!material.fy || parseFloat(material.fy) <= 0) {
            validationErrors.push("Material fy harus diisi dan > 0");
        }
        
        if (validationErrors.length > 0) {
            throw new Error(`Validasi gagal:\n${validationErrors.join('\n')}`);
        }

        let fondasiMode = fondasi.mode;
        
        const parsedData = {
            mode: data.mode,
            fondasiMode: fondasiMode,
            autoDimensi: !!fondasi.autoDimensi,

            lx: parseFloat(dimensi.lx) || 0,
            ly: parseFloat(dimensi.ly) || 0,
            bx: parseFloat(dimensi.bx) || 0,
            by: parseFloat(dimensi.by) || 0,
            h: parseFloat(dimensi.h) || 0,
            alpha_s: parseFloat(dimensi.alpha_s) || 40,

            Pu: parseFloat(beban.pu) || 0,
            Mux: parseFloat(beban.mux) || 0,
            Muy: parseFloat(beban.muy) || 0,

            fc: parseFloat(material.fc) || 0,
            fy: parseFloat(material.fy) || 0,
            gammaC: parseFloat(material.gammaC) || 0,

            df_auto: parseFloat(tanahAuto.df) || 0,
            gamma_auto: parseFloat(tanahAuto.gamma) || 0,
            phi: parseFloat(tanahAuto.phi) || 0,
            c: parseFloat(tanahAuto.c) || 0,
            qc: parseFloat(tanahAuto.qc) || 0,
            terzaghi: tanahAuto.terzaghi,
            mayerhoff: tanahAuto.mayerhoff,

            qa: parseFloat(tanahManual.qa) || 0,
            df_manual: parseFloat(tanahManual.df) || 0,
            gamma_manual: parseFloat(tanahManual.gamma) || 0,

            modeTanah: tanah.mode || "auto",

            lambda: parseFloat(lanjutan.lambda) || 1,

            D: parseFloat(tulangan.d) || 0,
            Db: parseFloat(tulangan.db) || 0,
            s: parseFloat(tulangan.s) || 0,
            sp: parseFloat(tulangan.sp) || 0,
            st: parseFloat(tulangan.st) || 0,
            sb: parseFloat(tulangan.sb) || 0,

            phi1: 0.9,
            phi2: 0.75,
            phie: 1,
            phit: 1,
            phis: (parseFloat(tulangan.d) || 0) <= 19 ? 0.8 : 1,
            sbeton: 75
        };
        
        return parsedData;
        
    } catch (err) {
        return {
            error: "Parsing error",
            detail: err?.message || err.toString(),
            stack: err?.stack,
            timestamp: new Date().toISOString()
        };
    }
}

// =====================================================
// ===== PERHITUNGAN INTI FONDASI =====
function hitungFondasiInti(input) {
    const {
        fondasiMode, lx, ly, bx, by, h, Pu, Mux, Muy, fc, fy, gammaC,
        df_auto, gamma_auto, phi, c, qc, terzaghi, mayerhoff, 
        qa, modeTanah, df_manual, gamma_manual, lambda,
        D, Db, s, sp, st, sb, phi1, phi2, phie, phit, phis, sbeton, alpha_s
    } = input;

    const df = modeTanah === "manual" ? df_manual : df_auto;
    const gamma = modeTanah === "manual" ? gamma_manual : gamma_auto;

    try {
        let actualFondasiMode = fondasiMode;
        
        if (fondasiMode === "tunggal") {
            if (Math.abs(ly - lx) < 0.001) {
                actualFondasiMode = "bujur_sangkar";
            } else {
                actualFondasiMode = "persegi_panjang";
            }
        } else if (fondasiMode === "menerus") {
            actualFondasiMode = "menerus";
        } else {
            actualFondasiMode = fondasiMode;
        }

        const parameter = hitungParameterFondasi(actualFondasiMode, ly, lx, by, bx, h, Pu, Mux, Muy, gammaC, gamma, df, fc, fy, D, sbeton, alpha_s);
        
        // PERBAIKAN: Validasi sigma_min
        if (parameter.sigma_min <= 0) {
            throw new Error("Sigma_min negatif atau nol");
        }
        
        parameter.sigma_status = parameter.sigma_min > 0 ? "AMAN" : "BAHAYA";
        
        const dayaDukung = hitungDayaDukungTanah(phi, lx, ly, df, gamma, c, qc, parameter.sigma_max, mayerhoff, terzaghi, qa, modeTanah);
        
        // PERBAIKAN: Validasi daya dukung
        if (dayaDukung.status !== "AMAN") {
            throw new Error("Daya dukung tanah tidak aman");
        }
        
        let kontrolGeser;
        if (actualFondasiMode === "menerus") {
            kontrolGeser = kontrolGeserFondasiMenerus(parameter.a, lx, ly, parameter.sigma_max, parameter.sigma_min, fc, lambda, bx, by, parameter.d, parameter.b0, phi2, parameter.alpha_s);
        } else {
            kontrolGeser = kontrolGeserFondasiTunggal(parameter.a, lx, ly, parameter.sigma_max, parameter.sigma_min, parameter.sigma_a, fc, lambda, bx, by, parameter.d, parameter.b0, phi2, parameter.alpha_s);
        }
        
        let tulangan;
        if (actualFondasiMode === "bujur_sangkar") {
            tulangan = bujurSangkar(ly, parameter.x1, parameter.sigma_min, parameter.sigma_max, phi1, 1000, parameter.d, parameter.Kmax, fc, fy, D, h);
            tulangan.jenis = "bujur_sangkar";
        } else if (actualFondasiMode === "persegi_panjang") {
            const tul_panjang = bujurSangkar(ly, parameter.x1, parameter.sigma_min, parameter.sigma_max, phi1, 1000, parameter.d, parameter.Kmax, fc, fy, D, h);
            const tul_pendek = persegiPanjang(lx, ly, parameter.sigma_max, parameter.x2, phi1, 1000, parameter.d2, fc, fy, h, Db, parameter.Kmax);
            tulangan = {
                bujur: tul_panjang,
                persegi: tul_pendek,
                jenis: "persegi_panjang"
            };
        } else if (actualFondasiMode === "menerus") {
            tulangan = menerus(parameter.sigma_max, parameter.x2, phi1, 1000, parameter.d, fc, fy, D, h, Db, parameter.Kmax);
            tulangan.jenis = "menerus";
        }

        let kuatDukung;
        if (actualFondasiMode === "bujur_sangkar") {
            kuatDukung = kuatDukungTunggal(lx, bx, by, fc, fy, D, tulangan.s, lambda, h, Pu, sbeton, tulangan.As);
        } else if (actualFondasiMode === "persegi_panjang") {
            kuatDukung = kuatDukungTunggal(lx, bx, by, fc, fy, Db, tulangan.persegi.s_pusat, lambda, h, Pu, sbeton, tulangan.persegi.As);
        } else if (actualFondasiMode === "menerus") {
            kuatDukung = kuatDukungMenerus(lx, bx, fc, fy, Db, tulangan.s_utama, lambda, h, Pu, sbeton);
        }
        
        return {
            parameter,
            dayaDukung,
            kontrolGeser,
            tulangan,
            kuatDukung,
            status: "sukses",
            actualFondasiMode: actualFondasiMode
        };
        
    } catch (error) {
        throw error;
    }
}

// =====================================================
// ===== FUNGSI KONTROL FONDASI =====
function kontrolFondasi(hasil, input, mode = "desain") {
    const { dayaDukung, kontrolGeser, tulangan, kuatDukung, parameter } = hasil;

    const sigmaMinAman = parameter && parameter.sigma_min > 0;
    
    let kontrolKAman = true;
    let detailKontrolK = {};
    
    if (tulangan.jenis === "bujur_sangkar") {
        kontrolKAman = tulangan.Kontrol_K === "AMAN";
        detailKontrolK = {
            jenis: "bujur_sangkar",
            K: tulangan.K,
            Kmax: parameter.Kmax,
            aman: kontrolKAman
        };
    } else if (tulangan.jenis === "persegi_panjang") {
        const kontrolKBujur = tulangan.bujur?.Kontrol_K === "AMAN";
        const kontrolKPersegi = tulangan.persegi?.Kontrol_K === "AMAN";
        kontrolKAman = kontrolKBujur && kontrolKPersegi;
        
        detailKontrolK = {
            jenis: "persegi_panjang",
            bujur: {
                K: tulangan.bujur?.K,
                Kmax: parameter.Kmax,
                aman: kontrolKBujur
            },
            persegi: {
                K: tulangan.persegi?.K,
                Kmax: parameter.Kmax,
                aman: kontrolKPersegi
            }
        };
    } else if (tulangan.jenis === "menerus") {
        kontrolKAman = tulangan.Kontrol_K === "AMAN";
        detailKontrolK = {
            jenis: "menerus",
            K: tulangan.K,
            Kmax: parameter.Kmax,
            aman: kontrolKAman
        };
    }

    const kuatDukungPuAman = kuatDukung.Kontrol_Pu === "AMAN";
    const kuatDukungIdhAman = kuatDukung.Kontrol_Idh === "AMAN";
    const kuatDukungAman = kuatDukungPuAman && kuatDukungIdhAman;
    
    let kontrolTulanganTambahan = { aman: true, detail: {} };
    
    if (tulangan.jenis === "bujur_sangkar") {
        kontrolTulanganTambahan.detail.s_bujur = {
            aman: tulangan.s >= 100,
            nilai: tulangan.s,
            minimal: 100
        };
        if (tulangan.s < 100) kontrolTulanganTambahan.aman = false;
        
    } else if (tulangan.jenis === "persegi_panjang") {
        kontrolTulanganTambahan.detail.s_bujur = {
            aman: tulangan.bujur.s >= 100,
            nilai: tulangan.bujur.s,
            minimal: 100
        };
        kontrolTulanganTambahan.detail.s_pusat = {
            aman: tulangan.persegi.s_pusat >= 100,
            nilai: tulangan.persegi.s_pusat,
            minimal: 100
        };
        kontrolTulanganTambahan.detail.s_tepi = {
            aman: tulangan.persegi.s_tepi >= 100,
            nilai: tulangan.persegi.s_tepi,
            minimal: 100
        };
        
        if (tulangan.bujur.s < 100 || tulangan.persegi.s_pusat < 100 || tulangan.persegi.s_tepi < 100) {
            kontrolTulanganTambahan.aman = false;
        }
        
    } else if (tulangan.jenis === "menerus") {
        kontrolTulanganTambahan.detail.s_utama = {
            aman: tulangan.s_utama >= 100,
            nilai: tulangan.s_utama,
            minimal: 100
        };
        kontrolTulanganTambahan.detail.s_bagi = {
            aman: tulangan.s_bagi >= 100,
            nilai: tulangan.s_bagi,
            minimal: 100
        };
        
        if (tulangan.s_utama < 100 || tulangan.s_bagi < 100) {
            kontrolTulanganTambahan.aman = false;
        }
    }

    let kontrolEvaluasiTulangan = { aman: true, detail: {} };
    if (mode === "evaluasi") {
        if (tulangan.jenis === "bujur_sangkar") {
            const s_input = input.s;
            const s_hitung = tulangan.s;
            kontrolEvaluasiTulangan.detail.s_bujur = {
                aman: s_input <= s_hitung,
                s_input: s_input,
                s_hitung: s_hitung,
                pesan: s_input <= s_hitung ? 
                    "AMAN (s input ≤ s hitung)" : 
                    "BAHAYA (s input > s hitung)"
            };
            if (s_input > s_hitung) kontrolEvaluasiTulangan.aman = false;
            
        } else if (tulangan.jenis === "persegi_panjang") {
            const s_input = input.s;
            const s_hitung_bujur = tulangan.bujur.s;
            
            kontrolEvaluasiTulangan.detail.s_bujur = {
                aman: s_input <= s_hitung_bujur,
                s_input: s_input,
                s_hitung: s_hitung_bujur,
                pesan: s_input <= s_hitung_bujur ? 
                    "AMAN (s input ≤ s hitung)" : 
                    "BAHAYA (s input > s hitung)"
            };
            
            const sp_input = input.sp;
            const sp_hitung = tulangan.persegi.s_pusat;
            
            kontrolEvaluasiTulangan.detail.s_pusat = {
                aman: sp_input <= sp_hitung,
                s_input: sp_input,
                s_hitung: sp_hitung,
                pesan: sp_input <= sp_hitung ? 
                    "AMAN (sp input ≤ sp hitung)" : 
                    "BAHAYA (sp input > sp hitung)"
            };
            
            const st_input = input.st;
            const st_hitung = tulangan.persegi.s_tepi;
            
            kontrolEvaluasiTulangan.detail.s_tepi = {
                aman: st_input <= st_hitung,
                s_input: st_input,
                s_hitung: st_hitung,
                pesan: st_input <= st_hitung ? 
                    "AMAN (st input ≤ st hitung)" : 
                    "BAHAYA (st input > st hitung)"
            };
            
            if (s_input > s_hitung_bujur || sp_input > sp_hitung || st_input > st_hitung) {
                kontrolEvaluasiTulangan.aman = false;
            }
            
        } else if (tulangan.jenis === "menerus") {
            const s_input = input.s;
            const s_hitung_utama = tulangan.s_utama;
            
            kontrolEvaluasiTulangan.detail.s_utama = {
                aman: s_input <= s_hitung_utama,
                s_input: s_input,
                s_hitung: s_hitung_utama,
                pesan: s_input <= s_hitung_utama ? 
                    "AMAN (s input ≤ s hitung)" : 
                    "BAHAYA (s input > s hitung)"
            };
            
            const sb_input = input.sb;
            const sb_hitung = tulangan.s_bagi;
            
            kontrolEvaluasiTulangan.detail.s_bagi = {
                aman: sb_input <= sb_hitung,
                s_input: sb_input,
                s_hitung: sb_hitung,
                pesan: sb_input <= sb_hitung ? 
                    "AMAN (sb input ≤ sb hitung)" : 
                    "BAHAYA (sb input > sb hitung)"
            };
            
            if (s_input > s_hitung_utama || sb_input > sb_hitung) {
                kontrolEvaluasiTulangan.aman = false;
            }
        }
    }

    return {
        sigmaMinAman: sigmaMinAman,
        dayaDukung: {
            aman: dayaDukung.status === "AMAN",
            detail: dayaDukung
        },
        geser: {
            aman1: kontrolGeser.amanGeser1 === "AMAN",
            aman2: kontrolGeser.amanGeser2 === "AMAN",
            detail: kontrolGeser
        },
        tulangan: {
            aman: kontrolKAman,
            detail: tulangan,
            detailKontrolK: detailKontrolK
        },
        kuatDukung: {
            aman: kuatDukungAman,
            detail: kuatDukung
        },
        tulanganTambahan: kontrolTulanganTambahan,
        evaluasiTulangan: mode === "evaluasi" ? kontrolEvaluasiTulangan : null
    };
}

// =====================================================
// ===== FUNGSI REKAP HASIL =====
function rekapHasilFondasi(hasil, input, mode = "desain") {
    const { dayaDukung, kontrolGeser, tulangan, kuatDukung, parameter } = hasil;
    const { fondasiMode, lx, ly } = input;

    const formatTulangan = (s, diameter) => {
        if (!s || s === 0) return "-";
        return `ɸ${diameter}-${s}`;
    };

    const formatStatus = (aman) => aman ? "✅ AMAN" : "❌ BAHAYA";

    const kontrol = kontrolFondasi(hasil, input, mode);
    
    let rekap = {
        dimensi: `${lx.toFixed(2)}m x ${ly.toFixed(2)}m`,
        sigma_min: `${parameter.sigma_min.toFixed(2)} kPa (${formatStatus(kontrol.sigmaMinAman)})`,
        tekanan_tanah: `${dayaDukung.status} (${formatStatus(kontrol.dayaDukung.aman)})`,
        geser: `${kontrolGeser.amanGeser1}/${kontrolGeser.amanGeser2} (${formatStatus(kontrol.geser.aman1 && kontrol.geser.aman2)})`,
        kontrol_K: `${formatStatus(kontrol.tulangan.aman)}`,
        kuat_dukung: `${kuatDukung.Kontrol_Pu}/${kuatDukung.Kontrol_Idh} (${formatStatus(kontrol.kuatDukung.aman)})`
    };

    if (kontrol.tulanganTambahan) {
        rekap.kontrol_s_minimal = formatStatus(kontrol.tulanganTambahan.aman);
    }

    if (mode === "evaluasi" && kontrol.evaluasiTulangan) {
        rekap.evaluasi_tulangan = formatStatus(kontrol.evaluasiTulangan.aman);
    }

    if (tulangan.jenis === "bujur_sangkar") {
        rekap.tulangan_utama = formatTulangan(tulangan.s, input.D);
        rekap.tulangan_bagi = "-";
        
    } else if (tulangan.jenis === "persegi_panjang") {
        rekap.tulangan_panjang = formatTulangan(tulangan.bujur.s, input.D);
        rekap.tulangan_pendek_pusat = formatTulangan(tulangan.persegi.s_pusat, input.Db);
        rekap.tulangan_pendek_tepi = formatTulangan(tulangan.persegi.s_tepi, input.Db);
        
    } else if (tulangan.jenis === "menerus") {
        rekap.tulangan_utama = formatTulangan(tulangan.s_utama, input.D);
        rekap.tulangan_bagi = formatTulangan(tulangan.s_bagi, input.Db);
    }

    return rekap;
}

// =====================================================
// ===== SUB-FUNGSI PERHITUNGAN DETAIL =====

function hitungParameterFondasi(fondasiMode, Ly, Lx, by, bx, h, Pu, Mux, Muy, Gc, Gamma, Df, fc, fy, D, sbeton, alpha_s) {
    try {
        const ds = ceili(sbeton + D / 2, 5);
        const ds2 = ceili(sbeton + D + D / 2, 5);
        
        const d = h * 1000 - ds;
        const d2 = h * 1000 - ds2;
        
        let a;
        if (fondasiMode === "menerus") {
            a = (Lx / 2 - bx / 1000 / 2 - d / 1000);
        } else {
            a = (Ly / 2 - by / 1000 / 2 - d / 1000);
        }
        
        const q = h * Gc + (Df - h) * Gamma;
        
        const area = Lx * Ly;
        const Wx = (Lx * Math.pow(Ly, 2)) / 6;
        const Wy = (Ly * Math.pow(Lx, 2)) / 6;
        
        const sigma_avg = Pu / area;
        const sigma_mux = Mux / Wx;
        const sigma_muy = Muy / Wy;
        
        const sigma_min = sigma_avg - sigma_mux - sigma_muy + q;
        const sigma_max = sigma_avg + sigma_mux + sigma_muy + q;
        const sigma_status = sigma_min > 0 ? "AMAN" : "BAHAYA";
        
        let sigma_a = 0;
        if (fondasiMode !== "menerus") {
            sigma_a = sigma_min + (Ly - a) * (sigma_max - sigma_min) / Ly;
        }
        
        const x1 = Ly / 2 - by / 1000 / 2;
        const x2 = Lx / 2 - bx / 1000 / 2;
        
        let b0;
        if (fondasiMode === "menerus") {
            b0 = 2 * ((bx + d) + Ly * 1000);
        } else {
            b0 = 2 * ((bx + d) + (by + d));
        }
        
        const beta1 = (fc <= 28) ? 0.85 : (fc >= 55) ? 0.65 : 0.85 - 0.05 * (fc - 28) / 7;
        
        const Kmax = (382.5 * beta1 * fc * (600 + fy - 225 * beta1)) / Math.pow((600 + fy), 2);

        return {
            ds, ds2, d, d2, a, q, 
            sigma_min, sigma_max, sigma_status, sigma_a, 
            x1, x2, b0, beta1, Kmax,
            alpha_s: alpha_s,
            lx: Lx,
            ly: Ly
        };
    } catch (error) {
        throw error;
    }
}

function hitungDayaDukungTanah(Fi, Lx, Ly, Df, gamma, c, qc, sigma_max, mayerhoff, terzaghi, qa_manual, modeTanah) {
    try {
        if (modeTanah === "manual" && qa_manual && qa_manual > 0) {
            const status = qa_manual > sigma_max ? "AMAN" : "BAHAYA";
            
            return {
                qa: qa_manual,
                sigma_max: sigma_max,
                status: status,
                method: "Manual",
                df: Df,
                gamma: gamma
            };
        }

        const phi_rad = (Fi * Math.PI) / 180;
        
        const a = Math.exp((3 * Math.PI / 4 - phi_rad / 2) * Math.tan(phi_rad));
        const Kp_gamma = 3 * Math.pow(Math.tan((45 + 0.5 * (Fi + 33)) * Math.PI / 180), 2);
        const Nc = (1 / Math.tan(phi_rad)) * (Math.pow(a, 2) / (2 * Math.pow(Math.cos(Math.PI / 4 + phi_rad / 2), 2)) - 1);
        const Nq = Math.pow(a, 2) / (2 * Math.pow(Math.cos(Math.PI / 4 + phi_rad / 2), 2));
        const Ngamma = 0.5 * Math.tan(phi_rad) * (Kp_gamma / Math.pow(Math.cos(phi_rad), 2) - 1);
        
        const qu_terzaghi = c * Nc * (1 + 0.3 * Lx / Ly) + Df * gamma * Nq + 0.5 * Lx * Ngamma * (1 - 0.2 * Lx / Ly);
        const qa_terzaghi = qu_terzaghi / 3;
        
        let Kd = 1 + 0.33 * Df / Lx;
        if (Kd > 1.33) Kd = 1.33;
        const qa_meyerhof = (qc / 33) * Math.pow((Lx + 0.3) / Lx, 2) * Kd * 100;
        
        let qa, method;
        if (terzaghi && mayerhoff) {
            qa = Math.min(qa_terzaghi, qa_meyerhof);
            method = "Terzaghi & Meyerhof";
        } else if (terzaghi) {
            qa = qa_terzaghi;
            method = "Terzaghi";
        } else {
            qa = qa_meyerhof;
            method = "Meyerhof";
        }
        
        const status = qa > sigma_max ? "AMAN" : "BAHAYA";
        
        return {
            phi_rad, a, Kp_gamma, Nc, Nq, Ngamma, 
            qu_terzaghi, qa_terzaghi, Kd, qa_meyerhof, 
            qa, sigma_max, status, method,
            df: Df,
            gamma: gamma
        };
    } catch (error) {
        throw error;
    }
}

function kontrolGeserFondasiTunggal(a, Lx, Ly, sigma_max, sigma_min, sigma_a, fc, lambda, bx, by, d, b0, phi2, alpha_s) {
    try {
        const Vu1 = a * Lx * (sigma_max + sigma_a) / 2;
        const Vc1 = phi2 * 0.17 * lambda * Math.sqrt(fc) * Lx * d;
        const amanGeser1 = (Vu1 <= Vc1) ? "AMAN" : "BAHAYA";
        
        const Vu2 = (Lx * Ly - (bx + d) / 1000 * (by + d) / 1000) * ((sigma_max + sigma_min) / 2);
        const Vc21 = 0.17 * (1 + 2 / (by / bx)) * lambda * Math.sqrt(fc) * b0 * d / 1000;
        const Vc22 = 0.083 * (2 + (alpha_s * d / b0)) * lambda * Math.sqrt(fc) * b0 * d / 1000;
        const Vc23 = 0.33 * Math.sqrt(fc) * b0 * d / 1000;
        const Vc2 = Math.min(Vc21, Vc22, Vc23);
        const phiVc2 = phi2 * Vc2;
        const amanGeser2 = (Vu2 <= phiVc2) ? "AMAN" : "BAHAYA";
        
        return { Vu1, Vc1, amanGeser1, Vu2, Vc21, Vc22, Vc23, Vc2, phiVc2, amanGeser2 };
    } catch (error) {
        throw error;
    }
}

function kontrolGeserFondasiMenerus(a, Lx, Ly, sigma_max, sigma_min, fc, lambda, bx, by, d, b0, phi2, alpha_s) {
    try {
        const Vu1 = a * Ly * sigma_max;
        const Vc1 = phi2 * 0.17 * lambda * Math.sqrt(fc) * by * d / 1000;
        const amanGeser1 = (Vu1 <= Vc1) ? "AMAN" : "BAHAYA";
        
        const Vu2 = (Lx - bx / 1000 - d / 1000) * Ly * ((sigma_max + sigma_min) / 2);
        const Vc21 = 0.17 * (1 + 2 / (by / bx)) * lambda * Math.sqrt(fc) * b0 * d / 1000;
        const Vc22 = 0.083 * (2 + (alpha_s * d / b0)) * lambda * Math.sqrt(fc) * b0 * d / 1000;
        const Vc23 = 0.33 * Math.sqrt(fc) * b0 * d / 1000;
        const Vc2 = Math.min(Vc21, Vc22, Vc23);
        const phiVc2 = phi2 * Vc2;
        const amanGeser2 = (Vu2 <= phiVc2) ? "AMAN" : "BAHAYA";
        
        return { Vu1, Vc1, amanGeser1, Vu2, Vc21, Vc22, Vc23, Vc2, phiVc2, amanGeser2 };
    } catch (error) {
        throw error;
    }
}

function bujurSangkar(Ly, x1, sigma_min, sigma_max, phi1, b, d, Kmax, fc, fy, D, h) {
    try {
        const sigma = sigma_min + (Ly - x1) * (sigma_max - sigma_min) / Ly;
        const Mu = 0.5 * sigma * x1 * x1 + (1/3) * (sigma_max - sigma) * x1 * x1;
        const K = Mu * 1e6 / (phi1 * b * d * d);
        const Kontrol_K = (K <= Kmax) ? "AMAN" : "BAHAYA";
        const a_val = (1 - Math.sqrt(1 - 2 * K / (0.85 * fc))) * d;
        const As1 = 0.85 * fc * a_val * b / fy;
        const As2 = (Math.sqrt(fc) / (4 * fy)) * b * d;
        const As3 = 1.4 * b * d / fy;
        const As = Math.max(As1, As2, As3);
        const s1 = 0.25 * Math.PI * D * D * 1000 / As;
        const s2 = 3 * h * 1000;
        const s = floori(Math.min(s1, s2, 450), 25);
        
        return { sigma, Mu, K, Kontrol_K, a_val, As1, As2, As3, As, s1, s2, s };
    } catch (error) {
        throw error;
    }
}

function persegiPanjang(Lx, Ly, sigma_max, x2, phi1, b, d2, fc, fy, h, Db, Kmax) {
    try {
        const Mu = 0.5 * sigma_max * x2 * x2;
        const K = Mu * 1e6 / (phi1 * b * d2 * d2);
        const Kontrol_K = (K <= Kmax) ? "AMAN" : "BAHAYA";
        const a_val = (1 - Math.sqrt(1 - 2 * K / (0.85 * fc))) * d2;
        const As21 = 0.85 * fc * a_val * b / fy;
        const As22 = (Math.sqrt(fc) / (4 * fy)) * b * d2;
        const As23 = 1.4 * b * d2 / fy;
        const As = Math.max(As21, As22, As23);
        const Aspusat = (2 * Lx * As) / (Ly + Lx);
        const s1_pusat = 0.25 * Math.PI * Db * Db * 1000 / Aspusat;
        const s2_pusat = 3 * h * 1000;
        const s_pusat = floori(Math.min(s1_pusat, s2_pusat, 450), 25);
        const Astepi = As - Aspusat;
        const s1_tepi = 0.25 * Math.PI * Db * Db * 1000 / Astepi;
        const s2_tepi = 3 * h * 1000;
        const s_tepi = floori(Math.min(s1_tepi, s2_tepi, 450), 25);
        
        return { 
            Mu, K, Kontrol_K, a_val, As21, As22, As23, As, 
            Aspusat, s1_pusat, s2_pusat, s_pusat, 
            Astepi, s1_tepi, s2_tepi, s_tepi 
        };
    } catch (error) {
        throw error;
    }
}

function menerus(sigma_max, x2, phi1, b, d, fc, fy, D, h, Db, Kmax) {
    try {
        const Mu = 0.5 * sigma_max * x2 * x2;
        const K = Mu * 1e6 / (phi1 * b * d * d);
        const Kontrol_K = (K <= Kmax) ? "AMAN" : "BAHAYA";
        const a_val = (1 - Math.sqrt(1 - 2 * K / (0.85 * fc))) * d;
        const As1 = 0.85 * fc * a_val * b / fy;
        const As2 = (Math.sqrt(fc) / (4 * fy)) * b * d;
        const As3 = 1.4 * b * d / fy;
        const As = Math.max(As1, As2, As3);
        const s1 = 0.25 * Math.PI * D * D * 1000 / As;
        const s2 = 3 * h * 1000;
        const s_utama = floori(Math.min(s1, s2, 450), 25);
        
        const Asb1 = As / 5;
        const Asb2 = (fy <= 350 ? 0.002 * b * h : (fy > 350 && fy < 420) ? (0.002 - (fy - 350) / 350000) * b * h : 0.0018 * b * h * (420 / fy)) * 1000;
        const Asb3 = 0.0014 * b * h * 1000;
        const Asb = Math.max(Asb1, Asb2, Asb3);
        const s1_bagi = 0.25 * Math.PI * Db * Db * 1000 / Asb;
        const s2_bagi = 5 * h * 1000;
        const s_bagi = floori(Math.min(s1_bagi, s2_bagi, 450), 25);
        
        return { 
            Mu, K, Kontrol_K, a_val, As1, As2, As3, As, s1, s2, s_utama, 
            Asb1, Asb2, Asb3, Asb, s1_bagi, s2_bagi, s_bagi 
        };
    } catch (error) {
        throw error;
    }
}

function kuatDukungTunggal(Lx, bx, by, fc, fy, D, s, lambda, h, Pu, sbeton, As_perlu) {
    try {
        const A1 = bx * by;
        const Pu_cap = (0.65 * 0.85 * fc * A1) / 1000;
        const Kontrol_Pu = (Pu_cap >= Pu) ? "AMAN" : "BAHAYA";
        
        const It = (Lx * 1000) / 2 - bx / 2 - sbeton;
        
        const Asterpasang = hitungAsTerpasang(D, s);
        const f3 = As_perlu / Asterpasang;
        
        const Idh1 = (0.24 * 1 * fy / (lambda * Math.sqrt(fc))) * D * 1 * 1 * f3;
        const Idh2 = 8 * D;
        const Idh = ceili(Math.max(Idh1, Idh2, 150), 5);
        
        const Kontrol_Idh = (It > Idh) ? "AMAN" : "BAHAYA";
        
        return { 
            A1, 
            Pu_cap, 
            Kontrol_Pu, 
            It, 
            As_perlu,
            Asterpasang,
            f3,
            Idh1, 
            Idh2, 
            Idh, 
            Kontrol_Idh 
        };
    } catch (error) {
        throw error;
    }
}

function kuatDukungMenerus(Lx, bx, fc, fy, Db, s_utama, lambda, h, Pu, sbeton) {
    try {
        const A1 = bx * 1000;
        const Pu_cap = 0.65 * 0.85 * fc * A1;
        const Kontrol_Pu = (Pu_cap >= Pu) ? "AMAN" : "BAHAYA";
        
        const It = (Lx * 1000) / 2 - bx / 2 - sbeton;
        
        const Cb = Math.min(75, s_utama);
        const C = Math.min((Cb + 0) / Db, 2.5);
        const Idh1 = (fy / (1.1 * lambda * Math.sqrt(fc))) * (1 * 1 * 0.8 / C) * Db;
        const Idh2 = 8 * Db;
        const Idh = ceili(Math.max(Idh1, Idh2, 300), 5);
        
        const Kontrol_Idh = (It > Idh) ? "AMAN" : "BAHAYA";
        
        return { 
            A1, 
            Pu_cap, 
            Kontrol_Pu, 
            It, 
            Cb, 
            C, 
            Idh1, 
            Idh2, 
            Idh, 
            Kontrol_Idh 
        };
    } catch (error) {
        throw error;
    }
}

// =====================================================
// ===== FUNGSI AUTO-REDIRECT & SESSION STORAGE (LENGKAP) =====
// =====================================================

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

function saveResultAndRedirectFondasi(result, inputData) {
    const parsedInput = parseInputFondasi(inputData);
    
    let allVariables = {};
    
    if (result.data && result.data.parameter) {
        allVariables = {
            inputOriginal: inputData,
            inputParsed: parsedInput,
            parameter: result.data.parameter,
            dayaDukung: result.data.dayaDukung,
            kontrolGeser: result.data.kontrolGeser,
            tulangan: result.data.tulangan,
            kuatDukung: result.data.kuatDukung,
            actualFondasiMode: result.data.actualFondasiMode,
            status: result.data.status,
            perhitungan: {
                ceili: {
                    ds: ceili(result.data.parameter?.sbeton + (parsedInput.D || 0) / 2, 5),
                    ds2: ceili(result.data.parameter?.sbeton + (parsedInput.D || 0) + (parsedInput.D || 0) / 2, 5)
                },
                parameterDetail: {
                    ds: result.data.parameter?.ds,
                    ds2: result.data.parameter?.ds2,
                    d: result.data.parameter?.d,
                    d2: result.data.parameter?.d2,
                    a: result.data.parameter?.a,
                    q: result.data.parameter?.q,
                    sigma_avg: parsedInput.Pu / (parsedInput.lx * parsedInput.ly),
                    sigma_mux: parsedInput.Mux / ((parsedInput.lx * Math.pow(parsedInput.ly, 2)) / 6),
                    sigma_muy: parsedInput.Muy / ((parsedInput.ly * Math.pow(parsedInput.lx, 2)) / 6),
                    sigma_status: result.data.parameter?.sigma_status,
                    sigma_a: result.data.parameter?.sigma_a,
                    x1: result.data.parameter?.x1,
                    x2: result.data.parameter?.x2,
                    b0: result.data.parameter?.b0,
                    beta1: result.data.parameter?.beta1,
                    Kmax: result.data.parameter?.Kmax,
                    alpha_s: result.data.parameter?.alpha_s,
                    area: parsedInput.lx * parsedInput.ly,
                    Wx: (parsedInput.lx * Math.pow(parsedInput.ly, 2)) / 6,
                    Wy: (parsedInput.ly * Math.pow(parsedInput.lx, 2)) / 6
                },
                dayaDukungDetail: {
                    phi_rad: result.data.dayaDukung?.phi_rad,
                    a_terzaghi: result.data.dayaDukung?.a,
                    Kp_gamma: result.data.dayaDukung?.Kp_gamma,
                    Nc: result.data.dayaDukung?.Nc,
                    Nq: result.data.dayaDukung?.Nq,
                    Ngamma: result.data.dayaDukung?.Ngamma,
                    qu_terzaghi: result.data.dayaDukung?.qu_terzaghi,
                    qa_terzaghi: result.data.dayaDukung?.qa_terzaghi,
                    Kd: result.data.dayaDukung?.Kd,
                    qa_meyerhof: result.data.dayaDukung?.qa_meyerhof,
                    method: result.data.dayaDukung?.method
                },
                kontrolGeserDetail: {
                    Vu1: result.data.kontrolGeser?.Vu1,
                    Vc1: result.data.kontrolGeser?.Vc1,
                    Vu2: result.data.kontrolGeser?.Vu2,
                    Vc21: result.data.kontrolGeser?.Vc21,
                    Vc22: result.data.kontrolGeser?.Vc22,
                    Vc23: result.data.kontrolGeser?.Vc23,
                    Vc2: result.data.kontrolGeser?.Vc2,
                    phiVc2: result.data.kontrolGeser?.phiVc2,
                    amanGeser1: result.data.kontrolGeser?.amanGeser1,
                    amanGeser2: result.data.kontrolGeser?.amanGeser2
                },
                tulanganDetail: (() => {
                    const tul = result.data.tulangan;
                    if (tul.jenis === "bujur_sangkar") {
                        return {
                            jenis: "bujur_sangkar",
                            sigma: tul.sigma,
                            Mu: tul.Mu,
                            K: tul.K,
                            Kontrol_K: tul.Kontrol_K,
                            a_val: tul.a_val,
                            As1: tul.As1,
                            As2: tul.As2,
                            As3: tul.As3,
                            As: tul.As,
                            s1: tul.s1,
                            s2: tul.s2,
                            s: tul.s
                        };
                    } else if (tul.jenis === "persegi_panjang") {
                        return {
                            jenis: "persegi_panjang",
                            bujur: {
                                sigma: tul.bujur?.sigma,
                                Mu: tul.bujur?.Mu,
                                K: tul.bujur?.K,
                                Kontrol_K: tul.bujur?.Kontrol_K,
                                a_val: tul.bujur?.a_val,
                                As1: tul.bujur?.As1,
                                As2: tul.bujur?.As2,
                                As3: tul.bujur?.As3,
                                As: tul.bujur?.As,
                                s1: tul.bujur?.s1,
                                s2: tul.bujur?.s2,
                                s: tul.bujur?.s
                            },
                            persegi: {
                                Mu: tul.persegi?.Mu,
                                K: tul.persegi?.K,
                                Kontrol_K: tul.persegi?.Kontrol_K,
                                a_val: tul.persegi?.a_val,
                                As21: tul.persegi?.As21,
                                As22: tul.persegi?.As22,
                                As23: tul.persegi?.As23,
                                As: tul.persegi?.As,
                                Aspusat: tul.persegi?.Aspusat,
                                s1_pusat: tul.persegi?.s1_pusat,
                                s2_pusat: tul.persegi?.s2_pusat,
                                s_pusat: tul.persegi?.s_pusat,
                                Astepi: tul.persegi?.Astepi,
                                s1_tepi: tul.persegi?.s1_tepi,
                                s2_tepi: tul.persegi?.s2_tepi,
                                s_tepi: tul.persegi?.s_tepi
                            }
                        };
                    } else if (tul.jenis === "menerus") {
                        return {
                            jenis: "menerus",
                            Mu: tul.Mu,
                            K: tul.K,
                            Kontrol_K: tul.Kontrol_K,
                            a_val: tul.a_val,
                            As1: tul.As1,
                            As2: tul.As2,
                            As3: tul.As3,
                            As: tul.As,
                            s1: tul.s1,
                            s2: tul.s2,
                            s_utama: tul.s_utama,
                            Asb1: tul.Asb1,
                            Asb2: tul.Asb2,
                            Asb3: tul.Asb3,
                            Asb: tul.Asb,
                            s1_bagi: tul.s1_bagi,
                            s2_bagi: tul.s2_bagi,
                            s_bagi: tul.s_bagi
                        };
                    }
                    return {};
                })(),
                kuatDukungDetail: {
                    A1: result.data.kuatDukung?.A1,
                    Pu_cap: result.data.kuatDukung?.Pu_cap,
                    Kontrol_Pu: result.data.kuatDukung?.Kontrol_Pu,
                    It: result.data.kuatDukung?.It,
                    As_perlu: result.data.kuatDukung?.As_perlu,
                    Asterpasang: result.data.kuatDukung?.Asterpasang,
                    f3: result.data.kuatDukung?.f3,
                    Idh1: result.data.kuatDukung?.Idh1,
                    Idh2: result.data.kuatDukung?.Idh2,
                    Idh: result.data.kuatDukung?.Idh,
                    Kontrol_Idh: result.data.kuatDukung?.Kontrol_Idh,
                    Cb: result.data.kuatDukung?.Cb,
                    C: result.data.kuatDukung?.C
                },
                konstanta: {
                    phi1: parsedInput.phi1 || 0.9,
                    phi2: parsedInput.phi2 || 0.75,
                    phie: parsedInput.phie || 1,
                    phit: parsedInput.phit || 1,
                    phis: parsedInput.phis || ((parsedInput.D || 0) <= 19 ? 0.8 : 1),
                    sbeton: parsedInput.sbeton || 75,
                    lambda: parsedInput.lambda || 1,
                    alpha_s: parsedInput.alpha_s || 40
                },
                satuan: {
                    lx_m: parsedInput.lx,
                    ly_m: parsedInput.ly,
                    bx_mm: parsedInput.bx,
                    by_mm: parsedInput.by,
                    h_m: parsedInput.h,
                    Pu_kN: parsedInput.Pu,
                    Mux_kNm: parsedInput.Mux,
                    Muy_kNm: parsedInput.Muy,
                    fc_MPa: parsedInput.fc,
                    fy_MPa: parsedInput.fy,
                    gammaC_kN_m3: parsedInput.gammaC,
                    df_m: parsedInput.df_auto || parsedInput.df_manual,
                    gamma_kN_m3: parsedInput.gamma_auto || parsedInput.gamma_manual,
                    qa_kPa: parsedInput.qa,
                    D_mm: parsedInput.D,
                    Db_mm: parsedInput.Db,
                    s_mm: parsedInput.s,
                    sp_mm: parsedInput.sp,
                    st_mm: parsedInput.st,
                    sb_mm: parsedInput.sb
                }
            }
        };
    }
    
    sessionStorage.setItem('calculationResultFondasi', JSON.stringify({
        module: inputData.module,
        mode: inputData.mode,
        timestamp: result.timestamp || new Date().toISOString(),
        inputData: inputData,
        parsedInput: parsedInput,
        data: result.data,
        kontrol: result.kontrol,
        rekap: result.rekap,
        optimasi: result.optimasi,
        allVariables: allVariables,
        actualFondasiMode: result.data?.actualFondasiMode || null,
        loggingEnabled: ENABLE_DETAILED_LOGGING,
        version: "fondasi_calc_v2.0_complete",
        generatedAt: new Date().toISOString()
    }));
    
    saveColorSettings();
    
    window.location.href = 'report.html';
}

function getAllFondasiVariables(result, inputData) {
    if (!result || !result.data) return null;
    
    try {
        const parsedInput = result.parsedInput || parseInputFondasi(inputData);
        
        return {
            input: {
                original: inputData,
                parsed: parsedInput
            },
            parameter: result.data.parameter || {},
            dayaDukung: result.data.dayaDukung || {},
            kontrolGeser: result.data.kontrolGeser || {},
            tulangan: result.data.tulangan || {},
            kuatDukung: result.data.kuatDukung || {},
            kontrol: result.kontrol || {},
            rekap: result.rekap || {},
            optimasi: result.optimasi || {},
            metadata: {
                mode: result.mode,
                status: result.status,
                actualFondasiMode: result.data.actualFondasiMode,
                timestamp: result.timestamp
            },
            detail: {
                dimensi: {
                    lx: parsedInput.lx,
                    ly: parsedInput.ly,
                    bx: parsedInput.bx,
                    by: parsedInput.by,
                    h: parsedInput.h,
                    d: result.data.parameter?.d,
                    d2: result.data.parameter?.d2,
                    a: result.data.parameter?.a
                },
                beban: {
                    Pu: parsedInput.Pu,
                    Mux: parsedInput.Mux,
                    Muy: parsedInput.Muy,
                    sigma_min: result.data.parameter?.sigma_min,
                    sigma_max: result.data.parameter?.sigma_max,
                    sigma_a: result.data.parameter?.sigma_a,
                    sigma_avg: parsedInput.Pu / (parsedInput.lx * parsedInput.ly),
                    q: result.data.parameter?.q
                },
                material: {
                    fc: parsedInput.fc,
                    fy: parsedInput.fy,
                    gammaC: parsedInput.gammaC,
                    lambda: parsedInput.lambda
                },
                tanah: {
                    modeTanah: parsedInput.modeTanah,
                    df: parsedInput.df_auto || parsedInput.df_manual,
                    gamma: parsedInput.gamma_auto || parsedInput.gamma_manual,
                    qa: parsedInput.qa,
                    phi: parsedInput.phi,
                    c: parsedInput.c,
                    qc: parsedInput.qc
                },
                tulanganInput: {
                    D: parsedInput.D,
                    Db: parsedInput.Db,
                    s: parsedInput.s,
                    sp: parsedInput.sp,
                    st: parsedInput.st,
                    sb: parsedInput.sb
                },
                konstanta: {
                    phi1: parsedInput.phi1,
                    phi2: parsedInput.phi2,
                    phie: parsedInput.phie,
                    phit: parsedInput.phit,
                    phis: parsedInput.phis,
                    sbeton: parsedInput.sbeton,
                    alpha_s: parsedInput.alpha_s
                }
            }
        };
    } catch (error) {
        return null;
    }
}

function calculateFondasiWithRedirect(data) {
    try {
        const result = calculateFondasi(data);
        
        if (result.status === "sukses") {
            saveResultAndRedirectFondasi(result, data);
        } else {
            if (typeof showAlert === 'function') {
                showAlert(`Perhitungan fondasi gagal: ${result.message || 'Tidak ditemukan fondasi yang memenuhi syarat'}`);
            } else {
                alert(`Perhitungan fondasi gagal: ${result.message || 'Tidak ditemukan fondasi yang memenuhi syarat'}`);
            }
        }
        
        return result;
    } catch (error) {
        if (typeof showAlert === 'function') {
            showAlert(`Terjadi kesalahan dalam perhitungan fondasi: ${error.message}`);
        } else {
            alert(`Terjadi kesalahan dalam perhitungan fondasi: ${error.message}`);
        }
        throw error;
    }
}

// =====================================================
// ===== FUNGSI UNTUK DEBUGGING PUBLIC =====
window.debugFondasi = {
    showStatus: function() {
        return {
            status: "debug",
            functions: {
                calculateFondasi: typeof calculateFondasi === 'function',
                hitungDesainFondasi: typeof hitungDesainFondasi === 'function',
                hitungEvaluasiFondasi: typeof hitungEvaluasiFondasi === 'function',
                kontrolFondasi: typeof kontrolFondasi === 'function',
                calculateFondasiWithRedirect: typeof calculateFondasiWithRedirect === 'function'
            },
            optimizer: typeof window.optimizeDesainFondasi === 'function',
            logging: ENABLE_DETAILED_LOGGING
        };
    },
    
    testWithDummy: function() {
        const dummyData = {
            module: "fondasi",
            mode: "desain",
            fondasi: {
                mode: "tunggal",
                dimensi: {
                    lx: "2",
                    ly: "2.8",
                    bx: "400",
                    by: "400",
                    h: "0.4",
                    alpha_s: "30"
                }
            },
            tanah: {
                mode: "manual",
                manual: {
                    qa: "200",
                    df: "1.6",
                    gamma: "17.2"
                }
            },
            beban: {
                pu: "384",
                mux: "100",
                muy: "15"
            },
            material: {
                fc: "20",
                fy: "300",
                gammaC: "24"
            },
            tulangan: {
                d: "16",
                db: "13",
                s: "150",
                sb: "200"
            }
        };
        
        const result = calculateFondasi(dummyData);
        
        if (result.status === 'sukses') {
            return {
                status: "test_success",
                mode: result.mode,
                dimensi: result.rekap.dimensi,
                tekanan_tanah: result.rekap.tekanan_tanah,
                tulangan: result.rekap.tulangan_panjang || result.rekap.tulangan_utama,
                actualFondasiMode: result.data.actualFondasiMode
            };
        } else {
            return {
                status: "test_error",
                error: result.message
            };
        }
    },
    
    validateInput: function(data) {
        const errors = [];
        
        if (!data.fondasi?.dimensi?.lx) errors.push("lx tidak terdefinisi");
        if (!data.fondasi?.dimensi?.ly) errors.push("ly tidak terdefinisi");
        if (!data.beban?.pu) errors.push("Pu tidak terdefinisi");
        if (!data.material?.fc) errors.push("fc tidak terdefinisi");
        if (!data.material?.fy) errors.push("fy tidak terdefinisi");
        
        if (errors.length === 0) {
            return { valid: true };
        } else {
            return { valid: false, errors: errors };
        }
    }
};

// =====================================================
// ===== EKSPOR FUNGSI =====
window.calculateFondasi = calculateFondasi;
window.hitungDesainFondasi = hitungDesainFondasi;
window.hitungEvaluasiFondasi = hitungEvaluasiFondasi;
window.kontrolFondasi = kontrolFondasi;
window.setDetailedLogging = setDetailedLogging;
window.debugFondasi = window.debugFondasi;

window.calculateFondasiWithRedirect = calculateFondasiWithRedirect;
window.saveColorSettings = saveColorSettings;
window.saveResultAndRedirectFondasi = saveResultAndRedirectFondasi;
window.getAllFondasiVariables = getAllFondasiVariables;

console.log("✅ calc-fondasi.js loaded (complete with 'no solution found' handling)");