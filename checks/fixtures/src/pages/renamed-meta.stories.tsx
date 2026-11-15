// expect: eslint structure/story-title
import type { Meta, StoryObj } from '@storybook/react-vite'

const Thing = () => <p>Thing</p>
const storyMeta = { title: 'Controls/Thing', component: Thing } satisfies Meta<typeof Thing>
export default storyMeta
export const Default: StoryObj<typeof storyMeta> = {}
