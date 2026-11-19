import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { fileBrowser, type FileBrowserVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(fileBrowser)
const Root = withProvider('div', 'root')
const Tree = withContext('div', 'tree')
const Viewer = withContext('div', 'viewer')

export type FileBrowserProps = Scalar<FileBrowserVariantProps> & {
  /** The item's folders and files, such as a `FileTree`. */
  tree: ReactNode
  /**
   * The selected file, such as a `FileFrame`: `variant="flush"` beside the tree (`layout="split"`), `variant="box"`
   * under it (`layout="stacked"`). Only the tree when not set.
   */
  children?: ReactNode
}

/**
 * The Files tab of a toolkit item: its tree and the selected file.
 * `layout="split"` (the default) draws one bordered box with the tree in a
 * `shell.sidebar` column on `surface.well`, as high as the box, and the file
 * beside it; the box grows to fill a flex parent. `layout="stacked"` (a
 * tablet) draws the tree in a bordered box as high as its rows and the file
 * 12 under it. It shows what it gets; the tree reports a selection itself.
 */
export function FileBrowser({ tree, children, layout }: FileBrowserProps) {
  const hasFile = children !== undefined && children !== null && typeof children !== 'boolean'
  return (
    <Root layout={layout}>
      <Tree>{tree}</Tree>
      {hasFile ? <Viewer>{children}</Viewer> : null}
    </Root>
  )
}
