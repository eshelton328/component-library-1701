# component-library-1701

The component library for the-bridge, NCC-1701's interface: React
components on Ark UI, styled with Panda CSS v2, shown and tested in
Storybook. It ships as the private package
`@eshelton328/component-library-1701`.

Planning lives in Erik's brain, not here: the plan, the toolkit plan and
the approved token set and component list are in
`~/omni-brain/projects/ncc-1701/product/features/f-005-the-bridge/`
(`design-system.md`, `design-system-toolkit.md`, `design-inventory.md`),
and the decisions in `~/omni-brain/projects/ncc-1701/decisions/`. Read the
inventory before adding a token or a component.

## Verify

Run `pnpm verify` before you finish. It runs the token checks and their
tests, Panda codegen, `tsc`, ESLint, the hook tests, the check fixtures
(`checks/`), the `AGENTS.md` check and the Storybook story tests in
Chromium. CI runs the same command and builds Storybook.

## Rules

- If a design needs a value that no token has, stop and name the missing
  token in your reply. Do not use the nearest token or a raw value
  (decision d-050).
- No `eslint-disable`, `@ts-ignore` or `@ts-expect-error` comments; the
  lint rejects them. Fix the code instead.
- Never weaken, skip or delete a test or a check, and never update a
  screenshot baseline, to make a check pass. Baselines change only through
  a CI workflow Erik starts.
- Panda v2 builds a library with `panda lib`, not `panda ship`.

## Type safety

The library follows omni's type-safety rule
(`~/omni-brain/toolkit/rules/type-safety.md`) and its TypeScript profile.
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
its format. Changed baseline images need Erik's `baselines-approved`
label.

In the same PR as the change, update the `AGENTS.md` of each folder whose
rules, commands or layout the change alters, and the README when its
status, prerequisites or quick start change. A new folder gets its own
`AGENTS.md`, `CLAUDE.md` shim and a link from its parent, or a line in
`.agentsignore`. The PR description names each context file it changes,
or says none needed a change.

## Folders

- [src/AGENTS.md](src/AGENTS.md): read before writing a component, a
  recipe or a story.
- [tokens/AGENTS.md](tokens/AGENTS.md): read before adding or changing a
  token, a theme or the token build.
- [checks/AGENTS.md](checks/AGENTS.md): read before changing a check
  fixture or the check runner.
- [scripts/AGENTS.md](scripts/AGENTS.md): read before changing a
  repository script or a Claude Code hook.
