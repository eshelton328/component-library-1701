import { tabsAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollAreaX } from './scroll-area'

// The tabs of a Toolkit item (Selected and idle). The selected border was
// drawn solid on some frames and cyan 0.5 on others; it is `border.selected`.
// On a narrow screen the list scrolls sideways.
//
// Only the selected tab has a border. Figma draws an idle tab as its label
// and its side padding (M27 `tab · Overview` 492:3975, 82 x 30, the label
// 10 in; T16 482:2079; D26 492:900, 86 x 32, 12 in) and the selected tab
// with a 1 px border outside the same padding (M27 `tab · Evals` 492:3983,
// 57 x 32, the label 11 in; T16 482:2087; D26 492:908). So the selected
// tab is 2 px wider than when idle, and the tabs after it start 2 px
// further right, as in Figma. Every tab keeps its size's height, so no
// label moves up or down when the selection moves.
//
// `density="compact"` is the Toolkit item's tab row on a phone and a tablet
// (M2 `item tabs` 464:521, T3 and T17 487:365): the tabs start at the list's
// edge, 4 apart, and each pads 10 at its sides, inside the selected tab's
// 1 px border (`tab · Overview` 480:118, selected, 84 x 32; M27: Overview
// 82, How it works 105, Files 51, Links 55, Activity 71 idle). The list
// has no inset, so the list's scroll clip would cut a ring outside the tab;
// the focus ring moves inside it, as FilterChips `padding="none"` draws it.
// `default` keeps the 2 px list inset and 12 px sides.
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
      ...scrollAreaX,
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
      // Only the selected tab has a border, outside its padding (M27 492:3975 and 492:3983).
      borderWidth: '0',
      borderStyle: 'solid',
      borderColor: 'transparent',
      color: 'fg.muted',
      bg: 'transparent',
      cursor: 'pointer',
      '& svg': { width: 'icon.16!', height: 'icon.16!', flexShrink: '0' },
      _selected: { bg: 'surface.selected', color: 'fg.default', borderWidth: 'default', borderColor: 'border.selected' },
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    content: {
      minW: '0',
      // Ark can mark a panel closed before it sets `hidden`; a closed panel never shows.
      _closed: { display: 'none' },
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
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
      compact: { list: { p: '0' }, trigger: { px: '10', [focusRing]: { outlineOffset: '-2' } } },
    },
    tone: {
      default: {},
      accent: { trigger: { _selected: { color: 'fg.accent' } } },
    },
  },
  defaultVariants: { size: 'md', density: 'default', tone: 'default' },
})
