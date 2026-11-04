'use strict';

const { reply, givesPathSolution } = require('./socratic');
const { guardReply, outputIsSafe } = require('./guard');
const { geminiConfigured, geminiDraft } = require('./gemini');

let announced = false;

async function tutorTurn({ lesson, history, message, lang, images }) {
  const language = lang === 'en' ? 'en' : 'ar';
  const turn = { lesson, history, message, lang: language, images: images || [] };
  if (!geminiConfigured()) {
    if (!announced) {
      announced = true;
      console.error('Gemini is waiting for GEMINI_API_KEY or GOOGLE_API_KEY');
    }
    return reply(turn);
  }
  let draft = await geminiDraft({ ...turn, repair: false });
  if (draft && (!outputIsSafe(draft, lesson) || givesPathSolution(draft))) {
    draft = await geminiDraft({ ...turn, repair: true });
  }
  if (draft && (!outputIsSafe(draft, lesson) || givesPathSolution(draft))) draft = '';
  if (draft) return guardReply(draft, lesson, language);
  return reply(turn);
}

module.exports = { tutorTurn };
