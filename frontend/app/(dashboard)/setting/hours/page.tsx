'use client'

import { Suspense } from 'react'
import { DashboardContent } from '../DashboardContent'

export default function SettingHoursPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Cargando...</div>}>
      <DashboardContent section="hours" />
    </Suspense>
  )
}
