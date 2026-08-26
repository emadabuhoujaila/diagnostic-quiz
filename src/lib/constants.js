/** الصفوف الدراسية المدعومة — اختبار واحد لكل صف */
export const GRADES = [
  { id: '10', label: 'الصف العاشر' },
  { id: '11', label: 'الصف الحادي عشر' },
  { id: '12', label: 'الصف الثاني عشر' },
]

/** أنواع الأسئلة المدعومة في المنصة */
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
  MATCHING: 'matching',
  ORDERING: 'ordering',
}

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'اختيار من متعدد',
  [QUESTION_TYPES.TRUE_FALSE]: 'صح / خطأ',
  [QUESTION_TYPES.SHORT_ANSWER]: 'إجابة قصيرة',
  [QUESTION_TYPES.MATCHING]: 'مطابقة',
  [QUESTION_TYPES.ORDERING]: 'ترتيب',
}

/** حالات جلسة الطالب في الاختبار */
export const SESSION_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  LOCKED: 'locked',
  SUBMITTED: 'submitted',
  ALLOWED_RETRY: 'allowed_retry',
}

export const PLATFORM_NAME = 'تشخيص فيزياء'
export const PLATFORM_TAGLINE = 'منصة الاختبارات التشخيصية لمادة الفيزياء'
