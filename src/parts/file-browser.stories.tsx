import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { SkillIcon } from '../foundations/icons'
import { CodeLines } from './code-lines'
import { FileBrowser } from './file-browser'
import { FileFrame } from './file-frame'
import { FileTree, type FileTreeNode } from './file-tree'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'flex', flexDirection: 'column', gap: '24' })
// D6 432:2141 is 948 wide; the split box fills a flex column as tall as this one.
const desktop = css({ w: 'shell.detailWide', h: 'shell.keyboard', display: 'flex', flexDirection: 'column' })
// T4 434:408 is 712 wide.
const tablet = css({ w: 'shell.dialogWide' })
const swatches = {
  border: css({ color: 'border.default' }),
  well: css({ color: 'surface.well' }),
  pane: css({ color: 'surface.pane' }),
}

const nodes: FileTreeNode[] = [
  { path: 'SKILL.md', name: 'SKILL.md', caption: 'the prompt' },
  { path: 'scripts/', name: 'scripts/', type: 'folder', children: [{ path: 'scripts/check', name: 'check', type: 'code' }] },
]
const lines = ['#!/usr/bin/env python3', 'import json']

function Browsers() {
  return (
    <main className={page}>
      <div className={desktop} data-testid="split">
        <FileBrowser tree={<FileTree nodes={nodes} selected="scripts/check" defaultExpanded={['scripts/']} />}>
          <FileFrame
            name="scripts/check"
            icon="code"
            meta="python · 2 lines"
            variant="flush"
            onCopy={() => undefined}
            readOnly
            foot="Used by writer"
            footIcon={<SkillIcon />}
          >
            <CodeLines lines={lines} />
          </FileFrame>
        </FileBrowser>
      </div>
      <div className={tablet} data-testid="stacked">
        <FileBrowser layout="stacked" tree={<FileTree label="Tablet files" nodes={nodes} selected="SKILL.md" />}>
          <FileFrame name="SKILL.md" readOnly>
            <CodeLines lines={lines} />
          </FileFrame>
        </FileBrowser>
      </div>
      <div className={tablet} data-testid="tree-only">
        <FileBrowser layout="stacked" tree={<FileTree label="Phone files" nodes={nodes} />} />
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Data display/File browser',
  component: FileBrowser,
  args: { tree: null },
  render: () => <Browsers />,
} satisfies Meta<typeof FileBrowser>
export default meta

function el(root: Element, selector: string): HTMLElement {
  const found = root.querySelector(selector)
  if (!(found instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return found
}
const rect = (node: Element) => {
  const r = node.getBoundingClientRect()
  return { top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) }
}
const border = (node: Element) => {
  const s = getComputedStyle(node)
  return [s.borderTopWidth, s.borderTopStyle, s.borderTopColor, s.borderTopLeftRadius]
}

// split (D6 432:2141): one box with a 1 px border.default border and radius 12 that fills its flex column; the tree
// column (432:2142) 328 wide (shell.sidebar) on surface.well, as high as the box, from its top left inside the border;
// the flush viewer (432:2290) beside it with no border of its own, its 37 px bar from the box's top and its foot at
// the box's foot. stacked (T4 434:408, 434:485): the tree in its own bordered box as high as its rows, the viewer's
// box 12 under it, both as wide as the column. With no viewer only the tree's box shows.
const play: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => getComputedStyle(el(canvasElement, `[data-swatch="${name}"]`)).color

  const column = canvas.getByTestId('split')
  const box = el(column, '.file-browser__root')
  await expect(border(box)).toEqual(['1px', 'solid', swatch('border'), '12px'])
  await expect(getComputedStyle(box).backgroundColor).toBe(swatch('pane'))
  await expect([rect(box).width, rect(box).height]).toEqual([rect(column).width, rect(column).height])
  const tree = el(box, '.file-browser__tree')
  await expect([rect(tree).width, rect(tree).height]).toEqual([328, rect(box).height - 2])
  await expect([rect(tree).left - rect(box).left, rect(tree).top - rect(box).top]).toEqual([1, 1])
  await expect(getComputedStyle(tree).backgroundColor).toBe(swatch('well'))
  // The FileTree fills the column, so its well runs to the box's foot.
  await expect(rect(el(tree, '.tree-view__root')).height).toBe(rect(tree).height)
  const viewer = canvas.getByRole('region', { name: 'scripts/check' })
  await expect(border(viewer)[0]).toBe('0px')
  await expect([rect(viewer).left, rect(viewer).right]).toEqual([rect(tree).right, rect(box).right - 1])
  await expect(rect(viewer).height).toBe(rect(box).height - 2)
  const bar = el(viewer, '.file-frame__bar')
  await expect([rect(bar).top - rect(box).top, rect(bar).height]).toEqual([1, 37])
  await expect(rect(el(bar, '.file-frame__icon')).left - rect(tree).right).toBe(12)
  await expect(rect(el(viewer, '.file-frame__foot')).bottom).toBe(rect(box).bottom - 1)

  const stacked = canvas.getByTestId('stacked')
  const root = el(stacked, '.file-browser__root')
  await expect(border(root)[0]).toBe('0px')
  const treeBox = el(root, '.file-browser__tree')
  await expect(border(treeBox)).toEqual(['1px', 'solid', swatch('border'), '12px'])
  await expect(rect(treeBox).width).toBe(rect(stacked).width)
  await expect(rect(treeBox).height).toBe(rect(el(treeBox, '.tree-view__root')).height + 2)
  const file = canvas.getByRole('region', { name: 'SKILL.md' })
  await expect(border(file)).toEqual(['1px', 'solid', swatch('border'), '12px'])
  await expect(rect(file).top - rect(treeBox).bottom).toBe(12)
  await expect(rect(file).width).toBe(rect(stacked).width)

  const only = el(canvas.getByTestId('tree-only'), '.file-browser__root')
  await expect(only.querySelector('.file-browser__viewer')).toBeNull()
  await expect(rect(only).height).toBe(rect(el(only, '.file-browser__tree')).height)
}

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, play }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' }, play }
