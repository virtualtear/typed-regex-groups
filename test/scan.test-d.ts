import { describe, expectTypeOf, it } from 'vitest';

import type { Scan } from '../src/parse/scan.js';

type Open<N extends string | null, Neg extends boolean = false> = { t: 'open'; name: N; neg: Neg };
type Close = { t: 'close' };
type Alt = { t: 'alt' };
type Opt = { t: 'opt' };

describe('Scan', () => {
  it('emits a named open and a close, dropping literal characters', () => {
    expectTypeOf<Scan<'(?<a>xyz)', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
  });

  it('marks non-capturing and lookaround groups', () => {
    expectTypeOf<Scan<'(?:x)', false>>().toEqualTypeOf<[Open<null>, Close]>();
    expectTypeOf<Scan<'(?=x)', false>>().toEqualTypeOf<[Open<null>, Close]>();
    expectTypeOf<Scan<'(?!x)', false>>().toEqualTypeOf<[Open<null, true>, Close]>();
    expectTypeOf<Scan<'(?<=x)', false>>().toEqualTypeOf<[Open<null>, Close]>();
    expectTypeOf<Scan<'(?<!x)', false>>().toEqualTypeOf<[Open<null, true>, Close]>();
  });

  it('emits alternation at the level it appears on', () => {
    expectTypeOf<Scan<'(?<a>x)|(?<b>y)', false>>().toEqualTypeOf<
      [Open<'a'>, Close, Alt, Open<'b'>, Close]
    >();
  });

  it('emits opt only for a zero-lower-bound quantifier directly after a close', () => {
    expectTypeOf<Scan<'(?<a>x)?', false>>().toEqualTypeOf<[Open<'a'>, Close, Opt]>();
    expectTypeOf<Scan<'(?<a>x)*', false>>().toEqualTypeOf<[Open<'a'>, Close, Opt]>();
    expectTypeOf<Scan<'(?<a>x){0,4}', false>>().toEqualTypeOf<[Open<'a'>, Close, Opt]>();
    expectTypeOf<Scan<'(?<a>x)+', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
    expectTypeOf<Scan<'(?<a>x){2,4}', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
  });

  it('does not attach a quantifier that belongs to a following atom', () => {
    expectTypeOf<Scan<'(?<a>x)y?', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
  });

  it('treats escaped parens and parens inside character classes as literal', () => {
    expectTypeOf<Scan<'\\((?<a>x)\\)', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
    expectTypeOf<Scan<'[()](?<a>x)', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
    expectTypeOf<Scan<'[\\]](?<a>x)', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
  });

  it('handles nested classes and set notation only under the v flag', () => {
    expectTypeOf<Scan<'[[a-z]--[aeiou]](?<a>x)', true>>().toEqualTypeOf<[Open<'a'>, Close]>();
    expectTypeOf<Scan<'[\\q{ab|cd}](?<a>x)', true>>().toEqualTypeOf<[Open<'a'>, Close]>();
  });

  it('emits an opt token only for a real zero-lower-bound brace quantifier', () => {
    expectTypeOf<Scan<'(?<a>x){0,3}', false>>().toEqualTypeOf<[Open<'a'>, Close, Opt]>();
    expectTypeOf<Scan<'(?<a>x){0,}', false>>().toEqualTypeOf<[Open<'a'>, Close, Opt]>();
    expectTypeOf<Scan<'(?<a>x){2,4}', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
    expectTypeOf<Scan<'(?<a>x){,3}', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
    expectTypeOf<Scan<'(?<a>x){z}', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
  });

  it('reads a brace that opens no quantifier as a literal character', () => {
    expectTypeOf<Scan<'\\${(?<a>x)}', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
    expectTypeOf<Scan<'{0,3}(?<a>x)', false>>().toEqualTypeOf<[Open<'a'>, Close]>();
  });

  it('bails on a character class that outruns its budget', () => {
    type Wide =
      '[aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa](?<a>x)';
    expectTypeOf<Scan<Wide, false>>().not.toExtend<readonly unknown[]>();
  });

  it('survives a long pattern without a recursion error', () => {
    type Long =
      '(?<a>aaaaaaaaaaaaaaaaaaaa)(?<b>bbbbbbbbbbbbbbbbbbbb)(?<c>cccccccccccccccccccc)(?<d>dddddddddddddddddddd)(?<e>eeeeeeeeeeeeeeeeeeee)(?<f>ffffffffffffffffffff)(?<g>gggggggggggggggggggg)(?<h>hhhhhhhhhhhhhhhhhhhh)(?<i>iiiiiiiiiiiiiiiiiiii)(?<j>jjjjjjjjjjjjjjjjjjjj)(?<k>kkkkkkkkkkkkkkkkkkkk)';
    expectTypeOf<Scan<Long, false>>().toExtend<readonly unknown[]>();
  });
});
