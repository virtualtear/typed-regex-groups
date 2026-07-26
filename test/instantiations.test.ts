import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Guards the type-level parser against a silent blow-up in compile time. Raise the
// ceiling deliberately when the parser gains real capability, never to make a red
// run go green.
//
// Measured against test/fixtures/instantiations.fixture.ts alone, never the whole
// project: a ceiling that also counted the test files would drift upward every time a
// test was added, for reasons having nothing to do with the parser.
const MAX_INSTANTIATIONS = 60_000;

describe('compile cost', () => {
  it('stays under the instantiation ceiling', () => {
    const output = execFileSync(
      'node_modules/.bin/tsc',
      ['--noEmit', '-p', 'tsconfig.instantiations.json', '--extendedDiagnostics'],
      { encoding: 'utf8' },
    );
    const instantiations = Number(/Instantiations:\s+(\d+)/.exec(output)?.[1]);
    expect(instantiations).toBeGreaterThan(0);
    expect(instantiations).toBeLessThan(MAX_INSTANTIATIONS);
  });
});
