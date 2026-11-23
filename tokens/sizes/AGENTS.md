# sizes

One file per text size, named after the size (`<size>.json`) and listed
under the `size` modifier in `../resolver.json`: `small`, `default`
and `large` (d-122).

- A size file holds no values. `small.json` is empty, so the theme's
  `text` group applies: Small is the base type, the size of the Figma
  frames. `default.json` and `large.json` point each text style at the
  theme's group of the same name (`"{default.text.body}"`); a group
  `$extends` does not replace tokens that already exist.
- A text size changes only the font size and line height of a text style;
  `pnpm tokens:check` fails (`size`) if it changes the family, the
  weight, the letter spacing or any other token.
- Every line height, in every size, is a whole multiple of 4 px (`grid`).
  Write it as a ratio of the font size, rounded up to 4 places, so the
  browser lays out at least the whole px (d-100).
- The build emits each size other than the resolver's default as a Panda
  condition: `default` is `_textDefault`, matched by `.text-default &`.
  The app sets `text-default` or `text-large` on `<html>`, as it sets
  `dark`; `textSizeClass` in `src/foundations/text-size.ts` names
  them. Layouts still pick from the viewport width.

## Values

Font size / line height in px. Small is the base type. Default is each
Small font size times 8/7 and Large times (8/7)², rounded to a whole px
(d-122). Each line height is the multiple of 4 nearest the new size times
the Small ratio, raised by 4 until the ratio is at least 1.2 (1.4 for
body, bodyLg, bodySm and code).

| Style | Small | Default | Large |
|---|---|---|---|
| heading | 28/40 | 32/44 | 37/52 |
| headingSm | 26/36 | 30/40 | 34/48 |
| title | 20/28 | 23/32 | 26/36 |
| subtitle | 17/24 | 19/28 | 22/32 |
| paneTitle | 15/20 | 17/24 | 20/28 |
| label | 14/20 | 16/24 | 18/24 |
| labelLg | 16/24 | 18/28 | 21/32 |
| labelSm | 13/16 | 15/20 | 17/24 |
| labelSmStrong | 13/16 | 15/20 | 17/24 |
| labelXs | 12/16 | 14/20 | 16/20 |
| labelXsStrong | 12/16 | 14/20 | 16/20 |
| body | 14/20 | 16/24 | 18/28 |
| pageCount | 16/20 | 18/24 | 21/28 |
| bodyLg | 15/24 | 17/28 | 20/32 |
| bodySm | 13/20 | 15/24 | 17/28 |
| small | 12/16 | 14/20 | 16/20 |
| smallXs | 11/16 | 13/20 | 14/20 |
| mono | 12/16 | 14/20 | 16/20 |
| monoCaps | 12/16 | 14/20 | 16/20 |
| monoSm | 11/16 | 13/20 | 14/20 |
| code | 14/20 | 16/24 | 18/28 |
| eyebrow | 11/16 | 13/20 | 14/20 |
| navLabel | 10/12 | 11/16 | 13/16 |
| railLabel | 9/12 | 10/12 | 12/16 |
| badge | 10/12 | 11/16 | 13/16 |
| pill | 11/16 | 13/20 | 14/20 |
