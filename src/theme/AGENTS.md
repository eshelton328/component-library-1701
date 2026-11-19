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
  An important style in `base` also wins over one in a variant.
  An icon given a `size` carries `data-icon-size`; a slot that keeps
  the caller's size (Button `keepIconSize`) sizes only
  `svg:not([data-icon-size])`. Keep a component's important icon size in
  `base`, not in a variant: a variant is in a later layer than the slot
  recipes, so a slot's important size (GroupHeader's actions) would win
  over it for a Button inside that slot. Button keys its opt-in on
  `data-keep-icon-size` in base for this reason.
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
- Every box that scrolls its own content (`overflow`, `overflowX` or
  `overflowY` `auto` or `scroll`) spreads one style from
  `recipes/scroll-area.ts` beside its overflow: no scroll bar on any
  platform (Erik, 2026-11-18: the app's document never scrolls; only
  these boxes do). A box that bounds a pane (the shell detail, a
  ScrollFrame, an overlay's content) spreads `scrollArea`, which also
  contains both axes, so a scroll at its end does not bounce or move the
  page. A box that scrolls sideways inside a page spreads `scrollAreaX`
  (x axis only). A box that scrolls vertically inside a page spreads
  `scrollAreaNested` (no axis). Chrome 144 and later apply
  `overscrollBehavior` to a box that does not overflow, so a short
  nested box that contains the y axis stops the page's wheel scroll.
  They set no overflow, size or layout. Do not copy their properties
  into a recipe. The story of each such box calls `expectScrollAreas`
  from `../controls/scroll-area.testing.ts` with its axes.
- Components never import this folder; they import the generated recipe.
- `keyframes.ts` holds the keyframes, which `../../panda.config.ts` adds
  to the theme. A recipe names one in `animationName` and takes
  `animationDuration` and `animationTimingFunction` from the motion
  tokens (`durations`, `easings`), never a raw time or curve. Give the
  same part a `_motionReduce` style that only fades.
