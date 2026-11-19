import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { fileBrowser, type FileBrowserVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(fileBrowser)
const Root = withProvider('div', 'root')
const Tree = withContext('div', 'tree')
const Viewer = withContext('div', 'viewer')

/** The `data-figma` names of a FileBrowser's root, tree column and viewer column. */
export type FileBrowserLayers = {
  root?: string | undefined
  tree?: string | undefined
  viewer?: string | undefined
}

export type FileBrowserProps = Scalar<FileBrowserVariantProps> & {
  /** The item's folders and files, such as a `FileTree`. */
  tree: ReactNode
  /**
   * Names for the browser's parts, each written as its `data-figma` attribute, such as "file browser" for the root and
   * "tree" for the tree column, so an app's check can find the element that matches a Figma layer. It changes nothing on
   * screen; a part not named has no `data-figma`.
   */
  figma?: FileBrowserLayers | undefined
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
export function FileBrowser({ tree, children, layout, figma }: FileBrowserProps) {
  const hasFile = children !== undefined && children !== null && typeof children !== 'boolean'
  return (
    <Root layout={layout} data-figma={figma?.root}>
      <Tree data-figma={figma?.tree}>{tree}</Tree>
      {hasFile ? <Viewer data-figma={figma?.viewer}>{children}</Viewer> : null}
    </Root>
  )
}
