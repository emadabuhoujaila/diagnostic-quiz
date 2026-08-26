import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { findStudentByMinistryId } from '../lib/studentsApi'
import { getExamByGrade } from '../lib/examsApi'
import { getSession, getOrCreateSession } from '../lib/sessionsApi'
import { SESSION_STATUS } from '../lib/constants'
import { isFirebaseConfigured } from '../lib/firebase'

const StudentContext = createContext(null)
const STORAGE_KEY = 'physics_diag_student'

function loadStoredStudent() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(loadStoredStudent)
  const [statusMessage, setStatusMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loginWithMinistryId = useCallback(async (ministryId) => {
    setError(null)
    setStatusMessage(null)
    setLoading(true)

    const id = String(ministryId || '').trim()
    if (!id) {
      setLoading(false)
      setError('أدخل الرقم الوزاري')
      return null
    }

    try {
      const data = await findStudentByMinistryId(id)
      if (!data) {
        setError('لا يوجد اسم مطابق للرقم، تواصل مع المعلم')
        setLoading(false)
        return null
      }

      const exam = await getExamByGrade(data.gradeId)
      let nextStatus = SESSION_STATUS.WAITING
      let message = 'لم يبدأ الاختبار، انتظر تعليمات المعلم'
      let examId = null
      let examTitle = null
      let session = null

      if (exam && exam.published && (exam.questions?.length || exam.pages?.length)) {
        examId = exam.id
        examTitle = exam.title || 'اختبار تشخيصي'
        session = await getSession(id, exam.id)

        if (!session) {
          session = await getOrCreateSession({
            ministryId: id,
            examId: exam.id,
            studentName: data.name,
            gradeId: data.gradeId,
            section: data.section,
          })
          nextStatus = SESSION_STATUS.IN_PROGRESS
          message = null
        } else if (session.status === SESSION_STATUS.LOCKED) {
          nextStatus = SESSION_STATUS.LOCKED
          message = 'تم قفل الاختبار. انتظر حتى يسمح لك المعلم بالدخول'
        } else if (session.status === SESSION_STATUS.SUBMITTED) {
          nextStatus = SESSION_STATUS.SUBMITTED
          message = 'لقد أنهيت هذا الاختبار مسبقاً'
        } else if (
          session.status === SESSION_STATUS.IN_PROGRESS ||
          session.status === SESSION_STATUS.ALLOWED_RETRY
        ) {
          nextStatus = SESSION_STATUS.IN_PROGRESS
          message = null
        }
      }

      const sessionPayload = {
        ...data,
        examId,
        examTitle,
        sessionStatus: nextStatus,
        sessionId: session?.id || null,
      }
      setStudent(sessionPayload)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionPayload))
      setStatusMessage(message)
      setLoading(false)
      return sessionPayload
    } catch (err) {
      console.error(err)
      setError('تعذر التحقق من الرقم. حاول مرة أخرى')
      setLoading(false)
      return null
    }
  }, [])

  const refreshStudentStatus = useCallback(async () => {
    if (!student?.ministryId) return
    await loginWithMinistryId(student.ministryId)
  }, [student, loginWithMinistryId])

  const logout = useCallback(() => {
    setStudent(null)
    setStatusMessage(null)
    setError(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({
      student,
      statusMessage,
      loading,
      error,
      setError,
      loginWithMinistryId,
      refreshStudentStatus,
      logout,
      isConfigured: isFirebaseConfigured,
    }),
    [
      student,
      statusMessage,
      loading,
      error,
      loginWithMinistryId,
      refreshStudentStatus,
      logout,
    ],
  )

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  )
}

export function useStudent() {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent must be used within StudentProvider')
  return ctx
}
