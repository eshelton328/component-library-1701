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
  `size` prop (desktop, tablet, phone, detail, item, page). desktop,
  tablet and phone have no max width. `size="detail"` is at most 748
  (`shell.detail`) at the start, or 1024 (`shell.detailWide`) in the
  middle when its query container (the `AppShell` detail) is at least
  1600 wide (`shell.detailWideFrom`). `size="item"` (an open Toolkit
  item, desktop padding) and `size="page"` (a Toolkit full page, 32
  sides) fill their parent below 1600; from it they are at most 1028
  (`shell.itemWide`) and 1448 (`shell.pageWide`), padding included, in
  the middle.
- `ChatColumn` (`layout.tsx`) is a chat's column: messages, empty state
  or reply box. It fills its parent up to 768 (`shell.thread`) and sits
  in the middle of a wider one. Put the entries and the reply box each in
  their own `ChatColumn`, so they line up; a page sets no chat width.
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
  offset, so it stays above the bar. As the detail's direct child it is
  also the keyboard dock: while `AppShell` sets `--app-shell-keyboard`,
  its footer rides up onto the keyboard with `translateY` and its body
  gets an equal clear bottom border, so its view ends at the raised
  footer; the frame's layout does not change.
- The `ScrollFrame` body and footer, like every library box that scrolls,
  draw no scroll bar and stop a scroll at their end, so the page never
  bounces (`scrollArea`, `../theme/AGENTS.md`). A wheel, a trackpad, a
  touch drag and the keys (PageDown, ArrowDown on the focused body) still
  scroll them; its stories check both with `expectScrollAreas` and
  `expectScrollsByWheelAndKeys` from `scroll-area.testing.ts`. A page
  adds no scroll bar styles of its own.
- On a touch screen (`pointer: coarse`), a user's drag of the
  `ScrollFrame` body by more than 10 px, or a tap on it that is not on a
  link, button or field, blurs a focused text field, so the keyboard
  closes and the user can read; the draft stays. It reads touch events,
  never the scroll event, so a scroll from code never closes it. With a
  mouse nothing changes. A chat page sets nothing for it.
- `Button` draws `border.active` while `aria-expanded` is true. Keep that
  default on the trigger of a menu, popover or sheet. A disclosure toggle,
  a button that shows or hides a section in place (Hide transcript on a
  subagent card), sets `expandedBorder="default"` and keeps its variant's
  border; a page never overrides `_expanded` itself.
- A pressed `Button` draws `border.active`. The Discuss toggle sets
  `pressedBorder="discuss"` and draws `accent.discuss` while its
  discussion is open; a selected toggle chip (a chosen folder) sets
  `pressedBorder="selected"` and draws `border.selected`. A page never
  overrides `_pressed` itself.
- A `PopoverSection` label is in capitals (`eyebrow`). Text the user
  typed, such as the "/wri" of a skill list's "SKILLS MATCHING /wri",
  goes in its `query` prop, which keeps its case in `monoSm`; never put
  typed text in `label`.
- A list a composer opens, such as the skill list after "/", is a
  `Popover` whose trigger is the composer, at `width="composer"`: 40% of
  the trigger's width (Ark's `--reference-width`), clamped to
  `shell.pickerMin` (240) and `shell.pickerMax` (400), so it grows with
  the screen and stops before it becomes a pane (screen review R8). The
  library has no breakpoint tokens, so the page picks the phone's width:
  `width="trigger"`, the composer's whole width. Every other popover
  keeps a fixed width token. A mono `OptionList` label (a skill's /name)
  and its description stay on one line each, cut with `TruncatedText`;
  on a touch screen (`pointer: coarse`) they wrap and show whole, as no
  tooltip opens under a finger.
- `input-modality.ts` tracks the last key or pointer press on the page.
  After a mouse, pen or touch press, the element that takes the focus (such
  as the trigger that gets it back when a sheet, dialog, menu or popover
  closes) gets `data-focus-quiet`, and the recipes' `focusRing` draws no
  ring on it; a text field keeps its focus border. A key press never sets
  it, so the keyboard always shows the ring (WCAG 2.4.7). Ark returns the
  focus with `preventScroll`. A control that takes or returns the focus
  calls `useInputModality()` (Button, BottomSheet, Dialog, Menu, Popover),
  and so does `AppShell`, so a page's own block under `focusRing` gets the
  mark with no control on the page.
- `BottomSheet` closes on a touch or pen swipe down from the grabber or
  the title row, or from its content when that is scrolled to the top: a
  release past 30% of the sheet's height or a flick faster than 0.5 px/ms
  calls `onOpenChange(false)`, as the scrim does; a shorter drag springs
  back. A mouse moves the sheet only by the grabber, so a mouse drag of the
  title or the content selects text; a drag in a text field never moves
  it. It reads pointer events on window during a drag, so a test drives a
  touch with synthetic `PointerEvent`s; a mouse story uses the test
  runner's real mouse (`userEvent` from `vitest/browser`), as only a real
  press selects text. It slides up as its scrim fades in
  (`durations.sheetOpen`) and the close reverses both
  (`durations.sheetClose`), on `easings.sheet`; a swiped sheet slides
  down from the finger. With prefers-reduced-motion it only fades. Ark
  unmounts it when the close motion ends, so a play function that
  measures an open sheet first awaits `motionDone` from
  `bottom-sheet.testing.ts`.
- `BottomSheet scrim={false}` draws no scrim (the tablet side chat) and
  changes nothing else: the focus stays inside, the page stays hidden from
  assistive technology, and a press outside closes the sheet without
  reaching the page under it. `motionDone` waits for the sheet alone then.
- Keep Ark's own interaction state (open, highlighted, focus), and expose
  each one as a controlled prop pair, such as `open` and `onOpenChange`
  (d-069).
- `WorkspaceTabs` (and the `Workbench` that wraps it) places buttons in
  three bar slots: `leading` at the start, `actions` right after the last
  tab, and `trailing` at the right end, 16 from the bar's end (such as
  Reset pane sizes). The caller passes the buttons; the slots only place
  them, and an absent slot draws no element. With many tabs the list
  scrolls and the slots stay in view.
- `Glyph` (`glyph.tsx`) is a symbol character inside a line of text that
  the text fonts lack, such as ✗ (U+2717) and ✓ (U+2713). The character
  stays in the text, in no colour, so a screen reader reads it and a copy
  or a text search finds it; the mark icon from `foundations/icons.tsx`
  draws over it in the text's colour, at the text's size (`size`). A page
  puts the character in a `Glyph`, never an icon in its place and never
  the bare character, which the browser draws in a fallback font.
