// Pure functions for check-cycles.ts, so cycles.test.ts can test them:
// read the runtime imports of a file, build the import graph of a folder,
// and find the cycles in it (brain decision d-071).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

/**
 * The module names a file imports at runtime: static imports, re-exports
 * and dynamic imports with a string. `import type` and `export type` are
 * left out, because TypeScript erases them, so they cannot make a cycle
 * when the code runs.
 */
export function runtimeImports(fileName: string, text: string): string[] {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true)
  const found: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && node.importClause?.phaseModifier !== ts.SyntaxKind.TypeKeyword && ts.isStringLiteral(node.moduleSpecifier)) {
      found.push(node.moduleSpecifier.text)
    } else if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      found.push(node.moduleSpecifier.text)
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [arg] = node.arguments
      if (arg && ts.isStringLiteralLike(arg)) found.push(arg.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

/** Every .ts and .tsx file under dir, except declaration files. */
export function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.d.ts'))
    .map((f) => join(dir, f))
    .sort()
}

/**
 * The import graph of the files: each file maps to the files in the same
 * set that it imports at runtime. Imports that resolve outside the set,
 * such as packages and generated code, are left out.
 */
export function importGraph(files: readonly string[], options: ts.CompilerOptions): Map<string, string[]> {
  const set = new Set(files)
  const graph = new Map<string, string[]>()
  for (const file of files) {
    const targets = runtimeImports(file, readFileSync(file, 'utf8'))
      .map((spec) => ts.resolveModuleName(spec, file, options, ts.sys).resolvedModule?.resolvedFileName)
      .filter((t): t is string => t !== undefined && set.has(t))
    graph.set(file, [...new Set(targets)])
  }
  return graph
}

/**
 * The cycles of a graph: each strongly connected component with more than
 * one file, or one file that imports itself (Tarjan's algorithm). Each
 * cycle lists its files sorted, and the cycles are sorted by first file.
 */
export function findCycles(graph: ReadonlyMap<string, readonly string[]>): string[][] {
  let next = 0
  const index = new Map<string, number>()
  const low = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const cycles: string[][] = []
  const connect = (v: string) => {
    index.set(v, next)
    low.set(v, next)
    next += 1
    stack.push(v)
    onStack.add(v)
    for (const w of graph.get(v) ?? []) {
      if (!index.has(w)) {
        connect(w)
        low.set(v, Math.min(low.get(v) ?? 0, low.get(w) ?? 0))
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v) ?? 0, index.get(w) ?? 0))
      }
    }
    if (low.get(v) !== index.get(v)) return
    const component: string[] = []
    let w: string | undefined
    do {
      w = stack.pop()
      if (w === undefined) break
      onStack.delete(w)
      component.push(w)
    } while (w !== v)
    if (component.length > 1 || (graph.get(v) ?? []).includes(v)) cycles.push(component.sort())
  }
  for (const v of graph.keys()) if (!index.has(v)) connect(v)
  return cycles.sort((a, b) => (a[0] ?? '').localeCompare(b[0] ?? ''))
}
