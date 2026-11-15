import { libraryConfig } from './eslint.shared.js'

export default [
  {
    ignores: [
      'dist/',
      'styled-system/',
      'storybook-static/',
      'checks/',
      'node_modules/',
      'eslint.*.js',
      'postcss.config.js',
    ],
  },
  ...(await libraryConfig({
    pandaConfig: './panda.config.ts',
    tsconfigRootDir: import.meta.dirname,
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
  })),
]
