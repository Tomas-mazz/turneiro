'use client'

import { useEffect, useState } from 'react'

export function useTypewriter(
  fullText: string,
  typingMs = 80,
  deleteMs = 50,
  pauseAfterTypeMs = 1500,
  pauseAfterDeleteMs = 600
) {
  const [displayedLength, setDisplayedLength] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!fullText) return
    const len = fullText.length
    const delay = isDeleting
      ? displayedLength > 0
        ? deleteMs
        : pauseAfterDeleteMs
      : displayedLength >= len
        ? pauseAfterTypeMs
        : typingMs

    const timeout = window.setTimeout(
      () => {
        if (!isDeleting) {
          if (displayedLength < len) {
            setDisplayedLength((n) => n + 1)
          } else {
            setIsDeleting(true)
          }
        } else {
          if (displayedLength > 0) {
            setDisplayedLength((n) => n - 1)
          } else {
            setIsDeleting(false)
          }
        }
      },
      delay
    )
    return () => clearTimeout(timeout)
  }, [fullText, displayedLength, isDeleting, typingMs, deleteMs, pauseAfterTypeMs, pauseAfterDeleteMs])

  return fullText.slice(0, displayedLength)
}
