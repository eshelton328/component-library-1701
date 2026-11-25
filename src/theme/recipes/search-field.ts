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
// `clearFocus="strong"` is the clear button of Artifacts D4 and M5 (`icon/x`
// 403:8202): bold and bright in the focused field. While the field (or its
// clear button) has the focus, the button is fg.default and shows the bold
// x (`CloseBoldIcon`, 3 thick on the 24 grid, not 2) in place of `clearIcon`;
// with no focus it is as the default. No border width token is heavier than
// the icons' own stroke of 2, so the bold x is its own icon. Figma's 14 px has no icon
// token; `clearSize="16"` is the nearest (12 and 16 tie; d-072 takes the
// larger).
// At Default and Large (d-122) the line of text can be taller than the size's height less the border: the field then
// grows with its line, with 2 above and below, and the size's height stays its least; the input takes its line's height.
const growRoot = (size: 'sm' | 'md' | 'lg') => ({ h: 'auto', minH: `control.${size}`, py: '2' }) as const
const lineHeight = { h: 'auto' } as const

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
      _textDefault: lineHeight,
      _textLarge: lineHeight,
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
      sm: { root: { h: 'control.sm', _textDefault: growRoot('sm'), _textLarge: growRoot('sm') } },
      md: { root: { h: 'control.md', _textDefault: growRoot('md'), _textLarge: growRoot('md') } },
      lg: { root: { h: 'control.lg', _textDefault: growRoot('lg'), _textLarge: growRoot('lg') } },
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
    clearFocus: {
      default: {},
      strong: {
        clear: {
          '& [data-clear-icon]': { display: 'inline-flex' },
          '& [data-clear-icon=focus]': { display: 'none' },
          '[data-scope=field][data-part=root]:focus-within > &': {
            color: 'fg.default',
            '& [data-clear-icon=rest]': { display: 'none' },
            '& [data-clear-icon=focus]': { display: 'inline-flex' },
          },
        },
      },
    },
    surface: {
      default: {},
      raised: { input: { _placeholder: { color: 'fg.muted' } }, clear: { color: 'fg.muted' } },
    },
  },
  defaultVariants: { size: 'md', clearSize: '12', clearFocus: 'default', textSize: 'md', surface: 'default' },
})
