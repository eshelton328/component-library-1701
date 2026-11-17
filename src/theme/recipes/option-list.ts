import { radioGroupAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The option rows of the Artifacts M4 sort sheet (407:814, rows 407:790,
// 407:797, 407:802, 407:807): no fill and no border, padding 8/12, radius 8,
// 2 between rows, a Medium 14 title over a Regular 11 description, and a
// 16 px check in #5ee1ff on the chosen row only. The other rows keep the
// check's space empty. Tokens: `label`, `small` (the inventory merges
// Regular 11 into it), `fg.default`, `fg.muted`, `fg.accent`, `radius.md`.
// An option's badge (Inbox D2 346:792): the label and the pill in a row, 8
// apart and centred on each other; the caller passes the pill (346:794).
//
// The Run in picker rows (Inbox D3 346:1243, 346:1273, 346:1264): a 16 px
// leading mark (Claude, Codex or a plus) 10 before the text, the title with
// its pill, a Geist Mono 11 meta line (`descriptionStyle="mono"`: `mono`,
// 12), and at the end a check on the chosen row or a status pill on another
// (`trailing`). A row with a trailing element and no check gives the
// check's space to it, so the pill ends the row. The title is Medium 13 in
// Figma; it keeps `label` (14), the larger on a tie (d-072).
export const optionList = defineSlotRecipe({
  className: 'option-list',
  jsx: ['OptionList'],
  staticCss: ['*'],
  slots: [...radioGroupAnatomy.keys(), 'itemLeading', 'itemBody', 'itemHeading', 'itemBadge', 'itemDescription', 'itemTrailing'],
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
      '&:has(> .option-list__itemTrailing) > .option-list__itemControl:not([data-state=checked])': { display: 'none' },
    },
    itemLeading: { display: 'inline-flex', flexShrink: '0', color: 'fg.default' },
    itemTrailing: { display: 'inline-flex', alignItems: 'center', flexShrink: '0' },
    itemBody: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    itemHeading: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    itemText: { textStyle: 'label', color: 'fg.default' },
    itemBadge: { display: 'inline-flex', flexShrink: '0' },
    itemDescription: { textStyle: 'small', color: 'fg.muted' },
    itemControl: {
      display: 'inline-flex',
      flexShrink: '0',
      color: 'fg.accent',
      visibility: 'hidden',
      _checked: { visibility: 'visible' },
    },
  },
  variants: {
    descriptionStyle: {
      text: {},
      mono: { itemDescription: { textStyle: 'mono' } },
    },
  },
  defaultVariants: { descriptionStyle: 'text' },
})
