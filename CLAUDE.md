# clevee

## Dev workflow

Issue → `/dev-create-issue` → `/dev-start <issue>` → `/dev-ship` → po ~5 PR `/dev-feedback`. Skilly berou příkazy a hranice odsud.

Board: [GitHub Project clevee](https://github.com/users/chytkamarek/projects/1) — `scripts/dev/issue-status.sh` přesouvá karty (Todo → In Progress → In Review → Done).

Stack: React + TypeScript + Vite, PWA přes `vite-plugin-pwa` (Workbox, `generateSW`). Node 24 (`.nvmrc`).

- **Test:** `npm test` (Vitest) · **Typecheck:** `npm run typecheck` · **Lint:** `npm run lint` (ESLint, 0 varování)
- **Dev server:** `npm run dev` → http://localhost:5173 (service worker se v dev režimu neregistruje)
- **Gate navíc:** `npm run build` při změně konfigurace (Vite, PWA, TS), závislostí nebo ikon; offline/PWA ověřuj přes `npm run build && npm run preview` → http://localhost:4173
- **CI:** `.github/workflows/ci.yml` na každém PR a pushi do `main` — lint, typecheck, test, build
- **Rizikové cesty:** `vite.config.ts` (manifest, service worker — rozbitý SW drží uživatele na staré verzi), `.github/workflows/`
- **Testy:** vedle kódu jako `src/**/*.test.{ts,tsx}` (Vitest + jsdom + Testing Library, setup v `src/test/setup.ts`). Logiku her drž v čistých funkcích mimo komponenty.
- **Layout:** tablet-first (cíl 768–1024 px), na 375 px bez horizontálního scrollu
- **Prohlížeč pro projetí appky:** vestavěný prohlížeč Claude Code
- **Nasazení:** _doplnit_
