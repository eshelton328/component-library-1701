import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { atTextSize, brokenWords, textSizes, textSpills } from '../controls/text-size.testing'
import { css } from '../../styled-system/css'
import { DragPreview } from './drag-preview'
import { KindMark } from './kind-mark'
import { ListRow } from './list-row'

// The chat dragged from the Workbench sidebar (D2 105:960, with its hint 105:976) and over the chat alone (D6 158:1034).
const page = css({ display: 'flex', gap: '40', alignItems: 'flex-start', bg: 'surface.pane', p: '40' })
const slot = css({ w: 'shell.popover' })
const swatches = {
  overlay: css({ color: 'surface.overlay' }),
  active: css({ color: 'border.active' }),
  accent: css({ color: 'fg.accent' }),
  lift: css({ boxShadow: 'lift' }),
}

const row = (title: string) => (
  <ListRow variant="sidebar" density="compact" title={title} meta="GPT-5.5" leading={<KindMark kind="codex" size="16" />} onSelect={() => undefined} />
)

function Previews() {
  return (
    <main className={page}>
      <div className={slot} data-testid="tilted">
        <DragPreview tilt hint="Drop to move drift check into the-bridge">
          {row('drift check')}
        </DragPreview>
      </div>
      <div className={slot} data-testid="straight">
        <DragPreview>{row('hono server')}</DragPreview>
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
  title: 'Data display/Drag preview',
  component: Previews,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return name === 'lift' ? getComputedStyle(el).boxShadow : getComputedStyle(el).color
    }
    const card = (id: string) => {
      const el = canvas.getByTestId(id).querySelector('.drag-preview__card')
      if (!(el instanceof HTMLElement)) throw new Error(`no card in ${id}`)
      return el
    }
    // Both copies: the overlay fill, a 1 px border.active outline and the lift shadow; hidden from assistive technology.
    for (const id of ['tilted', 'straight']) {
      const style = getComputedStyle(card(id))
      await expect([style.backgroundColor, style.borderTopWidth, style.borderTopColor, style.boxShadow]).toEqual([swatch('overlay'), '1px', swatch('active'), swatch('lift')])
      await expect(card(id)).toHaveAttribute('aria-hidden', 'true')
      await expect(getComputedStyle(card(id).parentElement ?? card(id)).pointerEvents).toBe('none')
    }
    // `tilt` turns the copy 3° clockwise; without it the copy is straight.
    const turn = new DOMMatrix(getComputedStyle(card('tilted')).transform)
    await expect(Math.round((Math.atan2(turn.b, turn.a) * 180) / Math.PI)).toBe(3)
    await expect(getComputedStyle(card('straight')).transform).toBe('none')
    // The hint: a 24 px pill of pill text (11/16) in fg.accent on the overlay fill, outlined in border.active, 4 under the turned copy.
    const hint = within(canvas.getByTestId('tilted')).getByText('Drop to move drift check into the-bridge')
    const pill = getComputedStyle(hint)
    await expect([pill.fontSize, Math.round(parseFloat(pill.lineHeight)), pill.fontWeight, pill.color]).toEqual(['11px', 16, '500', swatch('accent')])
    await expect([pill.backgroundColor, pill.borderTopColor, hint.getBoundingClientRect().height]).toEqual([swatch('overlay'), swatch('active'), 24])
    // The client rects hold the turn: 4 from the turned copy's bounding box to the pill, so its low corner never meets the pill.
    await expect(Math.round(hint.getBoundingClientRect().top - card('tilted').getBoundingClientRect().bottom)).toBe(4)
    await expect(canvas.getByTestId('straight').querySelector('.drag-preview__hint')).toBeNull()
    // The copy is inert: its row's title button, and anything else in it, cannot take the focus.
    for (const id of ['tilted', 'straight']) {
      const inside = card(id).querySelectorAll('button, [href], input, [tabindex]')
      await expect(inside.length).toBeGreaterThan(0)
      for (const el of inside) {
        if (el instanceof HTMLElement) el.focus()
        await expect(card(id).contains(document.activeElement)).toBe(false)
      }
    }
  },
} satisfies Meta<typeof Previews>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

// The Workbench sidebar's drag (D2): the copy of a compact row with a model and a context meter, in a sidebar row's
// width, and the hint under it.
const sidebarSlot = css({ w: 'shell.sidebar', px: '24', bg: 'surface.pane' })

function SidebarDrag() {
  return (
    <main className={page}>
      <div className={sidebarSlot} data-testid="sidebar-drag">
        <DragPreview tilt hint="Drop to move drift check into the-bridge">
          <ListRow variant="sidebar" density="compact" title="drift check" meta="GPT-5.5 · 23%" leading={<KindMark kind="codex" size="16" />} onSelect={() => undefined} />
        </DragPreview>
      </div>
    </main>
  )
}

const dragTextSizesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const drag = within(canvasElement).getByTestId('sidebar-drag')
  const hint = drag.querySelector('.drag-preview__hint')
  if (!(hint instanceof HTMLElement)) throw new Error('no hint')
  // Small is as before: one line in a 24 px pill.
  await expect(hint.getBoundingClientRect().height).toBe(24)
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      // The hint's text stays inside its pill, which grows with it, and no word breaks inside.
      await expect(textSpills(drag)).toEqual([])
      await expect(brokenWords(drag)).toEqual([])
      const text = document.createRange()
      text.selectNodeContents(hint)
      await expect(text.getBoundingClientRect().bottom).toBeLessThanOrEqual(hint.getBoundingClientRect().bottom)
      await expect(hint.getBoundingClientRect().height).toBeGreaterThanOrEqual(24)
    })
  }
}

/** The sidebar's drag at Small, Default and Large (d-122): the hint pill grows with its text. */
export const DragTextSizesDark: StoryObj<typeof meta> = { render: () => <SidebarDrag />, play: dragTextSizesPlay, globals: { mode: 'dark', textSize: 'small' } }
export const DragTextSizesLight: StoryObj<typeof meta> = { render: () => <SidebarDrag />, play: dragTextSizesPlay, globals: { mode: 'light', textSize: 'small' } }
