import * as XLSX from 'xlsx'
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import { GRADES } from './constants'
import { LocalKeys, localGet, localSet, uid } from './localDb'

const HEADER_MAP = [
  { keys: ['الرقم الوزاري', 'رقم وزاري', 'ministryid', 'ministry_id', 'id'], field: 'ministryId' },
  { keys: ['الاسم', 'اسم الطالب', 'name', 'student_name'], field: 'name' },
  { keys: ['الصف', 'صف', 'grade', 'gradeid', 'class'], field: 'gradeRaw' },
  { keys: ['الشعبة', 'شعبة', 'section', 'class_section'], field: 'section' },
]

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function mapHeaders(row) {
  const mapped = {}
  for (const [header, value] of Object.entries(row)) {
    const n = normalizeHeader(header)
    for (const rule of HEADER_MAP) {
      if (rule.keys.some((k) => normalizeHeader(k) === n)) {
        mapped[rule.field] = value
        break
      }
    }
  }
  return mapped
}

function resolveGradeId(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const direct = GRADES.find((g) => g.id === s)
  if (direct) return direct.id
  const byLabel = GRADES.find((g) => g.label.includes(s) || s.includes(g.label))
  if (byLabel) return byLabel.id
  if (s.includes('عاشر') || s === '10') return '10'
  if (s.includes('حادي') || s === '11') return '11'
  if (s.includes('ثاني') || s === '12') return '12'
  return s
}

/**
 * يقرأ ملف Excel ويعيد قائمة طلاب جاهزة للحفظ
 */
export function parseStudentsExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        if (!rows.length) {
          reject(new Error('الملف فارغ'))
          return
        }

        const students = []
        const errors = []
        const seen = new Set()

        rows.forEach((row, i) => {
          const m = mapHeaders(row)
          const ministryId = String(m.ministryId ?? '').trim()
          const name = String(m.name ?? '').trim()
          const gradeId = resolveGradeId(m.gradeRaw)
          const section = String(m.section ?? '').trim()

          if (!ministryId && !name) return

          if (!ministryId || !name || !gradeId) {
            errors.push(`صف ${i + 2}: بيانات ناقصة (رقم/اسم/صف)`)
            return
          }
          if (seen.has(ministryId)) {
            errors.push(`صف ${i + 2}: رقم وزاري مكرر ${ministryId}`)
            return
          }
          seen.add(ministryId)
          students.push({ ministryId, name, gradeId, section })
        })

        if (!students.length) {
          reject(
            new Error(
              'لم يُعثر على طلاب. تأكد من الأعمدة: الرقم الوزاري، الاسم، الصف، الشعبة',
            ),
          )
          return
        }
        resolve({ students, errors })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'))
    reader.readAsArrayBuffer(file)
  })
}

export async function saveStudents(students, teacherId) {
  const stamped = students.map((s) => ({
    ...s,
    teacherId,
    id: uid('stu'),
    createdAt: Date.now(),
  }))

  if (isFirebaseConfigured && db) {
    const batch = writeBatch(db)
    for (const s of stamped) {
      const ref = doc(collection(db, 'students'))
      batch.set(ref, { ...s, id: ref.id })
    }
    await batch.commit()
    return stamped
  }

  const existing = localGet(LocalKeys.STUDENTS, [])
  const withoutDupes = existing.filter(
    (e) => !stamped.some((s) => s.ministryId === e.ministryId),
  )
  const next = [...withoutDupes, ...stamped]
  localSet(LocalKeys.STUDENTS, next)
  return stamped
}

export async function listStudents(teacherId) {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'students'), where('teacherId', '==', teacherId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  return localGet(LocalKeys.STUDENTS, []).filter((s) => s.teacherId === teacherId)
}

export async function findStudentByMinistryId(ministryId) {
  const id = String(ministryId || '').trim()
  if (!id) return null

  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'students'), where('ministryId', '==', id))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() }
  }

  return (
    localGet(LocalKeys.STUDENTS, []).find((s) => s.ministryId === id) || null
  )
}

export function downloadStudentsTemplate() {
  const sample = [
    {
      'الرقم الوزاري': '1234567890',
      الاسم: 'أحمد محمد',
      الصف: '10',
      الشعبة: 'أ',
    },
    {
      'الرقم الوزاري': '1234567891',
      الاسم: 'سارة علي',
      الصف: '11',
      الشعبة: 'ب',
    },
  ]
  const ws = XLSX.utils.json_to_sheet(sample)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'طلاب')
  XLSX.writeFile(wb, 'قالب_طلاب_تشخيص_فيزياء.xlsx')
}
