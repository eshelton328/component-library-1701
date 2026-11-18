// The input types that open an on-screen keyboard.
const typed = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number'])

/**
 * Whether `el` is a field that opens the on-screen keyboard when it has the focus: a textarea, a text-like input
 * (`typed`) or a contenteditable element (or one inside it). `ScrollFrame` blurs one to close the keyboard; `AppShell`
 * fits the visual viewport only while one has the focus.
 */
export const editable = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && typed.has(el.type)) || (el instanceof HTMLElement && el.isContentEditable)
