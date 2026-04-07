'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { panel } from '@/lib/panelTheme'

type MobileSidebarDrawerProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function MobileSidebarDrawer({ open, onClose, title = 'Menú', children }: MobileSidebarDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '-105%' }}
            animate={{ x: 0 }}
            exit={{ x: '-105%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`absolute left-0 top-0 flex h-full w-[min(100vw-2.5rem,20rem)] flex-col shadow-2xl ${panel.sidebarBg} text-white`}
          >
            <div className={`flex shrink-0 items-center justify-between gap-2 border-b ${panel.navBorder} px-4 py-3`}>
              <span className="text-sm font-semibold tracking-wide">{title}</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/85 hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
