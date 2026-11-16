import { menuAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The menus of Workbench (chat actions, D2b and M9), the row menu and the
// sort menu: items with an icon, separators, a highlighted item, a danger
// item and, for sort, a checked item.
//
// The Inbox sort menu (D9 346:4000) gives a choice a description: the row
// takes padding 8/12, radius 8 and its own height (346:4003), and a Medium
// 14 label sits 2 above a Regular 11 description in #8a97b8 (346:4004):
// `label`, `small` (the inventory merges Regular 11 into it), `fg.muted`.
// The Inbox snooze menu (D12 346:5300) adds a group heading and a time at
// the end of a row. The heading (346:5301) has padding 10/4/4/4 and Mono 11
// in capitals with 0.44 tracking, #4a5675: `eyebrow`, and `fg.muted`
// because `fg.subtle` is not for `surface.overlay`. D9's heading (346:4001)
// takes the same style. The time (346:5310) is Mono 13 in #4a5675: `mono`
// (Mono 12, the inventory's style for meta and counts; there is no Mono 13
// style) in `fg.muted`.
export const menu = defineSlotRecipe({
  className: 'menu',
  jsx: ['Menu'],
  staticCss: ['*'],
  slots: [...menuAnatomy.keys(), 'itemBody', 'itemDescription', 'itemTrailing'],
  base: {
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      minW: 'shell.popoverSm',
      // Ark measures the space between the trigger and the screen edge; a long menu scrolls.
      maxH: 'var(--available-height)',
      overflowY: 'auto',
      p: '6',
      bg: 'surface.overlay',
      color: 'fg.default',
      borderRadius: 'xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      boxShadow: 'overlay',
      outline: 'none',
      _closed: { display: 'none' },
    },
    item: {
      display: 'flex',
      flexShrink: '0',
      alignItems: 'center',
      gap: '10',
      h: 'control.md',
      px: '10',
      textStyle: 'label',
      borderRadius: 'lg',
      color: 'fg.default',
      cursor: 'pointer',
      userSelect: 'none',
      outline: 'none',
      '& svg': { width: 'icon.16!', height: 'icon.16!', flexShrink: '0', color: 'fg.muted' },
      // The check of a picked choice is the accent colour, not the icon colour.
      '& [data-part=item-indicator] svg': { color: 'accent.default' },
      _highlighted: { bg: 'surface.selected' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
      // A danger item, such as Delete.
      '&[data-tone=danger]': { color: 'status.danger.fg', '& svg': { color: 'status.danger.fg' } },
      // A choice with a description line (Inbox D9 346:4003).
      '&[data-has-description]': { h: 'auto', py: '8', px: '12', borderRadius: 'md' },
    },
    itemBody: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    itemDescription: { textStyle: 'small', color: 'fg.muted', whiteSpace: 'nowrap' },
    itemTrailing: { flexShrink: '0', ms: 'auto', textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' },
    itemIndicator: { display: 'inline-flex', ms: 'auto', color: 'accent.default' },
    itemText: { flex: '1', whiteSpace: 'nowrap' },
    itemGroup: { display: 'flex', flexDirection: 'column', gap: '2' },
    itemGroupLabel: { px: '4', pt: '10', pb: '4', textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted' },
    separator: { borderTopWidth: 'default', borderTopStyle: 'solid', borderColor: 'border.default', my: '4', mx: '0' },
  },
})
