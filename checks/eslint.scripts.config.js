// The type fixtures linted with the scripts' config, so a weaker
// scriptConfig fails pnpm checks as a weaker libraryConfig does. Only
// fixtures whose second line is `// scope: scripts too` count.
import { scriptConfig } from '../eslint.shared.js'

export default [
  { ignores: ['checks/styled-system/', 'checks/stories/', 'checks/.storybook/', 'checks/*.*'] },
  ...scriptConfig({ tsconfigRootDir: import.meta.dirname, files: ['checks/fixtures/**/*.tsx'] }),
]
