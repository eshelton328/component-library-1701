import { popoverAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { scrollArea } from './scroll-area'

// The filter popovers of Inbox (D4 346:1737, T14 346:8876) and Artifacts
// (D3 403:6852): a box under its button, with labelled sections of rows and
// a footer row with a note and the buttons. No arrow and no title.
// `width` picks the box width: xs 160 (the Workbench skill picker, D1
// 105:406), sm 240 (a small menu), filter 300 (the Inbox
// Filter menu, D4 346:1737), md 320 (the default), lg 360 (the skill picker)
// and picker 380 (the Run in picker, D3 346:1234).
// `composer` is the skill list after "/" over a composer, which is the
// popover's trigger (screen review R8: 160 was narrow on a 3540 px
// screen). It grows with the composer: 40% of the trigger's width, which
// Ark's positioner sets as --reference-width, at least shell.pickerMin
// (240) and at most shell.pickerMax (400). So a 1512 px window's composer
// gets 400, a pane's narrow one 240 and a tablet's in between. The
// library has no breakpoint tokens, so the caller picks the phone's
// width: `trigger` is the trigger's whole width, as the phone's list is
// as wide as its composer (M3 105:2805, 358 at 390).
// `surface` picks the fill. `overlay` (the default) keeps surface.overlay,
// #0f1626 at 0.98, so the list under the box shows faintly. Figma fills the
// Inbox popovers opaque #17213a (the Filter menu, D4 346:1737): `raised`
// takes surface.raised, which is that value (d-100 rule 4: an existing
// token, no new one). Text on it stays fg.default and fg.muted, as
// surface.raised allows.
// `density="compact"` is the Workbench skill picker (D1 105:406): its rows
// start 7 inside the box edge, so the box pads 6 inside its 1 px border,
// as a Menu or RadioMenu box does (compact Sort menu 403:8881 included),
// and the SKILLS label row (105:407) is 21 tall, 20 here on the 4 px grid
// (2 + a 16 px eyebrow line + 2), with the label 8 in, as at the default.
// A section with `rule` draws the 1 px line after its label (105:409): 6
// after the text, to the label's end padding, in border.default.
// `inset="wide"` is the Artifacts Filter menu (D3 403:6852, T3, M3): its
// rows (403:6857 to 403:6955) start 13 in from the box edge, so the box pads
// 12 inside its 1 px border (spacing 12), and a 320 px box (`md`) holds
// rows 294 wide, as Figma's. The section labels keep their own 8 px inset
// and their 26 px rows, and the gap stays 2. It is its own variant, not a
// density, so it sets the box padding over either density.
// A section with `query` draws the typed text after its label, as the
// skill list after "/" labels its section "SKILLS MATCHING /wri" (Workbench
// M10 147:72, the D01 skill list's pattern): `sectionQuery` takes monoSm,
// the mono style at the eyebrow's 11/16, with no capitals, so "/wri" keeps
// the case it was typed in. It keeps the label's fg.muted.
// `maxHeight` caps the box: `available` (the default) at the room Ark
// measures beside the trigger (--available-height), `picker` also at
// shell.pickerHeight (288), so a long skill list after "/" scrolls in a
// short box over the composer and leaves the chat header and the thread
// clear (review R34). The box scrolls its content in either case.
export const popover = defineSlotRecipe({
  className: 'popover',
  jsx: ['Popover'],
  staticCss: ['*'],
  slots: [...popoverAnatomy.keys(), 'section', 'sectionLabel', 'sectionQuery', 'footer', 'note'],
  base: {
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      maxW: 'var(--available-width)',
      // Ark measures the space under the trigger; a long popover scrolls.
      maxH: 'var(--available-height)',
      overflowY: 'auto',
      ...scrollArea,
      p: '8',
      bg: 'surface.overlay',
      color: 'fg.default',
      borderRadius: 'xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      boxShadow: 'overlay',
      outline: 'none',
      _closed: { display: 'none' },
    },
    section: { display: 'flex', flexDirection: 'column', gap: '2' },
    // The label of a group of rows, such as KIND. fg.subtle is only for bg.canvas, so the label is fg.muted.
    // Figma's label row is 26 (D4 346:1738: 8 + a 14 px line + 4); the `eyebrow` line is 16, so the top pad is 6.
    sectionLabel: {
      px: '8',
      pt: '6',
      pb: '4',
      textStyle: 'eyebrow',
      textTransform: 'uppercase',
      color: 'fg.muted',
      '&[data-rule]': {
        display: 'flex',
        alignItems: 'center',
        gap: '6',
        _after: { content: '""', flex: '1', borderTopWidth: 'default', borderTopStyle: 'solid', borderColor: 'border.default' },
      },
    },
    sectionQuery: { textStyle: 'monoSm', textTransform: 'none' },
    footer: { display: 'flex', alignItems: 'center', gap: '8', px: '8', pt: '8', pb: '4' },
    note: { flex: '1', textStyle: 'small', color: 'fg.muted' },
  },
  variants: {
    width: {
      xs: { content: { w: 'shell.popoverXs' } },
      sm: { content: { w: 'shell.popoverSm' } },
      filter: { content: { w: 'shell.popoverFilter' } },
      md: { content: { w: 'shell.popover' } },
      lg: { content: { w: 'shell.popoverLg' } },
      picker: { content: { w: 'shell.popoverPicker' } },
      composer: { content: { w: 'clamp(token(sizes.shell.pickerMin), calc(var(--reference-width) * 0.4), token(sizes.shell.pickerMax))' } },
      trigger: { content: { w: 'var(--reference-width)' } },
    },
    surface: {
      overlay: {},
      raised: { content: { bg: 'surface.raised' } },
    },
    density: {
      default: {},
      compact: { content: { p: '6' }, sectionLabel: { pt: '2', pb: '2' } },
    },
    inset: {
      default: {},
      wide: { content: { p: '12' } },
    },
    maxHeight: {
      available: {},
      picker: { content: { maxH: 'min(var(--available-height), token(sizes.shell.pickerHeight))' } },
    },
  },
  compoundVariants: [{ density: 'compact', inset: 'wide', css: { content: { p: '12' } } }],
  defaultVariants: { width: 'md', surface: 'overlay', density: 'default', inset: 'default', maxHeight: 'available' },
})
