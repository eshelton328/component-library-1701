import { Children, Fragment, isValidElement, type ReactNode } from 'react'

/** Whether a slot renders something: `false`, `null`, `''`, an empty array, or a fragment of those, render nothing. */
export const shown = (node: ReactNode): boolean =>
  Children.toArray(node).some((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? shown(child.props.children) : child !== '',
  )
