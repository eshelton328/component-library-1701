// expect: eslint structure/no-inline-recipe
import { styled as makeStyled } from '../../../styled-system/jsx'

export const Button = makeStyled('button', { base: { color: 'fg.default' } })
