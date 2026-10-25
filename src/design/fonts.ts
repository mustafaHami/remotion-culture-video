// Chargement des polices locales (public/fonts) avant le rendu de la première image.
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import type {LookId} from './looks';

type Face = {family: string; file: string; weight: string; style?: 'normal' | 'italic'};

const FACES: Record<LookId, Face[]> = {
  A: [
    {family: 'Fraunces', file: 'Fraunces-Variable.ttf', weight: '100 900'},
    {family: 'Fraunces', file: 'Fraunces-VariableItalic.ttf', weight: '100 900', style: 'italic'},
    {family: 'Atkinson Hyperlegible', file: 'AtkinsonHyperlegible-Regular.ttf', weight: '400'},
    {family: 'Atkinson Hyperlegible', file: 'AtkinsonHyperlegible-Bold.ttf', weight: '700'},
  ],
  B: [
    {family: 'Baloo 2', file: 'Baloo2-Variable.ttf', weight: '400 800'},
    {family: 'Nunito', file: 'Nunito-Variable.ttf', weight: '200 1000'},
  ],
  D: [
    {family: 'Anton', file: 'Anton-Regular.ttf', weight: '400'},
    {family: 'Inter', file: 'Inter-Variable.ttf', weight: '100 900'},
  ],
};

const loaded = new Map<LookId, Promise<void>>();

const loadLook = (look: LookId) => {
  if (!loaded.has(look)) {
    loaded.set(
      look,
      Promise.all(
        FACES[look].map(async (face) => {
          const font = new FontFace(face.family, `url('${staticFile(`fonts/${face.file}`)}')`, {
            weight: face.weight,
            style: face.style ?? 'normal',
          });
          document.fonts.add(await font.load());
        }),
      ).then(() => undefined),
    );
  }
  return loaded.get(look)!;
};

/** Bloque le rendu tant que les polices de la direction ne sont pas prêtes. */
export const useLookFonts = (look: LookId) => {
  const [handle] = useState(() => delayRender(`Polices de la direction ${look}`));
  useEffect(() => {
    loadLook(look)
      .then(() => continueRender(handle))
      .catch((error) => cancelRender(error));
  }, [look, handle]);
};
