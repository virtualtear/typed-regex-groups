import { describe, expectTypeOf, it } from 'vitest';

import type { HasV, ValidFlags } from '../src/parse/flags.js';

describe('ValidFlags', () => {
  it('returns the flags unchanged when every letter is legal', () => {
    expectTypeOf<ValidFlags<'gi'>>().toEqualTypeOf<'gi'>();
    expectTypeOf<ValidFlags<'dgimsuy'>>().toEqualTypeOf<'dgimsuy'>();
    expectTypeOf<ValidFlags<''>>().toEqualTypeOf<''>();
  });

  it('does not resolve to the flags when a letter is unknown', () => {
    expectTypeOf<ValidFlags<'q'>>().not.toEqualTypeOf<'q'>();
    expectTypeOf<ValidFlags<'gq'>>().not.toEqualTypeOf<'gq'>();
  });

  it('does not resolve to the flags when a letter repeats', () => {
    expectTypeOf<ValidFlags<'gg'>>().not.toEqualTypeOf<'gg'>();
    expectTypeOf<ValidFlags<'gig'>>().not.toEqualTypeOf<'gig'>();
  });

  it('passes a non-literal flags type straight through', () => {
    expectTypeOf<ValidFlags<string>>().toEqualTypeOf<string>();
  });
});

describe('HasV', () => {
  it('detects the unicodeSets flag', () => {
    expectTypeOf<HasV<'v'>>().toEqualTypeOf<true>();
    expectTypeOf<HasV<'giv'>>().toEqualTypeOf<true>();
    expectTypeOf<HasV<'gi'>>().toEqualTypeOf<false>();
    expectTypeOf<HasV<string>>().toEqualTypeOf<false>();
  });
});
