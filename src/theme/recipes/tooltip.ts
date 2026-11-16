import { tooltipAnatomy } from '@ark-ui/react/anatomy'
import { defineRecipe, defineSlotRecipe } from '@pandacss/dev'

// The tooltip. The Figma library file has no tooltip (a search of
// PZoW9BBu43qRgon1KhJcwU for "tooltip" finds none), so it uses the tokens of
// the other overlays: surface.overlay with fg.default text (a pair the
// contrast check already covers), a border.default border, the overlay
// shadow and radius md, with small text in a 4 × 8 box no wider than
// shell.popover. A long text wraps. No arrow. The pointer can move onto it
// and it stays open there (WCAG 1.4.13), so it takes pointer events.
export const tooltip = defineSlotRecipe({
  className: 'tooltip',
  jsx: ['Tooltip', 'TruncatedText'],
  staticCss: ['*'],
  slots: tooltipAnatomy.keys(),
  base: {
    content: {
      maxW: 'shell.popover',
      py: '4',
      px: '8',
      bg: 'surface.overlay',
      color: 'fg.default',
      textStyle: 'small',
      overflowWrap: 'anywhere',
      borderRadius: 'md',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      boxShadow: 'overlay',
      _closed: { display: 'none' },
    },
  },
})

// Text on one line that ends with an ellipsis when it does not fit. It takes
// its font and colour from where it sits. When the text is cut and nothing
// around it takes the focus, it is a tab stop of its own, with the focus ring.
export const truncatedText = defineRecipe({
  className: 'truncated-text',
  jsx: ['TruncatedText'],
  staticCss: ['*'],
  base: {
    display: 'block',
    minW: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
  },
})
