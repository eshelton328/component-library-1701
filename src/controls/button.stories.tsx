import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '24' })
const row = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12' })
const label = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl', display: 'grid', gap: '12' })

const variants = ['primary', 'secondary', 'danger', 'dangerSoft', 'dangerText'] as const
const sizes = ['sm', 'md', 'lg', 'xl'] as const

function Plus() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}

// Every variant, size and state, on the canvas and on a pane. The story
// test runs axe on both modes, so a label colour that fails contrast on
// its fill fails the test.
function AllButtons() {
  return (
    <main className={page}>
      {[{ name: 'on bg.canvas', className: '' }, { name: 'on surface.pane', className: pane }].map((frame) => (
        <section key={frame.name} className={frame.className || css({ display: 'grid', gap: '12' })}>
          <span className={label}>{frame.name}</span>
          <div className={row}>
            {variants.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </div>
          <div className={row}>
            {variants.map((v) => (
              <Button key={v} variant={v} disabled>
                {v}
              </Button>
            ))}
          </div>
        </section>
      ))}
      <section className={css({ display: 'grid', gap: '12' })}>
        <span className={label}>sizes</span>
        <div className={row}>
          {sizes.map((s) => (
            <Button key={s} size={s} variant="primary">
              <Plus />
              {`New chat ${s}`}
            </Button>
          ))}
        </div>
        <div className={row}>
          {sizes.map((s) => (
            <Button key={s} size={s} iconOnly aria-label={`Add, ${s}`}>
              <Plus />
            </Button>
          ))}
          <Button aria-expanded="true" aria-haspopup="menu">
            Sort
          </Button>
        </div>
      </section>
    </main>
  )
}

const meta = { title: 'Actions/Button', component: AllButtons } satisfies Meta<typeof AllButtons>
export default meta

// The button of an open menu has the active border, not its variant's.
const openMenuBorder: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const border = (name: string) => getComputedStyle(canvas.getAllByRole('button', { name })[0] ?? canvasElement).borderColor
  await expect(border('Sort')).not.toBe(border('secondary'))
}

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, play: openMenuBorder }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' }, play: openMenuBorder }

const onClick = fn<(name: string) => void>()

/** A click calls `onClick`; a disabled button and a plain button never submit a form. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <form onSubmit={(e) => { e.preventDefault(); onClick('submit') }}>
        <div className={row}>
          <Button variant="primary" onClick={() => { onClick('save') }}>Save</Button>
          <Button disabled onClick={() => { onClick('disabled') }}>Disabled</Button>
        </div>
      </form>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onClick.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(onClick).toHaveBeenCalledWith('save')
    await expect(onClick).not.toHaveBeenCalledWith('submit')
    await userEvent.click(canvas.getByRole('button', { name: 'Disabled' }))
    await expect(onClick).toHaveBeenCalledTimes(1)
    await expect(canvas.getByRole('button', { name: 'Disabled' })).toHaveAttribute('type', 'button')
  },
}
