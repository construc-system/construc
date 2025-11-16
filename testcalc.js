// testcalc.js - Output semua data dari calc-balok.js

// Mock environment browser untuk Node.js
global.window = global;
global.document = {
  documentElement: {
    style: {}
  }
};
global.getComputedStyle = () => ({
  getPropertyValue: () => ''
});
global.sessionStorage = {
  setItem: () => {},
  getItem: () => null
};
global.location = {
  href: ''
};

// Load file calc-balok.js dan optimizer.js
const fs = require('fs');
const path = require('path');

console.log("📥 Memuat calc-balok.js...");
const calcBalokCode = fs.readFileSync(path.join(__dirname, 'calc-balok.js'), 'utf8');

// Hapus bagian yang tidak perlu untuk testing
const cleanedCalcCode = calcBalokCode
  .replace(/window\.location\.href = 'report\.html';/, '// redirect disabled for testing')
  .replace(/window\.calculateBalokWithRedirect = calculateBalokWithRedirect;/, '')
  .replace(/console\.log\("✅ calc-balok\.js loaded with redirect functionality"\);/, '')
  .replace(/console\.log\("✅ calc-balok\.js loaded \(core functions only\)"\);/, '// loaded for testing');

// Evaluate calc-balok.js
eval(cleanedCalcCode);

console.log("📥 Memuat optimizer.js...");
const optimizerCode = fs.readFileSync(path.join(__dirname, 'optimizer.js'), 'utf8');

// Hapus bagian yang tidak perlu untuk testing dari optimizer.js
const cleanedOptimizerCode = optimizerCode
  .replace(/console\.log\("✅ optimizer\.js loaded"\);/, '// optimizer loaded for testing');

// Evaluate optimizer.js
eval(cleanedOptimizerCode);

console.log("✅ Kedua file berhasil dimuat");

// Data test
const testData = {
  module: "balok",
  mode: "desain",
  dimensi: { h: "400", b: "250", sb: "40" },
  beban: {
    left: { mu_pos: "36.49", mu_neg: "94", vu: "83.242", tu: "20" },
    center: { mu_pos: "40.65", mu_neg: "0", vu: "83.242", tu: "20" },
    right: { mu_pos: "65.92", mu_neg: "110.03", vu: "83.242", tu: "20" },
  },
  material: { fc: "20", fy: "300", fyt: "300" },
  lanjutan: { lambda: "1", n: "2" },
};

// Fungsi test
function runTest() {
  try {
    console.log("🧪 Menjalankan test perhitungan balok...");
    console.log("📊 Data input:", JSON.stringify(testData, null, 2));
    
    const result = calculateBalok(testData);
    
    console.log("\n🎯 HASIL LENGKAP PERHITUNGAN BALOK:");
    console.log("=".repeat(80));
    
    // 1. INFO DASAR
    console.log("\n📋 1. INFO DASAR:");
    console.log("Status:", result.status);
    console.log("Mode:", result.mode);
    console.log("Module:", result.data?.module || testData.module);
    
    // 2. DATA INPUT (dari testData)
    console.log("\n📥 2. DATA INPUT:");
    console.log(JSON.stringify(testData, null, 2));
    
    if (result.status === "sukses") {
      // 3. DATA PERHITUNGAN (semua data dari result.data)
      console.log("\n🔢 3. DATA PERHITUNGAN LENGKAP:");
      console.log(JSON.stringify(result.data, null, 2));
      
      // 4. KONTROL DETAIL (semua kontrol dari result.kontrol)
      console.log("\n⚡ 4. HASIL KONTROL DETAIL:");
      console.log(JSON.stringify(result.kontrol, null, 2));
      
      // 5. REKAP HASIL
      console.log("\n📊 5. REKAP HASIL:");
      console.log(JSON.stringify(result.rekap, null, 2));
      
      // 6. KONTROL REKAP
      console.log("\n✅ 6. KONTROL REKAP KELAYAKAN:");
      console.log(JSON.stringify(result.kontrol_rekap, null, 2));
      
      // 7. OPTIMASI (jika mode desain)
      if (result.optimasi) {
        console.log("\n🎯 7. HASIL OPTIMASI:");
        console.log(JSON.stringify(result.optimasi, null, 2));
      }
      
      // 8. INFO TAMBAHAN (jika mode evaluasi)
      if (result.info) {
        console.log("\nℹ️  8. INFO TAMBAHAN:");
        console.log(JSON.stringify(result.info, null, 2));
      }
      
      // 9. SUMMARY KELAYAKAN (untuk quick check)
      console.log("\n📈 9. SUMMARY KELAYAKAN:");
      const semuaAman = isKontrolAman(result.kontrol);
      console.log("🎉 STATUS KESELURUHAN:", semuaAman ? "✅ SEMUA AMAN" : "❌ ADA YANG TIDAK AMAN");
      
      // Hitung persentase kelayakan
      let totalKontrol = 0;
      let kontrolAman = 0;
      
      // Kontrol Lentur
      Object.values(result.kontrol.kontrolLentur).forEach(lentur => {
        totalKontrol += 4; // K_aman, Md_aman, rho_aman, kapasitas_aman
        if (lentur.K_aman) kontrolAman++;
        if (lentur.Md_aman) kontrolAman++;
        if (lentur.rho_aman) kontrolAman++;
        if (lentur.kapasitas_aman) kontrolAman++;
      });
      
      // Kontrol Geser
      Object.values(result.kontrol.kontrolGeser).forEach(geser => {
        totalKontrol += 2; // Vs_aman, Av_aman
        if (geser.Vs_aman) kontrolAman++;
        if (geser.Av_aman) kontrolAman++;
      });
      
      // Kontrol Torsi
      Object.values(result.kontrol.kontrolTorsi).forEach(torsi => {
        totalKontrol += 1; // perluDanAman
        if (torsi.perluDanAman) kontrolAman++;
      });
      
      const persentaseAman = ((kontrolAman / totalKontrol) * 100).toFixed(1);
      console.log(`📊 PERSENTASE KELAYAKAN: ${persentaseAman}% (${kontrolAman}/${totalKontrol} kontrol)`);
      
    } else {
      console.log("❌ ERROR:", result.message);
    }
    
    return result;
    
  } catch (error) {
    console.error("💥 ERROR dalam test:", error.message);
    console.error(error.stack);
    return null;
  }
}

// Jalankan test
console.log("=".repeat(80));
console.log("🚀 TEST CALC-BALOK.JS - OUTPUT LENGKAP");
console.log("=".repeat(80));

const startTime = Date.now();
const result = runTest();
const endTime = Date.now();

console.log("\n⏱️  Waktu eksekusi:", (endTime - startTime) + "ms");
console.log("=".repeat(80));

// Simpan hasil lengkap ke file JSON (optional)
if (result) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `hasil_perhitungan_${timestamp}.json`;
  
  const hasilLengkap = {
    timestamp: new Date().toISOString(),
    input: testData,
    output: result
  };
  
  fs.writeFileSync(filename, JSON.stringify(hasilLengkap, null, 2));
  console.log(`💾 Hasil lengkap disimpan di: ${filename}`);
}

// Export result untuk digunakan di tempat lain jika needed
module.exports = { result, testData };