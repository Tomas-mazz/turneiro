'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'

type Props = {
  images: string[]
  title?: string
  isDarkTheme?: boolean
}

export function FocusImageCarousel({ images, title = 'Imagen', isDarkTheme = true }: Props) {
  const safe = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images])
  const [idx, setIdx] = useState(0)

  if (safe.length === 0) return null
  const current = ((idx % safe.length) + safe.length) % safe.length
  const prev = (current - 1 + safe.length) % safe.length
  const next = (current + 1) % safe.length

  const arrowBg = isDarkTheme ? 'bg-white/10 hover:bg-white/15' : 'bg-black/10 hover:bg-black/15'
  const arrowText = isDarkTheme ? 'text-white' : 'text-neutral-900'

  return (
    <div className="relative w-full" style={{ perspective: '1200px' }}>
      <div className="relative mx-auto flex h-[220px] w-full max-w-3xl items-center justify-center overflow-hidden sm:h-[260px]">
        {/* Left (prev) */}
        {safe.length > 1 && (
          <div
            className="absolute left-0 top-1/2 w-[70%] -translate-y-1/2 transition-transform duration-300 ease-out md:w-[52%]"
            style={{ transform: 'translateY(-50%) translateZ(-140px) scale(0.92)' }}
            aria-hidden
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
              <Image
                src={safe[prev]}
                alt={`${title} (prev)`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 70vw, 480px"
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>
          </div>
        )}

        {/* Right (next) */}
        {safe.length > 1 && (
          <div
            className="absolute right-0 top-1/2 w-[70%] -translate-y-1/2 transition-transform duration-300 ease-out md:w-[52%]"
            style={{ transform: 'translateY(-50%) translateZ(-140px) scale(0.92)' }}
            aria-hidden
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
              <Image
                src={safe[next]}
                alt={`${title} (next)`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 70vw, 480px"
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>
          </div>
        )}

        {/* Center (current) */}
        <div
          className="relative z-20 w-[78%] transition-transform duration-300 ease-out md:w-[70%]"
          style={{ transform: 'translateZ(0px) scale(1.02)' }}
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black shadow-2xl">
            <Image
              src={safe[current]}
              alt={`${title} ${current + 1}`}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 640px) 78vw, 640px"
            />
          </div>
        </div>

        {/* Arrows */}
        {safe.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIdx((v) => v - 1)}
              className={`absolute left-3 z-30 grid h-10 w-10 place-items-center rounded-full ${arrowBg} ${arrowText} backdrop-blur`}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIdx((v) => v + 1)}
              className={`absolute right-3 z-30 grid h-10 w-10 place-items-center rounded-full ${arrowBg} ${arrowText} backdrop-blur`}
              aria-label="Siguiente"
            >
              ›
            </button>
          </>
        )}

        {/* Dots */}
        {safe.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5">
            {safe.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  i === current ? 'bg-white' : isDarkTheme ? 'bg-white/40 hover:bg-white/60' : 'bg-black/30 hover:bg-black/45'
                }`}
                aria-label={`Ir a imagen ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

