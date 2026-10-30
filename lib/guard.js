'use strict';

/**
 * Hard filter for every student-facing sentence.
 * The tutor is not allowed to state the answer, confirm it, or hand over
 * an equation. This runs in code on the finished text. A prompt is not enough.
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
  /\bcorrect answer\b/,
  /\bthe law states\b/,
  /\bthe law is\b/,
  /\bit equals\b/,
  /\bequals\b/,
  /\bequal to\b/,
  /\btimes\b/,
  /\bmultiplied\b/,
  /\bdivided by\b/,
  /\btherefore\b/,
  /\bin conclusion\b/,
  /\byou are right\b/,
  /\byoure right\b/,
  /\bthats right\b/,
  /\bthat is correct\b/,
  /\bthats correct\b/,
  /\bwell done\b/,
  /\bexactly\b/,
  /\bproportional\b/,
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
  /هو الناتج/,
  /يساوي/,
  /مضروب/,
  /مقسوم/,
  /حاصل ضرب/,
  /يتناسب/,
  /(^|\s)اذن($|\s|،)/,
  /(^|\s)احسنت($|\s|[.!?؟،])/,
  /(^|\s)ممتاز($|\s|[.!?؟،])/,
  /(^|\s)صحيح($|\s|[.!?؟،])/
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

function hasSymbolLeak(value) {
  return /[0-9٠-٩=≈≠≤≥×÷√]/.test(String(value || ''));
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

function outputIsSafe(text, lesson) {
  const raw = String(text || '').trim();
  if (raw.length < 8 || raw.length > 650) return false;
  if (hasSymbolLeak(raw)) return false;
  if (givesAnswer(raw)) return false;
  if (!/[?؟]/.test(raw)) return false;
  const sentences = raw.split(/[.!?؟]/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length > 4) return false;
  if ((raw.match(/\n/g) || []).length > 3) return false;
  if (leaksLesson(raw, lesson)) return false;
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
      `لن أعطيك الإجابة، ولن أكتب المعادلة عنك. ابقَ مع «${title}». ماذا تلاحظ عن «${term}»؟`,
      `لن أكتب ذلك عنك. انظر فقط إلى «${term}». أي سؤال أصغر يخطر لك؟`
    ]
    : [
      `I will not give you the answer, and I will not write the equation for you. Stay with “${title}”. What do you notice about “${term}”?`,
      `I will not hand that over. Look only at “${term}” in “${title}”. What smaller question can you ask?`
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
  hasSymbolLeak,
  leaksLesson,
  outputIsSafe,
  clipLabel,
  isolate,
  guardReply
};
