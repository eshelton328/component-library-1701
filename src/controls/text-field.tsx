import { Field } from '@ark-ui/react/field'
import type { ReactNode } from 'react'
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
}

function Frame({ label, helperText, error, disabled, readOnly, required, size, children }: TextFieldBaseProps & Scalar<TextFieldVariantProps> & { children: ReactNode }) {
  const invalid = error !== undefined && error !== ''
  return (
    <Root size={size} invalid={invalid} disabled={disabled} readOnly={readOnly} required={required}>
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

/** A one-line text input with a label, such as the rename field or a dialog input. */
export function TextField({ type = 'text', ...props }: TextFieldProps) {
  return (
    <Frame {...props}>
      <Input type={type} {...inputProps(props)} />
    </Frame>
  )
}

export type TextAreaProps = TextFieldBaseProps & {
  /** Grow with the text instead of showing a scroll bar. */
  autoresize?: boolean | undefined
  /** The number of lines it shows when it is empty. */
  rows?: number | undefined
}

/** A text input of more than one line with a label, such as the notes field or a prompt. */
export function TextArea({ autoresize, rows, ...props }: TextAreaProps) {
  return (
    <Frame {...props}>
      <Textarea {...inputProps(props)} {...(autoresize === undefined ? {} : { autoresize })} {...(rows === undefined ? {} : { rows })} />
    </Frame>
  )
}
