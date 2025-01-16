import React, { HTMLAttributes, useEffect, useRef } from 'react'

type DivProps = HTMLAttributes<HTMLDivElement>

type Props = {
  onIntersectingChange?: (value: boolean) => void
  showLoader?: boolean
  offset?: string // Custom offset value for IntersectionObserver
} & DivProps

export const InfiniteScrollContainer = ({
  onIntersectingChange,
  offset = '0px', // Default offset for triggering visibility
  children,
  ...props
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let observer: IntersectionObserver | undefined

    if (ref.current) {
      observer = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          // Call the callback with the isIntersecting value
          onIntersectingChange?.(entries[0].isIntersecting)
        },
        {
          root: null, // Observe relative to the viewport
          rootMargin: offset, // Offset for triggering intersection
          threshold: 0, // Trigger as soon as the element is visible
        },
      )

      observer.observe(ref.current)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [onIntersectingChange, offset])

  return (
    <div {...props}>
      {children}
      <div ref={ref} />
    </div>
  )
}
