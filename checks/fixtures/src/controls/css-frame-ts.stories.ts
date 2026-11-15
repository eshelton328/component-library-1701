// expect: clean
// A .stories.ts file may style its frame with css(), as a .stories.tsx may.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { css } from '../../../styled-system/css'

const frame = css({ padding: '4' })
const meta = { title: 'Actions/Frame ts', args: { className: frame } } satisfies Meta
export default meta
export const Default: StoryObj<typeof meta> = {}
