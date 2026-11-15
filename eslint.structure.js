// Local ESLint rules for the library structure (src/structure.ts) that
// no-restricted-imports and selectors cannot express. eslint.shared.js
// loads them as the `structure` plugin. Each message names the fix.
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

/** The string of a literal or expression-free template, else undefined. */
function staticString(node) {
  if (!node) return undefined
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0]?.value.cooked ?? undefined
  return undefined
}

/**
 * structure/tier-imports: resolves each relative import, re-export and
 * dynamic import to the folder of src/ it lands in, so the spelling of the
 * path does not matter (`./x`, `../shell/x` and `../../src/shell/x` are
 * the same file). Options: { srcDir, folder, allowed, packages }.
 * `packages` holds { regex, message } entries that also apply to dynamic
 * imports, which no-restricted-imports does not check.
 */
const tierImports = {
  meta: {
    type: 'problem',
    schema: [{ type: 'object', additionalProperties: true }],
    messages: {
      tier: '{{who}} may not import {{target}}. Allowed: {{allowed}}. Move the shared code down a tier, or pass it in as children or a prop (src/structure.ts).',
      theme: 'Components never import src/theme. Use the generated recipe from styled-system/recipes.',
      barrel: 'Do not import from {{target}}: it re-exports every tier, so it hides which tier the code comes from. Import the file in its tier folder.',
      dynamic: 'A dynamic import with a computed path cannot be checked against the tiers. Use a static import.',
      package: '{{message}}',
    },
  },
  create(context) {
    const { srcDir, folder, allowed = [], packages = [] } = context.options[0] ?? {}
    const src = resolve(context.cwd, srcDir)
    const who = folder === 'theme' ? 'src/theme' : `The ${folder} tier`
    const check = (node, spec, dynamic) => {
      if (spec === undefined) {
        if (dynamic) context.report({ node, messageId: 'dynamic' })
        return
      }
      if (!spec.startsWith('.') && !isAbsolute(spec)) {
        if (!dynamic) return
        for (const p of packages) {
          if (new RegExp(p.regex).test(spec)) context.report({ node, messageId: 'package', data: { message: p.message } })
        }
        return
      }
      const rel = relative(src, resolve(dirname(context.filename), spec))
      if (rel.startsWith('..') || isAbsolute(rel)) return
      const parts = rel.split(sep)
      if (parts.length === 1) {
        context.report({ node, messageId: 'barrel', data: { target: `src/${rel || 'index'}` } })
        return
      }
      const [top] = parts
      if (top === 'theme') {
        if (folder !== 'theme') context.report({ node, messageId: 'theme' })
        return
      }
      if (top !== undefined && top in tierSet && !allowed.includes(top)) {
        context.report({ node, messageId: 'tier', data: { who, target: top, allowed: allowed.join(', ') || 'nothing in src' } })
      }
    }
    const tierSet = Object.fromEntries((context.options[0]?.tiers ?? []).map((t) => [t, true]))
    return {
      ImportDeclaration: (node) => check(node, staticString(node.source), false),
      ExportNamedDeclaration: (node) => node.source && check(node, staticString(node.source), false),
      ExportAllDeclaration: (node) => check(node, staticString(node.source), false),
      ImportExpression: (node) => check(node, staticString(node.source), true),
    }
  },
}

/** Strips `satisfies`, `as`, `<T>x`, `x!` and parentheses. */
function unwrap(node) {
  let n = node
  while (n && ['TSSatisfiesExpression', 'TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression', 'ParenthesizedExpression'].includes(n.type)) n = n.expression
  return n
}

/**
 * structure/story-title: finds the default export of a story file, follows
 * it to a top-level `const` when it is a name, and checks the `title` of
 * that object only, not titles in args or parameters. The title must be a
 * plain string that starts with a purpose group. Options: { groups }.
 */
const storyTitle = {
  meta: {
    type: 'problem',
    schema: [{ type: 'object', additionalProperties: true }],
    messages: {
      bad: 'A story title starts with its purpose group: {{groups}} (d-065), for example "Actions/Button". Never use a tier name.',
      missing: 'Give the story meta a title that starts with its purpose group: {{groups}} (d-065). Without one, Storybook names the story after its folder, which is a tier.',
      computed: 'Write the story title as a plain string, so the lint can check its purpose group: {{groups}} (d-065).',
    },
  },
  create(context) {
    const groups = context.options[0]?.groups ?? []
    const data = { groups: groups.join(', ') }
    const ok = (title) => groups.some((g) => title.startsWith(`${g}/`))
    return {
      'Program:exit'(program) {
        const exp = program.body.find((s) => s.type === 'ExportDefaultDeclaration')
        if (!exp) return
        let meta = unwrap(exp.declaration)
        if (meta?.type === 'Identifier') {
          const name = meta.name
          const decl = program.body
            .flatMap((s) => (s.type === 'VariableDeclaration' ? s.declarations : s.type === 'ExportNamedDeclaration' && s.declaration?.type === 'VariableDeclaration' ? s.declaration.declarations : []))
            .find((d) => d.id.type === 'Identifier' && d.id.name === name)
          meta = unwrap(decl?.init)
        }
        if (meta?.type !== 'ObjectExpression') {
          context.report({ node: exp, messageId: 'computed', data })
          return
        }
        const prop = meta.properties.find((p) => p.type === 'Property' && !p.computed && ((p.key.type === 'Identifier' && p.key.name === 'title') || staticString(p.key) === 'title'))
        if (!prop) {
          context.report({ node: meta, messageId: 'missing', data })
          return
        }
        const title = staticString(prop.value)
        if (title === undefined) context.report({ node: prop.value, messageId: 'computed', data })
        else if (!ok(title)) context.report({ node: prop.value, messageId: 'bad', data })
      },
    }
  },
}

export const structurePlugin = { meta: { name: 'structure' }, rules: { 'tier-imports': tierImports, 'story-title': storyTitle } }
