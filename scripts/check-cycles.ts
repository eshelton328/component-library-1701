#!/usr/bin/env node
// Fails when the files in src/ import each other in a cycle (brain
// decision d-071). A tier may import its own folder, so the tier lint
// allows `a -> b -> a` inside one tier; this check does not. A cycle makes
// the load order decide which module sees the other half-built. Type-only
// imports do not count, because TypeScript erases them.
//   node scripts/check-cycles.ts [dir]
import { join, relative } from 'node:path'
import ts from 'typescript'
import { findCycles, importGraph, sourceFiles } from './cycles-lib.ts'

const root = new URL('..', import.meta.url).pathname
const dir = process.argv[2] ?? join(root, 'src')
const config = ts.getParsedCommandLineOfConfigFile(join(root, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined })
const graph = importGraph(sourceFiles(dir), config?.options ?? {})
const cycles = findCycles(graph).map((c) => c.map((f) => relative(root, f)))
const edges = [...graph.values()].reduce((n, t) => n + t.length, 0)
console.log(JSON.stringify({ ok: cycles.length === 0, files: graph.size, edges, cycles }))
if (cycles.length) console.error('Break each cycle: move the shared code into a file that both import, or pass it in as a prop.')
process.exit(cycles.length ? 1 : 0)
