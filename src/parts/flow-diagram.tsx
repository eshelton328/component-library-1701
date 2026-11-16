import type { ReactNode } from 'react'
import { ArrowUpIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { chatPath, flowDiagram } from '../../styled-system/recipes'
import type { ToolkitKind } from './meta-line'

const flow = createSlotRecipeContext(flowDiagram)
const Root = flow.withProvider('ol', 'root')
const Step = flow.withContext('li', 'step')
const Card = flow.withContext('div', 'card')
const StepNumber = flow.withContext('span', 'number')
const Body = flow.withContext('div', 'body')
const Title = flow.withContext('h4', 'title')
const Description = flow.withContext('p', 'description')
const Uses = flow.withContext('ul', 'uses')
const Chip = flow.withContext('li', 'chip')
const ChipIcon = flow.withContext('span', 'chipIcon')
const Loop = flow.withContext('li', 'loop')
const Connector = flow.withContext('div', 'connector')

/** What a step uses: a file, a script (`code`) or a toolkit item. It sets the chip's text colour. */
export type FlowUseKind = 'file' | 'code' | ToolkitKind

export type FlowUse = {
  /** The name, such as `scripts/check` or `writing-reviewer`. */
  label: string
  /** What it is; defaults to `file`. */
  kind?: FlowUseKind | undefined
  /** An icon before the name, at 12 px. */
  icon?: ReactNode
}

export type FlowStep = {
  /** A unique key; defaults to the step's position. */
  id?: string | undefined
  /** The step name, such as "Run the lint". */
  title: string
  /** One or two lines on what the step does. */
  description?: string | undefined
  /** The files, scripts and toolkit items the step reads, runs or starts. */
  uses?: readonly FlowUse[] | undefined
  /** When the step repeats, until what, such as "until no fail". The card then has an amber border. */
  loop?: string | undefined
}

export type FlowDiagramProps = {
  /** The accessible name of the list, such as "How writer works". */
  label: string
  /** The steps, in order. Each is numbered from 1. */
  steps: readonly FlowStep[]
}

function present(text: string | undefined): text is string {
  return text !== undefined && text !== ''
}

/**
 * The steps of a skill or workflow, top to bottom: a numbered card for
 * each step with what it uses, an arrow to the next, and a loop marker on
 * a step that repeats. An ordered list, so a screen reader reads the
 * order; the arrows are hidden from it.
 */
export function FlowDiagram({ label, steps }: FlowDiagramProps) {
  return (
    <Root aria-label={label}>
      {steps.map((step, i) => {
        const uses = step.uses ?? []
        const loop = present(step.loop)
        return (
          <Step key={step.id ?? String(i)}>
            <Card data-loop={loop ? '' : undefined}>
              <StepNumber aria-hidden="true">{i + 1}</StepNumber>
              <Body>
                <Title>{step.title}</Title>
                {present(step.description) ? <Description>{step.description}</Description> : null}
                {uses.length > 0 || loop ? (
                  <Uses aria-label="Uses">
                    {uses.map((use, u) => (
                      <Chip key={`${String(u)}:${use.label}`} data-kind={use.kind ?? 'file'}>
                        {use.icon === undefined || use.icon === null ? null : <ChipIcon>{use.icon}</ChipIcon>}
                        {use.label}
                      </Chip>
                    ))}
                    {loop ? <Loop data-loop="">Repeats {step.loop}</Loop> : null}
                  </Uses>
                ) : null}
              </Body>
            </Card>
            {i < steps.length - 1 ? (
              <Connector aria-hidden="true">
                <ArrowUpIcon size="12" />
              </Connector>
            ) : null}
          </Step>
        )
      })}
    </Root>
  )
}

const chat = createSlotRecipeContext(chatPath)
const ChatRoot = chat.withProvider('section', 'root')
const ChatTitle = chat.withContext('h4', 'title')
const ChatDescription = chat.withContext('p', 'description')
const ChatSteps = chat.withContext('ol', 'steps')
const ChatStep = chat.withContext('li', 'step')
const Pill = chat.withContext('span', 'pill')
const PillNumber = chat.withContext('span', 'number')
const PillLabel = chat.withContext('span', 'label')
const PillNote = chat.withContext('span', 'note')
const Arrow = chat.withContext('span', 'arrow')

export type ChatPathStep = {
  /** The number of the step it keeps, such as "3", or a mark such as "→" for a step of its own. */
  number: string
  /** The step name. */
  label: string
  /** A short note after the name, such as "--form chat". */
  note?: string | undefined
}

export type ChatPathProps = {
  /** The heading, such as "A chat answer takes a shorter path"; it shows in capitals. */
  title: string
  /** A line under the heading. */
  description?: string | undefined
  /** The steps the shorter path takes, in order. */
  steps: readonly ChatPathStep[]
}

/** The shorter path a chat answer takes through a skill's steps: the steps as pills in a row, with arrows between them. */
export function ChatPath({ title, description, steps }: ChatPathProps) {
  return (
    <ChatRoot aria-label={title}>
      <ChatTitle>{title}</ChatTitle>
      {present(description) ? <ChatDescription>{description}</ChatDescription> : null}
      <ChatSteps>
        {steps.map((step, i) => (
          <ChatStep key={`${String(i)}:${step.label}`}>
            <Pill>
              <PillNumber>{step.number}</PillNumber>
              <PillLabel>{step.label}</PillLabel>
              {present(step.note) ? <PillNote>{step.note}</PillNote> : null}
            </Pill>
            {i < steps.length - 1 ? (
              <Arrow aria-hidden="true">
                <ArrowUpIcon size="12" />
              </Arrow>
            ) : null}
          </ChatStep>
        ))}
      </ChatSteps>
    </ChatRoot>
  )
}
