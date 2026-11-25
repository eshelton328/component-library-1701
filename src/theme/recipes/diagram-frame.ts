import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollAreaX } from './scroll-area'

// The frame round a diagram drawn from text, such as a Mermaid block in a
// Markdown message. Figma has no frame of it. It is recessed as a command
// block is (surface.well, a 1 px border.default border, radius xl), with a
// header row: an eyebrow label and the source toggle at the end. The body
// centres the picture and scrolls sideways when the picture is wider than
// the column; the picture never grows past its own size. The source is
// the `code` style in fg.default, as it wraps in a code block. The error
// line is `small` in status.danger.fg, which passes 4.5:1 on the well.
export const diagramFrame = defineSlotRecipe({
  className: 'diagram-frame',
  jsx: ['DiagramFrame'],
  staticCss: ['*'],
  slots: ['root', 'header', 'label', 'actions', 'body', 'placeholder', 'source', 'message'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      minW: '0',
      m: '0',
      bg: 'surface.well',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'xl',
    },
    header: { display: 'flex', alignItems: 'center', gap: '8', minW: '0', py: '4', ps: '12', pe: '4' },
    label: { flex: '1', minW: '0', textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted' },
    actions: { display: 'flex', alignItems: 'center', gap: '4', flexShrink: '0' },
    body: {
      display: 'flex',
      // safe: a picture wider than the body starts at its left edge, where the scroll reaches it (Codex review of #351).
      justifyContent: 'safe center',
      minW: '0',
      p: '12',
      overflowX: 'auto',
      ...scrollAreaX,
      '& img': { display: 'block', maxW: 'none', h: 'auto' },
      // The body takes the focus, so the arrow keys scroll a wide diagram, as the Table frame does.
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
    },
    // The loading skeleton's box: the body's full width, so a block skeleton has a width to take (Codex review of #351).
    placeholder: { w: '100%', minW: '0' },
    source: { m: '0', p: '12', minW: '0', textStyle: 'code', color: 'fg.default', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
    message: { m: '0', px: '12', pt: '8', textStyle: 'small', color: 'status.danger.fg' },
  },
})
