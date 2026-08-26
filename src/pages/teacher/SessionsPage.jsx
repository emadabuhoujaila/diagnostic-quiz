import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'
import { listExamsForTeacher } from '../../lib/examsApi'
import {
  allowRetry,
  listSessionsForTeacher,
  unlockSession,
} from '../../lib/sessionsApi'
import { SESSION_STATUS } from '../../lib/constants'

const STATUS_LABELS = {
  [SESSION_STATUS.WAITING]: 'انتظار',
  [SESSION_STATUS.IN_PROGRESS]: 'جارٍ',
  [SESSION_STATUS.LOCKED]: 'مقفل',
  [SESSION_STATUS.SUBMITTED]: 'مُسلَّم',
  [SESSION_STATUS.ALLOWED_RETRY]: 'إعادة مسموحة',
}

export default function SessionsPage() {
  const { teacherId, isConfigured, demoMode } = useAuth()
  const [sessions, setSessions] = useState([])
  const [message, setMessage] = useState(null)

  async function reload() {
    const exams = await listExamsForTeacher(teacherId)
    const ids = exams.map((e) => e.id)
    const list = await listSessionsForTeacher(ids)
    setSessions(list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)))
  }

  useEffect(() => {
    if (teacherId) reload()
  }, [teacherId])

  async function onUnlock(s) {
    await unlockSession(s.ministryId, s.examId)
    setMessage(`تم فتح القفل للطالب ${s.ministryId}`)
    await reload()
  }

  async function onRetry(s) {
    await allowRetry(s.ministryId, s.examId)
    setMessage(`سُمح بإعادة المحاولة للطالب ${s.ministryId}`)
    await reload()
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

      <main className="dash-main">
        <section className="dash-intro">
          <h1>إدارة الجلسات</h1>
          <p>
            عند خروج الطالب من المتصفح يُقفل الاختبار حتى تفتح القفل أو تسمح
            بإعادة المحاولة.
          </p>
        </section>

        {message && <p className="banner-ok">{message}</p>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>الرقم الوزاري</th>
                <th>الاسم</th>
                <th>الحالة</th>
                <th>المحاولة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    لا جلسات بعد
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id || `${s.ministryId}-${s.examId}`}>
                    <td dir="ltr">{s.ministryId}</td>
                    <td>{s.studentName || '—'}</td>
                    <td>
                      <span className={`status-pill status-${s.status}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td>{s.attemptCount || 1}</td>
                    <td className="actions-cell">
                      {s.status === SESSION_STATUS.LOCKED && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => onUnlock(s)}
                        >
                          فتح القفل
                        </button>
                      )}
                      {(s.status === SESSION_STATUS.SUBMITTED ||
                        s.status === SESSION_STATUS.LOCKED) && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => onRetry(s)}
                        >
                          السماح بإعادة
                        </button>
                      )}
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
