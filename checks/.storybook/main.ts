import type { StorybookConfig } from '@storybook/react-vite'

// Stories that prove the story tests catch failures. Run only by
// checks/run.mjs, never by `pnpm test`.
const config: StorybookConfig = {
  stories: ['../stories/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
}

export default config
