# Evaluatie & Leerpad Verbetering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eerlijkere beoordeling in pyoefen via gesplitste evaluatie (concept vs. formatting), nieuw netwerk-topic, en cumulatieve leerpad-verwachtingen.

**Architecture:** Alle wijzigingen zitten in één bestand: `index.html`. Geen externe dependencies. De app draait als statische site op Netlify met een serverless Claude-proxy in `netlify/functions/ask.js`. Testen = manueel in browser via `netlify dev` of direct bestand openen.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, Claude Haiku API via Netlify Function

---

## Bestandsoverzicht

| Bestand | Wijzigingen |
|---------|-------------|
| `index.html` | Alle 5 taken — CSS, evaluatieprompts, topic data, UI |

---

## Task 1: CSS oranje state + evaluatieprompts + level-progressie

**Files:**
- Modify: `index.html:236-241` (CSS feedback states)
- Modify: `index.html:1324-1367` (submitAnswer prompt — Python variant)
- Modify: `index.html:1374` (submitAnswer correct-logica)
- Modify: `index.html:1375-1376` (submitAnswer UI klasse + titel)
- Modify: `index.html:1523-1541` (submitMcCodeAnswer prompt)
- Modify: `index.html:1547` (submitMcCodeAnswer correct-logica)
- Modify: `index.html:1549-1550` (submitMcCodeAnswer UI)
- Modify: `index.html:2570-2588` (submitFollowupPractice prompt)
- Modify: `index.html:2594` (submitFollowupPractice correct-logica)
- Modify: `index.html:2596-2597` (submitFollowupPractice UI)
- Modify: `index.html:2708-2714` (submitWaaromPatroon prompt)
- Modify: `index.html:2720` (submitWaaromPatroon correct-logica)
- Modify: `index.html:2722-2723` (submitWaaromPatroon UI)

- [ ] **Stap 1: CSS oranje state toevoegen**

Zoek in `index.html` naar regel 237 (`.feedback-box.correct`) en voeg een derde state toe direct na `.feedback-box.incorrect`:

```css
.feedback-box.correct { background: var(--success-dim); border-color: var(--success); }
.feedback-box.incorrect { background: var(--danger-dim); border-color: var(--danger); }
.feedback-box.partial { background: var(--warn-dim); border-color: var(--warn); }
```

Zoek naar regel 240-241 en voeg toe:

```css
.feedback-box.correct .feedback-title { color: var(--success); }
.feedback-box.incorrect .feedback-title { color: var(--danger); }
.feedback-box.partial .feedback-title { color: var(--warn); }
```

- [ ] **Stap 2: submitAnswer Python-prompt aanpassen (~regel 1348)**

Vervang het JSON-schema en de instructie in de Python-variant van de prompt:

**Oud:**
```js
Reageer UITSLUITEND met geldig JSON:
{
  "correct": true of false,
  "score": getal 0-100,
  "feedback": "2-4 zinnen feedback in het Nederlands: wat ging goed, wat kan beter",
  "toon_model": true of false (toon modelantwoord alleen als score < 70)
}`;
```

**Nieuw:**
```js
Beoordeel UITSLUITEND of de kandidaat het concept begrijpt en de logica correct is.
Variabelenamen, spacing, print-formatting en stijlkeuzes tellen NIET mee voor concept_correct.
Zet alleen_formatting op true als het antwoord inhoudelijk en logisch klopt maar de output-opmaak afwijkt.

Reageer UITSLUITEND met geldig JSON:
{
  "concept_correct": true of false,
  "score": getal 0-100,
  "alleen_formatting": true of false,
  "feedback": "2-4 zinnen feedback in het Nederlands: wat ging goed, wat kan beter",
  "toon_model": true of false
}`;
```

- [ ] **Stap 3: submitAnswer correct-logica + UI (~regel 1374)**

**Oud:**
```js
const correct = result.correct || result.score >= 70;
fb.className = 'feedback-box show ' + (correct ? 'correct' : 'incorrect');
document.getElementById('feedbackTitle').textContent = correct ? '✓ Goed gedaan!' : '✗ Nog niet helemaal';
```

**Nieuw:**
```js
const correct = result.concept_correct || result.score >= 60;
const partial = !correct && result.alleen_formatting;
const stateClass = correct ? 'correct' : partial ? 'partial' : 'incorrect';
const stateTitle = correct ? '✓ Goed gedaan!' : partial ? '✓ Concept klopt — kleine outputverschillen' : '✗ Nog niet helemaal';
fb.className = 'feedback-box show ' + stateClass;
document.getElementById('feedbackTitle').textContent = stateTitle;
```

Dan ook de `saveProgress`-aanroep net eronder: vervang `correct` door `correct || partial` zodat oranje ook telt voor voortgang:

**Oud (~regel 1395):**
```js
saveProgress(selectedTopic, currentQuestion.vraagtype || '', correct, result.score, currentQuestion.vraag, 'code');
```

**Nieuw:**
```js
saveProgress(selectedTopic, currentQuestion.vraagtype || '', correct || partial, result.score, currentQuestion.vraag, 'code');
```

- [ ] **Stap 4: submitMcCodeAnswer prompt aanpassen (~regel 1523)**

**Oud:**
```js
Reageer UITSLUITEND met geldig JSON:
{
  "correct": true of false,
  "score": getal 0-100,
  "feedback": "2-4 zinnen feedback in het Nederlands",
  "toon_model": true of false
}`;
```

**Nieuw:**
```js
Beoordeel UITSLUITEND of de kandidaat het concept begrijpt en de logica correct is.
Variabelenamen, spacing, print-formatting en stijlkeuzes tellen NIET mee voor concept_correct.
Zet alleen_formatting op true als het antwoord inhoudelijk en logisch klopt maar de output-opmaak afwijkt.

Reageer UITSLUITEND met geldig JSON:
{
  "concept_correct": true of false,
  "score": getal 0-100,
  "alleen_formatting": true of false,
  "feedback": "2-4 zinnen feedback in het Nederlands",
  "toon_model": true of false
}`;
```

- [ ] **Stap 5: submitMcCodeAnswer correct-logica + UI (~regel 1547)**

**Oud:**
```js
const correct = result.correct || result.score >= 70;
fb.className = 'feedback-box show ' + (correct ? 'correct' : 'incorrect');
document.getElementById('mcCodeFeedbackTitle').textContent = correct ? '✓ Goed gedaan!' : '✗ Nog niet helemaal';
```

**Nieuw:**
```js
const correct = result.concept_correct || result.score >= 60;
const partial = !correct && result.alleen_formatting;
const stateClass = correct ? 'correct' : partial ? 'partial' : 'incorrect';
const stateTitle = correct ? '✓ Goed gedaan!' : partial ? '✓ Concept klopt — kleine outputverschillen' : '✗ Nog niet helemaal';
fb.className = 'feedback-box show ' + stateClass;
document.getElementById('mcCodeFeedbackTitle').textContent = stateTitle;
```

Dan ook saveProgress net eronder:

**Oud (~regel 1558):**
```js
saveProgress(selectedTopic, currentMcQuestion?.onderwerp || '', correct, result.score, q.vraag, 'mc-code');
```

**Nieuw:**
```js
saveProgress(selectedTopic, currentMcQuestion?.onderwerp || '', correct || partial, result.score, q.vraag, 'mc-code');
```

- [ ] **Stap 6: submitFollowupPractice prompt aanpassen (~regel 2570)**

Zelfde vervanging als stap 4 — vervang het JSON-schema en voeg de beoordeling-instructie toe boven het schema.

- [ ] **Stap 7: submitFollowupPractice correct-logica + UI (~regel 2594)**

Zelfde vervanging als stap 5:

```js
const correct = result.concept_correct || result.score >= 60;
const partial = !correct && result.alleen_formatting;
const stateClass = correct ? 'correct' : partial ? 'partial' : 'incorrect';
const stateTitle = correct ? '✓ Goed gedaan!' : partial ? '✓ Concept klopt — kleine outputverschillen' : '✗ Nog niet helemaal';
fb.className = 'feedback-box show ' + stateClass;
document.getElementById('followupPracticeFeedbackTitle').textContent = stateTitle;
```

saveProgress net eronder:

**Oud (~regel 2605):**
```js
saveProgress(lastFollowupContext.topic, lastFollowupContext.vraag, correct, result.score, currentFollowupPracticeQuestion.vraag, 'followup');
```

**Nieuw:**
```js
saveProgress(lastFollowupContext.topic, lastFollowupContext.vraag, correct || partial, result.score, currentFollowupPracticeQuestion.vraag, 'followup');
```

- [ ] **Stap 8: submitWaaromPatroon prompt aanpassen (~regel 2708)**

**Oud:**
```js
Reageer UITSLUITEND met geldig JSON:
{
  "correct": true of false,
  "score": getal 0-100,
  "feedback": "2-4 zinnen feedback in het Nederlands over het begrip van het patroon en de keuze",
  "toon_model": true of false
}`;
```

**Nieuw:**
```js
Beoordeel UITSLUITEND of de kandidaat het concept begrijpt en de motivatie voor de keuze correct is.
Variabelenamen en exacte formulering tellen NIET mee voor concept_correct — begrip en redenering wel.
Zet alleen_formatting op true als de redenering klopt maar de formulering afwijkt van het voorbeeldantwoord.

Reageer UITSLUITEND met geldig JSON:
{
  "concept_correct": true of false,
  "score": getal 0-100,
  "alleen_formatting": true of false,
  "feedback": "2-4 zinnen feedback in het Nederlands over het begrip van het patroon en de keuze",
  "toon_model": true of false
}`;
```

- [ ] **Stap 9: submitWaaromPatroon correct-logica + UI (~regel 2720)**

**Oud:**
```js
const correct = result.correct || result.score >= 70;
fb.className = 'feedback-box show ' + (correct ? 'correct' : 'incorrect');
document.getElementById('waaromFeedbackTitle').textContent = correct ? '✓ Goed begrip!' : '✗ Niet volledig';
```

**Nieuw:**
```js
const correct = result.concept_correct || result.score >= 60;
const partial = !correct && result.alleen_formatting;
const stateClass = correct ? 'correct' : partial ? 'partial' : 'incorrect';
const stateTitle = correct ? '✓ Goed begrip!' : partial ? '✓ Concept klopt — formulering iets anders' : '✗ Niet volledig';
fb.className = 'feedback-box show ' + stateClass;
document.getElementById('waaromFeedbackTitle').textContent = stateTitle;
```

saveProgress net eronder:

**Oud (~regel 2735):**
```js
saveProgress(selectedTopic, currentWaaromQuestion.concept, correct, result.score, currentWaaromQuestion.vraag, 'theorie-code');
```

**Nieuw:**
```js
saveProgress(selectedTopic, currentWaaromQuestion.concept, correct || partial, result.score, currentWaaromQuestion.vraag, 'theorie-code');
```

- [ ] **Stap 10: Manueel verifiëren**

Open `index.html` in browser (of via `netlify dev`). Beantwoord een vraag met inhoudelijk correct antwoord maar andere variabelenamen. Verwacht: oranje feedback-box met tekst "✓ Concept klopt — kleine outputverschillen".

- [ ] **Stap 11: Commit**

```bash
git add index.html
git commit -m "feat: split evaluatie in concept_correct + alleen_formatting, oranje UI state"
```

---

## Task 2: Basics topicContext versoepelen

**Files:**
- Modify: `index.html:1005` (basics entry in topicContexts)

- [ ] **Stap 1: basics context aanpassen**

Zoek op regel 1005 naar de `basics` entry in `topicContexts`. Vervang de gehele regel:

**Oud:**
```js
basics: 'Python basisvaardigheden: functies, loops, if/else, lijsten, dicts, strings, f-strings, rekenoperaties, print. Context: verwerken van trade berichten, configuratie bestanden en API responses in een trading omgeving.\nGEBRUIK WEL: functies, loops, if/else, lijsten, dicts, strings, f-strings, rekenoperaties, print\nGEBRUIK NIET: type hints, imports, klassen, list comprehensions, exceptions, decorators, regex',
```

**Nieuw:**
```js
basics: 'Python basisvaardigheden: functies, loops, if/else, lijsten, dicts, strings, f-strings, type hints, list comprehensions, generator functies, rekenoperaties, print. Context: verwerken van trade berichten, configuratie bestanden en API responses in een trading omgeving.\nGEBRUIK WEL: functies, loops, if/else, lijsten, dicts, strings, f-strings, type hints, list comprehensions, generator functies, rekenoperaties, print\nGEBRUIK NIET: klassen, imports (behalve typing), decorators, async, regex',
```

- [ ] **Stap 2: Manueel verifiëren**

Selecteer topic "Python basics", stel een vraag. Schrijf een antwoord met type hints (`def fn(x: int) -> list:`). Verwacht: geen afkeuring wegens type hints.

- [ ] **Stap 3: Commit**

```bash
git add index.html
git commit -m "feat: basics topic staat type hints en list comprehensions toe"
```

---

## Task 3: Nieuw topic `netwerk` toevoegen

**Files:**
- Modify: `index.html:969-986` (TOPIC_LABELS — netwerk toevoegen)
- Modify: `index.html:987` (TOPIC_ICONS — netwerk toevoegen)
- Modify: `index.html:989-996` (LEERPAD_LEVELS — level 2 uitbreiden)
- Modify: `index.html:999-1016` (topicContexts — netwerk toevoegen)
- Modify: `index.html:1018-1035` (topicVraagtypen — netwerk toevoegen)
- Modify: `index.html:1577-1782` (mcOnderwerpenPerTopic — netwerk toevoegen)
- Modify: `index.html:450-562` (setup screen topic lijst — netwerk optie toevoegen)

- [ ] **Stap 1: TOPIC_LABELS**

Voeg toe na `reliability: 'Reliability patterns'` op regel 985:

```js
netwerk: 'Netwerk & TCP/IP',
```

- [ ] **Stap 2: TOPIC_ICONS**

Voeg toe aan het TOPIC_ICONS object op regel 987 (voor de sluitende `}`):

```js
netwerk: '🌐',
```

Let op: `websocket` gebruikt ook `🌐` — verander `netwerk` naar `🔗` om onderscheid te maken:

```js
netwerk: '🔗',
```

- [ ] **Stap 3: LEERPAD_LEVELS level 2 uitbreiden**

**Oud (~regel 992):**
```js
{ niveau: 2, naam: 'Buitenwereld & logs',     emoji: '🌍', topics: ['sre', 'regex', 'linux', 'logs'] },
```

**Nieuw:**
```js
{ niveau: 2, naam: 'Buitenwereld & logs',     emoji: '🌍', topics: ['sre', 'regex', 'linux', 'logs', 'netwerk'] },
```

- [ ] **Stap 4: topicContexts — netwerk toevoegen**

Voeg toe na de `reliability` entry (~regel 1015), voor de sluitende `}`:

```js
netwerk: 'Python netwerk programmering en TCP/IP basiskennis: socket module, TCP verbindingen opzetten en monitoren, health checks schrijven, connection timeouts instellen, socket states herkennen (TIME_WAIT, CLOSE_WAIT), UDP vs TCP in trading context, netwerk-problemen diagnosticeren vanuit Python (latency meten, connectiviteit testen, poort beschikbaarheid checken). Context: trading systemen die verbinding maken met exchanges via TCP, health check scripts voor exchange connectors.\nGEBRUIK WEL: socket, asyncio TCP clients, subprocess met ss/netstat, time.perf_counter voor latency\nGEBRUIK NIET: websockets library, pandas, ML',
```

- [ ] **Stap 5: topicVraagtypen — netwerk toevoegen**

Voeg toe na de `reliability` entry (~regel 1034), voor de sluitende `}`:

```js
netwerk: ['TCP health check schrijven met socket', 'connection timeout instellen en afhandelen', 'TCP vs UDP kiezen voor trading berichten', 'socket state detecteren met ss via subprocess', 'latency meten tussen twee hosts', 'poort beschikbaarheid controleren', 'reconnect logica voor TCP verbinding', 'meerdere hosts parallel pingen', 'TIME_WAIT storm herkennen en verklaren', 'netwerk partitie simuleren en detecteren'],
```

- [ ] **Stap 6: mcOnderwerpenPerTopic — netwerk toevoegen**

Zoek de sluitende `};` van `mcOnderwerpenPerTopic` (~regel 1782). Voeg toe voor die sluitende `}`:

```js
netwerk: [
  'TCP vs UDP: wanneer gebruik je welke in een trading systeem',
  'Wat is een socket en hoe gebruik je hem in Python',
  'Connection timeout vs read timeout: verschil en instelling',
  'Wat betekent TIME_WAIT en wanneer is het een probleem',
  'Hoe schrijf je een TCP health check in Python',
  'Verschil tussen blocking en non-blocking sockets',
  'Wat is de rol van het socket backlog parameter',
  'Hoe herken je een netwerk partitie in je applicatie',
  'Waarom gebruik je asyncio voor TCP verbindingen in trading',
  'Hoe meet je end-to-end netwerk latency vanuit Python'
],
```

- [ ] **Stap 7: Setup screen — netwerk optie toevoegen in HTML**

Zoek naar de `reliability` optie in de setup screen HTML (~regel 555-561):

```html
<label class="option-item" onclick="selectTopic(this,'reliability')">
  <div class="option-dot"></div>
  <div>
    <div class="option-label">Reliability patterns</div>
    <div class="option-sub">retry, circuit breaker, graceful shutdown</div>
  </div>
</label>
```

Voeg erna toe:

```html
<label class="option-item" onclick="selectTopic(this,'netwerk')">
  <div class="option-dot"></div>
  <div>
    <div class="option-label">Netwerk & TCP/IP</div>
    <div class="option-sub">sockets, health checks, TCP diagnostics</div>
  </div>
</label>
```

- [ ] **Stap 8: Manueel verifiëren**

Herlaad de app. Controleer:
1. "Netwerk & TCP/IP" verschijnt in de topic-lijst op het setup-scherm
2. In het Leerpad staat het onder level 2
3. Selecteer het topic en start een vraag — Claude genereert een netwerk-gerelateerde vraag

- [ ] **Stap 9: Commit**

```bash
git add index.html
git commit -m "feat: voeg netwerk topic toe aan level 2 (TCP/IP, sockets, health checks)"
```

---

## Task 4: CUMULATIEVE_CONCEPTEN lookup-tabel + evaluatieprompts

**Files:**
- Modify: `index.html:989` (na LEERPAD_LEVELS — lookup-tabel toevoegen)
- Modify: `index.html:1348` (submitAnswer Python-prompt — cumulatieve context meegeven)
- Modify: `index.html:1523` (submitMcCodeAnswer prompt)
- Modify: `index.html:2570` (submitFollowupPractice prompt)
- Modify: `index.html:2708` (submitWaaromPatroon prompt)

- [ ] **Stap 1: CUMULATIEVE_CONCEPTEN tabel toevoegen**

Zoek na `LEERPAD_LEVELS` array (~regel 996) en voeg toe:

```js
const CUMULATIEVE_CONCEPTEN = {
  0: [],
  1: ['type hints', 'list comprehensions', 'f-strings', 'generator functies'],
  2: ['type hints', 'list comprehensions', 'f-strings', 'generator functies',
      'custom exceptions', 'dataclasses', 'OOP patronen'],
  3: ['type hints', 'list comprehensions', 'f-strings', 'generator functies',
      'custom exceptions', 'dataclasses', 'OOP patronen',
      'subprocess', 'regex', 'logging', 'context managers', 'TCP socket basics'],
  4: ['type hints', 'list comprehensions', 'f-strings', 'generator functies',
      'custom exceptions', 'dataclasses', 'OOP patronen',
      'subprocess', 'regex', 'logging', 'context managers', 'TCP socket basics',
      'asyncio', 'websocket', 'pandas', 'numpy'],
  5: ['type hints', 'list comprehensions', 'f-strings', 'generator functies',
      'custom exceptions', 'dataclasses', 'OOP patronen',
      'subprocess', 'regex', 'logging', 'context managers', 'TCP socket basics',
      'asyncio', 'websocket', 'pandas', 'numpy',
      'reliability patterns', 'kubernetes client', 'prometheus queries', 'linux performance analyse']
};
```

- [ ] **Stap 2: hulpfunctie voor cumulatieve context**

Voeg toe direct na de `CUMULATIEVE_CONCEPTEN` tabel:

```js
function getCumulatiefBlok(topic) {
  const level = LEERPAD_LEVELS.findIndex(lvl => lvl.topics.includes(topic));
  const concepten = CUMULATIEVE_CONCEPTEN[level] || [];
  if (concepten.length === 0) return '';
  return `\nDe kandidaat heeft de volgende concepten al geleerd en moet ze toepassen waar van toepassing: ${concepten.join(', ')}. Geef een lagere score als hij onnodige alternatieven gebruikt — bijv. een for-loop waar een list comprehension hoort, of geen type hints waar ze relevant zijn.\n`;
}
```

- [ ] **Stap 3: submitAnswer Python-prompt uitbreiden**

Zoek in `submitAnswer` de regel `const prompt = isLinuxPerfQ` (~regel 1324). Voeg boven de prompt-definitie toe:

```js
const cumulatiefBlok = getCumulatiefBlok(selectedTopic);
```

Dan in de Python-variant van de prompt, voeg het blok toe na de beoordelingscriteria en voor het antwoord van de kandidaat:

**Oud:**
```js
Antwoord van kandidaat:
${answer}
```

**Nieuw:**
```js
${cumulatiefBlok}
Antwoord van kandidaat:
${answer}
```

- [ ] **Stap 4: submitMcCodeAnswer prompt uitbreiden**

Zoek `submitMcCodeAnswer` (~regel 1499). Voeg boven de prompt-definitie toe:

```js
const cumulatiefBlok = getCumulatiefBlok(selectedTopic);
```

Voeg `${cumulatiefBlok}` toe in de prompt op dezelfde positie als stap 3 (na criteria, voor antwoord kandidaat).

- [ ] **Stap 5: submitFollowupPractice prompt uitbreiden**

Zoek `submitFollowupPractice` (~regel 2540). Zelfde aanpak: voeg `const cumulatiefBlok = getCumulatiefBlok(lastFollowupContext.topic);` toe en verwerk in de prompt.

- [ ] **Stap 6: submitWaaromPatroon prompt uitbreiden**

Zoek `submitWaaromPatroon` (~regel 2680). Zelfde aanpak: voeg `const cumulatiefBlok = getCumulatiefBlok(selectedTopic);` toe en verwerk in de prompt.

- [ ] **Stap 7: Manueel verifiëren**

Ga naar level 3+ topic (bijv. asyncio). Schrijf een antwoord zonder type hints. Verwacht: feedback merkt op dat type hints worden verwacht. Schrijf zelfde antwoord mét type hints — hogere score.

- [ ] **Stap 8: Commit**

```bash
git add index.html
git commit -m "feat: cumulatieve concepten meegeven aan evaluatieprompts per level"
```

---

## Task 5: Level-labels (Beginner/Moderate/Expert) in UI

**Files:**
- Modify: `index.html:989-996` (LEERPAD_LEVELS — label veld toevoegen)
- Modify: `index.html:2290-2298` (renderLeerpad HTML — label tonen)

- [ ] **Stap 1: label toevoegen aan LEERPAD_LEVELS**

**Oud:**
```js
const LEERPAD_LEVELS = [
  { niveau: 0, naam: 'Bouwstenen',              emoji: '🐍', topics: ['basics'] },
  { niveau: 1, naam: 'Structuur',               emoji: '🏗️', topics: ['exceptions', 'oop', 'dataclasses'] },
  { niveau: 2, naam: 'Buitenwereld & logs',     emoji: '🌍', topics: ['sre', 'regex', 'linux', 'logs', 'netwerk'] },
  { niveau: 3, naam: 'Gelijktijdigheid & data', emoji: '🔄', topics: ['asyncio', 'websocket', 'pandas'] },
  { niveau: 4, naam: 'Reliability',             emoji: '🛡️', topics: ['reliability', 'kubernetes', 'prometheus', 'linux_perf'] },
  { niveau: 5, naam: 'ML in productie',         emoji: '📉', topics: ['backtesting'] }
];
```

**Nieuw:**
```js
const LEERPAD_LEVELS = [
  { niveau: 0, naam: 'Bouwstenen',              emoji: '🐍', label: 'Beginner',  topics: ['basics'] },
  { niveau: 1, naam: 'Structuur',               emoji: '🏗️', label: 'Beginner',  topics: ['exceptions', 'oop', 'dataclasses'] },
  { niveau: 2, naam: 'Buitenwereld & logs',     emoji: '🌍', label: 'Moderate',  topics: ['sre', 'regex', 'linux', 'logs', 'netwerk'] },
  { niveau: 3, naam: 'Gelijktijdigheid & data', emoji: '🔄', label: 'Moderate',  topics: ['asyncio', 'websocket', 'pandas'] },
  { niveau: 4, naam: 'Reliability',             emoji: '🛡️', label: 'Expert',    topics: ['reliability', 'kubernetes', 'prometheus', 'linux_perf'] },
  { niveau: 5, naam: 'ML in productie',         emoji: '📉', label: 'Expert',    topics: ['backtesting'] }
];
```

- [ ] **Stap 2: label tonen in renderLeerpad**

Zoek in `renderLeerpad` de HTML-template voor een level (~regel 2290). Zoek naar:

```js
<div class="leerpad-level-sub">Niveau ${lvl.niveau}</div>
```

Vervang door:

```js
<div class="leerpad-level-sub">Niveau ${lvl.niveau} · <span style="color:var(--accent);font-weight:600">${lvl.label}</span></div>
```

- [ ] **Stap 3: Manueel verifiëren**

Open het Leerpad-scherm. Elk level toont nu "Niveau 0 · **Beginner**", "Niveau 2 · **Moderate**", etc.

- [ ] **Stap 4: Commit**

```bash
git add index.html
git commit -m "feat: toon Beginner/Moderate/Expert labels op leerpad levels"
```

---

## Eindverificatie

- [ ] Open de app volledig opnieuw (hard refresh)
- [ ] Beantwoord een basics-vraag met type hints → verwacht: geen afkeuring
- [ ] Beantwoord een vraag met correct concept maar verkeerde formatting → verwacht: oranje state, telt mee voor level
- [ ] Controleer Leerpad: netwerk staat in level 2, labels zijn zichtbaar
- [ ] Beantwoord een level 3+ vraag zonder eerder geleerde concepten → verwacht: feedback over missende type hints / comprehensions
- [ ] Deploy naar Netlify: `git push origin main`
