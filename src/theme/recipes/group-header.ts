import { defineSlotRecipe } from '@pandacss/dev'

// The header above a group of rows. Inbox list 346:188 (expanded) and
// 346:299 (collapsed): padding 14/4/6/4, gap 6, a 12 px chevron, the label
// in Mono 11 caps with 0.44 tracking, the count and a 6 px dot. Workbench
// sidebar 105:623: padding 8/6/6/4, radius 8, a 14 px grip, a 13 px
// chevron, the same label and count, then a 14 px more icon at the end.
// The grip, chevrons and more icon take 12 px, on the 4 px icon scale.
// The chevrons are drawn in #8a97b8 (fg.muted), the count in #4a5675 (fg.subtle).
// The inventory merges every group header label into `eyebrow`.
// Figma's Inbox header is 34 tall: 14 + a 14 px label line + 6. With the
// 16 px `eyebrow` line it is 36 on the 4 px grid (d-100 rule 3): `list`
// pads 12 above and 8 below, so the label's centre sits 20 down, 1 above
// Figma's 21, and the rows start where a 36 px header ends.
// `project` is the project heading inside an Inbox group when the list is
// sorted by project (D11 346:4606): padding 8/0/2/10, gap 6, a 12 px folder
// in the leading slot and the name as written in Geist Mono 11 #8a97b8
// (`monoSm`, fg.muted). It is 26 tall; Figma's 14 px line makes it 24.
export const groupHeader = defineSlotRecipe({
  className: 'group-header',
  jsx: ['GroupHeader'],
  staticCss: ['*'],
  slots: ['root', 'leading', 'toggle', 'chevron', 'label', 'count', 'dot', 'actions'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '6',
      minW: '0',
      pb: '6',
      pl: '4',
      color: 'fg.muted',
      textStyle: 'eyebrow',
    },
    leading: {
      display: 'inline-flex',
      flexShrink: '0',
      '& svg': { w: 'icon.12!', h: 'icon.12!' },
    },
    toggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '6',
      flex: '1',
      minW: '0',
      p: '0',
      bg: 'transparent',
      color: 'inherit',
      font: 'inherit',
      letterSpacing: 'inherit',
      textAlign: 'start',
      borderWidth: '0',
      borderRadius: 'xs',
      outline: 'none',
      '&:is(button)': { cursor: 'pointer' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    chevron: { display: 'inline-flex', flexShrink: '0' },
    // TruncatedText inside cuts a long label and shows it whole in a tooltip.
    label: { minW: '0', textTransform: 'uppercase' },
    count: { flexShrink: '0', color: 'fg.subtle', fontVariantNumeric: 'tabular-nums' },
    dot: { flexShrink: '0', w: '6', h: '6', borderRadius: 'full' },
    actions: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4',
      flexShrink: '0',
      ms: 'auto',
      '& svg': { w: 'icon.12!', h: 'icon.12!' },
    },
  },
  variants: {
    // `list` is the Inbox list header; `sidebar` the Workbench sidebar one; `project` a project heading in a group.
    variant: {
      list: { root: { pt: '12', pr: '4', pb: '8' } },
      sidebar: { root: { pt: '8', pr: '6', borderRadius: 'md' } },
      project: { root: { pt: '8', pb: '2', pl: '10', textStyle: 'monoSm' }, label: { textTransform: 'none' } },
    },
    // The dot takes a status colour: amber on Inbox "Needs you" (346:194) and
    // Workbench (105:635), cyan on Inbox "Next steps" (346:265).
    dot: {
      working: { dot: { bg: 'status.working.fg' } },
      running: { dot: { bg: 'status.running.fg' } },
      needsYou: { dot: { bg: 'status.needsYou.fg' } },
      idle: { dot: { bg: 'status.idle.fg' } },
      done: { dot: { bg: 'status.done.fg' } },
      danger: { dot: { bg: 'status.danger.fg' } },
    },
  },
  defaultVariants: { variant: 'list' },
})
