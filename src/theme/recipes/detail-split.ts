import { defineSlotRecipe } from '@pandacss/dev'

// An open item and a side pane beside it, in the AppShell detail: the Inbox
// task and its discussion (D14), an artifact and its discussion (Artifacts
// D7). The item keeps its own width (its Container, 828 in the Figma
// frames) and the side takes the rest, so at 1512 px the pane is 628 wide
// as Figma draws it. The side stops at shell.discussionPane (800); on a
// wider screen the item takes what is left, and its detail Container
// centres itself there (the layout recipe). Both fill the height and no
// more, so each one's ScrollFrame scrolls on its own (d-107).
export const detailSplit = defineSlotRecipe({
  className: 'detail-split',
  jsx: ['DetailSplit'],
  staticCss: ['*'],
  slots: ['root', 'item', 'side'],
  base: {
    root: { display: 'flex', flexDirection: 'row', flex: '1', minW: '0', minH: '0' },
    item: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      flexShrink: '0',
      flexBasis: 'auto',
      minH: '0',
      // With no side the item fills the row and shrinks with it, so a narrow pane does not scroll sideways.
      '&:only-child': { flexShrink: '1', minW: '0' },
    },
    side: { display: 'flex', flexDirection: 'column', flexGrow: '0', flexShrink: '1', flexBasis: 'shell.discussionPane', minW: '0', minH: '0' },
  },
})
