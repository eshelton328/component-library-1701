# tokens/figma

The repository side of the Figma token sync (brain decision d-070). It
turns the tokens into Figma variables and text styles and renders the
scripts that the Figma MCP tool `use_figma` runs. It never calls Figma.

- `pnpm tokens:figma` writes `.figma-sync/figma-tokens.json` and
  `.figma-sync/scripts/`: `theme.js`, `color.js`, `layout.js` and
  `text-styles.js` write, in that order (Color aliases Theme), and
  `fingerprint.js` reads. Each write script creates what is missing and
  updates the rest by name, so a rerun is safe. It reports a Figma
  variable with no token in `extraInFigma` and never deletes it.
- `target.json` holds the key of the Figma library file (d-070); the
  render prints it with the font families the text styles need.
- Save the reply of `fingerprint.js` as JSON, then run
  `pnpm tokens:figma:compare <file>`. Exit 0 means every variable and text
  style in the file matches the tokens. It fails when the tokens changed
  after the render.
- `lib.ts` holds the export, the render and the hashes; `templates.ts`
  holds the Figma scripts as strings, written without backticks. A change
  to how a value is written in Figma needs the same change in
  `fingerprint.js` and in `expectedHashes`, or the compare fails.
- Facts from the first sync (2026-11-15): a Figma opacity variable is a
  percent, so the export multiplies by 100; an empty `scopes` list does
  not hide a variable from publishing, so the primitives also set
  `hiddenFromPublishing`; Figma stores a description HTML-escaped.
- Shadows are not exported: an effect style cannot change with a mode.
- `test.ts` (`pnpm test:figma`) tests `lib.ts`.
