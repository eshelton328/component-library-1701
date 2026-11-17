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
// Figma's lines are 18 and 14 high, so the row is 8 + 18 + 2 + 14 + 8 = 50;
// our `label` and `small` lines are 20 and 16, so the row pads 6, not 8,
// and stays 50 (D9 346:4003 to 346:4020: 50 high, 2 apart).
// RadioMenu's heading (D9 346:4001) has no group frame: its text sits 2
// under the box's padding and the first choice 8 under the text (a 4 px
// spacer, 346:4002, between 2 px gaps), so with the 16 px `eyebrow` line it
// pads 2 above and keeps 4 below; the Snooze heading (D12 346:5301) keeps 10/4.
// The Inbox snooze menu (D12 346:5300) adds a group heading and a time at
// the end of a row. The heading (346:5301) has padding 10/4/4/4 and Mono 11
// in capitals with 0.44 tracking, #4a5675: `eyebrow`, and `fg.muted`
// because `fg.subtle` is not for `surface.overlay`. D9's heading (346:4001)
// takes the same style. The time (346:5310) is Mono 13 in #4a5675: `mono`
// (Mono 12, the inventory's style for meta and counts; there is no Mono 13
// style) in `fg.muted`.
// `width` sets the box width: sm 240, sort 280 (D9 346:4000) or md 320 (D12
// 346:5300); without it the box takes its content's width, at least 240.
// `size="lg"` is the D12 row (346:5303): 42 tall in Figma, control.xl (44)
// here, padding 8, gap 12, radius 10 and 18 px icons, which take 20 on the
// icon scale; the box has padding 6/12/8. Figma sets its label in Regular
// 15 (346:5303), so the row sets `bodyLg` (Regular 15/24, d-100).
// RadioMenu's note (D9 346:4025) sits under a line: padding 14/12/4 (14
// takes 16, d-072) and Regular 11 in #4a5675: `small` and `fg.muted`, as the
// heading.
//
// The Workbench pane menu (D1 105:421) and chat actions menu (D2b
// 402:5486) put 31 px rows 1 apart (105:422 to 105:467, 402:5530 to
// 402:5518), with padding 8 and an 8 px icon-to-label gap (105:423,
// 105:429) and 14 px icons. On the 4 px grid (d-100) that is
// `density="compact"`: control.md (32) rows with no gap, the same 32 px
// pitch and Figma's box heights (215, 279). The icons stay icon.16, the
// nearer of 12 and 16 that keeps the 24 grid icons legible. Figma fills
// the row whose list is open and colours its icon cyan (105:449, D2b):
// surface.selected and fg.accent.
// A submenu row (Move to workspace, 105:449) ends with a 12 px chevron
// (105:459) in the icon colour; its list (105:473) is 200 wide:
// `width="submenu"` with shell.submenu, set by the component. The row
// stays filled while its list is open.
export const menu = defineSlotRecipe({
  className: 'menu',
  jsx: ['Menu'],
  staticCss: ['*'],
  slots: [...menuAnatomy.keys(), 'itemBody', 'itemDescription', 'itemTrailing', 'itemIcon', 'itemChevron', 'footer'],
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
      '& svg': { flexShrink: '0', color: 'fg.muted' },
      // The check of a picked choice is the accent colour, not the icon colour.
      '& [data-part=item-indicator] svg': { color: 'accent.default' },
      _highlighted: { bg: 'surface.selected' },
      // A submenu row whose list is open (D1 105:449).
      '&[data-part=trigger-item][data-state=open]': { bg: 'surface.selected' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
      // A danger item, such as Delete.
      '&[data-tone=danger]': { color: 'status.danger.fg', '& svg': { color: 'status.danger.fg' } },
      // A choice with a description line (Inbox D9 346:4003).
      '&[data-has-description]': { h: 'auto', py: '6', px: '12', borderRadius: 'md' },
    },
    itemBody: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    itemDescription: { textStyle: 'small', color: 'fg.muted', whiteSpace: 'nowrap' },
    itemIcon: {},
    itemChevron: { display: 'inline-flex', flexShrink: '0', ms: 'auto' },
    itemTrailing: { flexShrink: '0', ms: 'auto', textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' },
    itemIndicator: { display: 'inline-flex', ms: 'auto', color: 'accent.default' },
    itemText: { flex: '1', whiteSpace: 'nowrap' },
    itemGroup: { display: 'flex', flexDirection: 'column', gap: '2' },
    itemGroupLabel: {
      px: '4',
      pt: '10',
      pb: '4',
      textStyle: 'eyebrow',
      textTransform: 'uppercase',
      color: 'fg.muted',
      '&[data-choice-heading]': { pt: '2' },
    },
    separator: { borderTopWidth: 'default', borderTopStyle: 'solid', borderColor: 'border.default', my: '4', mx: '0' },
    footer: { pt: '16', px: '12', pb: '4', borderTopWidth: 'default', borderTopStyle: 'solid', borderColor: 'border.default', textStyle: 'small', color: 'fg.muted' },
  },
  variants: {
    width: {
      sm: { content: { w: 'shell.popoverSm' } },
      sort: { content: { w: 'shell.popoverSort' } },
      md: { content: { w: 'shell.popover' } },
      // A submenu's list (D1 105:473); the component sets it, not the caller.
      submenu: { content: { w: 'shell.submenu', minW: 'shell.submenu' } },
    },
    // An important size in `base` would beat the one here, so each size sets its own icon size.
    size: {
      md: {
        item: {
          '& svg': { width: 'icon.16!', height: 'icon.16!' },
          '& [data-part=item-chevron] svg': { width: 'icon.12!', height: 'icon.12!' },
        },
      },
      lg: {
        content: { pt: '6', px: '12', pb: '8' },
        item: {
          h: 'control.xl',
          px: '8',
          gap: '12',
          textStyle: 'bodyLg',
          '& svg': { width: 'icon.20!', height: 'icon.20!' },
          '& [data-part=item-indicator] svg': { width: 'icon.16!', height: 'icon.16!' },
          '& [data-part=item-chevron] svg': { width: 'icon.12!', height: 'icon.12!' },
        },
      },
    },
    // Only `size="md"` has a compact pitch; see the compound variant.
    density: { default: {}, compact: {} },
  },
  compoundVariants: [
    {
      size: 'md',
      density: 'compact',
      css: {
        content: { gap: '0' },
        item: {
          px: '8',
          gap: '8',
          '&[data-highlighted] [data-part=item-icon] svg, &[data-part=trigger-item][data-state=open] [data-part=item-icon] svg': { color: 'fg.accent' },
          // A danger row keeps its colour.
          '&[data-tone=danger] [data-part=item-icon] svg': { color: 'status.danger.fg' },
        },
      },
    },
  ],
  defaultVariants: { size: 'md', density: 'default' },
})
