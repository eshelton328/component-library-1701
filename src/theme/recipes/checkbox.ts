import { checkboxAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The filter checks of Inbox (D4, T14) and Artifacts (D3): a checkbox with
// a label, checked or not, in groups. The box border is `fg.muted`, the
// checked box `accent.default` (inventory: `#8a97b8` and `#5ee1ff`).
export const checkbox = defineSlotRecipe({
  className: 'checkbox',
  jsx: ['Checkbox', 'CheckboxGroup'],
  staticCss: ['*'],
  slots: [...checkboxAnatomy.keys(), 'groupLabel'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '10',
      minH: 'control.md',
      cursor: 'pointer',
      userSelect: 'none',
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    control: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: 'icon.16',
      h: 'icon.16',
      borderRadius: 'xs',
      borderWidth: 'strong',
      borderStyle: 'solid',
      borderColor: 'fg.muted',
      color: 'fg.onAccent',
      '& svg': { w: 'icon.12', h: 'icon.12' },
      _checked: { bg: 'accent.default', borderColor: 'accent.default' },
      _indeterminate: { bg: 'accent.default', borderColor: 'accent.default' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    indicator: { display: 'inline-flex' },
    label: { textStyle: 'body', color: 'fg.default' },
    group: { display: 'flex', flexDirection: 'column', gap: '2' },
    groupLabel: { textStyle: 'small', color: 'fg.muted', pb: '4' },
  },
})
