import { toggleGroupAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

const kinds = ['skill', 'agent', 'rule', 'workflow', 'hook'] as const

// The filter chips of Inbox, Artifacts and Toolkit: selected or idle, with a
// count and an optional kind dot. The selected border was drawn cyan 0.6 on
// some frames and solid on others; it is border.selected. On a phone the
// chips stay on one row and scroll.
export const filterChips = defineSlotRecipe({
  className: 'filter-chips',
  jsx: ['FilterChips'],
  staticCss: ['*'],
  slots: [...toggleGroupAnatomy.keys(), 'dot', 'count'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '6',
      // The row scrolls, which clips anything outside it; the padding keeps the focus ring visible.
      p: '2',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    },
    item: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      flexShrink: '0',
      h: 'control.md',
      px: '12',
      textStyle: 'label',
      whiteSpace: 'nowrap',
      bg: 'surface.inset',
      color: 'fg.muted',
      borderRadius: 'full',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      cursor: 'pointer',
      // Ark marks a selected chip with data-state="on".
      '&[data-state=on]': { bg: 'surface.selected', color: 'fg.default', borderColor: 'border.selected' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    dot: {
      w: '8',
      h: '8',
      flexShrink: '0',
      borderRadius: 'full',
      ...Object.fromEntries(kinds.map((k) => [`&[data-kind=${k}]`, { bg: `kind.${k}` }])),
    },
    count: { textStyle: 'mono', color: 'fg.muted' },
  },
})
