import { useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { scriptExplanation } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(scriptExplanation)
const Root = withProvider('div', 'root')
const Card = withContext('section', 'card')
const Label = withContext('p', 'label')
const Summary = withContext('p', 'summary')
const Facts = withContext('dl', 'facts')
const FactKey = withContext('dt', 'factKey')
const FactValue = withContext('dd', 'factValue')
const Steps = withContext('ol', 'steps')
const Step = withContext('li', 'step')
const StepNumber = withContext('span', 'stepNumber')
const StepText = withContext('span', 'stepText')
const LineButton = withContext('button', 'lineLink')
const LineLabel = withContext('span', 'lineLink')
const Note = withContext('p', 'note')

/** A fact about the script, such as its input, output or exit codes. */
export type ScriptFact = { key: string; value: string }

/** One step of the walkthrough. */
export type ScriptStep = {
  text: ReactNode
  /** The line of the script that the step explains. */
  line?: number | undefined
}

export type ScriptExplanationProps = {
  /** What the script does, in a sentence or two. */
  summary: string
  /** Rows under the summary, such as In, Out and Exit. */
  facts?: readonly ScriptFact[] | undefined
  steps: readonly ScriptStep[]
  /** A note at the end, such as who wrote the explanation. */
  note?: string | undefined
  /** The label of the summary card. Defaults to "Overview". */
  summaryLabel?: string | undefined
  /** The label of the steps. Defaults to "Walkthrough". */
  stepsLabel?: string | undefined
  /** Called with a step's line when the user presses its line link. Without it, the line is text. */
  onLineSelect?: ((line: number) => void) | undefined
}

/**
 * The plain-language explanation of a script, as in the Toolkit file
 * viewer's Explain view: a summary card with optional facts, then
 * numbered steps, each with a link to the line it explains.
 */
export function ScriptExplanation({ summary, facts, steps, note, summaryLabel = 'Overview', stepsLabel = 'Walkthrough', onLineSelect }: ScriptExplanationProps) {
  const summaryId = useId()
  const stepsId = useId()
  return (
    <Root>
      <Card aria-labelledby={summaryId}>
        <Label id={summaryId}>{summaryLabel}</Label>
        <Summary>{summary}</Summary>
        {facts === undefined || facts.length === 0 ? null : (
          <Facts>
            {facts.map((fact) => (
              <FactRow key={fact.key} fact={fact} />
            ))}
          </Facts>
        )}
      </Card>
      <Label id={stepsId}>{stepsLabel}</Label>
      <Steps aria-labelledby={stepsId}>
        {steps.map((step, i) => (
          <Step key={String(i)}>
            <StepNumber aria-hidden="true">{i + 1}</StepNumber>
            <StepText>{step.text}</StepText>
            {step.line === undefined ? null : <LineLink line={step.line} onLineSelect={onLineSelect} />}
          </Step>
        ))}
      </Steps>
      {note === undefined ? null : <Note>{note}</Note>}
    </Root>
  )
}

function FactRow({ fact }: { fact: ScriptFact }) {
  return (
    <>
      <FactKey>{fact.key}</FactKey>
      <FactValue>{fact.value}</FactValue>
    </>
  )
}

function LineLink({ line, onLineSelect }: { line: number; onLineSelect: ((line: number) => void) | undefined }) {
  const text = `line ${String(line)}`
  if (onLineSelect === undefined) return <LineLabel>{text}</LineLabel>
  return (
    <LineButton
      type="button"
      onClick={() => {
        onLineSelect(line)
      }}
    >
      {text}
    </LineButton>
  )
}
