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

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return undefined
    }

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
    if (!isFirebaseConfigured || !auth) {
      const msg = 'لم يتم ربط Firebase بعد. أضف المفاتيح في .env.local'
      setError(msg)
      throw new Error(msg)
    }
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    return cred.user
  }, [])

  const register = useCallback(async (email, password, displayName) => {
    setError(null)
    if (!isFirebaseConfigured || !auth || !db) {
      const msg = 'لم يتم ربط Firebase بعد. أضف المفاتيح في .env.local'
      setError(msg)
      throw new Error(msg)
    }
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    await setDoc(doc(db, 'teachers', cred.user.uid), {
      email: email.trim(),
      displayName: displayName || '',
      createdAt: serverTimestamp(),
      role: 'teacher',
    })
    return cred.user
  }, [])

  const logout = useCallback(async () => {
    if (auth) await signOut(auth)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      setError,
      login,
      register,
      logout,
      isConfigured: isFirebaseConfigured,
    }),
    [user, profile, loading, error, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
