'use client'

import type { AppointmentListItem } from '@/types'

type Props = {
  appointment: AppointmentListItem
  reason: string
  cancelling: boolean
  onChangeReason: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function CancelAppointmentModal({
  appointment,
  reason,
  cancelling,
  onChangeReason,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-neutral-900">Cancelar reserva</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Reserva de <strong>{appointment.clientName}</strong> ({appointment.serviceName}). El motivo es obligatorio.
          Se eliminará de Google Calendar.
        </p>
        <textarea
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          placeholder="Motivo de cancelación..."
          rows={3}
          className="mt-4 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={!reason.trim() || cancelling}
            onClick={onConfirm}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
          </button>
        </div>
      </div>
    </div>
  )
}

