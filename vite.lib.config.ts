// Builds the components into dist/ for the package: one ES module per
// source file, with React, Ark UI and Panda's styled-system left external.
// `pnpm build:components` runs it, and `pnpm check:pack` imports the result
// under plain Node.
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import pkg from './package.json' with { type: 'json' }

const root = import.meta.dirname
const styledSystem = resolve(root, 'styled-system')

// A component imports '../../styled-system/recipes'. In the package that
// path is wrong for every consumer, so it becomes the package's own
// subpath export, which Node and bundlers both resolve.
const styledSystemAsPackage = (): Plugin => ({
  name: 'styled-system-as-package',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer || !source.includes('styled-system')) return null
    const target = resolve(importer, '..', source)
    if (!target.startsWith(styledSystem + '/')) return null
    const sub = target.slice(styledSystem.length + 1).replace(/\/index(\.js)?$/, '').replace(/\.js$/, '')
    return { id: `${pkg.name}/${sub}`, external: true }
  },
})

export default defineConfig({
  plugins: [styledSystemAsPackage()],
  build: {
    outDir: 'dist/components',
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    lib: { entry: resolve(root, 'src/index.ts'), formats: ['es'] },
    rolldownOptions: {
      external: (id) => /^(react|react-dom)(\/|$)/.test(id) || /^@ark-ui\/react(\/|$)/.test(id),
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
  },
})
