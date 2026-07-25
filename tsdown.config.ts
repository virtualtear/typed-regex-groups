import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  publint: true,
  // tsdown defaults fixedExtension to true for platform 'node', which emits
  // .mjs/.d.mts regardless of package.json "type". This package is ESM-only
  // ("type": "module") and exports.".".default points at dist/index.js, so
  // force the extension to match.
  fixedExtension: false,
});
