// expect: eslint @eslint-community/eslint-comments/no-use
// scope: scripts too
import { css } from '../styled-system/css'

// eslint-disable-next-line no-restricted-syntax
export const bad = css({ color: '[red]' })
