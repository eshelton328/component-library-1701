# scripts

Repository scripts that are not part of the package.

- `check-agents-md.mjs` runs in `pnpm verify`. It fails when a folder has
  no `AGENTS.md`, a `CLAUDE.md` is not the one-line shim `@AGENTS.md`, or a
  parent `AGENTS.md` does not link a child's. Exempt a folder in
  `.agentsignore`, not by deleting its file.

## Folders

- [agent-hooks/AGENTS.md](agent-hooks/AGENTS.md): read before changing a
  Claude Code hook or its tests.
