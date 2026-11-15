// expect: clean
import { css } from '../styled-system/css'

export const ok = css({ color: 'accent', display: 'flex' })

// A story title has a slash but is not an opacity modifier.
export const meta = { title: 'Foundations/Surfaces' }
