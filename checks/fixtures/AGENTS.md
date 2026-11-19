# fixtures

The check fixtures: `.ts` and `.tsx` files that the library checks must
catch, or must pass. `../../scripts/check-fixtures.ts` (`pnpm checks`) runs
`tsc` with `../tsconfig.json` and ESLint with `../eslint.config.js` on
every fixture in this folder and its subfolders (not `.d.ts` files), then
compares each result with the first line of the file.

- Line 1 of a fixture is its expected result:
  - `// expect: clean`: `tsc` and ESLint report nothing for the file.
  - `// expect: tsc <code>`, such as `// expect: tsc TS2322`: `tsc`
    reports that error code for the file. Other errors do not fail it.
  - `// expect: eslint <rule>`, such as
    `// expect: eslint @typescript-eslint/no-explicit-any`: ESLint reports
    that rule for the file. Other rules do not fail it.

  A file with any other first line fails `pnpm checks`.
- Line 2 is `// scope: scripts too` when the rule also applies to the
  scripts. For a `clean` or `eslint` fixture, the runner then lints the
  file with `../eslint.scripts.config.js` too, and the same expectation
  must hold. That config lints only `.tsx` fixtures.
- `src/<folder>/` stands for `src/<folder>/` of the library (such as
  `src/controls/` or `src/parts/`): `../eslint.config.js` gives the lint
  config `checks/fixtures/src` as its source folder, so the tier, theme
  and story rules apply to a fixture there as they do in `src/`. The
  rules in `../../src/AGENTS.md` apply to those files.
- Each `tsconfig.json` setting and each type lint rule has its own
  fixture that fails when that one check is off. When you add a setting
  or a rule, add its fixture and run `pnpm checks`.
- Agents change files here only in a session started with
  `LIB_ALLOW_CHECK_EDITS=1`.
