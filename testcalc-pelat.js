// ======================================================================
// testcalc-pelat.js — Tester resmi untuk calc-pelat.js (evaluasi + desain)
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

console.log("📥 Memuat calc-pelat.js...");
let pelatCode = fs.readFileSync(path.join(__dirname, "calc-pelat.js"), "utf8");

// Nonaktifkan redirect
pelatCode = pelatCode.replace(/window\.location\.href = 'report\.html';/, "// redirect disabled");

eval(pelatCode);

// Coba muat optimizer jika ada
let optimizerFound = false;
try {
  console.log("📥 Mencoba memuat optimizer.js...");
  let optimizerCode = fs.readFileSync(path.join(__dirname, "optimizer.js"), "utf8");
  optimizerCode = optimizerCode.replace(/console\.log\(.*optimizer.*\);/, "// removed log");
  eval(optimizerCode);
  optimizerFound = true;
  console.log("✅ optimizer.js berhasil dimuat");
} catch {
  console.log("⚠️  optimizer.js tidak ditemukan (tidak masalah untuk mode evaluasi)");
}

// ------------------------------------------------------
// Data test untuk 4 jenis kombinasi
// ------------------------------------------------------

// 1. Desain dengan beban auto
const dataDesainAuto = {
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

// 2. Desain dengan beban manual  
const dataDesainManual = {
  "module": "pelat",
  "mode": "desain",
  "dimensi": {
    "ly": "6",
    "lx": "4",
    "h": "120", 
    "sb": "20"
  },
  "beban": {
    "mode": "manual",
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

// 3. Evaluasi dengan beban auto
const dataEvaluasiAuto = {
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

// 4. Evaluasi dengan beban manual
const dataEvaluasiManual = {
  "module": "pelat",
  "mode": "evaluasi", 
  "dimensi": {
    "ly": "6",
    "lx": "4",
    "h": "120",
    "sb": "20"
  },
  "beban": {
    "mode": "manual",
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

// ------------------------------------------------------
// Fungsi untuk mendapatkan temporary directory
// ------------------------------------------------------
function getTempDir() {
  // Gunakan system temporary directory
  const tempDir = os.tmpdir();
  const testDir = path.join(tempDir, 'pelat-test-results');
  
  // Buat folder jika belum ada
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  return testDir;
}

// ------------------------------------------------------
// Fungsi untuk generate simple unique ID
// ------------------------------------------------------
function generateSimpleId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// ------------------------------------------------------
// Fungsi untuk membersihkan file temporary lama
// ------------------------------------------------------
function cleanupOldTempFiles(maxAgeHours = 24) {
  const tempDir = getTempDir();
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000; // jam ke milidetik
  
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
// Fungsi untuk menampilkan semua variabel perhitungan
// ------------------------------------------------------
function printAllVariables(hasil) {
  console.log("\n🔍 SEMUA VARIABLE PERHITUNGAN:");
  console.log("=".repeat(80));
  
  // Tampilkan geometri
  console.log("\n📐 GEOMETRI:");
  console.log(`   Ly x Lx x h : ${hasil.geometri.Ly} x ${hasil.geometri.Lx} x ${hasil.geometri.h} mm`);
  console.log(`   Rasio Ly/Lx : ${hasil.geometri.rasioLyLx.toFixed(3)}`);
  console.log(`   Selimut     : ${hasil.geometri.Sb} mm`);
  
  // Tampilkan parameter
  console.log("\n⚙️  PARAMETER:");
  console.log(`   Sn          : ${hasil.parameter.Sn} mm`);
  console.log(`   ds          : ${hasil.parameter.ds} mm`);
  console.log(`   d           : ${hasil.parameter.d} mm`);
  console.log(`   beta1       : ${hasil.parameter.beta1.toFixed(3)}`);
  console.log(`   Kmaks       : ${hasil.parameter.Kmaks.toFixed(4)}`);
  console.log(`   fc          : ${hasil.parameter.fc} MPa`);
  console.log(`   fy          : ${hasil.parameter.fy} MPa`);
  
  // Tampilkan tabel koefisien
  console.log("\n📊 TABEL KOEFISIEN:");
  console.log(`   Kondisi     : ${hasil.tabel.kondisi}`);
  console.log(`   Tumpuan     : ${hasil.tabel.tumpuanHuruf}`);
  console.log(`   Rasio tabel : ${hasil.tabel.rasioTabel}`);
  console.log(`   Ctx         : ${hasil.tabel.Ctx}`);
  console.log(`   Clx         : ${hasil.tabel.Clx}`);
  console.log(`   Cly         : ${hasil.tabel.Cly}`);
  console.log(`   Cty         : ${hasil.tabel.Cty}`);
  
  // Tampilkan momen
  console.log("\n📈 MOMEN PERLU:");
  console.log(`   Mtx         : ${hasil.momen.Mtx.toFixed(3)} kNm/m`);
  console.log(`   Mlx         : ${hasil.momen.Mlx.toFixed(3)} kNm/m`);
  console.log(`   Mly         : ${hasil.momen.Mly.toFixed(3)} kNm/m`);
  console.log(`   Mty         : ${hasil.momen.Mty.toFixed(3)} kNm/m`);
  
  // Tampilkan tulangan pokok arah X
  console.log("\n🔄 TULANGAN POKOK ARAH X:");
  console.log(`   K           : ${hasil.tulangan.pokokX.K.toFixed(4)}`);
  console.log(`   a           : ${hasil.tulangan.pokokX.a.toFixed(2)} mm`);
  console.log(`   As1         : ${hasil.tulangan.pokokX.As1.toFixed(2)} mm²/m`);
  console.log(`   As2         : ${hasil.tulangan.pokokX.As2.toFixed(2)} mm²/m`);
  console.log(`   As3         : ${hasil.tulangan.pokokX.As3.toFixed(2)} mm²/m`);
  console.log(`   AsDigunakan : ${hasil.tulangan.pokokX.AsDigunakan.toFixed(2)} mm²/m`);
  console.log(`   s1          : ${hasil.tulangan.pokokX.s1.toFixed(1)} mm`);
  console.log(`   s2          : ${hasil.tulangan.pokokX.s2.toFixed(1)} mm`);
  console.log(`   s3          : ${hasil.tulangan.pokokX.s3.toFixed(1)} mm`);
  console.log(`   sDigunakan  : ${hasil.tulangan.pokokX.sDigunakan} mm`);
  console.log(`   Mn          : ${hasil.tulangan.pokokX.Mn.toFixed(3)} kNm/m`);
  console.log(`   Md          : ${hasil.tulangan.pokokX.Md.toFixed(3)} kNm/m`);
  console.log(`   Mu          : ${hasil.tulangan.pokokX.Mu.toFixed(3)} kNm/m`);
  
  // Tampilkan tulangan pokok arah Y
  console.log("\n🔄 TULANGAN POKOK ARAH Y:");
  console.log(`   K           : ${hasil.tulangan.pokokY.K.toFixed(4)}`);
  console.log(`   a           : ${hasil.tulangan.pokokY.a.toFixed(2)} mm`);
  console.log(`   As1         : ${hasil.tulangan.pokokY.As1.toFixed(2)} mm²/m`);
  console.log(`   As2         : ${hasil.tulangan.pokokY.As2.toFixed(2)} mm²/m`);
  console.log(`   As3         : ${hasil.tulangan.pokokY.As3.toFixed(2)} mm²/m`);
  console.log(`   AsDigunakan : ${hasil.tulangan.pokokY.AsDigunakan.toFixed(2)} mm²/m`);
  console.log(`   s1          : ${hasil.tulangan.pokokY.s1.toFixed(1)} mm`);
  console.log(`   s2          : ${hasil.tulangan.pokokY.s2.toFixed(1)} mm`);
  console.log(`   s3          : ${hasil.tulangan.pokokY.s3.toFixed(1)} mm`);
  console.log(`   sDigunakan  : ${hasil.tulangan.pokokY.sDigunakan} mm`);
  console.log(`   Mn          : ${hasil.tulangan.pokokY.Mn.toFixed(3)} kNm/m`);
  console.log(`   Md          : ${hasil.tulangan.pokokY.Md.toFixed(3)} kNm/m`);
  console.log(`   Mu          : ${hasil.tulangan.pokokY.Mu.toFixed(3)} kNm/m`);
  
  // Tampilkan tulangan bagi arah X
  console.log("\n📏 TULANGAN BAGI ARAH X:");
  console.log(`   Asb1        : ${hasil.tulangan.bagiX.Asb1.toFixed(2)} mm²/m`);
  console.log(`   Asb2        : ${hasil.tulangan.bagiX.Asb2.toFixed(2)} mm²/m`);
  console.log(`   Asb3        : ${hasil.tulangan.bagiX.Asb3.toFixed(2)} mm²/m`);
  console.log(`   AsbDigunakan: ${hasil.tulangan.bagiX.AsbDigunakan.toFixed(2)} mm²/m`);
  console.log(`   s1          : ${hasil.tulangan.bagiX.s1.toFixed(1)} mm`);
  console.log(`   s2          : ${hasil.tulangan.bagiX.s2.toFixed(1)} mm`);
  console.log(`   s3          : ${hasil.tulangan.bagiX.s3.toFixed(1)} mm`);
  console.log(`   sDigunakan  : ${hasil.tulangan.bagiX.sDigunakan} mm`);
  
  // Tampilkan tulangan bagi arah Y
  console.log("\n📏 TULANGAN BAGI ARAH Y:");
  console.log(`   Asb1        : ${hasil.tulangan.bagiY.Asb1.toFixed(2)} mm²/m`);
  console.log(`   Asb2        : ${hasil.tulangan.bagiY.Asb2.toFixed(2)} mm²/m`);
  console.log(`   Asb3        : ${hasil.tulangan.bagiY.Asb3.toFixed(2)} mm²/m`);
  console.log(`   AsbDigunakan: ${hasil.tulangan.bagiY.AsbDigunakan.toFixed(2)} mm²/m`);
  console.log(`   s1          : ${hasil.tulangan.bagiY.s1.toFixed(1)} mm`);
  console.log(`   s2          : ${hasil.tulangan.bagiY.s2.toFixed(1)} mm`);
  console.log(`   s3          : ${hasil.tulangan.bagiY.s3.toFixed(1)} mm`);
  console.log(`   sDigunakan  : ${hasil.tulangan.bagiY.sDigunakan} mm`);
}

// ------------------------------------------------------
// Fungsi untuk menjalankan test
// ------------------------------------------------------
async function runTest(label, inputData){
  console.log("\n");
  console.log("=".repeat(100));
  console.log(`🚀 TEST MODE: ${label}`);
  console.log("=".repeat(100));

  // Jika evaluasi → simpan input ke sessionStorage
  if (inputData.mode === "evaluasi") {
    sessionStorage.setItem("pelatInput", JSON.stringify(inputData));
    console.log("💾 Session input tersimpan untuk mode evaluasi");
  } else {
    sessionStorage.removeItem("pelatInput");
  }

  try {
    const hasil = await calculatePelat(inputData);

    console.log("\n📥 INPUT DATA:");
    console.log(JSON.stringify(inputData, null, 2));

    console.log("\n🎯 HASIL PERHITUNGAN:");
    console.log(JSON.stringify(hasil, null, 2));

    // Tampilkan semua variabel perhitungan
    if (hasil.data) {
      printAllVariables(hasil.data);
    }

    // Tampilkan kontrol
    if (hasil.kontrol) {
      console.log("\n🔍 HASIL KONTROL:");
      console.log(`   Lentur Arah X - K_aman: ${hasil.kontrol.lentur.arahX.K_aman}`);
      console.log(`   Lentur Arah X - Md_aman: ${hasil.kontrol.lentur.arahX.Md_aman}`);
      console.log(`   Lentur Arah Y - K_aman: ${hasil.kontrol.lentur.arahY.K_aman}`);
      console.log(`   Lentur Arah Y - Md_aman: ${hasil.kontrol.lentur.arahY.Md_aman}`);
      console.log(`   Tulangan Bagi X - As_aman: ${hasil.kontrol.bagi.arahX.As_aman}`);
      console.log(`   Tulangan Bagi Y - As_aman: ${hasil.kontrol.bagi.arahY.As_aman}`);
      console.log(`   STATUS AMAN: ${hasil.kontrol.lentur.ok && hasil.kontrol.bagi.ok ? '✅ AMAN' : '❌ TIDAK AMAN'}`);
    }

    // Tampilkan rekap
    if (hasil.rekap && hasil.rekap.formatted) {
      console.log("\n📋 REKAP HASIL:");
      console.log(`   Dimensi          : ${hasil.rekap.formatted.dimensi}`);
      console.log(`   Tulangan Pokok X : ${hasil.rekap.formatted.tulangan_pokok_x}`);
      console.log(`   Tulangan Pokok Y : ${hasil.rekap.formatted.tulangan_pokok_y}`);
      console.log(`   Tulangan Bagi X  : ${hasil.rekap.formatted.tulangan_bagi_x}`);
      console.log(`   Tulangan Bagi Y  : ${hasil.rekap.formatted.tulangan_bagi_y}`);
      console.log(`   Rasio Ly/Lx      : ${hasil.rekap.formatted.rasio_ly_lx}`);
      console.log(`   Tumpuan          : ${hasil.rekap.formatted.tumpuan}`);
    }

    // Simpan ke temporary directory dengan simple unique ID
    const tempDir = getTempDir();
    const uniqueId = generateSimpleId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fname = `hasil_pelat_${label}_${timestamp}_${uniqueId}.json`;
    const fullPath = path.join(tempDir, fname);

    fs.writeFileSync(fullPath, JSON.stringify({
      mode: label,
      input: inputData,
      output: hasil
    }, null, 2));

    console.log(`💾 File hasil disimpan di temporary directory: ${fullPath}`);
    console.log(`📁 Temporary directory: ${tempDir}`);

    return { ...hasil, tempFilePath: fullPath };
  } catch (err) {
    console.error("💥 ERROR:", err);
    return null;
  }
}

// ------------------------------------------------------
// Fungsi untuk tanya jenis test
// ------------------------------------------------------
function askTestType() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n📋 PILIH JENIS TEST:");
  console.log("1. Desain dengan beban auto");
  console.log("2. Desain dengan beban manual"); 
  console.log("3. Evaluasi dengan beban auto");
  console.log("4. Evaluasi dengan beban manual");
  console.log("5. Semua jenis test");
  console.log("6. Info temporary directory");

  return new Promise((resolve) => {
    rl.question("Pilih test (1-6): ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ------------------------------------------------------
// JALANKAN TEST
// ------------------------------------------------------
(async () => {
  // Bersihkan file temporary lama
  cleanupOldTempFiles();
  
  const testType = await askTestType();
  
  const testCases = [
    { label: "desain_auto", data: dataDesainAuto, requiresOptimizer: true },
    { label: "desain_manual", data: dataDesainManual, requiresOptimizer: true },
    { label: "evaluasi_auto", data: dataEvaluasiAuto, requiresOptimizer: false },
    { label: "evaluasi_manual", data: dataEvaluasiManual, requiresOptimizer: false }
  ];

  switch(testType) {
    case '1':
      if (!optimizerFound && testCases[0].requiresOptimizer) {
        console.log("❌ Mode desain membutuhkan optimizer.js!");
      } else {
        await runTest(testCases[0].label, testCases[0].data);
      }
      break;
    case '2':
      if (!optimizerFound && testCases[1].requiresOptimizer) {
        console.log("❌ Mode desain membutuhkan optimizer.js!");
      } else {
        await runTest(testCases[1].label, testCases[1].data);
      }
      break;
    case '3':
      await runTest(testCases[2].label, testCases[2].data);
      break;
    case '4':
      await runTest(testCases[3].label, testCases[3].data);
      break;
    case '5':
      for (const testCase of testCases) {
        if (testCase.requiresOptimizer && !optimizerFound) {
          console.log(`❌ ${testCase.label} dilewati karena optimizer.js tidak ada.`);
        } else {
          await runTest(testCase.label, testCase.data);
        }
      }
      break;
    case '6':
      const tempDir = getTempDir();
      console.log(`\n📁 Temporary directory: ${tempDir}`);
      console.log(`🔄 File di folder ini akan dibersihkan otomatis oleh sistem`);
      console.log(`⏰ Atau akan dihapus saat restart komputer`);
      break;
    default:
      console.log("❌ Pilihan tidak valid, jalankan evaluasi auto saja");
      await runTest(testCases[2].label, testCases[2].data);
  }

  // Tampilkan info temporary directory di akhir
  console.log(`\n💡 File hasil disimpan di temporary directory sistem:`);
  console.log(`   ${getTempDir()}`);
  console.log(`   File akan dibersihkan otomatis oleh OS`);
})();