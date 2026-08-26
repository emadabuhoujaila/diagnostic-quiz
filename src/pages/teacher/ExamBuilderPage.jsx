import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'
import {
  createEmptyQuestion,
  getExamByGrade,
  listExamsForTeacher,
  pdfFileToPageImages,
  saveExam,
} from '../../lib/examsApi'
import {
  GRADES,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
} from '../../lib/constants'

export default function ExamBuilderPage() {
  const { teacherId, isConfigured, demoMode } = useAuth()
  const pdfRef = useRef(null)
  const [gradeId, setGradeId] = useState('10')
  const [title, setTitle] = useState('اختبار تشخيصي — فيزياء')
  const [pages, setPages] = useState([])
  const [questions, setQuestions] = useState([])
  const [published, setPublished] = useState(false)
  const [progress, setProgress] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [activePage, setActivePage] = useState(1)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const exam = await getExamByGrade(gradeId)
      if (cancelled) return
      if (exam && (!exam.teacherId || exam.teacherId === teacherId)) {
        setTitle(exam.title || 'اختبار تشخيصي — فيزياء')
        setPages(exam.pages || [])
        setQuestions(exam.questions || [])
        setPublished(Boolean(exam.published))
        setActivePage(1)
      } else {
        setPages([])
        setQuestions([])
        setPublished(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [gradeId, teacherId])

  const pageQuestions = useMemo(
    () => questions.filter((q) => q.pageNumber === activePage),
    [questions, activePage],
  )

  async function onPdf(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage(null)
    setProgress({ current: 0, total: 1 })
    try {
      const imgs = await pdfFileToPageImages(file, (current, total) => {
        setProgress({ current, total })
      })
      setPages(imgs)
      setActivePage(1)
      setMessage(`تم تحويل ${imgs.length} صفحة إلى صور`)
    } catch (err) {
      console.error(err)
      setMessage(err.message || 'تعذر قراءة ملف PDF')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  function addQuestion(type) {
    setQuestions((prev) => [...prev, createEmptyQuestion(type, activePage)])
  }

  function updateQuestion(id, patch) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    )
  }

  function removeQuestion(id) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  async function handleSave(publish) {
    if (!teacherId) return
    if (!pages.length) {
      setMessage('ارفع ملف PDF أولاً')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const existing = (await listExamsForTeacher(teacherId)).find(
        (e) => e.gradeId === gradeId,
      )
      await saveExam({
        id: existing?.id,
        teacherId,
        gradeId,
        title,
        pages,
        questions,
        published: publish,
      })
      setPublished(publish)
      setMessage(
        publish
          ? 'تم نشر الاختبار — يمكن للطلاب البدء'
          : 'تم حفظ المسودة',
      )
    } catch (err) {
      setMessage(err.message || 'فشل الحفظ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="shell dash-shell">
      <ConfigBanner configured={isConfigured} demoMode={demoMode} />
      <header className="dash-header">
        <BrandMark />
        <Link className="btn-ghost" to="/teacher">
          لوحة المعلم
        </Link>
      </header>

      <main className="dash-main exam-builder">
        <section className="dash-intro">
          <h1>رفع أسئلة الاختبار</h1>
          <p>
            ارفع PDF فيُحوَّل إلى صور صفحات، ثم أضف الأسئلة بأنواعها واربطها
            بالصفحات.
          </p>
        </section>

        <div className="builder-toolbar">
          <label className="field inline-field">
            <span>الصف</span>
            <select value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field inline-field grow">
            <span>عنوان الاختبار</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => pdfRef.current?.click()}
          >
            رفع PDF
          </button>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={onPdf}
          />
        </div>

        {progress && (
          <p className="muted">
            تحويل الصفحة {progress.current} من {progress.total}…
          </p>
        )}
        {message && <p className="banner-ok">{message}</p>}
        {published && (
          <p className="banner-ok">الحالة الحالية: منشور للطلاب</p>
        )}

        {!pages.length ? (
          <div className="status-card">
            <h1>لم يُرفع PDF بعد</h1>
            <p>ارفع ملف الأسئلة ليُعرض كما هو صورةً لكل صفحة.</p>
          </div>
        ) : (
          <div className="builder-grid">
            <aside className="page-rail">
              {pages.map((p) => (
                <button
                  key={p.pageNumber}
                  type="button"
                  className={
                    activePage === p.pageNumber ? 'page-thumb active' : 'page-thumb'
                  }
                  onClick={() => setActivePage(p.pageNumber)}
                >
                  <img src={p.imageDataUrl} alt={`صفحة ${p.pageNumber}`} />
                  <span>{p.pageNumber}</span>
                </button>
              ))}
            </aside>

            <section className="page-preview">
              <img
                src={pages.find((p) => p.pageNumber === activePage)?.imageDataUrl}
                alt={`معاينة الصفحة ${activePage}`}
              />
            </section>

            <section className="question-panel">
              <h2>أسئلة الصفحة {activePage}</h2>
              <div className="type-row">
                {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    className="btn-secondary"
                    onClick={() => addQuestion(type)}
                  >
                    + {label}
                  </button>
                ))}
              </div>

              {pageQuestions.length === 0 && (
                <p className="muted">لا أسئلة على هذه الصفحة بعد.</p>
              )}

              {pageQuestions.map((q) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  onChange={(patch) => updateQuestion(q.id, patch)}
                  onRemove={() => removeQuestion(q.id)}
                />
              ))}

              <div className="action-row sticky-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => handleSave(false)}
                >
                  حفظ مسودة
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => handleSave(true)}
                >
                  نشر الاختبار
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function QuestionEditor({ question, onChange, onRemove }) {
  const label = QUESTION_TYPE_LABELS[question.type] || question.type

  return (
    <article className="q-editor">
      <div className="q-editor-head">
        <strong>{label}</strong>
        <button type="button" className="btn-ghost danger" onClick={onRemove}>
          حذف
        </button>
      </div>
      <label className="field">
        <span>نص السؤال / تعليمات للطالب</span>
        <input
          value={question.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          placeholder="اختياري إن كان السؤال واضحاً في صورة الصفحة"
        />
      </label>

      {question.type === QUESTION_TYPES.MULTIPLE_CHOICE && (
        <div className="opt-edit-list">
          {question.options.map((opt) => (
            <label key={opt.id} className="opt-edit">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctAnswer === opt.id}
                onChange={() => onChange({ correctAnswer: opt.id })}
              />
              <span>{opt.label}</span>
              <input
                value={opt.text}
                onChange={(e) =>
                  onChange({
                    options: question.options.map((o) =>
                      o.id === opt.id ? { ...o, text: e.target.value } : o,
                    ),
                  })
                }
                placeholder="نص الخيار"
              />
            </label>
          ))}
        </div>
      )}

      {question.type === QUESTION_TYPES.TRUE_FALSE && (
        <div className="type-row">
          <label>
            <input
              type="radio"
              checked={question.correctAnswer === 'true'}
              onChange={() => onChange({ correctAnswer: 'true' })}
            />{' '}
            صح
          </label>
          <label>
            <input
              type="radio"
              checked={question.correctAnswer === 'false'}
              onChange={() => onChange({ correctAnswer: 'false' })}
            />{' '}
            خطأ
          </label>
        </div>
      )}

      {question.type === QUESTION_TYPES.SHORT_ANSWER && (
        <label className="field">
          <span>الإجابة النموذجية</span>
          <input
            value={question.correctAnswer}
            onChange={(e) => onChange({ correctAnswer: e.target.value })}
          />
        </label>
      )}

      {question.type === QUESTION_TYPES.MATCHING && (
        <div className="match-edit">
          {question.left.map((l, idx) => (
            <div key={l.id} className="match-row">
              <input
                value={l.text}
                placeholder={`يسار ${idx + 1}`}
                onChange={(e) =>
                  onChange({
                    left: question.left.map((x) =>
                      x.id === l.id ? { ...x, text: e.target.value } : x,
                    ),
                  })
                }
              />
              <span>←</span>
              <select
                value={question.correctAnswer[l.id] || ''}
                onChange={(e) =>
                  onChange({
                    correctAnswer: {
                      ...question.correctAnswer,
                      [l.id]: e.target.value,
                    },
                  })
                }
              >
                {question.right.map((r, rIdx) => (
                  <option key={r.id} value={r.id}>
                    يمين {rIdx + 1}
                  </option>
                ))}
              </select>
              <input
                value={question.right[idx]?.text || ''}
                placeholder={`يمين ${idx + 1}`}
                onChange={(e) =>
                  onChange({
                    right: question.right.map((x, i) =>
                      i === idx ? { ...x, text: e.target.value } : x,
                    ),
                  })
                }
              />
            </div>
          ))}
        </div>
      )}

      {question.type === QUESTION_TYPES.ORDERING && (
        <div className="opt-edit-list">
          {question.items.map((item, idx) => (
            <input
              key={item.id}
              value={item.text}
              placeholder={`عنصر ${idx + 1} (الترتيب الصحيح)`}
              onChange={(e) =>
                onChange({
                  items: question.items.map((it) =>
                    it.id === item.id ? { ...it, text: e.target.value } : it,
                  ),
                })
              }
            />
          ))}
        </div>
      )}
    </article>
  )
}
