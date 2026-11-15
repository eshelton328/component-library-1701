// expect: eslint no-restricted-syntax
import { css } from '../styled-system/css'

export const bad = css({ color: '[red]' })
