// expect: eslint @eslint-community/eslint-comments/no-use
import { css } from '../styled-system/css'

// eslint-disable-next-line no-restricted-syntax
export const bad = css({ color: '[red]' })
