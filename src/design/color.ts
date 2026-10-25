// Petites opérations sur les couleurs hexadécimales (#RRGGBB), sans gestion d'espace colorimétrique :
// les valeurs sont envoyées telles quelles au rendu (Canvas en mode `linear` + `flat`).

export type Rgb = [number, number, number];

export const hexToRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const toHex = (rgb: Rgb) =>
  '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/** Mélange a vers b : t = 0 donne a, t = 1 donne b. */
export const mix = (a: string, b: string, t: number): string => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
};

export const withAlpha = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
