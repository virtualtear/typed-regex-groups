import { bench, describe } from 'vitest';

import { greet } from '../src/index.js';

describe('greet', () => {
  bench('short name', () => {
    greet('world');
  });

  bench('long name', () => {
    greet('a'.repeat(1024));
  });
});
