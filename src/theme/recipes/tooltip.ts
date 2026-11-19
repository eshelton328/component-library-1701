import { tooltipAnatomy } from '@ark-ui/react/anatomy'
import { defineRecipe, defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// The tooltip. The Figma library file has no tooltip (a search of
// PZoW9BBu43qRgon1KhJcwU for "tooltip" finds none), so it uses the tokens of
// the other overlays: surface.overlay with fg.default text (a pair the
// contrast check already covers), a border.default border, the overlay
// shadow and radius md, with small text in a 4 × 8 box no wider than
// shell.popover. A long text wraps. No arrow. The pointer can move onto it
// and it stays open there (WCAG 1.4.13), so it takes pointer events.
//
// The tooltip of TruncatedText, which only shows the whole of a cut text, is
// the one exception (the `cutText` variant): it takes no pointer events, so a
// click where it covers a card's title button or a row reaches what lies
// under it. TruncatedText turns Ark's `interactive` off, and Ark then writes
// `pointer-events: none` on the content as an inline style; the variant sets
// it on the positioner, the box around the content. This gives up WCAG
// 1.4.13 "hoverable" for this tooltip only: it repeats text that is already
// on the page, holds no control, opens on keyboard focus too, and Escape
// closes it ("dismissible").
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
  variants: {
    cutText: {
      true: { positioner: { pointerEvents: 'none' } },
    },
  },
})

// Text on one line that ends with an ellipsis when it does not fit. It takes
// its font and colour from where it sits. When the text is cut and nothing
// around it takes the focus, it is a tab stop of its own, with the focus ring.
//
// `lines` above 1 wraps the text onto that many lines with line-clamp, as
// the Clamp recipe does, so the last line ends in an ellipsis; a text that
// fits shows whole. A KpiTile caption with `captionLines={2}` uses it (Toolkit
// T23 491:8077, D12 445:227), so a caption cut on its second line still shows
// whole in the tooltip.
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
    outline: 'none',
    [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    // Cut text with its own tab stop sits above a hit area that covers it, such as the one of a card's or a
    // row's title button, so the pointer reaches it and opens its tooltip.
    '&[tabindex]': { position: 'relative' },
  },
  variants: {
    lines: {
      '1': {},
      '2': { whiteSpace: 'normal', overflowWrap: 'anywhere', lineClamp: '2' },
      '3': { whiteSpace: 'normal', overflowWrap: 'anywhere', lineClamp: '3' },
    },
  },
  defaultVariants: { lines: '1' },
})
