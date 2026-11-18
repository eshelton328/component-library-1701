import { treeViewAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// The tree of folders and files in the Toolkit file browser (Toolkit D6,
// tree 432:2142). Every row has a 1 px border, transparent until the row is
// selected, so a selected row keeps its height and its text stays put.
export const treeView = defineSlotRecipe({
  className: 'tree-view',
  jsx: ['TreeView', 'FileTree'],
  staticCss: ['*'],
  slots: [...treeViewAnatomy.keys(), 'icon', 'body', 'trailing', 'caption'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      minW: '0',
      // 432:2142: padding 12 by 10 on bg #070b14 at 0.4, merged into surface.well.
      py: '12',
      px: '10',
      bg: 'surface.well',
      color: 'fg.default',
    },
    tree: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      outline: 'none',
    },
    branch: { display: 'flex', flexDirection: 'column', gap: '2' },
    branchContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      _closed: { display: 'none' },
    },
    branchIndentGuide: { display: 'none' },
    branchControl: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8',
      py: '4',
      // One indent step for each level below the top (--depth is 1 at the top).
      ps: 'calc(token(spacing.8) + (var(--depth, 1) - 1) * token(spacing.16))',
      pe: '8',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'transparent',
      borderRadius: 'sm',
      cursor: 'pointer',
      userSelect: 'none',
      _selected: { bg: 'surface.selected', borderColor: 'border.selected', color: 'fg.accent' },
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    branchIndicator: {
      display: 'inline-flex',
      flexShrink: '0',
      pt: '2',
      color: 'fg.muted',
      // Figma draws only the open folder's down chevron; a closed folder turns it to point right.
      _closed: { transform: 'rotate(-90deg)' },
      transformOrigin: 'center',
    },
    // TruncatedText inside cuts a long name and shows it whole in a tooltip.
    branchText: { textStyle: 'mono', minW: '0' },
    branchTrigger: {},
    item: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8',
      py: '4',
      ps: 'calc(token(spacing.8) + (var(--depth, 1) - 1) * token(spacing.16))',
      pe: '8',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'transparent',
      borderRadius: 'sm',
      cursor: 'pointer',
      userSelect: 'none',
      _selected: { bg: 'surface.selected', borderColor: 'border.selected', color: 'fg.accent' },
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    // The label and the caption under it, in one column.
    body: { display: 'flex', flexDirection: 'column', flex: '1', minW: '0' },
    itemText: { textStyle: 'mono', minW: '0' },
    itemIndicator: {},
    icon: {
      display: 'inline-flex',
      flexShrink: '0',
      pt: '2',
      color: 'fg.muted',
      '[data-selected] > &': { color: 'fg.accent' },
    },
    trailing: { flexShrink: '0', textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' },
    // 432:2149: a line under a row, such as the role of SKILL.md.
    caption: { textStyle: 'small', color: 'fg.muted' },
    label: { srOnly: true },
    nodeCheckbox: {},
    nodeRenameInput: {},
  },
})
