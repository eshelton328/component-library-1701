// expect: clean
// A story may style its own frame with css() (src/AGENTS.md).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { css } from '../../../styled-system/css'

const Frame = () => <div className={css({ padding: '4' })}>Frame</div>
const meta = { title: 'Actions/Frame', component: Frame } satisfies Meta<typeof Frame>
export default meta
export const Default: StoryObj<typeof meta> = {}
