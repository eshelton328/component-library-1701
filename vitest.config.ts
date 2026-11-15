import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

const browser = {
  enabled: true,
  headless: true,
  provider: playwright(),
  instances: [{ browser: 'chromium' as const }],
}

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: { name: 'storybook', browser },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: 'checks/.storybook' })],
        test: { name: 'checks', browser },
      },
    ],
  },
})
