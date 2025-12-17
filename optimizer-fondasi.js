// =====================================================
// OPTIMIZER UNTUK DESAIN FONDASI - SIMPLE VERSION
// =====================================================

window.optimizeDesainFondasi = function(data) {
    const list_D = [10, 13, 16, 19, 22, 25, 29, 32];
    
    const fondasiMode = data.fondasi?.mode || "tunggal";
    const autoDimensi = data.fondasi?.autoDimensi || false;
    const bx = parseFloat(data.fondasi?.dimensi?.bx) || 400;
    const by = parseFloat(data.fondasi?.dimensi?.by) || 400;
    
    let list_Lx, list_Ly, list_h;
    
    if (autoDimensi) {
        list_Lx = generateRangeLx(bx, fondasiMode);
        list_Ly = generateRangeLy(by, fondasiMode);
        list_h = generateRangeH();
    } else {
        list_Lx = [parseFloat(data.fondasi?.dimensi?.lx) || 2.0];
        list_Ly = [parseFloat(data.fondasi?.dimensi?.ly) || 2.0];
        list_h = [parseFloat(data.fondasi?.dimensi?.h) || 0.4];
    }
    
    let kombinasiValid = [];
    let kombinasiDicoba = 0;
    let kombinasiDitolak = 0;
    const MAX_KOMBINASI_VALID = 200;
    
    const startTime = Date.now();
    let lastProgressTime = startTime;
    
    const statistikPenolakan = {
        sigma_min_negatif: 0,
        K_tidak_aman: 0,
        kuat_dukung_tidak_aman: 0,
        spasi_tidak_aman: 0,
        dayadukung_tidak_aman: 0,
        geser_tidak_aman: 0,
        error_perhitungan: 0
    };
    
    outerLoop:
    for (let Lx of list_Lx) {
        for (let Ly of list_Ly) {
            if (Lx > Ly) continue;
            
            for (let h of list_h) {
                for (let D of list_D) {
                    const list_Db = generateRangeDb(D);
                    
                    for (let Db of list_Db) {
                        kombinasiDicoba++;
                        
                        const currentTime = Date.now();
                        if (kombinasiDicoba % 1000 === 0 || currentTime - lastProgressTime > 2000) {
                            lastProgressTime = currentTime;
                        }
                        
                        try {
                            const dataBaru = {
                                ...data,
                                fondasi: {
                                    ...data.fondasi,
                                    dimensi: {
                                        ...data.fondasi.dimensi,
                                        lx: Lx,
                                        ly: Ly,
                                        h: h
                                    }
                                },
                                tulangan: {
                                    d: D,
                                    db: Db,
                                    s: 150,
                                    sb: 200
                                }
                            };
                            
                            const hasil = hitungDesainFondasi(dataBaru);
                            
                            if (hasil.status === "sukses" && isKontrolFondasiAman(hasil.kontrol, hasil.data)) {
                                const asRincian = hitungAsRincianPerMeter(hasil.data, D, Db, fondasiMode);
                                
                                kombinasiValid.push({
                                    Lx, Ly, h, D, Db,
                                    fondasiMode,
                                    asRincian,
                                    hasilPerhitungan: hasil
                                });
                                
                                if (kombinasiValid.length >= MAX_KOMBINASI_VALID) {
                                    break outerLoop;
                                }
                            } else {
                                kombinasiDitolak++;
                                
                                if (hasil.status !== "sukses") {
                                    statistikPenolakan.error_perhitungan++;
                                } else if (hasil.data?.parameter?.sigma_min <= 0) {
                                    statistikPenolakan.sigma_min_negatif++;
                                } else if (!hasil.kontrol?.tulangan?.aman) {
                                    statistikPenolakan.K_tidak_aman++;
                                } else if (!hasil.kontrol?.kuatDukung?.aman) {
                                    statistikPenolakan.kuat_dukung_tidak_aman++;
                                } else if (!hasil.kontrol?.tulanganTambahan?.aman) {
                                    statistikPenolakan.spasi_tidak_aman++;
                                } else if (!hasil.kontrol?.dayaDukung?.aman) {
                                    statistikPenolakan.dayadukung_tidak_aman++;
                                } else if (!hasil.kontrol?.geser?.aman1 || !hasil.kontrol?.geser?.aman2) {
                                    statistikPenolakan.geser_tidak_aman++;
                                }
                            }
                        } catch (error) {
                            kombinasiDitolak++;
                            statistikPenolakan.error_perhitungan++;
                            continue;
                        }
                    }
                }
            }
        }
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    if (kombinasiValid.length === 0) {
        return fallbackDesainFondasi(data);
    }
    
    kombinasiValid.sort((a, b) => a.asRincian.totalAsPerMeter - b.asRincian.totalAsPerMeter);
    const terbaik = kombinasiValid.slice(0, 5);
    const kombinasiTerbaik = terbaik[0];
    
    const dataFinal = {
        ...data,
        fondasi: {
            ...data.fondasi,
            dimensi: {
                ...data.fondasi.dimensi,
                lx: kombinasiTerbaik.Lx,
                ly: kombinasiTerbaik.Ly,
                h: kombinasiTerbaik.h
            }
        },
        tulangan: {
            d: kombinasiTerbaik.D,
            db: kombinasiTerbaik.Db,
            s: 150,
            sb: 200
        }
    };
    
    const hasilAkhir = hitungDesainFondasi(dataFinal);
    
    hasilAkhir.data.dimensiOptimal = {
        Lx: kombinasiTerbaik.Lx,
        Ly: kombinasiTerbaik.Ly,
        h: kombinasiTerbaik.h
    };
    
    hasilAkhir.optimasi = {
        status: 'sukses_optimasi',
        waktu_optimasi: `${duration.toFixed(1)} detik`,
        total_kombinasi_dicoba: kombinasiDicoba,
        kombinasi_valid: kombinasiValid.length,
        kombinasi_ditolak: kombinasiDitolak,
        statistik_penolakan: statistikPenolakan,
        kombinasi_terpilih: {
            Lx: kombinasiTerbaik.Lx,
            Ly: kombinasiTerbaik.Ly,
            h: kombinasiTerbaik.h,
            D: kombinasiTerbaik.D,
            Db: kombinasiTerbaik.Db
        },
        as_rincian_per_meter: {
            ...kombinasiTerbaik.asRincian,
            mode_fondasi: kombinasiTerbaik.fondasiMode
        },
        alternatif: terbaik.slice(1).map(item => ({
            Lx: item.Lx,
            Ly: item.Ly,
            h: item.h,
            D: item.D,
            Db: item.Db,
            as_rincian_per_meter: item.asRincian,
            mode_fondasi: item.fondasiMode
        }))
    };
    
    return hasilAkhir;
};

// =====================================================
// FUNGSI UTILITAS
// =====================================================

function hitungAsTerpasang(D, s) {
    return (Math.PI * D * D * 1000) / (4 * Math.max(s, 1));
}

// =====================================================
// FUNGSI HITUNG AS RINCIAN PER METER (DIPERBAIKI)
// =====================================================

function hitungAsRincianPerMeter(hasil, D, Db, fondasiMode) {
    const { tulangan, parameter } = hasil;
    
    if (!parameter || parameter.sigma_min <= 0) {
        return {
            asUtamaPerMeter: Infinity,
            asPusatPerMeter: Infinity,
            asTepiPerMeter: Infinity,
            asBagiPerMeter: Infinity,
            totalAsPerMeter: Infinity,
            mode: fondasiMode
        };
    }
    
    let rincian = {
        asUtamaPerMeter: 0,
        asPusatPerMeter: 0,
        asTepiPerMeter: 0,
        asBagiPerMeter: 0,
        totalAsPerMeter: 0,
        mode: fondasiMode,
        D: D,
        Db: Db
    };
    
    try {
        if (tulangan.bujur && tulangan.bujur.s < 100) {
            return Infinity;
        }
        if (tulangan.persegi) {
            if (tulangan.persegi.s_pusat < 100) {
                return Infinity;
            }
            if (tulangan.persegi.s_tepi < 100) {
                return Infinity;
            }
        }
        if (tulangan.s_utama && tulangan.s_utama < 100) {
            return Infinity;
        }
        if (tulangan.s_bagi && tulangan.s_bagi < 100) {
            return Infinity;
        }
        
        if (tulangan.jenis === "bujur_sangkar") {
            if (tulangan.Kontrol_K !== "AMAN") {
                return Infinity;
            }
        } else if (tulangan.jenis === "persegi_panjang") {
            if (tulangan.bujur?.Kontrol_K !== "AMAN" || tulangan.persegi?.Kontrol_K !== "AMAN") {
                return Infinity;
            }
        } else if (tulangan.jenis === "menerus") {
            if (tulangan.Kontrol_K !== "AMAN") {
                return Infinity;
            }
        }
        
        if (tulangan.bujur && tulangan.persegi) {
            const spasiPanjang = tulangan.bujur.s;
            rincian.asUtamaPerMeter = hitungAsTerpasang(D, spasiPanjang);
            
            const spasiPusat = tulangan.persegi.s_pusat;
            const spasiTepi = tulangan.persegi.s_tepi;
            
            rincian.asPusatPerMeter = hitungAsTerpasang(Db, spasiPusat);
            rincian.asTepiPerMeter = hitungAsTerpasang(Db, spasiTepi);
            
            const asPendekRata = (rincian.asPusatPerMeter + rincian.asTepiPerMeter) / 2;
            rincian.totalAsPerMeter = rincian.asUtamaPerMeter + asPendekRata;
            
        } else if (tulangan.bujur) {
            const spasi = tulangan.bujur.s;
            rincian.asUtamaPerMeter = hitungAsTerpasang(D, spasi);
            
            rincian.totalAsPerMeter = rincian.asUtamaPerMeter * 2;
            
        } else if (tulangan.s_utama) {
            const spasiUtama = tulangan.s_utama;
            rincian.asUtamaPerMeter = hitungAsTerpasang(D, spasiUtama);
            
            const spasiBagi = tulangan.s_bagi;
            rincian.asBagiPerMeter = hitungAsTerpasang(Db, spasiBagi);
            
            rincian.totalAsPerMeter = rincian.asUtamaPerMeter + rincian.asBagiPerMeter;
        }
        
        if (tulangan.bujur) {
            rincian.asPerluUtama = tulangan.bujur.As || 0;
            rincian.spasiUtama = tulangan.bujur.s || 0;
        }
        if (tulangan.persegi) {
            rincian.asPerluPusat = tulangan.persegi.Aspusat || 0;
            rincian.asPerluTepi = tulangan.persegi.Astepi || 0;
            rincian.spasiPusat = tulangan.persegi.s_pusat || 0;
            rincian.spasiTepi = tulangan.persegi.s_tepi || 0;
        }
        if (tulangan.s_utama) {
            rincian.asPerluUtama = tulangan.As || 0;
            rincian.asPerluBagi = tulangan.Asb || 0;
            rincian.spasiUtama = tulangan.s_utama || 0;
            rincian.spasiBagi = tulangan.s_bagi || 0;
        }
        
        if (rincian.asPerluUtama > 0) {
            rincian.rasioUtama = rincian.asUtamaPerMeter / rincian.asPerluUtama;
        }
        if (rincian.asPerluPusat > 0) {
            rincian.rasioPusat = rincian.asPusatPerMeter / rincian.asPerluPusat;
        }
        if (rincian.asPerluTepi > 0) {
            rincian.rasioTepi = rincian.asTepiPerMeter / rincian.asPerluTepi;
        }
        if (rincian.asPerluBagi > 0) {
            rincian.rasioBagi = rincian.asBagiPerMeter / rincian.asPerluBagi;
        }
        
        return rincian;
        
    } catch (error) {
        return {
            asUtamaPerMeter: Infinity,
            asPusatPerMeter: Infinity,
            asTepiPerMeter: Infinity,
            asBagiPerMeter: Infinity,
            totalAsPerMeter: Infinity,
            mode: fondasiMode
        };
    }
}

function formatAsRincianPerMeter(rincian, fondasiMode) {
    let output = "";
    
    if (fondasiMode === "tunggal") {
        if (rincian.spasiPusat) {
            output = `As Utama: ${Math.round(rincian.asUtamaPerMeter)} mm²/m (ɸ${rincian.D||'?'}-${rincian.spasiUtama}, perlu: ${Math.round(rincian.asPerluUtama||0)}, rasio: ${(rincian.rasioUtama||0).toFixed(2)})`;
            output += `\n   As Pusat: ${Math.round(rincian.asPusatPerMeter)} mm²/m (ɸ${rincian.Db||'?'}-${rincian.spasiPusat}, perlu: ${Math.round(rincian.asPerluPusat||0)}, rasio: ${(rincian.rasioPusat||0).toFixed(2)})`;
            output += `\n   As Tepi: ${Math.round(rincian.asTepiPerMeter)} mm²/m (ɸ${rincian.Db||'?'}-${rincian.spasiTepi}, perlu: ${Math.round(rincian.asPerluTepi||0)}, rasio: ${(rincian.rasioTepi||0).toFixed(2)})`;
        } else {
            output = `As Utama: ${Math.round(rincian.asUtamaPerMeter)} mm²/m (ɸ${rincian.D||'?'}-${rincian.spasiUtama}, perlu: ${Math.round(rincian.asPerluUtama||0)}, rasio: ${(rincian.rasioUtama||0).toFixed(2)})`;
        }
    } else {
        output = `As Utama: ${Math.round(rincian.asUtamaPerMeter)} mm²/m (ɸ${rincian.D||'?'}-${rincian.spasiUtama}, perlu: ${Math.round(rincian.asPerluUtama||0)}, rasio: ${(rincian.rasioUtama||0).toFixed(2)})`;
        output += `\n   As Bagi: ${Math.round(rincian.asBagiPerMeter)} mm²/m (ɸ${rincian.Db||'?'}-${rincian.spasiBagi}, perlu: ${Math.round(rincian.asPerluBagi||0)}, rasio: ${(rincian.rasioBagi||0).toFixed(2)})`;
    }
    
    output += `\n   TOTAL As/m: ${Math.round(rincian.totalAsPerMeter)} mm²/m`;
    return output;
}

// =====================================================
// FUNGSI GENERATE RANGE YANG DIOPTIMASI
// =====================================================

function generateRangeLx(bx, fondasiMode) {
    const bxMeter = bx / 1000;
    const min = Math.floor(bxMeter / 0.05) * 0.05 + 0.5;
    const max = fondasiMode === "tunggal" ? 6 : 30;
    
    const range = [];
    for (let value = min; value <= max; value += 0.1) {
        range.push(parseFloat(value.toFixed(2)));
    }
    
    return range;
}

function generateRangeLy(by, fondasiMode) {
    const byMeter = by / 1000;
    const min = Math.floor(byMeter / 0.05) * 0.05 + 0.5;
    const max = fondasiMode === "tunggal" ? 6 : 30;
    
    const range = [];
    for (let value = min; value <= max; value += 0.1) {
        range.push(parseFloat(value.toFixed(2)));
    }
    
    return range;
}

function generateRangeH() {
    const min = 0.25;
    const max = 1.0;
    const range = [];
    
    for (let h = min; h <= max; h += 0.05) {
        range.push(parseFloat(h.toFixed(2)));
    }
    
    return range;
}

function generateRangeDb(D) {
    const allDb = [10, 13, 16, 19, 22, 25, 29, 32];
    return allDb.filter(db => db <= D);
}

// =====================================================
// FUNGSI KONTROL & OPTIMALISASI (DIPERBAIKI TOTAL)
// =====================================================

function isKontrolFondasiAman(kontrol, hasilData) {
    if (!kontrol || !hasilData) {
        return false;
    }
    
    const sigmaMinAman = hasilData?.parameter?.sigma_min > 0;
    if (!sigmaMinAman) {
        return false;
    }
    
    let kontrolKAman = true;
    const tulangan = hasilData?.tulangan;
    
    if (tulangan) {
        if (tulangan.jenis === "bujur_sangkar") {
            kontrolKAman = tulangan.Kontrol_K === "AMAN";
        } else if (tulangan.jenis === "persegi_panjang") {
            kontrolKAman = (tulangan.bujur?.Kontrol_K === "AMAN") && 
                           (tulangan.persegi?.Kontrol_K === "AMAN");
        } else if (tulangan.jenis === "menerus") {
            kontrolKAman = tulangan.Kontrol_K === "AMAN";
        }
    }
    
    if (!kontrolKAman) {
        return false;
    }
    
    const kuatDukungPuAman = hasilData?.kuatDukung?.Kontrol_Pu === "AMAN";
    const kuatDukungIdhAman = hasilData?.kuatDukung?.Kontrol_Idh === "AMAN";
    const kuatDukungAman = kuatDukungPuAman && kuatDukungIdhAman;
    
    if (!kuatDukungAman) {
        return false;
    }
    
    const dayaDukungAman = kontrol.dayaDukung?.aman === true;
    const geserAman1 = kontrol.geser?.aman1 === true;
    const geserAman2 = kontrol.geser?.aman2 === true;
    const geserAman = geserAman1 && geserAman2;
    
    if (!dayaDukungAman) {
        return false;
    }
    if (!geserAman) {
        return false;
    }
    
    const kontrolTulanganTambahan = kontrol.tulanganTambahan ? 
        kontrol.tulanganTambahan.aman : true;
    
    if (!kontrolTulanganTambahan) {
        return false;
    }
    
    const semuaAman = sigmaMinAman && kontrolKAman && kuatDukungAman && 
                      dayaDukungAman && geserAman && kontrolTulanganTambahan;
    
    return semuaAman;
}

// =====================================================
// FUNGSI FALLBACK
// =====================================================

function fallbackDesainFondasi(data) {
    const fondasiMode = data.fondasi?.mode || "tunggal";
    const autoDimensi = data.fondasi?.autoDimensi || false;
    const bx = parseFloat(data.fondasi?.dimensi?.bx) || 400;
    const by = parseFloat(data.fondasi?.dimensi?.by) || 400;
    const Pu = parseFloat(data.beban?.pu) || 1000;
    
    const fc = parseFloat(data.material?.fc) || 20;
    const qa = parseFloat(data.tanah?.manual?.qa) || 200;
    
    let Lx_fallback, Ly_fallback, h_fallback;
    
    if (autoDimensi) {
        const luasMinimum = Pu / (qa * 1000);
        const sisiMinimum = Math.sqrt(luasMinimum);
        
        Lx_fallback = Math.max(Math.ceil((sisiMinimum + 0.1) / 0.1) * 0.1, bx/1000 + 0.5);
        Ly_fallback = Math.max(Math.ceil((sisiMinimum + 0.1) / 0.1) * 0.1, by/1000 + 0.5);
        h_fallback = Math.max(0.3, Lx_fallback / 10);
    } else {
        Lx_fallback = parseFloat(data.fondasi?.dimensi?.lx) || 2.0;
        Ly_fallback = parseFloat(data.fondasi?.dimensi?.ly) || 2.0;
        h_fallback = parseFloat(data.fondasi?.dimensi?.h) || 0.4;
    }
    
    if (Ly_fallback < Lx_fallback) {
        Ly_fallback = Lx_fallback;
    }
    
    const fallbackData = {
        ...data,
        fondasi: {
            ...data.fondasi,
            dimensi: {
                ...data.fondasi.dimensi,
                lx: Lx_fallback,
                ly: Ly_fallback,
                h: h_fallback
            }
        },
        tulangan: {
            d: 16,
            db: 10,
            s: 150,
            sb: 200
        }
    };
    
    const hasil = hitungDesainFondasi(fallbackData);
    hasil.optimasi = {
        status: 'fallback',
        catatan: 'Tidak ditemukan kombinasi valid, menggunakan fallback',
        dimensi_fallback: {
            Lx: Lx_fallback,
            Ly: Ly_fallback,
            h: h_fallback
        }
    };
    
    return hasil;
}

// =====================================================
// EKSPOR FUNGSI
// =====================================================
window.optimizeDesainFondasi = optimizeDesainFondasi;
window.isKontrolFondasiAman = isKontrolFondasiAman;