import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

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
// `MetaChipButton` draws the same chip on a <button>, with a trailing 12 px
// chevron: the project chip that opens the project menu (Artifacts D2 403:472,
// 136 × 29: icon/folder 403:473 10 from the start, the project in mono
// 403:475, icon/down 403:476 10 from the end, 6 apart; also D7 452:2361, D8
// 452:2971, T2 405:440, M2 406:384). The `md` chip is 30 high (6 + 16 + 6
// and the 1 px border), as MetaChip `md` is. Only a button gets the pointer,
// the focus ring, the accent.faint hover tint of the library's hovered rows
// and the border.active border of an open menu trigger; a MetaChip span
// draws as before.
export const metaChip = defineSlotRecipe({
  className: 'meta-chip',
  jsx: ['MetaChip', 'MetaChipButton'],
  staticCss: ['*'],
  slots: ['root', 'icon', 'label', 'chevron'],
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
      '&:is(button)': {
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        _hover: { bg: 'accent.faint' },
        _expanded: { borderColor: 'border.active' },
        [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
        _disabled: { cursor: 'not-allowed', opacity: 'disabled', _hover: { bg: 'surface.inset' } },
      },
    },
    icon: {
      display: 'inline-flex',
      flexShrink: '0',
      '& svg': { w: 'icon.12!', h: 'icon.12!' },
    },
    // TruncatedText inside cuts a long label and shows it whole in a tooltip.
    label: { minW: '0' },
    // MetaChipButton's ChevronDownIcon, at 12 px (icon/down 403:476), in the chip's text colour.
    chevron: { display: 'inline-flex', flexShrink: '0', color: 'inherit' },
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
      // A variant's fill wins over the base hover, so the button's hover is set again here.
      raised: {
        root: {
          bg: 'surface.raised',
          '&:is(button)': { _hover: { bg: 'accent.faint' }, _disabled: { _hover: { bg: 'surface.raised' } } },
        },
      },
    },
  },
  defaultVariants: { size: 'md', tone: 'default', surface: 'inset' },
})
