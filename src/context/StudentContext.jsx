import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { SESSION_STATUS } from '../lib/constants'

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

    // وضع تجريبي بدون Firebase: لا يوجد طلاب حقيقيون
    if (!isFirebaseConfigured || !db) {
      setLoading(false)
      setError(
        'لم يتم ربط Firebase بعد. بعد الربط سيُتحقق من الرقم الوزاري في قاعدة البيانات.',
      )
      return null
    }

    try {
      const q = query(
        collection(db, 'students'),
        where('ministryId', '==', id),
        limit(1),
      )
      const snap = await getDocs(q)

      if (snap.empty) {
        setError('لا يوجد اسم مطابق للرقم، تواصل مع المعلم')
        setLoading(false)
        return null
      }

      const docSnap = snap.docs[0]
      const data = { id: docSnap.id, ...docSnap.data() }

      // التحقق من حالة الاختبار للصف
      const examSnap = await getDocs(
        query(
          collection(db, 'exams'),
          where('gradeId', '==', data.gradeId),
          where('published', '==', true),
          limit(1),
        ),
      )

      let nextStatus = SESSION_STATUS.WAITING
      let message = 'لم يبدأ الاختبار، انتظر تعليمات المعلم'

      if (!examSnap.empty) {
        const exam = { id: examSnap.docs[0].id, ...examSnap.docs[0].data() }
        data.examId = exam.id
        data.examTitle = exam.title || 'اختبار تشخيصي'

        // جلسة الطالب إن وُجدت
        const sessionQuery = query(
          collection(db, 'sessions'),
          where('ministryId', '==', id),
          where('examId', '==', exam.id),
          limit(1),
        )
        const sessionSnap = await getDocs(sessionQuery)

        if (!sessionSnap.empty) {
          const session = sessionSnap.docs[0].data()
          if (session.status === SESSION_STATUS.LOCKED) {
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
        } else {
          nextStatus = SESSION_STATUS.IN_PROGRESS
          message = null
        }
      }

      const sessionPayload = {
        ...data,
        sessionStatus: nextStatus,
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
      logout,
      isConfigured: isFirebaseConfigured,
    }),
    [student, statusMessage, loading, error, loginWithMinistryId, logout],
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
