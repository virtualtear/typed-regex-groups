import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Guards the type-level parser against a silent blow-up in compile time. Raise the
// ceiling deliberately when the parser gains real capability, never to make a red
// run go green.
const MAX_INSTANTIATIONS = 2_000_000;

describe('compile cost', () => {
  it('stays under the instantiation ceiling', () => {
    const output = execFileSync('node_modules/.bin/tsc', ['--noEmit', '--extendedDiagnostics'], {
      encoding: 'utf8',
    });
    const instantiations = Number(/Instantiations:\s+(\d+)/.exec(output)?.[1]);
    expect(instantiations).toBeGreaterThan(0);
    expect(instantiations).toBeLessThan(MAX_INSTANTIATIONS);
  });
});
