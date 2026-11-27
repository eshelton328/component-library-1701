import { useEffect, useRef } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { pager } from '../../styled-system/recipes'
import { Button } from '../controls/button'
import { SelectField } from '../controls/select-field'
import { ChevronLeftIcon, ChevronRightIcon } from '../foundations/icons'

const { withProvider, withContext } = createSlotRecipeContext(pager)
const Root = withProvider('div', 'root')
const Range = withContext('span', 'range')
const Nav = withContext('div', 'nav')
const Current = withContext('span', 'current')
const PageName = withContext('span', 'pageName')
const Rows = withContext('div', 'rows')

/** The words of a Pager, for another language. Each one left out keeps its English default. */
export type PagerLabels = {
  /** The name of the pager's group; "Pages" by default. */
  group?: string | undefined
  /** The name of the previous button; "Previous page" by default. */
  previous?: string | undefined
  /** The name of the next button; "Next page" by default. */
  next?: string | undefined
  /** The name of the Rows picker; "Rows" by default. */
  rows?: string | undefined
  /** The range text; "1–10 of 18" by default, and "0 of 0" when `total` is 0. */
  range?: ((from: number, to: number, total: number) => string) | undefined
  /** The name of the current page for assistive technology; "Page 1 of 2" by default. */
  page?: ((page: number, pages: number) => string) | undefined
  /** The text of a choice in the Rows picker; "10 rows" by default. */
  rowsOption?: ((size: number) => string) | undefined
}

export type PagerProps = {
  /** The page shown, from 1. A value outside 1 to the last page shows the nearest end. */
  page: number
  /** The rows on a page. */
  pageSize: number
  /** The rows in all pages. With 0, the range is "0 of 0" and both buttons are off. */
  total: number
  /** Called with the page that Previous or Next asks for. The caller sets `page`. */
  onPageChange?: ((page: number) => void) | undefined
  /** The choices of the Rows picker, such as `[10, 25, 50]`. Without it, or on a phone, the pager has no picker. */
  pageSizes?: readonly number[] | undefined
  /** Called with the rows per page picked in the Rows picker. The caller sets `pageSize` and, if it wants, `page`. */
  onPageSizeChange?: ((pageSize: number) => void) | undefined
  /**
   * `desktop` (the default) draws 28 px buttons and a 28 px picker, with the
   * range at the start, the buttons in the middle and the picker at the end.
   * `tablet` draws the same row with 36 px buttons and picker, each button
   * with a touch target of 44 or more. `phone` draws the tablet's buttons at
   * the end of the row, after the range, and no picker.
   */
  size?: 'desktop' | 'tablet' | 'phone' | undefined
  labels?: PagerLabels | undefined
}

const defaultRange = (from: number, to: number, total: number) => (total === 0 ? '0 of 0' : `${String(from)}–${String(to)} of ${String(total)}`)
const defaultPage = (page: number, pages: number) => `Page ${String(page)} of ${String(pages)}`
const defaultRowsOption = (size: number) => `${String(size)} rows`

/**
 * The pager under a table or list: the range of rows shown ("1–10 of 18"),
 * Previous and Next around the current page number (`aria-current="page"`),
 * and an optional Rows picker. It is controlled: it shows `page` and reports
 * a press through `onPageChange`. Previous is off on the first page and Next
 * on the last. When a press reaches an end, the focus moves to the other
 * button, so it never stays on a button that turns off.
 */
export function Pager({ page, pageSize, total, onPageChange, pageSizes, onPageSizeChange, size = 'desktop', labels }: PagerProps) {
  const previousRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const pages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const current = Math.min(Math.max(1, page), pages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)
  const touch = size !== 'desktop'
  const button = touch ? ({ size: 'lg', touch: true } as const) : ({ size: 'sm' } as const)
  const rowsOption = labels?.rowsOption ?? defaultRowsOption
  // When a pager button had the focus at the press, focus the enabled button once the caller shows an end page:
  // from the body (where WebKit moves the focus of a button that turns off) or a pager button, never elsewhere.
  const focusAfter = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    const target = focusAfter.current
    if (target === null || target.disabled) return
    focusAfter.current = null
    const active = document.activeElement
    if (active === null || active === document.body || active === previousRef.current || active === nextRef.current) target.focus()
  }, [current])
  const go = (next: number) => {
    const active = document.activeElement
    const owned = active !== null && (active === previousRef.current || active === nextRef.current)
    focusAfter.current = !owned ? null : next <= 1 ? nextRef.current : next >= pages ? previousRef.current : null
    onPageChange?.(next)
  }
  return (
    <Root size={size} role="group" aria-label={labels?.group ?? 'Pages'}>
      <Range>{(labels?.range ?? defaultRange)(from, to, total)}</Range>
      <Nav>
        <Button ref={previousRef} variant="secondary" iconOnly {...button} aria-label={labels?.previous ?? 'Previous page'} disabled={current <= 1} onClick={() => { go(current - 1) }}>
          <ChevronLeftIcon />
        </Button>
        <Current aria-current="page">
          <PageName>{(labels?.page ?? defaultPage)(current, pages)}</PageName>
          <span aria-hidden="true">{current}</span>
        </Current>
        <Button ref={nextRef} variant="secondary" iconOnly {...button} aria-label={labels?.next ?? 'Next page'} disabled={current >= pages} onClick={() => { go(current + 1) }}>
          <ChevronRightIcon />
        </Button>
      </Nav>
      {pageSizes === undefined || pageSizes.length === 0 || size === 'phone' ? null : (
        <Rows>
          <SelectField
            label={labels?.rows ?? 'Rows'}
            labelHidden
            size={touch ? 'lg' : 'sm'}
            options={pageSizes.map((n) => ({ value: String(n), label: rowsOption(n) }))}
            value={String(pageSize)}
            onValueChange={(value) => { onPageSizeChange?.(Number(value)) }}
          />
        </Rows>
      )}
    </Root>
  )
}
