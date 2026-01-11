// [file name]: testcalc-main.js
// ======================================================================
// testcalc-main.js — Tester terpadu untuk semua modul (Balok, Kolom, Pelat, Fondasi)
// ======================================================================

// ------------------------
// Mock lingkungan browser
// ------------------------
global.window = {
  location: { href: "" },
  sessionStorage: {
    store: {},
    setItem(key, val) { this.store[key] = String(val) },
    getItem(key) { return this.store[key] || null },
    removeItem(key) { delete this.store[key] }
  },
  addEventListener: function() {},
  removeEventListener: function() {},
  alert: function(msg) { console.log("ALERT:", msg); },
  confirm: function() { return true; },
  console: console
};

Object.assign(global, global.window);

global.document = {
  documentElement: { style: {} },
  getElementById: function() { return null; },
  querySelector: function() { return null; },
  createElement: function() { return null; }
};

global.getComputedStyle = () => ({
  getPropertyValue: () => ''
});

global.location = global.window.location;
global.sessionStorage = global.window.sessionStorage;
global.alert = global.window.alert;
global.confirm = global.window.confirm;

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// ------------------------------------------------------
// Load modul perhitungan - VERSI DIPERBAIKI
// ------------------------------------------------------
console.log("📥 Memuat semua modul perhitungan...");

function loadModule(moduleName, redirectPattern) {
  console.log(`📥 Memuat ${moduleName}...`);
  try {
    const modulePath = path.join(__dirname, moduleName);
    let code = fs.readFileSync(modulePath, "utf8");
    
    // Nonaktifkan redirect
    if (redirectPattern) {
      code = code.replace(redirectPattern, "// redirect disabled");
    }
    
    // Hapus kode event listener untuk Node.js
    code = code.replace(/window\.addEventListener\s*\([^)]*\)\s*{[\s\S]*?}\s*\)?\s*;/g, "// event listener removed");
    code = code.replace(/document\.addEventListener\s*\([^)]*\)\s*{[\s\S]*?}\s*\)?\s*;/g, "// event listener removed");
    
    // Ekspos fungsi ke global dengan cara yang benar
    const moduleExports = {};
    const require = () => ({});
    const exports = moduleExports;
    const module = { exports: moduleExports };
    
    // Jalankan kode dalam scope terisolasi
    const vm = require('vm');
    const script = new vm.Script(code);
    const context = vm.createContext({
      console: global.console,
      window: global.window,
      document: global.document,
      sessionStorage: global.sessionStorage,
      location: global.location,
      alert: global.alert,
      confirm: global.confirm,
      getComputedStyle: global.getComputedStyle,
      Math: Math,
      JSON: JSON,
      Date: Date,
      parseFloat: parseFloat,
      parseInt: parseInt,
      isNaN: isNaN,
      Number: Number,
      String: String,
      Object: Object,
      Array: Array,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      Promise: Promise,
      Error: Error,
      require: require,
      exports: exports,
      module: module
    });
    
    script.runInContext(context);
    
    // Ekspos fungsi-fungsi penting dari window ke global
    for (const key in global.window) {
      if (typeof global.window[key] === 'function') {
        global[key] = global.window[key];
      }
    }
    
    // Juga ekspos dari module.exports jika ada
    if (module.exports) {
      for (const key in module.exports) {
        if (typeof module.exports[key] === 'function') {
          global[key] = module.exports[key];
          global.window[key] = module.exports[key];
        }
      }
    }
    
    console.log(`✅ ${moduleName} berhasil dimuat`);
    return true;
  } catch (error) {
    console.log(`❌ Gagal memuat ${moduleName}:`, error.message);
    return false;
  }
}

// Load modul utama
loadModule("calc-balok.js", /window\.location\.href = 'report\.html';/);
loadModule("calc-kolom.js", /window\.location\.href = 'report\.html';/);
loadModule("calc-pelat.js", /window\.location\.href = 'report\.html';/);
loadModule("calc-fondasi.js", /window\.location\.href = 'report\.html';/);

// Load optimizer jika ada
let optimizerBalokFound = false;
let optimizerKolomFound = false;
let optimizerFondasiFound = false;

try {
  console.log("📥 Mencoba memuat optimizer-balok.js...");
  let optimizerBalokCode = fs.readFileSync(path.join(__dirname, "optimizer-balok.js"), "utf8");
  // Gunakan vm untuk mengeksekusi optimizer
  const vm = require('vm');
  const script = new vm.Script(optimizerBalokCode);
  const context = vm.createContext({
    console: global.console,
    window: global.window,
    document: global.document,
    sessionStorage: global.sessionStorage,
    location: global.location,
    alert: global.alert,
    Math: Math,
    JSON: JSON,
    Date: Date
  });
  script.runInContext(context);
  optimizerBalokFound = true;
  console.log("✅ optimizer-balok.js berhasil dimuat");
} catch (error) {
  console.log("⚠️  optimizer-balok.js tidak ditemukan:", error.message);
}

// TAMBAHKAN: LOAD OPTIMIZER KOLOM
try {
  console.log("📥 Mencoba memuat optimizer-kolom.js...");
  let optimizerKolomCode = fs.readFileSync(path.join(__dirname, "optimizer-kolom.js"), "utf8");
  const vm = require('vm');
  const script = new vm.Script(optimizerKolomCode);
  const context = vm.createContext({
    console: global.console,
    window: global.window,
    document: global.document,
    sessionStorage: global.sessionStorage,
    location: global.location,
    alert: global.alert,
    Math: Math,
    JSON: JSON,
    Date: Date
  });
  script.runInContext(context);
  optimizerKolomFound = true;
  console.log("✅ optimizer-kolom.js berhasil dimuat");
} catch (error) {
  console.log("⚠️  optimizer-kolom.js tidak ditemukan:", error.message);
}

try {
  console.log("📥 Mencoba memuat optimizer-fondasi.js...");
  let optimizerFondasiCode = fs.readFileSync(path.join(__dirname, "optimizer-fondasi.js"), "utf8");
  const vm = require('vm');
  const script = new vm.Script(optimizerFondasiCode);
  const context = vm.createContext({
    console: global.console,
    window: global.window,
    document: global.document,
    sessionStorage: global.sessionStorage,
    location: global.location,
    alert: global.alert,
    Math: Math,
    JSON: JSON,
    Date: Date
  });
  script.runInContext(context);
  optimizerFondasiFound = true;
  console.log("✅ optimizer-fondasi.js berhasil dimuat");
} catch (error) {
  console.log("⚠️  optimizer-fondasi.js tidak ditemukan:", error.message);
}

// ------------------------------------------------------
// PERBAIKAN KRITIS: Load fungsi dari calc-kolom.js dengan require yang benar
// ------------------------------------------------------
console.log("🔧 Setup khusus untuk fungsi kolom...");

// Fungsi untuk memuat calc-kolom.js dengan benar
function loadKolomFunctions() {
  try {
    // Baca file calc-kolom.js
    const kolomCode = fs.readFileSync(path.join(__dirname, "calc-kolom.js"), "utf8");
    
    // Ekstrak kode yang diperlukan (hanya fungsi-fungsi penting)
    const functionNames = [
      'calculateKolom',
      'calculateKolomWithRedirect',
      'parseNewSessionData',
      'displaySessionSummary',
      'getReportDataEnhanced'
    ];
    
    // Buat wrapper untuk mengeksekusi kode dengan benar
    const wrapper = `
      (function() {
        // Definisikan semua fungsi utility yang dibutuhkan oleh calc-kolom.js
        function ceil5(x){ return Math.ceil(x/5)*5 }
        function floor5(x){ return Math.floor(x/5)*5 }
        function toNum(v, def=0){ const n=parseFloat(v); return Number.isFinite(n)?n:def }
        function safeDiv(a,b,def=0){ return b===0?def:a/b }
        function clamp(v, minV, maxV){ return Math.max(minV, Math.min(maxV, v)); }
        
        // Ekspos ke global/window
        window.ceil5 = ceil5;
        window.floor5 = floor5;
        window.toNum = toNum;
        window.safeDiv = safeDiv;
        window.clamp = clamp;
        
        // Eksekusi kode utama calc-kolom.js
        ${kolomCode}
        
        // Return fungsi yang diekspos
        return {
          calculateKolom: window.calculateKolom,
          calculateKolomWithRedirect: window.calculateKolomWithRedirect,
          parseNewSessionData: window.parseNewSessionData,
          displaySessionSummary: window.displaySessionSummary,
          getReportDataEnhanced: window.getReportDataEnhanced
        };
      })()
    `;
    
    const vm = require('vm');
    const script = new vm.Script(wrapper);
    const context = vm.createContext({
      console: console,
      window: global.window,
      Math: Math,
      JSON: JSON,
      Date: Date,
      parseFloat: parseFloat,
      parseInt: parseInt,
      Number: Number,
      String: String,
      Object: Object,
      Array: Array
    });
    
    const result = script.runInContext(context);
    
    // Ekspos fungsi ke global
    for (const key in result) {
      if (typeof result[key] === 'function') {
        global[key] = result[key];
        global.window[key] = result[key];
      }
    }
    
    console.log("✅ Fungsi kolom berhasil dimuat dengan benar");
    return true;
  } catch (error) {
    console.error("❌ Gagal memuat fungsi kolom:", error.message);
    return false;
  }
}

// Panggil fungsi untuk memuat kolom
loadKolomFunctions();

// ------------------------------------------------------
// MOCK OPTIMIZER UNTUK TESTING DI NODE.JS (FALLBACK)
// ------------------------------------------------------
console.log("🔧 Setup mock optimizer untuk testing...");

// Mock optimizeKolom jika tidak ditemukan
if (typeof window.optimizeKolom === 'undefined') {
  window.optimizeKolom = async function(inputData) {
    console.log("🧪 MOCK OPTIMIZER KOLOM: Memproses input...");
    
    // Simulasi proses optimasi
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return kombinasi optimal dengan nilai MENCOLOK untuk kolom
    return {
      status: "sukses",
      D_opt: 29,
      phi_opt: 10,
      d_tul: 29,
      phi_tul: 10,
      mode: "desain",
      data: {
        parsedInput: inputData,
        Dimensi: {
          m: 5,
          phi1: 0.9,
          phi2: 0.75,
          Sn: 60,
          ds1: 62,
          ds2: 89,
          ds: 100,
          d: 600,
          beta1: 0.85
        },
        D: 29,
        phi: 10,
        d: 600,
        ds: 100,
        m: 5,
        hasilTulangan: {
          kondisi: 'ab > ac > at1',
          faktorPhi: 0.65,
          e: 541.67,
          ab: 300,
          ac: 150,
          ab1: 450,
          ab2: 225,
          at1: 50,
          at2: 25,
          A1: 1000,
          A2: 1000,
          As_tu: 2000,
          Ast_u: 2000,
          Ast_satu: 660.52,
          Ast_i: 7926.24,
          n: 12,
          rho: 1.89,
          n_terpakai: 12,
          n_max: 10,
          status: 'AMAN',
          K: 0.15,
          Kmaks: 0.3,
          K_melebihi_Kmaks: false,
          kondisiAktif: 'ab > ac > at1',
          ap1: 100,
          ap2: 200,
          ap3: 50,
          R1: -400,
          R2: 120000,
          R3: -9000000,
          R4: -300,
          R5: 80000,
          R6: -6000000,
          R7: 50,
          R8: -20000,
          R9: 300000,
          a_cubic: 150,
          a_flexure: 120,
          As1: 1500,
          As2: 1400,
          persamaan: "A1 = A2 = a * (Pu * 1000 / phi1 - 0.85 * fc * a * b) / ((600 + fy) * a - 600 * beta1 * d)",
          Pu_phi: 840,
          beta1: 0.85,
          minimum_diterapkan: false,
          minimum_detail: {}
        },
        begel: {
          Vc_phi: 150.25,
          Vs: 124.04,
          Vs_max: 300.5,
          warning: 'AMAN',
          Avu1: 150,
          Avu2: 175,
          Avu3: 200,
          Av_u: 200,
          s: 150,
          Av_terpakai: 210
        },
        kontrol: {
          lentur: {
            ok: true,
            Ast_ok: true,
            rho_ok: true,
            n_ok: true,
            K_ok: true,
            detail: {
              Ast_i: 7926.24,
              Ast_u: 2000,
              rho: 1.89,
              rho_min: 1.0,
              n: 12,
              n_min: 4,
              n_max: 10,
              K: 0.15,
              Kmaks: 0.3,
              K_melebihi_Kmaks: false
            }
          },
          geser: {
            ok: true,
            Vs_ok: true,
            Av_ok: true,
            detail: {
              Vs: 124.04,
              Vs_max: 300.5,
              Av_terpakai: 210,
              Av_u: 200
            }
          }
        },
        aman: true
      },
      kontrol: {
        lentur: {
          ok: true,
          Ast_ok: true,
          rho_ok: true,
          n_ok: true,
          K_ok: true
        },
        geser: {
          ok: true,
          Vs_ok: true,
          Av_ok: true
        }
      },
      rekap: {
        input: inputData,
        Dimensi: {
          m: 5,
          phi1: 0.9,
          phi2: 0.75,
          Sn: 60,
          ds1: 62,
          ds2: 89,
          ds: 100,
          d: 600,
          beta1: 0.85
        },
        tulangan: {
          D: 29,
          phi: 10,
          Ast_satu: 660.52,
          Ast_i: 7926.24,
          Ast_u: 2000,
          n_calculated: 12,
          n_terpakai: 12,
          rho: 1.89,
          status_n: 'AMAN',
          e: 541.67,
          Pu: 1200,
          Mu: 650,
          Pu_phi: 840,
          K: 0.15,
          Kmaks: 0.3,
          K_ok: true
        },
        begel: {
          s: 150,
          Av_u: 200,
          Av_terpakai: 210,
          Vs: 124.04,
          Vs_max: 300.5,
          warning: 'AMAN'
        },
        kontrol: {
          lentur: { ok: true },
          geser: { ok: true }
        },
        formatted: {
          tulangan_utama: "12D29",
          begel: "Φ10-150",
          e: "541.67 mm",
          Pu_vs_Pu_phi: "P<sub>u</sub> = 1200.00 kN vs P<sub>u</sub>∅ = 840.00 kN",
          K: "K = 0.1500 ≤ Kmaks = 0.3000",
          minimum_info: "Tidak ada minimum yang diterapkan"
        }
      },
      optimasi: {
        kombinasi_terbaik: {
          D: 29,
          phi: 10,
          d_tul: 29,
          phi_tul: 10,
          n: 12,
          s: 150
        },
        skor: 8950.25,
        total_kombinasi: 81,
        kombinasi_valid: 15,
        minimum_diterapkan: false,
        minimum_detail: {},
        catatan: "⚠️ INI HASIL MOCK OPTIMIZER KOLOM - BUKAN HASIL SEBENARNYA!"
      }
    };
  };
  console.log("✅ Mock optimizeKolom berhasil dibuat (fallback)");
} else {
  console.log("✅ optimizeKolom sudah tersedia dari optimizer-kolom.js");
}

// Mock optimizePelat untuk testing
if (typeof window.optimizePelat === 'undefined') {
  window.optimizePelat = async function(inputData) {
    console.log("🧪 MOCK OPTIMIZER PELAT: Memproses input...");
    
    const { parsed } = inputData;
    const isPelat = parsed?.module === "pelat";
    
    // Simulasi proses optimasi
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (isPelat) {
      // Untuk pelat, return kombinasi optimal dengan nilai MENCOLOK
      return {
        status: "sukses",
        D_opt: 777,
        db_opt: 666,
        mode: "desain",
        data: {
          tulangan: {
            pokokX: { 
              sDigunakan: 777,
              AsTerpasang: 7777,
              AsDigunakan: 7777
            },
            pokokY: { 
              sDigunakan: 777,
              AsTerpasang: 7777,
              AsDigunakan: 7777
            },
            bagiX: { 
              sDigunakan: 666,
              AsbTerpasang: 6666,
              AsbDigunakan: 6666
            },
            bagiY: { 
              sDigunakan: 666,
              AsbTerpasang: 6666,
              AsbDigunakan: 6666
            }
          }
        },
        kontrol: {
          lentur: { 
            ok: true,
            arahX: { K_aman: true, Md_aman: true, As_terpasang_aman: true },
            arahY: { K_aman: true, Md_aman: true, As_terpasang_aman: true }
          },
          bagi: { 
            ok: true,
            arahX: { As_aman: true, As_terpasang_aman: true },
            arahY: { As_aman: true, As_terpasang_aman: true }
          }
        },
        rekap: {
          formatted: {
            tulangan_pokok_x: "D777-777",
            tulangan_pokok_y: "D777-777",
            tulangan_bagi_x: "D666-666",
            tulangan_bagi_y: "D666-666",
            jenis_pelat: "Pelat Dua Arah - MOCK OPTIMIZER"
          },
          tulangan: {
            pokokX: { AsDigunakan: 7777, sDigunakan: 777 },
            pokokY: { AsDigunakan: 7777, sDigunakan: 777 },
            bagiX: { AsbDigunakan: 6666, sDigunakan: 666 },
            bagiY: { AsbDigunakan: 6666, sDigunakan: 666 }
          }
        },
        optimasi: {
          status: "mock_pelat",
          catatan: "INI HASIL MOCK OPTIMIZER PELAT - BUKAN HASIL SEBENARNYA"
        }
      };
    } else {
      // Untuk modul lain
      return {
        status: "sukses",
        data: {},
        kontrol: { ok: true },
        rekap: {},
        optimasi: {
          status: "mock_generic",
          catatan: "INI HASIL MOCK OPTIMIZER GENERIC"
        }
      };
    }
  };
  console.log("✅ Mock optimizePelat berhasil dibuat");
}

// Mock optimizeDesain untuk kompatibilitas
if (typeof window.optimizeDesain === 'undefined') {
  window.optimizeDesain = window.optimizePelat;
  console.log("✅ Mock optimizeDesain berhasil dibuat");
}

// Mock optimizeFondasi dengan nilai yang sangat mencolok
if (typeof window.optimizeFondasi === 'undefined') {
  window.optimizeFondasi = async function(inputData) {
    console.log("🧪 MOCK OPTIMIZER FONDASI: Memproses input...");
    
    // Simulasi proses optimasi
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Return kombinasi optimal dengan nilai SANGAT MENCOLOK
    return {
      status: "sukses",
      mode: "desain",
      module: "fondasi",
      data: {
        tulangan: {
          jenis: "persegi_panjang_mock",
          bujur: {
            sigma: 999,
            Mu: 999,
            K: 0.9,
            Kontrol_K: "AMAN",
            As: 9999,
            s: 999
          },
          persegi: {
            Mu: 999,
            K: 0.9,
            Kontrol_K: "AMAN",
            As: 9999,
            Aspusat: 9999,
            s_pusat: 999,
            Astepi: 9999,
            s_tepi: 999
          }
        }
      },
      kontrol: {
        dayaDukung: { aman: true },
        geser: { aman1: true, aman2: true },
        tulangan: { aman: true },
        kuatDukung: { aman: true }
      },
      rekap: {
        tulangan_panjang: "ɸ19-999",
        tulangan_pendek_pusat: "ɸ16-999",
        tulangan_pendek_tepi: "ɸ16-999"
      },
      optimasi: {
        kombinasi_terbaik: {
          Lx: 9.99,
          Ly: 9.99,
          D: 999,
          Db: 888,
          d: 999,
          db: 888
        },
        skor: 999.99,
        totalAs: 99999,
        total_kombinasi: 99,
        kombinasi_valid: 99,
        autoDimensi: false,
        catatan: "⚠️ INI HASIL MOCK OPTIMIZER FONDASI - BUKAN HASIL SEBENARNYA!"
      }
    };
  };
  console.log("✅ Mock optimizeFondasi berhasil dibuat");
}

// ------------------------------------------------------
// Import data test dari file terpisah
// ------------------------------------------------------
console.log("📥 Memuat data test...");
try {
  const testData = require('./test-inputs.js');
  console.log("✅ Data test berhasil dimuat");
  
  // Export data ke global scope
  global.testData = testData;
  Object.assign(global, testData);
} catch (error) {
  console.log("❌ Gagal memuat data test:", error.message);
  console.log("⚠️  Membuat data test minimal...");
  
  // Data minimal sebagai fallback
  global.dataBalokDesain = {
    "module": "balok",
    "mode": "desain",
    "dimensi": { "h": "400", "b": "250", "sb": "40" },
    "beban": {
      "left": { "mu_pos": "36.49", "mu_neg": "94", "vu": "100", "tu": "20" },
      "center": { "mu_pos": "40.65", "mu_neg": "0", "vu": "100", "tu": "20" },
      "right": { "mu_pos": "65.92", "mu_neg": "110.03", "vu": "100", "tu": "20" }
    },
    "material": { "fc": "20", "fy": "300", "fyt": "300" },
    "lanjutan": { "lambda": "1", "n": "2" }
  };
  
  global.dataKolomDesain = {
    "module": "kolom",
    "mode": "desain",
    "dimensi": { "h": "700", "b": "600", "sb": "40" },
    "beban": { "pu": "1200", "mu": "650", "vu": "274.29" },
    "material": { "fc": "20", "fy": "300", "fyt": "300" },
    "lanjutan": { "lambda": "1", "n_kaki": "2" },
    "tulangan": {}
  };
  
  global.dataKolomEvaluasi = {
    "module": "kolom",
    "mode": "evaluasi",
    "dimensi": { "h": "700", "b": "600", "sb": "40" },
    "beban": { "pu": "1200", "mu": "650", "vu": "274.29" },
    "material": { "fc": "20", "fy": "300", "fyt": "300" },
    "lanjutan": { "lambda": "1", "n_kaki": "2" },
    "tulangan": { "d_tul": "29", "phi_tul": "10", "n_tul": "12", "s_tul": "150" }
  };
}

// ------------------------------------------------------
// Fungsi utility untuk temporary directory
// ------------------------------------------------------
function getTempDir() {
  const tempDir = os.tmpdir();
  const testDir = path.join(tempDir, 'unified-test-results');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  return testDir;
}

function generateSimpleId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function cleanupOldTempFiles(maxAgeHours = 24) {
  const tempDir = getTempDir();
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  
  try {
    const files = fs.readdirSync(tempDir);
    let cleanedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtime.getTime();
      
      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 Dibersihkan ${cleanedCount} file temporary lama`);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

// ------------------------------------------------------
// FUNGSI RUN TEST KOLOM YANG DIPERBAIKI
// ------------------------------------------------------
async function runTestKolom(label, inputData) {
  console.log("\n" + "=".repeat(100));
  console.log(`🚀 TEST KOLOM - MODE: ${label}`);
  console.log("=".repeat(100));

  try {
    // Gunakan fungsi calculateKolom dari global/window
    let calculateKolomFunc;
    
    // Cek apakah fungsi tersedia di global
    if (typeof global.calculateKolom === 'function') {
      calculateKolomFunc = global.calculateKolom;
      console.log("✅ Menggunakan calculateKolom dari global");
    } else if (typeof window.calculateKolom === 'function') {
      calculateKolomFunc = window.calculateKolom;
      console.log("✅ Menggunakan calculateKolom dari window");
    } else {
      // Coba muat ulang fungsi kolom
      console.log("⚠️  calculateKolom tidak ditemukan, mencoba muat ulang...");
      loadKolomFunctions();
      
      if (typeof global.calculateKolom === 'function') {
        calculateKolomFunc = global.calculateKolom;
        console.log("✅ calculateKolom berhasil dimuat ulang");
      } else {
        throw new Error("Fungsi calculateKolom tidak tersedia");
      }
    }

    // Jalankan perhitungan
    const hasil = await calculateKolomFunc(inputData);

    console.log("\n📥 INPUT DATA:");
    console.log(JSON.stringify(inputData, null, 2));

    console.log("\n🎯 HASIL PERHITUNGAN:");
    console.log(JSON.stringify(hasil, null, 2));

    return saveResults("kolom", label, inputData, hasil);
  } catch (err) {
    console.error("💥 ERROR:", err);
    console.error("💥 Stack trace:", err.stack);
    return null;
  }
}

// ------------------------------------------------------
// Fungsi untuk menampilkan detail hasil dengan penanda OPTIMIZER
// ------------------------------------------------------
function displayOptimizerStatus(hasil, module) {
  console.log("\n" + "🎯".repeat(30));
  console.log("🔍 STATUS OPTIMIZER:");
  console.log("🎯".repeat(30));
  
  if (hasil.optimasi) {
    console.log("✅ OPTIMIZER DIGUNAKAN");
    
    if (hasil.optimasi.catatan) {
      console.log(`📝 Catatan: ${hasil.optimasi.catatan}`);
    }
    
    if (hasil.optimasi.kombinasi_terbaik) {
      console.log("🏆 Kombinasi Terbaik:");
      const optimal = hasil.optimasi.kombinasi_terbaik;
      console.log(`   - D: ${optimal.D} mm`);
      console.log(`   - Db: ${optimal.Db} mm`);
      if (optimal.Lx) console.log(`   - Lx: ${optimal.Lx} m`);
      if (optimal.Ly) console.log(`   - Ly: ${optimal.Ly} m`);
    }
    
    if (hasil.optimasi.status === "mock_pelat" || hasil.optimasi.status === "mock_fondasi") {
      console.log("⚠️  ⚠️  ⚠️  PERINGATAN: INI HASIL MOCK OPTIMIZER!");
      console.log("⚠️  Nilai-nilai mencolok (777, 666, 999, dll) menandakan optimizer tidak berjalan dengan benar!");
    }
  } else {
    console.log("❌ OPTIMIZER TIDAK DIGUNAKAN");
    console.log("ℹ️  Perhitungan menggunakan metode biasa tanpa optimasi");
  }
  
  console.log("🎯".repeat(30));
}

// ------------------------------------------------------
// Fungsi test untuk setiap modul
// ------------------------------------------------------
async function runTestBalok(label, inputData) {
  console.log("\n" + "=".repeat(100));
  console.log(`🚀 TEST BALOK - MODE: ${label}`);
  console.log("=".repeat(100));

  console.log("🔍 Status Optimizer Balok:", optimizerBalokFound ? "✅ TERSEDIA" : "❌ TIDAK TERSEDIA");

  try {
    const hasil = await calculateBalok(inputData);

    console.log("\n📥 INPUT DATA:");
    console.log(JSON.stringify(inputData, null, 2));

    console.log("\n🎯 HASIL PERHITUNGAN:");
    console.log(JSON.stringify(hasil, null, 2));

    // Tampilkan status optimizer
    displayOptimizerStatus(hasil, "balok");

    return saveResults("balok", label, inputData, hasil);
  } catch (err) {
    console.error("💥 ERROR:", err);
    console.error("💥 Stack trace:", err.stack);
    return null;
  }
}

async function runTestPelat(label, inputData) {
  console.log("\n" + "=".repeat(100));
  console.log(`🚀 TEST PELAT - MODE: ${label}`);
  console.log("=".repeat(100));

  console.log("🔍 Status Optimizer Pelat:", typeof window.optimizePelat === 'function' ? "✅ TERSEDIA" : "❌ TIDAK TERSEDIA");

  try {
    const hasil = await calculatePelat(inputData);

    console.log("\n📥 INPUT DATA:");
    console.log(JSON.stringify(inputData, null, 2));

    console.log("\n🎯 HASIL PERHITUNGAN:");
    console.log(JSON.stringify(hasil, null, 2));

    // Tampilkan status optimizer
    displayOptimizerStatus(hasil, "pelat");

    return saveResults("pelat", label, inputData, hasil);
  } catch (err) {
    console.error("💥 ERROR:", err);
    console.error("💥 Stack trace:", err.stack);
    return null;
  }
}

async function runTestFondasi(label, inputData) {
  console.log("\n" + "=".repeat(100));
  console.log(`🚀 TEST FONDASI - MODE: ${label}`);
  console.log("=".repeat(100));

  console.log("🔍 Status Optimizer Fondasi:", optimizerFondasiFound ? "✅ TERSEDIA" : "❌ TIDAK TERSEDIA");

  try {
    const hasil = await calculateFondasi(inputData);

    console.log("\n📥 INPUT DATA:");
    console.log(JSON.stringify(inputData, null, 2));

    console.log("\n🎯 HASIL PERHITUNGAN:");
    console.log(JSON.stringify(hasil, null, 2));

    // Tampilkan status optimizer
    displayOptimizerStatus(hasil, "fondasi");

    return saveResults("fondasi", label, inputData, hasil);
  } catch (err) {
    console.error("💥 ERROR:", err);
    console.error("💥 Stack trace:", err.stack);
    return null;
  }
}

// ------------------------------------------------------
// Fungsi penyimpanan hasil
// ------------------------------------------------------
function saveResults(module, label, inputData, hasil) {
  const tempDir = getTempDir();
  const uniqueId = generateSimpleId();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fname = `hasil_${module}_${label}_${timestamp}_${uniqueId}.json`;
  const fullPath = path.join(tempDir, fname);

  const output = {
    timestamp: new Date().toISOString(),
    module: module,
    mode: label,
    input: inputData,
    output: hasil,
    optimizer_status: {
      balok: optimizerBalokFound,
      kolom: optimizerKolomFound,
      fondasi: optimizerFondasiFound,
      pelat: typeof window.optimizePelat === 'function'
    }
  };

  fs.writeFileSync(fullPath, JSON.stringify(output, null, 2));

  console.log(`💾 File hasil disimpan di temporary directory: ${fullPath}`);
  return { ...hasil, tempFilePath: fullPath };
}

// ------------------------------------------------------
// Menu interaktif
// ------------------------------------------------------
async function showMainMenu() {
  console.log("\n" + "=".repeat(80));
  console.log("🏗️  TESTER TERPADU STRUKTUR BETON - DENGAN MONITORING OPTIMIZER");
  console.log("=".repeat(80));
  
  console.log("🎯 STATUS OPTIMIZER:");
  console.log(`   Balok: ${optimizerBalokFound ? '✅' : '❌'} | Kolom: ${optimizerKolomFound ? '✅' : '❌'}`);
  console.log(`   Fondasi: ${optimizerFondasiFound ? '✅' : '❌'} | Pelat: ${typeof window.optimizePelat === 'function' ? '✅' : '❌'}`);
  
  console.log("\n📋 PILIH MODUL:");
  console.log("1. Balok");
  console.log("2. Kolom");
  console.log("3. Pelat");
  console.log("4. Fondasi");
  console.log("5. Semua Modul (Test Ringkas)");
  console.log("6. Test Optimizer Manual");
  console.log("7. Info Temporary Directory & Optimizer");
  console.log("8. Keluar");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question("Pilih modul (1-8): ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function showSubMenu(moduleName) {
  console.log(`\n📋 MODE TEST UNTUK ${moduleName.toUpperCase()}:`);
  
  if (moduleName === "pelat") {
    console.log("1. Desain Auto Beban");
    console.log("2. Desain Manual Beban");
    console.log("3. Evaluasi Auto Beban");
    console.log("4. Evaluasi Manual Beban");
    console.log("5. Semua Mode Pelat");
    console.log("6. Kembali ke menu utama");
  } else if (moduleName === "fondasi") {
    console.log("📋 MODE FONDASI:");
    console.log("A. DESAIN");
    console.log("  1. Bujur Sangkar");
    console.log("  2. Persegi Panjang");
    console.log("  3. Menerus");
    console.log("B. EVALUASI");
    console.log("  4. Bujur Sangkar");
    console.log("  5. Persegi Panjang");
    console.log("  6. Menerus");
    console.log("C. SEMUA MODE FONDASI");
    console.log("  7. Semua (6 test)");
    console.log("D. KEMBALI KE MENU UTAMA");
    console.log("  8. Kembali");
  } else {
    console.log("1. Desain");
    console.log("2. Evaluasi");
    console.log("3. Keduanya");
    console.log("4. Kembali ke menu utama");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question("Pilih mode (1-8): ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ------------------------------------------------------
// Fungsi utama
// ------------------------------------------------------
async function main() {
  // Bersihkan file temporary lama
  cleanupOldTempFiles();

  let exit = false;
  
  while (!exit) {
    const mainChoice = await showMainMenu();
    
    switch (mainChoice) {
      case '1': // Balok
        await handleBalokTests();
        break;
      case '2': // Kolom
        await handleKolomTests();
        break;
      case '3': // Pelat
        await handlePelatTests();
        break;
      case '4': // Fondasi
        await handleFondasiTests();
        break;
      case '5': // Semua Modul
        await runAllTests();
        break;
      case '6': // Test Optimizer Manual
        await testOptimizerManual();
        break;
      case '7': // Info Temporary Directory & Optimizer
        const tempDir = getTempDir();
        console.log(`\n📁 Temporary directory: ${tempDir}`);
        console.log(`🔄 File di folder ini akan dibersihkan otomatis`);
        console.log("\n🎯 STATUS OPTIMIZER DETAIL:");
        console.log(`   - Optimizer Balok: ${optimizerBalokFound ? '✅ LOADED' : '❌ NOT FOUND'}`);
        console.log(`   - Optimizer Kolom: ${optimizerKolomFound ? '✅ LOADED' : '❌ NOT FOUND'}`);
        console.log(`   - Optimizer Fondasi: ${optimizerFondasiFound ? '✅ LOADED' : '❌ NOT FOUND'}`);
        console.log(`   - Optimizer Pelat: ${typeof window.optimizePelat === 'function' ? '✅ LOADED' : '❌ NOT FOUND'}`);
        
        if (!optimizerFondasiFound) {
          console.log("\n🚨 PERINGATAN: Optimizer Fondasi tidak ditemukan!");
          console.log("🚨 Hasil fondasi mode desain akan menggunakan MOCK dengan nilai 999/888!");
        }
        
        if (!optimizerKolomFound) {
          console.log("\n🚨 PERINGATAN: Optimizer Kolom tidak ditemukan!");
          console.log("🚨 Hasil kolom mode desain akan menggunakan MOCK dengan nilai D29 φ10!");
        }
        break;
      case '8': // Keluar
        exit = true;
        console.log("👋 Terima kasih telah menggunakan tester terpadu!");
        break;
      default:
        console.log("❌ Pilihan tidak valid!");
    }
  }
}

async function handleBalokTests() {
  const subChoice = await showSubMenu("balok");
  
  switch (subChoice) {
    case '1': // Desain
      console.log(`🔧 Mode desain - Optimizer: ${optimizerBalokFound ? 'AKTIF' : 'MOCK'}`);
      await runTestBalok("desain", dataBalokDesain);
      break;
    case '2': // Evaluasi
      await runTestBalok("evaluasi", dataBalokEvaluasi);
      break;
    case '3': // Keduanya
      console.log(`🔧 Mode desain - Optimizer: ${optimizerBalokFound ? 'AKTIF' : 'MOCK'}`);
      await runTestBalok("desain", dataBalokDesain);
      await runTestBalok("evaluasi", dataBalokEvaluasi);
      break;
    case '4': // Kembali
      return;
    default:
      console.log("❌ Pilihan tidak valid!");
  }
}

async function handleKolomTests() {
  const subChoice = await showSubMenu("kolom");
  
  switch (subChoice) {
    case '1': // Desain
      console.log(`🔧 Mode desain - Optimizer: ${optimizerKolomFound ? 'AKTIF' : 'MOCK'}`);
      await runTestKolom("desain", dataKolomDesain);
      break;
    case '2': // Evaluasi
      await runTestKolom("evaluasi", dataKolomEvaluasi);
      break;
    case '3': // Keduanya
      console.log(`🔧 Mode desain - Optimizer: ${optimizerKolomFound ? 'AKTIF' : 'MOCK'}`);
      await runTestKolom("desain", dataKolomDesain);
      await runTestKolom("evaluasi", dataKolomEvaluasi);
      break;
    case '4': // Kembali
      return;
    default:
      console.log("❌ Pilihan tidak valid!");
  }
}

async function handlePelatTests() {
  const subChoice = await showSubMenu("pelat");
  
  const optimizerPelatStatus = typeof window.optimizePelat === 'function';
  
  switch (subChoice) {
    case '1': // Desain Auto Beban
      console.log(`🔧 Mode desain - Optimizer: ${optimizerPelatStatus ? 'AKTIF' : 'MOCK'}`);
      await runTestPelat("desain_auto", dataPelatDesainAuto);
      break;
    case '2': // Desain Manual Beban
      console.log(`🔧 Mode desain - Optimizer: ${optimizerPelatStatus ? 'AKTIF' : 'MOCK'}`);
      await runTestPelat("desain_manual", dataPelatDesainManual);
      break;
    case '3': // Evaluasi Auto Beban
      await runTestPelat("evaluasi_auto", dataPelatEvaluasiAuto);
      break;
    case '4': // Evaluasi Manual Beban
      await runTestPelat("evaluasi_manual", dataPelatEvaluasiManual);
      break;
    case '5': // Semua Mode Pelat
      console.log(`🔧 Mode desain - Optimizer: ${optimizerPelatStatus ? 'AKTIF' : 'MOCK'}`);
      await runTestPelat("desain_auto", dataPelatDesainAuto);
      await runTestPelat("desain_manual", dataPelatDesainManual);
      await runTestPelat("evaluasi_auto", dataPelatEvaluasiAuto);
      await runTestPelat("evaluasi_manual", dataPelatEvaluasiManual);
      break;
    case '6': // Kembali
      return;
    default:
      console.log("❌ Pilihan tidak valid!");
  }
}

async function handleFondasiTests() {
  const subChoice = await showSubMenu("fondasi");
  
  switch (subChoice) {
    case '1': // Desain Bujur Sangkar
      console.log(`🔧 Mode desain bujur sangkar - Optimizer: ${optimizerFondasiFound ? 'AKTIF' : 'MOCK'}`);
      await runTestFondasi("bujur_sangkar_desain", dataFondasiBujurSangkarDesain);
      break;
    case '2': // Desain Persegi Panjang
      console.log(`🔧 Mode desain persegi panjang - Optimizer: ${optimizerFondasiFound ? 'AKTIF' : 'MOCK'}`);
      await runTestFondasi("persegi_panjang_desain", dataFondasiPersegiPanjangDesain);
      break;
    case '3': // Desain Menerus
      console.log(`🔧 Mode desain menerus - Optimizer: ${optimizerFondasiFound ? 'AKTIF' : 'MOCK'}`);
      await runTestFondasi("menerus_desain", dataFondasiMenerusDesain);
      break;
    case '4': // Evaluasi Bujur Sangkar
      await runTestFondasi("bujur_sangkar_evaluasi", dataFondasiBujurSangkarEvaluasi);
      break;
    case '5': // Evaluasi Persegi Panjang
      await runTestFondasi("persegi_panjang_evaluasi", dataFondasiPersegiPanjangEvaluasi);
      break;
    case '6': // Evaluasi Menerus
      await runTestFondasi("menerus_evaluasi", dataFondasiMenerusEvaluasi);
      break;
    case '7': // Semua Mode Fondasi
      console.log(`🔧 Semua mode fondasi - Optimizer: ${optimizerFondasiFound ? 'AKTIF' : 'MOCK'}`);
      await runTestFondasi("bujur_sangkar_desain", dataFondasiBujurSangkarDesain);
      await runTestFondasi("persegi_panjang_desain", dataFondasiPersegiPanjangDesain);
      await runTestFondasi("menerus_desain", dataFondasiMenerusDesain);
      await runTestFondasi("bujur_sangkar_evaluasi", dataFondasiBujurSangkarEvaluasi);
      await runTestFondasi("persegi_panjang_evaluasi", dataFondasiPersegiPanjangEvaluasi);
      await runTestFondasi("menerus_evaluasi", dataFondasiMenerusEvaluasi);
      break;
    case '8': // Kembali
      return;
    default:
      console.log("❌ Pilihan tidak valid!");
  }
}

async function testOptimizerManual() {
  console.log("\n🧪 TEST OPTIMIZER MANUAL...");
  
  console.log("🎯 STATUS OPTIMIZER:");
  console.log(`   - optimizeKolom: ${typeof window.optimizeKolom === 'function' ? '✅' : '❌'}`);
  console.log(`   - optimizeFondasi: ${typeof window.optimizeFondasi === 'function' ? '✅' : '❌'}`);
  console.log(`   - optimizePelat: ${typeof window.optimizePelat === 'function' ? '✅' : '❌'}`);
  console.log(`   - optimizeDesain: ${typeof window.optimizeDesain === 'function' ? '✅' : '❌'}`);
  
  const testData = {
    parsed: {
      module: "kolom",
      mode: "desain",
      dimensi: { h: 700, b: 600, sb: 40 },
      beban: { Pu: 1200, Mu: 650, Vu: 274.29 },
      material: { fc: 20, fy: 300, fyt: 300 },
      lanjutan: { lambda: 1, n_kaki: 2 },
      tulangan: {}
    }
  };
  
  try {
    if (typeof window.optimizeKolom === 'function') {
      console.log("🚀 Menjalankan optimizer kolom...");
      const result = await window.optimizeKolom(testData);
      console.log("📊 Hasil optimizer kolom:");
      console.log(JSON.stringify(result, null, 2));
      
      if (result.optimasi?.catatan?.includes("MOCK")) {
        console.log("\n🚨🚨🚨 DETECTED MOCK OPTIMIZER KOLOM!");
        console.log("🚨 Nilai-nilai menandakan optimizer tidak berjalan dengan benar!");
      }
      
      return result;
    } else {
      console.log("❌ Optimizer kolom tidak tersedia");
      return null;
    }
  } catch (error) {
    console.error("💥 Error dalam test optimizer:", error);
    return null;
  }
}

async function runAllTests() {
  console.log("\n🚀 MENJALANKAN SEMUA TEST...");
  
  console.log("🎯 STATUS OPTIMIZER:");
  console.log(`   Balok: ${optimizerBalokFound ? '✅' : '❌'} | Kolom: ${optimizerKolomFound ? '✅' : '❌'}`);
  console.log(`   Fondasi: ${optimizerFondasiFound ? '✅' : '❌'} | Pelat: ${typeof window.optimizePelat === 'function' ? '✅' : '❌'}`);
  
  // Balok
  console.log(`\n🔧 Balok - Optimizer: ${optimizerBalokFound ? 'AKTIF' : 'MOCK'}`);
  await runTestBalok("desain", dataBalokDesain);
  
  // Kolom
  console.log(`\n🔧 Kolom - Optimizer: ${optimizerKolomFound ? 'AKTIF' : 'MOCK'}`);
  await runTestKolom("desain", dataKolomDesain);
  
  // Pelat
  const optimizerPelatStatus = typeof window.optimizePelat === 'function';
  console.log(`\n🔧 Pelat - Optimizer: ${optimizerPelatStatus ? 'AKTIF' : 'MOCK'}`);
  await runTestPelat("desain_auto", dataPelatDesainAuto);
  
  // Fondasi - test representatif
  console.log(`\n🔧 Fondasi - Optimizer: ${optimizerFondasiFound ? 'AKTIF' : 'MOCK'}`);
  await runTestFondasi("persegi_panjang_desain", dataFondasiPersegiPanjangDesain);
  await runTestFondasi("persegi_panjang_evaluasi", dataFondasiPersegiPanjangEvaluasi);
}

// ------------------------------------------------------
// JALANKAN PROGRAM
// ------------------------------------------------------
if (require.main === module) {
  main().catch(console.error);
}

// Export fungsi untuk testing
module.exports = {
  runTestBalok,
  runTestKolom,
  runTestPelat,
  runTestFondasi,
  getTempDir,
  cleanupOldTempFiles,
  testOptimizerManual,
  displayOptimizerStatus,
  optimizerStatus: {
    balok: optimizerBalokFound,
    kolom: optimizerKolomFound,
    fondasi: optimizerFondasiFound,
    pelat: typeof window.optimizePelat === 'function'
  }
};