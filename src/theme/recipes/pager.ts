import { defineSlotRecipe } from '@pandacss/dev'

// The pager under the Overview Chats table of a project's page (the-bridge
// Projects, NCC-130; design frames D01, T01, T01b and M01, `pager()` in
// ov-*.dc.html; the frames are HTML, so no Figma node is named). The range
// ("1–10 of 18") is `small` (12/16) in fg.muted; Previous and Next are
// secondary icon-only Buttons 8 apart from the current page number.
//
// `desktop` and `tablet` lay the row out in three columns (1fr auto 1fr, 12
// apart): the range at the start, the buttons in the middle and the Rows
// picker at the end. `phone` puts the range at the start and the buttons at
// the end (space-between, 8 apart) and draws no picker.
//
// The current number sits in a box as wide as a control: 32 (control.md) on
// a desktop, 44 (control.xl) where the buttons are 36 with a touch target.
// The frames set it SemiBold 14/20; no text style is SemiBold 14 (d-050), so
// it takes `label` (Medium 14/20). The frames give the picker a 120 px box;
// no size token is 120, so the picker is as wide as its own value.
export const pager = defineSlotRecipe({
  className: 'pager',
  jsx: ['Pager'],
  staticCss: ['*'],
  slots: ['root', 'range', 'nav', 'current', 'pageName', 'rows'],
  base: {
    root: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12', minW: '0' },
    range: { justifySelf: 'start', minW: '0', textStyle: 'small', color: 'fg.muted' },
    nav: { display: 'flex', alignItems: 'center', gap: '8' },
    current: { minW: 'control.md', textAlign: 'center', textStyle: 'label', color: 'fg.default' },
    // "Page 1 of 2" for assistive technology; the box shows only the number.
    pageName: { srOnly: true },
    rows: { justifySelf: 'end' },
  },
  variants: {
    // `desktop` (the default): 28 px buttons (D01). `tablet`: 36 px buttons with a
    // touch target (T01, T01b). `phone`: the tablet's buttons, the range and
    // the buttons spread apart, no picker (M01).
    size: {
      desktop: {},
      tablet: { current: { minW: 'control.xl' } },
      phone: {
        root: { display: 'flex', justifyContent: 'space-between', gap: '8' },
        current: { minW: 'control.xl' },
      },
    },
  },
  defaultVariants: { size: 'desktop' },
})
