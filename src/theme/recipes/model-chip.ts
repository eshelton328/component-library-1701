import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { touchTarget } from './touch'

// The model chip of Workbench: in the composer (D2 105:905) and the chat
// header (D2 105:801, M3 105:2770). surface.raised with a border.default
// border, radius.md, 4 × 8 padding, a 6 px gap, a 12 px chevron and
// Medium 11 text (the `pill` style). The header chip has 3 px vertical
// padding in Figma; under d-072 both chips use 4. The chevron takes the
// label's colour, fg.default: every saved Figma picker draws it in the
// label's tone, not a muted grey (Artifacts D7 454:313 in 454:312, T5
// 454:389, M9 454:409; Inbox D14 454:3; Workbench D1 105:248, D2 105:802
// and 105:906; Toolkit D5 438:57, M7 464:162).
export const modelChip = defineSlotRecipe({
  className: 'model-chip',
  jsx: ['ModelChip'],
  staticCss: ['*'],
  slots: ['root', 'chevron', 'label'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      flexShrink: '0',
      minW: '0',
      maxW: '100%',
      py: '4',
      px: '8',
      bg: 'surface.raised',
      color: 'fg.default',
      textStyle: 'pill',
      whiteSpace: 'nowrap',
      borderRadius: 'md',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      outline: 'none',
      userSelect: 'none',
      '&:is(button)': { cursor: 'pointer' },
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
      // The chip of an open menu.
      _expanded: { borderColor: 'border.active' },
      _disabled: { opacity: 'disabled', cursor: 'not-allowed' },
    },
    // The chevron is the icon set's ChevronDownIcon at 12 px, in the root's (the label's) colour.
    chevron: { display: 'inline-flex', flexShrink: '0', color: 'inherit' },
    // TruncatedText inside cuts a long model and effort and shows it whole in a tooltip.
    label: { minW: '0' },
  },
  variants: {
    // The chip in the chat header (d-121): a 44 px touch target round the 26 px chip. ModelChip sets it only on the
    // chip that opens a menu.
    touch: { true: { root: touchTarget }, false: {} },
  },
  defaultVariants: { touch: false },
})
