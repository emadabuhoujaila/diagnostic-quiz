import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'
import { listExamsForTeacher } from '../../lib/examsApi'
import { listSessionsForTeacher } from '../../lib/sessionsApi'
import { GRADES, SESSION_STATUS } from '../../lib/constants'

export default function ResultsPage() {
  const { teacherId, isConfigured, demoMode } = useAuth()
  const [sessions, setSessions] = useState([])
  const [exams, setExams] = useState([])
  const [gradeFilter, setGradeFilter] = useState('all')

  useEffect(() => {
    ;(async () => {
      if (!teacherId) return
      const ex = await listExamsForTeacher(teacherId)
      setExams(ex)
      const list = await listSessionsForTeacher(ex.map((e) => e.id))
      setSessions(list)
    })()
  }, [teacherId])

  const submitted = useMemo(() => {
    return sessions
      .filter((s) => s.status === SESSION_STATUS.SUBMITTED)
      .filter((s) => {
        if (gradeFilter === 'all') return true
        return s.gradeId === gradeFilter
      })
      .sort((a, b) => (b.score?.percent || 0) - (a.score?.percent || 0))
  }, [sessions, gradeFilter])

  const avg =
    submitted.length === 0
      ? 0
      : Math.round(
          submitted.reduce((sum, s) => sum + (s.score?.percent || 0), 0) /
            submitted.length,
        )

  return (
    <div className="shell dash-shell">
      <ConfigBanner configured={isConfigured} demoMode={demoMode} />
      <header className="dash-header">
        <BrandMark />
        <Link className="btn-ghost" to="/teacher">
          لوحة المعلم
        </Link>
      </header>

      <main className="dash-main">
        <section className="dash-intro">
          <h1>النتائج التشخيصية</h1>
          <p>
            {exams.length} اختبار · {submitted.length} تسليم · متوسط {avg}%
          </p>
        </section>

        <div className="action-row">
          <label className="field inline-field">
            <span>تصفية حسب الصف</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <option value="all">الكل</option>
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>الرقم الوزاري</th>
                <th>الاسم</th>
                <th>الصف</th>
                <th>الشعبة</th>
                <th>الدرجة</th>
                <th>النسبة</th>
              </tr>
            </thead>
            <tbody>
              {submitted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    لا نتائج مسلّمة بعد
                  </td>
                </tr>
              ) : (
                submitted.map((s) => (
                  <tr key={s.id || `${s.ministryId}-${s.examId}`}>
                    <td dir="ltr">{s.ministryId}</td>
                    <td>{s.studentName || '—'}</td>
                    <td>{s.gradeId || '—'}</td>
                    <td>{s.section || '—'}</td>
                    <td>
                      {s.score
                        ? `${s.score.earned}/${s.score.total}`
                        : '—'}
                    </td>
                    <td>
                      <strong>{s.score?.percent ?? '—'}%</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
