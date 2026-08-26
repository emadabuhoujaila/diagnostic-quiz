import { chromium } from 'playwright'
import path from 'path'
import { pathToFileURL } from 'url'

const BASE = 'http://127.0.0.1:5173'
const OUT = '/opt/cursor/artifacts/screenshots'
import { mkdirSync } from 'fs'
mkdirSync(OUT, { recursive: true })

const results = []
function ok(name, detail = '') {
  results.push({ name, pass: true, detail })
  console.log('PASS:', name, detail)
}
function fail(name, detail = '') {
  results.push({ name, pass: false, detail })
  console.error('FAIL:', name, detail)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: 'ar', viewport: { width: 1280, height: 900 } })
const page = await context.newPage()

try {
  // clear storage
  await page.goto(BASE)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
  await page.waitForSelector('text=تشخيص فيزياء')
  await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true })
  ok('home brand visible')

  // unknown student
  await page.click('text=دخول الطالب')
  await page.fill('input[inputmode="numeric"]', '999')
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=لا يوجد اسم مطابق للرقم')
  await page.screenshot({ path: `${OUT}/02-unknown-student.png` })
  ok('unknown ministry id error')

  // teacher register
  await page.goto(`${BASE}/teacher/login`)
  await page.click('text=إنشاء حساب')
  await page.fill('input[autocomplete="name"]', 'معلم تجريبي')
  await page.fill('input[type="email"]', 'demo@school.test')
  await page.fill('input[type="password"]', 'demo1234')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/teacher')
  await page.waitForSelector('text=لوحة المعلم')
  await page.screenshot({ path: `${OUT}/03-teacher-dashboard.png`, fullPage: true })
  ok('teacher register + dashboard')

  // upload excel
  await page.click('text=رفع Excel')
  await page.waitForURL('**/teacher/students')
  await page.setInputFiles('input[type="file"]', '/tmp/sample-students.xlsx')
  await page.waitForSelector('text=تم استيراد', { timeout: 15000 })
  await page.waitForSelector('text=أحمد محمد')
  await page.screenshot({ path: `${OUT}/04-students.png`, fullPage: true })
  ok('excel students import')

  // exam builder
  await page.goto(`${BASE}/teacher/exam`)
  await page.waitForSelector('text=رفع أسئلة الاختبار')
  await page.setInputFiles('input[type="file"][accept="application/pdf"]', '/tmp/sample-exam.pdf')
  await page.waitForSelector('text=تم تحويل', { timeout: 30000 })
  await page.click('text=+ اختيار من متعدد')
  await page.fill('input[placeholder="اختياري إن كان السؤال واضحاً في صورة الصفحة"]', 'ما وحدة القوة؟')
  const optionInputs = page.locator('.opt-edit input[placeholder="نص الخيار"]')
  await optionInputs.nth(0).fill('نيوتن')
  await optionInputs.nth(1).fill('جول')
  await optionInputs.nth(2).fill('واط')
  await optionInputs.nth(3).fill('باسكال')
  await page.click('text=نشر الاختبار')
  await page.waitForSelector('text=تم نشر الاختبار')
  await page.screenshot({ path: `${OUT}/05-exam-published.png`, fullPage: true })
  ok('pdf upload + publish exam')

  // student login valid
  await page.goto(`${BASE}/student/login`)
  await page.evaluate(() => sessionStorage.clear())
  await page.reload()
  await page.fill('input[inputmode="numeric"]', '1002003001')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/student')
  await page.waitForSelector('text=بدء الاختبار')
  await page.screenshot({ path: `${OUT}/06-student-ready.png`, fullPage: true })
  ok('student can start after publish')

  await page.click('text=بدء الاختبار')
  await page.waitForURL('**/student/exam')
  await page.waitForSelector('text=ما وحدة القوة؟')
  await page.click('text=نيوتن')
  await page.click('text=تسليم الاختبار')
  await page.waitForSelector('text=تم تسليم الاختبار')
  await page.screenshot({ path: `${OUT}/07-submitted.png`, fullPage: true })
  ok('student submit exam')

  // lock behavior: new session with second student
  await page.goto(`${BASE}/student/login`)
  await page.evaluate(() => sessionStorage.clear())
  await page.reload()
  await page.fill('input[inputmode="numeric"]', '1002003002')
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=بدء الاختبار')
  await page.click('text=بدء الاختبار')
  await page.waitForURL('**/student/exam')
  await page.waitForSelector('.exam-answer-panel, .exam-shell')

  // مغادرة حقيقية للصفحة تشغّل pagehide وتقفل الجلسة
  await page.goto('about:blank')
  await page.waitForTimeout(500)

  // تحقق من حالة القفل عبر لوحة المعلم
  await page.goto(`${BASE}/teacher/sessions`)
  await page.waitForSelector('text=إدارة الجلسات')
  await page.waitForSelector('text=مقفل', { timeout: 10000 })
  await page.screenshot({ path: `${OUT}/08-locked-session.png`, fullPage: true })
  ok('session locks when student leaves page')

  const unlockBtn = page.locator('button', { hasText: 'فتح القفل' }).first()
  if (await unlockBtn.count()) {
    await unlockBtn.click()
    await page.waitForSelector('text=تم فتح القفل')
    ok('teacher unlock')
  } else {
    fail('teacher unlock', 'no unlock button visible')
  }
  await page.screenshot({ path: `${OUT}/09-sessions.png`, fullPage: true })

  await page.goto(`${BASE}/teacher/results`)
  await page.waitForSelector('text=النتائج التشخيصية')
  await page.waitForSelector('text=أحمد محمد')
  await page.screenshot({ path: `${OUT}/10-results.png`, fullPage: true })
  ok('results page shows submitted student')
} catch (err) {
  fail('uncaught', err.stack || String(err))
  await page.screenshot({ path: `${OUT}/error.png`, fullPage: true }).catch(() => {})
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.pass)
console.log('\nSUMMARY', results.length - failed.length, '/', results.length, 'passed')
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2))
  process.exit(1)
}
