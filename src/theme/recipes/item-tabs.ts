import { tabsAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The tabs of a Toolkit item (Selected and idle). The selected border was
// drawn solid on some frames and cyan 0.5 on others; it is `border.selected`.
// On a narrow screen the list scrolls sideways.
//
// `density="compact"` is the Toolkit item's tab row on a phone and a tablet
// (M2 `item tabs` 464:521, T3 and T17 487:365): the tabs start at the list's
// edge, 4 apart, and each pads 10 at its sides inside its 1 px border
// (`tab · Overview` 480:118, 84 x 32; T3: Overview 84, How it works 105,
// Files 51, Links 55, Evals 55, Activity 71). The list has no inset, so the
// list's scroll clip would cut a ring outside the tab; the focus ring moves
// inside it, as FilterChips `padding="none"` draws it. `default` keeps the
// 2 px list inset and 12 px sides.
//
// `tone="accent"` is the Toolkit item's selected tab (D3 `tab · Overview`
// 480:6, T17 487:366): the selected fill, a 1 px cyan border and the label
// in cyan (480:7). The label takes fg.accent, as ViewSwitch `tone="accent"`
// does, but the tab keeps its border, which ViewSwitch's accent tone drops.
// The border stays border.selected: it is the cyan (#5ee1ff) border token
// for a selected item, and border.accent (the same cyan) is for toasts
// only. An idle tab stays fg.muted. `default` keeps the fg.default label.
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
      '& svg': { width: 'icon.16!', height: 'icon.16!', flexShrink: '0' },
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
    density: {
      default: {},
      compact: { list: { p: '0' }, trigger: { px: '10', _focusVisible: { outlineOffset: '-2' } } },
    },
    tone: {
      default: {},
      accent: { trigger: { _selected: { color: 'fg.accent' } } },
    },
  },
  defaultVariants: { size: 'md', density: 'default', tone: 'default' },
})
