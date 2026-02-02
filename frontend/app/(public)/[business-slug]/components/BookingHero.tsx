'use client'

import { useEffect, useState } from 'react'

const HERO_VIDEO_MOBILE = '/videos/InitialVideoMb_optimized.mp4'
const HERO_VIDEO_DESKTOP = '/videos/InitalVideoDk_optimized.mp4'

function useTypewriter(
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

type BookingHeroProps = {
  name: string
  coverPhoto: string | null
  coverVideo?: string | null
  primaryColor: string
  onReservar: () => void
}

export function BookingHero({ name, coverPhoto, coverVideo, primaryColor, onReservar }: BookingHeroProps) {
  const displayName = useTypewriter(name)
  const videoClass = 'absolute inset-0 w-full h-full object-cover min-w-full min-h-full'

  return (
    <section className="relative h-screen min-h-screen flex flex-col items-center overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden">
        {coverVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className={videoClass}
            src={coverVideo}
            aria-hidden
          />
        ) : coverPhoto ? (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${coverPhoto})` }}
            aria-hidden
          />
        ) : (
          <>
            <video
              autoPlay
              muted
              loop
              playsInline
              className={`${videoClass} block md:hidden`}
              src={HERO_VIDEO_MOBILE}
              aria-hidden
            />
            <video
              autoPlay
              muted
              loop
              playsInline
              className={`${videoClass} hidden md:block`}
              src={HERO_VIDEO_DESKTOP}
              aria-hidden
            />
          </>
        )}
        <div className="absolute inset-0 bg-black/40" aria-hidden />
      </div>

      {/* Title: centered in top half (same distance from top and from button) */}
      <div className="absolute top-0 left-0 right-0 h-1/2 z-10 flex items-center justify-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center drop-shadow-md px-4">
          {displayName}
          <span className="animate-pulse">|</span>
        </h1>
      </div>

      {/* Button: centered in viewport */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <button
          type="button"
          onClick={onReservar}
          className="min-w-[200px] h-14 px-8 py-3 rounded-lg font-semibold text-lg bg-white text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent shadow-lg transition hover:scale-105 active:scale-100"
        >
          Reservar
        </button>
      </div>
    </section>
  )
}
