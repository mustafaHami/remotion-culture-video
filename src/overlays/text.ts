// Outils de typographie française partagés par les surimpressions.

/** Colle la ponctuation haute (« ? », « : », « ! », « ; ») au mot précédent par une espace insécable. */
export const frenchSpacing = (text: string) => text.replace(/ ([?:!;»])/g, ' $1').replace(/« /g, '« ');

/** Découpe un texte en mots affichables (la ponctuation reste attachée). */
export const splitWords = (text: string) => frenchSpacing(text).split(' ');
