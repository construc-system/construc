function openTab(evt, tabName) {
  const tabcontent = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablinks");

  // sembunyikan semua isi tab
  tabcontent.forEach(el => el.classList.remove("active"));

  // hapus status aktif dari semua tombol
  tablinks.forEach(el => el.classList.remove("active"));

  // tampilkan tab yg diklik
  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.classList.add("active");

  // Reset sub-tabs to default "Desain"
  const tabElement = document.getElementById(tabName);
  const subtablinks = tabElement.querySelectorAll('.subtablinks');
  const subtabcontent = tabElement.querySelectorAll('.subtabcontent');
  subtablinks.forEach(el => el.classList.remove('active'));
  subtabcontent.forEach(el => el.classList.remove('active'));
  if (subtablinks.length > 0) {
    subtablinks[0].classList.add('active');
    subtabcontent[0].classList.add('active');
  }
}
function openSubTab(evt, subTabName) {
  const subtabcontent = document.querySelectorAll(".subtabcontent");
  const subtablinks = document.querySelectorAll(".subtablinks");

  // sembunyikan semua isi subtab
  subtabcontent.forEach(el => el.classList.remove("active"));

  // hapus status aktif dari semua tombol subtab
  subtablinks.forEach(el => el.classList.remove("active"));

  // tampilkan subtab yg diklik
  document.getElementById(subTabName).classList.add("active");
  evt.currentTarget.classList.add("active");
}

// Function to adjust overflow based on content height
function adjustOverflow() {
  if (document.body.scrollHeight > window.innerHeight) {
    document.body.style.overflowY = 'auto';
  } else {
    document.body.style.overflowY = 'hidden';
  }
}

// Function to adjust order of data sections based on screen width
function adjustOrder() {
  const allSubtabs = document.querySelectorAll(".subtabcontent");

  allSubtabs.forEach(subtab => {
    const sections = subtab.querySelectorAll(".data-section");
    if (sections.length === 0) return;

    const dimensi  = subtab.querySelector("#dimensi");
    const bahan    = subtab.querySelector("#bahan");
    const beban    = subtab.querySelector("#beban, #Beban");
    const tulangan = subtab.querySelector("#tulangan");
    const tanah    = subtab.querySelector("#tanah");

    // Hitung perRow untuk semua subtab
    const containerWidth = subtab.clientWidth;
    const sectionWidth = sections[0]?.getBoundingClientRect().width || 300;
    const perRow = Math.floor(containerWidth / sectionWidth);

    // Urutan khusus untuk PelatEvaluasi
    if (subtab.id === 'PelatEvaluasi') {
      if (perRow === 2) {
        // Urutan: dimensi, bahan, beban, tulangan
        if (dimensi) dimensi.style.order = 1;
        if (bahan)   bahan.style.order   = 2;
        if (beban)   beban.style.order   = 3;
        if (tulangan) tulangan.style.order = 4;
      } else {
        // Urutan default: dimensi, bahan, tulangan, beban
        if (dimensi) dimensi.style.order = 1;
        if (bahan)   bahan.style.order   = 2;
        if (tulangan) tulangan.style.order = 3;
        if (beban) beban.style.order = 4;
      }
      return; // Keluar dari fungsi untuk subtab ini
    }

    // Urutan khusus untuk FondasiDesain
    if (subtab.id === 'FondasiDesain') {
      // Urutan berdasarkan jumlah section per baris
      if (perRow === 1) {
        // Urutan untuk 1 section per baris: bahan, dimensi, tanah, beban
        if (bahan) bahan.style.order = 1;
        if (dimensi) dimensi.style.order = 2;
        if (tanah) tanah.style.order = 3;
        if (beban) beban.style.order = 4;
      } else if (perRow === 2) {
        // Urutan untuk 2 sections per baris: bahan, dimensi di baris 1; tanah, beban di baris 2
        if (bahan) bahan.style.order = 1;
        if (dimensi) dimensi.style.order = 2;
        if (tanah) tanah.style.order = 3;
        if (beban) beban.style.order = 4;
      } else {
        // Urutan untuk 3 atau lebih sections per baris: bahan, dimensi, tanah, beban
        if (bahan) bahan.style.order = 1;
        if (dimensi) dimensi.style.order = 2;
        if (tanah) tanah.style.order = 3;
        if (beban) beban.style.order = 4;
      }
      return; // Keluar dari fungsi untuk subtab ini
    }

    // Urutan khusus untuk FondasiEvaluasi
    if (subtab.id === 'FondasiEvaluasi') {
      // Urutan berdasarkan jumlah section per baris
      if (perRow === 1) {
        // Urutan untuk 1 section per baris: bahan, dimensi, tanah, beban
        if (bahan) bahan.style.order = 1;
        if (dimensi) dimensi.style.order = 2;
        if (tanah) tanah.style.order = 4;
        if (beban) beban.style.order = 5;
        if (tulangan) tulangan.style.order = 3;
      } else if (perRow === 2) {
        // Urutan untuk 2 sections per baris: bahan, dimensi di baris 1; tanah, beban di baris 2
        if (bahan) bahan.style.order = 1;
        if (dimensi) dimensi.style.order = 2;
        if (tanah) tanah.style.order = 3;
        if (beban) beban.style.order = 5;
        if (tulangan) tulangan.style.order = 4;
      } else if (perRow === 3) {
        // Urutan untuk 2 sections per baris: bahan, dimensi di baris 1; tanah, beban di baris 2
        if (bahan) bahan.style.order = 1;
        if (dimensi) dimensi.style.order = 2;
        if (tanah) tanah.style.order = 4;
        if (beban) beban.style.order = 3;
        if (tulangan) tulangan.style.order = 5;
      } else {
        // Urutan untuk 3 atau lebih sections per baris: bahan, dimensi, tanah, beban
        if (bahan) bahan.style.order = 1;
        if (dimensi) dimensi.style.order = 2;
        if (tanah) tanah.style.order = 3;
        if (beban) beban.style.order = 5;
        if (tulangan) tulangan.style.order = 4;
      }
      return; // Keluar dari fungsi untuk subtab ini
    }

    // Urutan default untuk subtab lainnya
    if (perRow === 1) {
      // urutan kalau 1 per baris
      if (dimensi) dimensi.style.order = 1;
      if (bahan)   bahan.style.order   = 2;
      if (tulangan)   tulangan.style.order   = 3;
      if (beban) beban.style.order = 4;
    } else if (perRow === 2) {
      // urutan kalau 2 per baris
      if (dimensi) dimensi.style.order = 1;
      if (bahan)   bahan.style.order   = 2;
      if (tulangan)   tulangan.style.order   = 3;
      if (beban) beban.style.order = 4;
    } else if (perRow === 3) {
      // urutan kalau 3 per baris
      if (dimensi) dimensi.style.order = 1;
      if (bahan)   bahan.style.order   = 2;
      if (beban)   beban.style.order   = 3;
      if (tulangan) tulangan.style.order = 4;
    } else {
      // default (misal 4 atau lebih per baris)
      if (dimensi) dimensi.style.order = 1;
      if (bahan)   bahan.style.order   = 2;
      if (tulangan)   tulangan.style.order   = 3;
      if (beban) beban.style.order = 4;
    }
  });
}


// Function to hide/show fake placeholder based on input value
function updatePlaceholder(input) {
  const wrapper = input.parentElement;
  const placeholder = wrapper.querySelector('.fake-placeholder');
  if (input.value.trim() !== '') {
    placeholder.style.display = 'none';
  } else {
    placeholder.style.display = 'block';
  }
}

// Add event listeners to all inputs with fake placeholders
document.querySelectorAll('.input-wrapper input').forEach(input => {
  updatePlaceholder(input); // Initial check
  input.addEventListener('input', function() {
    updatePlaceholder(this);
  });
  input.addEventListener('focus', function() {
    const placeholder = this.parentElement.querySelector('.fake-placeholder');
    placeholder.style.display = 'none';
  });
  input.addEventListener('blur', function() {
    updatePlaceholder(this);
  });
});

// Adjust overflow and order on load and resize
window.addEventListener('load', function() {
  adjustOverflow();
  adjustOrder();
});
// Observer untuk pantau perubahan layout
const observer = new ResizeObserver(() => {
  adjustOrder();
  adjustOverflow();
});

// Observe body agar kalau tinggi/width berubah, fungsi dipanggil lagi
observer.observe(document.body);

window.addEventListener('resize', function() {
  adjustOverflow();
  adjustOrder();
});

// Function for calculating Desain
function calculateDesain() {
  alert('Fungsi sementara dimatikan karena file report.html belum dibuat.');
  // window.open('report.html');
}

// Function for calculating Evaluasi
function calculateEvaluasi() {
  alert('Fungsi sementara dimatikan karena file report.html belum dibuat.');
  // window.open('report.html');
}
// Toggle for PelatDesain
document.getElementById('manual_pelat_desain').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_beban_pelat_desain').style.display = 'block';
    document.getElementById('auto_beban_pelat_desain').style.display = 'none';
  }
});
document.getElementById('auto_pelat_desain').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_beban_pelat_desain').style.display = 'none';
    document.getElementById('auto_beban_pelat_desain').style.display = 'block';
  }
});

// Toggle for PelatEvaluasi
document.getElementById('manual_pelat_evaluasi').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_beban_pelat_evaluasi').style.display = 'block';
    document.getElementById('auto_beban_pelat_evaluasi').style.display = 'none';
  }
});
document.getElementById('auto_pelat_evaluasi').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_beban_pelat_evaluasi').style.display = 'none';
    document.getElementById('auto_beban_pelat_evaluasi').style.display = 'block';
  }
});
    // Toggle for FondasiDesain
document.getElementById('manual_tanah_desain').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_tanah_desain_section').style.display = 'block';
    document.getElementById('auto_tanah_desain_section').style.display = 'none';
  }
});
document.getElementById('auto_tanah_desain').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_tanah_desain_section').style.display = 'none';
    document.getElementById('auto_tanah_desain_section').style.display = 'block';
  }
});
const checkboxterzaghi = document.getElementById("metode_terzaghi");
const inputs = [
document.getElementById("y_tanah_desain"),
document.getElementById("phi_tanah_desain"),
document.getElementById("c_tanah_desain")
];

checkboxterzaghi.addEventListener("change", function() {
inputs.forEach(input => {
  input.disabled = !this.checked;
});
});

const checkboxmayerhof = document.getElementById("metode_mayerhof");
const inputBox = document.getElementById("qc_tanah_desain");

checkboxmayerhof.addEventListener("change", function() {
inputBox.disabled = !this.checked;
});

// Toggle for FondasiDesain Dimensi
document.getElementById('manual_dimensi_fondasi_desain').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_dimensi_fondasi_desain_section').style.display = 'block';
    document.getElementById('auto_dimensi_fondasi_desain_section').style.display = 'none';
  }
});
document.getElementById('auto_dimensi_fondasi_desain').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_dimensi_fondasi_desain_section').style.display = 'none';
    document.getElementById('auto_dimensi_fondasi_desain_section').style.display = 'block';
  }
});

// Event listener untuk jenis fondasi di FondasiDesain
document.querySelectorAll('input[name="beban_mode_fondasi_desain"]').forEach(radio => {
  radio.addEventListener('change', function() {
    const isMenerus = this.value === 'Menerus';

    // Manual Dimensi Section
    const labelLkManual = document.getElementById('label_lk_fondasi_desain');
    const placeholderLkManual = document.getElementById('placeholder_lk_fondasi_desain').querySelector('text');
    const labelBkManual = document.getElementById('label_bk_fondasi_desain');
    const placeholderBkManual = document.getElementById('placeholder_bk_fondasi_desain').querySelector('text');

    if (isMenerus) {
      labelLkManual.innerHTML = 'L<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">s</text></svg>';
      placeholderLkManual.textContent = 'Panjang Bentang Sloof';
      labelBkManual.innerHTML = 'B<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">s</text></svg>';
      placeholderBkManual.textContent = 'Lebar Sloof';
    } else {
      labelLkManual.innerHTML = 'L<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">k</text></svg>';
      placeholderLkManual.textContent = 'Panjang Kolom';
      labelBkManual.innerHTML = 'B<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">k</text></svg>';
      placeholderBkManual.textContent = 'Lebar Kolom';
    }

    // Auto Dimensi Section
    const labelLkAuto = document.getElementById('label_lk_fondasi_desain_auto');
    const placeholderLkAuto = document.getElementById('placeholder_lk_fondasi_desain_auto').querySelector('text');
    const labelBkAuto = document.getElementById('label_bk_fondasi_desain_auto');
    const placeholderBkAuto = document.getElementById('placeholder_bk_fondasi_desain_auto').querySelector('text');

    if (isMenerus) {
      labelLkAuto.innerHTML = 'L<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">s</text></svg>';
      placeholderLkAuto.textContent = 'Panjang Bentang Sloof';
      labelBkAuto.innerHTML = 'B<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">s</text></svg>';
      placeholderBkAuto.textContent = 'Lebar Sloof';
    } else {
      labelLkAuto.innerHTML = 'L<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">k</text></svg>';
      placeholderLkAuto.textContent = 'Panjang Kolom';
      labelBkAuto.innerHTML = 'B<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">k</text></svg>';
      placeholderBkAuto.textContent = 'Lebar Kolom';
    }
  });
});

// Panggil saat halaman dimuat untuk memastikan status awal yang benar
document.addEventListener('DOMContentLoaded', function() {
  const initialFondasiType = document.querySelector('input[name="beban_mode_fondasi_desain"]:checked');
  if (initialFondasiType) {
    initialFondasiType.dispatchEvent(new Event('change'));
  }
});

// --- START: Penambahan untuk FondasiEvaluasi ---

// Toggle for FondasiEvaluasi - Data Tanah
document.getElementById('manual_tanah_evaluasi').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_tanah_evaluasi_section').style.display = 'block';
    document.getElementById('auto_tanah_evaluasi_section').style.display = 'none';
  }
});
document.getElementById('auto_tanah_evaluasi').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_tanah_evaluasi_section').style.display = 'none';
    document.getElementById('auto_tanah_evaluasi_section').style.display = 'block';
  }
});

// Toggle for FondasiEvaluasi - Metode Terzaghi
const checkboxterzaghiEvaluasi = document.getElementById("metode_terzaghi_evaluasi");
const inputsEvaluasiTerzaghi = [
  document.getElementById("y_tanah_evaluasi"),
  document.getElementById("phi_tanah_evaluasi"),
  document.getElementById("c_tanah_evaluasi")
];

checkboxterzaghiEvaluasi.addEventListener("change", function() {
  inputsEvaluasiTerzaghi.forEach(input => {
    input.disabled = !this.checked;
  });
});

// Toggle for FondasiEvaluasi - Metode Mayerhof
const checkboxmayerhofEvaluasi = document.getElementById("metode_mayerhof_evaluasi");
const inputBoxEvaluasiMayerhof = document.getElementById("qc_tanah_evaluasi");

checkboxmayerhofEvaluasi.addEventListener("change", function() {
  inputBoxEvaluasiMayerhof.disabled = !this.checked;
});

// Toggle for FondasiEvaluasi Dimensi
document.getElementById('manual_dimensi_fondasi_evaluasi').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_dimensi_fondasi_evaluasi_section').style.display = 'block';
    document.getElementById('auto_dimensi_fondasi_evaluasi_section').style.display = 'none';
  }
});
document.getElementById('auto_dimensi_fondasi_evaluasi').addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('manual_dimensi_fondasi_evaluasi_section').style.display = 'none';
    document.getElementById('auto_dimensi_fondasi_evaluasi_section').style.display = 'block';
  }
});

// Event listener untuk jenis fondasi di FondasiEvaluasi
document.querySelectorAll('input[name="beban_mode_fondasi_evaluasi"]').forEach(radio => {
  radio.addEventListener('change', function() {
    const isMenerus = this.value === 'Menerus';

    // Manual Dimensi Section
    const labelLkManual = document.getElementById('label_lk_fondasi_evaluasi');
    const placeholderLkManual = document.getElementById('placeholder_lk_fondasi_evaluasi').querySelector('text');
    const labelBkManual = document.getElementById('label_bk_fondasi_evaluasi');
    const placeholderBkManual = document.getElementById('placeholder_bk_fondasi_evaluasi').querySelector('text');

    if (isMenerus) {
      labelLkManual.innerHTML = 'L<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">s</text></svg>';
      placeholderLkManual.textContent = 'Panjang Bentang Sloof';
      labelBkManual.innerHTML = 'B<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">s</text></svg>';
      placeholderBkManual.textContent = 'Lebar Sloof';
    } else {
      labelLkManual.innerHTML = 'L<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">k</text></svg>';
      placeholderLkManual.textContent = 'Panjang Kolom';
      labelBkManual.innerHTML = 'B<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">k</text></svg>';
      placeholderBkManual.textContent = 'Lebar Kolom';
    }

    // Auto Dimensi Section
    const labelLkAuto = document.getElementById('label_lk_fondasi_evaluasi_auto');
    const placeholderLkAuto = document.getElementById('placeholder_lk_fondasi_evaluasi_auto').querySelector('text');
    const labelBkAuto = document.getElementById('label_bk_fondasi_evaluasi_auto');
    const placeholderBkAuto = document.getElementById('placeholder_bk_fondasi_evaluasi_auto').querySelector('text');

    if (isMenerus) {
      labelLkAuto.innerHTML = 'L<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">s</text></svg>';
      placeholderLkAuto.textContent = 'Panjang Bentang Sloof';
      labelBkAuto.innerHTML = 'B<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">s</text></svg>';
      placeholderBkAuto.textContent = 'Lebar Sloof';
    } else {
      labelLkAuto.innerHTML = 'L<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">k</text></svg>';
      placeholderLkAuto.textContent = 'Panjang Kolom';
      labelBkAuto.innerHTML = 'B<svg width="10" height="10" style="vertical-align: sub;"><text x="0" y="8" font-size="10">k</text></svg>';
      placeholderBkAuto.textContent = 'Lebar Kolom';
    }
  });
});

// Panggil saat halaman dimuat untuk memastikan status awal yang benar untuk FondasiEvaluasi
document.addEventListener('DOMContentLoaded', function() {
  const initialFondasiTypeEvaluasi = document.querySelector('input[name="beban_mode_fondasi_evaluasi"]:checked');
  if (initialFondasiTypeEvaluasi) {
    initialFondasiTypeEvaluasi.dispatchEvent(new Event('change'));
  }
});

// --- END: Penambahan untuk FondasiEvaluasi ---