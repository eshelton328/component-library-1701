// expect: eslint no-restricted-syntax
import type { Meta, StoryObj } from '@storybook/react-vite'

const Thing = () => <p>Thing</p>
const meta = { title: 'Controls/Thing', component: Thing } satisfies Meta<typeof Thing>
export default meta
export const Default: StoryObj<typeof meta> = {}
