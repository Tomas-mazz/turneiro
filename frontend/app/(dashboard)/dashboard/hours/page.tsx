'use client'

import { Suspense } from 'react'
import { DashboardContent } from '../page'

export default function DashboardHoursPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Cargando...</div>}>
      <DashboardContent section="hours" />
    </Suspense>
  )
}

