import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { expectCutText } from '../controls/tooltip.testing'
import { SkillIcon } from '../foundations/icons'
import { CodeLines } from './code-lines'
import { FileFrame } from './file-frame'
import { MarkdownView } from './markdown-view'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'flex', flexDirection: 'column', gap: '24' })
// D3 427:273 is 560 wide (540 here); M20 487:1649 is 366 on the phone, narrower than its bar (240 here).
const wide = css({ w: 'shell.dialogLg' })
const narrow = css({ w: 'shell.popoverSm' })
const swatches = {
  border: css({ color: 'border.default' }),
  muted: css({ color: 'fg.muted' }),
  default: css({ color: 'fg.default' }),
  pane: css({ color: 'surface.pane' }),
}

const copied = fn()
const lines = ['#!/usr/bin/env python3', 'import json', '', 'def check(path):', '    return 0']

function Frames() {
  return (
    <main className={page}>
      <div className={wide} data-testid="markdown">
        <FileFrame
          name="SKILL.md"
          meta="137 lines · the prompt"
          onCopy={copied}
          readOnly
          foot="Used by writer and writing-reviewer"
          footIcon={<SkillIcon size="16" />}
          figma={{ root: 'file preview', bar: 'preview bar', body: 'rendered markdown', foot: 'used by' }}
        >
          <MarkdownView>
            <h1>writer</h1>
            <p>Draft prose in the owner&apos;s voice.</p>
          </MarkdownView>
        </FileFrame>
      </div>
      <div className={wide} data-testid="code">
        <FileFrame name="scripts/check" icon="code" readOnly>
          <CodeLines lines={lines} />
        </FileFrame>
      </div>
      <div className={wide} data-testid="bare">
        <FileFrame name="notes.md" />
      </div>
      <div className={wide} data-testid="flush">
        <FileFrame name="doc.md" variant="flush" readOnly />
      </div>
      <div className={narrow} data-testid="narrow">
        <FileFrame name="agents/writing-reviewer.md" meta="96 lines · the prompt" onCopy={() => undefined} readOnly />
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
  title: 'Data display/File frame',
  component: FileFrame,
  args: { name: 'SKILL.md' },
  render: () => <Frames />,
} satisfies Meta<typeof FileFrame>
export default meta

function el(root: HTMLElement, selector: string): HTMLElement {
  const found = root.querySelector(selector)
  if (!(found instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return found
}
function svg(root: Element): SVGSVGElement {
  const found = root.querySelector('svg')
  if (!(found instanceof SVGSVGElement)) throw new Error('no icon')
  return found
}
// Rounded to the pixel: the 12/16 text styles compute a line height of 16.0008.
const rect = (node: Element) => {
  const r = node.getBoundingClientRect()
  return { top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) }
}
const px = (value: string) => `${String(Math.round(Number.parseFloat(value)))}px`
const size = (node: Element) => [rect(node).width, rect(node).height]

// The box: a 1 px border.default border, radius 12, on surface.pane. The bar: 37 high with its 1 px rule (D3 427:274,
// D6 432:2291), the 16 px icon 13 from the box's edge (12 in from the border, Figma's 14 px icon 14 in) and centred,
// the name in mono 12/16 fg.default 8 after it, the meta in muted mono 8 after the name; the copy icon, the 12 px lock
// and Read-only (small, muted) at the end, 13 from the box's edge, 8 apart. The body starts under the bar with no
// padding of its own; the foot (432:2347) is 36 high, its icon 12 px whatever its size, 13 from the box's edge, the
// text 8 after it. Read-only, the copy icon and the meta are left out when not set; `flush` has no border; a narrow box
// keeps the name and cuts the bar's end at its edge.
const play: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => getComputedStyle(el(canvasElement, `[data-swatch="${name}"]`)).color
  copied.mockClear()

  const md = canvas.getByRole('region', { name: 'SKILL.md' })
  const box = rect(md)
  const style = getComputedStyle(md)
  await expect([style.borderTopWidth, style.borderLeftWidth, style.borderTopStyle]).toEqual(['1px', '1px', 'solid'])
  await expect(style.borderTopColor).toBe(swatch('border'))
  await expect(style.borderTopLeftRadius).toBe('12px')
  await expect(style.backgroundColor).toBe(swatch('pane'))
  await expect(box.width).toBe(540)

  const bar = el(md, '.file-frame__bar')
  const barStyle = getComputedStyle(bar)
  await expect(rect(bar).height).toBe(37)
  await expect(rect(bar).top - box.top).toBe(1)
  await expect([barStyle.borderBottomWidth, barStyle.borderBottomColor]).toEqual(['1px', swatch('border')])

  const icon = svg(el(bar, '.file-frame__icon'))
  await expect(size(icon)).toEqual([16, 16])
  await expect(rect(icon).left - box.left).toBe(13)
  await expect(rect(icon).top - rect(bar).top).toBe(10)
  await expect(getComputedStyle(icon).stroke).toBe(swatch('muted'))

  const name = el(bar, '.file-frame__name')
  const nameStyle = getComputedStyle(name)
  await expect(name.textContent).toBe('SKILL.md')
  await expect(rect(name).left - rect(icon).right).toBe(8)
  await expect([nameStyle.fontSize, px(nameStyle.lineHeight), nameStyle.fontWeight]).toEqual(['12px', '16px', '400'])
  await expect(nameStyle.fontFamily).toContain('Geist Mono')
  await expect(nameStyle.color).toBe(swatch('default'))
  await expect(rect(name).top - rect(bar).top).toBe(10)

  const metaText = el(bar, '.file-frame__meta')
  await expect(metaText.textContent).toBe('137 lines · the prompt')
  await expect(rect(metaText).left - rect(name).right).toBe(8)
  await expect(getComputedStyle(metaText).fontFamily).toContain('Geist Mono')
  await expect(getComputedStyle(metaText).color).toBe(swatch('muted'))

  const copy = canvas.getByRole('button', { name: 'Copy SKILL.md' })
  await expect(size(copy)).toEqual([12, 12])
  const readOnly = el(bar, '.file-frame__readOnly')
  const readOnlyStyle = getComputedStyle(readOnly)
  await expect(readOnly.textContent).toBe('Read-only')
  await expect([readOnlyStyle.fontSize, px(readOnlyStyle.lineHeight), readOnlyStyle.color]).toEqual(['12px', '16px', swatch('muted')])
  await expect(readOnlyStyle.fontFamily).not.toContain('Geist Mono')
  const lock = svg(readOnly)
  await expect(size(lock)).toEqual([12, 12])
  await expect(rect(lock).left - rect(copy).right).toBe(8)
  await expect(box.right - rect(readOnly).right).toBe(13)
  await expect(rect(lock).top + 6 - rect(bar).top).toBe(18)
  await userEvent.click(copy)
  await expect(copied).toHaveBeenCalledWith('SKILL.md')

  const body = el(md, '.file-frame__body')
  await expect(rect(body).top).toBe(rect(bar).bottom)
  await expect([getComputedStyle(body).paddingTop, getComputedStyle(body).paddingLeft]).toEqual(['0px', '0px'])
  await expect(rect(el(body, '.markdown-view')).left - box.left).toBe(1)

  const foot = el(md, '.file-frame__foot')
  const footStyle = getComputedStyle(foot)
  await expect(rect(foot).height).toBe(36)
  await expect(rect(foot).top).toBe(rect(body).bottom)
  await expect([footStyle.fontSize, px(footStyle.lineHeight), footStyle.color, footStyle.marginTop]).toEqual(['12px', '16px', swatch('muted'), '0px'])
  const footIcon = svg(foot)
  await expect(size(footIcon)).toEqual([12, 12])
  await expect(rect(footIcon).left - box.left).toBe(13)
  await expect(foot.textContent).toBe('Used by writer and writing-reviewer')

  // `figma` writes each named part's data-figma (D3 427:273, 427:274, 427:284; D6 432:2347); a frame with no `figma` has
  // none.
  await expect(md.getAttribute('data-figma')).toBe('file preview')
  await expect(bar.getAttribute('data-figma')).toBe('preview bar')
  await expect(body.getAttribute('data-figma')).toBe('rendered markdown')
  await expect(foot.getAttribute('data-figma')).toBe('used by')

  // The code icon for a script, the code under the bar; no copy icon without onCopy.
  const code = canvas.getByRole('region', { name: 'scripts/check' })
  const codeIcon = svg(el(code, '.file-frame__icon'))
  await expect(codeIcon.innerHTML).not.toBe(icon.innerHTML)
  await expect(size(codeIcon)).toEqual([16, 16])
  await expect(within(code).queryByRole('button')).toBeNull()
  await expect(code.hasAttribute('data-figma')).toBe(false)
  await expect(code.querySelector('[data-figma]')).toBeNull()
  await expect(rect(el(code, '.code-lines__root')).top).toBe(rect(el(code, '.file-frame__bar')).bottom)
  await expect(rect(el(code, '.file-frame__readOnly')).right).toBe(rect(code).right - 13)

  // A frame with only a name: the bar alone, still 37 high, with no end, body or foot.
  const bare = canvas.getByRole('region', { name: 'notes.md' })
  await expect(rect(bare).height).toBe(39)
  await expect(bare.querySelector('.file-frame__end, .file-frame__body, .file-frame__foot, .file-frame__meta')).toBeNull()

  // flush: no border or radius; it fills its column.
  const flush = getComputedStyle(canvas.getByRole('region', { name: 'doc.md' }))
  await expect([flush.borderTopWidth, flush.borderTopLeftRadius]).toEqual(['0px', '0px'])
  await expect(rect(canvas.getByRole('region', { name: 'doc.md' })).width).toBe(540)

  // M20 487:1650: a narrow box keeps the bar one line. The meta and then the name give way, so the copy icon and
  // Read-only stay inside the box and the copy icon can be pressed; the cut name shows whole in a tooltip.
  const thin = canvas.getByRole('region', { name: 'agents/writing-reviewer.md' })
  const thinBar = el(thin, '.file-frame__bar')
  await expect(rect(thinBar).height).toBe(37)
  const thinCopy = within(thin).getByRole('button', { name: 'Copy agents/writing-reviewer.md' })
  await expect(rect(thinCopy).left).toBeGreaterThanOrEqual(rect(thin).left)
  await expect(rect(thinCopy).right).toBeLessThanOrEqual(rect(thin).right)
  await expect(rect(el(thin, '.file-frame__readOnly')).right).toBeLessThanOrEqual(rect(thin).right)
  await expect(rect(el(thin, '.file-frame__meta')).width).toBeLessThan(rect(el(thin, '.file-frame__name')).width)
  await expectCutText(el(thin, '.file-frame__name'), 'agents/writing-reviewer.md')
  await expect(getComputedStyle(thin).overflow).toBe('hidden')
}

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, play }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' }, play }
