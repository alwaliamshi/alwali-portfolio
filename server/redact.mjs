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

  const originalWidth = meta.width || 1600;
  const originalHeight = meta.height || 1200;

  const resized = await sharp(buffer)
    .resize({
      width: Math.min(originalWidth, 2200),
      withoutEnlargement: true
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ocrInput = await sharp(buffer)
    .resize({ width: resized.info.width })
    .png()
    .toBuffer();

  const result = await worker.recognize(ocrInput);
  const regions = [];

  // If a line contains a sensitive label such as
  // "Certificate No" or "Verification", redact the whole OCR line.
  for (const line of result.data.lines || []) {
    const text = (line.text || '').trim();

    if (SENSITIVE_WORDS.test(text)) {
      const pad = 14;

      const left = Math.max(
        0,
        line.bbox.x0 - pad
      );

      const top = Math.max(
        0,
        line.bbox.y0 - pad
      );

      const right = Math.min(
        resized.info.width,
        line.bbox.x1 + pad
      );

      const bottom = Math.min(
        resized.info.height,
        line.bbox.y1 + pad
      );

      if (right > left && bottom > top) {
        regions.push({
          left,
          top,
          width: right - left,
          height: bottom - top
        });
      }
    }
  }

  // Detect QR codes and redact them.
  try {
    const { data, info } = resized;

    const imageData = {
      data,
      width: info.width,
      height: info.height
    };

    const qr = jsQR(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    if (qr?.location) {
      const xs = [
        qr.location.topLeftCorner.x,
        qr.location.topRightCorner.x,
        qr.location.bottomLeftCorner.x,
        qr.location.bottomRightCorner.x
      ];

      const ys = [
        qr.location.topLeftCorner.y,
        qr.location.topRightCorner.y,
        qr.location.bottomLeftCorner.y,
        qr.location.bottomRightCorner.y
      ];

      const left = Math.max(
        0,
        Math.min(...xs) - 16
      );

      const top = Math.max(
        0,
        Math.min(...ys) - 16
      );

      const right = Math.min(
        resized.info.width,
        Math.max(...xs) + 16
      );

      const bottom = Math.min(
        resized.info.height,
        Math.max(...ys) + 16
      );

      if (right > left && bottom > top) {
        regions.push({
          left,
          top,
          width: right - left,
          height: bottom - top
        });
      }
    }
  } catch {}

  const scaleX = originalWidth / resized.info.width;
  const scaleY = originalHeight / resized.info.height;

  const composites = regions
    .map((region) => {
      const left = Math.max(
        0,
        Math.min(
          originalWidth - 1,
          Math.round(region.left * scaleX)
        )
      );

      const top = Math.max(
        0,
        Math.min(
          originalHeight - 1,
          Math.round(region.top * scaleY)
        )
      );

      const right = Math.min(
        originalWidth,
        Math.round((region.left + region.width) * scaleX)
      );

      const bottom = Math.min(
        originalHeight,
        Math.round((region.top + region.height) * scaleY)
      );

      const width = Math.max(1, right - left);
      const height = Math.max(1, bottom - top);

      return {
        input: {
          create: {
            width,
            height,
            channels: 4,
            background: {
              r: 255,
              g: 255,
              b: 255,
              alpha: 1
            }
          }
        },
        left,
        top
      };
    })
    .filter(
      (item) =>
        item.left + item.input.create.width <= originalWidth &&
        item.top + item.input.create.height <= originalHeight
    );

  let output = sharp(buffer);

  if (composites.length) {
    output = output.composite(composites);
  }

  // Add the public-copy marker without exceeding the page dimensions.
  const markerWidth = Math.min(900, originalWidth);
  const markerHeight = Math.min(70, originalHeight);

  const markerFontSize = Math.max(
    12,
    Math.min(28, Math.floor(markerWidth / 32))
  );

  const marker = `
    <svg width="${markerWidth}" height="${markerHeight}">
      <rect
        width="${markerWidth}"
        height="${markerHeight}"
        fill="white"
        fill-opacity="0.86"
      />
      <text
        x="12"
        y="${Math.min(markerHeight - 12, markerFontSize + 12)}"
        font-family="Arial"
        font-size="${markerFontSize}"
        fill="#333"
      >
        PUBLIC PORTFOLIO COPY • Sensitive verification details redacted
      </text>
    </svg>
  `;

  output = output.composite([
    {
      input: Buffer.from(marker),
      gravity: 'southeast'
    }
  ]);

    return output.toBuffer();
}

export async function generatePublicCopy(inputPath, mimeType, outputPath) {
  const worker = await createWorker('eng');

  try {
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
