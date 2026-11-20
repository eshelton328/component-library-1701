import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { compare, parseIndex, tagsOf } from './story-tags-lib.ts'

const story = (exportName: string, tags: string[]) => ({ type: 'story', id: exportName, importPath: './a.stories.tsx', exportName, tags })
const index = (...entries: ReturnType<typeof story>[]) => ({ v: 5, entries: Object.fromEntries(entries.map((e) => [e.id, e])) })

void test('a story the file hides with !dev but the index shows is a problem', () => {
  const stories = parseIndex(index(story('Light', ['dev', 'test'])))
  const problems = compare(stories, new Map([['./a.stories.tsx:Light', ['!dev']]]))
  assert.equal(problems.length, 1)
  assert.match(problems[0] ?? '', /the file hides it.*the index shows it/)
})

void test('a story the file shows but the index hides is a problem', () => {
  const problems = compare(parseIndex(index(story('Dark', ['test']))), new Map([['./a.stories.tsx:Dark', []]]))
  assert.match(problems[0] ?? '', /the file shows it.*the index hides it/)
})

void test('agreeing stories, shown or hidden, pass', () => {
  const stories = parseIndex(index(story('Dark', ['dev', 'test']), story('Touch', ['test'])))
  const runtime = new Map([
    ['./a.stories.tsx:Dark', ['autodocs']],
    ['./a.stories.tsx:Touch', ['!dev']],
  ])
  assert.deepEqual(compare(stories, runtime), [])
})

void test('a story in the index that the file does not export is a problem', () => {
  assert.match(compare(parseIndex(index(story('Gone', ['dev']))), new Map())[0] ?? '', /does not export it/)
})

void test('parseIndex skips docs entries and rejects a story with a broken shape', () => {
  assert.deepEqual(parseIndex({ entries: { d: { type: 'docs', id: 'd' } } }), [])
  assert.throws(() => parseIndex({ entries: { s: { type: 'story', id: 's', importPath: './a', exportName: 'S' } } }), /has no tags/)
  assert.throws(() => parseIndex({ entries: { s: { type: 'story', id: 's', exportName: 'S', tags: [] } } }), /has no importPath/)
  assert.throws(() => parseIndex({}), /no entries/)
  assert.throws(() => parseIndex({ entries: { s: 1 } }), /not an object/)
})

void test('a later dev tag shows a story again, as in Storybook (meta !dev, story dev)', () => {
  const shown = compare(parseIndex(index(story('Back', ['dev', 'test']))), new Map([['./a.stories.tsx:Back', ['!dev', 'dev']]]))
  assert.deepEqual(shown, [])
  const hidden = compare(parseIndex(index(story('Gone', ['test']))), new Map([['./a.stories.tsx:Gone', ['dev', '!dev']]]))
  assert.deepEqual(hidden, [])
})

void test('tagsOf reads only a string array', () => {
  assert.deepEqual(tagsOf({ tags: ['!dev'] }), ['!dev'])
  assert.deepEqual(tagsOf({ tags: [1] }), [])
  assert.deepEqual(tagsOf(undefined), [])
})

void test('the story-tags check loads the same story file extensions as .storybook/main.ts', () => {
  const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
  const main = /\*\.stories\.@\(([^)]+)\)/.exec(read('../.storybook/main.ts'))?.[1]
  assert.ok(main !== undefined, 'no stories glob in .storybook/main.ts')
  const loaded = [...read('./story-modules.ts').matchAll(/'\.\.\/src\/\*\*\/\*\.stories\.(\w+)'/g)].map((m) => m[1])
  assert.deepEqual(loaded.sort(), main.split('|').sort())
})
