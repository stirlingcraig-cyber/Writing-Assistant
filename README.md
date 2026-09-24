# Executive Writing Assistant

A single-page writing tool for professional British English correspondence — emails, letters, reports, memos, meeting notes and short messages. Runs entirely in the browser; works on iPhone and can be added to the Home Screen.

## Features

- **Live review** — spelling, UK vs US spelling, grammar (including agreement errors), punctuation, jargon, wordiness, passive voice, hedging, ambiguous dates, leftover placeholders, missing greetings/sign-offs/subject lines.
- **13 tones** — Formal, Friendly, Concise, Technical, Sympathetic, Compassionate, Confident, Diplomatic, Persuasive, Plain English, Urgent, Appreciative, Apologetic — with word changes, advice, a tone meter and ready-made opening/closing lines.
- **Claude features** (optional, needs your own Anthropic API key): deep check, three-version rewrites with tone blending, quick actions (Polish, Shorten, Simplify, Bullet points, Summarise, Subject lines, Draft a reply…), rewrite a selected passage, and photo reading including handwriting.
- **Scan** — extract text from photos. Without a key, printed text is read on the device (Tesseract.js).
- **Export** — Word (.docx), PDF or text, generated in the browser; share sheet on iPhone; copy with formatting.
- **Dictation**, version history and a writing profile.

## Privacy

Drafts, settings and history are saved in this browser only (local storage). Text and photos are sent to Anthropic only when you use a Claude feature, using the API key you provide. If you tick "Remember key on this device", the key is stored in this browser's local storage — only do this on a device you control.

## Hosting

Static files only — served by GitHub Pages from the repository root (`index.html`). No build step.
