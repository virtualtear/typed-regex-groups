import type { Bail } from './flags.js';
import type { Token } from './scan.js';

/**
 * One named group and whether a successful match may leave it unset.
 */
export type Entry = { name: string; opt: boolean };

type Frame = { name: string | null; neg: boolean; alt: boolean; names: Entry[] };
type EmptyFrame = { name: null; neg: false; alt: false; names: [] };

type MarkAll<E extends Entry[], Opt extends boolean> = Opt extends true
  ? { [K in keyof E]: { name: E[K]['name']; opt: true } }
  : E;

type OwnEntry<F extends Frame> = F['name'] extends string ? [{ name: F['name']; opt: false }] : [];

// Alternation and negation reach only *into* a frame: `(?<a>x|y)` still captures `a`
// on every match, while `(?:(?<a>x)|y)` does not. A quantifier on the frame itself
// (`ForceOpt`) is the one thing that also makes the frame's own group optional.
type Collected<F extends Frame, ForceOpt extends boolean> = [
  ...MarkAll<F['names'], F['alt'] extends true ? true : F['neg'] extends true ? true : ForceOpt>,
  ...MarkAll<OwnEntry<F>, ForceOpt>,
];

type PushNames<F extends Frame, E extends Entry[]> = {
  name: F['name'];
  neg: F['neg'];
  alt: F['alt'];
  names: [...F['names'], ...E];
};

// Nesting budget, and the second degradation switch.
type MaxDepth = 32;

/**
 * Reduces a token list to the named groups it contains, each marked optional or not.
 *
 * @returns the entry list, or {@link Bail} for an unbalanced pattern or one nested
 * deeper than the budget allows.
 *
 * @remarks
 * A stack machine rather than a syntax tree. Each frame accumulates the names found
 * inside it; on close the frame decides their optionality once and merges them into
 * its parent. An `opt` token immediately after the close is the quantifier that
 * applies to the group just closed.
 */
export type Resolve<
  T extends Token[],
  Cur extends Frame = EmptyFrame,
  Stack extends Frame[] = [],
> = T extends [infer H extends Token, ...infer Rest extends Token[]]
  ? H extends { t: 'open' }
    ? Stack['length'] extends MaxDepth
      ? Bail
      : Resolve<Rest, { name: H['name']; neg: H['neg']; alt: false; names: [] }, [Cur, ...Stack]>
    : H extends { t: 'alt' }
      ? Resolve<Rest, { name: Cur['name']; neg: Cur['neg']; alt: true; names: Cur['names'] }, Stack>
      : H extends { t: 'close' }
        ? Stack extends [infer P extends Frame, ...infer S2 extends Frame[]]
          ? Rest extends [{ t: 'opt' }, ...infer R2 extends Token[]]
            ? Resolve<R2, PushNames<P, Collected<Cur, true>>, S2>
            : Resolve<Rest, PushNames<P, Collected<Cur, false>>, S2>
          : Bail
        : Resolve<Rest, Cur, Stack>
  : Stack extends []
    ? Collected<Cur, false>
    : Bail;
