// The pure part of check-story-tags.ts: compare the Storybook index with the tags each story file really sets.

/** One story of the Storybook index (`storybook index`), as far as this check reads it. */
export type IndexStory = { id: string; importPath: string; exportName: string; tags: string[] }

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((t) => typeof t === 'string')

/** The stories of a parsed index.json; throws on a shape it does not know. */
export function parseIndex(value: unknown): IndexStory[] {
  if (typeof value !== 'object' || value === null || !('entries' in value)) throw new Error('index: no entries')
  const { entries } = value
  if (typeof entries !== 'object' || entries === null) throw new Error('index: entries is not an object')
  const stories: IndexStory[] = []
  const values: unknown[] = Object.values(entries)
  for (const entry of values) {
    if (typeof entry !== 'object' || entry === null) throw new Error('index: an entry is not an object')
    if (!('type' in entry) || entry.type !== 'story') continue
    if (!('id' in entry) || typeof entry.id !== 'string') throw new Error('index: a story has no id')
    if (!('importPath' in entry) || typeof entry.importPath !== 'string') throw new Error(`index: ${entry.id} has no importPath`)
    if (!('exportName' in entry) || typeof entry.exportName !== 'string') throw new Error(`index: ${entry.id} has no exportName`)
    if (!('tags' in entry) || !isStringArray(entry.tags)) throw new Error(`index: ${entry.id} has no tags`)
    stories.push({ id: entry.id, importPath: entry.importPath, exportName: entry.exportName, tags: entry.tags })
  }
  return stories
}

/** The tags of a story or meta object as its file sets them, or none. */
export function tagsOf(value: unknown): string[] {
  if (typeof value !== 'object' || value === null || !('tags' in value) || !isStringArray(value.tags)) return []
  return value.tags
}

/** True when Storybook shows a story in its UI: it starts from 'dev' and applies each tag in order ('!x' removes x). */
export function shownInUi(tags: readonly string[]): boolean {
  const set = new Set(['dev'])
  for (const t of tags) {
    if (t.startsWith('!')) set.delete(t.slice(1))
    else set.add(t)
  }
  return set.has('dev')
}

/**
 * The problems: each story that the index shows in the Storybook UI while its file hides it with '!dev', or the
 * reverse. Storybook reads tags without running the file, so a tag that comes from a helper function or a spread
 * (`{ ...XDark }`) is lost in the index (Codex review of #296). `runtime` maps "importPath:exportName" to the meta's
 * and the story's tags.
 */
export function compare(stories: readonly IndexStory[], runtime: ReadonlyMap<string, readonly string[]>): string[] {
  const problems: string[] = []
  for (const s of stories) {
    const tags = runtime.get(`${s.importPath}:${s.exportName}`)
    if (tags === undefined) {
      problems.push(`${s.importPath} ${s.exportName}: in the index, but the file does not export it`)
      continue
    }
    const fileShows = shownInUi(tags)
    const indexShows = s.tags.includes('dev')
    if (fileShows !== indexShows)
      problems.push(
        `${s.importPath} ${s.exportName}: the file ${fileShows ? 'shows' : 'hides'} it in the Storybook UI, the index ${indexShows ? 'shows' : 'hides'} it. Write its tags as a literal on the story object.`,
      )
  }
  return problems
}
