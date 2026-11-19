# tokens/figma

The repository side of the Figma token sync (d-070). It turns the tokens
into Figma variables, text styles and effect styles, and renders the
scripts that the Figma MCP tool `use_figma` runs. It never calls Figma;
the brain's `figma-token-sync` skill runs the sync.

- `pnpm tokens:figma` renders into `.figma-sync/`. Run the write scripts
  in the order it prints (Color aliases Theme), then `fingerprint.js`.
- A write script creates what is missing and updates the rest by name, so
  a rerun is safe. It never deletes; it reports extra Figma variables in
  `extraInFigma`.
- `target.json` holds the key of the Figma library file (d-070).
- Save the reply of `fingerprint.js` as JSON and run
  `pnpm tokens:figma:compare <file>`. Exit 0 means Figma matches the
  tokens; it fails when the tokens changed after the render.
- `templates.ts` holds the Figma scripts as strings; write them without
  backticks. A change to how a value is written in Figma needs the same
  change in `fingerprint.js` and in `expectedHashes` (`lib.ts`).
- Figma facts from the first sync (2026-11-15): an opacity variable is a
  percent, an empty `scopes` list does not hide a variable from
  publishing (set `hiddenFromPublishing`), and a description is stored
  HTML-escaped.
- A shadow's offset, blur and spread are fixed in its effect style, so
  they must match in dark and light; only its colour follows the mode.
- Run `pnpm test:figma` after a change to `lib.ts`.
