declare const bail: unique symbol;

/**
 * Sentinel returned by any parse stage that cannot analyse its input.
 *
 * @remarks
 * Reaching this value is never an error. It makes the pipeline fall back to the
 * native groups type rather than reporting a problem on a regex that runs fine.
 */
export type Bail = typeof bail;

declare const flagError: unique symbol;

/**
 * Carries a human-readable reason for a rejected flags string into the compiler error.
 */
export interface FlagError<M extends string> {
  readonly [flagError]: M;
}

type FlagLetter = 'd' | 'g' | 'i' | 'm' | 's' | 'u' | 'v' | 'y';

type CheckFlags<F extends string, Seen extends string> = F extends `${infer Head}${infer Rest}`
  ? Head extends FlagLetter
    ? Head extends Seen
      ? FlagError<`repeated flag: ${Head}`>
      : CheckFlags<Rest, Seen | Head>
    : FlagError<`unknown flag: ${Head}`>
  : null;

/**
 * Validates a regex flags string, mirroring the `SyntaxError` conditions of the
 * `RegExp` constructor: only `d g i m s u v y`, each at most once.
 *
 * @returns `F` when valid, a {@link FlagError} otherwise, and `F` unchanged when `F`
 * is not a literal type.
 */
export type ValidFlags<F extends string> = string extends F
  ? F
  : CheckFlags<F, never> extends infer E
    ? [E] extends [null]
      ? F
      : E
    : never;

/**
 * Whether the flags enable unicodeSets mode, which changes character-class syntax.
 */
export type HasV<F extends string> = string extends F
  ? false
  : F extends `${string}v${string}`
    ? true
    : false;
