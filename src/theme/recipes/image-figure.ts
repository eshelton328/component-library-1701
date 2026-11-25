import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// An image in a Markdown message, such as `![chart](images/chart.png)`.
// Figma has no frame of it. The picture keeps its own size up to the
// column's width (never wider, never stretched) with the radius of a code
// block (lg). It is a button that opens the picture in a dialog. While it
// loads, a wide block skeleton holds the column's width; the picture loads
// hidden under it. A picture that does not load is a line of `small` text
// in fg.muted on the well, as a command block is, with its text alternative.
export const imageFigure = defineSlotRecipe({
  className: 'image-figure',
  jsx: ['ImageFigure'],
  staticCss: ['*'],
  slots: ['root', 'trigger', 'image', 'placeholder', 'message', 'zoom'],
  base: {
    root: { display: 'block', minW: '0', maxW: '100%', m: '0' },
    trigger: {
      position: 'relative',
      display: 'inline-block',
      maxW: '100%',
      p: '0',
      m: '0',
      bg: 'transparent',
      borderWidth: '0',
      borderRadius: 'lg',
      cursor: 'zoom-in',
      verticalAlign: 'top',
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
      // While the picture loads, the skeleton takes the column's width.
      '&[data-state=loading]': { display: 'block', w: '100%', cursor: 'default' },
    },
    image: {
      display: 'block',
      maxW: '100%',
      h: 'auto',
      borderRadius: 'lg',
      // The picture loads under the skeleton and takes no space until it shows.
      '&[data-state=loading]': { position: 'absolute', insetBlockStart: '0', insetInlineStart: '0', visibility: 'hidden' },
    },
    placeholder: { w: '100%', minW: '0' },
    message: {
      m: '0',
      p: '12',
      textStyle: 'small',
      color: 'fg.muted',
      bg: 'surface.well',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'xl',
      overflowWrap: 'anywhere',
    },
    // The picture in the dialog: the dialog's width at most, centred; a tall one scrolls in the dialog.
    zoom: { display: 'block', maxW: '100%', h: 'auto', mx: 'auto', borderRadius: 'lg' },
  },
})
