(function () {
  const I18N = {
    ar: {
      brand: 'المرصد',
      tagline: 'أسئلة في الفيزياء، لا إجابات جاهزة',
      student: 'طالب',
      teacher: 'معلم',
      instrument: 'جهاز الحوار',
      live: 'يبث',
      locked: 'الدرس المختار',
      noLesson: 'لا توجد دروس بعد',
      waiting: 'بانتظار المعلم أن يضيف درسًا. الحوار يبدأ بعد اختيار درس، ويبقى داخله.',
      pickLesson: 'اختر درسًا',
      pickLead: 'اختر درسًا من القائمة قبل أن يبدأ الحوار.',
      changeLesson: 'درس آخر',
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
      teacherLead: 'كل ملف يُضاف ويبقى. يختار الطالب درسًا قبل الحوار، ويبقى الحديث داخله، ومن غير الإجابة.',
      lockTitle: 'باب المعلم',
      lockLead: 'أدخل كلمة المرور لفتح مكتب المعلم. طاولة الطالب تبقى مفتوحة.',
      passwordLabel: 'كلمة المرور',
      passwordPh: 'كلمة المرور',
      unlock: 'فتح المكتب',
      drop: 'أفلت ملف الدرس هنا أو اختره',
      titleLabel: 'عنوان الدرس',
      titlePh: 'مثال: قانون نيوتن الثاني',
      save: 'إضافة درس',
      savedLessons: 'الدروس المحفوظة',
      current: 'معاينة الدرس',
      savedAt: 'حُفظ في',
      pages: 'الصفحات',
      excerpt: 'النص المستخرج',
      topicLock: 'النقاش محصور في الدرس الذي اخترته',
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
      saving: 'جارٍ الحفظ…',
      savingNote: 'جارٍ حفظ الدرس. قد يحتاج الملف المصوّر إلى دقيقة، ولن يتغير الزر حتى ينتهي.',
      savedOk: 'تمت الإضافة. الدروس السابقة ما زالت محفوظة.',
      chipLead: 'أريد أن أفكر في',
      errors: {
        'pdf-only': 'الملف يجب أن يكون بصيغة بي دي إف.',
        'empty-pdf': 'لم أجد نصًا يمكن قراءته في هذا الملف.',
        'extract-failed': 'تعذّر قراءة هذا الملف.',
        'too-large': 'الملف أكبر من 12 ميغابايت.',
        'need-title': 'اكتب عنوانًا للدرس.',
        'no-lesson': 'اختر درسًا من القائمة أولًا.',
        'teacher-locked': 'كلمة المرور غير مطابقة.',
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
      locked: 'Chosen lesson',
      noLesson: 'No lessons yet',
      waiting: 'Waiting for the teacher to add a lesson. The talk starts after you choose one, and it stays there.',
      pickLesson: 'Choose a lesson',
      pickLead: 'Choose a lesson from the list before the talk starts.',
      changeLesson: 'Another lesson',
      composer: 'Write your idea or your question…',
      send: 'Send',
      stuck: 'I’m not sure',
      stuckMessage: "I don't know, please ask a smaller question",
      you: 'You',
      tutor: 'Orrery',
      studentTitle: 'Student bench',
      teacherTitle: 'Teacher bench',
      teacherLead: 'Each file is added and kept. The student chooses one lesson before the talk, and the talk stays inside it without the answer.',
      lockTitle: 'Teacher door',
      lockLead: 'Enter the password to open the teacher bench. The student bench stays open.',
      passwordLabel: 'Password',
      passwordPh: 'Password',
      unlock: 'Open the bench',
      drop: 'Drop a PDF here, or choose one',
      titleLabel: 'Lesson title',
      titlePh: 'Example: Newton’s second law',
      save: 'Add lesson',
      savedLessons: 'Saved lessons',
      current: 'Lesson preview',
      savedAt: 'Saved',
      pages: 'Pages',
      excerpt: 'Extracted text',
      topicLock: 'Talk stays inside the lesson you chose',
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
      saving: 'Saving…',
      savingNote: 'Saving the lesson. A scanned file can take a minute, and the button stays busy until it finishes.',
      savedOk: 'Added. Earlier lessons are still saved.',
      chipLead: 'I want to think about',
      errors: {
        'pdf-only': 'The file must be a PDF.',
        'empty-pdf': 'No readable text found in this file.',
        'extract-failed': 'This PDF could not be read.',
        'too-large': 'That file is larger than 12 MB.',
        'need-title': 'Give the lesson a title.',
        'no-lesson': 'Choose a lesson from the list first.',
        'teacher-locked': 'That password does not open the teacher bench.',
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
    catalog: [],
    lesson: null,
    preview: null,
    teacherKey: '',
    messages: [],
    file: null,
    pending: [],
    busy: false,
    saving: false
  };
  let talkToken = 0;
  let toastTimer = 0;
  let toastKey = '';

  const log = document.getElementById('log');
  const composer = document.getElementById('composer');
  const input = document.getElementById('composer-input');
  const empty = document.getElementById('empty-state');
  const picker = document.getElementById('lesson-picker');
  const lessonList = document.getElementById('lesson-list');
  const teacherList = document.getElementById('teacher-lessons');
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
    return state.lesson && state.lesson.id ? `orrery:${state.lesson.id}` : '';
  }

  function teacherHeaders() {
    return state.teacherKey ? { 'X-Teacher-Password': state.teacherKey } : {};
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
    if (save) {
      save.textContent = state.saving ? text.saving : text.save;
      save.disabled = state.saving;
      save.setAttribute('aria-busy', state.saving ? 'true' : 'false');
    }
    paintSaveStatus();
    const when = document.getElementById('active-when');
    if (when && state.preview && state.preview.savedAt) when.textContent = formatTime(state.preview.savedAt);
    paintToast();
    renderStage();
    renderPreviews();
    renderPicker();
    renderTeacherList();
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

  let saveStatus = '';

  function paintSaveStatus() {
    const el = document.getElementById('save-status');
    if (!el) return;
    if (!saveStatus) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.hidden = false;
    el.textContent = lookupChrome(saveStatus);
    el.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  }

  function setSaveStatus(code) {
    saveStatus = code || '';
    paintSaveStatus();
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
    if (state.lesson) title.textContent = state.lesson.title;
    else if (state.catalog.length) title.textContent = pack().pickLesson;
    else title.textContent = pack().noLesson;
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

  function fillLessonButtons(container, onPick) {
    if (!container) return;
    container.textContent = '';
    state.catalog.forEach((lesson) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lesson-pick';
      if (state.lesson && state.lesson.id === lesson.id) btn.classList.add('on');
      const name = document.createElement('span');
      name.textContent = lesson.title;
      name.dir = 'auto';
      const when = document.createElement('small');
      when.textContent = formatTime(lesson.savedAt);
      btn.append(name, when);
      btn.addEventListener('click', () => onPick(lesson));
      container.appendChild(btn);
    });
  }

  function renderPicker() {
    fillLessonButtons(lessonList, pickLesson);
  }

  function renderTeacherList() {
    fillLessonButtons(teacherList, (lesson) => openTeacherLesson(lesson.id));
  }

  function showMode(mode) {
    state.mode = mode;
    document.getElementById('student-view').hidden = mode !== 'student';
    document.getElementById('teacher-view').hidden = mode !== 'teacher';
    applyI18n();
    if (mode === 'teacher') showTeacher();
    else showStudent();
  }

  function showTeacher() {
    const open = Boolean(state.teacherKey);
    document.getElementById('teacher-lock').hidden = open;
    document.getElementById('teacher-bench').hidden = !open;
    if (open) renderTeacherList();
  }

  function showStudent() {
    const hasLessons = state.catalog.length > 0;
    const has = Boolean(state.lesson);
    empty.hidden = hasLessons;
    picker.hidden = !hasLessons || has;
    composer.hidden = !has;
    log.hidden = !has;
    termRow.hidden = !has;
    document.getElementById('clear').hidden = !has;
    document.getElementById('change-lesson').hidden = !has;
    renderPicker();
    if (!has) {
      state.messages = [];
      renderMessages();
      return;
    }
    if (!state.messages.length) loadOpening();
    else renderMessages();
  }

  function pickLesson(lesson) {
    if (!lesson || !lesson.id) return;
    talkToken += 1;
    state.lesson = lesson;
    storeSet('orrery-lesson', lesson.id);
    restoreMessages();
    showStudent();
  }

  function changeLesson() {
    talkToken += 1;
    state.lesson = null;
    storeDel('orrery-lesson');
    state.messages = [];
    state.pending = [];
    renderPreviews();
    showStudent();
  }

  async function loadOpening() {
    if (!state.lesson) return;
    const token = ++talkToken;
    const lessonId = state.lesson.id;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', history: [], lang: state.lang, lessonId })
      });
      const data = await res.json();
      if (token !== talkToken || !state.lesson || state.lesson.id !== lessonId) return;
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
    const lessonId = state.lesson.id;
    state.messages.push({ role: 'student', text: message, images });
    renderMessages();
    input.value = '';
    document.getElementById('send').disabled = true;
    const body = new FormData();
    body.append('message', message);
    body.append('lang', state.lang);
    body.append('lessonId', lessonId);
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
    if (state.saving) return;
    if (!state.teacherKey) return toast('teacher-locked');
    if (!state.file) {
      setSaveStatus('needFile');
      return toast('needFile');
    }
    const title = document.getElementById('title').value.trim();
    if (!title) {
      setSaveStatus('needTitle');
      return toast('needTitle');
    }
    const body = new FormData();
    body.append('file', state.file);
    body.append('title', title);
    state.saving = true;
    setSaveStatus('savingNote');
    applyI18n();
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: teacherHeaders(),
        body
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'server');
      state.preview = data.lesson;
      state.file = null;
      document.getElementById('file-name').textContent = '';
      document.getElementById('title').value = '';
      document.getElementById('pdf').value = '';
      await refreshCatalog();
      renderTeacher(state.preview);
      renderTeacherList();
      setSaveStatus('savedOk');
      toast('savedOk');
    } catch (err) {
      const code = err && err.message ? err.message : 'server';
      if (code === 'teacher-locked') state.teacherKey = '';
      setSaveStatus(code);
      toast(code);
      showTeacher();
    } finally {
      state.saving = false;
      applyI18n();
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

  async function openTeacherLesson(id) {
    try {
      const res = await fetch(`/api/lessons/${encodeURIComponent(id)}?view=teacher`, {
        headers: teacherHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'server');
      state.preview = data.lesson;
      renderTeacher(state.preview);
    } catch (err) {
      toast(err.message || 'server');
    }
  }

  async function unlockTeacher() {
    const field = document.getElementById('teacher-password');
    const key = field.value;
    if (!String(key).trim()) {
      toast('teacher-locked');
      return;
    }
    try {
      const res = await fetch('/api/teacher/unlock', {
        method: 'POST',
        headers: { 'X-Teacher-Password': key }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'teacher-locked');
      state.teacherKey = key;
      field.value = '';
      await refreshCatalog();
      showTeacher();
      applyI18n();
    } catch (err) {
      state.teacherKey = '';
      toast(err.message || 'teacher-locked');
    }
  }

  async function refreshCatalog() {
    const res = await fetch('/api/lessons');
    const data = await res.json();
    state.catalog = Array.isArray(data.lessons) ? data.lessons : [];
    if (state.lesson) {
      const fresh = state.catalog.find((item) => item.id === state.lesson.id);
      state.lesson = fresh || null;
      if (!state.lesson) storeDel('orrery-lesson');
    }
  }

  async function boot() {
    applyI18n();
    try {
      await refreshCatalog();
      const savedId = storeGet('orrery-lesson');
      state.lesson = state.catalog.find((item) => item.id === savedId) || null;
    } catch (err) {
      state.catalog = [];
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
  document.getElementById('change-lesson').addEventListener('click', changeLesson);
  document.getElementById('save').addEventListener('click', saveLesson);
  document.getElementById('teacher-lock').addEventListener('submit', (event) => {
    event.preventDefault();
    unlockTeacher();
  });
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
