// The condition of the library's own focus ring (screen review R16). A recipe
// writes its ring under `[focusRing]`, never under `_focusVisible`, and sets
// `outline: 'none'` on the same slot, so no state draws the browser's
// default outline: not `:focus:not(:focus-visible)`, not a quiet focus.
//
// The ring shows on `:focus-visible` (or Ark's `data-focus-visible`), but not
// on an element that carries `data-focus-quiet`. `controls/input-modality.ts`
// sets that attribute when an element takes the focus after a mouse, pen or
// touch press, such as the trigger that gets the focus back when a sheet,
// dialog, menu or popover closes by pointer. After a key press the attribute
// is not set, so keyboard users always see the ring (WCAG 2.4.7).
export const focusRing = '&:is(:focus-visible, [data-focus-visible]):not([data-focus-quiet])'
