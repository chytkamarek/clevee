---
name: dev-create-issue
description: "Create a GitHub issue with AC and test plan from a rough description."
argument-hint: "<popis | číslo issue>"
model: sonnet
allowed-tools: Bash(gh issue *), Bash(gh label *), Bash(gh api *), Bash(scripts/dev/*), Read, Glob, Grep
---

Z hrubého zadání udělej pořádné GitHub issue včetně test plánu.

## Vstup

$ARGUMENTS — **text** → nové issue; **číslo** → přepiš existující hrubé issue (`gh issue view <č>`), nezakládej nové.

## Postup

1. Feature, nebo bug? U nového issue zkontroluj duplicity (`gh issue list --search "<klíčová slova>" --state open`); podobné → upozorni a zeptej se.
2. **Přečti relevantní kód.** Každé „jako dnes / jako X / i v Y“ v AC ověř: X to opravdu dělá a Y existuje.
3. **Napiš issue** podle šablony. Test plán:
   - jen úrovně, které repo umí (test runner a devDependencies v `package.json`); logiku UI testuj nad funkcí/hookem, ne mountem komponenty; repo bez testů → body k ověření v appce a do Poznámek „automatické testy chybí“;
   - e2e jen pro stav, který jde v CI navodit (bez loginu, DB a klientského storu — jinak se nedá splnit);
   - staví-li na nehotovém issue, napiš „Závisí na #X“ do Poznámek a ověř, že se AC nepřekrývají.
4. **Spec check** — sahá-li issue na rizikové cesty z CLAUDE.md → Dev workflow, challenguj sám: chybí error stavy, legacy data, hranice? Je scope přiměřený, řeší potřebu, ne symptom?
5. **Ukaž návrh** — title, Co chceš, Kde to uvidíš, AC, Poznámky (test plán ne — ten hlídá `/dev-start`). Pokračuj až po schválení.
6. **Zapiš** — `gh issue create` (nové) nebo `gh issue edit <č> --title … --body-file …` (původní text dej na konec Poznámek jako citaci). Label `enhancement` / `bug`, případně `epic: <název>`. Pak `scripts/dev/issue-status.sh <č> backlog` (ne u epiců). Vypiš URL.

## Šablona

```
## Co chceš
[co má fungovat jinak]

## Kde to uvidíš
[stránka, komponenta, endpoint]

## Acceptance criteria
- [ ] [konkrétní, testovatelné — ne „funguje správně“]

## Test plán
- [ ] [každé AC aspoň jedním testem; happy path, edge case, chybový stav]

## Poznámky
[edge cases, co NENÍ součástí, závislosti]
```

Title imperativem, max 60 znaků. Nevymýšlej, co uživatel neřekl. Není jasné Kde → zeptej se.
