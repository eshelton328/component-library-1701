// The browser half of check-story-tags.ts: it loads every story file, as the story test runner does, and compares the
// tags each story really has with the Storybook index that check-story-tags.ts wrote to .vitest/story-index.json.
import { expect, it } from 'vitest'
import { storyModules as modules } from './story-modules.ts'
import { compare, parseIndex, tagsOf } from './story-tags-lib.ts'

const indexes: Record<string, unknown> = import.meta.glob('../.vitest/story-index.json', { eager: true, import: 'default' })

it('the Storybook index shows and hides the same stories as their files', () => {
  const index = Object.values(indexes)[0]
  if (index === undefined) throw new Error('no .vitest/story-index.json: run pnpm check:story-tags')
  const runtime = new Map<string, string[]>()
  for (const [path, exports] of Object.entries(modules)) {
    const importPath = path.replace(/^\.\.\//, './')
    const metaTags = tagsOf(exports.default)
    for (const [name, value] of Object.entries(exports)) {
      if (name !== 'default') runtime.set(`${importPath}:${name}`, [...metaTags, ...tagsOf(value)])
    }
  }
  expect(compare(parseIndex(index), runtime)).toEqual([])
})
