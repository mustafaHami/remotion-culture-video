# content/episodes

Un fichier JSON par vidéo : `content/episodes/<id>.json`. Produire une nouvelle vidéo = écrire un nouveau fichier ici, sans modifier les composants.

Le schéma exact sera fixé avec le premier flux de création. Il devra au minimum contenir :

- l'identifiant, le titre de l'accroche (la question) et la réponse en une phrase ;
- la narration découpée en passages (texte exact prononcé, voix, fichier WAV figé, durée mesurée) ;
- le minutage des scènes et des chapitres ;
- les scènes (décor, pièce ou étage, caméra, actions du hibou) ;
- les annotations (type, texte, mot de la narration qui les déclenche) ;
- les sources (au moins deux sources fiables par fait, avec URL ou référence et date de consultation) ;
- les licences des éventuelles ressources externes.

Tant que le schéma n'existe pas, `npm run verify` contrôle seulement que chaque fichier est un JSON valide.
