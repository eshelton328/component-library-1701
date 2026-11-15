// expect: eslint @typescript-eslint/ban-ts-comment
import { css } from '../styled-system/css'

// @ts-expect-error a raw value
export const bad = css({ color: 'red' })
