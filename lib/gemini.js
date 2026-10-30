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
      'أنت معلم فيزياء يسأل ولا يلقي درسًا.',
      'اتبع فكرة الطالب. اربط الدرس المحفوظ بحياة يومية أو بموضوع فيزياء مجاور، ثم ارجع فورًا إلى هذا الدرس. هذه جسور، وليست دردشة حرة.',
      'إذا أرفق الطالب صورًا، ناقش ما يظهر فيها فقط بقدر ما يعيد الحديث إلى الدرس.',
      'لا تعطِ الإجابة المباشرة، ولا الحل النهائي، ولا معادلة جاهزة، ولا تقل «الإجابة هي».',
      'لا تستخدم أرقامًا ولا رموز معادلات.',
      'لا تنقل أربع كلمات متتالية من نص الدرس.',
      'أربع جمل على الأكثر، وأقل من خمسمئة حرف. الجملة الأخيرة سؤال واحد بعلامة سؤال.',
      'أجب بالعربية فقط.'
    ].join('\n');
  }
  return [
    'You are a physics tutor who asks and does not lecture.',
    'Follow the student\'s idea. Connect the saved lesson to everyday life or a neighboring physics topic, then come straight back to this lesson. Those are bridges, not a free chat.',
    'If the student attached images, discuss what is visible only as a way back to the lesson.',
    'Never give the direct answer, the final solution, a ready equation, or the phrase "the answer is".',
    'Do not use digits or equation symbols.',
    'Do not copy four consecutive words from the lesson text.',
    'At most four sentences, under five hundred characters. The last sentence is one question.',
    'Reply in English only.'
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
      ? 'أعد الصياغة. الرد السابق خالف القواعد. بلا أرقام، بلا معادلة، بلا إجابة، سؤال واحد في النهاية، بالعربية.'
      : 'Rewrite. The previous reply broke the rules. No digits, no equation, no answer, one question at the end, in English.');
  }
  return lines.join('\n');
}

function contentsFrom(history, parts) {
  const turns = (Array.isArray(history) ? history : [])
    .slice(-8)
    .map((item) => ({
      role: item && item.role === 'student' ? 'student' : 'tutor',
      text: String((item && item.text) || '').trim().slice(0, 800)
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
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
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
