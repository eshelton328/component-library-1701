import { radioGroupAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The option rows of the Artifacts M4 sort sheet (407:814, rows 407:790,
// 407:797, 407:802, 407:807): no fill and no border, padding 8/12, radius 8,
// 2 between rows, a Medium 14 title over a Regular 11 description, and a
// 16 px check in #5ee1ff on the chosen row only. The other rows keep the
// check's space empty. Tokens: `label`, `small` (the inventory merges
// Regular 11 into it), `fg.default`, `fg.muted`, `fg.accent`, `radius.md`.
export const optionList = defineSlotRecipe({
  className: 'option-list',
  jsx: ['OptionList'],
  staticCss: ['*'],
  slots: [...radioGroupAnatomy.keys(), 'itemBody', 'itemDescription'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '2', w: '100%' },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '10',
      px: '12',
      py: '8',
      borderRadius: 'md',
      cursor: 'pointer',
      userSelect: 'none',
      _hover: { bg: 'accent.faint' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled', _hover: { bg: 'transparent' } },
    },
    itemBody: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    itemText: { textStyle: 'label', color: 'fg.default' },
    itemDescription: { textStyle: 'small', color: 'fg.muted' },
    itemControl: {
      display: 'inline-flex',
      flexShrink: '0',
      color: 'fg.accent',
      visibility: 'hidden',
      _checked: { visibility: 'visible' },
    },
  },
})
