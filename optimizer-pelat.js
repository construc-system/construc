// ============================================================================
// optimizer-pelat.js — OPTIMIZER KHUSUS UNTUK PELAT (REVISI DENGAN BATASAN φ ≤ D)
// ============================================================================

// ============================================================================
// CONTROL CHECKER KHUSUS PELAT (menggunakan fungsi dari window jika ada)
// ============================================================================
function isKontrolPelatAman(kontrol) {
    // Jika fungsi dari calc-pelat.js tersedia, gunakan itu
    if (typeof window.isKontrolAmanPelat === 'function') {
        return window.isKontrolAmanPelat(kontrol);
    }
    // Fallback sederhana (seharusnya tidak terpakai jika calc-pelat.js sudah dimuat)
    if (!kontrol) return false;
    const lenturOk = kontrol.lentur && kontrol.lentur.ok;
    const bagiOk = kontrol.bagi && kontrol.bagi.ok;
    return lenturOk && bagiOk;
}

// ============================================================================
// HITUNG SKOR OPTIMALITAS KHUSUS PELAT
// ============================================================================
function hitungSkorOptimalitasPelat(result, D, phi) {
    const R = result.rekap;
    
    // Hitung luas tulangan pokok per m²
    const luas_pokok_x = R.tulangan?.pokokX?.AsDigunakan || 0;
    const luas_pokok_y = R.tulangan?.pokokY?.AsDigunakan || 0;
    
    // Hitung luas tulangan bagi per m²  
    const luas_bagi_x = R.tulangan?.bagiX?.AsbDigunakan || 0;
    const luas_bagi_y = R.tulangan?.bagiY?.AsbDigunakan || 0;
    
    // Total luas tulangan per m² (berat ekonomis)
    const total_luas = luas_pokok_x + luas_pokok_y + luas_bagi_x + luas_bagi_y;
    
    // Faktor efisiensi spasi (semakin kecil spasi, semakin tidak ekonomis)
    const spasi_pokok_x = R.tulangan?.pokokX?.sDigunakan || 0;
    const spasi_pokok_y = R.tulangan?.pokokY?.sDigunakan || 0;
    const spasi_bagi_x = R.tulangan?.bagiX?.sDigunakan || 0;
    const spasi_bagi_y = R.tulangan?.bagiY?.sDigunakan || 0;
    
    const faktor_spasi = (spasi_pokok_x + spasi_pokok_y + spasi_bagi_x + spasi_bagi_y) / 4;
    
    // Skor = total luas tulangan - faktor spasi (semakin kecil semakin baik)
    // Beri bobot lebih besar untuk luas tulangan
    return total_luas * 0.8 - faktor_spasi * 0.2;
}

// ============================================================================
// OPTIMIZER PELAT — DENGAN LOGGING LENGKAP DAN BATASAN φ ≤ D
// ============================================================================
async function optimizePelat(inputData) {
    const list_D = [8, 10, 13, 16, 19, 22]; // Diameter tulangan pokok
    const list_phi = [8, 10, 13, 16, 19, 22]; // Diameter tulangan bagi

    let hasilTerbaik = null;
    let skorTerbaik = Infinity;
    let totalDicoba = 0;
    let totalValid = 0;
    let totalSkipped = 0; // kombinasi dengan φ > D

    // Hitung jumlah kombinasi yang memenuhi φ ≤ D untuk info awal
    let totalKombinasiValid = 0;
    for (const D of list_D) {
        for (const phi of list_phi) {
            if (phi <= D) totalKombinasiValid++;
        }
    }

    console.log(`\n🔍 OPTIMASI PELAT DIMULAI...`);
    console.log(`📊 Total kemungkinan kombinasi: ${list_D.length}×${list_phi.length} = ${list_D.length * list_phi.length}`);
    console.log(`✂️  Hanya kombinasi dengan φ ≤ D yang diuji: ${totalKombinasiValid} kombinasi`);

    // Array untuk menyimpan semua hasil
    const semuaHasil = [];

    for (const D of list_D) {
        for (const phi of list_phi) {
            // BATASAN: diameter tulangan bagi tidak boleh lebih besar dari tulangan utama
            if (phi > D) {
                totalSkipped++;
                const skipMsg = `⏭️  Kombinasi D${D} φ${phi} dilewati (φ > D)`;
                console.log(skipMsg);
                semuaHasil.push({ D, phi, status: "skipped", detail: skipMsg });
                continue;
            }

            totalDicoba++;
            try {
                let result;
                let logDetail = "";

                // Panggil fungsi calculatePelat dengan mode evaluasi, TANPA mengirim s dan sb
                if (window.calculatePelat) {
                    result = await window.calculatePelat({
                        ...inputData.parsed.raw,
                        mode: "evaluasi",
                        tulangan: { 
                            d: D,      // Diameter tulangan pokok
                            db: phi    // Diameter tulangan bagi
                            // s dan sb tidak dikirim -> akan dihitung otomatis
                        }
                    });
                } else {
                    logDetail = `❌ Kombinasi D${D} phi${phi} - calculatePelat tidak tersedia`;
                    console.log(logDetail);
                    semuaHasil.push({ D, phi, status: "error", detail: logDetail });
                    continue;
                }

                // LOGGING DETAIL UNTUK SEMUA KOMBINASI
                let status = "unknown";
                let detail = "";
                
                if (!result) {
                    status = "error";
                    detail = `❌ Kombinasi D${D} phi${phi} - Tidak ada hasil`;
                } 
                else if (result.status !== "sukses") {
                    status = result.status;
                    
                    // Hitung As terpakai (tulangan pokok)
                    const As_pokok_x = result.data?.tulangan?.pokokX?.AsDigunakan || 0;
                    const As_pokok_y = result.data?.tulangan?.pokokY?.AsDigunakan || 0;
                    const As_terpakai = As_pokok_x + As_pokok_y;
                    
                    // Hitung Asb terpakai (tulangan bagi)
                    const Asb_bagi_x = result.data?.tulangan?.bagiX?.AsbDigunakan || 0;
                    const Asb_bagi_y = result.data?.tulangan?.bagiY?.AsbDigunakan || 0;
                    const Asb_terpakai = Asb_bagi_x + Asb_bagi_y;
                    
                    detail = `❌ Kombinasi D${D} phi${phi} gagal: ${result.status}`;
                    detail += `\n   📊 As terpakai: ${As_terpakai.toFixed(1)} mm²/m (X:${As_pokok_x.toFixed(1)} + Y:${As_pokok_y.toFixed(1)})`;
                    detail += `\n   📏 Asb terpakai: ${Asb_terpakai.toFixed(1)} mm²/m (X:${Asb_bagi_x.toFixed(1)} + Y:${Asb_bagi_y.toFixed(1)})`;
                    
                    if (result.message) {
                        detail += `\n   💬 Pesan: ${result.message}`;
                    }
                } 
                else {
                    // Cek kontrol untuk kombinasi yang statusnya sukses
                    if (!isKontrolPelatAman(result.kontrol)) {
                        status = "tidak_aman";
                        
                        const data = result.data;
                        const As_pokok_x = data.tulangan?.pokokX?.AsDigunakan || 0;
                        const As_pokok_y = data.tulangan?.pokokY?.AsDigunakan || 0;
                        const As_terpakai = As_pokok_x + As_pokok_y;
                        const Asb_bagi_x = data.tulangan?.bagiX?.AsbDigunakan || 0;
                        const Asb_bagi_y = data.tulangan?.bagiY?.AsbDigunakan || 0;
                        const Asb_terpakai = Asb_bagi_x + Asb_bagi_y;
                        
                        detail = `❌ Kombinasi D${D} phi${phi} tidak aman`;
                        detail += `\n   📊 As terpakai: ${As_terpakai.toFixed(1)} mm²/m (X:${As_pokok_x.toFixed(1)} + Y:${As_pokok_y.toFixed(1)})`;
                        detail += `\n   📏 Asb terpakai: ${Asb_terpakai.toFixed(1)} mm²/m (X:${Asb_bagi_x.toFixed(1)} + Y:${Asb_bagi_y.toFixed(1)})`;
                        
                        const kontrol_lentur = result.kontrol?.lentur;
                        const kontrol_bagi = result.kontrol?.bagi;
                        
                        if (kontrol_lentur) {
                            const lentur_x_aman = kontrol_lentur.arahX?.K_aman && kontrol_lentur.arahX?.Md_aman;
                            const lentur_y_aman = kontrol_lentur.arahY?.K_aman && kontrol_lentur.arahY?.Md_aman;
                            detail += `\n   🔍 Kontrol Lentur: X=${lentur_x_aman ? '✅' : '❌'} Y=${lentur_y_aman ? '✅' : '❌'}`;
                            
                            if (!lentur_x_aman && kontrol_lentur.arahX) {
                                detail += `\n      Arah X - K=${kontrol_lentur.arahX.detail?.K?.toFixed(4)} vs Kmaks=${kontrol_lentur.arahX.detail?.Kmaks?.toFixed(4)}`;
                                detail += `\n      Arah X - Md=${kontrol_lentur.arahX.detail?.Md?.toFixed(3)} vs Mu=${kontrol_lentur.arahX.detail?.Mu?.toFixed(3)}`;
                            }
                            if (!lentur_y_aman && kontrol_lentur.arahY) {
                                detail += `\n      Arah Y - K=${kontrol_lentur.arahY.detail?.K?.toFixed(4)} vs Kmaks=${kontrol_lentur.arahY.detail?.Kmaks?.toFixed(4)}`;
                                detail += `\n      Arah Y - Md=${kontrol_lentur.arahY.detail?.Md?.toFixed(3)} vs Mu=${kontrol_lentur.arahY.detail?.Mu?.toFixed(3)}`;
                            }
                        }
                        
                        if (kontrol_bagi) {
                            const bagi_x_aman = kontrol_bagi.arahX?.As_aman;
                            const bagi_y_aman = kontrol_bagi.arahY?.As_aman;
                            detail += `\n   📐 Kontrol Bagi: X=${bagi_x_aman ? '✅' : '❌'} Y=${bagi_y_aman ? '✅' : '❌'}`;
                        }
                    } 
                    else {
                        // KOMBINASI BERHASIL DAN AMAN
                        status = "aman";
                        totalValid++;
                        
                        const skor = hitungSkorOptimalitasPelat(result, D, phi);
                        const data = result.data;
                        const As_pokok_x = data.tulangan?.pokokX?.AsDigunakan || 0;
                        const As_pokok_y = data.tulangan?.pokokY?.AsDigunakan || 0;
                        const As_terpakai = As_pokok_x + As_pokok_y;
                        const Asb_bagi_x = data.tulangan?.bagiX?.AsbDigunakan || 0;
                        const Asb_bagi_y = data.tulangan?.bagiY?.AsbDigunakan || 0;
                        const Asb_terpakai = Asb_bagi_x + Asb_bagi_y;
                        
                        // Info spasi
                        const spasi_x = data.tulangan?.pokokX?.sDigunakan || 0;
                        const spasi_y = data.tulangan?.pokokY?.sDigunakan || 0;
                        const spasi_bagi_x = data.tulangan?.bagiX?.sDigunakan || 0;
                        const spasi_bagi_y = data.tulangan?.bagiY?.sDigunakan || 0;
                        
                        detail = `✅ Kombinasi D${D} phi${phi} AMAN | Skor: ${skor.toFixed(2)}`;
                        detail += `\n   📊 As terpakai: ${As_terpakai.toFixed(1)} mm²/m (X:${As_pokok_x.toFixed(1)} + Y:${As_pokok_y.toFixed(1)})`;
                        detail += `\n   📏 Asb terpakai: ${Asb_terpakai.toFixed(1)} mm²/m (X:${Asb_bagi_x.toFixed(1)} + Y:${Asb_bagi_y.toFixed(1)})`;
                        detail += `\n   📐 Spasi: Pokok(X:${spasi_x}, Y:${spasi_y}) Bagi(X:${spasi_bagi_x}, Y:${spasi_bagi_y})`;
                        
                        if (skor < skorTerbaik) {
                            skorTerbaik = skor;
                            hasilTerbaik = {
                                ...result,
                                kombinasi: { D, phi },
                                skor
                            };
                            detail += ` 🏆 (TERBAIK)`;
                        }
                        
                        // Simpan hasil yang aman
                        semuaHasil.push({ 
                            D, phi, 
                            status: "aman", 
                            skor: skor,
                            detail: detail,
                            As_terpakai: As_terpakai,
                            Asb_terpakai: Asb_terpakai,
                            spasi_x: spasi_x,
                            spasi_y: spasi_y,
                            spasi_bagi_x: spasi_bagi_x,
                            spasi_bagi_y: spasi_bagi_y
                        });
                    }
                }
                
                // Tampilkan log untuk SEMUA kombinasi
                if (detail) {
                    console.log(detail);
                }
                
                // Simpan hasil yang tidak aman/error
                if (status !== "aman") {
                    semuaHasil.push({ D, phi, status, detail });
                }

            } catch (e) {
                const errorDetail = `💥 Kombinasi D${D} phi${phi} error: ${e.message}`;
                console.log(errorDetail);
                semuaHasil.push({ D, phi, status: "error", detail: errorDetail });
                continue;
            }
        }
    }

    // SUMMARY LENGKAP
    console.log(`\n🎉 OPTIMASI PELAT SELESAI`);
    console.log(`📈 ${totalValid} valid dari ${totalDicoba} kombinasi yang diuji (${totalSkipped} kombinasi dilewati karena φ > D)`);
    
    // Tampilkan 10 kombinasi terbaik
    const kombinasiAman = semuaHasil.filter(h => h.status === "aman");
    kombinasiAman.sort((a, b) => a.skor - b.skor);
    
    console.log(`\n🏆 TOP 10 KOMBINASI TERBAIK:`);
    kombinasiAman.slice(0, 10).forEach((hasil, index) => {
        console.log(`   ${index + 1}. D${hasil.D} φ${hasil.phi} | Skor: ${hasil.skor.toFixed(2)} | As: ${hasil.As_terpakai.toFixed(1)} mm²/m | Asb: ${hasil.Asb_terpakai.toFixed(1)} mm²/m`);
    });

    if (!hasilTerbaik) {
        console.log("\n❌ Tidak ada kombinasi yang memenuhi kontrol");
        
        // Analisis mengapa gagal
        const analisisError = {};
        semuaHasil.forEach(hasil => {
            if (hasil.status !== "aman" && hasil.status !== "skipped") {
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
            message: "Tidak ditemukan kombinasi yang memenuhi semua kontrol keamanan. Silahkan periksa input atau perbesar dimensinya",
            analisis: analisisError,
            semua_hasil: semuaHasil
        };
    }

    console.log(`\n🏆 KOMBINASI TERBAIK:`);
    console.log(`   - Tulangan pokok: D${hasilTerbaik.kombinasi.D}`);
    console.log(`   - Tulangan bagi: φ${hasilTerbaik.kombinasi.phi}`);
    console.log(`   - Spasi pokok: X:${hasilTerbaik.data.tulangan?.pokokX?.sDigunakan}mm, Y:${hasilTerbaik.data.tulangan?.pokokY?.sDigunakan}mm`);
    console.log(`   - Spasi bagi: X:${hasilTerbaik.data.tulangan?.bagiX?.sDigunakan}mm, Y:${hasilTerbaik.data.tulangan?.bagiY?.sDigunakan}mm`);
    console.log(`   - Skor optimalitas: ${hasilTerbaik.skor.toFixed(2)}`);
    
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
            kombinasi_dilewati: totalSkipped,
            top_10: kombinasiAman.slice(0, 10),
            semua_hasil: semuaHasil
        }
    };
}

// ============================================================================
// ALIASES UNTUK KOMPATIBILITAS
// ============================================================================
window.optimizePelat = optimizePelat;
window.isKontrolPelatAman = isKontrolPelatAman;
window.hitungSkorOptimalitasPelat = hitungSkorOptimalitasPelat;

console.log("✅ optimizer-pelat.js loaded (revisi dengan batasan φ ≤ D) - Optimizer khusus untuk pelat");