import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = { title: 'Checks/A11y' } satisfies Meta
export default meta

// expect: pass
export const Labelled: StoryObj = {
  render: () => <button type="button">Save</button>,
}

// expect: fail (a button with no accessible name)
export const Unlabelled: StoryObj = {
  render: () => <button type="button" />,
}
