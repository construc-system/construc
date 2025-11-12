// calc-balok.js
window.calculateBalok = function(data) {
    console.log("🔄 calc-balok.js received data:", data);
    
    try {
        // ===== 1. EXTRACT & VALIDATE INPUT DATA =====
        const { module, mode, dimensi, beban, material, lanjutan, tulangan } = data;
        
        // Validasi data wajib
        if (!module || !mode) {
            throw new Error("Data module atau mode tidak valid");
        }

        // ===== 2. PROCESS BASED ON MODE =====
        if (mode === 'desain') {
            return handleDesainMode(data);
        } else if (mode === 'evaluasi') {
            return handleEvaluasiMode(data);
        } else {
            throw new Error(`Mode '${mode}' tidak dikenali. Gunakan 'desain' atau 'evaluasi'`);
        }

    } catch (error) {
        console.error("❌ Error in calc-balok.js:", error);
        return {
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// ===== MODE DESAIN =====
function handleDesainMode(data) {
    console.log("🎯 Mode: DESAIN - Memanggil optimizer...");
    
    // Untuk sementara, return placeholder
    // Nanti akan diintegrasikan dengan optimizer.js
    return {
        status: 'success',
        mode: 'desain',
        message: 'Mode desain - Optimizer dalam pengembangan',
        rekomendasi: {
            tulangan_utama: 'Akan dihitung optimizer',
            tulangan_begel: 'Akan dihitung optimizer', 
            notes: 'Fitur optimizer.js sedang dikembangkan'
        },
        calculation_data: data // Echo back data untuk testing
    };
}

// ===== MODE EVALUASI =====  
function handleEvaluasiMode(data) {
    console.log("🔍 Mode: EVALUASI - Memulai perhitungan...");
    
    const { dimensi, beban, material, lanjutan, tulangan } = data;
    
    // ===== 3. VARIABLE EXTRACTION & UNIT CONVERSION =====
    // Dimensi (mm → m untuk yang perlu)
    const h = parseFloat(dimensi.h);           // Tinggi penampang (mm)
    const b = parseFloat(dimensi.b);           // Lebar penampang (mm) 
    const sb = parseFloat(dimensi.sb);         // Selimut beton (mm)
    
    // Material
    const fc = parseFloat(material.fc);        // Kuat tekan beton (MPa)
    const fy = parseFloat(material.fy);        // Kuat leleh baja (MPa)
    const fyt = parseFloat(material.fyt);      // Kuat leleh baja begel (MPa)
    
    // Lanjutan
    const lambda = parseFloat(lanjutan.lambda) || 1.0;  // Faktor beton ringan
    const n_kaki = parseFloat(lanjutan.n) || 2;         // Jumlah kaki begel
    
    // Tulangan
    const D = parseFloat(tulangan.d);          // Diameter tulangan utama (mm)
    const phi = parseFloat(tulangan.phi);      // Diameter tulangan begel (mm)
    
    // Tulangan Support (Tumpuan)
    const n_support = parseFloat(tulangan.support.n);    // Jumlah tulangan tarik
    const np_support = parseFloat(tulangan.support.np);  // Jumlah tulangan tekan  
    const nt_support = parseFloat(tulangan.support.nt) || 0; // Jumlah tulangan torsi
    const s_support = parseFloat(tulangan.support.s);    // Jarak begel (mm)
    
    // Tulangan Field (Lapangan)
    const n_field = parseFloat(tulangan.field.n);
    const np_field = parseFloat(tulangan.field.np); 
    const nt_field = parseFloat(tulangan.field.nt) || 0;
    const s_field = parseFloat(tulangan.field.s);
    
    // Beban (kN, kNm)
    const beban_kiri = beban.left;
    const beban_tengah = beban.center; 
    const beban_kanan = beban.right;

    // ===== 4. MAIN CALCULATION =====
    const calculationResults = performBalokCalculation({
        // Dimensi
        h, b, sb,
        
        // Material  
        fc, fy, fyt,
        
        // Lanjutan
        lambda, n_kaki,
        
        // Tulangan
        D, phi,
        n_support, np_support, nt_support, s_support,
        n_field, np_field, nt_field, s_field,
        
        // Beban
        beban_kiri, beban_tengah, beban_kanan
    });

    // ===== 5. EFFICIENCY SUGGESTION =====
    const efficiencySuggestion = generateEfficiencySuggestion(calculationResults, {
        D, phi, fc, fy
    });

    // ===== 6. FINAL RESULT =====
    return {
        status: 'success',
        mode: 'evaluasi',
        summary: {
            aman: calculationResults.status === 'aman',
            utilization_ratio: calculationResults.utilization_ratio,
            critical_section: calculationResults.critical_section
        },
        calculation_details: calculationResults,
        efficiency_suggestion: efficiencySuggestion,
        input_validation: {
            dimensi: { h, b, sb },
            material: { fc, fy, fyt },
            tulangan: {
                diameter_utama: D,
                diameter_begel: phi,
                support: { n_support, np_support, nt_support, s_support },
                field: { n_field, np_field, nt_field, s_field }
            }
        },
        timestamp: new Date().toISOString()
    };
}

// ===== CORE CALCULATION FUNCTION =====
function performBalokCalculation(params) {
    console.log("🧮 Performing balok calculation...", params);
    
    const {
        h, b, sb,           // Dimensi
        fc, fy, fyt,        // Material
        lambda, n_kaki,     // Lanjutan
        D, phi,             // Diameter tulangan
        n_support, np_support, nt_support, s_support,  // Tulangan tumpuan
        n_field, np_field, nt_field, s_field,          // Tulangan lapangan  
        beban_kiri, beban_tengah, beban_kanan          // Beban
    } = params;

    // ===== VARIABLE CALCULATION (Placeholder - nanti diisi perhitungan sebenarnya) =====
    
    // 1. Hitung m (jumlah tulangan maksimum dalam satu baris)
    const m = (b - 2 * sb) / (D + 10);  // Simplified calculation
    
    // 2. Faktor reduksi
    const faktor_reduksi_lentur = 0.9;
    const faktor_reduksi_geser = 0.75;
    
    // 3. Snv (jarak vertikal minimum)
    const Snv = Math.max(25, D);
    
    // 4. Hitung ds1, ds2, ds3
    const ds1 = sb + phi + (D / 2);
    const ds2 = (D / 2) + Snv + (D / 2);
    const ds3 = (D / 2) + Snv + (D / 2);
    
    // 5. Hitung berbagai kemungkinan ds
    const ds_option1 = ds1;
    const ds_option2 = ds1 + (ds2 / 2); 
    const ds_option3 = ds1 + ds2 + (ds3 / 2);
    
    // 6. Tentukan ds yang digunakan (ambil yang paling kecil untuk konservatif)
    const ds_digunakan = ds_option1;  // Simplified - pilih option1
    const ds_prime_digunakan = ds1;   // Untuk tulangan tekan
    
    // 7. Hitung d dan d'
    const d = h - ds_digunakan;       // Tinggi efektif tarik
    const d_prime = h - ds_prime_digunakan; // Tinggi efektif tekan
    
    // 8. Hitung β₁ berdasarkan fc
    let beta1;
    if (fc <= 28) {
        beta1 = 0.85;
    } else if (fc > 28 && fc < 55) {
        beta1 = 0.85 - 0.05 * ((fc - 28) / 7);
    } else {
        beta1 = 0.65;
    }
    
    // 9. Hitung Kmaks
    const Kmaks = (382.5 * beta1 * fc * (600 + fy - 225 * beta1)) / Math.pow((600 + fy), 2);
    
    // ===== PLACEHOLDER: ACTUAL STRUCTURAL CALCULATION =====
    // Ini nanti akan diisi dengan perhitungan sebenarnya:
    // - Kapasitas momen (Mn)
    // - Kapasitas geser (Vn) 
    // - Kapasitas torsi (Tn)
    // - Bandingkan dengan beban terfaktor
    
    // Untuk sementara, return placeholder results
    return {
        status: 'aman',  // atau 'tidak_aman'
        utilization_ratio: 0.75,  // Rasio utilisasi (0-1)
        critical_section: 'tumpuan_kiri',  // Section paling kritis
        
        // Detail perhitungan
        calculated_variables: {
            m: m.toFixed(2),
            faktor_reduksi_lentur,
            faktor_reduksi_geser, 
            Snv,
            ds1: ds1.toFixed(2),
            ds2: ds2.toFixed(2),
            ds3: ds3.toFixed(2),
            ds_digunakan: ds_digunakan.toFixed(2),
            ds_prime_digunakan: ds_prime_digunakan.toFixed(2),
            d: d.toFixed(2),
            d_prime: d_prime.toFixed(2),
            beta1: beta1.toFixed(2),
            Kmaks: Kmaks.toFixed(2)
        },
        
        // Kapasitas sections (placeholder)
        kapasitas: {
            tumpuan_kiri: { momen: 150, geser: 200, torsi: 50 },
            lapangan: { momen: 180, geser: 220, torsi: 40 },
            tumpuan_kanan: { momen: 160, geser: 210, torsi: 45 }
        },
        
        // Demand dari beban (placeholder)  
        demand: {
            tumpuan_kiri: beban_kiri,
            lapangan: beban_tengah,
            tumpuan_kanan: beban_kanan
        }
    };
}

// ===== EFFICIENCY SUGGESTION FUNCTION =====
function generateEfficiencySuggestion(calculationResults, currentDesign) {
    const { utilization_ratio, status } = calculationResults;
    const { D, phi, fc, fy } = currentDesign;
    
    // Daftar diameter tulangan yang umum (urut dari kecil ke besar)
    const availableRebarSizes = [10, 13, 16, 19, 22, 25, 29, 32];
    const availableStirrupSizes = [8, 10, 13];
    
    let suggestions = [];
    
    // Cek jika over-designed (utilization ratio terlalu rendah)
    if (utilization_ratio < 0.7 && status === 'aman') {
        suggestions.push("Struktur over-designed. Dapat dioptimasi:");
        
        // Coba kurangi diameter tulangan utama
        const currentIndex = availableRebarSizes.indexOf(D);
        if (currentIndex > 0) {
            const smallerSize = availableRebarSizes[currentIndex - 1];
            suggestions.push(`- Coba turunkan diameter tulangan utama dari ${D}mm ke ${smallerSize}mm`);
        }
        
        // Coba kurangi diameter begel
        const currentStirrupIndex = availableStirrupSizes.indexOf(phi);
        if (currentStirrupIndex > 0) {
            const smallerStirrup = availableStirrupSizes[currentStirrupIndex - 1];
            suggestions.push(`- Coba turunkan diameter begel dari ${phi}mm ke ${smallerStirrup}mm`);
        }
    } else if (utilization_ratio > 0.95) {
        suggestions.push("⚠️ Struktur mendekati batas kapasitas. Pertimbangkan:");
        
        // Coba naikkan diameter tulangan utama
        const currentIndex = availableRebarSizes.indexOf(D);
        if (currentIndex < availableRebarSizes.length - 1) {
            const largerSize = availableRebarSizes[currentIndex + 1];
            suggestions.push(`- Tingkatkan diameter tulangan utama dari ${D}mm ke ${largerSize}mm`);
        }
    } else {
        suggestions.push("✓ Desain cukup efisien");
    }
    
    return {
        current_utilization: utilization_ratio,
        efficiency_status: utilization_ratio < 0.7 ? 'over_designed' : 
                          utilization_ratio > 0.95 ? 'near_capacity' : 'efficient',
        suggestions: suggestions
    };
}

// ===== OPTIMIZER INTEGRATION PLACEHOLDER =====
// Nanti akan diintegrasikan dengan optimizer.js
function optimizeBalokDesign(inputData) {
    console.log("🔧 Optimizer called for balok design");
    // Placeholder - nanti akan panggil optimizer.js
    return {
        optimized: false,
        message: "Optimizer.js dalam pengembangan"
    };
}

// Export untuk testing (jika needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateBalok };
}