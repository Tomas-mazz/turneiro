'use client'

type BusinessHeroProps = {
  name: string
  description: string | null
  logo?: string | null
  coverPhoto: string | null
  coverVideo?: string | null
  coverPhotoMobile?: string | null
  coverVideoMobile?: string | null
}

const HERO_VIDEO_MOBILE = '/videos/InitialVideoMb_optimized.mp4'
const HERO_VIDEO_DESKTOP = '/videos/InitalVideoDk_optimized.mp4'

/** Cover banner at the top of the one-page booking: cover media, logo, name and description. */
export function BusinessHero({
  name,
  description,
  logo,
  coverPhoto,
  coverVideo,
  coverPhotoMobile,
  coverVideoMobile,
}: BusinessHeroProps) {
  const hasCover = !!(coverVideo || coverPhoto || coverVideoMobile || coverPhotoMobile)
  const mobileVideo = hasCover ? coverVideoMobile || coverVideo : HERO_VIDEO_MOBILE
  const mobilePhoto = coverPhotoMobile || coverPhoto
  const desktopVideo = hasCover ? coverVideo : HERO_VIDEO_DESKTOP
  const mediaClass = 'absolute inset-0 h-full w-full object-cover'

  const renderMedia = (video: string | null | undefined, photo: string | null | undefined) =>
    video ? (
      <video autoPlay muted loop playsInline className={mediaClass} src={video} aria-hidden />
    ) : photo ? (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${photo})` }}
        aria-hidden
      />
    ) : null

  return (
    <section className="relative w-full overflow-hidden rounded-b-3xl md:rounded-b-[2.5rem]">
      <div className="absolute inset-0 md:hidden">{renderMedia(mobileVideo, mobilePhoto)}</div>
      <div className="absolute inset-0 hidden md:block">{renderMedia(desktopVideo, coverPhoto)}</div>
      {/* Darker at the top (header) and bottom (title), lighter in the middle so the photo shows. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/80" aria-hidden />

      <div className="relative mx-auto flex min-h-[300px] w-full max-w-4xl flex-col justify-end gap-3 px-4 pb-8 pt-24 md:min-h-[400px] md:px-6 md:pb-10 lg:max-w-6xl lg:px-8">
        {logo && (
          <img
            src={logo}
            alt=""
            className="h-16 w-16 rounded-2xl border border-white/20 object-cover shadow-lg md:h-20 md:w-20"
          />
        )}
        <h1 className="text-3xl font-bold text-white drop-shadow-md md:text-5xl">{name}</h1>
        {description?.trim() && (
          <p className="max-w-2xl text-sm text-white/85 md:text-base">{description.trim()}</p>
        )}
      </div>
    </section>
  )
}
