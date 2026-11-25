---
name: dev-start
description: "Autonomously implement a GitHub issue end-to-end (branch → tests → review → PR)."
argument-hint: "<issue>"
disable-model-invocation: true
allowed-tools: Agent, Bash(gh issue *), Bash(gh pr *), Bash(git *), Bash(npm *), Bash(npx *), Bash(scripts/dev/*), Read, Write, Edit, Glob, Grep
---

**Krok 0.** Je-li v konverzaci před tímto skillem jakákoli jiná práce, odpověz jen „Napřed `/clear`, pak znovu `/dev-start $ARGUMENTS`.“ a skonči.

Implementuj issue #$ARGUMENTS autonomně — branch, testy, implementace, review, PR. Příkazy (test, typecheck, lint, build), rizikové cesty a gate navíc jsou v CLAUDE.md → **Dev workflow**.

## Velikost změny

Urči po kroku 2 a napiš ji do PR. Řídí, co z postupu běží.

- **Malá** — text, styl, konfigurace, žádná nová logika. Jeden commit, test + lint, PR. Review ani projetí appky ne.
- **Běžná** — výchozí. Celý postup.
- **Riziková** — rizikové cesty z CLAUDE.md, DB schéma, auth, mazání dat, nová pojistka (guard, lint pravidlo, CI). Navíc mutace (krok 4) a v review i degradovaná cesta.

## Postup

1. **Issue** — `gh issue view $ARGUMENTS`; `scripts/dev/issue-status.sh $ARGUMENTS in-progress`.
2. **Kód** — soubory z „Kde to uvidíš“ a co na ně navazuje. Sedí AC s kódem (soubory existují, komponenta se renderuje, data tečou odkud issue tvrdí)? Nesedí → zastav a zeptej se.
3. **Branch z `origin/main`** — `git fetch origin && git checkout -b feat/$ARGUMENTS-<slug> origin/main` (`fix/` pro bug). Je-li lokální `main` napřed (`git log origin/main..main`), zastav a řekni to.
4. **Testy a implementace.** Test plán z issue; chybí-li, napiš ho z AC (i z Poznámek) do komentáře issue. **Každý nový test musí aspoň jednou spadnout:**
   - **bug** — nejdřív test, který vadu zopakuje, a uvidíš ho spadnout; pak oprava;
   - **nová logika** — test s implementací; u rizikové změny každý nový guard ověř mutací nad commitnutým kódem: `scripts/dev/mutate.sh --literal <soubor> '<staré>' '<nové>' <testy>` — musí spadnout test, který to tvrdí;
   - **refaktor beze změny chování** — očekávané hodnoty z kódu **před** změnou, test zelený ještě před refaktorem;
   - **UI a lepicí kód** — bez RED; ověří typecheck a projetí appky.

   Nejlehčí patro, které to pokryje: unit (čistá logika) → integration (endpoint/loader, skutečná DB tam, kde je levná) → e2e jen pro to, co potřebuje prohlížeč. Logiku z komponent vytáhni do testovatelných funkcí.
   Commity `test:` / `feat:` / `fix:`; staguj explicitně (`git add <cesty>`, nikdy `-A` ani `.`). Odchylku od zadání napiš do komentáře issue dřív, než pokračuješ.
5. **Kontroly** — test, typecheck, lint z CLAUDE.md. Selže → oprav, commitni, znovu.
6. **Review** (běžná, riziková) — agent `dev-reviewer`, zadání jen „issue #$ARGUMENTS, velikost <…>“, nic o tom, čeho se bojíš. Souhlas → oprav (nový guard u rizikové změny mutací); zásadní nesouhlas → zeptej se. Do PR „Review: N nálezů, opraveno M“.
7. **Projetí appky** — změnilo-li se UI: [browser.md](browser.md). Vadu oprav a projeď znovu.
8. **Gate navíc** z CLAUDE.md (build, benchmark…), jsou-li tam.
9. **PR** — `git push -u origin HEAD`, `gh pr create` s `Closes #$ARGUMENTS`; `scripts/dev/issue-status.sh $ARGUMENTS in-review`.
   Změnilo se UI → tělo začíná `## Proklikej`: kde (URL) a co zkusit — AC jako checklist jazykem obrazovky, plus co projetí nepokrylo. Popis kódu pod tím. Do chatu odkaz na PR + checklist.

## Zastav a zeptej se jen když

- issue potřebuje externí data nebo nové volání třetí strany,
- je potřeba DB migrace nebo změna schématu,
- je víc architektonických cest s dlouhodobým dopadem,
- AC jsou nejasná nebo protichůdná.

Ptej se na to, co uživatel uvidí (konkrétní před/po), ne na jméno pole. Ke každé variantě naměřený důsledek.
