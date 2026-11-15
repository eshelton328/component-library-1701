// expect: clean
// A title in args is a prop, not the story title.
import type { Meta, StoryObj } from '@storybook/react-vite'

const Dialog = ({ title }: { title: string }) => <p>{title}</p>
const meta = { title: 'Overlays/Dialog', component: Dialog, args: { title: 'Confirm' } } satisfies Meta<typeof Dialog>
export default meta
export const Default: StoryObj<typeof meta> = {}
