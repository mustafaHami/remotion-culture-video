import React from 'react';

// Point d'entrée volontairement vide : aucune composition n'est déclarée tant que
// le premier flux de création n'existe pas. Les compositions viendront de
// src/compositions et liront leurs données dans content/episodes/<id>.json.
// Format commun prévu : 1080 × 1920, 30 images par seconde (voir AGENTS.md).
export const Root: React.FC = () => <></>;
