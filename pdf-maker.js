function generatePdf() {
    const containers = document.querySelectorAll('.page-container');
    if (!containers.length) return;

    const opt = {
        margin: [0, 0, 0, 0], // nol total
        filename: 'laporan.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    // Mulai dari halaman pertama
    let worker = html2pdf().set(opt).from(containers[0]).toPdf();

    // Tambahkan halaman berikutnya
    containers.forEach((c, i) => {
        if (i === 0) return; // skip halaman pertama
        worker = worker.get('pdf').then(pdf => {
            pdf.addPage();
            return pdf.html(c, {
                x: 0,
                y: 0,
                margin: [-200, 0, 0, 0],
                autoPaging: false
            });
        });
    });

    worker.save();
}
