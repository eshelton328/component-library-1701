import { treeViewAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The tree of folders and files in the Toolkit file browser (Toolkit D6,
// tree 432:2142). Every row has a 1 px border, transparent until the row is
// selected, so a selected row keeps its height and its text stays put.
export const treeView = defineSlotRecipe({
  className: 'tree-view',
  jsx: ['TreeView', 'FileTree'],
  staticCss: ['*'],
  slots: [...treeViewAnatomy.keys(), 'icon', 'trailing', 'caption'],
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
      _focusVisible: { outline: 'none' },
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
      display: 'grid',
      gridTemplateColumns: 'auto auto minmax(0, 1fr) auto',
      alignItems: 'center',
      columnGap: '8',
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
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
    },
    branchIndicator: {
      display: 'inline-flex',
      color: 'fg.muted',
      // Figma draws only the open folder's down chevron; a closed folder turns it to point right.
      _closed: { transform: 'rotate(-90deg)' },
    },
    branchText: { textStyle: 'mono', minW: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    branchTrigger: {},
    item: {
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      alignItems: 'center',
      columnGap: '8',
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
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    itemText: { textStyle: 'mono', minW: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    itemIndicator: {},
    icon: {
      display: 'inline-flex',
      color: 'fg.muted',
      '[data-selected] > &': { color: 'fg.accent' },
    },
    trailing: { textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' },
    // 432:2149: a line under a row, such as the role of SKILL.md.
    caption: { gridColumn: '2 / -1', textStyle: 'small', color: 'fg.muted' },
    label: { srOnly: true },
    nodeCheckbox: {},
    nodeRenameInput: {},
  },
})
