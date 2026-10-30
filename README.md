# The Orrery / المرصد

A bilingual Socratic physics bench for one teacher and a class. Emad Abu Houjaila saves a lesson PDF. Students discuss only that lesson. The tutor asks questions and never gives the answer, the final result, or a ready equation.

The no-answer rule is enforced in `lib/guard.js` after every reply, including a model reply. Set `GEMINI_API_KEY` or `GOOGLE_API_KEY` to use Gemini (`gemini-3.8-flash`) for a deeper question that can discuss an attached image and then return to the lesson. With neither key set, the page still runs and waits for one. The key is never written into the code.

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
