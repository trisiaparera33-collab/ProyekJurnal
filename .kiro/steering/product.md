# Product: My Aesthetic Journal

A minimalist, aesthetic personal journaling web app. Users can write daily journal entries, track their mood, browse past entries as cards, read full entries in a modal, and delete entries they no longer need.

## Target User
Single user, personal use. No authentication or multi-user support.

## Language
UI text and content are in Indonesian (Bahasa Indonesia).

## Core Features
- **Write entry** — title, date, mood (emoji picker), and free-text content
- **Mood tracker** — four moods: 😊 Senang, 😢 Sedih, ☕ Tenang, 🤯 Stres
- **Entry list** — responsive card grid, sorted newest-first
- **Detail modal** — click a card to read the full entry
- **Delete** — remove an entry with a confirmation prompt

## Data Persistence
All data is stored in the browser via `localStorage` under the key `my_aesthetic_journal`. There is no backend or server.
