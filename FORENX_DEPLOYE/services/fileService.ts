import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker manually for the browser environment
if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

export const fileService = {
  /**
   * Reads a file and extracts text content.
   * Supports PDF parsing and plain text reading.
   */
  readFileContent: async (inputFile: File): Promise<string> => {
    const fileType = inputFile.name.toLowerCase();

    if (fileType.endsWith('.pdf')) {
      return await extractTextFromPDF(inputFile);
    } else {
      return await readTextFile(inputFile);
    }
  }
};

/**
 * Extracts text from a PDF file using pdfjs-dist
 */
async function extractTextFromPDF(pdfFile: File): Promise<string> {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Limit pages to avoid browser crash on massive reports
    const maxPages = Math.min(pdf.numPages, 20); 

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    if (pdf.numPages > maxPages) {
      fullText += `\n...[Truncated remaining ${pdf.numPages - maxPages} pages]...`;
    }

    return fullText;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file. Ensure it is not password protected.");
  }
}

/**
 * Reads plain text files (logs, xml, txt, etc)
 */
function readTextFile(textFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(textFile);
  });
}