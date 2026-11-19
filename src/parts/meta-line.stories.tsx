import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Inline, Stack } from '../controls/layout'
import { Menu } from '../controls/menu'
import { CopyIcon, FolderIcon, HookIcon, SkillIcon, TagIcon } from '../foundations/icons'
import { KindBadge, MetaChip, MetaChipButton, MetaLine, PathBadge, TagsLine } from './meta-line'
import { expectCutText } from '../controls/tooltip.testing'

const page = css({ bg: 'bg.canvas', p: '24' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl', w: 'shell.listPane' })
// A bare icon button for the path badge's action slot, as the Toolkit page draws it.
const copy = css({ display: 'inline-flex', p: '0', bg: 'transparent', color: 'fg.muted', cursor: 'pointer', borderRadius: 'xs', _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' } })
const narrow = css({ w: 'shell.popoverSm' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  inset: css({ bg: 'surface.inset' }),
  raised: css({ bg: 'surface.raised' }),
  border: css({ bg: 'border.default' }),
  default: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
  subtle: css({ bg: 'fg.subtle' }),
  issue: css({ bg: 'accent.discuss' }),
  skill: css({ bg: 'kind.skill' }),
  agent: css({ bg: 'kind.agent' }),
  rule: css({ bg: 'kind.rule' }),
  workflow: css({ bg: 'kind.workflow' }),
  hook: css({ bg: 'kind.hook' }),
  'tint-skill': css({ bg: 'kindTint.skill' }),
  'tint-agent': css({ bg: 'kindTint.agent' }),
  'tint-rule': css({ bg: 'kindTint.rule' }),
  'tint-workflow': css({ bg: 'kindTint.workflow' }),
  'tint-hook': css({ bg: 'kindTint.hook' }),
}
const kinds = ['skill', 'agent', 'rule', 'workflow', 'hook'] as const

function Glyph() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M1.5 3.5h3l1 1h5v5h-9z" />
    </svg>
  )
}
function Mark() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="currentColor" />
    </svg>
  )
}

function Family({ onCopy = () => undefined }: { onCopy?: () => void }) {
  return (
    <main className={page}>
      <Stack gap="16">
        <div className={pane}>
          <Stack gap="12">
            <span data-testid="line-inbox">
              <MetaLine items={['omni-brain', 'drift check']} />
            </span>
            <span data-testid="line-card">
              <MetaLine icon="md" leading={<Mark />} items={['Claude', 'skill-evals']} trailing="12m" />
            </span>
            <span data-testid="line-row">
              <MetaLine leading={<Mark />} items={['skill-evals']} />
            </span>
          </Stack>
        </div>
        <Inline wrap gap="6">
          <span data-testid="chip-sm">
            <MetaChip size="sm" tone="muted" icon={<Glyph />} label="ncc-1701" />
          </span>
          <span data-testid="chip-issue">
            <MetaChip size="sm" tone="issue" icon={<Glyph />} label="NCC-28" />
          </span>
        </Inline>
        <Inline gap="6">
          <span data-testid="chip-md">
            <MetaChip icon={<Mark />} label="Claude artifact" />
          </span>
          <span data-testid="chip-age">
            <MetaChip tone="muted" icon={<Glyph />} label="updated 12m ago" />
          </span>
        </Inline>
        <Inline gap="10">
          <span data-testid="path">
            <PathBadge
              icon={<Glyph />}
              path="toolkit/skills/writer/"
              trailing={
                <button type="button" className={copy} aria-label="Copy path" onClick={onCopy}>
                  <Glyph />
                </button>
              }
            />
          </span>
          <span data-testid="path-md">
            <PathBadge iconSize="md" icon={<Glyph />} path="toolkit/skills/writer/SKILL.md" />
          </span>
        </Inline>
        <Inline wrap gap="10">
          {kinds.map((k) => (
            <span key={k} data-testid={`kind-${k}`}>
              <KindBadge kind={k} icon={<Mark />} />
            </span>
          ))}
        </Inline>
        <TagsLine icon={<Glyph />} tags={['global/planning', 'project/ncc-1701/the-bridge']} />
        <TagsLine label="Small tags" size="sm" icon={<Glyph />} tags={['global/planning']} />
        <span data-testid="tags-empty">
          <TagsLine tags={[]} />
        </span>
        <div className={narrow} data-testid="narrow">
          <Stack gap="8">
            <MetaLine items={['a-very-long-project-name-that-does-not-fit', 'source']} trailing="4m" />
            <MetaChip label="a-very-long-project-name-that-does-not-fit-either" />
            <Inline gap="6" data-testid="chip-row">
              <MetaChip icon={<Glyph />} label="another-long-project-name-in-a-row" />
              <MetaChip icon={null} label="a-second-long-project-name-in-a-row" />
            </Inline>
            <span data-testid="line-gaps">
              <MetaLine items={['ncc-1701', false, '', null, 'Claude']} leading={false} trailing={null} />
            </span>
          </Stack>
        </div>
      </Stack>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Data display/Meta line and tags',
  component: Family,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    const first = (id: string) => {
      const el = canvas.getByTestId(id).firstElementChild
      if (!(el instanceof HTMLElement)) throw new Error(`nothing in ${id}`)
      return el
    }
    const box = (el: Element) => el.getBoundingClientRect()

    // Meta line: mono 12 in fg.muted, items 6 apart with a "·" between.
    const inbox = first('line-inbox')
    const inboxStyle = getComputedStyle(inbox)
    await expect([inboxStyle.fontSize, inboxStyle.color, inboxStyle.columnGap]).toEqual(['12px', swatch('muted'), '6px'])
    await expect(inboxStyle.fontFamily).toContain('Geist Mono')
    await expect(inbox.textContent).toBe('omni-brain·drift check')
    await expect(inbox.querySelectorAll('.meta-line__separator')).toHaveLength(1)
    // The card line (`icon="md"`): a 16 px mark (Figma 14, 402:15461), and the age at the right edge.
    const card = first('line-card')
    const mark = card.querySelector('.meta-line__leading svg')
    if (mark === null) throw new Error('no mark')
    await expect(box(mark).width).toBe(16)
    const age = card.querySelector('.meta-line__trailing')
    if (age === null) throw new Error('no age')
    await expect(box(age).right).toBe(box(card).right)
    const rowMark = first('line-row').querySelector('.meta-line__leading svg')
    if (rowMark === null) throw new Error('no row mark')
    await expect(box(rowMark).width).toBe(12)

    // Meta chip: radius 6, a 1 px border.default border, surface.inset fill.
    const sm = first('chip-sm')
    const smStyle = getComputedStyle(sm)
    await expect([smStyle.paddingTop, smStyle.paddingLeft, smStyle.borderTopLeftRadius, smStyle.borderTopWidth]).toEqual(['0px', '8px', '6px', '1px'])
    await expect([smStyle.backgroundColor, smStyle.borderTopColor, smStyle.color]).toEqual([swatch('inset'), swatch('border'), swatch('muted')])
    // The Inbox chip's label is Geist Mono 11 (346:331): monoSm, 11/16, so the chip stays 26 tall.
    await expect([smStyle.fontSize, Math.round(parseFloat(smStyle.lineHeight))]).toEqual(['11px', 16])
    // Figma's 24 (M5 346:9875): control.xs, with the 16 px label line centred.
    await expect(box(sm).height).toBe(24)
    const smText = sm.querySelector('.meta-chip__label')
    if (smText === null) throw new Error('no chip label')
    await expect(Math.round(box(smText).top - box(sm).top)).toBe(4)
    await expect(getComputedStyle(first('chip-md')).fontSize).toBe('12px')
    const smIcon = sm.querySelector('svg')
    const smLabel = sm.querySelector('.meta-chip__label')
    if (smIcon === null || smLabel === null) throw new Error('no chip icon or label')
    await expect(box(smIcon).width).toBe(12)
    await expect(box(smLabel).left - box(smIcon).right).toBe(6)
    await expect(getComputedStyle(first('chip-issue')).color).toBe(swatch('issue'))
    const md = getComputedStyle(first('chip-md'))
    await expect([md.paddingTop, md.paddingLeft, md.color, md.backgroundColor]).toEqual(['6px', '10px', swatch('default'), swatch('inset')])
    await expect(getComputedStyle(first('chip-age')).color).toBe(swatch('muted'))

    // Path badge: surface.raised, padding 8/4, the path in mono fg.default, and its action.
    const badge = first('path')
    const badgeStyle = getComputedStyle(badge)
    await expect([badgeStyle.backgroundColor, badgeStyle.borderTopColor, badgeStyle.borderTopLeftRadius]).toEqual([swatch('raised'), swatch('border'), '6px'])
    await expect([badgeStyle.paddingTop, badgeStyle.paddingLeft]).toEqual(['4px', '8px'])
    const pathText = canvas.getByText('toolkit/skills/writer/')
    const pathStyle = getComputedStyle(pathText)
    await expect([pathStyle.fontSize, pathStyle.color]).toEqual(['12px', swatch('default')])
    await expect(pathStyle.fontFamily).toContain('Geist Mono')
    await expect(canvas.getByRole('button', { name: 'Copy path' })).toBeVisible()
    // The icon is 12 px by default and 16 px with `iconSize="md"` (M06 435:494); the badge stays the same height.
    const iconOf = (el: Element) => {
      const svg = el.querySelector('.path-badge__icon svg')
      if (svg === null) throw new Error('no path icon')
      return box(svg)
    }
    const badgeMd = first('path-md')
    await expect([iconOf(badge).width, iconOf(badge).height]).toEqual([12, 12])
    await expect([iconOf(badgeMd).width, iconOf(badgeMd).height]).toEqual([16, 16])
    await expect(box(badgeMd).height).toBe(box(badge).height)

    // Kind badge: a pill in the kind colour on the kind's tint (d-074), labelled with the kind's name.
    for (const k of kinds) {
      const el = first(`kind-${k}`)
      const s = getComputedStyle(el)
      await expect(s.color).toBe(swatch(k))
      await expect(s.backgroundColor).toBe(swatch(`tint-${k}`))
      await expect([s.borderTopLeftRadius, s.paddingTop, s.paddingLeft, s.fontSize]).toEqual(['999px', '4px', '10px', '12px'])
    }
    await expect(first('kind-skill')).toHaveTextContent('Skill')
    const kindIcon = first('kind-hook').querySelector('svg')
    if (kindIcon === null) throw new Error('no kind icon')
    await expect(box(kindIcon).width).toBe(12)

    // Tags line: a named list, separators hidden from screen readers.
    const list = canvas.getByRole('list', { name: 'Tags' })
    const items = within(list).getAllByRole('listitem')
    await expect(items.map((i) => i.textContent)).toEqual(['global/planning', '·project/ncc-1701/the-bridge'])
    await expect(list.querySelector('.tags-line__separator')).toHaveAttribute('aria-hidden', 'true')
    // Figma draws the tags in #4a5675 (346:343): fg.subtle.
    await expect(getComputedStyle(list).color).toBe(swatch('subtle'))
    // The default is mono 12; `size="sm"` is Figma's Geist Mono 11 (346:348), monoSm 11/16.
    await expect(getComputedStyle(list).fontSize).toBe('12px')
    const small = getComputedStyle(canvas.getByRole('list', { name: 'Small tags' }))
    await expect([small.fontSize, Math.round(parseFloat(small.lineHeight))]).toEqual(['11px', 16])
    await expect(canvas.getByTestId('tags-empty')).toBeEmptyDOMElement()
  },
} satisfies Meta<typeof Family>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** Long text truncates inside its box, and the path badge's action reports through the caller's handler. */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  args: { onCopy: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const area = canvas.getByTestId('narrow')
    const width = area.getBoundingClientRect().right
    const lineEl = area.querySelector('.meta-line__root')
    const chipEl = area.querySelector('.meta-chip__root')
    if (!(lineEl instanceof HTMLElement) || !(chipEl instanceof HTMLElement)) throw new Error('no narrow line or chip')
    // The line and the chip stay inside the 240 px box, and the long text ends in an ellipsis.
    await expect(lineEl.getBoundingClientRect().right).toBeLessThanOrEqual(width)
    await expect(chipEl.getBoundingClientRect().right).toBeLessThanOrEqual(width)
    // The TruncatedText in the item and in the label cuts each.
    const item = lineEl.querySelector('.meta-line__item .truncated-text')
    const label = chipEl.querySelector('.meta-chip__label .truncated-text')
    if (!(item instanceof HTMLElement) || !(label instanceof HTMLElement)) throw new Error('no item or label')
    for (const el of [item, label]) {
      await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth)
      await expect(getComputedStyle(el).textOverflow).toBe('ellipsis')
    }
    // The age keeps its full width at the end of the line.
    const age = lineEl.querySelector('.meta-line__trailing')
    if (!(age instanceof HTMLElement)) throw new Error('no age')
    await expect(age.scrollWidth).toBe(age.clientWidth)
    await expect(age.getBoundingClientRect().right).toBe(lineEl.getBoundingClientRect().right)
    // Two long chips in one row shrink to share the box.
    const chipRow = canvas.getByTestId('chip-row')
    for (const c of Array.from(chipRow.children)) {
      await expect(c.getBoundingClientRect().right).toBeLessThanOrEqual(width)
    }
    // A chip with icon={null} has no empty icon box, so its label starts at the padding.
    const bare = chipRow.children[1]
    const bareLabel = bare?.querySelector('.meta-chip__label')
    if (!(bare instanceof HTMLElement) || !(bareLabel instanceof HTMLElement)) throw new Error('no bare chip')
    await expect(bare.querySelector('.meta-chip__icon')).toBeNull()
    await expect(bareLabel.getBoundingClientRect().left - bare.getBoundingClientRect().left).toBe(11)
    // Empty items, leading and trailing are left out with their separators.
    const gaps = canvas.getByTestId('line-gaps')
    await expect(gaps).toHaveTextContent(/^ncc-1701·Claude$/)
    await expect(gaps.querySelectorAll('.meta-line__item')).toHaveLength(2)
    await expect(gaps.querySelector('.meta-line__leading, .meta-line__trailing')).toBeNull()
    // The full chip text shows in a tooltip on hover (it was the chip's title attribute before TruncatedText).
    await userEvent.hover(label)
    await waitFor(() => expect(within(document.body).queryByRole('tooltip')).toHaveTextContent('a-very-long-project-name-that-does-not-fit-either'))
    await userEvent.unhover(label)
    await waitFor(() => expect(within(document.body).queryByRole('tooltip')).toBeNull())
    await userEvent.click(canvas.getByRole('button', { name: 'Copy path' }))
    await expect(args.onCopy).toHaveBeenCalledOnce()
  },
}

// A block box, not a flex one, so only the badges' own max width keeps them in.
const block = css({ display: 'block', w: 'shell.popoverSm' })

function LibraryIcons() {
  return (
    <main className={page}>
      <Stack gap="12">
        {/* The library's icons, passed with no size, so each draws at its default 24 px unless the slot sizes it. */}
        <span data-testid="icon-line-row">
          <MetaLine leading={<SkillIcon />} items={['skill-evals']} />
        </span>
        <span data-testid="icon-line-card">
          <MetaLine icon="md" leading={<SkillIcon />} items={['Claude']} trailing="12m" />
        </span>
        <span data-testid="icon-chip">
          <MetaChip icon={<FolderIcon />} label="ncc-1701" />
        </span>
        <span data-testid="icon-path">
          <PathBadge
            icon={<FolderIcon />}
            path="toolkit/skills/writer/"
            trailing={
              <button type="button" className={copy} aria-label="Copy path">
                <CopyIcon size="20" />
              </button>
            }
          />
        </span>
        <span data-testid="icon-kind">
          <KindBadge kind="hook" icon={<HookIcon />} />
        </span>
        <span data-testid="icon-tags">
          <TagsLine icon={<TagIcon />} tags={['global/planning']} />
        </span>
        <div className={block} data-testid="block">
          <MetaChip label="a-very-long-project-name-that-does-not-fit-either" />
          <PathBadge path="toolkit/skills/a-very-long-skill-name-that-does-not-fit/" />
        </div>
      </Stack>
    </main>
  )
}

/** Library icons draw at the slot's size whatever size they carry, and a badge in a block box stays inside it. */
export const Sizing: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <LibraryIcons />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const size = (id: string) => {
      const svg = canvas.getByTestId(id).querySelector('svg')
      if (svg === null) throw new Error(`no icon in ${id}`)
      const r = svg.getBoundingClientRect()
      return [r.width, r.height]
    }
    await expect(size('icon-line-row')).toEqual([12, 12])
    await expect(size('icon-line-card')).toEqual([16, 16])
    await expect(size('icon-chip')).toEqual([12, 12])
    await expect(size('icon-kind')).toEqual([12, 12])
    await expect(size('icon-tags')).toEqual([12, 12])
    const path = canvas.getByTestId('icon-path').querySelectorAll('svg')
    await expect(Array.from(path, (svg) => [svg.getBoundingClientRect().width, svg.getBoundingClientRect().height])).toEqual([
      [12, 12],
      [12, 12],
    ])
    // max-width: 100% keeps each badge in its 240 px block box, and the text truncates.
    const area = canvas.getByTestId('block')
    const right = area.getBoundingClientRect().right
    for (const el of Array.from(area.children)) {
      await expect(getComputedStyle(el).maxWidth).toBe('100%')
      await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(right)
    }
  },
}

const narrowBox = css({ w: 'shell.popoverSm' })

/**
 * A long meta item, chip label and path are each cut to one line and show
 * in full in a tooltip, on hover and on keyboard focus.
 */
export const LongText: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <Stack gap="8">
        <div className={narrowBox}>
          <MetaLine items={['item-skill-eval-round-with-held-out-cases-and-a-trigger-set', 'source']} trailing="4m" />
        </div>
        <div className={narrowBox}>
          <MetaChip label="chip-skill-eval-round-with-held-out-cases-and-a-trigger-set" icon={<FolderIcon />} />
        </div>
        <div className={narrowBox}>
          <PathBadge path="toolkit/skills/skill-eval-round-with-held-out-cases-and-a-trigger-set/" icon={<FolderIcon />} />
        </div>
      </Stack>
    </main>
  ),
  play: async ({ canvasElement }) => {
    for (const [selector, full] of [
      ['.meta-line__item', 'item-skill-eval-round-with-held-out-cases-and-a-trigger-set'],
      ['.meta-chip__label', 'chip-skill-eval-round-with-held-out-cases-and-a-trigger-set'],
      ['.path-badge__path', 'toolkit/skills/skill-eval-round-with-held-out-cases-and-a-trigger-set/'],
    ] as const) {
      const el = canvasElement.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      await expectCutText(el, full)
    }
  },
}

// The Inbox task chips on their opaque fill (346:327; the NCC chip 346:342, #17213a), beside a default chip.
function RaisedChips() {
  return (
    <main className={page}>
      <div className={pane}>
        <Inline gap="6">
          <span data-testid="raised-muted">
            <MetaChip size="sm" tone="muted" surface="raised" icon={<Glyph />} label="ncc-1701" />
          </span>
          <span data-testid="raised-issue">
            <MetaChip size="sm" tone="issue" surface="raised" label="NCC-28" />
          </span>
          <span data-testid="plain">
            <MetaChip size="sm" tone="issue" label="NCC-29" />
          </span>
        </Inline>
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// `surface="raised"` fills the chip with surface.raised and keeps its border, text colour and size; the default chip
// stays on surface.inset. The axe test checks the text contrast on both fills.
const raisedChipPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const swatch = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).backgroundColor
  const chipOf = (id: string) => {
    const el = canvasElement.querySelector(`[data-testid="${id}"] .meta-chip__root`)
    if (!(el instanceof HTMLElement)) throw new Error(`no chip ${id}`)
    return el
  }
  const muted = getComputedStyle(chipOf('raised-muted'))
  const issue = getComputedStyle(chipOf('raised-issue'))
  const plain = getComputedStyle(chipOf('plain'))
  await expect([muted.backgroundColor, muted.color]).toEqual([swatch('raised'), swatch('muted')])
  await expect([issue.backgroundColor, issue.color]).toEqual([swatch('raised'), swatch('issue')])
  await expect(plain.backgroundColor).toBe(swatch('inset'))
  for (const key of ['borderTopColor', 'fontSize', 'paddingLeft', 'paddingTop'] as const) {
    await expect(issue[key]).toBe(plain[key])
  }
  await expect(chipOf('raised-issue').getBoundingClientRect().height).toBe(chipOf('plain').getBoundingClientRect().height)
}

/** `surface="raised"`: the opaque Inbox task chips, such as the NCC issue chip. */
export const RaisedChipDark: StoryObj<typeof meta> = { render: () => <RaisedChips />, globals: { mode: 'dark' }, play: raisedChipPlay }
export const RaisedChipLight: StoryObj<typeof meta> = { render: () => <RaisedChips />, globals: { mode: 'light' }, play: raisedChipPlay }

// Swatches of the tokens the chip button draws in its states, so the play function compares resolved colours.
const buttonSwatches = {
  inset: css({ bg: 'surface.inset' }),
  hover: css({ bg: 'accent.faint' }),
  border: css({ bg: 'border.default' }),
  active: css({ bg: 'border.active' }),
  focus: css({ bg: 'border.focus' }),
}

// The project chip of the open artifact (Artifacts D2 403:472, 136 × 29), the trigger of the project menu (M7), beside
// a read-only MetaChip of the same size.
function ProjectChip() {
  return (
    <main className={page}>
      <div className={pane}>
        <Inline gap="6">
          <Menu
            trigger={<MetaChipButton icon={<FolderIcon />} label="skill-evals" />}
            items={[
              { value: 'open', label: 'Open project' },
              { value: 'move', label: 'Move to another project' },
            ]}
          />
          <span data-testid="read-only">
            <MetaChip icon={<FolderIcon />} label="updated 12m ago" />
          </span>
        </Inline>
      </div>
      <div hidden>
        {Object.entries(buttonSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// The D2 chip's measures: a button 29 high in Figma (the md chip is 30: 6 + the 16 px mono line + 6, and the 1 px
// border), 10 px padding at each side, the folder and chevron 12 × 12, 6 apart from the label. It tints on hover,
// draws the focus ring on keyboard focus, opens the menu on a click and draws border.active while it is open. The
// read-only MetaChip stays a span with no chevron, at the same height.
const projectChipPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const swatch = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).backgroundColor
  const body = within(canvasElement.ownerDocument.body)
  const chip = within(canvasElement).getByRole('button', { name: 'skill-evals' })
  await expect(chip.tagName).toBe('BUTTON')
  await expect(chip).toHaveAttribute('type', 'button')
  await expect(chip).toHaveAttribute('aria-haspopup', 'menu')
  const box = chip.getBoundingClientRect()
  await expect(Math.abs(box.height - 29)).toBeLessThanOrEqual(1)
  const style = getComputedStyle(chip)
  await expect([style.paddingLeft, style.paddingRight]).toEqual(['10px', '10px'])
  const icons = Array.from(chip.querySelectorAll('svg'), (svg) => svg.getBoundingClientRect())
  await expect(icons.map((r) => [r.width, r.height])).toEqual([
    [12, 12],
    [12, 12],
  ])
  const [folder, chevron] = icons
  const label = chip.querySelector('.meta-chip__label')
  if (folder === undefined || chevron === undefined || label === null) throw new Error('the chip lacks a part')
  const text = label.getBoundingClientRect()
  const border = parseFloat(style.borderLeftWidth)
  await expect(folder.left - box.left - border).toBe(10)
  await expect(box.right - border - chevron.right).toBe(10)
  await expect(text.left - folder.right).toBe(6)
  await expect(chevron.left - text.right).toBe(6)
  await expect([style.backgroundColor, style.borderTopColor]).toEqual([swatch('inset'), swatch('border')])
  const readOnly = canvasElement.querySelector('[data-testid="read-only"] .meta-chip__root')
  if (!(readOnly instanceof HTMLElement)) throw new Error('no read-only chip')
  await expect(readOnly.tagName).toBe('SPAN')
  await expect(readOnly.querySelectorAll('svg')).toHaveLength(1)
  await expect(readOnly.getBoundingClientRect().height).toBe(box.height)

  await userEvent.tab()
  await expect(chip).toHaveFocus()
  await expect([getComputedStyle(chip).outlineColor, getComputedStyle(chip).outlineStyle]).toEqual([swatch('focus'), 'solid'])
  // Simulated pointer events set no :hover; Panda's hover condition also matches [data-hover], as Button's story sets.
  chip.setAttribute('data-hover', '')
  await expect(getComputedStyle(chip).backgroundColor).toBe(swatch('hover'))
  chip.removeAttribute('data-hover')
  await expect(getComputedStyle(chip).backgroundColor).toBe(swatch('inset'))

  await userEvent.click(chip)
  const menu = await body.findByRole('menu')
  await expect(within(menu).getByRole('menuitem', { name: 'Open project' })).toBeInTheDocument()
  await expect(chip).toHaveAttribute('aria-expanded', 'true')
  await expect(getComputedStyle(chip).borderTopColor).toBe(swatch('active'))
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
  await waitFor(() => expect(chip).toHaveFocus())
}

/** `MetaChipButton`: the project chip of an open artifact, a button that opens the project menu. */
export const ChipButtonDark: StoryObj<typeof meta> = { render: () => <ProjectChip />, globals: { mode: 'dark' }, play: projectChipPlay }
export const ChipButtonLight: StoryObj<typeof meta> = { render: () => <ProjectChip />, globals: { mode: 'light' }, play: projectChipPlay }

// The path badge with its copy icon (`onCopy`, D3 457:46 with `icon/copy` 457:50), beside a badge with no copy
// icon and one with a 16 px icon (M06 435:493), so the play test compares their heights.
const copiedPath = fn<(path: string) => void>()
const copySwatches = {
  muted: css({ bg: 'fg.muted' }),
  focus: css({ bg: 'border.focus' }),
}
const ring = css({ outlineWidth: 'strong', outlineStyle: 'solid' })

function CopyBadges() {
  return (
    <main className={page}>
      <div className={pane}>
        <Stack gap="8">
          <span data-testid="copy">
            <PathBadge icon={<FolderIcon />} path="toolkit/skills/writer/" onCopy={copiedPath} />
          </span>
          <span data-testid="copy-named">
            <PathBadge icon={<FolderIcon />} path="toolkit/hooks/guard.sh" onCopy={copiedPath} copyLabel="Copy the hook's path" />
          </span>
          <span data-testid="plain">
            <PathBadge icon={<FolderIcon />} path="toolkit/skills/writer/" />
          </span>
          <span data-testid="plain-md">
            <PathBadge iconSize="md" icon={<FolderIcon />} path="toolkit/skills/writer/SKILL.md" />
          </span>
        </Stack>
      </div>
      <div hidden>
        <span data-ring className={ring} />
        {Object.entries(copySwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// The copy icon is a bare 12 × 12 button in fg.muted at the badge's end, named "Copy <path>" or `copyLabel`; the
// badge keeps the height of a badge with no copy icon (Figma's 25: 4 + the 16 px mono line + 4 and the 1 px border,
// on the grid 26). A key press draws the focus ring 2 outside the icon, inside the badge, and a click calls
// `onCopy` with the path. A badge with no `onCopy` draws no button.
const pathCopyPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).backgroundColor
  const first = (id: string) => {
    const el = canvas.getByTestId(id).firstElementChild
    if (!(el instanceof HTMLElement)) throw new Error(`nothing in ${id}`)
    return el
  }
  copiedPath.mockClear()
  const badge = first('copy')
  const plain = first('plain')
  const button = within(badge).getByRole('button', { name: 'Copy toolkit/skills/writer/' })
  await expect(button).toHaveAttribute('type', 'button')
  await expect(within(first('copy-named')).getByRole('button', { name: "Copy the hook's path" })).toBeVisible()
  await expect(within(plain).queryByRole('button')).toBeNull()
  await expect(within(first('plain-md')).queryByRole('button')).toBeNull()

  const badgeBox = badge.getBoundingClientRect()
  const buttonBox = button.getBoundingClientRect()
  const icon = button.querySelector('svg')
  if (icon === null) throw new Error('no copy icon')
  const iconBox = icon.getBoundingClientRect()
  await expect([iconBox.width, iconBox.height]).toEqual([12, 12])
  await expect([buttonBox.width, buttonBox.height]).toEqual([12, 12])
  await expect(badgeBox.height).toBe(plain.getBoundingClientRect().height)
  await expect(badgeBox.height).toBe(first('plain-md').getBoundingClientRect().height)
  const badgeStyle = getComputedStyle(badge)
  const lineHeight = Math.round(parseFloat(getComputedStyle(badge.querySelector('.path-badge__path') ?? badge).lineHeight))
  const frame = parseFloat(badgeStyle.paddingTop) + parseFloat(badgeStyle.paddingBottom) + parseFloat(badgeStyle.borderTopWidth) * 2
  await expect(badgeBox.height).toBe(lineHeight + frame)
  // The icon ends the badge at its right padding, centred in the line.
  await expect(badgeBox.right - parseFloat(badgeStyle.borderRightWidth) - parseFloat(badgeStyle.paddingRight)).toBe(buttonBox.right)
  await expect(Math.abs(buttonBox.top + buttonBox.height / 2 - (badgeBox.top + badgeBox.height / 2))).toBeLessThanOrEqual(0.5)
  const style = getComputedStyle(button)
  await expect([style.color, style.backgroundColor, style.borderTopWidth, style.paddingTop, style.paddingLeft]).toEqual([
    swatch('muted'),
    'rgba(0, 0, 0, 0)',
    '0px',
    '0px',
    '0px',
  ])

  await userEvent.tab()
  await expect(button).toHaveFocus()
  const focused = getComputedStyle(button)
  // The ring is borderWidths.strong, which Chromium draws as the reference element below computes it.
  const ringWidth = getComputedStyle(canvasElement.querySelector('[data-ring]') ?? canvasElement).outlineWidth
  await expect(parseFloat(ringWidth)).toBeGreaterThan(0)
  await expect([focused.outlineColor, focused.outlineStyle, focused.outlineWidth, focused.outlineOffset]).toEqual([swatch('focus'), 'solid', ringWidth, '2px'])
  // The ring (2 offset and its width on each side of the 12 px icon) fits inside the badge's 1 px border.
  const reach = 2 + parseFloat(ringWidth)
  await expect(buttonBox.top - reach).toBeGreaterThanOrEqual(badgeBox.top + 1)
  await expect(buttonBox.bottom + reach).toBeLessThanOrEqual(badgeBox.bottom - 1)

  await userEvent.keyboard('{Enter}')
  await expect(copiedPath).toHaveBeenCalledOnce()
  await expect(copiedPath).toHaveBeenCalledWith('toolkit/skills/writer/')
  await userEvent.click(within(first('copy-named')).getByRole('button', { name: "Copy the hook's path" }))
  await expect(copiedPath).toHaveBeenLastCalledWith('toolkit/hooks/guard.sh')
  await expect(copiedPath).toHaveBeenCalledTimes(2)
}

/** `PathBadge onCopy`: the badge ends with a bare 12 px copy icon that reports the path, and keeps its height. */
export const PathCopyDark: StoryObj<typeof meta> = { render: () => <CopyBadges />, globals: { mode: 'dark' }, play: pathCopyPlay }
export const PathCopyLight: StoryObj<typeof meta> = { render: () => <CopyBadges />, globals: { mode: 'light' }, play: pathCopyPlay }
