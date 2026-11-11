# Assumptions

Decisions made where the brief was unclear. Each is easy to change.

1. **Routing uses HashRouter** so the app works on GitHub Pages without server rewrites. Links use `#/` prefix.
2. **Per-cow milk rows are appended on save** rather than replaced, to keep the mock simple. Editing a saved session adds corrected rows.
3. **Dashboard top/bottom cow chart** uses a deterministic estimate derived from the tag (demo only); the full per-cow table is in Milk > History and Animal profile > Milk.
4. **Reconciliation "sold"** is computed from the day's sales in the full design; in this build the usage panel shows produced vs used vs spoiled vs unexplained.
5. **Statutory payroll rates** (PAYE 12%, NHIF 2.75%, NSSF 6%) are placeholders in Settings, as requested.
6. **M-Pesa, SMS and email are mocked** with timers and log entries only. No real integrations.
7. **Offline sync queue** is simulated via the Settings toggle and the `synced` flag on milk/sale records; Dexie persistence covers refresh survival.
8. **Animal photos** are solid colour tiles with the tag number, per the brief.
9. **Logo** is a flat SVG placeholder (hill crest + milk drop) in `src/assets/brand/`. Replace `LogoMark` and `public/favicon.svg` with the real logo later.
10. **Fonts** load from Google Fonts with a system-ui fallback, so the app works offline after first load (except the font CDN).
11. **PWA icons** are generated from the same SVG mark; replace `public/icon-192.png` and `public/icon-512.png` with final artwork.
12. **Data entry 24-hour edit rule** is shown as a note; the mock does not hard-block older edits.
13. **No TanStack Query/Table** — the mock API is fast enough with local state and `useAsync`. The contract in `docs/api-contract.md` keeps the door open for a real backend.
