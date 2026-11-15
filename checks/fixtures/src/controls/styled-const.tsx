// expect: eslint structure/no-inline-recipe
import { styled } from '../../../styled-system/jsx'

const recipe = { base: { color: 'fg.default' } }
export const Button = styled('button', recipe)
