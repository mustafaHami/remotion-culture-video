# public/audio

Narrations figées en WAV (24 kHz, mono), générées par `scripts/prepare-audio.py` puis **versionnées**. Voix du projet : ElevenLabs « Peter - Narrator » ; voix de secours : edge-tts `fr-FR-DeniseNeural` (règles : `AGENTS.md`, section « Voix »). Un rendu ordinaire ne régénère jamais la voix : il lit ces fichiers, sans appel à ElevenLabs ni crédit consommé.

- `<clé>.wav` : la voix d'un passage ; `<clé>.words.json` : le minutage brut de ses mots. La clé est l'empreinte de « voix | débit | texte » : changer l'un des trois produit un nouveau fichier.
- `provenance.json` : pour chaque clé, texte, voix, débit, durée et empreinte SHA-256 du WAV.
- Les voix qui ne servent plus à aucun épisode ni essai peuvent être retirées (elles restent dans l'historique Git).

Une panne de synthèse vocale (autre qu'un manque de crédits, qui bascule sur la voix de secours) arrête la préparation ; elle ne justifie jamais une vidéo muette.
