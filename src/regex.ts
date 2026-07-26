import type { ValidFlags } from './parse/flags.js';
import type { Groups } from './parse/groups.js';

interface MatchArray extends Array<string> {
  index: number;
  input: string;
  0: string;
  indices?: RegExpIndicesArray;
}

/**
 * A successful match, with `groups` typed from the pattern that produced it.
 *
 * @remarks
 * The groups member is conditional because the native declaration makes `groups`
 * optional: under `exactOptionalPropertyTypes` a required `groups: undefined` would
 * not satisfy it, so a pattern naming no groups is expressed as `{ groups?: never }`,
 * which reads back as `undefined`.
 */
export type TypedMatch<S extends string, F extends string = string> = MatchArray &
  ([Groups<S, F>] extends [undefined] ? { groups?: never } : { groups: Groups<S, F> });

/**
 * A `RegExp` that remembers its pattern at the type level.
 *
 * @remarks
 * A genuine subclass, so `instanceof RegExp` holds and every native path keeps
 * working: `String.prototype.replace`, `split`, `matchAll`, and cloning via
 * `new RegExp(re)`. Species construction calls this with `(source, flags)`, which is
 * exactly the inherited constructor.
 */
export class TypedRegExp<S extends string, F extends string = string> extends RegExp {
  /** Matches `input`, returning a match whose `groups` is typed from the pattern. */
  override exec(input: string): TypedMatch<S, F> | null {
    return super.exec(input) as TypedMatch<S, F> | null;
  }

  /**
   * Iterates every match in `input`.
   *
   * @throws TypeError if the regex was not built with the `g` flag, per native
   * `String.prototype.matchAll`.
   */
  matchAll(input: string): IterableIterator<TypedMatch<S, F>> {
    return input.matchAll(this) as IterableIterator<TypedMatch<S, F>>;
  }
}

/**
 * Builds a regex whose named capture groups are typed from the pattern literal.
 *
 * @param pattern - a string literal for a typed result; a non-literal `string` still
 * works and degrades to the native groups type.
 * @throws SyntaxError from the `RegExp` constructor if the pattern or flags are invalid.
 *
 * @example
 * ```typescript
 * const re = typedRegex('(?<year>\\d{4})-(?<month>\\d{2})');
 * re.exec('2026-07')?.groups.year; // string
 * ```
 */
export function typedRegex<const S extends string, const F extends string = ''>(
  pattern: S,
  flags?: F & ValidFlags<F>,
): TypedRegExp<S, F> {
  return new TypedRegExp<S, F>(pattern, flags as string | undefined);
}
