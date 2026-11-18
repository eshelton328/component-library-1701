import { defineRecipe } from '@pandacss/dev'

// The button of every page. The design inventory found 8 variants drawn
// with 8 padding sets and three label sizes; this recipe merges them into
// the `label` style (with `textSize` for the 12 and 13 px labels of Inbox), the
// five control heights and the variants below. The discuss toggle is a
// pressed button with `pressedBorder: 'discuss'`; the text link with a
// chevron comes later.
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
    // The button of an open menu, popover or sheet (aria-expanded). A variant
    // with its own border sets this again, because the variant's border wins
    // over base. `expandedBorder: 'default'` keeps the variant's own border.
    _expanded: { borderColor: 'border.active' },
    // Each variant draws its own disabled look: most fade the whole button
    // (opacity.disabled), and secondary mutes only its label.
    _disabled: { cursor: 'not-allowed' },
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
      primary: { bg: 'accent.default', color: 'fg.onAccent', _disabled: { opacity: 'disabled' } },
      // A disabled secondary button keeps its fill and its border.default
      // border and draws its label and icon in #8a97b8 (fg.muted), with no
      // fade: Reset in Inbox M2 346:9287, T19 402:11597 and D16.
      secondary: {
        bg: 'surface.raised',
        color: 'fg.default',
        borderColor: 'border.default',
        _expanded: { borderColor: 'border.active' },
        _pressed: { bg: 'surface.selected', borderColor: 'border.active' },
        _disabled: { color: 'fg.muted' },
      },
      // Deny in an approval row (Inbox D1 346:213): the secondary box
      // (#17213a surface.raised, 1 px #24314f border.default) with a #ff6b80
      // label (status.danger.fg), which passes 4.5:1 on surface.raised.
      secondaryDanger: {
        bg: 'surface.raised',
        color: 'status.danger.fg',
        borderColor: 'border.default',
        _expanded: { borderColor: 'border.active' },
        _disabled: { opacity: 'disabled' },
      },
      danger: { bg: 'status.danger.fg', color: 'fg.onAccent', _disabled: { opacity: 'disabled' } },
      dangerSoft: {
        bg: 'status.danger.bg',
        color: 'status.danger.fg',
        borderColor: 'status.danger.border',
        _expanded: { borderColor: 'border.active' },
        _disabled: { opacity: 'disabled' },
      },
      dangerText: { color: 'status.danger.fg', _disabled: { opacity: 'disabled' } },
      // The action in a sheet header, such as Done, Clear, Cancel or Add:
      // Inbox T8 346:7178 (Geist Medium 15), Inbox M7 346:10490, Artifacts M7
      // 408:707 (Regular 14) and 408:711 (SemiBold 15), all #5ee1ff (fg.accent)
      // with no fill and no border. The three label styles merge into
      // `labelLg` (Medium 16): 15 lies between `label` (14) and `labelLg` (16),
      // and the larger wins a tie (d-072). The size variant keeps the height and
      // padding, so the hit area stays a full control. Hover tints the box in
      // accent.faint, as option and menu rows do.
      text: {
        color: 'fg.accent',
        textStyle: 'labelLg',
        _hover: { bg: 'accent.faint' },
        _disabled: { opacity: 'disabled', _hover: { bg: 'transparent' } },
      },
    },
    size: {
      // `xs` is the 24 px button of Inbox T5: Copy under a reply (346:6404) is
      // 22 high in Figma, on the 4 px grid 24 (control.xs, d-100).
      xs: { h: 'control.xs', px: '8', gap: '4' },
      sm: { h: 'control.sm', px: '8', gap: '4' },
      md: { h: 'control.md', px: '12' },
      lg: { h: 'control.lg', px: '16' },
      xl: { h: 'control.xl', px: '20' },
    },
    // The label's text style. `md` keeps `label` (Medium 14/20), or the
    // `labelLg` of the text variant. `sm` sets `labelSm` (Medium 13/16) on every
    // variant, as Inbox draws Newest and Filter (403:1663, 403:1671) and Keep it
    // (403:1884). `xs` sets `labelXs` (Medium 12/16), the label of the small
    // Inbox buttons: Reset, Edit, Change, Snooze, Dismiss, Discuss, Allow once,
    // Deny and Open chat (D16 403:1848, 403:1875). `smStrong` sets
    // `labelSmStrong` (SemiBold 13/16), as Start and Remove task are (403:3928).
    // The size variant keeps the height and padding.
    textSize: {
      md: {},
      sm: { textStyle: 'labelSm' },
      smStrong: { textStyle: 'labelSmStrong' },
      xs: { textStyle: 'labelXs' },
    },
    // The label and icon of a pressed button. `default` keeps fg.default, as
    // the Inbox Sort and Filter toggles draw it. `accent` draws them in
    // fg.accent (#5ee1ff), as the Toolkit phone's view buttons do: List
    // (466:54) has the selected fill, the cyan border and a cyan icon
    // (466:55; Figma's 17 px icon takes icon.16, d-100). It changes only a
    // pressed `secondary` button (a compound variant below): primary and the
    // danger variants keep their own label colour on their own fill, so a
    // pressed primary never draws fg.accent on accent.default.
    pressedTone: {
      default: {},
      accent: {},
    },
    // The border of an expanded button (aria-expanded). `active` draws
    // border.active, as the trigger of an open menu, popover or sheet does in
    // 14 Figma frames. `default` keeps the variant's own border, for a
    // disclosure toggle that shows or hides a section in place: Hide
    // transcript on a subagent card keeps #24314f (border.default) while open
    // (Workbench D3 105:1350, T3 105:2059, M6 105:3215). The compound
    // variants below set it per variant, because each variant's own
    // `_expanded` wins over a variant here. `_pressed` is not changed.
    expandedBorder: {
      active: {},
      default: {},
    },
    // The border of a pressed button (aria-pressed). `active` draws
    // border.active (cyan), as Sort and Filter do while a sort or filter
    // applies. `discuss` draws accent.discuss (#9e8fff dark, #5b4bd6 light),
    // for the Discuss toggle while its discussion is open: Inbox Discuss
    // (403:943, D14-D20, T16, T19, M17, M20) and Artifacts Discuss (452:2341
    // in D7, 452:2951 in D8). It is the solid violet, not border.discuss
    // (the same violet at 50%): over the pressed fill that one reaches only
    // 2.3:1 on light bg.canvas, and the pressed state needs 3:1 against
    // bg.canvas, surface.pane and surface.raised (WCAG 1.4.11). The solid
    // one reaches 5.6:1 or more on all three in both themes. Figma also
    // tints that button violet; the library has no discuss fill token, so
    // the pressed fill and label stay. A compound variant below sets it,
    // because base `_pressed` and the secondary variant's own `_pressed`
    // would win over a variant here. `_expanded` is not changed;
    // `expandedBorder` sets that.
    pressedBorder: {
      active: {},
      discuss: {},
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
    { iconOnly: true, size: 'xs', css: { w: 'control.xs' } },
    { iconOnly: true, size: 'sm', css: { w: 'control.sm' } },
    { iconOnly: true, size: 'md', css: { w: 'control.md' } },
    { iconOnly: true, size: 'lg', css: { w: 'control.lg' } },
    { iconOnly: true, size: 'xl', css: { w: 'control.xl' } },
    { variant: 'secondary', pressedTone: 'accent', css: { _pressed: { color: 'fg.accent' } } },
    {
      variant: ['secondary', 'secondaryDanger'],
      expandedBorder: 'default',
      css: { _expanded: { borderColor: 'border.default' } },
    },
    { variant: 'dangerSoft', expandedBorder: 'default', css: { _expanded: { borderColor: 'status.danger.border' } } },
    {
      variant: ['primary', 'danger', 'dangerText', 'text'],
      expandedBorder: 'default',
      css: { _expanded: { borderColor: 'transparent' } },
    },
    { pressedBorder: 'discuss', css: { _pressed: { borderColor: 'accent.discuss' } } },
  ],
  defaultVariants: { variant: 'secondary', size: 'md', textSize: 'md', pressedTone: 'default', expandedBorder: 'active', pressedBorder: 'active', iconOnly: false },
})
