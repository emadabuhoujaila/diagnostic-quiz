const PREFIX = 'physics_diag_v1_'

function key(name) {
  return `${PREFIX}${name}`
}

export function localGet(name, fallback) {
  try {
    const raw = localStorage.getItem(key(name))
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function localSet(name, value) {
  localStorage.setItem(key(name), JSON.stringify(value))
}

export function localRemove(name) {
  localStorage.removeItem(key(name))
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** قوائم محلية */
export const LocalKeys = {
  TEACHERS: 'teachers',
  DEMO_SESSION: 'demo_teacher_session',
  STUDENTS: 'students',
  EXAMS: 'exams',
  SESSIONS: 'sessions',
}
