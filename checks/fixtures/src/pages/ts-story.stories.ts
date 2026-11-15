// expect: eslint structure/story-title
// A .stories.ts file gets the same title rule as .stories.tsx.
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = { title: 'Controls/Thing' } satisfies Meta
export default meta
export const Default: StoryObj<typeof meta> = {}
