import { Field } from '@ark-ui/react/field'
import type { KeyboardEvent, ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { textField, type TextFieldVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const { withProvider, withContext } = createSlotRecipeContext(textField)
const Root = withProvider(Field.Root, 'root')
const Label = withContext(Field.Label, 'label')
const RequiredIndicator = withContext(Field.RequiredIndicator, 'requiredIndicator')
const Input = withContext(Field.Input, 'input')
const Textarea = withContext(Field.Textarea, 'textarea')
const HelperText = withContext(Field.HelperText, 'helperText')
const ErrorText = withContext(Field.ErrorText, 'errorText')
const Control = withContext('div', 'control')
const Icon = withContext('span', 'icon')

/** The props that `TextField` and `TextArea` share. */
export type TextFieldBaseProps = {
  /** The visible label. */
  label: string
  /** The text. Set it with `onValueChange` to control the field. */
  value?: string | undefined
  defaultValue?: string | undefined
  /** Called with the text after each change. */
  onValueChange?: ((value: string) => void) | undefined
  placeholder?: string | undefined
  /** A line under the field that helps to fill it. */
  helperText?: string | undefined
  /** The error to show. When it is set, the field is invalid and the error replaces the helper text. */
  error?: string | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  /** The form field name. */
  name?: string | undefined
  /** The text size: `md` (the default) for `body`, `sm` for `bodySm`, as the Inbox prompt editor draws it. */
  textSize?: Scalar<TextFieldVariantProps>['textSize']
  /**
   * The label's text style: `small` (the default) draws it in `small` (12/16) in `fg.muted`; `label` draws it in
   * `label` (Medium 14/20) in `fg.default`, as the Artifacts Add a link form does. Both sit 6 above the control.
   */
  labelStyle?: Scalar<TextFieldVariantProps>['labelStyle']
  /**
   * An icon at the start of the field, such as `LinkIcon` in a link field. It draws at 16 px in `fg.muted`, inside the
   * border and the side padding, and the text starts 6 after it; in a `TextArea` it sits on the first line. Hidden from
   * assistive technology; the label names the field.
   */
  icon?: ReactNode
}

const hasIcon = (icon: ReactNode) => icon !== undefined && icon !== null && typeof icon !== 'boolean'

// The field's input or text area, with the `icon` over its start when there is one.
function WithIcon({ icon, multiline, children }: { icon: ReactNode; multiline: boolean; children: ReactNode }) {
  if (!hasIcon(icon)) return children
  return (
    <Control {...(multiline ? { 'data-multiline': '' } : {})}>
      <Icon aria-hidden="true">{icon}</Icon>
      {children}
    </Control>
  )
}

function Frame({ label, helperText, error, disabled, readOnly, required, size, variant, labelHidden, textSize, labelStyle, padding, valueStyle, children }: TextFieldBaseProps & Scalar<TextFieldVariantProps> & { children: ReactNode }) {
  const invalid = error !== undefined && error !== ''
  return (
    <Root size={size} variant={variant} labelHidden={labelHidden} textSize={textSize} labelStyle={labelStyle} padding={padding} valueStyle={valueStyle} invalid={invalid} disabled={disabled} readOnly={readOnly} required={required}>
      <Label>
        {label}
        <RequiredIndicator>*</RequiredIndicator>
      </Label>
      {children}
      {invalid ? <ErrorText>{error}</ErrorText> : helperText === undefined ? null : <HelperText>{helperText}</HelperText>}
    </Root>
  )
}

const inputProps = ({ value, defaultValue, onValueChange, placeholder, name }: TextFieldBaseProps) => ({
  ...(value === undefined ? {} : { value }),
  ...(value === undefined && defaultValue !== undefined ? { defaultValue } : {}),
  ...(placeholder === undefined ? {} : { placeholder }),
  ...(name === undefined ? {} : { name }),
  onChange: (e: { currentTarget: { value: string } }) => {
    onValueChange?.(e.currentTarget.value)
  },
})

export type TextFieldProps = TextFieldBaseProps &
  Scalar<TextFieldVariantProps> & {
    /** `text` when not set. */
    type?: 'text' | 'email' | 'url' | 'password' | 'tel' | undefined
  }

/**
 * A one-line text input with a label, such as the rename field or a dialog input. `size` sets the height from the
 * `control` tokens: `sm` 28, `md` 32 (the default), `lg` 36, `form` 40 (the fields of a dialog form, such as Add a
 * link) and `xl` 44. `padding` sets the sides: `default` 10, `form` 12. `textSize="sm"` sets the text in `bodySm`;
 * `valueStyle="mono"` sets it in `mono` (12/16), for a link or a path, over `textSize`. `labelStyle` sets the label's
 * style.
 */
export function TextField({ type = 'text', ...props }: TextFieldProps) {
  return (
    <Frame {...props}>
      <WithIcon icon={props.icon} multiline={false}>
        <Input type={type} {...inputProps(props)} {...(hasIcon(props.icon) ? { 'data-icon': '' } : {})} />
      </WithIcon>
    </Frame>
  )
}

export type TextAreaProps = TextFieldBaseProps & {
  /** Grow with the text instead of showing a scroll bar. */
  autoresize?: boolean | undefined
  /** The number of lines it shows when it is empty. */
  rows?: number | undefined
  /**
   * `field` (the default) draws the field's own fill and border; `bare`
   * draws none, for a text area inside a box that draws them, such as the
   * composer.
   */
  variant?: 'field' | 'bare' | undefined
  /** Hide the label from view. Screen readers still read it as the name. */
  labelHidden?: boolean | undefined
  /** Called on each key press in the text area, such as Enter to send. */
  onKeyDown?: ((event: KeyboardEvent<HTMLTextAreaElement>) => void) | undefined
}

/**
 * A text input of more than one line with a label, such as the notes field or a prompt. `textSize="sm"` sets the
 * text in `bodySm`, as the Inbox prompt editor does.
 */
export function TextArea({ autoresize, rows, onKeyDown, ...props }: TextAreaProps) {
  return (
    <Frame {...props}>
      <WithIcon icon={props.icon} multiline>
        <Textarea
          {...inputProps(props)}
          {...(autoresize === undefined ? {} : { autoresize })}
          {...(rows === undefined ? {} : { rows })}
          {...(onKeyDown === undefined ? {} : { onKeyDown })}
          {...(hasIcon(props.icon) ? { 'data-icon': '' } : {})}
        />
      </WithIcon>
    </Frame>
  )
}
