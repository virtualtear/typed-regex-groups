import { describe, expect, it } from 'vitest';

import { greet } from '../src/index.js';

describe('greet', () => {
  it('builds a greeting for the given name', () => {
    expect(greet('world')).toBe('Hello, world!');
  });
});
