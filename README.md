# The Orrery / المرصد

A bilingual Socratic physics bench for one teacher and a class. Emad Abu Houjaila adds lesson PDFs. A student picks one lesson, and the talk stays inside it. The tutor asks questions and never gives the answer, the final result, or a ready equation.

The no-answer rule is enforced in `lib/guard.js` after every reply, including a model reply. Set `GEMINI_API_KEY` or `GOOGLE_API_KEY` to use Gemini (`gemini-3.8-flash`) for a deeper question that can discuss an attached image and then return to the lesson. With neither key set, the page still runs and waits for one. The key is never written into the code.

## Run

```bash
npm install
npm start
```

Open http://localhost:3000

1. Choose **Teacher / معلم** and enter the teacher password. The student bench stays open.
2. Drop a PDF, set a title, and choose **Add lesson / إضافة درس**. Each save is kept.
3. Choose **Student / طالب**, pick a lesson, and talk. Asking for the answer gets a refusal and a smaller question.
4. Switch **العربية / English**. Arabic is right-to-left.

Saved lessons stay in `data/lessons/`. A refresh keeps the list, and the student returns to the lesson they picked. On Cloud Run that disk does not survive, so `deploy.cmd` stores each lesson in Cloud Storage (`LESSON_BUCKET`, under `lessons/`). An older single `lesson.json` is copied into that list the first time the catalog is empty, and the original object is left in place. `deploy.cmd` asks for `GEMINI_API_KEY` and the teacher password, stores both in Secret Manager, and sets them on Cloud Run. Neither value is written into this repo.

## Cloud Run

The Google account needs billing on project `orrery-tutor`. After `gcloud auth login`, paste this into Windows cmd:

```bat
git clone -b cursor/socratic-physics-tutor-250d https://github.com/emadabuhoujaila/diagnostic-quiz.git
cd diagnostic-quiz
deploy.cmd
```

The script asks for the Gemini key and the teacher password, then sets both on Cloud Run. The service runs in `me-central1` (Doha). If Cloud Run does not list that region, it uses `europe-west1`. The image is built in the service region, and the build logs stay in that region. If that build fails, the script builds in `europe-west1` and deploys that image. It prints the student URL when the deploy finishes.

Try the sample sheets in `samples/` after you run `npm run verify` once. A PDF with a text layer is read directly. A scanned, image-only PDF is read on this machine with Poppler and Tesseract (`poppler-utils`, `tesseract-ocr`, `tesseract-ocr-eng`, `tesseract-ocr-ara`). That path does not need an API key.

UI fonts are Noto Kufi Arabic and Liberation Sans (SIL Open Font License).

## Check

```bash
npm run verify
```
