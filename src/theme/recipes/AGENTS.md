# recipes

One config recipe per component, named after the component in kebab-case,
written with `defineRecipe` or `defineSlotRecipe` and listed in
`index.ts`. The other files hold shared styles, such as `focus.ts`.

- Take a slot recipe's slots from Ark's anatomy (`menuAnatomy.keys()`);
  `@ark-ui/react/anatomy` is the only Ark import allowed here.
- Semantic tokens only.
- Set `staticCss: ['*']`: Panda writes CSS only for variant values it
  finds in this source, never in an app's.
- Variant values are literals. A theme changes tokens, never variant
  names; a removed or renamed variant is a breaking change (d-063).
- A state style in `base` loses to a variant that sets the same
  property; set it again in that variant.
- `full` is a radius token only; write `'100%'` for a whole width.
- A slot's icon size loses to the `icon` recipe's own size. Pass `size`
  to an icon the component renders; size a caller's icon with `!`
  (`'icon.12!'`), and keep an important size in `base`, not a variant.
- A control drawn under 44 px that a finger taps takes a `touch` variant
  that spreads `touchTarget` from `touch.ts` (d-121), never its own
  `::before`. Rows that sit edge to edge, such as compact Menu rows,
  cannot spread one without covering the next row: their `touch`
  variant sets `minH: 'control.xl'` under `@media (pointer: coarse)`,
  so a mouse keeps the drawn size (Menu `touch`, R59).
- Write a focus ring under `[focusRing]` from `focus.ts`, never
  `_focusVisible`, with `outline: 'none'` on the same slot (R16). Keep the
  one definition here; `../../index.ts` re-exports it.
- A box that scrolls its own content spreads one style from
  `scroll-area.ts` beside its overflow (the owner, 2026-11-18: only these
  boxes scroll): `scrollArea` for a pane, `scrollAreaX` sideways inside a
  page, `scrollAreaNested` vertically inside a page. Never copy their
  properties; the box's story calls `expectScrollAreas`.
