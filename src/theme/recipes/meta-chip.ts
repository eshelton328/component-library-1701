import { defineSlotRecipe } from '@pandacss/dev'

// The meta chip had two builds (inventory inconsistency 10): Inbox task
// 346:327 (padding 8/4, gap 5, opaque fill, Mono 11 muted) and Artifacts
// 403:470 and 403:478 (padding 9/5, gap 6, fill at 0.5, Mono 12). Both have
// a 1 px #24314f border and radius 6. One chip with two sizes; the fill is
// `surface.inset`, where the inventory merges the meta chips. The Inbox
// chip's label is Geist Mono 11 (346:331), so `sm` sets it in `monoSm`;
// `md` keeps `mono` (12). The `sm` chip is 24 high in Figma (M5 346:9875,
// D1 346:327), with its 14 px text line 4 inside the 1 px border. The
// `monoSm` line is 16, so 4 above and below made it 26; `sm` takes
// control.xs (24) as its height and centres the label (d-100 rule 3: a size
// on the 4 px grid).
// `surface="raised"` fills the chip with the opaque #17213a of the Inbox
// chips (346:327, the NCC chip 346:342): surface.raised (d-100). The default
// `inset` keeps the merged surface.inset.
export const metaChip = defineSlotRecipe({
  className: 'meta-chip',
  jsx: ['MetaChip'],
  staticCss: ['*'],
  slots: ['root', 'icon', 'label'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      minW: '0',
      maxW: '100%',
      bg: 'surface.inset',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'sm',
      textStyle: 'mono',
      whiteSpace: 'nowrap',
    },
    icon: {
      display: 'inline-flex',
      flexShrink: '0',
      '& svg': { w: 'icon.12!', h: 'icon.12!' },
    },
    // TruncatedText inside cuts a long label and shows it whole in a tooltip.
    label: { minW: '0' },
  },
  variants: {
    size: {
      sm: { root: { h: 'control.xs', px: '8', py: '0', textStyle: 'monoSm' } },
      md: { root: { px: '10', py: '6' } },
    },
    // Artifacts draws the chip text in fg.default and the age chip in
    // fg.muted; Inbox draws its chips muted and the Linear ID (346:342) in
    // #9e8fff, which the inventory merges into accent.discuss.
    tone: {
      default: { root: { color: 'fg.default' } },
      muted: { root: { color: 'fg.muted' } },
      issue: { root: { color: 'accent.discuss' } },
    },
    surface: {
      inset: {},
      raised: { root: { bg: 'surface.raised' } },
    },
  },
  defaultVariants: { size: 'md', tone: 'default', surface: 'inset' },
})
