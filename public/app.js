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
      langAr: 'العربية',
      langEn: 'الإنجليزية',
      modeGroup: 'الدور',
      langGroup: 'اللغة',
      teacherLead: 'ارفع درس الفيزياء ثم احفظه. يستطيع الطلاب النقاش في هذا الدرس فقط، ومن غير أن يأخذوا الإجابة.',
      drop: 'أفلت ملف الدرس هنا أو اختره',
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
      attach: 'أرفق صورة',
      removeImage: 'إزالة',
      imageAlt: 'صورة مرفقة',
      teacherName: 'المعلم: عماد أبو حجيلة',
      needFile: 'اختر ملف الدرس أولًا.',
      needTitle: 'اكتب عنوانًا للدرس.',
      savedOk: 'تم الحفظ. حديث الطلاب الآن عن هذا الدرس فقط.',
      chipLead: 'أريد أن أفكر في',
      errors: {
        'pdf-only': 'الملف يجب أن يكون بصيغة بي دي إف.',
        'empty-pdf': 'لم أجد نصًا يمكن قراءته في هذا الملف.',
        'extract-failed': 'تعذّر قراءة هذا الملف.',
        'too-large': 'الملف أكبر من 12 ميغابايت.',
        'need-title': 'اكتب عنوانًا للدرس.',
        'no-lesson': 'لا يوجد درس محفوظ بعد.',
        'image-type': 'اختر صورة.',
        'image-large': 'هذه الصورة أكبر مما يُقبل.',
        'too-many-images': 'يمكن إرفاق أربع صور في الرسالة.',
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
      attach: 'Attach an image',
      removeImage: 'Remove',
      imageAlt: 'Attached image',
      langAr: 'Arabic',
      langEn: 'English',
      modeGroup: 'Role',
      langGroup: 'Language',
      teacherName: 'Teacher: Emad Abu Houjaila',
      needFile: 'Choose a PDF first.',
      needTitle: 'Give the lesson a title.',
      savedOk: 'Saved. Student talk is now only about this lesson.',
      chipLead: 'I want to think about',
      errors: {
        'pdf-only': 'The file must be a PDF.',
        'empty-pdf': 'No readable text found in this file.',
        'extract-failed': 'This PDF could not be read.',
        'too-large': 'That file is larger than 12 MB.',
        'need-title': 'Give the lesson a title.',
        'no-lesson': 'No lesson has been saved yet.',
        'image-type': 'Choose an image.',
        'image-large': 'That image is too large.',
        'too-many-images': 'You can attach up to four images.',
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
    pending: [],
    busy: false
  };
  let talkToken = 0;
  let toastTimer = 0;
  let toastKey = '';

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
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (typeof text[key] === 'string') el.setAttribute('aria-label', text[key]);
    });
    const save = document.getElementById('save');
    if (save) save.textContent = state.lesson ? text.replace : text.save;
    const when = document.getElementById('active-when');
    if (when && state.lesson && state.lesson.savedAt) when.textContent = formatTime(state.lesson.savedAt);
    paintToast();
    renderStage();
    renderPreviews();
  }

  function lookupChrome(code) {
    const text = pack();
    if (typeof text[code] === 'string') return text[code];
    if (text.errors && text.errors[code]) return text.errors[code];
    return text.errors.server;
  }

  function paintToast() {
    const el = document.getElementById('toast');
    if (!toastKey) return;
    el.textContent = lookupChrome(toastKey);
    el.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    el.classList.add('show');
  }

  function toast(code) {
    toastKey = code || 'server';
    paintToast();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastKey = '';
      const el = document.getElementById('toast');
      el.classList.remove('show');
      el.textContent = '';
    }, 8000);
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
      if (Array.isArray(item.images) && item.images.length) {
        const shots = document.createElement('div');
        shots.className = 'bubble-images';
        item.images.forEach((image) => {
          if (!image || !image.data) return;
          const pic = document.createElement('img');
          pic.alt = pack().imageAlt;
          pic.src = `data:${image.mime || 'image/png'};base64,${image.data}`;
          shots.appendChild(pic);
        });
        body.appendChild(shots);
      }
      if (item.text) {
        const line = document.createElement('p');
        line.textContent = item.text;
        body.appendChild(line);
      }
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
        state.messages = saved.filter((item) => item && (item.text || (item.images && item.images.length)) && (item.role === 'tutor' || item.role === 'student'));
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
      if (token === talkToken) toast(err.message);
    }
  }

  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  function renderPreviews() {
    const row = document.getElementById('image-preview');
    if (!row) return;
    row.textContent = '';
    state.pending.forEach((image, index) => {
      const fig = document.createElement('figure');
      const pic = document.createElement('img');
      pic.alt = pack().imageAlt;
      pic.src = `data:${image.mime};base64,${image.data}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'ghost';
      remove.textContent = pack().removeImage;
      remove.addEventListener('click', () => {
        state.pending.splice(index, 1);
        renderPreviews();
      });
      fig.append(pic, remove);
      row.appendChild(fig);
    });
    row.hidden = !state.pending.length;
  }

  function addImages(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (state.pending.length + files.length > 4) toast('too-many-images');
    const room = files.slice(0, Math.max(0, 4 - state.pending.length));
    room.forEach((file) => {
      if (!IMAGE_TYPES.includes(file.type)) {
        toast('image-type');
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast('image-large');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const match = /^data:([^;]+);base64,(.+)$/.exec(String(reader.result || ''));
        if (!match) return;
        if (state.pending.length >= 4) return;
        state.pending.push({ mime: match[1], data: match[2] });
        renderPreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  async function send(text) {
    const message = String(text || '').trim();
    const images = state.pending.slice();
    if ((!message && !images.length) || state.busy || !state.lesson) return;
    state.busy = true;
    state.pending = [];
    renderPreviews();
    const token = ++talkToken;
    state.messages.push({ role: 'student', text: message, images });
    renderMessages();
    input.value = '';
    document.getElementById('send').disabled = true;
    const body = new FormData();
    body.append('message', message);
    body.append('lang', state.lang);
    body.append('history', JSON.stringify(
      state.messages.slice(0, -1).slice(-12).map((item) => ({ role: item.role, text: item.text || '' }))
    ));
    images.forEach((image) => {
      const bytes = Uint8Array.from(atob(image.data), (ch) => ch.charCodeAt(0));
      body.append('images', new Blob([bytes], { type: image.mime }), 'picture');
    });
    try {
      const res = await fetch('/api/chat', { method: 'POST', body });
      const data = await res.json();
      if (token !== talkToken) return;
      if (!res.ok) throw new Error(data.error || 'server');
      state.messages.push({ role: 'tutor', text: data.reply });
      persistMessages();
      renderMessages();
    } catch (err) {
      toast(err.message);
    } finally {
      state.busy = false;
      document.getElementById('send').disabled = false;
      input.focus();
    }
  }

  function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      toast('pdf-only');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast('too-large');
      return;
    }
    state.file = file;
    document.getElementById('file-name').textContent = file.name;
    const title = document.getElementById('title');
    if (!title.value.trim()) title.value = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
  }

  async function saveLesson() {
    if (!state.file) return toast('needFile');
    const title = document.getElementById('title').value.trim();
    if (!title) return toast('needTitle');
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
      toast('savedOk');
    } catch (err) {
      toast(err.message);
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
      toast('server');
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
  document.getElementById('attach').addEventListener('click', () => document.getElementById('images').click());
  document.getElementById('images').addEventListener('change', (event) => {
    addImages(event.target.files);
    event.target.value = '';
  });
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
