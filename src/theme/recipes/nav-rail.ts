import { defineSlotRecipe } from '@pandacss/dev'

// The desktop nav rail: Inbox rail 346:105. Selected item 346:114, idle item
// 346:123, label 346:122 and 346:131, icon frame 346:115, logo wrapper
// 346:106 and divider 346:112.
export const navRail = defineSlotRecipe({
  className: 'nav-rail',
  jsx: ['NavRail'],
  staticCss: ['*'],
  slots: ['root', 'logo', 'divider', 'list', 'item', 'icon', 'label', 'hint'],
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
    },
    logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' },
    // A 28 px line: the 52 px between the paddings less 12 on each side.
    // The 4 px below it is Figma's spacer 346:113.
    divider: { flexShrink: '0', h: '0', mx: '12', mb: '4', borderTopWidth: 'default', borderTopStyle: 'solid', borderTopColor: 'border.default' },
    list: { display: 'flex', flexDirection: 'column', gap: '6', listStyle: 'none', m: '0', p: '0' },
    item: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      // Figma 3 takes `4`, the larger of 2 and 4 (d-072).
      gap: '4',
      w: '100%',
      // Figma top 7 takes `8`, the larger of 6 and 8 (d-072); bottom 6.
      pt: '8',
      pb: '6',
      px: '0',
      borderRadius: 'lg',
      borderWidth: '0',
      bg: 'transparent',
      color: 'fg.muted',
      cursor: 'pointer',
      outline: 'none',
      _hover: { bg: 'accent.faint' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '&[aria-current="page"]': { bg: 'surface.selected', color: 'fg.accent' },
    },
    // Figma draws 22 px icons; the inventory merges 22 into `icon.24`.
    icon: { position: 'relative', display: 'inline-flex', w: 'icon.24', h: 'icon.24', '& > svg': { w: 'icon.24!', h: 'icon.24!' } },
    // The badge count for screen readers; the badge itself is hidden from them.
    hint: { srOnly: true },
    // As in Figma, a label wider than its 51 px item ("Workspaces" is 55 px) extends past the item, centred, and stays inside the 64 px rail.
    label: { textStyle: 'railLabel', color: 'inherit', whiteSpace: 'nowrap' },
  },
})
