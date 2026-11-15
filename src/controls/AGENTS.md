# controls

The Controls tier: one Ark UI part or one element each, such as the
button, the sort menu and the item tabs, and the layout components
Container, Stack, Inline and Grid (d-066). Storybook and Figma show them
under their purpose group, never under "Controls" (d-065).

- Import only from `foundations/` and other controls. This is the only
  tier that imports `@ark-ui/react`.
- Connect each Ark part to its recipe slot with `createSlotRecipeContext`
  from `styled-system/jsx`. A one-element component uses
  `styled(element, recipe)`. No `css()`, `cva()` or `sva()` here; the
  styles live in `../theme/recipes/` (d-067).
- Only the layout components here use Panda's layout patterns (`Stack`,
  `Grid`, `Container` and the others in `../structure.ts`). No file uses
  `Box`, `Spacer` or the other free-form patterns.
- Keep Ark's own interaction state (open, highlighted, focus), and expose
  each one as a controlled prop pair, such as `open` and `onOpenChange`
  (d-069).
