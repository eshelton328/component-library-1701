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
  {
    selector: "Property[value.type='Literal'][value.value=/^[a-zA-Z][\\w.-]*\\/\\d+(\\.\\d+)?$/]",
    message:
      'Opacity modifiers ("token/37") make new colours outside the token set. Use the semantic token for that role, such as a subtle or strong variant.',
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
