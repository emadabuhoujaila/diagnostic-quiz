import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  limit,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import { SESSION_STATUS } from './constants'
import { LocalKeys, localGet, localSet, uid } from './localDb'

function sessionKey(ministryId, examId) {
  return `${ministryId}__${examId}`
}

async function findSessionDoc(ministryId, examId) {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'sessions'),
      where('ministryId', '==', ministryId),
      where('examId', '==', examId),
      limit(1),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  }

  const sessions = localGet(LocalKeys.SESSIONS, [])
  return (
    sessions.find(
      (s) => s.ministryId === ministryId && s.examId === examId,
    ) || null
  )
}

async function writeSession(session) {
  if (isFirebaseConfigured && db) {
    const id = session.id || uid('ses')
    await setDoc(doc(db, 'sessions', id), { ...session, id }, { merge: true })
    return { ...session, id }
  }

  const sessions = localGet(LocalKeys.SESSIONS, [])
  const idx = sessions.findIndex(
    (s) => s.ministryId === session.ministryId && s.examId === session.examId,
  )
  const next = { ...session, id: session.id || uid('ses'), updatedAt: Date.now() }
  if (idx >= 0) sessions[idx] = next
  else sessions.push(next)
  localSet(LocalKeys.SESSIONS, sessions)
  return next
}

export async function getOrCreateSession({ ministryId, examId, studentName, gradeId, section }) {
  const existing = await findSessionDoc(ministryId, examId)
  if (existing) return existing

  return writeSession({
    ministryId,
    examId,
    studentName,
    gradeId,
    section,
    status: SESSION_STATUS.IN_PROGRESS,
    answers: {},
    attemptCount: 1,
    lockedAt: null,
    startedAt: Date.now(),
    key: sessionKey(ministryId, examId),
  })
}

export async function lockSession(ministryId, examId, reason = 'left_browser') {
  const session = await findSessionDoc(ministryId, examId)
  if (!session) return null
  if (
    session.status === SESSION_STATUS.SUBMITTED ||
    session.status === SESSION_STATUS.LOCKED
  ) {
    return session
  }
  return writeSession({
    ...session,
    status: SESSION_STATUS.LOCKED,
    lockedAt: Date.now(),
    lockReason: reason,
  })
}

export async function unlockSession(ministryId, examId) {
  const session = await findSessionDoc(ministryId, examId)
  if (!session) return null
  return writeSession({
    ...session,
    status: SESSION_STATUS.IN_PROGRESS,
    lockedAt: null,
    lockReason: null,
  })
}

export async function allowRetry(ministryId, examId) {
  const session = await findSessionDoc(ministryId, examId)
  if (!session) return null
  return writeSession({
    ...session,
    status: SESSION_STATUS.ALLOWED_RETRY,
    answers: {},
    attemptCount: (session.attemptCount || 1) + 1,
    lockedAt: null,
    submittedAt: null,
  })
}

export async function saveAnswers(ministryId, examId, answers) {
  const session = await findSessionDoc(ministryId, examId)
  if (!session) return null
  if (session.status === SESSION_STATUS.LOCKED) return session
  return writeSession({
    ...session,
    answers,
    status:
      session.status === SESSION_STATUS.ALLOWED_RETRY
        ? SESSION_STATUS.IN_PROGRESS
        : session.status || SESSION_STATUS.IN_PROGRESS,
  })
}

export async function submitSession(ministryId, examId, answers, score) {
  const session = await findSessionDoc(ministryId, examId)
  if (!session) return null
  return writeSession({
    ...session,
    answers,
    score,
    status: SESSION_STATUS.SUBMITTED,
    submittedAt: Date.now(),
  })
}

export async function listSessionsForTeacher(teacherExamIds = []) {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'sessions'))
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    if (!teacherExamIds.length) return all
    return all.filter((s) => teacherExamIds.includes(s.examId))
  }
  const sessions = localGet(LocalKeys.SESSIONS, [])
  if (!teacherExamIds.length) return sessions
  return sessions.filter((s) => teacherExamIds.includes(s.examId))
}

export async function getSession(ministryId, examId) {
  return findSessionDoc(ministryId, examId)
}
