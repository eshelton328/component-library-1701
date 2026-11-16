import { CodeIcon, FileIcon, FolderIcon } from '../foundations/icons'
import { TreeView, type TreeViewNode, type TreeViewProps } from '../controls/tree-view'

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
  const glyph = type === 'folder' ? <FolderIcon size="14" /> : type === 'code' ? <CodeIcon size="14" /> : <FileIcon size="14" />
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
