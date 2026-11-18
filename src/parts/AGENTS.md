# parts

The Parts tier: the domain components, such as the status pill, the list
row, the card and the composer. Storybook and Figma show them under their
purpose group, never under "Parts" (d-065).

- Import only from `foundations/`, `controls/` and other parts. Never
  import `@ark-ui/react`; use the control that wraps the Ark part.
- No `css()`, `cva()` or `sva()`; the styles live in `../theme/recipes/`
  (d-067). Place children with the layout components in `controls/`,
  never with Panda patterns.
- A part shows the data it gets as props and reports through callbacks.
  The composer calls `onSubmit`; it does not send a message (d-068, d-069).
- A part may keep pure geometry in its own `.ts` file beside it, such as
  `map-graph-route.ts`, the routes of the `MapGraph` lines. The part
  imports it, `index.ts` does not export it, and the part's stories test
  what it draws.
