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
      'tokens/generated/',
    ],
  },
  ...(await libraryConfig({
    pandaConfig: './panda.config.ts',
    tsconfigRootDir: import.meta.dirname,
    // Every hand-written TypeScript file; scripts/check-fixtures checks the scope.
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}', '*.ts'],
  })),
]
