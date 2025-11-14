// report-integration.js
class ReportIntegration {
  constructor() {
    this.currentModule = 'balok';
    this.currentMode = 'desain';
    this.reportData = null;
  }

  // Load data dari localStorage
  loadReportData() {
    try {
      const savedData = localStorage.getItem('concretecalc_report_data');
      if (savedData) {
        this.reportData = JSON.parse(savedData);
        this.currentModule = this.reportData.module || 'balok';
        this.currentMode = this.reportData.mode || 'desain';
        return true;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    }
    return false;
  }

  // Apply warna dari index.html
  applyThemeColors() {
    try {
      const savedColors = localStorage.getItem('concretecalc_colors');
      if (savedColors) {
        const colors = JSON.parse(savedColors);
        
        // Terapkan warna ke variabel CSS di report.html
        document.documentElement.style.setProperty('--accent', colors.colorLabels || '#163172');
        document.documentElement.style.setProperty('--muted', colors.colorBorders || '#6b7280');
        document.documentElement.style.setProperty('--paper', colors.bgBody || '#f8fafc');
        
        // Update warna tombol dan elemen lainnya
        this.updateDynamicColors(colors);
      }
    } catch (error) {
      console.error('Error applying theme colors:', error);
    }
  }

  // Update warna dinamis untuk elemen UI
  updateDynamicColors(colors) {
    // Update tombol
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (button.classList.contains('glass')) {
        button.style.background = colors.colorButtons || '#282B53';
        button.style.color = this.getContrastColor(colors.colorButtons);
      }
    });

    // Update card borders
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.style.borderLeftColor = colors.colorBorders || '#1C1136';
    });

    // Update header colors
    const headers = document.querySelectorAll('h1, h2, h3');
    headers.forEach(header => {
      header.style.color = colors.colorLabels || '#202242';
    });
  }

  // Helper untuk menentukan warna kontras
  getContrastColor(hexcolor) {
    if (!hexcolor) return '#ffffff';
    
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  // Render report berdasarkan modul
  renderReport() {
    if (!this.reportData) {
      this.showErrorMessage('Tidak ada data laporan yang ditemukan.');
      return;
    }

    const { module, mode, result } = this.reportData;
    
    if (result.status === 'error') {
      this.showErrorMessage(result.message);
      return;
    }

    // Render berdasarkan modul
    switch (module) {
      case 'balok':
        this.renderBalokReport(result);
        break;
      case 'kolom':
        this.renderKolomReport(result);
        break;
      case 'pelat':
        this.renderPelatReport(result);
        break;
      case 'fondasi':
        this.renderFondasiReport(result);
        break;
      default:
        this.showErrorMessage(`Modul "${module}" belum didukung.`);
    }
  }

  // Render laporan balok
  renderBalokReport(result) {
    // Update judul
    document.getElementById('currentModuleName').textContent = 'Balok';
    
    // Render input data
    this.renderBalokInputData(result);
    
    // Render proses perhitungan
    this.renderBalokCalculation(result);
    
    // Render ringkasan tulangan
    this.renderBalokReinforcement(result);
    
    // Render penampang (jika ada)
    this.renderBalokSection(result);
  }

  // Render input data untuk balok
  renderBalokInputData(result) {
    const inputDataGrid = document.querySelector('.input-data .grid');
    if (!inputDataGrid) return;

    const { data, kontrol } = result;
    
    let html = `
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 10px;">
          <div class="feature-icon">1</div>
          Dimensi
        </h3>
        <div>
          <div class="value">b = ${data.dimensi?.b || 'N/A'} mm</div>
          <div class="value">h = ${data.dimensi?.h || 'N/A'} mm</div>
          <div class="value">S<sub>b</sub> = ${data.dimensi?.sb || 'N/A'} mm</div>
        </div>
      </div>

      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 10px;">
          <div class="feature-icon">2</div>
          Material
        </h3>
        <div>
          <div class="value">f'<sub>c</sub> = ${data.material?.fc || 'N/A'} MPa</div>
          <div class="value">f<sub>y</sub> = ${data.material?.fy || 'N/A'} MPa</div>
          <div class="value">f<sub>yt</sub> = ${data.material?.fyt || 'N/A'} MPa</div>
        </div>
      </div>

      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 10px;">
          <div class="feature-icon">3</div>
          Tulangan
        </h3>
        <div>
          <div class="value">D = ${data.tulangan?.d || 'N/A'} mm</div>
          <div class="value">ɸ = ${data.tulangan?.phi || 'N/A'} mm</div>
        </div>
      </div>
    `;

    // Data lanjutan
    html += `
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 10px;">
          <div class="feature-icon">4</div>
          Parameter
        </h3>
        <div>
          <div class="value">λ = ${data.lanjutan?.lambda || '1.0'}</div>
          <div class="value">n = ${data.lanjutan?.n || '2'}</div>
          <div class="value">β<sub>1</sub> = ${data.beta1?.toFixed(3) || 'N/A'}</div>
        </div>
      </div>
    `;

    // Status kontrol
    html += `
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 10px;">
          <div class="feature-icon">5</div>
          Status
        </h3>
        <div>
          <div class="value">Mode: ${this.currentMode}</div>
          <div class="value">Status: <span style="color: ${result.status === 'sukses' ? 'green' : 'red'}">${result.status}</span></div>
        </div>
      </div>
    `;

    inputDataGrid.innerHTML = html;
  }

  // Render proses perhitungan balok
  renderBalokCalculation(result) {
    const prosesScale = document.querySelector('.proses-scale');
    if (!prosesScale) return;

    const { data, kontrol } = result;
    
    let html = '<ol class="steps">';
    
    // Contoh langkah-langkah perhitungan
    if (data.tulanganKirinegatif) {
      html += `
        <li>
          <div class="step-desc">Tulangan lentur tumpuan kiri (negatif)</div>
          <div class="step-body">
            <div class="step-formula">A<sub>s</sub> = ${data.tulanganKirinegatif.AsTerpakai?.toFixed(2) || 'N/A'} mm²</div>
            <div class="step-result">→ ${data.tulanganKirinegatif.n || 'N/A'} batang</div>
          </div>
        </li>
      `;
    }

    if (data.tulanganTengahpositif) {
      html += `
        <li>
          <div class="step-desc">Tulangan lentur lapangan (positif)</div>
          <div class="step-body">
            <div class="step-formula">A<sub>s</sub> = ${data.tulanganTengahpositif.AsTerpakai?.toFixed(2) || 'N/A'} mm²</div>
            <div class="step-result">→ ${data.tulanganTengahpositif.n || 'N/A'} batang</div>
          </div>
        </li>
      `;
    }

    if (data.begelkiri) {
      html += `
        <li>
          <div class="step-desc">Tulangan geser tumpuan kiri</div>
          <div class="step-body">
            <div class="step-formula">A<sub>v</sub> = ${data.begelkiri.Av_terpakai || 'N/A'} mm²/m</div>
            <div class="step-result">→ Jarak: ${data.begelkiri.sTerkecil || 'N/A'} mm</div>
          </div>
        </li>
      `;
    }

    html += '</ol>';
    prosesScale.innerHTML = html;

    // Render MathJax jika ada
    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise();
    }
  }

  // Render ringkasan tulangan balok
  renderBalokReinforcement(result) {
    const calculationResults = document.querySelector('.calculation-results');
    if (!calculationResults) return;

    const { rekap, data } = result;
    
    let html = '';

    // Data dari rekap
    if (rekap) {
      html += `
        <div class="result-item">
          <h4>Tulangan Tumpuan</h4>
          <p>Negatif: ${rekap.tumpuan?.tulangan_negatif || 'N/A'}</p>
          <p>Positif: ${rekap.tumpuan?.tulangan_positif || 'N/A'}</p>
          <p>Begel: ${rekap.tumpuan?.begel || 'N/A'}</p>
        </div>

        <div class="result-item">
          <h4>Tulangan Lapangan</h4>
          <p>Negatif: ${rekap.lapangan?.tulangan_negatif || 'N/A'}</p>
          <p>Positif: ${rekap.lapangan?.tulangan_positif || 'N/A'}</p>
          <p>Begel: ${rekap.lapangan?.begel || 'N/A'}</p>
        </div>
      `;
    }

    // Data kontrol
    if (result.kontrol_rekap) {
      const kr = result.kontrol_rekap;
      html += `
        <div class="result-item">
          <h4>Kontrol Tumpuan</h4>
          <p>Lentur: ${kr.tumpuan?.lentur_negatif?.aman ? '✅' : '❌'}</p>
          <p>Geser: ${kr.tumpuan?.geser?.aman ? '✅' : '❌'}</p>
        </div>

        <div class="result-item">
          <h4>Kontrol Lapangan</h4>
          <p>Lentur: ${kr.lapangan?.lentur_positif?.aman ? '✅' : '❌'}</p>
          <p>Geser: ${kr.lapangan?.geser?.aman ? '✅' : '❌'}</p>
        </div>
      `;
    }

    calculationResults.innerHTML = html;
  }

  // Render penampang balok
  renderBalokSection(result) {
    // Implementasi rendering penampang balok bisa ditambahkan di sini
    console.log('Rendering balok section:', result);
  }

  // Method untuk modul lainnya
  renderKolomReport(result) {
    this.showErrorMessage('Laporan untuk modul Kolom belum diimplementasikan.');
  }

  renderPelatReport(result) {
    this.showErrorMessage('Laporan untuk modul Pelat belum diimplementasikan.');
  }

  renderFondasiReport(result) {
    this.showErrorMessage('Laporan untuk modul Fondasi belum diimplementasikan.');
  }

  showErrorMessage(message) {
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2>❌ Error</h2>
          <p>${message}</p>
          <button onclick="window.location.href='index.html'" class="btn primary" style="margin-top: 20px;">
            Kembali ke Aplikasi
          </button>
        </div>
      `;
    }
  }

  // Initialize report
  init() {
    // Apply theme colors
    this.applyThemeColors();
    
    // Load and render report data
    if (this.loadReportData()) {
      this.renderReport();
    } else {
      this.showErrorMessage('Tidak dapat memuat data laporan. Silakan kembali dan lakukan perhitungan ulang.');
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tombol kembali
    const backButton = document.querySelector('.circle.glass');
    if (backButton) {
      backButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
      });
    }

    // Tombol export CAD
    const cadButton = document.querySelector('button[onclick="exportCAD()"]');
    if (cadButton) {
      cadButton.addEventListener('click', () => {
        this.exportToCAD();
      });
    }
  }

  exportToCAD() {
    if (this.reportData) {
      const cadData = this.generateCADData(this.reportData);
      navigator.clipboard.writeText(cadData).then(() => {
        alert('Data CAD berhasil disalin ke clipboard!');
      }).catch(err => {
        console.error('Gagal menyalin: ', err);
        alert('Gagal menyalin data CAD.');
      });
    }
  }

  generateCADData(reportData) {
    // Implementasi generate data CAD berdasarkan reportData
    const { module, result } = reportData;
    
    let cadText = `; CAD Data for ${module.toUpperCase()}\n`;
    cadText += `; Generated by ConcreteCalc\n`;
    cadText += `; Date: ${new Date().toLocaleString()}\n\n`;
    
    if (module === 'balok' && result.rekap) {
      cadText += `; TULANGAN TUMPUAN\n`;
      cadText += `; Negatif: ${result.rekap.tumpuan.tulangan_negatif}\n`;
      cadText += `; Positif: ${result.rekap.tumpuan.tulangan_positif}\n`;
      cadText += `; Begel: ${result.rekap.tumpuan.begel}\n\n`;
      
      cadText += `; TULANGAN LAPANGAN\n`;
      cadText += `; Negatif: ${result.rekap.lapangan.tulangan_negatif}\n`;
      cadText += `; Positif: ${result.rekap.lapangan.tulangan_positif}\n`;
      cadText += `; Begel: ${result.rekap.lapangan.begel}\n`;
    }
    
    return cadText;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const report = new ReportIntegration();
  report.init();
});

// Export untuk global access
if (typeof window !== 'undefined') {
  window.ReportIntegration = ReportIntegration;
}