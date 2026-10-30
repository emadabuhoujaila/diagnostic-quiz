'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
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

function tidyText(text) {
  return String(text || '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isUseful(text) {
  const value = tidyText(text);
  if (value.length < 40) return false;
  const words = value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.length >= 8;
}

function run(command, args, options) {
  const spawnOptions = { ...(options || {}) };
  const timeoutMs = spawnOptions.timeoutMs || 90000;
  delete spawnOptions.timeoutMs;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...spawnOptions, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const out = Buffer.concat(stdout).toString('utf8');
      const err = Buffer.concat(stderr).toString('utf8').trim();
      if (code !== 0) {
        const failure = new Error(signal ? `${command} timed out` : (err || `${command} exited ${code}`));
        failure.code = code;
        reject(failure);
        return;
      }
      resolve({ stdout: out, stderr: err });
    });
  });
}

let langChoice;

async function ocrLanguage() {
  if (langChoice) return langChoice;
  try {
    const listed = await run('tesseract', ['--list-langs']);
    const names = new Set(`${listed.stdout}\n${listed.stderr}`.split(/\s+/));
    const chosen = ['eng', 'ara'].filter((lang) => names.has(lang));
    langChoice = chosen.length ? chosen.join('+') : 'eng';
  } catch (err) {
    if (err && err.code === 'ENOENT') throw err;
    langChoice = 'eng';
  }
  return langChoice;
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }
  const width = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: width }, () => worker()));
  return results;
}

async function extractTextLayer(buffer) {
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
  const text = tidyText(pages.join('\n\n'));
  return { text, pages: doc.numPages || pages.length };
}

async function extractByOcr(buffer) {
  const lang = await ocrLanguage();
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'orrery-ocr-'));
  try {
    const pdfPath = path.join(dir, 'lesson.pdf');
    await fs.promises.writeFile(pdfPath, buffer);
    await run('pdftoppm', ['-png', '-scale-to-x', '1100', '-scale-to-y', '-1', '-f', '1', '-l', '40', pdfPath, path.join(dir, 'page')], { timeoutMs: 180000 });
    const names = (await fs.promises.readdir(dir))
      .filter((name) => name.endsWith('.png'))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const pageText = await mapPool(names, 2, async (name) => {
      const result = await run('tesseract', [
        path.join(dir, name),
        'stdout',
        '-l', lang,
        '--psm', '6',
        '--oem', '1'
      ], { env: { ...process.env, OMP_THREAD_LIMIT: '1' }, timeoutMs: 45000 });
      return result.stdout;
    });
    return {
      text: tidyText(pageText.filter(Boolean).join('\n\n')),
      pages: names.length
    };
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
}

async function extractPdf(buffer) {
  let layered = { text: '', pages: 0 };
  try {
    layered = await extractTextLayer(buffer);
  } catch (err) {
    layered = { text: '', pages: 0 };
  }
  if (isUseful(layered.text)) return layered;
  const ocr = await extractByOcr(buffer);
  if (isUseful(ocr.text)) return { text: ocr.text, pages: layered.pages || ocr.pages };
  return { text: ocr.text || layered.text, pages: layered.pages || ocr.pages };
}

module.exports = { extractPdf, isUseful };
