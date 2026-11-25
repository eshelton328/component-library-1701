import { useLayoutEffect, useRef, useState } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { imageFigure } from '../../styled-system/recipes'
import { Dialog } from '../controls/dialog'
import { Skeleton, SkeletonGroup } from './skeleton'

const { withProvider, withContext } = createSlotRecipeContext(imageFigure)
const Root = withProvider('figure', 'root')
const Trigger = withContext('button', 'trigger')
const Image = withContext('img', 'image')
const Placeholder = withContext('div', 'placeholder')
const Message = withContext('p', 'message')
const Zoom = withContext('img', 'zoom')

/** Where an image is: `loading` until its bytes load, `ready` when shown, `error` when it does not load. */
export type ImageState = 'loading' | 'ready' | 'error'

export type ImageFigureProps = {
  /** The URL the caller resolved, such as the app's own image route. The part loads only this URL. */
  src: string
  /** The text alternative. It names the picture, the button that opens it and the dialog, and shows when it does not load. */
  alt: string
  /** Called when the state changes to `ready` or `error`. */
  onStateChange?: ((state: ImageState) => void) | undefined
}

/**
 * An image in a Markdown message: the picture at its own size up to the
 * column's width, as a button that opens it in a dialog. While it loads, a
 * wide skeleton holds its place; when it does not load, a line says so with
 * its text alternative. The part loads only `src`, so the caller decides
 * which URLs may load (d-068).
 */
export function ImageFigure({ src, alt, onStateChange }: ImageFigureProps) {
  const [seen, setSeen] = useState<{ src: string; state: ImageState }>({ src, state: 'loading' })
  const [open, setOpen] = useState(false)
  const image = useRef<HTMLImageElement>(null)
  const state: ImageState = seen.src === src ? seen.state : 'loading'
  const name = alt.trim()
  // Each src settles once: a load event and the check after mount may both see it.
  const settled = useRef<string | undefined>(undefined)
  const settle = (next: ImageState) => {
    if (settled.current === src) return
    settled.current = src
    setSeen({ src, state: next })
    onStateChange?.(next)
  }
  // A picture that loaded or failed before React added its handlers (a server render that hydrates) fires no event,
  // and an empty src (which React leaves out) loads nothing; both are complete by now, so read the result here.
  useLayoutEffect(() => {
    const img = image.current
    if (img === null || !img.complete) return
    settle(img.naturalWidth > 0 ? 'ready' : 'error')
  })
  if (state === 'error') {
    return (
      <Root data-state={state}>
        <Message role="status">{name === '' ? 'This image did not load.' : `This image did not load: ${name}`}</Message>
      </Root>
    )
  }
  return (
    <Root data-state={state}>
      <Trigger
        type="button"
        data-state={state}
        disabled={state !== 'ready'}
        aria-label={name === '' ? 'Open the image' : `Open the image: ${name}`}
        onClick={() => {
          setOpen(true)
        }}
      >
        {state === 'loading' ? (
          <Placeholder>
            <SkeletonGroup label="Loading the image">
              <Skeleton shape="block" ratio="wide" />
            </SkeletonGroup>
          </Placeholder>
        ) : null}
        <Image
          key={src}
          ref={image}
          src={src}
          alt={alt}
          data-state={state}
          decoding="async"
          onLoad={() => {
            settle('ready')
          }}
          onError={() => {
            settle('error')
          }}
        />
      </Trigger>
      <Dialog title={name === '' ? 'Image' : name} size="wide" closeButton open={open} onOpenChange={setOpen}>
        <Zoom src={src} alt={alt} />
      </Dialog>
    </Root>
  )
}
