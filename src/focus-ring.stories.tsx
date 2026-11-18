import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../styled-system/css'
import { Button } from './controls/button'
import { Stack } from './controls/layout'
import { focusRing } from './index'
import { focusRing as recipeFocusRing } from './theme/recipes/focus'

// The package's `focusRing` export on a page's own block (screen review R16).
// This story sits beside `index.ts`, outside the tiers, because it tests the
// public export: no tier may import `index.ts` or `theme/`.

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24' })
// A page block as the-bridge writes it: its own ring under `[focusRing]`, and `outline: 'none'`.
const block = css({
  bg: 'surface.raised',
  color: 'fg.default',
  textStyle: 'body',
  p: '12',
  borderRadius: 'md',
  outline: 'none',
  [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
})
// A swatch of the expected token, so the play function compares resolved colours.
const focusSwatch = css({ bg: 'border.focus' })

function swatch() {
  const el = document.querySelector('[data-swatch="focus"]')
  if (el === null) throw new Error('no focus swatch')
  return getComputedStyle(el).backgroundColor
}

function PageBlock() {
  return (
    <main className={page}>
      <Stack gap="12">
        {/* A library control on the page installs the tracker that sets `data-focus-quiet`. */}
        <Button>Library button</Button>
        <button type="button" className={block}>
          Page block
        </button>
        <span hidden data-swatch="focus" className={focusSwatch} />
      </Stack>
    </main>
  )
}

const meta = {
  title: 'Foundations/Focus ring',
  component: PageBlock,
} satisfies Meta<typeof PageBlock>

export default meta

async function expectRing(el: HTMLElement, shown: boolean) {
  await waitFor(() => expect(el).toHaveFocus())
  const style = getComputedStyle(el)
  if (shown) {
    await expect(style.outlineStyle).toBe('solid')
    await expect(style.outlineWidth).not.toBe('0px')
    await expect(style.outlineColor).toBe(swatch())
  } else {
    // Panda writes `outline: 'none'` as a transparent outline, so forced colours still show one.
    await expect(style.outlineColor).toBe('rgba(0, 0, 0, 0)')
  }
}

const play: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const button = canvas.getByRole('button', { name: 'Library button' })
  const pageBlock = canvas.getByRole('button', { name: 'Page block' })

  // The export is the condition the recipes use, one constant.
  await expect(focusRing).toBe(recipeFocusRing)
  await expect(focusRing).toBe('&:is(:focus-visible, [data-focus-visible]):not([data-focus-quiet])')

  // After the keyboard the page block shows its ring, as the library's Button does.
  await userEvent.click(button)
  await userEvent.tab({ shift: true })
  await userEvent.tab()
  await expectRing(button, true)
  await userEvent.tab()
  await expect(pageBlock).not.toHaveAttribute('data-focus-quiet')
  await expectRing(pageBlock, true)

  // After a pointer press the tracker marks it quiet, and it shows no ring.
  await userEvent.click(button)
  await userEvent.click(pageBlock)
  await expect(pageBlock).toHaveAttribute('data-focus-quiet')
  await expectRing(pageBlock, false)

  // A key on the focused block shows the ring again.
  await userEvent.keyboard('{ArrowDown}')
  await expect(pageBlock).not.toHaveAttribute('data-focus-quiet')
  await expectRing(pageBlock, true)

  // The mark alone hides the ring, even on a :focus-visible focus, such as a tap on iOS.
  await expect(pageBlock.matches(':focus-visible')).toBe(true)
  pageBlock.setAttribute('data-focus-quiet', '')
  await expectRing(pageBlock, false)
  pageBlock.removeAttribute('data-focus-quiet')
  await expectRing(pageBlock, true)
}

/** A page's own block with its ring under `[focusRing]`: the ring after the keyboard, none after a pointer press. */
export const PageBlockDark: StoryObj<typeof meta> = { play, globals: { mode: 'dark' } }
export const PageBlockLight: StoryObj<typeof meta> = { play, globals: { mode: 'light' } }
