# Ponaučení z dev cyklů

**Co to je:** archiv konkrétních vad, které prošly review a chytly se až později.
Každá položka má tvar *pravidlo → co se skutečně stalo*. Skilly (`dev-start`,
`dev-ship`) nesou jen krátké pravidlo a odkazují sem — příběh je důkaz, ne instrukce.

**Kdy sem psát:** `/dev-feedback` sem ukládá procesní ponaučení, které by jinak
nafouklo skill. Do skillu jde jedna věta, sem odstavec.

---

## Proces

### Vada chycená pojistkou není procesní nález

Retrospektiva po každém merge má sklon dělat z každé nalezené vady nové pravidlo —
i z těch, které proces sám chytil (test, typecheck, CI, mutace). Skill pak roste
o kontroly, které duplikují existující pojistky, a vývoj těžkne. `/dev-feedback`
proto třídí podle toho, **kdo** vadu chytil: pojistka → nic, únik k člověku nebo
do review → kazuistika sem a pravidlo až při druhém výskytu, tření → zjednodušit,
ne přidat kontrolu.


### Pojistka hlídá jen tam, kde běží

Pojistka ověřená na vývojářském stroji může v prostředí, kde opravdu běží, tiše
přestat hlídat. V ember-iron třikrát, pokaždé jako únik: SDK zapnulo globální Node
typy a vypnulo typecheck pojistku (`process` v klientském kódu); workflow s neplatným
YAML GitHub odmítl bez varování v PR a po merge se deploy nespustil; test souladu
generovaného souboru s daty běžel v CI až po buildu, který ten soubor přepíše —
porovnával skript sám se sebou, a PR tvrdil, že to CI hlídá.

Pravidlo: pojistku ověř v pořadí a prostředí, kde běží (kroky CI, workflow, po
přidání závislosti), ne jen mutací lokálně.

