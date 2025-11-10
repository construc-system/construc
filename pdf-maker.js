function scaleButtons() {
    const width = window.innerWidth;
    const minScale = width < 768 ? 2 : 1.2;
    const scale = Math.max(minScale, width / 1200);
    const buttons = document.querySelectorAll('.circle.action-button');

    buttons.forEach(button => {
        const size = 56 * scale;
        button.style.width = size + 'px';
        button.style.height = size + 'px';

        // Scale ikon SVG (panah)
        const svg = button.querySelector('svg');
        if (svg) {
            svg.style.strokeWidth = (2 / scale) + 'px';
        }

        // Scale ikon IMG (print)
        const img = button.querySelector('img');
        if (img) {
            const iconSize = 24 * scale;
            img.style.width = iconSize + 'px';
            img.style.height = iconSize + 'px';
        }
    });
}

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

// Event listener untuk scaling tombol
window.addEventListener('load', scaleButtons);
window.addEventListener('resize', scaleButtons);
