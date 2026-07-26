import { describe, expectTypeOf, it } from 'vitest';

import type { FlagError, HasV, ValidFlags } from '../src/parse/flags.js';

describe('ValidFlags', () => {
  it('returns the flags unchanged when every letter is legal', () => {
    expectTypeOf<ValidFlags<'gi'>>().toEqualTypeOf<'gi'>();
    expectTypeOf<ValidFlags<'dgimsuy'>>().toEqualTypeOf<'dgimsuy'>();
    expectTypeOf<ValidFlags<'dgimsvy'>>().toEqualTypeOf<'dgimsvy'>();
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

  it('rejects u and v together, as the RegExp constructor does', () => {
    expectTypeOf<ValidFlags<'uv'>>().not.toEqualTypeOf<'uv'>();
    expectTypeOf<ValidFlags<'vu'>>().not.toEqualTypeOf<'vu'>();
    expectTypeOf<ValidFlags<'guiv'>>().not.toEqualTypeOf<'guiv'>();
  });

  // The message is the whole payload of FlagError: it is what the caller reads in the
  // compile error, so it is part of the interface rather than an implementation detail.
  it('names the offending letter in the error', () => {
    expectTypeOf<ValidFlags<'gg'>>().toEqualTypeOf<FlagError<'repeated flag: g'>>();
    expectTypeOf<ValidFlags<'q'>>().toEqualTypeOf<FlagError<'unknown flag: q'>>();
    expectTypeOf<ValidFlags<'uv'>>().toEqualTypeOf<FlagError<'u and v cannot be combined'>>();
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
