import { toggleGroupAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollAreaX } from './scroll-area'

const kinds = ['skill', 'agent', 'rule', 'workflow', 'hook'] as const

// Clear at the start edge, opaque from the fade width in, clear again at the end edge.
const fade =
  'transparent, #000 var(--filter-chips-fade-start), #000 calc(100% - var(--filter-chips-fade-end)), transparent'

// The filter chips of Inbox, Artifacts and Toolkit: selected or idle, with a
// count and an optional kind dot. The selected border was drawn cyan 0.6 on
// some frames and solid on others; it is border.selected. On a phone the
// chips stay on one row and scroll.
//
// A row that scrolls fades its chips out over 24 px at each edge with more
// chips past it, so a cut chip reads as "scroll for more". Figma draws no
// fade; 24 is the spacing token the reviewer asked for (d-072). The fade is a
// mask, which uses only alpha, so it needs no colour token: #000 is opaque.
// The component sets data-overflow-start and data-overflow-end from the
// scroll position; a row that fits has neither and no mask.
//
// `compact` is the Inbox D1 chip row (346:151, chips 346:152 and 346:155):
// 30 high, 8 sides, 5 between chips and between label and count, a Geist
// Medium 12 label and a Mono 11 count. 5 takes 6 (d-072), which both gaps
// already are. The height is the padding (6 top and bottom), the 16 px line
// and the two 1 px borders, so no size token is needed. No text style is
// Medium 12 (d-050): the label takes `small` (Regular 12, the same size and
// line), and the count keeps `mono` (12).
//
// `md` is the Toolkit chip row: 32 high with the label 11 px from the chip's
// edge (T1 428:25, M1 429:62, D3 427:65), which the 1 px border and 10 px
// sides give. D1's chips (425:33) are 34 high with 12 px insets; 34 lies
// between control.md and control.lg, and md keeps 32, as the Toolkit's other
// frames draw it (d-100).
//
// `padding="none"` puts the chips flush with the row, as Toolkit's
// `filter · chips` (D1 425:32, M1 429:61) has no inset around them. The
// row still clips, so the focus ring moves inside the chip.
//
// The count is fg.subtle, the inventory's colour for counts (#4a5675, which
// d-055 lifts to #7986a6): Inbox D1 draws the chip counts dimmer than the
// labels (346:152). On a selected chip (surface.selected, where fg.subtle
// is not allowed) the count stays fg.muted.
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
      ...scrollAreaX,
      // A focused chip scrolls into view clear of the fade, so its focus ring shows.
      scrollPaddingInline: '24',
      '--filter-chips-fade-start': '0px',
      '--filter-chips-fade-end': '0px',
      '&[data-overflow-start]': { '--filter-chips-fade-start': 'token(spacing.24)' },
      '&[data-overflow-end]': { '--filter-chips-fade-end': 'token(spacing.24)' },
      '&[data-overflow-start], &[data-overflow-end]': {
        maskImage: `linear-gradient(to right, ${fade})`,
        _rtl: { maskImage: `linear-gradient(to left, ${fade})` },
      },
    },
    item: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      flexShrink: '0',
      h: 'control.md',
      px: '10',
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
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    dot: {
      w: '8',
      h: '8',
      flexShrink: '0',
      borderRadius: 'full',
      ...Object.fromEntries(kinds.map((k) => [`&[data-kind=${k}]`, { bg: `kind.${k}` }])),
    },
    count: { textStyle: 'mono', color: 'fg.subtle', '[data-state=on] &': { color: 'fg.muted' } },
  },
  variants: {
    size: {
      md: {},
      compact: { item: { h: 'auto', py: '6', px: '8', textStyle: 'small' } },
    },
    padding: {
      default: {},
      none: { root: { p: '0' }, item: { [focusRing]: { outlineOffset: '-2' } } },
    },
  },
  defaultVariants: { size: 'md', padding: 'default' },
})
