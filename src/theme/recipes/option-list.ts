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
// Figma (346:1248); `size="sm"` draws it in `labelSm` and the mono meta
// line (346:1251, Geist Mono 11) in `monoSm`, so a row is 50 tall, against
// 54 at the default size and Figma's 49. The chosen
// row is filled #14263f (346:1243, `surface.selected`), where the M4 sort
// sheet's chosen row has no fill, so the fill is `selectedFill`.
//
// `variant="card"` is the options of a question (Inbox D2 346:789): a
// bordered card per option with a leading 16 px radio, the chosen card
// outlined in cyan on the selected fill. Padding 12 by 14 (16, d-072),
// radius 10 (`lg`), 12 from the radio to the text, 3 from the title to the
// description (4, d-072), items at the top. Figma's outline is cyan 0.6;
// the token is border.selected (0.5), as the selected chip's is. The
// unselected card and the gap between cards were not read; they take
// border.default and 8. The card title is Medium 13 (346:793, `labelSm`
// with `size="sm"`) and the description Regular 12 (346:796, `small` at
// both sizes).
//
// The Workbench skill picker (D1 105:406): each row a mono /name (105:413)
// over a Regular 11 description (105:414, `small`), the highlighted row
// filled (`selectedFill`) and no check. The row note says the name is 13;
// the layer widths (7.2 px a character, "/pr-description" 108 wide, 16
// tall) are Geist Mono 12, so `labelStyle="mono"` takes `mono` (12/16).
// `check={false}` hides the check and its space on every row.
export const optionList = defineSlotRecipe({
  className: 'option-list',
  jsx: ['OptionList'],
  staticCss: ['*'],
  slots: [...radioGroupAnatomy.keys(), 'itemLeading', 'itemBody', 'itemHeading', 'itemBadge', 'itemDescription', 'itemTrailing', 'itemRadio'],
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
    itemRadio: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: 'icon.16',
      h: 'icon.16',
      borderRadius: 'full',
      borderWidth: 'strong',
      borderStyle: 'solid',
      borderColor: 'border.control',
      // The chosen radio (346:790) is an 8 px cyan dot in a 16 px #070b14 disc, no cyan ring:
      // accent.default on fg.onAccent, as the checked checkbox pairs them.
      '[data-state=checked] > &': {
        bg: 'fg.onAccent',
        borderColor: 'fg.onAccent',
        _after: { content: '""', w: '8', h: '8', borderRadius: 'full', bg: 'accent.default' },
      },
    },
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
    variant: {
      list: {},
      card: {
        root: { gap: '8' },
        item: {
          alignItems: 'flex-start',
          gap: '12',
          py: '12',
          px: '16',
          borderRadius: 'lg',
          borderWidth: 'default',
          borderStyle: 'solid',
          borderColor: 'border.default',
          '&[data-state=checked]': { bg: 'surface.selected', borderColor: 'border.selected' },
        },
        itemBody: { gap: '4' },
        itemControl: { display: 'none' },
      },
    },
    descriptionStyle: {
      text: {},
      mono: { itemDescription: { textStyle: 'mono' } },
    },
    selectedFill: {
      false: {},
      true: { item: { '&[data-state=checked]': { bg: 'surface.selected' } } },
    },
    size: {
      md: {},
      sm: { itemText: { textStyle: 'labelSm' } },
    },
    labelStyle: {
      text: {},
      mono: { itemText: { textStyle: 'mono' } },
    },
    check: {
      true: {},
      false: { itemControl: { display: 'none', _checked: { display: 'none' } } },
    },
  },
  compoundVariants: [
    { size: 'sm', descriptionStyle: 'mono', css: { itemDescription: { textStyle: 'monoSm' } } },
    // A mono label keeps `mono` at either size.
    { size: 'sm', labelStyle: 'mono', css: { itemText: { textStyle: 'mono' } } },
  ],
  defaultVariants: { variant: 'list', descriptionStyle: 'text', selectedFill: false, size: 'md', labelStyle: 'text', check: true },
})
