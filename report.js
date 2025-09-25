// report.js
document.getElementById('tgl').textContent = new Date().toLocaleDateString('id-ID', { 
  year:'numeric', month:'short', day:'numeric'
});

function downloadFullReport(){
  alert("[Dummy] Fungsi Unduh Laporan Lengkap — implementasikan dengan jsPDF/html2pdf.");
}
function showFullReport(){
  alert("[Dummy] Fungsi Tampilkan Laporan Lengkap — implementasikan sesuai kebutuhan.");
}
function exportCAD(){
  alert("[Dummy] Fungsi Export ke CAD — butuh generator DXF/SVG untuk CAD.");
}

function goBack(e){
  e && e.preventDefault && e.preventDefault();
  if(window.history && window.history.length > 1){
    try{ window.history.back(); } catch(err){ window.location.href = "/"; }
  } else {
    window.location.href = "/";
  }
}

// efek klik pada tombol bulat
document.addEventListener('pointerdown', function(ev){
  const c = ev.target.closest && ev.target.closest('.circle');
  if(c) c.classList.add('pressed');
});
document.addEventListener('pointerup', function(ev){
  const c = ev.target.closest && ev.target.closest('.circle');
  if(c) c.classList.remove('pressed');
});
function scaleProses() {
  const wrapper = document.querySelector('.proses-perhitungan');
  const content = document.querySelector('.proses-scale');
  if (!wrapper || !content) return;

  // reset font sizes ke ukuran default
  const stepDescs = content.querySelectorAll('.step-desc');
  const stepFormulas = content.querySelectorAll('.step-formula');
  const stepResults = content.querySelectorAll('.step-result');

  stepDescs.forEach(el => el.style.fontSize = '');
  stepFormulas.forEach(el => el.style.fontSize = '');
  stepResults.forEach(el => el.style.fontSize = '');

  wrapper.style.overflow = 'visible';
  wrapper.style.height = 'auto';

  // clone untuk pengukuran
  const clone = content.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.visibility = 'hidden';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.width = wrapper.clientWidth + 'px'; // set lebar sama dengan wrapper
  clone.style.fontSize = ''; // reset font size untuk pengukuran

  document.body.appendChild(clone);

  // ukur dengan getBoundingClientRect
  const rect = clone.getBoundingClientRect();
  const unwrappedWidth = rect.width;

  document.body.removeChild(clone);

  const parentWidth = wrapper.clientWidth || wrapper.getBoundingClientRect().width;
  let fontScale = parentWidth / (unwrappedWidth || 1);
  if (fontScale > 1) fontScale = 1; // jangan zoom in

  // terapkan font scaling ke elemen-elemen
  const scaledFontSize = 14 * fontScale; // base font size 14px

  stepDescs.forEach(el => el.style.fontSize = scaledFontSize + 'px');
  stepFormulas.forEach(el => el.style.fontSize = scaledFontSize + 'px');
  stepResults.forEach(el => el.style.fontSize = scaledFontSize + 'px');

  // update MathJax font size jika ada
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise().then(() => {
      // MathJax akan otomatis adjust berdasarkan font size parent
    });
  }
}

// debounce untuk resize
let _scaleTimer = null;
function triggerScale() {
  clearTimeout(_scaleTimer);
  _scaleTimer = setTimeout(scaleProses, 80);
};
window.addEventListener('resize', triggerScale);
  const tgl = new Date();
  const tanggalString = tgl.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  document.getElementById('tgl').textContent = tanggalString;