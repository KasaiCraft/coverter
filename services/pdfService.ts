import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set the worker source for pdf.js. This is crucial for it to work in the browser.
// Using a CDN for simplicity.
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file to process.
 * @returns A Promise that resolves to the concatenated text content of the PDF.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // Concatenate text items, adding a space if it seems like a word break,
    // and a newline at the end of each page.
    fullText += textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim() + '\n\n'; // Add double newline between pages for better readability
  }
  return fullText.trim();
}
