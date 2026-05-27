# PharmaQuiz Neon

Interactive Pharmacy Board Exam reviewer for **SBE** and **CE** modules.
Built with React + Vite, designed for Cloudflare Pages.

- **975 questions** parsed from the original PDF reviewer modules
- 6 modes: SBE Quiz / CE Quiz / Both Mix · plus Review variants of each
- Persistent sessions: refresh-safe progress and score, per mode
- Neon-themed UI with chemistry formula rendering (H₂SO₄, NaHCO₃, etc.)
- Full-text search with Bisaya-flavored rationales
- Random nickname generator if you don't want to type a name

## Local dev

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the built bundle locally
```

## Deploy to Cloudflare Pages

1. Push the `app/` directory to a Git repo.
2. In Cloudflare Pages → **Create a project** → connect the repo.
3. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `app` (if the repo contains more than just the app)
4. The included `public/_redirects` (`/* /index.html 200`) makes deep-links
   work; `public/_headers` adds long cache on `/assets/*`.
5. Done — your reviewer is live at `https://<project>.pages.dev`.

## Project layout

```
src/
  App.jsx           – router + dataset gate
  index.css         – neon theme tokens, animations
  App.css           – component styles
  lib/
    store.js        – zustand store + localStorage persistence
    quiz.js         – dataset loader + pool builder (CE / SBE / Both 50-50)
    chem.jsx        – chemistry formula renderer (subscripts/charges)
    bisaya.js       – Bisaya analogies & closings for review mode
    nicknames.js    – random pharmacist nicknames
  components/
    TopBar.jsx
  screens/
    Welcome.jsx     – name entry / skip → random nickname
    Menu.jsx        – mode picker (6 modes + search + credits)
    Quiz.jsx        – quiz + review screen (one component, both modes)
    Search.jsx      – full-text search with highlight
    Credits.jsx     – @qtkaybee link

public/
  dataset.json      – fetched at runtime (kept out of JS bundle)
  _redirects        – SPA fallback for Cloudflare Pages
  _headers          – security + cache headers
  favicon.svg
```

Created by **@qtkaybee** — https://t.me/qtkaybee
