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
    // srcDir is absolute (eslint.shared.js resolves it), so the result
    // does not depend on the directory ESLint runs in.
    const src = resolve(srcDir)
    const who = folder === 'theme' ? 'src/theme' : `The ${folder} tier`
    const check = (node, spec, dynamic) => {
      if (spec === undefined) {
        if (dynamic) context.report({ node, messageId: 'dynamic' })
        return
      }
      // A dynamic import gives no names to check, so every restricted
      // module is banned there, by package name or relative path.
      if (dynamic) {
        for (const p of packages) {
          if (new RegExp(p.regex).test(spec)) context.report({ node, messageId: 'package', data: { message: `${p.message} A dynamic import cannot be checked by name; use a static import.` } })
        }
      }
      if (!spec.startsWith('.') && !isAbsolute(spec)) return
      const rel = relative(src, resolve(dirname(context.filename), spec))
      if (rel.startsWith('..') || isAbsolute(rel)) return
      const parts = rel.split(sep)
      // `../controls` is the controls folder (its index), not the src barrel.
      if (parts.length === 1 && !(rel in tierSet) && rel !== 'theme') {
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
      quoted: 'Write the key as title, not quoted: Storybook ignores a quoted title key and names the story after its tier folder. Groups: {{groups}} (d-065).',
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
        const props = meta.properties.filter((p) => p.type === 'Property' && !p.computed)
        const prop = props.find((p) => p.key.type === 'Identifier' && p.key.name === 'title')
        // Storybook's indexer reads only a plain `title` key; it ignores a
        // quoted one and names the story after its folder.
        const quoted = props.find((p) => staticString(p.key) === 'title')
        if (!prop && quoted) {
          context.report({ node: quoted.key, messageId: 'quoted', data })
          return
        }
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

/** The init of the variable that an identifier refers to, if it is a const. */
function constInit(context, node) {
  let scope = context.sourceCode.getScope(node)
  while (scope) {
    const v = scope.set.get(node.name)
    if (v) {
      const def = v.defs[0]
      return def?.type === 'Variable' && def.parent.kind === 'const' ? unwrap(def.node.init) : undefined
    }
    scope = scope.upper
  }
  return undefined
}

/**
 * structure/no-inline-recipe: a call of Panda's `styled` from
 * styled-system/jsx, by any local name or through a namespace import,
 * whose recipe argument is an object literal, directly or through a
 * local const. Component styles belong in a config recipe (d-067).
 */
const noInlineRecipe = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      inline: 'Component styles live in a config recipe in src/theme/recipes (d-067). Pass the generated recipe: styled(element, recipe).',
    },
  },
  create(context) {
    const direct = new Set()
    const namespaces = new Set()
    return {
      ImportDeclaration(node) {
        const from = staticString(node.source) ?? ''
        if (!/styled-system\/jsx(\/|$)/.test(from)) return
        for (const s of node.specifiers) {
          if (s.type === 'ImportSpecifier' && (s.imported.name ?? s.imported.value) === 'styled') direct.add(s.local.name)
          if (s.type === 'ImportNamespaceSpecifier') namespaces.add(s.local.name)
        }
      },
      CallExpression(node) {
        const c = node.callee
        const isStyled =
          (c.type === 'Identifier' && direct.has(c.name)) ||
          (c.type === 'MemberExpression' && !c.computed && c.object.type === 'Identifier' && namespaces.has(c.object.name) && c.property.name === 'styled')
        if (!isStyled) return
        let arg = unwrap(node.arguments[1])
        if (arg?.type === 'Identifier') arg = constInit(context, arg)
        if (arg?.type === 'ObjectExpression') context.report({ node: node.arguments[1], messageId: 'inline' })
      },
    }
  },
}

export const structurePlugin = {
  meta: { name: 'structure' },
  rules: { 'tier-imports': tierImports, 'story-title': storyTitle, 'no-inline-recipe': noInlineRecipe },
}
