# The Orrery / المرصد

A bilingual Socratic physics bench for one teacher and a class. Emad Abu Houjaila saves a lesson PDF. Students discuss only that lesson. The tutor asks questions and never gives the answer, the final result, or a ready equation.

No API key. The no-answer rule is enforced in `lib/guard.js`, not only in wording.

## Run

```bash
npm install
npm start
```

Open http://localhost:3000

1. Choose **Teacher / معلم**, drop a PDF, set a title, and save. Saving again replaces the active lesson.
2. Choose **Student / طالب** and talk. Asking for the answer gets a refusal and a smaller question.
3. Switch **العربية / English**. Arabic is right-to-left.

The saved lesson (title and extracted text) stays on disk in `data/lesson.json`, so a refresh keeps it.

Try the sample sheets in `samples/` after you run `npm run verify` once. A PDF with a text layer is read directly. A scanned, image-only PDF is read on this machine with Poppler and Tesseract (`poppler-utils`, `tesseract-ocr`, `tesseract-ocr-eng`, `tesseract-ocr-ara`). That path does not need an API key.

UI fonts are Noto Kufi Arabic and Liberation Sans (SIL Open Font License).

## Check

```bash
npm run verify
```
