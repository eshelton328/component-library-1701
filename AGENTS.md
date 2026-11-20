# component-library-1701

The component library for the-bridge, NCC-1701's interface: React
components on Ark UI, styled with Panda CSS v2, shown and tested in
Storybook. It ships as the private package
`@eshelton328/component-library-1701`.

The plan, the approved token set and the component list are in the brain at
`~/ncc-1701/engine/projects/ncc-1701/product/features/f-005-the-bridge/`
(`design-system.md`, `design-system-toolkit.md`, `design-inventory.md`).
The decisions (`d-NNN`) are in `~/ncc-1701/engine/projects/ncc-1701/decisions/`.
Read the inventory before you add a token or a component.

## Rules

- `src/structure.ts` holds the tiers (d-064), the purpose groups (d-065)
  and the bans that the lint reads. Read [src/AGENTS.md](src/AGENTS.md)
  before you change it.
- If a design needs a value that no token has, stop and name the missing
  token in your reply. Do not use the nearest token or a raw value (d-050).
- No `eslint-disable`, `@ts-ignore` or `@ts-expect-error` comments; the
  lint rejects them. Fix the code instead.
- Never weaken, skip or delete a test or a check, and never update a
  screenshot baseline, to make a check pass. Baselines change only through
  a CI workflow the owner starts, and a PR that changes one needs the
  owner's `baselines-approved` label (`.github/workflows/pr.yml`).
- Panda v2 builds a library with `panda lib`, not `panda ship`.

## Verify

- Run `pnpm verify` before you finish. CI runs the same steps as separate
  jobs in `.github/workflows/ci.yml`.
- A new step in `verify` needs a `run: pnpm <step>` line in `ci.yml`;
  `pnpm check:ci` fails without it.
- `.github/workflows/actions-minutes.yml` comes from the brain's
  `actions-minutes` skill. Render it again there; never edit it by hand.
- Never put a personal value in `.gitleaks.toml`. Add an exception only
  for one fixed path and one rule. Personal terms come from the repository
  secret `PRIVACY_TERMS`.

## Type safety

The library follows the brain's type-safety rule
(`~/ncc-1701/engine/toolkit/rules/type-safety.md`) and its TypeScript
profile. `tsc` and ESLint reject unchecked casts, `!`, `any`, a
`switch` that misses a union member and unchecked index reads.
`as const`, `satisfies` and type guards are allowed.

- Narrow `unknown` with a type guard or a schema parse, never a cast.
- A type guard or assertion function must test every property its type
  promises, and its tests must include input it rejects. Review checks
  this; no lint rule can.
- Parse data from outside the code (JSON, storage, network) before you
  use it as a domain type. Keep one definition of each shared type.
- `scripts/` and `tokens/` are TypeScript that Node runs without a build.
  Use only syntax Node can strip (`erasableSyntaxOnly`: no `enum`, no
  `namespace`, no parameter properties) and import local files with
  their `.ts` extension.

## Releases

semantic-release publishes to GitHub Packages with GitHub release notes
and no `CHANGELOG.md` (d-061). `.github/workflows/release.yml` runs it on
a push to `beta`, and to `main` only when the repository variable
`RELEASE_MAIN` is `true`. Versions stay `1.0.0-beta.N` until the owner
declares the first stable contract.

- The PR title becomes the squash commit and sets the version: `fix` a
  patch, `feat` a minor, `!` with a `BREAKING CHANGE:` footer a major.
  `build`, `ci`, `docs`, `test` and `chore` release nothing; never hide
  a shipped change under one of those.
- The public API is `src/index.ts`, reported in `api/`. After an API or
  recipe change, run `pnpm api:update` and commit the reports;
  `pnpm check:api` fails when they differ.
- A removed or changed member, or a new member with no `?`, is a breaking
  change (d-063); the `api-report` workflow fails until the title has `!`.
  Prefer to deprecate in a minor version and remove in the next major.
- Commit the `exports` that `pnpm build:lib` writes to `package.json`;
  `pnpm check:pack` fails when they differ.
- Leave the `package.json` version at `0.0.0-development`; the release job
  writes the real one in its own checkout.
- After a failed release, check the tags, the GitHub release and the
  package version before a rerun. Never publish over a version or delete
  its tag: a tag with no package needs a new `fix` or `feat` commit, or
  `pnpm check:release-registry` fails the rerun.

## Worktrees

- In a new worktree, run `pnpm install --frozen-lockfile`. Never link
  `node_modules` from another checkout: Vite serves only files inside the
  repository and pnpm refuses to run. The guard hook blocks the link.
- After a rebase that adds a story import, delete `node_modules/.vite`
  and `node_modules/.cache/storybook` before a local verify: an old Vite
  cache finds the import in the middle of the run, reloads and loads two
  React copies (overlay-layers Hydrate, "Invalid hook call"). CI starts
  with no cache.
- Worktrees can run `pnpm verify` at the same time; the story tests pick
  a free port. `pnpm storybook` uses port 6006.

## Hooks

`.claude/settings.json` runs the hooks in `scripts/agent-hooks/`. The edit
guard blocks changes to tests, baselines and check config unless the
session started with `LIB_ALLOW_CHECK_EDITS=1`; baselines stay blocked. A
Stop hook runs `pnpm verify` on a changed tree. Codex has no hooks, so CI
carries the same checks.

## Commits

Conventional Commits; CI checks the PR title. In the same PR, update the
`AGENTS.md` of each folder whose rules, commands or layout the change
alters, and the README when its status, prerequisites or quick start
change. A new folder gets an `AGENTS.md`, a `CLAUDE.md` shim and a link
from its parent, or a line in `.agentsignore`. The PR description names
each context file it changes, or says none needed a change.

## Folders

Before you read or edit files in a folder, read each `AGENTS.md` from
here down to that folder.

- [src/AGENTS.md](src/AGENTS.md): read before writing a component, a
  recipe or a story.
- [tokens/AGENTS.md](tokens/AGENTS.md): read before adding or changing a
  token, a theme or the token build.
- [checks/AGENTS.md](checks/AGENTS.md): read before changing a check
  fixture or the check runner.
- [scripts/AGENTS.md](scripts/AGENTS.md): read before changing a
  repository script, a release check or a Claude Code hook.
