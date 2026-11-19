# scripts

Repository scripts that are not part of the package: the checks, the
release checks, the component build and their tests.

- Write scripts in TypeScript that Node runs directly
  (`node scripts/<name>.ts`). Parse JSON and other outside input with a
  type guard before use.
- A `check-<name>.ts` file is a check, and a `*.test.ts` file a test:
  the edit guard blocks both outside a `LIB_ALLOW_CHECK_EDITS=1` session.
- Keep a check's pure functions in a `*-lib.ts` file and test them in a
  `*.test.ts` file. A new test file runs only once a `pnpm test:*` script
  in `../package.json` names it.
- Never add `check-worktree.ts` to `pnpm verify`; it runs `pnpm verify`.
- A step of `pnpm verify` must be a `run: pnpm <step>` in a CI job with
  no `if:`, except the reuse form of the reused jobs (`check-ci.ts`,
  guarded by `ci-reuse.test.ts`).
- `check-cycles.ts` cannot follow a dynamic import of a computed name or
  a glob with a computed pattern, and fails on one. Use static paths.
- Exempt a folder from `check-agents-md.ts` in `../.agentsignore`, never
  by deleting its `AGENTS.md`.
- `check-api.ts` reads `styled-system/recipes/`, so run `pnpm codegen`
  first.
- The `api-report` workflow runs on `pull_request_target`, with the base
  branch's copy of itself and of `check-api-diff.ts`. A change to either
  takes effect only after it merges.
- `check-commits.ts`, `check-release-api.ts` and
  `check-release-registry.ts` run in the release job, not in `verify`.
  `check-release-api.ts` reads the committed `api/recipe-types.api.md`,
  and `styled-system/recipes/` only when that file is missing.
- `secret-scan.test.ts` is not in `pnpm verify`: it needs gitleaks 8.30.1
  on `PATH` or in `GITLEAKS`. The `secrets` job in `ci.yml` runs it.
- Put no file under a top-level `b/` folder. The gitleaks path
  exceptions also match `b/<path>`, the name of a merge conflict hunk, so
  `secret-merge-prefix.ts` (the `secrets` job step "No files under b/")
  fails a PR with a commit that adds, changes or deletes such a file.

## Folders

- [agent-hooks/AGENTS.md](agent-hooks/AGENTS.md): read before changing a
  Claude Code hook or its tests.