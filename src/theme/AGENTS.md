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
- Variant values are literals, so Panda can extract them. A theme changes
  tokens, never variant names; a removed or renamed variant is a breaking
  change.
- Components never import this folder; they import the generated recipe.
