import { icon } from '../../styled-system/recipes'
import { TreeView, type TreeViewNode, type TreeViewProps } from '../controls/tree-view'

// The icon set has no folder, file or code icon yet. These three are drawn
// here from Toolkit D6 (432:2154, 432:2144, 432:2214) on the 24 grid, with
// Figma's 1.8 stroke at 13 px scaled to 24, until they move to
// foundations/icons.tsx.
function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={icon({ size: '14' })}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

function FolderGlyph() {
  return (
    <Glyph>
      <path d="M3 7.5C3 6.1 4.1 5 5.5 5H9.5L12 7.5H18.5C19.9 7.5 21 8.6 21 10V17.5C21 18.9 19.9 20 18.5 20H5.5C4.1 20 3 18.9 3 17.5V7.5Z" />
    </Glyph>
  )
}

function FileGlyph() {
  return (
    <Glyph>
      <path d="M14 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V8L14 3Z" />
      <path d="M14 3V8H19" />
    </Glyph>
  )
}

function CodeGlyph() {
  return (
    <Glyph>
      <path d="M8.5 7L3.5 12L8.5 17" />
      <path d="M15.5 7L20.5 12L15.5 17" />
    </Glyph>
  )
}

/** A folder or a file in a `FileTree`. */
export type FileTreeNode = {
  /** The path of the folder or file, unique in the tree. `onSelect` reports it. */
  path: string
  /** The name shown in the row, such as `SKILL.md`. */
  name: string
  /** `folder`, `file` (the default) or `code` for a script. */
  type?: 'folder' | 'file' | 'code' | undefined
  /** A count at the end of the row, such as the number of files in a folder. */
  count?: number | string | undefined
  /** A line under the name, such as the role of the file. */
  caption?: string | undefined
  /** The folder's contents. */
  children?: readonly FileTreeNode[] | undefined
}

export type FileTreeProps = Omit<TreeViewProps, 'nodes' | 'label'> & {
  /** The accessible name of the tree. Defaults to "Files". */
  label?: string | undefined
  nodes: readonly FileTreeNode[]
}

function toTreeNode(node: FileTreeNode): TreeViewNode {
  const type = node.type ?? 'file'
  const glyph = type === 'folder' ? <FolderGlyph /> : type === 'code' ? <CodeGlyph /> : <FileGlyph />
  return {
    value: node.path,
    label: node.name,
    icon: glyph,
    ...(node.count === undefined ? {} : { trailing: String(node.count) }),
    ...(node.caption === undefined ? {} : { caption: node.caption }),
    ...(type === 'folder' ? { children: (node.children ?? []).map(toTreeNode) } : {}),
  }
}

/**
 * The folders and files of a skill or a workflow, as in the Toolkit file
 * browser. A folder opens and closes; selecting a file calls `onSelect`
 * with its path. The keyboard works as in `TreeView`. The tree fills its
 * column; the Toolkit column is 330 px (`shell.sidebar`).
 */
export function FileTree({ label = 'Files', nodes, ...props }: FileTreeProps) {
  return <TreeView label={label} nodes={nodes.map(toTreeNode)} {...props} />
}
