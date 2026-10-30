'use strict';

const crypto = require('crypto');

function teacherAuthorized(given) {
  const expected = String(process.env.TEACHER_PASSWORD || '');
  if (!expected.trim()) return false;
  const left = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const right = crypto.createHash('sha256').update(String(given || ''), 'utf8').digest();
  return crypto.timingSafeEqual(left, right);
}

module.exports = { teacherAuthorized };
