// Requires: npm install jspdf html2canvas
export async function downloadInvoicePdf(filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

  const node = document.getElementById('invoice-print-area');
  if (!node) {
    throw new Error('Could not find the invoice on this page.');
  }

  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pageWidth - 48;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 24, 24, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
}