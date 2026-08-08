# PCM Mock Arena — Text-Only Questions + Free Screenshot OCR

## What changed

- Public questions no longer display the original screenshot.
- Questions are shown as extracted text + A/B/C/D options.
- Admin can upload a screenshot directly in the website.
- The browser uses Tesseract.js OCR to extract text without a paid API.
- The extracted question is placed into the editor for verification.
- Admin selects the correct answer and saves it to Firebase.
- Firebase provides live shared question data.
- The five supplied Chemistry questions are included as starter data.

## Important AI/OCR note

This uses free browser-side OCR, not a paid AI API. OCR can make mistakes, especially with equations, subscripts, superscripts, tables and chemistry notation. Always check the extracted question/options and correct answer before publishing.

For higher-quality AI extraction later, you can connect a server-side vision model/API. Do not put a secret API key directly in GitHub Pages frontend code.

## Manual question workflow

1. Login as Admin.
2. Click New question.
3. Choose subject.
4. Upload the screenshot in "Free AI/OCR Question Import".
5. Click "Extract text from screenshot".
6. Check the generated question text and A/B/C/D.
7. Select the correct option.
8. Add/edit explanation.
9. Click Save question.

The public page displays only the text and options, not the uploaded screenshot.

## GitHub Pages

Upload `index.html`, `style.css`, `app.js`, and `starter_questions.js` to the repository root. Enable GitHub Pages from Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

## Firebase

GitHub Pages is static hosting. Firebase Realtime Database provides shared live questions.

In `index.html`, replace the placeholder Firebase config with your Firebase Web App config.

Enable Firebase Authentication → Email/Password and create your admin user.

Realtime Database rules can start as:

```json
{
  "rules": {
    "questions": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

For production, restrict writes to your specific admin UID.

## Five starter questions

The `starter_questions.js` file contains the five text-only Chemistry questions created from the supplied screenshots. After Firebase is configured and you are logged in, Admin → "Add 5 starter questions" inserts them into the database.

## No image storage is needed for the public question

The uploaded screenshot is processed in the browser and the extracted text is put into the question form. The image itself is not stored in the public question record.
