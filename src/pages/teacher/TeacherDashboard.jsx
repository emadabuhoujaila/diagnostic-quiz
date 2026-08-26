import { Link } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'
import { GRADES, QUESTION_TYPE_LABELS } from '../../lib/constants'

const TOOLS = [
  {
    id: 'students',
    title: 'إضافة الطلاب',
    desc: 'رفع ملف Excel منظم حسب الصفوف والشعب والأرقام الوزارية',
    to: '/teacher/students',
    cta: 'رفع Excel',
  },
  {
    id: 'exam',
    title: 'رفع أسئلة الاختبار',
    desc: 'رفع ملف PDF وتحويل صفحاته إلى اختبار إلكتروني بجميع أنواع الأسئلة',
    to: '/teacher/exam',
    cta: 'رفع PDF',
  },
  {
    id: 'sessions',
    title: 'إدارة الجلسات',
    desc: 'فتح القفل وإعادة السماح بالمحاولة للطلاب',
    to: '/teacher/sessions',
    cta: 'إدارة',
  },
  {
    id: 'results',
    title: 'النتائج التشخيصية',
    desc: 'تقارير الأداء لكل صف وشُعبة',
    to: '/teacher/results',
    cta: 'عرض النتائج',
  },
]

export default function TeacherDashboard() {
  const { user, profile, logout, isConfigured, demoMode } = useAuth()
  const name =
    profile?.displayName || user?.displayName || user?.email || 'المعلم'

  return (
    <div className="shell dash-shell">
      <ConfigBanner configured={isConfigured} demoMode={demoMode} />
      <header className="dash-header">
        <BrandMark />
        <div className="dash-user">
          <span className="dash-name">{name}</span>
          <button type="button" className="btn-ghost" onClick={logout}>
            خروج
          </button>
        </div>
      </header>

      <main className="dash-main">
        <section className="dash-intro">
          <h1>لوحة المعلم</h1>
          <p>
            اختبار واحد لكل صف · أنواع الأسئلة:{' '}
            {Object.values(QUESTION_TYPE_LABELS).join('، ')}
          </p>
        </section>

        <section className="grades-row" aria-label="الصفوف">
          {GRADES.map((g) => (
            <div key={g.id} className="grade-chip">
              <strong>{g.label}</strong>
              <span>اختبار واحد</span>
            </div>
          ))}
        </section>

        <section className="tools-grid" aria-label="أدوات المعلم">
          {TOOLS.map((item) => (
            <article key={item.id} className="tool-tile">
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
              <Link className="btn-secondary" to={item.to}>
                {item.cta}
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
