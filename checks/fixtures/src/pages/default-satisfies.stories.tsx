// expect: eslint structure/story-title
import type { Meta, StoryObj } from '@storybook/react-vite'

const Thing = () => <p>Thing</p>
export default { title: 'Controls/Thing', component: Thing } satisfies Meta<typeof Thing>
export const Default: StoryObj<Meta<typeof Thing>> = {}
