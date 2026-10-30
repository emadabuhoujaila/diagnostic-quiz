'use strict';

const path = require('path');
const express = require('express');
const multer = require('multer');
const { extractPdf } = require('./lib/extract-pdf');
const { read, save } = require('./lib/store');
const { analyzeLesson } = require('./lib/socratic');
const { wordsOf } = require('./lib/guard');
const { tutorTurn } = require('./lib/tutor');
const { geminiConfigured } = require('./lib/gemini');

const PORT = Number(process.env.PORT) || 3000;
const app = express();
app.disable('x-powered-by');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }
});

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const chatImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 4 }
});

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(express.json({ limit: '64kb' }));

function publicLesson(record, withText) {
  if (!record) return { hasLesson: false };
  const lesson = analyzeLesson(record.text, record.title);
  const payload = {
    hasLesson: true,
    title: record.title,
    savedAt: record.savedAt,
    pages: record.pages || 0,
    filename: record.filename || '',
    terms: lesson.terms
  };
  if (withText) payload.text = record.text;
  return payload;
}

function cleanTitle(value, filename) {
  let title = String(value || '').replace(/[\u0000-\u001f]/g, '').trim();
  if (!title && filename) {
    title = String(filename).replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
  }
  return title.slice(0, 120);
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, gemini: geminiConfigured() });
});

app.get('/api/lesson', (req, res) => {
  const record = read();
  const withText = req.query.view === 'teacher';
  res.json(publicLesson(record, withText));
});

app.post('/api/lesson', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'pdf-only' });
    const name = req.file.originalname || '';
    const type = req.file.mimetype || '';
    if (type !== 'application/pdf' && !/\.pdf$/i.test(name)) {
      return res.status(400).json({ error: 'pdf-only' });
    }
    const title = cleanTitle(req.body && req.body.title, name);
    if (!title) return res.status(400).json({ error: 'need-title' });

    const extracted = await extractPdf(req.file.buffer);
    if (!extracted.text || extracted.text.length < 40 || wordsOf(extracted.text).length < 8) {
      return res.status(422).json({ error: 'empty-pdf' });
    }

    const record = save({
      title,
      text: extracted.text.slice(0, 100000),
      pages: extracted.pages,
      filename: name.slice(0, 180),
      savedAt: new Date().toISOString()
    });
    res.json({ ok: true, lesson: publicLesson(record, true) });
  } catch (err) {
    console.error(err);
    res.status(422).json({ error: 'extract-failed' });
  }
});

function chatImagesMiddleware(req, res, next) {
  if (!req.is('multipart/form-data')) return next();
  chatImages.array('images', 4)(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'image-large' });
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'too-many-images' });
    }
    return next(err);
  });
}

function chatImagesFrom(req) {
  const files = Array.isArray(req.files) ? req.files : [];
  return files.slice(0, 4).map((file) => ({
    mime: file.mimetype,
    data: file.buffer.toString('base64')
  })).filter((image) => IMAGE_TYPES.has(image.mime) && image.data);
}

function chatHistory(body) {
  let history = body && body.history;
  if (typeof history === 'string') {
    try { history = JSON.parse(history); } catch (err) { history = []; }
  }
  return Array.isArray(history) ? history : [];
}

app.post('/api/chat', chatImagesMiddleware, async (req, res) => {
  const record = read();
  if (!record) return res.status(409).json({ error: 'no-lesson' });

  const lang = req.body && req.body.lang === 'en' ? 'en' : 'ar';
  const message = String((req.body && req.body.message) || '').slice(0, 2000);
  const images = chatImagesFrom(req);
  const lesson = analyzeLesson(record.text, record.title);
  const safe = await tutorTurn({
    lesson,
    history: chatHistory(req.body),
    message,
    lang,
    images
  });
  res.json({ reply: safe });
});

app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'too-large' });
  }
  console.error(err);
  return res.status(500).json({ error: 'server' });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Orrery listening on http://localhost:${PORT}`);
});
