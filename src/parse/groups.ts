import type { HasV } from './flags.js';
import type { Entry, Resolve } from './resolve.js';
import type { Scan, Token } from './scan.js';

/**
 * The native groups type, and the type this library degrades to.
 *
 * @remarks
 * Degrading returns the caller to exactly what TypeScript offers without this
 * library. Under `noUncheckedIndexedAccess`, reads through it are `string | undefined`.
 */
export type LooseGroups = NonNullable<RegExpExecArray['groups']>;

// Collapses an intersection into one object type, so hovers and type tests see a flat
// shape rather than `{ a: string } & { b?: string }`.
type Prettify<T> = { [K in keyof T]: T[K] } & {};

type RequiredKeys<E extends Entry[]> = Extract<E[number], { opt: false }>['name'];

type Build<E extends Entry[]> = E extends []
  ? undefined
  : {
      [K in E[number]['name'] as K extends RequiredKeys<E> ? K : never]: string;
    } & {
      [K in E[number]['name'] as K extends RequiredKeys<E> ? never : K]?: string;
    };

type GroupsOf<S extends string, F extends string> = string extends S
  ? LooseGroups
  : Scan<S, HasV<F>> extends infer T
    ? T extends Token[]
      ? Resolve<T> extends infer E
        ? E extends Entry[]
          ? Build<E>
          : LooseGroups
        : never
      : LooseGroups
    : never;

/**
 * The named capture groups of a regex pattern, derived from the pattern literal.
 *
 * @typeParam S - the pattern; a non-literal `string` degrades to {@link LooseGroups}.
 * @typeParam F - the flags, which matter because `v` changes character-class syntax.
 *
 * @returns a record with required keys for groups a successful match guarantees and
 * optional keys for the rest, or `undefined` when the pattern names no groups.
 *
 * @example
 * ```typescript
 * type G = Groups<'(?<y>\\d{4})(?<sfx>-\\d)?'>;
 * //   ^? { y: string; sfx?: string }
 * ```
 */
export type Groups<S extends string, F extends string = string> =
  GroupsOf<S, F> extends infer G ? ([G] extends [undefined] ? undefined : Prettify<G>) : never;
