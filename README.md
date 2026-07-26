# typed-regex-groups

Named capture groups, typed from the pattern itself.

```typescript
import { typedRegex } from 'typed-regex-groups';

const re = typedRegex('(?<year>\\d{4})-(?<month>\\d{2})(?<day>-\\d{2})?');
const match = re.exec('2026-07');

if (match) {
  match.groups.year; // string
  match.groups.day; // string | undefined
  match.groups.typo; // compile error
}
```

`typedRegex` returns a real `RegExp`, so everything native keeps working:
`str.replace(re, '$<year>')`, `str.split(re)`, `new RegExp(re)`, `instanceof`.

## What it knows

A group is typed `string` when a successful match guarantees it participated, and
`string | undefined` otherwise:

| Pattern | Groups type |
| --- | --- |
| `(?<a>x)(?<b>y)` | `{ a: string; b: string }` |
| `(?<a>x)(?<b>y)?` | `{ a: string; b?: string }` |
| `(?:(?<a>x)(?<b>y))?` | `{ a?: string; b?: string }` |
| `(?<a>x)\|(?<b>y)` | `{ a?: string; b?: string }` |
| `(?<a>x){2,4}` | `{ a: string }` |
| `(?!(?<a>x))` | `{ a?: string }` |
| `\d+` | `undefined` |

The enclosing-group case is the one a flat scan for `(?<name>` gets wrong.

## When it cannot tell

A pattern that is not a string literal, or one past the size budget, degrades to the
native groups type rather than failing to compile. Your code still builds and still
runs; you just lose the precision:

```typescript
const re = typedRegex(patternFromConfig);
re.exec(input)?.groups?.['anything']; // string | undefined
```

Enable `noUncheckedIndexedAccess` to keep those reads honest.

Invalid flags are the one thing rejected outright, matching the `RegExp`
constructor's own rules:

```typescript
typedRegex('(?<a>x)', 'gg'); // compile error: repeated flag: g
```

## Requirements

TypeScript with `strict`. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`
are recommended and are what the type tests assume.

## Scripts

| Script | Purpose |
| --- | --- |
| `typecheck` | Type-check the project with `tsc --noEmit`. |
| `test` | Run the test suite once with Vitest. |
| `test:watch` | Run the test suite in watch mode. |
| `test:coverage` | Run the test suite with coverage reporting. |
| `build` | Bundle with tsdown, then emit declarations with `tsc`. |
| `check:package` | Check the built package with publint and attw. |
| `lint` | Check formatting and lint rules with Biome. |
| `lint:fix` | Apply Biome's automatic fixes. |
| `verify` | Run typecheck, lint, test, build, and check:package in sequence. |
| `prepare` | Install git hooks via Husky. |
| `changeset` | Record a changeset for the next release. |
| `version-packages` | Apply pending changesets and bump the version. |
| `release` | Build and publish the package via Changesets. |

## Releasing

Releases are automated with Changesets, and the release workflow publishes
via npm's [trusted publishing](https://docs.npmjs.com/trusted-publishers/)
(OIDC) rather than a long-lived token, so there is no `NPM_TOKEN` secret to
manage.

Trusted publishing can only be configured for a package that already exists
on npm, so the very first release needs a one-time manual bootstrap:

1. Run `pnpm build`, then `npm login` and `npm publish --access
   public --no-provenance` (or `--access restricted` for a scoped private
   package) locally, once, to reserve the name. `--no-provenance` is
   required here: `publishConfig.provenance: true` otherwise forces
   provenance generation, which only works from a supported CI provider
   (GitHub Actions, GitLab CI, ...) and errors out locally with
   `Automatic provenance generation not supported for provider: null`.
   This one bootstrap release just won't carry a provenance attestation;
   every release after it publishes from CI and gets one automatically.
2. On the package's npm page, open Settings > Trusted Publisher, choose
   GitHub Actions, and fill in your GitHub org/user, the repository name,
   the workflow filename `release.yml`, and "npm publish" as the allowed
   action. Leave "Environment name" blank unless the workflow is gated
   behind a GitHub environment.
3. From then on, every release goes through CI: merge a changeset to
   `main`, the release workflow opens a "Version Packages" pull request,
   and merging that pull request publishes the package to npm.

Under Settings > Actions > General, "Allow GitHub Actions to create and
approve pull requests" must be enabled, or the version pull request cannot be
opened.

`changeset publish` runs `pnpm publish` under the hood, which in turn shells
out to `npm publish` - trusted publishing is npm CLI's feature, not pnpm's,
so the workflow installs the latest npm before publishing to guarantee the
>=11.5.1 it requires. Provenance is generated automatically by trusted
publishing for a public repository publishing a public package; the
`publishConfig.provenance: true` field in `package.json` is kept for
documentation but isn't what triggers it anymore. Provenance still requires
`repository.url` in `package.json` to match the repository the release is
published from, so double-check it if the remote ever changes.
