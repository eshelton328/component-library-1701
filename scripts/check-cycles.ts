#!/usr/bin/env node
// Fails when the files in src/ import each other in a cycle (brain
// decision d-071). A tier may import its own folder, so the tier lint
// allows `a -> b -> a` inside one tier; this check does not. A cycle makes
// the load order decide which module sees the other half-built. Type-only
// imports do not count, because TypeScript erases them; `import.meta.glob`
// counts as an import of each file it matches. A dynamic import or a glob
// that the check cannot follow fails it too.
//   node scripts/check-cycles.ts [dir]
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { findCycles, importGraph, sourceFiles } from './cycles-lib.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = resolve(process.argv[2] ?? join(root, 'src'))
const config = ts.getParsedCommandLineOfConfigFile(join(root, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined })
const { graph, unsupported } = importGraph(sourceFiles(dir), config?.options ?? {}, root)
const cycles = findCycles(graph).map((c) => c.map((f) => relative(root, f)))
const edges = [...graph.values()].reduce((n, t) => n + t.length, 0)
const ok = cycles.length === 0 && unsupported.length === 0
console.log(JSON.stringify({ ok, files: graph.size, edges, cycles, unsupported: unsupported.map((u) => relative(root, u)) }))
if (cycles.length) console.error('Break each cycle: move the shared code into a file that both import, or pass it in as a prop.')
if (unsupported.length) console.error('The check cannot follow these imports: name the module in a string, or use a glob with only patterns and `eager`.')
process.exit(ok ? 0 : 1)
