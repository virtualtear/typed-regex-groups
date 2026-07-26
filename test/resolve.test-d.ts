import { describe, expectTypeOf, it } from 'vitest';

import type { Resolve } from '../src/parse/resolve.js';
import type { Scan, Token } from '../src/parse/scan.js';

// Scan can return Bail, so narrow to Token[] before handing it to Resolve.
type Of<S extends string> =
  Scan<S, false> extends infer T ? (T extends Token[] ? Resolve<T> : never) : never;

describe('Resolve', () => {
  it('marks a plain group required', () => {
    expectTypeOf<Of<'(?<a>x)'>>().toEqualTypeOf<[{ name: 'a'; opt: false }]>();
  });

  it('marks a directly quantified group optional', () => {
    expectTypeOf<Of<'(?<a>x)?'>>().toEqualTypeOf<[{ name: 'a'; opt: true }]>();
  });

  it('propagates optionality from an enclosing quantified group', () => {
    expectTypeOf<Of<'(?:(?<a>x)(?<b>y))?'>>().toEqualTypeOf<
      [{ name: 'a'; opt: true }, { name: 'b'; opt: true }]
    >();
  });

  it('marks every branch of an alternation optional', () => {
    expectTypeOf<Of<'(?<a>x)|(?<b>y)'>>().toEqualTypeOf<
      [{ name: 'a'; opt: true }, { name: 'b'; opt: true }]
    >();
  });

  it('leaves a group required when it wraps the alternation itself', () => {
    expectTypeOf<Of<'(?<a>x|y)'>>().toEqualTypeOf<[{ name: 'a'; opt: false }]>();
    expectTypeOf<Of<'(?<a>(?<b>x)|y)'>>().toEqualTypeOf<
      [{ name: 'b'; opt: true }, { name: 'a'; opt: false }]
    >();
  });

  it('marks groups inside a negative lookaround optional', () => {
    expectTypeOf<Of<'(?!(?<a>x))'>>().toEqualTypeOf<[{ name: 'a'; opt: true }]>();
  });

  it('leaves groups inside a positive lookaround required', () => {
    expectTypeOf<Of<'(?=(?<a>x))'>>().toEqualTypeOf<[{ name: 'a'; opt: false }]>();
  });

  it('bails on an unbalanced pattern', () => {
    expectTypeOf<Of<'(?<a>x'>>().not.toExtend<readonly unknown[]>();
    expectTypeOf<Of<'(?<a>x))'>>().not.toExtend<readonly unknown[]>();
  });
});
