import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function printElement(elementId: string, fileName: string = 'document.pdf') {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Print element not found:', elementId);
        return;
    }

    const canvas = await html2canvas(element, {
        scale: 2, // sharper output
        useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');

    // A4 size in mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // handle multi-page content
    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    // opens print dialog directly instead of just downloading
    pdf.autoPrint();
    window.open(pdf.output('bloburl'), '_blank');

    // if you'd rather just download instead of print-preview, use:
    // pdf.save(fileName);
}