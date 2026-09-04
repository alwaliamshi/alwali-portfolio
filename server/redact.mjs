import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

const SENSITIVE_WORDS = /certificate|cert\.?\s*(no|number|#)|serial\s*(no|number|#)|verification|verify|credential\s*(id|no|number)|reference\s*(no|number)|registration\s*(no|number)/i;
const LONG_ID = /^(?=.*[0-9])[A-Z0-9][A-Z0-9\-_/]{5,}$/i;

function shouldRedact(text) {
  const t = String(text || '').trim();
  return SENSITIVE_WORDS.test(t) || LONG_ID.test(t.replace(/[.,:;()]/g, ''));
}

async function redactImageBuffer(buffer, worker) {
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 1600;
  const height = meta.height || 1200;
  const rgba = await sharp(buffer).resize({ width: Math.min(width, 2200), withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ocrInput = await sharp(buffer).resize({ width: rgba.info.width }).png().toBuffer();
  const result = await worker.recognize(ocrInput);
  const regions = [];
  // If a line contains a sensitive label such as 'Certificate No' or 'Verification',
  // redact the whole OCR line so the identifier beside it is removed as well.
  for (const line of result.data.lines || []) {
    const text = (line.text || '').trim();
    if (SENSITIVE_WORDS.test(text)) {
      const pad = 14;
      regions.push({ left: Math.max(0, line.bbox.x0 - pad), top: Math.max(0, line.bbox.y0 - pad), width: line.bbox.x1 - line.bbox.x0 + pad * 2, height: line.bbox.y1 - line.bbox.y0 + pad * 2 });
    }
  }
  for (const word of result.data.words || []) {
    if (shouldRedact(word.text)) {
      const padX = Math.max(12, Math.round((word.bbox.x1 - word.bbox.x0) * 0.18));
      const padY = Math.max(10, Math.round((word.bbox.y1 - word.bbox.y0) * 0.45));
      regions.push({ left: Math.max(0, word.bbox.x0 - padX), top: Math.max(0, word.bbox.y0 - padY), width: word.bbox.x1 - word.bbox.x0 + padX * 2, height: word.bbox.y1 - word.bbox.y0 + padY * 2 });
    }
  }
  // Detect QR codes/barcodes using jsQR on the OCR-sized raster.
  try {
    const { data, info } = rgba;
    const qr = jsQR(new Uint8ClampedArray(data), info.width, info.height, { inversionAttempts: 'attemptBoth' });
    if (qr?.location) {
      const xs = [qr.location.topLeftCorner.x, qr.location.topRightCorner.x, qr.location.bottomLeftCorner.x, qr.location.bottomRightCorner.x];
      const ys = [qr.location.topLeftCorner.y, qr.location.topRightCorner.y, qr.location.bottomLeftCorner.y, qr.location.bottomRightCorner.y];
      const left = Math.max(0, Math.min(...xs) - 16), top = Math.max(0, Math.min(...ys) - 16);
      regions.push({ left, top, width: Math.max(...xs) - Math.min(...xs) + 32, height: Math.max(...ys) - Math.min(...ys) + 32 });
    }
  } catch {}

  const scaleX = (meta.width || rgba.info.width) / rgba.info.width;
  const scaleY = (meta.height || rgba.info.height) / rgba.info.height;
  const composites = regions.map((r) => ({ input: { create: { width: Math.max(1, Math.round(r.width * scaleX)), height: Math.max(1, Math.round(r.height * scaleY)), channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }, left: Math.round(r.left * scaleX), top: Math.round(r.top * scaleY) }));
  let output = sharp(buffer);
  if (composites.length) output = output.composite(composites);
  // Always add a small public-copy marker so the derivative is clearly identifiable.
  const marker = `<svg width="900" height="70"><rect width="900" height="70" fill="white" fill-opacity="0.86"/><text x="20" y="46" font-family="Arial" font-size="28" fill="#333">PUBLIC PORTFOLIO COPY • Sensitive verification details redacted</text></svg>`;
  output = output.composite([{ input: Buffer.from(marker), gravity: 'southeast' }]);
  return output.toBuffer();
}

export async function generatePublicCopy(inputPath, mimeType, outputPath) {
  const worker = await createWorker('eng');
  try {
    if (mimeType.startsWith('image/')) {
      const redacted = await redactImageBuffer(await fs.readFile(inputPath), worker);
      await fs.writeFile(outputPath, redacted);
      return { mimeType: 'image/png', extension: '.png' };
    }
    if (mimeType === 'application/pdf') {
      const pdfData = await fs.readFile(inputPath);
      const pdf = await getDocument({ data: new Uint8Array(pdfData), disableWorker: true }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const redacted = await redactImageBuffer(canvas.toBuffer('image/png'), worker);
        const img = await out.embedPng(redacted);
        const p = out.addPage([viewport.width, viewport.height]);
        p.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      }
      await fs.writeFile(outputPath, await out.save());
      return { mimeType: 'application/pdf', extension: '.pdf' };
    }
    throw new Error('Automatic public-copy redaction supports image and PDF certificates only.');
  } finally {
    await worker.terminate();
  }
}
