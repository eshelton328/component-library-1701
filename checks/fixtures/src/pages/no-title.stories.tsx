// expect: eslint structure/story-title
// Without a title, Storybook names the story after its folder, a tier.
import type { Meta, StoryObj } from '@storybook/react-vite'

const Thing = () => <p>Thing</p>
const meta = { component: Thing } satisfies Meta<typeof Thing>
export default meta
export const Default: StoryObj<typeof meta> = {}
