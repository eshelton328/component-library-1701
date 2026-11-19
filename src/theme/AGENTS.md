# theme

The component styles: one config recipe for each component in
`recipes/`, added to the Panda theme by `../../panda.config.ts` (d-067,
after Park UI's preset). Panda generates a typed recipe function and its
variant props in `styled-system/recipes`. Tokens are not here; they come
from `../../tokens/`.

- Write each recipe with `defineRecipe` or `defineSlotRecipe` in its own
  file in `recipes/`, and list it in `recipes/index.ts`.
- Take a slot recipe's slots from Ark's anatomy:
  `slots: menuAnatomy.keys()`. `@ark-ui/react/anatomy` is the only Ark
  import allowed here.
- Use semantic tokens only. Status colours use `colorPalette`, so one
  recipe serves every status (d-069).
- Set `staticCss: ['*']` in every recipe. Panda writes CSS only for the
  variant values it finds in the source, and it never reads the code of
  an app that uses this package.
- A state style in `base` (`_expanded`, `[focusRing]`) loses to a
  variant that sets the same property. Set it again in that variant.
- `full` is a radius token only. For a width or height of the whole
  box, write `'100%'`; `w: 'full'` writes `width: full`, which the
  browser drops.
- A slot's `'& svg'` size loses to the `icon` recipe's own size,
  because Panda puts slot recipes in the cascade layer before recipe
  variants. When the component renders the icon, pass `size` to it.
  When the caller passes the icon in, size it with `!` (`'icon.12!'`).
  An important style in `base` also wins over one in a variant, so
  when a variant changes the size, set every size in the variants.
- Write a focus ring under `[focusRing]` from `recipes/focus.ts`, never
  under `_focusVisible`, and set `outline: 'none'` on the same slot, so no
  state draws the browser's default outline. The ring shows on
  `:focus-visible` but not on an element marked `data-focus-quiet`, which
  `../controls/input-modality.ts` sets when the focus comes after a mouse,
  pen or touch press (screen review R16). `../index.ts` exports the same
  constant for the pages of the-bridge; keep the one definition here.
  Panda writes `outline: 'none'` as a transparent outline, so a story
  checks the colour, not the style.
- Variant values are literals, so Panda can extract them. A theme changes
  tokens, never variant names; a removed or renamed variant is a breaking
  change.
- Components never import this folder; they import the generated recipe.
- `keyframes.ts` holds the keyframes, which `../../panda.config.ts` adds
  to the theme. A recipe names one in `animationName` and takes
  `animationDuration` and `animationTimingFunction` from the motion
  tokens (`durations`, `easings`), never a raw time or curve. Give the
  same part a `_motionReduce` style that only fades.
