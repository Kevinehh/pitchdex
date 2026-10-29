import { useCallback, useEffect, useRef } from "react"

/**
 * Returns a function that runs `callback` only after calls stop for `delayMs`.
 * Used for search boxes that update the URL or start a request.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 300,
) {
  const latest = useRef(callback)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    latest.current = callback
  })

  useEffect(() => () => clearTimeout(timer.current), [])

  return useCallback(
    (...args: Args) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => latest.current(...args), delayMs)
    },
    [delayMs],
  )
}
