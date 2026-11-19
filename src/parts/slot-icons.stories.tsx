import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { css } from '../../styled-system/css'
import { button } from '../../styled-system/recipes'
import { Button } from '../controls/button'
import { ItemTabs } from '../controls/item-tabs'
import { Stack } from '../controls/layout'
import { Menu } from '../controls/menu'
import { SearchField } from '../controls/search-field'
import { ViewSwitch } from '../controls/view-switch'
import { CloseIcon, EditIcon, GridIcon, HomeIcon, SearchIcon, type IconSize } from '../foundations/icons'
import { GroupHeader } from './group-header'
import { MoreDrawer } from './more-drawer'
import { NavRail } from './nav-rail'
import { TabBar } from './tab-bar'

// Components that take an icon from the caller size it in their recipe, with
// `!`, because a slot's style loses to the icon recipe's own size (it is in an
// earlier cascade layer). The checks pass icons with no size (24 px by
// default) and with a size the slot does not use.
const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24' })

function Slots({ size }: { size?: IconSize | undefined }) {
  return (
    <main className={page}>
      <Stack gap="12">
        <span data-case="button">
          <Button>
            <EditIcon size={size} />
            Edit
          </Button>
        </span>
        <span data-case="item-tabs">
          <ItemTabs label="Sections" items={[{ value: 'files', label: 'Files', icon: <GridIcon size={size} />, content: 'Files' }]} />
        </span>
        <span data-case="view-switch">
          <ViewSwitch label="View" items={[{ value: 'grid', label: 'Grid', icon: <GridIcon size={size} /> }]} defaultValue="grid" />
        </span>
        <span data-case="search-field">
          <SearchField label="Search" icon={<SearchIcon size={size} />} defaultValue="token" clearIcon={<CloseIcon size={size} />} />
        </span>
        <span data-case="group-header">
          <GroupHeader label="Projects" leading={<GridIcon size={size} />} actions={<EditIcon size={size} />} />
        </span>
        <span data-case="group-header-button">
          <GroupHeader
            label="Workspaces"
            actions={
              <Button variant="text" size="xs" iconOnly aria-label="Workspaces actions">
                <EditIcon size={size} />
              </Button>
            }
          />
        </span>
        <span data-case="recipe-kept">
          <button type="button" className={button({ variant: 'text', size: 'xs', iconOnly: true, keepIconSize: true })} aria-label="Recipe kept">
            <EditIcon size="12" />
          </button>
        </span>
        <span data-case="group-header-kept">
          <GroupHeader
            label="Kept"
            actions={
              <Button variant="text" size="xs" iconOnly keepIconSize aria-label="Kept actions">
                <EditIcon size="12" />
              </Button>
            }
          />
        </span>
        <span data-case="nav-rail">
          <NavRail items={[{ value: 'home', label: 'Home', icon: <HomeIcon size={size} /> }]} />
        </span>
        <span data-case="tab-bar">
          <TabBar label="Tabs" items={[{ value: 'home', label: 'Home', icon: <HomeIcon size={size} /> }]} />
        </span>
        <Menu open trigger={<Button>Actions</Button>} items={[{ value: 'menu:edit', label: 'Edit', icon: <EditIcon size={size} /> }]} />
        <MoreDrawer open groups={[{ items: [{ value: 'grid', label: 'Grid', icon: <GridIcon size={size} /> }] }]} />
      </Stack>
    </main>
  )
}

const widths = (root: ParentNode, selector: string) => Array.from(root.querySelectorAll(`${selector} svg.icon`), (svg) => svg.getBoundingClientRect().width)

// The size each recipe gives the icons in its slots.
const expected = {
  button: [16],
  'item-tabs': [16],
  'view-switch': [12],
  'search-field': [16, 12],
  'group-header': [12, 12],
  // A Button in the header's actions (the Workbench sidebar's ⋯, rename and close, D2 105:743 and 105:746) keeps
  // its own 16 px icon: the button's important size is in an earlier cascade layer than the header's. With
  // `keepIconSize`, the icon keeps the 12 it was given.
  'group-header-button': [16],
  'group-header-kept': [12],
  // The exported `button()` recipe function opts in with the same variant, on any element.
  'recipe-kept': [12],
  'nav-rail': [24],
  'tab-bar': [24],
  menu: [16],
  'more-drawer': [20],
}

const meta = {
  title: 'Foundations/Icons in slots',
  component: Slots,
  play: async ({ canvasElement }) => {
    // The menu and the drawer render in a portal.
    await waitFor(() => expect(document.body.querySelector('[role=menu] svg.icon')).not.toBeNull())
    await waitFor(() => expect(document.body.querySelector('[role=dialog] svg.icon')).not.toBeNull())
    const found: Record<string, number[]> = {}
    for (const el of Array.from(canvasElement.querySelectorAll('[data-case]'))) {
      found[el.getAttribute('data-case') ?? ''] = widths(el, '')
    }
    found.menu = widths(document.body, '[role=menu]')
    found['more-drawer'] = widths(document.body, '[role=dialog]')
    await expect(found).toEqual(expected)
  },
} satisfies Meta<typeof Slots>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
/** Icons that carry a size of their own still draw at the slot's size. */
export const SizedIcons: StoryObj<typeof meta> = { globals: { mode: 'dark' }, args: { size: '20' } }
