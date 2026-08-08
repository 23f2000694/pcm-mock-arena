# PCB Mock Arena — Firebase + OCR + Manual Question Editor

## Features
- Physics, Chemistry, Biology only (Maths removed).
- Public questions are text-first; optional diagrams/images can be attached to a question.
- Selecting an option immediately reveals:
  - Correct/incorrect result
  - Correct answer
  - Solution description (if provided)
- Answer state is intentionally stored only in page memory, so refreshing the page resets answered questions.
- Admin login through Firebase Email/Password.
- Admin can create, edit, and delete every question manually.
- Screenshot OCR is free and browser-side using Tesseract.js.
- OCR never decides the final answer: the admin manually chooses the correct option.
- Optional diagram/question image can be compressed and saved with the question.
- Firebase Realtime Database makes saved questions available to visitors.
- "Hello Uma Bharti" is used on the main banner.
- Progress bar removed.
- UI has animated buttons, question cards, reveal effects and mobile-friendly controls.

## Admin workflow
1. Open Admin.
2. Login with the Firebase Email/Password user.
3. Click New question.
4. Select Physics, Chemistry or Biology.
5. Upload screenshot and click Extract text (optional).
6. Manually correct the question text and all four options.
7. Manually choose the Correct answer.
8. Add a Solution description.
9. Optionally upload a diagram/image.
10. Save question.

Existing questions have an Edit button so you can correct OCR mistakes later.

## Important image note
The OCR screenshot itself is NOT saved as the public question image. If you want a diagram/figure visible to students, upload it separately in "Optional diagram / question image". It is compressed in the browser before being saved.

## Firebase
This package includes the Firebase Web App configuration and Realtime Database URL for the `pcm-mock-arena` project.

Authentication:
- Firebase Authentication → Email/Password enabled.
- Create your admin user under Authentication → Users.

Recommended Realtime Database rules after initial setup:

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

For stronger security later, restrict `.write` to your admin UID.

## GitHub Pages
Upload the actual files (not the ZIP) to the repository root:
- index.html
- app.js
- style.css
- starter_questions.js
- README.md

Then GitHub Settings → Pages → Deploy from branch → `main` → `/ (root)`.

## Firebase authorized domain
Firebase Authentication → Settings → Authorized domains → add your GitHub Pages host, e.g. `YOUR-USERNAME.github.io`.
