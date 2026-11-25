# Klíček, maskot a průvodce

Klíček je žlutá kapka (`klicek-yellow`) s velkýma kulatýma očima (`surface`, `fg`), tvářičkami (`klicek-cheek`) a malým úsměvem. Nahoře z ní roste rostlina. Roste podle počtu vyřešených úloh, nikdy neuvadá a nikdy neukazuje čísla. Kód: `src/klicek/` (fáze a prahy v `growth.ts`, kresba v `KlicekArt.tsx`).

| Fáze | Název | Jak vypadá |
| --- | --- | --- |
| 1 | Semínko | kapka, z hlavičky vykukuje špička stonku |
| 2 | Klíček | dva lístky (`leaf`) na zeleném stonku (`stem`) |
| 3 | Sazenička | vyšší stonek, pět lístků |
| 4 | Zakořeňuje | kapka se noří do hlíny (`soil`), po stranách zlaté kořínky (`root-gold`) |
| 5 | Proutek | z hlíny koukají jen oči, stonek zdřevnatí (`bark`) |
| 6 | Mladý stromek | obličej se přesunul do tenkého kmínku, zlaté kořeny |
| 7 | Stromek | silnější kmen, kulatá koruna (`leaf`, `leaf-deep`) |
| 8 | Kvete | větší koruna s kvítky (`blossom`) |
| 9 | Jabloň | jablíčka (`apple`), stinná vrstva koruny (`leaf-shade`) |

## Pravidla kresby

- Obličej je ve všech fázích stejný: oči, tvářičky, úsměv. Od fáze 6 je v kmeni, menší.
- Zlaté kořeny jsou „rozpuštěná“ kapka. Díky nim dítě pozná, že Klíček nezmizel.
- Strom nesmí působit strašidelně: velké kulaté oči, tvářičky, úsměv. Žádné vrásky, praskliny ani díry v kmeni, které by připomínaly ústa.
- Ve fázi 5 (bez pusy) Klíček mrká nebo se dívá nahoru za proutkem, aby nepůsobil smutně.
- Uvnitř fáze tiše přibývají drobnosti (lístek, kvítek), bez počítadel a ukazatelů postupu.
- Přechod mezi fázemi je pomalá proměna (`duration-grow`): stará kresba zmizí, pak se objeví nová, jednou, nikdy ve smyčce. Při `prefers-reduced-motion` okamžitě.
- Barvy jen z tokenů maskota. Konzument dodá fázi a popis pro čtečku („Klíček, mladý stromek“).
- Spící Klíček (zavřená očka) = klidný prázdný stav, ne smutek.

## Po fázi 9

- **Sad** (#19): pod jabloní leží jablíčko, dítě ho samo zasadí a vedle roste nový strom od semínka, jiného druhu (hrušeň `pear`, třešeň `blossom`). Zahrada stojí na `sky` a `grass`.
- **Návštěvníci** (#20) přicházejí sami podle fáze: ptáček (`bird`) od fáze 8, ježek u jabloně. Nekupují se, nic se nesbírá, žádná měna ani náhoda.
- Barvy `pear`, `sky`, `grass` a `bird` jsou zatím jen v artifactu. Do `:root` přijdou s #19 a #20.
