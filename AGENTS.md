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

Run `pnpm verify` before you finish. It runs the token checks, Panda codegen, `tsc`,
ESLint, the hook tests, the check fixtures (`checks/`) and the Storybook
story tests in Chromium. CI runs the same command and builds Storybook.

## Rules

- Style only with tokens. `strictTokens` makes a raw value such as
  `color: 'red'` a type error, and ESLint rejects arbitrary values
  (`'[red]'`), opacity modifiers (`'accent/37'`), primitive tokens where a
  semantic token exists, and inline `style` props.
- If a design needs a value that no token has, stop and name the missing
  token in your reply. Do not use the nearest token or a raw value
  (decision d-050).
- No `eslint-disable`, `@ts-ignore` or `@ts-expect-error` comments; the
  lint rejects them. Fix the code instead.
- Never weaken, skip or delete a test or a check, and never update a
  screenshot baseline, to make a check pass. Baselines change only through
  a CI workflow Erik starts.
- Panda v2 builds a library with `panda lib`, not `panda ship`.
- Components arrive in phase 4.

## Tokens

The source is DTCG JSON in `tokens/`: `layout.json` (spacing and sizes,
the same in every theme), one file per theme in `themes/` (a `dark` and a
`light` group of colours and shadows, plus type, radii, border widths,
blur and opacity) and `modes/`, which picks the dark or light group.
`resolver.json` lists the themes and modes. `pnpm tokens` checks the tokens
and writes `tokens/generated/preset.ts` and
`src/foundations/colours.mdx`; never edit those two by hand.

- The checks, in `tokens/build.mjs`: every theme and mode has the same
  tokens, every token has a `$description` saying where to use it, each
  colour's `hex` matches its `components`, and each pair in
  `tokens/contrast.json` meets its minimum in every theme and mode.
- A theme changes colours, shadows, type size, family and weight, radii,
  border widths, blur and opacity. It never changes spacing or sizes.
- Use a text style (`textStyle: 'body'`), not `fontSize` alone.
- `fg.subtle` is allowed only on the surfaces its description names. On
  `surface.raised` or `surface.selected`, use `fg.muted`.
- A new token needs a reason and a description, and Erik's approval: the
  token set changes only through a decision (d-050).

## Hooks

`.claude/settings.json` wires three Claude Code hooks from
`scripts/agent-hooks/`:

- `guard-checks.mjs` (PreToolUse) blocks edits to tests, baselines and
  check config, and blocks snapshot update flags. A session that must
  change tests or checks starts with `LIB_ALLOW_CHECK_EDITS=1`; baselines
  stay blocked.
- `lint-edit.mjs` (PostToolUse) runs ESLint on each edited file in `src/`
  or `.storybook/` and returns the errors.
- `verify-stop.mjs` (Stop) runs `pnpm verify` when the tree has changes
  and blocks the stop once on failure.

Codex has no matching hooks, so CI carries the same checks.

## Commits

Conventional Commits. A PR title becomes the squash commit, and CI checks
its format. Changed baseline images need Erik's `baselines-approved`
label.

## Folders

- [checks/AGENTS.md](checks/AGENTS.md): read before changing a check
  fixture or the check runner.
