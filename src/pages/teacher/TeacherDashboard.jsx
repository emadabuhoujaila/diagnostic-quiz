import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'
import { GRADES, QUESTION_TYPE_LABELS } from '../../lib/constants'

const COMING_SOON = [
  {
    id: 'students',
    title: 'إضافة الطلاب',
    desc: 'رفع ملف Excel منظم حسب الصفوف والشعب والأرقام الوزارية',
    step: 'الخطوة 2',
  },
  {
    id: 'exam',
    title: 'رفع أسئلة الاختبار',
    desc: 'رفع ملف PDF وتحويل صفحاته إلى اختبار إلكتروني بجميع أنواع الأسئلة',
    step: 'الخطوة 3',
  },
  {
    id: 'sessions',
    title: 'إدارة الجلسات',
    desc: 'فتح القفل وإعادة السماح بالمحاولة للطلاب',
    step: 'الخطوة 5',
  },
  {
    id: 'results',
    title: 'النتائج التشخيصية',
    desc: 'تقارير الأداء لكل صف وشُعبة',
    step: 'الخطوة 6',
  },
]

export default function TeacherDashboard() {
  const { user, profile, logout, isConfigured } = useAuth()
  const name =
    profile?.displayName || user?.displayName || user?.email || 'المعلم'

  return (
    <div className="shell dash-shell">
      <ConfigBanner configured={isConfigured} />
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

        <section className="tools-grid" aria-label="أدوات قادمة">
          {COMING_SOON.map((item) => (
            <article key={item.id} className="tool-tile">
              <span className="tool-step">{item.step}</span>
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
              <button type="button" className="btn-secondary" disabled>
                قريباً
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
