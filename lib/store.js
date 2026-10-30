'use strict';

const fs = require('fs');
const path = require('path');

const LESSON_PATH = process.env.LESSON_PATH || path.join(__dirname, '..', 'data', 'lesson.json');

function read() {
  try {
    const data = JSON.parse(fs.readFileSync(LESSON_PATH, 'utf8'));
    if (!data || typeof data.text !== 'string' || !data.text.trim() || !data.title) return null;
    return data;
  } catch (err) {
    return null;
  }
}

function save(lesson) {
  fs.mkdirSync(path.dirname(LESSON_PATH), { recursive: true });
  const tmp = `${LESSON_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(lesson, null, 2));
  fs.renameSync(tmp, LESSON_PATH);
  return lesson;
}

module.exports = { read, save, LESSON_PATH };
