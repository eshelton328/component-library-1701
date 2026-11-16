// Every component style is a config recipe here (d-067), after Park UI's
// preset. panda.config.ts adds these to the theme, and Panda generates a
// typed recipe function and variant props for each one in
// styled-system/recipes. Add a recipe as its own file and list it below.
import type { Config } from '@pandacss/dev'
import { bottomSheet } from './bottom-sheet'
import { backRow } from './back-row'
import { button } from './button'
import { card } from './card'
import { checkbox } from './checkbox'
import { composer } from './composer'
import { contextMeter } from './context-meter'
import { dialog } from './dialog'
import { filterChips } from './filter-chips'
import { icon } from './icon'
import { kindTile } from './kind-tile'
import { itemTabs } from './item-tabs'
import { kpiTile } from './kpi-tile'
import { mapGraph, mapLegend, mapNode, mapSelectionCard } from './map-graph'
import { chatPath, flowDiagram } from './flow-diagram'
import { listRow } from './list-row'
import { kindMark } from './kind-mark'
import { menu } from './menu'
import { message } from './message'
import { moreDrawer } from './more-drawer'
import { panel } from './panel'
import { kindBadge } from './kind-badge'
import { metaChip } from './meta-chip'
import { metaLine } from './meta-line'
import { pathBadge } from './path-badge'
import { tagsLine } from './tags-line'
import { pageHeader } from './page-header'
import { groupHeader } from './group-header'
import { modelChip } from './model-chip'
import { popover } from './popover'
import { proposalBlock } from './proposal-block'
import { proposalSection } from './proposal-section'
import { layoutGrid, layoutInline, layoutStack } from './layout'
import { searchField } from './search-field'
import { textField } from './text-field'
import { toolLine } from './tool-line'
import { treeView } from './tree-view'
import { statusPill } from './status-pill'
import { viewSwitch } from './view-switch'
import { navBadge } from './nav-badge'
import { navRail } from './nav-rail'

type Theme = NonNullable<Config['theme']>

export const recipes: NonNullable<Theme['recipes']> = { button, icon, kindMark, kindTile, layoutGrid, layoutInline, layoutStack, navBadge, statusPill }

export const slotRecipes: NonNullable<Theme['slotRecipes']> = { backRow, bottomSheet, card, chatPath, checkbox, composer, contextMeter, dialog, filterChips, flowDiagram, groupHeader, itemTabs, kindBadge, kpiTile, listRow, mapGraph, mapLegend, mapNode, mapSelectionCard, menu, message, metaChip, metaLine, modelChip, moreDrawer, navRail, pageHeader, panel, pathBadge, popover, proposalBlock, proposalSection, searchField, tagsLine, textField, toolLine, treeView, viewSwitch }
