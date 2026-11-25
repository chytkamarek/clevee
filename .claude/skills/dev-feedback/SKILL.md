---
name: dev-feedback
description: "Process retrospective over several merged PRs — what slowed us down, what escaped, what to delete."
argument-hint: "[PR | prázdné = od poslední retro]"
disable-model-invocation: true
model: sonnet
allowed-tools: Bash(gh issue *), Bash(gh pr *), Bash(gh api *), Bash(git *), Bash(wc *), Read, Write, Edit, Glob, Grep
---

**Krok 0.** Je-li v konverzaci před tímto skillem jakákoli jiná práce, odpověz jen „Napřed `/clear`, pak znovu `/dev-feedback $ARGUMENTS`.“ a skonči.

Retrospektiva **procesu**, ne kódu: kde nás proces stál zbytečně času a pozornosti a co uteklo za všechny pojistky.

## Vstup

$ARGUMENTS — číslo PR, nebo prázdné = PR mergnuté od poslední retra (`git log --grep='^chore: retro' -1 --format=%ad` → `gh pr list --state merged --search "merged:>=<datum>"`). Ideál 3–6 cyklů: vzor je vidět až přes víc PR.

## Postup

1. **Data** za každý PR: komentář `## Cycle stats` na issue; komentáře z PR (`gh pr view <č> --json comments …` + `gh api …/pulls/<č>/comments`); commity (`gh pr view <č> --json commits -q '.commits[].messageHeadline'`).
2. **Roztřiď nálezy** podle toho, kdo vadu chytil:

   | Třída | Poznáš ji | Akce |
   |---|---|---|
   | Pojistka | test, typecheck, lint, CI, mutace, review před PR, projetí appky | žádná, jen započítej |
   | Únik | člověk, review v PR, po merge | kandidát — pravidlo dvou výskytů |
   | Tření | smyčka oprav, tool error, zbytečný dotaz, čekání | zjednodušit nebo zautomatizovat, **ne** přidat kontrolu |
   | Mrtvá váha | krok skillu, který nic nechytil a stál čas | smazat nebo zúžit |

3. **Pravidlo dvou výskytů** — únik poprvé → kazuistika do `docs/lessons.md`; do skillu (nebo `.claude/agents/dev-reviewer.md`) pravidlo až při druhém výskytu téže třídy.
4. **Projektové poznatky** (jak kód funguje, gotchas) → memory nebo CLAUDE.md, současný stav, ne historie.
5. **Navrhni změny**:
   ```
   ### [Únik/Tření/Mrtvá váha/Projektové] <název>
   **Co se stalo:** <cyklus, kdo našel, co to stálo>
   **Akce:** <soubor a konkrétní edit — nebo smazání>
   ```
   **Vždy navrhni i mazání.** Každé přidání má protějšek ve škrtu. Rozpočty ve slovech (`wc -w .claude/skills/*/SKILL.md .claude/agents/*.md`): `dev-start` 800, ostatní 600. Sekce `docs/lessons.md` s víc než 3 kazuistikami se slije do pravidla + 2 příkladů.
6. **Počkej na schválení.** Nic neměň automaticky.
7. **Aplikuj**, commitni `chore: retro #<od>–#<do> — <co>` a pushni na `main`. Obecná změna procesu (ne projektová) → navrhni ji uživateli i do `project-base`.

„Proces funguje, nic neměnit“ je platný a po klidných cyklech očekávaný výsledek. Do skillu patří pravidlo, ne příběh. Buď konkrétní („smaž krok X, CI ho pokrývá“).
