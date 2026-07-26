import type { Bail } from './flags.js';

/**
 * A structural element of a pattern. Literal characters are not represented: the
 * only questions later stages ask are about group structure.
 */
export type Token =
  | { t: 'open'; name: string | null; neg: boolean }
  | { t: 'close' }
  | { t: 'alt' }
  | { t: 'opt' };

// Step budgets. Keep the walk clear of TypeScript's own recursion ceiling, so a huge
// pattern degrades instead of erroring. Character classes get their own budget because
// their body is skipped without costing the outer walk more than a single step.
type MaxSteps = 400;
type MaxClassSteps = 200;

type SkipClass<
  S extends string,
  V extends boolean,
  D extends unknown[] = [],
  N extends unknown[] = [],
> = N['length'] extends MaxClassSteps
  ? Bail
  : S extends `\\${string}${infer R}`
    ? SkipClass<R, V, D, [...N, 0]>
    : S extends `]${infer R}`
      ? D extends [unknown, ...infer D2]
        ? SkipClass<R, V, D2, [...N, 0]>
        : R
      : V extends true
        ? S extends `[${infer R}`
          ? SkipClass<R, V, [...D, 0], [...N, 0]>
          : S extends `${string}${infer R}`
            ? SkipClass<R, V, D, [...N, 0]>
            : ''
        : S extends `${string}${infer R}`
          ? SkipClass<R, V, D, [...N, 0]>
          : '';

// `?<=` and `?<!` must be tried before `?<name>`, or a lookbehind reads as a group
// named `=` or `!`.
type OpenTok<S extends string> = S extends `?<=${infer R}`
  ? [{ t: 'open'; name: null; neg: false }, R]
  : S extends `?<!${infer R}`
    ? [{ t: 'open'; name: null; neg: true }, R]
    : S extends `?<${infer N}>${infer R}`
      ? [{ t: 'open'; name: N; neg: false }, R]
      : S extends `?!${infer R}`
        ? [{ t: 'open'; name: null; neg: true }, R]
        : S extends `?${string}${infer R}`
          ? [{ t: 'open'; name: null; neg: false }, R]
          : [{ t: 'open'; name: null; neg: false }, S];

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

type IsNum<S extends string> = S extends `${infer H}${infer R}`
  ? H extends Digit
    ? R extends ''
      ? true
      : IsNum<R>
    : false
  : false;

// `{n}`, `{n,}` and `{n,m}` only. JavaScript has no `{,m}` form: there the brace is a
// literal character, which is why the lower bound may not be empty.
type IsQuantBody<B extends string> = B extends `${infer L},${infer U}`
  ? IsNum<L> extends true
    ? U extends ''
      ? true
      : IsNum<U>
    : false
  : IsNum<B>;

type IsZeroNum<L extends string> = L extends `0${infer Rest}`
  ? Rest extends ''
    ? true
    : IsZeroNum<Rest>
  : false;

type ZeroLower<B extends string> = B extends `${infer L},${string}` ? IsZeroNum<L> : IsZeroNum<B>;

// Resolves what follows a `{`: either a quantifier (whether it permits zero, plus the
// tail after the closing brace) or a literal brace (never zero, tail after the `{`).
type BraceAt<S extends string, PrevClose extends boolean> = S extends `{${infer Body}}${infer R}`
  ? PrevClose extends true
    ? IsQuantBody<Body> extends true
      ? [ZeroLower<Body>, R]
      : [false, `${Body}}${R}`]
    : [false, `${Body}}${R}`]
  : S extends `{${infer R}`
    ? [false, R]
    : [false, S];

/**
 * Walks a pattern literal and emits its structural tokens.
 *
 * @typeParam V - whether the `v` flag is set, which makes character classes nest.
 * @returns the token list, or {@link Bail} when the step budget is exhausted.
 *
 * @remarks
 * Written tail-recursively with accumulators so TypeScript's tail-call elimination
 * applies. `PrevClose` is what keeps a quantifier from being attributed to a group
 * it does not belong to.
 */
export type Scan<
  S extends string,
  V extends boolean,
  Acc extends Token[] = [],
  PrevClose extends boolean = false,
  N extends unknown[] = [],
> = N['length'] extends MaxSteps
  ? Bail
  : S extends `\\${string}${infer R}`
    ? Scan<R, V, Acc, false, [...N, 0]>
    : S extends `[${infer R}`
      ? SkipClass<R, V> extends infer SR extends string
        ? Scan<SR, V, Acc, false, [...N, 0]>
        : Bail
      : S extends `(${infer R}`
        ? OpenTok<R> extends [infer T extends Token, infer R2 extends string]
          ? Scan<R2, V, [...Acc, T], false, [...N, 0]>
          : Bail
        : S extends `)${infer R}`
          ? Scan<R, V, [...Acc, { t: 'close' }], true, [...N, 0]>
          : S extends `|${infer R}`
            ? Scan<R, V, [...Acc, { t: 'alt' }], false, [...N, 0]>
            : S extends `?${infer R}`
              ? Scan<R, V, PrevClose extends true ? [...Acc, { t: 'opt' }] : Acc, false, [...N, 0]>
              : S extends `*${infer R}`
                ? Scan<
                    R,
                    V,
                    PrevClose extends true ? [...Acc, { t: 'opt' }] : Acc,
                    false,
                    [...N, 0]
                  >
                : S extends `{${string}`
                  ? BraceAt<S, PrevClose> extends [
                      infer Zero extends boolean,
                      infer R extends string,
                    ]
                    ? Scan<R, V, Zero extends true ? [...Acc, { t: 'opt' }] : Acc, false, [...N, 0]>
                    : Bail
                  : S extends `${string}${infer R}`
                    ? Scan<R, V, Acc, false, [...N, 0]>
                    : Acc;
