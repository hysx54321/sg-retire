import { domToCanvas } from 'modern-screenshot';
import { jsPDF } from 'jspdf';

let running = false;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Download a PDF of the planner as it is on screen, including content below the fold. */
export async function downloadPagePdf() {
  if (running) return;
  const root = document.querySelector('.app');
  if (!(root instanceof HTMLElement)) return;

  running = true;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  window.scrollTo(0, 0);
  root.classList.add('exporting');

  try {
    await document.fonts.ready;
    // Let the expanded layout and the chart resize before capture.
    await wait(450);
    const canvas = await domToCanvas(root, {
      scale: 2,
      backgroundColor: '#f3f4f6',
    });

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width, canvas.height],
      hotfixes: ['px_scaling'],
      compress: true,
    });
    pdf.addImage(canvas, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
    pdf.save(`sg-retire-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    root.classList.remove('exporting');
    window.scrollTo(scrollX, scrollY);
    running = false;
  }
}
