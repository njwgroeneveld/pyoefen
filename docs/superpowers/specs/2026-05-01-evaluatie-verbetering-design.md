# Design: Pyoefen Evaluatie & Leerpad Verbetering

**Datum:** 2026-05-01  
**Doel:** Eerlijkere beoordeling, realistisch leerpad, aansluiting op IMC Trading Reliability Engineer vacature

---

## Achtergrond

Niels bereidt zich voor op de TRE-rol bij IMC Trading. De pyoefen-app stelt Python-vragen via Claude (Haiku). Twee kernproblemen:

1. De beoordeling is te streng — antwoorden die inhoudelijk kloppen worden afgekeurd vanwege output-formatting of variabelenamen
2. Level 0 (basics) is kunstmatig beperkt — type hints en list comprehensions zijn verboden, terwijl IMC die juist verwacht

---

## Moeilijkheidsgraad voor IMC TRE

| Label | Levels | Wat IMC verwacht |
|-------|--------|-----------------|
| Beginner | 0–1 | Schone functies, type hints, exceptions, dataclasses |
| Moderate | 2–3 | Productie-scripts, subprocess, regex, asyncio, pandas — minimaal vereist bij instroom |
| Expert | 4 | Reliability patterns, Kubernetes, Prometheus, Linux performance — wat IMC echt zoekt |

Level 5 (backtesting) blijft ongewijzigd voor nu.

---

## Wijziging 1 — Gesplitste evaluatieprompt

### Huidig JSON-schema
```json
{ "correct": true/false, "score": 0-100, "feedback": "...", "toon_model": true/false }
```

### Nieuw JSON-schema
```json
{
  "concept_correct": true/false,
  "score": 0-100,
  "alleen_formatting": true/false,
  "feedback": "...",
  "toon_model": true/false
}
```

### Nieuwe instructie in de prompt
> "Beoordeel UITSLUITEND of de kandidaat het concept begrijpt en de logica correct is. Variabelenamen, spacing, print-formatting en stijlkeuzes tellen NIET mee voor concept_correct. Zet alleen_formatting op true als het antwoord inhoudelijk klopt maar de output-opmaak afwijkt."

### Aangepaste level-progressie logica
```js
// Oud
const correct = result.correct || result.score >= 70;

// Nieuw
const correct = result.concept_correct || result.score >= 60;
```

**Raakt drie plekken in de code:**
- Code-evaluatie (~regel 1523)
- Followup-evaluatie (~regel 2570)
- Waarom-beoordeling (~regel 2692)

---

## Wijziging 2 — UI: drie feedback-states

| State | Kleur | Conditie | Telt mee voor level |
|-------|-------|----------|-------------------|
| Correct | Groen | concept_correct + score hoog | Ja |
| Concept klopt | Oranje | alleen_formatting = true | Ja |
| Incorrect | Rood | concept_correct = false | Nee |

Tekst oranje state: *"✓ Concept klopt — kleine outputverschillen"*

---

## Wijziging 3 — Basics topic versoepeld

### Huidig (GEBRUIK NIET)
```
type hints, imports, klassen, list comprehensions, exceptions, decorators, regex
```

### Nieuw (GEBRUIK WEL)
```
functies, loops, if/else, lijsten, dicts, strings, f-strings,
type hints, list comprehensions, rekenoperaties, print
```

### Nieuw (GEBRUIK NIET)
```
klassen, imports (behalve typing), decorators, async, regex
```

---

## Wijziging 4 — Nieuw topic: `netwerk` (level 2)

**Reden:** Vacature vereist "basic understanding of TCP/IP protocols". Huidige app dekt dit niet expliciet.

**Inhoud:** TCP health checks schrijven, socket timeouts instellen, connection state detecteren, netwerk-problemen diagnosticeren vanuit Python (`socket` module, `asyncio` TCP-clients).

**Plaatsing:** Level 2 wordt: `sre, regex, linux, logs, netwerk`

---

## Wijziging 5 — Cumulatieve verwachtingen per level

Elk level's evaluatieprompt krijgt een blok met eerder geleerde concepten die **verwacht** worden:

> "De kandidaat heeft de volgende concepten al geleerd en moet ze toepassen waar van toepassing: [lijst]. Geef een lagere score als hij onnodige alternatieven gebruikt — bijv. een for-loop waar een comprehension hoort, of geen type hints waar ze relevant zijn."

### Lookup-tabel (toe te voegen in de code)

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

---

## Wijziging 6 — Level-labels in UI

| Level | Naam | Label |
|-------|------|-------|
| 0 | Bouwstenen | Beginner |
| 1 | Structuur | Beginner |
| 2 | Buitenwereld & logs | Moderate |
| 3 | Gelijktijdigheid & data | Moderate |
| 4 | Reliability | Expert |
| 5 | ML in productie | Expert |

---

## NumPy

NumPy is momenteel stil samengevoegd met het pandas-topic. Geen aparte wijziging nodig — wel zichtbaar maken als subtopic in de UI van het pandas-blok op level 3.

---

## Tijdsinschatting leerpad

| Fase | Duur (1-2u/dag) |
|------|----------------|
| Level 0-1 (Beginner) | ~2-4 weken |
| Level 2-3 (Moderate) | ~2-3 maanden |
| Level 4 (Expert) | ~2-3 maanden + hands-on |
| **Totaal** | **~6 maanden** |

Naast de app aanbevolen: minikube lokaal draaien, eigen reliability scripts schrijven, TRE-coach voor scenario-vragen.

---

## Overzicht gewijzigde bestanden

| Bestand | Wijzigingen |
|---------|-------------|
| `index.html` | Evaluatieprompts (3x), level-progressie logica (3x), basics topicContext, nieuw netwerk topic + context, LEERPAD_LEVELS array, CUMULATIEVE_CONCEPTEN lookup-tabel, UI oranje state, level-labels |
