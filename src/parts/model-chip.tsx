import { createSlotRecipeContext } from '../../styled-system/jsx'
import { modelChip } from '../../styled-system/recipes'
import { ChevronDownIcon } from '../foundations/icons'
import { RadioMenu, type RadioMenuOption } from '../controls/menu'
import { TruncatedText } from '../controls/tooltip'

const { withProvider, withContext } = createSlotRecipeContext(modelChip)
const ButtonRoot = withProvider('button', 'root')
const StaticRoot = withProvider('span', 'root')
const Chevron = withContext('span', 'chevron')
const Label = withContext('span', 'label')

/** A model the user can pick in a `ModelChip`'s menu, such as "Sonnet 5.5 · high effort". */
export type ModelChipOption = RadioMenuOption

export type ModelChipProps = {
  /** The model the chat runs, such as "Opus 5.5". */
  model: string
  /** The effort, such as "high effort". The chip shows it after the model. */
  effort?: string | undefined
  /**
   * The choices of the menu that the chip opens. Without them, the chip is
   * text and opens nothing.
   */
  options?: readonly ModelChipOption[] | undefined
  /** The value of the picked option. */
  value?: string | undefined
  /** Called with the value of the option the user picks. The caller changes `model`, `effort` and `value`. */
  onValueChange?: ((value: string) => void) | undefined
  /** Whether the menu is open. Set it with `onOpenChange` to control the menu. */
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The chip does not open its menu. */
  disabled?: boolean | undefined
  /**
   * Reach a touch target of at least 44 px (`control.xl`) 12 past each edge of the 26 px chip, for a chip a finger taps on a phone or tablet,
   * such as the chat header's (d-121). The chip draws the same. Only a chip with `options` takes it: a chip without them is text and
   * opens nothing, so a target round it would only take taps from the controls beside it.
   */
  touch?: boolean | undefined
}

/**
 * Shows the model and effort of a chat, in the chat header and the
 * composer. With `options`, the chip is a button that opens a menu to pick
 * another model; the chip reports the pick with `onValueChange`.
 */
export function ModelChip({ model, effort, options, value, onValueChange, open, onOpenChange, disabled, touch = false }: ModelChipProps) {
  const text = effort === undefined || effort === '' ? model : `${model} · ${effort}`
  if (options === undefined) {
    return (
      <StaticRoot>
        <Label>
          <TruncatedText>{text}</TruncatedText>
        </Label>
      </StaticRoot>
    )
  }
  return (
    <RadioMenu
      label="Model"
      options={options}
      value={value}
      onValueChange={onValueChange}
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        <ButtonRoot touch={touch} type="button" aria-label={`Model: ${text}`} disabled={disabled === true ? true : undefined}>
          <Chevron aria-hidden="true">
            <ChevronDownIcon size="12" />
          </Chevron>
          <Label>
            <TruncatedText>{text}</TruncatedText>
          </Label>
        </ButtonRoot>
      }
    />
  )
}
