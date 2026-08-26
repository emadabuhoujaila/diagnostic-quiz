import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useStudent } from '../../context/StudentContext'
import { getExamById } from '../../lib/examsApi'
import {
  getSession,
  lockSession,
  saveAnswers,
  submitSession,
} from '../../lib/sessionsApi'
import { gradeExam } from '../../lib/grading'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  SESSION_STATUS,
} from '../../lib/constants'
import { isFirebaseConfigured } from '../../lib/firebase'

export default function StudentExamPage() {
  const { student, logout } = useStudent()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!student?.examId) return undefined
    let cancelled = false
    ;(async () => {
      const ex = await getExamById(student.examId)
      const session = await getSession(student.ministryId, student.examId)
      if (cancelled) return
      if (!ex) {
        setLoading(false)
        return
      }
      setExam(ex)
      setAnswers(session?.answers || {})
      if (session?.status === SESSION_STATUS.LOCKED) setLocked(true)
      if (session?.status === SESSION_STATUS.SUBMITTED) {
        setResult(session.score || null)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [student])

  // قفل عند مغادرة التبويب / إخفاء الصفحة / إغلاق النافذة
  useEffect(() => {
    if (!student?.examId || locked || result) return undefined

    let locking = false
    async function doLock(reason) {
      if (locking) return
      locking = true
      setLocked(true)
      try {
        await lockSession(student.ministryId, student.examId, reason)
      } catch (err) {
        console.error(err)
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        doLock('visibility_hidden')
      }
    }

    function onPageHide() {
      doLock('page_hide')
    }

    function onBlur() {
      // تأخير قصير لتقليل الإنذارات الكاذبة عند التنقل داخل الصفحة
      window.setTimeout(() => {
        if (document.visibilityState === 'hidden' || !document.hasFocus()) {
          doLock('window_blur')
        }
      }, 400)
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('blur', onBlur)
    }
  }, [student, locked, result])

  const questions = exam?.questions || []
  const current = questions[index]

  const progress = useMemo(() => {
    if (!questions.length) return 0
    const answered = questions.filter(
      (q) => answers[q.id] != null && answers[q.id] !== '',
    ).length
    return Math.round((answered / questions.length) * 100)
  }, [questions, answers])

  if (!student) return <Navigate to="/student/login" replace />
  if (!student.examId) return <Navigate to="/student" replace />

  async function setAnswer(questionId, value) {
    if (locked || result) return
    const next = { ...answers, [questionId]: value }
    setAnswers(next)
    await saveAnswers(student.ministryId, student.examId, next)
  }

  async function handleSubmit() {
    if (locked || result || submitting) return
    setSubmitting(true)
    const score = gradeExam(questions, answers)
    await submitSession(student.ministryId, student.examId, answers, score)
    setResult(score)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="page-center">
        <p className="muted">جاري تحميل الاختبار…</p>
      </div>
    )
  }

  if (locked && !result) {
    return (
      <div className="shell student-shell">
        <ConfigBanner configured={isFirebaseConfigured} />
        <div className="lock-screen">
          <h1>تم قفل الاختبار</h1>
          <p>
            غادرت المتصفح أو التبويب. انتظر حتى يسمح لك المعلم بالدخول من جديد.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              logout()
              navigate('/student/login')
            }}
          >
            العودة لشاشة الدخول
          </button>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="shell student-shell">
        <header className="dash-header">
          <BrandMark />
        </header>
        <div className="status-card ready">
          <h1>تم تسليم الاختبار</h1>
          <p className="score-big">{result.percent}%</p>
          <p>
            {result.earned} من {result.total} درجة
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            إنهاء
          </button>
        </div>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="status-card">
        <h1>لا توجد أسئلة بعد</h1>
        <p>المعلم رفع الصفحات دون تعريف أسئلة قابلة للتصحيح.</p>
      </div>
    )
  }

  const pageImg = exam.pages?.find((p) => p.pageNumber === current.pageNumber)

  return (
    <div className="shell exam-shell">
      <header className="exam-top">
        <BrandMark />
        <div className="exam-meta">
          <span>
            {student.name} · {student.ministryId}
          </span>
          <span>
            سؤال {index + 1} / {questions.length}
          </span>
        </div>
        <div className="exam-progress">
          <div className="exam-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="exam-layout">
        {pageImg && (
          <div className="exam-page">
            <img src={pageImg.imageDataUrl} alt={`صفحة ${current.pageNumber}`} />
          </div>
        )}

        <div className="exam-answer-panel">
          <span className="q-type-badge">
            {QUESTION_TYPE_LABELS[current.type]}
          </span>
          {current.prompt && <h2 className="q-prompt">{current.prompt}</h2>}

          <AnswerInput
            question={current}
            value={answers[current.id]}
            onChange={(v) => setAnswer(current.id, v)}
          />

          <div className="exam-nav">
            <button
              type="button"
              className="btn-secondary"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              السابق
            </button>
            {index < questions.length - 1 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIndex((i) => i + 1)}
              >
                التالي
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'جارٍ التسليم…' : 'تسليم الاختبار'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function AnswerInput({ question, value, onChange }) {
  if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    return (
      <div className="opts">
        {question.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={value === opt.id ? 'opt sel' : 'opt'}
            onClick={() => onChange(opt.id)}
          >
            <span className="oltr">{opt.label}</span>
            <span>{opt.text || opt.label}</span>
          </button>
        ))}
      </div>
    )
  }

  if (question.type === QUESTION_TYPES.TRUE_FALSE) {
    return (
      <div className="opts">
        {[
          { id: 'true', label: 'صح' },
          { id: 'false', label: 'خطأ' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={value === opt.id ? 'opt sel' : 'opt'}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === QUESTION_TYPES.SHORT_ANSWER) {
    return (
      <input
        className="short-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="اكتب إجابتك"
      />
    )
  }

  if (question.type === QUESTION_TYPES.MATCHING) {
    const current = value || {}
    return (
      <div className="match-student">
        {question.left.map((l) => (
          <label key={l.id} className="field">
            <span>{l.text || l.id}</span>
            <select
              value={current[l.id] || ''}
              onChange={(e) =>
                onChange({ ...current, [l.id]: e.target.value })
              }
            >
              <option value="">اختر</option>
              {question.right.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.text || r.id}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    )
  }

  if (question.type === QUESTION_TYPES.ORDERING) {
    const order = Array.isArray(value)
      ? value
      : question.items.map((i) => i.id)
    const byId = Object.fromEntries(question.items.map((i) => [i.id, i]))

    function move(idx, dir) {
      const next = [...order]
      const j = idx + dir
      if (j < 0 || j >= next.length) return
      ;[next[idx], next[j]] = [next[j], next[idx]]
      onChange(next)
    }

    return (
      <div className="order-list">
        {order.map((id, idx) => (
          <div key={id} className="order-item">
            <span>{byId[id]?.text || id}</span>
            <div className="order-btns">
              <button type="button" onClick={() => move(idx, -1)}>
                ↑
              </button>
              <button type="button" onClick={() => move(idx, 1)}>
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}
