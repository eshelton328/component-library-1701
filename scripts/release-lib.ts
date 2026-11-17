// Pure functions for the release checks, so release.test.ts can test them
// without git or a build: the commit header format, the breaking-change
// marker, and the API report diff that finds a breaking change (brain
// decision d-063).

/** The Conventional Commits header that the pr-title job in ci.yml checks. */
const header = /^(feat|fix|perf|refactor|docs|test|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: [a-z].*[^.]$/

export const isConventionalHeader = (subject: string): boolean => header.test(subject)

/** A `!` before the colon marks a breaking change for semantic-release. */
export const hasBreakingMarker = (title: string): boolean => /^[a-z]+(\([a-z0-9-]+\))?!: /.test(title)

/**
 * The declaration lines of an API Extractor report: the lines of its
 * TypeScript block, without blank lines, comments and imports. Each line
 * keeps its indent, because the indent shows which declaration owns it.
 */
export function apiLines(report: string): string[] {
  const lines = report.split(/\r?\n/)
  const start = lines.indexOf('```ts')
  if (start === -1) return []
  const end = lines.indexOf('```', start + 1)
  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .map((l) => l.trimEnd())
    .filter((l) => {
      const t = l.trim()
      return t !== '' && !t.startsWith('//') && !t.startsWith('import ')
    })
}

/** One declaration or member of the public API. */
export type ApiItem = {
  /** `Name` for a declaration, `Name.member` for a member. */
  key: string
  /** The text of the item, with nested lines joined to it. */
  text: string
  /** A member with no `?`: a caller that builds the type must give it. */
  required: boolean
}

const declName = /^(?:export\s+)?(?:declare\s+)?(?:default\s+)?(?:abstract\s+)?(const|let|var|function|class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/
const memberName = /^(?:readonly\s+)?(?:static\s+)?(?:readonly\s+)?(?:["']([^"']+)["']|([A-Za-z_$][\w$]*))(\?)?\s*[:(<]/
const isClosing = (t: string) => /^[}\])>;,\s]+$/.test(t)
const braces = (t: string) => (t.match(/[{]/g)?.length ?? 0) - (t.match(/[}]/g)?.length ?? 0)
const brackets = (t: string) => (t.match(/[[(]/g)?.length ?? 0) - (t.match(/[\])]/g)?.length ?? 0)
/** Interfaces and classes are always split into members. */
const splitKinds = new Set(['interface', 'class'])
/** `type Name = {` with no type parameters. */
const objectAliasOpen = /^(?:export\s+)?(?:declare\s+)?type\s+[A-Za-z_$][\w$]*\s*=\s*\{$/
/** A mapped type's key line, such as `[K in Keys]: V;`. */
const mappedKey = /^(?:[-+]?readonly\s+)?\[\s*[A-Za-z_$][\w$]*\s+in\b/
/**
 * The closing line of an object literal intersected with named types,
 * such as `} & PopoverDataAttributes;`: only plain identifiers joined by
 * `&`, with an optional `;`. Group 1 is the tail after the brace.
 */
const intersectionClose = /^\}\s*(&\s*[A-Za-z_$][\w$]*(?:\s*&\s*[A-Za-z_$][\w$]*)*\s*;?)$/

/**
 * Whether the type alias that opens at `lines[start]` can be split into
 * members: `false` when it cannot, `'object'` when it is one plain object
 * literal and `'intersection'` when it is one plain object literal
 * intersected with named types. The opening line is `type Name = {`, no
 * depth-one line is a mapped key, and the line that closes the first brace
 * is exactly `}` or `};` (an object) or `} & A & B;` with plain
 * identifiers only (an intersection, see `intersectionClose`). A union, a
 * second object literal or any other tail closes the first brace on a line
 * such as `} | {` or `} & {`, so it fails the test.
 */
function objectAliasShape(lines: readonly string[], start: number): false | 'object' | 'intersection' {
  if (!objectAliasOpen.test(lines[start]?.trim() ?? '')) return false
  let depth = 0
  for (const line of lines.slice(start)) {
    const t = line.trim()
    if (depth === 1 && mappedKey.test(t)) return false
    for (const c of t) {
      if (c === '{') depth++
      else if (c === '}' && --depth === 0) {
        if (t === '}' || t === '};') return 'object'
        return intersectionClose.test(t) ? 'intersection' : false
      }
    }
  }
  return false
}

/**
 * Splits a report into declarations and members. A line with no indent
 * that starts with `export` or `declare` opens a declaration. In an
 * interface, a class or a type alias that is one plain object literal,
 * alone or intersected with named types (see `objectAliasShape`), a line
 * one brace level inside it is a member,
 * keyed by the declaration name, unless a `[` or `(` that an earlier line
 * of the declaration opened is still open: a line inside such a group,
 * such as an element of a multi-line tuple, joins the member that opened
 * the group, up to the line that closes it. Every other line joins the item it
 * belongs to, with nested closing braces kept, so a member moved between
 * nested objects changes the text. Any other type alias (a union, an
 * intersection, a generic or a mapped type) is one item, because its
 * depth-one lines can belong to different branches. The tail of an
 * intersection, such as `& PopoverDataAttributes;`, is one more item,
 * keyed `Name.&` and required, so adding, removing or renaming an
 * intersected type is breaking. A member line the
 * parser cannot name (a call, construct, index or computed signature)
 * counts as required. A repeated key, as for an overloaded function, gets
 * a `#2` suffix.
 */
export function apiItems(report: string): ApiItem[] {
  const items: ApiItem[] = []
  const seen = new Map<string, number>()
  const unique = (key: string) => {
    const n = (seen.get(key) ?? 0) + 1
    seen.set(key, n)
    return n === 1 ? key : `${key}#${String(n)}`
  }
  let depth = 0
  // The `[` and `(` groups left open by earlier lines of the declaration.
  let groups = 0
  let decl: ApiItem | undefined
  let split = false
  // Whether the declaration is an object literal intersected with named types.
  let intersection = false
  let last: ApiItem | undefined
  const lines = apiLines(report)
  for (const [i, line] of lines.entries()) {
    const t = line.trim()
    if (depth === 0 && /^(export|declare)\b/.test(line)) {
      const m = declName.exec(t)
      const kind = m?.[1] ?? ''
      decl = { key: unique(m?.[2] ?? t), text: t, required: false }
      const shape = kind === 'type' ? objectAliasShape(lines, i) : false
      split = splitKinds.has(kind) || shape !== false
      intersection = shape === 'intersection'
      groups = 0
      items.push(decl)
      last = decl
    } else if (depth === 1 && groups === 0 && split && decl && isClosing(t)) {
      // The end of the body of a split declaration.
    } else if (depth === 1 && groups === 0 && split && intersection && decl && intersectionClose.test(t)) {
      // The end of an object literal intersected with named types: the
      // tail is its own item, so any change to the named types shows.
      last = { key: unique(`${decl.key}.&`), text: t.slice(1).trim(), required: true }
      items.push(last)
    } else if (depth === 1 && groups === 0 && split && decl) {
      const m = memberName.exec(t)
      const name = m ? (m[1] ?? m[2] ?? t) : t
      last = { key: unique(`${decl.key}.${name}`), text: t, required: !m || !m[3] }
      items.push(last)
    } else if (last) {
      last.text += ` ${t}`
    }
    depth = Math.max(0, depth + braces(t))
    groups = Math.max(0, groups + brackets(t))
  }
  return items
}

export type ApiDiff = {
  /** Items that are gone or whose text changed (the old text). */
  removed: string[]
  /** Items that are new or whose text changed (the new text). */
  added: string[]
  /** New members that a caller must give, by key. */
  addedRequired: string[]
  breaking: boolean
}

/**
 * Compares two reports by declaration and member. A removed or changed
 * item is breaking: a removed export, or a prop that is removed, renamed,
 * retyped or moved to another declaration. A new member with no `?` is
 * breaking too, because the exported interfaces are props and a caller
 * that does not give it fails to compile. A new declaration or a new
 * optional member is not breaking.
 */
export function diffApi(before: string, after: string): ApiDiff {
  const a = new Map(apiItems(before).map((i) => [i.key, i]))
  const b = new Map(apiItems(after).map((i) => [i.key, i]))
  const removed: string[] = []
  const added: string[] = []
  const addedRequired: string[] = []
  for (const [key, item] of a) {
    const now = b.get(key)
    if (!now || now.text !== item.text) removed.push(item.text)
  }
  for (const [key, item] of b) {
    const old = a.get(key)
    if (old && old.text === item.text) continue
    added.push(item.text)
    // A new member of a declaration that existed before; a new declaration
    // breaks no caller, so its members do not count.
    const owner = key.includes('.') ? key.slice(0, key.indexOf('.')) : undefined
    if (!old && owner && a.has(owner) && item.required) addedRequired.push(key)
  }
  return { removed, added, addedRequired, breaking: removed.length > 0 || addedRequired.length > 0 }
}

export type RegistryState = { ok: boolean; problem?: string; warning?: string }

/**
 * Compares the last release tag on the branch with the versions in the
 * registry. semantic-release pushes the tag before it publishes, so a
 * failed publish leaves a tag with no package. A rerun publishes only when
 * the commits after the tag make a release (`releaseType` from the commit
 * analyzer); with none, or only `ci:` or `docs:` commits, it passes with no
 * package. That case fails here.
 */
export function registryState(input: { latestTag: string | undefined; releaseType: string | null; versions: readonly string[] }): RegistryState {
  const { latestTag, releaseType, versions } = input
  if (!latestTag) return { ok: true }
  const version = latestTag.replace(/^v/, '')
  if (versions.includes(version)) return { ok: true }
  const gone = `${latestTag} has no package ${version} in the registry: an earlier release pushed the tag and did not publish.`
  if (releaseType === null) {
    return {
      ok: false,
      problem: `${gone} No commit after the tag makes a release, so semantic-release would publish nothing and pass. Push a fix commit, so the release publishes the next version. Do not move or delete the tag.`,
    }
  }
  return { ok: true, warning: `${gone} This release publishes the next version (${releaseType}).` }
}
