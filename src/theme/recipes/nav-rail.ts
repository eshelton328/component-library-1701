import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollArea } from './scroll-area'

// The desktop nav rail: Inbox rail 346:105. Selected item 346:114, idle item
// 346:123, label 346:122 and 346:131, icon frame 346:115, logo wrapper
// 346:106 and divider 346:112.
// `footer` holds content at the rail's end, such as the stacked Notifications
// `Switch` of d-118 (no Figma frame: an owner-approved exception). Its
// `mt: auto` pushes it to the bottom of the rail; when the items fill the
// rail it follows them at the rail's gap and scrolls with them.
export const navRail = defineSlotRecipe({
  className: 'nav-rail',
  jsx: ['NavRail'],
  staticCss: ['*'],
  slots: ['root', 'logo', 'divider', 'list', 'item', 'icon', 'label', 'hint', 'footer'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '6',
      w: 'shell.rail',
      flexShrink: '0',
      h: '100%',
      // Figma 14 takes `16`, the larger of 12 and 16 (d-072); the sides are 6.
      py: '16',
      px: '6',
      bg: 'surface.chrome',
      borderInlineEndWidth: 'default',
      borderInlineEndStyle: 'solid',
      borderInlineEndColor: 'border.default',
      overflowY: 'auto',
      ...scrollArea,
    },
    logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' },
    // Figma draws a 28 px line: the 52 px between the paddings less 12 on
    // each side. Here the rail's 1 px end border leaves 51 px, so it is 27.
    // The 4 px below it is Figma's spacer 346:113.
    divider: { flexShrink: '0', h: '0', mx: '12', mb: '4', borderTopWidth: 'default', borderTopStyle: 'solid', borderTopColor: 'border.default' },
    list: { display: 'flex', flexDirection: 'column', gap: '6', listStyle: 'none', m: '0', p: '0' },
    item: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      // Figma's items (Inbox D16 403:1598 to 403:1629, Toolkit D1 424:115 to
      // 424:144) are 50 high and 56 apart: top 7, a 22 px icon, 3, the 12 px
      // label and bottom 6. The inventory draws the icon at 24 (+2), so the
      // ties go to the smaller token to keep the item 50 high: top 7 takes `6`
      // (the icon's centre stays 18 down, as Figma's) and the gap 3 takes `2`
      // (the label starts 32 down, as Figma's). 6 + 24 + 2 + 12 + 6 = 50.
      gap: '2',
      w: '100%',
      pt: '6',
      pb: '6',
      px: '0',
      borderRadius: 'lg',
      borderWidth: '0',
      bg: 'transparent',
      color: 'fg.muted',
      cursor: 'pointer',
      outline: 'none',
      _hover: { bg: 'accent.faint' },
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '&[aria-current="page"]': { bg: 'surface.selected', color: 'fg.accent' },
    },
    // Figma draws 22 px icons; the inventory merges 22 into `icon.24`.
    icon: { position: 'relative', display: 'inline-flex', w: 'icon.24', h: 'icon.24', '& > svg': { w: 'icon.24!', h: 'icon.24!' } },
    // The badge count for screen readers; the badge itself is hidden from them.
    hint: { srOnly: true },
    footer: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', flexShrink: '0', mt: 'auto', w: '100%' },
    // As in Figma, a one-word label wider than its item ("Workspaces" is 55 px) extends past the item, centred.
    // The negative margin gives the label the rail's padding on both sides (63 px in all), so longer labels wrap
    // between words inside the rail, and a word wider than the rail breaks.
    label: { textStyle: 'railLabel', color: 'inherit', textAlign: 'center', mx: '-6', overflowWrap: 'anywhere' },
  },
})
