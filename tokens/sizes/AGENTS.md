# sizes

One file per text size, named after the size (`<size>.json`) and listed
under the `size` modifier in `../resolver.json`: `default`, `small` and
`large` (d-119).

- A size file holds no values. `default.json` is empty, so the theme's
  `text` group applies. `small.json` and `large.json` point each text
  style at the theme's group of the same name (`"{small.text.body}"`);
  a group `$extends` does not replace tokens that already exist.
- A text size changes only the font size and line height of a text style;
  `pnpm tokens:check` fails (`size`) if it changes the family, the
  weight, the letter spacing or any other token.
- Every line height, in every size, is a whole multiple of 4 px (`grid`).
  Write it as a ratio of the font size, rounded up to 4 places, so the
  browser lays out at least the whole px (d-100).
- The build emits each size as a Panda condition: `small` is
  `_textSmall`, matched by `.text-small &`. The app sets `text-small` or
  `text-large` on `<html>`, as it sets `dark`; `textSizeClass` in
  `src/foundations/text-size.ts` names them. Layouts still pick from the
  viewport width.

## Values

Font size / line height in px. Small is one px under Default (two at 20
and over, never under 9) and Large one over (two at 20 and over). Each line
height is the multiple of 4 nearest the new size times the Default ratio,
raised by 4 until the ratio is at least 1.2 (1.4 for body, bodyLg, bodySm
and code).

| Style | Default | Small | Large |
|---|---|---|---|
| heading | 28/40 | 26/36 | 30/44 |
| headingSm | 26/36 | 24/32 | 28/40 |
| title | 20/28 | 18/24 | 22/32 |
| subtitle | 17/24 | 16/24 | 18/24 |
| paneTitle | 15/20 | 14/20 | 16/20 |
| label | 14/20 | 13/20 | 15/20 |
| labelLg | 16/24 | 15/24 | 17/24 |
| labelSm | 13/16 | 12/16 | 14/20 |
| labelSmStrong | 13/16 | 12/16 | 14/20 |
| labelXs | 12/16 | 11/16 | 13/16 |
| labelXsStrong | 12/16 | 11/16 | 13/16 |
| body | 14/20 | 13/20 | 15/24 |
| pageCount | 16/20 | 15/20 | 17/24 |
| bodyLg | 15/24 | 14/24 | 16/24 |
| bodySm | 13/20 | 12/20 | 14/20 |
| small | 12/16 | 11/16 | 13/16 |
| smallXs | 11/16 | 10/16 | 12/16 |
| mono | 12/16 | 11/16 | 13/16 |
| monoCaps | 12/16 | 11/16 | 13/16 |
| monoSm | 11/16 | 10/16 | 12/16 |
| code | 14/20 | 13/20 | 15/24 |
| eyebrow | 11/16 | 10/16 | 12/16 |
| navLabel | 10/12 | 9/12 | 11/16 |
| railLabel | 9/12 | 9/12 | 10/12 |
| badge | 10/12 | 9/12 | 11/16 |
| pill | 11/16 | 10/16 | 12/16 |
