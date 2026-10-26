'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

/** "Nuestros trabajos": the shop's portfolio with a lightbox. Hidden when there are no photos. */
export function WorkGallery({ images, businessName }: { images: string[]; businessName: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const close = useCallback(() => setOpenIndex(null), [])
  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + images.length) % images.length)),
    [images.length]
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, close, step])

  if (images.length === 0) return null

  return (
    <section aria-labelledby="gallery-title">
      <h2 id="gallery-title" className="mb-3 text-lg font-semibold text-[color:var(--booking-fg)] md:text-center md:text-xl">
        Nuestros trabajos
      </h2>
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-6">
        {images.map((src, i) => (
          <li key={src} className="w-[42%] shrink-0 snap-start sm:w-[30%] md:w-auto">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group block aspect-square w-full overflow-hidden rounded-2xl border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] shadow-sm"
              aria-label={`Ver trabajo ${i + 1} de ${images.length}`}
            >
              <img
                src={src}
                alt={`Trabajo de ${businessName} ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Trabajos"
          >
            <motion.img
              key={images[openIndex]}
              src={images[openIndex]}
              alt={`Trabajo de ${businessName} ${openIndex + 1}`}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    step(-1)
                  }}
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    step(1)
                  }}
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm text-white">
                  {openIndex + 1} / {images.length}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
