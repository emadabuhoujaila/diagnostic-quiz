import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  limit,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import { LocalKeys, localGet, localSet, uid } from './localDb'

GlobalWorkerOptions.workerSrc = pdfWorker

const MAX_PAGES = 30
const RENDER_SCALE = 1.5

/**
 * يحوّل صفحات PDF إلى صور dataURL
 */
export async function pdfFileToPageImages(file, onProgress) {
  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: buffer }).promise
  const total = Math.min(pdf.numPages, MAX_PAGES)
  const pages = []

  for (let i = 1; i <= total; i += 1) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: RENDER_SCALE })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: ctx, viewport }).promise
    pages.push({
      pageNumber: i,
      imageDataUrl: canvas.toDataURL('image/jpeg', 0.82),
    })
    onProgress?.(i, total)
  }

  return pages
}

export function createEmptyQuestion(type, pageNumber = 1) {
  const base = {
    id: uid('q'),
    type,
    prompt: '',
    pageNumber,
    points: 1,
  }
  switch (type) {
    case 'multiple_choice':
      return {
        ...base,
        options: ['أ', 'ب', 'ج', 'د'].map((label, i) => ({
          id: `o${i}`,
          label,
          text: '',
        })),
        correctAnswer: 'o0',
      }
    case 'true_false':
      return { ...base, correctAnswer: 'true' }
    case 'short_answer':
      return { ...base, correctAnswer: '', acceptedAnswers: [] }
    case 'matching':
      return {
        ...base,
        left: [
          { id: 'l0', text: '' },
          { id: 'l1', text: '' },
        ],
        right: [
          { id: 'r0', text: '' },
          { id: 'r1', text: '' },
        ],
        correctAnswer: { l0: 'r0', l1: 'r1' },
      }
    case 'ordering':
      return {
        ...base,
        items: [
          { id: 'i0', text: '' },
          { id: 'i1', text: '' },
          { id: 'i2', text: '' },
        ],
        correctAnswer: ['i0', 'i1', 'i2'],
      }
    default:
      return base
  }
}

export async function getExamByGrade(gradeId) {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'exams'),
      where('gradeId', '==', gradeId),
      where('published', '==', true),
      limit(1),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  }

  const exams = localGet(LocalKeys.EXAMS, [])
  return (
    exams.find((e) => e.gradeId === gradeId && e.published) ||
    exams.find((e) => e.gradeId === gradeId) ||
    null
  )
}

export async function listExamsForTeacher(teacherId) {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'exams'), where('teacherId', '==', teacherId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  return localGet(LocalKeys.EXAMS, []).filter((e) => e.teacherId === teacherId)
}

export async function saveExam(exam) {
  const payload = {
    ...exam,
    id: exam.id || uid('exam'),
    updatedAt: Date.now(),
  }

  if (isFirebaseConfigured && db) {
    const ref = doc(db, 'exams', payload.id)
    await setDoc(ref, payload, { merge: true })
    return payload
  }

  const exams = localGet(LocalKeys.EXAMS, [])
  // اختبار واحد لكل صف: استبدل أي اختبار سابق لنفس الصف
  const filtered = exams.filter(
    (e) => !(e.gradeId === payload.gradeId && e.teacherId === payload.teacherId),
  )
  filtered.push(payload)
  localSet(LocalKeys.EXAMS, filtered)
  return payload
}

export async function getExamById(examId) {
  if (!examId) return null
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, 'exams', examId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  }
  return localGet(LocalKeys.EXAMS, []).find((e) => e.id === examId) || null
}
