import { menuAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { scrollArea } from './scroll-area'

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
// `iconTone` sets the colour of a row's leading icon: `muted` (fg.muted, the
// default) or `default`, the label's colour. The phone's New menu (Workspaces
// M15 208:515) strokes its plus and grid icons (208:521, 208:529) in #e6ecff,
// the colour of their labels (208:519, 208:527): fg.default. The icon inherits
// the row's colour, so a danger row keeps its colour and the compact menu's
// highlighted row keeps fg.accent. A submenu chevron stays fg.muted.
// `width="phone"` is the phone's New menu (Workspaces M15 208:515): 220 wide
// (shell.popoverPhone), so it ends under + and leaves the end of the row title
// under it clear. Its 42 px rows with 18 px icons (208:516, 208:521, 208:529)
// are the D12 row, so it takes `size="lg"` (44 and 20 on the grid, d-100).
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
//
// A RadioMenu with `density="compact"` is the Artifacts Sort menu (D6
// 403:8881, 280 x 283): its choices (403:8884 to 403:8901) are 50 high in
// Figma, 48 here on the 4 px grid (d-100): padding 6/12 and the label
// (`label`, 20) straight over the description (`smallXs`, Regular 11/16;
// Figma's 11 on 14 px lines). The choices are 52 apart as Figma's: a 2 px
// margin over each adds to the group's 2 px gap, so they are 4 apart, and the
// first sits 4 under the heading. The note (403:8907) is `smallXs` on one 16
// px line, 2 under the last choice as at the default density (the compact box
// has gap 0), so the menu is Figma's 283 high. The component opens it 8 under
// its trigger (Figma y 150 under the Sort button).
//
// The box is glass, as Dialog and BottomSheet: Figma's menu (Workbench T12
// 420:1266, T2b 402:5721, D19 417:1740) fills #0f1626 at 0.95 over a 12 px
// background blur, so the text under an open menu does not show through.
// The fill stays `surface.overlay` and the blur is `blurs.glass` (d-044),
// on every box the recipe draws: the menu, a submenu's list and RadioMenu.
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
      ...scrollArea,
      p: '6',
      bg: 'surface.overlay',
      color: 'fg.default',
      borderRadius: 'xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      boxShadow: 'overlay',
      backdropFilter: 'blur(token(blurs.glass))',
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
      // The phone's New menu (M15 208:515), under the 240 floor of `base`.
      phone: { content: { w: 'shell.popoverPhone', minW: 'shell.popoverPhone' } },
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
        // Figma's line (D12 346:5334, 294 x 1) sits 2 under the row above it and 2 over the row below it: the box's
        // gap, with no margin of its own.
        separator: { my: '0' },
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
    // The leading icon's colour; `default` takes the row's (label's) colour (M15 208:521, 208:529).
    iconTone: {
      muted: {},
      default: { item: { '& [data-part=item-icon] svg': { color: 'inherit' } } },
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
          // A RadioMenu choice with a description (Artifacts D6 403:8884).
          '&[data-has-description]': { py: '6', px: '12', mt: '2' },
        },
        itemBody: { gap: '0' },
        itemDescription: { textStyle: 'smallXs' },
        footer: { mt: '2', textStyle: 'smallXs' },
      },
    },
  ],
  defaultVariants: { size: 'md', density: 'default', iconTone: 'muted' },
})
