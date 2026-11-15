import { libraryConfig } from '../eslint.shared.js'

export default [
  { ignores: ['checks/styled-system/', 'checks/stories/', 'checks/.storybook/', 'checks/*.*'] },
  ...(await libraryConfig({
    pandaConfig: './checks/panda.config.ts',
    tsconfigRootDir: import.meta.dirname,
    files: ['checks/fixtures/**/*.tsx'],
    srcDir: 'checks/fixtures/src',
  })),
]
