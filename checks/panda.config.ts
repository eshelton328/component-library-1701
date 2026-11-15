import { defineConfig } from '@pandacss/dev'
import base from '../panda.config'

// The library config plus two test tokens, so the fixtures can show what the
// checks accept and reject. These tokens never enter the library.
export default defineConfig({
  ...base,
  // Fixtures use only their two test tokens, not the library's tokens.
  presets: ['@pandacss/preset-base'],
  globalCss: {},
  include: ['./checks/fixtures/**/*.{ts,tsx}'],
  exclude: [],
  outdir: 'checks/styled-system',
  theme: {
    tokens: { colors: { cyan: { 500: { value: '#00e5ff' } } } },
    semanticTokens: { colors: { accent: { value: '{colors.cyan.500}' } } },
  },
})
