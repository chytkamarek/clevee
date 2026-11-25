# Komponenty

Každá komponenta: k čemu je, z jakých tokenů se skládá a co dodá konzument. Náhledy jsou v [artifactu](https://claude.ai/artifact/HJ3r3QituYFAzmUKs8jorx).

## Button

Jedno hlavní tlačítko na obrazovku a sekundární pro ovládání hry.

- **Hlavní** (`.play__button`): Zkontrolovat, Další úloha, ▶ na pěšince. Pozadí `accent`, text `fg`, `radius-lg`, výška aspoň `button-min`, šířka aspoň `button-min-width`, na telefonu přes celou šířku. Neaktivní = průhlednost 45 %.
- **Sekundární** (`.poly__control`): Otočit, Překlopit, Vrátit. Pozadí `surface`, okraj 2px `board-line`, `radius-md`, aspoň `control-min`. Pro děti jen ikona, slovo v `aria-label`.
- **Ikonové** (`.icon-button`): šipka zpět. `surface`, `radius-md`, `control-min` × `control-min`, stín `shadow-card`, `aria-label` („Domů“, „Zpět“).
- Fokus: obrys 3px `focus` s odsazením 3px. Žádné poskakování ani pulzování, které by lákalo ke kliknutí.

## Feedback

Výsledek úlohy pod zadáním (`.play__result`, `role="status"`).

- Správně: „Správně.“, barva `result-ok`, 28px tučně.
- Chyba: „Ještě to nesedí.“ ve `muted`, bez tučného písma (`.play__result--bad`). Nikdy trest, nikdy červená. Neslibuj nový pokus, když obrazovka nabízí jen Další úlohu.
- Žádné vykřičníky, fanfáry ani animace navíc, ani při sérii správných odpovědí.
- Řádek má rezervovanou výšku, aby se rozvržení neposouvalo.

## PuzzleBoard

Herní deska a dílky skládačky, vzor pro hry, kde se něco skládá na mřížku.

- Políčko desky `board-slot` s vnitřní linkou `line-thin` v `board-line`. Buňka od `board-cell-min` do `board-cell-max`.
- Dílky `piece-1` až `piece-6`, buňka s rohy `radius-sm` a vnitřní hranou `piece-edge`.
- Vybraný dílek: obrys 3px `focus`, odsazení 3px, přechod `duration-calm` ease-out.
- Dílky v zásobníku mají 70 % velikosti buňky desky.
- Konzument dodá tvar desky a dílky. Logika (umístění, otočení, překlopení) žije v čistých funkcích.

## GameLink

Dlaždice hry na domově, celá klikatelná, otevře pěšinku hry (`#/hra/<id>`).

- `.tile`: `surface`, `radius-lg`, `shadow-card`, aspoň `tile-min` na šířku i výšku, odsazení `space-3`.
- Ikona hry (`.tile__icon`, 80px) a pod ní malý popisek pro rodiče (`.tile__caption`, `muted`). Název hry v `aria-label` odkazu.
- Žádný počet úloh, skóre, hvězdy ani zámek. Žádný pohyb při najetí.
- Konzument dodá `icon`, název v aktuálním jazyce a odkaz.

## Place

Místo ve světě dítěte na domově (Matematika, Jazyk, Prostor) s dlaždicemi jeho her.

- `.place.place--math | --language | --space`: podklad `place-*`, `radius-lg`, odsazení a mezery `space-4`.
- Hlavička: ikona místa 48px a malý popisek pro rodiče (`.place__caption`, `muted`, aspoň 4,5:1 na každém podkladu). Celé místo je `section` s `aria-label`.
- Dlaždice v mřížce se sloupcem aspoň `tile-min` a mezerou `space-3`.
- Bez her: spící Klíček (zavřená očka) s `aria-label`, žádný text pro dítě.
- Na tabletu tři místa vedle sebe, na telefonu pod sebou.
- Konzument dodá hry z registru seskupené podle `module` (`groupByModule`).

## GamePath

Pěšinka hry: kamínky podle `levels`. Ukazuje, kudy dítě prošlo, a volí úroveň.

- Podklad v barvě místa hry (`place-*`), `radius-lg`. Kamínky `stone-size`, kulaté, zalamují se s mezerou `space-4`.
- **Prošlý** (`.stone--passed`): plná `place-*-deep` se světlým otiskem `surface` uprostřed a `shadow-card`. Je to odkaz na svou (lehčí) úroveň.
- **Aktuální** (`.stone--current`): klidný kroužek `focus` s lemem `surface`, stojí na něm Klíček (`path-klicek-height`). Žádný pohyb.
- **Další** (`.stone--ahead`): jen `stone-ahead`, bez zámku, nedají se ťuknout.
- ▶ (hlavní `Button`, `aria-label` „Hrát“) spustí aktuální kamínek.
- Kamínek je prošlý po pár vyřešených úlohách (`PASS_THRESHOLD` v `src/hub/path.ts`). Číslo ani počet se dítěti neukazuje, úroveň je jen v `aria-label`.
- Konzument dodá hru (`levels`, `module`, `icon`) a historii pokusů.
