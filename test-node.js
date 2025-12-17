function ceili(x,i) {
    return Math.ceil(Number(x) / i) * i;
}
function floori(x,i) {
    return Math.floor(Number(x) / i) * i;
}
function hitungAsTerpasang(D, s) {
    return (Math.PI * D * D * 1000) / (4 * Math.max(s, 1));
}
// ========== FUNGSI HITUNG PARAMETER FONDASI ==========
function hitungParameterFondasi(fondasiMode, Ly, Lx, by, bx, h, Pu, Mux, Muy, Gc, Gamma, Df, fc, fy, D, sbeton) {
  console.log("🔧 hitungParameterFondasi dipanggil");
  try {
    // 1) Hitung ds & ds' - Jarak tulangan
    const ds = ceili(sbeton + D / 2,5);
    const ds2 = ceili(sbeton + D + D / 2,5);
    // 2) Hitung d & d' - Tinggi efektif
    const d = h * 1000 - ds;
    const d2 = h * 1000 - ds2;
    // 3) Hitung a (jarak kritis geser)
    const a = (fondasiMode === "Tunggal") ? (Ly / 2 - by / 1000 / 2 - d / 1000) : (Lx / 2 - bx / 1000 / 2 - d / 1000);
    // 4) Hitung q (tekanan overburden)
    const q = h * Gc + (Df - h) * Gamma;
    // 5) Hitung σmin & σmax - Tekanan tanah
    const sigma_min = Pu / (Lx * Ly) - Mux / ((Lx * Math.pow(Ly, 2)) / 6) - Muy / ((Ly * Math.pow(Lx, 2)) / 6) + q;
    const sigma_max = Pu / (Lx * Ly) + Mux / ((Lx * Math.pow(Ly, 2)) / 6) + Muy / ((Ly * Math.pow(Lx, 2)) / 6) + q;
    const sigma_status = sigma_min > 0 ? "AMAN" : "BAHAYA";
    // 6) Hitung σa - Tekanan pada jarak kritis
    const sigma_a = sigma_min + (Ly - a) * (sigma_max - sigma_min) / Ly;
    // 7) Hitung x1 & x2 - Jarak momen
    const x1 = Ly / 2 - by / 1000 / 2;
    const x2 = Lx / 2 - bx / 1000 / 2;
    // 8) Hitung b0 (keliling kritis geser 2 arah)
    const b0 = (fondasiMode === "Tunggal") ? 2 * ((bx + d) + (by + d)) : 2 * ((bx + d) + Ly * 1000);
    // 9) Hitung β1 untuk regangan beton
    const beta1 = (fc <= 28) ? 0.85 : (fc >= 55) ? 0.65 : 0.85 - 0.05 * (fc - 28) / 7;
    // 10) Hitung Kmaks - Koefisien momen maksimum
    const Kmax = (382.5 * beta1 * fc * (600 + fy - 225 * beta1)) / Math.pow((600 + fy), 2);
    const result = {ds, ds2, d, d2, a, q, sigma_min, sigma_max, sigma_status, sigma_a, x1, x2, b0, beta1, Kmax};
    console.log("✅ hitungParameterFondasi hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam hitungParameterFondasi:", error);
    throw error;
  }
}
// ========== FUNGSI HITUNG DAYA DUKUNG TANAH (TERZAGHI) ==========
function hitungDayaDukungTanah(Fi, Lx, Ly, Df, gamma, c, qc, sigma_max, mayerhoff, terzaghi) {
  console.log("🔧 hitungDayaDukungTanah dipanggil");
  try {
    // 1)Konversi sudut ke radian
    const phi_rad = (Fi * Math.PI) / 180;
    // 2)Faktor Terzaghi
    const a = Math.exp((3 * Math.PI / 4 - phi_rad / 2) * Math.tan(phi_rad));
    const Kp_gamma = 3 * Math.pow(Math.tan((45 + 0.5 * (Fi + 33)) * Math.PI / 180), 2);
    const Nc = (1 / Math.tan(phi_rad)) * (Math.pow(a, 2) / (2 * Math.pow(Math.cos(Math.PI / 4 + phi_rad / 2), 2)) - 1);
    const Nq = Math.pow(a, 2) / (2 * Math.pow(Math.cos(Math.PI / 4 + phi_rad / 2), 2));
    const Ngamma = 0.5 * Math.tan(phi_rad) * (Kp_gamma / Math.pow(Math.cos(phi_rad), 2) - 1);
    const qu_terzaghi = c * Nc * (1 + 0.3 * Lx / Ly) + Df * gamma * Nq + 0.5 * Lx * Ngamma * (1 - 0.2 * Lx / Ly);
    const qa_terzaghi = qu_terzaghi / 3;
    // 3)Daya dukung Meyerhof
    let Kd = 1 + 0.33 * Df / Lx;
    if (Kd > 1.33) Kd = 1.33;
    const qa_meyerhof = (qc / 33) * Math.pow((Lx + 0.3) / Lx, 2) * Kd * 100;
    // 4)Daya dukung tanah
    const qa =(terzaghi && mayerhoff) ? Math.min(qa_terzaghi, qa_meyerhof) : (terzaghiValid ? qa_terzaghi : meyerhofValid ? qa_meyerhof : null);
    const status = qa > sigma_max ? "AMAN" : "BAHAYA";
    const result = {phi_rad, a, Kp_gamma, Nc, Nq, Ngamma, qu_terzaghi, qa_terzaghi, Kd, qa_meyerhof, qa, status};
    console.log("✅ hitungDayaDukungTanah hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam hitungDayaDukungTanah:", error);
    throw error;
  }
}
// ========== FUNGSI KONTROL GESER FONDASI TUNGGAL ==========
function kontrolGeserFondasiTunggal(a, Lx, Ly, sigma_max, sigma_min, sigma_a, fc, lambda, bx, by, d, b0, phi2, alpha_s) {
  console.log("🔧 kontrolGeserFondasiTunggal dipanggil");
  try {
    // 1)Geser 1 arah
    const Vu1 = a * Lx * (sigma_max + sigma_a) / 2;
    const Vc1 = phi2 * 0.17 * lambda * Math.sqrt(fc) * Lx * d;
    const amanGeser1 = (Vu1 <= Vc1) ? "AMAN" : "BAHAYA";
    // 2)Geser 2 arah
    const Vu2 = (Lx * Ly - (bx + d) / 1000 * (by + d) / 1000) * ((sigma_max + sigma_min) / 2);
    const Vc21 = 0.17 * (1 + 2 / (by / bx)) * lambda * Math.sqrt(fc) * b0 * d / 1000;
    const Vc22 = 0.083 * (2 + (alpha_s * d / b0)) * lambda * Math.sqrt(fc) * b0 * d / 1000;
    const Vc23 = 0.33 * Math.sqrt(fc) * b0 * d / 1000;
    const Vc2 = Math.min(Vc21, Vc22, Vc23);
    const phiVc2 = phi2 * Vc2;
    const amanGeser2 = (Vu2 <= phiVc2) ? "AMAN" : "BAHAYA";
    const result = {Vu1, Vc1, amanGeser1, Vu2, Vc21, Vc22, Vc23, Vc2, phiVc2, amanGeser2};
    console.log("✅ kontrolGeserFondasiTunggal hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam kontrolGeserFondasiTunggal:", error);
    throw error;
  }
}

// ========== FUNGSI KONTROL GESER FONDASI MENERUS ==========
function kontrolGeserFondasiMenerus(a, Lx, Ly, sigma_max, sigma_min, fc, lambda, bx, by, d, b0, phi2, alpha_s) {
  console.log("🔧 kontrolGeserFondasiMenerus dipanggil");
  try {
    // 1)Geser 1 arah
    const Vu1 = a * Ly * sigma_max;
    const Vc1 = phi2 * 0.17 * lambda * Math.sqrt(fc) * by * d / 1000;
    const amanGeser1 = (Vu1 <= Vc1) ? "AMAN" : "BAHAYA";
    // 2)Geser 2 arah
    const Vu2 = (Lx - bx / 1000 - d / 1000) * Ly * ((sigma_max + sigma_min) / 2);
    const Vc21 = 0.17 * (1 + 2 / (by / bx)) * lambda * Math.sqrt(fc) * b0 * d / 1000;
    const Vc22 = 0.083 * (2 + (alpha_s * d / b0)) * lambda * Math.sqrt(fc) * b0 * d / 1000;
    const Vc23 = 0.33 * Math.sqrt(fc) * b0 * d / 1000;
    const Vc2 = Math.min(Vc21, Vc22, Vc23);
    const phiVc2 = phi2 * Vc2;
    const amanGeser2 = (Vu2 <= phiVc2) ? "AMAN" : "BAHAYA";
    const result = {Vu1, Vc1, amanGeser1, Vu2, Vc21, Vc22, Vc23, Vc2, phiVc2, amanGeser2};
    console.log("✅ kontrolGeserFondasiMenerus hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam kontrolGeserFondasiMenerus:", error);
    throw error;
  }
}
// ========== Fondasi Bujur Sangkar ==========
  function bujurSangkar(Ly, x1, sigma_min, sigma_max, phi1, b, d, Kmax, fc, fy, D, h) {
    console.log("🔧 Mode bujur sangkar");
    try {
    const sigma = sigma_min + (Ly - x1) * (sigma_max - sigma_min) / Ly;
    const Mu = 0.5 * sigma * x1 * x1 + (1/3) * (omax - sigma) * x1 * x1;
    const K = Mu * 1e6 / (phi1 * b * d * d);
    const Kontrol_K = (K <= Kmax) ? "AMAN" : "BAHAYA";
    const a = (1 - Math.sqrt(1 - 2 * K / (0.85 * fc))) * d;
    const As1 = 0.85 * fc * a * 1000 / fy;
    const As2 = (Math.sqrt(fc) / (4 * fy)) * b * d;
    const As3 = 1.4 * b * d / fy;
    const As = Math.max(As1, As2, As3);
    const s1 = 0.25 * Math.PI * D * D * 1000 / As;
    const s2 = 3 * h * 1000;
    const s = floori(Math.min(s1, s2, 450),25);
    const result = {sigma, Mu, K, Kontrol_K, As1, As2, As3, As, s1, s2, s};
    console.log("✅ kontrolGeserFondasiMenerus hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam kontrolGeserFondasiMenerus:", error);
    throw error;
  }
}
// ========== Fondasi Persegi Panjang ==========
function persegiPanjang(Lx, Ly, sigma_max, x2, phi1, b, d2, fc, fy, h, Db, Kmax) {
  console.log("🔧 Mode persegi panjang");
  try {
    const Mu = 0.5 * sigma_max * x2 * x2;
    const K = Mu * 1e6 / (phi1 * b * d2 * d2);
    const Kontrol_K = (K <= Kmax) ? "AMAN" : "BAHAYA";
    const a = (1 - Math.sqrt(1 - 2 * K / (0.85 * fc))) * d2;
    const As21 = 0.85 * fc * a * 1000 / fy;
    const As22 = (Math.sqrt(fc) / (4 * fy)) * b * d2;
    const As23 = 1.4 * b * d2 / fy;
    const As = Math.max(As21, As22, As23);
    const Aspusat = (2 * Lx * As) / (Ly + Lx);
    const s1_pusat = 0.25 * Math.PI * Db * Db * 1000 / Aspusat;
    const s2_pusat = 3 * h * 1000;
    const s_pusat = floori(Math.min(s1_pusat, s2_pusat, 450),25);
    const Astepi  = As_pendek - Aspusat;
    const s1_tepi = 0.25 * Math.PI * Db * Db * 1000 / Astepi;
    const s2_tepi = 3 * h * 1000;
    const s_tepi = floori(Math.min(s1_tepi, s2_tepi, 450),25);
    const result = {Mu, K, Kontrol_K, a,As21, As22, As23,As, Aspusat, s1_pusat, s2_pusat ,s_pusat, Astepi, s1_tepi, s2_tepi ,s_tepi};
    console.log("✅ persegiPanjang hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam persegiPanjang:", error);
    throw error;
  }
}
// ========== Fondasi Menerus ==========
function menerus(sigma_max, x2, phi1, b, d, fc, fy, D, h, Db, Kmax) {
  console.log("🔧 Mode menerus");
  try {
    const Mu= 0.5 * sigma_max * x2 * x2;
    const K = Mu * 1e6 / (phi1 * b * d * d);
    const Kontrol_K = (K <= Kmax) ? "AMAN" : "BAHAYA";
    const a = (1 - Math.sqrt(1 - 2 * K / (0.85 * fc))) * d;
    const As1 = 0.85 * fc * a * b / fy;
    const As2 = (Math.sqrt(fc) / (4 * fy)) * b * d;
    const As3 = 1.4 * b * d / fy;
    const As = Math.max(As1, As2, As3);
    const s1 = 0.25 * Math.PI * D * D * 1000 / As;
    const s2 = 3 * h * 1000;
    const s_utama = floori(Math.min(s1, s2, 450),25);
    const Asb1 = As/5;
    const Asb2 = (fy <= 350 ? 0.002 * b * h : (fy > 350 && fy < 420) ? (0.002 - (fy - 350) / 350000) * b * h : 0.0018 * b * h * (420 / fy)) * 1000;
    const Asb3 = 0.0014*b*h*1000
    const Asb = Math.max(Asb1, Asb2, Asb3)
    const s1_bagi = 0.25 * Math.PI * Db * Db * 1000 / Asb;
    const s2_bagi = 5 * h * 1000;
    const s_bagi = floori(Math.min(s1_bagi, s2_bagi, 450),25);
    const result = {Mu, K, Kontrol_K, a, As1, As2, As3, As, s1, s2, s_utama, Asb1, Asb2, Asb3, Asb, s1_bagi, s2_bagi, s_bagi};
    console.log("✅ menerus hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam menerus:", error);
    throw error;
  }
}
// ========== Kuat DUkung Fondasi Tunggal ==========
Function kuatDukungTunggal(bx, by, fc, fy, D, s, lambda, h, Pu, sbeton){
  console.log("🔧 Kuat Dukung Fondasi Tunggal");
  try {
    const A1 = bx*by
    const Pu_cap = 0.65 * 0.85 * fc * A1
    const Kontrol_Pu = (Pu_cap >= Pu) ? "AMAN" : "BAHAYA";
    const It = Lx*1000/2-bx/2-sb;
    const f3 = hitungAsTerpasang(D,s);
    const Idh1 = (0.24*1*fy/(lambda*Math.sqrt(fc)))*D*1*1*f3;
    const Idh2 = 8*h;
    const Idh = ceili(Math.max(Idh1, Idh2, 150),5);
    const Kontrol_Idh = (Idh >= it) ? "AMAN" : "BAHAYA";
    const result = {A1, Pu_cap, Kontrol_Pu, It, Idh1, Idh2, Idh, Kontrol_Idh};
    console.log("✅ Kuat Dukung Fondasi Tunggal hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam Kuat Dukung Tunggal:", error);
    throw error;
  }
}
// ========== Kuat DUkung Fondasi Menerus ==========
Function kuatDukungTunggal(bx, by, fc, fy, D, s, lambda, h, sbeton){
  console.log("🔧 Kuat Dukung Fondasi Tunggal");
  try {
    const A1 = bx*by
    const Pu_cap = 0.65 * 0.85 * fc * A1
    const Kontrol_Pu = (Pu_cap >= Pu) ? "AMAN" : "BAHAYA";
    const It = Lx*1000/2-bx/2-sbeton;
    const Cb = Math.min(75,s_utama);
    const C = Math.min((Cb + 0) / D, 2.5);
    const Idh1 = (fy / (1.1 * lambda * Math.sqrt(fc))) * (1 * 1 * phis / C) * D;
    const Idh2 = 8 * D;
    const Idh = ceili(Math.max(Idh1, Idh2, 300),5);
    const Kontrol_Idh = (Idh >= it) ? "AMAN" : "BAHAYA";
    const result = {A1, Pu_cap, Kontrol_Pu, It, Cb, C, Idh1, Idh2, Idh, Kontrol_Idh};
    console.log("✅ Kuat Dukung Fondasi Menerus hasil:", result);
    return result;
  } catch (error) {
    console.error("💥 Error dalam Kuat Dukung Menerus:", error);
    throw error;
  }
}
// ========== FUNGSI UTAMA PERHITUNGAN FONDASI ==========
async function CalculateFondasi(data) {
  try {
    const fondasi  = data.fondasi || {}
    const dimensi  = fondasi.dimensi || {}
    const tanah    = data.tanah || {}
    const tanahAuto    = tanah.auto || {}
    const tanahManual  = tanah.manual || {}
    const beban    = data.beban || {}
    const material = data.material || {}
    const lanjutan = data.lanjutan || {}
    const tulangan = data.tulangan || {}

    const mode         = data.mode || null
    const fondasiMode  = fondasi.mode || null
    const autoDimensi  = fondasi.autoDimensi ?? null

    const lx       = parseFloat(dimensi.lx)
    const ly       = parseFloat(dimensi.ly)
    const bx       = parseFloat(dimensi.bx)
    const by       = parseFloat(dimensi.by)
    const h        = parseFloat(dimensi.h)
    const alpha_s  = parseFloat(dimensi.alpha_s)

    const Pu   = parseFloat(beban.pu)
    const Mux  = parseFloat(beban.mux)
    const Muy  = parseFloat(beban.muy)

    const fc      = parseFloat(material.fc)
    const fy      = parseFloat(material.fy)
    const gammaC  = parseFloat(material.gammaC)

    const df        = parseFloat(tanahAuto.df)
    const gamma     = parseFloat(tanahAuto.gamma)
    const phi       = parseFloat(tanahAuto.phi)
    const c         = parseFloat(tanahAuto.c)
    const qc        = parseFloat(tanahAuto.qc)
    const terzaghi  = tanahAuto.terzaghi ?? null
    const mayerhoff = tanahAuto.mayerhoff ?? null

    const qa = parseFloat(tanahManual.qa)

    const lambda =
      lanjutan.lambda === undefined ||
      lanjutan.lambda === "" ||
      lanjutan.lambda === null
        ? 1
        : parseFloat(lanjutan.lambda)

    const D   = parseFloat(tulangan.d)
    const Db  = parseFloat(tulangan.db)
    const s   = parseFloat(tulangan.s)
    const sb  = parseFloat(tulangan.sb)

    const phi1 = 0.9
    const phi2 = 0.75
    const phie = 1
    const phit = 1
    const phis = tulangan.d ? (tulangan.d <= 19 ? 0.8 : 1) : 0.8
    const sbeton = 75

    return {
      mode,
      fondasiMode,
      autoDimensi,
      lx, ly, bx, by, h, alpha_s,
      Pu, Mux, Muy,
      fc, fy, gammaC,
      df, gamma, phi, c, qc, terzaghi, mayerhoff,
      qa,
      lambda,
      D, Db, s, sb,
      phi1, phi2, phie, phit, phis, sbeton
    }

  } catch (err) {
    return {
      error: "Parsing error",
      detail: err?.message || err
    }
  }
}
function hitungFondasi(input) {
  const {
    mode,
    fondasiMode,
    autoDimensi,
    tanahMode,
    lx, ly, bx, by, h, alpha_s,
    Pu, Mux, Muy,
    fc, fy, gammaC,
    df, gamma, phi, c, qc, terzaghi, mayerhoff,
    qa,
    lambda,
    d, db, s, sb,
    phi1, phi2, phie, phit, phis, sbeton
  } = input;
  // ==== 1. PARAMETER FONDASI ====
  const param = hitungParameterFondasi(fondasiMode, Ly, Lx, by, bx, h,Pu, Mux, Muy, Gc, Gamma, Df,fc, fy, D, sbeton);
  // ==== 2. DAYA DUKUNG TANAH ====
  let tanah;
  if (tanahMode) {
    tanah = hitungDayaDukungTanah(phi, Lx, Ly, Df, Gamma, c,qc, sigma_max_manual, mayerhoff, terzaghi);
  } else {
    tanah = {
      qa: qa
    };
  }
  // ==== 3. KONTROL GESER ====
  let geser;
  if (fondasiMode === "tunggal") {
    geser = kontrolGeserFondasiTunggal(param.a, Lx, Ly,param.sigma_max, param.sigma_min,param.sigma_a, fc, lambda,bx, by, param.d, param.b0,phi2, alpha_s);
  } else {
    geser = kontrolGeserFondasiMenerus(param.a, Lx, Ly,param.sigma_max, param.sigma_min,param.sigma_a, fc, lambda,bx, by, param.d, param.b0,phi2, alpha_s);
  }
  // ==== 4. TULANGAN ====
  let tulangan;
  if (fondasiMode === "tunggal") {
    if (Lx === Ly) {
      tulangan = {bujur: bujurSangkar(Ly, param.x1,param.sigma_min, param.sigma_max, phi1, bx, param.d,param.Kmax, fc, fy, D, h),
      persegi: null
      };
    } else {
      const tul_panjang = bujurSangkar(Ly, param.x1,param.sigma_min, param.sigma_max, phi1, bx, param.d,param.Kmax, fc, fy, D, h),
      const tul_pendek = persegiPanjang( Lx, Ly, param.sigma_max, param.x2, param.phi1, bx, param.d2, fc, fy, h, Db, param.Kmax);
      tulangan = {bujur: tul_panjang, persegi: tul_pendek};
    }
  } else {
    tulangan = menerus(param.sigma_max, param.x2, param.phi1, bx, param.d, fc, fy, D, h, Db, param.Kmax);
  }
  // ==== 5. KUAT DUKUNG FONDASI ====
  let kuatDukung;
  if (fondasiMode === "tunggal") {
    if (Lx === Ly) {
      kuatDukung = kuatDukungTunggal( bx, by, fc, fy, D, tulangan.bujur.s, lambda, h, Pu, sbeton);
    } else {
      kuatDukung = kuatDukungTunggal(bx, by, fc, fy, Db, tulangan.persegi.s_pusat, lambda, h, Pu, sbeton);
    }
  } else {
    kuatDukung = kuatDukungMenerus(bx, fc, fy, Db, tulangan.s, lambda, h, Pu, sbeton);
  }
  // ==== RETURN AKHIR ====
  return { paramFondasi: param, dayaDukungTanah: tanah, kontrolGeser: geser, tulangan: tulangan, kuatDukung: kuatDukung};
}
