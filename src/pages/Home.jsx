import { Link } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { PLATFORM_NAME, PLATFORM_TAGLINE } from '../lib/constants'

export default function Home() {
  const { isConfigured, demoMode } = useAuth()

  return (
    <div className="shell home-shell">
      <ConfigBanner configured={isConfigured} demoMode={demoMode} />
      <div className="home-bg" aria-hidden="true" />
      <header className="home-top">
        <BrandMark size="lg" />
      </header>

      <main className="home-hero">
        <p className="eyebrow">اختبارات تشخيصية · مادة الفيزياء</p>
        <h1 className="hero-title">{PLATFORM_NAME}</h1>
        <p className="hero-lead">{PLATFORM_TAGLINE}</p>

        <div className="role-actions">
          <Link className="role-btn role-teacher" to="/teacher/login">
            <span className="role-label">دخول المعلم</span>
            <span className="role-hint">إيميل وكلمة سر</span>
          </Link>
          <Link className="role-btn role-student" to="/student/login">
            <span className="role-label">دخول الطالب</span>
            <span className="role-hint">الرقم الوزاري</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
