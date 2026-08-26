import { QUESTION_TYPES } from './constants'

function normalizeText(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function gradeAnswer(question, answer) {
  if (answer == null || answer === '') return { correct: false, points: 0 }

  switch (question.type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    case QUESTION_TYPES.TRUE_FALSE:
      return {
        correct: String(answer) === String(question.correctAnswer),
        points:
          String(answer) === String(question.correctAnswer)
            ? question.points || 1
            : 0,
      }
    case QUESTION_TYPES.SHORT_ANSWER: {
      const accepted = [
        question.correctAnswer,
        ...(question.acceptedAnswers || []),
      ].map(normalizeText)
      const ok = accepted.includes(normalizeText(answer))
      return { correct: ok, points: ok ? question.points || 1 : 0 }
    }
    case QUESTION_TYPES.MATCHING: {
      const correct = question.correctAnswer || {}
      const keys = Object.keys(correct)
      if (!keys.length || typeof answer !== 'object') {
        return { correct: false, points: 0 }
      }
      const ok = keys.every((k) => String(answer[k]) === String(correct[k]))
      return { correct: ok, points: ok ? question.points || 1 : 0 }
    }
    case QUESTION_TYPES.ORDERING: {
      const correct = question.correctAnswer || []
      if (!Array.isArray(answer) || answer.length !== correct.length) {
        return { correct: false, points: 0 }
      }
      const ok = correct.every((id, i) => id === answer[i])
      return { correct: ok, points: ok ? question.points || 1 : 0 }
    }
    default:
      return { correct: false, points: 0 }
  }
}

export function gradeExam(questions, answers) {
  let earned = 0
  let total = 0
  const details = []

  for (const q of questions || []) {
    const pts = q.points || 1
    total += pts
    const result = gradeAnswer(q, answers?.[q.id])
    earned += result.points
    details.push({ questionId: q.id, ...result })
  }

  return {
    earned,
    total,
    percent: total ? Math.round((earned / total) * 100) : 0,
    details,
  }
}
