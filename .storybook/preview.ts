import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    // An accessibility violation fails the story test, in CI and locally.
    a11y: { test: 'error' },
  },
}

export default preview
