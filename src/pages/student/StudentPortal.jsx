import { Navigate } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useStudent } from '../../context/StudentContext'
import { SESSION_STATUS } from '../../lib/constants'

export default function StudentPortal() {
  const { student, statusMessage, logout, isConfigured } = useStudent()

  if (!student) {
    return <Navigate to="/student/login" replace />
  }

  const status = student.sessionStatus || SESSION_STATUS.WAITING
  const waiting =
    status === SESSION_STATUS.WAITING ||
    status === SESSION_STATUS.LOCKED ||
    status === SESSION_STATUS.SUBMITTED

  return (
    <div className="shell student-shell">
      <ConfigBanner configured={isConfigured} />
      <header className="dash-header">
        <BrandMark />
        <div className="dash-user">
          <span className="dash-name">
            {student.name || 'طالب'} · {student.ministryId}
          </span>
          <button type="button" className="btn-ghost" onClick={logout}>
            خروج
          </button>
        </div>
      </header>

      <main className="student-main">
        {waiting ? (
          <div className="status-card" role="status">
            <h1>
              {status === SESSION_STATUS.LOCKED
                ? 'الاختبار مقفل'
                : status === SESSION_STATUS.SUBMITTED
                  ? 'تم التسليم'
                  : 'بانتظار المعلم'}
            </h1>
            <p>
              {statusMessage ||
                'لم يبدأ الاختبار، انتظر تعليمات المعلم'}
            </p>
            <dl className="meta-list">
              <div>
                <dt>الصف</dt>
                <dd>{student.gradeId || '—'}</dd>
              </div>
              <div>
                <dt>الشعبة</dt>
                <dd>{student.section || '—'}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="status-card ready">
            <h1>{student.examTitle || 'الاختبار التشخيصي'}</h1>
            <p>
              واجهة أداء الأسئلة (كل الأنواع) ستُفعَّل في الخطوة 4 بعد رفع
              ملف PDF.
            </p>
            <button type="button" className="btn-primary" disabled>
              بدء الاختبار — قريباً
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
