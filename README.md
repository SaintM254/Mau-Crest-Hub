# Mau Crest Hub

Farm management and milk sales system for Mau Crest Dairies, Molo, Nakuru County, Kenya.
Slogan: "Nurtured by Nature, Delivered Fresh".

Front-end only demo. All data is fictional and stored in your browser (IndexedDB via Dexie). No real payments, SMS or email.

## Setup

```bash
npm install
npm run dev
```

Open the printed URL (usually http://localhost:5173/Mau-Crest-Hub/).

## Build and deploy

```bash
npm run build
```

Deployed to GitHub Pages automatically on push to `main` via `.github/workflows/deploy.yml`.
Site URL: `https://saintm254.github.io/Mau-Crest-Hub/`

## Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Owner | owner@maucrest.co.ke | owner123 |
| Manager | samuel@maucrest.co.ke | manager123 |
| Data entry | daniel@maucrest.co.ke | entry123 |

Use "Switch demo role" in the user menu (or Settings) to see each role's experience.

## Reset data

Settings > Demo > Reset demo data. This restores the original seeded data.

## Structure

- `src/app` — routes and layout
- `src/features/<module>` — screens per module
- `src/components/ui` — design system components
- `src/api` — mock API (replace with real backend later)
- `src/data` — deterministic seed generator
- `src/lib` — types, database, store, utils
- `src/i18n/en.ts` — all visible strings
- `src/assets/brand` — placeholder logo (replace with real logo later)

## Docs

- `docs/api-contract.md` — mock API contract for the backend developer
- `docs/assumptions.md` — decisions made where the brief was unclear
- `docs/screens.md` — route list

## Design

Cream background, flat solid fills, no gradients, no emojis. Public Sans. Tokens in `src/index.css` and `tailwind.config.js`. See `/design-system` route for the component catalogue.
