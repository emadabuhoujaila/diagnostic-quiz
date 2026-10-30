'use strict';

const {
  clipLabel,
  givesAnswer,
  guardReply,
  hasSymbolLeak,
  isolate,
  leaksLesson,
  normalize,
  wordsOf
} = require('./guard');

const LEXICON = [
  'acceleration', 'velocity', 'momentum', 'frequency', 'wavelength', 'amplitude',
  'reflection', 'refraction', 'displacement', 'friction', 'inertia', 'gravity',
  'pressure', 'density', 'kinetic', 'potential', 'electron', 'proton', 'neutron',
  'nucleus', 'photon', 'current', 'voltage', 'resistance', 'circuit', 'magnetic',
  'electric', 'magnet', 'charge', 'energy', 'motion', 'force', 'forces', 'mass',
  'speed', 'power', 'light', 'sound', 'heat', 'wave', 'waves', 'atom', 'orbit',
  'field', 'lens', 'mirror', 'weight', 'newton', 'vector', 'scalar', 'particle',
  'buoyancy', 'temperature', 'joule', 'watt',
  'التسارع', 'تسارع', 'السرعة', 'سرعة', 'الزخم', 'زخم', 'التردد', 'تردد',
  'الموجي', 'الاحتكاك', 'احتكاك', 'الجاذبية', 'جاذبية', 'الضغط', 'ضغط',
  'الكثافة', 'كثافة', 'الطاقة', 'طاقة', 'الإلكترون', 'إلكترون', 'الكترون',
  'البروتون', 'بروتون', 'النيوترون', 'نيوترون', 'النواة', 'نواة', 'الفوتون', 'فوتون',
  'التيار', 'تيار', 'الجهد', 'جهد', 'المقاومة', 'مقاومة', 'المغناطيسي', 'مغناطيسي',
  'الكهربائي', 'كهربائي', 'الشحنة', 'شحنة', 'الحركة', 'حركة', 'القوة', 'قوة',
  'الكتلة', 'كتلة', 'الضوء', 'ضوء', 'الصوت', 'صوت', 'الحرارة', 'حرارة',
  'الموجة', 'موجة', 'موجات', 'الذرة', 'ذرة', 'المدار', 'مدار', 'المجال', 'مجال',
  'الوزن', 'وزن', 'نيوتن', 'الجسيم', 'جسيم', 'المحصلة', 'محصلة', 'السعة', 'سعة',
  'الانعكاس', 'انعكاس', 'الانكسار', 'انكسار', 'العدسة', 'عدسة', 'المرآة', 'مرآة',
  'الطفو', 'طفو', 'الشغل', 'شغل', 'القدرة', 'قدرة', 'القصور', 'قصور'
];

const STOP = new Set(`
a an the and or of to in on for with is are was were be been being it this that
these those i you we they my your our what how why when who which do does did
not no yes ok okay yeah yep nah um uh hmm so just about into from at as by if
then than too very really thing things think um about there here have has had
need needs needed can could would should will make made like some same each
such only also more most other through while during after before again still
object objects student students lesson unit chapter page question answer
في من على الى إلي عن مع هذا هذه ذلك تلك كان كانت يكون هم هن هو هي نحن انت أنت
انتم أنتم انتن كل قد لا نعم او أو ثم حتى اذا إذا لأن لان لكن بل سوف تم هنا هناك
هل لو يا اي أي اين أين كيف لماذا لما ماذا غير بين عند لدى منذ خلال دون بدون فقط
جدا التي الذي الذين حيث كما ايضا أيضًا تمام حسنا حسنًا طيب اوك اوكي حاضر
درس وحدة سؤال الطالب الطلاب مثال صفحه صفحة
`.split(/\s+/).map((word) => normalize(word)).filter(Boolean));

const BAN_TERMS = new Set([
  'answer', 'answers', 'solution', 'formula', 'equation', 'result', 'equals',
  'lesson', 'unit', 'chapter', 'page', 'question',
  'درس', 'وحده', 'سؤال', 'سوال', 'الاجابه', 'جواب', 'حل', 'معادله', 'ناتج'
].map((word) => normalize(word)));

function hash(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function stem(word) {
  return word.replace(/^(وال|بال|كال|فال|ال)/, '');
}

function findSurface(blob, entry) {
  if (/[\u0600-\u06FF]/.test(entry)) {
    if (!normalize(blob).includes(normalize(entry))) return null;
    return entry;
  }
  const match = blob.match(new RegExp(`\\b${entry}\\b`, 'i'));
  return match ? match[0] : null;
}

function extractTerms(text, title) {
  const blob = `${title}\n${text}`;
  const found = [];
  const seen = new Set();
  const sorted = LEXICON.slice().sort((a, b) => b.length - a.length);
  sorted.forEach((entry) => {
    const hit = findSurface(blob, entry);
    if (!hit) return;
    const key = stem(normalize(hit));
    if (!key || seen.has(key) || BAN_TERMS.has(key)) return;
    if (hasSymbolLeak(hit) || givesAnswer(hit)) return;
    if (wordsOf(hit).length > 3) return;
    seen.add(key);
    found.push(hit);
  });

  if (found.length < 3) {
    const counts = new Map();
    wordsOf(blob).forEach((word) => {
      const key = stem(word);
      if (key.length < 4 || STOP.has(key) || BAN_TERMS.has(key) || givesAnswer(key)) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .forEach(([word]) => {
        if (found.length >= 8 || seen.has(word)) return;
        seen.add(word);
        found.push(word);
      });
  }

  return found.slice(0, 8);
}

function analyzeLesson(text, title) {
  const cleanText = String(text || '').replace(/\u0000/g, '').trim();
  const cleanTitle = String(title || '').replace(/\s+/g, ' ').trim() || 'Untitled lesson';
  const sentences = cleanText
    .split(/\n+|(?<=[.!?؟])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12);
  return {
    title: cleanTitle,
    text: cleanText,
    sentences,
    terms: extractTerms(cleanText, cleanTitle)
  };
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-12).map((item) => ({
    role: item && item.role === 'student' ? 'student' : 'tutor',
    text: String((item && item.text) || '').slice(0, 500)
  })).filter((item) => item.text);
}

const ANSWER_SEEK = [
  /\b(what is|whats|what s) (the )?(answer|solution|formula|equation|result|law|definition)\b/,
  /\b(give|tell|show|write|say) (me )?(the )?(answer|solution|formula|equation|result|law)\b/,
  /\b(final|correct) answer\b/,
  /\bjust tell me\b/,
  /\bjust give me\b/,
  /\b(solve|calculate|compute|derive|define|explain)\b/,
  /\b(equal to|equals)\b/,
  /\bthe formula\b/,
  /\bthe equation\b/,
  /\bignore\b.*\b(rules|instructions)\b/,
  /\byou are (now|a)\b/,
  /\bsystem prompt\b/,
  /\bdeveloper mode\b/,
  /الاجابه/,
  /الجواب/,
  /المعادله/,
  /الناتج/,
  /الصيغه/,
  /احسب/,
  /حل (المساله|السوال|التمرين|المثال)/,
  /اشرح/,
  /(^|\s)عرف(\s|$)/,
  /وش (الاجابه|الحل|الجواب|القانون)/,
  /(اعطني|عطني|قل لي|ابي|ابغى|بدي|عايز) (الاجابه|الجواب|الحل|المعادله|الناتج|القانون)/
];

function isAnswerSeeking(message) {
  const raw = String(message || '');
  if (/[=≈]/.test(raw)) return true;
  const text = normalize(raw);
  return ANSWER_SEEK.some((pattern) => pattern.test(text));
}

function isConfusion(message) {
  const text = normalize(message);
  return /(dont know|do not know|not sure|no idea|idk|im stuck|i am stuck|confused|help me|لست متاكد|لا اعرف|ما اعرف|ما فهمت|مو فاهم|مش فاهم|لا ادري|ما ادري|ساعدني)/.test(text);
}

function isGreeting(message) {
  const text = normalize(message).replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
  return /^(hi|hello|hey|salam|salaam|good morning|good evening|السلام عليكم|سلام|مرحبا|اهلا|هلا)$/.test(text);
}

function contentWords(value) {
  return wordsOf(value)
    .map(stem)
    .filter((word) => word.length >= 3 && !STOP.has(word) && !BAN_TERMS.has(word));
}

function isOffTopic(message, lesson) {
  if (isAnswerSeeking(message) || isConfusion(message) || isGreeting(message)) return false;
  const words = contentWords(message);
  if (!words.length) return false;
  const known = new Set(contentWords(`${lesson.title}\n${lesson.text}`));
  (lesson.terms || []).forEach((term) => {
    wordsOf(term).map(stem).forEach((word) => known.add(word));
  });
  return !words.some((word) => known.has(word));
}

function pickTerms(lesson, message, history) {
  const terms = lesson.terms || [];
  const said = terms.filter((term) => normalize(message).includes(normalize(term)));
  const used = new Set();
  history.forEach((turn) => {
    if (turn.role !== 'tutor') return;
    const blob = normalize(turn.text);
    terms.forEach((term) => {
      if (blob.includes(normalize(term))) used.add(term);
    });
  });
  if (said.length) {
    return {
      a: said[0],
      b: terms.find((term) => term !== said[0]) || null
    };
  }
  const fresh = terms.find((term) => !used.has(term)) || terms[history.length % Math.max(terms.length, 1)] || null;
  return { a: fresh, b: null };
}

function safeEcho(message, lesson) {
  let text = String(message || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (hasSymbolLeak(text) || givesAnswer(text) || isAnswerSeeking(text)) return null;
  text = text.replace(/[?؟!]/g, '').replace(/["“”«»]/g, '').trim();
  const parts = text.split(/\s+/);
  if (parts.length > 10) text = parts.slice(0, 10).join(' ');
  if (!text || leaksLesson(text, lesson)) return null;
  if (text.length > 90) text = `${text.slice(0, 87).trim()}…`;
  return isolate(text);
}

function choose(list, seed) {
  return list[seed % list.length];
}

function opening(lang, title, term, seed) {
  if (lang === 'ar') {
    return choose([
      `أهلًا بك. يسعدني أن نسير معًا داخل «${title}»، ولن أسلّمك خط النهاية. رأس الخيط الذي نمسك به هو «${term}»: لاحظ أين يظهر في شيء قريب منك قبل أن تحاول إغلاق الفكرة. ماذا يثير فضولك عن «${term}»؟`,
      `مرحبًا. وجودك هنا خطوة طيبة، وسنبقى داخل «${title}» من غير محاضرة. خيط واحد يكفي الآن، وهو «${term}»: تخيّل موقفًا يوميًا يغيّر فيه هذا المعنى ما تراه. ما الذي يلفتك في «${term}»؟`
    ], seed);
  }
  return choose([
    `Welcome. I am glad you are here, and we will walk inside “${title}” together instead of jumping to the end. A thread you can hold is “${term}”: notice where it shows up in ordinary life before you try to finish the idea. What do you already wonder about “${term}”?`,
    `Hello. You do not have to see the whole path yet, and I will stay with you inside “${title}”. The thread to pull first is “${term}”: picture one everyday moment where that idea changes what you notice. What catches your eye about “${term}”?`
  ], seed);
}

function refusal(lang, title, term, seed) {
  if (lang === 'ar') {
    return choose([
      `أسمع رغبتك في الخطوة الأخيرة، وهذا مفهوم، وأنا معك. لن أعطيك الإجابة، ولن أكتب المعادلة عنك. رأس الخيط داخل «${title}» هو «${term}»: تخيّل لحظة قريبة منك يظهر فيها هذا المعنى قبل أن نغلق الطريق. ماذا تتخيل عن «${term}»؟`,
      `طلبك مفهوم، ولن أتركك وحدك عنده. لن أعطيك الإجابة. انظر إلى «${term}» كخيط واحد داخل «${title}»، وتذكّر موقفًا يوميًا يجعل هذه الكلمة تتحرك. ماذا يجعلك هذا اللفظ تسأل؟`,
      `الخطوة الأخيرة لك، لذا لن أعطيك الإجابة، وهذا ليس عقابًا بل طريق أوضح. في «${title}»، أمسك «${term}» وقارنه بشيء تعرفه من حياتك. ما الأقرب إلى «${term}» الآن؟`
    ], seed);
  }
  return choose([
    `I hear you wanting the last step, and that wish makes sense. I will not give you the answer, and I will not write the equation for you. A thread you can hold inside “${title}” is “${term}”: picture one everyday moment where that idea changes what you see. What do you already picture about “${term}”?`,
    `I am staying beside you, and you are not stuck for wanting the end. I will not give you the answer. Look only at “${term}” as one thread inside “${title}”, and think of a familiar moment that makes that word move. What does that word make you curious about?`,
    `That last step is yours, so I will not give you the answer, and we can still move. In “${title}”, hold “${term}” next to something you already know from ordinary life. What feels closest to “${term}” now?`
  ], seed);
}

function smaller(lang, title, term, seed) {
  if (lang === 'ar') {
    return choose([
      `لا بأس، وعدم المعرفة الآن جزء من المشي، ولست وحدك فيه. لا تحمل الدرس كله دفعة واحدة. «${term}» فقط رأس الخيط: ماذا يذكّرك به شيء قريب منك؟`,
      `يمكننا أن نصغّر السؤال، وهذا ذكاء لا تراجع. اترك خط النهاية، وابقَ مع «${term}» داخل «${title}». هل تشير إليه، أم تلاحظ أثره فقط؟`,
      `لا مشكلة. لست بحاجة إلى الخطوة الأخيرة الآن، ويكفي خيط واحد. ماذا قد يفعل «${term}» داخل «${title}» لو رأيته في موقف تعرفه؟`
    ], seed);
  }
  return choose([
    `That is all right. Not knowing yet is part of the walk, and you do not have to carry the whole lesson at once. Only “${term}” is the thread: what nearby thing does that word remind you of?`,
    `We can make the question smaller, and that is a strong move. Leave the finish line, and stay with “${term}” inside “${title}”. Can you point to it, or do you only notice what it changes?`,
    `No worry. You do not need the last step yet, and one thread is enough. What might “${term}” be doing inside “${title}” if you met it in a moment you already know?`
  ], seed);
}

function redirect(lang, title, term, echo, seed) {
  if (lang === 'ar') {
    const options = [
      `يعجبني أنك جئت بشيء من عندك. هذا خارج «${title}»، فنستعمله جسرًا للرجوع فقط. رأس الخيط هو «${term}»: ابحث عن التغيّر نفسه داخل الدرس المحفوظ. ماذا تلاحظ عن «${term}»؟`,
      `فكرتك مسموعة، وأبقاك قريبًا من الطريق. هذا خارج الدرس، لذا نبقى داخل «${title}» ونمسك «${term}» كخيط واحد. ما الذي يحتاج نظرة أقرب في «${term}»؟`
    ];
    if (echo) options.push(`قلت: «${echo}»، وهذا اهتمام حقيقي. هذا خارج «${title}»، فلنحوله إلى خيط نحو «${term}». ماذا نسأل عن «${term}» بدل ذلك؟`);
    return choose(options, seed);
  }
  const options = [
    `I like that you brought something of your own. That sits outside “${title}”, so we will use it only as a way back. The thread to hold is “${term}”: look for the same kind of change in this lesson. What do you notice about “${term}”?`,
    `I hear you, and we can keep that energy. That is outside this talk, so we stay inside “${title}” and hold “${term}” as the one thread. What about “${term}” still needs a closer look?`
  ];
  if (echo) options.push(`You said “${echo}”, and that curiosity counts. That sits outside “${title}”, so let us turn it toward “${term}”. What should we ask about “${term}” instead?`);
  return choose(options, seed);
}

function discuss(lang, title, term, other, echo, seed) {
  if (lang === 'ar') {
    const options = [
      `أنت داخل الدرس فعلًا، وهذا يستحق الثقة. درس «${title}» يُبقي «${term}» أمامنا كرأس خيط: تخيّل مكانًا تعرفه يظهر فيه هذا المعنى، ثم أعد الصورة إلى الدرس. ماذا تتخيل حين تسمع هذه الكلمة؟`,
      `خطوتك مفيدة، فلا تستعجل النهاية. ابقَ مع «${term}» قبل أي خطوة أخيرة، وقارنه بشيء يومي ثم ارجعه إلى «${title}». أي سؤال يفتحه «${title}» لك؟`,
      `أحسنت بالمحاولة، والصورة التي عندك أهم من سطر محفوظ. حدّثني عن «${term}» بصورتك أنت، واربطها بموقف قريب منك داخل «${title}». ماذا ترى؟`
    ];
    if (echo && other) {
      options.push(`قلت: «${echo}»، وهذه ملاحظة تستحق أن نبني عليها. لمست «${term}»، والدرس يحمل أيضًا «${other}» كخيط ثانٍ. أي صلة تتوقعها بينهما في حياتك اليومية؟`);
    }
    if (echo) {
      options.push(`قلت: «${echo}»، وأسمع في ذلك بداية حقيقية. أبقِ هذه الفكرة داخل «${title}»، واستعمل «${term}» رأس خيط نحو الهدف. أين يقف «${term}» مما قلته؟`);
      options.push(`سمعت «${echo}»، وهذا اتجاه طيب. راقب ماذا يتغير لو تحرّك «${term}» في موقف تعرفه، ثم أعد ذلك إلى «${title}». ماذا ستراقب، ولماذا؟`);
    }
    return choose(options, seed);
  }
  const options = [
    `You are already in the lesson, and that is worth trusting. The lesson “${title}” keeps “${term}” in view as the thread: picture a place you know where this idea shows up, then bring that picture back. What do you picture when you hear it?`,
    `That step is useful, so there is no need to rush the ending. Stay with “${term}” before any last step, compare it with something ordinary, and return it to “${title}”. What question does “${title}” make you want to ask?`,
    `I am glad you tried this in your own words. Tell me about “${term}” in your own picture, not a copied line, and tie it to a moment you know inside “${title}”. What do you see?`
  ];
  if (echo && other) {
    options.push(`You said “${echo}”, and that is a real step we can build on. You touched “${term}”, and the lesson also holds “${other}” as a second thread. What link do you suspect between them in ordinary life?`);
  }
  if (echo) {
    options.push(`You said “${echo}”, and I can hear a real beginning in that. Hold that thought inside “${title}”, and use “${term}” as the thread toward the goal. Where does “${term}” fit what you just said?`);
    options.push(`I heard “${echo}”, and that is a good direction. Watch what would change if “${term}” moved in a moment you know, then bring it back to “${title}”. What would you watch, and why do you think so?`);
  }
  return choose(options, seed);
}

function reply({ lesson, history, message, lang }) {
  const language = lang === 'en' ? 'en' : 'ar';
  const turns = cleanHistory(history);
  const text = String(message || '').trim();
  const seed = hash(`${language}|${text}|${turns.length}`);
  const picked = pickTerms(lesson, text, turns);
  const title = clipLabel(lesson.title, language, 3, language === 'ar' ? 'الدرس المحفوظ' : 'the saved lesson');
  const term = clipLabel(picked.a, language, 3, language === 'ar' ? 'هذه الفكرة' : 'this idea');
  const other = picked.b ? clipLabel(picked.b, language, 3, null) : null;
  const echo = safeEcho(text, lesson);

  let draft;
  if (!text || (isGreeting(text) && turns.length === 0)) draft = opening(language, title, term, seed);
  else if (isAnswerSeeking(text)) draft = refusal(language, title, term, seed);
  else if (isConfusion(text)) draft = smaller(language, title, term, seed);
  else if (isOffTopic(text, lesson)) draft = redirect(language, title, term, echo, seed);
  else draft = discuss(language, title, term, other, echo, seed);

  return guardReply(draft, lesson, language);
}

module.exports = {
  analyzeLesson,
  reply,
  isAnswerSeeking,
  isOffTopic
};
