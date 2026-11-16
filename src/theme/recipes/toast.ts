import { toastAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The toast. Figma PZoW9BBu43qRgon1KhJcwU draws two by hand, read with
// get_design_context:
// - Inbox D18 `toast · created` 403:2943 (also T21 402:12214, M22 402:7589):
//   fill #17213a (surface.raised), a 1px border rgba(158,143,255,0.5)
//   (border.discuss), radius 10 (lg), padding 10 × 12, gap 8; a 14px check
//   403:2944 in #6ee7a8 (status.done.fg); the text 403:2946 in Geist Regular
//   12 #e6ecff (small, fg.default); Undo 403:2948 in Geist Medium 12 #5ee1ff
//   (fg.accent), pushed to the end by a spacer.
// - Workbench D20 `toast · moved` 417:2135 (also T13 420:1491, M22 422:819):
//   fill #171f30, which no token has (nearest: surface.raised), a border
//   rgba(94,217,250,0.5) (border.accent), padding 11 × 16 and Inter 13. It
//   is drawn off the library's type, so the toast follows D18's sizes; its
//   cyan border is the `accent` tone, D18's violet border the `discuss` tone.
// Neither frame has a shadow. The toast floats over the page, so it takes
// the overlay shadow of the other floating surfaces (tooltip, popover).
// The library has no weight token outside the text styles, so Undo's Medium 500 is text.label's weight.
// The close button has no Figma node; it is the dialog's, at icon.12.
//
// Inside the Toaster, Ark places each toast with CSS variables (--x, --y,
// --opacity, --z-index); the static toast has none of them, so those rules
// apply only under Ark's data-scope.
export const toast = defineSlotRecipe({
  className: 'toast',
  jsx: ['Toast', 'Toaster'],
  staticCss: ['*'],
  slots: [...toastAnatomy.keys(), 'icon'],
  base: {
    // The toasts sit over the list pane (D18: 12px in from its edges), so the group is as wide as one; a toast
    // is as wide as its content, up to the group's width.
    group: { w: 'shell.listPane', maxW: '100%' },
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '8',
      minW: '0',
      py: '10',
      px: '12',
      bg: 'surface.raised',
      color: 'fg.default',
      borderRadius: 'lg',
      borderWidth: 'default',
      borderStyle: 'solid',
      boxShadow: 'overlay',
      '&[data-scope="toast"]': {
        w: 'max-content',
        maxW: '100%',
        translate: 'var(--x) var(--y)',
        opacity: 'var(--opacity)',
        zIndex: 'var(--z-index)',
      },
    },
    icon: { display: 'inline-flex', flexShrink: '0', color: 'status.done.fg' },
    description: { flex: '1', minW: '0', textStyle: 'small', color: 'fg.default' },
    actionTrigger: {
      flexShrink: '0',
      p: '0',
      bg: 'transparent',
      border: 'none',
      textStyle: 'small',
      fontWeight: 'text.label',
      color: 'fg.accent',
      cursor: 'pointer',
      borderRadius: 'xs',
      outline: 'none',
      _hover: { textDecoration: 'underline' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    closeTrigger: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: 'icon.16',
      h: 'icon.16',
      p: '0',
      color: 'fg.muted',
      bg: 'transparent',
      border: 'none',
      borderRadius: 'xs',
      cursor: 'pointer',
      outline: 'none',
      _hover: { color: 'fg.default' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
    },
  },
  variants: {
    tone: {
      // A toast that confirms an action, such as a move with Undo (Workbench D20).
      accent: { root: { borderColor: 'border.accent' } },
      // A toast that confirms an action taken from a discussion, such as tasks created from one (Inbox D18).
      discuss: { root: { borderColor: 'border.discuss' } },
    },
  },
  defaultVariants: { tone: 'accent' },
})
