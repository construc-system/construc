// =====================================================
// calc-kolom.js (BIAXIAL - LENGKAP DENGAN SEMUA FUNGSI)
// Memastikan data hasil perhitungan arah X dan Y tersimpan penuh di sessionStorage
// PERBAIKAN: Rekap tulangan utama untuk mode desain menggunakan total batang = nX + nY - 4
// PERUBAHAN: d untuk begel = max(d_X, d_Y)
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

// ====== KOLOM: DIMENSI HELPERS ======
function hitungKolomDimensi({b, h, Sb, D, phi, fc}){
  const phi1 = DEFAULTS.phi1;
  const phi2 = DEFAULTS.phi2;
  const ds = ceil5(Sb + phi + (D/2));
  const d = h - ds;
  const m = Math.floor((b - 2 * ds) / (D + Sb) + 1);
  const Sn = Math.max(40, 1.5 * D);
  let beta1;
  if (fc <= 28) beta1 = 0.85;
  else if (fc < 55) beta1 = 0.85 - 0.05 * ((fc - 28) / 7);
  else beta1 = 0.65;
  return {
    m, phi1, phi2, ds, d, beta1, Sn,
    perhitungan: {
      ds_formula: `ds = ${Sb} + ${phi} + ${D}/2 = ${ds}`,
      d_formula: `d = ${h} - ${ds} = ${d}`,
      m_formula: `m = floor((${b} - 2*${ds}) / (${D} + ${Sb}) + 1) = ${m}`,
      Sn_formula: `Sn = max(40, 1.5 * ${D}) = ${Sn}`,
      beta1_formula: fc <= 28 ? `0.85 (fc=${fc} ≤ 28)` : 
                   fc < 55 ? `0.85 - 0.05*(${fc}-28)/7 = ${beta1}` : 
                   `0.65 (fc=${fc} ≥ 55)`
    }
  };
}

// ====== PARSER & SESSION HELPERS ======
function parseInput(raw){
  let data = raw;
  if (!data) data = {};
  else if (typeof raw === 'string'){
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
  const Mux = toNum(beban.mux || beban.Mux, 0);
  const Muy = toNum(beban.muy || beban.Muy, 0);
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
    beban:{Pu, Mux, Muy, Vu},
    material:{fc,fy,fyt},
    lanjutan:{lambda,n_kaki},
    tulangan:{d_tul,phi_tul,n_tul,s_tul},
    raw: data
  };
  return parsedData;
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

// ====== SOLVER CUBIC ======
function solveCubic(R1,R2,R3){
  const a=R1,b=R2,c=R3;
  const p = b - (a*a)/3;
  const q = (2*a*a*a)/27 - (a*b)/3 + c;
  const Delta = (q/2)**2 + (p/3)**3;
  let t, metode;
  let detail = {a,b,c,p,q,Delta};
  if (Delta >= 0) {
    metode = 'Delta ≥ 0';
    const A = Math.cbrt(-q/2 + Math.sqrt(Delta));
    const B = Math.cbrt(-q/2 - Math.sqrt(Delta));
    t = A + B;
    detail.A = A;
    detail.B = B;
  } else {
    metode = 'Delta < 0';
    const r = 2 * Math.sqrt(-p/3);
    const theta = Math.acos(clamp((3*q)/(2*p) * Math.sqrt(-3/p), -1, 1))/3;
    t = r * Math.cos(theta);
    detail.r = r;
    detail.theta = theta;
  }
  const hasil = t - a/3;
  return { hasil, detail: {...detail, metode, t, hasil_akhir: hasil} };
}

// ====== FUNGSI UNTUK MENGHITUNG SEMUA KONDISI (satu arah) ======
function hitungSemuaKondisi({
  Pu, Mu, b, h, d, ds, fc, fy, beta1, phi1, e, ab, ac, ab1, ab2, at1, at2, faktorPhi
}) {
  const safeH = (typeof h === 'number' && isFinite(h)) ? h : 0;
  const semuaKondisi = {};
  
  semuaKondisi.parameter = {
    Pu, Mu, b, h: safeH, d, ds, fc, fy, beta1, phi1, e,
    ab, ac, ab1, ab2, at1, at2, faktorPhi,
    ab_formula: `ab = (600 * ${beta1} * ${d}) / (600 + ${fy}) = ${ab}`,
    ac_formula: `ac = (${Pu} * 1000) / (0.65 * 0.85 * ${fc} * ${b}) = ${ac}`,
    ab1_formula: `ab1 = (600 * ${beta1} * ${d}) / (600 - ${fy}) = ${ab1}`,
    ab2_formula: `ab2 = ${beta1} * ${d} = ${ab2}`,
    at1_formula: `at1 = (600 * ${beta1} * ${ds}) / (600 - ${fy}) = ${at1}`,
    at2_formula: `at2 = ${beta1} * ${ds} = ${at2}`,
    e_formula: `e = Mu/Pu * 1000 = ${Mu}/${Pu} * 1000 = ${e}`,
    faktorPhi: faktorPhi
  };
  
  // Kondisi 1: ac > ab1
  try {
    const A1_k1 = (1.25 * (Pu*1000 / faktorPhi) - 0.85 * fc * b * safeH) / (2 * (fy - 0.85 * fc) || 1);
    const A2_k1 = A1_k1;
    const As_tu_k1 = A1_k1 + A2_k1;
    semuaKondisi.kondisi1 = {
      nama: 'ac > ab1', kondisi: 'ac > ab1',
      A1: A1_k1, A2: A2_k1, As_tu: As_tu_k1,
      persamaan: "A1 = A2 = (1.25 * Pu / faktorPhi - 0.85 * fc * b * h) / (2 * (fy - 0.85 * fc))",
      perhitungan: {
        pembilang: `1.25 * (${Pu}*1000 / ${faktorPhi}) - 0.85 * ${fc} * ${b} * ${safeH}`,
        pembilang_nilai: 1.25 * (Pu*1000 / faktorPhi) - 0.85 * fc * b * safeH,
        penyebut: `2 * (${fy} - 0.85 * ${fc})`,
        penyebut_nilai: 2 * (fy - 0.85 * fc),
        A1_formula: `(${1.25 * (Pu*1000 / faktorPhi) - 0.85 * fc * b * safeH}) / (${2 * (fy - 0.85 * fc)}) = ${A1_k1}`,
        As_tu_formula: `${A1_k1} + ${A2_k1} = ${As_tu_k1}`
      },
      aktif: false
    };
  } catch(e) { semuaKondisi.kondisi1 = { error: e.message, aktif: false }; }

  // Kondisi 2: ab1 > ac > ab2
  try {
    const ap1 = (600 - fy) * (d - ds) / (600 + fy);
    const R1 = -(ab + ap1 + safeH);
    const R2 = 2 * ab * d + ac * (ap1 + 2 * e);
    const R3 = -ac * ab * (d - ds + 2 * e);
    const cubicResult = solveCubic(R1,R2,R3);
    const a_cubic_k2 = cubicResult.hasil;
    const denom_k2 = ((600 + fy) * a_cubic_k2 - 600 * beta1 * d) || 1;
    const A1_k2 = a_cubic_k2 * (Pu * 1000 / faktorPhi - 0.85 * fc * a_cubic_k2 * b) / denom_k2;
    const A2_k2 = A1_k2;
    const As_tu_k2 = A1_k2 + A2_k2;
    semuaKondisi.kondisi2 = {
      nama: 'ab1 > ac > ab2', kondisi: 'ab1 > ac > ab2',
      A1: A1_k2, A2: A2_k2, As_tu: As_tu_k2,
      ap1, R1, R2, R3, a_cubic: a_cubic_k2,
      persamaan: "A1 = A2 = a * (Pu * 1000 / faktorPhi - 0.85 * fc * a * b) / ((600 + fy) * a - 600 * beta1 * d)",
      perhitungan: {
        ap1_formula: `ap1 = (600 - ${fy}) * (${d} - ${ds}) / (600 + ${fy}) = ${ap1}`,
        R1_formula: `R1 = -(${ab} + ${ap1} + ${safeH}) = ${R1}`,
        R2_formula: `R2 = 2 * ${ab} * ${d} + ${ac} * (${ap1} + 2 * ${e}) = ${R2}`,
        R3_formula: `R3 = -${ac} * ${ab} * (${d} - ${ds} + 2 * ${e}) = ${R3}`,
        cubic_solution: cubicResult.detail,
        denom_formula: `denom = (600 + ${fy}) * ${a_cubic_k2} - 600 * ${beta1} * ${d} = ${denom_k2}`,
        pembilang: `pembilang = ${a_cubic_k2} * (${Pu}*1000/${faktorPhi} - 0.85*${fc}*${a_cubic_k2}*${b})`,
        pembilang_nilai: a_cubic_k2 * (Pu * 1000 / faktorPhi - 0.85 * fc * a_cubic_k2 * b),
        A1_formula: `${a_cubic_k2} * (${Pu*1000/faktorPhi - 0.85*fc*a_cubic_k2*b}) / ${denom_k2} = ${A1_k2}`,
        As_tu_formula: `${A1_k2} + ${A2_k2} = ${As_tu_k2}`
      },
      aktif: false
    };
  } catch(e) { semuaKondisi.kondisi2 = { error: e.message, aktif: false }; }

  // Kondisi 3: ab2 > ac > ab
  try {
    const ap2 = (2 * fy * ds + 1200 * d) / (600 + fy);
    const R4 = -(ab + ap2);
    const R5 = 2 * ab * d - ac * (safeH - ap2 - 2 * e);
    const R6 = -ac * ab * (d - ds + 2 * e);
    const cubicResult = solveCubic(R4,R5,R6);
    const a_cubic_k3 = cubicResult.hasil;
    const denom_k3 = ((600 + fy) * a_cubic_k3 - 600 * beta1 * d) || 1;
    const A1_k3 = a_cubic_k3 * (Pu * 1000 / faktorPhi - 0.85 * fc * b * a_cubic_k3) / denom_k3;
    const A2_k3 = A1_k3;
    const As_tu_k3 = A1_k3 + A2_k3;
    semuaKondisi.kondisi3 = {
      nama: 'ab2 > ac > ab', kondisi: 'ab2 > ac > ab',
      A1: A1_k3, A2: A2_k3, As_tu: As_tu_k3,
      ap2, R4, R5, R6, a_cubic: a_cubic_k3,
      persamaan: "A1 = A2 = a * (Pu * 1000 / faktorPhi - 0.85 * fc * b * a) / ((600 + fy) * a - 600 * beta1 * d)",
      perhitungan: {
        ap2_formula: `ap2 = (2 * ${fy} * ${ds} + 1200 * ${d}) / (600 + ${fy}) = ${ap2}`,
        R4_formula: `R4 = -(${ab} + ${ap2}) = ${R4}`,
        R5_formula: `R5 = 2 * ${ab} * ${d} - ${ac} * (${safeH} - ${ap2} - 2 * ${e}) = ${R5}`,
        R6_formula: `R6 = -${ac} * ${ab} * (${d} - ${ds} + 2 * ${e}) = ${R6}`,
        cubic_solution: cubicResult.detail,
        denom_formula: `denom = (600 + ${fy}) * ${a_cubic_k3} - 600 * ${beta1} * ${d} = ${denom_k3}`,
        A1_formula: `${a_cubic_k3} * (${Pu*1000/faktorPhi - 0.85*fc*b*a_cubic_k3}) / ${denom_k3} = ${A1_k3}`,
        As_tu_formula: `${A1_k3} + ${A2_k3} = ${As_tu_k3}`
      },
      aktif: false
    };
  } catch(e) { semuaKondisi.kondisi3 = { error: e.message, aktif: false }; }

  // Kondisi 4: ab > ac > at1
  try {
    const A1_k4 = 0.5 * Pu * 1000 * (2 * e - safeH + ac) / (faktorPhi * (d - ds) * fy || 1);
    const A2_k4 = A1_k4;
    const As_tu_k4 = A1_k4 + A2_k4;
    semuaKondisi.kondisi4 = {
      nama: 'ab > ac > at1', kondisi: 'ab > ac > at1',
      A1: A1_k4, A2: A2_k4, As_tu: As_tu_k4,
      persamaan: "A1 = A2 = 0.5 * Pu * 1000 * (2 * e - h + ac) / (faktorPhi * (d - ds) * fy)",
      perhitungan: {
        pembilang: `0.5 * ${Pu} * 1000 * (2 * ${e} - ${safeH} + ${ac})`,
        pembilang_nilai: 0.5 * Pu * 1000 * (2 * e - safeH + ac),
        penyebut: `${faktorPhi} * (${d} - ${ds}) * ${fy}`,
        penyebut_nilai: faktorPhi * (d - ds) * fy,
        A1_formula: `${0.5 * Pu * 1000 * (2 * e - safeH + ac)} / (${faktorPhi * (d - ds) * fy}) = ${A1_k4}`,
        As_tu_formula: `${A1_k4} + ${A2_k4} = ${As_tu_k4}`
      },
      aktif: false
    };
  } catch(e) { semuaKondisi.kondisi4 = { error: e.message, aktif: false }; }

  // Kondisi 5: at1 > ac > at2
  try {
    const ap3 = (2 * fy * d - 1200 * ds) / (600 - fy);
    const R7 = ap3 - at1;
    const R8 = ac * (2 * e - safeH - ap3) + 2 * at1 * ds;
    const R9 = ac * at1 * (d - ds - 2 * e);
    const cubicResult = solveCubic(R7,R8,R9);
    const a_cubic_k5 = cubicResult.hasil;
    const denom_k5 = ((600 + fy) * a_cubic_k5 - 600 * beta1 * d) || 1;
    const A1_k5 = a_cubic_k5 * (Pu * 1000 / faktorPhi - 0.85 * fc * a_cubic_k5 * b) / denom_k5;
    const A2_k5 = A1_k5;
    const As_tu_k5 = A1_k5 + A2_k5;
    semuaKondisi.kondisi5 = {
      nama: 'at1 > ac > at2', kondisi: 'at1 > ac > at2',
      A1: A1_k5, A2: A2_k5, As_tu: As_tu_k5,
      ap3, R7, R8, R9, a_cubic: a_cubic_k5,
      persamaan: "A1 = A2 = a * (Pu * 1000 / faktorPhi - 0.85 * fc * a * b) / ((600 + fy) * a - 600 * beta1 * d)",
      perhitungan: {
        ap3_formula: `ap3 = (2 * ${fy} * ${d} - 1200 * ${ds}) / (600 - ${fy}) = ${ap3}`,
        R7_formula: `R7 = ${ap3} - ${at1} = ${R7}`,
        R8_formula: `R8 = ${ac} * (2 * ${e} - ${safeH} - ${ap3}) + 2 * ${at1} * ${ds} = ${R8}`,
        R9_formula: `R9 = ${ac} * ${at1} * (${d} - ${ds} - 2 * ${e}) = ${R9}`,
        cubic_solution: cubicResult.detail,
        denom_formula: `denom = (600 + ${fy}) * ${a_cubic_k5} - 600 * ${beta1} * ${d} = ${denom_k5}`,
        A1_formula: `${a_cubic_k5} * (${Pu*1000/faktorPhi - 0.85*fc*a_cubic_k5*b}) / ${denom_k5} = ${A1_k5}`,
        As_tu_formula: `${A1_k5} + ${A2_k5} = ${As_tu_k5}`
      },
      aktif: false
    };
  } catch(e) { semuaKondisi.kondisi5 = { error: e.message, aktif: false }; }

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
      nama: 'at2 > ac', kondisi: 'at2 > ac',
      A1: 0, A2: 0, As_tu: As_tu_k6,
      K, Kmaks, K_melebihi_Kmaks, a_flexure, As1, As2,
      persamaan: "As_tu = max((0.85 * fc * a * b) / fy, 1.4 * b * d / fy)",
      perhitungan: {
        K_formula: `K = ${Mu} * 1e6 / (${phi1} * ${b} * ${d}^2) = ${K}`,
        Kmaks_formula: `Kmaks = 382.5 * ${beta1} * ${fc} * (600 + ${fy} - 225 * ${beta1}) / (600 + ${fy})^2 = ${Kmaks}`,
        a_flexure_formula: `a_flexure = (1 - sqrt(1 - (2 * ${K}) / (0.85 * ${fc}))) * ${d} = ${a_flexure}`,
        As1_formula: `As1 = (0.85 * ${fc} * ${a_flexure} * ${b}) / ${fy} = ${As1}`,
        As2_formula: `As2 = 1.4 * ${b} * ${d} / ${fy} = ${As2}`,
        As_tu_formula: `max(${As1}, ${As2}) = ${As_tu_k6}`
      },
      aktif: false
    };
  } catch(e) { semuaKondisi.kondisi6 = { error: e.message, aktif: false }; }

  return semuaKondisi;
}

// ====== CORE: PERHITUNGAN TULANGAN UNTUK SATU ARAH ======
function hitungTulanganKolomCoreSatuArah({
  mode, n_input, Pu, Mu, b, h, d, ds, fc, fy, beta1, phi, D, m
}) {
  const phi1 = DEFAULTS.phi1;
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

  const intermediateVariables = {
    ab, ac, ab1, ab2, at1, at2, e, Pu_phi, faktorPhi, phi1,
    ab_formula: `ab = (600 * ${beta1} * ${d}) / (600 + ${fy}) = ${ab}`,
    ac_formula: `ac = (${Pu} * 1000) / (0.65 * 0.85 * ${fc} * ${b}) = ${ac}`,
    Pu_phi_formula: `Pu_phi = 0.1 * ${fc} * ${b} * ${h} / 1000 = ${Pu_phi}`,
    faktorPhi_formula: ac > ab ? `0.65 (ac > ab)` : 
                      Pu >= Pu_phi ? `0.65 (Pu ≥ Pu_phi)` : 
                      `0.9 - 0.25 * (${Pu} / ${Pu_phi}) = ${faktorPhi}`
  };

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

  // Pastikan As_tu tidak negatif atau NaN
  if (isNaN(As_tu) || As_tu < 0) As_tu = 0;

  const Ast_u = As_tu;
  const Ast_satu = 0.25 * Math.PI * (D || 0) * (D || 0);

  let n=0, Ast_i=0, rho=0, rho_dipakai=0, n_terpakai=0;
  let minimum_diterapkan = false;
  let minimum_detail = {};
  
  const detailTulangan = {
    Ast_satu_formula: `Ast_satu = π/4 * ${D}^2 = ${Ast_satu}`,
    Ast_u: Ast_u,
    mode: mode
  };
  
  if (mode === 'evaluasi'){
    n = n_input || 0;
    Ast_i = n * Ast_satu;
    rho = (Ast_i / (b * h)) * 100;
    rho_dipakai = rho;
    n_terpakai = n;
    detailTulangan.n_input = n_input;
    detailTulangan.Ast_i_formula = `Ast_i = ${n} * ${Ast_satu} = ${Ast_i}`;
    detailTulangan.rho_formula = `ρ = (${Ast_i} / (${b} * ${h})) * 100 = ${rho}%`;
  } else {
    // Mode desain: hitung kebutuhan awal
    let n_awal = Math.ceil(Ast_u / (Ast_satu || 1));
    n_awal = Math.max(2, n_awal);
    if (n_awal % 2 !== 0) n_awal += 1;
    let Ast_i_awal = n_awal * Ast_satu;
    let rho_awal = (Ast_i_awal / (b * h)) * 100;
    
    const rho_min = 1.0;
    const n_min = 4;
    
    // Tentukan nilai n yang memenuhi ketiga syarat: Ast_i >= Ast_u, n >= 4, rho >= 1%
    let n_final = n_awal;
    let Ast_i_final = Ast_i_awal;
    let rho_final = rho_awal;
    let alasan_minimum = '';
    
    // Cek apakah perlu penyesuaian
    if (n_final < n_min || rho_final < rho_min) {
      minimum_diterapkan = true;
      
      // Hitung n berdasarkan syarat ρ minimum
      const Ast_i_min_rho = (rho_min / 100) * b * h;
      let n_min_rho = Math.ceil(Ast_i_min_rho / Ast_satu);
      if (n_min_rho % 2 !== 0) n_min_rho += 1;
      
      // Hitung n berdasarkan syarat n minimum
      let n_min_n = n_min;
      if (n_min_n % 2 !== 0) n_min_n += 1;
      
      // Hitung n berdasarkan syarat Ast_i >= Ast_u (sudah terpenuhi oleh n_awal)
      let n_min_ast = n_awal;
      
      // Ambil nilai terbesar dari ketiga persyaratan
      let n_candidate = Math.max(n_min_ast, n_min_rho, n_min_n);
      if (n_candidate % 2 !== 0) n_candidate += 1;
      
      // Jika n_candidate lebih besar dari n_max, batasi (tapi tetap peringatkan)
      const n_max_local = 2 * (m || 1);
      if (n_candidate > n_max_local) {
        n_candidate = n_max_local;
        if (n_candidate % 2 !== 0) n_candidate -= 1;
        alasan_minimum = `n yang diperlukan (${n_candidate}) melebihi n_max (${n_max_local}), dibatasi ke n_max`;
      } else {
        if (n_min_ast < n_min_rho && n_min_rho >= n_min_ast) alasan_minimum = `ρ = ${rho_awal.toFixed(2)}% < ${rho_min}%`;
        else if (n_min_ast < n_min_n && n_min_n > n_min_ast) alasan_minimum = `n = ${n_awal} batang < ${n_min} batang`;
        else alasan_minimum = `Persyaratan minimum (n≥4 dan ρ≥1%)`;
      }
      
      n_final = n_candidate;
      Ast_i_final = n_final * Ast_satu;
      rho_final = (Ast_i_final / (b * h)) * 100;
      
      minimum_detail = {
        alasan: alasan_minimum || (rho_awal < rho_min ? `ρ = ${rho_awal.toFixed(2)}% < ${rho_min}%` : `n = ${n_awal} batang < ${n_min} batang`),
        sebelum: `n=${n_awal}, ρ=${rho_awal.toFixed(2)}%`,
        setelah: `n=${n_final}, ρ=${rho_final.toFixed(2)}%`
      };
    }
    
    n = n_final;
    Ast_i = Ast_i_final;
    rho = rho_final;
    
    const n_max = 2 * (m || 1);
    const n_limited = Math.min(n, n_max);
    Ast_i = n_limited * Ast_satu;
    rho = (Ast_i / (b * h)) * 100;
    rho_dipakai = Math.max(rho, rho_min);
    n_terpakai = n_limited;
    
    detailTulangan.n_awal = n_awal;
    detailTulangan.rho_awal = rho_awal;
    detailTulangan.rho_min = rho_min;
    detailTulangan.n_min = n_min;
    detailTulangan.n_max = n_max;
    detailTulangan.n_limited = n_limited;
    detailTulangan.n_terpakai = n_terpakai;
    detailTulangan.rho_dipakai = rho_dipakai;
  }

  const n_max = 2 * (m || 1);
  const status = n <= n_max ? 'AMAN' : 'TIDAK AMAN';

  const hasil = {
    kondisi, faktorPhi: faktorPhi,
    e, ab, ac, ab1, ab2, at1, at2,
    A1: kondisiAktif.A1, A2: kondisiAktif.A2, As_tu,
    Ast_u, Ast_satu, Ast_i, n, rho, n_terpakai, n_max, status,
    K: kondisiAktif.K, Kmaks: kondisiAktif.Kmaks, K_melebihi_Kmaks: kondisiAktif.K_melebihi_Kmaks,
    semuaKondisi: semuaKondisi,
    kondisiAktif: kondisiAktif.nama,
    kondisiDetail: kondisiAktif,
    Pu_phi, beta1,
    minimum_diterapkan, minimum_detail,
    intermediateVariables: intermediateVariables,
    detailTulangan: detailTulangan,
    inputVariables: { mode, n_input, Pu, Mu, b, h, d, ds, fc, fy, beta1, phi, D, m }
  };
  return hasil;
}

// ====== FUNGSI UTAMA UNTUK BIAXIAL ======
function hitungTulanganKolomBiaxial(parsed, D, phi, mode, n_input) {
  const b = parsed.dimensi.b;
  const h = parsed.dimensi.h;
  const sb = parsed.dimensi.sb;
  const fc = parsed.material.fc;
  const fy = parsed.material.fy;
  const Pu = parsed.beban.Pu;
  const Mux = parsed.beban.Mux;
  const Muy = parsed.beban.Muy;

  // Hitung dimensi untuk arah X (momen Mux, lebar = b, tinggi = h)
  const dimX = hitungKolomDimensi({ b, h, Sb: sb, D, phi, fc });
  // Hitung dimensi untuk arah Y (momen Muy, lebar = h, tinggi = b)
  const dimY = hitungKolomDimensi({ b: h, h: b, Sb: sb, D, phi, fc });

  // Hitung tulangan untuk arah X
  const hasilX = hitungTulanganKolomCoreSatuArah({
    mode, n_input, Pu, Mu: Mux, b, h, d: dimX.d, ds: dimX.ds,
    fc, fy, beta1: dimX.beta1, phi, D, m: dimX.m
  });

  // Hitung tulangan untuk arah Y (tukar b dan h)
  const hasilY = hitungTulanganKolomCoreSatuArah({
    mode, n_input, Pu, Mu: Muy, b: h, h: b, d: dimY.d, ds: dimY.ds,
    fc, fy, beta1: dimY.beta1, phi, D, m: dimY.m
  });

  // Gabungkan hasil: ambil nilai terbesar untuk As_tu, n, dll.
  const As_tu_final = Math.max(hasilX.As_tu, hasilY.As_tu);
  const Ast_u_final = As_tu_final;
  const Ast_satu = hasilX.Ast_satu; // sama untuk kedua arah

  let n_final, Ast_i_final, rho_final, n_terpakai_final, rho_dipakai_final;
  let minimum_diterapkan_final = false;
  let minimum_detail_final = {};

  if (mode === 'evaluasi') {
    n_final = n_input;
    Ast_i_final = n_final * Ast_satu;
    rho_final = (Ast_i_final / (b * h)) * 100;
    n_terpakai_final = n_final;
    rho_dipakai_final = rho_final;
  } else {
    // Mode desain: hitung kebutuhan berdasarkan As_tu_final
    let n = Math.ceil(Ast_u_final / (Ast_satu || 1));
    n = Math.max(2, n);
    if (n % 2 !== 0) n += 1;
    let Ast_i = n * Ast_satu;
    let rho = (Ast_i / (b * h)) * 100;
    const rho_min = 1.0;
    const n_min = 4;
    
    // Penyesuaian minimum untuk gabungan
    if (rho < rho_min || n < n_min) {
      minimum_diterapkan_final = true;
      
      // Hitung n berdasarkan ρ minimum
      const Ast_i_min_rho = (rho_min / 100) * b * h;
      let n_min_rho = Math.ceil(Ast_i_min_rho / Ast_satu);
      if (n_min_rho % 2 !== 0) n_min_rho += 1;
      
      // Hitung n berdasarkan n minimum
      let n_min_n = n_min;
      if (n_min_n % 2 !== 0) n_min_n += 1;
      
      // n dari kebutuhan Ast_u
      let n_min_ast = n;
      
      // Ambil yang terbesar
      let n_candidate = Math.max(n_min_ast, n_min_rho, n_min_n);
      if (n_candidate % 2 !== 0) n_candidate += 1;
      
      const m_used = dimX.m;
      const n_max_total = 2 * (m_used || 1);
      if (n_candidate > n_max_total) {
        n_candidate = n_max_total;
        if (n_candidate % 2 !== 0) n_candidate -= 1;
        minimum_detail_final.alasan = `n yang diperlukan (${n_candidate}) melebihi n_max (${n_max_total}), dibatasi ke n_max`;
      } else {
        if (rho < rho_min && n >= n_min) {
          minimum_detail_final.alasan = `ρ = ${rho.toFixed(2)}% < ${rho_min}%`;
        } else if (n < n_min) {
          minimum_detail_final.alasan = `n = ${n} batang < ${n_min} batang`;
        } else {
          minimum_detail_final.alasan = `Persyaratan minimum (n≥4 dan ρ≥1%)`;
        }
      }
      
      n = n_candidate;
      Ast_i = n * Ast_satu;
      rho = (Ast_i / (b * h)) * 100;
      minimum_detail_final.setelah = `n=${n}, ρ=${rho.toFixed(2)}%`;
    }
    
    const m_used = dimX.m;
    const n_max = 2 * (m_used || 1);
    const n_limited = Math.min(n, n_max);
    Ast_i_final = n_limited * Ast_satu;
    rho_final = (Ast_i_final / (b * h)) * 100;
    rho_dipakai_final = Math.max(rho_final, rho_min);
    n_terpakai_final = n_limited;
    n_final = n;
  }

  // Hasil gabungan
  const hasilGabungan = {
    ...hasilX,
    As_tu: As_tu_final,
    Ast_u: Ast_u_final,
    Ast_satu: Ast_satu,
    Ast_i: Ast_i_final,
    n: n_final,
    rho: rho_final,
    n_terpakai: n_terpakai_final,
    rho_dipakai: rho_dipakai_final,
    minimum_diterapkan: minimum_diterapkan_final,
    minimum_detail: minimum_detail_final,
    hasilArahX: hasilX,
    hasilArahY: hasilY,
    faktorPhi_X: hasilX.faktorPhi,
    faktorPhi_Y: hasilY.faktorPhi,
    kondisi_X: hasilX.kondisi,
    kondisi_Y: hasilY.kondisi,
    K_X: hasilX.K,
    Kmaks_X: hasilX.Kmaks,
    K_melebihi_Kmaks_X: hasilX.K_melebihi_Kmaks,
    K_Y: hasilY.K,
    Kmaks_Y: hasilY.Kmaks,
    K_melebihi_Kmaks_Y: hasilY.K_melebihi_Kmaks,
  };
  return hasilGabungan;
}

// ====== BEGEL ======
function hitungBegelCore({Pu, Vu, b, h, d, fc, fy, fyt, phi, Ag, lambda, phi2, mode, n_val, s_pasang}){
  const Vc_phi = phi2 * 0.17 * (1 + (Pu * 1000) / (14 * Ag || 1)) * lambda * Math.sqrt(fc) * b * d / 1000;
  const Vs = Math.max(0, (Vu - Vc_phi) * phi2);
  const Vs_max = (2/3) * Math.sqrt(fc) * b * d / 1000;
  const warning = Vs > Vs_max ? 'DIMENSI KOLOM PERLU DIPERBESAR' : 'AMAN';
  const Avu1 = 0.062 * Math.sqrt(fc) * b * 1000 / (fyt || 1);
  const Avu2 = 0.35 * b * 1000 / (fyt || 1);
  const Avu3 = (Vs * 1000 * 1000) / ((fyt || 1) * (d || 1));
  const Av_u = (Math.max(Avu1,Avu2,Avu3));

  const fi_begel = phi;
  const luas_sengkang = 2 * 0.25 * Math.PI * fi_begel * fi_begel;
  const s_1 = (n_val* fi_begel * fi_begel * Math.PI * 0.25) / ((Av_u/1000) || 1);
  const s_2 = (Vs < (Vs_max / 2)) ? d/2 : d/4;
  const s_3 = (Vs < (Vs_max / 2)) ? 600 : 300;
  let s = Math.floor(Math.min(s_1, s_2, s_3) / 10) * 10;
  if (mode === 'desain' && s < 100) s = 100;
  if (mode === 'evaluasi' && s_pasang) s = s_pasang;
  const Av_terpakai = (s > 0) ? (luas_sengkang * 1000) / s : 0;

  return {
    Vc_phi, Vs, Vs_max, warning, 
    Avu1, Avu2, Avu3, Av_u, 
    s, Av_terpakai,
    detailPerhitungan: {
      Vc_phi_formula: `Vc_phi = ${phi2} * 0.17 * (1 + (${Pu}*1000) / (14 * ${Ag})) * ${lambda} * √${fc} * ${b} * ${d} / 1000 = ${Vc_phi}`,
      Vs_formula: `Vs = max(0, (${Vu} - ${Vc_phi}) * ${phi2}) = ${Vs}`,
      Vs_max_formula: `Vs_max = (2/3) * √${fc} * ${b} * ${d} / 1000 = ${Vs_max}`,
      Avu1_formula: `Avu1 = 0.062 * √${fc} * ${b} * 1000 / ${fyt} = ${Avu1}`,
      Avu2_formula: `Avu2 = 0.35 * ${b} * 1000 / ${fyt} = ${Avu2}`,
      Avu3_formula: `Avu3 = (${Vs} * 1000 * 1000) / (${fyt} * ${d}) = ${Avu3}`,
      Av_u_formula: `Av_u = (max(${Avu1}, ${Avu2}, ${Avu3})) = ${Av_u}`,
      luas_sengkang_formula: `luas_sengkang = 2 * π/4 * ${fi_begel}^2 = ${luas_sengkang}`,
      s_1_formula: `s_1 = (${n_val} * π/4 * ${fi_begel}^2) / (${Av_u}/1000) = ${s_1}`,
      s_2_formula: `s_2 = ${Vs} < ${Vs_max}/2 ? ${d}/2 : ${d}/4 = ${s_2}`,
      s_3_formula: `s_3 = ${Vs} < ${Vs_max}/2 ? 600 : 300 = ${s_3}`,
      s_awal: Math.min(s_1, s_2, s_3),
      s_akhir: s,
      Av_terpakai_formula: `Av_terpakai = (${luas_sengkang} * 1000) / ${s} = ${Av_terpakai}`
    },
    inputVariables: { Pu, Vu, b, h, d, fc, fy, fyt, phi, Ag, lambda, phi2, mode, n_val, s_pasang }
  };
}

// ====== KONTROL SISTEM ======
function kontrolLenturKolomBiaxial(hasilGabungan){
  if (!hasilGabungan) return {ok:false, detail:'no data'};
  const rho_min = 1.0;
  const n_min = 4;
  const okAst = (hasilGabungan.Ast_i >= hasilGabungan.Ast_u);
  const okRho = (hasilGabungan.rho >= rho_min);
  const okN = (hasilGabungan.n_terpakai >= n_min) && (hasilGabungan.n_terpakai <= hasilGabungan.n_max);
  const okK_X = !hasilGabungan.K_melebihi_Kmaks_X;
  const okK_Y = !hasilGabungan.K_melebihi_Kmaks_Y;
  const okK = okK_X && okK_Y;
  return {
    ok: okAst && okRho && okN && okK,
    Ast_ok: okAst,
    rho_ok: okRho,
    n_ok: okN,
    K_ok: okK,
    K_ok_X: okK_X,
    K_ok_Y: okK_Y,
    detail: {
      Ast_i: hasilGabungan.Ast_i,
      Ast_u: hasilGabungan.Ast_u,
      rho: hasilGabungan.rho,
      rho_min: rho_min,
      n: hasilGabungan.n_terpakai,
      n_min: n_min,
      n_max: hasilGabungan.n_max,
      K_X: hasilGabungan.K_X,
      Kmaks_X: hasilGabungan.Kmaks_X,
      K_Y: hasilGabungan.K_Y,
      Kmaks_Y: hasilGabungan.Kmaks_Y,
    }
  };
}

function kontrolGeserKolom(begel){
  if (!begel) return {ok:false, detail:'no data'};
  const Vs_ok = (parseFloat(begel.Vs) <= parseFloat(begel.Vs_max) || begel.Vs <= begel.Vs_max);
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
  if (!lentur.Ast_ok || !lentur.rho_ok || !lentur.n_ok || !lentur.K_ok) return false;
  if (!geser.Vs_ok || !geser.Av_ok) return false;
  return true;
}

// ====== REKAP SEMUA HASIL (dengan data lengkap arah X dan Y) ======
function rekapKolomAll(parsed, D, phi, hasilGabungan, begel, kontrol, Sn){
  const formatBar = (n, D) => (n && n>0) ? `${n}D${D}` : '-';
  const formatBegel = (phi, s) => (s && s>0) ? `Φ${phi}-${s}` : '-';

  // Ambil full object hasil perhitungan arah X dan Y
  const hasilX = hasilGabungan.hasilArahX || {};
  const hasilY = hasilGabungan.hasilArahY || {};

  // Untuk mode desain, hitung total batang = nX + nY - 4
  let n_terpakai_display = hasilGabungan.n_terpakai;
  let tulangan_utama_display = formatBar(hasilGabungan.n_terpakai, D);
  const mode = parsed.mode;

  if (mode === 'desain') {
    const nX = hasilX.n_terpakai ?? 0;
    const nY = hasilY.n_terpakai ?? 0;
    let totalBatang = nX + nY - 4;
    if (totalBatang < 0) totalBatang = 0;
    if (totalBatang > 0) {
      n_terpakai_display = totalBatang;
      tulangan_utama_display = formatBar(totalBatang, D);
    }
    console.log(`📊 REKAP KOLOM: nX=${nX}, nY=${nY}, totalBatang=${totalBatang}, tampilan=${tulangan_utama_display}`);
  }

  const rekap = {
    input: parsed.raw,
    Dimensi: {
      b: parsed.dimensi.b,
      h: parsed.dimensi.h,
      sb: parsed.dimensi.sb,
      Sn: Sn
    },
    hasilPerhitunganArahX: hasilX,
    hasilPerhitunganArahY: hasilY,
    tulanganArahX: {
      Ast_i: hasilX.Ast_i,
      Ast_u: hasilX.Ast_u,
      n_terpakai: hasilX.n_terpakai,
      n_max: hasilX.n_max,
      rho: hasilX.rho,
      kondisi: hasilX.kondisi,
      faktorPhi: hasilX.faktorPhi,
      K: hasilX.K,
      Kmaks: hasilX.Kmaks,
      K_melebihi_Kmaks: hasilX.K_melebihi_Kmaks,
      e: hasilX.e,
      minimum_diterapkan: hasilX.minimum_diterapkan,
      minimum_detail: hasilX.minimum_detail,
      A1: hasilX.A1,
      A2: hasilX.A2,
      As_tu: hasilX.As_tu,
      ab: hasilX.ab,
      ac: hasilX.ac,
      ab1: hasilX.ab1,
      ab2: hasilX.ab2,
      at1: hasilX.at1,
      at2: hasilX.at2,
    },
    tulanganArahY: {
      Ast_i: hasilY.Ast_i,
      Ast_u: hasilY.Ast_u,
      n_terpakai: hasilY.n_terpakai,
      n_max: hasilY.n_max,
      rho: hasilY.rho,
      kondisi: hasilY.kondisi,
      faktorPhi: hasilY.faktorPhi,
      K: hasilY.K,
      Kmaks: hasilY.Kmaks,
      K_melebihi_Kmaks: hasilY.K_melebihi_Kmaks,
      e: hasilY.e,
      minimum_diterapkan: hasilY.minimum_diterapkan,
      minimum_detail: hasilY.minimum_detail,
      A1: hasilY.A1,
      A2: hasilY.A2,
      As_tu: hasilY.As_tu,
      ab: hasilY.ab,
      ac: hasilY.ac,
      ab1: hasilY.ab1,
      ab2: hasilY.ab2,
      at1: hasilY.at1,
      at2: hasilY.at2,
    },
    tulangan: {
      D, phi,
      Ast_satu: hasilGabungan.Ast_satu,
      Ast_i: hasilGabungan.Ast_i,
      Ast_u: hasilGabungan.Ast_u,
      n_calculated: hasilGabungan.n,
      n_terpakai: n_terpakai_display,
      rho: hasilGabungan.rho,
      status_n: hasilGabungan.status,
      e: hasilGabungan.e,
      Pu: parsed.beban.Pu,
      Mux: parsed.beban.Mux,
      Muy: parsed.beban.Muy,
      Pu_phi: hasilGabungan.Pu_phi,
      K_X: hasilGabungan.K_X,
      Kmaks_X: hasilGabungan.Kmaks_X,
      K_ok_X: !hasilGabungan.K_melebihi_Kmaks_X,
      K_Y: hasilGabungan.K_Y,
      Kmaks_Y: hasilGabungan.Kmaks_Y,
      K_ok_Y: !hasilGabungan.K_melebihi_Kmaks_Y,
      kondisi_X: hasilGabungan.kondisi_X,
      kondisi_Y: hasilGabungan.kondisi_Y,
      faktorPhi_X: hasilGabungan.faktorPhi_X,
      faktorPhi_Y: hasilGabungan.faktorPhi_Y,
      minimum_diterapkan: hasilGabungan.minimum_diterapkan,
      minimum_detail: hasilGabungan.minimum_detail,
    },
    begel: {
      ...begel,
      s: begel.s,
      Av_u: begel.Av_u,
      Av_terpakai: begel.Av_terpakai,
      Vs: begel.Vs,
      Vs_max: begel.Vs_max,
      warning: begel.warning,
      detailPerhitungan: begel.detailPerhitungan,
    },
    kontrol,
    formatted: {
      tulangan_utama: tulangan_utama_display,
      begel: formatBegel(phi, begel.s),
      e: `${hasilGabungan.e?.toFixed(2) || '0'} mm`,
      Pu_vs_Pu_phi: `P<sub>u</sub> = ${parsed.beban.Pu?.toFixed(2) || '0'} kN vs P<sub>u</sub>φ = ${hasilGabungan.Pu_phi?.toFixed(2) || '0'} kN`,
      minimum_info: hasilGabungan.minimum_diterapkan ? 
        `Minimum diterapkan: ${hasilGabungan.minimum_detail?.alasan || ''} → ${hasilGabungan.minimum_detail?.setelah || ''}` : 
        'Tidak ada minimum yang diterapkan',
      Sn_info: `Sn = max(40, 1.5×D) = max(40, 1.5×${D}) = ${Sn} mm`
    }
  };
  return rekap;
}

// ====== SIMPAN DATA KE SESSION ======
function saveResultAndRedirectKolom(result, inputData){
  try{
    const savedData = {
      module: inputData.module || 'kolom',
      mode: inputData.mode || 'evaluasi',
      data: result.data,
      kontrol: result.kontrol,
      rekap: result.rekap,
      timestamp: new Date().toISOString(),
      inputData: inputData,
      optimizerData: result.optimizerData || null,
      Sn: result.data?.Sn || null
    };
    const jsonString = JSON.stringify(savedData, (key, value) => {
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) return 0;
      return value;
    }, 2);
    sessionStorage.setItem(DEFAULTS.resultKey, jsonString);
    console.log("✅ calculationResultKolom disimpan (biaxial) dengan data lengkap arah X dan Y");
    if (typeof window !== 'undefined') window.location.href = 'report.html';
  } catch(e){
    console.warn('Gagal simpan result kolom:', e);
  }
}

// ====== HIGH-LEVEL CALCULATOR ======
async function calculateKolom(rawInput, options = {}){
  const parsed = parseInput(rawInput);
  const problems = validateParsed(parsed);
  if (problems.length) return { status:'error', problems, parsed };

  let D = parsed.tulangan.d_tul;
  let phi = parsed.tulangan.phi_tul;
  const mode = parsed.mode;
  let optimizerData = null;

  if (mode === 'desain' && !options.skipOptimizer){
    if (typeof window !== 'undefined' && typeof window.optimizeKolom === 'function'){
      try {
        const optInput = { parsed, options };
        const optRes = await Promise.resolve(window.optimizeKolom(optInput));
        if (optRes && optRes.status === "sukses") {
          optimizerData = optRes;
          const result = {
            status: 'sukses',
            mode: mode,
            data: optRes.data,
            kontrol: optRes.kontrol,
            rekap: optRes.rekap,
            optimizerData: optimizerData
          };
          if (options.autoSave) saveResultAndRedirectKolom(result, parsed.raw);
          return result;
        } else if (optRes && optRes.status === "error" && optRes.code === "NO_VALID_COMBINATION") {
          return { status: "peringatan", message: optRes.message || "Tidak ditemukan kombinasi tulangan kolom yang memenuhi seluruh kontrol." };
        }
      } catch(e){
        console.error("Optimizer error:", e);
        return { status:'error', message: 'Optimizer gagal dijalankan' };
      }
    } else {
      return { status:'error', message: 'Mode desain membutuhkan optimizer.js' };
    }
  } else {
    D = parsed.tulangan.d_tul;
    phi = parsed.tulangan.phi_tul;
  }

  if (!D || !phi) return { status: "error", message: "Diameter tulangan tidak dapat ditentukan" };

  console.log(`🔧 PERHITUNGAN BIAXIAL DENGAN: D=${D}, φ=${phi}, Mux=${parsed.beban.Mux}, Muy=${parsed.beban.Muy}`);

  const dimX = hitungKolomDimensi({ b: parsed.dimensi.b, h: parsed.dimensi.h, Sb: parsed.dimensi.sb, D, phi, fc: parsed.material.fc });
  const dimY = hitungKolomDimensi({ b: parsed.dimensi.h, h: parsed.dimensi.b, Sb: parsed.dimensi.sb, D, phi, fc: parsed.material.fc });
  
  // *** PERUBAHAN: d untuk begel diambil dari nilai terbesar antara d_X dan d_Y ***
  const d_begel = Math.max(dimX.d, dimY.d);
  const Sn = dimX.Sn; // Sn sama untuk kedua arah, pakai dari X

  const tulMode = mode;
  const n_input = (tulMode === 'evaluasi') ? (parsed.tulangan.n_tul || 0) : 0;
  
  const hasilGabungan = hitungTulanganKolomBiaxial(parsed, D, phi, tulMode, n_input);

  const s_pasang = (tulMode === 'evaluasi') ? (parsed.tulangan.s_tul || undefined) : (options.s || undefined);
  const begel = hitungBegelCore({
    Pu: parsed.beban.Pu,
    Vu: parsed.beban.Vu,
    b: parsed.dimensi.b,
    h: parsed.dimensi.h,
    d: d_begel,   // <-- menggunakan max(d_X, d_Y)
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

  if (tulMode === 'desain' && begel.s < 100){
    begel.s = 100;
    const luas_sengkang = 2 * 0.25 * Math.PI * phi * phi;
    begel.Av_terpakai = (begel.s > 0) ? (luas_sengkang * 1000) / begel.s : 0;
  }

  const kontrol_lentur = kontrolLenturKolomBiaxial(hasilGabungan);
  const kontrol_geser = kontrolGeserKolom(begel);
  const kontrol = { lentur: kontrol_lentur, geser: kontrol_geser };
  const aman = isKontrolAmanKolom(kontrol);

  const rekap = rekapKolomAll(parsed, D, phi, hasilGabungan, begel, kontrol, Sn);

  const result = {
    status: aman ? 'sukses' : 'cek',
    mode: mode,
    data: {
      parsedInput: parsed.raw,
      Dimensi: { b: parsed.dimensi.b, h: parsed.dimensi.h, sb: parsed.dimensi.sb, Sn: Sn },
      D, phi, d_begel, Sn,
      hasilTulangan: hasilGabungan,
      begel: begel,
      kontrol: kontrol,
      aman: aman
    },
    kontrol: kontrol,
    rekap: rekap,
    optimizerData: optimizerData
  };

  if (options.autoSave) saveResultAndRedirectKolom(result, parsed.raw);
  return result;
}

// Wrapper dengan redirect
async function calculateKolomWithRedirect(data){
  try {
    const result = await calculateKolom(data, { autoSave: true });
    if (result && (result.status === 'sukses' || result.status === 'cek' || result.status === 'peringatan')) return result;
    else return result;
  } catch (err){
    console.error('Error dalam calculateKolomWithRedirect:', err);
    throw err;
  }
}

// ====== EKSPOR FUNGSI KE WINDOW ======
if (typeof window !== 'undefined') {
  window.calculateKolom = calculateKolom;
  window.calculateKolomWithRedirect = calculateKolomWithRedirect;
}

function calculateKolomSync(rawInput, options={}){
  return (async () => await calculateKolom(rawInput, options))();
}

console.log("✅ calc-kolom.js loaded — BIAXIAL (Mux & Muy) dengan penyimpanan lengkap data per arah X dan Y di sessionStorage — d untuk begel = max(d_X, d_Y)");