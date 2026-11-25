# Projetí appky (dev-start krok 7)

Statické kontroly ani testy nevidí runtime knihoven (velikost kontejneru, mapa, handlery) — tohle je místo, kde do procesu vstupuje realita.

- Spusť dev server (CLAUDE.md → Dev workflow) a projdi **každé AC** nástrojem, který projekt má: Playwright skript (import `@playwright/test` absolutní cestou z `node_modules`), nebo vestavěný prohlížeč. Viewport 1280 px, a 390 px, mění-li se layout.
- **Cestou uživatele** — formulář, klik, URL, kterou uživatel opravdu zadá. Ne zápis do storu ani interní router: zadní dveře projdou i nad nefunkční cestou.
- Ověřuj **stavem**, ne snímkem: text, hodnoty polí, `aria-*`, status odpovědi. Poslouchej `pageerror` a console `error`.
- Při timeoutu nejdřív vypiš URL a text stránky — vlastní selektor padá častěji než appka.
- Prvek kreslený knihovnou (mapa, graf): i po překreslení (filtr, nová data) a během načítání.
- Společná kostra (hlavička, navigace, kroky): poloha na každé dotčené stránce, ne jen přítomnost.
- Naměřené hodnoty dej do PR. Vadu oprav a **projeď znovu** — i po opravě ověřené jen čtením.
