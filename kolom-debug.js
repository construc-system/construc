// =====================================================
// calc-kolom.js (versi diperluas — multi-mode, kontrol, rekap, optimizer-ready)
// =====================================================

// ===== UTIL =====
function ceil5(x){ return Math.ceil(x/5)*5 }
function floor5(x){ return Math.floor(x/5)*5 }
function toNum(v, def=0){ const n=parseFloat(v); return Number.isFinite(n)?n:def }
function safeDiv(a,b,def=0){ return b===0?def:a/b }
function clamp(v, minV, maxV){ return Math.max(minV, Math.min(maxV, v)); }

// ====== CONSTANTS / DEFAULTS ======
const DEFAULTS = {
  phi1: 0.9,
  phi2: 0.75,
  selimut_default: 40,
  sessionInputKey: 'kolomInput',
  resultKey: 'calculationResultKolom'
};

// ====== PARSER & SESSION HELPERS ======
function readSessionInput(){
  try {
    const s = sessionStorage.getItem(DEFAULTS.sessionInputKey);
    if (!s) return null;
    return JSON.parse(s);
  } catch(e){
    console.warn('Tidak bisa parse session input kolom:', e);
    return null;
  }
}

function parseInput(raw){
  // raw boleh object atau JSON string. TIDAK membaca dari sessionStorage
  let data = raw;
  
  if (!data) {
    data = {};
  } else if (typeof raw === 'string'){
    try { data = JSON.parse(raw) } catch(e){ data = {} }
  }

  const module = data.module || 'kolom';
  const mode = data.mode || 'evaluasi';

  const dimensi = data.dimensi || {};
  const h = toNum(dimensi.h);
  const b = toNum(dimensi.b);
  const sb = toNum(dimensi.sb || dimensi.Sb || DEFAULTS.selimut_default);

  const beban = data.beban || {};
  const Pu = toNum(beban.pu || beban.Pu || beban.PU);
  const Mu = toNum(beban.mu || beban.Mu);
  const Vu = toNum(beban.vu || beban.Vu);

  const material = data.material || {};
  const fc = toNum(material.fc, 20);
  const fy = toNum(material.fy, 300);
  const fyt = toNum(material.fyt, fy);

  const lanjutan = data.lanjutan || {};
  const lambda = toNum(lanjutan.lambda, 1);
  const n_kaki = toNum(lanjutan.n_kaki, 2);

  const tulangan = data.tulangan || {};
  const d_tul = toNum(tulangan.d_tul || tulangan.d || tulangan.D);
  const phi_tul = toNum(tulangan.phi_tul || tulangan.phi);
  const n_tul = toNum(tulangan.n_tul || tulangan.n);
  const s_tul = toNum(tulangan.s_tul || tulangan.s);

  const parsedData = {
    module, mode,
    dimensi:{h,b,sb},
    beban:{Pu,Mu,Vu},
    material:{fc,fy,fyt},
    lanjutan:{lambda,n_kaki},
    tulangan:{d_tul,phi_tul,n_tul,s_tul},
    raw: data
  };

  console.log("=== PARSED INPUT ===");
  console.table(parsedData);
  console.log("====================");

  return parsedData;
}

function validateParsed(parsed){
  const problems = [];
  if (parsed.module !== 'kolom') problems.push('Module bukan kolom');
  if (parsed.dimensi.h <= 0) problems.push('Dimensi h harus > 0');
  if (parsed.dimensi.b <= 0) problems.push('Dimensi b harus > 0');
  if (parsed.material.fc <= 0) problems.push('fc harus > 0');
  if (parsed.material.fy <= 0) problems.push('fy harus > 0');
  
  console.log("=== VALIDATION ===");
  console.log("Problems:", problems);
  console.log("==================");
  
  return problems;
}

// ====== KOLOM: DIMENSI HELPERS ======
function hitungKolomDimensi({b,h,Sb,D,phi,fc}){
  const phi1 = DEFAULTS.phi1;
  const phi2 = DEFAULTS.phi2;
  const Sn = Math.max(40, 1.5 * (D || 0));
  const ds1 = Math.ceil(Sb + (phi || 0) + ((D || 0) / 2));
  const ds2 = Sn + (D || 0);
  const ds = ceil5(ds1 + ds2 / 2);
  const d = ( h - ds);
  const m = Math.floor((b - 2 * ds1) / (D + Sb)+1);
  let beta1;
  if (fc <= 28) beta1 = 0.85;
  else if (fc < 55) beta1 = 0.85 - 0.05 * ((fc - 28) / 7);
  else beta1 = 0.65;

  const dimensiResult = {m,phi1,phi2,Sn,ds1,ds2,ds,d,beta1};
  
  console.log("=== DIMENSI CALCULATION ===");
  console.table(dimensiResult);
  console.log("==========================");
  
  return dimensiResult;
}

// ====== SOLVER CUBIC ======
function solveCubic(R1,R2,R3){
  const a=R1,b=R2,c=R3;
  const p = b - (a*a)/3;
  const q = (2*a*a*a)/27 - (a*b)/3 + c;
  const Delta = (q/2)**2 + (p/3)**3;
  let t;
  if (Delta >= 0) {
    const A = Math.cbrt(-q/2 + Math.sqrt(Delta));
    const B = Math.cbrt(-q/2 - Math.sqrt(Delta));
    t = A + B;
  } else {
    const r = 2 * Math.sqrt(-p/3);
    const theta = Math.acos(clamp((3*q)/(2*p) * Math.sqrt(-3/p), -1, 1))/3;
    t = r * Math.cos(theta);
  }
  const x = t - a/3;
  
  console.log("=== CUBIC SOLVER ===");
  console.log("Input:", {R1, R2, R3});
  console.log("Solution x:", x);
  console.log("====================");
  
  return x;
}

// ====== FUNGSI UNTUK MENGHITUNG SEMUA KONDISI ======
function hitungSemuaKondisi({
  Pu, Mu, b, h, d, ds, fc, fy, beta1, phi1, e, ab, ac, ab1, ab2, at1, at2, faktorPhi
}){
  const semuaKondisi = {};
  
  console.log("=== SEMUA KONDISI INPUT ===");
  console.table({Pu, Mu, b, h, d, ds, fc, fy, beta1, phi1, e, ab, ac, ab1, ab2, at1, at2, faktorPhi});
  
  // Kondisi 1: ac > ab1
  try {
    const A1_k1 = (1.25 * (Pu*1000 / faktorPhi) - 0.85 * fc * b * h) / (2 * (fy - 0.85 * fc) || 1);
    const A2_k1 = A1_k1;
    const As_tu_k1 = A1_k1 + A2_k1;
    semuaKondisi.kondisi1 = {
      nama: 'ac > ab1',
      A1: A1_k1,
      A2: A2_k1,
      As_tu: As_tu_k1,
      persamaan: "A1 = A2 = (1.25 * Pu / phi1 - 0.85 * fc * b * h) / (2 * (fy - 0.85 * fc))",
      aktif: false
  };
  } catch(e) {
    semuaKondisi.kondisi1 = { error: e.message, aktif: false };
  }

  // Kondisi 2: ab1 > ac > ab2
  try {
    const ap1 = (600 - fy) * (d - ds) / (600 + fy);
    const R1 = -(ab + ap1+h);
    const R2 = 2 * ab * d + ac * (ap1 + 2 * e);
    const R3 = -ac * ab * (d - ds + 2 * e);
    const a_cubic_k2 = solveCubic(R1,R2,R3);
    const denom_k2 = ((600 + fy) * a_cubic_k2 - 600 * beta1 * d) || 1;
    const A1_k2 = a_cubic_k2 * (Pu * 1000 / phi1 - 0.85 * fc * a_cubic_k2 * b) / denom_k2;
    const A2_k2 = A1_k2;
    const As_tu_k2 = A1_k2 + A2_k2;
    
    semuaKondisi.kondisi2 = {
      nama: 'ab1 > ac > ab2',
      A1: A1_k2,
      A2: A2_k2,
      As_tu: As_tu_k2,
      ap1, R1, R2, R3, a_cubic: a_cubic_k2,
      persamaan: "A1 = A2 = a * (Pu * 1000 / phi1 - 0.85 * fc * a * b) / ((600 + fy) * a - 600 * beta1 * d)",
      aktif: false
    };
  } catch(e) {
    semuaKondisi.kondisi2 = { error: e.message, aktif: false };
  }

  // Kondisi 3: ab2 > ac > ab
  try {
    const ap2 = (2 * fy * ds + 1200 * d) / (600 + fy);
    const R4 = -(ab + ap2);
    const R5 = 2 * ab * d - ac * (h - ap2 - 2 * e);
    const R6 = -ac * ab * (d - ds + 2 * e);
    const a_cubic_k3 = solveCubic(R4,R5,R6);
    const denom_k3 = ((600 + fy) * a_cubic_k3 - 600 * beta1 * d) || 1;
    const A1_k3 = a_cubic_k3 * (Pu * 1000 / phi1 - 0.85 * fc * b * a_cubic_k3) / denom_k3;
    const A2_k3 = A1_k3;
    const As_tu_k3 = A1_k3 + A2_k3;
    
    semuaKondisi.kondisi3 = {
      nama: 'ab2 > ac > ab',
      A1: A1_k3,
      A2: A2_k3,
      As_tu: As_tu_k3,
      ap2, R4, R5, R6, a_cubic: a_cubic_k3,
      persamaan: "A1 = A2 = a * (Pu * 1000 / phi1 - 0.85 * fc * b * a) / ((600 + fy) * a - 600 * beta1 * d)",
      aktif: false
    };
  } catch(e) {
    semuaKondisi.kondisi3 = { error: e.message, aktif: false };
  }

  // Kondisi 4: ab > ac > at1
  try {
    const A1_k4 = 0.5 * Pu * 1000 * (2 * e - h + ac) / (faktorPhi * (d - ds) * fy || 1);
    const A2_k4 = A1_k4;
    const As_tu_k4 = A1_k4 + A2_k4;
    
    semuaKondisi.kondisi4 = {
      nama: 'ab > ac > at1',
      A1: A1_k4,
      A2: A2_k4,
      As_tu: As_tu_k4,
      persamaan: "A1 = A2 = 0.5 * Pu * 1000 * (2 * e - h + ac) / (faktorPhi * (d - ds) * fy)",
      aktif: false
    };
  } catch(e) {
    semuaKondisi.kondisi4 = { error: e.message, aktif: false };
  }

  // Kondisi 5: at1 > ac > at2
  try {
    const ap3 = (2 * fy * d - 1200 * ds) / (600 - fy);
    const R7 = ap3 - at1;
    const R8 = ac * (2 * e - h - ap3) + 2 * at1 * ds;
    const R9 = ac * at1 * (d - ds - 2 * e);
    const a_cubic_k5 = solveCubic(R7,R8,R9);
    const denom_k5 = ((600 + fy) * a_cubic_k5 - 600 * beta1 * d) || 1;
    const A1_k5 = a_cubic_k5 * (Pu * 1000 / faktorPhi - 0.85 * fc * a_cubic_k5 * b) / denom_k5;
    const A2_k5 = A1_k5;
    const As_tu_k5 = A1_k5 + A2_k5;
    
    semuaKondisi.kondisi5 = {
      nama: 'at1 > ac > at2',
      A1: A1_k5,
      A2: A2_k5,
      As_tu: As_tu_k5,
      ap3, R7, R8, R9, a_cubic: a_cubic_k5,
      persamaan: "A1 = A2 = a * (Pu * 1000 / phi1 - 0.85 * fc * a * b) / ((600 + fy) * a - 600 * beta1 * d)",
      aktif: false
    };
  } catch(e) {
    semuaKondisi.kondisi5 = { error: e.message, aktif: false };
  }

  // Kondisi 6: at2 > ac
  try {
    const K = Mu * 1e6 / (phi1 * b * d * d || 1);
    const Kmaks = 382.5 * beta1 * fc * (600 + fy - 225 * beta1) / Math.pow(600 + fy, 2);
    const K_melebihi_Kmaks = K > Kmaks;
    const a_flexure = (1 - Math.sqrt(Math.max(0,1 - (2 * K) / (0.85 * fc)))) * d;
    const As1 = (0.85 * fc * a_flexure * b) / fy;
    const As2 = 1.4 * b * d / fy;
    const As_tu_k6 = Math.max(As1,As2);
    
    semuaKondisi.kondisi6 = {
      nama: 'at2 > ac',
      A1: 0,
      A2: 0,
      As_tu: As_tu_k6,
      K, Kmaks, K_melebihi_Kmaks, a_flexure, As1, As2,
      persamaan: "As_tu = max((0.85 * fc * a * b) / fy, 1.4 * b * d / fy)",
      aktif: false
    };
  } catch(e) {
    semuaKondisi.kondisi6 = { error: e.message, aktif: false };
  }

  console.log("=== HASIL SEMUA KONDISI ===");
  console.log(semuaKondisi);
  console.log("==========================");
  
  return semuaKondisi;
}

// ====== CORE KOLOM: PERHITUNGAN TULANGAN & BEGEL ======
function hitungTulanganKolomCore({
  mode, n_input, Pu, Mu, b, h, d, ds, fc, fy, beta1, phi, D, m
}){
  const phi1 = DEFAULTS.phi1;
  // Sanitasi
  if (b<=0 || h<=0 || d<=0 || fc<=0 || fy<=0) return { kondisi:'invalid' };

  const ab = (600 * beta1 * d) / (600 + fy);
  const ac = (Pu * 1000) / (0.65 * 0.85 * fc * b);
  const Pu_phi = 0.1 * fc * b * h / 1000;

  let faktorPhi;
  if (ac > ab) faktorPhi = 0.65;
  else if (Pu >= Pu_phi) faktorPhi = 0.65;
  else faktorPhi = 0.9 - 0.25 * (Pu / Pu_phi || 1);

  const ab1 = (600 * beta1 * d) / (600 - fy);
  const ab2 = beta1 * d;
  const at1 = (600 * beta1 * ds) / (600 - fy);
  const at2 = beta1 * ds;
  const e = Pu===0?0:(Mu/Pu)*1000;

  const semuaKondisi = hitungSemuaKondisi({
    Pu, Mu, b, h, d, ds, fc, fy, beta1, phi1, e, ab, ac, ab1, ab2, at1, at2, faktorPhi
  });

  let kondisiAktif = {};
  let As_tu = 0;
  let kondisi = '';

  if (ac > ab1){
    kondisiAktif = semuaKondisi.kondisi1;
    As_tu = kondisiAktif.As_tu;
    kondisi = 'ac > ab1';
    kondisiAktif.aktif = true;
  } else if (ab1 > ac && ac > ab2){
    kondisiAktif = semuaKondisi.kondisi2;
    As_tu = kondisiAktif.As_tu;
    kondisi = 'ab1 > ac > ab2';
    kondisiAktif.aktif = true;
  } else if (ab2 > ac && ac > ab){
    kondisiAktif = semuaKondisi.kondisi3;
    As_tu = kondisiAktif.As_tu;
    kondisi = 'ab2 > ac > ab';
    kondisiAktif.aktif = true;
  } else if (ab > ac && ac > at1){
    kondisiAktif = semuaKondisi.kondisi4;
    As_tu = kondisiAktif.As_tu;
    kondisi = 'ab > ac > at1';
    kondisiAktif.aktif = true;
  } else if (at1 > ac && ac > at2){
    kondisiAktif = semuaKondisi.kondisi5;
    As_tu = kondisiAktif.As_tu;
    kondisi = 'at1 > ac > at2';
    kondisiAktif.aktif = true;
  } else {
    kondisiAktif = semuaKondisi.kondisi6;
    As_tu = kondisiAktif.As_tu;
    kondisi = 'at2 > ac';
    kondisiAktif.aktif = true;
  }

  const Ast_u = As_tu;
  const Ast_satu = 0.25 * Math.PI * (D || 0) * (D || 0);

  let n=0, Ast_i=0, rho=0, rho_dipakai=0, n_terpakai=0;
  let minimum_diterapkan = false;
  let minimum_detail = {};
  
  if (mode === 'evaluasi'){
    n = n_input || 0;
    Ast_i = n * Ast_satu;
    rho = (Ast_i / (b * h)) * 100;
    rho_dipakai = rho;
    n_terpakai = n;
  } else {
    // MODE DESAIN: target Ast_u then round up
    n = Math.ceil(Ast_u / (Ast_satu || 1));
    n = Math.max(2, n);
    
    // MODIFIKASI: Bulatkan n ke atas ke kelipatan 2 khusus untuk mode desain
    if (n % 2 !== 0) n += 1;
    
    // Hitung ρ awal
    Ast_i = n * Ast_satu;
    rho = (Ast_i / (b * h)) * 100;
    
    // ====== PERBAIKAN: APLIKASI MINIMUM REQUIREMENT ======
    const rho_min = 1.0; // 1%
    const n_min = 4; // minimal 4 batang
    
    if (rho < rho_min || n < n_min) {
      minimum_diterapkan = true;
      
      // Kasus 1: ρ < 1% tapi n sudah cukup
      if (rho < rho_min && n >= n_min) {
        minimum_detail.alasan = `ρ = ${rho.toFixed(2)}% < ${rho_min}%`;
        // Hitung ulang berdasarkan ρ_min
        const Ast_i_min = (rho_min / 100) * b * h;
        n = Math.ceil(Ast_i_min / Ast_satu);
        if (n % 2 !== 0) n += 1;
        n = Math.max(n, n_min);
      }
      // Kasus 2: n < 4 batang
      else if (n < n_min) {
        minimum_detail.alasan = `n = ${n} batang < ${n_min} batang`;
        n = n_min; // 4 batang, sudah kelipatan 2
      }
      
      // Hitung ulang Ast_i dan ρ
      Ast_i = n * Ast_satu;
      rho = (Ast_i / (b * h)) * 100;
      minimum_detail.setelah = `n=${n}, ρ=${rho.toFixed(2)}%`;
    }
    
    const n_max = 2 * (m || 1);
    const n_limited = Math.min(n, n_max);
    Ast_i = n_limited * Ast_satu;
    rho = (Ast_i / (b * h)) * 100;
    rho_dipakai = Math.max(rho, rho_min);
    n_terpakai = n_limited;
  }

  const n_max = 2 * (m || 1);
  const status = n <= n_max ? 'AMAN' : 'TIDAK AMAN';

  const hasil = {
    kondisi, faktorPhi: faktorPhi,
    e,
    ab, ac, ab1, ab2, at1, at2,
    A1: kondisiAktif.A1, 
    A2: kondisiAktif.A2, 
    As_tu,
    Ast_u, Ast_satu, Ast_i, n, rho, n_terpakai, n_max, status,
    K: kondisiAktif.K, 
    Kmaks: kondisiAktif.Kmaks, 
    K_melebihi_Kmaks: kondisiAktif.K_melebihi_Kmaks,
    semuaKondisi: semuaKondisi,
    kondisiAktif: kondisiAktif.nama,
    ap1: kondisiAktif.ap1,
    ap2: kondisiAktif.ap2,
    ap3: kondisiAktif.ap3,
    R1: kondisiAktif.R1, R2: kondisiAktif.R2, R3: kondisiAktif.R3,
    R4: kondisiAktif.R4, R5: kondisiAktif.R5, R6: kondisiAktif.R6,
    R7: kondisiAktif.R7, R8: kondisiAktif.R8, R9: kondisiAktif.R9,
    a_cubic: kondisiAktif.a_cubic,
    a_flexure: kondisiAktif.a_flexure,
    As1: kondisiAktif.As1,
    As2: kondisiAktif.As2,
    persamaan: kondisiAktif.persamaan,
    Pu_phi, beta1,
    minimum_diterapkan,
    minimum_detail
  };

  console.log("=== HASIL TULANGAN KOLOM CORE ===");
  console.table(hasil);
  console.log("=================================");
  
  return hasil;
}

function hitungBegelCore({Pu, Vu, b, h, d, fc, fy, fyt, phi, Ag, lambda, phi2, mode, n_val, s_pasang}){
  const Vc_phi = phi2 * 0.17 * (1 + (Pu * 1000) / (14 * Ag || 1)) * lambda * Math.sqrt(fc) * b * d / 1000;
  const Vs = Math.max(0, (Vu - Vc_phi) * phi2);
  const Vs_max = (2/3) * Math.sqrt(fc) * b * d / 1000;
  const warning = Vs > Vs_max ? 'DIMENSI KOLOM PERLU DIPERBESAR' : 'AMAN';
  const Avu1 = 0.062 * Math.sqrt(fc) * b * 1000 / (fyt || 1);
  const Avu2 = 0.35 * b * 1000 / (fyt || 1);
  const Avu3 = (Vs * 1000 * 1000) / ((fyt || 1) * (d || 1));
  const Av_u = ceil5(Math.max(Avu1,Avu2,Avu3));

  const fi_begel = phi;
  const luas_sengkang = 2 * 0.25 * Math.PI * fi_begel * fi_begel;
  const s_1 = (n_val* fi_begel * fi_begel * Math.PI * 0.25) / ((Av_u/1000) || 1);
  const s_2 = (Vs < (Vs_max / 2)) ? d/2 : d/4;
  const s_3 = (Vs < (Vs_max / 2)) ? 600 : 300;
  let s = Math.floor(Math.min(s_1, s_2, s_3) / 10) * 10;
  if (mode === 'desain' && s < 100) s = 100;
  
  if (mode === 'evaluasi' && s_pasang) s = s_pasang;

  const Av_terpakai = (s > 0) ? (luas_sengkang * 1000) / s : 0;

  const hasil = {Vc_phi, Vs, Vs_max, warning, Avu1, Avu2, Avu3, Av_u, s, Av_terpakai};
  
  console.log("=== HASIL BEGEL CORE ===");
  console.table(hasil);
  console.log("========================");
  
  return hasil;
}

// ====== KONTROL SISTEM ======
function kontrolLenturKolom(hasilTulangan){
  if (!hasilTulangan) return {ok:false, detail:'no data'};
  
  // Minimum requirement
  const rho_min = 1.0; // 1%
  const n_min = 4; // minimal 4 batang
  
  const okAst = (hasilTulangan.Ast_i >= hasilTulangan.Ast_u);
  const okRho = (hasilTulangan.rho >= rho_min);
  const okN = (hasilTulangan.n_terpakai >= n_min) && (hasilTulangan.n_terpakai <= hasilTulangan.n_max);
  const okK = !hasilTulangan.K_melebihi_Kmaks;
  
  const kontrol = {
    ok: okAst && okRho && okN && okK,
    Ast_ok: okAst,
    rho_ok: okRho,
    n_ok: okN,
    K_ok: okK,
    detail: {
      Ast_i: hasilTulangan.Ast_i,
      Ast_u: hasilTulangan.Ast_u,
      rho: hasilTulangan.rho,
      rho_min: rho_min,
      n: hasilTulangan.n_terpakai,
      n_min: n_min,
      n_max: hasilTulangan.n_max,
      K: hasilTulangan.K,
      Kmaks: hasilTulangan.Kmaks,
      K_melebihi_Kmaks: hasilTulangan.K_melebihi_Kmaks
    }
  };
  
  console.log("=== KONTROL LENTUR ===");
  console.table(kontrol);
  console.log("======================");
  
  return kontrol;
}

function kontrolGeserKolom(begel){
  if (!begel) return {ok:false, detail:'no data'};
  const Vs_ok = (parseFloat(begel.Vs) <= parseFloat(begel.Vs_max) || begel.Vs <= begel.Vs_max);
  const Av_ok = parseFloat(begel.Av_terpakai) >= parseFloat(begel.Av_u);
  const kontrol = {
    ok: Vs_ok && Av_ok,
    Vs_ok: Vs_ok,
    Av_ok: Av_ok,
    detail: {
      Vs: begel.Vs,
      Vs_max: begel.Vs_max,
      Av_terpakai: begel.Av_terpakai,
      Av_u: begel.Av_u
    }
  };
  
  console.log("=== KONTROL GESER ===");
  console.table(kontrol);
  console.log("=====================");
  
  return kontrol;
}

function isKontrolAmanKolom(kontrol){
  if (!kontrol) return false;
  const lentur = kontrol.lentur;
  const geser = kontrol.geser;
  if (!lentur || !geser) return false;
  if (!lentur.Ast_ok || !lentur.rho_ok || !lentur.n_ok || !lentur.K_ok) return false;
  if (!geser.Vs_ok || !geser.Av_ok) return false;
  
  const aman = true;
  console.log("=== KONTROL AMAN ===");
  console.log("Status:", aman);
  console.log("Lentur OK:", lentur.ok);
  console.log("Geser OK:", geser.ok);
  console.log("====================");
  
  return aman;
}

// ====== REKAP SEMUA HASIL ======
function rekapKolomAll(parsed, Dimensi, hasilTulangan, begel, kontrol){
  const D = parsed.tulangan.d_tul || 29;
  const phi = parsed.tulangan.phi_tul || 10;

  const formatBar = (n, D) => (n && n>0) ? `${n}D${D}` : '-';
  const formatBegel = (phi, s) => (s && s>0) ? `Φ${phi}-${s}` : '-';

  const rekap = {
    input: parsed.raw,
    Dimensi,
    tulangan:{
      D, phi,
      Ast_satu: hasilTulangan.Ast_satu,
      Ast_i: hasilTulangan.Ast_i,
      Ast_u: hasilTulangan.Ast_u,
      n_calculated: hasilTulangan.n,
      n_terpakai: hasilTulangan.n_terpakai,
      rho: hasilTulangan.rho,
      status_n: hasilTulangan.status,
      e: hasilTulangan.e,
      
      Pu: parsed.beban.Pu,
      Mu: parsed.beban.Mu,
      Pu_phi: hasilTulangan.Pu_phi,
      
      K: hasilTulangan.K,
      Kmaks: hasilTulangan.Kmaks,
      K_ok: !hasilTulangan.K_melebihi_Kmaks,
      semuaKondisi: hasilTulangan.semuaKondisi,
      kondisiAktif: hasilTulangan.kondisiAktif,
      kondisi: hasilTulangan.kondisi,
      ab: hasilTulangan.ab,
      ac: hasilTulangan.ac,
      ab1: hasilTulangan.ab1,
      ab2: hasilTulangan.ab2,
      at1: hasilTulangan.at1,
      at2: hasilTulangan.at2,
      A1: hasilTulangan.A1,
      A2: hasilTulangan.A2,
      As_tu: hasilTulangan.As_tu,
      ap1: hasilTulangan.ap1,
      ap2: hasilTulangan.ap2,
      ap3: hasilTulangan.ap3,
      R1: hasilTulangan.R1,
      R2: hasilTulangan.R2,
      R3: hasilTulangan.R3,
      R4: hasilTulangan.R4,
      R5: hasilTulangan.R5,
      R6: hasilTulangan.R6,
      R7: hasilTulangan.R7,
      R8: hasilTulangan.R8,
      R9: hasilTulangan.R9,
      a_cubic: hasilTulangan.a_cubic,
      a_flexure: hasilTulangan.a_flexure,
      As1: hasilTulangan.As1,
      As2: hasilTulangan.As2,
      persamaan: hasilTulangan.persamaan,
      beta1: hasilTulangan.beta1,
      faktorPhi: hasilTulangan.faktorPhi,
      minimum_diterapkan: hasilTulangan.minimum_diterapkan,
      minimum_detail: hasilTulangan.minimum_detail
    },
    begel: {
      s: begel.s,
      Av_u: begel.Av_u,
      Av_terpakai: begel.Av_terpakai,
      Vs: begel.Vs,
      Vs_max: begel.Vs_max,
      warning: begel.warning
    },
    kontrol,
    formatted: {
      tulangan_utama: formatBar(hasilTulangan.n_terpakai, D),
      begel: formatBegel(phi, begel.s),
      e: `${hasilTulangan.e?.toFixed(2) || '0'} mm`,
      Pu_vs_Pu_phi: `P<sub>u</sub> = ${parsed.beban.Pu?.toFixed(2) || '0'} kN vs P<sub>u</sub>∅ = ${hasilTulangan.Pu_phi?.toFixed(2) || '0'} kN`,
      K: `K = ${hasilTulangan.K?.toFixed(4) || '0'} ≤ Kmaks = ${hasilTulangan.Kmaks?.toFixed(4) || '0'}`,
      minimum_info: hasilTulangan.minimum_diterapkan ? 
        `Minimum diterapkan: ${hasilTulangan.minimum_detail?.alasan || ''} → ${hasilTulangan.minimum_detail?.setelah || ''}` : 
        'Tidak ada minimum yang diterapkan'
    }
  };

  console.log("=== REKAP LENGKAP ===");
  console.log(rekap);
  console.log("====================");
  
  return rekap;
}

// Fungsi untuk menyimpan warna ke sessionStorage
function saveColorSettings() {
    const colorSettings = {
        bgBody: ({getPropertyValue:()=>""}).getPropertyValue('--bg-body').trim(),
        colorButtons: ({getPropertyValue:()=>""}).getPropertyValue('--color-buttons').trim(),
        colorBorders: ({getPropertyValue:()=>""}).getPropertyValue('--color-borders').trim(),
        colorLabels: ({getPropertyValue:()=>""}).getPropertyValue('--color-labels').trim(),
        buttonTextColor: ({getPropertyValue:()=>""}).getPropertyValue('--button-text-color').trim(),
        toggleTextColor: ({getPropertyValue:()=>""}).getPropertyValue('--toggle-text-color').trim(),
        toggleActiveTextColor: ({getPropertyValue:()=>""}).getPropertyValue('--toggle-active-text-color').trim()
    };
    
    sessionStorage.setItem('colorSettings', JSON.stringify(colorSettings));
    console.log("✅ Warna kolom disimpan ke sessionStorage");
}

// ====== FUNGSI SIMPAN DETAIL OPTIMIZER ======
function saveOptimizerDetailToStorage(kombinasi, inputData, perhitungan) {
  try {
    const optimizerDetail = {
      timestamp: new Date().toISOString(),
      kombinasi: {
        D: kombinasi.D,
        phi: kombinasi.phi,
        n: perhitungan?.n_terpakai || 0,
        s: perhitungan?.begel?.s || 0
      },
      input_data: inputData,
      perhitungan: perhitungan,
      dimensi: perhitungan?.Dimensi || {},
      kontrol: perhitungan?.kontrol || {},
      minimum_diterapkan: perhitungan?.hasilTulangan?.minimum_diterapkan || false,
      minimum_detail: perhitungan?.hasilTulangan?.minimum_detail || {}
    };
    
    sessionStorage.setItem('optimizer_kolom_detail', JSON.stringify(optimizerDetail));
    console.log("💾 Detail optimizer disimpan ke sessionStorage");
  } catch (e) {
    console.warn("⚠️ Tidak bisa menyimpan detail optimizer:", e);
  }
}

function saveResultAndRedirectKolom(result, inputData){
  try{
    // Simpan hasil utama
    sessionStorage.setItem(DEFAULTS.resultKey, JSON.stringify({
      module: inputData.module || 'kolom',
      mode: inputData.mode || 'evaluasi',
      data: result.data,
      kontrol: result.kontrol,
      rekap: result.rekap,
      timestamp: new Date().toISOString(),
      inputData: inputData
    }));
    
    // Simpan detail untuk laporan
    saveColorSettings();
    
    // Simpan juga detail perhitungan jika ada optimizer
    if (result.data && result.data.D && result.data.phi) {
      const kombinasi = {
        D: result.data.D,
        phi: result.data.phi
      };
      saveOptimizerDetailToStorage(kombinasi, inputData, result.data);
    }
    
    // window check removed} catch(e){
    console.warn('Gagal simpan result kolom:', e);
  }
}

// ====== HIGH-LEVEL CALCULATOR ======
async function calculateKolom(rawInput, options = {}){
  // Parse & validate - TANPA membaca sessionStorage
  const parsed = parseInput(rawInput);
  console.log("MODE DARI INPUT:", parsed.mode);
  
  const problems = validateParsed(parsed);
  if (problems.length) return { status:'error', problems, parsed };

  // Determine D & phi dari input saja - TIDAK PAKAI DEFAULT
  let D = parsed.tulangan.d_tul;  // Bisa undefined
  let phi = parsed.tulangan.phi_tul; // Bisa undefined
  const mode = parsed.mode;

  // PERBAIKAN: Logika optimizer yang benar
  if (mode === 'desain' && !options.skipOptimizer){
    if (typeof window !== 'undefined' && typeof window.optimizeKolom === 'function'){
      try {
        const optInput = { parsed, options };
        console.log("🚀 Memanggil optimizer...");
        const optRes = await Promise.resolve(window.optimizeKolom(optInput));
        
        // Penanganan khusus untuk NO_VALID_COMBINATION
        if (optRes && optRes.status === "error" && optRes.code === "NO_VALID_COMBINATION") {
          console.warn("❌ Tidak ada kombinasi valid dari optimizer");
          
          // Tampilkan alert jika di browser
          if (typeof window !== 'undefined' && typeof alert === 'function') {
            alert(`Tidak ada kombinasi tulangan yang memenuhi semua kontrol untuk kolom ini.\n\nRekomendasi:\n1. Perbesar dimensi kolom\n2. Tingkatkan mutu beton (fc')\n3. Tingkatkan mutu baja (fy)`);
          }
          
          return {
            status: "peringatan",
            message: optRes.message || "Tidak ditemukan kombinasi tulangan kolom yang memenuhi seluruh kontrol.",
            detail: optRes.summary || { total_kombinasi: 0, kombinasi_valid: 0 }
          };
        }
        
        // ✅ PERBAIKAN KRITIS: Ambil nilai D dan phi dari struktur yang benar
        if (optRes && optRes.status === "sukses") {
          console.log("✅ Optimizer berhasil:", optRes);
          
          // CARA 1: Dari optimasi.kombinasi_terbaik
          if (optRes.optimasi && optRes.optimasi.kombinasi_terbaik) {
            D = optRes.optimasi.kombinasi_terbaik.D;
            phi = optRes.optimasi.kombinasi_terbaik.phi;
            console.log(`📊 Dari kombinasi_terbaik: D=${D}, phi=${phi}`);
          }
          // CARA 2: Dari data langsung
          else if (optRes.data && optRes.data.D && optRes.data.phi) {
            D = optRes.data.D;
            phi = optRes.data.phi;
            console.log(`📊 Dari data langsung: D=${D}, phi=${phi}`);
          }
          // CARA 3: Legacy (untuk kompatibilitas)
          else if (optRes.D_opt || optRes.d_tul) {
            D = optRes.D_opt || optRes.d_tul;
            phi = optRes.phi_opt || optRes.phi_tul;
            console.log(`📊 Dari properti legacy: D=${D}, phi=${phi}`);
          }
          
          // Simpan juga ke options untuk begel
          if (optRes.data && optRes.data.begel) {
            options.s = optRes.data.begel.s;
          }
        } else {
          console.warn("⚠️ Optimizer tidak mengembalikan status sukses:", optRes?.status);
          // Jika optimizer gagal, tetap lanjut dengan nilai dari input
        }
      } catch(e){
        console.error("💥 Optimizer error:", e);
        return { 
          status:'error', 
          message: 'Optimizer gagal dijalankan', 
          error: String(e) 
        };
      }
    } else {
      return { 
        status:'error', 
        message: 'Mode desain membutuhkan optimizer.js — window.optimizeKolom tidak ditemukan' 
      };
    }
  } else {
    // Mode evaluasi: ambil dari input saja
    D = parsed.tulangan.d_tul;
    phi = parsed.tulangan.phi_tul;
  }

  // 🚨 PERIKSA: Jika D masih undefined, beri alert dan hentikan
  if (!D || !phi) {
    const message = mode === 'desain' 
      ? "Optimizer tidak menemukan kombinasi tulangan yang memenuhi semua kriteria. Perbesar dimensi kolom atau tingkatkan mutu beton."
      : "Diameter tulangan utama (D) atau sengkang (φ) belum ditentukan.";
    
    console.error("❌ D atau phi undefined:", { D, phi, mode });
    
    // Tampilkan alert jika di browser
    if (typeof window !== 'undefined' && typeof alert === 'function') {
      alert(message);
    }
    
    return {
      status: "error",
      message: message,
      mode: mode
    };
  }

  // Recompute Dimensi karena D/phi mungkin berubah
  console.log(`🔧 Perhitungan dengan D=${D}, phi=${phi}`);
  const DimensiFinal = hitungKolomDimensi({
    b: parsed.dimensi.b, 
    h: parsed.dimensi.h, 
    Sb: parsed.dimensi.sb, 
    D, 
    phi, 
    fc: parsed.material.fc
  });
  const d = DimensiFinal.d;
  const ds = DimensiFinal.ds;
  const m = Math.max(1, Math.floor(DimensiFinal.m) || 1);

  // Siapkan argumen untuk tulangan core
  const tulMode = mode;
  const n_input = (tulMode === 'evaluasi') ? (parsed.tulangan.n_tul || 0) : 0;
  const hasilTul = hitungTulanganKolomCore({
    mode: tulMode,
    n_input,
    Pu: parsed.beban.Pu,
    Mu: parsed.beban.Mu,
    b: parsed.dimensi.b,
    h: parsed.dimensi.h,
    d: d,
    ds: ds,
    fc: parsed.material.fc,
    fy: parsed.material.fy,
    beta1: DimensiFinal.beta1,
    phi: phi,
    D: D,
    m: m
  });

  // Perhitungan begel - s_pasang hanya dari input atau options
  const s_pasang = (tulMode === 'evaluasi') 
    ? (parsed.tulangan.s_tul || undefined)
    : (options.s || undefined);
    
  const begel = hitungBegelCore({
    Pu: parsed.beban.Pu,
    Vu: parsed.beban.Vu,
    b: parsed.dimensi.b,
    h: parsed.dimensi.h,
    d: d,
    dd: 0,
    fc: parsed.material.fc,
    fy: parsed.material.fy,
    fyt: parsed.material.fyt || parsed.material.fy,
    phi: phi,
    Ag: parsed.dimensi.b * parsed.dimensi.h,
    lambda: parsed.lanjutan.lambda,
    phi2: DEFAULTS.phi2,
    mode: tulMode,
    n_val: parsed.lanjutan.n_kaki || 2,
    s_pasang: s_pasang
  });

  // Jika desain dan s < 100, pastikan s>=100
  if (tulMode === 'desain' && begel.s < 100){
    begel.s = 100;
    const luas_sengkang = 2 * 0.25 * Math.PI * phi * phi;
    begel.Av_terpakai = (begel.s > 0) ? (luas_sengkang * 1000) / begel.s : 0;
  }

  // Kontrol
  const kontrol_lentur = kontrolLenturKolom(hasilTul);
  const kontrol_geser = kontrolGeserKolom(begel);
  const kontrol = { lentur: kontrol_lentur, geser: kontrol_geser };
  const aman = isKontrolAmanKolom(kontrol);

  // Rekap lengkap
  const rekap = rekapKolomAll(parsed, DimensiFinal, hasilTul, begel, kontrol);

  // Build final result object
  const result = {
    status: aman ? 'sukses' : 'cek',
    mode: mode,
    data: {
      parsedInput: parsed.raw,
      Dimensi: DimensiFinal,
      D, phi, d, ds, m,
      hasilTulangan: hasilTul,
      begel: begel,
      kontrol: kontrol,
      aman: aman
    },
    kontrol: kontrol,
    rekap: rekap
  };

  console.log("=== FINAL RESULT ===");
  console.log(result);
  console.log("====================");

  // Jika options.autoSave true, simpan ke sessionStorage
  if (options.autoSave){
    try { saveResultAndRedirectKolom(result, parsed.raw); } catch(e){ /* ignore */ }
  }

  return result;
}

// Wrapper dengan redirect
async function calculateKolomWithRedirect(data){
  try {
    const result = await calculateKolom(data, { autoSave: true });
    if (result && (result.status === 'sukses' || result.status === 'cek' || result.status === 'peringatan')) {
      return result;
    } else {
      if (typeof showAlert === 'function'){
        showAlert(`Perhitungan kolom gagal: ${result.message || (result.problems && result.problems.join('; ')) || 'Terjadi kesalahan'}`);
      } else {
        console.warn('Perhitungan kolom gagal:', result);
      }
      return result;
    }
  } catch (err){
    console.error('Error dalam calculateKolomWithRedirect:', err);
    throw err;
  }
}

// ====== FUNGSI UNTUK PARSING DATA BARU DARI SESSION STORAGE ======
function parseNewSessionData() {
    console.log("🔧 Parsing data baru dari session storage...");
    
    const hasil = {
        top10: null,
        allCombinations: null,
        optimizerDetail: null,
        calculationResult: null,
        inputData: null
    };
    
    try {
        // 1. Data Top 10
        const top10Data = sessionStorage.getItem('kolom_optimizer_top10');
        if (top10Data) {
            hasil.top10 = JSON.parse(top10Data);
            console.log("✅ Data top 10 ditemukan");
        }
        
        // 2. Data Semua Kombinasi
        const allCombinationsData = sessionStorage.getItem('kolom_optimizer_all_combinations');
        if (allCombinationsData) {
            hasil.allCombinations = JSON.parse(allCombinationsData);
            console.log("✅ Data semua kombinasi ditemukan");
        }
        
        // 3. Data Optimizer Detail (yang lama)
        const optimizerDetailData = sessionStorage.getItem('optimizer_kolom_detail');
        if (optimizerDetailData) {
            hasil.optimizerDetail = JSON.parse(optimizerDetailData);
            console.log("✅ Data optimizer detail ditemukan");
        }
        
        // 4. Data Hasil Perhitungan
        const resultData = sessionStorage.getItem(DEFAULTS.resultKey);
        if (resultData) {
            hasil.calculationResult = JSON.parse(resultData);
            console.log("✅ Data hasil perhitungan ditemukan");
        }
        
        // 5. Data Input
        const inputData = sessionStorage.getItem(DEFAULTS.sessionInputKey);
        if (inputData) {
            hasil.inputData = JSON.parse(inputData);
            console.log("✅ Data input ditemukan");
        }
        
        return hasil;
        
    } catch (error) {
        console.error("💥 Error parsing session data:", error);
        return hasil;
    }
}

// ====== FUNGSI UNTUK MENAMPILKAN RINGKASAN DI CONSOLE ======
function displaySessionSummary() {
    console.log("\n" + "=".repeat(80));
    console.log("📊 RINGKASAN DATA SESSION STORAGE");
    console.log("=".repeat(80));
    
    const data = parseNewSessionData();
    
    if (!data.top10 && !data.allCombinations) {
        console.log("ℹ️  Tidak ada data optimizer yang tersimpan di session storage");
        console.log("   Mungkin perhitungan dilakukan tanpa optimizer atau mode evaluasi");
    }
    
    if (data.top10) {
        console.log(`\n📈 DATA TOP 10:`);
        console.log(`   Timestamp: ${data.top10.timestamp || 'N/A'}`);
        console.log(`   Total kombinasi: ${data.top10.total_kombinasi || 0}`);
        console.log(`   Kombinasi valid: ${data.top10.kombinasi_valid || 0}`);
        console.log(`   Top 10 tersedia: ${data.top10.top10?.length || 0} kombinasi`);
        
        // Tampilkan 3 teratas
        if (data.top10.top10 && data.top10.top10.length > 0) {
            console.log("\n   🏆 3 TERATAS:");
            data.top10.top10.slice(0, 3).forEach((item, index) => {
                console.log(`   ${index + 1}. D${item.D} φ${item.phi} | n=${item.n} | s=${item.s}mm | Skor: ${item.skor?.toFixed(2) || 'N/A'}`);
            });
        }
    }
    
    if (data.allCombinations) {
        console.log(`\n📊 DATA SEMUA KOMBINASI:`);
        console.log(`   Total: ${data.allCombinations.kombinasi_total || 0} kombinasi`);
        
        if (data.allCombinations.kombinasi_by_status) {
            console.log("   Distribusi status:");
            Object.entries(data.allCombinations.kombinasi_by_status).forEach(([status, count]) => {
                const persen = ((count / data.allCombinations.kombinasi_total) * 100).toFixed(1);
                console.log(`     ${status}: ${count} (${persen}%)`);
            });
        }
    }
    
    if (data.calculationResult) {
        console.log(`\n📝 HASIL PERHITUNGAN AKHIR:`);
        console.log(`   Status: ${data.calculationResult.status || 'N/A'}`);
        console.log(`   Mode: ${data.calculationResult.mode || 'N/A'}`);
        
        if (data.calculationResult.data) {
            console.log(`   D terpilih: ${data.calculationResult.data.D || 'N/A'}`);
            console.log(`   φ terpilih: ${data.calculationResult.data.phi || 'N/A'}`);
            console.log(`   n terpilih: ${data.calculationResult.data.hasilTulangan?.n_terpakai || 'N/A'}`);
            console.log(`   s terpilih: ${data.calculationResult.data.begel?.s || 'N/A'} mm`);
        }
    }
    
    console.log("=".repeat(80));
}

// ====== FUNGSI UNTUK MENDAPATKAN DATA UNTUK LAPORAN ======
function getReportDataEnhanced() {
    const data = parseNewSessionData();
    
    // Gabungkan semua data untuk laporan
    const reportData = {
        timestamp: new Date().toISOString(),
        source: 'calc-kolom.js enhanced',
        
        // Data baru
        top10: data.top10,
        allCombinations: data.allCombinations,
        
        // Data lama (untuk kompatibilitas)
        optimizerDetail: data.optimizerDetail,
        calculationResult: data.calculationResult,
        inputData: data.inputData,
        
        // Ringkasan cepat
        summary: {
            totalKombinasi: data.top10?.total_kombinasi || data.allCombinations?.kombinasi_total || 0,
            kombinasiValid: data.top10?.kombinasi_valid || 
                           (data.allCombinations?.kombinasi_by_status?.aman || 0),
            kombinasiTerpilih: {
                D: data.calculationResult?.data?.D,
                phi: data.calculationResult?.data?.phi,
                n: data.calculationResult?.data?.hasilTulangan?.n_terpakai,
                s: data.calculationResult?.data?.begel?.s,
                rho: data.calculationResult?.data?.hasilTulangan?.rho,
                kondisi: data.calculationResult?.data?.hasilTulangan?.kondisi
            }
        }
    };
    
    return reportData;
}

// ====== AUTO-RUN DI HALAMAN REPORT.HTML ======
// window check removedφ${item.phi}${minInfo} | n=${item.n} | s=${item.s}mm | ρ=${item.rho?.toFixed(2) || '?'}% | Skor: ${item.skor?.toFixed(2)}`);
                    });
                }
                
                // Cek apakah D=29 φ=10 selalu ada di top
                if (data.top10 && data.top10.top10) {
                    const d29phi10Count = data.top10.top10.filter(item => item.D === 29 && item.phi === 10).length;
                    if (d29phi10Count > 0) {
                        console.log(`\n⚠️  CATATAN: D29 φ10 muncul ${d29phi10Count} kali di top 10`);
                    }
                }
                
            }, 1500);
        }
    });
}

// ====== EKSPOR FUNGSI KE WINDOW ======
// window check removed// Convenience: quick synchronous wrapper
function calculateKolomSync(rawInput, options={}){
  return (async () => await calculateKolom(rawInput, options))();
}

// ====== Logging / Ready ======
console.log('✅ calc-kolom.js (extended) loaded — modes: desain|evaluasi, kontrol, rekap, optimizer-ready, semua-kondisi, minimum-requirement');