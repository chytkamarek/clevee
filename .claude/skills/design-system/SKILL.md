---
name: design-system
description: "Design system clevee: klidný princip, tokeny, barvy, layout, texty, komponenty (Button, Feedback, PuzzleBoard, GameLink, Place, GamePath) a maskot Klíček. Použij před návrhem nebo změnou obrazovky, hry, komponenty, CSS či textů v UI a při review UI."
---

# Design system clevee

Klidná appka, ve které s dítětem roste Klíček. Platí pro celou appku i pro každou novou hru. Vizuální náhledy komponent jsou v [artifactu na claude.ai](https://claude.ai/artifact/HJ3r3QituYFAzmUKs8jorx). Tento skill je textová podoba téhož v repozitáři.

- **Zdroj pravdy pro hodnoty jsou tokeny v `:root` v `src/index.css`.** Tady jsou jen jména tokenů a pravidla, kdy který použít. Hodnoty čti z CSS.
- Mimo `:root` žádné literální barvy. Mezery, rohy, stín a délky přechodů jen z tokenů. Hlídá to `src/design/tokens.test.ts`.
- Po změně tokenu nebo pravidla uprav tento skill i artifact, ať se nerozjedou.

Další soubory skillu: [components.md](components.md) (komponenty), [klicek.md](klicek.md) (maskot).

## Základní princip: klidná appka

Nálada jako u klidných dětských seriálů: hřejivá, pomalá, bez spěchu. Dítě si hraje a přemýšlí, nehoní odměnu. Porušení principu je nález stejné váhy jako bug.

- **Žádné dopaminové smyčky.** Žádné body, hvězdičky, mince, žebříčky, série dní, odměny za návrat, náhodné odměny, odemykání, odpočty času ani „ještě jedno kolo?“. Hra má přirozený konec a nic se nespouští samo.
- **Pohyb málo a pomalu.** Přechody `duration-calm` (rozsah 200–400 ms), vždy ease-out. Žádné poskakování, třesení, pulzování, záblesky, konfety ani smyčky. Při `prefers-reduced-motion` žádný přechod ani animace.
- **Zpětná vazba klidná a věcná.** Správně = krátké tiché potvrzení. Chyba = laskavá nápověda, nikdy trest ani červená.
- **Zvuk** (až bude): tichý, měkký, volitelný, výchozí ztlumený. Žádné jingly.
- **Barvy** mohou být sytější a veselé (ztlumení palety je zatím vypnuté), ale nikdy neonové ani blikající.

## Ovládání bez čtení

Děti 2–6 let nemusí umět číst. Ovládací prvky jsou symboly (▶, šipka zpět, ikony míst a her), slova jen v `aria-label` a jako malé popisky pro rodiče (`muted`, 14px). Platí, dokud rodič neurčí jinak (věková skupina, #3).

## Barvy

- Stránka stojí na `bg`, text je `fg`, vedlejší text `muted`.
- `accent` je hlavní akce, jedna na obrazovku. Text na `accent` je vždy `fg` (bílý by měl jen 2,4:1).
- `surface` nese karty, dlaždice a sekundární tlačítka, ohraničená `board-line`.
- Fokus a výběr vždy `focus`, obrys 3px s odsazením 3px.
- `result-ok` jen pro „Správně.“. Chyba je `muted`, nikdy červená.
- Místa na domově: `place-math`, `place-language`, `place-space` jako podklad místa a pěšinky jeho her, `place-*-deep` pro prošlé kamínky, `stone-ahead` pro kamínky před dítětem.
- Hry: dílky `piece-1` až `piece-6` s hranou `piece-edge`, deska `board-slot` a `board-line`.
- Barvy maskota a zahrady (`klicek-*`, `leaf*`, `stem`, `root-gold`, `bark`, `soil`, `apple`, `blossom`) patří kresbě, ne ovládacím prvkům. `apple` je plod, nikdy chybová barva.
- Nová barva = nový token v `:root`. Text podle WCAG AA (4,5:1, u textu od 24px 3:1). Barvy, které se musí rozlišit, se liší světlostí nebo tvarem, ne jen odstínem.

## Typografie

Systémové bezpatkové písmo. Velké, tučné a čitelné.

- Zadání úlohy 48px tučně (36px na telefonu), název hry 32px (24px), výsledek 28px tučně.
- Hlavní tlačítko 24px tučně, sekundární ovládání a pomocné texty 18px, základ 16px.
- Popisky pro rodiče 14px `muted`.
- Na telefonu (do 600 px) se display a nadpisy zmenšují zhruba o čtvrtinu.

## Rozměry a layout

- Tablet-first: cíl 768–1024 px, obsah max. `content-max`, boční okraj `space-10`. Na telefonu okraj `space-4` a žádný vodorovný scroll na 375 px. Respektuj `env(safe-area-inset-*)`.
- Dotykové cíle: sekundární a ikonové tlačítko aspoň `control-min`, hlavní aspoň `button-min` a `button-min-width` (na telefonu přes celou šířku), dlaždice hry aspoň `tile-min`.
- Mezery `space-*`: v řádku ovládání `space-3`, mezi prvky `space-4`, mezi bloky obrazovky `space-6`.
- Rohy: `radius-sm` dílky, `radius-md` pole a sekundární/ikonová tlačítka, `radius-lg` hlavní tlačítko, dlaždice, místa a pěšinka.
- Stín jen `shadow-card` (dlaždice, ikonové tlačítko, prošlý kamínek), nikde jinde.

## Obrazovky

- **Domov** (`#/`): nahoře Klíček, pod ním tři místa (`Place`): Matematika, Jazyk, Prostor. Hry jako dlaždice (`GameLink`). Prázdné místo ukazuje spícího Klíčka.
- **Pěšinka** (`#/hra/<id>`, `GamePath`): kamínky podle úrovní hry, ▶ spustí aktuální kamínek, šipka zpět vede domů.
- **Hra** (`#/hra/<id>/<úroveň>`): hlavička (šipka zpět na pěšinku, malý název hry), zadání, výsledek (`Feedback`) a jedno hlavní tlačítko (`Button`). Mezery `space-6`.
- Mezi obrazovkami jedno jemné prolnutí `duration-calm`, při `prefers-reduced-motion` žádné.

## Jak navrhovat hru

1. Logiku drž v čistých funkcích (generátor, validátor), komponenta jen kreslí.
2. Hra deklaruje v registru `module` (math | language | space), `icon` a `levels`. Domov i pěšinka se z nich skládají samy.
3. Hra dostane společnou hrací obrazovku: zadání → Zkontrolovat → výsledek → Další úloha.
4. Ovládání přetažením i ťuknutím, každá akce i tlačítkem (sekundární `Button`), ovladatelné klávesnicí.
5. Barvy dílků z `piece-*`, deska z `board-*`, výběr `focus`.
6. Žádný časovač, skóre ani počítadlo pokusů na obrazovce. Nápověda je vždy dostupná a nic nestojí.
7. Ikona hry: jednoduché SVG 48×48, barvy jen přes třídy `.i-*` (`i-ink`, `i-paper`, `i-line`, `i-stroke`, `i-piece-N`), `aria-hidden`.

## Texty

Krátké, vlídné, bez vykřičníků a superlativů. Tykáme. Popisky tlačítek jsou krátká slovesa. Příklady: „Správně.“, „Ještě to nesedí.“, „Přetáhni dílky do tvaru. Ťuknutím dílek otočíš.“, „Otočit“, „Překlopit“, „Vrátit“, „Další úloha“.

## Kontrola před PR

- [ ] Žádné body, hvězdy, odměny, odpočty, automatické další kolo.
- [ ] Pohyb jen `duration-calm` ease-out, vypnutý při `prefers-reduced-motion`.
- [ ] Barvy a rozměry z tokenů, `npm test` (tokens.test.ts) prochází.
- [ ] Ovládání symboly, slova v `aria-label`. Fokus viditelný (`focus`).
- [ ] Text 4,5:1 na svém pozadí. Stav se nerozlišuje jen barvou.
- [ ] 768–1024 px i 375 px bez vodorovného scrollu.

## Otevřené body

- **Písmo:** zatím systémové. Kulaté dětské písmo s dobrou češtinou by se hodilo, není rozhodnuto.
- **Tmavý režim:** appka ho nemá.
- **Výchozí kamínek podle věku:** pěšinka začíná prvním neprošlým kamínkem, věková skupina (#3) ho může posunout.
