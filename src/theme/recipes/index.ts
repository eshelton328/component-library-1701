// Every component style is a config recipe here (d-067), after Park UI's
// preset. panda.config.ts adds these to the theme, and Panda generates a
// typed recipe function and variant props for each one in
// styled-system/recipes. Add a recipe as its own file and list it below.
import type { Config } from '@pandacss/dev'
import { bottomSheet } from './bottom-sheet'
import { button } from './button'
import { checkbox } from './checkbox'
import { contextMeter } from './context-meter'
import { dialog } from './dialog'
import { filterChips } from './filter-chips'
import { icon } from './icon'
import { itemTabs } from './item-tabs'
import { listRow } from './list-row'
import { menu } from './menu'
import { moreDrawer } from './more-drawer'
import { panel } from './panel'
import { kindBadge } from './kind-badge'
import { metaChip } from './meta-chip'
import { metaLine } from './meta-line'
import { pathBadge } from './path-badge'
import { tagsLine } from './tags-line'
import { pageHeader } from './page-header'
import { groupHeader } from './group-header'
import { popover } from './popover'
import { layoutGrid, layoutInline, layoutStack } from './layout'
import { searchField } from './search-field'
import { textField } from './text-field'
import { statusPill } from './status-pill'
import { viewSwitch } from './view-switch'

type Theme = NonNullable<Config['theme']>

export const recipes: NonNullable<Theme['recipes']> = { button, icon, layoutStack, layoutInline, layoutGrid, statusPill }

export const slotRecipes: NonNullable<Theme['slotRecipes']> = { bottomSheet, checkbox, contextMeter, dialog, filterChips, groupHeader, itemTabs, kindBadge, listRow, menu, metaChip, metaLine, moreDrawer, pageHeader, panel, pathBadge, popover, searchField, tagsLine, textField, viewSwitch }
