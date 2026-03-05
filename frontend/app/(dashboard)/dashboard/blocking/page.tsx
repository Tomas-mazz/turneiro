'use client'

import { Suspense } from 'react'
import { DashboardContent } from '../page'

export default function DashboardBlockingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Cargando...</div>}>
      <DashboardContent section="blocking" />
    </Suspense>
  )
}

