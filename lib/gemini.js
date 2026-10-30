'use strict';

const MODEL = 'gemini-3.8-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function geminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function geminiConfigured() {
  return Boolean(geminiKey());
}

function lessonBrief(lesson) {
  return String((lesson && lesson.text) || '')
    .replace(/[0-9٠-٩]/g, '')
    .replace(/[=≈≠≤≥×÷√]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 6000);
}

function systemInstruction(lang) {
  if (lang === 'ar') {
    return [
      'أنت معلم فيزياء في حوار دافئ، لا محاضرًا.',
      'اكتب بالعربية فقط، في أربع إلى سبع جمل واضحة. لا تكتفِ بجملة واحدة.',
      'كل رد يمشي بهذا الترتيب: أولًا أقر بما قاله الطالب بحرارة، ثم شجّعه من غير أن تسلّمه النتيجة، ثم أعطه رأس خيط واحد فقط (صورة من الحياة اليومية أو فكرة فيزياء مجاورة تقود إلى هدف الدرس المحفوظ)، ثم اختم بسؤال واحد يقرّبه من الدرس.',
      'الحياة والفيزياء المجاورة جسر للعودة إلى الدرس، وليست دردشة حرة.',
      'إذا أرفق صورًا، لاحظ شيئًا ظاهرًا فيها واستعمله رأس خيط يعود إلى الدرس.',
      'لا تعطِ الإجابة المباشرة، ولا الحل النهائي، ولا معادلة جاهزة، ولا تقل «الإجابة هي».',
      'إذا طلب الإجابة، ابقَ مشجعًا وقل إنك لن تعطيه الإجابة، ثم أعطه رأس الخيط واسأله السؤال الأصغر.'
    ].join('\n');
  }
  return [
    'You are a warm physics teacher in dialogue, not a lecturer.',
    'Write in English only, in four to seven clear sentences. Never answer in a single sentence.',
    'Every reply follows this order: first acknowledge what the student just said, with warmth; then encourage them without handing over the result; then give one thread only (one concrete everyday picture or one neighboring physics idea that leads toward the saved lesson); then end with exactly one question that moves them closer.',
    'Everyday life and neighboring physics are bridges back to the lesson, not a free chat.',
    'If they attached images, notice something visible and use it as the thread back to the lesson.',
    'Never give the direct answer, the final solution, a ready equation, or the phrase "the answer is".',
    'If they ask for the answer, stay encouraging, say you will not give it, hand them the thread, and ask the smaller question.'
  ].join('\n');
}

function userTurn(lang, lesson, message, imageCount, repair) {
  const title = String((lesson && lesson.title) || '').slice(0, 160);
  const terms = ((lesson && lesson.terms) || []).slice(0, 8).join(', ');
  const said = String(message || '').trim().slice(0, 2000);
  const arabic = lang === 'ar';
  const lines = [
    arabic ? `عنوان الدرس: ${title}` : `Lesson title: ${title}`,
    arabic ? `أفكار الدرس: ${terms}` : `Lesson ideas: ${terms}`,
    arabic ? 'نص الدرس:' : 'Lesson text:',
    lessonBrief(lesson),
    imageCount
      ? (arabic ? 'أرفق الطالب صورًا.' : 'The student attached images.')
      : (arabic ? 'لم يرفق الطالب صورة.' : 'The student did not attach an image.'),
    said
      ? (arabic ? `رسالة الطالب: ${said}` : `Student message: ${said}`)
      : (arabic ? 'لم يكتب الطالب كلمات.' : 'The student wrote no words.')
  ];
  if (repair) {
    lines.push(arabic
      ? 'أعد الصياغة لأن الرد السابق أعطى الإجابة أو معادلة. ابقَ دافئًا، أقر بما قاله الطالب، شجّعه، أعطه رأس خيط واحد من الحياة أو من فيزياء مجاورة، واختم بسؤال واحد عن الدرس. أربع جمل على الأقل. بالعربية. لا تعطِ الإجابة.'
      : 'Rewrite because the previous reply gave the answer or an equation. Stay warm, acknowledge what the student said, encourage them, hand them one everyday or neighboring-physics thread, and end with one question about the lesson. At least four sentences. In English. Do not give the answer.');
  }
  return lines.join('\n');
}

function contentsFrom(history, parts) {
  const turns = (Array.isArray(history) ? history : [])
    .slice(-8)
    .map((item) => ({
      role: item && item.role === 'student' ? 'student' : 'tutor',
      text: String((item && item.text) || '').trim().slice(0, 1500)
    }))
    .filter((item) => item.text);
  while (turns.length && turns[0].role !== 'student') turns.shift();
  const contents = [];
  turns.forEach((turn) => {
    const role = turn.role === 'student' ? 'user' : 'model';
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts[0].text += `\n${turn.text}`;
    else contents.push({ role, parts: [{ text: turn.text }] });
  });
  contents.push({ role: 'user', parts });
  return contents;
}

function imageParts(images) {
  return (Array.isArray(images) ? images : [])
    .filter((image) => image && IMAGE_TYPES.has(image.mime) && image.data)
    .slice(0, 4)
    .map((image) => ({
      inline_data: {
        mime_type: image.mime,
        data: String(image.data).replace(/^data:[^;]+;base64,/, '')
      }
    }));
}

function readText(payload) {
  const candidates = payload && payload.candidates;
  if (!Array.isArray(candidates) || !candidates.length) return '';
  const parts = (candidates[0].content && candidates[0].content.parts) || [];
  return parts
    .filter((part) => part && part.text && !part.thought)
    .map((part) => part.text)
    .join('\n')
    .trim();
}

async function callModel(key, lang, lesson, history, message, images, repair) {
  const pictures = imageParts(images);
  const parts = pictures.concat([{
    text: userTurn(lang, lesson, message, pictures.length, repair)
  }]);
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction(lang) }] },
      contents: contentsFrom(history, parts),
      generationConfig: {
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: 'low' }
      }
    }),
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) {
    console.error('Gemini request failed', response.status);
    return '';
  }
  const payload = await response.json();
  return readText(payload);
}

async function geminiDraft({ lesson, history, message, lang, images, repair }) {
  const key = geminiKey();
  if (!key) return null;
  try {
    const text = await callModel(key, lang === 'en' ? 'en' : 'ar', lesson, history, message, images, Boolean(repair));
    return text || null;
  } catch (err) {
    console.error('Gemini request failed');
    return null;
  }
}

module.exports = {
  MODEL,
  geminiConfigured,
  geminiDraft
};
