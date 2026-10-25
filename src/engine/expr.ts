// Petites expressions numériques de la mise en scène (« CUT_FACE + 0.4 », « ship.x - 2.2 », « seabedY(ship.x - 3) »).
// Analyseur maison, sans eval : nombres, + - * /, parenthèses, variables (constantes du décor, positions des objets,
// caméra) et fonctions (celles du décor et quelques fonctions mathématiques). Résultat mis en cache par texte.

export type Ctx = Record<string, number | ((...args: number[]) => number)>;
type Node = (ctx: Ctx) => number;

const MATH: Ctx = {
  PI: Math.PI,
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  min: Math.min,
  max: Math.max,
  floor: Math.floor,
  round: Math.round,
  /** 1 si x > 0, sinon 0. */
  step: (x: number) => (x > 0 ? 1 : 0),
  clamp: (x: number, a: number, b: number) => Math.min(b, Math.max(a, x)),
  /** Passage linéaire borné de v0 (x ≤ a) à v1 (x ≥ b). */
  ramp: (x: number, a: number, b: number, v0: number, v1: number) => v0 + (v1 - v0) * Math.min(1, Math.max(0, (x - a) / (b - a))),
};

const tokenize = (src: string) => {
  const tokens = src.match(/\d+(?:\.\d+)?|[A-Za-z_][\w.]*|[-+*/(),]/g) ?? [];
  if (tokens.join('') !== src.replace(/\s+/g, '')) throw new Error(`Expression illisible : « ${src} »`);
  return tokens;
};

const parse = (src: string): Node => {
  const t = tokenize(src);
  let i = 0;
  const peek = () => t[i];
  const take = (expected?: string) => {
    const tok = t[i++];
    if (expected && tok !== expected) throw new Error(`Expression « ${src} » : « ${expected} » attendu`);
    return tok;
  };
  const expr = (): Node => {
    let left = term();
    while (peek() === '+' || peek() === '-') {
      const op = take();
      const l = left, r = term();
      left = op === '+' ? (c) => l(c) + r(c) : (c) => l(c) - r(c);
    }
    return left;
  };
  const term = (): Node => {
    let left = unary();
    while (peek() === '*' || peek() === '/') {
      const op = take();
      const l = left, r = unary();
      left = op === '*' ? (c) => l(c) * r(c) : (c) => l(c) / r(c);
    }
    return left;
  };
  const unary = (): Node => {
    if (peek() === '-') {
      take();
      const u = unary();
      return (c) => -u(c);
    }
    if (peek() === '+') take();
    return primary();
  };
  const primary = (): Node => {
    const tok = take();
    if (tok === undefined) throw new Error(`Expression « ${src} » incomplète`);
    if (tok === '(') {
      const e = expr();
      take(')');
      return e;
    }
    if (/^\d/.test(tok)) {
      const n = Number(tok);
      return () => n;
    }
    if (/^[A-Za-z_]/.test(tok)) {
      if (peek() === '(') {
        take('(');
        const args: Node[] = [];
        if (peek() !== ')') {
          args.push(expr());
          while (peek() === ',') {
            take();
            args.push(expr());
          }
        }
        take(')');
        return (c) => {
          const f = c[tok] ?? MATH[tok];
          if (typeof f !== 'function') throw new Error(`Fonction inconnue « ${tok} » dans « ${src} »`);
          return f(...args.map((a) => a(c)));
        };
      }
      return (c) => {
        const v = c[tok] ?? MATH[tok];
        if (typeof v !== 'number') throw new Error(`Variable inconnue « ${tok} » dans « ${src} »`);
        return v;
      };
    }
    throw new Error(`Expression « ${src} » : « ${tok} » inattendu`);
  };
  const node = expr();
  if (i !== t.length) throw new Error(`Expression « ${src} » : reste « ${t.slice(i).join(' ')} »`);
  return node;
};

const cache = new Map<string, Node>();

/** Nombre ou expression (texte) → nombre. */
export type Num = number | string;

export const num = (value: Num, ctx: Ctx): number => {
  if (typeof value === 'number') return value;
  let node = cache.get(value);
  if (!node) {
    node = parse(value);
    cache.set(value, node);
  }
  return node(ctx);
};

export type V3 = [Num, Num, Num];
export const vec = (v: V3, ctx: Ctx): [number, number, number] => [num(v[0], ctx), num(v[1], ctx), num(v[2], ctx)];
