'use strict';

const fs = require('fs');
const path = require('path');

const LESSON_PATH = process.env.LESSON_PATH || path.join(__dirname, '..', 'data', 'lesson.json');
const LESSON_BUCKET = String(process.env.LESSON_BUCKET || '').trim();
const LESSON_OBJECT = String(process.env.LESSON_OBJECT || 'lesson.json').trim() || 'lesson.json';

let tokenCache = { value: '', exp: 0 };

function validLesson(data) {
  if (!data || typeof data.text !== 'string' || !data.text.trim() || !data.title) return null;
  return data;
}

function readFile() {
  try {
    return validLesson(JSON.parse(fs.readFileSync(LESSON_PATH, 'utf8')));
  } catch (err) {
    return null;
  }
}

function saveFile(lesson) {
  fs.mkdirSync(path.dirname(LESSON_PATH), { recursive: true });
  const tmp = `${LESSON_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(lesson, null, 2));
  fs.renameSync(tmp, LESSON_PATH);
  return lesson;
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

function objectUrl(upload) {
  const bucket = encodeURIComponent(LESSON_BUCKET);
  const name = encodeURIComponent(LESSON_OBJECT);
  if (upload) {
    return `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${name}`;
  }
  return `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${name}?alt=media`;
}

async function readBucket() {
  const token = await accessToken();
  const response = await fetch(objectUrl(false), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000)
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    console.error('Lesson read failed', response.status);
    throw new Error('lesson-read');
  }
  try {
    return validLesson(await response.json());
  } catch (err) {
    return null;
  }
}

async function saveBucket(lesson) {
  const token = await accessToken();
  const response = await fetch(objectUrl(true), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(lesson),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) {
    console.error('Lesson save failed', response.status);
    throw new Error('lesson-save');
  }
  return lesson;
}

async function read() {
  if (LESSON_BUCKET) return readBucket();
  return readFile();
}

async function save(lesson) {
  if (LESSON_BUCKET) return saveBucket(lesson);
  return saveFile(lesson);
}

module.exports = { read, save, LESSON_PATH, LESSON_BUCKET };
