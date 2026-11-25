---
name: dev-ship
description: "Process PR review comments, rebase, merge, and record cycle stats."
argument-hint: "[PR or issue]"
disable-model-invocation: true
allowed-tools: Agent, Bash(gh pr *), Bash(gh issue *), Bash(gh api *), Bash(gh run *), Bash(git *), Bash(npm *), Bash(npx *), Bash(scripts/dev/*), Read, Edit, Write, Glob, Grep
---

Zpracuj review na PR, rebasuj, mergni a zapiš statistiku cyklu. Příkazy jsou v CLAUDE.md → **Dev workflow**.

## Vstup

$ARGUMENTS — číslo PR **nebo issue**; prázdné → `gh pr view --json number -q .number`. Selže-li `gh pr view <č>` na `Could not resolve to a PullRequest`, je to issue — PR najdi podle aktuální branch.

## Postup

1. **Review ze tří zdrojů** (nepřekrývají se):
   - `gh pr view <č> --json comments -q '.comments[] | "--- \(.author.login):\n\(.body)"'` — konverzace pod PR, **tady přistane lidská review**;
   - `gh api repos/{owner}/{repo}/pulls/<č>/reviews` — verdikty;
   - `gh api repos/{owner}/{repo}/pulls/<č>/comments` — inline komentáře.

   Vypiš, čí komentáře jsi přečetl. PR mění aplikační kód (ne jen testy, konfiguraci, docs, skripty `scripts/dev`) a nemá v těle „Review:“ (vznikl mimo `/dev-start`) → spusť agenta `dev-reviewer` s číslem PR; jeho nálezy počítej jako review od bota.
2. **Každou připomínku zpracuj** — souhlas → uprav · nesouhlas, ale minor → uprav · nesouhlas a zásadní → vysvětli a zeptej se. Commit `fix: address review feedback from PR #<č>`, pak test + lint.
3. **Rebase** — cizí změny ve stromu odlož `git stash push -u -m "dev-ship WIP" <cesty>` (po kroku 6 `git stash pop`); nikdy je necommituj ani nezahazuj. `git fetch origin main && git rebase origin/main`; konflikty vyřeš, nejasné → zeptej se. Po rebase test.
4. **Proklik** — sáhly opravy z review na UI (diff od posledního commitu `/dev-start` do HEAD)? Vypiš, co se změnilo, a počkej na potvrzení. Jinak přeskoč.
5. **Merge** — `git push --force-with-lease origin HEAD`. CI zkontroluj jednou (`gh run list --branch <branch> --limit 3`); červené → oprav, push. Bez CI platí lokální kontroly. `gh pr merge <č> --squash --delete-branch`; `scripts/dev/issue-status.sh <issue> done`. Ruční kroky nasazení z PR připomeň **před** merge.
6. **`git checkout main && git pull origin main`**; gate po merge z CLAUDE.md, je-li tam.
7. **Statistika cyklu** — komentář k linked issue a jediný výstup uživateli:
   ```
   ## Cycle stats
   - velikost: <malá/běžná/riziková>
   - opravné commity po prvním feat/fix: <N>
   - nálezy review před PR (pojistka): <N>
   - nálezy z PR review (únik): <N> (člověk <N>, bot <N>) — <co>
   - tření: <tool error / smyčka / zbytečný dotaz — nebo žádné>
   - únik po merge: <co — nebo ne>
   ```
   Únik > 0 → doporuč `/dev-feedback`. Jinak připomeň retro, až od poslední `chore: retro` uběhne ~5 PR.

## Pravidla

- Netiskni celý diff — jen rozhodnutí a změny.
- Force push jen `--force-with-lease`. Nikdy nemerguj s červeným CI.
