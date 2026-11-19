# component-library-1701

The component library for the-bridge, NCC-1701's interface: React
components on Ark UI, styled with Panda CSS v2, shown and tested in
Storybook. It ships as the private package
`@eshelton328/component-library-1701`.

Planning lives in the owner's brain, not here: the plan, the toolkit plan and
the approved token set and component list are in
`~/ncc-1701/engine/projects/ncc-1701/product/features/f-005-the-bridge/`
(`design-system.md`, `design-system-toolkit.md`, `design-inventory.md`),
and the decisions (`d-NNN`) in
`~/ncc-1701/engine/projects/ncc-1701/decisions/`. Read the inventory
before adding a token or a component.

## Structure

`src/structure.ts` holds the structure, and the lint reads it:

- **Tiers** (d-064): `foundations`, `controls`, `parts`, `shell` and
  `pages` folders, each limited in what it may import. Only Controls
  import Ark UI.
- **Purpose groups** (d-065): Foundations, Actions, Forms, Navigation,
  Layout, Overlays, Status, Data display, Conversation and Examples. They
  name the Storybook sidebar and the Figma library pages. A tier name
  never does.
- **Theme** (d-067): every component style is a config recipe in
  `src/theme/recipes/`.
- **Layout** (d-066): pages and parts place components with Container,
  Stack, Inline and Grid. There is no Box and no Spacer.
- **No smart components** (d-068, d-069): data comes in as props and
  goes out through callbacks.
- **Breaking changes** (d-063): the exported props and recipe variants
  are the contract. A change from Figma comes as a PR that the owner
  approves.

## Verify

Run `pnpm verify` before you finish. It runs the token checks and their
tests, the Figma export tests, Panda codegen, `tsc`, ESLint, the hook
tests, the check fixtures (`checks/`), the import cycle check and its
tests, the `AGENTS.md` check and the Storybook story tests in Chromium,
the API report, the release script tests and the package
check. CI runs the same steps as separate jobs (typecheck, lint, tokens,
checks, test, package, build, worktree), so a PR shows which one failed.
A new step in `verify` needs a `run: pnpm <step>` line in
`.github/workflows/ci.yml`; `pnpm check:ci` fails without it. When the
worktree job ran `pnpm verify` on a commit and passed, typecheck, lint,
tokens, checks and test use its result instead of running the same
commands again; when it skipped verify, they run in full, and any other
end of the worktree job fails them (`scripts/ci-reuse.test.ts`).

`.github/workflows/actions-minutes.yml` counts the repository's Actions
spend in USD for the month to date every 3 hours, and the storage of the
package in GitHub Packages. It opens an issue at 50 % and 80 % of the
repository's part of the monthly budget, or when the month-end forecast
reaches 100 %. The brain's `actions-minutes` skill generates it from the
project facts; render it again there, never edit it by hand.

The `secrets` job in `ci.yml` runs gitleaks 8.30.1 on the commits of
each PR, with the rules in `.gitleaks.toml` and the personal terms from
the repository secret `PRIVACY_TERMS`; it fails when the secret is
missing. `.github/workflows/secret-history.yml` scans the full history
each Monday and keeps the issue "Secret scan of the full history" up to
date, with no values shown. The brain's `toolkit/hooks/secret-scan`
runs the same scan as a pre-commit hook. Never put a personal value in
`.gitleaks.toml`, and add an exception only for one fixed path and one
rule.

## Rules

- If a design needs a value that no token has, stop and name the missing
  token in your reply. Do not use the nearest token or a raw value
  (decision d-050).
- No `eslint-disable`, `@ts-ignore` or `@ts-expect-error` comments; the
  lint rejects them. Fix the code instead.
- Never weaken, skip or delete a test or a check, and never update a
  screenshot baseline, to make a check pass. Baselines change only through
  a CI workflow the owner starts.
- Panda v2 builds a library with `panda lib`, not `panda ship`.

## Releases

semantic-release publishes `@eshelton328/component-library-1701` to
GitHub Packages, with GitHub release notes and no `CHANGELOG.md` (brain
decision d-061). `release.config.js` holds the config, and
`.github/workflows/release.yml` runs it after the CI checks pass on a push
to `beta` (always) or `main` (only when the repository variable
`RELEASE_MAIN` is `true`). While `RELEASE_MAIN` is not `true`, a push to
`main` runs no CI checks; the beta push checks each commit before it
publishes. Versions are `1.0.0-beta.N` until the owner
declares the first stable contract.

- The PR title becomes the commit that sets the version: `fix` is a
  patch, `feat` a minor version, and `!` with a `BREAKING CHANGE:` footer
  a major version. `build`, `ci`, `docs`, `test` and `chore` release
  nothing. Never hide a shipped change under one of those.
- The public API is `src/index.ts`. `api/component-library-1701.api.md`
  is its report; `pnpm check:api` fails when the API changes and the
  report does not. Run `pnpm api:update` and commit the report with the
  change. `api/recipe-types.api.md` holds the recipe types that the API
  diffs read; `pnpm check:api` fails when it differs from
  `styled-system/recipes/`, and `pnpm api:update` writes it too.
- A removed or changed declaration or member in the report is a
  breaking change, and so is a new member with no `?` (d-063). The
  `api-report` workflow then labels the PR `breaking-change`, comments,
  and fails until the title has `!`. The release job checks again against
  the last release tag and fails when the analyzer would not make a
  major release. Prefer to deprecate in a minor version first and remove
  in the next major version.
- `pnpm build:lib` runs `panda lib`, which writes `dist/panda/` and the
  `exports` in `package.json`. Commit the exports it writes;
  `pnpm check:pack` fails when they differ or a target is not packed.
- `pnpm build:lib` then runs `pnpm build:components`. It builds
  `src/index.ts` into `dist/components/`, the package's root export:
  one ES module per source file (`vite.lib.config.ts`) and one rolled-up
  `index.d.ts` (API Extractor). Each `styled-system` import becomes the
  package's own subpath export, such as
  `@eshelton328/component-library-1701/recipes`. React and Ark UI stay
  external, and each module starts with `"use client"`.
- The version in `package.json` stays `0.0.0-development`. The release
  job writes the real version only in its own checkout.
- After a failed release, look at the tags, the GitHub release and the
  package version before you run it again. A failed job can publish part
  of a version; publish a fix as a new version, never over an old one.
  semantic-release pushes the tag before it publishes, so a failed
  publish leaves a tag with no package. `pnpm check:release-registry`
  then fails a rerun until a commit after the tag makes a release (`fix`
  or `feat`, not `ci` or `docs`); push a fix commit, and leave the tag.
- `panda.config.ts` sets `forceImportExtension`, so the packed
  `styled-system` files import under plain Node. `pnpm check:pack`
  imports each one.

## Type safety

The library follows omni's type-safety rule
(`~/ncc-1701/engine/toolkit/rules/type-safety.md`) and its TypeScript profile.
In every hand-written `.ts` and `.tsx` file, `tsc` and ESLint reject
unchecked casts (`value as Order`, `as unknown as`, `!`, `value!: T`, an
object literal cast to a full type), `any` and values that come from
`any`, a `switch` on a union that misses a member, unchecked index reads,
and `undefined` written into an optional field. `as const`, `satisfies`
and type guards are allowed.

- Narrow `unknown` with a type guard or a schema parse, never a cast.
- A type guard (`value is T`) or an assertion function (`asserts value is
  T`) is a claim the compiler trusts without a check. Its body must test
  every property the type promises, and its tests must include input it
  rejects. Review checks this; no lint rule can.
- Parse data from outside the code (JSON, storage, network) before you
  use it as a domain type. No lint rule checks this; review does.
- Keep one definition for each shared type and import it; no lint rule
  checks this either.
- Each `tsconfig.json` setting and type lint rule has its own fixture in
  `checks/fixtures/` that fails when that one check is off, and
  `pnpm checks` fails when a tracked TypeScript file is outside the lint
  rules.
- The scripts in `scripts/` and `tokens/` are TypeScript, run by Node
  without a build step, so `tsc` and the same type rules check them. Use
  only syntax Node can strip (`erasableSyntaxOnly`): no `enum`, no
  `namespace`, no parameter properties. Import local files with their
  `.ts` extension.

## Worktrees

Agents often work in a git worktree, and every check must pass there.

- In a new worktree, run `pnpm install --frozen-lockfile`. It takes
  seconds, because pnpm links from its store. Never link `node_modules`
  from another checkout: Vite serves only files inside the repository, so
  the story tests load nothing, and pnpm refuses to run. The guard hook
  blocks the link.
- The story tests pick a free port on each run, so worktrees can run
  `pnpm verify` at the same time. `pnpm storybook` uses port 6006.
- `pnpm check:worktree` adds a fresh worktree of `HEAD`, runs
  `pnpm install` and `pnpm verify` in it, and removes it. CI runs it on
  every PR that changes a file outside `src/` and `api/` (Markdown
  aside), before each release, and nightly on main (`nightly.yml`).

## Hooks

`.claude/settings.json` wires three Claude Code hooks from
`scripts/agent-hooks/`:

- `guard-checks.ts` (PreToolUse) blocks edits to tests, baselines and
  check config, and blocks snapshot update flags. A session that must
  change tests or checks starts with `LIB_ALLOW_CHECK_EDITS=1`; baselines
  stay blocked.
- `lint-edit.ts` (PostToolUse) runs ESLint on each edited file in `src/`
  or `.storybook/` and returns the errors.
- `verify-stop.ts` (Stop) runs `pnpm verify` when the tree has changes
  and blocks the stop once on failure.

Codex has no matching hooks, so CI carries the same checks.

## Commits

Conventional Commits. A PR title becomes the squash commit, and CI checks
its format. Changed baseline images need the owner's `baselines-approved`
label.

In the same PR as the change, update the `AGENTS.md` of each folder whose
rules, commands or layout the change alters, and the README when its
status, prerequisites or quick start change. A new folder gets its own
`AGENTS.md`, `CLAUDE.md` shim and a link from its parent, or a line in
`.agentsignore`. The PR description names each context file it changes,
or says none needed a change.

## Folders

- [src/AGENTS.md](src/AGENTS.md): read before writing a component, a
  recipe or a story, or before changing `src/structure.ts`.
- [tokens/AGENTS.md](tokens/AGENTS.md): read before adding or changing a
  token, a theme or the token build.
- [checks/AGENTS.md](checks/AGENTS.md): read before changing a check
  fixture or the check runner.
- [scripts/AGENTS.md](scripts/AGENTS.md): read before changing a
  repository script or a Claude Code hook.
