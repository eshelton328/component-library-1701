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
// A browser in a bounded pane, with a tree and a file longer than the box.
const bounded = css({ w: 'shell.detailWide', h: 'shell.listPane', display: 'flex', flexDirection: 'column' })
const manyNodes: FileTreeNode[] = Array.from({ length: 40 }, (_, i) => ({ path: `file-${String(i)}.md`, name: `file-${String(i)}.md` }))
const manyLines = Array.from({ length: 80 }, (_, i) => `line ${String(i)}`)

function Browsers() {
  return (
    <main className={page}>
      <div className={desktop} data-testid="split">
        <FileBrowser
          tree={<FileTree nodes={nodes} selected="scripts/check" defaultExpanded={['scripts/']} />}
          figma={{ root: 'file browser', tree: 'tree', viewer: 'viewer column' }}
        >
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

// Bordered boxes (a transparent border counts) that are not nested must stay apart, as the Design System's
// no-touching-boxes check asks: a pair 0 to 1.5 px apart reads as one doubled line. The check zooms a card to fit its
// 390 px width (390 / 1048), so `zoom` scales each gap the same way.
const cardZoom = 390 / 1048
function touchingPairs(root: Element, zoom = 1): string[] {
  const boxed = [...root.querySelectorAll('*')].filter((n) => {
    const st = getComputedStyle(n)
    return (parseFloat(st.borderTopWidth) > 0 || parseFloat(st.borderBottomWidth) > 0) && st.borderTopStyle !== 'none' && n.getBoundingClientRect().height > 8
  })
  const pairs: string[] = []
  boxed.forEach((a, i) => {
    for (const c of boxed.slice(i + 1)) {
      if (a.contains(c) || c.contains(a)) continue
      const r = a.getBoundingClientRect()
      const q = c.getBoundingClientRect()
      const across = Math.min(r.right, q.right) - Math.max(r.left, q.left)
      const down = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)
      const vGap = Math.max(q.top - r.bottom, r.top - q.bottom) * zoom
      const hGap = Math.max(q.left - r.right, r.left - q.right) * zoom
      if ((across > 4 && vGap >= -0.5 && vGap < 1.5) || (down > 4 && hGap >= -0.5 && hGap < 1.5))
        pairs.push(`${a.className.slice(0, 40)} | ${c.className.slice(0, 40)}`)
    }
  })
  return pairs
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
  // `figma` writes each named part's data-figma (D6 432:2141, 432:2142); a browser with no `figma` has none.
  await expect(box.getAttribute('data-figma')).toBe('file browser')
  await expect(tree.getAttribute('data-figma')).toBe('tree')
  await expect(el(box, '.file-browser__viewer').getAttribute('data-figma')).toBe('viewer column')

  const stacked = canvas.getByTestId('stacked')
  const root = el(stacked, '.file-browser__root')
  await expect(border(root)[0]).toBe('0px')
  await expect(root.hasAttribute('data-figma')).toBe(false)
  await expect(root.querySelector('[data-figma]')).toBeNull()
  const treeBox = el(root, '.file-browser__tree')
  await expect(border(treeBox)).toEqual(['1px', 'solid', swatch('border'), '12px'])
  await expect(rect(treeBox).width).toBe(rect(stacked).width)
  await expect(rect(treeBox).height).toBe(rect(el(treeBox, '.tree-view__root')).height + 2)
  const file = canvas.getByRole('region', { name: 'SKILL.md' })
  await expect(border(file)).toEqual(['1px', 'solid', swatch('border'), '12px'])
  await expect(rect(file).top - rect(treeBox).bottom).toBe(12)
  await expect(rect(file).width).toBe(rect(stacked).width)

  await expect(touchingPairs(canvasElement)).toEqual([])
  await expect(touchingPairs(canvasElement, cardZoom)).toEqual([])

  const only = el(canvas.getByTestId('tree-only'), '.file-browser__root')
  await expect(only.querySelector('.file-browser__viewer')).toBeNull()
  await expect(rect(only).height).toBe(rect(el(only, '.file-browser__tree')).height)
}

// A browser in a bounded pane, in its own story: its tree and file overflow the box under a scroll, and the rows
// hidden under the scroll still have boxes, which the Design System's card (the Dark story) would measure.
function Bounded() {
  return (
    <main className={page}>
      <div className={bounded} data-testid="bounded">
        <FileBrowser tree={<FileTree label="Many files" nodes={manyNodes} selected="file-0.md" />}>
          <FileFrame name="long.md" variant="flush" readOnly>
            <CodeLines lines={manyLines} />
          </FileFrame>
        </FileBrowser>
      </div>
    </main>
  )
}

const boundedPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  // The scrolled-off rows are inside the box, so nothing touches before or after the scroll.
  await expect(touchingPairs(canvasElement)).toEqual([])
  await expect(touchingPairs(canvasElement, cardZoom)).toEqual([])
  // In a bounded pane the box keeps the pane's height, and the tree and the file each scroll to their ends.
  const pane = canvas.getByTestId('bounded')
  const held = el(pane, '.file-browser__root')
  await expect(rect(held).height).toBe(rect(pane).height)
  const longTree = el(held, '.file-browser__tree')
  const longBody = el(canvas.getByRole('region', { name: 'long.md' }), '.file-frame__body')
  for (const scroller of [longTree, longBody]) {
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
    scroller.scrollTop = scroller.scrollHeight
    await expect(scroller.scrollTop).toBeGreaterThan(0)
    await expect(rect(scroller).bottom).toBeLessThanOrEqual(rect(held).bottom)
  }
  await expect(canvas.getByText('file-39.md')).toBeInTheDocument()
  await expect(touchingPairs(canvasElement)).toEqual([])
  await expect(touchingPairs(canvasElement, cardZoom)).toEqual([])
}

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, play }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' }, play }
export const BoundedDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Bounded />, play: boundedPlay }
export const BoundedLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Bounded />, play: boundedPlay }
