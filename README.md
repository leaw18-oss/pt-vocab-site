# Portuguese Vocabulary Site

A simple static site for studying Portuguese vocabulary.

## Files

- `index.html` — main page
- `style.css` — styles
- `script.js` — quiz logic
- `data/pt-vocab.json` — main vocabulary data
- `data/vocab.json` — fallback vocabulary data for compatibility

## Current features

- Custom session size from 5 to 100 words
- Part-of-speech filter: `all / v. / n.f. / n.m. / adj. / adv.`
- One-round non-repeating questions
- Wrong-answer review loop
- Portuguese word to Chinese meaning multiple choice

## Update workflow

1. Maintain the master vocabulary list in Excel.
2. Send the updated Excel for JSON regeneration.
3. Update `data/pt-vocab.json` in GitHub and optionally mirror to `data/vocab.json` for compatibility.
4. GitHub Pages publishes the latest version.
