// The path exceptions in .gitleaks.toml also match b/<path>, as gitleaks
// names the file of a merge conflict hunk that way. A real file under a
// top-level b/ folder would get the same exceptions, so the job secrets runs
// this on each PR: `node scripts/secret-merge-prefix.ts <base> <head>` lists
// the files under b/ that any commit of the PR adds, changes or deletes,
// merges included, and exits 1 if there are any. gitleaks scans each
// commit, so a b/ file that a later commit deletes still counts.
import { spawnSync } from 'node:child_process'

export function mergePrefixPaths(paths: string[]): string[] {
  return paths.filter((path) => path.startsWith('b/'))
}

if (import.meta.main) {
  const [base, head] = process.argv.slice(2)
  if (base === undefined || head === undefined) {
    console.error('usage: node scripts/secret-merge-prefix.ts <base> <head>')
    process.exit(2)
  }
  const diff = spawnSync('git', ['log', '--name-only', '--no-renames', '--format=', '--diff-merges=separate', `${base}..${head}`], { encoding: 'utf8' })
  if (diff.status !== 0) {
    console.error(diff.stderr)
    process.exit(2)
  }
  const found = [...new Set(mergePrefixPaths(diff.stdout.split('\n').filter((line) => line !== '')))]
  console.log(JSON.stringify({ ok: found.length === 0, found }))
  if (found.length > 0) process.exit(1)
}
