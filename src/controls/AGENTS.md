# controls

The Controls tier: one Ark UI part or one element each, and the layout
components (d-066).

- Import only from `foundations/` and other controls. This is the only
  tier that imports `@ark-ui/react`.
- Connect each Ark part to its recipe slot with `createSlotRecipeContext`;
  a one-element component uses `styled(element, recipe)` (d-067).
- The layout components are config recipes, not Panda patterns: a pattern
  writes CSS only for values it finds in this source, never an app's. Do
  not use the layout patterns the lint still allows here.
- The library has no breakpoint tokens, so a layout choice is a prop the
  page picks (such as Container `size`), never a window measure.
- Keep Ark's interaction state and expose each one as a controlled prop
  pair, such as `open` and `onOpenChange` (d-069).
- A control that takes or returns the focus calls `useInputModality()`
  from `input-modality.ts`, so a pointer press draws no ring (R16).
- When a page needs a different look, add a prop or variant (as Button's
  `expandedBorder` and `pressedBorder`). Pages never target a class name
  or override `_expanded` or `_pressed`.
- A `Glyph` keeps its character in the inline flow; absolute, inline-block
  or flex stops Chromium's find in page at it.
- A popover that a composer opens uses `width="composer"` (R8). Typed
  text goes in a `PopoverSection`'s `query`, never its capitals `label`.
- Stories of a scrolling box call `expectScrollAreas`, and of a scrolled
  pane also `expectScrollsByWheelAndKeys` (`scroll-area.testing.ts`).
- A `BottomSheet` play function awaits `motionDone` before it measures,
  calls `restPointerOn` before it reads an idle fill, and awaits
  `unmounted` after a close (`bottom-sheet.testing.ts`).
