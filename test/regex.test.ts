import { describe, expect, it } from 'vitest';

import { TypedRegExp, typedRegex } from '../src/index.js';

const version = '^\\w+(@(?<version>[a-z0-9-_.]+))?$';

describe('typedRegex', () => {
  it('produces a real RegExp', () => {
    const re = typedRegex(version, 'i');
    expect(re).toBeInstanceOf(RegExp);
    expect(re).toBeInstanceOf(TypedRegExp);
    expect(re.source).toBe(version);
    expect(re.flags).toBe('i');
  });

  it('exposes the engine-populated groups', () => {
    const re = typedRegex(version);
    expect(re.exec('pkg@1.2.3')?.groups).toEqual({ version: '1.2.3' });
  });

  it('leaves a non-participating group defined but undefined', () => {
    const groups = typedRegex(version).exec('pkg')?.groups;
    expect(groups && 'version' in groups).toBe(true);
    expect(groups?.version).toBeUndefined();
  });

  it('has undefined groups when the pattern names none', () => {
    expect(typedRegex('\\d+').exec('42')?.groups).toBeUndefined();
  });

  it('works with native string methods', () => {
    expect('pkg@1.2.3'.replace(typedRegex(version), '$<version>')).toBe('1.2.3');
    expect('a1b'.split(typedRegex('\\d'))).toEqual(['a', 'b']);
  });

  it('iterates every match with matchAll', () => {
    const re = typedRegex('(?<n>\\d)', 'g');
    expect([...re.matchAll('a1b2')].map((m) => m.groups.n)).toEqual(['1', '2']);
  });

  it('round-trips through the RegExp constructor', () => {
    const re = typedRegex(version, 'gi');
    const clone = new RegExp(re);
    expect(clone.source).toBe(re.source);
    expect(clone.flags).toBe(re.flags);
  });

  it('is copied rather than returned by RegExp called without new', () => {
    const re = typedRegex(version);
    expect(RegExp(re)).not.toBe(re);
    expect(RegExp(re).source).toBe(re.source);
  });

  it('tracks lastIndex under the global flag', () => {
    const re = typedRegex('(?<n>\\d)', 'g');
    re.exec('a1b2');
    expect(re.lastIndex).toBe(2);
  });

  it('throws the native SyntaxError for a malformed pattern', () => {
    expect(() => typedRegex('(?<a>x')).toThrow(SyntaxError);
  });
});
