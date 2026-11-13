const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts readable plain text from buffer (PDF or DOCX)
 * @param {Buffer} fileBuffer - File buffer in memory
 * @param {string} fileType - 'pdf' | 'docx'
 * @returns {Promise<{ text: string, wordCount: number }>}
 */
const extractTextFromBuffer = async (fileBuffer, fileType) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error('File buffer is empty or invalid.');
  }

  let rawText = '';

  if (fileType === 'pdf') {
    // Clone into an isolated, unpooled ArrayBuffer with byteOffset = 0
    // to guarantee 100% compatibility across all Node.js buffer allocators
    const isolatedUint8 = new Uint8Array(fileBuffer.length);
    isolatedUint8.set(fileBuffer);
    const isolatedBuffer = Buffer.from(isolatedUint8.buffer);
    const data = await pdfParse(isolatedBuffer);
    rawText = data.text || '';
  } else if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    rawText = result.value || '';
  } else {
    throw new Error('Unsupported file format. Only PDF and DOCX files are supported.');
  }

  // Normalize whitespace: trim lines and remove multi-blank lines
  const cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  if (!cleanedText || cleanedText.length < 15) {
    throw new Error(
      'Unable to extract readable text. The document appears to be empty, scanned as an image without OCR, or password-protected.'
    );
  }

  const words = cleanedText.split(/\s+/).filter(Boolean);

  return {
    text: cleanedText,
    wordCount: words.length
  };
};

module.exports = { extractTextFromBuffer };
