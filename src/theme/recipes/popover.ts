import { popoverAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The filter popovers of Inbox (D4 346:1737, T14 346:8876) and Artifacts
// (D3 403:6852): a box under its button, with labelled sections of rows and
// a footer row with a note and the buttons. No arrow and no title.
// `width` picks the box width: sm 240 (a small menu), filter 300 (the Inbox
// Filter menu, D4 346:1737), md 320 (the default), lg 360 (the skill picker)
// and picker 380 (the Run in picker, D3 346:1234).
export const popover = defineSlotRecipe({
  className: 'popover',
  jsx: ['Popover'],
  staticCss: ['*'],
  slots: [...popoverAnatomy.keys(), 'section', 'sectionLabel', 'footer', 'note'],
  base: {
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      maxW: 'var(--available-width)',
      // Ark measures the space under the trigger; a long popover scrolls.
      maxH: 'var(--available-height)',
      overflowY: 'auto',
      p: '8',
      bg: 'surface.overlay',
      color: 'fg.default',
      borderRadius: 'xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      boxShadow: 'overlay',
      outline: 'none',
      _closed: { display: 'none' },
    },
    section: { display: 'flex', flexDirection: 'column', gap: '2' },
    // The label of a group of rows, such as KIND. fg.subtle is only for bg.canvas, so the label is fg.muted.
    sectionLabel: { px: '8', pt: '8', pb: '4', textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted' },
    footer: { display: 'flex', alignItems: 'center', gap: '8', px: '8', pt: '8', pb: '4' },
    note: { flex: '1', textStyle: 'small', color: 'fg.muted' },
  },
  variants: {
    width: {
      sm: { content: { w: 'shell.popoverSm' } },
      filter: { content: { w: 'shell.popoverFilter' } },
      md: { content: { w: 'shell.popover' } },
      lg: { content: { w: 'shell.popoverLg' } },
      picker: { content: { w: 'shell.popoverPicker' } },
    },
  },
  defaultVariants: { width: 'md' },
})
