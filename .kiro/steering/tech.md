# Tech Stack

## Overview
Vanilla web app — no build tools, no frameworks, no package manager. Everything runs directly in the browser.

## Stack
- **HTML5** — semantic markup, single page (`index.html`)
- **CSS3** — plain stylesheet (`style.css`), no preprocessors
- **JavaScript (ES6+)** — vanilla JS (`app.js`), no libraries or frameworks
- **localStorage** — sole persistence layer, no backend

## Key Browser APIs Used
- `localStorage` — read/write journal data
- `crypto.randomUUID()` — generate unique entry IDs
- `Date` / `toLocaleDateString('id-ID', ...)` — Indonesian date formatting

## No Build Step
There is no compilation, bundling, or transpilation. Open `index.html` directly in a browser or serve with any static file server.

## Running Locally
```bash
# Option 1: open directly
start index.html

# Option 2: simple static server (Python)
python -m http.server 8080

# Option 3: simple static server (Node)
npx serve .
```

## No Tests
There is currently no test framework configured.
