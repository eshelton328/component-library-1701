// expect: eslint @pandacss/no-primitive-token
import { css } from '../styled-system/css'

export const bad = css({ color: 'cyan.500' })
