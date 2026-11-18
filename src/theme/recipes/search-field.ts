import { fieldAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// The search field of Inbox, Artifacts and Toolkit. The pages drew three
// backgrounds; the inventory merges them into surface.inset (inconsistency
// 9), with fg.subtle placeholders (inconsistency 8).
// `textSize="sm"` sets the text and placeholder in `bodySm` (13/20), as the
// Inbox search fields draw their placeholder at 13 px (T7 346:6800, 101 x 17;
// the T12 Run in picker's field too). The height stays the `size` token's.
// The clear icon is fg.subtle, dimmer than the magnifier's fg.muted, as
// Figma's dim clear icon (T10) and d-099: Figma's #4a5675 fails AA, and
// fg.subtle is the nearest approved dim colour, allowed on surface.inset.
// `surface="raised"` is for a field on surface.raised, such as the Run in
// picker's search in a raised Popover (D3 346:1235): surface.inset is
// #17213a at 0.7 there, so the field shows #17213a, where fg.subtle is
// 4.39:1, below WCAG AA (d-055). The placeholder and the clear icon take
// fg.muted, which surface.raised allows (d-100 rule 2: the nearest AA pass).
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
      color: 'fg.subtle',
      cursor: 'pointer',
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
    },
  },
  variants: {
    size: {
      sm: { root: { h: 'control.sm' } },
      md: { root: { h: 'control.md' } },
      lg: { root: { h: 'control.lg' } },
    },
    // The clear icon size: 12 (the default), or 16 for the x in a circle of
    // Inbox D10 (346:4201, 15 in Figma). An important size in `base` would
    // beat the one here, so each value sets its own.
    clearSize: {
      '12': { clear: { '& svg': { width: 'icon.12!', height: 'icon.12!' } } },
      '16': { clear: { '& svg': { width: 'icon.16!', height: 'icon.16!' } } },
    },
    textSize: {
      md: {},
      sm: { input: { textStyle: 'bodySm' } },
    },
    surface: {
      default: {},
      raised: { input: { _placeholder: { color: 'fg.muted' } }, clear: { color: 'fg.muted' } },
    },
  },
  defaultVariants: { size: 'md', clearSize: '12', textSize: 'md', surface: 'default' },
})
