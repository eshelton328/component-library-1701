// Functions for the release checks, so release.test.ts can test them
// without git or a build: the commit header format, the breaking-change
// marker, the API report diff that finds a breaking change (brain
// decision d-063) and the read of the recipe types that the diff needs.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The Conventional Commits header that the pr-title job in pr.yml checks. */
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
/** `type Name = A & B<C> & {` with no type parameters; group 1 is the text before the brace. */
const objectAliasOpen = /^(?:export\s+)?(?:declare\s+)?type\s+[A-Za-z_$][\w$]*\s*=\s*(.*?)\{$/
/**
 * A plain name, or a generic reference such as `Scalar<DialogVariantProps>`:
 * a plain name with type arguments that hold only names, string literals,
 * `|` and one more level of arguments.
 */
const typeReference = /^[A-Za-z_$][\w$]*(?:<[\w$\s,'"|]*(?:<[\w$\s,'"|]*>[\w$\s,'"|]*)*>)?$/
const isTypeReference = (part: string): boolean => typeReference.test(part)

/**
 * Splits a list of types joined by `&` into its parts, or returns
 * `undefined` when a part is not one `typeReference` allows. A type
 * argument cannot hold `&`, so every `&` splits.
 */
function typeParts(text: string): string[] | undefined {
  const parts = text.split('&').map((p) => p.trim())
  return parts.every(isTypeReference) ? parts : undefined
}

/**
 * The head of a type alias that opens an object literal, such as
 * `Scalar<DialogVariantProps>` in `type DialogProps = Scalar<DialogVariantProps> & {`:
 * the parts before the brace, `[]` with none, or `undefined` when the
 * line does not open such an alias or a part is not one `typeReference` allows.
 */
function aliasHead(t: string): string[] | undefined {
  const m = objectAliasOpen.exec(t)
  if (!m) return undefined
  const head = (m[1] ?? '').trim()
  if (head === '') return []
  if (!head.endsWith('&')) return undefined
  return typeParts(head.slice(0, -1))
}
/** A mapped type's key line, such as `[K in Keys]: V;`. */
const mappedKey = /^(?:[-+]?readonly\s+)?\[\s*[A-Za-z_$][\w$]*\s+in\b/
/**
 * The closing line of an object literal intersected with other types,
 * such as `} & PopoverDataAttributes;` or `} & Scalar<B>;`: parts that
 * `typeReference` allows, joined by `&`, with an optional `;`.
 */
const intersectionClose = {
  test: (t: string): boolean => {
    const m = /^\}\s*&(.*?)\s*;?$/.exec(t)
    return m !== null && typeParts(m[1] ?? '') !== undefined
  },
}

/**
 * Whether the type alias that opens at `lines[start]` can be split into
 * members: `false` when it cannot, `'object'` when it is one plain object
 * literal and `'intersection'` when it is one plain object literal
 * intersected with other types. The opening line is `type Name = {` or
 * `type Name = A & B<C> & {` with parts that `aliasHead` allows, no
 * depth-one line is a mapped key, and the line that closes the first brace
 * is exactly `}` or `};` (an object, or an intersection when the alias has
 * a head) or `} & A & B;` with plain identifiers only (an intersection,
 * see `intersectionClose`). A union, a
 * second object literal or any other tail closes the first brace on a line
 * such as `} | {` or `} & {`, so it fails the test.
 */
function objectAliasShape(lines: readonly string[], start: number): false | 'object' | 'intersection' {
  const head = aliasHead(lines[start]?.trim() ?? '')
  if (!head) return false
  let depth = 0
  for (const line of lines.slice(start)) {
    const t = line.trim()
    if (depth === 1 && mappedKey.test(t)) return false
    for (const c of t) {
      if (c === '{') depth++
      else if (c === '}' && --depth === 0) {
        if (t === '}' || t === '};') return head.length > 0 ? 'intersection' : 'object'
        return intersectionClose.test(t) ? 'intersection' : false
      }
    }
  }
  return false
}

/**
 * Splits a report into declarations and members. A line with no indent
 * that starts with `export` or `declare`, or that declares a name with no
 * `export` (API Extractor writes `function Highlight_2(…);` and then
 * `export { Highlight_2 as Highlight }` for a renamed export), opens a
 * declaration, so such a line never joins the item before it. In an
 * interface, a class or a type alias that is one plain object literal,
 * alone or intersected with named types or generic references (see
 * `objectAliasShape`), a line
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
 * intersected type is breaking. When the alias has a head, such as
 * `Scalar<DialogVariantProps> &`, that item holds the head and the tail
 * (`Scalar<DialogVariantProps> & {…} & PopoverDataAttributes;`), so a
 * change to either is breaking. A member line the
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
  // The types before the object literal, such as `Scalar<DialogVariantProps>`.
  let head: string[] = []
  let last: ApiItem | undefined
  const lines = apiLines(report)
  for (const [i, line] of lines.entries()) {
    const t = line.trim()
    if (depth === 0 && (/^(export|declare)\b/.test(line) || declName.test(line))) {
      const m = declName.exec(t)
      const kind = m?.[1] ?? ''
      decl = { key: unique(m?.[2] ?? t), text: t, required: false }
      const shape = kind === 'type' ? objectAliasShape(lines, i) : false
      split = splitKinds.has(kind) || shape !== false
      intersection = shape === 'intersection'
      head = intersection ? (aliasHead(t) ?? []) : []
      groups = 0
      items.push(decl)
      last = decl
    } else if (depth === 1 && groups === 0 && split && intersection && decl && (isClosing(t) || intersectionClose.test(t))) {
      // The end of an object literal intersected with other types: the
      // head and the tail are one item, so any change to those types shows.
      const tail = t.slice(1).trim()
      const text = head.length > 0 ? `${head.join(' & ')} & {…}${t.slice(1)}` : tail
      last = { key: unique(`${decl.key}.&`), text, required: true }
      items.push(last)
    } else if (depth === 1 && groups === 0 && split && decl && isClosing(t)) {
      // The end of the body of a split declaration.
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
  /**
   * New optional members of an object and name intersection that can
   * narrow a property an intersected type already allows, by key (see
   * `tailShadows`).
   */
  narrowed: string[]
  breaking: boolean
}

/** A key type of an index signature as a test on a member name. */
type NameTest = (name: string) => boolean
const numericName = /^(?:-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|NaN|-?Infinity)$/i
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The names an index signature key type allows, or `undefined` when the
 * type is not one this parser knows: `string`, `number`, `symbol`, a
 * template literal whose holes are `${string}` or `${number}`, or a
 * union of these.
 */
function keyTypeTest(type: string): NameTest | undefined {
  const tests: NameTest[] = []
  for (const part of type.split('|').map((p) => p.trim())) {
    if (part === 'string') tests.push(() => true)
    else if (part === 'number') tests.push((n) => numericName.test(n))
    else if (part === 'symbol') continue
    else if (/^`[^`]*`$/.test(part)) {
      const body = part.slice(1, -1)
      const pieces = body.split(/(\$\{(?:string|number)\})/)
      if (pieces.some((p, i) => i % 2 === 0 && p.includes('${'))) return undefined
      const pattern = pieces.map((p) => (p === '${string}' ? '.*' : p === '${number}' ? '-?[\\d.eE+-]*\\d[\\d.eE+-]*|NaN|-?Infinity' : escapeRegExp(p)))
      const re = new RegExp(`^${pattern.map((p, i) => (i % 2 === 1 ? `(?:${p})` : p)).join('')}$`, 's')
      tests.push((n) => re.test(n))
    } else return undefined
  }
  return (n) => tests.some((t) => t(n))
}

const indexSignature = /^(?:readonly\s+)?\[\s*[A-Za-z_$][\w$]*\s*:\s*(.+?)\s*\]\s*\??\s*:/
/** A declaration line whose members `apiItems` lists in full: an interface with no type parameters and no `extends`, or a type alias that is one plain object literal. */
const plainObjectDecl = /^(?:export\s+)?(?:declare\s+)?(?:interface\s+[A-Za-z_$][\w$]*\s*\{|type\s+[A-Za-z_$][\w$]*\s*=\s*\{)$/
/** `type Name = {` or `type Name<P> = {` with one plain type parameter; group 1 is `P`. */
const mappedAliasOpen = /^(?:export\s+)?(?:declare\s+)?type\s+[A-Za-z_$][\w$]*\s*(?:<\s*([A-Za-z_$][\w$]*)\s*>)?\s*=\s*\{\s*/
/** The key of a mapped type over the keys of a plain name, with no `as` clause; group 1 is the name. */
const keyofMappedKey = /^(?:[-+]?readonly\s+)?\[\s*[A-Za-z_$][\w$]*\s+in\s+keyof\s+([A-Za-z_$][\w$]*)\s*\]\s*[-+]?\??\s*:/

/**
 * The name whose keys a mapped type alias has, from its joined text:
 * `type Name<P> = { [K in keyof P]...: V }` has the keys of `P` (the
 * result is `P`), and `type Name = { [K in keyof Y]...: V }` has the keys
 * of `Y`. With a type parameter, the mapped type must map over that
 * parameter. The body must be one member and the alias must end after it.
 * Any other alias gives `undefined`.
 */
function mappedKeysOf(text: string): { param: string | undefined; over: string } | undefined {
  const open = mappedAliasOpen.exec(text)
  if (!open) return undefined
  const body = text.slice(open[0].length)
  const key = keyofMappedKey.exec(body)
  const over = key?.[1]
  if (!over) return undefined
  const param = open[1]
  if (param !== undefined && over !== param) return undefined
  // Find the brace that closes the body, and count the members at its top level.
  let depth = 1
  let members = 1
  let end = -1
  for (let i = 0; i < body.length; i++) {
    const c = body.charAt(i)
    if (c === '{' || c === '[' || c === '(') depth++
    else if (c === '}' || c === ']' || c === ')') depth--
    if (depth === 0) {
      end = i
      break
    }
    // A `;` at the top level that another member follows.
    if (c === ';' && depth === 1 && !body.slice(i + 1).trim().startsWith('}')) members++
  }
  if (end === -1 || members !== 1 || !/^;?$/.test(body.slice(end + 1).trim())) return undefined
  return { param, over }
}

/**
 * The member names that a type allows, as a test, or `undefined` when the
 * parser cannot tell. A plain name allows the members and index signature
 * keys of its declaration, when that is an interface or a plain object
 * alias with no tail. A mapped type alias over the keys of a name allows
 * the names that name allows, and a generic reference `G<A>` to an alias
 * `type G<P> = { [K in keyof P]...: V }` allows the names `A` allows.
 * A type that is not declared in `types`, or any other type, gives
 * `undefined`.
 */
function typeNames(types: ReadonlyMap<string, ApiItem>, type: string, seen: ReadonlySet<string> = new Set()): NameTest | undefined {
  if (seen.has(type)) return undefined
  const next = new Set([...seen, type])
  const open = type.indexOf('<')
  const name = open === -1 ? type : type.slice(0, open)
  const decl = types.get(name)
  if (!decl) return undefined
  const mapped = mappedKeysOf(decl.text)
  if (open !== -1) {
    // A generic reference: only a mapped alias over its one parameter.
    const arg = type.slice(open + 1, -1).trim()
    if (!mapped || mapped.param === undefined || !isTypeReference(arg)) return undefined
    return typeNames(types, arg, next)
  }
  if (mapped) return mapped.param === undefined ? typeNames(types, mapped.over, next) : undefined
  if (!plainObjectDecl.test(decl.text) || types.has(`${name}.&`)) return undefined
  const tests: NameTest[] = []
  for (const [key, member] of types) {
    if (!key.startsWith(`${name}.`)) continue
    const index = indexSignature.exec(member.text)
    if (index) {
      const test = keyTypeTest(index[1] ?? '')
      if (!test) return undefined
      tests.push(test)
      continue
    }
    const m = memberName.exec(member.text)
    const memberKey = m ? (m[1] ?? m[2]) : undefined
    if (memberKey === undefined) return undefined
    tests.push((n) => n === memberKey)
  }
  return (n) => tests.some((t) => t(n))
}

/**
 * Whether a new optional member `name` of a declaration with an
 * intersection item (`Owner.&`) can narrow a property that another type
 * of the intersection already allows: a named type or a generic reference
 * in its head or tail allows that name (see `typeNames`). When the parser
 * cannot tell (a type that is not in the report or in `types`, that is not
 * a plain object, an interface or a mapped type over the keys of a name,
 * that has its own tail, or a key type or member it cannot read), every
 * name counts.
 */
function tailShadows(types: ReadonlyMap<string, ApiItem>, owner: string, name: string): boolean {
  const tail = types.get(`${owner}.&`)
  if (!tail) return false
  const parts = typeParts(tail.text.replace(/;$/, '').replace(/^&/, '').replace(' & {…}', ''))
  if (!parts) return true
  for (const type of parts) {
    const test = typeNames(types, type)
    if (!test || test(name)) return true
  }
  return false
}

/**
 * Compares two reports by declaration and member. A removed or changed
 * item is breaking: a removed export, or a prop that is removed, renamed,
 * retyped or moved to another declaration. A new member with no `?` is
 * breaking too, because the exported interfaces are props and a caller
 * that does not give it fails to compile. So is a new optional member of
 * an object and name intersection that a named type in its tail may
 * already allow (see `tailShadows`): `"data-testid"?: string` narrows
 * `[key: \`data-${string}\`]: string | number`. A new declaration or any
 * other new optional member is not breaking. `types.before` and
 * `types.after` are reports of more declarations on each side, such as
 * the recipe variant types that the API report imports. `tailShadows`
 * reads them to find the names an intersected type allows, and the diff
 * does not compare them. A new member is narrowed when the types of either
 * side allow its name, because a type can lose a key in the same change
 * that adds the member; a side whose types the parser cannot read counts
 * as allowing every name. A declaration in a report wins over one of the
 * same name in its types.
 */
export function diffApi(before: string, after: string, types: { before?: string | undefined; after?: string | undefined } = {}): ApiDiff {
  const a = new Map(apiItems(before).map((i) => [i.key, i]))
  const b = new Map(apiItems(after).map((i) => [i.key, i]))
  const withTypes = (report: ReadonlyMap<string, ApiItem>, more: string | undefined) => new Map([...apiItems(more ?? '').map((i): [string, ApiItem] => [i.key, i]), ...report])
  const knownBefore = withTypes(a, types.before)
  const knownAfter = withTypes(b, types.after)
  const removed: string[] = []
  const added: string[] = []
  const addedRequired: string[] = []
  const narrowed: string[] = []
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
    if (old || !owner || !a.has(owner)) continue
    if (item.required) addedRequired.push(key)
    else {
      const name = key.slice(owner.length + 1).replace(/#\d+$/, '')
      // The tail text comes from the after side; the before side reads the
      // same types, so a key the release had counts too.
      const tail = b.get(`${owner}.&`)
      const beforeTypes = tail ? new Map([...knownBefore, [`${owner}.&`, tail]]) : knownBefore
      if (tailShadows(knownAfter, owner, name) || (tail !== undefined && tailShadows(beforeTypes, owner, name))) narrowed.push(key)
    }
  }
  return { removed, added, addedRequired, narrowed, breaking: removed.length > 0 || addedRequired.length > 0 || narrowed.length > 0 }
}

/** The committed file that holds the recipe types, for the API diffs. */
export const recipeTypesFile = 'api/recipe-types.api.md'

/**
 * The text of `recipeTypesFile`: the `.d.ts` files of
 * `styled-system/recipes/` in one TypeScript block, sorted by name, each
 * after a comment with its name. The API report imports the recipe
 * variant types (such as `DialogVariantProps`) and does not declare
 * them, so `diffApi` reads them from here to find the names that
 * `Scalar<DialogVariantProps>` allows. It is data: the `api-report`
 * workflow reads it from the PR without running PR code.
 */
export function recipeTypesReport(files: readonly { name: string; text: string }[]): string {
  const body = [...files]
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((f) => `// ${f.name}\n${f.text.trimEnd()}\n`)
    .join('\n')
  return `## Recipe types\n\nGenerated by \`pnpm api:update\` from \`styled-system/recipes/*.d.ts\`. Do not edit.\n\n\`\`\`ts\n${body}\`\`\`\n`
}

/**
 * The recipe types that Panda codegen wrote to `styled-system/recipes/`
 * under `root`, as `recipeTypesReport` gives them, or `undefined` when
 * that folder is missing.
 */
export function codegenRecipeTypes(root: string): string | undefined {
  const recipes = join(root, 'styled-system/recipes')
  if (!existsSync(recipes)) return undefined
  const files = readdirSync(recipes).filter((f) => f.endsWith('.d.ts'))
  return recipeTypesReport(files.map((name) => ({ name, text: readFileSync(join(recipes, name), 'utf8') })))
}

/**
 * The recipe types of the work tree at `root`, for the after side of an
 * API diff: the committed `recipeTypesFile`, which `pnpm check:api` keeps
 * equal to codegen, or `styled-system/recipes/` only when that file is
 * missing. `styled-system/` is gitignored, so a checkout with no
 * `pnpm install` has none. `undefined` when both are missing.
 */
export function afterRecipeTypes(root: string): string | undefined {
  const committed = join(root, recipeTypesFile)
  if (existsSync(committed)) return readFileSync(committed, 'utf8')
  return codegenRecipeTypes(root)
}

/** The error of `check:release-api` when `afterRecipeTypes` finds none. */
export const recipeTypesMissing = 'recipe types missing: run pnpm install'

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
