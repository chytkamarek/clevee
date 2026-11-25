# clevee

## Základní princip: klidná appka

Platí pro celou appku i každou hru, v designu, mechanikách i textech. Vzor je klidné, hřejivé ladění a pomalé tempo dětských seriálů typu Bluey. Bereme z toho náladu, ne postavy, kresbu ani vzhled konkrétního pořadu. Cíl: dítě si hraje a přemýšlí, nehoní odměnu.

- **Barvy:** ztlumení palety je zatím vypnuté (rozhodnuto 2026-11-25), sytější veselé barvy jsou v pořádku. Dál platí: žádné neonové ani blikající barvy, čitelnost textu podle WCAG AA a nové barvy jen jako tokeny v `:root` v `src/index.css`.
- **Pohyb:** málo a pomalu. Přechody jemné (zhruba 200–400 ms, ease-out), žádné poskakování, třesení, záblesky, konfety, výbuchy částic ani smyčky, které upoutávají pozornost. Respektuj `prefers-reduced-motion`.
- **Zpětná vazba:** klidná a věcná. Správně = krátké tiché potvrzení. Chyba = laskavá nápověda bez červeného křiku a trestu („zkus to ještě jednou“). Žádné fanfáry, ani při sérii správných odpovědí.
- **Žádné dopaminové smyčky:** žádné body, hvězdičky, žebříčky, streaky, odměny za denní návrat, loot/náhodné odměny, odpočty času ani tlak na rychlost. Žádné „ještě jedno kolo?“ ani automatické spuštění dalšího kola. Hra má přirozený konec a dovolí v klidu skončit.
- **Zvuk** (až bude): tichý, měkký, volitelný, ve výchozím stavu ztlumený nebo velmi potichu. Žádné jingly odměn.
- **Texty:** krátké, vlídné, bez vykřičníků a superlativů.

Při návrhu issue i v review je porušení tohoto principu nález stejné váhy jako bug.

## Design system

Nové obrazovky a hry navrhuj podle [design systému clevee](https://claude.ai/artifact/HJ3r3QituYFAzmUKs8jorx) (barvy, mezery, rohy, písmo, stín, pohyb, komponenty).

- **Zdroj pravdy jsou tokeny v `:root` v `src/index.css`.** Design system se s nimi srovnává, ne naopak: po změně tokenu aktualizuj i design system.
- Mimo `:root` žádné literální barvy; mezery (`space-*`), rohy (`radius-*`), rozměry (`control-min`, `button-min`, `content-max`), stín (`shadow-card`) a délky přechodů (`duration-calm`) ber z tokenů. Hlídá to `src/design/tokens.test.ts`.
- Text na `accent` je vždy ve `fg`.

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
