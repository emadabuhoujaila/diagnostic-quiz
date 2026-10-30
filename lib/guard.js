'use strict';

/**
 * Hard filter for every student-facing sentence.
 * A normal guiding reply passes through. The reply is replaced only when it
 * gives the direct answer, a final solution, a ready equation, or “the answer is”.
 */

const GIVING = [
  /\bthe answer is\b/,
  /\banswer is\b/,
  /\bthe solution is\b/,
  /\bsolution is\b/,
  /\bthe formula is\b/,
  /\bformula is\b/,
  /\bthe equation is\b/,
  /\bequation is\b/,
  /\bthe result is\b/,
  /\bresult is\b/,
  /\bfinal answer\b/,
  /\bfinal solution\b/,
  /\bcorrect answer\b/,
  /الاجابه هي/,
  /الاجابه الصحيحه/,
  /هي الاجابه/,
  /الجواب هو/,
  /الجواب الصحيح/,
  /هو الجواب/,
  /الحل هو/,
  /الحل النهائي/,
  /الحل الصحيح/,
  /هو الحل/,
  /المعادله هي/,
  /هي المعادله/,
  /الصيغه هي/,
  /الناتج هو/,
  /هو الناتج/
];

function normalize(value) {
  return String(value || '')
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/['’‘`]/g, '')
    .toLowerCase();
}

function wordsOf(value) {
  return normalize(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function givesAnswer(value) {
  const text = normalize(value);
  return GIVING.some((pattern) => pattern.test(text));
}

function givesEquation(value) {
  return /[=≈≠≤≥×÷√]/.test(String(value || ''));
}

function hasSymbolLeak(value) {
  return givesEquation(value);
}

function leaksLesson(reply, lesson) {
  if (!lesson) return false;
  const source = wordsOf(`${lesson.text || ''}\n${lesson.title || ''}`);
  const replyJoin = ` ${wordsOf(reply).join(' ')} `;
  const width = 4;
  for (let i = 0; i + width <= source.length; i += 1) {
    const slice = source.slice(i, i + width).join(' ');
    if (replyJoin.includes(` ${slice} `)) return true;
  }
  return false;
}

function outputIsSafe(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;
  if (givesAnswer(raw) || givesEquation(raw)) return false;
  return true;
}

function isolate(value) {
  const text = String(value || '');
  if (!text) return text;
  return `\u2068${text}\u2069`;
}

function clipLabel(value, lang, maxWords, generic) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  if (!raw) return generic == null ? generic : isolate(generic);
  const short = raw.split(/\s+/).slice(0, maxWords).join(' ').replace(/[.!?؟]/g, '').trim();
  if (!short || hasSymbolLeak(short) || givesAnswer(short)) {
    return generic == null ? generic : isolate(generic);
  }
  return isolate(short);
}

function guardReply(text, lesson, lang) {
  const language = lang === 'en' ? 'en' : 'ar';
  const raw = String(text || '').trim();
  if (outputIsSafe(raw, lesson)) return raw;

  const title = clipLabel(
    lesson && lesson.title,
    language,
    3,
    language === 'ar' ? 'الدرس المحفوظ' : 'the saved lesson'
  );
  const term = clipLabel(
    lesson && lesson.terms && lesson.terms[0],
    language,
    3,
    language === 'ar' ? 'هذه الفكرة' : 'this idea'
  );

  const bank = language === 'ar'
    ? [
      `أراك تريد الوصول، وهذا جهد طيب، وسأبقى معك. لن أعطيك الإجابة، ولن أكتب المعادلة عنك. رأس الخيط هو «${term}» داخل «${title}»: قارنه بشيء تعرفه من يومك. ماذا تلاحظ عن «${term}»؟`,
      `لن أكتب ذلك عنك، لأن الخطوة التالية أغلى حين تأتي منك. انظر فقط إلى «${term}» كخيط واحد. أي سؤال أصغر يخطر لك؟`
    ]
    : [
      `I can see you want to arrive, and that effort matters. I will not give you the answer, and I will not write the equation for you. The thread is “${term}” inside “${title}”: compare it with something you know from an ordinary day. What do you notice about “${term}”?`,
      `I will not hand that over, because the next step is worth more when it comes from you. Look only at “${term}” in “${title}” as one thread. What smaller question can you ask?`
    ];

  for (const candidate of bank) {
    if (outputIsSafe(candidate, lesson)) return candidate;
  }

  return language === 'ar'
    ? 'لن أعطيك الإجابة. ما الذي تريد أن نسأله في هذا الدرس؟'
    : 'I will not give you the answer. What should we ask about this lesson?';
}

module.exports = {
  normalize,
  wordsOf,
  givesAnswer,
  givesEquation,
  hasSymbolLeak,
  leaksLesson,
  outputIsSafe,
  clipLabel,
  isolate,
  guardReply
};
