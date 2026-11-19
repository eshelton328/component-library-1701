# agent-hooks

The Claude Code hooks that `.claude/settings.json` runs, their shared
helpers and their tests.

- `lib.ts` holds the list of guarded files. Add a file there when an
  agent could pass a check by changing it.
- Every hook change gets a case in `test.ts`; run `pnpm test:hooks`.
  `test.ts` drops `LIB_ALLOW_CHECK_EDITS` from the environment of each
  hook run, so the cases pass in a session started with it.
- A Stop hook blocks once, then lets the stop go when `stop_hook_active`
  is true, so a check that cannot pass does not loop.
- Agents change files here only in a session started with
  `LIB_ALLOW_CHECK_EDITS=1`.
