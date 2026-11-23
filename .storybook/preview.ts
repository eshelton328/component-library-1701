import type { Decorator, Preview } from '@storybook/react-vite'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../src/index.css'
import { resetStoryState } from './story-reset.ts'
import { textSizeClass } from '../src/foundations/text-size.ts'

// The theme, mode and text size the toolbar picks. Panda reads
// `data-panda-theme` for the theme, the `dark` class for the mode and the
// `text-default` or `text-large` class for the text size (Small needs none). A story can fix
// any of them with `globals: { mode: 'light' }`.
const withThemeAndMode: Decorator = (Story, { globals }) => {
  const root = document.documentElement
  root.classList.toggle('dark', globals.mode !== 'light')
  for (const size of ['default', 'large'] as const) root.classList.toggle(textSizeClass[size], globals.textSize === size)
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
    textSize: {
      description: 'Text size',
      toolbar: { title: 'Text size', icon: 'paragraph', items: ['small', 'default', 'large'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'viewscreen', mode: 'dark', textSize: 'small' },
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
