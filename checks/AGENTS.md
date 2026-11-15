# checks

Proof that the library's checks catch what they must. `../scripts/check-fixtures.ts` runs
`tsc` and ESLint on each file in `fixtures/` and the story tests on
`stories/`, then compares each result with the file's `// expect:` line.

- A fixture starts with `// expect: clean`, `// expect: tsc <code>` or
  `// expect: eslint <rule>`. A type fixture whose rule also applies to the
  scripts has `// scope: scripts too` as its second line; the runner then
  lints it with `eslint.scripts.config.js` as well. A story is preceded by `// expect: pass` or
  `// expect: fail`.
- Fixtures may sit in folders. `fixtures/src/<folder>/` stands for
  `src/<folder>/`, so the tier, theme and story title rules apply to it
  as they do in `src/`.
- `panda.config.ts` is the library config plus two test tokens (`cyan.500`
  and `accent`). They exist only for the fixtures.
- When a new lint rule or check is added, add a fixture that it must
  catch, and run `pnpm checks`.
- Agents change files here only in a session started with
  `LIB_ALLOW_CHECK_EDITS=1`.
