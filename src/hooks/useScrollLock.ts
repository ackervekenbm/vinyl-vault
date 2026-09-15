import { useEffect } from 'react'

/**
 * Locks the page while an overlay is open. Overflow is pinned on both the
 * <html> and <body> elements: locking body alone is unreliable on iOS, where
 * the viewport scrolls the document element. Prior inline overflow values are
 * restored on cleanup.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [active])
}