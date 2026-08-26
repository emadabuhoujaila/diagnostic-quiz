import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark, ConfigBanner } from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'
import {
  downloadStudentsTemplate,
  listStudents,
  parseStudentsExcel,
  saveStudents,
} from '../../lib/studentsApi'
import { GRADES } from '../../lib/constants'

export default function StudentsPage() {
  const { teacherId, isConfigured, demoMode } = useAuth()
  const inputRef = useRef(null)
  const [students, setStudents] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [errors, setErrors] = useState([])

  async function reload() {
    if (!teacherId) return
    const list = await listStudents(teacherId)
    setStudents(list)
  }

  useEffect(() => {
    reload()
  }, [teacherId])

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !teacherId) return
    setBusy(true)
    setMessage(null)
    setErrors([])
    try {
      const { students: parsed, errors: parseErrors } =
        await parseStudentsExcel(file)
      await saveStudents(parsed, teacherId)
      setErrors(parseErrors)
      setMessage(`تم استيراد ${parsed.length} طالباً بنجاح`)
      await reload()
    } catch (err) {
      setMessage(err.message || 'فشل الاستيراد')
    } finally {
      setBusy(false)
    }
  }

  const byGrade = GRADES.map((g) => ({
    ...g,
    count: students.filter((s) => s.gradeId === g.id).length,
  }))

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
          <h1>إضافة الطلاب</h1>
          <p>
            ارفع ملف Excel بالأعمدة: الرقم الوزاري، الاسم، الصف، الشعبة
          </p>
        </section>

        <div className="action-row">
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'جارٍ الرفع…' : 'رفع ملف Excel'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={downloadStudentsTemplate}
          >
            تنزيل القالب
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={onFile}
          />
        </div>

        {message && <p className="banner-ok">{message}</p>}
        {errors.length > 0 && (
          <ul className="banner-warn">
            {errors.slice(0, 8).map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <section className="grades-row">
          {byGrade.map((g) => (
            <div key={g.id} className="grade-chip">
              <strong>{g.label}</strong>
              <span>{g.count} طالب</span>
            </div>
          ))}
        </section>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>الرقم الوزاري</th>
                <th>الاسم</th>
                <th>الصف</th>
                <th>الشعبة</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-cell">
                    لا يوجد طلاب بعد — ارفع ملف Excel
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id || s.ministryId}>
                    <td dir="ltr">{s.ministryId}</td>
                    <td>{s.name}</td>
                    <td>{s.gradeId}</td>
                    <td>{s.section || '—'}</td>
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
