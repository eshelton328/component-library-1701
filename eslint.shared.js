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
  {
    // A definite-assignment assertion (`value!: string`, `let value!: T`)
    // tells tsc a value is set when nothing checks that it is.
    selector: 'PropertyDefinition[definite=true], VariableDeclarator[definite=true]',
    message:
      'A definite-assignment assertion ("!:") claims a value is set without a check. Initialise it, or type it as "T | undefined" and check before use.',
  },
  {
    selector: "JSXAttribute[name.name='style']",
    message: 'Inline styles skip the token set. Use the component recipe variants.',
  },
]

export async function libraryConfig({ pandaConfig, tsconfigRootDir, files }) {
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
        // Agents silence checks they cannot pass. No disable comments at all.
        '@eslint-community/eslint-comments/no-use': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          { 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true },
        ],
        '@typescript-eslint/no-explicit-any': 'error',
        // Type safety (omni rule type-safety.md, TypeScript profile): no
        // unchecked narrowing, no object literal cast to a full type, and
        // every member of a closed union handled in a switch.
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
  )
}
