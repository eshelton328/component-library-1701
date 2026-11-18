import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// The items of the phone More drawer: Artifacts M8 (415:315) and Toolkit M4
// (424:6940). The drawer itself is the `lg` bottom sheet. Selected
// (415:320), idle (429:512) and disabled (415:332) items; the "Later" group
// label (415:331).
//
// Toolkit M4 (424:6940) and Artifacts M8 draw the same drawer: idle items
// 364 x 62 (429:512, 424:6964, 424:6971) with the 36 px tile 12 in, the
// title (20) over the description (16) 2 apart, and the selected item
// (424:6945) 64 high with its 1 px border outside that. So an idle item has
// no border, and the current page's item adds the 1 px `border.selected`:
// 62 and 64, 4 apart, as Figma's. The title is Medium 15/20 (424:6950):
// `label` (Medium 14/20) keeps Figma's 20 px line, where `labelLg` (Medium
// 16/24, d-074) made each item 6 px taller and the title wider; 15 lies
// between the two sizes, and the line decides (d-100).
export const moreDrawer = defineSlotRecipe({
  className: 'more-drawer',
  jsx: ['MoreDrawer'],
  staticCss: ['*'],
  slots: ['group', 'groupLabel', 'list', 'item', 'tile', 'body', 'label', 'description', 'count', 'chevron'],
  base: {
    group: { display: 'flex', flexDirection: 'column', gap: '4' },
    // Figma pt 14 takes `16`, the larger of 12 and 16 (d-072).
    groupLabel: { textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted', pt: '16', pb: '2', ps: '4' },
    list: { display: 'flex', flexDirection: 'column', gap: '4', listStyle: 'none', m: '0', p: '0' },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '12',
      w: '100%',
      p: '12',
      borderRadius: 'lg',
      borderWidth: '0',
      borderStyle: 'solid',
      borderColor: 'transparent',
      bg: 'transparent',
      color: 'fg.default',
      textAlign: 'start',
      cursor: 'pointer',
      outline: 'none',
      _hover: { bg: 'accent.faint' },
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '&[aria-current="page"]': { bg: 'surface.selected', borderWidth: 'default', borderColor: 'border.selected' },
      _disabled: { opacity: 'disabled', cursor: 'default', bg: 'transparent', '& .more-drawer__tile': { bg: 'surface.inset' } },
    },
    tile: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: 'kindTile.lg',
      h: 'kindTile.lg',
      borderRadius: 'md',
      bg: 'accent.subtle',
      '& svg': { w: 'icon.20!', h: 'icon.20!' },
    },
    body: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    label: { textStyle: 'label', color: 'fg.default' },
    description: { textStyle: 'small', color: 'fg.muted' },
    count: { flexShrink: '0', textStyle: 'mono', color: 'fg.muted' },
    chevron: { flexShrink: '0', w: 'icon.16', h: 'icon.16', color: 'fg.muted' },
  },
})
