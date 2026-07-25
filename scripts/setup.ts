import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import process, { stderr, stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const README_MARKER = '<!-- TEMPLATE-HEADER-END -->';

const PROMPTS = ['Package name: ', 'Description: ', 'Author (Name <email>): '] as const;

// Approximates npm's naming rules (see validate-npm-package-name) without
// pulling in the dependency: lowercase only, URL-safe characters only
// (letters, digits, hyphens, dots, underscores), and the leading character
// of each segment can't be a dot or underscore. The optional `@scope/` part
// follows the same charset. Anything outside this - spaces, uppercase,
// `~'!()*`, a leading dot/underscore - would otherwise get written into
// package.json and only surface later, as a check:package failure. npm's
// reserved names (core module names, `node_modules`, `favicon.ico`) are not
// covered here; those only fail at publish time.
const NPM_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const NPM_NAME_MAX_LENGTH = 214;

interface Answers {
  name: string;
  description: string;
  author: string;
}

const PLACEHOLDER_OWNER_REPO = 'OWNER/REPO';

interface RepoFields {
  repository: { type: 'git'; url: string };
  homepage: string;
  bugs: { url: string };
  /** Non-null when the fields fall back to placeholders and the user needs a heads-up. */
  warning: string | null;
}

/**
 * Parses a git remote URL - SCP-style (`git@host:owner/repo.git`), or
 * `ssh://`/`git://`/`http(s)://`, with or without a trailing `.git` - into
 * a host and an `owner/repo` path. Returns null for anything unrecognized.
 */
function parseRemoteUrl(remoteUrl: string): { host: string; ownerRepo: string } | null {
  const scpMatch = remoteUrl.match(/^git@([^:/]+):(.+?)(?:\.git)?\/?$/);
  if (scpMatch?.[1] && scpMatch[2]) {
    return { host: scpMatch[1], ownerRepo: scpMatch[2] };
  }
  const urlMatch = remoteUrl.match(
    /^(?:git\+)?(?:https?|ssh|git):\/\/(?:[^@/]+@)?([^/]+)\/(.+?)(?:\.git)?\/?$/,
  );
  if (urlMatch?.[1] && urlMatch[2]) {
    // An ssh remote may carry a port (`ssh://git@host:22/owner/repo`) that
    // would be meaningless in the https URLs derived from it.
    return { host: urlMatch[1].replace(/:\d+$/, ''), ownerRepo: urlMatch[2] };
  }
  return null;
}

/**
 * Derives `repository`, `homepage`, and `bugs` for package.json from the
 * `origin` remote. Never throws: a user may legitimately run setup before
 * adding a remote, so a missing remote or unparseable URL falls back to an
 * obvious placeholder plus a warning to surface at the end of the run -
 * npm needs a matching `repository` field to attach a provenance
 * attestation, and silently shipping a placeholder there would only
 * surface as a failed publish.
 */
function getRepoFields(): RepoFields {
  const placeholder: RepoFields = {
    repository: { type: 'git', url: `git+https://github.com/${PLACEHOLDER_OWNER_REPO}.git` },
    homepage: `https://github.com/${PLACEHOLDER_OWNER_REPO}#readme`,
    bugs: { url: `https://github.com/${PLACEHOLDER_OWNER_REPO}/issues` },
    warning:
      'No git "origin" remote was found (or `git remote get-url origin` failed), so ' +
      `"repository", "homepage", and "bugs" in package.json were left as placeholders (${PLACEHOLDER_OWNER_REPO}). ` +
      'Set them to your real repository URL before your first release: npm requires a matching ' +
      '"repository" field to generate a provenance attestation, and without it the publish will fail.',
  };

  let remoteUrl: string;
  try {
    remoteUrl = execFileSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return placeholder;
  }

  const parsed = parseRemoteUrl(remoteUrl);
  if (!parsed) {
    return placeholder;
  }

  const { host, ownerRepo } = parsed;
  return {
    repository: { type: 'git', url: `git+https://${host}/${ownerRepo}.git` },
    homepage: `https://${host}/${ownerRepo}#readme`,
    bugs: { url: `https://${host}/${ownerRepo}/issues` },
    warning: null,
  };
}

/** Throws with an actionable message if `name` is not a valid npm package name. */
function validatePackageName(name: string): void {
  if (name.length > NPM_NAME_MAX_LENGTH) {
    throw new Error(
      `Package name "${name}" is ${name.length} characters long; npm package names must be ${NPM_NAME_MAX_LENGTH} characters or fewer.`,
    );
  }
  if (!NPM_NAME_PATTERN.test(name)) {
    throw new Error(
      `"${name}" is not a valid npm package name. npm names must be lowercase, use only URL-safe ` +
        'characters (letters, digits, hyphens, dots, underscores), and not start with a dot or ' +
        'underscore. Scoped names must look like "@scope/name".',
    );
  }
}

// rl.question() called repeatedly hangs on piped (non-TTY) stdin: readline
// closes once the pipe reaches EOF, so a second question() never resolves
// and the process exits with "unsettled top-level await". Reading the
// interface as an async iterator avoids that, and works the same way
// interactively.
async function ask(): Promise<Answers> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answers: string[] = [];
  try {
    stdout.write(PROMPTS[0]);
    for await (const line of rl) {
      answers.push(line.trim());
      if (answers.length >= PROMPTS.length) break;
      const nextPrompt = PROMPTS[answers.length];
      if (nextPrompt) stdout.write(nextPrompt);
    }
  } finally {
    rl.close();
  }
  return {
    name: answers[0] ?? '',
    description: answers[1] ?? '',
    author: answers[2] ?? '',
  };
}

async function main(): Promise<void> {
  const answers = await ask();
  if (!answers.name) {
    throw new Error('Package name is required.');
  }
  validatePackageName(answers.name);
  // Without an author the LICENSE would keep this template's copyright
  // holder, which is the last place a wrong name should survive.
  if (!answers.author) {
    throw new Error('Author is required; it becomes the LICENSE copyright holder.');
  }

  const repoFields = getRepoFields();

  const pkg = JSON.parse(await readFile('package.json', 'utf8')) as Record<string, unknown>;
  pkg.name = answers.name;
  pkg.description = answers.description;
  pkg.author = answers.author;
  pkg.homepage = repoFields.homepage;
  pkg.bugs = repoFields.bugs;
  pkg.repository = repoFields.repository;
  const scripts = pkg.scripts as Record<string, string>;
  delete scripts['setup:template'];

  const readme = await readFile('README.md', 'utf8');
  const markerAt = readme.indexOf(README_MARKER);
  if (markerAt === -1) {
    throw new Error(`README.md is missing the ${README_MARKER} marker.`);
  }
  const body = readme.slice(markerAt + README_MARKER.length).trimStart();
  const nextReadme = `# ${answers.name}\n\n${answers.description}\n\n${body}`;

  const license = await readFile('LICENSE', 'utf8');
  const authorName = answers.author.replace(/\s*<.*>$/, '').trim() || answers.author;
  const nextLicense = license.replace(
    /Copyright \(c\) \d{4} .+/,
    `Copyright (c) ${new Date().getFullYear()} ${authorName}`,
  );

  // All reads succeeded and all replacements are computed - only now write.
  await writeFile('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
  await writeFile('README.md', nextReadme);
  await writeFile('LICENSE', nextLicense);
  await rm('scripts', { recursive: true, force: true });

  stdout.write(`\nReady. Package is now "${answers.name}".\nRun: pnpm verify\n`);

  if (repoFields.warning) {
    const banner = '!'.repeat(70);
    stdout.write(`\n${banner}\nWARNING: ${repoFields.warning}\n${banner}\n`);
  }
}

try {
  await main();
} catch (error) {
  // This runs in front of a person setting up a repository, so failures print
  // the actionable line rather than a Node stack trace.
  stderr.write(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
