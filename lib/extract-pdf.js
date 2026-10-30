'use strict';

const path = require('path');
const { pathToFileURL } = require('url');

let pdfjsPromise;

function loadPdfjs() {
  if (!pdfjsPromise) pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjsPromise;
}

function assetUrl(folder) {
  const dir = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), folder);
  const href = pathToFileURL(dir).href;
  return href.endsWith('/') ? href : `${href}/`;
}

function rebuildLine(row) {
  const sorted = row.slice().sort((a, b) => a.transform[4] - b.transform[4]);
  const rtl = sorted.filter((item) => item.dir === 'rtl').length > sorted.length / 2;
  const pieces = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const item = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      const gap = item.transform[4] - (prev.transform[4] + (prev.width || 0));
      if (gap > 1.2) pieces.push(' ');
    }
    pieces.push(item.str);
  }
  let line = pieces.join('');
  const chars = Array.from(line);
  const presentation = chars.filter((ch) => /[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(ch)).length;
  if (rtl && presentation > chars.length * 0.25) {
    line = chars.reverse().map((ch) => ch.normalize('NFKC')).join('');
  } else if (rtl) {
    line = line.split(/(\s+)/).reverse().join('');
  }
  return line.replace(/[ \t]{2,}/g, ' ').trim();
}

function rebuildPage(content) {
  const items = (content.items || []).filter((item) => item && item.str && item.str.trim() && item.transform);
  const lines = new Map();
  items.forEach((item) => {
    const y = Math.round(item.transform[5]);
    let key = y;
    for (const existing of lines.keys()) {
      if (Math.abs(existing - y) <= 2) {
        key = existing;
        break;
      }
    }
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push(item);
  });
  return Array.from(lines.keys())
    .sort((a, b) => b - a)
    .map((key) => rebuildLine(lines.get(key)))
    .filter(Boolean)
    .join('\n');
}

async function extractPdf(buffer) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: true,
    standardFontDataUrl: assetUrl('standard_fonts'),
    cMapUrl: assetUrl('cmaps'),
    cMapPacked: true,
    verbosity: 0
  }).promise;

  const pages = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    pages.push(rebuildPage(await page.getTextContent()));
  }
  const text = pages
    .join('\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text, pages: doc.numPages || pages.length };
}

module.exports = { extractPdf };
