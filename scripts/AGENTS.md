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
- `check-ci.ts` fails when a step of `pnpm verify` does not run on every
  pull request: it must be a `run: pnpm <step>` in a CI job, with no
  `if:` on the job or the step.
- `check-cycles.ts` (`pnpm check:cycles`) fails when files in `src/`
  import each other in a cycle; type-only imports do not count, and an
  `import.meta.glob` counts as an import of each file it matches, even
  when only its keys are used. It also fails on an import it cannot
  follow: a dynamic import of a computed name, or a glob with a computed
  pattern or an option other than `eager`.
  `cycles-lib.ts` holds its pure functions, and `cycles.test.ts`
  (`pnpm test:cycles`) tests them.
- `check-agents-md.ts` runs in `pnpm verify`. It fails when a folder has
  no `AGENTS.md`, a `CLAUDE.md` is not the one-line shim `@AGENTS.md`, or a
  parent `AGENTS.md` does not link a child's. Exempt a folder in
  `.agentsignore`, not by deleting its file.

- `check-api.ts` (`pnpm check:api`, `pnpm api:update`) builds the
  declarations of `src/index.ts` with `tsconfig.api.json` and compares
  them with `api/` through API Extractor (`api-extractor.json`).
- `check-api-diff.ts` compares two API reports by declaration and member,
  and finds removed or changed items and new required members. Members of
  an interface, a class or a type alias that is one plain object literal
  are items. So are the members of a type alias that is one plain object
  literal intersected with named types (`{ ... } & A & B;`); its tail
  (`& A & B;`) is one more required item, `Name.&`, so any change to the
  named types is breaking. A new optional member of such an alias is
  breaking when a named type in the tail has a member of that name or an
  index signature whose key type allows it (`string`, `number` or a
  template such as `data-${string}`), because it can narrow that
  property. When a named type is not in the report, is not a plain
  object or interface, or has a key type the parser cannot read, every
  new member of the alias is breaking. The same holds for a type alias
  whose object literal comes after named types or generic references
  (`Scalar<DialogVariantProps> & { ... } & A;`) or before them
  (`{ ... } & Scalar<B>;`): its head and tail are the
  one item `Name.&`. A generic reference `G<X>` allows the names of `X`
  only when `G` is a mapped type over the keys of its one parameter (as
  `Scalar` is); otherwise every new member of the alias is breaking. Any
  other type alias (a union, a second object literal, a generic alias, a
  mapped type, or a head or tail part with a qualified name, `typeof`, a
  union or a type argument with a body or a function) is one item. The `api-report`
  workflow runs on `pull_request_target`, so GitHub runs the base
  branch's copy of the workflow and of this script, and reads the PR's
  report as data. A change to either takes effect only after it merges.
- `check-commits.ts` checks every commit header since the last release
  tag; the release job runs it before semantic-release.
- `check-release-api.ts` (`pnpm check:release-api`) compares the API with
  the last release tag. It also reads the recipe types that Panda
  codegen writes to `styled-system/recipes/`, because the report imports
  the variant props (such as `DialogVariantProps`) and does not declare
  them. When a new member may narrow such a type, it also adds a
  temporary worktree of the tag, runs `pnpm install` there (which runs
  codegen) and reads the tag's recipe types, so a variant that the change
  removes still counts. When either side has no recipe types, every new
  member of such an alias is breaking. `check-api-diff.ts` reads only the two reports, so the
  `api-report` workflow counts a new member of such an alias as breaking. When it broke, `@semantic-release/commit-analyzer`
  with `release.config.js` must return `major` for the commits in the
  range, so a reverted breaking commit does not count. The release job
  runs it, because a squash message can drop the `!` that the PR title
  had. `semantic-release.d.ts` types the analyzer and the config.
- `check-pack.ts` (`pnpm check:pack`) builds the package with
  `pnpm build:lib` and checks the exports and the packed files. A
  wildcard export must pack a types file for each runtime file and the
  reverse, and the Panda manifest's preset and build info must be packed.
  It unpacks the tarball and imports each packed `.js`, `.mjs` and `.cjs`
  export target, and the Panda preset, under plain Node.
- `check-release-registry.ts` (`pnpm check:release-registry`) runs in the
  release job before semantic-release. It fails when the token cannot
  read the package, or when the last release tag has no package and
  `@semantic-release/commit-analyzer` finds no release in the commits
  after it. `semantic-release.d.ts` types the analyzer and the config.
- `build-components.ts` (`pnpm build:components`, part of
  `pnpm build:lib`) builds the components into `dist/components/` with
  `vite.lib.config.ts` and rolls up their types with API Extractor. It
  fails when the build holds a copy of `styled-system`, when a module does
  not start with `"use client"`, or when an import is not a dependency, a
  peer or a subpath that the package exports. It reads the imports with
  TypeScript's `preProcessFile`, so a comment is not an import.
- `release-lib.ts` holds the pure functions of these checks, and
  `release.test.ts` (`pnpm test:release`) tests them.
- `actions-minutes.test.ts` (also in `pnpm test:release`) runs the
  counting step of `.github/workflows/actions-minutes.yml` with bash and
  python3 against a fake `gh`. It checks that a re-run of a recent day is
  counted, that a partial count keeps the alert issue open, that the
  issue is found past the first page of open issues, that a day over
  the per-run call limit is finished by the next run from the ledger,
  that a re-run is counted until a day is final, that a recent day not
  counted again is missing, and that a workflow name with " / " stays
  whole.

## Folders

- [agent-hooks/AGENTS.md](agent-hooks/AGENTS.md): read before changing a
  Claude Code hook or its tests.
