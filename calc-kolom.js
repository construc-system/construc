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
  sessionInputKey: 'kolomInput', // key to check sessionStorage for evaluasi input (user-provided)
  resultKey: 'calculationResultKolom' // PERBAIKAN: Key khusus untuk kolom
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
  // raw boleh object atau JSON string. Jika null/undefined, coba ambil dari sessionStorage.
  let data = raw;
  if (!data) {
    data = readSessionInput() || {};
  } else if (typeof raw === 'string'){
    try { data = JSON.parse(raw) } catch(e){ data = {} }
  }

  const module = data.module || 'kolom';
  const mode = data.mode || 'evaluasi'; // default evaluasi per permintaan

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

  // Tulangan bisa berasal dari input (evaluasi) atau dari optimizer (desain)
  const tulangan = data.tulangan || {};
  const d_tul = toNum(tulangan.d_tul || tulangan.d || tulangan.D);
  const phi_tul = toNum(tulangan.phi_tul || tulangan.phi);
  const n_tul = toNum(tulangan.n_tul || tulangan.n);
  const s_tul = toNum(tulangan.s_tul || tulangan.s);

  return {
    module, mode,
    dimensi:{h,b,sb},
    beban:{Pu,Mu,Vu},
    material:{fc,fy,fyt},
    lanjutan:{lambda,n_kaki},
    tulangan:{d_tul,phi_tul,n_tul,s_tul},
    raw: data
  }
}

function validateParsed(parsed){
  const problems = [];
  if (parsed.module !== 'kolom') problems.push('Module bukan kolom');
  if (parsed.dimensi.h <= 0) problems.push('Dimensi h harus > 0');
  if (parsed.dimensi.b <= 0) problems.push('Dimensi b harus > 0');
  if (parsed.material.fc <= 0) problems.push('fc harus > 0');
  if (parsed.material.fy <= 0) problems.push('fy harus > 0');
  return problems;
}

// ====== KOLOM: DIMENSI HELPERS (reused/adapted) ======
function hitungKolomDimensi({b,h,Sb,D,phi,fc}){
  // Return set of geometric helper values similar to versi lama, tapi stabil
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

  return {m,phi1,phi2,Sn,ds1,ds2,ds,d,beta1};
}

// ====== SOLVER CUBIC (diperlukan oleh hitungTulanganKolomCore) ======
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
  return x;
}

// ====== FUNGSI UNTUK MENGHITUNG SEMUA KONDISI ======
function hitungSemuaKondisi({
  Pu, Mu, b, h, d, ds, fc, fy, beta1, phi1, e, ab, ac, ab1, ab2, at1, at2, faktorPhi
}){
  const semuaKondisi = {};
  
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
    const ap3 = (2 * fy * ds - 1200 * d) / (600 - fy);
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

  return semuaKondisi;
}

// ====== CORE KOLOM: PERHITUNGAN TULANGAN & BEGEL (adapted + made consistent) ======
function hitungTulanganKolomCore({
  mode, n_input, Pu, Mu, b, h, d, ds, fc, fy, beta1, phi, D, m
}){
  console.log("=== DEBUG hitungTulanganKolomCore ===");
  console.log("Mode:", mode, "n_input:", n_input, "D:", D, "phi:", phi);
  
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
  const e = Pu===0?0:(Mu/Pu)*1000; // Eksentrisitas dalam mm

  console.log("Parameter penting:");
  console.table({ab, ac, ab1, ab2, at1, at2, e, faktorPhi});

  // Hitung semua kondisi
  const semuaKondisi = hitungSemuaKondisi({
    Pu, Mu, b, h, d, ds, fc, fy, beta1, phi1, e, ab, ac, ab1, ab2, at1, at2, faktorPhi
  });

  // Tentukan kondisi yang aktif dan gunakan hasilnya
  let kondisiAktif = {};
  let As_tu = 0;
  let kondisi = '';

  console.log("Penentuan kondisi aktif:");
  console.log("ac:", ac, "ab1:", ab1, "ab2:", ab2, "ab:", ab, "at1:", at1, "at2:", at2);

  if (ac > ab1){
    kondisiAktif = semuaKondisi.kondisi1;
    As_tu = kondisiAktif.As_tu || 0;
    kondisi = 'ac > ab1';
    kondisiAktif.aktif = true;
    console.log("Kondisi 1 aktif");
  } else if (ab1 > ac && ac > ab2){
    kondisiAktif = semuaKondisi.kondisi2;
    As_tu = kondisiAktif.As_tu || 0;
    kondisi = 'ab1 > ac > ab2';
    kondisiAktif.aktif = true;
    console.log("Kondisi 2 aktif");
  } else if (ab2 > ac && ac > ab){
    kondisiAktif = semuaKondisi.kondisi3;
    As_tu = kondisiAktif.As_tu || 0;
    kondisi = 'ab2 > ac > ab';
    kondisiAktif.aktif = true;
    console.log("Kondisi 3 aktif");
  } else if (ab > ac && ac > at1){
    kondisiAktif = semuaKondisi.kondisi4;
    As_tu = kondisiAktif.As_tu || 0;
    kondisi = 'ab > ac > at1';
    kondisiAktif.aktif = true;
    console.log("Kondisi 4 aktif");
  } else if (at1 > ac && ac > at2){
    kondisiAktif = semuaKondisi.kondisi5;
    As_tu = kondisiAktif.As_tu || 0;
    kondisi = 'at1 > ac > at2';
    kondisiAktif.aktif = true;
    console.log("Kondisi 5 aktif");
  } else {
    kondisiAktif = semuaKondisi.kondisi6;
    As_tu = kondisiAktif.As_tu || 0;
    kondisi = 'at2 > ac';
    kondisiAktif.aktif = true;
    console.log("Kondisi 6 aktif");
  }

  console.log("Kondisi aktif:", kondisi, "As_tu:", As_tu);

  const Ast_u = As_tu;
  const Ast_satu = 0.25 * Math.PI * (D || 0) * (D || 0);

  console.log("Ast_u:", Ast_u, "Ast_satu:", Ast_satu, "D:", D);

  // PERBAIKAN UTAMA: Logika perhitungan n berdasarkan mode
  let n=0, Ast_i=0, rho=0, rho_dipakai=0, n_terpakai=0;
  
  if (mode === 'evaluasi'){
    console.log("Mode evaluasi - n_input:", n_input);
    
    // PERBAIKAN: Jika n_input tidak ada atau 0, hitung kebutuhan n seperti desain
    if (!n_input || n_input <= 0) {
      console.warn("⚠️ Mode evaluasi tetapi n_input tidak valid, menghitung kebutuhan n...");
      
      // Hitung kebutuhan n seperti mode desain
      n = Math.ceil(Ast_u / (Ast_satu || 1));
      n = Math.max(2, n);
      
      // Bulatkan ke kelipatan 2
      if (n % 2 !== 0) n += 1;
      
      const n_max_temp = 2 * (m || 1);
      const n_limited = Math.min(n, n_max_temp);
      Ast_i = n_limited * Ast_satu;
      rho = (Ast_i / (b * h)) * 100;
      rho_dipakai = rho;
      n_terpakai = n_limited;
      
      console.log("n dihitung dari kebutuhan:", n, "n_terpakai:", n_terpakai, "Ast_i:", Ast_i);
    } else {
      // Gunakan n_input yang diberikan
      n = n_input || 0;
      Ast_i = n * Ast_satu;
      rho = (Ast_i / (b * h)) * 100;
      rho_dipakai = rho;
      n_terpakai = n;
      console.log("n dari input:", n, "Ast_i:", Ast_i);
    }
  } else {
    // mode desain: target Ast_u then round up
    console.log("Mode desain - menghitung n dari Ast_u");
    n = Math.ceil(Ast_u / (Ast_satu || 1));
    n = Math.max(2, n);
    
    // MODIFIKASI: Bulatkan n ke atas ke kelipatan 2 khusus untuk mode desain
    if (n % 2 !== 0) n += 1;
    
    const n_max_temp = 2 * (m || 1);
    const n_limited = Math.min(n, n_max_temp);
    Ast_i = n_limited * Ast_satu;
    rho = (Ast_i / (b * h)) * 100;
    rho_dipakai = Math.max(rho, 0.01);
    n_terpakai = n_limited;
    
    console.log("n hasil desain:", n, "n_limited:", n_limited, "Ast_i:", Ast_i);
  }

  const n_max = 2 * (m || 1);
  const status = n <= n_max ? 'AMAN' : 'TIDAK AMAN';

  console.log("Hasil akhir:");
  console.table({
    mode, n_input, n, n_terpakai, n_max, status,
    Ast_i, Ast_u, rho,
    D, Ast_satu
  });

  return {
    kondisi, faktorPhi: faktorPhi,
    e, // nilai eksentrisitas
    ab, ac, ab1, ab2, at1, at2,
    A1: kondisiAktif.A1 || 0, 
    A2: kondisiAktif.A2 || 0, 
    As_tu,
    Ast_u, Ast_satu, Ast_i, n, rho, n_terpakai, n_max, status,
    // TAMBAHAN: Kembalikan nilai K, Kmaks, dan status K_melebihi_Kmaks
    K: kondisiAktif.K || 0, 
    Kmaks: kondisiAktif.Kmaks || 0, 
    K_melebihi_Kmaks: kondisiAktif.K_melebihi_Kmaks || false,
    // TAMBAHAN: Semua kondisi dan kondisi aktif
    semuaKondisi: semuaKondisi,
    kondisiAktif: kondisiAktif.nama || 'tidak diketahui',
    // Variabel tambahan untuk kondisi tertentu
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
    Pu_phi, beta1
  }
}

function hitungBegelCore({Pu, Vu, b, h, d, fc, fy, fyt, phi, Ag, lambda, phi2, mode, n_val, s_pasang}){
  // adopt logic from original; ensure we return Av_u and Av_terpakai for controls
  const Vc_phi = phi2 * 0.17 * (1 + (Pu * 1000) / (14 * Ag || 1)) * lambda * Math.sqrt(fc) * b * d / 1000;
  const Vs = Math.max(0, (Vu - Vc_phi) * phi2);
  const Vs_max = (2/3) * Math.sqrt(fc) * b * d / 1000;
  const warning = Vs > Vs_max ? 'DIMENSI KOLOM PERLU DIPERBESAR' : 'AMAN';
  const Avu1 = 0.062 * Math.sqrt(fc) * b * 1000 / (fyt || 1);
  const Avu2 = 0.35 * b * 1000 / (fyt || 1);
  const Avu3 = (Vs * 1000 * 1000) / ((fyt || 1) * (d || 1));
  const Av_u = ceil5(Math.max(Avu1,Avu2,Avu3));

  const fi_begel = phi;
  // luas sengkang per satu sisi (2 sisi total untuk kolom bundar/persegi) - but keep consistent with calc-balok pattern
  const luas_sengkang = 2 * 0.25 * Math.PI * fi_begel * fi_begel; // mm2 per stirrup pair (approx)
  // compute s candidates
  const s_1 = (n_val* fi_begel * fi_begel * Math.PI * 0.25) / ((Av_u/1000) || 1);
  const s_2 = (Vs < (Vs_max / 2)) ? d/2 : d/4;
  const s_3 = (Vs < (Vs_max / 2)) ? 600 : 300;
  let s = Math.floor(Math.min(s_1, s_2, s_3) / 10) * 10;
  if (mode === 'desain' && s < 100) s = 100; // enforce desain rule
  // For evaluasi, if s_pasang provided, use that as s
  if (mode === 'evaluasi' && s_pasang) s = s_pasang;

  // Av_terpakai: luasSengkang * 1000 / s (mirip per meter)
  const Av_terpakai = (s > 0) ? (luas_sengkang * 1000) / s : 0;

  return {Vc_phi, Vs, Vs_max, warning, Avu1, Avu2, Avu3, Av_u, s, Av_terpakai};
}

// ====== KONTROL SISTEM (SYSTEM 4) ======
function kontrolLenturKolom(hasilTulangan){
  if (!hasilTulangan) return {ok:false, detail:'no data'};
  const okAst = (hasilTulangan.Ast_i >= hasilTulangan.Ast_u);
  const okRho = (hasilTulangan.rho >= 1.0);
  const okN = (hasilTulangan.n <= hasilTulangan.n_max);
  // TAMBAHAN: Kontrol K ≤ Kmaks untuk kondisi at2>ac
  const okK = !hasilTulangan.K_melebihi_Kmaks;
  
  console.log("=== DEBUG kontrolLenturKolom ===");
  console.log("okAst:", okAst, "Ast_i:", hasilTulangan.Ast_i, "Ast_u:", hasilTulangan.Ast_u);
  console.log("okRho:", okRho, "rho:", hasilTulangan.rho);
  console.log("okN:", okN, "n:", hasilTulangan.n, "n_max:", hasilTulangan.n_max);
  console.log("okK:", okK, "K:", hasilTulangan.K, "Kmaks:", hasilTulangan.Kmaks);
  
  return {
    ok: okAst && okRho && okN && okK,
    Ast_ok: okAst,
    rho_ok: okRho,
    n_ok: okN,
    K_ok: okK, // TAMBAHAN: Status kontrol K
    detail: {
      Ast_i: hasilTulangan.Ast_i,
      Ast_u: hasilTulangan.Ast_u,
      rho: hasilTulangan.rho,
      n: hasilTulangan.n,
      n_max: hasilTulangan.n_max,
      // TAMBAHAN: Detail nilai K dan Kmaks
      K: hasilTulangan.K,
      Kmaks: hasilTulangan.Kmaks,
      K_melebihi_Kmaks: hasilTulangan.K_melebihi_Kmaks
    }
  };
}

function kontrolGeserKolom(begel){
  if (!begel) return {ok:false, detail:'no data'};
  const Vs_ok = (parseFloat(begel.Vs) <= parseFloat(begel.Vs_max) || begel.Vs <= begel.Vs_max); // defensive
  const Av_ok = parseFloat(begel.Av_terpakai) >= parseFloat(begel.Av_u);
  return {
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
}

function isKontrolAmanKolom(kontrol){
  if (!kontrol) return false;
  const lentur = kontrol.lentur;
  const geser = kontrol.geser;
  if (!lentur || !geser) return false;
  // TAMBAHAN: Tambahkan pemeriksaan K_ok
  if (!lentur.Ast_ok || !lentur.rho_ok || !lentur.n_ok || !lentur.K_ok) return false;
  if (!geser.Vs_ok || !geser.Av_ok) return false;
  return true;
}

// ====== REKAP SEMUA HASIL (SYSTEM 5) ======
function rekapKolomAll(parsed, Dimensi, hasilTulangan, begel, kontrol){
  // Build a large object with raw + formatted fields for convenience
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
      e: hasilTulangan.e, // nilai eksentrisitas ke rekap
      
      // PERBAIKAN: TAMBAHKAN DATA BEBAN KE REKAP TULANGAN
      Pu: parsed.beban.Pu,   // Ambil dari input
      Mu: parsed.beban.Mu,   // Ambil dari input
      Pu_phi: hasilTulangan.Pu_phi, // Sudah ada di hasilTulangan
      
      // Data yang sudah ada sebelumnya...
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
      faktorPhi: hasilTulangan.faktorPhi
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
      // PERBAIKAN: Format nilai Pu vs Pu∅
      Pu_vs_Pu_phi: `P<sub>u</sub> = ${parsed.beban.Pu?.toFixed(2) || '0'} kN vs P<sub>u</sub>∅ = ${hasilTulangan.Pu_phi?.toFixed(2) || '0'} kN`,
      K: `K = ${hasilTulangan.K?.toFixed(4) || '0'} ≤ Kmaks = ${hasilTulangan.Kmaks?.toFixed(4) || '0'}`
    }
  };

  return rekap;
}

// Fungsi untuk menyimpan warna ke sessionStorage (SAMA PERSIS dengan di balok)
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
    console.log("✅ Warna kolom disimpan ke sessionStorage");
}

// Panggil fungsi ini setiap kali user mengubah warna di modul kolom
// Contoh: di event listener color picker atau tema selector

function saveResultAndRedirectKolom(result, inputData){
  try{
    // PERBAIKAN: Gunakan key khusus untuk kolom
    sessionStorage.setItem(DEFAULTS.resultKey, JSON.stringify({
      module: inputData.module || 'kolom',
      mode: inputData.mode || 'evaluasi',
      data: result.data,
      kontrol: result.kontrol,
      rekap: result.rekap,
      timestamp: new Date().toISOString(),
      inputData: inputData
    }));
    saveColorSettings();
    if (typeof window !== 'undefined') {
      window.location.href = 'report.html';
    }
  } catch(e){
    console.warn('Gagal simpan result kolom:', e);
  }
}

// ====== HIGH-LEVEL CALCULATOR (SYSTEM 2 & 7 & 9) ======
async function calculateKolom(rawInput, options = {}){
  // Parse & validate
  const parsed = parseInput(rawInput);
  const problems = validateParsed(parsed);
  if (problems.length) return { status:'error', problems, parsed };

  // Determine D & phi source depending on mode
  let D = parsed.tulangan.d_tul || options.D || 29;
  let phi = parsed.tulangan.phi_tul || options.phi || 10;
  const mode = parsed.mode;

  console.log("=== DEBUG calculateKolom ===");
  console.log("Mode:", mode, "D:", D, "phi:", phi);
  console.log("n_tul dari parsed:", parsed.tulangan.n_tul);

  // Prepare Dimensi
  const Dimensi = hitungKolomDimensi({b: parsed.dimensi.b, h: parsed.dimensi.h, Sb: parsed.dimensi.sb, D, phi, fc: parsed.material.fc});
  const m_val = Math.max(1, Math.floor(Dimensi.m) || 1);

  // If mode desain -> call optimizer (SYSTEM 7)
  if (mode === 'desain'){
    // attempt to call global optimizer
    if (typeof window !== 'undefined' && typeof window.optimizeKolom === 'function'){
      try {
        const optInput = { parsed, options };
        const optRes = await Promise.resolve(window.optimizeKolom(optInput));
        
        // =====================================================
        // PERBAIKAN: TAMBAHKAN PENGECEKAN KHUSUS UNTUK NO_VALID_COMBINATION
        // =====================================================
        if (optRes && optRes.status === "error" && optRes.code === "NO_VALID_COMBINATION") {
          // Kembalikan status peringatan dengan struktur yang diminta
          return {
            status: "peringatan",
            message: optRes.message || "Tidak ditemukan kombinasi tulangan kolom yang memenuhi seluruh kontrol.",
            detail: optRes.summary || { total_kombinasi: 0, kombinasi_valid: 0 }
          };
        }
        
        // Expect optimizer to return at least D_opt and phi_opt (or d_tul and phi_tul)
        if (optRes && (optRes.D_opt || optRes.d_tul || optRes.D)){
          D = optRes.D_opt || optRes.d_tul || optRes.D || D;
        }
        if (optRes && (optRes.phi_opt || optRes.phi_tul || optRes.phi)){
          phi = optRes.phi_opt || optRes.phi_tul || optRes.phi || phi;
        }
        // also optimizer may return suggestions for n and s, accept them via options if present
        if (optRes && optRes.n) options.n = options.n || optRes.n;
        if (optRes && optRes.s) options.s = options.s || optRes.s;
      } catch(e){
        return { status:'error', message: 'Optimizer gagal dijalankan', error: String(e) };
      }
    } else {
      // optimizer not available: return error to indicate expected integration
      return { status:'error', message: 'Mode desain membutuhkan optimizer.js — window.optimizeKolom tidak ditemukan' };
    }
  } else {
    // mode evaluasi: prefer session storage tulangan if available
    const sessionInput = readSessionInput();
    if (sessionInput && sessionInput.tulangan){
      // override parsed tulangan values
      const t = sessionInput.tulangan;
      parsed.tulangan.d_tul = parsed.tulangan.d_tul || toNum(t.d_tul || t.d);
      parsed.tulangan.phi_tul = parsed.tulangan.phi_tul || toNum(t.phi_tul || t.phi);
      parsed.tulangan.n_tul = parsed.tulangan.n_tul || toNum(t.n_tul || t.n);
      parsed.tulangan.s_tul = parsed.tulangan.s_tul || toNum(t.s_tul || t.s);
      // adopt D & phi too
      D = parsed.tulangan.d_tul || D;
      phi = parsed.tulangan.phi_tul || phi;
    } else {
      // if not in session, still proceed using parsed.tulangan (maybe provided inline)
      D = parsed.tulangan.d_tul || D;
      phi = parsed.tulangan.phi_tul || phi;
    }
  }

  // Recompute Dimensi since D/phi might have changed
  const DimensiFinal = hitungKolomDimensi({b: parsed.dimensi.b, h: parsed.dimensi.h, Sb: parsed.dimensi.sb, D, phi, fc: parsed.material.fc});
  const d = DimensiFinal.d;
  const ds = DimensiFinal.ds;
  const m = Math.max(1, Math.floor(DimensiFinal.m) || 1);

  console.log("=== PARAMETER FINAL ===");
  console.table({
    mode: mode,
    n_tul: parsed.tulangan.n_tul,
    D, phi, d, ds, m,
    Pu: parsed.beban.Pu,
    Mu: parsed.beban.Mu,
    b: parsed.dimensi.b,
    h: parsed.dimensi.h,
    fc: parsed.material.fc,
    fy: parsed.material.fy
  });

  // Prepare arguments for tulangan core
  const tulMode = mode; // 'desain' or 'evaluasi'
  let n_input = 0;
  
  // PERBAIKAN: Logika yang lebih jelas untuk menentukan n_input
  if (tulMode === 'evaluasi') {
    // Cek dari beberapa sumber: session storage, parsed.tulangan, options
    const sessionInput = readSessionInput();
    if (sessionInput && sessionInput.tulangan && sessionInput.tulangan.n_tul) {
      n_input = sessionInput.tulangan.n_tul;
      console.log("n_input dari session storage:", n_input);
    } else if (parsed.tulangan.n_tul) {
      n_input = parsed.tulangan.n_tul;
      console.log("n_input dari parsed input:", n_input);
    } else if (options.n) {
      n_input = options.n;
      console.log("n_input dari options:", n_input);
    } else {
      n_input = 0;
      console.warn("⚠️ n_input tidak ditemukan untuk mode evaluasi, menggunakan 0");
    }
  } else {
    n_input = 0; // Mode desain tidak perlu n_input
  }

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

  // Begel calculation — s_pasang comes from session if evaluasi, or options for desain
  let s_pasang = undefined;
  if (tulMode === 'evaluasi') {
    // Cek dari beberapa sumber
    const sessionInput = readSessionInput();
    if (sessionInput && sessionInput.tulangan && sessionInput.tulangan.s_tul) {
      s_pasang = sessionInput.tulangan.s_tul;
    } else if (parsed.tulangan.s_tul) {
      s_pasang = parsed.tulangan.s_tul;
    } else if (options.s) {
      s_pasang = options.s;
    }
  } else {
    s_pasang = options.s;
  }

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

  // If desain and s < 100, ensure s>=100 (SYSTEM 4 enforcement for desain)
  if (tulMode === 'desain' && begel.s < 100){
    begel.s = 100;
    // recompute Av_terpakai
    const luas_sengkang = 2 * 0.25 * Math.PI * phi * phi;
    begel.Av_terpakai = (begel.s > 0) ? (luas_sengkang * 1000) / begel.s : 0;
  }

  // Kontrol (SYSTEM 4)
  const kontrol_lentur = kontrolLenturKolom(hasilTul);
  const kontrol_geser = kontrolGeserKolom(begel);
  const kontrol = { lentur: kontrol_lentur, geser: kontrol_geser };
  const aman = isKontrolAmanKolom(kontrol);

  // Rekap lengkap (SYSTEM 5)
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
  console.log("Status:", result.status, "Aman:", aman);
  console.log("Kontrol Lentur:", kontrol_lentur.ok);
  console.log("Kontrol Geser:", kontrol_geser.ok);

  // If options.autoSave true or user requested redirect, call saveResultAndRedirectKolom
  if (options.autoSave){
    try { saveResultAndRedirectKolom(result, parsed.raw); } catch(e){ /* ignore */ }
  }

  return result;
}

// Wrapper with redirect like calc-balok
async function calculateKolomWithRedirect(data){
  try {
    const result = await calculateKolom(data, { autoSave: true });
    if (result && (result.status === 'sukses' || result.status === 'cek')) {
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

// Expose to window
if (typeof window !== 'undefined'){
  window.calculateKolom = calculateKolom;
  window.calculateKolomWithRedirect = calculateKolomWithRedirect;
  // provide alias expected by your optimizer integration naming conventions
  // optimizer.js should call window.optimizeKolom(parsedInput) to supply D and phi
}

// ====== Convenience: quick synchronous wrapper (for non-await contexts) ======
function calculateKolomSync(rawInput, options={}){
  // call the async function but run synchronously by resolving if optimizer is not required
  // If mode=desain and optimizer exists as async, caller should use calculateKolom (async)
  return (async () => await calculateKolom(rawInput, options))();
}

// ====== Logging / Ready ======
console.log('✅ calc-kolom.js (extended) loaded — modes: desain|evaluasi, kontrol, rekap, optimizer-ready, semua-kondisi');