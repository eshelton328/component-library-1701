import { fieldAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The text inputs of Inbox and Workbench: the rename field (D21), the notes
// field, the dialog inputs, and the prompt while it is edited. The fill is
// surface.inset (the notes field, rgba(23,33,58,0.7)); the focused border is
// border.focus, as the rename field draws it.
const box = {
  w: 'full',
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
  _focusVisible: { borderColor: 'border.focus' },
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

export const textField = defineSlotRecipe({
  className: 'text-field',
  jsx: ['TextField', 'TextArea'],
  staticCss: ['*'],
  slots: fieldAnatomy.keys(),
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '6', minW: '0', _disabled: { opacity: 'disabled' } },
    label: { textStyle: 'small', color: 'fg.muted' },
    requiredIndicator: { color: 'status.danger.fg', ms: '2' },
    input: box,
    textarea: { ...box, py: '8', minH: 'control.xl', resize: 'vertical' },
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
    },
  },
  defaultVariants: { size: 'md', variant: 'field', labelHidden: false },
})
