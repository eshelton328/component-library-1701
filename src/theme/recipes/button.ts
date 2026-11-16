import { defineRecipe } from '@pandacss/dev'

// The button of every page. The design inventory found 8 variants drawn
// with 8 padding sets and three label sizes; this recipe merges them into
// one label style, the four control heights and the variants below. The
// discuss toggle and the text link with a chevron come later.
export const button = defineRecipe({
  className: 'button',
  jsx: ['Button'],
  // Panda writes CSS only for the variants it finds in the source, and it
  // never reads the code of an app that uses this package. Write them all.
  staticCss: ['*'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6',
    flexShrink: '0',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    cursor: 'pointer',
    textStyle: 'label',
    borderRadius: 'md',
    borderWidth: 'default',
    borderStyle: 'solid',
    borderColor: 'transparent',
    outline: 'none',
    _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    // The button of an open menu (aria-expanded). A variant with its own
    // border sets this again, because the variant's border wins over base.
    _expanded: { borderColor: 'border.active' },
    _disabled: { opacity: 'disabled', cursor: 'not-allowed' },
    // A toggle that is on (aria-pressed), such as Sort or Filter while a sort or
    // filter applies: Inbox D13 359:735, M15 346:12154, Artifacts D3 403:6453.
    // Fill #14263f (surface.selected), 1 px rgba(94,225,255,0.7)
    // (border.active), label #e6ecff (fg.default). It is a toggle of the
    // secondary button: primary and danger keep their own fill, so a pressed
    // button never looks like primary. `secondary` sets it again, because its
    // own fill and border would win over base.
    _pressed: { bg: 'surface.selected', color: 'fg.default', borderColor: 'border.active' },
    '& svg': { width: 'icon.16!', height: 'icon.16!', flexShrink: '0' },
    // The active dot (`indicator`): a 6 px ellipse in #5ee1ff (accent.default)
    // after the label, 6 apart (403:6841). The button is the dot's anchor when
    // it holds only an icon.
    '& > .button__indicator': { flexShrink: '0', w: '6', h: '6', borderRadius: 'full', bg: 'accent.default' },
    '&:has(> .button__indicator)': { position: 'relative' },
  },
  variants: {
    variant: {
      primary: { bg: 'accent.default', color: 'fg.onAccent' },
      secondary: {
        bg: 'surface.raised',
        color: 'fg.default',
        borderColor: 'border.default',
        _expanded: { borderColor: 'border.active' },
        _pressed: { bg: 'surface.selected', borderColor: 'border.active' },
      },
      danger: { bg: 'status.danger.fg', color: 'fg.onAccent' },
      dangerSoft: { bg: 'status.danger.bg', color: 'status.danger.fg', borderColor: 'status.danger.border', _expanded: { borderColor: 'border.active' } },
      dangerText: { color: 'status.danger.fg' },
    },
    size: {
      sm: { h: 'control.sm', px: '8', gap: '4' },
      md: { h: 'control.md', px: '12' },
      lg: { h: 'control.lg', px: '16' },
      xl: { h: 'control.xl', px: '20' },
    },
    // A square button that holds only an icon; give it an aria-label. Its
    // active dot sits in the top end corner: M15 346:12159 draws it at x 25,
    // y 2 in a 35 wide button, so 4 from the end and 2 from the top.
    iconOnly: {
      true: { px: '0', '& > .button__indicator': { position: 'absolute', top: '2', insetEnd: '4' } },
      false: {},
    },
  },
  compoundVariants: [
    { iconOnly: true, size: 'sm', css: { w: 'control.sm' } },
    { iconOnly: true, size: 'md', css: { w: 'control.md' } },
    { iconOnly: true, size: 'lg', css: { w: 'control.lg' } },
    { iconOnly: true, size: 'xl', css: { w: 'control.xl' } },
  ],
  defaultVariants: { variant: 'secondary', size: 'md', iconOnly: false },
})
