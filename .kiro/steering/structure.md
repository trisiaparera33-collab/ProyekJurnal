# Project Structure

## File Layout

```
ProyekJurnal/
├── index.html      # Single HTML page — all markup and layout
├── style.css       # All styles — no external CSS libraries
├── app.js          # All JavaScript logic — no modules or imports
├── schema.json     # Data schema reference (documentation only, not loaded at runtime)
├── requirements.md # Product requirements (Indonesian)
└── .kiro/
    └── steering/   # AI assistant guidance files
```

## Architecture

This is a single-page, single-file-per-concern app. There is no routing, no components, and no module system.

- **`index.html`** — structure and static markup only; no inline scripts or styles
- **`style.css`** — all visual styling; linked from `<head>`
- **`app.js`** — all behavior; loaded at end of `<body>` as a classic script

## Data Model

Journal entries are stored as a JSON array in `localStorage`. Each entry has:

```json
{
  "id": "string (UUID)",
  "title": "string",
  "date": "YYYY-MM-DD",
  "mood": "string (e.g. '😊 Senang')",
  "content": "string",
  "created_at": "ISO 8601 timestamp"
}
```

## Conventions

- **No external dependencies** — do not introduce npm, CDN libraries, or frameworks
- **Keep files flat** — all source files live at the project root; do not create subdirectories for source code
- **Indonesian UI text** — all user-facing strings stay in Bahasa Indonesia
- **XSS safety** — always use `escHtml()` when rendering user-supplied content into the DOM
- **CSS naming** — BEM-style class names (e.g. `.card`, `.card-title`, `.card-footer`)
- **Color palette** — warm neutrals: `#fdf6f0` background, `#7a4f3a` primary, `#b08070` muted, `#3d2b1f` text
