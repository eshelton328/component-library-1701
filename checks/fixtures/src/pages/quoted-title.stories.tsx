// expect: eslint structure/story-title
// Storybook ignores a quoted title key and names the story after its folder.
import type { Meta, StoryObj } from '@storybook/react-vite'

const Thing = () => <p>Thing</p>
const meta = { 'title': 'Actions/Thing', component: Thing } satisfies Meta<typeof Thing>
export default meta
export const Default: StoryObj<typeof meta> = {}
