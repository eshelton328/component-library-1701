import { useEffect } from 'react'

// The last input modality, so the focus ring shows only after a key press
// (screen review R16). Browsers decide `:focus-visible` on their own, and some
// (Safari on iOS, or a focus that a script moves when a sheet closes) show it
// after a tap. This tracker reads every key and pointer press on the page and
// marks an element that takes the focus after a mouse, pen or touch press with
// `data-focus-quiet`. The `focusRing` condition of the recipes
// (`../theme/recipes/focus.ts`) draws no ring on such an element. A key press
// never sets the mark, so the keyboard always shows the ring (WCAG 2.4.7).
//
// A text field keeps its focus border after a tap too: it shows where the text
// goes. The mark goes away when the element loses the focus.

/** The attribute that hides the library's focus ring on an element. Keep it equal to the one in `focusRing`. */
export const quietFocusAttribute = 'data-focus-quiet'

type Modality = 'keyboard' | 'pointer'

let modality: Modality = 'keyboard'
let installed = false

/** The input that pressed last: `keyboard` until the first pointer press. */
export function lastModality(): Modality {
  return modality
}

function editable(el: Element) {
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement) return !['button', 'checkbox', 'radio', 'range', 'reset', 'submit', 'color', 'file', 'image'].includes(el.type)
  return el instanceof HTMLElement && el.isContentEditable
}

function onKeyDown(event: KeyboardEvent) {
  // A modifier alone, such as the Shift of a screenshot shortcut, does not move the focus.
  if (event.metaKey || event.ctrlKey || event.altKey) return
  modality = 'keyboard'
}

function onPointerDown() {
  modality = 'pointer'
}

function onFocusIn(event: FocusEvent) {
  const target = event.target
  if (!(target instanceof Element)) return
  if (modality === 'pointer' && !editable(target)) target.setAttribute(quietFocusAttribute, '')
  else target.removeAttribute(quietFocusAttribute)
}

function onFocusOut(event: FocusEvent) {
  const target = event.target
  if (target instanceof Element) target.removeAttribute(quietFocusAttribute)
}

function install() {
  if (installed || typeof document === 'undefined') return
  installed = true
  // Capture, so a press counts before any handler moves the focus.
  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('focusout', onFocusOut, true)
}

/**
 * Starts the tracker once for the page. Every control that can take the focus
 * or move it back (Button, BottomSheet, Dialog, Menu, Popover) calls it. The
 * listeners stay for the life of the page, as the last modality is the page's.
 */
export function useInputModality() {
  useEffect(install, [])
}
