# themes

One file per theme, named after the theme (`<theme>.json`) and listed
under the `theme` modifier in `../resolver.json`.

- A theme holds a `dark` and a `light` group (colours and shadows), plus
  the type, radii, border widths, blur and opacity that do not change
  with the mode.
- It also holds a `default` and a `large` group: each text style again,
  with only its font size and line height changed (see
  [../sizes/AGENTS.md](../sizes/AGENTS.md)). The `text` group is the
  Small size.
- A token in one group must also be in the other, and every theme must
  have the same tokens with the same types; `pnpm tokens:check` fails
  otherwise.
- A theme changes token values only, never the layout (d-035).
