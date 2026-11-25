import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Backdrop } from './backdrop'
import { expectScrollAreas } from '../controls/scroll-area.testing'
import { BottomSheet } from '../controls/bottom-sheet'
import { motionDone } from '../controls/bottom-sheet.testing'
import { Button } from '../controls/button'

const frame = css({ h: 'shell.dialogLg' })
const label = css({ textStyle: 'body', color: 'fg.default', p: '24' })
const tallText = css({ textStyle: 'body', color: 'fg.default', px: '24', py: '8' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  canvas: css({ bg: 'bg.canvas' }),
  glow: css({ bg: 'backdrop.glow' }),
  glowEdge: css({ bg: 'backdrop.glowEdge' }),
  star: css({ bg: 'backdrop.star' }),
}

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

function Page() {
  return (
    <div className={frame}>
      <Backdrop>
        <p className={label}>The desktop backdrop: canvas, glow and 99 stars.</p>
      </Backdrop>
      <Swatches />
    </div>
  )
}

const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no swatch ${name}`)
  return getComputedStyle(el).backgroundColor
}

// The layers of a computed background-image, split at the top-level commas.
const layers = (image: string) => {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < image.length; i++) {
    const c = image[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ',' && depth === 0) {
      out.push(image.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(image.slice(start).trim())
  return out
}

// The alpha of each colour stop in the backdrop's glow layer (the last layer), in order.
const glowAlphas = (root: HTMLElement) => {
  const glow = layers(getComputedStyle(backdropOf(root)).backgroundImage).at(-1) ?? ''
  return [...glow.matchAll(/rgba?\(([^)]*)\)/g)].map((m) => {
    const parts = (m[1] ?? '').split(',')
    return parts.length === 4 ? Number(parts[3]) : 1
  })
}

const backdropOf = (root: HTMLElement) => {
  const el = root.querySelector('.backdrop')
  if (!(el instanceof HTMLElement)) throw new Error('no backdrop')
  return el
}

const meta = {
  title: 'Layout/Backdrop',
  component: Page,
  play: async ({ canvasElement }) => {
    // The backdrop scrolls with no scroll bar and keeps a scroll at its end from moving the page.
    await expectScrollAreas(canvasElement, 'both', '.backdrop')
    const el = backdropOf(canvasElement)
    const s = getComputedStyle(el)
    // bg.canvas under the image layers, which do not repeat.
    await expect(s.backgroundColor).toBe(swatch(canvasElement, 'canvas'))
    await expect(s.backgroundRepeat).toBe('no-repeat')
    const all = layers(s.backgroundImage)
    // 99 star layers on top, then the glow.
    await expect(all).toHaveLength(100)
    const glow = all[99] ?? ''
    // An ellipse with radii of half the width and height, centred, stops glow 0, glowEdge 50 %, transparent 100 %.
    await expect(glow).toContain('radial-gradient(closest-side')
    await expect(glow).toContain(`${swatch(canvasElement, 'glow')} 0%`)
    await expect(glow).toContain(`${swatch(canvasElement, 'glowEdge')} 50%`)
    await expect(glow).toContain('rgba(0, 0, 0, 0) 100%')
    // The first star is D1 346:6: 1.5 px at (79.97 %, 83.54 %) in backdrop.star.
    await expect(all[0]).toBe(`radial-gradient(circle at 79.97% 83.54%, ${swatch(canvasElement, 'star')} 0.5px, rgba(0, 0, 0, 0) 1px)`)
    // It fills the height of its parent.
    const parent = el.parentElement
    if (parent === null) throw new Error('no parent')
    await expect(Math.round(el.getBoundingClientRect().height)).toBe(Math.round(parent.getBoundingClientRect().height))
    // The first star stays inside its 1.5 px circle, give or take the half-pixel edge.
    await expect(s.backgroundImage).toContain('0.5px, rgba(0, 0, 0, 0) 1px)')
    await expect(within(el).getByText(/desktop backdrop/)).toBeVisible()
  },
} satisfies Meta<typeof Page>
export default meta

/** Dark draws the glow: its centre stop is backdrop.glow at alpha 0.85. */
export const Dark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  play: async (ctx) => {
    await meta.play(ctx)
    const [centre = 0, edge = 0, ...rest] = glowAlphas(ctx.canvasElement)
    // Chrome keeps alpha in 8 bits, so 0.425 reads as 0.424.
    await expect(centre).toBeCloseTo(0.85, 2)
    await expect(edge).toBeCloseTo(0.425, 2)
    await expect(rest).toEqual([0])
  },
}
/** Light drops the glow (R52): every stop has alpha 0, so the page is the plain canvas. */
export const Light: StoryObj<typeof meta> = {
  globals: { mode: 'light' },
  play: async (ctx) => {
    await meta.play(ctx)
    await expect(glowAlphas(ctx.canvasElement)).toEqual([0, 0, 0])
  },
}

// sRGB channels 0 to 255 of a computed colour, drawn onto a canvas so any CSS colour syntax works.
const channels = (colour: string): [number, number, number] => {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (ctx === null) throw new Error('no canvas')
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

// The pixel Chrome paints at the backdrop's centre, read from a screenshot of the element. Only the story test runner
// can take one (vitest/browser), so the stories that call it carry `tags: ['!dev']`. No star lies within 1.3 % of the
// centre (the nearest desktop star is at 51.35 %, 51.98 %), so the pixel is canvas and glow only.
const centrePixel = async (el: HTMLElement): Promise<[number, number, number]> => {
  const { page } = await import('vitest/browser')
  const png = await page.screenshot({ element: el, save: false })
  const img = new Image()
  img.src = `data:image/png;base64,${png}`
  await img.decode()
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (ctx === null) throw new Error('no canvas')
  ctx.drawImage(img, -Math.floor(img.naturalWidth / 2), -Math.floor(img.naturalHeight / 2))
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

// The largest difference of one channel between two colours.
const apart = (a: readonly number[], b: readonly number[]) => Math.max(...a.map((v, i) => Math.abs(v - (b[i] ?? 0))))

// Up to 2 of 255 per channel is the same colour: Chrome dithers gradients by ±1 and rounds premultiplied alpha. The
// old Light glow (backdrop.glow at alpha 0.85) paints (212, 235, 247) over bg.canvas (243, 245, 250), 31 apart in red.
const SAME = 2

/** Light paints no glow (R52): the pixel at the backdrop's centre is bg.canvas. */
export const CentreLight: StoryObj<typeof meta> = {
  tags: ['!dev'],
  globals: { mode: 'light' },
  play: async ({ canvasElement }) => {
    const canvas = channels(swatch(canvasElement, 'canvas'))
    await expect(apart(await centrePixel(backdropOf(canvasElement)), canvas)).toBeLessThanOrEqual(SAME)
  },
}

/** Dark keeps its glow: the pixel at the backdrop's centre is lighter than bg.canvas. */
export const CentreDark: StoryObj<typeof meta> = {
  tags: ['!dev'],
  globals: { mode: 'dark' },
  play: async ({ canvasElement }) => {
    const canvas = channels(swatch(canvasElement, 'canvas'))
    // The glow paints about (24, 37, 75) over (7, 11, 20), 55 apart in blue; 20 proves a visible glow with room to spare.
    await expect(apart(await centrePixel(backdropOf(canvasElement)), canvas)).toBeGreaterThan(20)
  },
}

const sizes = css({ display: 'grid', gridTemplateColumns: '3fr 2fr 1fr', gap: '12', h: 'shell.dialogLg' })

const many = Array.from({ length: 80 }, (_, i) => `Line ${String(i + 1)}`)

/** Content taller than the parent scrolls inside the backdrop, which keeps its parent's height. The content needs something focusable, or Safari users cannot scroll it with the keyboard. */
export const Scrolls: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={frame}>
      <Backdrop>
        {many.map((l) => (
          <p key={l} className={tallText}>
            <a href={`#${l}`}>{l}</a>
          </p>
        ))}
      </Backdrop>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const el = backdropOf(canvasElement)
    const parent = el.parentElement
    if (parent === null) throw new Error('no parent')
    await expect(Math.round(el.getBoundingClientRect().height)).toBe(Math.round(parent.getBoundingClientRect().height))
    await expect(el.scrollHeight).toBeGreaterThan(el.clientHeight)
    el.scrollTop = 200
    await expect(el.scrollTop).toBe(200)
  },
}

/** Each size draws its own star field: 99 on desktop, 58 on tablet and 22 on phone. */
export const Sizes: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={sizes}>
      <div data-testid="desktop">
        <Backdrop size="desktop" />
      </div>
      <div data-testid="tablet">
        <Backdrop size="tablet" />
      </div>
      <div data-testid="phone">
        <Backdrop size="phone" />
      </div>
      <Swatches />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const count = (id: string) => {
      const box = canvasElement.querySelector(`[data-testid="${id}"]`)
      if (!(box instanceof HTMLElement)) throw new Error(`no ${id}`)
      return layers(getComputedStyle(backdropOf(box)).backgroundImage).length - 1
    }
    await expect(count('desktop')).toBe(99)
    await expect(count('tablet')).toBe(58)
    await expect(count('phone')).toBe(22)
  },
}

// A page that lifts its opaque list with z-index 1, as the-bridge's lists are, under a BottomSheet that lifts a copy
// of one row over its scrim (Workspaces M9, 146:252).
const list = css({ position: 'relative', bg: 'bg.canvas' })
const copy = css({ textStyle: 'body', color: 'fg.default', bg: 'surface.raised' })

function LiftedPage() {
  const [open, setOpen] = useState(false)
  const held = useRef<HTMLParagraphElement>(null)
  return (
    <div className={frame}>
      <Backdrop>
        <div className={list} data-list="">
          <p className={label}>Chat 1</p>
          <p ref={held} className={label} data-held="">
            Chat 2
          </p>
          <Button
            onClick={() => {
              setOpen(true)
            }}
          >
            Hold
          </Button>
        </div>
      </Backdrop>
      <BottomSheet title="Actions" open={open} onOpenChange={setOpen} lifted={{ content: <p className={copy}>Chat 2</p>, anchor: held }}>
        <Button>Rename</Button>
      </BottomSheet>
    </div>
  )
}

const liftedPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const listPart = canvasElement.querySelector<HTMLElement>('[data-list]')
  listPart?.style.setProperty('z-index', '1')
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Hold' }))
  await motionDone(await within(document.body).findByRole('dialog', { name: 'Actions' }))
  const held = canvasElement.querySelector('[data-held]')
  const lifted = document.querySelector<HTMLElement>('.bottom-sheet__lifted')
  if (held === null || lifted === null) throw new Error('no row or copy')
  // The copy takes no pointer events, and the modal sheet turns them off on the page, so the hit test sees both
  // only with them on: the top element at the row's centre is the copy, over the list's z-index, which the
  // backdrop keeps inside the page's stack.
  lifted.style.setProperty('pointer-events', 'auto')
  listPart?.style.setProperty('pointer-events', 'auto')
  const r = held.getBoundingClientRect()
  const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
  lifted.style.removeProperty('pointer-events')
  await expect(top !== null && lifted.contains(top)).toBe(true)
}

/** A page part lifted with a z-index stays under the overlays: a sheet's lifted row paints over a z-index 1 list. */
export const LiftedOverPageDark: StoryObj<typeof meta> = { render: () => <LiftedPage />, play: liftedPlay, globals: { mode: 'dark' } }
export const LiftedOverPageLight: StoryObj<typeof meta> = { render: () => <LiftedPage />, play: liftedPlay, globals: { mode: 'light' } }
