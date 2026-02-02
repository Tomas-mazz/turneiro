// TypeScript type definitions

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface ServiceListItem {
  id: string
  name: string
  price: number
  duration: number
  isActive: boolean
}

export interface AppointmentListItem {
  id: string
  startTime: string
  endTime: string
  serviceName: string
  price: number
  clientName: string
  clientPhone: string
  status: string
  paymentStatus: string
}

export interface BlockedSlotListItem {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  type: string
  reason: string | null
  createdAt: string
}
