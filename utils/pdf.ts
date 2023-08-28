import { jsPDF } from "jspdf";

export const createPDF = (base64Img: string, estimateHeight: number, estimateWidth: number) => {
    // Create a new jsPDF instance
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
    });
    // Add the image to the PDF
    pdf.addImage(base64Img, 'PNG', 0, 0, estimateWidth, estimateHeight);

    // Convert PDF output to a Uint8Array
    const pdfOutput = pdf.output();
    const pdfData = new Uint8Array(pdfOutput.length);
    for (let i = 0; i < pdfOutput.length; i++) {
        pdfData[i] = pdfOutput.charCodeAt(i);
    }

    return pdfData;
};