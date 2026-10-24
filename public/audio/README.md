# public/audio

Narrations figées en WAV, générées par la préparation audio (edge-tts, voix française `fr-FR-DeniseNeural` par défaut) puis **versionnées**. Un rendu ordinaire ne régénère jamais la voix : il lit ces fichiers.

Une panne de synthèse vocale arrête la préparation ; elle ne justifie jamais une vidéo muette. La provenance (texte, voix, débit, empreinte SHA-256) sera enregistrée à côté des fichiers.
