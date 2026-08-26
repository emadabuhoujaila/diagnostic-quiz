import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { LocalKeys, localGet, localSet, localRemove, uid } from '../lib/localDb'

const AuthContext = createContext(null)

function loadDemoSession() {
  return localGet(LocalKeys.DEMO_SESSION, null)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [demoMode, setDemoMode] = useState(!isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      const demo = loadDemoSession()
      if (demo) {
        setUser(demo)
        setProfile(demo)
      }
      setDemoMode(true)
      setLoading(false)
      return undefined
    }

    setDemoMode(false)
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser && db) {
        try {
          const snap = await getDoc(doc(db, 'teachers', firebaseUser.uid))
          setProfile(snap.exists() ? snap.data() : null)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return unsub
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    const cleanEmail = email.trim()

    if (!isFirebaseConfigured || !auth) {
      const teachers = localGet(LocalKeys.TEACHERS, [])
      const found = teachers.find(
        (t) => t.email === cleanEmail && t.password === password,
      )
      if (!found) {
        const msg = 'الإيميل أو كلمة السر غير صحيحة (وضع تجريبي)'
        setError(msg)
        throw new Error(msg)
      }
      const session = {
        uid: found.id,
        email: found.email,
        displayName: found.displayName,
        isDemo: true,
      }
      localSet(LocalKeys.DEMO_SESSION, session)
      setUser(session)
      setProfile(found)
      return session
    }

    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password)
    return cred.user
  }, [])

  const register = useCallback(async (email, password, displayName) => {
    setError(null)
    const cleanEmail = email.trim()

    if (!isFirebaseConfigured || !auth || !db) {
      const teachers = localGet(LocalKeys.TEACHERS, [])
      if (teachers.some((t) => t.email === cleanEmail)) {
        const msg = 'هذا الإيميل مسجّل مسبقاً'
        setError(msg)
        throw new Error(msg)
      }
      const teacher = {
        id: uid('tch'),
        email: cleanEmail,
        password,
        displayName: displayName || '',
        role: 'teacher',
        createdAt: Date.now(),
      }
      teachers.push(teacher)
      localSet(LocalKeys.TEACHERS, teachers)
      const session = {
        uid: teacher.id,
        email: teacher.email,
        displayName: teacher.displayName,
        isDemo: true,
      }
      localSet(LocalKeys.DEMO_SESSION, session)
      setUser(session)
      setProfile(teacher)
      return session
    }

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    await setDoc(doc(db, 'teachers', cred.user.uid), {
      email: cleanEmail,
      displayName: displayName || '',
      createdAt: serverTimestamp(),
      role: 'teacher',
    })
    return cred.user
  }, [])

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && auth) await signOut(auth)
    localRemove(LocalKeys.DEMO_SESSION)
    setUser(null)
    setProfile(null)
  }, [])

  const teacherId = user?.uid || null

  const value = useMemo(
    () => ({
      user,
      profile,
      teacherId,
      loading,
      error,
      setError,
      login,
      register,
      logout,
      isConfigured: isFirebaseConfigured,
      demoMode,
    }),
    [
      user,
      profile,
      teacherId,
      loading,
      error,
      login,
      register,
      logout,
      demoMode,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
