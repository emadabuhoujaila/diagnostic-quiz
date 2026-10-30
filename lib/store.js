'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.LESSON_DIR || path.join(__dirname, '..', 'data');
const LEGACY_FILE = process.env.LESSON_PATH || path.join(DATA_DIR, 'lesson.json');
const LESSON_BUCKET = String(process.env.LESSON_BUCKET || '').trim();
const PREFIX = 'lessons/';

let tokenCache = { value: '', exp: 0 };

function newId() {
  return `${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
}

function safeId(id) {
  const raw = String(id || '');
  const clean = raw.replace(/[^A-Za-z0-9_-]/g, '');
  if (!clean || clean !== raw) return '';
  return clean.slice(0, 80);
}

function shape(data, id) {
  if (!data || typeof data.text !== 'string' || !data.text.trim() || !data.title) return null;
  const title = String(data.title).replace(/[\u0000-\u001f]/g, '').trim().slice(0, 120);
  if (!title) return null;
  const clean = safeId(id || data.id) || newId();
  return {
    id: clean,
    title,
    text: String(data.text).slice(0, 100000),
    pages: Number(data.pages) || 0,
    filename: String(data.filename || '').slice(0, 180),
    savedAt: data.savedAt || new Date().toISOString()
  };
}

function lessonsDir() {
  return path.join(DATA_DIR, 'lessons');
}

function lessonFile(id) {
  return path.join(lessonsDir(), `${id}.json`);
}

function byNewest(list) {
  return list.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
}

function writeNewFile(record) {
  fs.mkdirSync(lessonsDir(), { recursive: true });
  const file = lessonFile(record.id);
  let fd;
  try {
    fd = fs.openSync(file, 'wx');
  } catch (err) {
    if (err && err.code === 'EEXIST') throw new Error('lesson-exists');
    throw err;
  }
  try {
    fs.writeFileSync(fd, JSON.stringify(record));
  } finally {
    fs.closeSync(fd);
  }
  return record;
}

function readLegacyFile() {
  try {
    return shape(JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf8')), newId());
  } catch (err) {
    return null;
  }
}

function lessonsOnDisk() {
  let names = [];
  try {
    names = fs.readdirSync(lessonsDir()).filter((name) => name.endsWith('.json'));
  } catch (err) {
    return [];
  }
  const lessons = [];
  names.forEach((name) => {
    const id = safeId(name.replace(/\.json$/, ''));
    if (!id) return;
    try {
      const record = shape(JSON.parse(fs.readFileSync(path.join(lessonsDir(), name), 'utf8')), id);
      if (record) lessons.push(record);
    } catch (err) {
      /* skip a damaged file */
    }
  });
  return lessons;
}

function sameLesson(a, b) {
  return Boolean(a && b && a.title === b.title && a.text === b.text);
}

function importLegacyFile() {
  const legacy = readLegacyFile();
  if (!legacy) return;
  if (lessonsOnDisk().some((item) => sameLesson(item, legacy))) return;
  try {
    writeNewFile(legacy);
  } catch (err) {
    if (!err || err.message !== 'lesson-exists') throw err;
  }
}

function listFiles() {
  importLegacyFile();
  return byNewest(lessonsOnDisk());
}

function getFile(id) {
  const clean = safeId(id);
  if (!clean) return null;
  try {
    return shape(JSON.parse(fs.readFileSync(lessonFile(clean), 'utf8')), clean);
  } catch (err) {
    return null;
  }
}

async function accessToken() {
  if (tokenCache.value && Date.now() < tokenCache.exp) return tokenCache.value;
  const response = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(5000)
    }
  );
  if (!response.ok) {
    console.error('Lesson storage token failed', response.status);
    throw new Error('lesson-storage');
  }
  const body = await response.json();
  const value = String(body.access_token || '');
  if (!value) throw new Error('lesson-storage');
  const seconds = Number(body.expires_in) || 300;
  tokenCache = { value, exp: Date.now() + Math.max(30, seconds - 60) * 1000 };
  return value;
}

function objectUrl(name, upload) {
  const bucket = encodeURIComponent(LESSON_BUCKET);
  const object = encodeURIComponent(name);
  if (upload) {
    return `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${object}&ifGenerationMatch=0`;
  }
  return `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}?alt=media`;
}

async function readObject(name) {
  const token = await accessToken();
  const response = await fetch(objectUrl(name, false), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000)
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    console.error('Lesson read failed', response.status);
    throw new Error('lesson-read');
  }
  try {
    const id = safeId(String(name).replace(/^lessons\//, '').replace(/\.json$/, ''));
    return shape(await response.json(), id || undefined);
  } catch (err) {
    return null;
  }
}

async function createObject(record) {
  const token = await accessToken();
  const response = await fetch(objectUrl(`${PREFIX}${record.id}.json`, true), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-goog-if-generation-match': '0'
    },
    body: JSON.stringify(record),
    signal: AbortSignal.timeout(20000)
  });
  if (response.status === 412) throw new Error('lesson-exists');
  if (!response.ok) {
    console.error('Lesson save failed', response.status);
    throw new Error('lesson-save');
  }
  return record;
}

async function listNames() {
  const token = await accessToken();
  const names = [];
  let page = '';
  for (let i = 0; i < 20; i += 1) {
    const url = new URL(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(LESSON_BUCKET)}/o`);
    url.searchParams.set('prefix', PREFIX);
    url.searchParams.set('maxResults', '200');
    if (page) url.searchParams.set('pageToken', page);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000)
    });
    if (response.status === 404) return [];
    if (!response.ok) {
      console.error('Lesson list failed', response.status);
      throw new Error('lesson-read');
    }
    const body = await response.json();
    (body.items || []).forEach((item) => {
      if (item && typeof item.name === 'string' && item.name.endsWith('.json')) names.push(item.name);
    });
    if (!body.nextPageToken) break;
    page = body.nextPageToken;
  }
  return names;
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      out[index] = await fn(items[index]);
    }
  }
  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

let legacyReady = false;

async function importLegacyBucket() {
  if (legacyReady) return;
  const legacy = await readObject('lesson.json');
  if (!legacy) {
    legacyReady = true;
    return;
  }
  const names = await listNames();
  const lessons = names.length ? await mapPool(names, 6, (name) => readObject(name)) : [];
  if (!lessons.some((item) => sameLesson(item, legacy))) {
    const record = shape(legacy, newId());
    if (record) {
      try {
        await createObject(record);
      } catch (err) {
        if (!err || err.message !== 'lesson-exists') throw err;
      }
    }
  }
  legacyReady = true;
}

async function listBucket() {
  await importLegacyBucket();
  const names = await listNames();
  const lessons = await mapPool(names, 6, (name) => readObject(name));
  return byNewest(lessons.filter(Boolean));
}

async function addRecord(input) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const record = shape(input, newId());
    if (!record) throw new Error('lesson-invalid');
    try {
      if (LESSON_BUCKET) return await createObject(record);
      return writeNewFile(record);
    } catch (err) {
      lastError = err;
      if (!err || err.message !== 'lesson-exists') throw err;
    }
  }
  throw lastError || new Error('lesson-save');
}

async function list() {
  if (LESSON_BUCKET) return listBucket();
  return listFiles();
}

async function get(id) {
  const clean = safeId(id);
  if (!clean) return null;
  if (LESSON_BUCKET) return readObject(`${PREFIX}${clean}.json`);
  return getFile(clean);
}

async function add(lesson) {
  if (LESSON_BUCKET) await importLegacyBucket();
  else importLegacyFile();
  return addRecord(lesson);
}

module.exports = { list, get, add, LESSON_BUCKET, DATA_DIR, LEGACY_FILE };
