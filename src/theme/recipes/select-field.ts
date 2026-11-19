import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// A select drawn as a text field: the Artifacts Project field (D5
// 403:7580, M6 408:744). The trigger copies `text-field.ts`'s input. Figma's
// 14 px folder and chevron tie 12 and 16; d-072 takes icon.16, in fg.muted,
// 6 from the value. `size` uses the control tokens, as TextField.
export const selectField = defineSlotRecipe({
  className: 'select-field',
  jsx: ['SelectField'],
  staticCss: ['*'],
  slots: ['root', 'label', 'trigger', 'icon', 'value', 'chevron'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '6', minW: '0' },
    label: { textStyle: 'small', color: 'fg.muted' },
    trigger: {
      display: 'flex',
      alignItems: 'center',
      gap: '6',
      w: '100%',
      minW: '0',
      px: '10',
      bg: 'surface.inset',
      color: 'fg.default',
      textStyle: 'body',
      textAlign: 'start',
      borderRadius: 'md',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      outline: 'none',
      cursor: 'pointer',
      userSelect: 'none',
      [focusRing]: { borderColor: 'border.focus' },
      _expanded: { borderColor: 'border.active' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    icon: { display: 'inline-flex', flexShrink: '0', color: 'fg.muted', '& svg': { width: 'icon.16!', height: 'icon.16!' } },
    value: { flex: '1', minW: '0', '&[data-placeholder]': { color: 'fg.subtle' } },
    chevron: { display: 'inline-flex', flexShrink: '0', color: 'fg.muted' },
  },
  variants: {
    size: {
      sm: { trigger: { h: 'control.sm' } },
      md: { trigger: { h: 'control.md' } },
      lg: { trigger: { h: 'control.lg' } },
      xl: { trigger: { h: 'control.xl' } },
    },
    mono: {
      true: { value: { textStyle: 'mono' } },
      false: {},
    },
    labelHidden: {
      true: { label: { srOnly: true } },
      false: {},
    },
  },
  defaultVariants: { size: 'md', mono: false, labelHidden: false },
})
