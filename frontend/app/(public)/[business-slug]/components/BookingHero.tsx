'use client'

import { useTypewriter } from '../hooks/useTypewriter'

const HERO_VIDEO_MOBILE = '/videos/InitialVideoMb_optimized.mp4'
const HERO_VIDEO_DESKTOP = '/videos/InitalVideoDk_optimized.mp4'

type BookingHeroProps = {
  name: string
  coverPhoto: string | null
  coverVideo?: string | null
  coverPhotoMobile?: string | null
  coverVideoMobile?: string | null
  primaryColor: string
  onReservar: () => void
}

export function BookingHero({ name, coverPhoto, coverVideo, coverPhotoMobile, coverVideoMobile, primaryColor, onReservar }: BookingHeroProps) {
  const displayName = useTypewriter(name)
  const videoClass = 'absolute inset-0 w-full h-full object-cover min-w-full min-h-full'

  const hasDesktopCover = coverVideo || coverPhoto
  const hasMobileCover = coverVideoMobile || coverPhotoMobile

  const mobileVideo = coverVideoMobile || coverVideo
  const mobilePhoto = coverPhotoMobile || coverPhoto
  const desktopVideo = coverVideo
  const desktopPhoto = coverPhoto

  return (
    <section className="relative h-screen min-h-screen flex flex-col items-center overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden">
        {hasDesktopCover || hasMobileCover ? (
          <>
            {/* Mobile view */}
            <div className="block md:hidden absolute inset-0">
              {mobileVideo ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={videoClass}
                  src={mobileVideo}
                  aria-hidden
                />
              ) : mobilePhoto ? (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${mobilePhoto})` }}
                  aria-hidden
                />
              ) : null}
            </div>
            {/* Desktop view */}
            <div className="hidden md:block absolute inset-0">
              {desktopVideo ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={videoClass}
                  src={desktopVideo}
                  aria-hidden
                />
              ) : desktopPhoto ? (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${desktopPhoto})` }}
                  aria-hidden
                />
              ) : null}
            </div>
          </>
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
        <div className="absolute inset-0 bg-black/70" aria-hidden />
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
