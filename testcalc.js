// [file name]: testcalc.js
// [file content begin]
// ======================================================================
// testcalc-unified.js — Tester terpadu untuk semua modul (Balok, Kolom, Pelat, Fondasi)
// ======================================================================

// ------------------------
// Mock lingkungan browser
// ------------------------
global.window = global;
global.document = {
  documentElement: { style: {} }
};
global.getComputedStyle = () => ({
  getPropertyValue: () => ''
});
global.sessionStorage = {
  store: {},
  setItem(key, val){ this.store[key] = String(val) },
  getItem(key){ return this.store[key] || null },
  removeItem(key){ delete this.store[key] }
};
global.location = { href: "" };

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// ------------------------------------------------------
// Load semua modul perhitungan
// ------------------------------------------------------
console.log("📥 Memuat semua modul perhitungan...");

// Load calc-balok.js
console.log("📥 Memuat calc-balok.js...");
let balokCode = fs.readFileSync(path.join(__dirname, "calc-balok.js"), "utf8");
balokCode = balokCode.replace(/window\.location\.href = 'report\.html';/, "// redirect disabled");
eval(balokCode);

// Load calc-kolom.js
console.log("📥 Memuat calc-kolom.js...");
let kolomCode = fs.readFileSync(path.join(__dirname, "calc-kolom.js"), "utf8");
kolomCode = kolomCode.replace(/window\.location\.href = 'report-kolom\.html';/, "// redirect disabled");
eval(kolomCode);

// Load calc-pelat.js
console.log("📥 Memuat calc-pelat.js...");
let pelatCode = fs.readFileSync(path.join(__dirname, "calc-pelat.js"), "utf8");
pelatCode = pelatCode.replace(/window\.location\.href = 'report\.html';/, "// redirect disabled");
eval(pelatCode);

// Load calc-fondasi.js
console.log("📥 Memuat calc-fondasi.js...");
try {
  let fondasiCode = fs.readFileSync(path.join(__dirname, "calc-fondasi.js"), "utf8");
  fondasiCode = fondasiCode.replace(/window\.location\.href = 'report\.html';/, "// redirect disabled");
  eval(fondasiCode);
  console.log("✅ calc-fondasi.js berhasil dimuat");
} catch (error) {
  console.log("⚠️  calc-fondasi.js tidak ditemukan:", error.message);
}

// Load optimizer jika ada
let optimizerBalokFound = false;
let optimizerFondasiFound = false;

try {
  console.log("📥 Mencoba memuat optimizer-balok.js...");
  let optimizerBalokCode = fs.readFileSync(path.join(__dirname, "optimizer-balok.js"), "utf8");
  eval(optimizerBalokCode);
  optimizerBalokFound = true;
  console.log("✅ optimizer-balok.js berhasil dimuat");
} catch (error) {
  console.log("⚠️  optimizer-balok.js tidak ditemukan:", error.message);
}

try {
  console.log("📥 Mencoba memuat optimizer-fondasi.js...");
  let optimizerFondasiCode = fs.readFileSync(path.join(__dirname, "optimizer-fondasi.js"), "utf8");
  eval(optimizerFondasiCode);
  optimizerFondasiFound = true;
  console.log("✅ optimizer-fondasi.js berhasil dimuat");
} catch (error) {
  console.log("⚠️  optimizer-fondasi.js tidak ditemukan:", error.message);
}

// ------------------------------------------------------
// MOCK OPTIMIZER UNTUK TESTING DI NODE.JS - DENGAN NILAI MENCOLOK
// ------------------------------------------------------
console.log("🔧 Setup mock optimizer untuk testing...");

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
        D_opt: 777,    // Nilai mencolok - MOCK PELAT
        db_opt: 666,   // Nilai mencolok - MOCK PELAT
        mode: "desain",
        data: {
          tulangan: {
            pokokX: { 
              sDigunakan: 777,  // Nilai mencolok
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
            s: 999  // Nilai sangat mencolok - MOCK FONDASI
          },
          persegi: {
            Mu: 999,
            K: 0.9,
            Kontrol_K: "AMAN",
            As: 9999,
            Aspusat: 9999,
            s_pusat: 999,  // Nilai sangat mencolok - MOCK FONDASI
            Astepi: 9999,
            s_tepi: 999   // Nilai sangat mencolok - MOCK FONDASI
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
// Data test untuk semua modul - DIPERBARUI SESUAI STRUKTUR BARU
// ------------------------------------------------------

// DATA BALOK - STRUKTUR DIPERBAIKI
const dataBalokDesain = {
  "module": "balok",
  "mode": "desain",
  "dimensi": {
    "h": "400",
    "b": "250", 
    "sb": "40"
  },
  "beban": {
    "left": {
      "mu_pos": "36.49",
      "mu_neg": "94",
      "vu": "100",
      "tu": "20"
    },
    "center": {
      "mu_pos": "40.65", 
      "mu_neg": "0",
      "vu": "100",
      "tu": "20"
    },
    "right": {
      "mu_pos": "65.92",
      "mu_neg": "110.03", 
      "vu": "100",
      "tu": "20"
    }
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "fyt": "300"
  },
  "lanjutan": {
    "lambda": "1",
    "n": "2"
  }
};

const dataBalokEvaluasi = {
  "module": "balok",
  "mode": "evaluasi", 
  "dimensi": {
    "h": "400",
    "b": "250",
    "sb": "40"
  },
  "beban": {
    "left": {
      "mu_pos": "36.49",
      "mu_neg": "94",
      "vu": "83.242",
      "tu": "20"
    },
    "center": {
      "mu_pos": "40.65",
      "mu_neg": "0", 
      "vu": "83.242",
      "tu": "20"
    },
    "right": {
      "mu_pos": "65.92",
      "mu_neg": "110.03",
      "vu": "83.242",
      "tu": "20"
    }
  },
  "material": {
    "fc": "20",
    "fy": "300", 
    "fyt": "300"
  },
  "lanjutan": {
    "lambda": "1",
    "n": "2"
  },
  "tulangan": {
    "d": "19",
    "phi": "6", 
    "support": {
      "n": "6",
      "np": "3",
      "nt": "4", 
      "s": "100"
    },
    "field": {
      "n": "3",
      "np": "3",
      "nt": "4",
      "s": "100"
    }
  }
};

// DATA KOLOM - STRUKTUR DIPERBAIKI
const dataKolomDesain = {
  "module": "kolom",
  "mode": "desain", 
  "dimensi": {
    "h": "700",
    "b": "600",
    "sb": "40"
  },
  "beban": {
    "pu": "1200",
    "mu": "650", 
    "vu": "274.29"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "fyt": "300"
  },
  "lanjutan": {
    "lambda": "1", 
    "n_kaki": "2"
  },
  "tulangan": {}
};

const dataKolomEvaluasi = {
  "module": "kolom",
  "mode": "evaluasi",
  "dimensi": {
    "h": "700",
    "b": "600", 
    "sb": "40"
  },
  "beban": {
    "pu": "1200",
    "mu": "650",
    "vu": "274.29"
  },
  "material": {
    "fc": "20",
    "fy": "300", 
    "fyt": "300"
  },
  "lanjutan": {
    "lambda": "1",
    "n_kaki": "2"
  },
  "tulangan": {
    "d": "29",
    "phi": "10", 
    "n": "12",
    "s": "220"
  }
};

// DATA PELAT - SEMUA VARIASI MODE
const dataPelatDesainAuto = {
  "module": "pelat",
  "mode": "desain",
  "dimensi": {
    "ly": "6",
    "lx": "4", 
    "h": "120",
    "sb": "20"
  },
  "beban": {
    "mode": "auto",
    "auto": {
      "qu": "10",
      "tumpuan_type": "Terjepit Penuh", 
      "pattern_binary": "0000"
    },
    "manual": {
      "mu": "12.16"
    }
  },
  "material": {
    "fc": "20",
    "fy": "300"
  },
  "lanjutan": {},
  "tulangan": {}
};

const dataPelatDesainManual = {
  "module": "pelat",
  "mode": "desain",
  "dimensi": {
    "ly": "5",
    "lx": "3", 
    "h": "150",
    "sb": "25"
  },
  "beban": {
    "mode": "manual",
    "auto": {
      "qu": "0",
      "tumpuan_type": "", 
      "pattern_binary": "0000"
    },
    "manual": {
      "mu": "15.5"
    }
  },
  "material": {
    "fc": "25",
    "fy": "400"
  },
  "lanjutan": {
    "lambda": "1"
  },
  "tulangan": {}
};

const dataPelatEvaluasiAuto = {
  "module": "pelat", 
  "mode": "evaluasi",
  "dimensi": {
    "ly": "6",
    "lx": "4",
    "h": "120",
    "sb": "20"
  },
  "beban": {
    "mode": "auto", 
    "auto": {
      "qu": "10",
      "tumpuan_type": "Terjepit Penuh", 
      "pattern_binary": "0000"
    },
    "manual": {
      "mu": "12.16"
    }
  },
  "material": {
    "fc": "20",
    "fy": "300"
  },
  "lanjutan": {},
  "tulangan": {
    "d": "10",
    "db": "8", 
    "s": "155",
    "sb": "200"
  }
};

const dataPelatEvaluasiManual = {
  "module": "pelat", 
  "mode": "evaluasi",
  "dimensi": {
    "ly": "5",
    "lx": "3",
    "h": "150",
    "sb": "25"
  },
  "beban": {
    "mode": "manual", 
    "auto": {
      "qu": "0",
      "tumpuan_type": "", 
      "pattern_binary": "0000"
    },
    "manual": {
      "mu": "15.5"
    }
  },
  "material": {
    "fc": "25",
    "fy": "400"
  },
  "lanjutan": {
    "lambda": "1"
  },
  "tulangan": {
    "d": "13",
    "db": "10", 
    "s": "175",
    "sb": "225"
  }
};

// ======================================================================
// DATA FONDASI - STRUKTUR BARU SESUAI PERUBAHAN - DIPERBARUI UNTUK JENIS FONDASI
// ======================================================================

// ------------------------------------------------------
// FONDASI TUNGGAL BUJUR SANGKAR - MODE DESAIN
// ------------------------------------------------------
const dataFondasiBujurSangkarDesain = {
  "module": "fondasi",
  "mode": "desain",
  "fondasi": {
    "mode": "bujur_sangkar",
    "autoDimensi": false,
    "dimensi": {
      "ly": "2.8",
      "lx": "2.8",  // Bujur sangkar: lx = ly
      "by": "400",
      "bx": "400",
      "h": "0.4",
      "alpha_s": "30"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.68",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "384",
    "mux": "254",
    "muy": "15"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {}
};

// ------------------------------------------------------
// FONDASI TUNGGAL PERSEGI PANJANG - MODE DESAIN
// ------------------------------------------------------
const dataFondasiPersegiPanjangDesain = {
  "module": "fondasi",
  "mode": "desain",
  "fondasi": {
    "mode": "persegi_panjang",
    "autoDimensi": true,
    "dimensi": {
      "ly": "2.8",
      "lx": "2",
      "by": "400",
      "bx": "400",
      "h": "0.4",
      "alpha_s": "30"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.68",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "384",
    "mux": "254",
    "muy": "15"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {}
};

// ------------------------------------------------------
// FONDASI MENERUS - MODE DESAIN
// ------------------------------------------------------
const dataFondasiMenerusDesain = {
  "module": "fondasi",
  "mode": "desain",
  "fondasi": {
    "mode": "menerus",
    "autoDimensi": false,
    "dimensi": {
      "ly": "13.5",
      "lx": "1.6",
      "by": "13500",
      "bx": "500",
      "h": "0.25",
      "alpha_s": "100"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.6",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "1800",
    "mux": "251",
    "muy": "0"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {}
};

// ------------------------------------------------------
// FONDASI BUJUR SANGKAR - MODE EVALUASI
// ------------------------------------------------------
const dataFondasiBujurSangkarEvaluasi = {
  "module": "fondasi",
  "mode": "evaluasi",
  "fondasi": {
    "mode": "bujur_sangkar",
    "autoDimensi": false,
    "dimensi": {
      "ly": "2.8",
      "lx": "2.8",  // Bujur sangkar: lx = ly
      "by": "400",
      "bx": "400",
      "h": "0.4",
      "alpha_s": "30"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.6",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "384",
    "mux": "251",
    "muy": "0"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {},
  "tulangan": {
    // Untuk bujur sangkar: hanya D dan s
    "d": "19",
    "s": "100"
  }
};

// ------------------------------------------------------
// FONDASI PERSEGI PANJANG - MODE EVALUASI
// ------------------------------------------------------
const dataFondasiPersegiPanjangEvaluasi = {
  "module": "fondasi",
  "mode": "evaluasi",
  "fondasi": {
    "mode": "persegi_panjang",
    "autoDimensi": false,
    "dimensi": {
      "ly": "2.8",
      "lx": "2",
      "by": "400",
      "bx": "400",
      "h": "0.4",
      "alpha_s": "30"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.6",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "384",
    "mux": "251",
    "muy": "0"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {},
  "tulangan": {
    // Untuk persegi panjang: D, Db, s, sp, st
    "d": "19",
    "db": "16",
    "s": "100",    // Jarak tulangan panjang
    "sp": "100",   // Jarak tulangan pendek pusat
    "st": "100"    // Jarak tulangan pendek tepi
  }
};

// ------------------------------------------------------
// FONDASI MENERUS - MODE EVALUASI
// ------------------------------------------------------
const dataFondasiMenerusEvaluasi = {
  "module": "fondasi",
  "mode": "evaluasi",
  "fondasi": {
    "mode": "menerus",
    "autoDimensi": false,
    "dimensi": {
      "ly": "13.5",
      "lx": "1.6",
      "by": "13500",
      "bx": "500",
      "h": "0.25",
      "alpha_s": "100"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.6",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "1800",
    "mux": "251",
    "muy": "0"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {},
  "tulangan": {
    // Untuk menerus: D, Db, s, sb
    "d": "19",
    "db": "16",
    "s": "95",     // Jarak tulangan utama
    "sb": "100"    // Jarak tulangan bagi
  }
};

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
  
  // Cek nilai mencolok yang menandakan fallback
  if (module === "fondasi" && hasil.data?.tulangan) {
    const tulangan = hasil.data.tulangan;
    
    // Cek berdasarkan jenis fondasi
    if (tulangan.jenis === "bujur_sangkar" && tulangan.s === 999) {
      console.log("🚨🚨🚨 NILAI MENCOLOK DETECTED!");
      console.log("🚨 Ini menandakan OPTIMIZER FONDASI TIDAK BERJALAN dengan benar!");
      console.log("🚨 Periksa ketersediaan optimizer-fondasi.js!");
    } else if (tulangan.jenis === "persegi_panjang") {
      if (tulangan.bujur?.s === 999 || tulangan.persegi?.s_pusat === 999 || tulangan.persegi?.s_tepi === 999) {
        console.log("🚨🚨🚨 NILAI MENCOLOK DETECTED!");
        console.log("🚨 Ini menandakan OPTIMIZER FONDASI TIDAK BERJALAN dengan benar!");
        console.log("🚨 Periksa ketersediaan optimizer-fondasi.js!");
      }
    } else if (tulangan.jenis === "menerus") {
      if (tulangan.s_utama === 999 || tulangan.s_bagi === 999) {
        console.log("🚨🚨🚨 NILAI MENCOLOK DETECTED!");
        console.log("🚨 Ini menandakan OPTIMIZER FONDASI TIDAK BERJALAN dengan benar!");
        console.log("🚨 Periksa ketersediaan optimizer-fondasi.js!");
      }
    }
  }
  
  console.log("🎯".repeat(30));
}

// ------------------------------------------------------
// Fungsi test untuk setiap modul - DIPERBAIKI UNTUK FONDASI
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

async function runTestKolom(label, inputData) {
  console.log("\n" + "=".repeat(100));
  console.log(`🚀 TEST KOLOM - MODE: ${label}`);
  console.log("=".repeat(100));

  try {
    const hasil = await calculateKolom(inputData);

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

    // Tampilkan rekap tulangan sesuai jenis fondasi
    console.log("\n🔍 REKAP TULANGAN:");
    if (hasil.rekap) {
      const rekap = hasil.rekap;
      console.log(`   Dimensi: ${rekap.dimensi || 'N/A'}`);
      
      if (rekap.tulangan_utama) {
        console.log(`   Tulangan Utama: ${rekap.tulangan_utama}`);
      }
      if (rekap.tulangan_bagi) {
        console.log(`   Tulangan Bagi: ${rekap.tulangan_bagi}`);
      }
      if (rekap.tulangan_panjang) {
        console.log(`   Tulangan Panjang: ${rekap.tulangan_panjang}`);
      }
      if (rekap.tulangan_pendek_pusat) {
        console.log(`   Tulangan Pendek Pusat: ${rekap.tulangan_pendek_pusat}`);
      }
      if (rekap.tulangan_pendek_tepi) {
        console.log(`   Tulangan Pendek Tepi: ${rekap.tulangan_pendek_tepi}`);
      }
    }

    // Cek nilai mencolok untuk warning
    if (hasil.data?.tulangan) {
      const tulangan = hasil.data.tulangan;
      const nilaiMencolok = [777, 666, 999, 888];
      
      if (tulangan.jenis === "bujur_sangkar" && nilaiMencolok.includes(tulangan.s)) {
        console.log("\n🚨🚨🚨 PERINGATAN: NILAI MENCOLOK DETECTED (999/888/777)!");
        console.log("🚨 Ini menandakan OPTIMIZER FONDASI TIDAK BERJALAN!");
      } else if (tulangan.jenis === "persegi_panjang") {
        if (nilaiMencolok.includes(tulangan.bujur?.s) || 
            nilaiMencolok.includes(tulangan.persegi?.s_pusat) || 
            nilaiMencolok.includes(tulangan.persegi?.s_tepi)) {
          console.log("\n🚨🚨🚨 PERINGATAN: NILAI MENCOLOK DETECTED (999/888/777)!");
          console.log("🚨 Ini menandakan OPTIMIZER FONDASI TIDAK BERJALAN!");
        }
      } else if (tulangan.jenis === "menerus") {
        if (nilaiMencolok.includes(tulangan.s_utama) || nilaiMencolok.includes(tulangan.s_bagi)) {
          console.log("\n🚨🚨🚨 PERINGATAN: NILAI MENCOLOK DETECTED (999/888/777)!");
          console.log("🚨 Ini menandakan OPTIMIZER FONDASI TIDAK BERJALAN!");
        }
      }
    }

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
      fondasi: optimizerFondasiFound,
      pelat: typeof window.optimizePelat === 'function'
    }
  };

  fs.writeFileSync(fullPath, JSON.stringify(output, null, 2));

  console.log(`💾 File hasil disimpan di temporary directory: ${fullPath}`);
  return { ...hasil, tempFilePath: fullPath };
}

// ------------------------------------------------------
// Menu interaktif - DIPERBAIKI UNTUK FONDASI
// ------------------------------------------------------
async function showMainMenu() {
  console.log("\n" + "=".repeat(80));
  console.log("🏗️  TESTER TERPADU STRUKTUR BETON - DENGAN MONITORING OPTIMIZER");
  console.log("=".repeat(80));
  
  console.log("🎯 STATUS OPTIMIZER:");
  console.log(`   Balok: ${optimizerBalokFound ? '✅' : '❌'} | Fondasi: ${optimizerFondasiFound ? '✅' : '❌'} | Pelat: ${typeof window.optimizePelat === 'function' ? '✅' : '❌'}`);
  
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
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question("Pilih mode (1-6): ", (answer) => {
        rl.close();
        resolve(answer);
      });
    });
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
  } else {
    console.log("1. Desain");
    console.log("2. Evaluasi");
    console.log("3. Keduanya");
    console.log("4. Kembali ke menu utama");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question("Pilih mode (1-4): ", (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
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
        console.log(`   - Optimizer Fondasi: ${optimizerFondasiFound ? '✅ LOADED' : '❌ NOT FOUND'}`);
        console.log(`   - Optimizer Pelat: ${typeof window.optimizePelat === 'function' ? '✅ LOADED' : '❌ NOT FOUND'}`);
        
        if (!optimizerFondasiFound) {
          console.log("\n🚨 PERINGATAN: Optimizer Fondasi tidak ditemukan!");
          console.log("🚨 Hasil fondasi mode desain akan menggunakan MOCK dengan nilai 999/888!");
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
      // Desain
      await runTestFondasi("bujur_sangkar_desain", dataFondasiBujurSangkarDesain);
      await runTestFondasi("persegi_panjang_desain", dataFondasiPersegiPanjangDesain);
      await runTestFondasi("menerus_desain", dataFondasiMenerusDesain);
      // Evaluasi
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
  console.log(`   - optimizeFondasi: ${typeof window.optimizeFondasi === 'function' ? '✅' : '❌'}`);
  console.log(`   - optimizePelat: ${typeof window.optimizePelat === 'function' ? '✅' : '❌'}`);
  console.log(`   - optimizeDesain: ${typeof window.optimizeDesain === 'function' ? '✅' : '❌'}`);
  
  const testData = {
    parsed: {
      module: "fondasi",
      mode: "desain",
      fondasi: {
        mode: "persegi_panjang",
        autoDimensi: true,
        dimensi: {
          ly: "2.8",
          lx: "2",
          by: "400",
          bx: "400",
          h: "0.4",
          alpha_s: "30"
        }
      },
      tanah: {
        mode: "manual",
        auto: {
          df: "1.6",
          gamma: "17.2",
          terzaghi: true,
          phi: "34",
          c: "20",
          mayerhoff: true,
          qc: "95"
        },
        manual: {
          qa: "489.68",
          df: "1.6",
          gamma: "17.2"
        }
      },
      beban: {
        pu: "384",
        mux: "254",
        muy: "15"
      },
      material: {
        fc: "20",
        fy: "300",
        gammaC: "24"
      }
    }
  };
  
  try {
    if (typeof window.optimizeFondasi === 'function') {
      console.log("🚀 Menjalankan optimizer fondasi...");
      const result = await window.optimizeFondasi(testData);
      console.log("📊 Hasil optimizer fondasi:");
      console.log(JSON.stringify(result, null, 2));
      
      if (result.optimasi?.kombinasi_terbaik?.D === 999) {
        console.log("\n🚨🚨🚨 DETECTED MOCK OPTIMIZER FONDASI!");
        console.log("🚨 Nilai D=999 menandakan optimizer tidak berjalan dengan benar!");
      }
      
      return result;
    } else {
      console.log("❌ Optimizer fondasi tidak tersedia");
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
  console.log(`   Balok: ${optimizerBalokFound ? '✅' : '❌'} | Fondasi: ${optimizerFondasiFound ? '✅' : '❌'} | Pelat: ${typeof window.optimizePelat === 'function' ? '✅' : '❌'}`);
  
  // Balok
  console.log(`\n🔧 Balok - Optimizer: ${optimizerBalokFound ? 'AKTIF' : 'MOCK'}`);
  await runTestBalok("desain", dataBalokDesain);
  
  // Kolom
  console.log(`\n🔧 Kolom - Tidak ada optimizer khusus`);
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
    fondasi: optimizerFondasiFound,
    pelat: typeof window.optimizePelat === 'function'
  }
};
// [file content end]