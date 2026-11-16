import { splitterAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The resizable split of the Workbench panes (Workbench D9 402:1145, D11
// 402:3665, D14 402:6509). Panes sit 10 apart (split 402:1627 gap 10);
// the resize handle fills that gap: 4 + a 2 px line + 4. Figma draws a
// 4 x 44 pill in #596b94 (402:1753), which has no size or colour token, so
// it is left out; the 2 px line that D14 draws while dragging (402:7149,
// rgba(94,225,255,0.6), merged into border.active) shows on hover and
// drag, and border.focus shows on keyboard focus.
export const splitter = defineSlotRecipe({
  className: 'splitter',
  jsx: ['Splitter'],
  staticCss: ['*'],
  slots: splitterAnatomy.keys(),
  base: {
    root: { display: 'flex', w: '100%', h: '100%', minW: '0', minH: '0' },
    panel: { display: 'flex', flexDirection: 'column', minW: '0', minH: '0' },
    resizeTrigger: {
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'center',
      flexShrink: '0',
      outline: 'none',
      touchAction: 'none',
      '&[data-orientation=horizontal]': { px: '4', cursor: 'col-resize' },
      '&[data-orientation=vertical]': { flexDirection: 'column', py: '4', cursor: 'row-resize' },
      _disabled: { cursor: 'default' },
    },
    resizeTriggerIndicator: {
      borderStyle: 'solid',
      borderColor: 'transparent',
      borderWidth: '0',
      '[data-orientation=horizontal] > &': { borderLeftWidth: 'ring' },
      '[data-orientation=vertical] > &': { borderTopWidth: 'ring' },
      '.splitter__resizeTrigger:hover:not([data-disabled]) > &': { borderColor: 'border.active' },
      '.splitter__resizeTrigger:focus-visible > &': { borderColor: 'border.focus' },
      // Last, so a drag shows border.active even on a handle with keyboard focus.
      '.splitter__resizeTrigger[data-dragging] > &': { borderColor: 'border.active' },
    },
  },
})
