# Hlas Klíčka: jak číst zadání přirozeně

Analýza k issue #35. Navazuje na #13: dnes čte zadání systémový hlas prohlížeče. `pickVoice` v
`src/games/core/speech.ts` vybírá vlídný ženský hlas podle jména, rychlost je `SPEECH_RATE = 0.9`.
Nevýhoda je, že každé zařízení zní jinak a česky často strojově.

**Doporučení v kostce:** zadání předgenerovat při buildu neurálním hlasem (Azure, česky Vlasta)
a přibalit je do appky jako malé zvukové soubory, které service worker uloží pro offline. Za běhu
se nikam nic neposílá. Co předgenerované není, přečte dál systémový hlas z #13. Podrobně níže
v části [Doporučení](#doporučení).

Navazující implementační issue: _doplní se odkazem po založení_.

## Co vlastně čteme

| Hra | Text | Druh | Kolik variant |
|---|---|---|---|
| Polyomino | „Přetáhni dílky do tvaru. Ťuknutím dílek otočíš.“ | pevná věta | 1 na jazyk |
| Sčítání (jen v dev) | „Kolik je {a} plus {b}?“, a, b ∈ 0…30 | šablona | 961 na jazyk |
| (do budoucna) laskavá nápověda | „Zkus to ještě jednou.“ apod. | pevné věty | jednotky |

Hlas čte jen zadání a laskavou nápovědu, nikdy pochvaly ani fanfáry (CLAUDE.md, Zvuk).
**Žádný text neobsahuje data dítěte.** Jméno, věk, odpovědi ani historie pokusů se do `speech()`
nedostanou, protože funkce dostává jen `task` a `locale`. To je důležité pro cestu b2, kde text
odchází na server.

## Hlas Klíčka

Klíček je malá žlutá kapka, ze které roste jabloň. Hlas má znít jako rodič, který dítěti v klidu
čte před spaním. Nemá to být hlasatelka ani pohádková postavička.

- **Barva:** ženský, nebo měkký neutrální hlas, střední až lehce nižší poloha. Žádné umělé
  zvyšování hlasu do „dětského“ tónu, žádné hraní postavy.
- **Tempo:** o 10–20 % pomalejší než běžná řeč (dnes `0.9`). Krátká pauza mezi větami.
  Číslo v příkladu zřetelně, bez zrychlení.
- **Tón:** vlídný, věcný, oznamovací. Otázka má přirozenou otázkovou intonaci, ale bez
  přehnaného nadšení. Žádné vykřičníky v hlase, nic nezní jako odměna.
- **Hlasitost:** tichá, appka nikdy nehraje sama od sebe (čte se až po ťuknutí na reproduktor).
- **Stejný hlas v obou jazycích,** pokud to jde (u Azure „Ava“/„Jenny“ k české „Vlastě“).

## Ukázky

Všechny tři čtou stejnou skutečnou větu z appky: „Přetáhni dílky do tvaru. Ťuknutím dílek otočíš.“

| # | Soubor | Hlas | Nastavení | Cesta |
|---|---|---|---|---|
| 1 | [1-zuzana-system.m4a](hlas-klicka/1-zuzana-system.m4a) | Zuzana (macOS, základní) | ~0,9× | a, dnešní stav na Macu |
| 2 | [2-vlasta-neural.mp3](hlas-klicka/2-vlasta-neural.mp3) | Microsoft Vlasta Neural | −10 % tempo | b |
| 3 | [3-vlasta-neural-klidna.mp3](hlas-klicka/3-vlasta-neural-klidna.mp3) | Microsoft Vlasta Neural | −20 % tempo, o něco níž | b, návrh „hlasu Klíčka“ |

Ukázky 2 a 3 jsou vyrobené neoficiálním bezplatným nástrojem `edge-tts` (veřejný endpoint funkce
„Číst nahlas“ v Edge). **Slouží jen k poslechu a výběru, do appky se nedávají.** Produkční audio
musí jít přes oficiální Azure Speech s placeným tarifem (viz licence). Hlas je tentýž.
Ukázka nahraného lidského hlasu (cesta c) chybí: tu může nahrát jen člověk, a vybírá se až podle
toho, kdo by Klíčkovi hlas propůjčil.

## Porovnání cest

### a) Lepší výběr systémových hlasů (Web Speech API)

Dnešní stav, který jde ještě vylepšit: preferovat stažené „Premium/Enhanced“ hlasy (už to dělá
`NATURAL`), na Androidu hlas Google, v Edge online hlasy „Microsoft Vlasta Online (Natural)“.

- **Čeština:** podle zařízení. iPad: Zuzana (základní je strojová, Premium/Enhanced výrazně lepší,
  ale rodič ji musí stáhnout v Nastavení → Zpřístupnění → Mluvený obsah). Android: hlas Google,
  slušný. Chrome na desktopu nemá vlastní český hlas, použije systémový. Edge má neurální Vlastu,
  ale jen online.
- **Angličtina:** obvykle dobrá (Samantha/Ava na Apple, Google, Microsoft).
- **Offline/PWA:** funguje offline s lokálními hlasy, nic se necachuje, velikost appky 0.
- **Cena, licence:** zdarma, hlas patří zařízení.
- **Soukromí:** lokální hlasy nic neposílají. **Online hlasy v Edge posílají text Microsoftu**
  (u nás jen zadání, žádná data dítěte, ale je to volání ven, o kterém appka neví). `pickVoice`
  je dnes preferuje díky slovu „Natural“. Detail pro navazující issue: lokální hlas
  (`localService`) mít před online.
- **Údržba:** nulová, nová hra nebo text funguje hned.
- **Slabina:** nejde zaručit, jak Klíček zní. Hlas se liší mezi zařízeními a základní česká Zuzana
  zní strojově (ukázka 1). Ovlivnit jde jen tempo a výška.

### b) Neurální TTS

Dvě varianty: **b1 předgenerovat při buildu** (texty se převedou na soubory a přibalí), nebo
**b2 za běhu** přes službu (appka pošle text a dostane zvuk).

Kandidáti:

| Služba | Čeština | Licence výstupu | Cena |
|---|---|---|---|
| Azure AI Speech | Vlasta (ženský), Antonín (mužský), neurální | Placený tarif S0 dovoluje komerční užití výstupu. Free F0 (0,5 mil. znaků/měs.) je podle Microsoftu na zkoušení. Vyžaduje upozornit, že jde o syntetický hlas. | Platí se za znaky. Náš objem je tisíce znaků, tedy centy. |
| Google Cloud TTS | Standard, WaveNet, Chirp 3 HD uvádí cs-CZ | komerční užití v rámci podmínek GCP | Chirp 3 HD má 1 mil. znaků/měs. zdarma. Placená cena se v ceníku liší podle verze stránky, je třeba ověřit. |
| ElevenLabs | Multilingual model umí češtinu | komerční licence až od placeného Starter (~5–6 USD/měs.), jen pro audio vytvořené během předplatného | malé předplatné |
| Piper (open-source, offline) | jen mužský „jirka“ | repozitář hlasů MIT, licence dat hlasu nepotvrzená | zdarma |

Pro Klíčka vychází nejlépe **Azure Vlasta**: ženský, klidný a stejný dodavatel má odpovídající
anglické hlasy (Ava, Jenny, Sonia). Piper nemá český ženský hlas. Google je rovnocenná záloha,
pokud by Vlasta nezněla dobře.

**b1, předgenerované při buildu**

- **Čeština, angličtina:** výborná a na všech zařízeních stejná (ukázky 2 a 3).
- **Offline/PWA:** soubory jdou do precache Workboxu (`vite.config.ts`, `globPatterns`).
  Velikost: věta má ~3–7 s. AAC mono 32 kb/s je ~4 kB/s, tedy ~15–25 kB na větu. 100 vět
  na jazyk vychází ~2 MB na jazyk. Precache se stahuje jednou, při aktualizaci jen změněné
  soubory.
- **Cena, licence:** placený tarif Azure S0 kvůli právům k výstupu, generuje se jen při změně
  textu. Cena je zanedbatelná. Je třeba přidat poznámku „hlas je syntetický“ (třeba do
  informací pro rodiče).
- **Soukromí:** za běhu nic neodchází, text jde k Microsoftu jen při buildu a jsou to texty
  z repa.
- **Údržba:** nová hra nebo věta znamená spustit skript, který najde chybějící soubory
  a dogeneruje je. Klíč k Azure je potřeba jen tomu, kdo generuje (lokálně nebo v CI jako
  secret). Test hlídá, že každá pevná věta má svůj soubor. Když soubor chybí, appka nespadne,
  jen přečte systémovým hlasem.

**b2, za běhu přes službu**

- Kvalita stejná jako b1, pokryje i libovolný text.
- **Offline nefunguje** (nebo jen to, co se už jednou přehrálo), což je pro PWA a tablet
  v autě slabé.
- **Soukromí:** každé ťuknutí pošle text a IP adresu tabletu cizímu serveru. Klíč by navíc
  nesměl být v klientovi, takže by appka potřebovala vlastní backend nebo proxy. Ten dnes
  nemá a byl by to nový provozovaný kus infrastruktury.
- **Cena:** roste s počtem dětí, ne s počtem textů.
- **Závěr:** nevyplatí se. Zadání známe předem.

### c) Nahraný lidský hlas

- **Čeština, angličtina:** nejpřirozenější a nejvíc „Klíček“, pokud je mluvčí dobrý.
  Angličtina potřebuje rodilého mluvčího, nebo jiný hlas než čeština.
- **Offline/PWA:** stejné jako b1 (soubory v precache), velikost stejná.
- **Cena, licence:** vlastní nahrávka (rodič, kamarád) nic nestojí, ale potřebuje písemný
  souhlas s užitím hlasu v appce. Profesionální mluvčí stojí jednotky tisíc Kč za session.
- **Soukromí:** nic neodchází.
- **Údržba:** nejtěžší. Každá nová věta znamená znovu nahrávat, ideálně stejným hlasem,
  ve stejné místnosti a stejném mikrofonu. Bez toho věty nesedí k sobě. Pro rychle rostoucí
  počet her to brzdí vývoj.
- **Dynamické texty:** skládání z kousků jde (čísla se nahrají jednou), ale nahrávat se musí
  pečlivě kvůli intonaci.

### Shrnutí

| | a) systémový | b1) neurální předem | b2) neurální za běhu | c) lidský |
|---|---|---|---|---|
| Kvalita CZ | kolísá, často strojová | velmi dobrá, všude stejná | velmi dobrá | nejlepší |
| Kvalita EN | dobrá | velmi dobrá | velmi dobrá | podle mluvčího |
| Offline | ano | ano (precache) | ne | ano (precache) |
| Velikost appky | 0 | ~2 MB / jazyk / 100 vět | 0 | ~2 MB / jazyk / 100 vět |
| Cena | 0 | centy, placený tarif Azure | roste s uživateli, backend | 0 až tisíce Kč |
| Data ven za běhu | ne (Edge online ano) | ne | ano | ne |
| Údržba nové věty | žádná | spustit skript | žádná | nahrávat |

## Dynamické texty

Generovaná zadání jako „Kolik je 3 plus 4?“ nejde předgenerovat celá. Sčítání má 961 kombinací
na jazyk a další hry přidají víc. Řešení ve třech patrech, od nejlepšího:

1. **Pevná věta:** celý soubor (polyomino, nápověda).
2. **Šablona složená z kousků:** hra kromě textu vrátí i seznam kousků, např.
   `['kolik-je', 'n-3', 'plus', 'n-4-konec']`. Čísla se generují dvakrát, uprostřed věty a na
   konci otázky („…čtyři?“), protože intonace se liší. U sčítání do 30 je to ~2 + 31 × 2 = 64
   souborů na jazyk místo 961. Přehrávají se za sebou bez mezer. Česká pravidla (tvary
   „jeden/jedna“, skloňování) řeší autor šablony a funkce, která kousky vybírá, je čistá
   a testovatelná.
3. **Záloha:** chybí-li kterýkoli kousek, přečte se celá věta systémovým hlasem (#13). Nikdy se
   nekombinuje polovina neurálním a polovina systémovým hlasem.

Skládání stojí za to až u her, které opravdu přijdou. Pro první krok stačí patra 1 a 3:
polyomino a nápověda dostanou neurální hlas, ostatní zůstane jako dnes.

## Doporučení

**Cesta b1: neurální hlas Azure Vlasta (EN: Ava nebo Jenny), předgenerovaný při buildu, se
systémovým hlasem jako zálohou.**

Proč:
- Klíček zní na každém tabletu stejně a vlídně, což cesta a) zaručit nemůže.
- Za běhu nic neodchází a funguje offline, na rozdíl od b2.
- Nová věta stojí jeden příkaz, ne nahrávání jako u c).
- Kód z #13 zůstává jako záloha beze změny chování.

Nastavení hlasu: podle ukázky 3 (tempo −20 %, mírně níž). Finální volba je na poslechu, viz
[Ukázky](#ukázky).

Fallback, tedy co když audio chybí:
- **soubor pro text neexistuje** (nová hra, nepřegenerováno): přečte systémový hlas jako dnes;
- **zařízení je offline a soubor není v cache** (první spuštění bez sítě): systémový hlas;
- **přehrání selže** (chyba dekódování, přerušení): systémový hlas, bez chybové hlášky dítěti;
- **systémový hlas také chybí:** tlačítko reproduktoru se neukáže (dnešní chování).

Lidský hlas (c) zůstává otevřený pro pár pevných vět s osobností, např. pozdrav Klíčka,
pokud se najde mluvčí. Nemá ale nést všechna zadání.

Odložené otázky pro implementaci:
- tarif Azure S0 a kdo drží klíč (lokálně u vývojáře, nebo secret v CI);
- formát souborů (AAC `.m4a`, přehraje Safari i Chrome) a jejich pojmenování (hash textu
  a hlasu, aby změna textu sama vynutila nový soubor);
- kde uvést, že hlas je syntetický;
- `pickVoice`: lokální hlas před online „Natural“ v Edge, aby záloha neposílala text ven.

## Zdroje

- Azure Speech, ceník a free tier: <https://azure.microsoft.com/pricing/details/cognitive-services/speech-services>
- Azure TTS, práva k výstupu (komunitní odpověď s citací Product Terms): <https://learn.microsoft.com/answers/a/12933078>
- Azure TTS, soukromí: <https://learn.microsoft.com/en-us/legal/cognitive-services/speech-service/text-to-speech/data-privacy-security>
- Google Cloud TTS, ceník: <https://cloud.google.com/text-to-speech/pricing>
- Google Chirp 3 HD, jazyky: <https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd>
- ElevenLabs, licence a ceny (sekundární přehled): <https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/>
- Piper, české hlasy: <https://huggingface.co/rhasspy/piper-voices/tree/v1.0.0/cs/cs_CZ>
- Online hlasy v Edge přes Web Speech API: <https://readium.org/speech/docs/WebSpeech.html>

Ceny a podmínky platí k 25. 11. 2026. Před nákupem tarifu je potřeba je ověřit na stránkách
dodavatele.
