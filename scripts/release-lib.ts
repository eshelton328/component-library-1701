// Pure functions for the release checks, so release.test.ts can test them
// without git or a build: the commit header format, and the API report
// diff that finds a breaking change (brain decision d-063).

/** The Conventional Commits header that the pr-title job in ci.yml checks. */
const header = /^(feat|fix|perf|refactor|docs|test|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: [a-z].*[^.]$/

export const isConventionalHeader = (subject: string): boolean => header.test(subject)

/** A `!` before the colon marks a breaking change for semantic-release. */
export const hasBreakingMarker = (title: string): boolean => /^[a-z]+(\([a-z0-9-]+\))?!: /.test(title)

/**
 * The declaration lines of an API Extractor report: the lines of its
 * TypeScript block, without blank lines and comments.
 */
export function apiLines(report: string): string[] {
  const lines = report.split(/\r?\n/)
  const start = lines.indexOf('```ts')
  if (start === -1) return []
  const end = lines.indexOf('```', start + 1)
  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('//') && !l.startsWith('import '))
}

export type ApiDiff = { removed: string[]; added: string[]; breaking: boolean }

/**
 * Compares two reports line by line, counting repeats. A removed or changed
 * line (a removed export, a renamed or retyped prop) counts as breaking; a
 * line that is only added does not.
 */
export function diffApi(before: string, after: string): ApiDiff {
  const count = (lines: string[]) => {
    const m = new Map<string, number>()
    for (const l of lines) m.set(l, (m.get(l) ?? 0) + 1)
    return m
  }
  const a = count(apiLines(before))
  const b = count(apiLines(after))
  const removed: string[] = []
  const added: string[] = []
  for (const [line, n] of a) for (let i = b.get(line) ?? 0; i < n; i++) removed.push(line)
  for (const [line, n] of b) for (let i = a.get(line) ?? 0; i < n; i++) added.push(line)
  return { removed, added, breaking: removed.length > 0 }
}
