import { defineSlotRecipe } from '@pandacss/dev'

// A Workbench pane with no chat (D1 105:347): no header and no fill, a
// dashed border.default outline, and in its middle the title (105:348,
// SemiBold 15/20, `paneTitle`), a line (105:349, Regular 13, `bodySm`), the
// start buttons (105:350, 8 apart) and the OPEN IN THIS PANE list (105:368,
// 380 wide, `shell.popoverPicker`): its label (105:369, `eyebrow`) 2 over
// the rows, which are 2 apart. The groups are 12 apart (633.5 to 645.5,
// 662.5 to 674.5, 704.5 to 716.5). The outline's radius is not in the gap
// row; it takes radius.xl, as the Workbench panes do.
export const emptyPane = defineSlotRecipe({
  className: 'empty-pane',
  jsx: ['EmptyPane'],
  staticCss: ['*'],
  slots: ['root', 'content', 'title', 'description', 'actions', 'list', 'listLabel'],
  base: {
    root: {
      display: 'flex',
      flex: '1',
      alignItems: 'center',
      justifyContent: 'center',
      minW: '0',
      minH: '0',
      p: '16',
      borderRadius: 'xl',
      borderWidth: 'default',
      borderStyle: 'dashed',
      borderColor: 'border.default',
    },
    content: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12', maxW: '100%', textAlign: 'center' },
    title: { m: '0', textStyle: 'paneTitle', color: 'fg.default' },
    description: { m: '0', textStyle: 'bodySm', color: 'fg.muted' },
    actions: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8' },
    list: { display: 'flex', flexDirection: 'column', gap: '2', w: 'shell.popoverPicker', maxW: '100%', textAlign: 'start' },
    listLabel: { textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted' },
  },
})
