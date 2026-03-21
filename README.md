# Portuguese Vocabulary Site

A simple static site for studying Portuguese vocabulary.

## Files

- `index.html` — main page
- `style.css` — styles
- `script.js` — quiz logic
- `data/pt-vocab.json` — vocabulary data

## Current features

- Custom session size from 5 to 100 words
- One-round non-repeating questions
- Portuguese word to Chinese meaning multiple choice

## Update workflow

1. Maintain the master vocabulary list in Excel.
2. Send the updated Excel for JSON regeneration.
3. Update `data/pt-vocab.json` in GitHub.
4. GitHub Pages publishes the latest version.
