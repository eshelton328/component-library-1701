// The lint rules for the library, shared by the main config and the check
// fixtures (checks/eslint.config.js). Each message names the fix, because
// agents fix a lint error in one round when it says what to use instead.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import storybook from 'eslint-plugin-storybook'
import panda from '@pandacss/eslint-plugin'
import globals from 'globals'
import {
  arkTier,
  bannedPatterns,
  groups,
  layoutPatterns,
  stateGlobals,
  stateLibraries,
  tiers,
} from './src/structure.ts'

// Type syntax that no typescript-eslint rule covers. A definite-assignment
// assertion (`value!: string`, `let value!: T`) tells tsc a value is set
// when nothing checks that it is.
const typeSyntax = [
  {
    selector: 'PropertyDefinition[definite=true], VariableDeclarator[definite=true]',
    message:
      'A definite-assignment assertion ("!:") claims a value is set without a check. Initialise it, or type it as "T | undefined" and check before use.',
  },
]

const restricted = [
  {
    selector: "Property[value.type='Literal'][value.value=/^\\[.*\\]$/]",
    message:
      'Arbitrary values ("[...]") skip the token set. Use a semantic token; if none fits, stop and name the missing token.',
  },
  ...[
    // Opacity modifiers, numeric ("accent/37") or named ("fg.default/disabled"),
    // inside any style call. Strings outside style calls, such as a story
    // title "Foundations/Surfaces", are not styles.
    "CallExpression[callee.name=/^(css|cva|sva|defineRecipe|defineSlotRecipe|defineStyles|styled)$/]",
    "CallExpression[callee.object.name='styled']",
  ].map((call) => ({
    selector: `${call} Property[value.type='Literal'][value.value=/^[a-zA-Z][\\w.-]*\\/[\\w.]+$/]`,
    message:
      'Opacity modifiers ("token/37", "token/disabled") make new colours outside the token set. Use the semantic token for that role, such as a subtle or faint variant.',
  })),
  ...typeSyntax,
  {
    selector: "JSXAttribute[name.name='style']",
    message: 'Inline styles skip the token set. Use the component recipe variants.',
  },
]

// Type safety (omni rule type-safety.md, TypeScript profile), for the
// library and the scripts alike: no disable comments, no `any`, no
// unchecked narrowing, no object literal cast to a full type, and every
// member of a closed union handled in a switch.
const typeRules = {
  '@eslint-community/eslint-comments/no-use': 'error',
  '@typescript-eslint/ban-ts-comment': [
    'error',
    { 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true },
  ],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unsafe-type-assertion': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/consistent-type-assertions': [
    'error',
    { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
  ],
  '@typescript-eslint/switch-exhaustiveness-check': [
    'error',
    { considerDefaultExhaustiveForUnions: false },
  ],
}

// The Node scripts (token build, checks, hooks): the type rules without
// the Panda and React rules.
export function scriptConfig({ tsconfigRootDir, files }) {
  return tseslint.config({
    files,
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked, comments.recommended],
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: true, tsconfigRootDir },
    },
    rules: { ...typeRules, 'no-restricted-syntax': ['error', ...typeSyntax] },
  })
}

// The library's structure (src/structure.ts): tier imports, no styles in
// component files, no Box or Spacer, no application state, and story
// titles that start with a purpose group. One no-restricted-imports entry
// per folder, because a later config block replaces a rule's options.
const tierNames = Object.keys(tiers)
const folderImport = (folder) => `(^|/)${folder}(/|$)`

const stateImports = stateLibraries.map((name) => ({
  name,
  message:
    'The library holds no application state, data or routing (d-068). Take the data as a prop and report changes through a callback such as onChange or onSubmit.',
}))

const stateRules = {
  'no-restricted-globals': [
    'error',
    ...stateGlobals.map((name) => ({
      name,
      message: `"${name}" reaches data, storage or the URL, which the library never manages (d-068). Take the value as a prop and report changes through a callback.`,
    })),
  ],
  'no-restricted-properties': [
    'error',
    ...['window', 'globalThis', 'self'].flatMap((object) =>
      stateGlobals.map((property) => ({
        object,
        property,
        message: `"${object}.${property}" reaches data, storage or the URL, which the library never manages (d-068). Take the value as a prop and report changes through a callback.`,
      })),
    ),
    {
      object: 'document',
      property: 'cookie',
      message: 'Cookies are application state, which the library never manages (d-068). Take the value as a prop.',
    },
  ],
}

function folderPatterns(folder) {
  const patterns = []
  const allowed = folder in tiers ? tiers[folder].mayImport : []
  for (const other of tierNames.filter((t) => !allowed.includes(t))) {
    patterns.push({
      regex: folderImport(other),
      message: `${folder === 'theme' ? 'src/theme' : `The ${folder} tier`} may not import ${other}. Allowed: ${allowed.join(', ') || 'nothing in src'}. Move the shared code down a tier, or pass it in as children or a prop (src/structure.ts).`,
    })
  }
  if (folder !== 'theme') {
    patterns.push({
      regex: folderImport('theme'),
      message: 'Components never import src/theme. Use the generated recipe from styled-system/recipes.',
    })
  }
  if (folder === 'theme') {
    patterns.push({
      regex: '^@ark-ui/react(?!/anatomy$)',
      message: 'src/theme may import only "@ark-ui/react/anatomy", for the slot names of a recipe.',
    })
  } else if (folder !== arkTier) {
    patterns.push({
      regex: '^@ark-ui/react',
      message: `Only the ${arkTier} tier imports @ark-ui/react. Use the control that wraps the Ark part.`,
    })
  }
  if (['controls', 'parts', 'shell'].includes(folder)) {
    patterns.push({
      regex: 'styled-system/css$',
      importNames: ['css', 'cva', 'sva'],
      message:
        'Component styles live in a config recipe in src/theme/recipes (d-067). Use the generated recipe with createSlotRecipeContext, or styled(element, recipe).',
    })
  }
  if (folder !== 'foundations') {
    const banned = folder === arkTier ? bannedPatterns : [...bannedPatterns, ...layoutPatterns]
    patterns.push({
      regex: 'styled-system/jsx$',
      importNames: banned,
      message:
        folder === arkTier
          ? 'The library has no Box, Spacer or other free-form pattern (d-066). Use Container, Stack, Inline or Grid.'
          : 'Place components with the library layout components from src/controls (Container, Stack, Inline, Grid), never Panda patterns from styled-system (d-066).',
    })
    if (folder !== arkTier) {
      patterns.push({
        regex: 'styled-system/patterns(/|$)',
        message: 'Place components with the library layout components from src/controls (Container, Stack, Inline, Grid), never Panda patterns from styled-system (d-066).',
      })
    }
  }
  return patterns
}

function structureConfig(srcDir) {
  const titles = groups.join('|')
  const badTitle = `[value.type='Literal']:not([value.value=/^(${titles})\\//])`
  return [
    ...[...tierNames, 'theme'].map((folder) => ({
      files: [`${srcDir}/${folder}/**/*.{ts,tsx}`],
      rules: {
        ...stateRules,
        'no-restricted-imports': ['error', { paths: stateImports, patterns: folderPatterns(folder) }],
      },
    })),
    {
      files: [`${srcDir}/**/*.stories.tsx`],
      rules: {
        'no-restricted-syntax': [
          'error',
          ...restricted,
          ...[
            `VariableDeclarator[id.name='meta'] ObjectExpression > Property[key.name='title']${badTitle}`,
            `ExportDefaultDeclaration > ObjectExpression > Property[key.name='title']${badTitle}`,
          ].map((selector) => ({
            selector,
            message: `A story title starts with its purpose group: ${groups.join(', ')} (d-065), for example "Actions/Button". Never use a tier name.`,
          })),
        ],
      },
    },
  ]
}

export async function libraryConfig({ pandaConfig, tsconfigRootDir, files, srcDir = 'src' }) {
  return tseslint.config(
    {
      files,
      extends: [
        js.configs.recommended,
        ...tseslint.configs.strictTypeChecked,
        reactHooks.configs.flat.recommended,
        comments.recommended,
      ],
      languageOptions: {
        globals: globals.browser,
        parserOptions: { projectService: true, tsconfigRootDir },
      },
    },
    // Storybook's configs set their own file scopes (stories, .storybook/main).
    ...storybook.configs['flat/recommended'],
    await panda.configs.recommended({ configPath: pandaConfig, files }),
    {
      files,
      rules: {
        // Agents silence checks they cannot pass, so typeRules bans disable comments.
        ...typeRules,
        'no-restricted-syntax': ['error', ...restricted],
        '@pandacss/prefer-token': 'error',
        '@pandacss/no-primitive-token': 'error',
        '@pandacss/no-dynamic-styling': 'error',
        '@pandacss/no-deprecated': 'error',
        '@pandacss/no-important': 'error',
        '@pandacss/no-debug': 'error',
        '@pandacss/extraction-diagnostics': 'error',
      },
    },
    ...structureConfig(srcDir),
  )
}
