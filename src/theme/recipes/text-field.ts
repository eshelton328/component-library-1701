import { fieldAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollAreaNested } from './scroll-area'

// The text inputs of Inbox and Workbench: the rename field (D21), the notes
// field, the dialog inputs, and the prompt while it is edited. The fill is
// surface.inset (the notes field, rgba(23,33,58,0.7)); the focused border is
// border.focus, as the rename field draws it.
// `textSize="sm"` sets the text in `bodySm`, as the Inbox D3 prompt editor
// does (346:1189, Geist Regular 13/21; 20 on the 4 px grid). The box keeps
// its padding and height.
// The Artifacts Add a link form (D5 dialog, M6 sheet) opts in to four more:
// - `labelStyle="label"`: Figma's labels (D5 403:7551, 403:7556, 403:7570,
//   403:7579; M6 408:716, 408:721, 408:734, 408:743) are Medium 14, 20 high,
//   in the default text colour, 6 above the control: `label` (14/20) in
//   fg.default, with the root's 6 gap. The default stays `small` in fg.muted.
// - `size="form"`: the D5 inputs (403:7552, 403:7571, 403:7580) are 40 high,
//   `control.form`. M6's (408:717, 408:735, 408:744) are 44, `size="xl"`.
// - `padding="form"`: both pad 13 at the sides; no spacing token is 13, so
//   it takes the nearest, 12 (d-072). The default stays 10.
// - `icon`: the link field's 14 px link icon (D5 403:7548, M6 408:713) at the
//   start, at icon.16 (14 has no icon token; 12 and 16 tie and d-072 takes
//   the larger), in fg.muted as the SearchField's, inside the border and the
//   side padding (13 from the box's edge with `padding="form"`, Figma's 13),
//   and 6 before the text (on the first line in a TextArea). The
//   icon sits over the input's start padding, so the input stays the box and
//   its focus border.
// - `valueStyle="mono"`: the link and the project (D5 403:7553, 403:7581; M6
//   408:718, 408:745) are in mono: `mono` (12/16). It wins over `textSize`.
const box = {
  w: '100%',
  minW: '0',
  px: '10',
  bg: 'surface.inset',
  color: 'fg.default',
  textStyle: 'body',
  borderRadius: 'md',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  outline: 'none',
  _placeholder: { color: 'fg.subtle' },
  [focusRing]: { borderColor: 'border.focus' },
  // Only Ark's invalid state, set by the `error` prop. Panda's `_invalid` also
  // matches `:invalid`, which marks an empty required field before any input.
  '&[data-invalid]': { borderColor: 'status.danger.border' },
  // Focus wins over invalid, so the focus shows; the error text stays.
  '&[data-invalid]:focus-visible': { borderColor: 'border.focus' },
  _disabled: { cursor: 'not-allowed' },
  _readOnly: { bg: 'transparent' },
} as const

// No fill, border or padding. The box around it may be surface.raised,
// where fg.subtle is not allowed, so the placeholder is fg.muted.
const bare = {
  p: '0',
  bg: 'transparent',
  borderWidth: '0',
  _placeholder: { color: 'fg.muted' },
  _readOnly: { bg: 'transparent' },
} as const

// The input's start padding with a leading icon: the side padding, the icon
// and the 6 px gap before the text.
const iconStart = (side: '10' | '12') => `calc(token(spacing.${side}) + token(sizes.icon.16) + token(spacing.6))`
// The icon's place: inside the input's border and its side padding.
const iconInset = (side: '10' | '12') => `calc(token(borderWidths.default) + token(spacing.${side}))`

export const textField = defineSlotRecipe({
  className: 'text-field',
  jsx: ['TextField', 'TextArea'],
  staticCss: ['*'],
  slots: fieldAnatomy.extendWith('control', 'icon').keys(),
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '6', minW: '0', _disabled: { opacity: 'disabled' } },
    // Only with an `icon`: the box that holds the icon over the input.
    control: { position: 'relative', display: 'flex', minW: '0' },
    icon: {
      position: 'absolute',
      top: '0',
      bottom: '0',
      insetInlineStart: iconInset('10'),
      display: 'inline-flex',
      alignItems: 'center',
      color: 'fg.muted',
      pointerEvents: 'none',
      '& svg': { width: 'icon.16!', height: 'icon.16!' },
      // In a text area, on the first line: 1 + 8 + (20 - 16) / 2 = 11 from the top.
      '[data-multiline] > &': { bottom: 'auto', top: iconInset('10') },
    },
    label: { textStyle: 'small', color: 'fg.muted' },
    requiredIndicator: { color: 'status.danger.fg', ms: '2' },
    input: { ...box, '&[data-icon]': { ps: iconStart('10') } },
    textarea: { ...box, ...scrollAreaNested, py: '8', minH: 'control.xl', resize: 'vertical', '&[data-icon]': { ps: iconStart('10') } },
    helperText: { textStyle: 'small', color: 'fg.muted' },
    errorText: { textStyle: 'small', color: 'status.danger.fg' },
  },
  variants: {
    // `bare`: a field set inside a box that draws the fill and border, such
    // as the text area of the composer (Workbench D2 105:897).
    variant: {
      field: {},
      bare: {
        root: { gap: '0' },
        input: bare,
        textarea: { ...bare, minH: '0', resize: 'none' },
      },
    },
    labelHidden: {
      true: { label: { srOnly: true } },
      false: {},
    },
    size: {
      sm: { input: { h: 'control.sm' } },
      md: { input: { h: 'control.md' } },
      lg: { input: { h: 'control.lg' } },
      xl: { input: { h: 'control.xl' } },
      form: { input: { h: 'control.form' } },
    },
    padding: {
      default: {},
      form: { input: { px: '12', '&[data-icon]': { ps: iconStart('12') } }, icon: { insetInlineStart: iconInset('12') } },
    },
    textSize: {
      md: {},
      sm: { input: { textStyle: 'bodySm' }, textarea: { textStyle: 'bodySm' } },
    },
    labelStyle: {
      small: {},
      label: { label: { textStyle: 'label', color: 'fg.default' } },
    },
    // After `textSize`, so a mono value wins over it.
    valueStyle: {
      text: {},
      mono: { input: { textStyle: 'mono' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'field', labelHidden: false, textSize: 'md', padding: 'default', labelStyle: 'small', valueStyle: 'text' },
})
