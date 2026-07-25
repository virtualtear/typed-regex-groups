# ts-lib-base

A GitHub template for starting new ESM-only TypeScript libraries.

## Using this template

1. Click "Use this template" on GitHub to create a new repository from this
   one.
2. Clone your new repository and run:

   ```bash
   pnpm install && pnpm setup:template
   ```

   You will be asked for a package name, a description, and an author. The
   script rewrites `package.json`, `README.md`, and `LICENSE` accordingly,
   fills in `repository`, `homepage`, and `bugs` from your `origin` remote,
   then removes itself.

   `setup:template` runs a TypeScript file directly, so it needs Node 22.18
   or newer (Node 24 is what CI uses). The published package itself only
   requires Node 22.

<!-- TEMPLATE-HEADER-END -->

## Scripts

| Script | Purpose |
| --- | --- |
| `typecheck` | Type-check the project with `tsc --noEmit`. |
| `test` | Run the test suite once with Vitest. |
| `test:watch` | Run the test suite in watch mode. |
| `test:coverage` | Run the test suite with coverage reporting. |
| `bench` | Run the benchmark suite with Vitest bench. |
| `build` | Build the package with tsdown. |
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

1. Run `pnpm setup:template`, then `npm login` and `npm publish --access
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

## Placeholder library

`src/greet.ts`, `test/greet.test.ts`, and `bench/greet.bench.ts` are
placeholders that exist to keep the test, build, and bench scripts runnable
out of the box. Replace them with your own code as your first commit rather
than just deleting them: `pnpm test` fails once no file matches
`test/**/*.test.ts`, so swap in your own test instead of leaving the
directory empty.
