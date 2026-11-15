// Tests for scripts/cycles-lib.ts. Run with `pnpm test:cycles`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ts from 'typescript'
import { findCycles, importGraph, runtimeImports, sourceFiles } from './cycles-lib.ts'

void test('reads static imports, re-exports and dynamic imports', () => {
  const text = "import { a } from './a'\nexport { b } from './b'\nexport * from './c'\nconst d = () => import('./d')\nimport './e'"
  assert.deepEqual(runtimeImports('x.ts', text), ['./a', './b', './c', './d', './e'])
})

void test('leaves out type-only imports and re-exports', () => {
  const text = "import type { A } from './a'\nexport type { B } from './b'\nimport { type C, d } from './c'"
  assert.deepEqual(runtimeImports('x.ts', text), ['./c'])
})

void test('finds no cycle in a tree', () => {
  assert.deepEqual(findCycles(new Map([['a', ['b', 'c']], ['b', ['c']], ['c', []]])), [])
})

void test('finds a two-file and a three-file cycle', () => {
  const graph = new Map([['a', ['b']], ['b', ['a']], ['c', ['d']], ['d', ['e']], ['e', ['c']], ['f', ['a']]])
  assert.deepEqual(findCycles(graph), [['a', 'b'], ['c', 'd', 'e']])
})

void test('finds a file that imports itself', () => {
  assert.deepEqual(findCycles(new Map([['a', ['a']]])), [['a']])
})

void test('builds the graph from files on disk and finds their cycle', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cycles-'))
  try {
    mkdirSync(join(dir, 'shell'))
    writeFileSync(join(dir, 'shell', 'app-frame.tsx'), "import { NavRail } from './nav-rail'\nexport const AppFrame = NavRail\n")
    writeFileSync(join(dir, 'shell', 'nav-rail.tsx'), "import { AppFrame } from './app-frame'\nexport const NavRail = () => AppFrame\n")
    writeFileSync(join(dir, 'shell', 'header.tsx'), "import type { AppFrame } from './app-frame'\nimport { NavRail } from './nav-rail'\nexport type H = typeof AppFrame\nexport const Header = NavRail\n")
    const options = { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX }
    const cycles = findCycles(importGraph(sourceFiles(dir), options))
    assert.deepEqual(cycles, [[join(dir, 'shell', 'app-frame.tsx'), join(dir, 'shell', 'nav-rail.tsx')]])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
