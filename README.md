# تشخيص فيزياء

منصة اختبارات تشخيصية لمادة الفيزياء (React + Vite + Firebase).

## القرارات المعتمدة

| البند | القرار |
|--------|--------|
| أنواع الأسئلة | اختيار من متعدد، صح/خطأ، إجابة قصيرة، مطابقة، ترتيب |
| المعلمون | عدة معلمين (Firebase Auth: إيميل + كلمة سر) |
| الاختبارات | اختبار واحد لكل صف |
| الطالب | دخول بالرقم الوزاري فقط |
| التقنية | React + Vite |

## الخطوة الحالية: 1 — الأساس والدخول

- صفحة اختيار الدور (معلم / طالب)
- دخول المعلم (تسجيل + إنشاء حساب)
- دخول الطالب بالرقم الوزاري (مع رسائل الخطأ المتفق عليها)
- لوحة معلم هيكل جاهز للخطوات التالية
- قالب إعدادات Firebase بدون مفاتيح حقيقية

## الربط بـ Firebase لاحقاً

1. أنشئ مشروعاً في [Firebase Console](https://console.firebase.google.com)
2. فعّل **Authentication → Email/Password**
3. أنشئ **Firestore** و **Storage**
4. انسخ `.env.example` إلى `.env.local` واملأ القيم من إعدادات المشروع
5. أعد تشغيل `npm run dev`

### هيكل البيانات المقترح (Firestore)

```
teachers/{uid}
  email, displayName, createdAt, role

students/{autoId}
  ministryId, name, gradeId, section, teacherId, createdAt

exams/{autoId}
  gradeId, title, published, pdfUrl, pages[], questions[], teacherId, updatedAt
  # اختبار واحد لكل gradeId

sessions/{autoId}
  ministryId, examId, status, answers, lockedAt, attemptCount
  # status: waiting | in_progress | locked | submitted | allowed_retry
```

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # ثم املأ المفاتيح
npm run dev
```

```bash
npm run build
```

## خارطة الطريق

1. **الآن** — الهيكل + الدخول
2. رفع طلاب Excel
3. رفع PDF وتحويله لاختبار
4. واجهة أداء الاختبار للطالب
5. قفل الجلسة عند مغادرة المتصفح + صلاحيات المعلم
6. النتائج التشخيصية + النشر على Firebase Hosting عبر GitHub
