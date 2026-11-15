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
import { resolve } from 'node:path'
import { structurePlugin } from './eslint.structure.js'
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
// structure/tier-imports (eslint.structure.js) resolves relative imports,
// so the tier check does not depend on how a path is spelled.
const tierNames = Object.keys(tiers)
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const anyOf = (names) => `(${names.map(escape).join('|')})`

const stateMessage =
  'The library holds no application state, data or routing (d-068). Take the data as a prop and report changes through a callback such as onChange or onSubmit.'
// The package and its subpaths (`zustand`, `zustand/vanilla`), not
// `zustand-x` or `my-zustand`.
const statePattern = { regex: `^${anyOf(stateLibraries)}(/|$)`, message: stateMessage }

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

// Panda names a pattern function after its component: Box -> box,
// HStack -> hstack, AspectRatio -> aspectRatio.
const patternFunction = (name) => (/^[HV]Stack$/.test(name) ? name.toLowerCase() : name[0].toLowerCase() + name.slice(1))
const componentTiers = ['controls', 'parts', 'shell']
const layoutMessage =
  'Place components with the library layout components from src/controls (Container, Stack, Inline, Grid), never Panda patterns from styled-system (d-066).'
const freeFormMessage = 'The library has no Box, Spacer or other free-form pattern (d-066). Use Container, Stack, Inline or Grid.'

// Package rules for one folder. `story` leaves out the component-only
// style bans, because a story may style its own frame (src/AGENTS.md).
function folderPatterns(folder, { story = false } = {}) {
  const patterns = [statePattern]
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
  if (componentTiers.includes(folder) && !story) {
    patterns.push(
      {
        // The barrel and its files: styled-system/css, /css/index, /css/cva.
        regex: 'styled-system/css(/|$)',
        importNames: ['css', 'cva', 'sva'],
        message:
          'Component styles live in a config recipe in src/theme/recipes (d-067). Use the generated recipe with createSlotRecipeContext, or styled(element, recipe).',
      },
      {
        regex: '^@pandacss/dev(/|$)',
        message: 'Recipes are defined only in src/theme/recipes (d-067). Use the generated recipe from styled-system/recipes.',
      },
    )
  }
  // Every folder, Foundations and theme too: Controls may use the layout
  // patterns to build Container, Stack, Inline and Grid; nothing else
  // uses a Panda pattern, and nothing uses Box or Spacer.
  const layout = folder === arkTier
  const banned = layout ? bannedPatterns : [...bannedPatterns, ...layoutPatterns]
  patterns.push(
    { regex: 'styled-system/jsx(/|$)', importNames: banned, message: layout ? freeFormMessage : layoutMessage },
    layout
      ? { regex: 'styled-system/patterns(/|$)', importNames: bannedPatterns.map(patternFunction), message: freeFormMessage }
      : { regex: 'styled-system/patterns(/|$)', message: layoutMessage },
  )
  return patterns
}

// Dynamic imports skip no-restricted-imports, so tier-imports checks every
// package rule against them, including those limited to some names.
const dynamicPatterns = (folder) => folderPatterns(folder).map(({ regex, message }) => ({ regex, message }))

const repoRoot = import.meta.dirname

function structureConfig(relativeSrcDir) {
  // Absolute, so the tier rule does not depend on ESLint's working directory.
  const srcDir = resolve(repoRoot, relativeSrcDir)
  const tierRule = (folder) => [
    'error',
    {
      srcDir,
      folder,
      tiers: tierNames,
      allowed: folder in tiers ? tiers[folder].mayImport : [],
      packages: dynamicPatterns(folder),
    },
  ]
  return [
    { plugins: { structure: structurePlugin } },
    ...[...tierNames, 'theme'].flatMap((folder) => [
      {
        files: [`${relativeSrcDir}/${folder}/**/*.{ts,tsx}`],
        rules: {
          ...stateRules,
          'structure/tier-imports': tierRule(folder),
          'no-restricted-imports': ['error', { patterns: folderPatterns(folder) }],
          ...(componentTiers.includes(folder) ? { 'structure/no-inline-recipe': 'error' } : {}),
        },
      },
      {
        files: [`${relativeSrcDir}/${folder}/**/*.stories.{ts,tsx}`],
        rules: {
          'no-restricted-imports': ['error', { patterns: folderPatterns(folder, { story: true }) }],
          'structure/no-inline-recipe': 'off',
        },
      },
    ]),
    {
      files: [`${relativeSrcDir}/**/*.stories.{ts,tsx}`],
      rules: {
        'no-restricted-syntax': ['error', ...restricted],
        'structure/story-title': ['error', { groups }],
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
