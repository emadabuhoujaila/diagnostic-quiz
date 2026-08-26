import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'

export default function TeacherLogin() {
  const {
    user,
    login,
    register,
    loading,
    error,
    setError,
    isConfigured,
    demoMode,
  } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  if (!loading && user) {
    return <Navigate to="/teacher" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLocalError(null)
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!displayName.trim()) {
          throw new Error('أدخل اسم المعلم')
        }
        await register(email, password, displayName.trim())
      }
      navigate('/teacher', { replace: true })
    } catch (err) {
      const code = err?.code
      let msg = err?.message || 'تعذر تسجيل الدخول'
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        msg = 'الإيميل أو كلمة السر غير صحيحة'
      } else if (code === 'auth/email-already-in-use') {
        msg = 'هذا الإيميل مسجّل مسبقاً'
      } else if (code === 'auth/weak-password') {
        msg = 'كلمة السر يجب أن تكون 6 أحرف على الأقل'
      } else if (code === 'auth/invalid-email') {
        msg = 'صيغة الإيميل غير صحيحة'
      }
      setLocalError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shell auth-shell">
      <ConfigBanner configured={isConfigured} demoMode={demoMode} />
      <div className="auth-panel">
        <BrandMark />
        <h1 className="panel-title">دخول المعلم</h1>
        <p className="panel-sub">
          إيميل وكلمة سر — يدعم عدة معلمين
          {demoMode ? ' (تجريبي محلي)' : ''}
        </p>

        <div className="mode-toggle" role="tablist">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            إنشاء حساب
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="field">
              <span>اسم المعلم</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="مثال: أ. أحمد"
                autoComplete="name"
                required
              />
            </label>
          )}
          <label className="field">
            <span>الإيميل</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.edu"
              autoComplete="email"
              dir="ltr"
              required
            />
          </label>
          <label className="field">
            <span>كلمة السر</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              dir="ltr"
              required
              minLength={6}
            />
          </label>

          {(localError || error) && (
            <p className="form-error" role="alert">
              {localError || error}
            </p>
          )}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting
              ? 'جارٍ…'
              : mode === 'login'
                ? 'دخول'
                : 'إنشاء الحساب'}
          </button>
        </form>

        <Link className="back-link" to="/">
          العودة لاختيار الدور
        </Link>
      </div>
    </div>
  )
}
