import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Pager, type PagerProps } from './pager'

const page = css({ bg: 'surface.pane', p: '24', display: 'flex', flexDirection: 'column', gap: '24' })
const desktop = css({ w: 'shell.dialogLg' })
const phone = css({ w: 'shell.popoverLg' })
const swatches = { muted: css({ color: 'fg.muted' }), default: css({ color: 'fg.default' }) }
const sizes = [10, 25, 50] as const

// The design frames' states: D01 (desktop), T01 (tablet), M01 (phone), 18 chats at 10 a page.
const states: { id: string; props: PagerProps }[] = [
  { id: 'first', props: { page: 1, pageSize: 10, total: 18, pageSizes: sizes } },
  { id: 'middle', props: { page: 2, pageSize: 10, total: 30, pageSizes: sizes } },
  { id: 'last', props: { page: 2, pageSize: 10, total: 18 } },
  { id: 'tablet', props: { page: 1, pageSize: 10, total: 18, pageSizes: sizes, size: 'tablet' } },
  { id: 'phone', props: { page: 1, pageSize: 10, total: 18, pageSizes: sizes, size: 'phone' } },
  { id: 'empty', props: { page: 1, pageSize: 10, total: 0, pageSizes: sizes } },
]

function States() {
  return (
    <main className={page}>
      {states.map(({ id, props }) => (
        <div key={id} data-testid={id} className={id === 'phone' ? phone : desktop}>
          <Pager {...props} />
        </div>
      ))}
      <div hidden>{Object.entries(swatches).map(([name, className]) => <span key={name} data-swatch={name} className={className} />)}</div>
    </main>
  )
}

const meta = {
  title: 'Navigation/Pager',
  component: States,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? document.body).color
    const slot = (id: string, name: string) => {
      const el = canvas.getByTestId(id).querySelector(`.pager__${name}`)
      if (!(el instanceof HTMLElement)) throw new Error(`no ${name} in ${id}`)
      return el
    }
    const buttons = (id: string) => {
      const box = within(canvas.getByTestId(id))
      return [box.getByRole('button', { name: 'Previous page' }), box.getByRole('button', { name: 'Next page' })] as const
    }
    // The range: "1–10 of 18" in small (Regular 12/16), fg.muted; "0 of 0" with no rows.
    const ranges = states.map(({ id }) => slot(id, 'range').textContent)
    await expect(ranges).toEqual(['1–10 of 18', '11–20 of 30', '11–18 of 18', '1–10 of 18', '1–10 of 18', '0 of 0'])
    const range = getComputedStyle(slot('first', 'range'))
    await expect([range.fontSize, range.fontWeight, range.color]).toEqual(['12px', '400', swatch('muted')])
    await expect(parseFloat(range.lineHeight)).toBeCloseTo(16, 0)
    // The current page is named for assistive technology and drawn in label (Medium 14/20), fg.default.
    const current = canvas.getByTestId('middle').querySelector('[aria-current="page"]')
    if (!(current instanceof HTMLElement)) throw new Error('no current page')
    await expect(current).toHaveTextContent('Page 2 of 3')
    await expect(slot('middle', 'pageName')).toHaveTextContent('Page 2 of 3')
    const text = getComputedStyle(current)
    await expect([text.fontSize, text.fontWeight, text.color, text.fontFamily]).toEqual(['14px', '500', swatch('default'), range.fontFamily])
    await expect(parseFloat(text.lineHeight)).toBeCloseTo(20, 0)
    // Previous is off on the first page, Next on the last, both with no rows; the middle has both on.
    const off = (id: string) => buttons(id).map((b) => b.hasAttribute('disabled'))
    await expect([off('first'), off('middle'), off('last'), off('empty')]).toEqual([[true, false], [false, false], [false, true], [true, true]])
    // Desktop: 28 px square buttons 8 from a 32 px number; the nav sits in the middle of the row.
    const [prev, next] = buttons('first')
    await expect([prev.getBoundingClientRect().width, prev.getBoundingClientRect().height]).toEqual([28, 28])
    await expect(current.getBoundingClientRect().width).toBe(32)
    await expect(current.getBoundingClientRect().left - buttons('middle')[0].getBoundingClientRect().right).toBe(8)
    const row = canvas.getByTestId('first').getBoundingClientRect()
    const nav = slot('first', 'nav').getBoundingClientRect()
    await expect(Math.abs(nav.left + nav.width / 2 - (row.left + row.width / 2))).toBeLessThanOrEqual(1)
    await expect(next.getBoundingClientRect().left).toBeGreaterThan(prev.getBoundingClientRect().right)
    // The Rows picker ends the row at 28 px; without pageSizes there is none.
    const rows = within(canvas.getByTestId('first')).getByRole('button', { name: 'Rows 10 rows' })
    await expect(rows.getBoundingClientRect().height).toBe(28)
    await expect(rows.getBoundingClientRect().right).toBe(row.right)
    await expect(canvas.getByTestId('last').querySelector('.pager__rows')).toBeNull()
    // Tablet: 36 px buttons with a touch target of 44 or more, a 44 px number and a 36 px picker.
    for (const id of ['tablet', 'phone']) {
      for (const b of buttons(id)) {
        await expect(b.getBoundingClientRect().height).toBe(36)
        await expect(Number.parseFloat(getComputedStyle(b, '::before').height)).toBeGreaterThanOrEqual(44)
      }
      await expect(slot(id, 'current').getBoundingClientRect().width).toBe(44)
    }
    await expect(within(canvas.getByTestId('tablet')).getByRole('button', { name: 'Rows 10 rows' }).getBoundingClientRect().height).toBe(36)
    // Phone: no picker, the range at the start and the buttons at the end.
    const phoneRow = canvas.getByTestId('phone').getBoundingClientRect()
    await expect(canvas.getByTestId('phone').querySelector('.pager__rows')).toBeNull()
    await expect(slot('phone', 'range').getBoundingClientRect().left).toBe(phoneRow.left)
    await expect(buttons('phone')[1].getBoundingClientRect().right).toBe(phoneRow.right)
  },
} satisfies Meta<typeof States>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onPageSizeChange = fn()
// The caller sets the page after an await, as a page that loads its rows first does.
const later = (set: () => void) => { void new Promise((done) => setTimeout(done, 50)).then(set) }

function Controlled() {
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const pick = (next: number) => { onPageSizeChange(next); setSize(next); setCurrent(1) }
  return (
    <main className={page}>
      <div className={desktop}>
        <Pager page={current} pageSize={size} total={18} pageSizes={sizes} onPageChange={(next) => { later(() => { setCurrent(next) }) }} onPageSizeChange={pick} />
      </div>
    </main>
  )
}

/**
 * Next and Previous by keyboard and click with a caller that sets the page later, the focus at the ends, and a
 * Rows change. Chromium keeps the focus on a button that turns disabled; WebKit moves it to the body, so the play
 * blurs such a button, as WebKit does (Codex P1 on #365). Focus on any other element stays.
 */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onPageSizeChange.mockClear()
    const canvas = within(canvasElement)
    const prev = canvas.getByRole('button', { name: 'Previous page' })
    const next = canvas.getByRole('button', { name: 'Next page' })
    const range = () => canvasElement.querySelector('.pager__range')?.textContent
    const webkit = new MutationObserver(() => { for (const b of [prev, next]) if (b.hasAttribute('disabled') && document.activeElement === b) b.blur() })
    webkit.observe(canvasElement, { attributes: true, subtree: true, attributeFilter: ['disabled'] })
    try {
      // Enter on Next shows page 2, the last: Next turns off and the focus moves to Previous.
      next.focus()
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(range()).toBe('11–18 of 18'))
      await expect(canvasElement.querySelector('[aria-current="page"]')).toHaveTextContent('Page 2 of 2')
      await expect(next).toBeDisabled()
      await waitFor(() => expect(prev).toHaveFocus())
      // A click on Previous goes back to page 1, and the focus moves to Next.
      await userEvent.click(prev)
      await waitFor(() => expect(range()).toBe('1–10 of 18'))
      await expect(prev).toBeDisabled()
      await waitFor(() => expect(next).toHaveFocus())
      // Space on Next goes forward; when the focus moves to another control before the page comes, it stays there.
      await userEvent.keyboard(' ')
      const outside = canvasElement.appendChild(document.createElement('button'))
      outside.focus()
      await waitFor(() => expect(range()).toBe('11–18 of 18'))
      await expect(outside).toHaveFocus()
      outside.remove()
    } finally {
      webkit.disconnect()
    }
    // Rows 25: the caller takes the size and goes to page 1; one page, so both buttons are off.
    await userEvent.click(canvas.getByRole('button', { name: 'Rows 10 rows' }))
    const menu = await within(document.body).findByRole('menu')
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: '25 rows' }))
    await expect(onPageSizeChange).toHaveBeenCalledWith(25)
    await waitFor(() => expect(range()).toBe('1–18 of 18'))
    await expect(prev).toBeDisabled()
    await expect(next).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Rows 25 rows' })).toBeInTheDocument()
  },
}
