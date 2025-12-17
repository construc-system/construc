// ======================================================================
// testcalc-kolom.js — Tester resmi untuk calc-kolom.js (evaluasi + desain)
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

console.log("📥 Memuat calc-kolom.js...");
let kolomCode = fs.readFileSync(path.join(__dirname, "calc-kolom.js"), "utf8");

// Nonaktifkan redirect
kolomCode = kolomCode.replace(/window\.location\.href = 'report-kolom\.html';/, "// redirect disabled");

eval(kolomCode);

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
// Data test evaluasi (sesuai format yang kamu berikan)
// ------------------------------------------------------
const dataEvaluasi = {
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

// ------------------------------------------------------
// Data test desain (sama tapi TANPA tulangan)
// ------------------------------------------------------
const dataDesain = {
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

// ------------------------------------------------------
// Fungsi untuk menampilkan semua variabel perhitungan
// ------------------------------------------------------
function printAllVariables(hasilTulangan) {
  console.log("\n🔍 SEMUA VARIABLE PERHITUNGAN:");
  console.log("=".repeat(80));
  
  // Tampilkan kondisi aktif
  console.log(`\n🎯 KONDISI AKTIF: ${hasilTulangan.kondisiAktif}`);
  
  // Tampilkan semua kondisi
  if (hasilTulangan.semuaKondisi) {
    console.log("\n📋 HASIL SEMUA KONDISI:");
    Object.keys(hasilTulangan.semuaKondisi).forEach(key => {
      const kondisi = hasilTulangan.semuaKondisi[key];
      console.log(`\n${key.toUpperCase()}: ${kondisi.nama} ${kondisi.aktif ? '(AKTIF)' : ''}`);
      if (kondisi.error) {
        console.log(`   Error: ${kondisi.error}`);
      } else {
        console.log(`   A1: ${kondisi.A1?.toFixed(2)} mm²`);
        console.log(`   A2: ${kondisi.A2?.toFixed(2)} mm²`);
        console.log(`   As_tu: ${kondisi.As_tu?.toFixed(2)} mm²`);
        console.log(`   Persamaan: ${kondisi.persamaan}`);
        
        // Tampilkan variabel khusus untuk setiap kondisi
        if (kondisi.ap1 !== undefined) console.log(`   ap1: ${kondisi.ap1?.toFixed(2)}`);
        if (kondisi.ap2 !== undefined) console.log(`   ap2: ${kondisi.ap2?.toFixed(2)}`);
        if (kondisi.ap3 !== undefined) console.log(`   ap3: ${kondisi.ap3?.toFixed(2)}`);
        if (kondisi.R1 !== undefined) console.log(`   R1: ${kondisi.R1?.toFixed(2)}`);
        if (kondisi.R2 !== undefined) console.log(`   R2: ${kondisi.R2?.toFixed(2)}`);
        if (kondisi.R3 !== undefined) console.log(`   R3: ${kondisi.R3?.toFixed(2)}`);
        if (kondisi.R4 !== undefined) console.log(`   R4: ${kondisi.R4?.toFixed(2)}`);
        if (kondisi.R5 !== undefined) console.log(`   R5: ${kondisi.R5?.toFixed(2)}`);
        if (kondisi.R6 !== undefined) console.log(`   R6: ${kondisi.R6?.toFixed(2)}`);
        if (kondisi.R7 !== undefined) console.log(`   R7: ${kondisi.R7?.toFixed(2)}`);
        if (kondisi.R8 !== undefined) console.log(`   R8: ${kondisi.R8?.toFixed(2)}`);
        if (kondisi.R9 !== undefined) console.log(`   R9: ${kondisi.R9?.toFixed(2)}`);
        if (kondisi.a_cubic !== undefined) console.log(`   a_cubic: ${kondisi.a_cubic?.toFixed(2)}`);
        if (kondisi.a_flexure !== undefined) console.log(`   a_flexure: ${kondisi.a_flexure?.toFixed(2)}`);
        if (kondisi.As1 !== undefined) console.log(`   As1: ${kondisi.As1?.toFixed(2)}`);
        if (kondisi.As2 !== undefined) console.log(`   As2: ${kondisi.As2?.toFixed(2)}`);
        if (kondisi.K !== undefined) console.log(`   K: ${kondisi.K?.toFixed(4)}`);
        if (kondisi.Kmaks !== undefined) console.log(`   Kmaks: ${kondisi.Kmaks?.toFixed(4)}`);
        if (kondisi.K_melebihi_Kmaks !== undefined) console.log(`   K_melebihi_Kmaks: ${kondisi.K_melebihi_Kmaks}`);
      }
    });
  }

  // Variabel dasar
  console.log("\n📊 VARIABLE DASAR:");
  console.log(`   Kondisi         : ${hasilTulangan.kondisi}`);
  console.log(`   e               : ${hasilTulangan.e?.toFixed(2)} mm`);
  console.log(`   ab              : ${hasilTulangan.ab?.toFixed(2)} mm`);
  console.log(`   ac              : ${hasilTulangan.ac?.toFixed(2)} mm`);
  console.log(`   ab1             : ${hasilTulangan.ab1?.toFixed(2)} mm`);
  console.log(`   ab2             : ${hasilTulangan.ab2?.toFixed(2)} mm`);
  console.log(`   at1             : ${hasilTulangan.at1?.toFixed(2)} mm`);
  console.log(`   at2             : ${hasilTulangan.at2?.toFixed(2)} mm`);
  console.log(`   Pu0             : ${hasilTulangan.Pu0?.toFixed(2)} kN`);
  console.log(`   beta1           : ${hasilTulangan.beta1?.toFixed(3)}`);
  console.log(`   faktorPhi       : ${hasilTulangan.faktorPhi?.toFixed(3)}`);
  
  // Hasil akhir
  console.log("\n🎯 HASIL AKHIR:");
  console.log(`   A1              : ${hasilTulangan.A1?.toFixed(2)} mm²`);
  console.log(`   A2              : ${hasilTulangan.A2?.toFixed(2)} mm²`);
  console.log(`   As_tu           : ${hasilTulangan.As_tu?.toFixed(2)} mm²`);
  console.log(`   Ast_u           : ${hasilTulangan.Ast_u?.toFixed(2)} mm²`);
  console.log(`   Ast_i           : ${hasilTulangan.Ast_i?.toFixed(2)} mm²`);
  console.log(`   n               : ${hasilTulangan.n}`);
  console.log(`   n_terpakai      : ${hasilTulangan.n_terpakai}`);
  console.log(`   rho             : ${hasilTulangan.rho?.toFixed(3)} %`);
  console.log(`   status          : ${hasilTulangan.status}`);
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
    sessionStorage.setItem("kolomInput", JSON.stringify(inputData));
    console.log("💾 Session input tersimpan untuk mode evaluasi");
  } else {
    sessionStorage.removeItem("kolomInput");
  }

  try {
    const hasil = await calculateKolom(inputData);

    console.log("\n📥 INPUT DATA:");
    console.log(JSON.stringify(inputData, null, 2));

    console.log("\n🎯 HASIL PERHITUNGAN:");
    console.log(JSON.stringify(hasil, null, 2));

    // TAMBAHAN: Tampilkan nilai e secara khusus
    console.log("\n📊 NILAI E (EKSENTRISITAS):");
    console.log(`e = ${hasil.data?.hasilTulangan?.e} mm`);
    console.log(`e (formatted) = ${hasil.rekap?.formatted?.e}`);

    // TAMBAHAN: Tampilkan semua variabel perhitungan
    if (hasil.data?.hasilTulangan) {
      printAllVariables(hasil.data.hasilTulangan);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fname = `hasil_kolom_${label}_${timestamp}.json`;

    fs.writeFileSync(fname, JSON.stringify({
      mode: label,
      input: inputData,
      output: hasil
    }, null, 2));

    console.log(`💾 File hasil disimpan: ${fname}`);

    return hasil;
  } catch (err) {
    console.error("💥 ERROR:", err);
    return null;
  }
}

// ------------------------------------------------------
// Fungsi untuk tanya mode sederhana
// ------------------------------------------------------
function askMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question("Pilih mode (1=Evaluasi, 2=Desain, 3=Keduanya): ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ------------------------------------------------------
// JALANKAN TEST
// ------------------------------------------------------
(async () => {
  const mode = await askMode();
  
  switch(mode) {
    case '1':
      await runTest("evaluasi", dataEvaluasi);
      break;
    case '2':
      if (optimizerFound) {
        await runTest("desain", dataDesain);
      } else {
        console.log("❌ Mode desain membutuhkan optimizer.js!");
      }
      break;
    case '3':
      await runTest("evaluasi", dataEvaluasi);
      if (optimizerFound) {
        await runTest("desain", dataDesain);
      } else {
        console.log("❌ Mode desain dilewati karena optimizer.js tidak ada.");
      }
      break;
    default:
      console.log("❌ Pilihan tidak valid, jalankan evaluasi saja");
      await runTest("evaluasi", dataEvaluasi);
  }
})();