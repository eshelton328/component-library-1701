import { defineSlotRecipe } from '@pandacss/dev'

// A message in a chat. Workbench D2 and phone M3:
// - The user's message (105:869, 105:2785): a bubble the width of the
//   transcript, fill #17213a (surface.raised), radius 12, padding 10 by 12,
//   no border; text Geist Regular 13/19 #e6ecff, merged into `body`.
// - The assistant's message (105:874, 105:2790): no fill; author row, body
//   and actions in a column with gap 6. The author row (105:875) has gap 6:
//   a 13 px kind mark (KindMark size 12) and the name in Geist SemiBold 12
//   #e6ecff, which no text style has; it uses `label`. The body (105:879)
//   is Geist Regular 13/19 #e6ecff (`body`).
// `size="sm"` sets the body in `bodySm` (13/20, d-090): the Inbox
// discussion draws Erik's message and the reply in Geist Regular 13/19
// (D15 403:1442 and 403:1444), and a 14 px body wraps where Figma's does
// not.
// Figma draws no time on a message; the time here is `mono` in fg.subtle on
// the transcript, or fg.muted inside the user's bubble.
export const message = defineSlotRecipe({
  className: 'message',
  jsx: ['Message'],
  staticCss: ['*'],
  slots: ['root', 'author', 'name', 'time', 'body', 'actions', 'srName'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '6', minW: '0', m: '0' },
    author: { display: 'flex', alignItems: 'center', gap: '6', minW: '0' },
    // TruncatedText inside cuts a long name and shows it whole in a tooltip.
    name: { minW: '0', textStyle: 'label', color: 'fg.default' },
    time: { flexShrink: '0', textStyle: 'mono', color: 'fg.subtle', fontVariantNumeric: 'tabular-nums' },
    body: { minW: '0', textStyle: 'body', color: 'fg.default', overflowWrap: 'anywhere' },
    actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6', _empty: { display: 'none' } },
    srName: { srOnly: true },
  },
  variants: {
    from: {
      // The bubble holds the text and the time; the time sits under the text.
      user: {
        root: { py: '10', px: '12', bg: 'surface.raised', borderRadius: 'xl', gap: '4' },
        time: { color: 'fg.muted', alignSelf: 'flex-end' },
      },
      assistant: {},
    },
    size: {
      md: {},
      sm: { body: { textStyle: 'bodySm' } },
    },
  },
  defaultVariants: { from: 'assistant', size: 'md' },
})
