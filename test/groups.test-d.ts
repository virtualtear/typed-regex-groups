import { describe, expectTypeOf, it } from 'vitest';

import type { Groups, LooseGroups } from '../src/parse/groups.js';

describe('Groups', () => {
  it('types a guaranteed group as a required key', () => {
    expectTypeOf<Groups<'(?<y>\\d{4})-(?<m>\\d{2})'>>().toEqualTypeOf<{ y: string; m: string }>();
  });

  it('types a directly quantified group as an optional key', () => {
    expectTypeOf<Groups<'(?<a>x)(?<b>y)?'>>().toEqualTypeOf<{ a: string; b?: string }>();
  });

  it('types a group under a quantified ancestor as optional', () => {
    expectTypeOf<Groups<'^\\w+(@(?<version>[a-z0-9-_.]+))?$'>>().toEqualTypeOf<{
      version?: string;
    }>();
  });

  it('types every alternation branch as optional', () => {
    expectTypeOf<Groups<'(?<a>x)|(?<b>y)'>>().toEqualTypeOf<{ a?: string; b?: string }>();
  });

  it('types a negative lookaround group as optional and a positive one as required', () => {
    expectTypeOf<Groups<'(?!(?<a>x))(?<b>y)'>>().toEqualTypeOf<{ b: string; a?: string }>();
    expectTypeOf<Groups<'(?=(?<a>x))(?<b>y)'>>().toEqualTypeOf<{ a: string; b: string }>();
  });

  it('respects the lower bound of a counted quantifier', () => {
    expectTypeOf<Groups<'(?<a>x){2,4}'>>().toEqualTypeOf<{ a: string }>();
    expectTypeOf<Groups<'(?<a>x){0,4}'>>().toEqualTypeOf<{ a?: string }>();
    expectTypeOf<Groups<'(?<a>x){0,}'>>().toEqualTypeOf<{ a?: string }>();
    expectTypeOf<Groups<'(?<a>x){1,}'>>().toEqualTypeOf<{ a: string }>();
  });

  it('keeps a group required when the alternation is inside it', () => {
    expectTypeOf<Groups<'(?<a>x|y)'>>().toEqualTypeOf<{ a: string }>();
    expectTypeOf<Groups<'(?<a>(?<b>x)|y)'>>().toEqualTypeOf<{ a: string; b?: string }>();
    expectTypeOf<Groups<'(?:(?<a>x)|y)'>>().toEqualTypeOf<{ a?: string }>();
  });

  it('treats a brace that is not a quantifier as a literal', () => {
    expectTypeOf<Groups<'\\${(?<name>\\w+)}'>>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<Groups<'a{,3}(?<a>x)'>>().toEqualTypeOf<{ a: string }>();
    expectTypeOf<Groups<'(?<a>x){,3}'>>().toEqualTypeOf<{ a: string }>();
    expectTypeOf<Groups<'(?<a>x){z}'>>().toEqualTypeOf<{ a: string }>();
  });

  it('reads a lazy quantifier the same as its greedy form', () => {
    expectTypeOf<Groups<'(?<a>x)??'>>().toEqualTypeOf<{ a?: string }>();
    expectTypeOf<Groups<'(?<a>x)*?'>>().toEqualTypeOf<{ a?: string }>();
    expectTypeOf<Groups<'(?<a>x)+?'>>().toEqualTypeOf<{ a: string }>();
    expectTypeOf<Groups<'(?<a>x){2,4}?'>>().toEqualTypeOf<{ a: string }>();
  });

  it('reads an exact zero repetition as optional', () => {
    expectTypeOf<Groups<'(?<a>x){0}'>>().toEqualTypeOf<{ a?: string }>();
    expectTypeOf<Groups<'(?<a>x){1}'>>().toEqualTypeOf<{ a: string }>();
  });

  it('sees through a modifier group', () => {
    expectTypeOf<Groups<'(?i:(?<a>x))'>>().toEqualTypeOf<{ a: string }>();
    expectTypeOf<Groups<'(?-i:(?<a>x))'>>().toEqualTypeOf<{ a: string }>();
  });

  it('is not confused by an escape that precedes group syntax', () => {
    expectTypeOf<Groups<'(?<a>x)\\k<a>'>>().toEqualTypeOf<{ a: string }>();
    expectTypeOf<Groups<'\\\\(?<a>x)'>>().toEqualTypeOf<{ a: string }>();
  });

  // Legal since ES2025, and the two branches are exclusive, so a successful match always
  // sets the name. Optional is the safe answer rather than the exact one.
  it('marks a name duplicated across alternatives optional', () => {
    expectTypeOf<Groups<'(?<a>x)|(?<a>y)'>>().toEqualTypeOf<{ a?: string }>();
  });

  it('is undefined when the pattern names no groups', () => {
    expectTypeOf<Groups<'\\d+'>>().toEqualTypeOf<undefined>();
  });

  it('degrades to the native shape for a non-literal pattern', () => {
    expectTypeOf<Groups<string>>().toEqualTypeOf<LooseGroups>();
  });

  it('degrades to the native shape for an unbalanced pattern', () => {
    expectTypeOf<Groups<'(?<a>x'>>().toEqualTypeOf<LooseGroups>();
    expectTypeOf<Groups<'(?<a>x))'>>().toEqualTypeOf<LooseGroups>();
  });

  it('degrades to the native shape past the nesting budget', () => {
    expectTypeOf<Groups<'(((((((((((((((((((((?<a>x)))))))))))))))))))))'>>().toEqualTypeOf<{
      a: string;
    }>();
    expectTypeOf<
      Groups<'((((((((((((((((((((((((((((((((((?<a>x))))))))))))))))))))))))))))))))))'>
    >().toEqualTypeOf<LooseGroups>();
  });

  it('degrades to the native shape past the step budget', () => {
    expectTypeOf<
      Groups<'(?<a>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa)'>
    >().toEqualTypeOf<LooseGroups>();
  });

  it('reads character classes correctly with and without the v flag', () => {
    expectTypeOf<Groups<'[()](?<a>x)'>>().toEqualTypeOf<{ a: string }>();
    expectTypeOf<Groups<'[[a-z]--[aeiou]](?<a>x)', 'v'>>().toEqualTypeOf<{ a: string }>();
  });
});
