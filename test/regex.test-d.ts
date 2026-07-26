import { describe, expectTypeOf, it } from 'vitest';

import { typedRegex } from '../src/index.js';

describe('typedRegex', () => {
  it('types exec groups from the pattern literal', () => {
    const re = typedRegex('^\\w+(@(?<version>[a-z0-9-_.]+))?$', 'gi');
    const match = re.exec('pkg@1.2.3');
    expectTypeOf(match!.groups).toEqualTypeOf<{ version?: string }>();
    expectTypeOf(match!.groups.version).toEqualTypeOf<string | undefined>();
  });

  it('types a guaranteed group as string', () => {
    const re = typedRegex('(?<y>\\d{4})-(?<m>\\d{2})');
    expectTypeOf(re.exec('2026-07')!.groups.y).toEqualTypeOf<string>();
  });

  it('types matchAll entries the same way', () => {
    const re = typedRegex('(?<n>\\d)', 'g');
    expectTypeOf([...re.matchAll('a1b2')][0]!.groups.n).toEqualTypeOf<string>();
  });

  it('keeps the match usable as a native match', () => {
    const re = typedRegex('(?<y>\\d{4})');
    const match = re.exec('2026')!;
    expectTypeOf(match[0]).toEqualTypeOf<string>();
    expectTypeOf(match.index).toEqualTypeOf<number>();
    expectTypeOf(match.input).toEqualTypeOf<string>();
    expectTypeOf<typeof match>().toExtend<RegExpExecArray>();
  });

  it('degrades for a dynamic pattern', () => {
    const pattern = String(Math.random());
    expectTypeOf(typedRegex(pattern).exec('x')?.groups?.['anything']).toEqualTypeOf<
      string | undefined
    >();
  });

  it('leaves groups undefined when the pattern names none', () => {
    expectTypeOf(typedRegex('\\d+').exec('42')!.groups).toEqualTypeOf<undefined>();
  });

  it('rejects an invalid flags string', () => {
    // @ts-expect-error unknown flag letter
    typedRegex('(?<a>x)', 'q');
    // @ts-expect-error repeated flag letter
    typedRegex('(?<a>x)', 'gg');
    // @ts-expect-error u and v are mutually exclusive
    typedRegex('(?<a>x)', 'uv');
  });

  it('rejects a group name the pattern does not define', () => {
    const re = typedRegex('(?<y>\\d{4})');
    // @ts-expect-error no group named nope
    re.exec('2026')?.groups.nope;
  });
});
