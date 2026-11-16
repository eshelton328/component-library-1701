import { fieldAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The search field of Inbox, Artifacts and Toolkit. The pages drew three
// backgrounds; the inventory merges them into surface.inset (inconsistency
// 9), with fg.subtle placeholders (inconsistency 8).
export const searchField = defineSlotRecipe({
  className: 'search-field',
  jsx: ['SearchField'],
  staticCss: ['*'],
  slots: fieldAnatomy.extendWith('icon', 'clear').keys(),
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '6',
      minWidth: '0',
      px: '10',
      bg: 'surface.inset',
      borderRadius: 'md',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      _focusWithin: { borderColor: 'border.focus' },
      _disabled: { opacity: 'disabled', cursor: 'not-allowed' },
    },
    icon: {
      display: 'inline-flex',
      flexShrink: '0',
      color: 'fg.muted',
      '& svg': { width: 'icon.16!', height: 'icon.16!' },
    },
    input: {
      flex: '1',
      minWidth: '0',
      height: '100%',
      bg: 'transparent',
      color: 'fg.default',
      textStyle: 'body',
      outline: 'none',
      _placeholder: { color: 'fg.subtle' },
      _disabled: { cursor: 'not-allowed' },
      // The field draws its own clear button.
      '&::-webkit-search-cancel-button': { display: 'none' },
    },
    clear: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      width: 'icon.20',
      height: 'icon.20',
      borderRadius: 'full',
      color: 'fg.muted',
      cursor: 'pointer',
      outline: 'none',
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '& svg': { width: 'icon.14!', height: 'icon.14!' },
    },
  },
  variants: {
    size: {
      sm: { root: { h: 'control.sm' } },
      md: { root: { h: 'control.md' } },
      lg: { root: { h: 'control.lg' } },
    },
  },
  defaultVariants: { size: 'md' },
})
