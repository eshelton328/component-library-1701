import { defineSlotRecipe } from '@pandacss/dev'

// The tags line of the Inbox task (346:343): a tag icon, then the tags with
// a "·" between, 6 apart. Figma draws the tags in #4a5675, so they use fg.subtle.
// The tags are Geist Mono 11 (346:348); `size="sm"` sets them in `monoSm`,
// and the default (`md`) keeps `mono` (12).
export const tagsLine = defineSlotRecipe({
  className: 'tags-line',
  jsx: ['TagsLine'],
  staticCss: ['*'],
  slots: ['root', 'icon', 'tag', 'separator'],
  base: {
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '6',
      minW: '0',
      textStyle: 'mono',
      color: 'fg.subtle',
      listStyle: 'none',
      m: '0',
      p: '0',
    },
    icon: {
      display: 'inline-flex',
      flexShrink: '0',
      '& svg': { w: 'icon.12!', h: 'icon.12!' },
    },
    tag: { display: 'inline-flex', alignItems: 'center', gap: '6', minW: '0', overflowWrap: 'anywhere' },
    separator: { flexShrink: '0' },
  },
  variants: {
    size: {
      md: {},
      sm: { root: { textStyle: 'monoSm' } },
    },
  },
  defaultVariants: { size: 'md' },
})
