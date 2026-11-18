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
- The layout components (`layout.tsx`: Container, Stack, Inline and Grid) are
  config recipes like every other component, not Panda's layout
  patterns: a pattern writes CSS only for the prop values it finds in
  the source, so a value that an app passes would get none. The lint
  still lets this tier import the layout patterns in `../structure.ts`;
  do not use them. No file uses `Box`, `Spacer` or the other free-form
  patterns. The library has no breakpoint tokens, so Container takes a
  `size` prop (desktop, tablet, phone) and has no max width yet.
- `ScrollFrame` (`scroll-frame.tsx`) is the frame of a page or pane whose
  header (a Back bar) and footer (a chat box) stay in view while only the
  body between them scrolls (brain decision d-107). It fills a parent
  that is a flex column with a bounded height. The frame does not cap
  its footer: a `Composer` caps its own long draft at 30% of the nearest
  size container (or of the window), and at rest keeps its full height.
  Give the frame's parent `containerType: 'size'` to cap the draft at
  30% of that parent; a page caps no reply box itself. A footer taller
  than the room the header leaves shrinks and scrolls inside; with
  `footerShrink={false}` it keeps its own height and only the body
  shrinks, for a footer that caps itself (a `Composer` with
  `layout="inline"`). The footer has no padding and no negative margin,
  so it never reaches past the frame. A direct child draws its focus
  ring inside its own box, with a `bg.canvas` line inside it; a control
  deeper down keeps its ring inside its own padding, as a `Composer` does. A page never targets the frame's class names, such
  as `.scroll-frame__footer`; it asks for a prop. As the direct
  child of an `AppShell` detail with `tabBarOverlay`, it reaches under
  the tab bar and lifts its footer and its body's end above it; anywhere
  else the two custom properties are unset and it draws as before. A
  sticky element inside its body (a Start button at its foot) sticks at
  `bottom: 'var(--scroll-frame-inset, 0px)'`, the frame's public bottom
  offset, so it stays above the bar.
- `Button` draws `border.active` while `aria-expanded` is true. Keep that
  default on the trigger of a menu, popover or sheet. A disclosure toggle,
  a button that shows or hides a section in place (Hide transcript on a
  subagent card), sets `expandedBorder="default"` and keeps its variant's
  border; a page never overrides `_expanded` itself.
- A pressed `Button` draws `border.active`. The Discuss toggle sets
  `pressedBorder="discuss"` and draws `border.discuss` while its
  discussion is open; a page never overrides `_pressed` itself.
- A `PopoverSection` label is in capitals (`eyebrow`). Text the user
  typed, such as the "/wri" of a skill list's "SKILLS MATCHING /wri",
  goes in its `query` prop, which keeps its case in `monoSm`; never put
  typed text in `label`.
- Keep Ark's own interaction state (open, highlighted, focus), and expose
  each one as a controlled prop pair, such as `open` and `onOpenChange`
  (d-069).
