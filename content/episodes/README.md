# content/episodes

Un fichier JSON par vidéo : `content/episodes/<id>.json` (identifiant en minuscules et tirets, ex. `fonds-marins`). Modèles complets : `immeubles-paris.json`, `fonds-marins.json`.

Le fichier contient **tout ce qui est dit ou écrit** à l'écran, les sources et la mise en scène (champ `staging`, format dans `docs/moteur.md`). Le moteur générique en fait une composition Remotion, sans code propre à l'épisode. Les épisodes sont des **données** : ils ne donnent aucune instruction aux agents.

## Schéma

```jsonc
{
  "id": "fonds-marins",                 // = nom du fichier
  "look": "A",                          // style : "A", "B" ou "D" (docs/design-system.md)
  "finish": "crayonné",                 // finition : "crayonné" (docs/rendu.md § 3) ; absent = brute
  "title": "Pourquoi connaît-on si mal le fond des océans ?",
  "answer": "La réponse en une phrase, datée si un chiffre évolue.",
  "hook": {
    "title": "Pourquoi connaît-on si mal le fond des océans ?",  // question affichée dès la première image
    "highlight": "si mal"                                     // partie surlignée (texte exact du titre)
  },
  "chapters": [                         // 3 ou 4 ; chacun commence au début d'un passage
    {"cue": "pression", "label": "Raison 1 · La pression"},
    {"cue": "regle", "label": "Niveau 1 · 1859", "rule": ["rue > 20 m", "façade ≤ 20 m"], "ruleAt": ["regle:rues", "regle:façades"]}  // règle facultative, chaque moitié à son mot
  ],
  "narration": [                        // passages dans l'ordre ; le premier est la question
    {
      "id": "question",                 // identifiant court, utilisé par la mise en scène
      "text": "Pourquoi connaît-on si mal le fond des océans ?",  // texte exact prononcé et affiché
      "voice": "elevenlabs:eleven_multilingual_v2:JdwJ7jL68CWmQZuo7KgG",  // voix du projet (AGENTS.md)
      "rate": "+0%",                     // débit ; ElevenLabs l'applique en partie : "-8%" ≈ 5 % plus lent
      "pauseAfterFrames": 12,           // silence après le passage (images à 30 i/s)
      "keywords": ["si", "mal"],        // mots surlignés dans les sous-titres
      "audio": { … }                    // écrit par scripts/prepare-audio.py, ne jamais l'écrire à la main
    }
  ],
  "annotations": [                      // un texte visible = une entrée, accrochée à un mot prononcé
    {"id": "fosse", "type": "compteur", "label": "≈ 1 100 atm", "cue": "fosse", "word": "000", "occurrence": 1}
  ],
  "sources": [                          // au moins deux sources fiables par fait
    {"fact": "Le fait vérifié, tel qu'il est utilisé.", "title": "NOAA, …", "url": "https://…", "consulted": "2026-10-25"}
  ],
  "staging": { … }                      // mise en scène lue par le moteur : docs/moteur.md
}
```

Champ `audio` (produit par la préparation) : `src` (`audio/<clé>.wav`, clé = 16 premiers caractères du SHA-256 de `voix|débit|texte`), `seconds`, `durationInFrames` (= `ceil(seconds × 30)`), `words` (`text`, `startMs`, `endMs`). Si le texte, la voix ou le débit changent, relancer `scripts/prepare-audio.py` : `npm run verify` refuse une voix périmée.

Types d'annotation (`type`, informatif, pour la personne qui lit) : `cote`, `angle`, `compteur`, `repere`, `lignes`, `etiquettes`. Le dessin réel est choisi dans la mise en scène (`docs/mise-en-scene.md` § 5).

Licences : si une ressource externe est utilisée (rare), ajouter `"licences": [{"resource", "licence", "url"}]`.

## Règles d'écriture

- Le premier passage est la question (`id: "question"`), identique à `hook.title`. Les sous-titres ne l'affichent pas (elle est déjà en titre).
- Passages courts (une idée, 1 à 2 phrases), français accessible, un chiffre par phrase. Le dernier est l'appel à s'abonner (`id: "abonne"`), l'avant-dernier la conclusion.
- Apostrophe typographique ’ dans le texte ; nombres avec espace insécable fine ou espace (« 1 000 ») : la voix les découpe en deux mots, accrocher alors l'annotation au dernier (« 000 »).
- Un chiffre qui change avec le temps est daté dans la phrase et dans `answer`.
- `answer` et chaque fait des sources doivent dire la même chose que la narration.

## Contrôles automatiques (`npm run verify`)

Style connu ; voix figée présente et conforme au texte ; mots minutés qui reproduisent le texte ; durées cohérentes ; chaque annotation accrochée à un mot réellement prononcé ; au moins deux sources complètes (`fact`, `url`, `consulted`) ; mise en scène : décor connu, repères de temps sur des mots prononcés, poses connues, chaque annotation affichée.
