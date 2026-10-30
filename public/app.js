(function () {
  const I18N = {
    ar: {
      brand: 'المرصد',
      tagline: 'أسئلة في الفيزياء، لا إجابات جاهزة',
      student: 'طالب',
      teacher: 'معلم',
      instrument: 'جهاز الحوار',
      live: 'يبث',
      locked: 'الدرس المقفول',
      noLesson: 'لم يُحفظ درس بعد',
      waiting: 'بانتظار المعلم أن يحفظ درسًا. الأداة لا تتحدث إلا في موضوع الدرس المحفوظ.',
      composer: 'اكتب فكرتك أو سؤالك…',
      send: 'إرسال',
      stuck: 'لست متأكدًا',
      stuckMessage: 'لا أعرف، اسألني سؤالًا أصغر',
      you: 'أنت',
      tutor: 'المرصد',
      studentTitle: 'طاولة الطالب',
      teacherTitle: 'مكتب المعلم',
      teacherLead: 'ارفع درسًا بصيغة PDF ثم احفظه. يستطيع الطلاب النقاش في هذا الدرس فقط، ومن غير أن يأخذوا الإجابة.',
      drop: 'أفلت ملف PDF هنا أو اختره',
      titleLabel: 'عنوان الدرس',
      titlePh: 'مثال: قانون نيوتن الثاني',
      save: 'حفظ الدرس',
      replace: 'استبدال الدرس النشط',
      current: 'الدرس النشط',
      savedAt: 'حُفظ في',
      pages: 'الصفحات',
      excerpt: 'النص المستخرج',
      topicLock: 'النقاش محصور في الدرس المحفوظ',
      terms: 'أفكار من الدرس',
      probe: 'سؤال',
      ideas: 'أفكار',
      clear: 'بدء حوار جديد',
      teacherName: 'المعلم: عماد أبو حجيلة',
      needFile: 'اختر ملف PDF أولًا.',
      needTitle: 'اكتب عنوانًا للدرس.',
      savedOk: 'تم الحفظ. حديث الطلاب الآن عن هذا الدرس فقط.',
      chipLead: 'أريد أن أفكر في',
      errors: {
        'pdf-only': 'الملف يجب أن يكون PDF.',
        'empty-pdf': 'لم أجد نصًا في هذا الملف. استخدم PDF فيه نص يمكن تحديده، لا صورة ممسوحة فقط.',
        'extract-failed': 'تعذّر قراءة هذا الـ PDF.',
        'too-large': 'الملف أكبر من 12 ميغابايت.',
        'need-title': 'اكتب عنوانًا للدرس.',
        'no-lesson': 'لا يوجد درس محفوظ بعد.',
        server: 'حدث خلل. حاول مرة أخرى.'
      }
    },
    en: {
      brand: 'The Orrery',
      tagline: 'Physics by questions — never a ready answer',
      student: 'Student',
      teacher: 'Teacher',
      instrument: 'Dialogue instrument',
      live: 'Live',
      locked: 'Locked lesson',
      noLesson: 'No lesson saved yet',
      waiting: 'Waiting for the teacher to save a lesson. The tool only discusses that saved topic.',
      composer: 'Write your idea or your question…',
      send: 'Send',
      stuck: 'I’m not sure',
      stuckMessage: "I don't know, please ask a smaller question",
      you: 'You',
      tutor: 'Orrery',
      studentTitle: 'Student bench',
      teacherTitle: 'Teacher bench',
      teacherLead: 'Upload a lesson as a PDF and save it. Students discuss only that lesson, and they never receive the answer.',
      drop: 'Drop a PDF here, or choose one',
      titleLabel: 'Lesson title',
      titlePh: 'Example: Newton’s second law',
      save: 'Save lesson',
      replace: 'Replace active lesson',
      current: 'Active lesson',
      savedAt: 'Saved',
      pages: 'Pages',
      excerpt: 'Extracted text',
      topicLock: 'Talk stays inside the saved lesson',
      terms: 'Ideas in the lesson',
      probe: 'Probe',
      ideas: 'Ideas',
      clear: 'Start a new talk',
      teacherName: 'Teacher: Emad Abu Houjaila',
      needFile: 'Choose a PDF first.',
      needTitle: 'Give the lesson a title.',
      savedOk: 'Saved. Student talk is now only about this lesson.',
      chipLead: 'I want to think about',
      errors: {
        'pdf-only': 'The file must be a PDF.',
        'empty-pdf': 'No selectable text found. Use a PDF with real text, not a scan alone.',
        'extract-failed': 'This PDF could not be read.',
        'too-large': 'That file is larger than 12 MB.',
        'need-title': 'Give the lesson a title.',
        'no-lesson': 'No lesson has been saved yet.',
        server: 'Something went wrong. Try again.'
      }
    }
  };

  const state = {
    lang: storeGet('orrery-lang') || 'ar',
    mode: 'student',
    lesson: null,
    messages: [],
    file: null,
    busy: false
  };
  let talkToken = 0;
  let toastTimer = 0;

  const log = document.getElementById('log');
  const composer = document.getElementById('composer');
  const input = document.getElementById('composer-input');
  const empty = document.getElementById('empty-state');
  const termRow = document.getElementById('term-row');
  const termList = document.getElementById('term-list');

  function pack() { return I18N[state.lang] || I18N.ar; }

  function storeGet(key) {
    try { return sessionStorage.getItem(key); } catch (err) { return null; }
  }
  function storeSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (err) { /* private mode */ }
  }
  function storeDel(key) {
    try { sessionStorage.removeItem(key); } catch (err) { /* private mode */ }
  }

  function chatKey() {
    return state.lesson && state.lesson.savedAt ? `orrery:${state.lesson.savedAt}` : '';
  }

  function applyI18n() {
    const text = pack();
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.title = state.lang === 'ar' ? 'المرصد — حوار فيزياء' : 'The Orrery — physics dialogue';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (typeof text[key] === 'string') el.textContent = text[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (typeof text[key] === 'string') el.setAttribute('placeholder', text[key]);
    });
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      const on = btn.getAttribute('data-lang') === state.lang;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-mode]').forEach((btn) => {
      const on = btn.getAttribute('data-mode') === state.mode;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const save = document.getElementById('save');
    if (save) save.textContent = state.lesson ? text.replace : text.save;
    renderStage();
  }

  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.dir = 'auto';
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  function errorText(code) {
    return pack().errors[code] || pack().errors.server;
  }

  function scriptDir(text) {
    const arabic = (String(text).match(/[\u0600-\u06FF]/g) || []).length;
    const latin = (String(text).match(/[A-Za-z]/g) || []).length;
    return arabic > latin ? 'rtl' : 'ltr';
  }

  function formatTime(iso) {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar' : 'en', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(iso));
    } catch (err) {
      return iso;
    }
  }

  function renderStage() {
    const title = document.getElementById('stage-title');
    const lamp = document.getElementById('lamp');
    const terms = (state.lesson && state.lesson.terms) || [];
    title.textContent = state.lesson ? state.lesson.title : pack().noLesson;
    title.dir = 'auto';
    document.getElementById('term-count').textContent = String(terms.length);
    document.getElementById('probe-count').textContent = String(
      state.messages.filter((item) => item.role === 'tutor').length
    );
    lamp.dataset.state = state.lesson ? 'on' : 'wait';
    termList.textContent = '';
    terms.slice(0, 6).forEach((term) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = term;
      btn.addEventListener('click', () => send(`${pack().chipLead} ${term}`));
      termList.appendChild(btn);
    });
    termRow.hidden = !state.lesson || state.mode !== 'student';
  }

  function renderMessages() {
    log.textContent = '';
    state.messages.forEach((item) => {
      const bubble = document.createElement('article');
      bubble.className = `bubble ${item.role === 'student' ? 'student' : 'tutor'}`;
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = item.role === 'student' ? pack().you : pack().tutor;
      const body = document.createElement('div');
      body.className = 'msg';
      body.dir = 'auto';
      body.textContent = item.text;
      bubble.append(who, body);
      log.appendChild(bubble);
    });
    log.scrollTop = log.scrollHeight;
    renderStage();
  }

  function persistMessages() {
    const key = chatKey();
    if (!key) return;
    storeSet(key, JSON.stringify(state.messages));
  }

  function restoreMessages() {
    const key = chatKey();
    state.messages = [];
    if (!key) return;
    try {
      const saved = JSON.parse(storeGet(key) || '[]');
      if (Array.isArray(saved)) {
        state.messages = saved.filter((item) => item && item.text && (item.role === 'tutor' || item.role === 'student'));
      }
    } catch (err) {
      state.messages = [];
    }
  }

  function showMode(mode) {
    state.mode = mode;
    document.getElementById('student-view').hidden = mode !== 'student';
    document.getElementById('teacher-view').hidden = mode !== 'teacher';
    applyI18n();
    if (mode === 'teacher') loadTeacher();
    else showStudent();
  }

  function showStudent() {
    const has = Boolean(state.lesson);
    empty.hidden = has;
    composer.hidden = !has;
    log.hidden = !has;
    termRow.hidden = !has;
    if (!has) {
      state.messages = [];
      renderMessages();
      return;
    }
    if (!state.messages.length) loadOpening();
    else renderMessages();
  }

  async function loadOpening() {
    const token = ++talkToken;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', history: [], lang: state.lang })
      });
      const data = await res.json();
      if (token !== talkToken) return;
      if (!res.ok) throw new Error(data.error || 'server');
      state.messages = [{ role: 'tutor', text: data.reply }];
      persistMessages();
      renderMessages();
    } catch (err) {
      if (token === talkToken) toast(errorText(err.message));
    }
  }

  async function send(text) {
    const message = String(text || '').trim();
    if (!message || state.busy || !state.lesson) return;
    state.busy = true;
    const token = ++talkToken;
    state.messages.push({ role: 'student', text: message });
    renderMessages();
    input.value = '';
    document.getElementById('send').disabled = true;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          lang: state.lang,
          history: state.messages.slice(0, -1).slice(-12)
        })
      });
      const data = await res.json();
      if (token !== talkToken) return;
      if (!res.ok) throw new Error(data.error || 'server');
      state.messages.push({ role: 'tutor', text: data.reply });
      persistMessages();
      renderMessages();
    } catch (err) {
      toast(errorText(err.message));
    } finally {
      state.busy = false;
      document.getElementById('send').disabled = false;
      input.focus();
    }
  }

  function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      toast(pack().errors['pdf-only']);
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast(pack().errors['too-large']);
      return;
    }
    state.file = file;
    document.getElementById('file-name').textContent = file.name;
    const title = document.getElementById('title');
    if (!title.value.trim()) title.value = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
  }

  async function saveLesson() {
    if (!state.file) return toast(pack().needFile);
    const title = document.getElementById('title').value.trim();
    if (!title) return toast(pack().needTitle);
    talkToken += 1;
    const body = new FormData();
    body.append('file', state.file);
    body.append('title', title);
    document.getElementById('save').disabled = true;
    try {
      const res = await fetch('/api/lesson', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'server');
      state.lesson = data.lesson;
      state.messages = [];
      const key = chatKey();
      if (key) storeDel(key);
      renderMessages();
      renderTeacher(data.lesson);
      applyI18n();
      toast(pack().savedOk);
    } catch (err) {
      toast(errorText(err.message));
    } finally {
      document.getElementById('save').disabled = false;
    }
  }

  function renderTeacher(lesson) {
    const card = document.getElementById('active-card');
    if (!lesson || !lesson.text) {
      card.hidden = !lesson;
      return;
    }
    card.hidden = false;
    document.getElementById('active-title').textContent = lesson.title;
    document.getElementById('active-when').textContent = formatTime(lesson.savedAt);
    document.getElementById('active-pages').textContent = String(lesson.pages || 1);
    const excerpt = document.getElementById('excerpt');
    excerpt.textContent = lesson.text;
    excerpt.dir = scriptDir(lesson.text);
    renderStage();
  }

  async function loadTeacher() {
    try {
      const res = await fetch('/api/lesson?view=teacher');
      const data = await res.json();
      state.lesson = data.hasLesson ? data : null;
      if (state.lesson) document.getElementById('title').value = state.lesson.title;
      renderTeacher(state.lesson);
      applyI18n();
    } catch (err) {
      toast(errorText('server'));
    }
  }

  async function boot() {
    applyI18n();
    try {
      const res = await fetch('/api/lesson');
      const data = await res.json();
      state.lesson = data.hasLesson ? data : null;
    } catch (err) {
      state.lesson = null;
    }
    restoreMessages();
    showMode('student');
  }

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-lang');
      if (next === state.lang) return;
      state.lang = next;
      storeSet('orrery-lang', next);
      applyI18n();
      renderMessages();
      const onlyOpening = state.messages.length === 1 && state.messages[0].role === 'tutor';
      if (state.mode === 'student' && state.lesson && onlyOpening) {
        state.messages = [];
        loadOpening();
      }
    });
  });

  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => showMode(btn.getAttribute('data-mode')));
  });

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    send(input.value);
  });
  document.getElementById('stuck').addEventListener('click', () => send(pack().stuckMessage));
  document.getElementById('clear').addEventListener('click', () => {
    state.messages = [];
    const key = chatKey();
    if (key) storeDel(key);
    if (state.lesson) loadOpening();
    else renderMessages();
  });
  document.getElementById('save').addEventListener('click', saveLesson);
  document.getElementById('pdf').addEventListener('change', (event) => {
    setFile(event.target.files && event.target.files[0]);
  });

  const drop = document.getElementById('drop');
  ['dragenter', 'dragover'].forEach((name) => {
    drop.addEventListener(name, (event) => {
      event.preventDefault();
      drop.classList.add('hot');
    });
  });
  ['dragleave', 'drop'].forEach((name) => {
    drop.addEventListener(name, (event) => {
      event.preventDefault();
      drop.classList.remove('hot');
    });
  });
  drop.addEventListener('drop', (event) => {
    setFile(event.dataTransfer.files && event.dataTransfer.files[0]);
  });

  boot();
})();
