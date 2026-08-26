import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useStudent } from '../../context/StudentContext'
export default function StudentLogin() {
  const {
    student,
    loginWithMinistryId,
    loading,
    error,
    setError,
    isConfigured,
  } = useStudent()
  const [ministryId, setMinistryId] = useState('')
  const navigate = useNavigate()

  if (student) {
    return <Navigate to="/student" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const result = await loginWithMinistryId(ministryId)
    if (result) {
      navigate('/student', { replace: true })
    }
  }

  return (
    <div className="shell auth-shell">
      <ConfigBanner configured={isConfigured} />
      <div className="auth-panel">
        <BrandMark />
        <h1 className="panel-title">دخول الطالب</h1>
        <p className="panel-sub">أدخل رقمك الوزاري للبدء</p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>الرقم الوزاري</span>
            <input
              value={ministryId}
              onChange={(e) => setMinistryId(e.target.value)}
              placeholder="مثال: 1234567890"
              inputMode="numeric"
              dir="ltr"
              autoComplete="off"
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'جارٍ التحقق…' : 'دخول'}
          </button>
        </form>

        <ul className="hint-list">
          <li>
            رقم غير موجود → «لا يوجد اسم مطابق للرقم، تواصل مع المعلم»
          </li>
          <li>
            قبل رفع الأسئلة → «لم يبدأ الاختبار، انتظر تعليمات المعلم»
          </li>
          <li>مغادرة المتصفح تقفل الاختبار حتى يسمح المعلم</li>
        </ul>

        <Link className="back-link" to="/">
          العودة لاختيار الدور
        </Link>
      </div>
    </div>
  )
}
