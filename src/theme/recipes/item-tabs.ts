import { tabsAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The tabs of a Toolkit item (Selected and idle). The selected border was
// drawn solid on some frames and cyan 0.5 on others; it is `border.selected`.
// On a narrow screen the list scrolls sideways.
export const itemTabs = defineSlotRecipe({
  className: 'item-tabs',
  jsx: ['ItemTabs'],
  staticCss: ['*'],
  slots: tabsAnatomy.keys(),
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '12', minW: '0' },
    list: {
      display: 'flex',
      alignItems: 'center',
      gap: '4',
      // The list scrolls, which clips anything outside it; the padding keeps the focus ring visible.
      p: '2',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    },
    // Each trigger shows its own selected state, so the moving indicator is not drawn.
    indicator: { display: 'none' },
    trigger: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      flexShrink: '0',
      px: '12',
      textStyle: 'label',
      whiteSpace: 'nowrap',
      borderRadius: 'md',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'transparent',
      color: 'fg.muted',
      bg: 'transparent',
      cursor: 'pointer',
      '& svg': { width: 'icon.16', height: 'icon.16', flexShrink: '0' },
      _selected: { bg: 'surface.selected', color: 'fg.default', borderColor: 'border.selected' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    content: {
      minW: '0',
      // Ark can mark a panel closed before it sets `hidden`; a closed panel never shows.
      _closed: { display: 'none' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
  },
  variants: {
    size: {
      sm: { trigger: { h: 'control.sm' } },
      md: { trigger: { h: 'control.md' } },
      lg: { trigger: { h: 'control.lg' } },
    },
  },
  defaultVariants: { size: 'md' },
})
