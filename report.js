document.getElementById('tgl').textContent = new Date().toLocaleDateString('id-ID', { year:'numeric', month:'short', day:'numeric'});

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
document.addEventListener('pointerdown', function(ev){
  const c = ev.target.closest && ev.target.closest('.circle');
  if(c) c.classList.add('pressed');
});
document.addEventListener('pointerup', function(ev){
  const c = ev.target.closest && ev.target.closest('.circle');
  if(c) c.classList.remove('pressed');
});