# scripts

Repository scripts that are not part of the package.

- Write scripts in TypeScript; Node runs them directly
  (`node scripts/<name>.ts`). Parse JSON and other outside input with a
  type guard before use.
- A script whose name starts with `check-` is a check, so the edit guard
  blocks agent changes to it outside a `LIB_ALLOW_CHECK_EDITS=1` session.
- `check-fixtures.ts` (`pnpm checks`) proves the lint and type checks
  catch the fixtures in `../checks/`.
- `check-worktree.ts` runs `pnpm verify` in a fresh git worktree. CI
  runs it; never add it to `pnpm verify`, which it runs.
- `check-ci.ts` fails when a step of `pnpm verify` has no job step in CI.
- `check-agents-md.ts` runs in `pnpm verify`. It fails when a folder has
  no `AGENTS.md`, a `CLAUDE.md` is not the one-line shim `@AGENTS.md`, or a
  parent `AGENTS.md` does not link a child's. Exempt a folder in
  `.agentsignore`, not by deleting its file.

## Folders

- [agent-hooks/AGENTS.md](agent-hooks/AGENTS.md): read before changing a
  Claude Code hook or its tests.
