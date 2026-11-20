import type { Decorator, Preview } from '@storybook/react-vite'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../src/index.css'
import { resetStoryState } from './story-reset.ts'

// The theme and mode the toolbar picks. Panda reads `data-panda-theme` for
// the theme and the `dark` class for the mode. A story can fix either one
// with `globals: { mode: 'light' }`.
const withThemeAndMode: Decorator = (Story, { globals }) => {
  const root = document.documentElement
  root.classList.toggle('dark', globals.mode !== 'light')
  root.dataset.pandaTheme = String(globals.theme ?? 'viewscreen')
  return Story()
}

const preview: Preview = {
  decorators: [withThemeAndMode],
  // Each story test starts from the browser's own state, also after a story that timed out (story-reset.ts).
  beforeEach: resetStoryState,
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { title: 'Theme', icon: 'paintbrush', items: ['viewscreen'], dynamicTitle: true },
    },
    mode: {
      description: 'Mode',
      toolbar: { title: 'Mode', icon: 'mirror', items: ['dark', 'light'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'viewscreen', mode: 'dark' },
  parameters: {
    // An accessibility violation fails the story test, in CI and locally.
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    layout: 'fullscreen',
    // The purpose groups of src/structure.ts, in the same order. Storybook
    // reads storySort without running this file, so the list is a literal.
    options: {
      storySort: {
        order: [
          'Foundations',
          'Actions',
          'Forms',
          'Navigation',
          'Layout',
          'Overlays',
          'Status',
          'Data display',
          'Conversation',
          'Examples',
        ],
      },
    },
  },
}

export default preview
