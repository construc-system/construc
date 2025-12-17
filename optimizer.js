// ============================================================================
// optimizer.js FINAL — Kompatibel BALOK, KOLOM & PELAT (DENGAN LOGGING LENGKAP) - FIXED
// ============================================================================

// ============================================================================
// UNIVERSAL CONTROL CHECKER
// ============================================================================
function isKontrolAman(kontrol) {
    if (!kontrol) return false;

    // ---------- Format balok ----------
    if (kontrol.kontrolLentur || kontrol.kontrolGeser || kontrol.kontrolTorsi) {
        // Lentur
        if (kontrol.kontrolLentur) {
            for (const key in kontrol.kontrolLentur) {
                const L = kontrol.kontrolLentur[key];
                if (!L.K_aman || !L.Md_aman || !(L.rho_aman ?? true) || !L.kapasitas_aman) return false;
            }
        }
        // Geser
        if (kontrol.kontrolGeser) {
            for (const key in kontrol.kontrolGeser) {
                const G = kontrol.kontrolGeser[key];
                if (!G.Vs_aman || !G.Av_aman) return false;
            }
        }
        // Torsi
        if (kontrol.kontrolTorsi) {
            for (const key in kontrol.kontrolTorsi) {
                const T = kontrol.kontrolTorsi[key];
                if (!T.perluDanAman) return false;
            }
        }
        return true;
    }
    // ---------- Format kolom ----------
    if (kontrol.lentur && kontrol.geser) {
        return (
            kontrol.lentur.Ast_ok &&
            kontrol.lentur.rho_ok &&
            kontrol.lentur.n_ok &&
            kontrol.lentur.K_ok && // TAMBAHAN: kontrol K untuk kolom
            kontrol.geser.Vs_ok &&
            kontrol.geser.Av_ok
        );
    }
    // ---------- Format pelat ----------
    if (kontrol.lentur && kontrol.bagi) {
        return (
            kontrol.lentur.ok &&
            kontrol.bagi.ok
        );
    }
    return false;
}

// ============================================================================
// HITUNG SKOR — AUTO DETECT BALOK/KOLOM/PELAT - FIXED VERSION
// ============================================================================
function hitungSkorOptimalitas(result, D, phi) {
    if (!result) {
        console.warn("❌ Result is undefined in hitungSkorOptimalitas");
        return Infinity;
    }

    const luasPerBatang = 0.25 * Math.PI * D * D;

    // ================= BALOK =================
    if (result.rekap?.tumpuan && result.rekap?.lapangan) {
        try {
            const R = result.rekap;
            const data = result.data || {};

            const bobot_Md = 0.4;
            const bobot_Av = 0.3;
            const bobot_torsi = 0.2;
            const bobot_tulangan = 0.1;

            // Safety function untuk extract number
            const extractNumber = (str) => {
                if (!str || str === '-' || str === '') return 0;
                try {
                    const match = str.toString().match(/(\d+)D/);
                    return match ? parseInt(match[1]) : 0;
                } catch (e) {
                    return 0;
                }
            };

            const n_tump_neg = extractNumber(R.tumpuan?.tulangan_negatif);
            const n_tump_pos = extractNumber(R.tumpuan?.tulangan_positif);
            const n_lap_neg  = extractNumber(R.lapangan?.tulangan_negatif);
            const n_lap_pos  = extractNumber(R.lapangan?.tulangan_positif);

            const total_lentur = (n_tump_neg + n_tump_pos + n_lap_neg + n_lap_pos) * luasPerBatang;

            // Safety check untuk data begel
            const begelkiri = data.begelkiri || {};
            const begeltengah = data.begeltengah || {};
            const begelkanan = data.begelkanan || {};

            const Av_terpakai = Math.max(
                parseFloat(begelkiri.Av_terpakai) || 0,
                parseFloat(begeltengah.Av_terpakai) || 0,
                parseFloat(begelkanan.Av_terpakai) || 0
            );

            const n_torsi_tump = extractNumber(R.tumpuan?.torsi);
            const n_torsi_lap  = extractNumber(R.lapangan?.torsi);

            const total_torsi = Math.max(n_torsi_tump, n_torsi_lap) * luasPerBatang;
            const total_batang = (n_tump_neg + n_tump_pos + n_lap_neg + n_lap_pos);

            const skor = (
                bobot_Md * total_lentur +
                bobot_Av * Av_terpakai +
                bobot_torsi * total_torsi +
                bobot_tulangan * total_batang
            );

            console.log(`📊 Skor balok: ${skor.toFixed(2)} (lentur: ${total_lentur.toFixed(1)}, Av: ${Av_terpakai.toFixed(1)}, torsi: ${total_torsi.toFixed(1)}, batang: ${total_batang})`);
            
            return skor;

        } catch (error) {
            console.error("❌ Error calculating balok score:", error);
            return Infinity;
        }
    }

    // ================= KOLOM =================
    if (result.rekap?.formatted?.tulangan_utama) {
        try {
            const R = result.rekap;

            const extractNumber = (str) => {
                if (!str || str === '-' || str === '') return 0;
                try {
                    const match = str.toString().match(/(\d+)D/);
                    return match ? parseInt(match[1]) : 0;
                } catch (e) {
                    return 0;
                }
            };

            const n_main = extractNumber(R.formatted.tulangan_utama);
            const s_begel = R.begel?.s || 100;

            const skor = n_main * luasPerBatang + s_begel * 0.1;
            console.log(`📊 Skor kolom: ${skor.toFixed(2)} (main: ${n_main}, s: ${s_begel})`);
            
            return skor;

        } catch (error) {
            console.error("❌ Error calculating kolom score:", error);
            return Infinity;
        }
    }

    // ================= PELAT =================
    if (result.rekap?.formatted?.tulangan_pokok_x || result.rekap?.tulangan) {
        try {
            const R = result.rekap;
            
            // Gunakan data langsung dari tulangan object
            const tulangan = R.tulangan || {};
            const pokokX = tulangan.pokokX || {};
            const pokokY = tulangan.pokokY || {};
            const bagiX = tulangan.bagiX || {};
            const bagiY = tulangan.bagiY || {};
            
            const luas_pokok_x = pokokX.AsTerpasang || 0;
            const luas_pokok_y = pokokY.AsTerpasang || 0;
            const luas_bagi_x = bagiX.AsbTerpasang || 0;
            const luas_bagi_y = bagiY.AsbTerpasang || 0;
            
            const total_luas = luas_pokok_x + luas_pokok_y + luas_bagi_x + luas_bagi_y;
            
            const spasi_pokok_x = pokokX.sDigunakan || 450;
            const spasi_pokok_y = pokokY.sDigunakan || 450;
            const spasi_bagi_x = bagiX.sDigunakan || 450;
            const spasi_bagi_y = bagiY.sDigunakan || 450;
            
            const faktor_spasi = (spasi_pokok_x + spasi_pokok_y + spasi_bagi_x + spasi_bagi_y) / 4;
            
            const skor = total_luas * 0.8 - faktor_spasi * 0.2;
            console.log(`📊 Skor pelat: ${skor.toFixed(2)} (luas: ${total_luas.toFixed(1)}, spasi: ${faktor_spasi.toFixed(1)})`);
            
            return skor;

        } catch (error) {
            console.error("❌ Error calculating pelat score:", error);
            return Infinity;
        }
    }

    console.warn("❌ Struktur result tidak dikenali:", {
        hasRekap: !!result.rekap,
        rekapKeys: result.rekap ? Object.keys(result.rekap) : 'no rekap',
        hasData: !!result.data,
        module: result.data?.module || 'unknown'
    });

    return Infinity;
}

// ============================================================================
// OPTIMIZER — DENGAN LOGGING LENGKAP UNTUK SEMUA KOMBINASI - FIXED
// ============================================================================
async function optimizeDesain(inputData) {
    // PERBAIKAN: Handle struktur input yang berbeda dengan validasi
    let parsed, rawData;
    
    try {
        if (inputData && inputData.parsed && inputData.parsed.raw) {
            // Format dari kolom/pelat: {parsed: {raw: data}}
            parsed = inputData.parsed;
            rawData = inputData.parsed.raw;
        } else if (inputData && inputData.raw) {
            parsed = inputData;
            rawData = inputData.raw;
        } else {
            // Format dari balok: data langsung
            parsed = { 
                raw: inputData, 
                module: inputData?.module || 'unknown' 
            };
            rawData = inputData;
        }

        // Validasi module
        if (!parsed.module) {
            console.error("❌ Module tidak ditemukan dalam input:", inputData);
            return {
                status: "error",
                message: "Module tidak ditemukan dalam input data"
            };
        }

    } catch (error) {
        console.error("❌ Error parsing input:", error);
        return {
            status: "error", 
            message: "Gagal parsing input data: " + error.message
        };
    }

    const isKolom = parsed.module === "kolom";
    const isPelat = parsed.module === "pelat";
    const isBalok = parsed.module === "balok";

    const list_D =  (isPelat) ? [6,8,10,12,14,16,19,22,25] : [10,13,16,19,22,25,29,32,36];
    const list_phi = [6,8,10,12,14,16,19,22,25];
    const list_ms1 = (isKolom || isPelat) ? [0] : [1,2,3];
    const list_ms2 = (isKolom || isPelat) ? [0] : [1,2,3];

    let hasilTerbaik = null;
    let skorTerbaik = Infinity;
    let totalDicoba = 0;
    let totalValid = 0;

    console.log(`\n🔍 OPTIMASI ${isKolom ? "KOLOM" : isPelat ? "PELAT" : "BALOK"} DIMULAI...`);
    console.log(`📊 Mencoba ${list_D.length}×${list_phi.length}×${list_ms1.length}×${list_ms2.length} = ${list_D.length * list_phi.length * list_ms1.length * list_ms2.length} kombinasi...`);

    // Array untuk menyimpan semua hasil
    const semuaHasil = [];

    for (const D of list_D) {
        for (const phi of list_phi) {
            for (const ms1 of list_ms1) {
                for (const ms2 of list_ms2) {
                    totalDicoba++;
                    try {
                        let result;
                        let logDetail = "";

                        // === MODE PELAT ===
                        if (isPelat) {
                            if (window.calculatePelat) {
                                result = await window.calculatePelat({
                                    ...rawData,
                                    mode: "evaluasi",
                                    tulangan: { 
                                        d: D,      
                                        db: phi,   
                                        s: 0,      
                                        sb: 0      
                                    }
                                });
                            } else {
                                logDetail = `❌ Kombinasi D${D} phi${phi} - calculatePelat tidak tersedia`;
                                console.log(logDetail);
                                semuaHasil.push({ D, phi, ms1, ms2, status: "error", detail: logDetail });
                                continue;
                            }
                        }
                        // === MODE KOLOM ===
                        else if (isKolom) {
                            if (window.calculateKolomSync) {
                                result = window.calculateKolomSync({
                                    ...rawData,
                                    mode: "evaluasi",
                                    tulangan: { d_tul: D, phi_tul: phi }
                                });
                            } else {
                                logDetail = `❌ Kombinasi D${D} phi${phi} - calculateKolomSync tidak tersedia`;
                                console.log(logDetail);
                                semuaHasil.push({ D, phi, ms1, ms2, status: "error", detail: logDetail });
                                continue;
                            }
                        }
                        // === MODE BALOK ===
                        else if (isBalok) {
                            console.log(`🔧 Mencoba kombinasi balok: D${D} phi${phi} ms1:${ms1} ms2:${ms2}`);
                            
                            // PERBAIKAN: Gunakan hitungEvaluasi untuk balok
                            if (window.hitungEvaluasi) {
                                result = window.hitungEvaluasi(rawData, { D, phi, ms1, ms2 });
                            } else {
                                logDetail = `❌ Kombinasi D${D} phi${phi} - hitungEvaluasi tidak tersedia`;
                                console.log(logDetail);
                                semuaHasil.push({ D, phi, ms1, ms2, status: "error", detail: logDetail });
                                continue;
                            }
                        } else {
                            logDetail = `❌ Module tidak dikenali: ${parsed.module}`;
                            console.log(logDetail);
                            semuaHasil.push({ D, phi, ms1, ms2, status: "error", detail: logDetail });
                            continue;
                        }

                        // LOGGING DETAIL UNTUK SEMUA KOMBINASI
                        let status = "unknown";
                        let detail = "";
                        
                        if (!result) {
                            status = "error";
                            detail = `❌ Kombinasi D${D} phi${phi} - Tidak ada hasil`;
                        } 
                        else if (result.status !== "sukses" && result.status !== "aman") {
                            status = result.status;
                            
                            // Untuk balok, kita tidak memiliki AsTerpasang seperti pelat, jadi skip
                            if (isBalok) {
                                detail = `❌ Kombinasi D${D} phi${phi} ms1:${ms1} ms2:${ms2} gagal: ${result.status}`;
                                if (result.message) detail += ` - ${result.message}`;
                            } else {
                                // Hitung As terpakai (tulangan pokok)
                                const As_pokok_x = result.data?.tulangan?.pokokX?.AsTerpasang || 0;
                                const As_pokok_y = result.data?.tulangan?.pokokY?.AsTerpasang || 0;
                                const As_terpakai = As_pokok_x + As_pokok_y;
                                
                                // Hitung Asb terpakai (tulangan bagi)
                                const Asb_bagi_x = result.data?.tulangan?.bagiX?.AsbTerpasang || 0;
                                const Asb_bagi_y = result.data?.tulangan?.bagiY?.AsbTerpasang || 0;
                                const Asb_terpakai = Asb_bagi_x + Asb_bagi_y;
                                
                                detail = `❌ Kombinasi D${D} phi${phi} gagal: ${result.status}`;
                                detail += `\n   📊 As terpasang: ${As_terpakai.toFixed(1)} mm²/m (X:${As_pokok_x.toFixed(1)} + Y:${As_pokok_y.toFixed(1)})`;
                                detail += `\n   📏 Asb terpasang: ${Asb_terpakai.toFixed(1)} mm²/m (X:${Asb_bagi_x.toFixed(1)} + Y:${Asb_bagi_y.toFixed(1)})`;
                                
                                if (result.message) {
                                    detail += `\n   💬 Pesan: ${result.message}`;
                                }
                            }
                        } 
                        else {
                            // Cek kontrol untuk kombinasi yang statusnya sukses
                            if (!isKontrolAman(result.kontrol)) {
                                status = "tidak_aman";
                                
                                if (isBalok) {
                                    // Untuk balok, tampilkan informasi yang relevan
                                    detail = `❌ Kombinasi D${D} phi${phi} ms1:${ms1} ms2:${ms2} tidak aman`;
                                    // Tambahkan informasi kontrol
                                    if (result.kontrol) {
                                        if (result.kontrol.kontrolLentur) {
                                            detail += `\n   🔍 Kontrol Lentur:`;
                                            for (const key in result.kontrol.kontrolLentur) {
                                                const L = result.kontrol.kontrolLentur[key];
                                                detail += ` ${key}=${L.K_aman && L.Md_aman && L.rho_aman && L.kapasitas_aman ? '✅' : '❌'}`;
                                            }
                                        }
                                        if (result.kontrol.kontrolGeser) {
                                            detail += `\n   📐 Kontrol Geser:`;
                                            for (const key in result.kontrol.kontrolGeser) {
                                                const G = result.kontrol.kontrolGeser[key];
                                                detail += ` ${key}=${G.Vs_aman && G.Av_aman ? '✅' : '❌'}`;
                                            }
                                        }
                                        if (result.kontrol.kontrolTorsi) {
                                            detail += `\n   🔩 Kontrol Torsi:`;
                                            for (const key in result.kontrol.kontrolTorsi) {
                                                const T = result.kontrol.kontrolTorsi[key];
                                                detail += ` ${key}=${T.perluDanAman ? '✅' : '❌'}`;
                                            }
                                        }
                                    }
                                } else {
                                    const data = result.data;
                                    const As_pokok_x = data.tulangan?.pokokX?.AsTerpasang || 0;
                                    const As_pokok_y = data.tulangan?.pokokY?.AsTerpasang || 0;
                                    const As_terpakai = As_pokok_x + As_pokok_y;
                                    const Asb_bagi_x = data.tulangan?.bagiX?.AsbTerpasang || 0;
                                    const Asb_bagi_y = data.tulangan?.bagiY?.AsbTerpasang || 0;
                                    const Asb_terpakai = Asb_bagi_x + Asb_bagi_y;
                                    
                                    detail = `❌ Kombinasi D${D} phi${phi} tidak aman`;
                                    detail += `\n   📊 As terpasang: ${As_terpakai.toFixed(1)} mm²/m (X:${As_pokok_x.toFixed(1)} + Y:${As_pokok_y.toFixed(1)})`;
                                    detail += `\n   📏 Asb terpasang: ${Asb_terpakai.toFixed(1)} mm²/m (X:${Asb_bagi_x.toFixed(1)} + Y:${Asb_bagi_y.toFixed(1)})`;
                                    
                                    // Tambahkan detail kontrol spesifik
                                    if (result.kontrol?.lentur) {
                                        const lentur = result.kontrol.lentur;
                                        detail += `\n   🔍 Lentur: X=${lentur.arahX?.K_aman ? '✅' : '❌'}K ${lentur.arahX?.Md_aman ? '✅' : '❌'}Md ${lentur.arahX?.As_terpasang_aman ? '✅' : '❌'}As`;
                                        detail += ` | Y=${lentur.arahY?.K_aman ? '✅' : '❌'}K ${lentur.arahY?.Md_aman ? '✅' : '❌'}Md ${lentur.arahY?.As_terpasang_aman ? '✅' : '❌'}As`;
                                    }
                                    if (result.kontrol?.bagi) {
                                        const bagi = result.kontrol.bagi;
                                        detail += `\n   📐 Bagi: X=${bagi.arahX?.As_aman ? '✅' : '❌'} ${bagi.arahX?.As_terpasang_aman ? '✅' : '❌'} | Y=${bagi.arahY?.As_aman ? '✅' : '❌'} ${bagi.arahY?.As_terpasang_aman ? '✅' : '❌'}`;
                                    }
                                }
                            } 
                            else {
                                // KOMBINASI BERHASIL DAN AMAN
                                status = "aman";
                                
                                // Validasi result sebelum hitung skor
                                if (!result || !result.rekap) {
                                    console.warn(`⚠️  Result tidak valid untuk perhitungan skor:`, result);
                                    status = "invalid_result";
                                    detail = `⚠️  Kombinasi D${D} phi${phi} hasil tidak valid untuk perhitungan skor`;
                                } else {
                                    totalValid++;
                                    
                                    try {
                                        const skor = hitungSkorOptimalitas(result, D, phi);
                                        
                                        if (!isFinite(skor)) {
                                            console.warn(`⚠️  Skor tidak finite untuk kombinasi D${D} phi${phi}:`, skor);
                                            status = "invalid_score";
                                            detail = `⚠️  Kombinasi D${D} phi${phi} menghasilkan skor tidak valid: ${skor}`;
                                        } else {
                                            if (isBalok) {
                                                // Untuk balok, tampilkan informasi yang relevan
                                                detail = `✅ Kombinasi D${D} phi${phi} ms1:${ms1} ms2:${ms2} AMAN | Skor: ${skor.toFixed(2)}`;
                                                // Tambahkan informasi tulangan
                                                if (result.rekap) {
                                                    detail += `\n   📊 Tumpuan: ${result.rekap.tumpuan?.tulangan_negatif} (neg) / ${result.rekap.tumpuan?.tulangan_positif} (pos) | Begel: ${result.rekap.tumpuan?.begel}`;
                                                    detail += `\n   📏 Lapangan: ${result.rekap.lapangan?.tulangan_negatif} (neg) / ${result.rekap.lapangan?.tulangan_positif} (pos) | Begel: ${result.rekap.lapangan?.begel}`;
                                                    if (result.rekap.tumpuan?.torsi !== '-') detail += ` | Torsi: ${result.rekap.tumpuan?.torsi}`;
                                                }
                                            } else {
                                                const data = result.data;
                                                const As_pokok_x = data.tulangan?.pokokX?.AsTerpasang || 0;
                                                const As_pokok_y = data.tulangan?.pokokY?.AsTerpasang || 0;
                                                const As_terpakai = As_pokok_x + As_pokok_y;
                                                const Asb_bagi_x = data.tulangan?.bagiX?.AsbTerpasang || 0;
                                                const Asb_bagi_y = data.tulangan?.bagiY?.AsbTerpasang || 0;
                                                const Asb_terpakai = Asb_bagi_x + Asb_bagi_y;
                                                
                                                // Info spasi
                                                const spasi_x = data.tulangan?.pokokX?.sDigunakan || 0;
                                                const spasi_y = data.tulangan?.pokokY?.sDigunakan || 0;
                                                const spasi_bagi_x = data.tulangan?.bagiX?.sDigunakan || 0;
                                                const spasi_bagi_y = data.tulangan?.bagiY?.sDigunakan || 0;
                                                
                                                detail = `✅ Kombinasi D${D} phi${phi} AMAN | Skor: ${skor.toFixed(2)}`;
                                                detail += `\n   📊 As terpasang: ${As_terpakai.toFixed(1)} mm²/m (X:${As_pokok_x.toFixed(1)} + Y:${As_pokok_y.toFixed(1)})`;
                                                detail += `\n   📏 Asb terpasang: ${Asb_terpakai.toFixed(1)} mm²/m (X:${Asb_bagi_x.toFixed(1)} + Y:${Asb_bagi_y.toFixed(1)})`;
                                                detail += `\n   📐 Spasi: Pokok(X:${spasi_x}, Y:${spasi_y}) Bagi(X:${spasi_bagi_x}, Y:${spasi_bagi_y})`;
                                                
                                                // Info jika spasi dibatasi 100mm
                                                if (spasi_x === 100) detail += ` [SPASI X DIBATASI 100mm]`;
                                                if (spasi_y === 100) detail += ` [SPASI Y DIBATASI 100mm]`;
                                                if (spasi_bagi_x === 100) detail += ` [BAGI X DIBATASI 100mm]`;
                                                if (spasi_bagi_y === 100) detail += ` [BAGI Y DIBATASI 100mm]`;
                                            }
                                            
                                            if (skor < skorTerbaik) {
                                                skorTerbaik = skor;
                                                hasilTerbaik = {
                                                    ...result,
                                                    kombinasi: { D, phi, ms1, ms2 },
                                                    skor
                                                };
                                                detail += ` 🏆 (TERBAIK)`;
                                            }
                                            
                                            // Simpan hasil yang aman
                                            semuaHasil.push({ 
                                                D, phi, ms1, ms2, 
                                                status: "aman", 
                                                skor: skor,
                                                detail: detail,
                                                As_terpakai: isBalok ? 0 : (As_terpakai || 0),
                                                Asb_terpakai: isBalok ? 0 : (Asb_terpakai || 0)
                                            });
                                        }
                                    } catch (error) {
                                        console.error(`💥 Error hitung skor untuk D${D} phi${phi}:`, error);
                                        status = "score_error";
                                        detail = `💥 Error hitung skor: ${error.message}`;
                                    }
                                }
                            }
                        }
                        
                        // Tampilkan log untuk SEMUA kombinasi
                        if (detail) {
                            console.log(detail);
                        }
                        
                        // Simpan hasil yang tidak aman/error
                        if (status !== "aman") {
                            semuaHasil.push({ D, phi, ms1, ms2, status, detail });
                        }

                    } catch (e) {
                        const errorDetail = `💥 Kombinasi D${D} phi${phi} ms1:${ms1} ms2:${ms2} error: ${e.message}`;
                        console.log(errorDetail);
                        console.error('Stack trace:', e.stack);
                        semuaHasil.push({ D, phi, ms1, ms2, status: "error", detail: errorDetail });
                        continue;
                    }
                }
            }
        }
    }

    // SUMMARY LENGKAP
    console.log(`\n🎉 OPTIMASI SELESAI`);
    console.log(`📈 ${totalValid} valid dari ${totalDicoba} kombinasi`);
    
    // Tampilkan 10 kombinasi terbaik
    const kombinasiAman = semuaHasil.filter(h => h.status === "aman");
    kombinasiAman.sort((a, b) => a.skor - b.skor);
    
    console.log(`\n🏆 TOP 10 KOMBINASI TERBAIK:`);
    kombinasiAman.slice(0, 10).forEach((hasil, index) => {
        if (isBalok) {
            console.log(`   ${index + 1}. D${hasil.D} φ${hasil.phi} ms1:${hasil.ms1} ms2:${hasil.ms2} | Skor: ${hasil.skor.toFixed(2)}`);
        } else {
            console.log(`   ${index + 1}. D${hasil.D} φ${hasil.phi} | Skor: ${hasil.skor.toFixed(2)} | As: ${hasil.As_terpakai.toFixed(1)} mm²/m`);
        }
    });

    if (!hasilTerbaik) {
        console.log("\n❌ Tidak ada kombinasi yang memenuhi kontrol");
        
        // Analisis mengapa gagal
        const analisisError = {};
        semuaHasil.forEach(hasil => {
            if (hasil.status !== "aman") {
                const key = hasil.status;
                analisisError[key] = (analisisError[key] || 0) + 1;
            }
        });
        
        console.log("\n📊 ANALISIS KEGAGALAN:");
        Object.entries(analisisError).forEach(([error, count]) => {
            console.log(`   - ${error}: ${count} kombinasi`);
        });
        
        return {
            status: "error",
            message: "Tidak ada kombinasi yang memenuhi kontrol",
            analisis: analisisError,
            semua_hasil: semuaHasil
        };
    }

    console.log(`\n🏆 KOMBINASI TERBAIK:`);
    console.log(`   - Diameter tulangan: D${hasilTerbaik.kombinasi.D}`);
    console.log(`   - Diameter sengkang/bagi: φ${hasilTerbaik.kombinasi.phi}`);
    if (isBalok) {
        console.log(`   - Jumlah baris tulangan negatif: ${hasilTerbaik.kombinasi.ms1}`);
        console.log(`   - Jumlah baris tulangan positif: ${hasilTerbaik.kombinasi.ms2}`);
    }
    
    if (isPelat) {
        return {
            status: "sukses",
            D_opt: hasilTerbaik.kombinasi.D,
            db_opt: hasilTerbaik.kombinasi.phi,
            mode: "desain",
            data: hasilTerbaik.data,
            kontrol: hasilTerbaik.kontrol,
            rekap: hasilTerbaik.rekap,
            optimasi: {
                kombinasi_terbaik: hasilTerbaik.kombinasi,
                skor: hasilTerbaik.skor,
                kombinasi_tercoba: totalDicoba,
                kombinasi_berhasil: totalValid,
                top_10: kombinasiAman.slice(0, 10),
                semua_hasil: semuaHasil
            }
        };
    }

    // Struktur return untuk balok & kolom
    const finalResult = {
        status: "sukses",
        mode: "desain",
        data: hasilTerbaik.data,
        kontrol: hasilTerbaik.kontrol,
        rekap: hasilTerbaik.rekap,
        kontrol_rekap: hasilTerbaik.kontrol_rekap || (window.hitungKontrolRekap ? window.hitungKontrolRekap(hasilTerbaik.data) : {}),
        optimasi: {
            kombinasi_terbaik: hasilTerbaik.kombinasi,
            skor: hasilTerbaik.skor,
            kombinasi_tercoba: totalDicoba,
            kombinasi_berhasil: totalValid,
            top_10: kombinasiAman.slice(0, 10),
            semua_hasil: semuaHasil
        }
    };
    return finalResult;
}

// ============================================================================
// OPTIMIZER PELAT KHUSUS (untuk kompatibilitas)
// ============================================================================
async function optimizePelat(inputData) {
    return await optimizeDesain(inputData);
}

// ============================================================================
// OPTIMIZER KOLOM KHUSUS (untuk kompatibilitas)
// ============================================================================
async function optimizeKolom(inputData) {
    return await optimizeDesain(inputData);
}

// ============================================================================
// ALIASES UNTUK KOMPATIBILITAS
// ============================================================================
window.optimizeDesain = optimizeDesain;
window.optimizeKolom = optimizeKolom;
window.optimizePelat = optimizePelat;
window.isKontrolAman = isKontrolAman;
window.hitungSkorOptimalitas = hitungSkorOptimalitas;

console.log("✅ optimizer.js loaded - Support Balok, Kolom & Pelat dengan logging lengkap - FIXED");