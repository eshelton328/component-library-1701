// Every component style is a config recipe here (d-067), after Park UI's
// preset. panda.config.ts adds these to the theme, and Panda generates a
// typed recipe function and variant props for each one in
// styled-system/recipes. Add a recipe as its own file and list it below.
import type { Config } from '@pandacss/dev'
import { button } from './button'
import { checkbox } from './checkbox'
import { filterChips } from './filter-chips'
import { itemTabs } from './item-tabs'
import { menu } from './menu'
import { layoutGrid, layoutInline, layoutStack } from './layout'
import { searchField } from './search-field'
import { textField } from './text-field'
import { viewSwitch } from './view-switch'

type Theme = NonNullable<Config['theme']>

export const recipes: NonNullable<Theme['recipes']> = { button, layoutStack, layoutInline, layoutGrid }

export const slotRecipes: NonNullable<Theme['slotRecipes']> = { checkbox, filterChips, itemTabs, menu, searchField, textField, viewSwitch }
