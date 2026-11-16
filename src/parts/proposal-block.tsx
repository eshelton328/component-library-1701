import { Children, Fragment, isValidElement, useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { proposalBlock, proposalSection, type ProposalBlockVariantProps } from '../../styled-system/recipes'
import { Button, type ButtonProps } from '../controls/button'
import type { Scalar } from '../controls/scalar'

const block = createSlotRecipeContext(proposalBlock)
const Root = block.withProvider('div', 'root')
const Label = block.withContext('p', 'label')
const Title = block.withContext('p', 'title')
const Body = block.withContext('div', 'body')
const Note = block.withContext('p', 'note')
const Actions = block.withContext('div', 'actions')

const section = createSlotRecipeContext(proposalSection)
const SectionRoot = section.withProvider('div', 'root')
const SectionLabel = section.withContext('p', 'label')
const SectionText = section.withContext('p', 'text')
const Lines = section.withContext('ul', 'lines')
const Line = section.withContext('li', 'line')
const Sign = section.withContext('span', 'sign')
const Removed = section.withContext('del', 'lineText')
const Added = section.withContext('ins', 'lineText')
const CommandRoot = section.withProvider('pre', 'command')

// Whether the content renders anything. React renders nothing for null,
// undefined, booleans and the empty string, nor for an array or a fragment
// that holds only those.
function present(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (typeof child === 'string') return child !== ''
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) return present(child.props.children)
    return true
  })
}

/** The tone of a proposal block: `update`, `remove` or `approval`. */
export type ProposalTone = NonNullable<ProposalBlockProps['tone']>

/** One button of a proposal block. */
export type ProposalAction = {
  /** The button text, such as "Apply", "Keep it" or "Deny". */
  label: string
  /** Called when the button is pressed. The caller makes the change; the block only reports. */
  onClick: () => void
  /**
   * The button variant: `primary` for the action that accepts, `dangerText` for one that removes or denies.
   * Defaults to `secondary`. `dangerSoft` is a tint on a tint here, and its label falls under 4.5:1 in light mode.
   */
  variant?: ButtonProps['variant']
  /** An icon from the icon set before the label, such as `<CheckIcon size="14" />`. */
  icon?: ReactNode
  /** Turns the button off, for example while the change is applied. */
  disabled?: boolean | undefined
}

export type ProposalBlockProps = Scalar<ProposalBlockVariantProps> & {
  /** The label at the top, such as "Proposed · Update this task". It shows in capitals and names the block. */
  label: string
  /** What the proposal is about, such as the task it removes or "Codex wants to run a command". */
  title?: string | undefined
  /** The proposal's content: `ProposalDiff`, `ProposalSection` or `ProposalCommand`. */
  children?: ReactNode
  /** A line under the content, such as what happens after the change. */
  note?: string | undefined
  /** The buttons, in order, such as Apply, Discard and Edit first. */
  actions: readonly ProposalAction[]
}

/**
 * The block where an agent proposes a change and the user approves or
 * denies it. `tone` is `update` (the default, violet), `remove` (red; the
 * title is struck through) or `approval` (amber, a request to run a
 * command). Each button calls its own `onClick`; the block changes nothing
 * itself (d-068, d-069).
 */
export function ProposalBlock({ tone, label, title, children, note, actions }: ProposalBlockProps) {
  const labelId = useId()
  return (
    <Root tone={tone} role="group" aria-labelledby={labelId}>
      <Label id={labelId}>{label}</Label>
      {title === undefined || title === '' ? null : <Title>{title}</Title>}
      {present(children) ? <Body>{children}</Body> : null}
      {note === undefined || note === '' ? null : <Note>{note}</Note>}
      {actions.length === 0 ? null : (
        <Actions>
          {actions.map((action, index) => (
            <Button
              // The labels of one block differ; the index keeps a repeated label unique.
              key={`${String(index)}:${action.label}`}
              size="sm"
              variant={action.variant ?? 'secondary'}
              disabled={action.disabled === true ? true : undefined}
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </Actions>
      )}
    </Root>
  )
}

export type ProposalSectionProps = {
  /** The section label, such as "Reason". It shows in capitals. */
  label: string
  /** The section text. */
  children: ReactNode
}

/** A labelled section of a proposal block, such as the reason for a removal. */
export function ProposalSection({ label, children }: ProposalSectionProps) {
  return (
    <SectionRoot>
      <SectionLabel>{label}</SectionLabel>
      <SectionText>{children}</SectionText>
    </SectionRoot>
  )
}

/** One line of a proposed diff. */
export type ProposalDiffLine = {
  /** Whether the line is taken out or put in. */
  change: 'removed' | 'added'
  /** The text of the line. */
  text: string
}

export type ProposalDiffProps = {
  /** The label above the lines, such as "Suggested prompt". It shows in capitals. */
  label?: string | undefined
  /** The lines, in order. A removed line is struck through; an added line is green. */
  lines: readonly ProposalDiffLine[]
}

/** The lines a proposal takes out and puts in, as `<del>` and `<ins>`. */
export function ProposalDiff({ label, lines }: ProposalDiffProps) {
  return (
    <SectionRoot>
      {label === undefined || label === '' ? null : <SectionLabel>{label}</SectionLabel>}
      <Lines>
        {lines.map((line, index) => (
          <Line key={`${String(index)}:${line.change}`} data-change={line.change}>
            <Sign aria-hidden="true">{line.change === 'removed' ? '−' : '+'}</Sign>
            {line.change === 'removed' ? <Removed>{line.text}</Removed> : <Added>{line.text}</Added>}
          </Line>
        ))}
      </Lines>
    </SectionRoot>
  )
}

export type ProposalCommandProps = {
  /** The command, such as "git mv notes/research/old.md archive/". */
  children: string
}

/** The command an approval would run, in a recessed box. */
export function ProposalCommand({ children }: ProposalCommandProps) {
  return (
    <CommandRoot>
      <code>{children}</code>
    </CommandRoot>
  )
}
